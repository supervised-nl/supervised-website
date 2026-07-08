# Verbeterplan supervised.nl

Gebaseerd op de audit van juli 2026: gemeten WCAG-contrasten en touch targets
(Playwright), het conversiepatroon voor dit producttype (lead magnet + formulier
van max. 3 velden), de frontend-design-principes (signature element, structuur
die betekenis draagt) en de factcheck van de Codex-review (waarvan het
CSP/JSON-LD-punt empirisch is weerlegd: CSP reguleert script-*uitvoering*,
JSON-LD is een inert datablok en crawlers lezen ruwe HTML).

Uitgangspunt: de identiteit (donkergroen + oranje, wordmark, glow, hairlines)
is sterk en blijft. Het plan verscherpt en converteert; het herontwerpt niet.

## Definition of Done (geldt voor elke stap)

- `hugo --minify --gc` bouwt schoon; output-diff van de hele site bewust
  beoordeeld (geen onbedoelde wijzigingen).
- Beide thema's, 375px-viewport en `prefers-reduced-motion` gecheckt.
- Playwright-checks groen: themaswitch, interne links/ankers, contrast,
  touch targets.
- CSP-hash in `vercel.json` herberekend als een inline script in
  `baseof.html` wijzigt.
- AGENTS.md bijgewerkt als een conventie verandert.

---

## Fase 1 — Repareren (geen zichtbare verandering, ± halve dag)

### 1.1 Licht-thema-contrast naar WCAG AA
Gemeten: nav/footer (`--ink-3`) 3,40:1 · oranje eyebrows/em 2,87:1 ·
themaknop (`--ink-4`) 1,86:1 — norm is 4,5:1 voor kleine tekst.

- `--ink-3` licht: dekking 0,50 → ± 0,62 (meet na, richt op ≥ 4,5).
- Nieuw token `--accent-text` voor *kleine oranje tekst* (eyebrows,
  mobiel-menu-CTA, nav-panel-eyebrow, `em`): licht thema ± `#C24A00`
  (≥ 4,5 op `#FAFAF8`), donker thema blijft `#FF6205` (6,26:1 gemeten).
  Knoppen, randen en grote accenten blijven overal `#FF6205`.
- Themaknop van `--ink-4` naar `--ink-3`.
- Let op: de lichte tokens staan in **twee** blokken in `main.css`
  (`html[data-theme="light"]` én de `prefers-color-scheme` media query) —
  beide bijwerken.

### 1.2 Touch targets naar 44×44
Gemeten: mobiele menuknop 27×27, themaknop 20×13.
Hit-area vergroten via padding of het bestaande `::before`-patroon van de
nav-links; visueel identiek laten. Meten met boundingBox.

### 1.3 Actieve nav-state per sectie (Codex-bevinding, geverifieerd)
Dienstpagina's publiceren op rootniveau, dus geen enkel menu-item is actief
op bijv. `/copilot-training/`. In `baseof.html` de active-conditie uitbreiden:
actief als URL-prefix matcht **of** (`menu-identifier == "diensten"` en
`.Section == "diensten"`).

### 1.4 Mobiel menu: complete IA + focus-afhandeling
- Nu tonen we alleen de eerste 3 dienstlinks en ontbreken Praktijk,
  Copilot-specialist Twente en Veelgestelde vragen volledig in het mobiele
  menu. Alle dropdown-items per hoofditem tonen (of een bewuste curatie —
  minimaal alle 6 diensten + FAQ).
- Focus trap bij open menu: focus naar eerste link, Tab blijft binnen het
  menu (of `inert` op `main`/`footer`), bij sluiten focus terug naar de
  toggle. Escape werkt al.

### 1.5 Bewust níét doen
CSP-hashes voor JSON-LD (weerlegd, zie boven) · GSAP of extra animatielaag ·
tweede lettertype · kleurrestyle.

---

## Fase 2 — Converteren (grootste rendement, 1–2 dagen)

### 2.1 Planbare actie: formulier of booking-link — beslispunt
Elke CTA zegt "Plan de Readiness-scan" maar eindigt op mailto/tel.

**Optie A (aanbevolen): minimaal formulier, 3 velden** (naam, e-mail, vraag).
- Vercel serverless function `api/contact.js` op eigen domein; de CSP staat
  `form-action 'self'` al toe, dus geen CSP-wijziging in de browser.
