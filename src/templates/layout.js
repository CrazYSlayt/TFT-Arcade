// TFT Arcade – Grundgerüst jeder Seite: Kopfdaten (SEO), Kulisse, Navigation, Footer
const site = require('../config/site');
const { esc, json } = require('./helpers');
const { art, ui } = require('./icons');

// Dateien werden relativ verlinkt (assets/… bzw. ../assets/…): so klappt die Seite online UND per Doppelklick auf dist/index.html.
// Seitenlinks bleiben online saubere Adressen (/simulatoren); nur beim Öffnen als Datei schreibt FILE_LINKS sie auf …html um.
const FILE_LINKS = `<script>
// Per Doppelklick geöffnet (file://): Seitenlinks /simulatoren → simulatoren.html, relativ zum Ordner dist/
if (location.protocol === 'file:') document.addEventListener('DOMContentLoaded', function () {
  var root = document.documentElement.getAttribute('data-root') || '';
  document.querySelectorAll('a[href^="/"]').forEach(function (a) {
    var m = a.getAttribute('href').match(/^([^?#]*)(.*)$/);
    a.setAttribute('href', root + (m[1] === '/' ? 'index.html' : m[1].slice(1) + '.html') + m[2]);
  });
});
</script>`;

function head(page, ctx) {
  const url = site.url + page.path;
  const a = ctx.rel;
  const img = site.url + site.ogImage;
  const ld = [{ '@type': 'WebPage', name: page.seo.title, url, inLanguage: site.lang, isPartOf: { '@type': 'WebSite', name: site.name, url: site.url + '/' } }];
  if (page.crumbs && page.crumbs.length > 1) {
    ld.push({
      '@type': 'BreadcrumbList',
      itemListElement: page.crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: site.url + c.href })),
    });
  }
  if (page.ld) ld.push(...page.ld);
  return `<!DOCTYPE html>
<html lang="${site.lang}" data-root="${ctx.root}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.seo.title)}</title>
<meta name="description" content="${esc(page.seo.desc)}">
${page.noindex ? '<meta name="robots" content="noindex, follow">\n' : ''}<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:locale" content="${site.locale}">
<meta property="og:title" content="${esc(page.seo.title)}">
<meta property="og:description" content="${esc(page.seo.desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${site.themeColor}">
<link rel="icon" href="${a('/assets/brand/favicon.svg')}" type="image/svg+xml">
<link rel="icon" href="${a('/assets/brand/favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="icon" href="${a('/assets/brand/favicon-192.png')}" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="${a('/assets/brand/apple-touch-icon.png')}">
<link rel="preload" href="${a('/assets/fonts/LilitaOne-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${a('/assets/fonts/Barlow-500-latin.woff2')}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${a(ctx.asset('/assets/css/arcade.css'))}">
${FILE_LINKS}
<script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': ld })}</script>
</head>`;
}

// Logo: Stern + Schriftzug „TFT ARCADE“
const LOGO = cls => `<a class="logo${cls ? ' ' + cls : ''}" href="/" aria-label="TFT Arcade – zur Startseite"><svg class="logo-star" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4l8.2 16.7 18.4 2.7-13.3 13 3.1 18.3L32 46l-16.4 8.7 3.1-18.3-13.3-13 18.4-2.7z"/><circle cx="25.5" cy="30" r="2.6"/><circle cx="38.5" cy="30" r="2.6"/><path d="M26.5 37q5.5 4.5 11 0" fill="none" stroke-width="2.6" stroke-linecap="round"/></svg><span class="logo-tft">TFT</span><span class="logo-arcade">Arcade</span></a>`;

// Mega-Menü „Spielhalle“: die vier Bereiche als Buden, jeweils mit ihren Spielen
function megaPanel(ctx) {
  const STATUS = { live: 'Spielbar', bau: 'Im Aufbau', bald: 'Demnächst' };
  const order = { live: 0, bau: 1, bald: 2 };
  const booths = site.nav.map(id => {
    const c = ctx.categories.find(x => x.id === id);
    const games = ctx.games.filter(g => g.category === id).sort((a, b) => order[a.status] - order[b.status]);
    const items = games.map(g => {
      const url = ctx.gameUrl(g), inner = `<span class="mega-dot is-${g.status}" aria-hidden="true"></span><span class="mega-game">${esc(g.title)}</span><em>${STATUS[g.status]}</em>`;
      return url ? `<li><a href="${url}">${inner}</a></li>` : `<li><span class="is-soon">${inner}</span></li>`;
    }).join('');
    return `<section class="mega-booth c-${c.color}">
      <div class="awning" aria-hidden="true"></div>
      <a class="mega-head" href="/${c.slug}"><span class="mega-art">${art(c.icon)}</span><span><b>${esc(c.name)}</b><small>${esc(c.tagline)}</small></span></a>
      <ul class="mega-games">${items}</ul>
      <a class="mega-all" href="/${c.slug}">Alle ${esc(c.name)}${ui('arrow')}</a>
    </section>`;
  }).join('');
  return `<div class="mega" id="mega-spielhalle" data-mega-panel><div class="wrap mega-in">${booths}</div></div>`;
}

