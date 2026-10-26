// TFT Arcade – Seiten: Startseite, Kategorie, Spielseite, Info- und Rechtsseiten, 404
const site = require('../config/site');
const { esc } = require('./helpers');
const { art, ui } = require('./icons');
const { gameCard, booth, crumbs, daily, aside, badge, boardAttrs, boardJson, boardRows } = require('./components');

const HOME = { label: 'Spielhalle', href: '/' };

// ───────── Startseite ─────────
function home(ctx) {
  const booths = site.nav.map(id => booth(ctx.categories.find(c => c.id === id), ctx)).join('');
  // Alle Spiele stehen im Raster; „Alle Spiele“ zeigt die hervorgehobenen, die Filter-Pillen (arcade.js) einen Bereich
  // „Alle Spiele“ = höchstens vier hervorgehobene (spielbare zuerst), damit alles auf einen Bildschirm passt
  const order = { live: 0, bau: 1, bald: 2 };
  const byStatus = (a, b) => order[a.status] - order[b.status];
  const top = ctx.games.filter(g => g.featured).sort(byStatus).slice(0, 4);
  const all = [...top, ...ctx.games.filter(g => !top.includes(g)).sort(byStatus)];
  const cards = all.map(g => gameCard(g, ctx, { attrs: top.includes(g) ? ' data-featured' : ' hidden' })).join('');
  const pills = [`<button class="pill" type="button" data-filter="alle" aria-pressed="true">Alle Spiele</button>`,
    ...site.nav.map(id => { const c = ctx.categories.find(x => x.id === id); return `<button class="pill" type="button" data-filter="${c.id}" aria-pressed="false">${esc(c.name)}</button>`; })].join('');
  const star = `<svg class="deco-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"/></svg>`;
  // home-stage: Hero, Spielkarten und Tageschallenge passen zusammen auf einen Bildschirm (1920×1080 ohne Scrollen)
  const body = `
<div class="home-stage">
<section class="hero">
  <div class="wrap wrap-wide hero-in">
    <h1 class="hero-title">
      <span class="ribbon">${star}<span>TFT Arcade · Dein Highroll wartet</span>${star}</span>
      <span class="hero-main"><span class="hero-line">Nur noch</span> <span class="hero-line">${star}eine <span class="swoosh">Runde.</span></span></span>
    </h1>
    <p class="hero-sub">Roll, rätsel und stell dein Glück auf die Probe.</p>
    <a class="btn btn-gold btn-xl" href="#attraktionen">Spielhalle entdecken${ui('arrow')}</a>
  </div>
</section>

<section class="games-section" id="attraktionen" aria-labelledby="att-h">
  <div class="wrap wrap-wide">
    <h2 class="deco-title" id="att-h">${star}<span>Woran willst du dich versuchen?</span>${star}</h2>
    <div class="pills" role="group" aria-label="Spiele nach Bereich filtern">${pills}</div>
    <div class="cards cards-4" data-filter-grid>${cards}</div>
    <p class="filter-more" data-filter-more hidden><a class="text-link" href="/">Ganzen Bereich ansehen${ui('arrow')}</a></p>
  </div>
</section>

<div class="wrap wrap-wide">${daily(ctx, { compact: true })}</div>
</div>

<section class="section" aria-labelledby="booth-h">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">${ui('star')}Vier Buden, eine Spielhalle</p><h2 id="booth-h">Alle Bereiche der Arcade</h2></div>
    <div class="booths">${booths}</div>
  </div>
</section>

<section class="section section-steps" aria-labelledby="how-h">
  <div class="wrap">
    <div class="section-head"><p class="eyebrow">${ui('star')}So läuft’s</p><h2 id="how-h">Rein, spielen, Rekord jagen</h2></div>
    <ol class="steps">
      <li><span class="step-n">1</span><h3>Bude wählen</h3><p>Simulator, Challenge, Quiz oder Party – jede Runde dauert nur wenige Minuten.</p></li>
      <li><span class="step-n">2</span><h3>Spielen ohne Anmeldung</h3><p>Kein Konto, kein Download. Deine Rekorde bleiben in deinem Browser gespeichert.</p></li>
      <li><span class="step-n">3</span><h3>Ergebnis teilen</h3><p>Ein Klick kopiert dein Ergebnis samt Link – fordere deine Freunde heraus.</p></li>
    </ol>
  </div>
</section>`;
  return {
    path: '/',
    scene: 'home',
    bodyClass: 'is-home',
    seo: {
      title: 'TFT Arcade – Minispiele, Quiz & Challenges zu TFT',
      desc: 'TFT Arcade: Minispiele, Quiz und Challenges rund um Teamfight Tactics. Roll Simulator, Champion-Quiz & mehr – ohne Anmeldung.',
      h1: 'TFT Arcade · Dein Highroll wartet Nur noch eine Runde.',
      kw: 'TFT Arcade',
    },
    ld: [{ '@type': 'WebSite', name: site.name, url: site.url + '/', inLanguage: site.lang }],
    body,
  };
}

