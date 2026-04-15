/**
 * Pomodoro Timer tool.
 * Implements a 25-minute work / 5-minute break cycle with an SVG ring
 * progress indicator, start/pause/reset controls, and an audible beep
 * at the end of each interval.
 * @module tool-pomodoro
 */

/**
 * Returns the HTML string for the Pomodoro Timer tool panel.
 * @returns {string} HTML markup.
 */
export function createPomodoroTool() {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  return `
<div id="pomodoro-tool" style="text-align:center">
  <div id="pomodoro-mode" style="font-size:1.1rem;font-weight:600;margin-bottom:8px;opacity:0.85">Work</div>
  <div style="position:relative;display:inline-block;width:210px;height:210px;margin-bottom:16px">
    <svg width="210" height="210" viewBox="0 0 210 210" style="transform:rotate(-90deg)">
      <circle cx="105" cy="105" r="${radius}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"/>
      <circle id="pomodoro-ring" cx="105" cy="105" r="${radius}" fill="none" stroke="rgba(99,102,241,0.8)" stroke-width="8"
        stroke-dasharray="${circumference}" stroke-dashoffset="0" stroke-linecap="round"
        style="transition:stroke-dashoffset 0.4s linear"/>
    </svg>
    <div id="pomodoro-display" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2.8rem;font-weight:700;font-variant-numeric:tabular-nums">25:00</div>
  </div>
  <div style="display:flex;gap:10px;justify-content:center">
    <button id="pomodoro-start" style="padding:8px 20px;border:none;border-radius:8px;background:rgba(34,197,94,0.65);color:#fff;cursor:pointer;font-size:1rem">Start</button>
    <button id="pomodoro-pause" style="padding:8px 20px;border:none;border-radius:8px;background:rgba(234,179,8,0.65);color:#fff;cursor:pointer;font-size:1rem">Pause</button>
    <button id="pomodoro-reset" style="padding:8px 20px;border:none;border-radius:8px;background:rgba(239,68,68,0.65);color:#fff;cursor:pointer;font-size:1rem">Reset</button>
  </div>
</div>`;
}

/**
 * Attach event listeners for the Pomodoro Timer.
 * Must be called after the tool HTML has been inserted into the DOM.
 */
export function initPomodoro() {
  const display = document.getElementById('pomodoro-display');
  const ring = document.getElementById('pomodoro-ring');
  const modeLabel = document.getElementById('pomodoro-mode');
  const startBtn = document.getElementById('pomodoro-start');
  const pauseBtn = document.getElementById('pomodoro-pause');
  const resetBtn = document.getElementById('pomodoro-reset');
  if (!display || !ring) return;

  const WORK_SECONDS = 25 * 60;
  const BREAK_SECONDS = 5 * 60;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  let isWork = true;
  let totalSeconds = WORK_SECONDS;
  let remaining = totalSeconds;
  let timerInterval = null;

  /**
   * Format a number of seconds as MM:SS.
   * @param {number} sec
   * @returns {string}
   */
  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /** Refresh the display text and SVG ring offset. */
  function updateDisplay() {
    display.textContent = formatTime(remaining);
    const progress = 1 - remaining / totalSeconds;
    ring.setAttribute('stroke-dashoffset', (circumference * progress).toString());
  }

  /** Play a short sine-wave beep via the Web Audio API. */
  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (_) { /* audio not available */ }
  }

  /** Called every second while the timer is running. */
  function tick() {
    remaining--;
    if (remaining < 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      playBeep();
      isWork = !isWork;
      totalSeconds = isWork ? WORK_SECONDS : BREAK_SECONDS;
      remaining = totalSeconds;
      modeLabel.textContent = isWork ? 'Work' : 'Break';
      ring.style.stroke = isWork ? 'rgba(99,102,241,0.8)' : 'rgba(34,197,94,0.8)';
      updateDisplay();
      timerInterval = setInterval(tick, 1000);
    }
    updateDisplay();
  }

  startBtn.addEventListener('click', () => {
    if (!timerInterval) timerInterval = setInterval(tick, 1000);
  });

  pauseBtn.addEventListener('click', () => {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  });

  resetBtn.addEventListener('click', () => {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    isWork = true;
    totalSeconds = WORK_SECONDS;
    remaining = totalSeconds;
    modeLabel.textContent = 'Work';
    ring.style.stroke = 'rgba(99,102,241,0.8)';
    updateDisplay();
  });

  updateDisplay();
}
