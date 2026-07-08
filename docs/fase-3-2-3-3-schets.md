# Schets 3.2 en 3.3

Doel: de homepagina beter laten sturen zonder nieuw ontwerp. De bestaande
genummerde dienstenrijen blijven leidend; we voegen alleen kleine labels toe
die de route verduidelijken, en vervangen generieke eyebrows door woorden die
iets over de sectie zeggen.

## 3.2 Dienstladder met beslislabels

Voorstel: labels alleen op de home-dienstladder. De vijf home-diensten vormen
een natuurlijke route. AI-geletterdheid blijft een losse, specialistische dienst
op de dienstenpagina en hoeft niet in deze ladder.

```yaml
diensten:
  - title: "Inspiratiesessie"
    stepLabel: "Oriënteren"
    body: "Voor directie, MT, team of event..."
    url: "/copilot-inspiratiesessie/"
  - title: "Readiness-scan"
    stepLabel: "Besluiten"
    body: "Een halve dag op locatie plus een rapport..."
    url: "/copilot-readiness-scan/"
  - title: "Workshops en trainingen"
    stepLabel: "Oefenen"
    body: "Zelf oefenen op echte taken..."
    url: "/copilot-training/"
  - title: "Adoptietraject"
    stepLabel: "Borgen"
    body: "Structurele begeleiding met een 0-meting..."
    url: "/copilot-adoptietraject/"
  - title: "1-op-1-begeleiding"
    stepLabel: "Versnellen"
    body: "Voor directieleden, managers en key users..."
    url: "/copilot-begeleiding/"
```

Waarom deze labels:

- **Oriënteren**: past bij inspiratiesessie; nog geen analyse of traject.
- **Besluiten**: de scan helpt kiezen wat eerst nodig is.
- **Oefenen**: training draait om zelf doen op eigen werk.
- **Borgen**: adoptietraject voorkomt dat gebruik wegzakt.
- **Versnellen**: 1-op-1 is voor mensen die sneller of dieper moeten.

UI-richting:

- klein label boven de diensttitel, in dezelfde typografie als `.small`;
- geen pill, badge of kaartdecoratie;
- kleur `--accent-text` of `--ink-3` testen; waarschijnlijk `--accent-text`
  als het rustig blijft;
- in `card.html` optioneel renderen: alleen als `stepLabel` bestaat.

Voorbeeld rendering:

```text
01
Oriënteren
Inspiratiesessie
Voor directie, MT, team of event...
```

## 3.3 Betekenisvolle eyebrows op home

Nu vallen secties terug op template-defaults: meerdere keren
"Copilot-adoptie" en "Inzicht". Voorstel: per sectie een eigen eyebrow in
`content/_index.md`, zonder templatewijziging.

```yaml
introSections:
  - eyebrow: "Situatie"
    title: "Waar sta je nu?"
  - eyebrow: "Startpunt"
    title: "Beide routes beginnen met inzicht"
  - eyebrow: "Dagelijks werk"
    title: "Wat Copilot betekent in gewoon werk"

sections:
  - eyebrow: "Waarom het stokt"
    title: "Waarom Copilot-adoptie meestal strandt"
  - eyebrow: "Aanpak"
    title: "Nuchter, met bewijs"
  - eyebrow: "Werkgebied"
    title: "In heel Oost-Nederland"
```

Waarom deze eyebrows:

- Ze zijn beschrijvend, niet marketingerig.
- Ze helpen scannen op mobiel.
- Ze dragen betekenis in plaats van alleen categorie.
- Ze blijven kort genoeg voor de huidige letterspacing.

## Integratievolgorde

1. Eerst 3.3 doen: alleen content in `_index.md`, laag risico.
2. Daarna 3.2 doen: `stepLabel` toevoegen aan home-diensten en `card.html`
   optioneel uitbreiden.
3. CSS alleen toevoegen als de bestaande `.small` styling niet goed uitkomt.
4. `hugo --minify --gc` draaien en home op mobiel controleren.

Geen nieuwe pagina, geen nieuwe layoutfamilie, geen JS.
