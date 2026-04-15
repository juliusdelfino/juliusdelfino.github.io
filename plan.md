# Static Markdown-Powered Blog — Full Build Spec

## Goal
Build a complete, fully static SPA blog hostable on GitHub Pages.
No build tools, no frameworks, no npm. Pure vanilla HTML, CSS, and JavaScript.
The site reads Markdown (.md) files at runtime using the Fetch API and renders
them client-side. Everything must work from a single repo dropped into GitHub Pages.

---

## Visual Design Direction

### Theme System
Implement a light/dark theme toggle (button in the navbar, persisted in localStorage).
Both themes share the same design language — only the surface colors and background
imagery change. The toggle should animate smoothly (icon crossfade or sun/moon icon swap).

### Background
The page background is always a full-viewport nature photograph (use high-quality
Unsplash URLs with appropriate parameters, e.g. forest, mountains, misty lake, aurora).
In dark mode: the image is darkened with a CSS overlay (rgba(0,0,0,0.55)).
In light mode: the image is lightened/desaturated (rgba(255,255,255,0.45) + brightness filter).
The background image is fixed (background-attachment: fixed) so it parallaxes on scroll.
Pick 3–4 different nature images and rotate them per-page (home gets one, about another, etc).

### Glassmorphism
ALL content panels — cards, navbars, sidebars, modals, post bodies — use glass styling:
  background: rgba(255,255,255,0.12)  [dark mode] / rgba(255,255,255,0.62) [light mode]
  backdrop-filter: blur(18px) saturate(160%)
  -webkit-backdrop-filter: blur(18px) saturate(160%)
  border: 1px solid rgba(255,255,255,0.22)
  border-radius: 16px
  box-shadow: 0 8px 32px rgba(0,0,0,0.18)
Define these as CSS custom properties so both themes just swap the rgba values.
Nature-tinted glass: subtly tint glass panels with the dominant color of the background
image — e.g. a faint green tint on forest pages, a faint blue on ocean pages. Achieve
this by adding a low-opacity color layer inside the panel using ::before pseudo-elements.

### Typography
Display font (headings): Syne or Playfair Display — loaded via Google Fonts @import.
Body font: Inter or DM Sans.
Hero text: massive, 6–10vw, bold, white with a soft text-shadow for legibility on photos.
Body text in glass panels: high contrast — near-white in dark mode, near-black in light.

### Nature Accent Colors
Define a palette inspired by nature. Use CSS variables:
  --accent-forest: #4caf7d     (deep green)
  --accent-sky:    #5ab4e5     (clear blue)
  --accent-earth:  #c8a46e     (warm sand)
  --accent-mist:   #a8bfc9     (cool gray-blue)
