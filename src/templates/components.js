// TFT Arcade – wiederverwendbare Bausteine: Buden, Spielkarten, Breadcrumb, Tageschallenge, Bestenliste, Seitenbereich
const { esc, fmtValue, json } = require('./helpers');
const { art, ui } = require('./icons');
const AVATARE = require('../config/avatare');

const STATUS = {
  live: { badge: 'Ready to play', button: 'Play' },
  bau: { badge: 'Under construction', button: 'View' },
  bald: { badge: 'Coming soon', button: null },
};

const badge = status => `<span class="badge badge-${status}">${STATUS[status].badge}</span>`;

// Rekord-Hinweis auf Karten: wird von arcade.js gefüllt, wenn im Browser ein Rekord gespeichert ist
const recordSlot = g => g.record
  ? `<span class="gcard-record" data-record-slot="${g.id}" data-type="${g.record.type}" data-lower="${g.record.lowerIsBetter ? 1 : 0}" hidden>${ui('trophy')}<span></span></span>`
  : '';

// Spielkarte als Kirmesbude: Rahmen in der Farbe der Kategorie (CSS --frame), Spielbild im Fenster,
// Name + Slogan in der Namensleiste, Pfeil im Kreis. full = darunter Beschreibung, Rundendauer und Rekord (Kategorieseiten);
// attrs = zusätzliche Attribute (z. B. für den Filter der Startseite)
function gameCard(g, ctx, { level = 3, full = false, attrs = '' } = {}) {
  const c = ctx.catOf(g), url = ctx.gameUrl(g);
  const title = url ? `<a class="stretch" href="${url}">${esc(g.title)}</a>` : esc(g.title);
  const img = g.bild ? `<img class="gcard-img" src="/assets/img/karten/${g.bild}.jpg" alt="" width="640" height="360" loading="lazy" decoding="async">` : '';
  return `<article class="gcard c-${c.color} is-${g.status}" data-cat="${g.category}"${attrs}>
  <div class="gcard-booth">
    ${url ? `<a class="gcard-hit" href="${url}" tabindex="-1" aria-hidden="true"></a>` : ''}
    <div class="gcard-art">${img}${g.illu ? '' : `<span class="gcard-emblem">${art(g.art)}</span>`}</div>
    ${g.status !== 'live' ? `<span class="gcard-status">${badge(g.status)}</span>` : ''}
    ${g.tag ? `<span class="gcard-tag">${esc(g.tag)}</span>` : ''}
    <div class="gcard-body">
      <h${level} class="gcard-title">${title}</h${level}>
      <p class="gcard-hook">${esc(g.hook || g.short)}</p>
    </div>
    <span class="gcard-go" aria-hidden="true">${ui(url ? 'arrow' : 'lock')}</span>
    <span class="gcard-lamps" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
    <span class="gcard-glint" aria-hidden="true"></span>
  </div>
  ${full ? `<div class="gcard-info"><p class="gcard-text">${esc(g.short)}</p>
    <div class="gcard-foot"><span class="meta">${ui('clock')}${esc(g.duration)}</span>${recordSlot(g)}<span class="meta meta-cat">${esc(c.name)}</span></div></div>` : ''}
</article>`;
}

function booth(c, ctx, { level = 3 } = {}) {
  const games = ctx.games.filter(g => g.category === c.id);
  const open = games.filter(g => g.status !== 'bald').length, soon = games.length - open;
  const count = [open ? `${open} ${open === 1 ? 'attraction' : 'attractions'}` : '', soon ? `${soon} coming soon` : ''].filter(Boolean).join(' · ');
  return `<article class="booth c-${c.color}">
  <div class="awning" aria-hidden="true"></div>
  <div class="booth-art">${art(c.icon)}</div>
  <h${level} class="booth-name"><a class="stretch" href="/${c.slug}">${esc(c.name)}</a></h${level}>
  <p class="booth-tag">${esc(c.tagline)}</p>
  <p class="booth-count">${count}${ui('arrow')}</p>
</article>`;
}

