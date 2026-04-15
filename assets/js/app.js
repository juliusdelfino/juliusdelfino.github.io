import { initSearch, openSearch } from './search.js';
import { renderHome } from './page-home.js';
import { renderAbout } from './page-about.js';
import { renderPortfolio } from './page-portfolio.js';
import { renderBlogPost } from './page-blog.js';
import { renderError } from './utils.js';

/* ── Background images per route ── */
const backgrounds = {
  '/': 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80',
  '/about': 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80',
  '/portfolio': 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80',
  '/blog': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80'
};

/** Sets the background image for a route */
function setBackground(route) {
  let key = '/';
  if (route.startsWith('/about')) key = '/about';
  else if (route.startsWith('/portfolio')) key = '/portfolio';
  else if (route.startsWith('/blog')) key = '/blog';
  document.body.setAttribute('data-bg', backgrounds[key]);
  document.body.style.setProperty('--bg-image', `url(${backgrounds[key]})`);
}

/** Page transition: fades out, swaps content, fades in */
async function transitionTo(renderFn) {
  const app = document.getElementById('app');
  app.classList.add('fade-out');
  await new Promise(r => setTimeout(r, 200));
  await renderFn(app);
  app.classList.remove('fade-out');
  app.classList.add('fade-in');
  await new Promise(r => setTimeout(r, 200));
  app.classList.remove('fade-in');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/** Updates active nav link */
function updateNav(route) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    const isActive = (href === '#/' && route === '/') ||
      (href !== '#/' && route.startsWith(href.slice(1)));
    link.classList.toggle('active', isActive);
  });
}

/* ── Router ── */

/** Resolves the current hash into a route and renders the page */
async function handleRoute() {
  const hash = location.hash.slice(1) || '/';
  setBackground(hash);
  updateNav(hash);

  if (hash === '/') {
    await transitionTo(renderHome);
  } else if (hash === '/about') {
    await transitionTo(renderAbout);
  } else if (hash.startsWith('/portfolio/')) {
    const id = hash.split('/portfolio/')[1];
    await transitionTo(app => renderPortfolio(app, id));
  } else if (hash === '/portfolio') {
    await transitionTo(app => renderPortfolio(app, null));
  } else if (hash.startsWith('/blog/')) {
    const slug = hash.split('/blog/')[1];
    await transitionTo(app => renderBlogPost(app, slug));
  } else {
    await transitionTo(app => renderError(app, 'The page you\'re looking for doesn\'t exist.'));
  }
}

/* ── Theme Toggle ── */

/** Initializes theme from localStorage — defaults to dark */
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
  updateThemeIcon();
}

/** Toggles the theme between light and dark */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon();
}

/** Updates the theme toggle icon */
function updateThemeIcon() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.innerHTML = isDark
    ? '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
  btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

/* ── Mobile Menu ── */

/** Toggles the mobile navigation menu */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('mobile-menu-btn');
  const isOpen = menu.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  btn.setAttribute('aria-expanded', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
}

/** Closes the mobile menu */
function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn = document.getElementById('mobile-menu-btn');
  if (menu && menu.classList.contains('open')) {
    menu.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }
}

/* ── Initialization ── */

/** Bootstraps the application */
function init() {
  initTheme();

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('search-btn').addEventListener('click', openSearch);
  document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);

  document.querySelectorAll('#mobile-menu .nav-link').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  initSearch();

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

document.addEventListener('DOMContentLoaded', init);
