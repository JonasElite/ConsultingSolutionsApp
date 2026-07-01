# Konzept: Apple-Style Web-Experience für das KI-Beratungsportfolio

> Phase 1 – Analyse & Konzept. Dieses Dokument ist die Diskussionsgrundlage.
> **Es wird noch nichts implementiert, bis du Feedback gegeben hast.**

---

## 1. Ist-Analyse

### Tech & Struktur
- **Framework:** Astro 4.16 (statischer Output, MPA), TypeScript **strict**, Vite-Build.
- **Kein Runtime-Framework** (kein React/Vue) → aktuell **~0 KB unnötiges JS**, sehr guter Lighthouse-Ausgangswert.
- **Routing:** 7 vorgerenderte Seiten (`/`, `/modul-1…4`, `/team`, `/kontakt`), base-path-fähig.
- **Komponenten:** `BaseLayout.astro`, `Nav.astro`, `Footer.astro`. Seiteninhalt liegt als reines HTML in `src/fragments/*.html` und wird via `set:html` eingebunden.
- **JS:** ein sauberes TS-Modul `src/scripts/ui.ts` (306 Zeilen): Router, Theme-Toggle, Mobile-Nav, Scroll-Progress, Count-up, Card-Spotlight, Scroll-Reveal, Kontaktformular.
- **CSS:** `global.css` (2.516 Zeilen, Design-Tokens + Komponenten) + `theme-v2.css` (408 Zeilen, „Neural Enterprise"-Layer: Glas, Cyan-Glow, Mono-Labels).
- **Deploy:** Netlify / Vercel / Docker+nginx / GitHub Pages – alles vorkonfiguriert.

### Design (aktuell)
- **Farben:** KPMG-inspiriert – Primär-Blau `#00338d`, Hellblau `#0091da`, Magenta-Akzent, dazu Cyan-Glow (`#38e0ff`) und Violett aus dem v2-Layer. Hell- und Dunkelmodus vorhanden.
- **Typo:** Space Grotesk (Display) + JetBrains Mono (Labels/Zahlen), via Google Fonts.
- **Tokens:** solides System aus CSS-Custom-Properties (Type-Scale mit `clamp()`, Spacing, Radius, Shadows, Glows).
- **Vorhandene Animationen:** Scroll-Reveal, Count-up, Card-Spotlight, Scroll-Progress-Bar, Hero-Aurora/Grid, Journey-Stepper.

### Stärken
- Schnelle, moderne, wartbare Basis. Semantisches HTML, gute A11y-Grundlagen (Focus-States, `prefers-reduced-motion`-Ansätze, ARIA-Labels).
- Bereits ein durchdachtes Design-System – wir bauen darauf auf statt bei null zu starten.

### Schwachstellen / Baustellen
1. **Fonts extern (Google Fonts):** render-blocking + Datenschutz + der Ladeprozess war in Tests unzuverlässig. → **Self-Hosting von Variable Fonts** empfohlen.
2. **Kein „echtes" Smooth Scroll**, keine Scroll-Choreografie (kein Pinning/Sticky-Storytelling, kein Parallax). Reveals sind simpel (Opacity/Translate per IntersectionObserver).
3. **Zwei CSS-Dateien mit Redundanz** (`global.css` + `theme-v2.css`, teils Overrides). → Konsolidieren + ein **Motion-Token-Layer** ergänzen.
4. **Inhalt via `set:html`** ist pragmatisch, aber für feingranulare Animationen (z. B. wortweises Text-Reveal) müssen wir Text-Knoten gezielt ansteuern → besser echte Astro-Komponenten für die animierten Sections.
5. **Keine bewusste Motion-Sprache:** Durationen/Easings sind ad hoc verstreut, nicht als Tokens definiert.

---

## 2. Tech-Stack – Empfehlung (mit begründeter Abweichung)

Deine Vorschläge sind stark, aber teils **React-zentriert** (Framer Motion, shadcn/ui, R3F). Meine ehrliche Empfehlung:

### ✅ Bei Astro bleiben – **nicht** auf React/Next umstellen
**Begründung:**
- Die Seite wurde gerade sauber nach Astro migriert. Ein Wechsel zu React/Next wäre ein **mehrtägiges Rewrite mit Regressionsrisiko** – ohne echten Mehrwert für die Animationen.
- **Apple-/Linear-Niveau erreicht man mit GSAP + Lenis unabhängig vom Framework.** Framer Motion ist *nicht* Voraussetzung.
- React bringt eine **JS-Runtime** mit, die deine harte Regel **Lighthouse > 90** unnötig gefährdet. Astro liefert standardmäßig 0 KB JS und lädt Animationslogik nur dort, wo sie gebraucht wird (Islands / gezielte Scripts).

### Empfohlener Stack
| Zweck | Empfehlung | Warum |
|---|---|---|
| **Smooth Scroll** | **Lenis** | Framework-agnostisch, ~2 KB, bester Standard, GSAP-Integration |
| **Scroll-Choreografie** | **GSAP + ScrollTrigger** | Pinning, Sticky-Storytelling, Parallax, Scrubbing – seit 2024 komplett kostenlos |
| **Text-Reveal** | **GSAP SplitText** (jetzt free) *oder* schlanker Custom-Splitter | wort-/zeilenweises Enthüllen; A11y: Originaltext bleibt im DOM |
| **Einfache Reveals** | **CSS Scroll-driven Animations** (`animation-timeline: view()`) | GPU-günstig, kein JS, degradiert sauber; GSAP nur wo CSS nicht reicht |
| **Seitenübergänge** | **Astro View Transitions** (native) | weiche Route-Übergänge ohne SPA-Overhead |
| **Styling** | **CSS-Custom-Property-Tokens beibehalten** (kein Tailwind-Umbau) | bestehendes System ist gut; Tailwind-Migration von 2.500 Zeilen bringt hier wenig, kostet viel |
| **Icons** | Inline-SVG behalten, optional **Lucide** (via `astro-icon`) | bereits konsistent |
| **Fonts** | **Self-hosted Variable Fonts** (Space Grotesk Var. oder Wechsel zu Geist/Satoshi) | Performance, Datenschutz, kein render-blocking |
| **3D (optional)** | **kein Three.js-Standard**; stattdessen leichter Canvas-/Shader-Moment im Hero | für B2B-Mittelstand ist Voll-3D meist Overkill + Perf-Risiko |

**Wenn du bewusst auf React/Next willst** (z. B. weil später ein Dashboard/CMS kommt), sag Bescheid – dann plane ich den Umstieg sauber ein. Für „reine" Premium-Animationen brauchen wir ihn aber nicht.

---

## 3. Design-System-Vorschlag

Wir formalisieren das bestehende Token-System und ergänzen einen **Motion-Layer**.

### Farben (Vorschlag: aktuelle Richtung schärfen)
- **Neutrale Basis dunkel:** `#04060f → #0a1024` (Tiefe durch Layer statt Flächen).
- **Primär:** KPMG-Blau `#00338d` (Vertrauen/Brand) als Anker.
- **Signature-Akzent:** Cyan `#38e0ff` (Energie, „KI"), sparsam für Glow/Fokus.
- **Sekundär-Akzent:** Violett `#8b7bff` für Verläufe/Tiefe.
- **Light Mode:** kühl-weiß mit dezentem Farbnebel; Glas-Oberflächen.
- Kontraste durchgehend **WCAG AA** (Body ≥ 4.5:1, große Headlines ≥ 3:1).

### Typo-Scale (fluid, `clamp()`)
- Display: Space Grotesk Variable · Steps: 3.5 / 2.5 / 2.0 / 1.5 rem (fluid).
- Body: 1.0–1.125 rem, Zeilenhöhe 1.6, `text-wrap: balance/pretty`.
- Labels/Zahlen: JetBrains Mono, `letter-spacing` erhöht, uppercase.

### Spacing / Radius / Shadows
- Spacing-Skala 4→96 px (bestehend, 8-pt-Rhythmus).
- Radius: `md 8px`, `lg 12px`, `2xl 20px` (Glas-Cards).
- Shadows: mehrschichtig, weich; im Dark Mode zusätzlich **Glow-Ringe** statt harter Schatten.

### 🎬 Motion-Tokens (NEU – Kern des Ganzen)
```
--dur-fast: 200ms;      /* Micro-Feedback (Hover, Tap) */
--dur-base: 400ms;      /* Standard-Entries */
--dur-slow: 700ms;      /* große Reveals, Storytelling */
--ease-out:  cubic-bezier(0.16, 1, 0.3, 1);   /* Entries */
--ease-inout: cubic-bezier(0.65, 0, 0.35, 1); /* Continuous */
--stagger: 60ms;        /* Abstand bei Listen */
```
**Prinzip:** Jede Animation bekommt eine *Rolle* → Hierarchie, Feedback, Storytelling oder Kontinuität. Kein Effekt ohne Zweck.

---

## 4. Animation pro Section (mit Begründung)

| Section | Vorschlag | Zweck | CLS-sicher? |
|---|---|---|---|
| **Global** | Lenis Smooth Scroll + Astro View Transitions zwischen Seiten | Kontinuität, Premium-Gefühl | ja (nur transform) |
| **Hero** | Gestaffeltes Reveal (Badge→Headline→Sub→CTAs→Stats) via `ease-out`; **wortweises SplitText** auf der Headline; langsam driftender Gradient (GPU, `transform`) statt statischer Orbs | Hierarchie + Storytelling-Einstieg | ja |
| **Journey-Stepper** | Beim Reinscrollen „zeichnet" sich die Verbindungslinie (SVG `stroke-dashoffset`), Dots poppen gestaffelt ein | Storytelling: der Pfad *entsteht* | ja |
| **Modul-Grid** | Stagger-Reveal der Cards (bereits da, verfeinern); Hover: Scale 1.02 + Glow + Spotlight (vorhanden) | Feedback + Hierarchie | ja |
| **Bundle-Banner** | Parallax-Layer (Hintergrund-Gradient langsamer als Inhalt) | Tiefe, Aufmerksamkeit auf Angebot | ja |
| **Ansatz / „Why"** | Zeilenweises Text-Reveal; das SVG-Netzwerk animiert Knoten/Kanten beim Sichtbarwerden | Storytelling: „vernetztes Denken" | ja |
| **Stats** | Count-up bei Sichtbarkeit (vorhanden, in Motion-System integrieren) | Feedback, Glaubwürdigkeit | ja |
| **CTA** | **Magnetic Button** (Cursor-Anziehung, dezent) + Gradient-Motion | Feedback, Conversion-Fokus | ja |
| **Modul-Detailseiten** | **Sticky-Storytelling**: „Was wir liefern" pinnt, Deliverables wechseln beim Scrollen (Apple-Prinzip); Vorgehens-Schritte als scrubbing-Timeline | Storytelling: Prozess wird erlebbar | ja (Pin ohne Reflow) |
| **Team** | Cards mit sanftem 3D-Tilt on hover (subtil), gestaffeltes Reveal | Feedback, Persönlichkeit | ja |
| **Kontakt** | Felder faden gestaffelt ein; Erfolg als weiche Skeleton→Content-Transition | Feedback | ja |

**Mobile:** Pinning/Parallax/SplitText werden auf kleinen Viewports **reduziert oder deaktiviert** (nur einfache Fades), Lenis ggf. aus (native Momentum-Scrolling ist auf iOS oft besser).

---

## 5. Eigene kreative Ideen (optional, zur Auswahl)

1. **„Neural Signature" im Hero:** ein dezent per Canvas animiertes Knoten-Netz (passt thematisch zu „KI"), das auf Cursor/Scroll reagiert – statt generischer Blobs. GPU-schonend, mit `prefers-reduced-motion`-Fallback auf statisches Bild.
2. **Scroll-getriebener Farbverlauf des Seiten-Backgrounds:** wandert subtil von Navy (Analyse) zu Cyan (Verstetigung) entlang der Journey – unterstützt die Story „von der Idee zur Praxis".
3. **Custom Cursor (dezent):** nur über interaktiven Elementen ein feiner Ring, der sich bei Buttons vergrößert. Desktop-only, respektiert `hover: none`.
4. **Zahlen-Ticker in den Modul-Eckdaten** (Investition/Laufzeit) mit Count-up beim Pinnen.
5. **„Loading Reveal":** beim ersten Laden ein 400 ms Curtain-Fade (kein Spinner), das direkt in das Hero-Reveal übergeht.

---

## 6. Einhaltung der harten Regeln (verbindlich)

- ✅ `prefers-reduced-motion`: globaler Kill-Switch, der alle GSAP-Timelines/Lenis deaktiviert und auf sofortige Sichtbarkeit schaltet.
- ✅ **CLS = 0:** ausschließlich `transform`/`opacity`; Platz für animierte Elemente wird immer reserviert (kein Nachrücken).
- ✅ Durationen 200–800 ms; Easing per Token (`ease-out` Entries, `ease-in-out` Continuous, **nie linear**).
- ✅ Mobile-Reduktion (s. o.).
- ✅ Lighthouse > 90: Lenis/GSAP sind klein; Laden nur wo nötig; Fonts self-hosted; keine `console.log` in Prod; Bilder als WebP/AVIF + lazy.
- ✅ Sichtbare Focus-States, semantisches HTML, TypeScript strict.

---

## 7. Vorgeschlagene Umsetzungs-Reihenfolge (Phase 2 → 4)

- **Phase 2:** Fonts self-hosten, Motion-Tokens + globale Easings, Lenis + GSAP-Basis inkl. `reduced-motion`-Switch, View Transitions. → **Demo-Route** `/demo` zum Prüfen des Feelings.
- **Phase 3:** Section für Section (Hero → Journey → Module → Ansatz → CTA → Modulseiten → Team → Kontakt), nach jeder Section Zusammenfassung + Perf-Check + dein Feedback.
- **Phase 4:** A11y-Audit, Lighthouse, Mobile-Feinschliff, Cross-Browser, SEO.

---

## 8. Getroffene Entscheidungen (Feedback-Runde 1)

1. **Tech-Richtung:** ✅ **Bei Astro bleiben.** Lenis + GSAP/ScrollTrigger + native View Transitions.
2. **Umfang:** ✅ **Startseite zuerst als Showcase.** Rest der Seiten danach separat.
3. **Brand/CI:** ✅ **Aktuelle Richtung beibehalten** (Blau/Cyan + Space Grotesk), nur verfeinern. Kein verbindliches Logo/CI.
4. **Ambition:** ✅ **Ausgewogen** – elegante, ruhige Basis mit **1–2 Signature-Momenten**.

### Konkrete Signature-Momente (Vorschlag)
- **Hero:** wortweises SplitText-Reveal + dezent animierter „Neural Signature"-Hintergrund (Canvas, GPU-schonend, `reduced-motion`-Fallback).
- **Journey-Stepper:** die Verbindungslinie „zeichnet" sich beim Reinscrollen (SVG `stroke-dashoffset`), Dots poppen gestaffelt ein.

Alles andere bleibt bewusst **zurückhaltend** (feine Stagger-Reveals, Hover-Micro-Interactions, Magnetic-CTA, Count-up).

---

## 9. Phase-2-Plan (Foundation) – wird nach deinem OK umgesetzt

Ziel: das **Fundament + eine Demo-Route** zum Prüfen des Feelings – noch kein Umbau der echten Sections.

1. **Fonts self-hosten:** Space Grotesk + JetBrains Mono als Variable Fonts lokal einbinden (`font-display: swap`, Preload), Google-Fonts-Links entfernen → schneller, DSGVO-freundlich, kein render-blocking.
2. **Motion-Tokens:** `--dur-*`, `--ease-*`, `--stagger` als CSS-Variablen + ein globaler `prefers-reduced-motion`-Kill-Switch.
3. **Animations-Basis:** `lenis` + `gsap`/`ScrollTrigger` installieren; ein sauberes TS-Modul (`src/scripts/motion.ts`) mit Lenis-Init, GSAP-Anbindung, `reduced-motion`- und Mobile-Guard. Kein `console.log`, strict TS.
4. **Seitenübergänge:** Astro View Transitions (`ClientRouter`) im `BaseLayout`.
5. **Demo-Route `/demo`:** zeigt Text-Reveal, Stagger, Parallax, Magnetic-Button, Count-up und einen Scroll-Pin-Prototyp – als Referenz für „Feeling", Performance (CLS 0, GPU) und `reduced-motion`.

**Danach: Stop + dein OK**, bevor Phase 3 (echte Sections der Startseite) startet.
