/**
 * Audio Visualizer - Three.js WebGL Version
 * Dramatic 3D visualization for "Todo en Web"
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
  initEffects,
  updateEffects,
  getBaseDimFactor,
  getPrimarySceneKey,
  isCameraControlledByEffect,
  destroyEffects
} from '../visualizers/effect-manager.js';

// Audio analysis
let audioContext = null;
let analyser = null;
let dataArray = null;

// Three.js
let scene = null;
let terrainWaveScene = null;
let terrainSpheresScene = null;
let effectsScene = null;
let camera = null;
let renderer = null;
let composer = null;
let primaryPass = null;

// Visual elements
let centralSphere = null;
let particles = null;
let bars = [];
let ringMeshes = [];
let barsGroup = null;
let ringsGroup = null;

// Animation state
let isInitialized = false;
let clock = null;

// Settings
const settings = {
  fftSize: 512,
  smoothing: 0.8,
  barCount: 64,
  particleCount: 2000,
  bloomStrength: 1.5,
  bloomRadius: 0.4,
  bloomThreshold: 0.2
};

/**
 * Initialize the visualizer
 * @param {HTMLCanvasElement} canvasElement
 * @param {HTMLAudioElement} audioElement - unused if context/source provided
 * @param {AudioContext} sharedAudioContext - optional shared context
 * @param {MediaElementAudioSourceNode} sharedSourceNode - optional shared source
 */
export async function initVisualizer(canvasElement, audioElement, sharedAudioContext = null, sharedSourceNode = null) {
  // Audio setup - use shared context if provided
  if (sharedAudioContext && sharedSourceNode) {
    audioContext = sharedAudioContext;
    analyser = audioContext.createAnalyser();
    analyser.fftSize = settings.fftSize;
    analyser.smoothingTimeConstant = settings.smoothing;
    sharedSourceNode.connect(analyser);
    // Don't connect to destination - already connected
  } else {
    // Create our own (legacy support)
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = settings.fftSize;
    analyser.smoothingTimeConstant = settings.smoothing;
    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  dataArray = new Uint8Array(analyser.frequencyBinCount);

  // Three.js setup
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.002);
  terrainWaveScene = new THREE.Scene();
  terrainWaveScene.fog = new THREE.FogExp2(0x0a0a0f, 0.002);
  terrainSpheresScene = new THREE.Scene();
  terrainSpheresScene.fog = new THREE.FogExp2(0x0a0a0f, 0.002);
  effectsScene = new THREE.Scene();
  effectsScene.fog = new THREE.FogExp2(0x0a0a0f, 0.002);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 50;

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasElement,
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  // Post-processing
  composer = new EffectComposer(renderer);
  primaryPass = new RenderPass(scene, camera);
  composer.addPass(primaryPass);

  // Effects render in a separate scene so effect state is isolated from base visualizer state.
  const effectsPass = new RenderPass(effectsScene, camera);
  effectsPass.clear = false;
  effectsPass.clearDepth = true;
  composer.addPass(effectsPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    settings.bloomStrength,
    settings.bloomRadius,
    settings.bloomThreshold
  );
  composer.addPass(bloomPass);

  // Create visual elements
  createCentralSphere();
  createParticles();
  createBars();
  createRings();
  createLights();

  // Handle resize
  window.addEventListener('resize', onResize);

  // Initialize lyric-synced effects
  await initEffects(
    {
      base: scene,
      effects: effectsScene,
      terrainWave: terrainWaveScene,
      terrainSpheres: terrainSpheresScene
    },
    camera,
    particles
  );

  isInitialized = true;
}

/**
 * Create the central reactive sphere
 */
function createCentralSphere() {
  const geometry = new THREE.IcosahedronGeometry(10, 4);

  const material = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    emissive: 0x4338ca,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.2,
    wireframe: true
  });

  centralSphere = new THREE.Mesh(geometry, material);
  scene.add(centralSphere);

  // Inner solid sphere
  const innerGeometry = new THREE.IcosahedronGeometry(8, 3);
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b5cf6,
    emissive: 0x7c3aed,
    emissiveIntensity: 0.3,
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.6
  });

  const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
  centralSphere.add(innerSphere);
}

/**
 * Create floating particles
 */
function createParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(settings.particleCount * 3);
  const colors = new Float32Array(settings.particleCount * 3);
  const sizes = new Float32Array(settings.particleCount);

  for (let i = 0; i < settings.particleCount; i++) {
    // Spherical distribution
    const radius = 20 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Purple/blue gradient colors
    const color = new THREE.Color();
    color.setHSL(0.7 + Math.random() * 0.1, 0.8, 0.5 + Math.random() * 0.3);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 2 + 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

/**
 * Create frequency bars in a circle (inside a rotating group)
 */
function createBars() {
  barsGroup = new THREE.Group();
  const barGeometry = new THREE.BoxGeometry(1, 1, 1);

  for (let i = 0; i < settings.barCount; i++) {
    const hue = 0.65 + (i / settings.barCount) * 0.15;
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.8, 0.5),
      emissive: new THREE.Color().setHSL(hue, 0.9, 0.3),
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.3
    });

    const bar = new THREE.Mesh(barGeometry, material);

    // Position in circle
    const angle = (i / settings.barCount) * Math.PI * 2;
    const radius = 25;
    bar.position.x = Math.cos(angle) * radius;
    bar.position.z = Math.sin(angle) * radius;
    bar.rotation.y = -angle;

    bars.push(bar);
    barsGroup.add(bar);
  }

  scene.add(barsGroup);
}

/**
 * Create pulsing rings (inside a rotating group)
 */
function createRings() {
  ringsGroup = new THREE.Group();

  for (let i = 0; i < 3; i++) {
    const geometry = new THREE.RingGeometry(15 + i * 8, 15.5 + i * 8, 64);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.7, 0.8, 0.5),
      transparent: true,
      opacity: 0.3 - i * 0.08,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2;
    ringMeshes.push(ring);
    ringsGroup.add(ring);
  }

  scene.add(ringsGroup);
}

/**
 * Create scene lights
 */
function createLights() {
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const pointLight1 = new THREE.PointLight(0x6366f1, 2, 100);
  pointLight1.position.set(20, 20, 20);
  scene.add(pointLight1);

  const pointLight2 = new THREE.PointLight(0xa855f7, 2, 100);
  pointLight2.position.set(-20, -20, 20);
  scene.add(pointLight2);

  const pointLight3 = new THREE.PointLight(0x3b82f6, 1.5, 100);
  pointLight3.position.set(0, 30, -20);
  scene.add(pointLight3);
}

/**
 * Handle window resize
 */