// ───────── Kategorie ─────────
function category(c, ctx) {
  const games = ctx.games.filter(g => g.category === c.id);
  const order = { live: 0, bau: 1, bald: 2 };
  games.sort((a, b) => order[a.status] - order[b.status]);
  const open = games.filter(g => g.status !== 'bald').length, soon = games.length - open;
  const others = site.nav.filter(id => id !== c.id).map(id => booth(ctx.categories.find(x => x.id === id), ctx)).join('');
  const crumbList = [HOME, { label: c.name, href: '/' + c.slug }];
  const body = `
<div class="wrap page-top">
  ${crumbs(crumbList)}
  <header class="page-head c-${c.color}">
    <div class="page-head-art">${art(c.icon)}</div>
    <div class="page-head-text">
      <p class="eyebrow">${ui('star')}Bereich der Spielhalle</p>
      <h1>${esc(c.seo.h1)}</h1>
      <p class="lead">${esc(c.intro)}</p>
      <p class="head-count">${open} ${open === 1 ? 'Attraktion' : 'Attraktionen'}${soon ? ` · ${soon} demnächst` : ''}</p>
    </div>
  </header>

  <section class="section-tight" aria-labelledby="list-h">
    <h2 class="section-title" id="list-h">Alle ${esc(c.name)}</h2>
    <div class="cards">${games.map(g => gameCard(g, ctx, { full: true })).join('')}</div>
  </section>

  ${c.id === 'challenges' ? daily(ctx) : ''}

  <section class="section-tight" aria-labelledby="more-h">
    <h2 class="section-title" id="more-h">Weitere Bereiche</h2>
    <div class="booths booths-3">${others}</div>
  </section>
</div>`;
  return { path: '/' + c.slug, section: c.id, crumbs: crumbList, seo: c.seo, ld: [{ '@type': 'CollectionPage', name: c.seo.h1, url: site.url + '/' + c.slug }], body };
}

// ───────── Spielseite ─────────
function stage(g, c) {
  if (g.status === 'live') {
    return `<div class="stage stage-live" id="spielflaeche" data-game="${g.id}"><noscript><p class="stage-msg">Für dieses Spiel brauchst du JavaScript.</p></noscript></div>`;
  }
  return `<div class="stage stage-build" id="spielflaeche" data-game="${g.id}">
  <div class="build-sign">${ui('wrench')}Diese Bude wird gerade aufgebaut</div>
  <div class="build-art c-${c.color}">${art(g.art)}</div>
  <h2 class="build-title">Das erwartet dich</h2>
  <ul class="plan">${g.plan.map(p => `<li>${ui('check')}${esc(p)}</li>`).join('')}</ul>
  <p class="build-note">Bald spielbar – schau wieder vorbei oder probier solange eine andere Attraktion.</p>
</div>`;
}

