export default {
  id: 'demo-drop-clipboard',
  type: 'demo-editor',
  previewSandbox: false,
  title: 'Lab 3: Ingest Analyzer',
  subtitle: 'Decoding Session Data via Drag-and-Drop',
  description: 'Drag your exported .vortex files back into the Studio to analyze their metadata: note count, performance duration, and more.',
  solution: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>ANALYZER</span></div>
    <div class="status-badge" id="drop-status">READY FOR INGEST</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel drop-zone" id="drop-zone">
      <div class="drop-icon">📥</div>
      <h3>ANALYZE SESSION</h3>
      <p>Drop a .vortex file to extract metadata</p>
      <input type="file" id="file-pick" hidden>
    </div>
    
    <div class="v-panel stats-panel">
      <h4>CONTENT INTELLIGENCE</h4>
      <div id="stats-display">
        <div class="stat-card">
          <label>FILE NAME</label>
          <span id="stat-name">-</span>
        </div>
        <div class="stat-card">
          <label>NOTE COUNT</label>
          <span id="stat-notes">0</span>
        </div>
        <div class="stat-card">
          <label>DURATION</label>
          <span id="stat-len">0.0s</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="imported-list">
        <h4>ACTIVITY LOG</h4>
        <ul id="file-list"></ul>
      </div>
    </div>
  </div>
  
  <pre id="log">Waiting for session data...</pre>
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

*, *:before, *:after { box-sizing: border-box; }

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 15px;
}

.logo { font-weight: 800; letter-spacing: 2px; }
.logo span { color: #f59e0b; }

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(10px);
}

.main-layout { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(245, 158, 11, 0.3);
  min-height: 250px;
  transition: all 0.2s;
  cursor: pointer;
}

