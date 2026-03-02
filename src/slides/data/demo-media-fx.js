export default {
  id: 'demo-media-fx',
  type: 'demo-editor',
  previewSandbox: false,
  title: 'Lab 5: The Recording Booth',
  subtitle: 'Camera FX & Media Capture',
  description: 'Capture your live session with real-time filters. Snap photos or record videos and save them to your production gallery.',
  solution: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>BOOTH</span></div>
    <div class="status-badge" id="rec-status">STANDBY</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel booth-view">
      <div class="preview-wrap">
        <canvas id="fx" width="1280" height="720"></canvas>
        <div id="rec-dot"></div>
      </div>
      <video id="raw" playsinline muted autoplay hidden></video>
    </div>
    
    <div class="v-panel rec-controls">
      <h4>PRODUCTION CONTROLS</h4>
      <div class="knob-group">
        <label>LIVE FILTER</label>
        <select id="effect">
          <option value="none">Raw Feed</option>
          <option value="cyber">Cyberpunk Neon</option>
          <option value="noir">Classic Noir</option>
          <option value="thermal">Thermal Vision</option>
        </select>
      </div>
      
      <div class="actions">
        <button id="startCam" class="secondary-btn">INIT CAMERA</button>
        <button id="snapPhoto" class="secondary-btn">SNAP PHOTO</button>
        <button id="startRec" class="primary-btn">RECORD CLIP</button>
        <button id="stopRec" class="danger-btn" disabled>STOP</button>
      </div>
    </div>
  </div>

  <div class="v-panel gallery-panel">
    <h4>SESSION ASSETS</h4>
    <div id="gallery" class="asset-grid">
      <div class="empty-msg">No assets captured yet</div>
    </div>
  </div>
  
  <pre id="log">Awaiting camera authorization...</pre>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: #090d14;
  color: #edf3ff;
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
.logo span { color: #ec4899; }

#rec-status.recording { color: #f43f5e; text-shadow: 0 0 10px #f43f5e; }

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.main-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
@media (min-width: 800px) {
  .main-layout {
    grid-template-columns: 1fr 340px;
  }
}

.preview-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}

#fx { width: 100%; height: 100%; object-fit: cover; }

#rec-dot {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 12px;
  height: 12px;
  background: #f43f5e;
  border-radius: 50%;
  opacity: 0;
}

.recording #rec-dot { animation: blink 1s infinite; opacity: 1; }

