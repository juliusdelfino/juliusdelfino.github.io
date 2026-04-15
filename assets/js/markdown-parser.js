/** Parses a Markdown string and returns the corresponding HTML string. */
function parseMarkdown(mdString) {
  if (!mdString || typeof mdString !== "string") {
    return "";
  }

  // ── Step 1: Extract fenced code blocks FIRST to protect their contents ──
  const codeBlockPlaceholders = [];

  let text = mdString.replace(
    /^```(\w*)\s*\n([\s\S]*?)^```\s*$/gm,
    (_match, lang, code) => {
      const escaped = escapeHtml(code.replace(/\n$/, ""));
      const langAttr = lang ? ` class="language-${lang}"` : "";
      const placeholder = `\x00CODEBLOCK_${codeBlockPlaceholders.length}\x00`;
      codeBlockPlaceholders.push(
        `<pre><code${langAttr}>${escaped}</code></pre>`
      );
      return placeholder;
    }
  );

  // ── Step 2: Process block-level elements ──
  const lines = text.split("\n");
  const outputBlocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block placeholder (preserved as-is)
    const codeBlockMatch = line.match(/^\x00CODEBLOCK_(\d+)\x00$/);
    if (codeBlockMatch) {
      outputBlocks.push(codeBlockPlaceholders[parseInt(codeBlockMatch[1])]);
      i++;
      continue;
    }

    // Horizontal rule (--- or more dashes, alone on a line)
    if (/^---+\s*$/.test(line) && line.trim().length >= 3) {
      outputBlocks.push("<hr>");
      i++;
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = applyInlineFormatting(headingMatch[2]);
      outputBlocks.push(`<h${level}>${content}</h${level}>`);
      i++;
      continue;
    }

    // Table: starts with a pipe line, followed by a separator line
    if (/^\|(.+)\|/.test(line) && i + 1 < lines.length && /^\|[\s\-:|]+\|/.test(lines[i + 1])) {
      const tableLines = [];
      while (i < lines.length && /^\|(.+)\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      outputBlocks.push(parseTable(tableLines));
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const inner = applyInlineFormatting(quoteLines.join("\n"));
      outputBlocks.push(`<blockquote><p>${inner}</p></blockquote>`);
      continue;
    }

    // Unordered list
    if (/^- .+/.test(line)) {
      const items = [];
      while (i < lines.length && /^- .+/.test(lines[i])) {
        items.push(applyInlineFormatting(lines[i].replace(/^- /, "")));
        i++;
      }
      const lis = items.map((item) => `<li>${item}</li>`).join("");
      outputBlocks.push(`<ul>${lis}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+.+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+.+/.test(lines[i])) {
        items.push(applyInlineFormatting(lines[i].replace(/^\d+\.\s+/, "")));
        i++;
      }
      const lis = items.map((item) => `<li>${item}</li>`).join("");
      outputBlocks.push(`<ol>${lis}</ol>`);
      continue;
    }

    // Blank line — skip (paragraph breaks handled by grouping)
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph: collect consecutive non-empty, non-special lines
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^- .+/.test(lines[i]) &&
      !/^\d+\.\s+.+/.test(lines[i]) &&
      !/^\|(.+)\|/.test(lines[i]) &&
      !/^\x00CODEBLOCK_\d+\x00$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      const content = applyInlineFormatting(paraLines.join("\n"));
      outputBlocks.push(`<p>${content}</p>`);
    }
  }

  return outputBlocks.join("\n");
}

// ── Helpers ──

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyInlineFormatting(text) {
  // Inline code first — protect from other transforms
  const inlineCodeSlots = [];
  text = text.replace(/`([^`]+)`/g, (_m, code) => {
    const placeholder = `\x01IC_${inlineCodeSlots.length}\x01`;
    inlineCodeSlots.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  // Images (before links so ![alt](src) is not caught by link regex)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bold (must come before italic)
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Restore inline code
  inlineCodeSlots.forEach((html, idx) => {
    text = text.replace(`\x01IC_${idx}\x01`, html);
  });

  return text;
}

function parseTable(lines) {
  // First line is header, second is separator, rest are body rows
  const headerCells = splitTableRow(lines[0]);
  const bodyRows = lines.slice(2); // skip separator line

  const ths = headerCells
    .map((cell) => `<th>${applyInlineFormatting(cell.trim())}</th>`)
    .join("");
  const thead = `<thead><tr>${ths}</tr></thead>`;

  let tbody = "";
  if (bodyRows.length > 0) {
    const trs = bodyRows
      .map((row) => {
        const cells = splitTableRow(row);
        const tds = cells
          .map((cell) => `<td>${applyInlineFormatting(cell.trim())}</td>`)
          .join("");
        return `<tr>${tds}</tr>`;
      })
      .join("");
    tbody = `<tbody>${trs}</tbody>`;
  }

  return `<table>${thead}${tbody}</table>`;
}

function splitTableRow(row) {
  // Strip leading/trailing pipes, then split by |
  return row
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|");
}

export { parseMarkdown };
