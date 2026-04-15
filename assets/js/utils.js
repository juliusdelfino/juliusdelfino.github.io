import { parseMarkdown } from './markdown-parser.js';

/** @type {Array} Cached post manifest */
let postsCache = null;

/** @type {Array} Cached portfolio projects */
let portfolioCache = null;

/** Formats a date string into a readable format */
export function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

/** Calculates estimated reading time */
export function readTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Renders error state */
export function renderError(app, message) {
  app.innerHTML = `
    <div class="error-page">
      <div class="glass content-card" style="text-align:center;padding:4rem 2rem;">
        <h1>Page Not Found</h1>
        <p>${message}</p>
        <a href="#/" class="btn">\u2190 Back Home</a>
      </div>
    </div>`;
}

/** Fetches and caches the post manifest */
export async function getPosts() {
  if (postsCache) return postsCache;
  const res = await fetch('posts/index.json');
  if (!res.ok) throw new Error('Failed to load posts');
  postsCache = await res.json();
  return postsCache;
}

/** Fetches and caches the portfolio projects */
export async function getPortfolio() {
  if (portfolioCache) return portfolioCache;
  const res = await fetch('portfolio.json');
  if (!res.ok) throw new Error('Failed to load portfolio');
  portfolioCache = await res.json();
  return portfolioCache;
}

/** Fetches a markdown file and returns parsed HTML */
export async function fetchMarkdown(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const md = await res.text();
  return parseMarkdown(md);
}
