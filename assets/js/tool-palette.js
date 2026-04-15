/**
 * Color Palette Generator tool.
 * Generates tints, shades, and harmony colors (complementary, analogous,
 * triadic) from a user-supplied hex color.
 * @module tool-palette
 */

/**
 * Returns the HTML string for the Color Palette Generator tool panel.
 * @returns {string} HTML markup.
 */
export function createColorPaletteTool() {
  return `
<div id="palette-tool">
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <input type="text" id="palette-input" placeholder="#6366f1" value="#6366f1" style="flex:1;padding:8px 12px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.08);color:inherit;font-size:1rem;font-family:monospace" />
    <button id="palette-btn" style="padding:8px 18px;border:none;border-radius:8px;background:rgba(99,102,241,0.7);color:#fff;cursor:pointer;font-size:1rem">Generate</button>
  </div>
  <div id="palette-tints-label" style="font-weight:600;margin-bottom:6px;display:none">Tints &amp; Shades</div>
  <div id="palette-tints" style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap"></div>
  <div id="palette-harmony-label" style="font-weight:600;margin-bottom:6px;display:none">Complementary &middot; Analogous &middot; Triadic</div>
  <div id="palette-harmony" style="display:flex;gap:4px;flex-wrap:wrap"></div>
  <div id="palette-msg" style="text-align:center;padding:8px;opacity:0.7;font-size:0.9rem"></div>
</div>`;
}

/**
 * Attach event listeners for the Color Palette Generator.
 * Must be called after the tool HTML has been inserted into the DOM.
 */
export function initColorPalette() {
  const input = document.getElementById('palette-input');
  const btn = document.getElementById('palette-btn');
  const tintsContainer = document.getElementById('palette-tints');
  const harmonyContainer = document.getElementById('palette-harmony');
  const tintsLabel = document.getElementById('palette-tints-label');
  const harmonyLabel = document.getElementById('palette-harmony-label');
  const msg = document.getElementById('palette-msg');
  if (!input || !btn) return;

  /**
   * Convert a hex color string to an [r, g, b] array.
   * @param {string} hex
   * @returns {number[]}
   */
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /**
   * Convert r, g, b values to a hex color string.
   * @param {number} r
   * @param {number} g
   * @param {number} b
   * @returns {string}
   */
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
  }

  /**
   * Linearly interpolate each channel toward a target color.
   * @param {number[]} rgb
   * @param {number[]} target
   * @param {number} factor - 0..1
   * @returns {number[]}
   */
  function mixColor(rgb, target, factor) {
    return rgb.map((c, i) => c + (target[i] - c) * factor);
  }

  /**
   * Convert RGB to HSL.
   * @param {number} r
   * @param {number} g
   * @param {number} b
   * @returns {number[]} [h (0-360), s (0-1), l (0-1)]
   */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
    return [h * 360, s, l];
  }

  /**
   * Convert HSL to RGB.
   * @param {number} h - Hue in degrees (0-360).
   * @param {number} s - Saturation (0-1).
   * @param {number} l - Lightness (0-1).
   * @returns {number[]} [r, g, b] each 0-255.
   */
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    h /= 360;
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
    ];
  }

  /**
   * Return HTML for a single color swatch.
   * @param {string} hex
   * @returns {string}
   */
  function swatchHtml(hex) {
    const rgb = hexToRgb(hex);
    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    const textColor = brightness > 128 ? '#000' : '#fff';
    return `<div class="palette-swatch" data-hex="${hex}" style="background:${hex};color:${textColor};padding:10px 8px;border-radius:8px;text-align:center;cursor:pointer;min-width:56px;font-size:0.75rem;font-family:monospace;user-select:none" title="Click to copy">${hex}</div>`;
  }

  /** Parse the input hex and render tints/shades plus harmony swatches. */
  function generate() {
    let hex = input.value.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hex)) {
      msg.textContent = 'Please enter a valid hex color (e.g. #6366f1)';
      tintsContainer.innerHTML = '';
      harmonyContainer.innerHTML = '';
      tintsLabel.style.display = 'none';
      harmonyLabel.style.display = 'none';
      return;
    }
    msg.textContent = '';
    const rgb = hexToRgb(hex);

    // 7 tints/shades: 3 shades, base, 3 tints
    const steps = [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6];
    const tintsHtml = steps.map(step => {
      const target = step < 0 ? [0, 0, 0] : [255, 255, 255];
      const mixed = mixColor(rgb, target, Math.abs(step));
      return swatchHtml(rgbToHex(...mixed));
    }).join('');
    tintsContainer.innerHTML = tintsHtml;
    tintsLabel.style.display = '';

    // Harmony colors
    const [h, s, l] = rgbToHsl(...rgb);
    const complementary = rgbToHex(...hslToRgb((h + 180) % 360, s, l));
    const analogous1 = rgbToHex(...hslToRgb((h + 30) % 360, s, l));
    const analogous2 = rgbToHex(...hslToRgb((h - 30 + 360) % 360, s, l));
    const triadic1 = rgbToHex(...hslToRgb((h + 120) % 360, s, l));
    const triadic2 = rgbToHex(...hslToRgb((h + 240) % 360, s, l));

    harmonyContainer.innerHTML = [hex, complementary, analogous1, analogous2, triadic1, triadic2]
      .map(c => swatchHtml(c)).join('');
    harmonyLabel.style.display = '';
  }

  btn.addEventListener('click', generate);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') generate(); });

  // Delegate swatch copy
  [tintsContainer, harmonyContainer].forEach(container => {
    container.addEventListener('click', (e) => {
      const swatch = e.target.closest('.palette-swatch');
      if (!swatch) return;
      const hexVal = swatch.dataset.hex;
      navigator.clipboard.writeText(hexVal).then(() => {
        const orig = swatch.textContent;
        swatch.textContent = 'Copied!';
        setTimeout(() => { swatch.textContent = orig; }, 1200);
      });
    });
  });

  // Generate default palette on init
  generate();
}
