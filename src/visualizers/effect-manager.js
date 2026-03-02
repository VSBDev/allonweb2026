/**
 * Effect Manager - Timeline coordinator for lyric-synced WebGL effects
 * Follows the handleTimedEvents pattern from win95-desktop.js
 */

import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import * as AppRainEffect from './effects/app-rain-morph.js';
import * as WarpTunnelEffect from './effects/warp-tunnel.js';
import * as Particle2026Effect from './effects/particle-2026.js';
import * as TerrainWaveEffect from './effects/terrain-wave.js';
import * as TerrainSpheresEffect from './effects/terrain-spheres.js';

const FONT_URL = 'https://esm.sh/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json';
const BASE_SCENE_KEY = 'base';
const EFFECTS_SCENE_KEY = 'effects';
const TERRAIN_WAVE_SCENE_KEY = 'terrainWave';
const TERRAIN_SPHERES_SCENE_KEY = 'terrainSpheres';

/**
 * Effect timeline - each effect has one or more time windows
 * dimBase: how much to dim base scene elements (0 = no dim, 1 = fully hidden)
 *
 * Timeline (WebGL phase 44s-227s):
 *   46.6-53.5   Chorus 1 "TODO EN WEB"
 *   53.5-82.6   Terrain Wave (fills gap before app rain)
 *   82.6-96.8   App Rain → Browser Morph
 *   96.8-119.0  Terrain Spheres (fills gap before warp)
 *   119.0-125.5 Warp Tunnel
 *   125.5-132.5 Chorus 2 "TODO EN WEB"
 *   132.5-165.0 Terrain Wave (long middle section)
 *   165.0-187.9 Terrain Spheres (second half of middle gap)
 *   187.9-195.0 Chorus 3 "TODO EN WEB"
 *   195.0-212.6 Terrain Wave (before 2026)
 *   212.6-222.0 2026 Particle Formation
 */
const EFFECT_TIMELINE = [
  {
    id: 'terrainWave',
    effect: TerrainWaveEffect,
    windows: [
      { start: 53.5, end: 82.6 },    // After chorus 1 → before app rain
      { start: 132.5, end: 165.0 },   // After chorus 2 (long section)
      { start: 195.0, end: 212.58 },  // After final chorus → before 2026
    ],
    sceneKey: TERRAIN_WAVE_SCENE_KEY,
    primarySceneKey: TERRAIN_WAVE_SCENE_KEY,
    dimBase: 0.9,
    controlsCamera: true,
  },
  {
    id: 'appRain',
    effect: AppRainEffect,
    windows: [
      { start: 82.6, end: 96.8 },
    ],
    sceneKey: EFFECTS_SCENE_KEY,
    dimBase: 0.9,
    controlsCamera: false,
  },
  {
    id: 'terrainSpheres',
    effect: TerrainSpheresEffect,
    windows: [
      { start: 96.8, end: 119.0 },   // After app rain → before warp
      { start: 165.0, end: 187.92 },  // Second half of middle gap
    ],
    sceneKey: TERRAIN_SPHERES_SCENE_KEY,
    primarySceneKey: TERRAIN_SPHERES_SCENE_KEY,
    dimBase: 0.9,
    controlsCamera: true,
  },
  {
    id: 'warpTunnel',
    effect: WarpTunnelEffect,
    windows: [
      { start: 119.0, end: 125.54 },
    ],
    sceneKey: EFFECTS_SCENE_KEY,
    dimBase: 0.9,
    controlsCamera: true,
  },
  {
    id: 'particle2026',
    effect: Particle2026Effect,
    windows: [
      { start: 212.58, end: 222.0 }, // Shortened
    ],
    sceneKey: EFFECTS_SCENE_KEY,
    dimBase: 0.85,
    controlsCamera: false,
  },
];

// Track which effects are currently active
const activeEffects = new Set();
let currentDimFactor = 0;
let targetDimFactor = 0;
let cameraControlledByEffect = false;
let currentPrimarySceneKey = BASE_SCENE_KEY;
let initialized = false;

/**
 * Load font and initialize all effects
 */
