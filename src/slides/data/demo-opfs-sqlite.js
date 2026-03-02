export default {
  id: 'demo-opfs-sqlite',
  type: 'demo-editor',
  previewSandbox: false,
  title: 'Lab 4: Performance Librarian',
  subtitle: 'Building a Persistent Playlist with SQLite',
  description: 'Index your analyzed sessions into a high-performance local database. Store details like Artist, Genre, and Date to build a professional-grade Playlist.',
  solution: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>LIBRARIAN</span></div>
    <div class="status-badge" id="opfs-status">DISK SYNCED</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel info-panel">
      <h4>INDEX NEW PERFORMANCE</h4>
      <div class="library-form">
        <input id="session-name" type="text" placeholder="Song Title">
        <input id="session-artist" type="text" placeholder="Artist Name">
        <select id="session-genre">
          <option>Techno</option>
          <option>House</option>
          <option>Ambient</option>
          <option>Cinematic</option>
        </select>
        <button id="add" class="primary-btn">ADD TO PLAYLIST</button>
      </div>
      
      <div class="divider"></div>
      
      <div class="library-view">
        <div class="view-header">
          <h4>YOUR STUDIO PLAYLIST</h4>
          <span id="counter">0 TRACKS</span>
        </div>
        <ul id="list"></ul>
      </div>
    </div>
  </div>
  
  <pre id="log">Booting Relational Engine...</pre>
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
.logo span { color: #8b5cf6; }

.status-badge {
  font-size: 10px;
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  padding: 4px 10px;
  border-radius: 20px;
}

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(10px);
}

.library-form {
  display: grid;
  grid-template-columns: 1fr 1fr 140px 140px;
  gap: 12px;
  margin-top: 15px;
  margin-bottom: 25px;
}

h4 { margin: 0; font-size: 10px; letter-spacing: 2px; color: #8b5cf6; }
.divider { height: 1px; background: rgba(255,255,255,0.08); margin-bottom: 25px; }

input, select {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-family: inherit;
  outline: none;
}

.primary-btn { background: #8b5cf6; color: white; font-weight: 700; border: 0; border-radius: 8px; cursor: pointer; }

.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
#counter { font-size: 9px; opacity: 0.5; font-weight: 800; }

ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
li {
  background: rgba(255, 255, 255, 0.02);
  padding: 14px 18px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
li .track-info { display: flex; flex-direction: column; }
li strong { color: #fff; font-size: 15px; }
li small { font-size: 10px; opacity: 0.5; margin-top: 2px; }
li span.genre-tag { font-size: 9px; background: rgba(139, 92, 246, 0.2); padding: 2px 8px; border-radius: 4px; color: #a78bfa; }

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #8b5cf6; }`,
    js: `
const nameInput = document.getElementById('session-name');
const artistInput = document.getElementById('session-artist');
const genreInput = document.getElementById('session-genre');
const addBtn = document.getElementById('add');
const listEl = document.getElementById('list');
const countEl = document.getElementById('counter');
const log = document.getElementById('log');

let SQL = null;
let db = null;
const dbFile = 'vortex-playlist.sqlite';

function logger(msg) { log.textContent = '> ' + msg; }

async function initDb() {
  if (!window.initSqlJs) {
    await new Promise(r => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';
      s.onload = r;
      document.head.appendChild(s);
    });
  }
  
  SQL = await window.initSqlJs({ locateFile: f => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + f });
  
  const bytes = await readFromOPFS();
  db = bytes ? new SQL.Database(bytes) : new SQL.Database();
  
  db.run('CREATE TABLE IF NOT EXISTS tracks (id INTEGER PRIMARY KEY, name TEXT, artist TEXT, genre TEXT, ts INTEGER)');
  renderList();
  logger(bytes ? 'Playlist restored' : 'New Studio Playlist initialized');
}

async function readFromOPFS() {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(dbFile);
    return new Uint8Array(await (await handle.getFile()).arrayBuffer());
  } catch { return null; }
}

async function writeToOPFS(bytes) {
  const root = await navigator.storage.getDirectory();
  const handle = await root.getFileHandle(dbFile, { create: true });
  const writable = await handle.createWritable();
  await writable.write(bytes);
  await writable.close();
}

function renderList() {
  const res = db.exec('SELECT name, artist, genre FROM tracks ORDER BY id DESC');
  listEl.innerHTML = '';
  if (res.length) {
    res[0].values.forEach(row => {
      listEl.innerHTML += \`<li><div class="track-info"><strong>\${row[0]}</strong><small>\${row[1].toUpperCase()}</small></div> <span class="genre-tag">\${row[2].toUpperCase()}</span></li>\`;
    });
    countEl.textContent = res[0].values.length + ' TRACKS';
  } else {
    listEl.innerHTML = '<li>PLAYLIST EMPTY</li>';
  }
}

addBtn.onclick = async () => {
  if (!nameInput.value || !artistInput.value) return;
  db.run('INSERT INTO tracks (name, artist, genre, ts) VALUES (?, ?, ?, ?)', [nameInput.value, artistInput.value, genreInput.value, Date.now()]);
  await writeToOPFS(db.export());
  nameInput.value = '';
  artistInput.value = '';
  renderList();
  logger('Track indexed successfully');
};

initDb();`
  },
  editor: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>LIBRARIAN</span></div>
    <div class="status-badge" id="opfs-status">DISK SYNCED</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel info-panel">
      <h4>INDEX NEW PERFORMANCE</h4>
      <div class="library-form">
        <input id="session-name" type="text" placeholder="Song Title">
        <input id="session-artist" type="text" placeholder="Artist Name">
        <select id="session-genre">
          <option>Techno</option>
          <option>House</option>
          <option>Ambient</option>
          <option>Cinematic</option>
        </select>
        <button id="add" class="primary-btn">ADD TO PLAYLIST</button>
      </div>
      
      <div class="divider"></div>
      
      <div class="library-view">
        <div class="view-header">
          <h4>YOUR STUDIO PLAYLIST</h4>
          <span id="counter">0 TRACKS</span>
        </div>
        <ul id="list"></ul>
      </div>
    </div>
  </div>
  
  <pre id="log">Booting Relational Engine...</pre>
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
.logo span { color: #8b5cf6; }

.status-badge {
  font-size: 10px;
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  padding: 4px 10px;
  border-radius: 20px;
}

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(10px);
}

.library-form {
  display: grid;
  grid-template-columns: 1fr 1fr 140px 140px;
  gap: 12px;
  margin-top: 15px;
  margin-bottom: 25px;
}

h4 { margin: 0; font-size: 10px; letter-spacing: 2px; color: #8b5cf6; }
.divider { height: 1px; background: rgba(255,255,255,0.08); margin-bottom: 25px; }

input, select {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-family: inherit;
  outline: none;
}

.primary-btn { background: #8b5cf6; color: white; font-weight: 700; border: 0; border-radius: 8px; cursor: pointer; }

.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
#counter { font-size: 9px; opacity: 0.5; font-weight: 800; }

ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
li {
  background: rgba(255, 255, 255, 0.02);
  padding: 14px 18px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
li .track-info { display: flex; flex-direction: column; }
li strong { color: #fff; font-size: 15px; }
li small { font-size: 10px; opacity: 0.5; margin-top: 2px; }
li span.genre-tag { font-size: 9px; background: rgba(139, 92, 246, 0.2); padding: 2px 8px; border-radius: 4px; color: #a78bfa; }

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #8b5cf6; }`,
    js: `
const nameInput = document.getElementById('session-name');
const artistInput = document.getElementById('session-artist');
const genreInput = document.getElementById('session-genre');
const listEl = document.getElementById('list');
const countEl = document.getElementById('counter');
const log = document.getElementById('log');

let db = null; 
const dbFile = 'vortex-playlist.sqlite';
function logger(msg) { log.textContent = '> ' + msg; }

// --- 1. YOUR TASK: Persistence ---
async function syncToOPFS() {
  const bytes = db.export(); // Binary array of the SQLite DB
  // 1. Get the root directory handle from navigator.storage
  // 2. Get a file handle for "vortex.db" (use {create: true})
  // 3. Create a writable stream and write the 'bytes' buffer
  // TODO: Sync database bytes to the Origin Private File System
}

async function indexSession() {
  const name = nameInput.value;
  const artist = artistInput.value;
  const genre = genreInput.value;
  
  // 1. Execute the SQL Insert command
  // Query: "INSERT INTO tracks (name, artist, genre, ts) VALUES (?, ?, ?, ?)"
  // TODO: Run db.run(query, [name, artist, genre, Date.now()])
  
  await syncToOPFS();
  renderList();
  logger('Track saved to OPFS database: ' + name);
}

// --- 2. BOILERPLATE: Database Logic ---
async function initDb() {
  // Load SQL.js library
  if (!window.initSqlJs) {
     const s = document.createElement('script');
     s.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js';
     await new Promise(r => s.onload = r);
     document.head.appendChild(s);
  }
  const SQL = await window.initSqlJs({ locateFile: f => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + f });
  
  db = new SQL.Database(); // In-memory for now
  db.run('CREATE TABLE IF NOT EXISTS tracks (id INTEGER PRIMARY KEY, name TEXT, artist TEXT, genre TEXT, ts INTEGER)');
  renderList();
  logger('Database Ready');
}

function renderList() {
  const res = db.exec('SELECT name, artist, genre FROM tracks ORDER BY id DESC');
  listEl.innerHTML = '';
  if (res.length) {
    res[0].values.forEach(row => {
      listEl.innerHTML += \`<li><div class="track-info"><strong>\${row[0]}</strong><small>\${row[1]}</small></div></li>\`;
    });
    countEl.textContent = res[0].values.length + ' TRACKS';
  }
}

document.getElementById('add').onclick = indexSession;
initDb();`
  },
  steps: [
    {
      title: 'SQL Insertion',
      lang: 'js',
      startLine: 360,
      instruction: 'Use `db.run(query, [params])`. Example: `INSERT INTO tracks (name, artist, genre, ts) VALUES (?, ?, ?, ?)`.'
    },
    {
      title: 'OPFS Hook',
      lang: 'js',
      startLine: 350,
      instruction: '1. `navigator.storage.getDirectory()`. 2. `root.getFileHandle("vortex.db", {create:true})`. 3. Create writable and write `db.export()`.'
    }
  ]
};
