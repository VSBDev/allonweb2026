/**
 * App Rain → Browser Morph Effect
 * Large colorful boxes rain across the full screen, then morph into a browser window.
 * Positioned in front of camera to fill the viewport. Background viz is heavily dimmed.
 */

import * as THREE from 'three';

let group = null;
let boxes = [];
let scene = null;
let cameraRef = null;
let isActive = false;
let activateTime = 0;

const BOX_COUNT = 40;
const PHASE1_END = 6.9; // 89.5 - 82.6
const TOTAL_DURATION = 14.2; // 96.8 - 82.6

// App-like colors (bright, saturated)
const APP_COLORS = [
  0xff3b30, 0xff9500, 0xffcc00, 0x34c759, 0x007aff,
  0x5856d6, 0xaf52de, 0xff2d55, 0x00c7be, 0x30b0c7,
  0xff6b35, 0x64d2ff, 0xbf5af2, 0x32d74b, 0xff453a,
];

// Browser window target positions — sized to fill most of the view
let browserTargets = [];

export function init(sceneRef, camera, resources) {
  scene = sceneRef;
  cameraRef = camera;
  group = new THREE.Group();
  group.visible = false;

  computeBrowserTargets();

  // Create boxes — much larger (3x3x3)
  const boxGeo = new THREE.BoxGeometry(3, 3, 3);

  for (let i = 0; i < BOX_COUNT; i++) {
    const color = APP_COLORS[i % APP_COLORS.length];
    const baseColor = new THREE.Color(color);
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.5,
      transparent: true,
      opacity: 1.0,
    });

    const mesh = new THREE.Mesh(boxGeo, material);
    // Spread across wide range for full-screen rain
    mesh.userData = {
      startX: (Math.random() - 0.5) * 80,
      startY: 40 + Math.random() * 40,
      startZ: (Math.random() - 0.5) * 20,
      fallSpeed: 12 + Math.random() * 18,
      drift: (Math.random() - 0.5) * 3,
      rotSpeed: (Math.random() - 0.5) * 4,
      colorIndex: i % APP_COLORS.length,
      baseColor,
      twinkleSeed: Math.random() * Math.PI * 2,
      twinkleGate: 0.22 + Math.random() * 0.36,
    };

    boxes.push(mesh);
    group.add(mesh);
  }
}

function updateChristmasLights(box, elapsed, bassNorm, fadeFactor) {
  const ud = box.userData;
  const phaseDuration = THREE.MathUtils.clamp(0.6 - bassNorm * 0.25, 0.28, 0.6);
  // One color at a time: starts at red (index 0), then advances through palette.
  const activeColorIndex = Math.floor(elapsed / phaseDuration) % APP_COLORS.length;
  const isActiveColor = ud.colorIndex === activeColorIndex;

  const twinkle = 0.5 + 0.5 * Math.sin(elapsed * (14 + bassNorm * 10) + ud.twinkleSeed);
  const isOn = isActiveColor && twinkle > ud.twinkleGate;

  if (isOn) {
    box.material.color.copy(ud.baseColor);
    box.material.emissive.copy(ud.baseColor);
    box.material.emissiveIntensity = 1.1 + bassNorm * 1.6;
    box.material.opacity = (0.8 + twinkle * 0.2) * fadeFactor;
  } else {
    // Keep "off" cubes visible but clearly dimmer than active lit cubes.
    box.material.color.copy(ud.baseColor).multiplyScalar(0.58);
    box.material.emissive.copy(ud.baseColor).multiplyScalar(0.32);
    box.material.emissiveIntensity = 0.42;
    box.material.opacity = 0.74 * fadeFactor;
  }
}

