/** @module search – Full-text search overlay for the static SPA blog. */

let searchIndex = null;
let overlayEl = null;
let indexPromise = null;

/** Fetches and builds the search index from posts/index.json on first call. */
async function loadIndex() {
  if (searchIndex) return searchIndex;
  if (indexPromise) return indexPromise;

  indexPromise = fetch("posts/index.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load search index: ${res.status}`);
      return res.json();
    })
    .then((posts) => {
      searchIndex = posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
        excerpt: post.excerpt,
        tags: post.tags || [],
        searchText: [
          post.title,
          post.excerpt,
          (post.tags || []).join(" "),
        ]
          .join(" ")
          .toLowerCase(),
      }));
      window.searchIndex = searchIndex;
      return searchIndex;
    });

  return indexPromise;
}

/** Creates the overlay DOM element and appends it to the document body. */
function createOverlay() {
  if (overlayEl) return overlayEl;

  overlayEl = document.createElement("div");
  overlayEl.className = "search-overlay";
  overlayEl.setAttribute("aria-hidden", "true");

  overlayEl.innerHTML = `
    <div class="search-overlay-backdrop"></div>
    <div class="search-overlay-content">
      <div class="search-input-wrap">
        <input
          type="text"
          class="search-input"
          placeholder="Search posts\u2026"
          aria-label="Search posts"
          autocomplete="off"
        />
        <button class="search-close-btn" aria-label="Close search">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="search-results"></div>
    </div>
  `;

  document.body.appendChild(overlayEl);

  const backdrop = overlayEl.querySelector(".search-overlay-backdrop");
  backdrop.addEventListener("click", () => closeSearch());

  const closeBtn = overlayEl.querySelector(".search-close-btn");
  closeBtn.addEventListener("click", () => closeSearch());

  const input = overlayEl.querySelector(".search-input");
  input.addEventListener("input", () => handleInput(input.value));

  overlayEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closeSearch();
    }
  });

  return overlayEl;
}

/** Highlights all occurrences of query within text using an accent-colored mark. */
function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const escapedQuery = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  return escaped.replace(regex, `<mark class="search-highlight">$1</mark>`);
}

/** Escapes HTML special characters in a string. */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Formats a date string (YYYY-MM-DD) into a readable locale string. */
function formatDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Renders search results into the results container. */
function renderResults(results, query) {
  const container = overlayEl.querySelector(".search-results");

  if (!query || query.trim() === "") {
    container.innerHTML = `<div class="search-empty-state">Type to search across all posts.</div>`;
    return;
  }

  if (results.length === 0) {
    container.innerHTML = `<div class="search-empty-state">No results found for &ldquo;${escapeHtml(query)}&rdquo;.</div>`;
    return;
  }

  const cards = results.map((post) => {
    const tagsHtml = post.tags
      .map((tag) => `<span class="search-result-tag">${escapeHtml(tag)}</span>`)
      .join("");

    return `
      <a href="#/blog/${escapeHtml(post.slug)}" class="search-result-card" data-slug="${escapeHtml(post.slug)}">
        <h3 class="search-result-title">${highlightMatch(post.title, query)}</h3>
        <p class="search-result-excerpt">${escapeHtml(post.excerpt)}</p>
        <div class="search-result-meta">
          <time class="search-result-date">${formatDate(post.date)}</time>
          ${tagsHtml ? `<div class="search-result-tags">${tagsHtml}</div>` : ""}
        </div>
      </a>
    `;
  });

  container.innerHTML = cards.join("");

  container.querySelectorAll(".search-result-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const slug = card.dataset.slug;
      window.location.hash = `/blog/${slug}`;
      closeSearch();
    });
  });
}

/** Filters the search index by the given query and renders results. */
async function handleInput(query) {
  const index = await loadIndex();
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    renderResults([], "");
    return;
  }

  const terms = trimmed.split(/\s+/);
  const results = index.filter((post) =>
    terms.every((term) => post.searchText.includes(term))
  );

  renderResults(results, query.trim());
}

/** Initializes search: binds the search button and keyboard shortcuts. */
function initSearch() {
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => openSearch());
  }

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "/" &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      !isEditableElement(e.target)
    ) {
      e.preventDefault();
      openSearch();
    }

    if (e.key === "Escape" && overlayEl && overlayEl.getAttribute("aria-hidden") === "false") {
      closeSearch();
    }
  });
}

/** Returns true if the target element is an input, textarea, or contentEditable. */
function isEditableElement(el) {
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/** Opens the search overlay, creates it if needed, and focuses the input. */
async function openSearch() {
  createOverlay();
  overlayEl.setAttribute("aria-hidden", "false");
  overlayEl.classList.add("active");

  const input = overlayEl.querySelector(".search-input");
  input.value = "";
  renderResults([], "");

  requestAnimationFrame(() => input.focus());

  await loadIndex();
}

/** Closes the search overlay and resets its state. */
function closeSearch() {
  if (!overlayEl) return;

  overlayEl.setAttribute("aria-hidden", "true");
  overlayEl.classList.remove("active");

  const input = overlayEl.querySelector(".search-input");
  input.value = "";

  const results = overlayEl.querySelector(".search-results");
  results.innerHTML = "";
}

export { initSearch, openSearch, closeSearch };
