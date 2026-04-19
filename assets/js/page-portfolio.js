import { getPortfolio, fetchMarkdown, renderError } from './utils.js';
import {
  createWeatherTool,
  createTextConverterTool,
  createMarkdownPreviewerTool,
  createPomodoroTool,
  createColorPaletteTool,
  createUnitConverterTool,
  initTools
} from './tools.js';

/** Tool metadata for preview cards */
const toolPreviews = [
  { id: 'weather',  icon: '\u{1F324}',  name: 'Weather Dashboard',   desc: 'Look up current weather and hourly forecast for any city.' },
  { id: 'text',     icon: '\u{270F}',   name: 'Text Converter',      desc: 'Transform text between cases, reverse, or count words.' },
  { id: 'markdown', icon: '\u{1F4DD}',  name: 'Markdown Previewer',  desc: 'Write Markdown and see it rendered live side-by-side.' },
  { id: 'pomodoro', icon: '\u{1F345}',  name: 'Pomodoro Timer',      desc: '25/5 work-break timer with visual ring progress.' },
  { id: 'palette',  icon: '\u{1F3A8}',  name: 'Color Palette',       desc: 'Generate tints, shades, and harmony colors from any hex.' },
  { id: 'unit',     icon: '\u{1F4D0}',  name: 'Unit Converter',      desc: 'Convert between length, weight, temperature, and speed.' }
];

/** Creates the full HTML for one tool by id */
function getToolHtml(id) {
  const map = {
    weather: createWeatherTool,
    text: createTextConverterTool,
    markdown: createMarkdownPreviewerTool,
    pomodoro: createPomodoroTool,
    palette: createColorPaletteTool,
    unit: createUnitConverterTool
  };
  return map[id] ? map[id]() : '';
}

/** Renders the portfolio list or detail page */
export async function renderPortfolio(app, projectId) {
  let projects, introHtml;
  try {
    [projects, introHtml] = await Promise.all([
      getPortfolio(),
      fetchMarkdown('portfolio.md')
    ]);
  } catch {
    renderError(app, 'Could not load portfolio.');
    return;
  }

  const categories = [...new Set(projects.map(p => p.category))];
  const activeProject = projectId ? projects.find(p => p.id === projectId) : null;

  app.innerHTML = `
    <section class="portfolio-page">
      <aside class="portfolio-sidebar glass">
        <h2 class="sidebar-title">Portfolio</h2>
        <nav class="sidebar-nav">
          ${projects.map(p => `
            <a href="#/portfolio/${p.id}" class="sidebar-item ${p.id === projectId ? 'active' : ''}">
              <span class="sidebar-item-title">${p.title}</span>
              <span class="sidebar-item-category tag">${p.category}</span>
            </a>
          `).join('')}
        </nav>
        <div class="filter-pills">
          <button class="filter-pill active" data-category="all">All</button>
          ${categories.map(c => `<button class="filter-pill" data-category="${c}">${c}</button>`).join('')}
        </div>
      </aside>

      <div class="portfolio-main">
        ${activeProject ? renderProjectDetail(activeProject, projects) : renderProjectGrid(projects, introHtml)}
        ${renderToolsSection()}
      </div>
    </section>`;

  initFilterPills(projects);
  initToolPreviews();
}

/** Renders the project grid view */
function renderProjectGrid(projects, introHtml) {
  return `
    <div class="portfolio-intro content-card glass">${introHtml}</div>
    <div class="project-grid" id="project-grid">
      ${projects.map(renderProjectCard).join('')}
    </div>`;
}

/** Renders a single project card */
function renderProjectCard(project) {
  return `
    <a href="#/portfolio/${project.id}" class="project-card glass">
      <div class="project-card-image">
        <img src="${project.image}" alt="${project.title}" loading="lazy">
      </div>
      <div class="project-card-content">
        <div class="project-card-header">
          <h3>${project.title}</h3>
          <span class="project-year">${project.year}</span>
        </div>
        <span class="tag">${project.category}</span>
        <p>${project.description.slice(0, 120)}...</p>
        <div class="tags">${project.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <span class="project-link">View Project \u2192</span>
      </div>
    </a>`;
}

/** Renders the full project detail view */
function renderProjectDetail(project, allProjects) {
  // Only render action buttons if the corresponding URLs are provided
  const githubBtn = project.github ? `<a href="${project.github}" target="_blank" rel="noopener noreferrer" class="btn">View on GitHub \u2192</a>` : '';
  const siteBtn = project.link ? `<a href="${project.link}" target="_blank" rel="noopener noreferrer" class="btn">View Website \u2192</a>` : '';

  return `
    <div class="project-detail glass">
      <a href="#/portfolio" class="back-link">\u2190 Back to all projects</a>
      <div class="project-detail-image">
        <img src="${project.image}" alt="${project.title}" loading="lazy">
      </div>
      <h1>${project.title}</h1>
      <div class="project-meta">
        <span class="tag">${project.category}</span>
        <span class="project-year">${project.year}</span>
      </div>
      <p class="project-description">${project.description}</p>
      <div class="tags">${project.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      ${githubBtn}
      ${siteBtn}
    </div>`;
}

/** Renders the Quick Tools section with preview cards */
function renderToolsSection() {
  const cards = toolPreviews.map(t => `
    <div class="tool-preview-card glass" data-tool-id="${t.id}">
      <div class="tool-preview-header">
        <span class="tool-preview-icon">${t.icon}</span>
        <h3>${t.name}</h3>
        <button class="btn tool-view-btn" data-tool-id="${t.id}">View</button>
      </div>
      <p class="tool-preview-desc">${t.desc}</p>
      <div class="tool-expanded-body" id="tool-body-${t.id}" style="display:none;"></div>
    </div>
  `).join('');

  return `
    <section class="tools-section">
      <h2 class="section-heading">Quick Tools</h2>
      <div class="tool-grid">${cards}</div>
    </section>`;
}

/** Wires up View Tool buttons to expand the full tool inline */
function initToolPreviews() {
  document.querySelectorAll('.tool-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.toolId;
      const body = document.getElementById(`tool-body-${id}`);
      if (!body) return;

      if (body.style.display === 'none') {
        body.innerHTML = getToolHtml(id);
        body.style.display = '';
        btn.textContent = 'Hide';
        initTools();
      } else {
        body.innerHTML = '';
        body.style.display = 'none';
        btn.textContent = 'View';
      }
    });
  });
}

/** Initializes the category filter pills on the portfolio page */
function initFilterPills(projects) {
  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cat = pill.dataset.category;
      const filtered = cat === 'all' ? projects : projects.filter(p => p.category === cat);

      const grid = document.getElementById('project-grid');
      if (grid) {
        grid.innerHTML = filtered.map(renderProjectCard).join('');
      }

      document.querySelectorAll('.sidebar-item').forEach(item => {
        const title = item.querySelector('.sidebar-item-title').textContent;
        const match = filtered.some(p => p.title === title);
        item.style.display = match ? '' : 'none';
      });
    });
  });
}