function header(page, ctx) {
  const inHall = page.path === '/' || site.nav.includes(page.section);
  const live = ctx.games.filter(g => g.status === 'live').map(g => ctx.gameUrl(g));
  return `<header class="topbar" data-topbar>
  <div class="wrap topbar-in">
    ${LOGO()}
    <nav class="mainnav" aria-label="Hauptnavigation">
      <ul>
        <li class="nav-mega" data-mega>
          <button class="nav-link nav-trigger c-gold" type="button" aria-expanded="false" aria-controls="mega-spielhalle"${inHall ? ' data-current' : ''}>${art('ticket')}<span>Spielhalle</span>${ui('chevron', 'ui nav-chevron')}</button>
          ${megaPanel(ctx)}
        </li>
        <li><a class="nav-link c-coral" href="/#tageschallenge">${art('stars')}<span>Tageschallenge</span></a></li>
        <li><a class="nav-link c-gold" href="/bestenliste"${page.section === 'bestenliste' ? ' aria-current="page"' : ''}>${art('trophy')}<span>Bestenliste</span></a></li>
      </ul>
    </nav>
    <div class="topbar-side">
      <a class="btn-outline" href="${live[0] || '/'}" data-random-game='${JSON.stringify(live)}'>${ui('dice')}<span>Zufallsspiel</span></a>
    </div>
  </div>
</header>`;
}

function footer(ctx) {
  const cats = site.nav.map(id => ctx.categories.find(x => x.id === id)).map(c => `<li><a href="/${c.slug}">${esc(c.name)}</a></li>`).join('')
    + '<li><a href="/bestenliste">Bestenliste</a></li>';
  const info = site.footer.map(l => `<li><a href="${l.href}">${esc(l.label)}</a></li>`).join('');
  return `<footer class="footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand">
        ${LOGO('logo-sm')}
        <p>Die digitale Kirmes für TFT-Fans: Minispiele, Quiz und Challenges – kostenlos und ohne Anmeldung.</p>
      </div>
      <nav class="footer-nav" aria-label="Bereiche"><p class="footer-h">Spielhalle</p><ul>${cats}</ul></nav>
      <nav class="footer-nav" aria-label="Info und Rechtliches"><p class="footer-h">Info</p><ul>${info}</ul></nav>
    </div>
    <p class="legal">© ${ctx.year} TFT Arcade · Fan-Projekt. Teamfight Tactics ist eine Marke von Riot Games, Inc. Diese Seite steht in keiner Verbindung zu Riot Games und wird nicht von Riot Games unterstützt.</p>
    <p class="legal legal-riot" lang="en">TFT Arcade was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.</p>
  </div>
</footer>`;
}

// Kulisse: das Kirmes-Bild. Startseite groß, Unterseiten gedämpft, damit die Spielfläche Vorrang hat.
// Startseite: Das Bild füllt die Breite und wird unten abgeschnitten – Pinguin (links) und Geschenke (rechts) aus den unteren Ecken
// liegen deshalb als eigene Ausschnitte in den Ecken des ersten Bildschirms (erzeugt mit tools/bild-ecken.ps1)
const scene = (kind, a) => `<div class="scene scene-${kind}" aria-hidden="true"><img class="scene-img" src="${a('/assets/img/arcade-hintergrund-1536.jpg')}" srcset="${a('/assets/img/arcade-hintergrund-960.jpg')} 960w, ${a('/assets/img/arcade-hintergrund-1536.jpg')} 1536w" sizes="100vw" alt="" width="1536" height="1024"${kind === 'home' ? ' fetchpriority="high"' : ' loading="eager"'}>${kind === 'home'
  ? `<img class="scene-corner scene-corner-l" src="${a('/assets/img/ecke-links.png')}" alt="" width="400" height="250"><img class="scene-corner scene-corner-r" src="${a('/assets/img/ecke-rechts.png')}" alt="" width="340" height="250">`
  : ''}</div>`;

function layout(page, ctx) {
  // Weg von der Seite zum Ordner dist/: '' für /quiz, '../' für /quiz/tft-champion-quiz.
  // Die 404-Seite wird online unter beliebig tiefen Adressen ausgeliefert und verlinkt deshalb ab der Wurzel.
  const root = page.path === '/404' ? '/' : '../'.repeat(Math.max(0, page.path.split('/').length - 2));
  ctx = { ...ctx, root, rel: p => root + p.replace(/^\//, '') };
  return `${head(page, ctx)}
<body class="${page.bodyClass || 'is-sub'}">
<a class="skip" href="#inhalt">Zum Inhalt springen</a>
${header(page, ctx)}
<main id="inhalt">
${scene(page.scene || 'sub', ctx.rel)}
${page.body.replace(/src="\/assets\//g, `src="${ctx.rel('/assets/')}`)}
</main>
${footer(ctx)}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="${ctx.rel(ctx.asset('/assets/js/arcade.js'))}" defer></script>
${(page.scripts || []).map(s => `<script src="${ctx.rel(ctx.asset(s))}" defer></script>`).join('\n')}
</body>
</html>
`;
}

module.exports = { layout };
