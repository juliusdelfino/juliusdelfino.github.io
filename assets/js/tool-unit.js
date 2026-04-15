/**
 * Unit Converter tool.
 * Supports bidirectional conversion across Length, Weight, Temperature,
 * and Speed categories with automatic result formatting.
 * @module tool-unit
 */

/**
 * Returns the HTML string for the Unit Converter tool panel.
 * @returns {string} HTML markup.
 */
export function createUnitConverterTool() {
  return `
<div id="unit-tool">
  <div style="margin-bottom:14px">
    <select id="unit-category" style="width:100%;padding:8px 12px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.08);color:inherit;font-size:1rem">
      <option value="Length">Length</option>
      <option value="Weight">Weight</option>
      <option value="Temperature">Temperature</option>
      <option value="Speed">Speed</option>
    </select>
  </div>
  <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center">
    <div>
      <input type="number" id="unit-input-a" placeholder="0" style="width:100%;padding:8px 10px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.08);color:inherit;font-size:1rem;box-sizing:border-box" />
      <select id="unit-select-a" style="width:100%;margin-top:6px;padding:6px 10px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.08);color:inherit;font-size:0.95rem;box-sizing:border-box"></select>
    </div>
    <span style="font-size:1.4rem;opacity:0.5">=</span>
    <div>
      <input type="number" id="unit-input-b" placeholder="0" style="width:100%;padding:8px 10px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.08);color:inherit;font-size:1rem;box-sizing:border-box" />
      <select id="unit-select-b" style="width:100%;margin-top:6px;padding:6px 10px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.08);color:inherit;font-size:0.95rem;box-sizing:border-box"></select>
    </div>
  </div>
</div>`;
}

/**
 * Attach event listeners for the Unit Converter.
 * Must be called after the tool HTML has been inserted into the DOM.
 */
export function initUnitConverter() {
  const categorySelect = document.getElementById('unit-category');
  const inputA = document.getElementById('unit-input-a');
  const inputB = document.getElementById('unit-input-b');
  const selectA = document.getElementById('unit-select-a');
  const selectB = document.getElementById('unit-select-b');
  if (!categorySelect || !selectA || !selectB) return;

  /** Conversion factors to a base unit per category. */
  const units = {
    Length: {
      base: 'm',
      list: ['mm', 'cm', 'm', 'km', 'in', 'ft', 'yd', 'mi'],
      toBase: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 }
    },
    Weight: {
      base: 'g',
      list: ['mg', 'g', 'kg', 'lb', 'oz'],
      toBase: { mg: 0.001, g: 1, kg: 1000, lb: 453.59237, oz: 28.34952 }
    },
    Temperature: {
      base: 'C',
      list: ['\u00B0C', '\u00B0F', 'K'],
      toBase: null // special handling
    },
    Speed: {
      base: 'm/s',
      list: ['m/s', 'km/h', 'mph', 'knots'],
      toBase: { 'm/s': 1, 'km/h': 1 / 3.6, 'mph': 0.44704, 'knots': 0.514444 }
    }
  };

  /**
   * Populate the unit drop-downs for a given category.
   * @param {string} category
   */
  function populateSelects(category) {
    const u = units[category];
    selectA.innerHTML = '';
    selectB.innerHTML = '';
    u.list.forEach((name, i) => {
      selectA.innerHTML += `<option value="${name}"${i === 0 ? ' selected' : ''}>${name}</option>`;
      selectB.innerHTML += `<option value="${name}"${i === 1 ? ' selected' : ''}>${name}</option>`;
    });
    inputA.value = '';
    inputB.value = '';
  }

  /**
   * Convert a temperature value between Celsius, Fahrenheit, and Kelvin.
   * @param {number} value
   * @param {string} from
   * @param {string} to
   * @returns {number}
   */
  function convertTemp(value, from, to) {
    const f = from.replace('\u00B0', '');
    const t = to.replace('\u00B0', '');
    // First convert to Celsius
    let celsius;
    if (f === 'C') celsius = value;
    else if (f === 'F') celsius = (value - 32) * 5 / 9;
    else celsius = value - 273.15; // K

    // Then to target
    if (t === 'C') return celsius;
    if (t === 'F') return celsius * 9 / 5 + 32;
    return celsius + 273.15; // K
  }

  /**
   * Convert a value from one unit to another within a category.
   * @param {number} value
   * @param {string} from
   * @param {string} to
   * @param {string} category
   * @returns {number}
   */
  function convert(value, from, to, category) {
    if (category === 'Temperature') return convertTemp(value, from, to);
    const u = units[category];
    const baseVal = value * u.toBase[from];
    return baseVal / u.toBase[to];
  }

  /**
   * Format a numeric result, stripping floating-point noise.
   * @param {number} n
   * @returns {string}
   */
  function formatResult(n) {
    if (Number.isNaN(n) || !Number.isFinite(n)) return '';
    const s = n.toPrecision(10);
    return parseFloat(s).toString();
  }

  /** Handle input in the left (A) field and update the right (B) field. */
  function onInputA() {
    const v = parseFloat(inputA.value);
    if (inputA.value === '' || Number.isNaN(v)) { inputB.value = ''; return; }
    inputB.value = formatResult(convert(v, selectA.value, selectB.value, categorySelect.value));
  }

  /** Handle input in the right (B) field and update the left (A) field. */
  function onInputB() {
    const v = parseFloat(inputB.value);
    if (inputB.value === '' || Number.isNaN(v)) { inputA.value = ''; return; }
    inputA.value = formatResult(convert(v, selectB.value, selectA.value, categorySelect.value));
  }

  categorySelect.addEventListener('change', () => populateSelects(categorySelect.value));
  inputA.addEventListener('input', onInputA);
  inputB.addEventListener('input', onInputB);
  selectA.addEventListener('change', onInputA);
  selectB.addEventListener('change', onInputB);

  populateSelects('Length');
}
