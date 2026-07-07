# supervised.nl - Hugo static site

Minimalistische Hugo-site voor supervised.nl. Bewust geen npm, geen package manager, geen JavaScript-framework en geen CDN's.

## Requirements

- [Hugo](https://gohugo.io/installation/) v0.147.0 or later (extended edition required)

## Lokaal draaien

```bash
hugo server
```

Open http://localhost:1313 in je browser. Hugo kijkt mee en live-reloadt wijzigingen.

## Productiebuild

```bash
hugo --minify --gc
```

Output komt in `public/`. Vercel draait dezelfde build command uit `vercel.json`.

## Nieuwe pagina

1. Maak een Markdown-bestand in `content/`, bijvoorbeeld `content/nieuw.md`.
2. Voeg front matter toe:

```markdown
---
title: "Pagina titel"
description: "Meta description voor SEO"
---

Pagina-inhoud hier...
```

3. Voeg de pagina alleen aan `[[menu.main]]` in `hugo.toml` toe als hij in de navigatie moet staan.

## Navigatie

Voeg een menu-entry toe in `hugo.toml`:

```toml
[[menu.main]]
  name = 'Nieuwe pagina'
  url = '/nieuw/'
  weight = 5
```

## Folder structure

```
supervised-website/
├── content/                 # Nederlandse content in Markdown
│   ├── _index.md            # Homepage
│   ├── diensten/            # Dienstpagina's
│   ├── blog/                # Intern blog, publiceert als /kennisbank/
│   └── contact.md
├── assets/img/              # Bronafbeeldingen voor Hugo image processing
├── static/                  # Root static assets, favicon en client-logo's
├── themes/supervised/
│   ├── layouts/             # Hugo templates en partials
│   ├── assets/css/main.css  # Enige CSS-bestand, via Hugo Pipes
│   ├── assets/js/           # site.js en vendored lenis.min.js
│   └── static/fonts/        # Lokale variable font
├── hugo.toml                # Siteconfiguratie, menu en bedrijfsgegevens
├── vercel.json              # Build, redirects, headers en CSP
└── README.md
```

## Deploy

Deployment loopt via Vercel. De relevante instellingen staan in `vercel.json`:

- build command: `hugo --minify --gc`
- output directory: `public`
- Hugo version: `0.147.0`

## Contentregels

- Publieke copy is Nederlands.
- Reguliere pagina's hebben `title` en `description` in front matter.
- Blogposts hebben `title`, `slug`, `date` en `description`.
- FAQ gebruikt `layout: "faq"` en een `faq:` array.
- Taxonomieen zijn uitgeschakeld; voeg geen tags of categorieen toe.

## Bedrijfsgegevens

Adres, telefoon en e-mail staan in `hugo.toml`, `content/contact.md` en `static/llms.txt`. Houd die drie gelijk, omdat structured data uit `hugo.toml` wordt opgebouwd.
