// TFT Arcade – baut die Seite nach dist/: eine fertige HTML-Datei pro Adresse, dazu sitemap.xml und robots.txt.
// Aufruf: node build.js   (npm run dev baut automatisch bei jeder Änderung neu)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const PUB = path.join(ROOT, 'public');

const site = require('./src/config/site');
const categories = require('./src/config/categories');
const games = require('./src/config/games');
const boards = require('./src/config/demo-bestenlisten');
const dailies = require('./src/config/tageschallenges');
const { layout } = require('./src/templates/layout');
const pages = require('./src/templates/pages');
const { ART } = require('./src/templates/icons');

// ───────── Konfiguration prüfen: Fehler brechen ab, damit keine kaputte Seite entsteht ─────────
function validate() {
  const err = [];
  const ids = new Set(), urls = new Set();
  const seo = (where, s) => {
    if (!s) return err.push(`${where}: seo fehlt`);
    if (s.title.length > 60) err.push(`${where}: title ${s.title.length} > 60 Zeichen`);
    if (s.desc.length > 134) err.push(`${where}: desc ${s.desc.length} > 134 Zeichen`);
    if (s.h1.length > 54) err.push(`${where}: h1 ${s.h1.length} > 54 Zeichen`);
    if (s.kw && !s.desc.toLowerCase().includes(s.kw.toLowerCase())) err.push(`${where}: Keyword „${s.kw}“ fehlt in desc`);
  };
  for (const c of categories) seo(`Kategorie ${c.id}`, c.seo);
  for (const g of games) {
    const w = `Spiel ${g.id}`;
    if (ids.has(g.id)) err.push(`${w}: id doppelt`);
    ids.add(g.id);
    if (!categories.find(c => c.id === g.category)) err.push(`${w}: Kategorie „${g.category}“ unbekannt`);
    if (!['live', 'bau', 'bald'].includes(g.status)) err.push(`${w}: status „${g.status}“ unbekannt`);
    if (!ART[g.art]) err.push(`${w}: Symbol „${g.art}“ fehlt in icons.js`);
    if (g.bild && !fs.existsSync(path.join(PUB, 'assets', 'img', 'karten', g.bild + '.jpg'))) err.push(`${w}: Kartenbild karten/${g.bild}.jpg fehlt`);
    if (g.color && !['gold', 'coral', 'teal', 'violet'].includes(g.color)) err.push(`${w}: Farbe „${g.color}“ unbekannt`);
    if (g.status === 'bald') continue;
    for (const k of ['slug', 'lead', 'rules', 'modes', 'aside']) if (g[k] == null) err.push(`${w}: ${k} fehlt`);
    if (g.status === 'bau' && !g.plan) err.push(`${w}: plan fehlt („Das erwartet dich“ während des Aufbaus)`);
    if (g.slug && !/^tft-[a-z0-9-]+$/.test(g.slug)) err.push(`${w}: slug soll mit „tft-“ beginnen (Keyword-Adresse)`);
    const u = `${g.category}/${g.slug}`;
    if (urls.has(u)) err.push(`${w}: Adresse doppelt`);
    urls.add(u);
    if (g.aside === 'bestenliste' && (!g.record || !g.modes.length)) err.push(`${w}: Bestenliste braucht record und modes`);
    if (g.status === 'live' && !(g.scripts || []).length) err.push(`${w}: spielbar, aber ohne scripts`);
    for (const s of g.scripts || []) if (!fs.existsSync(path.join(PUB, s))) err.push(`${w}: Skript ${s} fehlt`);
    seo(w, g.seo);
  }
  for (const d of dailies) {
    const g = games.find(x => x.id === d.game);
    if (!g || g.status === 'bald') err.push(`Tageschallenge „${d.title}“: Spiel ${d.game} fehlt oder hat keine Seite`);
    else if (d.mode && !g.modes.find(m => m.id === d.mode)) err.push(`Tageschallenge „${d.title}“: Modus ${d.mode} fehlt`);
  }
  if (err.length) {
    console.error('✖ Konfiguration fehlerhaft:\n  ' + err.join('\n  '));
    process.exit(1);
  }
}

// ───────── Bauen ─────────
function build() {
  validate();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.cpSync(PUB, OUT, { recursive: true });

  // Dateiversion im Link (?v=…): nach jeder Änderung lädt der Browser CSS/JS neu, sonst darf er sie lange cachen
  const hashes = {};
  const ctx = {
    site, categories, games, boards, dailies,
    year: new Date().getFullYear(),
    catOf: g => categories.find(c => c.id === g.category),
    gameUrl: g => g.status === 'bald' ? null : `/${categories.find(c => c.id === g.category).slug}/${g.slug}`,
    asset: p => {
      if (!hashes[p]) hashes[p] = crypto.createHash('md5').update(fs.readFileSync(path.join(PUB, p))).digest('hex').slice(0, 8);
      return `${p}?v=${hashes[p]}`;
    },
  };

  const list = [
    pages.home(ctx),
    ...categories.map(c => pages.category(c, ctx)),
    ...games.filter(g => g.status !== 'bald').map(g => pages.game(g, ctx)),
    pages.bestenliste(ctx),
    ...pages.infoPages(ctx),
    pages.notFound(ctx),
  ];

  for (const p of list) {
    const file = p.path === '/' ? 'index.html' : p.path.slice(1) + '.html';
    const dest = path.join(OUT, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, layout(p, ctx));
  }

  // Sitemap: nur Seiten, die in die Suche sollen
  const urls = list.filter(p => !p.noindex).map(p => `  <url><loc>${site.url}${p.path === '/' ? '/' : p.path}</loc></url>`);
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);

  console.log(`✔ ${list.length} Seiten gebaut (${urls.length} in der Sitemap) → dist/`);
  return list;
}

module.exports = { build };
if (require.main === module) build();
