// TFT Arcade – Seiten: Startseite, Kategorie, Spielseite, Info- und Rechtsseiten, 404
const site = require('../config/site');
const { esc } = require('./helpers');
const { art, ui } = require('./icons');
const { gameCard, booth, crumbs, daily, aside, badge, boardAttrs, boardJson, boardRows, rankedModes, avatarPicker } = require('./components');

const HOME = { label: 'Arcade', href: '/' };

// ───────── Startseite ─────────
function home(ctx) {
  // Alle Spiele stehen im Raster; „All games“ zeigt die hervorgehobenen, die Filter-Pillen (arcade.js) einen Bereich
  // „All games“ = höchstens vier hervorgehobene (spielbare zuerst), damit alles auf einen Bildschirm passt
  const order = { live: 0, bau: 1, bald: 2 };
  const byStatus = (a, b) => order[a.status] - order[b.status];
  const top = ctx.games.filter(g => g.featured).sort(byStatus).slice(0, 4);
  const all = [...top, ...ctx.games.filter(g => !top.includes(g)).sort(byStatus)];
  const cards = all.map(g => gameCard(g, ctx, { attrs: top.includes(g) ? ' data-featured' : ' hidden' })).join('');
  const pills = [`<button class="pill" type="button" data-filter="alle" aria-pressed="true">All games</button>`,
    ...site.nav.map(id => { const c = ctx.categories.find(x => x.id === id); return `<button class="pill" type="button" data-filter="${c.id}" aria-pressed="false">${esc(c.name)}</button>`; })].join('');
  const star = `<svg class="deco-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.8z"/></svg>`;
  // home-stage: Hero, Spielkarten und Tageschallenge füllen genau den ersten Bildschirm, das Ticket schließt unten ab
  // (die Buden wachsen in den Platz dazwischen, cards-fit); darunter folgt nur noch der Fußbereich
  const body = `
<div class="home-stage">
<section class="hero">
  <div class="wrap wrap-wide hero-in">
    <h1 class="hero-title">
      <span class="ribbon">${star}<span>TFT Arcade · Your highroll awaits</span>${star}</span>
      <span class="hero-main"><span class="hero-line">Just one</span> <span class="hero-line">${star}more <span class="swoosh">round.</span></span></span>
    </h1>
    <p class="hero-sub">Roll, solve and put your luck to the test.</p>
    <a class="btn btn-gold btn-xl" href="#games">Explore the arcade${ui('arrow')}</a>
  </div>
</section>

<section class="games-section" id="games" aria-labelledby="att-h">
  <div class="wrap wrap-wide">
    <h2 class="deco-title" id="att-h">${star}<span>What will you try next?</span>${star}</h2>
    <div class="pills" role="group" aria-label="Filter games by section">${pills}<a class="pill pill-more" href="/" data-filter-more hidden>See the whole section${ui('arrow')}</a></div>
    <div class="cards-fit"><div class="cards cards-4" data-filter-grid>${cards}</div></div>
  </div>
</section>

<div class="wrap wrap-wide">${daily(ctx, { compact: true })}</div>
</div>`;
  return {
    path: '/',
    scene: 'home',
    bodyClass: 'is-home',
    seo: {
      title: 'TFT Arcade – Mini Games, Quizzes & Challenges for TFT',
      desc: 'TFT Arcade: Mini games, quizzes and challenges for Teamfight Tactics. Roll simulator, champion quiz and more, with no sign-up.',
      h1: 'TFT Arcade · Your highroll awaits Just one more round.',
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
      <p class="eyebrow">${ui('star')}Arcade section</p>
      <h1>${esc(c.seo.h1)}</h1>
      <p class="lead">${esc(c.intro)}</p>
      <p class="head-count">${open} ${open === 1 ? 'attraction' : 'attractions'}${soon ? ` · ${soon} coming soon` : ''}</p>
    </div>
  </header>

  <section class="section-tight" aria-labelledby="list-h">
    <h2 class="section-title" id="list-h">All ${esc(c.name)}</h2>
    <div class="cards">${games.map(g => gameCard(g, ctx, { full: true })).join('')}</div>
  </section>

  ${c.id === 'challenges' ? daily(ctx) : ''}

  <section class="section-tight" aria-labelledby="more-h">
    <h2 class="section-title" id="more-h">More sections</h2>
    <div class="booths booths-3">${others}</div>
  </section>
</div>`;
  return { path: '/' + c.slug, section: c.id, crumbs: crumbList, seo: c.seo, ld: [{ '@type': 'CollectionPage', name: c.seo.h1, url: site.url + '/' + c.slug }], body };
}

// ───────── Spielseite ─────────
function stage(g, c) {
  if (g.status === 'live') {
    return `<div class="stage stage-live" id="spielflaeche" data-game="${g.id}"><noscript><p class="stage-msg">This game needs JavaScript.</p></noscript></div>`;
  }
  return `<div class="stage stage-build" id="spielflaeche" data-game="${g.id}">
  <div class="build-sign">${ui('wrench')}This booth is being built</div>
  <div class="build-art c-${c.color}">${art(g.art)}</div>
  <h2 class="build-title">What to expect</h2>
  <ul class="plan">${g.plan.map(p => `<li>${ui('check')}${esc(p)}</li>`).join('')}</ul>
  <p class="build-note">Coming soon. Check back later or try another attraction in the meantime.</p>
</div>`;
}

// Namenseintrag wie am Arcade-Automaten: erscheint, wenn das Ergebnis für die Top 10 reicht (arcade.js)
const highscoreEntry = () => `<form class="hs-entry" data-hs-form hidden>
    <p class="hs-title">New high score!</p>
    <p class="hs-rank">Rank <b data-hs-rank>1</b> on the leaderboard</p>
    ${avatarPicker()}
    <label class="hs-label" for="hs-name">Enter your name</label>
    <div class="hs-row">
      <input class="hs-input" id="hs-name" name="name" maxlength="12" autocomplete="nickname" spellcheck="false" required>
      <button class="btn btn-gold" type="submit">Save</button>
    </div>
    <p class="hs-hint">2–12 characters: letters, numbers, spaces, _ . and -</p>
  </form>
  <p class="hs-done" data-hs-done hidden>${ui('check')}<span>Saved at rank <b data-hs-place>1</b>!</span> <a class="text-link" href="/leaderboard" data-hs-link>Go to the leaderboard${ui('arrow')}</a></p>`;

// Auswertung nach einer Runde – das Spielskript füllt und zeigt sie über Arcade.finishRound()
const result = g => `<div class="result" id="auswertung" tabindex="-1" hidden>
  <p class="result-kicker">${ui('star')}Round over</p>
  <h2 class="result-title" data-result-title>Done!</h2>
  <p class="result-value" data-result-value></p>
  <p class="result-record" data-result-record hidden>${ui('trophy')}New personal best!</p>
  <ul class="result-lines" data-result-lines></ul>
  ${g.aside === 'bestenliste' ? highscoreEntry() : ''}
  <div class="result-actions">
    <button class="btn btn-gold" type="button" data-result-replay>${ui('replay')}Play again</button>
    <button class="btn btn-ghost" type="button" data-result-share>${ui('share')}Share result</button>
  </div>
</div>`;

// Modus-Knöpfe in der Leiste unter der Spielfläche (Radio-Felder, arcade.js reagiert auf Wechsel);
// data-unranked: Modus zählt nicht für Rekord und Bestenliste
function modePicker(g) {
  return `<fieldset class="modes" data-modes="${g.id}">
    <legend class="sr-label">Mode</legend>
    ${g.modes.map((m, i) => `<label class="mode"><input type="radio" name="modus" value="${m.id}"${m.ranked === false ? ' data-unranked' : ''}${i ? '' : ' checked'}><span>${m.icon ? ui(m.icon) : ''}${esc(m.label)}</span></label>`).join('')}
  </fieldset>`;
}

// zwei weitere Attraktionen für die Zeile ganz unten (spielbare zuerst)
function related(g, ctx) {
  return [
    ...ctx.games.filter(x => x.id !== g.id && x.status === 'live'),
    ...ctx.games.filter(x => x.id !== g.id && x.category === g.category && x.status === 'bau'),
    ...ctx.games.filter(x => x.id !== g.id && x.featured && x.status !== 'bald'),
  ].filter((x, i, a) => a.indexOf(x) === i).slice(0, 2);
}

// Überschrift: Teil vor dem Doppelpunkt groß, der Rest als zweite Farbe (beides sichtbar in der einen H1)
function gameH1(h1) {
  const i = h1.indexOf(': ');
  return i < 0 ? esc(h1) : `${esc(h1.slice(0, i))}<span class="game-h1-sub">: ${esc(h1.slice(i + 2))}</span>`;
}

// Drei Schritte unter der Spielfläche: aus g.schritte, sonst aus Ziel und Regeln
function steps(g) {
  const list = g.schritte || [['Goal', g.rules.ziel], ...g.rules.regeln.slice(0, 2).map((x, i) => [i ? 'And then' : 'Rules', x])];
  return list.map(([t, x], i) => `<li><span class="step-n">${i + 1}</span><div><h3>${esc(t)}</h3><p>${esc(x)}</p></div></li>`).join('');
}

// Nachschlage-Tabelle unter dem Spiel (g.tabelle): 'shop-odds' = Shop-Chancen pro Level, Kopien pro Champion, XP – aus den Set-Daten
function lookupTable(g, ctx) {
  const S = ctx.shop;
  if (g.tabelle !== 'shop-odds' || !S) return '';
  const head = [1, 2, 3, 4, 5].map(k => `<th scope="col"><span class="odds-dot cost-${k}"></span>${k}-cost</th>`).join('');
  const rows = S.odds.slice(0, 10).map((r, i) => `<tr><th scope="row">Level ${i + 1}</th>${r.map(v => `<td${v ? '' : ' class="is-zero"'}>${v}%</td>`).join('')}<td>${S.xp[i] != null && i < 9 ? `${S.xp[i]} XP` : '–'}</td></tr>`).join('');
  const bag = S.bag.map((b, i) => `<td>${b} × ${S.distinct[i]} = <b>${b * S.distinct[i]}</b></td>`).join('');
  return `
  <section class="panel odds-panel" aria-labelledby="odds-h">
    <h2 class="extra-h" id="odds-h">${ui('info')}TFT Shop Odds – Set ${esc(S.set)}</h2>
    <p class="odds-lead">Chance per shop slot by level and cost. Below that: copies per champion × champions per cost = copies in the shared pool.</p>
    <div class="odds-scroll">
      <table class="odds-table">
        <thead><tr><th scope="col">Level</th>${head}<th scope="col">XP to next level</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><th scope="row">Pool</th>${bag}<td></td></tr></tfoot>
      </table>
    </div>
    <p class="odds-note">As of patch ${esc(S.version)} · Level 11 is only available through augments.</p>
  </section>`;
}

function game(g, ctx) {
  const c = ctx.catOf(g), url = ctx.gameUrl(g), live = g.status === 'live';
  const crumbList = [HOME, { label: c.name, href: '/' + c.slug }, { label: g.title, href: url }];
  const r = g.rules, more = related(g, ctx);
  // Gemeinsamer Rahmen aller Spielseiten:
  // Kopf (Etikett, Name, ein Satz) mit Ton und „How to play“ (Dialog mit allen Regeln) ·
  // Spielrahmen mit goldener Kante, darin Spielfläche bzw. Ergebniskarte und unten die Modus-Leiste mit „Restart“ ·
  // Bestenliste mit eigenem Rekord rechts · darunter „How it works“ und „Your next attempt“ · ganz unten weitere Attraktionen
  const body = `
<div class="wrap wrap-game page-top">
  <header class="game-head c-${c.color}">
    <div class="game-head-main">
      ${g.tag ? `<a class="game-tag" href="/${c.slug}" title="All ${esc(c.name)}">${esc(g.tag)}</a>` : ''}
      <div>
        <h1 class="game-h1">${gameH1(g.seo.h1)}</h1>
        <p class="game-hook">${esc(g.hook || g.short)}${live ? '' : ` ${badge(g.status)}`}</p>
      </div>
    </div>
    <div class="game-tools">
      ${live ? `<button class="tool-btn tool-sound" type="button" data-sound aria-pressed="true" aria-label="Sound on – click to turn off">${ui('sound', 'ui ui-on')}${ui('mute', 'ui ui-off')}</button>` : ''}
      <button class="tool-btn" type="button" data-howto-open aria-haspopup="dialog" aria-controls="so-gehts">How to play ${ui('help')}</button>
    </div>
  </header>

  <div class="play c-${c.color}" data-game-page="${g.id}" data-game-title="${esc(g.title)}">
    <section class="play-frame" aria-label="Game area">
      <span class="frame-star fs-tl" aria-hidden="true"></span><span class="frame-star fs-tr" aria-hidden="true"></span>
      <span class="frame-star fs-bl" aria-hidden="true"></span><span class="frame-star fs-br" aria-hidden="true"></span>
      ${stage(g, c)}
      ${result(g)}
      <div class="frame-bar">
        ${modePicker(g)}
        ${live ? `<button class="btn btn-ghost frame-restart" type="button" data-restart>Restart${ui('replay')}</button>` : ''}
      </div>
    </section>
    <aside class="play-side">${aside(g, ctx)}</aside>
  </div>

  <div class="game-extra">
    <section class="panel extra-steps" aria-labelledby="steps-h">
      <h2 class="extra-h" id="steps-h">${ui('info')}How it works</h2>
      <ol class="steps">${steps(g)}</ol>
    </section>
    <section class="panel extra-next" aria-labelledby="next-h">
      <div>
        <h2 class="extra-h" id="next-h">${ui('star')}Your next attempt</h2>
        <p>${g.aside === 'bestenliste' ? 'Ready for another round? Practice, beat your record and climb the leaderboard!' : 'Ready for another round? Play again and challenge your friends!'}</p>
      </div>
      <button class="btn btn-red" type="button" data-share-last>${ui('share')}Share result</button>
    </section>
  </div>
${lookupTable(g, ctx)}

  <nav class="game-more" aria-label="More attractions">
    <span class="game-more-lead">${ui('dice')}One more round somewhere else?</span>
    ${more.map(x => `<a href="${ctx.gameUrl(x)}">${esc(x.title)}${ui('arrow')}</a>`).join('')}
    <a class="game-more-fb" href="/feedback">Give feedback</a>
  </nav>
</div>

<dialog class="howto-dialog c-${c.color}" id="so-gehts" aria-labelledby="so-gehts-h">
  <div class="howto-head"><h2 id="so-gehts-h">How to play: ${esc(g.title)}</h2><button class="tool-btn tool-close" type="button" data-howto-close aria-label="Close">${ui('close')}</button></div>
  <div class="howto-grid">
    <div class="howto-item"><h3>${ui('star')}Goal</h3><p>${esc(r.ziel)}</p></div>
    <div class="howto-item"><h3>${ui('info')}Rules</h3><ul>${r.regeln.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="howto-item"><h3>${ui('check')}Controls</h3><ul>${r.bedienung.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
  </div>
  ${g.hinweise ? `<p class="howto-note">${esc(g.hinweise)}</p>` : ''}
</dialog>`;
  return {
    path: url,
    section: c.id,
    scene: 'game',
    bodyClass: 'is-sub is-game',
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
    const modes = rankedModes(g);
    const tabs = modes.length > 1
      ? `<div class="cab-tabs" role="group" aria-label="Mode">${modes.map((m, i) => `<button class="cab-tab" type="button" data-board-tab="${m.id}" aria-pressed="${i ? 'false' : 'true'}">${esc(m.label)}</button>`).join('')}</div>`
      : `<p class="cab-mode">${esc(modes[0].label)}</p>`;
    return `<section class="cabinet c-${color}" id="${g.id}" aria-labelledby="hof-${g.id}" ${boardAttrs(g)}>
  <div class="cab-marquee">
    <span class="cab-art">${art(g.art)}</span>
    <div><p class="cab-cat">${esc(c.name)}</p><h2 id="hof-${g.id}">${esc(g.title)}</h2></div>
    <span class="badge badge-demo">Demo</span>
  </div>
  <div class="cab-screen">
    ${tabs}
    <table class="hs-table">
      <thead><tr><th scope="col">Rank</th><th scope="col">Name</th><th scope="col">${g.record.type === 'zeit' ? 'Time' : 'Points'}</th></tr></thead>
      ${modes.map((m, i) => `<tbody data-board="${m.id}"${i ? ' hidden' : ''}>${boardRows(g, ctx, m.id, 'tr')}</tbody>`).join('')}
    </table>
    ${boardJson(g, ctx)}
  </div>
  <div class="cab-foot">
    <span class="cab-record">${ui('trophy')}Your record: <b data-hof-record="${g.id}" data-type="${g.record.type}" data-lower="${g.record.lowerIsBetter ? 1 : 0}">–</b></span>
    <a class="btn btn-sm btn-gold" href="${ctx.gameUrl(g)}">${g.status === 'live' ? 'Play' : 'View'}${ui('arrow')}</a>
  </div>
</section>`;
  }).join('');
  const crumbList = [HOME, { label: 'Leaderboard', href: '/leaderboard' }];
  const body = `
<div class="wrap page-top">
  ${crumbs(crumbList)}
  <header class="page-head c-gold">
    <div class="page-head-art">${art('trophy')}</div>
    <div class="page-head-text">
      <p class="eyebrow">${ui('star')}Hall of Fame</p>
      <h1>TFT Arcade Leaderboard</h1>
      <p class="lead">Just like the old arcade cabinets: play a round, crack the top 10 and put your name on the board. These are the best runs across all games.</p>
    </div>
  </header>
  <p class="notice">${ui('info')}Preview: the lists show sample data. Your own entries are only saved in your browser for now. Public leaderboards are on the way.</p>
  <div class="hof-grid">${cabinets}</div>
</div>`;
  return {
    path: '/leaderboard',
    section: 'bestenliste',
    crumbs: crumbList,
    // erst in die Suche, wenn mindestens ein Spiel mit Bestenliste spielbar ist
    noindex: !ranked.some(g => g.status === 'live'),
    seo: {
      title: 'TFT Arcade Leaderboard – High Scores of All Games',
      desc: 'The TFT Arcade leaderboard: best times and high scores from the roll simulator, champion quiz and more. Add your name after a round!',
      h1: 'TFT Arcade Leaderboard', kw: 'leaderboard',
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
    prose('/about', {
      title: 'About TFT Arcade – The Arcade for TFT Fans',
      desc: 'About TFT Arcade: What’s behind the arcade for Teamfight Tactics fans, who builds it and what’s coming next.',
      h1: 'About TFT Arcade', kw: 'TFT Arcade',
    }, 'About TFT Arcade', `
      <p class="lead">TFT Arcade is a digital funfair for everyone who loves Teamfight Tactics: small simulators, challenges, quizzes and party games you can play right in your browser.</p>
      <h2>The idea</h2>
      <p>Practice a rolldown between two matches, challenge your friends to a quiz or spice up your next game with a crazy rule. That’s what the arcade is for. No sign-up, no download, just one more round.</p>
      <h2>Who’s behind it?</h2>
      <p>TFT Arcade is built by CrazYSlayt, a TFT player, coach and the founder of <a href="https://www.tftclimb.com" target="_blank" rel="noopener">TFTClimb</a>, the site for tier lists, comps and coaching. The arcade is its playful sibling: less theory, more “just one more round”.</p>
      <h2>What’s next?</h2>
      <p>The first games are playable and more booths are being built, starting with Challenge Roulette. After that come attractions like the 100 Gold Challenge and TFT Bingo. Got ideas? <a href="/feedback">Send us your feedback</a>.</p>
      <h2>Not an official Riot product</h2>
      <p>TFT Arcade is a fan project and isn’t affiliated with Riot Games. All simulations are simplified and don’t reproduce the current game rules exactly.</p>`),
    prose('/feedback', {
      title: 'TFT Arcade Feedback – Ideas & Bug Reports',
      desc: 'Feedback for TFT Arcade: Report bugs, request new mini games or send us your ideas for the TFT arcade.',
      h1: 'TFT Arcade Feedback', kw: 'Feedback',
    }, 'Feedback', `
      <p class="lead">The arcade grows with your ideas. Tell us what you like, what’s broken and which attraction you’d like to see next.</p>
      <h2>What helps us</h2>
      <ul>
        <li><b>Bugs:</b> Which page, which device and browser, and what happened?</li>
        <li><b>Ideas:</b> New mini games, quiz questions or funny rules for Challenge Roulette.</li>
        <li><b>Balance:</b> Is a challenge too easy or too hard? Let us know.</li>
      </ul>
      <h2>How to reach us</h2>
      <p>By email: ${mail()}, ideally with “TFT Arcade” in the subject line.</p>`),
    prose('/legal-notice', {
      title: 'Legal Notice | TFT Arcade',
      desc: 'Legal notice of TFT Arcade, the fan arcade for Teamfight Tactics: provider, contact and responsible person.',
      h1: 'Legal Notice', kw: 'Legal notice',
    }, 'Legal Notice', `
      <h2>Information pursuant to § 5 DDG (German Digital Services Act)</h2>
      <p>${owner()}</p>
      <h2>Contact</h2>
      <p>Email: ${mail()}</p>
      <h2>Responsible for content pursuant to § 18 (2) MStV</h2>
      <p>${esc(site.owner.name)}, address as above</p>
      <h2>Consumer dispute resolution</h2>
      <p>We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.</p>
      <h2>Liability for content and links</h2>
      <p>The games and content on this site are created with care. Simulations and probabilities are simplified and don’t reproduce the current game rules exactly. The operators of linked external sites are solely responsible for their content. If we become aware of legal violations, we will remove the links concerned immediately.</p>
      <h2>Riot Games</h2>
      <p>TFT Arcade isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
      <p>TFT Arcade is a fan project and isn’t affiliated with Riot Games. Teamfight Tactics, game graphics and game data are the property of Riot Games, Inc.</p>`),
    prose('/privacy', {
      title: 'Privacy Policy | TFT Arcade',
      desc: 'Privacy at TFT Arcade: What data is processed when you visit, what stays in your browser and what your rights are.',
      h1: 'Privacy Policy', kw: 'Privacy',
    }, 'Privacy Policy', `
      <p class="lead">In short: We use Google Analytics to measure how many visitors come and which pages they use. Google sets cookies for this as soon as you open the page. There are no ads. You can object to the measurement at any time; section 3 explains how. Records and settings stay in your browser.</p>
      <h2>1. Controller</h2>
      <p>${owner()}<br>Email: ${mail()}</p>
      <h2>2. Hosting and server log files</h2>
      <p>This website is hosted by Vercel Inc. (USA). Each time a page is requested, the server automatically processes technically necessary data: IP address, date and time, requested address, amount of data transferred, browser and operating system, and the previously visited page. This is necessary to deliver the site and operate it securely (Art. 6 (1) (f) GDPR). For transfers to the USA, Vercel relies on appropriate safeguards under Art. 44 et seq. GDPR (EU-US Data Privacy Framework or EU standard contractual clauses). You can find more in <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">Vercel’s privacy policy</a>.</p>
      <h2>3. Audience measurement with Google Analytics</h2>
      <p>We use Google Analytics 4, a service of Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland (“Google”). It shows us how many visitors our site has, which pages and games are used and where visitors come from, so we can improve the site.</p>
      <p>Google Analytics is loaded as soon as you open a page, even if you haven’t confirmed the cookie notice yet. Google stores cookies on your device (<code>_ga</code> and <code>_ga_${esc(site.gaId.replace(/^G-/, ''))}</code>, lasting up to 2 years). They contain a random ID that recognizes repeat visits from the same browser. This doesn’t tell us who you are.</p>
      <p>The data processed includes: the pages you visit and your interactions on them, date and time, the page you came from, device, browser, operating system, screen size and language setting, and your approximate location (country, region, city), which Google derives from your IP address. According to Google, Google Analytics 4 does not store the IP address itself. Data in Google Analytics is deleted automatically after 2 months.</p>
      <p>Google may also process the data in the USA. Google LLC is certified under the EU-US Data Privacy Framework, so these transfers are covered by an adequacy decision of the EU Commission (Art. 45 GDPR). You can find more in <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google’s privacy policy</a>.</p>
      <p>The legal basis is our legitimate interest in measuring our audience to improve our site (Art. 6 (1) (f) GDPR).</p>
      <p><b>Objection:</b> You can object to the measurement at any time, either with “Decline” in the cookie notice or right here. This site then stops loading Google Analytics and deletes the analytics cookies. Your browser remembers your choice (see section 5). Alternatively, you can block cookies in your browser or use <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener">Google’s browser add-on</a>.</p>
      <p class="ga-ctl"><span id="ga-state"></span><button class="btn btn-sm btn-ghost" type="button" id="ga-toggle"></button></p>
      <h2>4. Fonts and images</h2>
      <p>Fonts and all images, including the champion images from Riot Games’ game data, are stored on our own server. No connection to Google Fonts or Riot Games is made for them.</p>
      <h2>5. Storage in your browser</h2>
      <p>Personal records, your leaderboard entries including the name you chose, the rules you drew most recently, your settings and whether you accepted or declined Google Analytics are stored only locally in your browser (Local Storage). This data stays on your device and is not transferred to us. The storage is required for the feature you use (§ 25 (2) no. 2 TDDDG). The Google Analytics cookies are described in section 3. You can delete all of this at any time in your browser settings.</p>
      <h2>6. Sharing results</h2>
      <p>“Share result” copies a short text with a link to your clipboard. No data is sent to us in the process.</p>
      <h2>7. Contact by email</h2>
      <p>If you send us an email, we process your details only to answer your message (Art. 6 (1) (f) GDPR). The mailbox is hosted by ALL-INKL.COM – Neue Medien Münnich, Hauptstraße 68, 02742 Friedersdorf, Germany.</p>
      <h2>8. Your rights</h2>
      <p>You have the right to access, rectification, erasure, restriction of processing, data portability and objection. You can also lodge a complaint with a data protection supervisory authority, for example the Hessian Commissioner for Data Protection and Freedom of Information.</p>
      <p class="muted">Last updated: November 6, 2026</p>`),
  ];
}

// ───────── 404 ─────────
function notFound(ctx) {
  const booths = site.nav.map(id => booth(ctx.categories.find(c => c.id === id), ctx)).join('');
  return {
    path: '/404',
    noindex: true,
    seo: { title: 'Page Not Found | TFT Arcade', desc: 'This page doesn’t exist at TFT Arcade. Head back to the arcade with its mini games, quizzes and challenges.', h1: 'This booth doesn’t exist', kw: 'TFT Arcade' },
    body: `<div class="wrap page-top">
  <header class="page-head c-coral"><div class="page-head-art">${art('question')}</div><div class="page-head-text"><p class="eyebrow">Error 404</p><h1>This booth doesn’t exist</h1><p class="lead">Nothing here but an empty fairground. The attraction may have moved, so pick another one.</p><p><a class="btn btn-gold" href="/">Back to the arcade${ui('arrow')}</a></p></div></header>
  <div class="booths">${booths}</div>
</div>`,
  };
}

module.exports = { home, category, game, bestenliste, infoPages, notFound };
