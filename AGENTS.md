# supervised.nl — Codex Project Instructions

## Project

`supervised.nl` is een minimalistische Hugo static site. Er is geen npm pipeline, geen JavaScript framework en geen package manager.

## Commands

```bash
hugo server        # Local development with live reload at http://localhost:1313
hugo --minify --gc # Production build
```

Hugo extended edition v0.147.0 of later is required.

## Architecture

Custom Hugo theme: `themes/supervised/`.

- `content/` — Markdown pages with front matter. All copy is Dutch.
- `themes/supervised/layouts/_default/baseof.html` — base template with header, nav, footer, inline JS, and JSON-LD.
- `themes/supervised/layouts/_default/faq.html` — FAQ layout with Schema.org FAQPage structured data.
- `themes/supervised/layouts/blog/list.html` and `themes/supervised/layouts/blog/single.html` — blog overrides.
- `themes/supervised/layouts/contact/single.html` — contact page override.
- `themes/supervised/layouts/partials/logo.html` — SVG logo partial.
- `themes/supervised/assets/css/main.css` — single CSS file processed by Hugo Pipes.
- `themes/supervised/static/` — fonts, images, and `js/lenis.min.js`.
- `static/` — root static assets such as favicon and `llms.txt`.

## Content Rules

- Regular pages require `title` and `description` front matter.
- Homepage `content/_index.md` also has a `clients:` list with `name` and `file` pairs for client logos.
- Blog posts require `title`, `slug`, `date`, and `description`.
- FAQ page uses `layout: "faq"` and a `faq:` front matter array of `{q, a}` objects.
- Add pages to navigation via `[[menu.main]]` in `hugo.toml`.

## CSP and Inline Scripts

`vercel.json` contains a strict Content-Security-Policy with explicit `sha256-` hashes for every inline `<script>` in `baseof.html`.

If you modify any inline script in `baseof.html`, recalculate and update the corresponding hash in `vercel.json`; otherwise the script will be blocked in production.

To recalculate, build the site, copy the inline script content, and compute:

```bash
echo -n "<script content>" | openssl dgst -sha256 -binary | base64
```

## Adding Content

- New page: create `content/<slug>.md` with `title` and `description` front matter. Add it to `[[menu.main]]` in `hugo.toml` if it should appear in nav.
- New blog post: create `content/blog/<slug>.md` with `title`, `slug`, `date`, and `description`.
- Client logos on homepage: add SVG to `themes/supervised/static/img/` and add an entry to `clients:` in `content/_index.md`.

## Rules

1. Keep all public copy in Dutch unless the requested page explicitly requires another language.
2. Do not introduce npm, a JavaScript framework, or a separate build pipeline without explicit approval.
3. Run `hugo --minify --gc` after template, asset, or content changes when Hugo is available.
4. Use `gh` for repo, branches, pull requests.
5. Use `vercel` for deployment and environment variables.
