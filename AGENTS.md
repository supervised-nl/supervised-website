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

- `content/` — Markdown pages with front matter. All copy is Dutch. **Elke publieke pagina is een `.md`-bestand**; layouts bevatten geen paginaspecifieke content. Enige uitzondering: de 404-pagina (alleen template, standaard Hugo).
- `themes/supervised/layouts/_default/baseof.html` — base template with header, nav, footer, inline theme script, and JSON-LD.
- `themes/supervised/layouts/404.html` — 404 page (Vercel serves `public/404.html` automatically).
- `themes/supervised/layouts/_default/faq.html` — FAQ layout with Schema.org FAQPage structured data.
- `themes/supervised/layouts/blog/list.html` and `themes/supervised/layouts/blog/single.html` — kennisbank overrides. De sectie heet intern `blog` (templates keyen op `.Section "blog"`), maar publiceert als `/kennisbank/` via een url-override in `content/blog/_index.md` en de permalink-config.
- `themes/supervised/layouts/contact/single.html` — contact page override.
- `themes/supervised/assets/css/main.css` — single CSS file, via Hugo Pipes geminified en gefingerprint.
- `themes/supervised/assets/js/` — `site.js` en vendored `lenis.min.js`; beide via Hugo Pipes gefingerprint.
- `themes/supervised/static/fonts/` — één variable font (woff2).
- `assets/img/` — bronafbeeldingen (hero, profielfoto); Hugo verkleint ze, de originelen worden nooit gepubliceerd.
- `static/` — root static assets zoals favicon, `llms.txt` en client-logo's (`static/img/clients/`).
- `static/favicon.svg` — één zelf-aanpassend icoon: de licht/donker-wissel zit als `prefers-color-scheme` media query **in de SVG**. Gebruik nooit `media=`-attributen op `<link rel="icon">` — dat werkt alleen in Firefox. `favicon.ico` is de fallback voor Safari/legacy.

## Paginastructuur

Er zijn precies **twee paginasoorten**. Elke pagina wordt uit dezelfde partials
opgebouwd; layouts assembleren alleen, alle herbruikbare markup leeft in
`themes/supervised/layouts/partials/`:

