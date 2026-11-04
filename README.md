# TFT Arcade

Die digitale Kirmes für TFT-Fans: Minispiele, Quiz und Challenges rund um Teamfight Tactics.

## Lokal starten

- **Schnell anschauen: Doppelklick auf `index.html`** im Projektordner – öffnet die zuletzt gebaute Seite aus `dist/` direkt im Browser (ohne Server).
- **Beim Arbeiten: Doppelklick auf `Starten.cmd`** – oder im Terminal: `npm run dev`
- Seite: <http://localhost:4173>
- Jede Änderung in `src/` oder `public/` baut die Seite automatisch neu, danach einfach im Browser neu laden.
- `npm run check` baut die Seite und prüft alle SEO-Regeln und Links.
- Buden-Rahmen der Spielkarten (eine Farbe je Kategorie): Original `quellen/rahmen/buden-rahmen.png` → `powershell -File tools/rahmen-schneiden.ps1` (ausschneiden) → `node tools/rahmen-webp.js` (WebP, `public/assets/img/rahmen/`). Fenster, Namensleiste und Kreis sind in `arcade.css` (Spielkarten) in % des Rahmens hinterlegt.
- Avatare (Charaktere für die Bestenlisten): Original `quellen/avatare/charaktere.png` (2 × 5, freigestellt) → `powershell -File tools/avatare-schneiden.ps1` (ausschneiden, Schleier entfernen) → `node tools/rahmen-webp.js 256 256 avatare` (WebP, `public/assets/img/avatare/`). Namen in `src/config/avatare.js`, Hintergrundfarben `.av-<id>` in `arcade.css`.
- `npm run champions` übernimmt die Champions des Live-Sets aus den TFTClimb-Daten (`../TFT/data`) und lädt die Bilder einmalig von CommunityDragon (→ `public/assets/img/champions/`, `public/assets/js/spiele/daten/champions.js`), dazu Traits mit Stufen und Symbolen (`img/traits/`) sowie Komponenten und baubare Items mit Rezept (`img/items/`, `daten/items.js`). Je Champion kommen Rolle (aus `rollen-<Set>.js`), Reichweite und Name der Fähigkeit mit (für das Champion-Quiz), aus TFTClimbs `custom-<Set>.js` die Shop-Regeln: Odds pro Level, Kopien pro Champion, XP (→ `daten/shop.js`, für Roll Simulator, Shop-Odds-Quiz und die Odds-Tabelle). Nach jedem Set- oder Patch-Wechsel einmal ausführen, sobald TFTClimb aktualisiert ist.

## Sprache

Die Seite ist englisch: alle Texte in `src/config/`, `src/templates/` und den Spielskripten, Zahlenformat `en-US`. Champion-, Trait- und Item-Namen kommen englisch aus den TFTClimb-Daten (`n`, `en`, `tft-data-<Set>-en.js`). Code-Kommentare und diese README bleiben deutsch.

## Spiele

| Spiel | Adresse | Status |
|---|---|---|
| What Does It Cost? | `/quiz/tft-champion-cost-quiz` | **spielbar** – Skript `public/assets/js/spiele/was-kostet-der.js` |
| Shop Memory | `/challenges/tft-shop-memory` | **spielbar** – Skript `public/assets/js/spiele/shop-memory.js` |
| 3-Star Roll Simulator | `/simulators/tft-roll-simulator` | **spielbar** – Skript `public/assets/js/spiele/roll-simulator.js` (Time Trial, Training; Hex-Board und Bank) |
| Who Is This Champ? | `/quiz/tft-champion-quiz` | **spielbar** – Skript `public/assets/js/spiele/champion-quiz.js` (10 Rounds, Daily Puzzle) |
| Shop Odds Quiz | `/quiz/tft-shop-odds-quiz` | **spielbar** – Skript `public/assets/js/spiele/shop-odds-quiz.js`, darunter die Odds-Tabelle (`tabelle: 'shop-odds'` in `games.js`) |
| 3-Star Rush, Challenge Roulette | siehe unten | im Aufbau |

Es gibt keine Abhängigkeiten, nur Node.js (ab Version 20).

## Aufbau

| Ordner / Datei | Inhalt |
|---|---|
| `src/config/site.js` | Name, Domain, Navigation, Footer-Links, Kontaktadresse |
| `src/config/categories.js` | Die vier Bereiche (Simulators, Challenges, Quizzes, Party) inkl. SEO-Texte |
| `src/config/games.js` | Alle Attraktionen: Texte, Regeln, Status, Rekord-Art, Modi, SEO-Texte |
| `src/config/demo-bestenlisten.js` | Beispieldaten der Bestenlisten (als „Demo“ markiert) |
| `src/config/tageschallenges.js` | Vorrat der Tageschallenges (jeden Tag die nächste) |
| `src/templates/` | Darstellung: Layout, Bausteine (Buden, Spielkarten, Bestenliste …), Seiten, Symbole |
| `public/assets/` | CSS, JavaScript, Schriften, Bilder – wird 1:1 ausgeliefert |
| `build.js` | Baut nach `dist/`: eine fertige HTML-Datei pro Adresse, `sitemap.xml`, `robots.txt` |
| `tools/serve.js` | Lokaler Server (wie Vercel: Adressen ohne `.html`) |
| `tools/seo-check.js` | Prüft H1, Titel, Meta-Beschreibung, canonical und Links |
| `quellen/` | Originale: Hintergrundbild und Karten-Illustrationen (`quellen/karten/`) – werden nicht veröffentlicht; Web-Fassungen (800×450) liegen in `public/assets/img/karten/` |

## Adressen

