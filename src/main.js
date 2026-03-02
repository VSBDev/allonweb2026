/**
 * Todo en Web - Main Entry Point
 * MWC Talent Arena 2026
 */

import { initVisualizer, startVisualizer, stopVisualizer } from './audio/visualizer.js';
import { initWin95Desktop, updateWin95Desktop, destroyWin95Desktop, explodeBrickWall } from './visualizers/win95-desktop.js';
import { initLyrics, updateLyrics } from './lyrics/lyrics-display.js';
import { initSlides } from './slides/slides.js';
import { initDebugPanel, updateDebugPanel, isDebugMode, setVisualizerState } from './debug/debug-panel.js';

// State
let currentScreen = 'start';
let currentVisualizer = 'win95'; // 'win95' or 'webgl'
let audioElement = null;
let audioContext = null;
let sourceNode = null;
let animationId = null;
let win95Initialized = false;
let experienceStarted = false;
let slidesInitialized = false;
let presentationLockedOnSlides = false;

// Time to switch from Win95 to WebGL visualizer (switches behind brick wall before explosion)
const VISUALIZER_SWITCH_TIME = 44.0;

// Time to explode the brick wall (when "momento" ends)
const BRICK_WALL_EXPLODE_TIME = 46.62;
let brickWallExploded = false;

// DOM Elements
const screens = {
  start: document.getElementById('start-screen'),
  transition: document.getElementById('transition-screen'),
  win95: document.getElementById('win95-screen'),
  visualizer: document.getElementById('visualizer-screen'),
  slides: document.getElementById('slides-screen')
};

const startBtn = document.getElementById('start-btn');

// Code snippets for the flying animation
const codeSnippets = [
  // HTML (old to new)
  { text: '<table>', type: 'html' },
  { text: '<font color="blue">', type: 'html' },
  { text: '<marquee>', type: 'html' },
  { text: '<center>', type: 'html' },
  { text: '<div>', type: 'html' },
  { text: '<section>', type: 'html' },
  { text: '<article>', type: 'html' },
  { text: '<header>', type: 'html' },
  { text: '<canvas>', type: 'html' },
  // CSS
  { text: 'display: flex;', type: 'css' },
  { text: 'grid-template:', type: 'css' },
  { text: '@keyframes', type: 'css' },
  { text: 'transform: rotate3d()', type: 'css' },
  { text: 'backdrop-filter:', type: 'css' },
  { text: ':has()', type: 'css' },
  { text: '@container', type: 'css' },
  { text: 'view-transition:', type: 'css' },
  // JS
  { text: 'async/await', type: 'js' },
  { text: 'import { }', type: 'js' },
  { text: 'const =>  { }', type: 'js' },
  { text: 'Promise.all()', type: 'js' },
  // Modern APIs
  { text: 'WebGL', type: 'api' },
  { text: 'Web Audio API', type: 'api' },
  { text: 'WebGPU', type: 'api' },
  { text: 'Web Workers', type: 'api' },
  { text: 'Service Worker', type: 'api' },
  // Modern features
  { text: 'PWA', type: 'modern' },
  { text: 'ES2026', type: 'modern' },
  { text: 'WebAssembly', type: 'modern' },
  { text: 'View Transitions', type: 'modern' },
];

// Tech items to show during loading
const techItems = [
  'Loading CSS3 Animations...',
  'Initializing WebGL...',
  'Connecting Web Audio API...',
  'Enabling ES Modules...',
  'Activating View Transitions...',
  'Ready!'
];

/**
 * Switch between screens
 */
function showScreen(screenName) {
  // Once we enter slides, never auto-navigate back into video flow.
  if (presentationLockedOnSlides && screenName !== 'slides') {
    return;
  }

  Object.values(screens).forEach(screen => screen?.classList.remove('active'));
  screens[screenName]?.classList.add('active');
  currentScreen = screenName;

  // Toggle lyrics containers based on screen
  const lyricsWin95 = document.getElementById('lyrics-container-win95');
  const lyricsWebGL = document.getElementById('lyrics-container-webgl');

  if (lyricsWin95) {
    lyricsWin95.classList.toggle('active', screenName === 'win95');
  }
  if (lyricsWebGL) {
    lyricsWebGL.classList.toggle('active', screenName === 'visualizer');
  }
}

function freezeMediaForSlides() {
  cancelAnimationFrame(animationId);
  animationId = null;

  stopVisualizer();

  if (audioElement) {
    audioElement.pause();
    // Reset timeline so nothing can continue "in the background".
    audioElement.currentTime = 0;
    audioElement.removeEventListener('ended', onAudioEnd);
  }

  if (dialupAudio) {
    dialupAudio.pause();
    dialupAudio.currentTime = 0;
  }
}

/**
 * Create flying code elements - Hyperspace style
 */
