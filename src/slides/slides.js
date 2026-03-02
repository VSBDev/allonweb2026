/**
 * Slides Navigation
 * Handles keyboard navigation and slide transitions
 */

import { slides, getSlideCount } from './content.js';

let currentSlideIndex = 0;
let slidesContainer = null;
let progressBar = null;
let slideCounter = null;
const demoEditorStateBySlide = new WeakMap();
let demoEditorRetryCount = 0;
let keyboardNavigationInitialized = false;
let hashNavigationInitialized = false;
let lastSlideNavAt = 0;

const SLIDE_NAV_DEBOUNCE_MS = 140;

function parseMarkdown(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>');
}


const DEMO_LANGS = [
  { id: 'html', label: 'HTML', mode: 'htmlmixed' },
  { id: 'css', label: 'CSS', mode: 'css' },
  { id: 'js', label: 'JavaScript', mode: 'javascript' }
];

/**
 * Initialize slides system
 */
export function initSlides() {
  slidesContainer = document.getElementById('slides-container');
  progressBar = document.getElementById('slide-progress');
  slideCounter = document.getElementById('slide-counter');

  // Render all slides
  renderSlides();

  // Show first slide
  showSlide(0);

  // Initialize interactive editors
  initDemoEditors();

  // Set up keyboard navigation
  if (!keyboardNavigationInitialized) {
    setupKeyboardNavigation();
    keyboardNavigationInitialized = true;
  }

  // Set up hash navigation
  if (!hashNavigationInitialized) {
    setupHashNavigation();
    hashNavigationInitialized = true;
  }
}

/**
 * Render all slides to the DOM
 */
function renderSlides() {
  slidesContainer.innerHTML = slides.map((slide, index) => {
    return createSlideHTML(slide, index);
  }).join('');
}

/**
 * Create HTML for a single slide
 */
function createSlideHTML(slide, index) {
  let content = '';

  if (slide.type === 'title') {
    content = `
      <div class="slide-content title-slide">
        <h1>${parseMarkdown(escapeHTML(slide.title))}</h1>
        ${slide.subtitle ? `<p class="slide-subtitle">${parseMarkdown(escapeHTML(slide.subtitle))}</p>` : ''}
        ${slide.footer ? `<p class="slide-footer">${parseMarkdown(escapeHTML(slide.footer))}</p>` : ''}
      </div>
    `;
  } else if (slide.type === 'bullets') {
    content = createBulletsSlideHTML(slide);
  } else if (slide.type === 'speaker') {
    content = createSpeakerSlideHTML(slide);
  } else if (slide.type === 'demo-editor') {
    content = createDemoEditorHTML(slide, index);
  }

  return `
    <section class="slide" data-slide="${index}" data-id="${slide.id}">
      ${content}
    </section>
  `;
}