- Mailbezorging server-side via één API (bijv. Resend), secret als
  Vercel-env-var. Geen npm-pipeline nodig: dependency-vrije function met
  `fetch`.
- Progressive enhancement: werkt zonder JS (normale POST → redirect naar
  `/bedankt/`, noindex); met JS inline succesmelding (`aria-live`).
  Honeypot + server-side rate limit i.p.v. captcha.
- Nieuwe partial `contact-form.html`; plaatsen op contactpagina en onder de
  scan-pagina.
- Verify: e2e submit-test, labels/foutmeldingen (zichtbaar label per veld,
  fout onder het veld), CSP-regressietest.

**Optie B (sneller, minder eigen beheer):** een booking-link (bijv. cal.com)
als gewone `<a href>` — een link is navigatie, geen request, dus ook geen
CSP-impact. Kan ook als tussenstap naast optie A.

### 2.2 CTA's laten kloppen
Header-CTA en closing-CTA's laten landen op het formulier/de booking
(anker `#plan`), niet op een kale contactpagina.

### 2.3 Bewijs naar voren
- Logostrook direct onder de hero op home; dekking omhoog
  (licht 0,3 → ± 0,55; donker 0,55 → ± 0,7). Blijft rustig, wordt leesbaar.
- Sectie "Nuchter, met bewijs" concreet maken in de bestaande
  hairline-stijl: 3 feiten als rijen (50+ adoptietrajecten · 3 jaar alleen
  Copilot · gemeten met 0- en eindmeting). Geen testimonial-cards; hooguit
  één korte inline quote (blockquote-stijl bestaat al).
- Praktijk beter vindbaar: link vanuit de bewijssectie; hoofdnav heeft al
  6 items, dus niet uitbreiden tenzij bewust gekozen — beslispunt.

---

## Fase 3 — Aanscherpen (design, 1–2 dagen, per onderdeel akkoord vragen)

### 3.1 Signature element: de scan-meetlat (beste Codex-idee)
Een sobere, redactionele "scan-uitkomst" boven de vouw (home en/of
scan-pagina): 4–5 meetpunten — Licenties & instellingen · SharePoint &
datahygiëne · Privacy & werkafspraken · Kansrijke rollen · Meetbaarheid —
als hairline-checklist in de bestaande stijl (geen dashboard-kaart).
Werkwijze: eerst een losse HTML-schets + screenshot ter goedkeuring, daarna
pas integreren.

### 3.2 Dienstladder met beslislabels
Per dienst één label dat de route toont: oriënteren → besluiten → oefenen →
borgen → versnellen. Via front matter + kleine uitbreiding van `card.html`.

### 3.3 Betekenisvolle eyebrows op home
Nu 3× "Copilot-adoptie" en 3× "Inzicht" (template-defaults). Per sectie een
eigen eyebrow invullen in `_index.md` — puur content, 10 minuten.

### 3.4 Copy-compressie
Leads naar maximaal 2 zinnen (dienstpagina's en home-intro zijn nu zware
blokken op mobiel). Voor/na-voorstellen per pagina ter review — content is
merkgevoelig, niets ongevraagd herschrijven.

### 3.5 Hero-verfijning
Portret steviger verankerd (verticaal gecentreerd/iets groter), gecheckt op
mobiel; bewijsstrook eronder (uit 2.3) maakt de hero een these.

---

## Fase 4 — Autoriteit & afwerking (doorlopend)

- **Kennisbank vullen** volgens `docs/herpositionering/fase-4-contentplan.md`
  (één artikel ondergraaft nu de autoriteitsclaim).
- **JSON-LD `offers`** (€ 950, EUR) toevoegen aan het Service-schema van de
  scan-pagina.
- **HTML-gewicht**: home 24,1 KB en FAQ 28,1 KB overschrijden de eigen
  20 KB-richtlijn; grootste post is nav + JSON-LD (FAQ-schema dupliceert
  bewust alle vragen). Voorstel: richtlijn in AGENTS.md eerlijk bijstellen
  (± 30 KB) of `areaServed` inkorten. Laagste prioriteit.

## Openstaande beslispunten (gebruiker)

1. Formulier (optie A), booking-link (optie B), of beide? Bij A: welke
   mailprovider?
2. Praktijk in de hoofdnav (7 items) of alleen prominenter op home?
3. Eén inline klantquote op home: ja/nee (en van wie)?
