import { fetchMarkdown, renderError } from './utils.js';
import { initShortcodes } from './shortcodes.js';

/** Renders the about page */
export async function renderAbout(app) {
  let html;
  try {
    html = await fetchMarkdown('about.md');
  } catch {
    renderError(app, 'Could not load about page.');
    return;
  }

  app.innerHTML = `
    <section class="about-page">
      <div class="about-header glass formal-border arch-corner-card">
        <div class="about-avatar">
          <div class="avatar-placeholder formal-border-sm">

            <img src="images/julius_linkedin_photo.jpeg" alt="" width="169" class="photo-ghibli-wash" />
 
          </div>
          <h1 class="about-name">Julius Delfino</h1>
          <p class="about-tagline">Coder, musician, trail wanderer.</p>
        </div>
        <div class="about-stats">
          <div class="stat-chip glass formal-border-sm">
            <span class="stat-number">19+</span>
            <span class="stat-label">Years Coding</span>
          </div>
          <div class="stat-chip glass formal-border-sm">
            <span class="stat-number">6</span>
            <span class="stat-label">Personal Projects Shipped</span>
          </div>
          <div class="stat-chip glass formal-border-sm">
            <span class="stat-number">3</span>
            <span class="stat-label">Countries Lived In</span>
          </div>
        </div>
      </div>

      <div class="content-card glass formal-border arch-corner-card">
        ${html}
      </div>
    </section>`;

  initShortcodes();
}