function createBulletsSlideHTML(slide) {
  const points = Array.isArray(slide.points) ? slide.points : [];

  return `
    <div class="slide-content bullets-slide">
      ${slide.kicker ? `<p class="slide-kicker">${parseMarkdown(escapeHTML(slide.kicker))}</p>` : ''}
      <h2>${parseMarkdown(escapeHTML(slide.title))}</h2>
      ${slide.subtitle ? `<p class="slide-subtitle">${parseMarkdown(escapeHTML(slide.subtitle))}</p>` : ''}
      <ul class="insight-list">
        ${points.map((point, index) => `
          <li class="insight-card">
            <span class="insight-number">${String(index + 1).padStart(2, '0')}</span>
            <span class="insight-text">${parseMarkdown(escapeHTML(point))}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function createSpeakerSlideHTML(slide) {
  const highlights = Array.isArray(slide.highlights) ? slide.highlights : [];
  const tags = Array.isArray(slide.tags) ? slide.tags : [];
  const links = Array.isArray(slide.links) ? slide.links : [];
  const safePhoto = slide.photo || '';

  return `
    <div class="slide-content speaker-slide">
      <div class="speaker-card">
        <div class="speaker-left">
          <div class="speaker-photo-shell">
            <img class="speaker-photo" src="${safePhoto}" alt="${escapeHTML(slide.name || slide.title || 'Speaker')}">
          </div>
          ${slide.role ? `<p class="speaker-role">${slide.role}</p>` : ''}
          <div class="speaker-tags">
            ${tags.map((tag) => `<span class="speaker-tag">${escapeHTML(tag)}</span>`).join('')}
          </div>
        </div>

        <div class="speaker-right">
          ${slide.kicker ? `<p class="slide-kicker">${parseMarkdown(escapeHTML(slide.kicker))}</p>` : ''}
          <h2>${parseMarkdown(escapeHTML(slide.title))}</h2>
          ${slide.subtitle ? `<p class="slide-subtitle">${parseMarkdown(escapeHTML(slide.subtitle))}</p>` : ''}
          ${slide.bio ? `<p class="speaker-bio">${parseMarkdown(escapeHTML(slide.bio))}</p>` : ''}

          <div class="speaker-highlights">
            ${highlights.map((item) => `
              <div class="speaker-highlight">${parseMarkdown(item)}</div>
            `).join('')}
          </div>

          <div class="speaker-links">
            ${links.map((link) => `
              <a class="speaker-link" href="${link.href}" target="_blank" rel="noopener noreferrer">${escapeHTML(link.label || 'Link')}</a>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function createDemoEditorHTML(slide, index) {
  const stepItems = getDemoSteps(slide);
  const previewFrameAttributes = getPreviewFrameAttributes(slide);

  return `
    <div class="slide-content demo-editor-slide" data-demo-id="${slide.id}" data-no-advance="true">
      <h2>${parseMarkdown(slide.title)}</h2>
      ${slide.subtitle ? `<p class="slide-subtitle">${parseMarkdown(slide.subtitle)}</p>` : ''}
      ${slide.description ? `<p class="demo-description">${parseMarkdown(slide.description)}</p>` : ''}

      <div class="demo-workbench" data-no-advance="true">
        <div class="demo-editor-shell" data-no-advance="true">
          <div class="demo-editor-topbar" data-no-advance="true">
            <div class="demo-file-tabs" role="tablist" aria-label="Code files">
              ${DEMO_LANGS.map((lang, idx) => `
                <button
                  class="demo-file-tab ${idx === 0 ? 'active' : ''}"
                  data-lang-tab="${lang.id}"
                  role="tab"
                  aria-selected="${idx === 0 ? 'true' : 'false'}"
                  type="button"
                >
                  ${lang.label}
                </button>
              `).join('')}
            </div>

            <div class="demo-editor-actions" data-no-advance="true">
              <button class="demo-btn" data-action="run" type="button">Run</button>
              <button class="demo-btn demo-btn-secondary" data-action="reset" type="button">Reset</button>
              <button class="demo-btn demo-btn-secondary" data-action="solution" type="button" style="display: ${slide.solution ? 'inline-block' : 'none'}">Show Solution</button>
            </div>
          </div>

          <div class="demo-editors-stage" data-no-advance="true">
            ${DEMO_LANGS.map((lang, idx) => `
              <div
                class="demo-editor-panel ${idx === 0 ? 'active' : ''}"
                data-lang-panel="${lang.id}"
                role="tabpanel"
              >
                <div class="demo-editor-host" data-editor-host="${lang.id}" aria-label="${lang.label} editor"></div>
              </div>
            `).join('')}
          </div>

          ${stepItems.length ? `
            <div class="demo-steps" data-no-advance="true">
              <div class="demo-steps-header">Code Steps</div>
              <div class="demo-step-buttons">
                ${stepItems.map((step, stepIndex) => `
                  <button class="demo-step-btn" data-step-index="${stepIndex}" type="button">
                    <span class="demo-step-number">${stepIndex + 1}</span>
                    <span class="demo-step-title">${parseMarkdown(escapeHTML(step.title || step.label || `Step ${stepIndex + 1}`))}</span>
                    <span class="demo-step-file">${(step.lang || 'code').toUpperCase()}</span>
                  </button>
                `).join('')}
              </div>
              <p class="demo-step-body" data-step-body></p>
              <div class="demo-step-actions">
                <button class="demo-step-nav" data-step-nav="prev" type="button">Previous Step</button>
                <button class="demo-step-nav" data-step-nav="next" type="button">Next Step</button>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="demo-preview-pane" data-no-advance="true">
          <div class="editor-label">Live Preview</div>
          <iframe
            class="demo-preview"
            title="Demo Preview ${index + 1}"
            ${previewFrameAttributes}
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  `;
}

function getPreviewFrameAttributes(slide) {
  const allowList = [
    'clipboard-read',
    'clipboard-write',
    'camera',
    'microphone',
    'midi',
    'file-system-access',
    'display-capture'
  ];
  const allowAttr = `allow="${allowList.join('; ')}"`;

  // Capability demos (file system, OPFS, camera/mic) cannot run in sandboxed frames.
  if (slide.previewSandbox === false) {
    return `sandbox="allow-scripts allow-modals allow-same-origin allow-downloads allow-popups allow-forms" ${allowAttr}`;
  }

  return `sandbox="allow-scripts allow-modals allow-downloads" ${allowAttr}`;
}

function getDemoSteps(slide) {
  if (Array.isArray(slide.steps) && slide.steps.length) {
    return slide.steps;
  }
  if (Array.isArray(slide.focuses) && slide.focuses.length) {
    return slide.focuses;
  }
  return [];
}

function escapeHTML(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeScriptEndTags(str) {
  return str.replace(/<\/script/gi, '<\\/script');
}

function buildPreviewDocument(html, css, js) {
  const safeJS = escapeScriptEndTags(js);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    html, body { margin: 0; padding: 0; min-height: 100%; }
    body { background: #070a12; color: #fff; }
  </style>
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>
    (function () {
      function showError(message) {
        var pre = document.createElement('pre');
        pre.textContent = String(message);
        pre.style.position = 'fixed';
        pre.style.right = '12px';
        pre.style.bottom = '12px';
        pre.style.maxWidth = '60vw';
        pre.style.padding = '10px 12px';
        pre.style.margin = '0';
        pre.style.borderRadius = '8px';
        pre.style.background = 'rgba(0,0,0,0.75)';
        pre.style.color = '#ffb4b4';
        pre.style.border = '1px solid rgba(255,80,80,0.5)';
        pre.style.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
        pre.style.whiteSpace = 'pre-wrap';
        document.body.appendChild(pre);
      }

      window.addEventListener('error', function (event) {
        showError('Runtime error: ' + event.message);
      });

      window.addEventListener('unhandledrejection', function () {
        showError('Unhandled promise rejection');
      });

      try {
        ${safeJS}
      } catch (error) {
        showError(error && (error.stack || error.message) ? (error.stack || error.message) : String(error));
      }
    })();
  <\/script>
</body>
</html>`;
}

function createCodeEditor(host, { value, mode, onRun }) {
  if (window.CodeMirror) {
    const cm = window.CodeMirror(host, {
      value,
      mode,
      theme: 'material-darker',
      lineNumbers: true,
      lineWrapping: true,
      styleActiveLine: true,
      tabSize: 2,
      indentUnit: 2,
      indentWithTabs: false,
      viewportMargin: Infinity,
      extraKeys: {
        'Cmd-Enter': () => onRun(),
        'Ctrl-Enter': () => onRun()
      }
    });

    const highlightedLines = new Set();

    return {
      getValue() {
        return cm.getValue();
      },
      setValue(nextValue) {
        cm.setValue(nextValue);
      },
      refresh() {
        cm.refresh();
      },
      focus() {
        cm.focus();
      },
      clearHighlight() {
        highlightedLines.forEach((lineNumber) => {
          cm.removeLineClass(lineNumber, 'background', 'demo-focus-line');
        });
        highlightedLines.clear();
      },
      highlightRange(startLine, endLine = startLine) {
        const lineCount = cm.lineCount();
        if (!lineCount) return;

        const from = Math.max(1, Math.min(startLine, lineCount));
        const to = Math.max(from, Math.min(endLine, lineCount));

        this.clearHighlight();

        for (let line = from; line <= to; line += 1) {
          const zeroBased = line - 1;
          cm.addLineClass(zeroBased, 'background', 'demo-focus-line');
          highlightedLines.add(zeroBased);
        }

        cm.scrollIntoView({ line: from - 1, ch: 0 }, 140);
      }
    };
  }

  // Fallback when CodeMirror failed to load.
  const textarea = document.createElement('textarea');
  textarea.className = 'demo-code-input-fallback';
  textarea.spellcheck = false;
  textarea.value = value;
  host.appendChild(textarea);

  textarea.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      onRun();
    }
  });

  return {
    getValue() {
      return textarea.value;
    },
    setValue(nextValue) {
      textarea.value = nextValue;
    },
    refresh() { },
    focus() {
      textarea.focus();
    },
    clearHighlight() { },
    highlightRange() { }
  };
}