// Brotkrumen; davor ein Haus-Symbol als Link zur Startseite
function crumbs(list) {
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol><li class="crumb-home"><a href="/" aria-label="Home">${ui('home')}</a></li>${list.map((c, i) => i === list.length - 1
    ? `<li aria-current="page">${esc(c.label)}</li>`
    : `<li><a href="${c.href}">${esc(c.label)}</a></li>`).join('')}</ol></nav>`;
}

// Tageschallenge als breites Ticket. Ohne JavaScript steht der erste Eintrag da; arcade.js wählt die des heutigen Tages.
// compact: nur Slogan, Spiel und Countdown in einer Zeile (Startseite – wie im Mockup); sonst mit der genauen Vorgabe
function daily(ctx, { level = 2, compact = false } = {}) {
  const pool = ctx.dailies.map(d => {
    const g = ctx.games.find(x => x.id === d.game);
    return { ...d, gameTitle: g.title, href: ctx.gameUrl(g) + (d.mode ? `?mode=${d.mode}` : '') };
  });
  const d = pool[0];
  return `<section class="daily" id="daily-challenge" aria-labelledby="daily-h">
  <div class="ticket">
    <p class="ticket-label">${ui('calendar')}<span>Daily Challenge</span></p>
    <div class="ticket-main">
      <h${level} class="ticket-title" id="daily-h" data-daily-title>${esc(d.title)}</h${level}>
      <p class="ticket-sub">${compact ? '' : `<span data-daily-text>${esc(d.text)}</span> `}<span class="ticket-meta">${ui('clock')}<span data-daily-game>${esc(d.gameTitle)}</span> · new in <b data-daily-countdown>--:--:--</b></span></p>
    </div>
    <a class="btn btn-red" href="${d.href}" data-daily-link>Start challenge${ui('arrow')}</a>
  </div>
  <script type="application/json" id="daily-data">${json(pool)}</script>
</section>`;
}

// ───────── Seitenbereich neben der Spielfläche ─────────

// ───────── Bestenliste (Seitenbereich der Spielseite und Automaten der Hall of Fame) ─────────
// Gerendert werden die Beispieldaten; arcade.js mischt beim Laden die eigenen Einträge aus dem Browser dazu (renderBoard).
// Modi mit ranked: false (z. B. Training) haben keine Bestenliste.
const BOARD_SIZE = 10, SIDE_ROWS = 5;
const rankedModes = g => g.modes.filter(m => m.ranked !== false);
const boardAttrs = g => `data-board-root="${g.id}" data-type="${g.record.type}" data-lower="${g.record.lowerIsBetter ? 1 : 0}" data-mode="${rankedModes(g)[0].id}" data-size="${BOARD_SIZE}" data-avatars="${AVATARE.map(a => a.id).join(',')}"`;
const boardJson = (g, ctx) => `<script type="application/json" data-board-data>${json(ctx.boards[g.id] || {})}</script>`;

// Avatar: runder Charakter (src/config/avatare.js). Einträge ohne gewählten Avatar (Beispieldaten) bekommen einen festen
// über ihren Namen – gleiche Regel wie avatarFor() in arcade.js
const avatarOf = name => AVATARE[[...name].reduce((h, ch) => (h * 31 + ch.codePointAt(0)) >>> 0, 7) % AVATARE.length].id;
const avatarImg = (id, alt = '') => `<span class="avatar av-${id}"><img src="/assets/img/avatare/${id}.webp" alt="${esc(alt)}" width="256" height="256" loading="lazy" decoding="async"></span>`;

// Zeilen eines Modus: kind 'li' (Liste im Seitenbereich) oder 'tr' (Tabelle der Hall of Fame), beide mit Avatar
function boardRows(g, ctx, mode, kind, max = BOARD_SIZE) {
  const rows = ((ctx.boards[g.id] || {})[mode] || []).slice(0, max);
  if (!rows.length) return kind === 'tr' ? '<tr class="empty"><td colspan="3">No entries yet.</td></tr>' : '<li class="empty">No entries yet.</li>';
  if (kind === 'tr') return rows.map(([name, v, av], r) => `<tr data-v="${v}"><td class="rank">${r + 1}</td><td class="who">${avatarImg(av || avatarOf(name))}${esc(name)}</td><td class="val">${fmtValue(v, g.record.type)}</td></tr>`).join('');
  return rows.map(([name, v, av], r) => `<li data-v="${v}"><span class="rank">${r + 1}</span>${avatarImg(av || avatarOf(name))}<span class="who">${esc(name)}</span><span class="val">${g.record.type === 'punkte' ? v.toLocaleString('en-US') : fmtValue(v, g.record.type)}</span></li>`).join('');
}

// Avatar-Auswahl beim Highscore-Eintrag (Radio-Felder; arcade.js merkt sich die Wahl)
const avatarPicker = () => `<fieldset class="hs-avatars">
    <legend class="hs-label">Pick an avatar</legend>
    <div class="hs-avatar-grid">${AVATARE.map((a, i) => `<label class="hs-av" title="${esc(a.name)}"><input type="radio" name="avatar" value="${a.id}"${i ? '' : ' checked'}>${avatarImg(a.id, a.name)}</label>`).join('')}</div>
  </fieldset>`;
// Bestenliste der Spielseite (die ersten Plätze), darunter der eigene Rekord
function leaderboard(g, ctx) {
  const lists = rankedModes(g).map((m, i) => `<ol class="board-list" data-board="${m.id}"${i ? ' hidden' : ''}>${boardRows(g, ctx, m.id, 'li', SIDE_ROWS)}</ol>`).join('');
  return `<section class="panel board" aria-labelledby="board-h" ${boardAttrs(g)} data-show="${SIDE_ROWS}">
  <div class="board-head"><h2 id="board-h">${ui('trophy')}Leaderboard</h2><span class="board-demo" title="Preview with made-up names">Sample data</span></div>
  ${lists}
  ${boardJson(g, ctx)}
  <div class="board-record" data-record-box="${g.id}" data-type="${g.record.type}" data-lower="${g.record.lowerIsBetter ? 1 : 0}">
    <p class="br-kicker">${ui('crown')}Your record</p>
    <p class="br-value"><b data-record-value>–</b> <span>${g.record.type === 'zeit' ? '' : 'points'}</span></p>
    <p class="br-sub" data-record-sub>No record yet – play a round!</p>
    <img class="br-figur" data-record-avatar src="/assets/img/avatare/${AVATARE[0].id}.webp" alt="" width="256" height="256" loading="lazy" decoding="async">
  </div>
  <a class="text-link board-all" href="/leaderboard#${g.id}">Full leaderboard${ui('arrow')}</a>
</section>`;
}

function infoPanel(g, ctx) {
  const items = (g.info || []).map(i => {
    const t = i.link && ctx.games.find(x => x.id === i.link);
    return `<li><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p>${t ? `<a class="text-link" href="${ctx.gameUrl(t)}">Go to ${esc(t.title)}${ui('arrow')}</a>` : ''}</li>`;
  }).join('');
  return `<section class="panel info-panel" aria-labelledby="info-h">
  <div class="panel-head"><h2 id="info-h">Good to know</h2></div>
  <ul class="info-list">${items}</ul>
</section>`;
}

function historyPanel(g) {
  return `<section class="panel history" aria-labelledby="hist-h" data-history="${g.id}">
  <div class="panel-head"><h2 id="hist-h">Recently drawn</h2></div>
  <ol class="history-list" data-history-list></ol>
  <p class="panel-note" data-history-empty>${ui('info')}Your most recent rules appear here. They’re only saved in your browser.</p>
</section>`;
}

function aside(g, ctx) {
  if (g.aside === 'bestenliste') return leaderboard(g, ctx);
  if (g.aside === 'verlauf') return historyPanel(g);
  return infoPanel(g, ctx);
}

module.exports = { gameCard, booth, crumbs, daily, aside, badge, boardAttrs, boardJson, boardRows, rankedModes, avatarPicker, STATUS };
