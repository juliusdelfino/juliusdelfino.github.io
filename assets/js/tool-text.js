/**
 * Text Converter tool.
 * Provides case conversion, reversal, and character/word counting utilities
 * with a one-click copy button.
 * @module tool-text
 */

/**
 * Returns the HTML string for the Text Converter tool panel.
 * @returns {string} HTML markup.
 */
export function createTextConverterTool() {
  const buttons = [
    ['text-btn-upper', 'UPPERCASE'],
    ['text-btn-lower', 'lowercase'],
    ['text-btn-title', 'Title Case'],
    ['text-btn-camel', 'camelCase'],
    ['text-btn-snake', 'snake_case'],
    ['text-btn-kebab', 'kebab-case'],
    ['text-btn-reverse', 'Reverse'],
    ['text-btn-words', 'Count Words'],
    ['text-btn-chars', 'Count Chars']
  ];
  const btnHtml = buttons.map(([id, label]) =>
    `<button id="${id}" style="padding:6px 12px;border:none;border-radius:6px;background:rgba(99,102,241,0.55);color:#fff;cursor:pointer;font-size:0.85rem">${label}</button>`
  ).join('\n      ');

  return `
<div id="text-tool">
  <textarea id="text-input" rows="4" placeholder="Type or paste text here..." style="width:100%;padding:10px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.08);color:inherit;font-size:1rem;resize:vertical;box-sizing:border-box"></textarea>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0">
    ${btnHtml}
  </div>
  <div style="position:relative">
    <pre id="text-output" style="min-height:48px;padding:12px;border-radius:8px;background:rgba(0,0,0,0.2);white-space:pre-wrap;word-break:break-word;font-family:inherit;margin:0"></pre>
    <button id="text-copy-btn" style="position:absolute;top:8px;right:8px;padding:4px 10px;border:none;border-radius:6px;background:rgba(99,102,241,0.55);color:#fff;cursor:pointer;font-size:0.8rem">Copy</button>
  </div>
</div>`;
}

/**
 * Attach event listeners for the Text Converter.
 * Must be called after the tool HTML has been inserted into the DOM.
 */
export function initTextConverter() {
  const input = document.getElementById('text-input');
  const output = document.getElementById('text-output');
  if (!input || !output) return;

  /** @param {string} str */
  function toTitleCase(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }

  /** @param {string} str */
  function toCamelCase(str) {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^[A-Z]/, c => c.toLowerCase());
  }

  /** @param {string} str */
  function toSnakeCase(str) {
    return str.trim()
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s\-]+/g, '_')
      .toLowerCase();
  }

  /** @param {string} str */
  function toKebabCase(str) {
    return str.trim()
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  const actions = {
    'text-btn-upper': () => input.value.toUpperCase(),
    'text-btn-lower': () => input.value.toLowerCase(),
    'text-btn-title': () => toTitleCase(input.value),
    'text-btn-camel': () => toCamelCase(input.value),
    'text-btn-snake': () => toSnakeCase(input.value),
    'text-btn-kebab': () => toKebabCase(input.value),
    'text-btn-reverse': () => [...input.value].reverse().join(''),
    'text-btn-words': () => {
      const words = input.value.trim().split(/\s+/).filter(Boolean);
      return `${words.length} word${words.length !== 1 ? 's' : ''}`;
    },
    'text-btn-chars': () => `${input.value.length} character${input.value.length !== 1 ? 's' : ''}`
  };

  for (const [id, fn] of Object.entries(actions)) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => { output.textContent = fn(); });
  }

  const copyBtn = document.getElementById('text-copy-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(output.textContent).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });
    });
  }
}