function onResize() {
  if (!camera || !renderer || !composer) return;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Render a single frame
 * @param {number} songTime - current audio playback time in seconds
 */
export function startVisualizer(songTime = 0) {
  if (!isInitialized) return;

  // Get audio data
  analyser.getByteFrequencyData(dataArray);

  const deltaTime = clock.getDelta();
  const time = clock.elapsedTime;

  // Calculate audio metrics
  const bass = getFrequencyRange(0, 10);
  const mid = getFrequencyRange(10, 100);
  const treble = getFrequencyRange(100, 200);
  const average = (bass + mid + treble) / 3;

  // Update lyric-synced effects
  const audioData = { bass, mid, treble, dataArray };
  updateEffects(audioData, songTime, deltaTime);
  const dimFactor = getBaseDimFactor();
  const primarySceneKey = getPrimarySceneKey();

  if (primaryPass) {
    switch (primarySceneKey) {
      case 'terrainWave':
        primaryPass.scene = terrainWaveScene;
        break;
      case 'terrainSpheres':
        primaryPass.scene = terrainSpheresScene;
        break;
      default:
        primaryPass.scene = scene;
        break;
    }
  }

  // Color cycling - slowly shift through neon colors over time
  // Full hue cycle every 30 seconds
  const baseHue = (time * 0.033) % 1; // 0-1 hue value cycling

  // Animate central sphere with color shift
  if (centralSphere) {
    const scale = (1 + (bass / 255) * 0.5) * dimFactor;
    centralSphere.scale.setScalar(Math.max(scale, 0.01));
    centralSphere.rotation.x = time * 0.2;
    centralSphere.rotation.y = time * 0.3;

    // Update sphere color
    centralSphere.material.color.setHSL(baseHue, 0.9, 0.5);
    centralSphere.material.emissive.setHSL(baseHue, 0.9, 0.3);
    centralSphere.material.emissiveIntensity = (0.3 + (bass / 255) * 0.7) * dimFactor;

    // Inner sphere color (slightly offset hue)
    if (centralSphere.children[0]) {
      centralSphere.children[0].material.color.setHSL((baseHue + 0.1) % 1, 0.9, 0.5);
      centralSphere.children[0].material.emissive.setHSL((baseHue + 0.1) % 1, 0.9, 0.3);
      centralSphere.children[0].material.opacity = 0.6 * dimFactor;
    }
  }

  // Rotate bars group around the sphere (vertical spin - up to down)
  if (barsGroup) {
    barsGroup.rotation.x = time * 0.15;
    barsGroup.rotation.y = Math.sin(time * 0.1) * 0.1;
  }

  // Animate individual bars (height and color based on frequency)
  bars.forEach((bar, i) => {
    const dataIndex = Math.floor((i / bars.length) * dataArray.length);
    const value = dataArray[dataIndex];
    const height = (1 + (value / 255) * 15) * dimFactor;

    bar.scale.y = Math.max(height, 0.01);
    bar.position.y = height / 2;

    // Color shift for each bar - spread across hue range with base shift
    const barHue = (baseHue + (i / bars.length) * 0.3) % 1;
    bar.material.color.setHSL(barHue, 0.9, 0.5);
    bar.material.emissive.setHSL(barHue, 0.9, 0.3);
    bar.material.emissiveIntensity = (0.3 + (value / 255) * 0.7) * dimFactor;
  });

  // Animate particles with color shift (update colors periodically for performance)
  if (particles) {
    particles.rotation.y = time * 0.05;
    particles.rotation.x = Math.sin(time * 0.1) * 0.1;

    // Pulse particle size with bass
    particles.material.size = (0.5 + (bass / 255) * 1) * dimFactor;
    particles.material.opacity = 0.8 * dimFactor;

    // Update particle colors every ~0.5 seconds for performance
    if (Math.floor(time * 2) !== Math.floor((time - 0.016) * 2)) {
      const particleColors = particles.geometry.attributes.color;
      for (let i = 0; i < particleColors.count; i++) {
        const particleHue = (baseHue + (i / particleColors.count) * 0.5) % 1;
        const color = new THREE.Color().setHSL(particleHue, 0.8, 0.6);
        particleColors.setXYZ(i, color.r, color.g, color.b);
      }
      particleColors.needsUpdate = true;
    }
  }

  // Rotate rings group around the sphere (different axis than bars)
  if (ringsGroup) {
    ringsGroup.rotation.y = time * -0.1;
    ringsGroup.rotation.z = time * 0.08;
  }

  // Animate individual rings (scale, opacity, and color based on audio)
  ringMeshes.forEach((ring, i) => {
    ring.scale.setScalar(1 + (bass / 255) * 0.3);
    ring.rotation.z = time * (0.1 + i * 0.05);
    ring.material.opacity = (0.3 - i * 0.08) * (0.5 + average / 255) * dimFactor;

    // Color shift for rings - offset from base hue
    const ringHue = (baseHue + 0.5 + i * 0.1) % 1; // Complementary colors
    ring.material.color.setHSL(ringHue, 0.9, 0.6);
  });

  // Default camera movement only when no active effect owns the camera.
  if (!isCameraControlledByEffect()) {
    camera.position.x = Math.sin(time * 0.1) * 5;
    camera.position.y = Math.cos(time * 0.15) * 3;
    camera.lookAt(0, 0, 0);
  }

  // Render with post-processing
  composer.render();
}

/**
 * Get average value for a frequency range
 */
function getFrequencyRange(start, end) {
  let sum = 0;
  const count = Math.min(end, dataArray.length) - start;
  for (let i = start; i < Math.min(end, dataArray.length); i++) {
    sum += dataArray[i];
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Stop visualization
 */
export function stopVisualizer() {
  destroyEffects();
}

/**
 * Get current audio data for external use
 */
export function getAudioData() {
  if (!analyser || !dataArray) return null;
  analyser.getByteFrequencyData(dataArray);
  return {
    frequencies: Array.from(dataArray),
    bass: getFrequencyRange(0, 10),
    mid: getFrequencyRange(10, 100),
    treble: getFrequencyRange(100, 200)
  };
}