Primary accent used for links, active states, tags: --accent-forest in dark mode,
a darker shade (#2e7d52) in light mode for contrast.

### General Rules
- Fully mobile-responsive. No horizontal scroll on any screen width.
- Smooth page transitions: fade-out → swap content → fade-in (200ms each).
- Custom scrollbar: thin, semi-transparent, rounded.
- All interactive elements have subtle hover transitions (scale, glow, border brightening).
- No inline styles in HTML. All styling via CSS classes and custom properties.

---

## Sample Images

Use Unsplash Source URLs for all sample images throughout the site.
Format: https://source.unsplash.com/featured/?{keyword}&w=1200
Examples of keywords to use per context:
  - Blog post covers: forest, mountains, ocean, sunset, wildflowers, waterfall
  - About Me photo: portrait (or use a placeholder avatar SVG)
  - Portfolio project thumbnails: architecture, technology, abstract, cityscape
  - Page backgrounds: aurora, misty-forest, alpine-lake, desert

Every image element must include:
  loading="lazy"
  alt text describing the image
  aspect-ratio set via CSS (16/9 for covers, 1/1 for avatars, 4/3 for project thumbs)
  object-fit: cover
  border-radius matching parent glass card

---

## File & Folder Structure

```
/
├── index.html              ← single HTML shell
├── 404.html                ← GitHub Pages SPA fallback
├── style.css               ← all styles + CSS variables for both themes
├── app.js                  ← router + page renderers
├── markdown-parser.js      ← custom MD → HTML parser
├── search.js               ← search index + UI
├── tools.js                ← mini JS tools (weather, text converter, etc.)
├── about.md                ← about me content
├── portfolio.md            ← portfolio metadata + project list (parsed by app.js)
├── posts/
│   ├── index.json          ← post manifest
│   ├── hello-world.md
│   ├── into-the-forest.md
│   └── building-this-blog.md
└── assets/
    └── (icons, any local images)
```

---

## Content Architecture

### posts/index.json
```json
[
  {
    "slug": "hello-world",
    "title": "Hello World",
    "date": "2024-11-01",
    "excerpt": "Welcome to my corner of the internet.",
    "tags": ["personal", "intro"],
    "coverImage": "https://source.unsplash.com/featured/?forest&w=1200"
  },
  {
    "slug": "into-the-forest",
    "title": "Into the Forest",
    "date": "2024-12-10",
    "excerpt": "Lessons I learned hiking alone for a week.",
    "tags": ["nature", "reflections"],
    "coverImage": "https://source.unsplash.com/featured/?mountains&w=1200"
  },
  {
    "slug": "building-this-blog",
    "title": "Building This Blog",
    "date": "2025-01-15",
    "excerpt": "How I built a zero-dependency static blog in a weekend.",
    "tags": ["code", "web"],
    "coverImage": "https://source.unsplash.com/featured/?technology&w=1200"
  }
]
```

### portfolio.json  (create this file too)
Separate data file for portfolio projects:
```json
[
  {
    "id": "project-alpha",
    "title": "Project Alpha",
    "category": "Web Development",
    "description": "A full paragraph describing the project, tech used, outcome.",
    "tags": ["JavaScript", "CSS", "API"],
    "image": "https://source.unsplash.com/featured/?architecture&w=800",
    "link": "https://github.com",
    "year": "2024"
  }
]
```
Include 5–6 varied sample projects across different categories
(e.g. Web Development, Design, Open Source, Data, CLI Tools).

### Markdown Parser
Write a lightweight custom parser in markdown-parser.js.
Support: h1–h4, bold, italic, inline code, fenced code blocks (with language tag),
blockquotes, unordered + ordered lists, horizontal rules, links, images, tables,
paragraph breaks. No external library. Export as parseMarkdown(mdString) → htmlString.

---

## Pages & Routing

Hash-based SPA router: #/ #/about #/portfolio #/portfolio/{id} #/blog/{slug}
Implemented in app.js. Listen to hashchange + handle initial load. Support back/forward.
Each route change triggers the fade transition, then calls the appropriate render function.

### Page: Home (#/)
Background image: aurora or alpine lake (fixed, parallax).

Hero section:
  Full-viewport-height. Site name in massive display type (8vw, bold, white).
  Tagline beneath (1.4rem, semi-transparent white).
  A subtle animated gradient border or shimmer on the hero text (CSS animation only).
  Scroll-down arrow that bounces gently.

Recent Posts section (below hero):
  Heading: "Recent Writing" — large, white, left-aligned.
  Pull 5 most recent posts from posts/index.json, sorted by date descending.
  Layout:
    First/featured post: full-width glass card. Large cover image (top half),
    title + date + excerpt + tags in glass panel (bottom half). Big visual impact.
    Remaining 4 posts: 2-column grid of smaller glass cards (image top, text below).
    On mobile: all cards stack to single column.
  Each card: hovering lifts it (translateY(-4px)), brightens the glass border.
  Tag pills: small, rounded, nature-accent colored, with glass tint.

### Page: About Me (#/about)
Background image: misty forest.

Top section (above the fold):
  Left column (40%): circular avatar image (Unsplash portrait or placeholder SVG),
    name in large display font, short one-liner tagline.
  Right column (60%): 3–4 stat/highlight chips in a glass grid
    (e.g. "5 years coding", "12 projects shipped", "3 countries lived in").
  Both columns sit inside a wide glass panel — full bleed, dramatic.

Below: fetched and parsed about.md content rendered inside a glass content card.
  max-width: 72ch, centered. Headings use accent color. Code uses monospace glass chip.

about.md sample content should include: intro paragraph, skills list, background story,
a fun facts section, and a "Currently" section (reading, building, listening to).

### Page: Portfolio (#/portfolio and #/portfolio/{id})

Background image: cityscape or abstract.

#### Portfolio List view (#/portfolio)
Two-column layout — sidebar + main content area:

LEFT SIDEBAR (glass panel, sticky, ~280px wide):
  - Site/section title "Portfolio" at top.
  - List of all projects as clickable nav items. Each item shows: project title +
    category tag. Active project highlighted with accent border-left + brighter glass.
  - Below project list: a "Filter by category" set of toggle pills.
    Clicking a category filters both the sidebar list and the main area.
  - On mobile: sidebar collapses into a horizontal scrollable pill row at the top.

MAIN AREA:
  - When no project is selected: show a project grid (2–3 col on desktop, 1 col mobile).
    Each project card: cover image (4/3 ratio), title, category, year, short description,
    tags, and a "View Project →" button. Cards are glass with nature tint.
  - When a project is selected (#/portfolio/{id}): main area shows the full project detail
    view — large cover image, title, full description, tech tags, external link button,
    and a "← Back to all projects" link. The sidebar stays visible and highlights the
    active project.

QUICK TOOLS SECTION (at the bottom of the portfolio page main area, always visible):
  Heading: "Quick Tools" — same size as section headings elsewhere.
  A responsive grid of tool cards (2–3 col desktop, 1 col mobile). Each tool is a
  self-contained glass card with a title, icon (emoji or inline SVG), and its UI
  fully rendered inside the card. No navigation needed — tools live inline on the page.

  Implement ALL of the following tools in tools.js, each as a function that returns
  an HTML string or DOM element. app.js calls them when rendering the portfolio page.

  TOOL 1 — Weather Dashboard:
    Input: city name (text input + Enter key or button).
    On submit: fetch from Open-Meteo API (free, no key needed):
      https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1
      then https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}
        ¤t_weather=true&hourly=temperature_2m,weathercode&timezone=auto
    Display: city name, current temp (°C), weather condition (map weathercode to
    text label), wind speed. Show a 5-item hourly forecast bar below.
    Show a loading state and error state.

  TOOL 2 — Text Converter:
    Textarea input.
    Button row: UPPERCASE / lowercase / Title Case / camelCase / snake_case /
      kebab-case / Reverse / Count Words / Count Chars.
    Output area shows transformed text. Copy button copies it.
    All transformations run in JS, no API needed.

  TOOL 3 — Markdown Previewer:
    Split view: left textarea (raw MD input), right panel (rendered HTML output).
    Uses the same parseMarkdown() from markdown-parser.js.
    Live update on input (no debounce needed).
    Preload a short sample MD snippet as placeholder.

  TOOL 4 — Pomodoro Timer:
    25 min work / 5 min break cycle.
    Large countdown display (MM:SS) in big type inside the glass card.
    Start / Pause / Reset buttons.
    Visual ring progress indicator (SVG circle with stroke-dashoffset animation).
    Plays a soft beep on cycle end (Web Audio API oscillator, no file needed).
    Shows current mode: "Work" or "Break".

  TOOL 5 — Color Palette Generator:
    Input: a hex color code.
    Output: a row of 7 tints/shades (mix with white/black at steps),
    plus complementary + analogous + triadic swatches.
    Each swatch shows its hex code. Click to copy hex.
    All computed in JS (no API).

  TOOL 6 — Unit Converter:
    Dropdown to select category: Length / Weight / Temperature / Speed.
    Two inputs with unit selectors. Typing in either field updates the other live.
    Handles all common unit pairs within each category.

---

## Search

Implement in search.js:
- Build index from posts/index.json (title + excerpt + tags). Fetch on first load.
- Search overlay: triggered by clicking the search icon in the nav.
  Full-screen glass overlay (backdrop-filter, dark bg). Centered search input,
  large, prominent. Results appear below as glass cards: title (highlighted match),
  excerpt, date, tags.
- Escape key closes overlay. Clicking a result navigates and closes.
- "No results" state styled consistently.
- Also expose a global window.searchIndex for potential use by tools.

---

## Navigation

Fixed top navbar. Glass panel (full-width, backdrop-blur).
  Left: site name (display font, accent color).
  Right: Home · About · Portfolio · [search icon] · [theme toggle icon]

Theme toggle: sun icon (light mode) / moon icon (dark mode). SVG inline icons.
Clicking swaps the data-theme attribute on  and saves to localStorage.
On load: read localStorage, apply theme before first render (no flash).

Mobile navbar: hamburger (three lines → X animation on open).
  Full-screen glass overlay nav: links stacked vertically, large (2rem), centered.
  Smooth slide-in from top or fade-in.

Active route: nav link has accent-colored underline + slightly brighter text.

---

## Blog Post Page (#/blog/:slug)

Background: a nature image matching the post's cover (same URL, blurred + darkened).

Layout:
  Hero: full-width cover image (50vh height), with post title overlaid at the bottom
    in large white type, date and tags below it (all on a glass gradient bar).
  Body: glass content card, max-width 72ch, centered. Generous padding.
    Headings: accent color. Code blocks: darker glass, monospace, language label badge.
  Sidebar (desktop only, sticky): auto-generated Table of Contents from h2/h3 headings.
    Glass panel, small text, clicking scrolls to heading (smooth).
  Footer: estimated read time + "← Previous" / "Next →" post navigation as glass chips.
    Both show the adjacent post's title and date.

Read time calculation: Math.round(wordCount / 200) + " min read"

---

## Performance & GitHub Pages Compatibility

- Zero build step. index.html is the only entry point.
- All fetch paths are relative (works at any subdomain or custom domain).
- Graceful 404: if a fetch fails, render a styled "Page not found" glass card.
- 404.html: copy of index.html + the standard GitHub Pages SPA hash redirect script
  (the one that encodes the path into a query string and redirects to index.html).
- All images: loading="lazy", explicit width/height or aspect-ratio.
- backdrop-filter has limited support — add @supports fallback:
    @supports not (backdrop-filter: blur(1px)) {
      .glass { background: rgba(20,20,20,0.85); }  /* dark mode fallback */
    }

---

## Code Quality Requirements

- ES modules: type="module" on the main script tag.
- app.js: router + page renderers only.
- markdown-parser.js: pure function, no side effects.
- search.js: search state, index, and UI logic.
- tools.js: each tool as a named export returning a DOM element or HTML string.
- style.css: all custom properties in :root (light) and [data-theme="dark"] :root.
  Organize in sections: Reset → Variables → Typography → Layout → Components →
  Glass → Pages → Tools → Responsive → Animations.
- Well-commented — each function has a one-line JSDoc comment.
- No console.log left in production code.

---

## Deliverables

Produce ALL files, complete and working:

1.  index.html
2.  404.html
3.  style.css
4.  app.js
5.  markdown-parser.js
6.  search.js
7.  tools.js
8.  portfolio.json (5–6 sample projects)
9.  posts/index.json (3 entries)
10. posts/hello-world.md (~400 words, personal/reflective tone)
11. posts/into-the-forest.md (~400 words, nature/travel tone)
12. posts/building-this-blog.md (~400 words, technical tone, with code blocks)
13. about.md (~500 words, includes skills, story, fun facts, currently section)
14. portfolio.md (optional intro text rendered above the project grid)

After all files, include a "Getting Started" section covering:
- How to add a new blog post
- How to add a portfolio project
- How to swap the background images
- How to change the accent color
- How to deploy to GitHub Pages
  