function initDemoEditors() {
  if (!window.CodeMirror && demoEditorRetryCount < 30) {
    demoEditorRetryCount += 1;
    window.setTimeout(initDemoEditors, 60);
    return;
  }
  if (window.CodeMirror) {
    demoEditorRetryCount = 0;
  }

  const demoSlides = slidesContainer.querySelectorAll('.demo-editor-slide');

  demoSlides.forEach((demoSlide) => {
    if (demoSlide.dataset.initialized === 'true') return;
    demoSlide.dataset.initialized = 'true';

    const slideId = demoSlide.dataset.demoId;
    const slide = slides.find((s) => s.id === slideId);
    if (!slide?.editor) return;

    const runBtn = demoSlide.querySelector('[data-action="run"]');
    const resetBtn = demoSlide.querySelector('[data-action="reset"]');
    const solutionBtn = demoSlide.querySelector('[data-action="solution"]');
    const preview = demoSlide.querySelector('.demo-preview');
    const tabButtons = Array.from(demoSlide.querySelectorAll('[data-lang-tab]'));
    const panels = Array.from(demoSlide.querySelectorAll('[data-lang-panel]'));
    const stepButtons = Array.from(demoSlide.querySelectorAll('[data-step-index]'));
    const stepBody = demoSlide.querySelector('[data-step-body]');
    const stepPrevBtn = demoSlide.querySelector('[data-step-nav="prev"]');
    const stepNextBtn = demoSlide.querySelector('[data-step-nav="next"]');
    const stepItems = getDemoSteps(slide);

    if (!runBtn || !resetBtn || !preview || !tabButtons.length || !panels.length) return;

    const editors = {};
    let activeLang = DEMO_LANGS[0].id;
    let activeStepIndex = -1;

    const clearAllHighlights = () => {
      Object.values(editors).forEach((editor) => editor.clearHighlight());
    };

    const setActiveTab = (lang) => {
      activeLang = lang;

      tabButtons.forEach((button) => {
        const isActive = button.dataset.langTab === lang;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        panel.classList.toggle('active', panel.dataset.langPanel === lang);
      });

      // Double-refresh to handle transition artifacts or layout delays
      Object.values(editors).forEach((editor) => editor.refresh());
      requestAnimationFrame(() => {
        Object.values(editors).forEach((editor) => editor.refresh());
      });
    };

    const updateStepNavState = () => {
      if (stepPrevBtn) {
        stepPrevBtn.disabled = activeStepIndex <= 0;
      }
      if (stepNextBtn) {
        stepNextBtn.disabled = activeStepIndex === -1 || activeStepIndex >= (stepItems.length - 1);
      }
    };

    const clearStepUI = () => {
      activeStepIndex = -1;
      stepButtons.forEach((button) => button.classList.remove('active'));
      clearAllHighlights();
      if (stepBody) {
        stepBody.innerHTML = parseMarkdown('Choose a step to jump to the right file and highlighted code range.');
      }
      updateStepNavState();
    };

    const applyStep = (stepIndex) => {
      const step = stepItems[stepIndex];
      if (!step) return;

      activeStepIndex = stepIndex;
      stepButtons.forEach((button) => {
        const isActive = Number(button.dataset.stepIndex) === stepIndex;
        button.classList.toggle('active', isActive);
      });

      const lang = DEMO_LANGS.some((entry) => entry.id === step.lang) ? step.lang : activeLang;
      setActiveTab(lang);
      clearAllHighlights();

      if (Number.isFinite(step.startLine)) {
        const endLine = Number.isFinite(step.endLine) ? step.endLine : step.startLine;
        editors[lang]?.highlightRange(step.startLine, endLine);
      }

      if (stepBody) {
        const title = step.title || step.label || `Step ${stepIndex + 1}`;
        const details = step.instruction || step.note || '';
        stepBody.innerHTML = parseMarkdown(escapeHTML(details ? `${title}: ${details}` : title));
      }
      updateStepNavState();
    };

    const run = () => {
      const html = editors.html?.getValue() || '';
      const css = editors.css?.getValue() || '';
      const js = editors.js?.getValue() || '';
      preview.srcdoc = buildPreviewDocument(html, css, js);
    };

    DEMO_LANGS.forEach((lang) => {
      const host = demoSlide.querySelector(`[data-editor-host="${lang.id}"]`);
      if (!host) return;

      editors[lang.id] = createCodeEditor(host, {
        value: slide.editor[lang.id] || '',
        mode: lang.mode,
        onRun: run
      });

      // Auto-refresh CodeMirror when the panel becomes visible or resizes
      if (window.ResizeObserver) {
        new ResizeObserver(() => {
          if (editors[lang.id]) editors[lang.id].refresh();
        }).observe(host);
      }
    });

    tabButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const selectedLang = button.dataset.langTab;
        if (!selectedLang || selectedLang === activeLang) return;

        setActiveTab(selectedLang);
        if (activeStepIndex !== -1) {
          clearStepUI();
        }
      });
    });

    stepButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const stepIndex = Number(button.dataset.stepIndex);
        if (Number.isNaN(stepIndex)) return;
        applyStep(stepIndex);
      });
    });

    if (stepPrevBtn) {
      stepPrevBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (activeStepIndex <= 0) return;
        applyStep(activeStepIndex - 1);
      });
    }

    if (stepNextBtn) {
      stepNextBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (activeStepIndex === -1 && stepItems.length) {
          applyStep(0);
          return;
        }
        if (activeStepIndex >= stepItems.length - 1) return;
        applyStep(activeStepIndex + 1);
      });
    }

    runBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      run();
    });

    resetBtn.addEventListener('click', (event) => {
      event.stopPropagation();

      DEMO_LANGS.forEach((lang) => {
        editors[lang.id]?.setValue(slide.editor[lang.id] || '');
      });

      clearStepUI();
      run();
    });

    if (solutionBtn) {
      solutionBtn.addEventListener('click', (event) => {
        event.stopPropagation();

        DEMO_LANGS.forEach((lang) => {
          if (slide.solution && slide.solution[lang.id] !== undefined) {
            editors[lang.id]?.setValue(slide.solution[lang.id] || '');
          } else if (slide.editor && slide.editor[lang.id] !== undefined) {
            // Fallback to initial value if no solution for this specific tab
            editors[lang.id]?.setValue(slide.editor[lang.id] || '');
          }
        });

        clearStepUI();
        run();
      });
    }

    setActiveTab(activeLang);
    clearStepUI();
    if (stepItems.length) {
      applyStep(0);
    }
    run();

    demoEditorStateBySlide.set(demoSlide, { editors, setActiveTab, activeLang });
  });

  refreshEditorsForActiveSlide();
}

