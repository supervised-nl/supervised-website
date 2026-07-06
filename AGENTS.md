# supervised.nl — Project Instructions

## Project

`supervised.nl` is een minimalistische Hugo static site. Er is geen npm pipeline, geen JavaScript framework en geen package manager. Dat is een bewuste keuze en moet zo blijven.

## Commands

```bash
hugo server        # Local development with live reload at http://localhost:1313
hugo --minify --gc # Production build
```

Hugo extended edition v0.147.0 of later is required (gepind in `vercel.json`).

## Architecture

Custom Hugo theme: `themes/supervised/`.

- `content/` — Markdown pages with front matter. All copy is Dutch.
- `themes/supervised/layouts/_default/baseof.html` — base template with header, nav, footer, inline theme script, and JSON-LD.
- `themes/supervised/layouts/404.html` — 404 page (Vercel serves `public/404.html` automatically).
- `themes/supervised/layouts/_default/faq.html` — FAQ layout with Schema.org FAQPage structured data.
- `themes/supervised/layouts/_default/geo-check.html` — GEO-check tool page (frontend for `api/geo-check.js`).
- `themes/supervised/layouts/blog/list.html` and `themes/supervised/layouts/blog/single.html` — blog overrides.
- `themes/supervised/layouts/contact/single.html` — contact page override.
- `themes/supervised/layouts/partials/logo.html` — SVG logo partial.
- `themes/supervised/assets/css/main.css` — single CSS file, via Hugo Pipes geminified en gefingerprint.
- `themes/supervised/assets/js/` — `site.js`, `geo-check.js` en vendored `lenis.min.js`; alle drie via Hugo Pipes gefingerprint.
- `themes/supervised/static/fonts/` — één variable font (woff2).
- `assets/img/` — bronafbeeldingen (hero, profielfoto); Hugo verkleint ze, de originelen worden nooit gepubliceerd.
- `static/` — root static assets zoals favicon, `llms.txt` en client-logo's (`static/img/clients/`).
- `static/favicon.svg` — één zelf-aanpassend icoon: de licht/donker-wissel zit als `prefers-color-scheme` media query **in de SVG**. Gebruik nooit `media=`-attributen op `<link rel="icon">` — dat werkt alleen in Firefox. `favicon.ico` is de fallback voor Safari/legacy.
- `api/geo-check.js` — Vercel serverless function voor de GEO-scan.

## Performance & Cleanliness Budget

Deze site is bewust supersnel en clean. Elke wijziging moet binnen deze grenzen blijven:

1. **Geen externe dependencies.** Geen npm, geen framework, geen CDN's, geen third-party requests (de CSP staat ze ook niet toe). Vendored JS (zoals Lenis) is de enige uitzondering en leeft in `assets/js/`.
2. **Alle CSS en JS door Hugo Pipes: `minify | fingerprint`.** Nooit een mutable bestand op een vast pad onder `/css/`, `/js/` of `/fonts/` zetten — die paden krijgen in `vercel.json` een jaar `immutable`-cache. Een gewijzigd bestand moet altijd een nieuwe URL krijgen. (Deze fout is twee keer bijna gemaakt; zie git-historie van `site.js`.)
3. **Afbeeldingen altijd via Hugo image processing.** Responsive `srcset` + WebP voor content, en og:images door `.Fit` naar jpg (social crawlers zoals WhatsApp weigeren afbeeldingen van ~1 MB). Publiceer nooit een origineel uit `assets/img/`. Geef `<img>` altijd `width`/`height` mee (geen layout shift).
4. **Paginagewicht bewaken.** Richtlijn: HTML < 20 KB, CSS < 30 KB geminified, eigen JS < 5 KB geminified, first load (HTML+CSS+JS+font) ruim onder 150 KB. Lenis wordt lazy geladen en telt niet mee bij first load.
5. **Progressive enhancement.** Alles werkt zonder JavaScript. Animaties en smooth-scroll respecteren `prefers-reduced-motion`; pointer-effecten alleen bij `pointer: fine`.
6. **Alle JS-gedrag blijft in `site.js`** (of een paginagebonden bestand zoals `geo-check.js`). Inline scripts alleen in `baseof.html` als het echt vóór de eerste paint moet (theme), en dan met CSP-hash (zie onder).
7. **Structured data uit één bron.** Bedrijfsgegevens (adres e.d.) staan in `[params]` in `hugo.toml` en moeten gelijk zijn aan `content/contact.md` en `static/llms.txt`. Wijzig je er één, wijzig dan alle drie.
8. **Productiebuild moet schoon zijn**: `hugo --minify --gc` zonder errors of warnings, vóór elke push.

## CSP and Inline Scripts

`vercel.json` contains a strict Content-Security-Policy with explicit `sha256-` hashes for every inline `<script>` in `baseof.html`.

If you modify any inline script in `baseof.html`, recalculate and update the corresponding hash in `vercel.json`; otherwise the script will be blocked in production.

Let op: Hugo minifiet inline scripts, dus bereken de hash over de **gebouwde** output, niet over de template:

```bash
hugo --minify --gc
# kopieer de inline scriptinhoud (zonder <script>-tags) uit public/index.html
printf '%s' '<script content>' | openssl dgst -sha256 -binary | base64
```

## Caching (vercel.json)

- `/css/`, `/js/`, `/fonts/`: één jaar `immutable` — daarom moet alles daar gefingerprint of versie-vast zijn.
- `/img/`: één dag + `stale-while-revalidate` voor statische bestanden (logo's kunnen wijzigen); door Hugo verwerkte afbeeldingen (`*_hu_*` in de naam) zijn content-hashed en krijgen wél een jaar `immutable`.

## Content Rules

- Regular pages require `title` and `description` front matter.
- Homepage `content/_index.md` also has a `clients:` list with `name` and `file` pairs for client logos.
- Blog posts require `title`, `slug`, `date`, and `description`.
- FAQ page uses `layout: "faq"` and a `faq:` front matter array of `{q, a}` objects.
- Add pages to navigation via `[[menu.main]]` in `hugo.toml`.
- Tags en categorieën zijn uitgeschakeld (`disableKinds` in `hugo.toml`); voeg geen taxonomieën aan front matter toe.

## Adding Content

- New page: create `content/<slug>.md` with `title` and `description` front matter. Add it to `[[menu.main]]` in `hugo.toml` if it should appear in nav.
- New blog post: create `content/blog/<slug>.md` with `title`, `slug`, `date`, and `description`.
- Client logos on homepage: add SVG to `static/img/clients/` and add an entry to `clients:` in `content/_index.md`.
- Custom og:image voor een pagina: zet de bron in `assets/img/` en verwijs met `ogImage:` in front matter; `baseof.html` verkleint hem automatisch.

## Rules

1. Keep all public copy in Dutch unless the requested page explicitly requires another language.
2. Do not introduce npm, a JavaScript framework, or a separate build pipeline without explicit approval.
3. Run `hugo --minify --gc` after template, asset, or content changes when Hugo is available.
4. Use `gh` for repo, branches, pull requests.
5. Use `vercel` for deployment and environment variables.
