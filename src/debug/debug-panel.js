/**
 * Debug Panel
 * Enabled via ?debug=true URL parameter
 * Provides volume control, timeline scrubbing, and timing info
 */

let audioElement = null;
let panelElement = null;
let isEnabled = false;

// Check if debug mode is enabled
export function isDebugMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get('debug') === 'true';
}

/**
 * Initialize debug panel
 */
export function initDebugPanel(audio) {
  if (!isDebugMode()) return;

  isEnabled = true;
  audioElement = audio;

  createPanel();
  setupEventListeners();

  console.log('🔧 Debug mode enabled');
}

/**
 * Create the debug panel DOM
 */
function createPanel() {
  panelElement = document.createElement('div');
  panelElement.id = 'debug-panel';
  panelElement.innerHTML = `
    <div class="debug-header">
      <span>🔧 Debug Panel</span>
      <button id="debug-toggle">_</button>
    </div>
    <div class="debug-content">
      <div class="debug-row">
        <label>Time</label>
        <span id="debug-time">0:00.000</span>
        <button id="debug-copy-time" title="Copy timestamp">📋</button>
      </div>

      <div class="debug-row">
        <label>Visualizer</label>
        <span id="debug-visualizer">win95</span>
        <span id="debug-switch-time">(switch @ 46s)</span>
      </div>

      <div class="debug-row">
        <label>Timeline</label>
        <input type="range" id="debug-timeline" min="0" max="100" value="0" step="0.1">
      </div>

      <div class="debug-row">
        <label>Volume</label>
        <input type="range" id="debug-volume" min="0" max="1" value="1" step="0.01">
        <span id="debug-volume-value">100%</span>
      </div>

      <div class="debug-row">
        <label>Playback</label>
        <button id="debug-play">▶️</button>
        <button id="debug-pause">⏸️</button>
        <button id="debug-back5">-5s</button>
        <button id="debug-forward5">+5s</button>
      </div>

      <div class="debug-row">
        <label>Speed</label>
        <select id="debug-speed">
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1" selected>1x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>

      <div class="debug-row">
        <label>Markers</label>
        <button id="debug-add-marker">+ Add Marker</button>
      </div>

      <div id="debug-markers"></div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #debug-panel {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid #6366f1;
      border-radius: 8px;
      padding: 0;
      z-index: 10000;
      font-family: monospace;
      font-size: 12px;
      color: #fff;
      min-width: 280px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    .debug-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #6366f1;
      border-radius: 7px 7px 0 0;
      cursor: move;
    }

    .debug-header button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 14px;
    }

    .debug-content {
      padding: 12px;
    }

    .debug-content.collapsed {
      display: none;
    }

    .debug-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .debug-row label {
      width: 60px;
      color: #a5b4fc;
    }

    .debug-row input[type="range"] {
      flex: 1;
      accent-color: #6366f1;
    }

    .debug-row button {
      background: #1e1e2e;
      border: 1px solid #6366f1;
      color: #fff;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }

    .debug-row button:hover {
      background: #6366f1;
    }

    .debug-row select {
      background: #1e1e2e;
      border: 1px solid #6366f1;
      color: #fff;
      padding: 4px;
      border-radius: 4px;
    }

    #debug-time {
      font-size: 16px;
      font-weight: bold;
      color: #22c55e;
      font-variant-numeric: tabular-nums;
    }

    #debug-visualizer {
      font-weight: bold;
      text-transform: uppercase;
    }

    #debug-switch-time {
      font-size: 10px;
      color: #666;
    }

    #debug-markers {
      max-height: 150px;
      overflow-y: auto;
    }

    .debug-marker {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      background: #1e1e2e;
      border-radius: 4px;
      margin-bottom: 4px;
    }

    .debug-marker button {
      padding: 2px 6px;
    }

    .debug-marker span {
      flex: 1;
      color: #a5b4fc;
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(panelElement);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Toggle panel collapse
  document.getElementById('debug-toggle').addEventListener('click', () => {
    const content = panelElement.querySelector('.debug-content');
    content.classList.toggle('collapsed');
  });

  // Timeline scrubbing
  const timeline = document.getElementById('debug-timeline');
  timeline.addEventListener('input', (e) => {
    if (audioElement && audioElement.duration) {
      const time = (e.target.value / 100) * audioElement.duration;
      audioElement.currentTime = time;
    }
  });

  // Volume control
  const volume = document.getElementById('debug-volume');
  const volumeValue = document.getElementById('debug-volume-value');
  volume.addEventListener('input', (e) => {
    if (audioElement) {
      audioElement.volume = e.target.value;
      volumeValue.textContent = Math.round(e.target.value * 100) + '%';
    }
  });

  // Playback controls
  document.getElementById('debug-play').addEventListener('click', () => {
    audioElement?.play();
  });

  document.getElementById('debug-pause').addEventListener('click', () => {
    audioElement?.pause();
  });

  document.getElementById('debug-back5').addEventListener('click', () => {
    if (audioElement) {
      audioElement.currentTime = Math.max(0, audioElement.currentTime - 5);
    }
  });

  document.getElementById('debug-forward5').addEventListener('click', () => {
    if (audioElement) {
      audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 5);
    }
  });

  // Playback speed
  document.getElementById('debug-speed').addEventListener('change', (e) => {
    if (audioElement) {
      audioElement.playbackRate = parseFloat(e.target.value);
    }
  });

  // Copy timestamp
  document.getElementById('debug-copy-time').addEventListener('click', () => {
    const time = audioElement?.currentTime || 0;
    const formatted = `{ time: ${time.toFixed(2)}, text: "" },`;
    navigator.clipboard.writeText(formatted);
    console.log('Copied:', formatted);
  });

  // Add marker
  document.getElementById('debug-add-marker').addEventListener('click', () => {
    addMarker(audioElement?.currentTime || 0);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (!isEnabled || e.target.tagName === 'INPUT') return;

    switch (e.key) {
      case 'm':
      case 'M':
        addMarker(audioElement?.currentTime || 0);
        break;
      case 'c':
      case 'C':
        if (e.ctrlKey || e.metaKey) return; // Don't interfere with copy
        const time = audioElement?.currentTime || 0;
        navigator.clipboard.writeText(`{ time: ${time.toFixed(2)}, text: "" },`);
        console.log('Copied timestamp:', time.toFixed(2));
        break;
    }
  });
}

/**
 * Add a time marker
 */
const markers = [];
function addMarker(time) {
  markers.push(time);
  markers.sort((a, b) => a - b);
  renderMarkers();
  console.log('Marker added:', formatTime(time));
}

/**
 * Render markers list
 */
function renderMarkers() {
  const container = document.getElementById('debug-markers');
  container.innerHTML = markers.map((time, i) => `
    <div class="debug-marker">
      <button data-goto="${time}">→</button>
      <span>${formatTime(time)}</span>
      <button data-remove="${i}">×</button>
    </div>
  `).join('');

  // Add event listeners for marker buttons
  container.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (audioElement) {
        audioElement.currentTime = parseFloat(btn.dataset.goto);
      }
    });
  });

  container.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      markers.splice(parseInt(btn.dataset.remove), 1);
      renderMarkers();
    });
  });
}

// Current visualizer state (set externally)
let currentVisualizerState = 'win95';

/**
 * Set current visualizer state for display
 */
export function setVisualizerState(state) {
  currentVisualizerState = state;
}

/**
 * Update debug panel (call in animation loop)
 */
export function updateDebugPanel() {
  if (!isEnabled || !audioElement) return;

  const timeDisplay = document.getElementById('debug-time');
  const timeline = document.getElementById('debug-timeline');
  const vizDisplay = document.getElementById('debug-visualizer');

  if (timeDisplay && audioElement.currentTime !== undefined) {
    timeDisplay.textContent = formatTime(audioElement.currentTime);
  }

  if (timeline && audioElement.duration) {
    timeline.value = (audioElement.currentTime / audioElement.duration) * 100;
    timeline.max = 100;
  }

  if (vizDisplay) {
    vizDisplay.textContent = currentVisualizerState;
    vizDisplay.style.color = currentVisualizerState === 'win95' ? '#00ff00' : '#ff66ff';
  }
}

/**
 * Format time as M:SS.mmm
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
