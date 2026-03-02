export default {
  id: 'demo-file-system',
  type: 'demo-editor',
  previewSandbox: false,
  title: 'Lab 2: Session Architect',
  subtitle: 'Persistence with File System Access API',
  description: 'Record your MIDI performances and export them directly to your disk as native files.',
  solution: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>ARCHITECT</span></div>
    <div class="status-badge" id="rec-status">STANDBY</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel recorder-box">
      <div class="meter">
        <div id="meter-fill"></div>
      </div>
      <div class="controls-row">
        <button id="rec" class="rec-btn">RECORD</button>
        <button id="stop" class="secondary-btn">STOP</button>
        <button id="play" class="secondary-btn">PLAYBACK</button>
      </div>
      <div class="divider"></div>
      <div class="actions">
        <button id="open" class="secondary-btn">IMPORT (.vortex)</button>
        <button id="save" class="primary-btn">EXPORT TO DISK</button>
      </div>
    </div>
  </div>

  <div class="v-panel keyboard-panel">
    <div id="keyboard" class="keyboard"></div>
  </div>
  
  <pre id="log">Engine Ready. Start recording...</pre>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: #090d14;
  color: #edf3ff;
  height: 100vh;
  display: flex;
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

.logo { font-weight: 800; letter-spacing: 2px; }
.logo span { color: #10b981; }

.status-badge {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.recorder-box {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.meter {
  height: 6px;
  background: rgba(255,255,255,0.05);
  border-radius: 3px;
  overflow: hidden;
}

#meter-fill {
  width: 0%;
  height: 100%;
  background: #10b981;
  transition: width 0.1s linear;
}

.controls-row {
  display: flex;
  gap: 12px;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(10px);
}

.divider { height: 1px; background: rgba(255,255,255,0.1); }

button {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  border: 0;
  font-family: inherit;
  transition: all 0.2s;
}

.rec-btn { background: #ef4444; color: white; }
.rec-btn.active { animation: pulse 1s infinite; }

.primary-btn { background: #10b981; color: #052e16; }
.secondary-btn { background: rgba(255,255,255,0.1); color: white; }

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.keyboard { display: flex; height: 100px; gap: 2px; }
.key { flex: 1; background: white; border-radius: 0 0 4px 4px; cursor: pointer; position: relative; }
.key.black { background: #222; flex: 0.7; height: 60%; margin: 0 -12px; z-index: 2; border-radius: 0 0 2px 2px; }
.key.active { background: #10b981 !important; transform: translateY(2px); }

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #10b981; }`,
    js: `
// --- ENGINE & RECORDER ---
let audioCtx, masterGain;
let sequence = [];
let isRecording = false;
let startTime = 0;
let playbackTimeout = null;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
}

function logger(msg) { document.getElementById('log').textContent = '> ' + msg; }

function playNote(note, velocity, isPlayback = false) {
  initAudio();
  if (isRecording && !isPlayback) {
    sequence.push({ note, velocity, time: Date.now() - startTime, type: 'on' });
  }
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  
  const key = document.querySelector(\`[data-note="\${note}"]\`);
  if (key) key.classList.add('active');
  
  return { osc, gain };
}

const activeVoices = new Map();

function handleDown(note) {
  const voice = playNote(note, 0.8);
  activeVoices.set(note, voice);
}

function handleUp(note) {
  if (isRecording) {
    sequence.push({ note, time: Date.now() - startTime, type: 'off' });
  }
  const voice = activeVoices.get(note);
  if (voice) {
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    voice.osc.stop(audioCtx.currentTime + 0.1);
    activeVoices.delete(note);
  }
  const key = document.querySelector(\`[data-note="\${note}"]\`);
  if (key) key.classList.remove('active');
}

// --- FILE SYSTEM INTERACTION ---

async function exportSession() {
  if (sequence.length === 0) return logger('Nothing to export!');
  
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'performance.vortex',
      types: [{ description: 'Vortex Session', accept: { 'application/json': ['.vortex'] } }]
    });
    
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify({ version: '2.0', sequence }, null, 2));
    await writable.close();
    logger('Session exported to: ' + handle.name);
  } catch (e) { console.error(e); }
}

async function importSession() {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'Vortex Session', accept: { 'application/json': ['.vortex'] } }]
    });
    const file = await handle.getFile();
    const data = JSON.parse(await file.text());
    sequence = data.sequence;
    logger('Imported ' + sequence.length + ' events from ' + handle.name);
  } catch (e) { console.error(e); }
}

// --- UI WIRING ---

document.getElementById('rec').onclick = () => {
  sequence = [];
  startTime = Date.now();
  isRecording = true;
  document.getElementById('rec').classList.add('active');
  document.getElementById('rec-status').textContent = 'RECORDING';
  logger('Recording started...');
};

document.getElementById('stop').onclick = () => {
  isRecording = false;
  document.getElementById('rec').classList.remove('active');
  document.getElementById('rec-status').textContent = 'STANDBY';
  logger('Session captured: ' + sequence.length + ' events');
};

document.getElementById('play').onclick = () => {
  logger('Playing back sequence...');
  sequence.forEach(evt => {
    setTimeout(() => {
      if (evt.type === 'on') handleDown(evt.note);
      else handleUp(evt.note);
    }, evt.time);
  });
};

document.getElementById('save').onclick = exportSession;
document.getElementById('open').onclick = importSession;

// Scaffold Keyboard
const kb = document.getElementById('keyboard');
const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
for (let i=0; i<24; i++) {
  const key = document.createElement('div');
  key.className = 'key' + (names[i%12].includes('#') ? ' black' : '');
  key.dataset.note = 60 + i;
  key.onmousedown = () => handleDown(60+i);
  key.onmouseup = key.onmouseleave = () => handleUp(60+i);
  kb.appendChild(key);
}`
  },
  editor: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>ARCHITECT</span></div>
    <div class="status-badge" id="rec-status">STANDBY</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel recorder-box">
      <div class="controls-row">
        <button id="rec" class="rec-btn">RECORD</button>
        <button id="stop" class="secondary-btn">STOP</button>
        <button id="play" class="secondary-btn">PLAYBACK</button>
      </div>
      <div class="divider"></div>
      <div class="actions">
        <button id="open" class="secondary-btn">IMPORT (.vortex)</button>
        <button id="save" class="primary-btn">EXPORT TO DISK</button>
      </div>
    </div>
  </div>

  <div class="v-panel keyboard-panel">
    <div id="keyboard" class="keyboard"></div>
  </div>
  <pre id="log">Ready to capture performance...</pre>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: #090d14;
  color: #edf3ff;
  height: 100vh;
  display: flex;
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

.logo { font-weight: 800; letter-spacing: 2px; }
.logo span { color: #10b981; }

.status-badge {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.recorder-box {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls-row {
  display: flex;
  gap: 12px;
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(10px);
}

.divider { height: 1px; background: rgba(255,255,255,0.1); }

button {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  border: 0;
  font-family: inherit;
  transition: all 0.2s;
}

.rec-btn { background: #ef4444; color: white; }
.rec-btn.active { animation: pulse 1s infinite; }

.primary-btn { background: #10b981; color: #052e16; }
.secondary-btn { background: rgba(255,255,255,0.1); color: white; }

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.keyboard { display: flex; height: 100px; gap: 2px; }
.key { flex: 1; background: white; border-radius: 0 0 4px 4px; cursor: pointer; position: relative; }
.key.black { background: #222; flex: 0.7; height: 60%; margin: 0 -12px; z-index: 2; border-radius: 0 0 2px 2px; }
.key.active { background: #10b981 !important; transform: translateY(2px); }

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #10b981; }`,
    js: `// --- BOILERPLATE: Audio & UI (Focus on FS methods below) ---
let audioCtx, masterGain;
let sequence = [];
let isRecording = false;
let startTime = 0;
const activeVoices = new Map();

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioContext();
  masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
}

function logger(msg) { document.getElementById('log').textContent = '> ' + msg; }

function playNote(note, velocity, isPlayback = false) {
  initAudio();
  if (isRecording && !isPlayback) {
    sequence.push({ note, velocity, time: Date.now() - startTime, type: 'on' });
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  document.querySelector(\`[data-note="\${note}"]\`)?.classList.add('active');
  return { osc, gain };
}

function handleDown(note) {
  const voice = playNote(note, 0.8);
  activeVoices.set(note, voice);
}

function handleUp(note) {
  if (isRecording) sequence.push({ note, time: Date.now() - startTime, type: 'off' });
  const voice = activeVoices.get(note);
  if (voice) {
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    voice.osc.stop(audioCtx.currentTime + 0.1);
    activeVoices.delete(note);
  }
  document.querySelector(\`[data-note="\${note}"]\`)?.classList.remove('active');
}

// --- YOUR TASK: FILE SYSTEM API ---

async function exportSession() {
  if (sequence.length === 0) return logger('Nothing to record!');
  // 1. Open the OS "Save" picker (suggest 'performance.vortex')
  // 2. Obtain a writable stream from the file handle
  // 3. Stringify the 'sequence' array and write it to the stream
  // 4. IMPORTANT: Close the stream to commit changes to disk
  // TODO: Implement showSaveFilePicker flow
}

async function importSession() {
  // 1. Open the OS "Open" picker (filter for .vortex)
  // 2. Get the File object from the handle
  // 3. Read the file content as text
  // 4. Parse JSON and update the local 'sequence' variable
  // TODO: Implement showOpenFilePicker flow
}

// --- UI & KEYBOARD WIRING ---

document.getElementById('rec').onclick = () => {
  sequence = []; startTime = Date.now(); isRecording = true;
  document.getElementById('rec').classList.add('active');
  document.getElementById('rec-status').textContent = 'RECORDING';
  logger('Recording started...');
};

document.getElementById('stop').onclick = () => {
  isRecording = false;
  document.getElementById('rec').classList.remove('active');
  document.getElementById('rec-status').textContent = 'STANDBY';
  logger('Captured: ' + sequence.length + ' events');
};

document.getElementById('play').onclick = () => {
  logger('Playback starting...');
  sequence.forEach(evt => {
    setTimeout(() => {
      if (evt.type === 'on') handleDown(evt.note);
      else handleUp(evt.note);
    }, evt.time);
  });
};

document.getElementById('save').onclick = exportSession;
document.getElementById('open').onclick = importSession;

// Build Keyboard
const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
for (let i=0; i<24; i++) {
  const key = document.createElement('div');
  key.className = 'key' + (names[i%12].includes('#') ? ' black' : '');
  key.dataset.note = 60 + i;
  key.onmousedown = () => handleDown(60+i);
  key.onmouseup = key.onmouseleave = () => handleUp(60+i);
  document.getElementById('keyboard').appendChild(key);
}`
  },
  steps: [
    {
      title: 'Writing to Disk',
      lang: 'js',
      startLine: 59,
      instruction: '1. `await showSaveFilePicker()` to get a handle. 2. `await handle.createWritable()`. 3. `await writer.write(blob)`. 4. `await writer.close()`.'
    },
    {
      title: 'Reading from Disk',
      lang: 'js',
      startLine: 67,
      instruction: '1. `const [handle] = await showOpenFilePicker()`. 2. `const file = await handle.getFile()`. 3. `const text = await file.text()`.'
    }
  ]
};