// Namenseintrag wie am Arcade-Automaten: erscheint, wenn das Ergebnis für die Top 10 reicht (arcade.js)
const highscoreEntry = () => `<form class="hs-entry" data-hs-form hidden>
    <p class="hs-title">Neuer Highscore!</p>
    <p class="hs-rank">Platz <b data-hs-rank>1</b> in der Bestenliste</p>
    <label class="hs-label" for="hs-name">Trag deinen Namen ein</label>
    <div class="hs-row">
      <input class="hs-input" id="hs-name" name="name" maxlength="12" autocomplete="nickname" spellcheck="false" required>
      <button class="btn btn-gold" type="submit">Eintragen</button>
    </div>
    <p class="hs-hint">2–12 Zeichen: Buchstaben, Zahlen, Leerzeichen, _ . und -</p>
  </form>
  <p class="hs-done" data-hs-done hidden>${ui('check')}<span>Eingetragen auf Platz <b data-hs-place>1</b>!</span> <a class="text-link" href="/bestenliste" data-hs-link>Zur Bestenliste${ui('arrow')}</a></p>`;

// Auswertung nach einer Runde – das Spielskript füllt und zeigt sie über Arcade.finishRound()
const result = g => `<div class="result" id="auswertung" tabindex="-1" hidden>
  <p class="result-kicker">${ui('star')}Runde vorbei</p>
  <h2 class="result-title" data-result-title>Geschafft!</h2>
  <p class="result-value" data-result-value></p>
  <p class="result-record" data-result-record hidden>${ui('trophy')}Neuer persönlicher Rekord!</p>
  <ul class="result-lines" data-result-lines></ul>
  ${g.aside === 'bestenliste' ? highscoreEntry() : ''}
  <div class="result-actions">
    <button class="btn btn-gold" type="button" data-result-replay>${ui('replay')}Nochmal spielen</button>
    <button class="btn btn-ghost" type="button" data-result-share>${ui('share')}Ergebnis teilen</button>
  </div>
</div>`;

function modePicker(g) {
  if (g.modes.length < 2) return '';
  return `<fieldset class="modes" data-modes="${g.id}">
    <legend>Modus</legend>
    ${g.modes.map((m, i) => `<label class="mode"><input type="radio" name="modus" value="${m.id}"${i ? '' : ' checked'}><span>${esc(m.label)}</span></label>`).join('')}
  </fieldset>`;
}

function related(g, ctx) {
  const pick = [
    ...ctx.games.filter(x => x.id !== g.id && x.category === g.category && x.status !== 'bald'),
    ...ctx.games.filter(x => x.id !== g.id && x.category !== g.category && x.featured),
    ...ctx.games.filter(x => x.id !== g.id && x.category === g.category && x.status === 'bald'),
  ].filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
  return pick.map(x => gameCard(x, ctx)).join('');
}

