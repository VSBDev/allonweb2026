/**
 * 3D Text "TODO EN WEB" Effect
 * Particles converge to form text, pulse with bass, then shatter outward
 * Always faces camera (billboard style)
 */

import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

let group = null;
let particleSystem = null;
let targetPositions = null;
let scatteredPositions = null;
let velocities = null;
let scene = null;
let cameraRef = null;
let isActive = false;
let activateTime = 0;
let repeatIndex = 0;
let phase = 'converge'; // 'converge' | 'hold' | 'shatter'

const CONVERGE_DURATION = 1.5;
const SHATTER_LEAD = 1.5; // seconds before end to start shatter
const PARTICLE_COUNT = 1200;

export function init(sceneRef, camera, resources) {
  scene = sceneRef;
  cameraRef = camera;
  group = new THREE.Group();
  group.visible = false;

  const font = resources.font;
  if (!font) return;

  // Create text geometry — large size for readability
  const textGeo = new TextGeometry('TODO EN WEB', {
    font: font,
    size: 10,
    depth: 2,
    curveSegments: 8,
    bevelEnabled: false,
  });
  textGeo.computeBoundingBox();
  const bb = textGeo.boundingBox;
  const centerX = -(bb.max.x - bb.min.x) / 2;
  const centerY = -(bb.max.y - bb.min.y) / 2;

  // Sample points on the text surface
  targetPositions = new Float32Array(PARTICLE_COUNT * 3);
  samplePointsOnGeometry(textGeo, targetPositions, PARTICLE_COUNT, centerX, centerY);
  textGeo.dispose();

  // Create scattered positions (random sphere around text area)
  scatteredPositions = new Float32Array(PARTICLE_COUNT * 3);
  velocities = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = 40 + Math.random() * 60;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    scatteredPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    scatteredPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    scatteredPositions[i * 3 + 2] = r * Math.cos(phi);
  }

  // Create particle system
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = scatteredPositions[i * 3];
    positions[i * 3 + 1] = scatteredPositions[i * 3 + 1];
    positions[i * 3 + 2] = scatteredPositions[i * 3 + 2];

    // White/gold color — moderate brightness to stay readable
    const gold = new THREE.Color().setHSL(0.12, 0.8, 0.6);
    colors[i * 3] = gold.r;
    colors[i * 3 + 1] = gold.g;
    colors[i * 3 + 2] = gold.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  particleSystem = new THREE.Points(geometry, material);
  group.add(particleSystem);
}

function samplePointsOnGeometry(geometry, targetArr, count, offsetX, offsetY) {
  const posAttr = geometry.getAttribute('position');
  const index = geometry.getIndex();
  const triangles = [];
  const areas = [];
  let totalArea = 0;

  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
  const triCount = index ? index.count / 3 : posAttr.count / 3;

  for (let i = 0; i < triCount; i++) {
    let a, b, c;
    if (index) {
      a = index.getX(i * 3);
      b = index.getX(i * 3 + 1);
      c = index.getX(i * 3 + 2);
    } else {
      a = i * 3; b = i * 3 + 1; c = i * 3 + 2;
    }
    vA.fromBufferAttribute(posAttr, a);
    vB.fromBufferAttribute(posAttr, b);
    vC.fromBufferAttribute(posAttr, c);

    const area = new THREE.Triangle(vA.clone(), vB.clone(), vC.clone()).getArea();
    areas.push(area);
    totalArea += area;
    triangles.push([vA.clone(), vB.clone(), vC.clone()]);
  }

  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalArea;
    let triIdx = 0;
    for (let j = 0; j < areas.length; j++) {
      r -= areas[j];
      if (r <= 0) { triIdx = j; break; }
    }

    const tri = triangles[triIdx];
    let u = Math.random(), v = Math.random();
    if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const w = 1 - u - v;

    targetArr[i * 3] = tri[0].x * u + tri[1].x * v + tri[2].x * w + offsetX;
    targetArr[i * 3 + 1] = tri[0].y * u + tri[1].y * v + tri[2].y * w + offsetY;
    // Flatten Z to keep text flat/readable
    targetArr[i * 3 + 2] = 0;
  }
}