function refreshEditorsForActiveSlide() {
  const activeSlide = slidesContainer.querySelector('.slide.active .demo-editor-slide');
  if (!activeSlide) return;

  const state = demoEditorStateBySlide.get(activeSlide);
  if (!state) return;

  Object.values(state.editors).forEach((editor) => editor.refresh());
  requestAnimationFrame(() => {
    Object.values(state.editors).forEach((editor) => editor.refresh());
  });
}

/**
 * Show a specific slide
 */
function showSlide(index, direction = 'forward') {
  const slideCount = getSlideCount();

  // Clamp index
  if (index < 0) index = 0;
  if (index >= slideCount) index = slideCount - 1;

  // Get all slides
  const allSlides = slidesContainer.querySelectorAll('.slide');

  // Use View Transitions API if available
  if (document.startViewTransition && index !== currentSlideIndex) {
    const transition = document.startViewTransition(() => {
      updateSlideVisibility(allSlides, index);
    });
    if (direction) {
      transition.ready.then(() => {
        refreshEditorsForActiveSlide();
      });
      transition.finished.then(() => {
        refreshEditorsForActiveSlide();
      });
    }
  } else {
    updateSlideVisibility(allSlides, index);
    if (direction) {
      requestAnimationFrame(() => refreshEditorsForActiveSlide());
    }
  }

  currentSlideIndex = index;

  // Update progress bar
  const progress = ((index + 1) / slideCount) * 100;
  progressBar.style.width = `${progress}%`;

  // Update counter
  slideCounter.textContent = `${index + 1} / ${slideCount}`;

  // Update URL hash
  const slideId = slides[index].id;
  history.replaceState(null, '', `#${slideId}`);
}

