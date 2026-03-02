/**
 * Windows 95 Desktop Visualizer
 * Icons bounce and react to the music beat
 */

import * as THREE from 'three';

let desktopElement = null;
let earthScene = null;
let earthCamera = null;
let earthRenderer = null;
let earthMesh = null;
let earthAnimationId = null;
let icons = [];
let analyser = null;
let dataArray = null;
let audioElement = null;
let loginDialogShown = false;
let updateDialogShown = false;
let errorWindowsShown = false;
let browserShown = false;
let earthShown = false;
let brickWallShown = false;
let brickWallExploded = false;

// Classic Win95 icons
const iconData = [
  { name: 'My Computer', icon: '🖥️' },
  { name: 'Recycle Bin', icon: '🗑️' },
  { name: 'My Documents', icon: '📁' },
  { name: 'Network', icon: '🌐' },
  { name: 'Internet Explorer', icon: '🌍' },
  { name: 'Netscape', icon: '🧭' },
  { name: 'AOL', icon: '📧' },
  { name: 'Notepad', icon: '📝' },
  { name: 'Paint', icon: '🎨' },
  { name: 'Calculator', icon: '🔢' },
  { name: 'Minesweeper', icon: '💣' },
  { name: 'Solitaire', icon: '🃏' },
  { name: 'WinZip', icon: '📦' },
  { name: 'MS Word', icon: '📄' },
  { name: 'MS Excel', icon: '📊' },
  { name: 'Outlook', icon: '📬' },
  { name: 'Control Panel', icon: '⚙️' },
  { name: 'Defrag', icon: '💾' },
  { name: 'Media Player', icon: '🎵' },
  { name: 'RealPlayer', icon: '▶️' },
];

/**
 * Initialize the Win95 desktop visualizer
 */
export function initWin95Desktop(container, audioContext, sourceNode, audio = null) {
  desktopElement = container;
  audioElement = audio;

  // Create analyser
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  sourceNode.connect(analyser);

  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Create desktop HTML
  createDesktop();

  return { analyser };
}

/**
 * Create the Win95 desktop layout
 */
