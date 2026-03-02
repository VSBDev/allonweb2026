export default {
  id: 'demo-audio-canvas',
  type: 'demo-editor',
  previewSandbox: false,
  title: 'Lab 1: The Core Engine',
  subtitle: 'High-performance audio with Web Audio + MIDI',
  description: 'Implement the polyphonic signal path for Vortex Studio. The UI keyboard and MIDI listeners are pre-wired to yours playNote/stopNote functions.',
  solution: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>STUDIO</span></div>
    <div class="status-badge" id="midi-status">MIDI: READY</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel viz-container">
      <div id="glow"></div>
      <canvas id="viz" width="800" height="300"></canvas>
    </div>
    
    <div class="v-panel controls">
      <div class="knob-group">
        <label>MASTER GAIN</label>
        <input id="volume" type="range" min="0" max="1" value="0.5" step="0.01">
      </div>
      <div class="knob-group">
        <label>OSCILLATOR</label>
        <select id="wave">
          <option value="sine">Pure Sine</option>
          <option value="square">Retro Square</option>
          <option value="sawtooth" selected>Sharp Saw</option>
          <option value="triangle">Soft Triangle</option>
        </select>
      </div>
      <button id="init-btn" class="primary-btn">INITIALIZE ENGINE</button>
    </div>
  </div>

  <div class="v-panel keyboard-panel">
    <div id="keyboard" class="keyboard"></div>
  </div>
  
  <pre id="log">Vortex Engine Online.</pre>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: #090d14;
  color: #edf3ff;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.vortex-app {
  box-sizing: border-box;
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 15px;
}

.logo { font-weight: 800; letter-spacing: 2px; font-size: 20px; }
.logo span { color: #6366f1; opacity: 0.8; }

.status-badge {
  font-size: 10px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 20px;
  flex: 1;
}

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.viz-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

#glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(99, 102, 241, 0.15), transparent 70%);
  pointer-events: none;
}

canvas { width: 100%; height: 100%; object-fit: contain; }

.controls { display: flex; flex-direction: column; gap: 20px; }

.knob-group label { display: block; font-size: 10px; font-weight: 700; color: rgba(255, 255, 255, 0.5); margin-bottom: 8px; }

select, input[type="range"] {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 10px;
  border-radius: 8px;
  outline: none;
}