1. **Verhalend** (home, over): `hero.html` (kop + pagina-body links, profielfoto
   rechts, optionele CTA's uit `ctaPrimary`/`ctaSecondary`) gevolgd door
   gestapelde secties via `page-section.html`, gevoed door een `sections:`-array
   (en op home `introSections:`/`diensten:`) in de front matter. Anker-id's van
   secties worden automatisch uit de titel afgeleid (`anchorize`).
2. **Content** (diensten, werkwijze, kennisbank, contact, faq, juridisch): één
   `page-grid` met `page-header.html` links (eyebrow, titel, lead) en de inhoud
   rechts. Lange tekstpagina's krijgen `content-sections` op de body-kolom,
   waardoor markdown-`h2`'s automatisch genummerde rijen met hairlines worden.

Gedeelde partials en hun rol:

- `page-header.html` — kopblok (eyebrow, h1/h2, lead) van elke page-grid kolom.
- `page-section.html` — volledige verhaal-sectie (kop links, body rechts).
- `hero.html` + `hero-image.html` — hero met profielfoto.
- `card.html` — genummerde kaart in een divider-lijst (varianten `home` en
  `dienst`; nummers worden altijd berekend uit de volgorde, nooit handmatig in
  front matter gezet).
- `faq-items.html` — FAQ-lijst uit een `faq:`-array.
- `closing.html` — afsluitende CTA-sectie; **elk paginatemplate eindigt hierop**,
  dus een `closing:`-blok in de front matter werkt op iedere pagina.
- `logo.html` — SVG-logo.

Regels om dit consistent te houden:

- Nieuwe pagina's zijn altijd een `.md` in `content/` die op een van de twee
  soorten meelift. Geen nieuwe eenmalige layout-markup: past iets niet, breid
  dan een partial uit zodat álle pagina's het krijgen.
- Het genummerde-rijen-systeem (kaarten, `content-sections`-h2's, blog- en
  faq-items) deelt één CSS-blok (“divider lists” / “numbered rows” in
  `main.css`). Nieuwe lijstvarianten sluiten dáárop aan; geen declaraties
  kopiëren.
- CSS gebruikt de tokens uit `:root` (o.a. `--gutter` voor de horizontale
  paginamarge, `--divider-space`, `--rule`, kleuren, `--dur-*`/`--ease-out`).
  Geen losse magic values voor iets waar al een token voor bestaat.
- Licht/donker: alle themabare waarden zijn custom properties. De lichte set
  staat bewust twee keer in `main.css` (`html[data-theme="light"]` voor de
  handmatige keuze én `@media (prefers-color-scheme: light)` voor de
  OS-voorkeur zonder JS) — houd beide blokken gelijk bij elke wijziging. Wrap
  `html[data-theme="light"]` nooit in `:where()`: dat maakt de specificiteit 0
  en dan winnen de donkere `:root`-tokens (die bug is al eens gefixt).

## Performance & Cleanliness Budget

Deze site is bewust supersnel en clean. Elke wijziging moet binnen deze grenzen blijven:

1. **Geen externe dependencies.** Geen npm, geen framework, geen CDN's, geen third-party requests (de CSP staat ze ook niet toe). Vendored JS (zoals Lenis) is de enige uitzondering en leeft in `assets/js/`.
2. **Alle CSS en JS door Hugo Pipes: `minify | fingerprint`.** Nooit een mutable bestand op een vast pad onder `/css/`, `/js/` of `/fonts/` zetten — die paden krijgen in `vercel.json` een jaar `immutable`-cache. Een gewijzigd bestand moet altijd een nieuwe URL krijgen. (Deze fout is twee keer bijna gemaakt; zie git-historie van `site.js`.)
3. **Afbeeldingen altijd via Hugo image processing.** Responsive `srcset` + WebP voor content, en og:images door `.Fit` naar jpg (social crawlers zoals WhatsApp weigeren afbeeldingen van ~1 MB). Publiceer nooit een origineel uit `assets/img/`. Geef `<img>` altijd `width`/`height` mee (geen layout shift).
4. **Paginagewicht bewaken.** Richtlijn: HTML < 20 KB, CSS < 30 KB geminified, eigen JS < 5 KB geminified, first load (HTML+CSS+JS+font) ruim onder 150 KB. Lenis wordt lazy geladen en telt niet mee bij first load.
5. **Progressive enhancement.** Alles werkt zonder JavaScript. Animaties en smooth-scroll respecteren `prefers-reduced-motion`; pointer-effecten alleen bij `pointer: fine`.
6. **Alle JS-gedrag blijft in `site.js`** (of een paginagebonden, gefingerprint bestand). Inline scripts alleen in `baseof.html` als het echt vóór de eerste paint moet (theme), en dan met CSP-hash (zie onder).
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

- New page: create `content/<slug>.md` with `title` and `description` front matter. Optioneel: `eyebrow`, `lead` (introtekst onder de titel) en `closing` (afsluitende CTA-sectie: `question`, `body`, `cta.label`, `cta.url`). Add it to `[[menu.main]]` in `hugo.toml` if it should appear in nav.
- New blog post: create `content/blog/<slug>.md` with `title`, `slug`, `date`, and `description`.
- Client logos on homepage: add SVG to `static/img/clients/` and add an entry to `clients:` in `content/_index.md`.
- Custom og:image voor een pagina: zet de bron in `assets/img/` en verwijs met `ogImage:` in front matter; `baseof.html` verkleint hem automatisch.

## Rules

1. Keep all public copy in Dutch unless the requested page explicitly requires another language.
2. Do not introduce npm, a JavaScript framework, or a separate build pipeline without explicit approval.
3. Run `hugo --minify --gc` after template, asset, or content changes when Hugo is available.
4. Use `gh` for repo, branches, pull requests.
5. Use `vercel` for deployment and environment variables.