function createDesktop() {
  desktopElement.innerHTML = `
    <div class="win95-desktop">
      <div class="win95-icons" id="win95-icons"></div>

      <!-- Winamp Clone -->
      <div class="winamp-player" id="winamp-player">
        <div class="winamp-titlebar">
          <span class="winamp-title">WEBAMP - It really whips the browser's cache!</span>
          <div class="winamp-buttons">
            <span class="winamp-btn">_</span>
            <span class="winamp-btn">□</span>
            <span class="winamp-btn">×</span>
          </div>
        </div>
        <div class="winamp-display">
          <div class="winamp-visualizer">
            <canvas id="winamp-viz" width="200" height="48"></canvas>
          </div>
          <div class="winamp-info">
            <div class="winamp-time" id="winamp-time">00:00</div>
            <div class="winamp-track">Todo en Web</div>
            <div class="winamp-artist">VictorSanchez feat. Claude</div>
          </div>
        </div>
        <div class="winamp-controls">
          <button class="winamp-ctrl-btn">⏮</button>
          <button class="winamp-ctrl-btn active">▶</button>
          <button class="winamp-ctrl-btn">⏸</button>
          <button class="winamp-ctrl-btn">⏹</button>
          <button class="winamp-ctrl-btn">⏭</button>
        </div>
        <div class="winamp-volume">
          <span>VOL</span>
          <div class="winamp-slider">
            <div class="winamp-slider-fill"></div>
          </div>
          <span style="margin-left: 10px">BAL</span>
          <div class="winamp-slider">
            <div class="winamp-slider-fill" style="width: 50%; margin-left: 25%"></div>
          </div>
        </div>
        <div class="winamp-eq">
          <div class="eq-bar" style="height: 60%"></div>
          <div class="eq-bar" style="height: 80%"></div>
          <div class="eq-bar" style="height: 40%"></div>
          <div class="eq-bar" style="height: 70%"></div>
          <div class="eq-bar" style="height: 50%"></div>
          <div class="eq-bar" style="height: 90%"></div>
          <div class="eq-bar" style="height: 30%"></div>
          <div class="eq-bar" style="height: 65%"></div>
          <div class="eq-bar" style="height: 75%"></div>
          <div class="eq-bar" style="height: 45%"></div>
        </div>

        <!-- Playlist Window -->
        <div class="winamp-playlist">
          <div class="playlist-titlebar">
            <span>WEBAMP PLAYLIST</span>
          </div>
          <div class="playlist-content" id="playlist-content">
            <div class="playlist-item active">1. Todo en Web - VictorSanchez (3:42)</div>
            <div class="playlist-item">2. Bye Bye IE - *NSYNC* (3:15)</div>
            <div class="playlist-item">3. Crazy in Code - Beyoncé (3:56)</div>
            <div class="playlist-item">4. Hey API! - OutKast (3:28)</div>
            <div class="playlist-item">5. In Da GitHub - 50 Cent (3:45)</div>
            <div class="playlist-item">6. Mr. Serverside - The Killers (3:52)</div>
            <div class="playlist-item">7. Toxic.js - Britney Spears (3:31)</div>
            <div class="playlist-item">8. YAML! - Usher ft. Lil Config (4:10)</div>
            <div class="playlist-item">9. Deprecated - Avril Lavigne (4:02)</div>
            <div class="playlist-item">10. Hot in Dev - Nelly (3:48)</div>
            <div class="playlist-item">11. Lose Your Cache - Eminem (5:26)</div>
            <div class="playlist-item">12. Boulevard of Broken Builds - Green Day (4:20)</div>
            <div class="playlist-item">13. Bring Me to Prod - Evanescence (3:58)</div>
            <div class="playlist-item">14. Since U Been Deployed - Kelly Clarkson (3:35)</div>
            <div class="playlist-item">15. Seven Layer Stack - White Stripes (3:52)</div>
            <div class="playlist-item">16. Feel Good API - Gorillaz (4:15)</div>
          </div>
          <div class="playlist-footer">
            <span>16 tracks - 1:02:35</span>
          </div>
        </div>
      </div>

      <div class="win95-taskbar">
        <button class="start-button">
          <span class="start-logo">🪟</span>
          <span>Start</span>
        </button>
        <div class="taskbar-tray">
          <span class="tray-time" id="tray-time">12:00 AM</span>
        </div>
      </div>

      <!-- Win95 Login Dialog (appears when "clave" is sung ~8s) -->
      <div class="win95-dialog" id="login-dialog">
        <div class="dialog-titlebar">
          <span class="dialog-icon">🔐</span>
          <span class="dialog-title">Enter Network Password</span>
          <button class="dialog-close">×</button>
        </div>
        <div class="dialog-content">
          <div class="dialog-icon-large">🔑</div>
          <div class="dialog-form">
            <p class="dialog-text">Please enter your password to connect to:<br><strong>\\\\SERVIDOR\\MisDocumentos</strong></p>
            <div class="dialog-field">
              <label>User name:</label>
              <input type="text" value="VictorSanchez" readonly>
            </div>
            <div class="dialog-field">
              <label>Password:</label>
              <input type="password" value="••••••••" readonly>
            </div>
            <div class="dialog-checkbox">
              <input type="checkbox" checked readonly>
              <label>Save this password</label>
            </div>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="dialog-btn">OK</button>
          <button class="dialog-btn">Cancel</button>
        </div>
      </div>

      <!-- Container for cascading error windows -->
      <div id="error-windows-container"></div>

      <!-- Netscape Browser Window (appears when "abro el navegador" ~27s) -->
      <div class="win95-browser" id="browser-window">
        <div class="browser-titlebar">
          <span class="browser-icon">🌐</span>
          <span class="browser-title">Netscape Navigator - [Welcome to the World Wide Web]</span>
          <div class="winamp-buttons">
            <span class="winamp-btn">_</span>
            <span class="winamp-btn">□</span>
            <span class="winamp-btn">×</span>
          </div>
        </div>
        <div class="browser-toolbar">
          <button class="browser-btn">⬅ Back</button>
          <button class="browser-btn">➡ Forward</button>
          <button class="browser-btn">🔄 Reload</button>
          <button class="browser-btn">🏠 Home</button>
          <button class="browser-btn">🔍 Search</button>
        </div>
        <div class="browser-address">
          <span>Location:</span>
          <input type="text" value="http://www.the-world-wide-web.com/" readonly>
          <span class="browser-loading">🌍</span>
        </div>
        <div class="browser-content">
          <div class="browser-page" id="browser-page">
            <h1>🌐 Welcome to the World Wide Web!</h1>
            <marquee>*** The Information Superhighway awaits! ***</marquee>
            <p>You are now connected to the <b>INTERNET</b>!</p>
            <hr>
            <p><a href="#">Click here</a> to explore the world!</p>
          </div>
          <!-- Spinning Earth inside browser (appears when "el mundo se echa a rodar") -->
          <div class="browser-earth-container" id="spinning-earth">
            <canvas id="earth-canvas"></canvas>
          </div>
        </div>
        <div class="browser-status">
          <span>🔒 Document: Done</span>
          <span class="browser-progress"></span>
        </div>
      </div>

      <!-- Win95 Update Dialog (appears when "mil ventanas actualizar" ~12s) -->
      <div class="win95-dialog" id="update-dialog">
        <div class="dialog-titlebar">
          <span class="dialog-icon">⚠️</span>
          <span class="dialog-title">Windows Update</span>
          <button class="dialog-close">×</button>
        </div>
        <div class="dialog-content">
          <div class="dialog-icon-large">💿</div>
          <div class="dialog-form">
            <p class="dialog-text" style="font-weight: bold; color: #000080;">
              New version available!
            </p>
            <p class="dialog-text">
              Windows 95 OSR2 is now available.<br><br>
              Visit your local computer store and purchase the CD-ROM for only <strong>$199.99</strong>
            </p>
            <p class="dialog-text" style="font-size: 10px; color: #666; margin-top: 8px;">
              * Requires 8MB RAM and 100MB disk space
            </p>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="dialog-btn">Remind me later</button>
          <button class="dialog-btn">Go to store</button>
        </div>
      </div>
    </div>
  `;

  // Add icons
  const iconsContainer = document.getElementById('win95-icons');
  icons = [];

  iconData.forEach((data, index) => {
    const icon = document.createElement('div');
    icon.className = 'win95-icon';
    icon.innerHTML = `
      <div class="icon-image">${data.icon}</div>
      <div class="icon-label">${data.name}</div>
    `;

    // Position in columns along left side (classic Win95 style)
    const col = Math.floor(index / 5); // 5 icons per column
    const row = index % 5;
    const baseX = 30 + col * 120; // 120px between columns
    const baseY = 30 + row * 100; // 100px between rows

    icon.style.left = `${baseX}px`;
    icon.style.top = `${baseY}px`;

    // Store original position for animation
    icon.dataset.baseX = baseX;
    icon.dataset.baseY = baseY;
    icon.dataset.phase = Math.random() * Math.PI * 2; // Random phase for varied bouncing

    iconsContainer.appendChild(icon);
    icons.push(icon);
  });

  // Update time
  updateTrayTime();
  setInterval(updateTrayTime, 1000);
}

