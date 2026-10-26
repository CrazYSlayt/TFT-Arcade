// TFT Arcade – wiederverwendbare Bausteine: Buden, Spielkarten, Breadcrumb, Tageschallenge, Bestenliste, Seitenbereich
const { esc, fmtValue, json } = require('./helpers');
const { art, ui } = require('./icons');

const STATUS = {
  live: { badge: 'Spielbereit', button: 'Spielen' },
  bau: { badge: 'Im Aufbau', button: 'Ansehen' },
  bald: { badge: 'Demnächst', button: null },
};

const badge = status => `<span class="badge badge-${status}">${STATUS[status].badge}</span>`;

// Rekord-Hinweis auf Karten: wird von arcade.js gefüllt, wenn im Browser ein Rekord gespeichert ist
const recordSlot = g => g.record
  ? `<span class="gcard-record" data-record-slot="${g.id}" data-type="${g.record.type}" data-lower="${g.record.lowerIsBetter ? 1 : 0}" hidden>${ui('trophy')}<span></span></span>`
  : '';

// Spielkarte wie eine kleine Bude: Markise, Bild mit Etikett, Titel + Slogan und runder Start-Button.
// full = mit Beschreibung, Rundendauer und Rekord (Kategorieseiten); attrs = zusätzliche Attribute (z. B. für den Filter der Startseite)
function gameCard(g, ctx, { level = 3, full = false, attrs = '' } = {}) {
  const c = ctx.catOf(g), url = ctx.gameUrl(g), color = g.color || c.color;
  const title = url ? `<a class="stretch" href="${url}">${esc(g.title)}</a>` : esc(g.title);
  const img = g.bild ? `<img class="gcard-img" src="/assets/img/karten/${g.bild}.jpg" alt="" width="640" height="360" loading="lazy" decoding="async">` : '';
  return `<article class="gcard c-${color} is-${g.status}" data-cat="${g.category}"${attrs}>
  <div class="awning" aria-hidden="true"></div>
  <div class="gcard-art">
    ${img}${g.illu ? '' : `<span class="gcard-emblem">${art(g.art)}</span>`}
    ${g.status !== 'live' ? `<span class="gcard-status">${badge(g.status)}</span>` : ''}
    ${g.tag ? `<span class="gcard-tag">${esc(g.tag)}</span>` : ''}
  </div>
  <div class="gcard-body">
    <div class="gcard-head">
      <div>
        <h${level} class="gcard-title">${title}</h${level}>
        <p class="gcard-hook">${esc(g.hook || g.short)}</p>
      </div>
      <span class="gcard-go" aria-hidden="true">${ui(url ? 'arrow' : 'lock')}</span>
    </div>
    ${full ? `<p class="gcard-text">${esc(g.short)}</p>
    <div class="gcard-foot"><span class="meta">${ui('clock')}${esc(g.duration)}</span>${recordSlot(g)}<span class="meta meta-cat">${esc(c.name)}</span></div>` : ''}
  </div>
</article>`;
}

function booth(c, ctx, { level = 3 } = {}) {
  const games = ctx.games.filter(g => g.category === c.id);
  const open = games.filter(g => g.status !== 'bald').length, soon = games.length - open;
  const count = [open ? `${open} ${open === 1 ? 'Attraktion' : 'Attraktionen'}` : '', soon ? `${soon} demnächst` : ''].filter(Boolean).join(' · ');
  return `<article class="booth c-${c.color}">
  <div class="awning" aria-hidden="true"></div>
  <div class="booth-art">${art(c.icon)}</div>
  <h${level} class="booth-name"><a class="stretch" href="/${c.slug}">${esc(c.name)}</a></h${level}>
  <p class="booth-tag">${esc(c.tagline)}</p>
  <p class="booth-count">${count}${ui('arrow')}</p>
</article>`;
}

function crumbs(list) {
  return `<nav class="crumbs" aria-label="Brotkrumen"><ol>${list.map((c, i) => i === list.length - 1
    ? `<li aria-current="page">${esc(c.label)}</li>`
    : `<li><a href="${c.href}">${esc(c.label)}</a></li>`).join('')}</ol></nav>`;
}

// Tageschallenge als breites Ticket. Ohne JavaScript steht der erste Eintrag da; arcade.js wählt die des heutigen Tages.
// compact: nur Slogan, Spiel und Countdown in einer Zeile (Startseite – wie im Mockup); sonst mit der genauen Vorgabe
function daily(ctx, { level = 2, compact = false } = {}) {
  const pool = ctx.dailies.map(d => {
    const g = ctx.games.find(x => x.id === d.game);
    return { ...d, gameTitle: g.title, href: ctx.gameUrl(g) + (d.mode ? `?modus=${d.mode}` : '') };
  });
  const d = pool[0];
  return `<section class="daily" id="tageschallenge" aria-labelledby="daily-h">
  <div class="ticket">
    <p class="ticket-label">${ui('calendar')}<span>Challenge des Tages</span></p>
    <div class="ticket-main">
      <h${level} class="ticket-title" id="daily-h" data-daily-title>${esc(d.title)}</h${level}>
      <p class="ticket-sub">${compact ? '' : `<span data-daily-text>${esc(d.text)}</span> `}<span class="ticket-meta">${ui('clock')}<span data-daily-game>${esc(d.gameTitle)}</span> · neu in <b data-daily-countdown>--:--:--</b></span></p>
    </div>
    <a class="btn btn-red" href="${d.href}" data-daily-link>Challenge starten${ui('arrow')}</a>
  </div>
  <script type="application/json" id="daily-data">${json(pool)}</script>
</section>`;
}

