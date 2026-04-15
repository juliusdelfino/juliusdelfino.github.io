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
  const recent = sorted.slice(0, 5);
  const featured = recent[0];
  const rest = recent.slice(1);

  app.innerHTML = `
    <section class="hero">
      <h1 class="hero-title shimmer">Juju Journal</h1>
      <p class="hero-tagline">Thoughts on technology, music, travel, and everything in between.</p>
      <div class="scroll-arrow" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
        </svg>
      </div>
    </section>

    <section class="recent-posts">
      <h2 class="section-heading">Recent Writing</h2>

      <a href="#/blog/${featured.slug}" class="featured-card glass">
        <div class="featured-card-image">
          <img src="${featured.coverImage}" alt="${featured.title}" loading="lazy">
        </div>
        <div class="featured-card-content">
          <h3>${featured.title}</h3>
          <time>${formatDate(featured.date)}</time>
          <p>${featured.excerpt}</p>
          <div class="tags">${featured.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        </div>
      </a>

      <div class="post-grid">
        ${rest.map(post => `
          <a href="#/blog/${post.slug}" class="post-card glass">
            <div class="post-card-image">
              <img src="${post.coverImage}" alt="${post.title}" loading="lazy">
            </div>
            <div class="post-card-content">
              <h3>${post.title}</h3>
              <time>${formatDate(post.date)}</time>
              <p>${post.excerpt}</p>
              <div class="tags">${post.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
            </div>
          </a>
        `).join('')}
      </div>
    </section>`;
}