function game(g, ctx) {
  const c = ctx.catOf(g), url = ctx.gameUrl(g);
  const crumbList = [HOME, { label: c.name, href: '/' + c.slug }, { label: g.title, href: url }];
  const r = g.rules;
  // Gemeinsamer Rahmen aller Spielseiten:
  // Kopf (Kategorie, Name, ein Satz zum Ziel) · Kurzanleitung über der Spielfläche, Details aufklappbar ·
  // Spielrahmen in der Akzentfarbe der Kategorie · Bestenliste rechts · Ergebniskarte an Stelle der Spielfläche ·
  // unten: zurück zur Sammlung, Feedback, weitere Attraktionen
  const body = `
<div class="wrap page-top">
  ${crumbs(crumbList)}
  <header class="game-head c-${c.color}">
    <div class="page-head-art">${art(g.art)}</div>
    <div class="page-head-text">
      <div class="game-meta"><a class="cat-link" href="/${c.slug}">${art(c.icon)}${esc(c.name)}</a>${g.status !== 'live' ? badge(g.status) : ''}<span class="chip">${ui('clock')}${esc(g.duration)}</span>${g.demo ? '<span class="chip chip-demo">Vereinfachte Demo</span>' : ''}</div>
      <h1>${esc(g.seo.h1)}</h1>
      <p class="lead">${esc(g.lead)}</p>
    </div>
  </header>

  <div class="play c-${c.color}" data-game-page="${g.id}" data-game-title="${esc(g.title)}">
    <section class="play-main" aria-label="Spielfläche">
      <details class="howto">
        <summary class="howto-short">${ui('info')}<span><b>So geht’s:</b> ${esc(g.kurz || r.ziel)}</span><span class="howto-more">Regeln &amp; Details</span></summary>
        <div class="howto-body">
          <div class="howto-grid">
            <div class="howto-item"><h3>${ui('star')}Ziel</h3><p>${esc(r.ziel)}</p></div>
            <div class="howto-item"><h3>${ui('info')}Regeln</h3><ul>${r.regeln.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
            <div class="howto-item"><h3>${ui('check')}Bedienung</h3><ul>${r.bedienung.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
          </div>
          ${g.hinweise ? `<p class="howto-note">${esc(g.hinweise)}</p>` : ''}
        </div>
      </details>
      ${modePicker(g)}
      ${stage(g, c)}
      ${result(g)}
    </section>
    <aside class="play-side">${aside(g, ctx)}</aside>
  </div>

  <nav class="game-foot" aria-label="Weiter in der Spielhalle">
    <a class="btn btn-ghost" href="/${c.slug}">${ui('arrow', 'ui ui-back')}Zurück zu ${esc(c.name)}</a>
    <p class="game-feedback">${ui('info')}<span>Fehler entdeckt oder eine Idee für das Spiel? <a href="/feedback">Gib uns Feedback</a></span></p>
  </nav>

  <section class="section-tight" aria-labelledby="rel-h">
    <h2 class="section-title" id="rel-h">Weitere Attraktionen</h2>
    <div class="cards">${related(g, ctx)}</div>
  </section>
</div>`;
  return {
    path: url,
    section: c.id,
    crumbs: crumbList,
    seo: g.seo,
    // Solange die Bude im Aufbau ist, soll Google die Platzhalter-Seite nicht aufnehmen – mit status 'live' automatisch indexiert
    noindex: g.status !== 'live',
    scripts: g.status === 'live' ? g.scripts : [],
    body,
  };
}