- `/` – Spielhalle
- `/simulators`, `/challenges`, `/quiz`, `/party` – Bereiche
- `/challenges/tft-3-star-rush`, `/party/tft-challenge-roulette` – Spielseiten im Aufbau
- spielbar: `/simulators/tft-roll-simulator`, `/challenges/tft-shop-memory`, `/challenges/tft-comp-memory`, `/quiz/tft-champion-cost-quiz`, `/quiz/tft-champion-quiz`, `/quiz/tft-item-quiz`, `/quiz/tft-trait-quiz`, `/quiz/tft-shop-odds-quiz` – Item-, Trait- und Shop-Odds-Quiz nutzen den gemeinsamen Ablauf `public/assets/js/spiele/quiz.js` (`ArcadeQuiz({ … })`, Fragen mit vier Antworten)
- `/leaderboard` – Hall of Fame: ein Arcade-Automat pro Spiel mit Rangliste (noindex, bis ein Spiel mit Bestenliste live ist)
- `/about`, `/feedback`, `/legal-notice`, `/privacy` – englisch; `/impressum`, `/datenschutz` – deutsches Original der Rechtstexte (noindex, verlinkt von den englischen Seiten)

## Status einer Attraktion (`games.js` → `status`)

- `bald` – nur Karte „Demnächst“, keine eigene Seite
- `bau` – Seite steht mit „Das erwartet dich“, Spielfläche zeigt „Bude wird aufgebaut“; **noindex** und nicht in der Sitemap
- `live` – spielbar; mit `script: '/assets/js/spiele/<name>.js'` wird das Spielskript eingebunden, die Seite automatisch indexiert

## Schnittstelle für Spiele (`window.Arcade`, aus `assets/js/arcade.js`)

- `Arcade.finishRound({ value, title, lines, shareText, onReplay })` – speichert den Rekord, aktualisiert Bestenliste/Rekord-Box und zeigt die Auswertung mit „Nochmal spielen“ und „Ergebnis teilen“. Reicht das Ergebnis für die Top 10, erscheint „Neuer Highscore!“ mit Namenseintrag (wie am Automaten).
- Helfer: `Arcade.shuffle(liste)`, `Arcade.asset(pfad)` (Dateipfad online und per Doppelklick), `Arcade.esc(text)`, `Arcade.typing(event)` (Tastatur ignorieren, solange in ein Feld getippt wird), `Arcade.sound('ok' | 'bad' | 'flip' | 'tick' | 'click' | 'win' | 'lose')` (kurze Klänge, abschaltbar über den Ton-Knopf). Gemeinsame CSS-Bausteine: `.game-intro`, `.hud` mit `.hud-pill`, `.hud-hearts`, `.hud-bar`, `.game-dots`, `.game-msg`, Kostenfarben `.cost-1` … `.cost-5`. Zeitabläufe (Countdown-Ende, nächste Runde) immer per Timer steuern, Bildschirm-Frames nur für die Anzeige.
- Spielseite (gemeinsamer Rahmen in `pages.js` → `game()`): Kopf mit Etikett, H1, Ton und „So geht’s“-Dialog · Spielrahmen mit Modus-Leiste und „Neu starten“ (Ereignis `arcade:restart`) · Bestenliste (Top 5 mit Avatar) und eigenem Rekord · „So funktioniert’s“ (aus `schritte` im Spiel-Eintrag) und „Dein nächster Versuch“ · Hintergrund: Kirmes-Bild der Startseite. Modi mit `ranked: false` (z. B. Training) zählen nicht für Rekord und Bestenliste.
- `Arcade.entries` – Namenseinträge der Bestenlisten. **Vorerst nur im Browser** (Local Storage `tftarcade_eintraege`); für öffentliche Listen hier ein Backend anbinden (siehe Kommentar in `arcade.js`), Darstellung und Hall of Fame (`/bestenliste`) bleiben gleich.
- `Arcade.currentMode()` – gewählter Modus; Wechsel lösen das Ereignis `arcade:mode` aus
- `Arcade.history.add(spielId, text)` – Eintrag für „Zuletzt gezogen“ (z. B. Roulette)
- `Arcade.share(text)`, `Arcade.toast(text)`, `Arcade.store.get/set` (Local Storage mit Präfix `tftarcade_`)

## SEO-Regeln (wie bei TFTClimb)

Genau eine sichtbare H1 ≤ 54 Zeichen (nie versteckt), Titel ≤ 60, Meta-Beschreibung ≤ 134 mit Keyword, Spiel-Adressen mit `tft-`-Keyword. Der Build bricht bei Verstößen in der Konfiguration ab, `npm run check` prüft die fertigen Seiten.

## Veröffentlichen (Vercel)

Live: **https://www.tftarcade.com** · Code: https://github.com/CrazYSlayt/TFT-Arcade

Jeder Push auf `main` wird von Vercel automatisch gebaut und veröffentlicht (Build `node build.js`, Ausgabe `dist/`, Adressen ohne `.html`). Hauptadresse ist `www.tftarcade.com` (`src/config/site.js`); `tftarcade.com` und `tft-arcade.vercel.app` leiten per `vercel.json` dorthin weiter.

DNS bei All-Inkl (KAS): `A @ → 216.198.79.1` und `A @ → 64.29.17.1`, `CNAME www → 0499c69c23f0c572.vercel-dns-017.com.` Prüfen: `npx vercel domains verify www.tftarcade.com`.

## Vor dem Livegang offen

- Eigene Domain (optional, siehe oben)
- Weitere Spiele programmieren und auf `live` stellen
- Öffentliche Bestenlisten: Backend wählen (z. B. Vercel-Funktion + Datenbank), mit Namensfilter gegen Beleidigungen und Schutz gegen gefälschte Ergebnisse
