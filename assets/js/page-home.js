import { getPosts, formatDate, renderError } from './utils.js';

/** Renders the home page with hero and recent posts */
export async function renderHome(app) {
  let posts;
  try {
    posts = await getPosts();
  } catch {
    renderError(app, 'Could not load posts.');
    return;
  }

  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const featured = sorted[0];
  const rest = sorted.slice(1);

  const INITIAL_BATCH = 3;
  const BATCH_SIZE = 4;
  let renderedCount = 0;

  app.innerHTML = `
    <section class="hero hero-compact">
      <h1 class="hero-title shimmer">Juju Journal</h1>
      <a href="#/blog/${featured.slug}" class="featured-card glass formal-border arch-corner-card hero-featured">
        <div class="featured-card-image">
          <img src="${featured.coverImage}" alt="${featured.title}" loading="lazy" class="photo-ghibli-wash">
        </div>
        <div class="featured-card-content">
          <span class="featured-label">Most Recent</span>
          <h3>${featured.title}</h3>
          <time>${formatDate(featured.date)}</time>
          <p>${featured.excerpt}</p>
          <div class="tags">${featured.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
      </a>
    </section>

    <section class="recent-posts">
      <h2 class="section-heading">More Journal Entries</h2>
      <div id="post-grid" class="post-grid"></div>
      <div id="post-feed-sentinel" class="post-feed-sentinel" aria-hidden="true"></div>
    </section>`;

  const grid = app.querySelector('#post-grid');
  const sentinel = app.querySelector('#post-feed-sentinel');

  const renderPostCard = (post, index) => `
    <a href="#/blog/${post.slug}" class="post-card glass formal-border arch-corner-card" style="--i:${index};">
      <div class="post-card-image">
        <img src="${post.coverImage}" alt="${post.title}" loading="lazy" class="photo-ghibli-wash">
      </div>
      <div class="post-card-content">
        <h3>${post.title}</h3>
        <time>${formatDate(post.date)}</time>
        <p>${post.excerpt}</p>
        <div class="tags">${post.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </div>
    </a>`;

  const renderNextBatch = (count) => {
    const next = rest.slice(renderedCount, renderedCount + count);
    if (next.length === 0) {
      if (observer) observer.disconnect();
      sentinel.remove();
      return;
    }

    grid.insertAdjacentHTML(
      'beforeend',
      next.map((post, idx) => renderPostCard(post, renderedCount + idx)).join('')
    );
    renderedCount += next.length;
  };

  let observer = null;
  renderNextBatch(INITIAL_BATCH);

  if ('IntersectionObserver' in window && sentinel) {
    observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) {
        renderNextBatch(BATCH_SIZE);
      }
    }, { rootMargin: '320px 0px' });

    observer.observe(sentinel);
  } else {
    renderNextBatch(rest.length);
    if (sentinel) sentinel.remove();
  }
}
