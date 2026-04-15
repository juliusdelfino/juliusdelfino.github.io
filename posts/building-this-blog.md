# Building This Blog

I wanted a blog that felt fast, minimal, and entirely mine. No static site generator, no npm install, no build step. Just files served by GitHub Pages. Here's how I built it.

## The Architecture

The entire site is a single-page application powered by a hash-based router. One `index.html` loads a few JavaScript modules, and all navigation happens client-side:

```javascript
window.addEventListener('hashchange', () => {
  const route = location.hash.slice(1) || '/';
  renderRoute(route);
});
```

Blog posts and pages are plain Markdown files that live in the repo. When you navigate to a post, the app fetches the `.md` file, parses it into HTML, and injects it into the page. No server processing needed.

## The Markdown Parser

Rather than pulling in a library, I wrote a lightweight parser from scratch. It handles the basics — headings, bold, italic, code blocks, links, images, lists, and tables. The core is a series of regex replacements applied in the right order:

```javascript
export function parseMarkdown(md) {
  let html = md;
  // Fenced code blocks first (protect from other rules)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
  );
  // Then inline rules, block rules, etc.
  return html;
}
```

Is it as robust as marked or remark? Not even close. But it handles everything I need, and I understand every line of it.

## Glassmorphism and Theming

The visual design uses a technique called glassmorphism — translucent panels with backdrop blur over a full-screen background image. CSS custom properties make theming straightforward:

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.62);
  --glass-blur: blur(18px) saturate(160%);
  --glass-border: rgba(255, 255, 255, 0.22);
}

[data-theme="dark"] {
  --glass-bg: rgba(255, 255, 255, 0.12);
}
```

A theme toggle swaps `data-theme` on the `<html>` element and persists the choice in `localStorage`. The background images shift between nature photographs — forests, mountains, lakes — giving each page a distinct atmosphere.

## What I Learned

Building without frameworks forces you to understand the platform. I re-learned things I'd forgotten: how `hashchange` works, how `backdrop-filter` interacts with stacking contexts, how to structure CSS without a preprocessor.

The constraints were the point. Every feature I added had to justify its weight in vanilla code. The result is a site that loads fast, runs anywhere, and has zero dependencies.

## What's Next

I'd like to add a few things over time: full-text search across posts, reading progress indicators, and maybe a small RSS feed generator. But for now, this is enough. A place to write, a place to share, a place that's mine.

If you're considering building your own blog from scratch, I'd encourage it. The web platform is more capable than we give it credit for. Sometimes the best tool is no tool at all.
