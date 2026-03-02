/**
 * Terrain Wave Effect — Endless Runner style
 * Camera stays safely above terrain crests while flying forward,
 * massive terrain tiles recycle seamlessly,
 * fog hides the horizon. Shapes erupt from the surface on bass.
 */

import * as THREE from 'three';

let group = null;
let terrainTiles = [];
let terrainGeos = [];
let scene = null;
let cameraRef = null;
let isActive = false;
let activateTime = 0;
let savedFog = null;

let eruptions = [];
const MAX_ERUPTIONS = 18;
const ERUPTION_COOLDOWN = 0.24;
let lastEruptionTime = 0;

// Terrain: wide + long + many tiles = no visible edges
const TILE_COUNT = 4;
const TILE_WIDTH = 400;
const TILE_LENGTH = 150;
const SEG_X = 80;
const SEG_Z = 60;

// Camera: predictive terrain-following with hard anti-clip floor
const CAM_SPEED = 58;
const CAM_CLEARANCE = 18;
const EMERGENCY_CLEARANCE = 12;
const CAM_MIN_Y = 10;
const CAM_LOOK_AHEAD = 90;
const CAM_LOOK_AHEAD_HEIGHT = 6;
const WAVE_HEIGHT_SCALE = 1.2;
const UPWARD_FOLLOW = 16;
const DOWNWARD_FOLLOW = 4;
const CAMERA_SAMPLE_X = [-40, -24, -12, 0, 12, 24, 40];
const CAMERA_SAMPLE_Z = [6, 0, -12, -24, -36, -48, -64, -80, -96];
const EMERGENCY_SAMPLE_X = [-24, -12, 0, 12, 24];
const EMERGENCY_SAMPLE_Z = [6, 0, -8, -16, -24];

let camZ = 0;
let camY = CAM_MIN_Y;
let savedCamPos = null;

function waveHeight(wx, wz, time, bassNorm) {
  const amp = 1.8 + bassNorm * 2.2;
  return (
    Math.sin(wx * 0.04 + time * 1.2) * amp
       + Math.sin(wz * 0.03 + time * 0.7) * amp * 0.7
       + Math.cos((wx * 0.07 + wz * 0.05) + time * 2.0) * amp * 0.3
  ) * WAVE_HEIGHT_SCALE;
}

function sampleMaxHeight(wx, wz, time, bassNorm, xOffsets, zOffsets) {
  let maxHeight = -Infinity;
  for (const xOff of xOffsets) {
    for (const zOff of zOffsets) {
      const h = waveHeight(wx + xOff, wz + zOff, time, bassNorm);
      if (h > maxHeight) maxHeight = h;
    }
  }
  return maxHeight;
}

function getRequiredCameraHeight(wx, wz, time, bassNorm) {
  // Wide predictive sampling so incoming peaks don't surprise the camera.
  const maxHeight = sampleMaxHeight(wx, wz, time, bassNorm, CAMERA_SAMPLE_X, CAMERA_SAMPLE_Z);
  return Math.max(CAM_MIN_Y, maxHeight + CAM_CLEARANCE);
}

function getEmergencyFloorHeight(wx, wz, time, bassNorm) {
  // Local near-camera floor used as a last resort anti-clip guard.
  const maxHeight = sampleMaxHeight(wx, wz, time, bassNorm, EMERGENCY_SAMPLE_X, EMERGENCY_SAMPLE_Z);
  return maxHeight + EMERGENCY_CLEARANCE;
}

export function init(sceneRef, camera, resources) {
  scene = sceneRef;
  cameraRef = camera;
  group = new THREE.Group();
  group.visible = false;

  for (let t = 0; t < TILE_COUNT; t++) {
    const geo = new THREE.PlaneGeometry(TILE_WIDTH, TILE_LENGTH, SEG_X, SEG_Z);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x6600cc,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = -t * TILE_LENGTH;
    terrainTiles.push(mesh);
    terrainGeos.push(geo);
    group.add(mesh);
  }

  // Ambient light so eruption shapes are visible
  const light = new THREE.PointLight(0xaa55ff, 5, 200);
  light.position.set(0, 30, 0);
  group.add(light);
}