function createCodeRain() {
  const container = document.getElementById('code-rain');
  if (!container) return;

  container.innerHTML = '';

  // Create multiple waves of code elements coming from center
  for (let wave = 0; wave < 4; wave++) {
    setTimeout(() => {
      codeSnippets.forEach((snippet, i) => {
        setTimeout(() => {
          const el = document.createElement('div');
          el.className = `code-element ${snippet.type}`;
          el.textContent = snippet.text;

          // Calculate angle for radial distribution (hyperspace effect)
          const angle = (Math.random() * Math.PI * 2);
          const distance = 30 + Math.random() * 50; // Starting distance from center

          // Offset from center - elements will fly outward from here
          const offsetX = Math.cos(angle) * distance;
          const offsetY = Math.sin(angle) * distance;

          el.style.setProperty('--offset-x', `${offsetX}px`);
          el.style.setProperty('--offset-y', `${offsetY}px`);
          el.style.animationDelay = `${Math.random() * 0.8}s`;
          el.style.animationDuration = `${3 + Math.random() * 2}s`;

          container.appendChild(el);

          // Remove after animation
          setTimeout(() => el.remove(), 6000);
        }, i * 80);
      });
    }, wave * 1200);
  }
}

/**
 * Show tech items progressively
 */
function showTechItems() {
  const container = document.getElementById('tech-list');
  if (!container) return;

  container.innerHTML = '';

  techItems.forEach((item, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'tech-item';
      el.textContent = item;
      el.style.animationDelay = '0s';
      container.appendChild(el);
    }, 800 + i * 800);
  });
}

/**
 * Run the transition sequence (just waits now - animations started in startExperience)
 */
async function runTransition() {
  // Wait for transition to complete - long enough to hear dial-up sound (15s)
  await new Promise(resolve => setTimeout(resolve, 14000));

  // Fade out transition
  screens.transition.classList.add('fade-out');

  // Wait for fade
  await new Promise(resolve => setTimeout(resolve, 1000));
}

/**
 * Main animation loop for visualizer
 */
function visualizerLoop() {
  if (currentScreen !== 'win95' && currentScreen !== 'visualizer') return;

  const currentTime = audioElement?.currentTime || 0;

  // Check if we should switch visualizers based on current time
  if (currentTime >= VISUALIZER_SWITCH_TIME && currentVisualizer === 'win95') {
    switchToWebGL();
  } else if (currentTime < VISUALIZER_SWITCH_TIME && currentVisualizer === 'webgl') {
    // Scrubbed back - switch to Win95
    switchToWin95();
  }

  // Update the active visualizer
  if (currentVisualizer === 'win95') {
    updateWin95Desktop();
  } else {
    startVisualizer(currentTime);
  }

  // Update lyrics (handles both screens)
  updateLyrics(currentTime);

  // Trigger brick wall explosion when "momento" ends
  if (currentTime >= BRICK_WALL_EXPLODE_TIME && !brickWallExploded) {
    explodeBrickWall();
    brickWallExploded = true;
  } else if (currentTime < VISUALIZER_SWITCH_TIME && brickWallExploded) {
    // Reset if scrubbed back before the switch
    brickWallExploded = false;
  }

  // Update debug panel if enabled
  updateDebugPanel();

  animationId = requestAnimationFrame(visualizerLoop);
}

/**
 * Switch from Win95 to WebGL visualizer
 */
function switchToWebGL() {
  if (currentVisualizer === 'webgl') return;
  currentVisualizer = 'webgl';
  setVisualizerState('webgl');

  // Instant switch - brick wall hides the transition
  showScreen('visualizer');
  destroyWin95Desktop();
  win95Initialized = false;
}

/**
 * Switch from WebGL back to Win95 visualizer (for timeline scrubbing)
 */
function switchToWin95() {
  if (currentVisualizer === 'win95') return;
  currentVisualizer = 'win95';
  setVisualizerState('win95');

  // Re-initialize Win95 desktop if needed
  if (!win95Initialized) {
    const win95Container = document.getElementById('win95-container');
    initWin95Desktop(win95Container, audioContext, sourceNode, audioElement);
    win95Initialized = true;
  }

  // Switch screens
  screens.visualizer.classList.add('fade-out-visualizer');

  setTimeout(() => {
    showScreen('win95');
    screens.visualizer.classList.remove('fade-out-visualizer');
  }, 300);
}

/**
 * Handle audio end - transition to slides
 */
function onAudioEnd() {
  if (currentScreen === 'slides') return;

  presentationLockedOnSlides = true;
  freezeMediaForSlides();
  showScreen('slides');
  if (!slidesInitialized) {
    initSlides();
    slidesInitialized = true;
  }
}

/**
 * Jump to next step in the experience (Space key)
 * Flow: start → transition → win95 → webgl → slides
 */
