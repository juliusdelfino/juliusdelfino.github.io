/** @module shortcodes — Expands {{shortcode:params}} patterns in parsed HTML. */

/**
 * Processes all shortcodes in an HTML string and returns the expanded result.
 * Run this AFTER markdown parsing.
 */
export function processShortcodes(html) {
  html = processCollapse(html);
  html = processYouTube(html);
  html = processCodePen(html);
  html = processGallery(html);
  return html;
}

/** Wires up interactive shortcode elements (gallery lightbox). Call after DOM insertion. */
export function initShortcodes() {
  initGalleries();
}

/* ── YouTube ────────────────────────────────────────────────── */

/** {{youtube:VIDEO_ID}} → responsive 16:9 iframe */
function processYouTube(html) {
  return html.replace(
    /<p>\{\{youtube:([^}]+)\}\}<\/p>/gi,
    (_, id) => {
      const vid = id.trim();
      return `<div class="sc-youtube">
        <iframe src="https://www.youtube.com/embed/${vid}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen loading="lazy" title="YouTube video"></iframe>
      </div>`;
    }
  );
}

/* ── CodePen ────────────────────────────────────────────────── */

/** {{codepen:user/pen_id}} or {{codepen:user/pen_id:theme}} → responsive embed */
function processCodePen(html) {
  return html.replace(
    /<p>\{\{codepen:([^}]+)\}\}<\/p>/gi,
    (_, params) => {
      const parts = params.trim().split('/');
      const user = parts[0];
      const pen = parts[1] || '';
      const theme = parts[2] || 'dark';
      return `<div class="sc-codepen">
        <iframe src="https://codepen.io/${user}/embed/${pen}?default-tab=result&theme-id=${theme}"
          loading="lazy" allowtransparency="true" allowfullscreen="allowfullscreen"
          title="CodePen embed"></iframe>
        <a href="https://codepen.io/${user}/pen/${pen}" target="_blank" rel="noopener noreferrer" class="sc-codepen-link">
          Open on CodePen →
        </a>
      </div>`;
    }
  );
}

/* ── Collapse ───────────────────────────────────────────────── */

/** {{collapse:Title}}...{{/collapse}} → <details>/<summary> */
function processCollapse(html) {
  return html.replace(
    /<p>\{\{collapse:([^}]+)\}\}<\/p>([\s\S]*?)<p>\{\{\/collapse\}\}<\/p>/gi,
    (_, title, content) => {
      return `<details class="sc-collapse">
        <summary class="sc-collapse-summary">${title.trim()}</summary>
        <div class="sc-collapse-body">${content}</div>
      </details>`;
    }
  );
}

/* ── Gallery ────────────────────────────────────────────────── */

/** {{gallery:url1,url2,url3}} → thumbnail grid with lightbox */
function processGallery(html) {
  let galleryIndex = 0;
  return html.replace(
    /<p>\{\{gallery:([^}]+)\}\}<\/p>/gi,
    (_, urls) => {
      const images = urls.split(',').map(u => u.trim()).filter(Boolean);
      const gid = `gallery-${galleryIndex++}`;
      const thumbs = images.map((src, i) =>
        `<button class="sc-gallery-thumb" data-gallery="${gid}" data-index="${i}">
          <img src="${src}" alt="Gallery image ${i + 1}" loading="lazy">
        </button>`
      ).join('');

      return `<div class="sc-gallery" id="${gid}">
        <div class="sc-gallery-grid">${thumbs}</div>
      </div>`;
    }
  );
}

/** Attaches click handlers to gallery thumbnails for lightbox viewing */
function initGalleries() {
  document.querySelectorAll('.sc-gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const gid = thumb.dataset.gallery;
      const gallery = document.getElementById(gid);
      if (!gallery) return;

      const thumbs = [...gallery.querySelectorAll('.sc-gallery-thumb')];
      const images = thumbs.map(t => t.querySelector('img').src);
      let current = parseInt(thumb.dataset.index, 10);

      openLightbox(images, current);
    });
  });
}

/** Opens a fullscreen lightbox overlay for an image array */
function openLightbox(images, startIndex) {
  let current = startIndex;

  const overlay = document.createElement('div');
  overlay.className = 'sc-lightbox';
  overlay.innerHTML = `
    <div class="sc-lightbox-backdrop"></div>
    <div class="sc-lightbox-content">
      <button class="sc-lightbox-close" aria-label="Close">&times;</button>
      <button class="sc-lightbox-prev" aria-label="Previous">&#8249;</button>
      <img class="sc-lightbox-img" src="${images[current]}" alt="Gallery image">
      <button class="sc-lightbox-next" aria-label="Next">&#8250;</button>
      <div class="sc-lightbox-counter">${current + 1} / ${images.length}</div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));

  const img = overlay.querySelector('.sc-lightbox-img');
  const counter = overlay.querySelector('.sc-lightbox-counter');

  function update() {
    img.src = images[current];
    counter.textContent = `${current + 1} / ${images.length}`;
  }

  function close() {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 200);
  }

  overlay.querySelector('.sc-lightbox-close').addEventListener('click', close);
  overlay.querySelector('.sc-lightbox-backdrop').addEventListener('click', close);

  overlay.querySelector('.sc-lightbox-prev').addEventListener('click', () => {
    current = (current - 1 + images.length) % images.length;
    update();
  });

  overlay.querySelector('.sc-lightbox-next').addEventListener('click', () => {
    current = (current + 1) % images.length;
    update();
  });

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') { current = (current - 1 + images.length) % images.length; update(); }
    if (e.key === 'ArrowRight') { current = (current + 1) % images.length; update(); }
  });

  overlay.setAttribute('tabindex', '-1');
  overlay.focus();
}