function updateTerrain(time, bassNorm) {
  for (let t = 0; t < TILE_COUNT; t++) {
    const geo = terrainGeos[t];
    const tile = terrainTiles[t];
    const pos = geo.attributes.position;
    const tz = tile.position.z;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      // Plane is rotated around X; worldZ = tileZ - localY.
      const localY = pos.getY(i);
      pos.setZ(i, waveHeight(lx, tz - localY, time, bassNorm));
    }
    pos.needsUpdate = true;
  }
}

function recycleTiles() {
  for (const tile of terrainTiles) {
    // Tile's nearest-to-start edge (most negative Z = its front)
    const tileFront = tile.position.z - TILE_LENGTH / 2;
    // If entire tile is behind the camera (more positive Z), recycle it ahead
    if (tileFront > camZ + 20) {
      // Find the furthest-ahead tile (most negative Z)
      let minZ = Infinity;
      for (const other of terrainTiles) {
        if (other !== tile) minZ = Math.min(minZ, other.position.z);
      }
      tile.position.z = minZ - TILE_LENGTH;
    }
  }
}

function getForwardSpawnAnchor() {
  // Spawn in camera-forward world space so "distance" matches what the viewer sees.
  const forward = new THREE.Vector3();
  cameraRef.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
  forward.normalize();

  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  // Keep eruptions visible and within terrain coverage ahead of the camera.
  const distance = 170 + Math.random() * 150;
  const lateralLimit = Math.min(TILE_WIDTH * 0.42, distance * 0.32);
  const lateral = (Math.random() - 0.5) * (lateralLimit * 2);

  const x = cameraRef.position.x + forward.x * distance + right.x * lateral;
  const z = cameraRef.position.z + forward.z * distance + right.z * lateral;

  return {
    // Clamp to terrain footprint so spawns land on visible wave mesh.
    x: THREE.MathUtils.clamp(x, -TILE_WIDTH * 0.46, TILE_WIDTH * 0.46),
    z,
  };
}

function spawnEruption(songTime, time, bassNorm, clusterAnchor = null) {
  if (eruptions.length >= MAX_ERUPTIONS) {
    const old = eruptions.shift();
    group.remove(old.group);
    disposeObj(old.group);
  }

  const eG = new THREE.Group();
  const anchor = clusterAnchor || getForwardSpawnAnchor();
  const ex = THREE.MathUtils.clamp(anchor.x + (Math.random() - 0.5) * 22, -TILE_WIDTH * 0.46, TILE_WIDTH * 0.46);
  const ez = anchor.z + (Math.random() - 0.5) * 34;
  const surfY = waveHeight(ex, ez, time, bassNorm);
  eG.position.set(ex, surfY, ez);

  const type = Math.floor(Math.random() * 3);
  let geo;
  if (type === 0) geo = new THREE.ConeGeometry(1.5, 6, 5);
  else if (type === 1) geo = new THREE.BoxGeometry(2.5, 5, 2.5);
  else geo = new THREE.OctahedronGeometry(2.5);

  const hue = Math.random();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue, 0.9, 0.55),
    emissive: new THREE.Color().setHSL(hue, 0.9, 0.4),
    emissiveIntensity: 0.8,
    transparent: true, opacity: 1,
  });
  const shape = new THREE.Mesh(geo, mat);
  shape.scale.setScalar(0.01);
  eG.add(shape);

  const pCount = 96;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  const pCol = new Float32Array(pCount * 3);
  const pVel = new Float32Array(pCount * 3);
  const bc = new THREE.Color().setHSL(hue, 0.9, 0.7);
  for (let i = 0; i < pCount; i++) {
    pCol[i * 3] = bc.r; pCol[i * 3 + 1] = bc.g; pCol[i * 3 + 2] = bc.b;
    // Velocities are assigned at burst time (after launch apex).
    pVel[i * 3] = 0;
    pVel[i * 3 + 1] = 0;
    pVel[i * 3 + 2] = 0;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const pMat = new THREE.PointsMaterial({
    size: 1.05, vertexColors: true, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, sizeAttenuation: true,
    depthWrite: false,
  });
  const particles = new THREE.Points(pGeo, pMat);
  eG.add(particles);

  const launchDuration = 0.48 + Math.random() * 0.2;
  const maxHeight = 26 + Math.random() * 20;
  // Ballistic arc parameters: at t=launchDuration rocket reaches maxHeight.
  const launchGravity = (2 * maxHeight) / (launchDuration * launchDuration);
  const launchV0 = launchGravity * launchDuration;
  const launchYaw = Math.random() * Math.PI * 2;
  const launchHorizSpeed = 10 + Math.random() * 16 + bassNorm * 8;
  const launchVX = Math.cos(launchYaw) * launchHorizSpeed;
  const launchVZ = Math.sin(launchYaw) * launchHorizSpeed;

  group.add(eG);
  eruptions.push({
    group: eG, mesh: shape, particles, velocities: pVel,
    startTime: songTime,
    phase: 'rise',
    launchDuration,
    maxHeight,
    launchGravity,
    launchV0,
    launchVX,
    launchVZ,
    exploded: false,
  });
}

