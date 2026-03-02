/**
 * Lyrics Display - Word by Word with TikTok Style
 * Chorus lines ("Todo en web") displayed in yellow
 */

import { lyricsData, isChorusLine } from './lyrics-data.js';

let lyricsElement = null;
let lyricsElementWin95 = null;
let currentLineIndex = -1;
let currentWordIndex = -1;

/**
 * Initialize the lyrics display
 */
export function initLyrics() {
  lyricsElement = document.getElementById('lyrics-text');
  lyricsElementWin95 = document.getElementById('lyrics-text-win95');
  currentLineIndex = -1;
  currentWordIndex = -1;
}

/**
 * Update lyrics based on current audio time
 * @param {number} currentTime - Current audio time
 * @param {HTMLElement} targetElement - Optional specific element to update
 */
export function updateLyrics(currentTime, targetElement = null) {
  // Determine which element(s) to update
  const elements = targetElement ? [targetElement] : [lyricsElement, lyricsElementWin95].filter(Boolean);

  if (elements.length === 0) return;

  // Find current line
  let lineIndex = -1;
  for (let i = 0; i < lyricsData.length; i++) {
    const line = lyricsData[i];
    if (line.start <= currentTime && currentTime < line.end) {
      lineIndex = i;
      break;
    }
  }

  // Line changed - render new line
  if (lineIndex !== currentLineIndex) {
    currentLineIndex = lineIndex;
    currentWordIndex = -1;

    if (lineIndex === -1 || !lyricsData[lineIndex]) {
      // No active line
      elements.forEach(el => {
        el.innerHTML = '';
        el.classList.remove('visible');
        el.classList.remove('chorus');
      });
      return;
    }

    const line = lyricsData[lineIndex];

    // Render word-by-word line on all elements
    elements.forEach(el => {
      renderWordLineToElement(line, el);

      // Add chorus class for yellow styling
      if (isChorusLine(line.text)) {
        el.classList.add('chorus');
      } else {
        el.classList.remove('chorus');
      }

      el.classList.add('visible');
    });
  }

  // Update word highlighting within current line
  if (lineIndex !== -1 && lyricsData[lineIndex]) {
    const line = lyricsData[lineIndex];
    elements.forEach(el => {
      updateWordHighlightingOnElement(currentTime, line, el);
    });
  }
}

/**
 * Render a line with individual words to a specific element
 */
function renderWordLineToElement(line, element) {
  const words = line.words || [{ word: line.text, start: line.start, end: line.end }];

  element.innerHTML = words.map((w, i) =>
    `<span class="lyric-word" data-index="${i}">${w.word}</span>`
  ).join('');
}

/**
 * Update word highlighting based on time on a specific element
 */
function updateWordHighlightingOnElement(currentTime, line, element) {
  const words = line.words || [];
  const wordElements = element.querySelectorAll('.lyric-word');

  words.forEach((word, i) => {
    const el = wordElements[i];
    if (!el) return;

    if (currentTime >= word.start) {
      if (currentTime < word.end) {
        el.classList.add('active');
        el.classList.remove('past');
      } else {
        el.classList.remove('active');
        el.classList.add('past');
      }
    } else {
      el.classList.remove('active', 'past');
    }
  });
}


/**
 * Force show a specific lyric (for testing)
 */
export function showLyric(text) {
  if (!lyricsElement) return;
  lyricsElement.textContent = text;
  lyricsElement.classList.add('visible');
}

/**
 * Hide lyrics
 */
export function hideLyrics() {
  if (!lyricsElement) return;
  lyricsElement.classList.remove('visible');
  currentLineIndex = -1;
  currentWordIndex = -1;
}