function computeBrowserTargets() {
  browserTargets = [];
  // Large browser frame — positions spaced so 1.5-unit boxes don't overlap
  const w = 50, h = 32;
  const top = 16, left = -25;
  const spacing = 5; // enough gap between each box

  // Top edge (10 boxes)
  for (let i = 0; i < 10; i++) {
    browserTargets.push(new THREE.Vector3(left + (i / 9) * w, top, 0));
  }
  // Bottom edge (10 boxes)
  for (let i = 0; i < 10; i++) {
    browserTargets.push(new THREE.Vector3(left + (i / 9) * w, top - h, 0));
  }
  // Left edge (4 boxes, skip corners already placed)
  for (let i = 1; i < 5; i++) {
    browserTargets.push(new THREE.Vector3(left, top - (i / 5) * h, 0));
  }
  // Right edge (4 boxes)
  for (let i = 1; i < 5; i++) {
    browserTargets.push(new THREE.Vector3(left + w, top - (i / 5) * h, 0));
  }
  // Address bar (8 boxes, horizontal line near top)
  for (let i = 1; i < 9; i++) {
    browserTargets.push(new THREE.Vector3(left + (i / 9) * w, top - 5, 0));
  }
  // 3 tab buttons top-left + URL bar accent
  browserTargets.push(new THREE.Vector3(left + 3, top - 2.5, 0));
  browserTargets.push(new THREE.Vector3(left + 8, top - 2.5, 0));
  browserTargets.push(new THREE.Vector3(left + 13, top - 2.5, 0));
  browserTargets.push(new THREE.Vector3(left + w - 5, top - 2.5, 0));
}

export function activate(songTime) {
  if (!group) return;
  isActive = true;
  activateTime = songTime;

  // Reset box positions
  boxes.forEach((box) => {
    const ud = box.userData;
    box.position.set(ud.startX, ud.startY, ud.startZ);
    box.rotation.set(0, 0, 0);
    box.scale.setScalar(1);
    box.material.opacity = 1;
  });

  group.visible = true;
  scene.add(group);
}

export function update(audioData, songTime, deltaTime) {
  if (!isActive) return;

  // Keep group facing camera and positioned in front of it
  if (cameraRef) {
    group.quaternion.copy(cameraRef.quaternion);
    // Position group right between camera and origin so boxes fill the view
    group.position.copy(cameraRef.position).multiplyScalar(0.4);
  }

  const elapsed = songTime - activateTime;
  const { bass } = audioData;
  const bassNorm = bass / 255;
  const fadeFactor = elapsed > TOTAL_DURATION - 1.5
    ? Math.max(0, 1 - (elapsed - (TOTAL_DURATION - 1.5)) / 1.5)
    : 1;

  if (elapsed < PHASE1_END) {
    // Phase 1: Rain fall — full viewport coverage
    boxes.forEach((box) => {
      const ud = box.userData;
      const speed = ud.fallSpeed * (1 + bassNorm * 0.5);
      box.position.y -= speed * deltaTime;
      box.position.x += ud.drift * deltaTime;
      box.rotation.x += ud.rotSpeed * deltaTime;
      box.rotation.z += ud.rotSpeed * 0.5 * deltaTime;

      // Reset when fallen below view
      if (box.position.y < -40) {
        box.position.y = 40 + Math.random() * 15;
        box.position.x = (Math.random() - 0.5) * 80;
      }

      updateChristmasLights(box, elapsed, bassNorm, fadeFactor);
    });
  } else {
    // Phase 2: Morph to browser window
    const morphProgress = Math.min((elapsed - PHASE1_END) / (TOTAL_DURATION - PHASE1_END), 1);
    const ease = morphProgress * morphProgress * (3 - 2 * morphProgress);

    boxes.forEach((box, i) => {
      const target = browserTargets[i % browserTargets.length];
      // Snappy convergence
      box.position.lerp(target, ease * 0.15);
      box.rotation.x *= 0.93;
      box.rotation.z *= 0.93;
      box.rotation.y *= 0.93;

      // Flatten to 2D plane
      box.position.z *= (1 - ease * 0.15);

      // Shrink boxes to ~half size so they don't overlap in the outline
      const targetScale = 0.5;
      box.scale.setScalar(THREE.MathUtils.lerp(box.scale.x, targetScale, ease * 0.12));

      updateChristmasLights(box, elapsed, bassNorm, fadeFactor);
    });
  }
}

export function deactivate() {
  isActive = false;
  if (group) {
    group.visible = false;
    scene.remove(group);
  }
  boxes.forEach((box) => {
    box.material.opacity = 1;
  });
}

export function destroy() {
  deactivate();
  boxes.forEach((box) => {
    box.geometry.dispose();
    box.material.dispose();
  });
  boxes = [];
  group = null;
}
