/**
 * 2026 Particle Formation Effect
 * Own particle system that forms "2026" — does NOT share base particles
 * to avoid rotation issues. Always faces camera.
 * "2026 en la pantalla"
 */

import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

let group = null;
let particleSystem = null;
let scene = null;
let cameraRef = null;
let targetPositions = null;
let scatteredPositions = null;
let isActive = false;
let activateTime = 0;

const PARTICLE_COUNT = 700;
const FORMATION_DURATION = 6.0;

export function init(sceneRef, camera, resources) {
  scene = sceneRef;
  cameraRef = camera;
  group = new THREE.Group();
  group.visible = false;

  const font = resources.font;
  if (!font) return;

  // Create large "2026" text geometry and sample target positions
  const textGeo = new TextGeometry('2026', {
    font: font,
    size: 14,
    depth: 2,
    curveSegments: 8,
    bevelEnabled: false,
  });
  textGeo.computeBoundingBox();
  const bb = textGeo.boundingBox;
  const centerX = -(bb.max.x - bb.min.x) / 2;
  const centerY = -(bb.max.y - bb.min.y) / 2;

  targetPositions = new Float32Array(PARTICLE_COUNT * 3);
  samplePoints(textGeo, targetPositions, PARTICLE_COUNT, centerX, centerY);
  textGeo.dispose();

  // Create scattered starting positions
  scatteredPositions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = 40 + Math.random() * 70;
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

    // Gold/white color — moderate brightness
    const gold = new THREE.Color().setHSL(0.12, 0.8, 0.6);
    colors[i * 3] = gold.r;
    colors[i * 3 + 1] = gold.g;
    colors[i * 3 + 2] = gold.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.9,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  particleSystem = new THREE.Points(geometry, material);
  group.add(particleSystem);
}

function samplePoints(geometry, targetArr, count, offsetX, offsetY) {
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
    // Flatten Z for readability
    targetArr[i * 3 + 2] = 0;
  }
}

export function activate(songTime) {
  if (!group) return;
  isActive = true;
  activateTime = songTime;

  // Reset to scattered positions
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
  const progress = Math.min(elapsed / FORMATION_DURATION, 1);
  const ease = progress * progress * (3 - 2 * progress);

  const pos = particleSystem.geometry.attributes.position;
  const { bass } = audioData;
  const bassNorm = bass / 255;

  const pulse = 1 + bassNorm * 0.2;
  const jitter = bassNorm * 0.5;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;

    let tx = scatteredPositions[ix] + (targetPositions[ix] - scatteredPositions[ix]) * ease;
    let ty = scatteredPositions[iy] + (targetPositions[iy] - scatteredPositions[iy]) * ease;
    let tz = scatteredPositions[iz] + (targetPositions[iz] - scatteredPositions[iz]) * ease;

    // Once formed, particles breathe and jitter with the beat
    if (ease > 0.5) {
      tx = tx * pulse + Math.sin(elapsed * 4 + i * 0.4) * jitter;
      ty = ty * pulse + Math.cos(elapsed * 3.5 + i * 0.6) * jitter;
      tz += Math.sin(elapsed * 5 + i * 0.8) * jitter * 0.3;
    }

    pos.setXYZ(i, tx, ty, tz);
  }

  pos.needsUpdate = true;

  // Color cycling — hue shifts with time, flashes brighter on bass
  const colors = particleSystem.geometry.attributes.color;
  const hue = (elapsed * 0.12) % 1;
  const lit = 0.5 + bassNorm * 0.4;
  const c1 = new THREE.Color().setHSL(hue, 0.9, lit);
  const c2 = new THREE.Color().setHSL((hue + 0.15) % 1, 0.85, lit);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const blend = i / PARTICLE_COUNT;
    colors.setXYZ(i,
      c1.r + (c2.r - c1.r) * blend,
      c1.g + (c2.g - c1.g) * blend,
      c1.b + (c2.b - c1.b) * blend
    );
  }
  colors.needsUpdate = true;

  // Beat-reactive size
  particleSystem.material.size = 0.6 + bassNorm * 0.7;
}

export function deactivate() {
  isActive = false;
  if (group) {
    group.visible = false;
    scene.remove(group);
  }
}

// Keep for backwards compat with effect-manager but no longer needed
export function setBaseParticles() {}

export function destroy() {
  deactivate();
  if (particleSystem) {
    particleSystem.geometry.dispose();
    particleSystem.material.dispose();
  }
  targetPositions = null;
  scatteredPositions = null;
  group = null;
  particleSystem = null;
}
