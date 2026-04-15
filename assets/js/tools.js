/**
 * Barrel file for all tool modules.
 * Re-exports every tool creator and provides a single {@link initTools}
 * function that wires up all interactive event listeners.
 * @module tools
 */

export { createWeatherTool } from './tool-weather.js';
export { createTextConverterTool } from './tool-text.js';
export { createMarkdownPreviewerTool } from './tool-markdown.js';
export { createPomodoroTool } from './tool-pomodoro.js';
export { createColorPaletteTool } from './tool-palette.js';
export { createUnitConverterTool } from './tool-unit.js';

import { initWeather } from './tool-weather.js';
import { initTextConverter } from './tool-text.js';
import { initMarkdownPreviewer } from './tool-markdown.js';
import { initPomodoro } from './tool-pomodoro.js';
import { initColorPalette } from './tool-palette.js';
import { initUnitConverter } from './tool-unit.js';

/**
 * Attach all interactive event listeners for every tool.
 * Call once after every tool's HTML has been inserted into the DOM.
 */
export function initTools() {
  initWeather();
  initTextConverter();
  initMarkdownPreviewer();
  initPomodoro();
  initColorPalette();
  initUnitConverter();
}