function spawnEruptionBatch(songTime, time, bassNorm) {
  const baseCount = 1 + Math.floor(bassNorm * 2); // 1..3
  const extra = Math.random() < bassNorm * 0.35 ? 1 : 0;
  const count = Math.min(4, baseCount + extra);
  const anchor = getForwardSpawnAnchor();

  for (let i = 0; i < count; i++) {
    spawnEruption(songTime, time, bassNorm, anchor);
  }
}

function updateEruptions(songTime, deltaTime) {
  for (let i = eruptions.length - 1; i >= 0; i--) {
    const e = eruptions[i];
    const el = songTime - e.startTime;
    if (e.phase === 'rise') {
      const tSec = Math.min(el, e.launchDuration);
      const t = tSec / e.launchDuration;
      const easeOut = 1 - Math.pow(1 - t, 3);
      e.mesh.scale.setScalar(0.22 + easeOut * 1.42);
      const x = e.launchVX * tSec;
      const z = e.launchVZ * tSec;
      const y = Math.max(0, e.launchV0 * tSec - 0.5 * e.launchGravity * tSec * tSec);
      e.mesh.position.set(x, y, z);
      e.mesh.rotation.y += deltaTime * 5;

      if (t >= 1) {
        // Start particles at the launch apex, so burst happens in the sky.
        const pos = e.particles.geometry.attributes.position;
        for (let j = 0; j < pos.count; j++) {
          pos.setXYZ(j, e.mesh.position.x, e.mesh.position.y, e.mesh.position.z);
        }
        pos.needsUpdate = true;

        e.phase = 'explode';
        e.mesh.visible = false;
        e.particles.material.opacity = 1;
      }
    } else if (e.phase === 'explode') {
      if (!e.exploded) {
        const vel = e.velocities;
        for (let j = 0; j < vel.length / 3; j++) {
          const theta = Math.random() * Math.PI * 2;
          const radial = 24 + Math.random() * 30;
          const uplift = 22 + Math.random() * 30;
          vel[j * 3] = Math.cos(theta) * radial + e.launchVX * 0.35;
          vel[j * 3 + 1] = uplift;
          vel[j * 3 + 2] = Math.sin(theta) * radial + e.launchVZ * 0.35;
        }
        e.exploded = true;
      }

      const pos = e.particles.geometry.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        pos.setXYZ(j,
          pos.getX(j) + e.velocities[j * 3] * deltaTime,
          pos.getY(j) + e.velocities[j * 3 + 1] * deltaTime,
          pos.getZ(j) + e.velocities[j * 3 + 2] * deltaTime);
        // Slow gravity keeps particles in the sky longer before falling.
        e.velocities[j * 3 + 1] -= 6 * deltaTime;
        // Mild drag prevents particles from leaving frame too abruptly.
        e.velocities[j * 3] *= (1 - deltaTime * 0.25);
        e.velocities[j * 3 + 2] *= (1 - deltaTime * 0.25);
      }
      pos.needsUpdate = true;
      e.particles.material.opacity -= deltaTime * 0.2;
      if (e.particles.material.opacity <= 0) e.phase = 'done';
    } else {
      group.remove(e.group); disposeObj(e.group); eruptions.splice(i, 1);
    }
  }
}