.drop-zone.active { background: rgba(245, 158, 11, 0.1); border-color: #f59e0b; }
.drop-icon { font-size: 40px; margin-bottom: 10px; }

h3 { margin: 0; font-size: 16px; color: #f59e0b; }
p { font-size: 11px; opacity: 0.6; }

.stats-panel h4 { margin: 0 0 15px; font-size: 10px; letter-spacing: 2px; color: #f59e0b; }
.stat-card { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 10px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); }
.stat-card label { display: block; font-size: 9px; opacity: 0.5; font-weight: 800; margin-bottom: 4px; }
.stat-card span { font-weight: 700; color: #f59e0b; font-size: 14px; }

.divider { height: 1px; background: rgba(255,255,255,0.08); margin: 20px 0; }

ul { list-style: none; padding: 0; font-size: 11px; }
li { padding: 8px 12px; background: rgba(0,0,0,0.3); border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #f59e0b; display: flex; justify-content: space-between; }
li span { opacity: 0.5; font-size: 9px; }

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #f59e0b; }`,
    js: `
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-pick');
const fileList = document.getElementById('file-list');
const log = document.getElementById('log');

// Statistics UI
const statName = document.getElementById('stat-name');
const statNotes = document.getElementById('stat-notes');
const statLen = document.getElementById('stat-len');

function logger(msg) { log.textContent = '> ' + msg; }

async function analyzeFile(file) {
  if (!file.name.endsWith('.vortex')) {
    return logger('Unsupported file type. Need .vortex');
  }

  const text = await file.text();
  try {
    const data = JSON.parse(text);
    const notes = data.sequence ? data.sequence.filter(e => e.type === 'on').length : 0;
    
    // Calculate duration
    let duration = 0;
    if (data.sequence && data.sequence.length > 0) {
      duration = data.sequence[data.sequence.length - 1].time / 1000;
    }

    // Update Stats UI
    statName.textContent = file.name;
    statNotes.textContent = notes;
    statLen.textContent = duration.toFixed(1) + 's';

    // Log Activity
    const li = document.createElement('li');
    li.innerHTML = \`Analyzed: \${file.name} <span>\${notes} notes</span>\`;
    fileList.prepend(li);
    
    logger('Intelligence extracted from ' + file.name);
  } catch (e) {
    logger('Failed to parse Vortex session: ' + e.message);
  }
}

// 1. Implementation of DataTransfer
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) analyzeFile(file);
});

// --- Boilerplate Handlers ---
dropZone.onclick = () => fileInput.click();
fileInput.onchange = () => {
  if (fileInput.files[0]) analyzeFile(fileInput.files[0]);
};
['dragenter', 'dragover'].forEach(n => dropZone.addEventListener(n, e => { e.preventDefault(); dropZone.classList.add('active'); }));
['dragleave', 'drop'].forEach(n => dropZone.addEventListener(n, e => { e.preventDefault(); dropZone.classList.remove('active'); }));`
  },
  editor: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>ANALYZER</span></div>
    <div class="status-badge" id="drop-status">READY FOR INGEST</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel drop-zone" id="drop-zone">
      <div class="drop-icon">📥</div>
      <h3>ANALYZE SESSION</h3>
      <p>Drop a .vortex file to extract metadata</p>
      <input type="file" id="file-pick" hidden>
    </div>
    
    <div class="v-panel stats-panel">
      <h4>CONTENT INTELLIGENCE</h4>
      <div id="stats-display">
        <div class="stat-card">
          <label>FILE NAME</label>
          <span id="stat-name">-</span>
        </div>
        <div class="stat-card">
          <label>NOTE COUNT</label>
          <span id="stat-notes">0</span>
        </div>
        <div class="stat-card">
          <label>DURATION</label>
          <span id="stat-len">0.0s</span>
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="imported-list">
        <h4>ACTIVITY LOG</h4>
        <ul id="file-list"></ul>
      </div>
    </div>
  </div>
  
  <pre id="log">Waiting for session data...</pre>
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

*, *:before, *:after { box-sizing: border-box; }

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 15px;
}

.logo { font-weight: 800; letter-spacing: 2px; }
.logo span { color: #f59e0b; }

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(10px);
}

.main-layout { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(245, 158, 11, 0.3);
  min-height: 250px;
  transition: all 0.2s;
  cursor: pointer;
}

.drop-zone.active { background: rgba(245, 158, 11, 0.1); border-color: #f59e0b; }
.drop-icon { font-size: 40px; margin-bottom: 10px; }

h3 { margin: 0; font-size: 16px; color: #f59e0b; }
p { font-size: 11px; opacity: 0.6; }

.stats-panel h4 { margin: 0 0 15px; font-size: 10px; letter-spacing: 2px; color: #f59e0b; }
.stat-card { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 10px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.05); }
.stat-card label { display: block; font-size: 9px; opacity: 0.5; font-weight: 800; margin-bottom: 4px; }
.stat-card span { font-weight: 700; color: #f59e0b; font-size: 14px; }

.divider { height: 1px; background: rgba(255,255,255,0.08); margin: 20px 0; }

ul { list-style: none; padding: 0; font-size: 11px; }
li { padding: 8px 12px; background: rgba(0,0,0,0.3); border-radius: 6px; margin-bottom: 6px; border-left: 3px solid #f59e0b; display: flex; justify-content: space-between; }
li span { opacity: 0.5; font-size: 9px; }

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #f59e0b; }`,
    js: `
// UI Elements are ready for you
const dropZone = document.getElementById('drop-zone');
const statName = document.getElementById('stat-name');
const statNotes = document.getElementById('stat-notes');
const statLen = document.getElementById('stat-len');
const log = document.getElementById('log');

function logger(msg) { log.textContent = '> ' + msg; }

async function analyzeFile(file) {
  // 1. Convert the raw binary File into a string
  const text = await file.text();
  
  try {
    const data = JSON.parse(text);
    
    // 2. Perform analytics on the song sequence
    // TODO: Filter 'data.sequence' to count events where type is 'on'
    const notes = 0; 
    
    // TODO: Look at the last element of 'data.sequence' to find the total time
    const duration = 0; 
    
    // 3. Update the UI dashboard
    statName.textContent = file.name;
    statNotes.textContent = notes;
    statLen.textContent = (duration / 1000).toFixed(1) + 's';
    
    logger('Analysis complete for: ' + file.name);
  } catch (e) {
    logger('Invalid Vortex file format');
  }
}

// 1. Listen for the 'drop' event
dropZone.addEventListener('drop', (e) => {
  // Prevent browser from opening the file itself
  e.preventDefault();
  
  // 2. Extract the file from the DataTransfer object
  // TODO: Get e.dataTransfer.files[0] and pass it to analyzeFile()
});

// -- Boilerplate for background effects --
const fileInput = document.getElementById('file-pick');
dropZone.onclick = () => fileInput.click();
fileInput.onchange = () => { if (fileInput.files[0]) analyzeFile(fileInput.files[0]); };
['dragenter', 'dragover'].forEach(n => dropZone.addEventListener(n, e => { e.preventDefault(); dropZone.classList.add('active'); }));
['dragleave', 'drop'].forEach(n => dropZone.addEventListener(n, e => { e.preventDefault(); dropZone.classList.remove('active'); }));`
  },
  steps: [
    {
      title: 'Intercepting Files',
      lang: 'js',
      startLine: 327,
      instruction: '1. `e.preventDefault()`. 2. `const file = e.dataTransfer.files[0]`. 3. Call `analyzeFile(file)`.'
    },
    {
      title: 'Reading Text',
      lang: 'js',
      startLine: 304,
      instruction: 'Use `await file.text()` to get the raw JSON string. Use `JSON.parse(text)` to turn it into an object.'
    },
    {
      title: 'Traversing Data',
      lang: 'js',
      startLine: 312,
      instruction: 'Get notes count: `data.sequence.filter(e => e.type === "on").length`. Duration: `data.sequence[data.sequence.length-1].time`.'
    }
  ]
};