/**
 * Update which slide is visible
 */
function updateSlideVisibility(allSlides, activeIndex) {
  allSlides.forEach((slide, i) => {
    slide.classList.toggle('active', i === activeIndex);
  });
}

/**
 * Navigate to next slide
 */
export function nextSlide() {
  if (!canNavigateSlides()) return;
  showSlide(currentSlideIndex + 1, 'forward');
}

/**
 * Navigate to previous slide
 */
export function prevSlide() {
  if (!canNavigateSlides()) return;
  showSlide(currentSlideIndex - 1, 'backward');
}

/**
 * Go to specific slide by index
 */
export function goToSlide(index) {
  if (!canNavigateSlides()) return;
  showSlide(index);
}

function canNavigateSlides() {
  const now = performance.now();
  if (now - lastSlideNavAt < SLIDE_NAV_DEBOUNCE_MS) {
    return false;
  }
  lastSlideNavAt = now;
  return true;
}

/**
 * Set up keyboard navigation
 */
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    // Avoid accidental double-advance from key auto-repeat.
    if (e.repeat) return;

    // Only handle if slides screen is active
    if (!document.getElementById('slides-screen').classList.contains('active')) {
      return;
    }

    // Don't hijack keys while typing/interacting in editor controls.
    const tagName = e.target?.tagName || '';
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'IFRAME'].includes(tagName)) {
      return;
    }
    if (e.target?.closest?.('.CodeMirror')) {
      return;
    }
    if (e.target?.closest?.('.demo-editor-slide')) {
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;

      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;

      case 'Home':
        e.preventDefault();
        goToSlide(0);
        break;

      case 'End':
        e.preventDefault();
        goToSlide(getSlideCount() - 1);
        break;
    }
  });

  // Click to advance (useful for presenter)
  slidesContainer.addEventListener('click', (e) => {
    if (e.target.closest('[data-no-advance], a, button, textarea, input, select, iframe, .CodeMirror')) return;
    nextSlide();
  });
}

/**
 * Set up URL hash navigation
 */
function setupHashNavigation() {
  // Check initial hash
  const hash = window.location.hash.slice(1);
  if (hash) {
    const slideIndex = slides.findIndex(s => s.id === hash);
    if (slideIndex !== -1) {
      showSlide(slideIndex);
    }
  }

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    const slideIndex = slides.findIndex(s => s.id === hash);
    if (slideIndex !== -1 && slideIndex !== currentSlideIndex) {
      showSlide(slideIndex);
    }
  });
}

/**
 * Get current slide index
 */
export function getCurrentSlideIndex() {
  return currentSlideIndex;
}