export function activate(songTime) {
  if (!group) return;
  isActive = true;
  activateTime = songTime;
  phase = 'converge';

  // Determine repeat index based on songTime
  if (songTime < 80) repeatIndex = 0;
  else if (songTime < 160) repeatIndex = 1;
  else repeatIndex = 2;

  // Scale up with each repeat
  const scaleFactor = 1 + repeatIndex * 0.3;
  group.scale.setScalar(scaleFactor);

  // Reset particles to scattered positions
  if (particleSystem) {
    const pos = particleSystem.geometry.attributes.position;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos.setXYZ(i,
        scatteredPositions[i * 3],
        scatteredPositions[i * 3 + 1],
        scatteredPositions[i * 3 + 2]
      );
    }
    pos.needsUpdate = true;

    // Reset shatter velocities
    for (let i = 0; i < velocities.length; i++) velocities[i] = 0;
  }

  group.visible = true;
  scene.add(group);
}

export function update(audioData, songTime, deltaTime) {
  if (!isActive || !particleSystem) return;

  // Billboard: always face camera
  if (cameraRef) {
    group.quaternion.copy(cameraRef.quaternion);
  }

  const elapsed = songTime - activateTime;
  const pos = particleSystem.geometry.attributes.position;
  const { bass } = audioData;
  const bassNorm = bass / 255;

  // Determine phase
  const windowDuration = 10;
  if (elapsed < CONVERGE_DURATION) {
    phase = 'converge';
  } else if (elapsed > windowDuration - SHATTER_LEAD) {
    phase = 'shatter';
  } else {
    phase = 'hold';
  }

  if (phase === 'converge') {
    const t = Math.min(elapsed / CONVERGE_DURATION, 1);
    const ease = t * t * (3 - 2 * t);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      pos.setXYZ(i,
        scatteredPositions[ix] + (targetPositions[ix] - scatteredPositions[ix]) * ease,
        scatteredPositions[iy] + (targetPositions[iy] - scatteredPositions[iy]) * ease,
        scatteredPositions[iz] + (targetPositions[iz] - scatteredPositions[iz]) * ease
      );
    }
  } else if (phase === 'hold') {
    // Particles breathe and jitter with the beat
    const pulse = 1 + bassNorm * 0.2;
    const jitter = bassNorm * 0.6;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      // Per-particle wave offset for organic movement
      const wave = Math.sin(elapsed * 4 + i * 0.3) * jitter;
      pos.setXYZ(i,
        targetPositions[ix] * pulse + wave,
        targetPositions[iy] * pulse + Math.cos(elapsed * 3.5 + i * 0.5) * jitter,
        targetPositions[iz] + Math.sin(elapsed * 5 + i * 0.7) * jitter * 0.3
      );
    }
  } else {
    // Shatter
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      if (velocities[ix] === 0 && velocities[iy] === 0 && velocities[iz] === 0) {
        velocities[ix] = (Math.random() - 0.5) * 60;
        velocities[iy] = (Math.random() - 0.5) * 60;
        velocities[iz] = (Math.random() - 0.5) * 60;
      }
      pos.setXYZ(i,
        pos.getX(i) + velocities[ix] * deltaTime,
        pos.getY(i) + velocities[iy] * deltaTime,
        pos.getZ(i) + velocities[iz] * deltaTime
      );
    }
  }

  pos.needsUpdate = true;

  // Beat-reactive size — pumps on bass
  particleSystem.material.size = phase === 'hold'
    ? 0.6 + bassNorm * 0.8
    : 0.7;

  // Opacity
  const brightness = 0.8 + repeatIndex * 0.1;
  particleSystem.material.opacity = phase === 'shatter'
    ? Math.max(0, 1 - (elapsed - (windowDuration - SHATTER_LEAD)) / SHATTER_LEAD)
    : brightness;

  // Color cycling — hue shifts with time, flashes brighter on beats
  if (phase !== 'shatter') {
    const colors = particleSystem.geometry.attributes.color;
    const hue = (elapsed * 0.15 + repeatIndex * 0.33) % 1;
    const lit = 0.55 + bassNorm * 0.35;
    const c = new THREE.Color().setHSL(hue, 0.9, lit);
    const c2 = new THREE.Color().setHSL((hue + 0.1) % 1, 0.85, lit);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const blend = (i / PARTICLE_COUNT);
      colors.setXYZ(i,
        c.r + (c2.r - c.r) * blend,
        c.g + (c2.g - c.g) * blend,
        c.b + (c2.b - c.b) * blend
      );
    }
    colors.needsUpdate = true;
  }
}

export function deactivate() {
  isActive = false;
  if (group) {
    group.visible = false;
    scene.remove(group);
  }
}

export function destroy() {
  deactivate();
  if (particleSystem) {
    particleSystem.geometry.dispose();
    particleSystem.material.dispose();
  }
  group = null;
  particleSystem = null;
}