.primary-btn {
  margin-top: auto;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border: 0;
  padding: 16px;
  border-radius: 12px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.keyboard-panel { padding: 10px; }
.keyboard {
  display: flex;
  height: 120px;
  width: 100%;
  gap: 2px;
}

.key {
  flex: 1;
  background: white;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: background 0.1s;
}

.key.black {
  background: #222;
  flex: 0.7;
  height: 60%;
  margin-left: -15px;
  margin-right: -15px;
  z-index: 2;
  border-radius: 2px;
}

.key.active { background: #6366f1 !important; transform: translateY(2px); }

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #6366f1; padding: 5px; }`,
    js: `
// --- VORTEX ENGINE: SIGNAL PATH ---
let audioCtx, masterGain, analyser;
let activeOscs = new Map();

function initEngine() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  
  masterGain.connect(analyser);
  analyser.connect(audioCtx.destination);
  masterGain.gain.value = document.getElementById('volume').value;
  
  draw(); // Start visualizer
  initMIDI();
  document.getElementById('init-btn').disabled = true;
}

function playNote(note, velocity) {
  if (!audioCtx) return;
  if (activeOscs.has(note)) return;

  const osc = audioCtx.createOscillator();
  const voiceGain = audioCtx.createGain();
  
  osc.type = document.getElementById('wave').value;
  osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
  
  voiceGain.gain.setValueAtTime(0, audioCtx.currentTime);
  voiceGain.gain.linearRampToValueAtTime(velocity * masterGain.gain.value, audioCtx.currentTime + 0.02);
  
  osc.connect(voiceGain);
  voiceGain.connect(masterGain);
  osc.start();
  
  activeOscs.set(note, { osc, voiceGain });
  updateUIKey(note, true);
}

function stopNote(note) {
  const voice = activeOscs.get(note);
  if (voice) {
    voice.voiceGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    voice.osc.stop(audioCtx.currentTime + 0.1);
    activeOscs.delete(note);
    updateUIKey(note, false);
  }
}

// --- SYSTEM SCAFFOLDING (Pre-wired) ---

function updateUIKey(note, active) {
  const key = document.querySelector(\`[data-note="\${note}"]\`);
  if (key) key.classList.toggle('active', active);
}

function draw() {
  const data = new Uint8Array(256);
  analyser.getByteFrequencyData(data);
  const canvas = document.getElementById('viz');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  data.forEach((val, i) => {
    const h = (val / 255) * canvas.height;
    ctx.fillStyle = \`hsla(\${240 + i/2}, 70%, 60%, 0.8)\`;
    ctx.fillRect(i * (canvas.width / 256), canvas.height - h, 2, h);
  });
  requestAnimationFrame(draw);
}

function initMIDI() {
  navigator.requestMIDIAccess?.().then(access => {
    for (const input of access.inputs.values()) {
      input.onmidimessage = (msg) => {
        const [cmd, note, vel] = msg.data;
        if (cmd === 144 && vel > 0) playNote(note, vel / 127);
        if (cmd === 128 || (cmd === 144 && vel === 0)) stopNote(note);
      };
    }
  });
}

// Scaffold Keyboard
const kb = document.getElementById('keyboard');
const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
for (let i=0; i<24; i++) {
  const key = document.createElement('div');
  key.className = 'key' + (names[i%12].includes('#') ? ' black' : '');
  key.dataset.note = 60 + i;
  key.onmousedown = () => playNote(60+i, 0.8);
  key.onmouseup = key.onmouseleave = () => stopNote(60+i);
  kb.appendChild(key);
}

document.getElementById('init-btn').onclick = initEngine;
document.getElementById('volume').oninput = (e) => {
  if (masterGain) masterGain.gain.value = e.target.value;
};`
  },
  editor: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>STUDIO</span></div>
    <div class="status-badge" id="midi-status">MIDI: READY</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel viz-container">
      <div id="glow"></div>
      <canvas id="viz" width="800" height="300"></canvas>
    </div>
    
    <div class="v-panel controls">
      <div class="knob-group">
        <label>MASTER GAIN</label>
        <input id="volume" type="range" min="0" max="1" value="0.5" step="0.01">
      </div>
      <div class="knob-group">
        <label>OSCILLATOR</label>
        <select id="wave">
          <option value="sine">Pure Sine</option>
          <option value="square">Retro Square</option>
          <option value="sawtooth" selected>Sharp Saw</option>
          <option value="triangle">Soft Triangle</option>
        </select>
      </div>
      <button id="init-btn" class="primary-btn">INITIALIZE ENGINE</button>
    </div>
  </div>

  <div class="v-panel keyboard-panel">
    <div id="keyboard" class="keyboard"></div>
  </div>
  <pre id="log">Awaiting Engine Authorization...</pre>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: #090d14;
  color: #edf3ff;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

.vortex-app {
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 15px;
}

.logo { font-weight: 800; letter-spacing: 2px; font-size: 20px; }
.logo span { color: #6366f1; opacity: 0.8; }

.status-badge {
  font-size: 10px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.main-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 20px;
  flex: 1;
}

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.viz-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

#glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, rgba(99, 102, 241, 0.15), transparent 70%);
  pointer-events: none;
}

canvas { width: 100%; height: 100%; object-fit: contain; }

.controls { display: flex; flex-direction: column; gap: 20px; }

.knob-group label { display: block; font-size: 10px; font-weight: 700; color: rgba(255, 255, 255, 0.5); margin-bottom: 8px; }

select, input[type="range"] {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 10px;
  border-radius: 8px;
  outline: none;
}

.primary-btn {
  margin-top: auto;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  border: 0;
  padding: 16px;
  border-radius: 12px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
}

.keyboard-panel { padding: 10px; }
.keyboard {
  display: flex;
  height: 120px;
  width: 100%;
  gap: 2px;
}

.key {
  flex: 1;
  background: white;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: background 0.1s;
}

.key.black {
  background: #222;
  flex: 0.7;
  height: 60%;
  margin-left: -15px;
  margin-right: -15px;
  z-index: 2;
  border-radius: 2px;
}

.key.active { background: #6366f1 !important; transform: translateY(2px); }

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #6366f1; padding: 5px; }`,
    js: `
// --- VORTEX ENGINE: SIGNAL PATH ---
let audioCtx, masterGain, analyser;
let activeOscs = new Map();

function initEngine() {
  // TODO: Initialize AudioContext and nodes: masterGain, analyser
  // TODO: analyser.fftSize = 512
  // TODO: Connect everything to audioCtx.destination
  
  draw(); // Start visualizer
  initMIDI();
  document.getElementById('init-btn').disabled = true;
}

function playNote(note, velocity) {
  // TODO: Create Oscillator for the specific frequency
  // TODO: osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12)
  // TODO: Start osc and map to activeOscs
  updateUIKey(note, true);
}

function stopNote(note) {
  // TODO: Gracefully ramp gain and stop osc
  updateUIKey(note, false);
}

// --- SYSTEM SCAFFOLDING (Pre-wired) ---

function updateUIKey(note, active) {
  const key = document.querySelector(\`[data-note="\${note}"]\`);
  if (key) key.classList.toggle('active', active);
}

function draw() {
  const data = new Uint8Array(256);
  analyser?.getByteFrequencyData(data);
  const canvas = document.getElementById('viz');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!analyser) return requestAnimationFrame(draw);
  
  data.forEach((val, i) => {
    const h = (val / 255) * canvas.height;
    ctx.fillStyle = \`hsla(\${240 + i/2}, 70%, 60%, 0.8)\`;
    ctx.fillRect(i * (canvas.width / 256), canvas.height - h, 2, h);
  });
  requestAnimationFrame(draw);
}

function initMIDI() {
  navigator.requestMIDIAccess?.().then(access => {
    for (const input of access.inputs.values()) {
      input.onmidimessage = (msg) => {
        const [cmd, note, vel] = msg.data;
        if (cmd === 144 && vel > 0) playNote(note, vel / 127);
        if (cmd === 128 || (cmd === 144 && vel === 0)) stopNote(note);
      };
    }
  });
}

// Scaffold Keyboard
const kb = document.getElementById('keyboard');
const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
for (let i=0; i<24; i++) {
  const key = document.createElement('div');
  key.className = 'key' + (names[i%12].includes('#') ? ' black' : '');
  key.dataset.note = 60 + i;
  key.onmousedown = () => playNote(60+i, 0.8);
  key.onmouseup = key.onmouseleave = () => stopNote(60+i);
  kb.appendChild(key);
}

document.getElementById('init-btn').onclick = initEngine;
document.getElementById('volume').oninput = (e) => {
  if (masterGain) masterGain.gain.value = e.target.value;
};`
  },
  steps: [
    {
      title: 'Nodes & Graph',
      lang: 'js',
      startLine: 5,
      instruction: 'Bootstrap the AudioContext and the fundamental master gain and analyser nodes.'
    },
    {
      title: 'Voice Implementation',
      lang: 'js',
      startLine: 18,
      instruction: 'Map frequencies to oscillators and track them to enable polyphonic playback.'
    }
  ]
};
