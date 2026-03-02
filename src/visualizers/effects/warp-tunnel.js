/**
 * Warp Tunnel Effect
 * Hyperspace tunnel with streaking lines and rings rushing toward camera
 * "viajo sin billete y sin esfuerzo"
 */

import * as THREE from 'three';

let group = null;
let instancedMesh = null;
let rings = [];
let scene = null;
let camera = null;
let isActive = false;
let activateTime = 0;

let savedCameraPos = null;
let savedCameraLookAt = null;
let deactivating = false;
let deactivateStart = 0;

const STREAK_COUNT = 2000;
const RING_COUNT = 6;
const TUNNEL_RADIUS = 25;
const TUNNEL_LENGTH = 200;
const RESTORE_DURATION = 0.5;

// Per-instance data
let streakOffsets = null;
let streakSpeeds = null;

export function init(sceneRef, cameraRef, resources) {
  scene = sceneRef;
  camera = cameraRef;
  group = new THREE.Group();
  group.visible = false;

  // Create instanced mesh for streaks
  const streakGeo = new THREE.BoxGeometry(0.1, 0.1, 3);
  const streakMat = new THREE.MeshBasicMaterial({
    color: 0xaaccff,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });

  instancedMesh = new THREE.InstancedMesh(streakGeo, streakMat, STREAK_COUNT);

  streakOffsets = new Float32Array(STREAK_COUNT * 3);
  streakSpeeds = new Float32Array(STREAK_COUNT);

  const dummy = new THREE.Object3D();

  for (let i = 0; i < STREAK_COUNT; i++) {
    // Arrange in a cylinder around z-axis
    const angle = Math.random() * Math.PI * 2;
    const r = 5 + Math.random() * TUNNEL_RADIUS;
    const z = (Math.random() - 0.5) * TUNNEL_LENGTH;

    streakOffsets[i * 3] = Math.cos(angle) * r;
    streakOffsets[i * 3 + 1] = Math.sin(angle) * r;
    streakOffsets[i * 3 + 2] = z;
    streakSpeeds[i] = 30 + Math.random() * 70;

    dummy.position.set(streakOffsets[i * 3], streakOffsets[i * 3 + 1], z);
    dummy.lookAt(0, 0, z + 1); // orient along z
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  group.add(instancedMesh);

  // Create rings
  for (let i = 0; i < RING_COUNT; i++) {
    const ringGeo = new THREE.RingGeometry(TUNNEL_RADIUS - 2, TUNNEL_RADIUS, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = -i * (TUNNEL_LENGTH / RING_COUNT);
    rings.push(ring);
    group.add(ring);
  }
}

export function activate(songTime) {
  if (!group) return;
  isActive = true;
  deactivating = false;
  activateTime = songTime;

  // Save camera state
  savedCameraPos = camera.position.clone();
  savedCameraLookAt = new THREE.Vector3(0, 0, 0);

  // Position group so tunnel is in front of camera
  group.position.copy(camera.position);
  group.rotation.set(0, 0, 0);

  group.visible = true;
  scene.add(group);
}

export function update(audioData, songTime, deltaTime) {
  if (!group) return;

  // Handle camera restore after deactivation
  if (deactivating) {
    if (deactivateStart < 0) deactivateStart = songTime;
    const t = Math.min((songTime - deactivateStart) / RESTORE_DURATION, 1);
    const ease = t * t * (3 - 2 * t);
    camera.position.lerpVectors(camera.position, savedCameraPos, ease * 0.2);
    if (t >= 1) {
      deactivating = false;
      camera.position.copy(savedCameraPos);
    }
    camera.lookAt(0, 0, 0);
    return;
  }

  if (!isActive) return;

  const elapsed = songTime - activateTime;
  const { bass, treble } = audioData;
  const bassNorm = bass / 255;

  // Move camera forward for immersion
  camera.position.z -= 20 * deltaTime;
  camera.lookAt(camera.position.x, camera.position.y, camera.position.z - 100);

  // Update streaks - rush toward camera
  const dummy = new THREE.Object3D();
  for (let i = 0; i < STREAK_COUNT; i++) {
    const ix = i * 3;
    streakOffsets[ix + 2] += streakSpeeds[i] * deltaTime * (1 + bassNorm);

    // Wrap around
    if (streakOffsets[ix + 2] > camera.position.z + 20) {
      streakOffsets[ix + 2] = camera.position.z - TUNNEL_LENGTH;
    }

    dummy.position.set(
      streakOffsets[ix],
      streakOffsets[ix + 1],
      streakOffsets[ix + 2]
    );

    // Stretch along z based on speed
    const stretch = 1 + (streakSpeeds[i] / 100) * 3 * (1 + bassNorm);
    dummy.scale.set(1, 1, stretch);
    dummy.lookAt(0, 0, streakOffsets[ix + 2] + 1);
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
  }
  instancedMesh.instanceMatrix.needsUpdate = true;

  // Update rings - fly toward camera
  rings.forEach((ring, i) => {
    ring.position.z += 40 * deltaTime;
    if (ring.position.z > camera.position.z + 10) {
      ring.position.z = camera.position.z - TUNNEL_LENGTH;
    }
    ring.material.opacity = 0.2 + bassNorm * 0.3;

    // Scale pulse
    const pulse = 1 + Math.sin(elapsed * 5 + i) * 0.1 * bassNorm;
    ring.scale.setScalar(pulse);
  });
}

export function deactivate() {
  isActive = false;
  if (group) {
    group.visible = false;
    scene.remove(group);
  }

  // Start smooth camera restore
  if (savedCameraPos) {
    deactivating = true;
    deactivateStart = -1; // will be set on first update call
  }
}

export function destroy() {
  isActive = false;
  deactivating = false;
  if (instancedMesh) {
    instancedMesh.geometry.dispose();
    instancedMesh.material.dispose();
  }
  rings.forEach((ring) => {
    ring.geometry.dispose();
    ring.material.dispose();
  });
  rings = [];
  group = null;
  instancedMesh = null;
}