function jumpToNextStep() {
  switch (currentScreen) {
    case 'start':
      // Trigger the start button
      startExperience();
      break;

    case 'transition':
      // Skip transition, go to win95
      if (dialupAudio) {
        dialupAudio.pause();
        dialupAudio.currentTime = 0;
      }
      screens.transition.classList.add('fade-out');
      setTimeout(() => {
        showScreen('win95');
        currentVisualizer = 'win95';
        setVisualizerState('win95');
        if (audioElement) {
          audioElement.play().catch(e => console.log('Audio play failed:', e));
          visualizerLoop();
        }
      }, 300);
      break;

    case 'win95':
      // Jump to WebGL visualizer
      if (audioElement) {
        audioElement.currentTime = VISUALIZER_SWITCH_TIME;
      }
      switchToWebGL();
      break;

    case 'visualizer':
      // Jump to slides
      audioElement?.pause();
      onAudioEnd();
      break;

    case 'slides':
      // Already at the end, do nothing
      break;
  }

  console.log(`⏭️ Jumped to: ${currentScreen}`);
}

/**
 * Start the experience
 */
async function startExperience() {
  // Prevent accidental re-entry from hidden/focused controls or repeated key events.
  if (experienceStarted || currentScreen !== 'start') {
    return;
  }
  experienceStarted = true;
  if (startBtn) startBtn.disabled = true;

  // Play dial-up sound IMMEDIATELY on click
  if (dialupAudio) {
    dialupAudio.currentTime = 0;
    dialupAudio.volume = 0.7;
    dialupAudio.play().catch(e => console.log('Dialup audio failed:', e));

    // Monitor audio time and fade out after 15 seconds of actual playback
    const checkTime = setInterval(() => {
      if (dialupAudio.currentTime >= 15) {
        // Start fading
        const fadeOut = setInterval(() => {
          if (dialupAudio.volume > 0.1) {
            dialupAudio.volume -= 0.1;
          } else {
            dialupAudio.pause();
            dialupAudio.currentTime = 0;
            dialupAudio.volume = 0.7;
            clearInterval(fadeOut);
          }
        }, 80);
        clearInterval(checkTime);
      }
    }, 100);
  }

  // Show transition
  showScreen('transition');
  createCodeRain();
  showTechItems();

  audioElement = document.getElementById('audio');
  if (audioElement && !audioElement.dataset.slidesLockGuard) {
    audioElement.dataset.slidesLockGuard = 'true';
    audioElement.addEventListener('play', () => {
      if (!presentationLockedOnSlides) return;
      audioElement.pause();
      audioElement.currentTime = 0;
    });
  }

  // Initialize debug panel if ?debug=true
  initDebugPanel(audioElement);

  // DEFER heavy work to let audio actually start playing
  await new Promise(resolve => setTimeout(resolve, 100));

  // Create audio context for Win95 visualizer
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  sourceNode = audioContext.createMediaElementSource(audioElement);
  sourceNode.connect(audioContext.destination);

  // Initialize Win95 desktop visualizer
  const win95Container = document.getElementById('win95-container');
  initWin95Desktop(win95Container, audioContext, sourceNode, audioElement);
  win95Initialized = true;

  // Initialize WebGL visualizer (will be used later) - pass shared audio context
  const canvas = document.getElementById('visualizer-canvas');
  const initPromise = initVisualizer(canvas, audioElement, audioContext, sourceNode);

  // Run the transition animation
  await runTransition();

  // Make sure WebGL visualizer is ready
  await initPromise;

  // Initialize lyrics for both screens
  initLyrics();

  // Start with Win95 screen
  currentVisualizer = 'win95';
  showScreen('win95');

  // Start audio
  try {
    await audioElement.play();
    visualizerLoop();
  } catch (err) {
    console.error('Audio playback failed:', err);
  }

  // Listen for audio end
  audioElement.addEventListener('ended', onAudioEnd);
}

// Preloaded dial-up audio
let dialupAudio = null;

function init() {
  const params = new URLSearchParams(window.location.search);
  const showIntro = params.get('intro') === 'true';

  if (!showIntro) {
    // Jump directly to slides if intro=true is NOT in URL
    presentationLockedOnSlides = true;
    showScreen('slides');
    if (!slidesInitialized) {
      initSlides();
      slidesInitialized = true;
    }
  } else {
    // Normal intro flow
    currentScreen = 'start';
    showScreen('start');
  }

  dialupAudio = document.getElementById('dialup-audio');

  if (startBtn) {
    startBtn.addEventListener('click', startExperience);
  }

  document.addEventListener('keydown', (e) => {
    // Only intercept space bar for navigation if not on slides
    // and not typing in an input
    if (e.code === 'Space' && !presentationLockedOnSlides) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      e.preventDefault();
      jumpToNextStep();
    }
  });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
