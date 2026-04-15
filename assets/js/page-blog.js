import { getPosts, fetchMarkdown, formatDate, readTime, renderError } from './utils.js';
import { parseMarkdown } from './markdown-parser.js';

/** Renders a blog post page */
export async function renderBlogPost(app, slug) {
  let posts, md;
  try {
    posts = await getPosts();
  } catch {
    renderError(app, 'Could not load posts.');
    return;
  }

  const post = posts.find(p => p.slug === slug);
  if (!post) {
    renderError(app, 'This post does not exist.');
    return;
  }

  try {
    const res = await fetch(`posts/${slug}.md`);
    if (!res.ok) throw new Error();
    md = await res.text();
  } catch {
    renderError(app, 'Could not load post content.');
    return;
  }

  const html = parseMarkdown(md);
  const mins = readTime(md);

  const headings = [];
  const headingRegex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const id = match[2].toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
    headings.push({ level: match[1], text: match[2].replace(/<[^>]*>/g, ''), id });
  }

  const htmlWithIds = html.replace(/<h([23])>(.*?)<\/h[23]>/gi, (full, level, text) => {
    const id = text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
    return `<h${level} id="${id}">${text}</h${level}>`;
  });

  const sorted = [...posts].sort((a, b) => new Date(a.date) - new Date(b.date));
  const idx = sorted.findIndex(p => p.slug === slug);
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  app.innerHTML = `
    <article class="blog-post-page">
      <div class="blog-hero" style="--cover-image: url(${post.coverImage})">
        <img src="${post.coverImage}" alt="${post.title}" loading="lazy" class="blog-hero-img">
        <div class="blog-hero-overlay glass">
          <h1>${post.title}</h1>
          <div class="blog-meta">
            <time>${formatDate(post.date)}</time>
            <span class="read-time">${mins} min read</span>
            <div class="tags">${post.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
          </div>
        </div>
      </div>

      <div class="blog-layout">
        ${headings.length > 0 ? `
          <aside class="toc glass">
            <h4>Table of Contents</h4>
            <nav>
              ${headings.map(h => `
                <a href="#${h.id}" class="toc-link toc-h${h.level}">${h.text}</a>
              `).join('')}
            </nav>
          </aside>
        ` : ''}

        <div class="blog-body content-card glass">
          ${htmlWithIds}
        </div>
      </div>

      <div class="blog-footer">
        ${prev ? `<a href="#/blog/${prev.slug}" class="blog-nav-link glass prev-post"><span class="blog-nav-dir">\u2190 Previous</span><span class="blog-nav-title">${prev.title}</span><time>${formatDate(prev.date)}</time></a>` : '<div></div>'}
        ${next ? `<a href="#/blog/${next.slug}" class="blog-nav-link glass next-post"><span class="blog-nav-dir">Next \u2192</span><span class="blog-nav-title">${next.title}</span><time>${formatDate(next.date)}</time></a>` : '<div></div>'}
      </div>
    </article>`;

  document.querySelectorAll('.toc-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}