// ───────── Bestenliste (Hall of Fame): ein Arcade-Automat pro Spiel mit Rangliste ─────────
function bestenliste(ctx) {
  const ranked = ctx.games.filter(g => g.status !== 'bald' && g.aside === 'bestenliste');
  const cabinets = ranked.map(g => {
    const c = ctx.catOf(g), color = g.color || c.color;
    const tabs = g.modes.length > 1
      ? `<div class="cab-tabs" role="group" aria-label="Modus">${g.modes.map((m, i) => `<button class="cab-tab" type="button" data-board-tab="${m.id}" aria-pressed="${i ? 'false' : 'true'}">${esc(m.label)}</button>`).join('')}</div>`
      : `<p class="cab-mode">${esc(g.modes[0].label)}</p>`;
    return `<section class="cabinet c-${color}" id="${g.id}" aria-labelledby="hof-${g.id}" ${boardAttrs(g)}>
  <div class="cab-marquee">
    <span class="cab-art">${art(g.art)}</span>
    <div><p class="cab-cat">${esc(c.name)}</p><h2 id="hof-${g.id}">${esc(g.title)}</h2></div>
    <span class="badge badge-demo">Demo</span>
  </div>
  <div class="cab-screen">
    ${tabs}
    <table class="hs-table">
      <thead><tr><th scope="col">Rang</th><th scope="col">Name</th><th scope="col">${g.record.type === 'zeit' ? 'Zeit' : 'Punkte'}</th></tr></thead>
      ${g.modes.map((m, i) => `<tbody data-board="${m.id}"${i ? ' hidden' : ''}>${boardRows(g, ctx, m.id, 'tr')}</tbody>`).join('')}
    </table>
    ${boardJson(g, ctx)}
  </div>
  <div class="cab-foot">
    <span class="cab-record">${ui('trophy')}Dein Rekord: <b data-hof-record="${g.id}" data-type="${g.record.type}" data-lower="${g.record.lowerIsBetter ? 1 : 0}">–</b></span>
    <a class="btn btn-sm btn-gold" href="${ctx.gameUrl(g)}">${g.status === 'live' ? 'Spielen' : 'Ansehen'}${ui('arrow')}</a>
  </div>
</section>`;
  }).join('');
  const crumbList = [HOME, { label: 'Bestenliste', href: '/bestenliste' }];
  const body = `
<div class="wrap page-top">
  ${crumbs(crumbList)}
  <header class="page-head c-gold">
    <div class="page-head-art">${art('trophy')}</div>
    <div class="page-head-text">
      <p class="eyebrow">${ui('star')}Hall of Fame</p>
      <h1>TFT Arcade Bestenliste</h1>
      <p class="lead">Wie früher an den Automaten: Spiel eine Runde, knack die Top 10 und verewige deinen Namen. Hier stehen die besten Läufe aller Spiele.</p>
    </div>
  </header>
  <p class="notice">${ui('info')}Vorschau: Die Listen zeigen Beispieldaten. Deine eigenen Einträge werden vorerst nur in deinem Browser gespeichert – öffentliche Bestenlisten folgen.</p>
  <div class="hof-grid">${cabinets}</div>
</div>`;
  return {
    path: '/bestenliste',
    section: 'bestenliste',
    crumbs: crumbList,
    // erst in die Suche, wenn mindestens ein Spiel mit Bestenliste spielbar ist
    noindex: !ranked.some(g => g.status === 'live'),
    seo: {
      title: 'TFT Arcade Bestenliste – Highscores aller Spiele',
      desc: 'Die TFT Arcade Bestenliste: Bestzeiten und Highscores aus 3-Star Rush, Champion-Quiz und mehr. Trag dich nach deiner Runde ein!',
      h1: 'TFT Arcade Bestenliste', kw: 'Bestenliste',
    },
    body,
  };
}

// ───────── Info- und Rechtsseiten ─────────
const TODO = t => `<mark class="todo">[${esc(t)}]</mark>`;
const mail = () => site.email ? `<a href="mailto:${esc(site.email)}">${esc(site.email)}</a>` : TODO('E-Mail-Adresse eintragen');
const owner = () => [site.owner.name, site.owner.street, site.owner.city, site.owner.country].map(esc).join('<br>');

function prose(path, seo, crumbLabel, content, { noindex = false } = {}) {
  const crumbList = [HOME, { label: crumbLabel, href: path }];
  return {
    path, seo, noindex, crumbs: crumbList,
    body: `<div class="wrap page-top">${crumbs(crumbList)}<article class="panel prose"><h1>${esc(seo.h1)}</h1>${content}</article></div>`,
  };
}

