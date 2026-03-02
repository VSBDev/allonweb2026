/**
 * Terrain Spheres Effect — Endless Runner style
 * Camera stays safely above crests over massive scrolling terrain with fog.
 * Glowing spheres sit on and bounce off the wave surface.
 */

import * as THREE from 'three';

let group = null;
let terrainTiles = [];
let terrainGeos = [];
let spheres = [];
let scene = null;
let cameraRef = null;
let isActive = false;
let activateTime = 0;
let savedFog = null;

const TILE_COUNT = 4;
const TILE_WIDTH = 400;
const TILE_LENGTH = 150;
const SEG_X = 80;
const SEG_Z = 60;
const CAM_SPEED = 96;
const CAM_CLEARANCE = 20;
const EMERGENCY_CLEARANCE = 12;
const CAM_MIN_Y = 10;
const CAM_LOOK_AHEAD = 80;
const CAM_LOOK_AHEAD_HEIGHT = 6;
const SPHERE_COUNT = 360;
const SPHERE_X_SPREAD = TILE_WIDTH * 0.48;
const WAVE_HEIGHT_SCALE = 1.75;
const UPWARD_FOLLOW = 16;
const DOWNWARD_FOLLOW = 4;
const CAMERA_SAMPLE_X = [-40, -24, -12, 0, 12, 24, 40];
const CAMERA_SAMPLE_Z = [6, 0, -12, -24, -36, -48, -64, -80, -96];
const EMERGENCY_SAMPLE_X = [-24, -12, 0, 12, 24];
const EMERGENCY_SAMPLE_Z = [6, 0, -8, -16, -24];
const BEAT_THRESHOLD = 0.58;
const BEAT_FORCE_THRESHOLD = 0.78;
const BEAT_MIN_INTERVAL = 0.16;

let camZ = 0;
let camY = CAM_MIN_Y;
let savedCamPos = null;
let lastBassNorm = 0;
let lastBeatTime = -999;

function waveHeight(wx, wz, time, bassNorm) {
  const amp = 1.9 + bassNorm * 2.2;
  return (
    Math.sin(wx * 0.045 + time * 1.1) * amp
    + Math.cos(wz * 0.03 + time * 0.8) * amp * 0.6
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
  const maxHeight = sampleMaxHeight(wx, wz, time, bassNorm, CAMERA_SAMPLE_X, CAMERA_SAMPLE_Z);
  return Math.max(CAM_MIN_Y, maxHeight + CAM_CLEARANCE);
}

function getEmergencyFloorHeight(wx, wz, time, bassNorm) {
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
      color: 0x0066aa,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = -t * TILE_LENGTH;
    terrainTiles.push(mesh);
    terrainGeos.push(geo);
    group.add(mesh);
  }

  // Lower segment count keeps performance reasonable with hundreds of spheres.
  const sphereGeo = new THREE.SphereGeometry(1, 12, 9);
  for (let i = 0; i < SPHERE_COUNT; i++) {
    const hue = i / SPHERE_COUNT;
    const color = new THREE.Color().setHSL(hue, 0.9, 0.5);
    const mat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.5,
      metalness: 0.7, roughness: 0.3,
    });
    const sphere = new THREE.Mesh(sphereGeo, mat);
    const radius = 0.45 + Math.random() * 3.75;
    sphere.scale.setScalar(radius);
    sphere.userData = {
      // Spread wide across terrain, not just a center corridor.
      localX: (Math.random() - 0.5) * (SPHERE_X_SPREAD * 2),
      // worldZ: fixed world position, set on activate
      worldZ: 0,
      radius, hue,
      bounceHeight: 8 + Math.random() * 14,
      vy: 0,
      onSurface: true,
    };
    spheres.push(sphere);
    group.add(sphere);
  }

  const l1 = new THREE.PointLight(0x00aaff, 4, 180);
  l1.position.set(0, 30, 0);
  group.add(l1);
  const l2 = new THREE.PointLight(0xff44cc, 3, 100);
  l2.position.set(-30, 20, -40);
  group.add(l2);
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
    const tileFront = tile.position.z - TILE_LENGTH / 2;
    if (tileFront > camZ + 20) {
      let minZ = Infinity;
      for (const other of terrainTiles) {
        if (other !== tile) minZ = Math.min(minZ, other.position.z);
      }
      tile.position.z = minZ - TILE_LENGTH;
    }
  }
}

export function activate(songTime) {
  if (!group) return;
  isActive = true;
  activateTime = songTime;
  camZ = 0;
  camY = getRequiredCameraHeight(0, camZ, 0, 0);
  savedCamPos = cameraRef.position.clone();
  lastBassNorm = 0;
  lastBeatTime = -999;

  for (let t = 0; t < TILE_COUNT; t++) {
    terrainTiles[t].position.z = -t * TILE_LENGTH;
  }
  // Place many spheres ahead of camera with dense spacing for high scene density.
  spheres.forEach((s, i) => {
    s.userData.worldZ = -(i * 8 + Math.random() * 12);
    s.userData.localX = (Math.random() - 0.5) * (SPHERE_X_SPREAD * 2);
    s.userData.vy = 0;
    s.userData.onSurface = true;
  });

  savedFog = scene.fog;
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.005);

  group.visible = true;
  scene.add(group);
}

