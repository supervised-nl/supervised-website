# supervised.nl — Hugo static site

Minimal Hugo site for supervised.nl. No external dependencies, no npm pipeline, no JavaScript frameworks.

## Requirements

- [Hugo](https://gohugo.io/installation/) v0.147.0 or later (extended edition required)

## Run locally

```bash
cd supervised-website
hugo server
```

Open http://localhost:1313 in your browser. Hugo watches for file changes and live-reloads.

## Build for production

```bash
hugo --minify
```

Output is written to `/public`. Upload this folder to any static host (Netlify, GitHub Pages, Cloudflare Pages).

## Add a new page

1. Create a Markdown file in `content/`, e.g. `content/nieuw.md`
2. Add front matter at the top:

```markdown
---
title: "Pagina titel"
description: "Meta description voor SEO"
---

Pagina inhoud hier...
```

3. Optionally add it to the nav in `hugo.toml` under `[[menu.main]]`.

## Add a page to the navigation

Edit `hugo.toml` and add a menu entry:

```toml
[[menu.main]]
  name = 'Nieuwe pagina'
  url = '/nieuw/'
  weight = 5
```

## Folder structure

```
supervised/
├── content/          # Page content (Markdown)
│   ├── _index.md     # Homepage
│   ├── diensten.md
│   ├── over.md
│   └── contact.md
├── themes/supervised/
│   ├── layouts/      # HTML templates
│   │   ├── _default/
│   │   │   ├── baseof.html   # Base template (header, nav, footer)
│   │   │   ├── single.html   # Single page template
│   │   │   └── list.html     # List page template
│   │   └── index.html        # Homepage template
│   └── assets/css/
│       └── main.css          # All styles (single file, no framework)
├── static/           # Static assets (images, favicon, etc.)
├── hugo.toml         # Site configuration
└── README.md
```

## Deploy to Netlify

1. Push this folder to a GitHub repository.
2. Connect the repo in [Netlify](https://app.netlify.com).
3. Set build command: `hugo --minify`
4. Set publish directory: `public`
5. Set environment variable: `HUGO_VERSION = 0.147.0`

## Replace placeholder content

All placeholder text is marked with `[PLACEHOLDER ...]`. Search for this string across `content/` to find everything that needs updating before launch.

```bash
grep -r "PLACEHOLDER" content/
```

## Update site title and email

Edit `hugo.toml`:
- `title` — site name shown in nav and `<title>` tags
- `params.email` — contact email shown in footer
- `baseURL` — must match the live domain before deploying