.rec-controls { display: flex; flex-direction: column; gap: 20px; }
.rec-controls h4 { font-size: 10px; letter-spacing: 2px; color: #ec4899; opacity: 0.8; }

.knob-group label { display: block; font-size: 10px; font-weight: 700; margin-bottom: 8px; }
select { width: 100%; background: #000; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px; border-radius: 8px; }

.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
button { padding: 12px; border: 0; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 11px; }
.primary-btn { background: #ec4899; color: white; grid-column: span 2; }
.secondary-btn { background: rgba(255,255,255,0.1); color: white; }
.danger-btn { background: #f43f5e; color: white; grid-column: span 2; }
button:disabled { opacity: 0.3; cursor: not-allowed; }

.gallery-panel h4 { font-size: 10px; letter-spacing: 2px; color: #ec4899; margin-bottom: 15px; }
.asset-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
  gap: 15px; 
  min-height: 100px;
}
.empty-msg { grid-column: 1/-1; text-align: center; opacity: 0.3; font-size: 12px; padding: 40px; }

.asset-card { 
  background: #000; 
  border-radius: 10px; 
  overflow: hidden; 
  border: 1px solid rgba(255,255,255,0.1);
  position: relative;
}
.asset-card img, .asset-card video { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
.asset-card .badge { 
  position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); 
  padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 800;
}
/* Upgraded Download Button Styling */
.asset-card .download-btn {
  display: block; width: 100%; text-align: center; background: #ec4899; color: white;
  text-decoration: none; padding: 8px; font-size: 10px; font-weight: 700; border: 0; cursor: pointer;
}

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #ec4899; }

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`,
    js: `const startCamBtn = document.getElementById('startCam');
const snapBtn = document.getElementById('snapPhoto');
const startRecBtn = document.getElementById('startRec');
const stopRecBtn = document.getElementById('stopRec');
const effectInput = document.getElementById('effect');
const rawVideo = document.getElementById('raw');
const fxCanvas = document.getElementById('fx');
const gallery = document.getElementById('gallery');
const recStatus = document.getElementById('rec-status');
const log = document.getElementById('log');

const fxCtx = fxCanvas.getContext('2d');
let stream = null;
let recorder = null;
let chunks = [];

function logger(msg) { log.textContent = '> ' + msg; }

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    rawVideo.srcObject = stream;
    rawVideo.play();
    draw();
    logger('Camera feed connected');
  } catch (err) {
    logger('Camera access denied: ' + err.message);
  }
}

function draw() {
  fxCtx.drawImage(rawVideo, 0, 0, fxCanvas.width, fxCanvas.height);
  const fx = effectInput.value;
  
  if (fx !== 'none') {
    const pixels = fxCtx.getImageData(0, 0, fxCanvas.width, fxCanvas.height);
    const d = pixels.data;
    for (let i = 0; i < d.length; i += 4) {
      if (fx === 'cyber') { d[i+1] *= 1.5; d[i+2] *= 1.8; }
      if (fx === 'noir') { const avg = (d[i]+d[i+1]+d[i+2])/3; d[i]=d[i+1]=d[i+2]=avg; }
      if (fx === 'thermal') { d[i] = 255 - d[i]; d[i+1] = d[i+1]/2; }
    }
    fxCtx.putImageData(pixels, 0, 0);
  }
  requestAnimationFrame(draw);
}

function addAssetToGallery(blob, type) {
  const url = URL.createObjectURL(blob);
  const cleanType = blob.type.split(';')[0];
  const isVideo = type === 'video';
  // Derive extension from actual mime type if possible
  const ext = isVideo ? (cleanType.includes('mp4') ? 'mp4' : 'webm') : 'png';
  const filename = 'vortex-' + type + '-' + Date.now() + '.' + ext;
  
  if (gallery.querySelector('.empty-msg')) {
    gallery.innerHTML = '';
  }

  const card = document.createElement('div');
  card.className = 'asset-card';
  
  const badgeHTML = '<span class="badge">' + type.toUpperCase() + '</span>';
  const previewHTML = isVideo ? ('<video src="' + url + '" muted loop autoplay></video>') : ('<img src="' + url + '">');
  
  card.innerHTML = badgeHTML + previewHTML;
  
  const dl = document.createElement('button');
  dl.className = 'download-btn';
  dl.textContent = isVideo ? 'EXPORT VIDEO' : 'SAVE PHOTO';
  
  dl.onclick = async () => {
    try {
      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: isVideo ? 'Video' : 'Image',
            accept: { [cleanType]: ['.' + ext] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        logger('Asset written to disk');
      } else {
        // 2. Proactive Fallback (Mac Safari)
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 200);
        logger('Download signal sent');
      }
    } catch (e) {
      if (e.name !== 'AbortError') logger('Error: ' + e.message);
    }
  };
  
  card.appendChild(dl);
  gallery.prepend(card);
}

function snapPhoto() {
  fxCanvas.toBlob(blob => {
    addAssetToGallery(blob, 'photo');
    logger('Snapshot captured as PNG');
  }, 'image/png');
}

function getSupportedType() {
  const types = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
}

function startRecording() {
  chunks = [];
  const mixed = fxCanvas.captureStream(30);
  if (stream.getAudioTracks().length) {
    mixed.addTrack(stream.getAudioTracks()[0]);
  }
  
  const mimeType = getSupportedType();
  recorder = new MediaRecorder(mixed, { mimeType });
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mimeType });
    addAssetToGallery(blob, 'video');
    document.querySelector('.vortex-app').classList.remove('recording');
    recStatus.textContent = 'STANDBY';
    logger('Media sequence finalized');
  };
  
  recorder.start();
  document.querySelector('.vortex-app').classList.add('recording');
  recStatus.textContent = 'RECORDING';
  stopRecBtn.disabled = false;
  startRecBtn.disabled = true;
  logger('MediaRecorder active');
}