export function update(audioData, songTime, deltaTime) {
  if (!isActive) return;

  const elapsed = songTime - activateTime;
  const { bass, mid } = audioData;
  const bassNorm = bass / 255;

  camZ -= CAM_SPEED * deltaTime * (1.15 + bassNorm * 1.6);

  const camX = Math.sin(elapsed * 0.2) * 6;
  const requiredY = getRequiredCameraHeight(camX, camZ, elapsed, bassNorm);
  const followSpeed = requiredY > camY ? UPWARD_FOLLOW : DOWNWARD_FOLLOW;
  const follow = 1 - Math.exp(-deltaTime * followSpeed);
  camY += (requiredY - camY) * follow;

  if (camY < requiredY) {
    camY = requiredY;
  }

  const emergencyFloor = getEmergencyFloorHeight(camX, camZ, elapsed, bassNorm);
  if (camY < emergencyFloor) {
    camY = emergencyFloor;
  }
  camY = Math.max(camY, CAM_MIN_Y);

  cameraRef.position.set(camX, camY, camZ);
  const lookAtZ = camZ - CAM_LOOK_AHEAD;
  const lookAtY = waveHeight(camX * 0.2, lookAtZ, elapsed, bassNorm) + CAM_LOOK_AHEAD_HEIGHT;
  cameraRef.lookAt(camX * 0.2, lookAtY, lookAtZ);

  const beatByCrossing = bassNorm >= BEAT_THRESHOLD && lastBassNorm < BEAT_THRESHOLD;
  const beatByForce = bassNorm >= BEAT_FORCE_THRESHOLD && (songTime - lastBeatTime) > BEAT_MIN_INTERVAL * 1.4;
  const canTriggerBeat = (songTime - lastBeatTime) > BEAT_MIN_INTERVAL;
  const beatHit = canTriggerBeat && (beatByCrossing || beatByForce);
  if (beatHit) {
    lastBeatTime = songTime;
  }
  lastBassNorm = bassNorm;

  group.children.forEach(c => {
    if (c.isLight) c.position.set(camX, camY + 10, camZ - 20);
  });

  recycleTiles();
  updateTerrain(elapsed, bassNorm);

  const hue = (elapsed * 0.02 + 0.55) % 1;
  terrainTiles.forEach(t => t.material.color.setHSL(hue, 0.7, 0.3));

  // Spheres at fixed world Z — camera flies THROUGH them, recycle behind to front.
  spheres.forEach((sphere) => {
    const ud = sphere.userData;

    // Recycle: if sphere is behind camera, move it far ahead
    if (ud.worldZ > camZ + 15) {
      // Find furthest-ahead sphere
      let minZ = Infinity;
      for (const other of spheres) {
        if (other !== sphere) minZ = Math.min(minZ, other.userData.worldZ);
      }
      ud.worldZ = minZ - 8 - Math.random() * 10;
      ud.localX = (Math.random() - 0.5) * (SPHERE_X_SPREAD * 2);
      ud.vy = 0;
      ud.onSurface = true;
    }

    const wx = ud.localX;
    const wz = ud.worldZ;
    const surfY = waveHeight(wx, wz, elapsed, bassNorm);

    if (ud.onSurface) {
      sphere.position.y = surfY + ud.radius;
      if (beatHit) {
        const edgeFactor = 1 - Math.min(1, Math.abs(wx) / SPHERE_X_SPREAD);
        const laneBoost = 0.85 + edgeFactor * 0.7;
        ud.vy = ud.bounceHeight * (1.2 + bassNorm * 2.0) * laneBoost;
        ud.onSurface = false;
      }
    } else {
      ud.vy -= 42 * deltaTime;
      sphere.position.y += ud.vy * deltaTime;
      if (sphere.position.y <= surfY + ud.radius) {
        sphere.position.y = surfY + ud.radius;
        ud.vy = 0;
        ud.onSurface = true;
      }
    }

    sphere.position.x = wx;
    sphere.position.z = wz;

    sphere.scale.setScalar(ud.radius * (1 + bassNorm * 0.38));

    const sHue = (ud.hue + elapsed * 0.02) % 1;
    sphere.material.color.setHSL(sHue, 0.9, 0.5);
    sphere.material.emissive.setHSL(sHue, 0.9, 0.35);
    sphere.material.emissiveIntensity = 0.4 + bassNorm * 0.5;
  });
}

export function deactivate() {
  isActive = false;
  if (savedCamPos && cameraRef) {
    cameraRef.position.copy(savedCamPos);
    cameraRef.lookAt(0, 0, 0);
  }
  if (scene && savedFog !== null) {
    scene.fog = savedFog;
    savedFog = null;
  }
  if (group) { group.visible = false; scene.remove(group); }
}

export function destroy() {
  deactivate();
  terrainGeos.forEach(g => g.dispose());
  terrainTiles.forEach(t => t.material.dispose());
  spheres.forEach(s => { s.geometry.dispose(); s.material.dispose(); });
  terrainTiles = []; terrainGeos = []; spheres = []; group = null;
}