export async function initEffects(scenes, camera, baseParticles) {
  // Backward-compatible input: if a single scene was passed, use it for all keys.
  const sceneMap = scenes && typeof scenes === 'object' && BASE_SCENE_KEY in scenes
    ? scenes
    : {
      [BASE_SCENE_KEY]: scenes,
      [EFFECTS_SCENE_KEY]: scenes,
      [TERRAIN_WAVE_SCENE_KEY]: scenes,
      [TERRAIN_SPHERES_SCENE_KEY]: scenes
    };

  // Load font
  let font = null;
  try {
    const loader = new FontLoader();
    font = await new Promise((resolve, reject) => {
      loader.load(FONT_URL, resolve, undefined, reject);
    });
  } catch (err) {
    console.warn('Effect manager: font load failed, text effects will be disabled', err);
  }

  const resources = { font, baseParticles };

  // Init all effects
  for (const entry of EFFECT_TIMELINE) {
    const targetScene = sceneMap[entry.sceneKey] || sceneMap[EFFECTS_SCENE_KEY] || sceneMap[BASE_SCENE_KEY];
    try {
      entry.effect.init(targetScene, camera, resources);
    } catch (err) {
      console.warn(`Effect manager: failed to init ${entry.id}`, err);
    }
  }

  currentPrimarySceneKey = BASE_SCENE_KEY;
  initialized = true;
}

/**
 * Update effects based on current song time
 * Handles activation/deactivation on time window boundaries
 */
export function updateEffects(audioData, songTime, deltaTime) {
  if (!initialized) return;

  targetDimFactor = 0;
  cameraControlledByEffect = false;
  let nextPrimarySceneKey = BASE_SCENE_KEY;

  for (const entry of EFFECT_TIMELINE) {
    const { id, effect, windows, dimBase, controlsCamera, primarySceneKey } = entry;

    // Check if songTime falls within any window
    let inWindow = false;
    for (const w of windows) {
      if (songTime >= w.start && songTime < w.end) {
        inWindow = true;
        break;
      }
    }

    if (inWindow && !activeEffects.has(id)) {
      // Activate
      try {
        effect.activate(songTime);
        activeEffects.add(id);
      } catch (err) {
        console.warn(`Effect manager: failed to activate ${id}`, err);
      }
    } else if (!inWindow && activeEffects.has(id)) {
      // Deactivate
      try {
        effect.deactivate();
        activeEffects.delete(id);
      } catch (err) {
        console.warn(`Effect manager: failed to deactivate ${id}`, err);
      }
    }

    // Update if active
    if (activeEffects.has(id)) {
      try {
        effect.update(audioData, songTime, deltaTime);
      } catch (err) {
        console.warn(`Effect manager: failed to update ${id}`, err);
      }
      // Take the max dim factor of all active effects
      targetDimFactor = Math.max(targetDimFactor, dimBase);
      if (controlsCamera) {
        cameraControlledByEffect = true;
      }
      if (primarySceneKey) {
        nextPrimarySceneKey = primarySceneKey;
      }
    }
  }

  currentPrimarySceneKey = nextPrimarySceneKey;

  // Smooth lerp dim factor
  const lerpSpeed = 5 * deltaTime;
  currentDimFactor += (targetDimFactor - currentDimFactor) * Math.min(lerpSpeed, 1);
}

/**
 * Returns 0.0-1.0 multiplier to apply to base scene elements
 * 1.0 = full brightness (no effects active), 0.0 = fully hidden
 */
export function getBaseDimFactor() {
  return 1 - currentDimFactor;
}

/**
 * Whether current active timeline effect owns camera transforms this frame.
 */
export function isCameraControlledByEffect() {
  return cameraControlledByEffect;
}

/**
 * Returns active scene key for primary render pass.
 */
export function getPrimarySceneKey() {
  return currentPrimarySceneKey;
}

/**
 * Clean up all effects
 */
export function destroyEffects() {
  for (const entry of EFFECT_TIMELINE) {
    try {
      if (activeEffects.has(entry.id)) {
        entry.effect.deactivate();
      }
      entry.effect.destroy();
    } catch (err) {
      console.warn(`Effect manager: failed to destroy ${entry.id}`, err);
    }
  }
  activeEffects.clear();
  currentDimFactor = 0;
  targetDimFactor = 0;
  cameraControlledByEffect = false;
  currentPrimarySceneKey = BASE_SCENE_KEY;
  initialized = false;
}