/**
 * Update the taskbar time
 */
function updateTrayTime() {
  const timeEl = document.getElementById('tray-time');
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

// Timed events for Win95 desktop
const TIMED_EVENTS = {
  loginDialog: { showAt: 8.0, hideAt: 11.5 },      // "otra clave que olvidar"
  updateDialog: { showAt: 12.0, hideAt: 17.0 },    // "mil ventanas... actualizar"
  errorWindows: { showAt: 17.5, hideAt: 25.0 },    // Cascade of error windows!
  browser: { showAt: 26.5, hideAt: 46.0 },         // "Abro el navegador" - stays until visualizer switch
  spinningEarth: { showAt: 29.5, hideAt: 46.0 },   // "el mundo se echa a rodar" - stays until visualizer switch
  brickWall: { showAt: 40.0, hideAt: 44.0 }  // "lo que antes era un muro" - wall builds until WebGL switch (explosion triggered from main.js)
};

/**
 * Update the visualizer - call this in animation loop
 */
export function updateWin95Desktop() {
  if (!analyser || !dataArray || icons.length === 0) return;

  analyser.getByteFrequencyData(dataArray);

  // Handle timed events
  if (audioElement) {
    const currentTime = audioElement.currentTime;
    handleTimedEvents(currentTime);
  }

  // Get bass (low frequencies) for the main bounce
  const bass = getAverageFrequency(0, 10);
  // Get mids for secondary movement
  const mids = getAverageFrequency(10, 50);
  // Get highs for sparkle effects
  const highs = getAverageFrequency(50, 100);

  const normalizedBass = bass / 255;
  const normalizedMids = mids / 255;

  icons.forEach((icon, index) => {
    const phase = parseFloat(icon.dataset.phase);
    const baseX = parseFloat(icon.dataset.baseX);
    const baseY = parseFloat(icon.dataset.baseY);

    // Bounce amount based on bass
    const bounceY = normalizedBass * 30;
    const bounceX = normalizedMids * 10 * Math.sin(phase + Date.now() / 200);

    // Scale pulse on beat
    const scale = 1 + normalizedBass * 0.3;

    // Apply transforms
    icon.style.transform = `
      translateX(${bounceX}px)
      translateY(${-bounceY}px)
      scale(${scale})
    `;

    // Glow effect on strong beats
    if (normalizedBass > 0.7) {
      icon.classList.add('beat');
    } else {
      icon.classList.remove('beat');
    }
  });

  // Make taskbar pulse slightly
  const taskbar = document.querySelector('.win95-taskbar');
  if (taskbar) {
    taskbar.style.boxShadow = `inset 0 0 ${normalizedBass * 20}px rgba(255,255,255,${normalizedBass * 0.3})`;
  }

  // Update Winamp visualizer
  updateWinampVisualizer();

  // Update Winamp EQ bars
  const eqBars = document.querySelectorAll('.winamp-player .eq-bar');
  eqBars.forEach((bar, i) => {
    const freqIndex = Math.floor((i / eqBars.length) * 64);
    const value = dataArray[freqIndex] / 255;
    bar.style.height = `${20 + value * 80}%`;
  });
}

/**
 * Update the Winamp oscilloscope visualizer
 */
function updateWinampVisualizer() {
  const canvas = document.getElementById('winamp-viz');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear with dark background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Draw frequency bars (classic Winamp style)
  const barCount = 40;
  const barWidth = width / barCount - 1;

  for (let i = 0; i < barCount; i++) {
    const freqIndex = Math.floor((i / barCount) * 128);
    const value = dataArray[freqIndex] / 255;
    const barHeight = value * height;

    // Gradient from green to yellow to red
    const hue = 120 - (value * 120); // 120 = green, 0 = red
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

    ctx.fillRect(
      i * (barWidth + 1),
      height - barHeight,
      barWidth,
      barHeight
    );
  }

  // Update time display
  if (audioElement) {
    const timeEl = document.getElementById('winamp-time');
    if (timeEl) {
      const currentTime = audioElement.currentTime;
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60);
      timeEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}

/**
 * Get average frequency in a range
 */
function getAverageFrequency(start, end) {
  let sum = 0;
  for (let i = start; i < end && i < dataArray.length; i++) {
    sum += dataArray[i];
  }
  return sum / (end - start);
}

/**
 * Handle timed events based on audio position
 * Properly handles scrubbing forwards AND backwards in timeline
 */
function handleTimedEvents(currentTime) {
  // Login Dialog - "otra clave que olvidar"
  const loginDialog = document.getElementById('login-dialog');
  if (loginDialog) {
    const { showAt, hideAt } = TIMED_EVENTS.loginDialog;
    const shouldShow = currentTime >= showAt && currentTime < hideAt;

    if (shouldShow && !loginDialog.classList.contains('visible')) {
      loginDialog.classList.add('visible');
    } else if (!shouldShow && loginDialog.classList.contains('visible')) {
      loginDialog.classList.remove('visible');
    }
    loginDialogShown = shouldShow;
  }

  // Update Dialog - "mil ventanas... actualizar"
  const updateDialog = document.getElementById('update-dialog');
  if (updateDialog) {
    const { showAt, hideAt } = TIMED_EVENTS.updateDialog;
    const shouldShow = currentTime >= showAt && currentTime < hideAt;

    if (shouldShow && !updateDialog.classList.contains('visible')) {
      updateDialog.classList.add('visible');
    } else if (!shouldShow && updateDialog.classList.contains('visible')) {
      updateDialog.classList.remove('visible');
    }
    updateDialogShown = shouldShow;
  }

  // Error Windows Cascade - meme effect!
  const { showAt: errShowAt, hideAt: errHideAt } = TIMED_EVENTS.errorWindows;
  const shouldShowErrors = currentTime >= errShowAt && currentTime < errHideAt;

  if (shouldShowErrors && !errorWindowsShown) {
    spawnErrorWindows();
    errorWindowsShown = true;
  } else if (!shouldShowErrors && errorWindowsShown) {
    clearErrorWindows();
    errorWindowsShown = false;
  }

  // Extra safety: always clear error windows if we're outside the time range
  if (!shouldShowErrors) {
    const container = document.getElementById('error-windows-container');
    if (container && container.children.length > 0) {
      container.innerHTML = '';
      errorWindowsShown = false;
    }
  }

  // Browser Window - "Abro el navegador"
  const browserWindow = document.getElementById('browser-window');
  if (browserWindow) {
    const { showAt, hideAt } = TIMED_EVENTS.browser;
    const shouldShow = currentTime >= showAt && currentTime < hideAt;

    if (shouldShow && !browserWindow.classList.contains('visible')) {
      browserWindow.classList.add('visible');
    } else if (!shouldShow && browserWindow.classList.contains('visible')) {
      browserWindow.classList.remove('visible');
    }
    browserShown = shouldShow;
  }

  // Spinning Earth - "el mundo se echa a rodar"
  const earthContainer = document.getElementById('spinning-earth');
  const browserPage = document.getElementById('browser-page');
  if (earthContainer) {
    const { showAt, hideAt } = TIMED_EVENTS.spinningEarth;
    const shouldShow = currentTime >= showAt && currentTime < hideAt;

    if (shouldShow && !earthContainer.classList.contains('visible')) {
      earthContainer.classList.add('visible');
      if (browserPage) browserPage.classList.add('hidden');
      startEarthAnimation();
    } else if (!shouldShow && earthContainer.classList.contains('visible')) {
      earthContainer.classList.remove('visible');
      if (browserPage) browserPage.classList.remove('hidden');
      stopEarthAnimation();
    }
    earthShown = shouldShow;
  }

  // Handle brick wall ("lo que antes era un muro") - only builds wall, explosion is triggered from main.js
  const { showAt, hideAt } = TIMED_EVENTS.brickWall;
  const shouldShow = currentTime >= showAt && currentTime < hideAt;

  if (shouldShow && !brickWallShown) {
    buildBrickWall();
    brickWallShown = true;
  } else if (!shouldShow && brickWallShown) {
    clearBrickWall();
    brickWallShown = false;
  }
}

/**
 * Spawn cascading error windows (classic meme!) - DRAMATIC VERSION
 */
function spawnErrorWindows() {
  const container = document.getElementById('error-windows-container');
  if (!container) return;

  const errorMessages = [
    { title: 'Error', icon: '⚠️', text: 'An error has occurred.' },
    { title: 'Warning', icon: '⚠️', text: 'Too many windows open!' },
    { title: 'Critical Error', icon: '❌', text: 'System resources low.' },
    { title: 'Error', icon: '⚠️', text: 'Cannot update Windows.' },
    { title: 'Fatal Exception', icon: '💀', text: 'A fatal exception 0E has occurred.' },
    { title: 'Error', icon: '❌', text: 'Not enough memory.' },
    { title: 'Warning', icon: '⚠️', text: 'Please close some windows.' },
    { title: 'Error', icon: '⚠️', text: 'Operation failed.' },
    { title: 'Error', icon: '❌', text: 'Cannot read from drive C:' },
    { title: 'BSOD Imminent', icon: '💀', text: 'System halted.' },
    { title: 'Error', icon: '⚠️', text: 'Stack overflow.' },
    { title: 'Warning', icon: '⚠️', text: 'Disk almost full.' },
    { title: 'Error', icon: '❌', text: 'General Protection Fault' },
    { title: 'Error', icon: '⚠️', text: 'IRQ conflict detected.' },
    { title: 'Critical', icon: '💀', text: 'Kernel panic!' }
  ];

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const totalWindows = 50; // LOTS of windows!

  // Spawn windows with staggered timing - faster and more chaotic
  for (let i = 0; i < totalWindows; i++) {
    setTimeout(() => {
      const msg = errorMessages[i % errorMessages.length];
      const win = document.createElement('div');
      win.className = 'error-window';
      win.innerHTML = `
        <div class="error-titlebar">
          <span>${msg.icon} ${msg.title}</span>
          <button class="dialog-close">×</button>
        </div>
        <div class="error-content">
          <span class="error-icon">${msg.icon}</span>
          <span>${msg.text}</span>
        </div>
        <div class="error-buttons">
          <button class="dialog-btn">OK</button>
        </div>
      `;

      // Spread across entire screen with cascade offset
      const cascadeOffset = (i % 8) * 25;
      const randomX = Math.random() * (screenW - 300);
      const randomY = Math.random() * (screenH - 200);
      win.style.left = `${Math.min(randomX + cascadeOffset, screenW - 280)}px`;
      win.style.top = `${Math.min(randomY + cascadeOffset, screenH - 150)}px`;
      win.style.zIndex = 400 + i; // Stack on top of each other

      container.appendChild(win);

      // Animate in with slight random delay
      setTimeout(() => win.classList.add('visible'), Math.random() * 50);
    }, i * 60); // Faster spawning - 60ms between each
  }
}

/**
 * Clear all error windows
 */
function clearErrorWindows() {
  const container = document.getElementById('error-windows-container');
  if (container) {
    container.innerHTML = '';
  }
}

/**
 * Helper to adjust hex color brightness
 */
function adjustBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Build the brick wall - bricks fall one by one
 */
function buildBrickWall() {
  // Create container dynamically in body (ensures proper z-index stacking)
  let container = document.getElementById('brick-wall-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'brick-wall-container';
    container.className = 'brick-wall-container';
    document.body.appendChild(container);
  }

  console.log('🧱 Building brick wall...');

  container.innerHTML = '';
  container.classList.add('visible');

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // Brick dimensions (grid cell size)
  const cellW = 82;
  const cellH = 42;
  // Actual brick size (smaller for mortar gap)
  const brickW = 78;
  const brickH = 38;
  const mortarGap = 2;

  const cols = Math.ceil(screenW / cellW) + 1;
  const rows = Math.ceil(screenH / cellH) + 1;

  const totalBricks = cols * rows;
  const buildDuration = 4000; // 4 seconds to build wall (40s to 44s, explosion at 44.5s)
  const delayPerBrick = buildDuration / totalBricks;

  // Create bricks - build from bottom-up like a real wall
  for (let row = rows - 1; row >= 0; row--) {
    for (let col = 0; col < cols; col++) {
      const brick = document.createElement('div');
      brick.className = 'brick';

      // Offset every other row for realistic brick pattern
      const offsetX = (row % 2 === 0) ? 0 : cellW / 2;
      const x = col * cellW - offsetX + mortarGap;
      const y = row * cellH + mortarGap;

      brick.style.left = `${x}px`;
      brick.style.top = `${y}px`;
      brick.style.width = `${brickW}px`;
      brick.style.height = `${brickH}px`;

      // Random red clay brick color variations
      const brickColors = [
        '#b5533f', '#a34832', '#8b3a2f', '#9c4535', '#c45c42',
        '#8f3f30', '#a04a3a', '#b85540', '#7d3528', '#924238',
        '#af5040', '#983d2e', '#c25545', '#853325', '#9a4030'
      ];
      const baseColor = brickColors[Math.floor(Math.random() * brickColors.length)];
      brick.style.background = `linear-gradient(135deg, ${baseColor} 0%, ${adjustBrightness(baseColor, -20)} 100%)`;

      // Store position for explosion
      brick.dataset.x = x + brickW / 2;
      brick.dataset.y = y + brickH / 2;

      container.appendChild(brick);

      // Calculate delay - bottom rows first, with some randomness
      const rowFromBottom = rows - 1 - row;
      const brickIndex = rowFromBottom * cols + col;
      const delay = brickIndex * delayPerBrick + (Math.random() * 50);

      // Show brick after delay
      setTimeout(() => {
        brick.classList.add('visible');
      }, delay);
    }
  }

  console.log(`🧱 Created ${totalBricks} bricks (${cols} cols x ${rows} rows)`);
}

/**
 * Explode the brick wall - bricks fly outward
 */
export function explodeBrickWall() {
  const container = document.getElementById('brick-wall-container');
  if (!container) return;

  console.log('💥 BRICK WALL EXPLODING!');

  const bricks = container.querySelectorAll('.brick');
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  console.log(`Found ${bricks.length} bricks to explode`);

  bricks.forEach((brick, i) => {
    const brickX = parseFloat(brick.dataset.x) || 0;
    const brickY = parseFloat(brick.dataset.y) || 0;

    // Calculate explosion vector from center
    const dx = brickX - centerX;
    const dy = brickY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;

    // Explosion force - farther bricks fly further, much stronger
    const force = 1200 + Math.random() * 800;
    const translateX = normalizedDx * force;
    const translateY = normalizedDy * force;

    // Random rotation for dramatic effect
    const rotateX = (Math.random() - 0.5) * 1080;
    const rotateY = (Math.random() - 0.5) * 1080;
    const rotateZ = (Math.random() - 0.5) * 1080;

    // Add exploding class and apply transform
    brick.classList.add('exploding');

    // Small delay for wave effect from center
    const distanceDelay = (distance / 1000) * 100; // Center explodes first

    setTimeout(() => {
      brick.style.transform = `translate(${translateX}px, ${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(0.5)`;
      brick.style.opacity = '0';
    }, distanceDelay);
  });

  // Self-cleanup after explosion animation completes (wall persists across screen switch)
  setTimeout(() => {
    console.log('🧹 Cleaning up brick wall');
    clearBrickWall();
  }, 1500); // 1.5 seconds for explosion animation to complete
}

/**
 * Clear the brick wall
 */
function clearBrickWall() {
  const container = document.getElementById('brick-wall-container');
  if (container) {
    container.classList.remove('visible');
    container.innerHTML = '';
  }
  // Reset flags so wall can show again if user scrubs back
  brickWallShown = false;
  brickWallExploded = false;
}

/**
 * Initialize 3D Earth with Three.js
 */
function initEarth3D() {
  const canvas = document.getElementById('earth-canvas');
  if (!canvas) return;

  const container = canvas.parentElement;
  const width = container.clientWidth || 400;
  const height = container.clientHeight || 300;

  // Scene
  earthScene = new THREE.Scene();

  // Camera
  earthCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  earthCamera.position.z = 3;

  // Renderer
  earthRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  earthRenderer.setSize(width, height);
  earthRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Create Earth
  const geometry = new THREE.SphereGeometry(1, 64, 64);

  // Create procedural Earth texture
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 1024;
  textureCanvas.height = 512;
  const ctx = textureCanvas.getContext('2d');

  // Ocean
  ctx.fillStyle = '#1a4d7c';
  ctx.fillRect(0, 0, 1024, 512);

  // Continents (simplified)
  ctx.fillStyle = '#2d5a2d';

  // North America
  ctx.beginPath();
  ctx.ellipse(200, 150, 100, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  // South America
  ctx.beginPath();
  ctx.ellipse(280, 320, 50, 100, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Europe/Africa
  ctx.beginPath();
  ctx.ellipse(520, 200, 60, 150, 0, 0, Math.PI * 2);
  ctx.fill();

  // Asia
  ctx.beginPath();
  ctx.ellipse(700, 150, 150, 100, 0, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.beginPath();
  ctx.ellipse(820, 350, 50, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  // Add some noise/detail
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? '#1e6b1e' : '#3d7a3d';
    ctx.fillRect(x, y, 3 + Math.random() * 5, 3 + Math.random() * 5);
  }

  const texture = new THREE.CanvasTexture(textureCanvas);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
    metalness: 0.1
  });

  earthMesh = new THREE.Mesh(geometry, material);
  earthScene.add(earthMesh);

  // Atmosphere glow
  const atmosphereGeometry = new THREE.SphereGeometry(1.1, 64, 64);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x4da6ff,
    transparent: true,
    opacity: 0.15,
    side: THREE.BackSide
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  earthScene.add(atmosphere);

  // Lights
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  earthScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 3, 5);
  earthScene.add(directionalLight);

  // Stars background
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 1000;
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 100;
    starPositions[i + 1] = (Math.random() - 0.5) * 100;
    starPositions[i + 2] = -50 + Math.random() * -50;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
  const stars = new THREE.Points(starGeometry, starMaterial);
  earthScene.add(stars);
}

/**
 * Animate the 3D Earth
 */
function animateEarth() {
  if (!earthMesh || !earthRenderer || !earthScene || !earthCamera) return;

  earthMesh.rotation.y += 0.01;

  earthRenderer.render(earthScene, earthCamera);
  earthAnimationId = requestAnimationFrame(animateEarth);
}

/**
 * Start Earth animation
 */
function startEarthAnimation() {
  if (!earthScene) {
    initEarth3D();
  }
  if (!earthAnimationId) {
    animateEarth();
  }
}

/**
 * Stop Earth animation
 */
function stopEarthAnimation() {
  if (earthAnimationId) {
    cancelAnimationFrame(earthAnimationId);
    earthAnimationId = null;
  }
}

/**
 * Clean up
 */
export function destroyWin95Desktop() {
  stopEarthAnimation();
  if (earthRenderer) {
    earthRenderer.dispose();
    earthRenderer = null;
  }
  earthScene = null;
  earthCamera = null;
  earthMesh = null;

  if (desktopElement) {
    desktopElement.innerHTML = '';
  }
  icons = [];
  analyser = null;
  dataArray = null;
  loginDialogShown = false;
  updateDialogShown = false;
  errorWindowsShown = false;
  browserShown = false;
  earthShown = false;
  // Note: brick wall flags NOT reset here - wall persists across screen switch and cleans itself up
}
