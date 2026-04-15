/**
 * Markdown Previewer tool.
 * Provides a side-by-side editor and live HTML preview powered by
 * the project's own {@link parseMarkdown} function.
 * @module tool-markdown
 */

import { parseMarkdown } from './markdown-parser.js';

/**
 * Returns the HTML string for the Markdown Previewer tool panel.
 * @returns {string} HTML markup.
 */
export function createMarkdownPreviewerTool() {
  const sample = `# Hello Markdown

This is a **bold** statement and this is *italic*.

## Features
- Live preview
- Easy to use
- Supports common syntax

> Markdown is a lightweight markup language.

\`inline code\` and a [link](https://example.com).

\`\`\`
const greeting = "Hello, world!";
\`\`\`
`;
  return `
<div id="markdown-tool">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;min-height:260px">
    <textarea id="markdown-input" style="width:100%;height:100%;min-height:240px;padding:10px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(255,255,255,0.08);color:inherit;font-family:monospace;font-size:0.9rem;resize:vertical;box-sizing:border-box">${sample}</textarea>
    <div id="markdown-output" style="padding:10px;border:1px solid rgba(255,255,255,0.2);border-radius:8px;background:rgba(0,0,0,0.15);overflow-y:auto;font-size:0.95rem;line-height:1.6"></div>
  </div>
</div>`;
}

/**
 * Attach event listeners for the Markdown Previewer.
 * Must be called after the tool HTML has been inserted into the DOM.
 */
export function initMarkdownPreviewer() {
  const input = document.getElementById('markdown-input');
  const output = document.getElementById('markdown-output');
  if (!input || !output) return;

  function render() {
    output.innerHTML = parseMarkdown(input.value);
  }

  input.addEventListener('input', render);
  render();
}