// ───────── Seitenbereich neben der Spielfläche ─────────

function recordBox(g) {
  if (!g.record) return '';
  return `<div class="panel record-box" data-record-box="${g.id}" data-type="${g.record.type}" data-lower="${g.record.lowerIsBetter ? 1 : 0}">
  <p class="panel-kicker">${ui('trophy')}Dein Rekord · ${esc(g.record.label)}</p>
  <p class="record-value" data-record-value>–</p>
  <p class="record-sub" data-record-sub>Noch kein Rekord – spiel eine Runde!</p>
</div>`;
}

// ───────── Bestenliste (Seitenbereich der Spielseite und Automaten der Hall of Fame) ─────────
// Gerendert werden die Beispieldaten; arcade.js mischt beim Laden die eigenen Einträge aus dem Browser dazu (renderBoard).
const BOARD_SIZE = 10;
const boardAttrs = g => `data-board-root="${g.id}" data-type="${g.record.type}" data-lower="${g.record.lowerIsBetter ? 1 : 0}" data-mode="${g.modes[0].id}" data-size="${BOARD_SIZE}"`;
const boardJson = (g, ctx) => `<script type="application/json" data-board-data>${json(ctx.boards[g.id] || {})}</script>`;

// Zeilen eines Modus: kind 'li' (Liste im Seitenbereich) oder 'tr' (Tabelle der Hall of Fame)
function boardRows(g, ctx, mode, kind) {
  const rows = ((ctx.boards[g.id] || {})[mode] || []).slice(0, BOARD_SIZE);
  if (!rows.length) return kind === 'tr' ? '<tr class="empty"><td colspan="3">Noch keine Einträge.</td></tr>' : '<li class="empty">Noch keine Einträge.</li>';
  const cell = kind === 'tr' ? 'td' : 'span';
  return rows.map(([name, v], r) => `<${kind} data-v="${v}"><${cell} class="rank">${r + 1}</${cell}><${cell} class="who">${esc(name)}</${cell}><${cell} class="val">${fmtValue(v, g.record.type)}</${cell}></${kind}>`).join('');
}

function leaderboard(g, ctx) {
  const lists = g.modes.map((m, i) => `<ol class="board-list" data-board="${m.id}"${i ? ' hidden' : ''}>${boardRows(g, ctx, m.id, 'li')}</ol>`).join('');
  return `<section class="panel board" aria-labelledby="board-h" ${boardAttrs(g)}>
  <div class="panel-head"><h2 id="board-h">Bestenliste</h2><span class="badge badge-demo" title="Beispieldaten">Demo</span></div>
  <p class="board-mode">Modus: <b data-board-mode>${esc(g.modes[0].label)}</b> · ${esc(g.record.label)}</p>
  ${lists}
  ${boardJson(g, ctx)}
  <p class="panel-note">${ui('info')}Beispieldaten zur Vorschau. Deine Einträge bleiben vorerst in deinem Browser.</p>
  <a class="text-link" href="/bestenliste#${g.id}">Alle Bestenlisten ansehen${ui('arrow')}</a>
</section>`;
}

function infoPanel(g, ctx) {
  const items = (g.info || []).map(i => {
    const t = i.link && ctx.games.find(x => x.id === i.link);
    return `<li><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p>${t ? `<a class="text-link" href="${ctx.gameUrl(t)}">Zum ${esc(t.title)}${ui('arrow')}</a>` : ''}</li>`;
  }).join('');
  return `<section class="panel info-panel" aria-labelledby="info-h">
  <div class="panel-head"><h2 id="info-h">Gut zu wissen</h2></div>
  <ul class="info-list">${items}</ul>
</section>`;
}

function historyPanel(g) {
  return `<section class="panel history" aria-labelledby="hist-h" data-history="${g.id}">
  <div class="panel-head"><h2 id="hist-h">Zuletzt gezogen</h2></div>
  <ol class="history-list" data-history-list></ol>
  <p class="panel-note" data-history-empty>${ui('info')}Hier erscheinen deine zuletzt gezogenen Vorgaben – gespeichert nur in deinem Browser.</p>
</section>`;
}

function aside(g, ctx) {
  if (g.aside === 'bestenliste') return recordBox(g) + leaderboard(g, ctx);
  if (g.aside === 'verlauf') return historyPanel(g);
  return infoPanel(g, ctx);
}

module.exports = { gameCard, booth, crumbs, daily, aside, badge, boardAttrs, boardJson, boardRows, STATUS };