function infoPages() {
  return [
    prose('/ueber-tft-arcade', {
      title: 'Über TFT Arcade – die Spielhalle für TFT-Fans',
      desc: 'Über TFT Arcade: Was hinter der Spielhalle für Teamfight-Tactics-Fans steckt, wer sie baut und was als Nächstes kommt.',
      h1: 'Über TFT Arcade', kw: 'TFT Arcade',
    }, 'Über TFT Arcade', `
      <p class="lead">TFT Arcade ist eine digitale Kirmes für alle, die Teamfight Tactics lieben: kleine Simulatoren, Challenges, Quizze und Party-Spiele, die du sofort im Browser spielen kannst.</p>
      <h2>Die Idee</h2>
      <p>Zwischen zwei Matches noch schnell den Rolldown üben, Freunde mit einem Quiz herausfordern oder dem nächsten Spiel mit einer verrückten Vorgabe Würze geben – dafür ist die Spielhalle da. Ohne Anmeldung, ohne Download, nur noch eine Runde.</p>
      <h2>Wer steckt dahinter?</h2>
      <p>TFT Arcade wird von CrazYSlayt gebaut – TFT-Spieler, Coach und Gründer von <a href="https://www.tftclimb.com" target="_blank" rel="noopener">TFTClimb</a>, der Seite für Tierlists, Comps und Coaching. Die Arcade ist die verspielte Schwester: weniger Theorie, mehr „nur noch eine Runde“.</p>
      <h2>Was kommt als Nächstes?</h2>
      <p>Die ersten Spiele sind spielbar, weitere Buden werden gerade aufgebaut – vom Roll Simulator über den 3-Star Rush bis zum Challenge-Roulette. Danach folgen Attraktionen wie die 100-Gold-Challenge, das Item-Quiz und TFT-Bingo. Ideen? <a href="/feedback">Schreib uns dein Feedback</a>.</p>
      <h2>Kein offizielles Riot-Produkt</h2>
      <p>TFT Arcade ist ein Fan-Projekt und steht in keiner Verbindung zu Riot Games. Alle Simulationen sind vereinfacht und bilden die aktuellen Spielregeln nicht exakt ab.</p>`),
    prose('/feedback', {
      title: 'Feedback zu TFT Arcade – Ideen & Fehler melden',
      desc: 'Feedback zu TFT Arcade: Melde Fehler, wünsch dir neue Minispiele oder schick uns deine Ideen für die TFT-Spielhalle.',
      h1: 'Feedback zu TFT Arcade', kw: 'Feedback',
    }, 'Feedback', `
      <p class="lead">Die Spielhalle wächst mit euren Ideen. Erzähl uns, was dir gefällt, was hakt und welche Attraktion du dir als Nächstes wünschst.</p>
      <h2>Was uns hilft</h2>
      <ul>
        <li><b>Fehler:</b> Auf welcher Seite, mit welchem Gerät und Browser – und was ist passiert?</li>
        <li><b>Ideen:</b> Neue Minispiele, Quizfragen oder lustige Vorgaben fürs Challenge-Roulette.</li>
        <li><b>Balance:</b> Ist eine Challenge zu leicht oder zu schwer? Sag Bescheid.</li>
      </ul>
      <h2>So erreichst du uns</h2>
      <p>Per E-Mail: ${mail()} – am besten mit „TFT Arcade“ im Betreff.</p>`),
    prose('/impressum', {
      title: 'Impressum | TFT Arcade',
      desc: 'Impressum von TFT Arcade, der Fan-Spielhalle für Teamfight Tactics: Anbieter, Kontakt und Verantwortliche.',
      h1: 'Impressum', kw: 'Impressum',
    }, 'Impressum', `
      <h2>Angaben gemäß § 5 DDG</h2>
      <p>${owner()}</p>
      <h2>Kontakt</h2>
      <p>E-Mail: ${mail()}</p>
      <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
      <p>${esc(site.owner.name)}, Anschrift wie oben</p>
      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      <h2>Haftung für Inhalte und Links</h2>
      <p>Die Spiele und Inhalte dieser Seite werden mit Sorgfalt erstellt. Simulationen und Wahrscheinlichkeiten sind vereinfacht und bilden die aktuellen Spielregeln nicht exakt ab. Für die Inhalte verlinkter externer Seiten sind ausschließlich deren Betreiber verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen wir entsprechende Links umgehend.</p>
      <h2>Riot Games</h2>
      <p lang="en">TFT Arcade isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
      <p>TFT Arcade ist ein Fan-Projekt und steht in keiner Verbindung zu Riot Games. Teamfight Tactics, Spielgrafiken und Spieldaten sind Eigentum von Riot Games, Inc.</p>`),
    prose('/datenschutz', {
      title: 'Datenschutzerklärung | TFT Arcade',
      desc: 'Datenschutz bei TFT Arcade: Welche Daten beim Besuch anfallen, was nur in deinem Browser gespeichert wird und deine Rechte.',
      h1: 'Datenschutzerklärung', kw: 'Datenschutz',
    }, 'Datenschutz', `
      <p class="lead">Kurz gesagt: TFT Arcade setzt keine Cookies, nutzt keine Analyse- oder Werbedienste und lädt nichts von fremden Servern. Rekorde und Einstellungen bleiben in deinem Browser.</p>
      <h2>1. Verantwortlicher</h2>
      <p>${owner()}<br>E-Mail: ${mail()}</p>
      <h2>2. Hosting und Server-Logfiles</h2>
      <p>Diese Website wird bei Vercel Inc. (USA) gehostet. Beim Aufruf jeder Seite verarbeitet der Server automatisch technisch notwendige Daten: IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, übertragene Datenmenge, Browser und Betriebssystem sowie die zuvor besuchte Seite. Das ist nötig, um die Seite auszuliefern und sicher zu betreiben (Art. 6 Abs. 1 lit. f DSGVO). Für Übermittlungen in die USA stützt sich Vercel auf geeignete Garantien nach Art. 44 ff. DSGVO (EU-US Data Privacy Framework bzw. EU-Standardvertragsklauseln). Mehr dazu in der <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">Datenschutzerklärung von Vercel</a>.</p>
      <h2>3. Keine Cookies, kein Tracking</h2>
      <p>TFT Arcade setzt keine Cookies und nutzt keine Analyse-, Tracking- oder Werbedienste.</p>
      <h2>4. Schriften und Bilder</h2>
      <p>Schriften und alle Bilder – auch die Champion-Bilder aus den Spieldaten von Riot Games – liegen auf unserem eigenen Server. Es wird keine Verbindung zu Google Fonts, Riot Games oder anderen Drittanbietern hergestellt.</p>
      <h2>5. Speicherung in deinem Browser</h2>
      <p>Persönliche Rekorde, deine Einträge in den Bestenlisten samt gewähltem Namen, deine zuletzt gezogenen Vorgaben und Einstellungen speichern wir ausschließlich lokal in deinem Browser (Local Storage). Diese Daten bleiben auf deinem Gerät und werden nicht an uns übertragen. Die Speicherung ist für die von dir genutzte Funktion erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Du kannst sie jederzeit über die Einstellungen deines Browsers löschen.</p>
      <h2>6. Ergebnis teilen</h2>
      <p>Über „Ergebnis teilen“ wird ein kurzer Text mit Link in deine Zwischenablage kopiert. Dabei werden keine Daten an uns gesendet.</p>
      <h2>7. Kontakt per E-Mail</h2>
      <p>Wenn du uns eine E-Mail schreibst, verarbeiten wir deine Angaben nur, um deine Nachricht zu beantworten (Art. 6 Abs. 1 lit. f DSGVO). Das Postfach liegt bei ALL-INKL.COM – Neue Medien Münnich, Hauptstraße 68, 02742 Friedersdorf, Deutschland.</p>
      <h2>8. Deine Rechte</h2>
      <p>Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel beim Hessischen Beauftragten für Datenschutz und Informationsfreiheit.</p>
      <p class="muted">Stand: 26. Oktober 2026</p>`),
  ];
}

// ───────── 404 ─────────
function notFound(ctx) {
  const booths = site.nav.map(id => booth(ctx.categories.find(c => c.id === id), ctx)).join('');
  return {
    path: '/404',
    noindex: true,
    seo: { title: 'Seite nicht gefunden | TFT Arcade', desc: 'Diese Seite gibt es in der TFT Arcade nicht. Zurück zur Spielhalle mit Minispielen, Quiz und Challenges.', h1: 'Diese Bude gibt es nicht', kw: 'TFT Arcade' },
    body: `<div class="wrap page-top">
  <header class="page-head c-coral"><div class="page-head-art">${art('question')}</div><div class="page-head-text"><p class="eyebrow">Fehler 404</p><h1>Diese Bude gibt es nicht</h1><p class="lead">Hier ist nur leerer Kirmesplatz. Vielleicht wurde die Attraktion verschoben – such dir eine andere aus.</p><p><a class="btn btn-gold" href="/">Zur Spielhalle${ui('arrow')}</a></p></div></header>
  <div class="booths">${booths}</div>
</div>`,
  };
}

module.exports = { home, category, game, bestenliste, infoPages, notFound };
