# Geïnstalleerde skills (derden)

Deze map bevat Claude Code-skills die uit externe repositories zijn
geïnstalleerd. Ze staan bewust in git zodat elke sessie op dit project ze
heeft (zie de uitzondering in `.gitignore`). Bijwerken = de mappen opnieuw
kopiëren uit de bronrepo.

| Skills | Bron | Licentie | Commit |
| --- | --- | --- | --- |
| `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-react`, `gsap-frameworks`, `gsap-utils`, `gsap-performance`, `gsap-plugins` | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | MIT (GreenSock) | `aed9cfd` |
| `ui-ux-pro-max`, `design`, `design-system`, `ui-styling`, `brand`, `banner-design`, `slides` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | MIT (Next Level Builder) | `12b486b` |
| 66 designstijl-skills (`minimal`, `editorial`, `brutalism`, `glassmorphism`, `neon`, …) | [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills) | MIT (Bergside) | `f631a09` |
| `frontend-design` | [anthropics/claude-code](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design) (plugin `frontend-design`) | zie bronrepo | `d0f5beb` |

Let op voor dit project: de site heeft een streng performance- en
dependency-budget (zie `AGENTS.md`). Skills die frameworks, npm of externe
assets voorstellen (bijv. GSAP als library) mogen alleen worden toegepast
binnen die regels — GSAP zou als vendored bestand in
`themes/supervised/assets/js/` moeten, net als Lenis, en alleen met expliciete
toestemming.