function stopRecording() {
  recorder.stop();
  stopRecBtn.disabled = true;
  startRecBtn.disabled = false;
}

startCamBtn.onclick = startCamera;
snapBtn.onclick = snapPhoto;
startRecBtn.onclick = startRecording;
stopRecBtn.onclick = stopRecording;`
  },
  editor: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>BOOTH</span></div>
    <div class="status-badge" id="rec-status">STANDBY</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel booth-view">
      <div class="preview-wrap">
        <canvas id="fx" width="1280" height="720"></canvas>
        <div id="rec-dot"></div>
      </div>
      <video id="raw" playsinline muted autoplay hidden></video>
    </div>
    
    <div class="v-panel rec-controls">
      <h4>PRODUCTION CONTROLS</h4>
      <div class="knob-group">
        <label>LIVE FILTER</label>
        <select id="effect">
          <option value="none">Raw Feed</option>
          <option value="cyber">Cyberpunk Neon</option>
          <option value="noir">Classic Noir</option>
          <option value="thermal">Thermal Vision</option>
        </select>
      </div>
      
      <div class="actions">
        <button id="startCam" class="secondary-btn">INIT CAMERA</button>
        <button id="snapPhoto" class="secondary-btn">SNAP PHOTO</button>
        <button id="startRec" class="primary-btn">RECORD CLIP</button>
        <button id="stopRec" class="danger-btn" disabled>STOP</button>
      </div>
    </div>
  </div>

  <div class="v-panel gallery-panel">
    <h4>SESSION ASSETS</h4>
    <div id="gallery" class="asset-grid">
      <div class="empty-msg">No assets captured yet</div>
    </div>
  </div>
  
  <pre id="log">Awaiting camera authorization...</pre>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: #090d14;
  color: #edf3ff;
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
.logo span { color: #ec4899; }

#rec-status.recording { color: #f43f5e; text-shadow: 0 0 10px #f43f5e; }

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.main-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
@media (min-width: 800px) {
  .main-layout {
    grid-template-columns: 1fr 340px;
  }
}

.preview-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}

#fx { width: 100%; height: 100%; object-fit: cover; }

#rec-dot {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 12px;
  height: 12px;
  background: #f43f5e;
  border-radius: 50%;
  opacity: 0;
}

.recording #rec-dot { animation: blink 1s infinite; opacity: 1; }

.rec-controls { display: flex; flex-direction: column; gap: 20px; }
.rec-controls h4 { font-size: 10px; letter-spacing: 2px; color: #ec4899; opacity: 0.8; }

.knob-group label { display: block; font-size: 10px; font-weight: 700; margin-bottom: 8px; }
select { width: 100%; background: #000; border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 10px; border-radius: 8px; }

.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
button { padding: 12px; border: 0; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 11px; }
.primary-btn { background: #ec4899; color: white; grid-column: span 2; }
.secondary-btn { background: rgba(255,255,255,0.1); color: white; }
.danger-btn { background: #f43f5e; color: white; grid-column: span 2; }
button:disabled { opacity: 0.3; cursor: not-allowed; }

.gallery-panel h4 { font-size: 10px; letter-spacing: 2px; color: #ec4899; margin-bottom: 15px; }
.asset-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
  gap: 15px; 
  min-height: 100px;
}
.empty-msg { grid-column: 1/-1; text-align: center; opacity: 0.3; font-size: 12px; padding: 40px; }

.asset-card { 
  background: #000; 
  border-radius: 10px; 
  overflow: hidden; 
  border: 1px solid rgba(255,255,255,0.1);
  position: relative;
}
.asset-card img, .asset-card video { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
.asset-card .badge { 
  position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); 
  padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 800;
}
.asset-card .download-btn {
  display: block; width: 100%; text-align: center; background: #ec4899; color: white;
  text-decoration: none; padding: 8px; font-size: 10px; font-weight: 700; border: 0; cursor: pointer;
}

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #ec4899; }

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`,
    js: `// --- BOILERPLATE: Camera & Rendering ---
const snapBtn = document.getElementById('snapPhoto');
const startRecBtn = document.getElementById('startRec');
const stopRecBtn = document.getElementById('stopRec');
const fxCanvas = document.getElementById('fx');
const ctx = fxCanvas.getContext('2d');
const video = document.createElement('video');
let stream = null;
let recorder = null;
let chunks = [];
let recordingMimeType = 'video/webm';

async function init() {
  stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  video.srcObject = stream;
  video.play();
  draw();
}

function draw() {
  ctx.filter = 'contrast(1.2) sepia(0.2)'; // Built-in FX
  ctx.drawImage(video, 0, 0, fxCanvas.width, fxCanvas.height);
  requestAnimationFrame(draw);
}

function addAssetToGallery(blob, type) {
  const url = URL.createObjectURL(blob);
  const container = document.getElementById('gallery');
  const div = document.createElement('div');
  div.className = 'asset-card';
  div.innerHTML = type === 'photo' ? \`<img src="\${url}">\` : \`<video src="\${url}" loop autoplay>\`;
  
  const btn = document.createElement('button');
  btn.textContent = type === 'photo' ? 'SAVE PHOTO' : 'EXPORT VIDEO';
  btn.onclick = () => {
     // TODO: Implement Download Logic (see steps)
     // Use File System Access API or <a> tag fallback
  };
  div.appendChild(btn);
  container.prepend(div);
}

// --- YOUR TASK: MEDIA FX & CAPTURE ---

function snapPhoto() {
  // 1. Capture the current Canvas frame as a 'image/png' blob
  // 2. Call addAssetToGallery(blob, 'photo')
  // TODO: Implement the toBlob() callback
}

function getSupportedType() {
  const types = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'];
  return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function startRecording() {
  // 1. Get a stream from the canvas: fxCanvas.captureStream(30)
  // 2. If available, merge one audio track from the camera stream
  // 3. Create `recorder = new MediaRecorder(canvasStream, { mimeType: recordingMimeType })`
  // 4. Push chunk data into 'chunks' using recorder.ondataavailable
  // TODO: Start MediaRecorder
}

function stopRecording() {
  // 1. Call recorder.stop() when state is "recording"
  // 2. In recorder.onstop, build `new Blob(chunks, { type: recordingMimeType })`
  // 3. Call addAssetToGallery(blob, 'video')
  // TODO: Finish recording and finalize the video file
}

snapBtn.onclick = snapPhoto;
startRecBtn.onclick = startRecording;
stopRecBtn.onclick = stopRecording;
init();`
  },
  steps: [
    {
      title: 'Snapshot Pipeline',
      lang: 'js',
      startLine: 45,
      instruction: 'Use `canvas.toBlob(callback)` to capture current frame. Send the blob to `addAssetToGallery`.'
    },
    {
      title: 'Stream Creation',
      lang: 'js',
      startLine: 58,
      instruction: 'Combine canvas with audio: `canvas.captureStream(30)` then `stream.addTrack(audioTrack)`.'
    },
    {
      title: 'Media Recording',
      lang: 'js',
      startLine: 61,
      instruction: 'Initialize `new MediaRecorder(stream)`. Push data into `chunks` during `ondataavailable`.'
    }
  ]
};
