# KI-Beratungsportfolio

Marketing- und Portfolio-Website für ein modulares KI-Transformations­beratungs­angebot
(KPMG-inspiriertes Design, deutschsprachig). Ursprünglich eine einzelne
`index.html`-Datei mit Inline-Skripten — jetzt eine moderne, komponenten­basierte
[Astro](https://astro.build)-Site, die als statisches HTML ausgeliefert wird.

## Warum diese Architektur

| Vorher | Nachher |
| --- | --- |
| Eine 1.200-Zeilen-`index.html` mit versteckten „Views" | 7 echte Routen als eigene Seiten (`/`, `/modul-1` … `/kontakt`) |
| Client-seitiges Hash-Routing (`showView()`) | Vorgerendertes, SEO-freundliches Multi-Page-Setup |
| Inline `onclick`-Handler überall | Zentraler, delegierter Router + Komponenten |
| Ein monolithisches `app.js` | Getypter TypeScript-UI-Layer (`src/scripts/ui.ts`) |
| Kein Build, kein Tooling | Astro + Vite Build, gebündelt & minifiziert, ~0 KB unnötiges JS |
| Kopierte Nav/Footer je View | Wiederverwendbare `Nav`/`Footer`-Komponenten + `BaseLayout` |

Zusätzliche Modernisierungen: Dark-/Light-Mode mit Persistenz (ohne Flash),
Scroll-Reveal-Animationen, Cross-Document View Transitions, Open-Graph-Metadaten,
kanonische URLs und ein base-path-fähiges Routing (funktioniert an der Domain-Wurzel
**und** in einem Unterpfad wie GitHub Pages).

## Projektstruktur

```
src/
  layouts/BaseLayout.astro   # <head>, SEO/OG, Fonts (display: optional), Theme-Init
  components/Nav.astro        # Navigation mit Active-State
  components/Footer.astro
  components/TeamCard.astro   # Team-Karte mit optimiertem Foto + Initialen-Fallback
  assets/team/                # Porträtfotos (jonas.png, emma.png) für astro:assets
  pages/                      # eine .astro-Datei pro Route
    index.astro  modul-1.astro … modul-4.astro  team.astro  kontakt.astro
  fragments/                  # migrierter Seiteninhalt (via ?raw eingebunden)
  scripts/ui.ts               # Theme, Mobile-Nav, Router, Scroll-Reveal, Formular
  styles/global.css           # Design-System + Modernisierungs-Layer
public/favicon.svg  public/og.png
astro.config.mjs
```

## Lokale Entwicklung

Voraussetzung: Node.js ≥ 18 (empfohlen 22).

```bash
npm install
npm run dev        # Dev-Server auf http://localhost:4321
npm run build      # Statischer Build nach ./dist
npm run preview    # Produktions-Build lokal ansehen
npm run check      # Astro-/TypeScript-Typprüfung
```

## Deployment — schnell & einfach

Der Build erzeugt reines statisches HTML/CSS/JS in `dist/` und läuft daher auf
praktisch jedem Host. Vier erprobte Wege, vom einfachsten aufwärts:

### 1. Netlify oder Vercel (Ein-Klick, empfohlen)
Repository verbinden — fertig. Beide erkennen Astro automatisch; die mitgelieferten
`netlify.toml` bzw. `vercel.json` setzen Build-Befehl (`npm run build`),
Output-Verzeichnis (`dist`) und Cache-Header bereits korrekt. Jeder Push deployt
automatisch, inklusive Deploy-Previews für Branches.

### 2. GitHub Pages (kostenlos, ohne externen Dienst)
Die Workflow-Datei `.github/workflows/deploy.yml` ist bereits vorhanden. Einmalig
in den Repo-Einstellungen unter **Settings → Pages → Build and deployment → Source**
auf **GitHub Actions** stellen. Danach baut & veröffentlicht jeder Push auf
`main`/`master` automatisch — der `base`-Pfad wird passend zum Repo-Namen gesetzt.

### 3. Docker (self-hosted, portabel)
Mehrstufiges Image: Astro-Build → schlankes nginx (gzip, Cache-Header,
Security-Header inklusive).

```bash
docker build -t ki-beratung .
docker run -p 8080:80 ki-beratung        # http://localhost:8080
```

### 4. Beliebiger Static-Host / CDN
`npm run build` und den Inhalt von `dist/` hochladen — z. B. Cloudflare Pages,
AWS S3 + CloudFront, Azure Static Web Apps, GitLab Pages oder ein eigener Webserver.

> **Root vs. Unterpfad:** An einer Domain-Wurzel ist keine Konfiguration nötig.
> Für einen Unterpfad beim Build `BASE_PATH` setzen, z. B.
> `BASE_PATH=/mein-unterpfad npm run build` (GitHub Pages erledigt das automatisch).

## Inhalte pflegen

Der Text jeder Seite liegt in `src/fragments/<route>.html` und wird von der
zugehörigen Seite in `src/pages/` eingebunden. Für strukturelle Änderungen die
`.astro`-Komponenten anpassen; Farben, Abstände und Typografie werden zentral über
die CSS-Variablen (Design-Tokens) am Anfang von `src/styles/global.css` gesteuert.
Der futuristische „Neural Enterprise"-Look (Glas-Oberflächen, Cyan-Glow, Mono-Labels,
Journey-Stepper) liegt in `src/styles/theme-v2.css` und wird nach `global.css` geladen.

### Team-Fotos

Die Porträts von Jonas und Emma liegen unter `src/assets/team/{jonas,emma}.png`
und werden zur Build-Zeit von `astro:assets` optimiert (AVIF + WebP, responsives
`srcset`, Lazy-Loading, feste Dimensionen → CLS = 0). Zum Austauschen einfach die
Dateien ersetzen (Porträt ~4:5, ideal ≥ 800×1000 px) und neu bauen. Fehlt eine
Datei, fällt die Team-Karte automatisch auf den Initialen-Platzhalter zurück,
und die Kontaktseite behält ihre Initialen-Avatare.

### ⚠️ Platzhalter-Kontaktdaten

Die E-Mail-Adressen (`*@beratung.de`) und die Ortsangabe („Nordrhein-Westfalen")
auf der Kontaktseite sind **Beispieldaten** und in `src/fragments/kontakt.html`
entsprechend kommentiert. Vor dem Go-Live durch echte Daten ersetzen (Suchbegriff:
`PLATZHALTER`).

### Kontaktformular aktivieren

Das Formular auf `/kontakt` funktioniert sofort: Ohne Backend öffnet es eine
vorbereitete E-Mail an die in `data-mailto` hinterlegte Adresse
(`src/fragments/kontakt.html`). Für serverseitigen Empfang einfach einen
Formular-Dienst eintragen — z. B. [Formspree](https://formspree.io) oder
[Web3Forms](https://web3forms.com) — indem am `<form>` das Attribut
`data-endpoint="https://…"` ergänzt wird. Dann werden die Felder per `fetch`
dorthin gesendet (Fallback auf die E-Mail-Variante bleibt erhalten).

## Performance & Barrierefreiheit

Zuletzt gemessen (Lighthouse 12, Mobile-Emulation, Production-Build):
alle Seiten **Performance 99–100, Accessibility 100, Best Practices 100,
SEO 100**, CLS = 0. Dazu tragen bei: self-hosted Fonts mit
`font-display: optional` + Preload (kein Font-Swap-CLS), code-gesplittetes
Motion-JS (GSAP lädt nur auf Hover-Geräten bzw. animierten Seiten), optimierte
Bilder und `prefers-reduced-motion`-Abschaltung aller Animationen.
