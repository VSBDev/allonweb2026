export default {
  id: 'demo-workers',
  type: 'demo-editor',
  previewSandbox: false,
  title: 'Lab 6: The Mastering Deck',
  subtitle: 'Thread Isolation for Heavy Exports',
  description: 'Experience the "Event Loop" bottleneck. Use Web Workers to offload heavy calculations so your Studio UI remains buttery smooth while you work.',
  solution: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>MASTER</span></div>
    <div class="monitor">UI PERFORMANCE: <span id="fps-val">60</span> FPS</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel engine-room">
      <div class="deck-header">
        <h4>HIGH-FIDELITY EXPORT ENGINE</h4>
        <div id="status-led" class="led"></div>
      </div>
      
      <!-- Tactile responsiveness test -->
      <div class="tactile-zone">
        <div id="drag-box" class="drag-puck">DRAG ME</div>
        <p class="hint">Try dragging this puck while "Mastering"</p>
      </div>

      <div class="actions">
        <button id="main" class="danger-btn">LEGACY RENDER (BLOCKING)</button>
        <button id="worker" class="primary-btn">STUDIO ENGINE (ISOLATED)</button>
        <button id="stop" class="secondary-btn">ABORT PROCESS</button>
      </div>
      
      <div class="progress-wrap">
        <label>EXPORT CONTEXT BUFFER</label>
        <div class="progress-bar"><div id="bar"></div></div>
      </div>
    </div>
  </div>
  
  <pre id="log">Engine online. Ready for stress test.</pre>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: #090d14;
  color: #edf3ff;
  user-select: none;
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
.logo span { color: #0284c7; }

.monitor {
  font-family: monospace;
  font-size: 10px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}
#fps-val.danger { color: #f43f5e; font-weight: 900; }

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 25px;
  backdrop-filter: blur(10px);
}

.deck-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
h4 { margin: 0; font-size: 10px; letter-spacing: 2px; color: #0284c7; }

.led { width: 8px; height: 8px; background: #333; border-radius: 50%; }
.led.active { background: #0284c7; box-shadow: 0 0 10px #0284c7; animation: blink 0.5s infinite; }

.tactile-zone {
  background: #000;
  height: 180px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  margin-bottom: 25px;
  border: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-puck {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 10px;
  cursor: grab;
  position: absolute;
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
  z-index: 10;
}
.drag-puck:active { cursor: grabbing; scale: 1.1; }

.hint { font-size: 9px; opacity: 0.3; text-transform: uppercase; letter-spacing: 1px; pointer-events: none; }

.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px; }
.actions button:last-child { grid-column: span 2; }
button { padding: 14px; border: 0; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 11px; }
.primary-btn { background: #0284c7; color: white; }
.danger-btn { background: #ef4444; color: white; }
.secondary-btn { background: rgba(255,255,255,0.05); color: white; }

.progress-wrap label { font-size: 9px; font-weight: 800; opacity: 0.5; display: block; margin-bottom: 8px; }
.progress-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
#bar { width: 0%; height: 100%; background: #0284c7; }

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #0284c7; }

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`,
    js: `const mainBtn = document.getElementById('main');
const workerBtn = document.getElementById('worker');
const stopBtn = document.getElementById('stop');
const dragBox = document.getElementById('drag-box');
const bar = document.getElementById('bar');
const fpsEl = document.getElementById('fps-val');
const led = document.getElementById('status-led');
const log = document.getElementById('log');

let worker = null;
let isMainThread = false;
let progress = 0;

// -- 1. TACTILE DRAG SYSTEM (Main Thread) --
// If the main thread is busy, mousemove events won't fire, 
// and the box will "snap" or stop moving entirely.
let isDragging = false;
let offset = { x: 0, y: 0 };

dragBox.onmousedown = (e) => {
  isDragging = true;
  const rect = dragBox.getBoundingClientRect();
  offset.x = e.clientX - rect.left;
  offset.y = e.clientY - rect.top;
};

window.onmousemove = (e) => {
  if (!isDragging) return;
  dragBox.style.left = (e.clientX - offset.x - 20) + 'px';
  dragBox.style.top = (e.clientY - offset.y - 120) + 'px';
};

window.onmouseup = () => isDragging = false;

// -- 2. FPS MONITOR --
let lastTime = performance.now();
let frames = 0;
function monitor() {
  frames++;
  const now = performance.now();
  if (now > lastTime + 1000) {
    const fps = Math.round((frames * 1000) / (now - lastTime));
    fpsEl.textContent = fps;
    fpsEl.className = fps < 40 ? 'danger' : '';
    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(monitor);
}
requestAnimationFrame(monitor);

function logger(msg) { log.textContent = '> ' + msg; }

function cpuStress() {
  // Heavy computation that blocks for ~500ms
  let val = 0;
  for (let i = 0; i < 150000000; i++) val += Math.sqrt(i);
  return val;
}

function runMain() {
  halt();
  isMainThread = true;
  progress = 0;
  led.classList.add('active');
  logger('CRITICAL: Blocking Main Thread. Try dragging the blue puck...');
  
  const step = () => {
    if (!isMainThread) return;
    
    // HEAVY BLOCK: No code can run, no input is processed
    cpuStress(); 
    
    progress += 5;
    bar.style.width = progress + '%';
    
    if (progress < 100) {
      // Yield just long enough to see the stuttering state
      setTimeout(step, 10); 
    } else {
      halt();
      logger('Legacy process complete. UI thread released.');
    }
  };
  step();
}

function runWorker() {
  halt();
  progress = 0;
  led.classList.add('active');
  
  // SPAWN BACKGROUND THREAD
  const workerCode = \`
    self.onmessage = () => {
      for(let p=1; p<=20; p++) {
        let val = 0;
        for(let i=0; i<150000000; i++) val += Math.sqrt(i);
        self.postMessage(p * 5);
      }
    };
  \`;
  
  const blob = new Blob([workerCode], { type: 'text/javascript' });
  worker = new Worker(URL.createObjectURL(blob));
  
  worker.onmessage = (e) => {
    progress = e.data;
    bar.style.width = progress + '%';
    if (progress >= 100) {
      halt();
      logger('Mastering successful. Background threads are powerful.');
    }
  };
  
  logger('SUCCESS: Thread offloaded. The UI is 100% idle and smooth.');
  worker.postMessage('start');
}

function halt() {
  isMainThread = false;
  if (worker) {
    worker.terminate();
    worker = null;
  }
  led.classList.remove('active');
  bar.style.width = '0%';
}

mainBtn.onclick = runMain;
workerBtn.onclick = runWorker;
stopBtn.onclick = halt;`
  },
  editor: {
    html: `<div class="vortex-app">
  <header>
    <div class="logo">VORTEX<span>MASTER</span></div>
    <div class="monitor">UI PERFORMANCE: <span id="fps-val">60</span> FPS</div>
  </header>
  
  <div class="main-layout">
    <div class="v-panel engine-room">
      <div class="deck-header">
        <h4>HIGH-FIDELITY EXPORT ENGINE</h4>
        <div id="status-led" class="led"></div>
      </div>
      
      <div class="tactile-zone">
        <div id="drag-box" class="drag-puck">DRAG ME</div>
        <p class="hint">Try dragging this puck while "Mastering"</p>
      </div>

      <div class="actions">
        <button id="main" class="danger-btn">LEGACY RENDER (BLOCKING)</button>
        <button id="worker" class="primary-btn">STUDIO ENGINE (ISOLATED)</button>
      </div>
      
      <div class="progress-wrap">
        <label>EXPORT CONTEXT BUFFER</label>
        <div class="progress-bar"><div id="bar"></div></div>
      </div>
    </div>
  </div>
  
  <pre id="log">Engine ready...</pre>
</div>`,
    css: `body {
  margin: 0;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: #090d14;
  color: #edf3ff;
  user-select: none;
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
.logo span { color: #0284c7; }

.monitor {
  font-family: monospace;
  font-size: 10px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

.v-panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 25px;
}

.tactile-zone {
  background: #000;
  height: 180px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-puck {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 10px;
  cursor: grab;
  position: absolute;
}

.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 25px; }
button { padding: 14px; border: 0; border-radius: 10px; font-weight: 700; cursor: pointer; }
.primary-btn { background: #0284c7; color: white; }
.danger-btn { background: #ef4444; color: white; }

.progress-bar { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
#bar { width: 0%; height: 100%; background: #0284c7; }

#log { margin-top: auto; font-family: monospace; font-size: 11px; color: #0284c7; }`,
    js: `
// 1. WATCH THE FPS COUNTER ABOVE:
// As you implement these, notice how the 60FPS target behaves.

function runMain() {
  // 1. Run cpuStress() in a loop to simulate "Mastering"
  // 2. Update the 'bar' width and 'log' text
  // 3. Use setTimeout(step, 0) to allow the UI to paint (poorly)
  // TODO: Run heavy processing on the UI thread
}

function runWorker() {
  // 1. Create a raw JS string for the worker logic
  // 2. The string should listen for 'message' and run cpuStress in a loop
  // 3. Create a Worker via URL.createObjectURL(new Blob([code]))
  // 4. Update the main UI progress bar when the worker sends messages
  // TODO: Offload heavy processing to a background thread
}

// -- Helper: Non-trivial computation --
function cpuStress() {
  let val = 0;
  for (let i = 0; i < 150000000; i++) val += Math.sqrt(i);
  return val;
}

document.getElementById('main').onclick = runMain;
document.getElementById('worker').onclick = runWorker;`
  },
  steps: [
    {
      title: 'UI Blocking',
      lang: 'js',
      startLine: 390,
      instruction: 'Call `cpuStress()` in a loop. Use `setTimeout(step, 0)` to allow the progress bar to paint (badly).'
    },
    {
      title: 'Worker Setup',
      lang: 'js',
      startLine: 395,
      instruction: '1. Create a Blob of JS code. 2. `new Worker(URL.createObjectURL(blob))`. 3. `worker.postMessage()` to start.'
    },
    {
      title: 'Worker Listen',
      lang: 'js',
      startLine: 395,
      instruction: 'Inside the Worker, use `self.onmessage` and `self.postMessage(progress)` to send data back.'
    }
  ]
};