function disposeObj(g) {
  g.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
}

export function activate(songTime) {
  if (!group) return;
  isActive = true;
  activateTime = songTime;
  camZ = 0;
  camY = getRequiredCameraHeight(0, camZ, 0, 0);
  lastEruptionTime = 0;
  savedCamPos = cameraRef.position.clone();

  for (let t = 0; t < TILE_COUNT; t++) {
    terrainTiles[t].position.z = -t * TILE_LENGTH;
  }

  // Override scene fog for this effect — hides terrain edges at distance
  savedFog = scene.fog;
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.006);

  group.visible = true;
  scene.add(group);
}

export function update(audioData, songTime, deltaTime) {
  if (!isActive) return;

  const elapsed = songTime - activateTime;
  const { bass } = audioData;
  const bassNorm = bass / 255;

  // Camera flies forward with terrain-aware altitude.
  camZ -= CAM_SPEED * deltaTime * (0.95 + bassNorm * 1.05);
  const camX = Math.sin(elapsed * 0.25) * 5;

  const requiredY = getRequiredCameraHeight(camX, camZ, elapsed, bassNorm);
  const followSpeed = requiredY > camY ? UPWARD_FOLLOW : DOWNWARD_FOLLOW;
  const follow = 1 - Math.exp(-deltaTime * followSpeed);
  camY += (requiredY - camY) * follow;

  // Hard predictive floor: do not allow camera below sampled forward envelope.
  if (camY < requiredY) {
    camY = requiredY;
  }

  // Emergency local floor: catches any near-field crest that wasn't in predictive envelope.
  const emergencyFloor = getEmergencyFloorHeight(camX, camZ, elapsed, bassNorm);
  if (camY < emergencyFloor) {
    camY = emergencyFloor;
  }
  camY = Math.max(camY, CAM_MIN_Y);

  cameraRef.position.set(camX, camY, camZ);
  const lookAtZ = camZ - CAM_LOOK_AHEAD;
  const lookAtY = waveHeight(camX * 0.3, lookAtZ, elapsed, bassNorm) + CAM_LOOK_AHEAD_HEIGHT;
  cameraRef.lookAt(camX * 0.3, lookAtY, lookAtZ);

  // Move light with camera
  group.children.forEach(c => {
    if (c.isLight) c.position.set(camX, camY + 10, camZ - 30);
  });

  recycleTiles();
  updateTerrain(elapsed, bassNorm);

  // Color shift terrain
  const hue = (elapsed * 0.025) % 1;
  terrainTiles.forEach(t => t.material.color.setHSL(hue, 0.8, 0.35));

  // Eruptions on bass
  const dynamicCooldown = Math.max(0.16, ERUPTION_COOLDOWN * (1.18 - bassNorm * 0.55));
  if (bassNorm > 0.28 && (songTime - lastEruptionTime) > dynamicCooldown) {
    spawnEruptionBatch(songTime, elapsed, bassNorm);
    lastEruptionTime = songTime;
  }
  updateEruptions(songTime, deltaTime);
}

export function deactivate() {
  isActive = false;
  if (savedCamPos && cameraRef) {
    cameraRef.position.copy(savedCamPos);
    cameraRef.lookAt(0, 0, 0);
  }
  // Restore original fog
  if (scene && savedFog !== null) {
    scene.fog = savedFog;
    savedFog = null;
  }
  if (group) { group.visible = false; scene.remove(group); }
  eruptions.forEach(e => disposeObj(e.group));
  eruptions = [];
}

export function destroy() {
  deactivate();
  terrainGeos.forEach(g => g.dispose());
  terrainTiles.forEach(t => t.material.dispose());
  terrainTiles = []; terrainGeos = []; group = null;
}
