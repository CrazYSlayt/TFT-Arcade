// TFT Arcade – prüft die gebauten Seiten in dist/ auf die SEO-Regeln und kaputte Links.
// Regeln (wie bei TFTClimb): genau eine sichtbare H1 ≤ 54 Zeichen, title ≤ 60, Meta-Beschreibung ≤ 134,
// canonical vorhanden, keine doppelten Titel, alle internen Links und Bilder vorhanden.
// Aufruf: npm run check (baut vorher neu)
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const site = require('../src/config/site');

const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p); else if (f.name.endsWith('.html')) files.push(p);
  }
})(DIST);

const text = s => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&shy;/g, '').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
// Adresse → Datei wie bei Vercel mit cleanUrls
const exists = u => {
  const p = decodeURI(u.split(/[?#]/)[0]);
  if (p === '/') return true;
  return [p, p + '.html', path.join(p, 'index.html')].some(x => fs.existsSync(path.join(DIST, x)) && fs.statSync(path.join(DIST, x)).isFile());
};

const problems = [], titles = {};
for (const f of files) {
  const rel = '/' + path.relative(DIST, f).replace(/\\/g, '/');
  const html = fs.readFileSync(f, 'utf8');
  const bad = m => problems.push(`${rel}: ${m}`);

  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  if (h1s.length !== 1) bad(`${h1s.length} H1 statt genau einer`);
  for (const h of h1s) {
    const t = text(h[1]);
    if (t.length > 54) bad(`H1 ${t.length} > 54 Zeichen: „${t}“`);
    // versteckt = die H1 selbst oder Text darin ist unsichtbar (Deko-Symbole mit aria-hidden sind erlaubt)
    const open = h[0].match(/<h1[^>]*>/)[0];
    if (/\shidden|sr-only|visually-hidden|display:\s*none/.test(open) || /class="[^"]*(sr-only|visually-hidden)|style="[^"]*display:\s*none/.test(h[1])) bad('H1 ist versteckt');
  }
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
  if (!title) bad('title fehlt');
  else {
    const t = text(title);
    if (t.length > 60) bad(`title ${t.length} > 60 Zeichen`);
    (titles[t] = titles[t] || []).push(rel);
  }
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!desc) bad('Meta-Beschreibung fehlt');
  else if (text(desc).length > 134) bad(`Meta-Beschreibung ${text(desc).length} > 134 Zeichen`);
  if (!/<link rel="canonical" href="[^"]+">/.test(html)) bad('canonical fehlt');
  if (!/<html lang="de"[ >]/.test(html)) bad('lang fehlt');

  // relative Pfade (assets/…, ../assets/…) vom Ordner der Seite aus auflösen
  const dir = path.posix.dirname(rel);
  const check = (u, what) => {
    if (/^(https?:|mailto:|data:|#|\/\/)/.test(u)) return;
    const abs = u.startsWith('/') ? u : path.posix.join(dir, u);
    if (!abs.startsWith('/') || !exists(abs)) bad(`${what} ohne Ziel: ${u}`);
  };
  for (const m of html.matchAll(/(?:href|src)="([^"]*)"/g)) check(m[1], 'Link/Datei');
  for (const m of html.matchAll(/srcset="([^"]*)"/g)) for (const part of m[1].split(',')) check(part.trim().split(/\s+/)[0], 'srcset');
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!html.includes(`id="${m[1]}"`)) bad(`Sprungmarke #${m[1]} fehlt`);
}
for (const [t, list] of Object.entries(titles)) if (list.length > 1) problems.push(`Doppelter title „${t}“: ${list.join(', ')}`);

// Sitemap: jede Adresse muss es geben und darf nicht auf noindex stehen
const sm = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const p = m[1].replace(site.url, '') || '/';
  const file = p === '/' ? 'index.html' : p.slice(1) + '.html';
  if (!fs.existsSync(path.join(DIST, file))) problems.push(`Sitemap: ${p} existiert nicht`);
  else if (/name="robots" content="noindex/.test(fs.readFileSync(path.join(DIST, file), 'utf8'))) problems.push(`Sitemap: ${p} steht auf noindex`);
}

if (problems.length) {
  console.error(`✖ SEO-Check: ${problems.length} Problem(e)\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`✔ SEO-Check: ${files.length} Seiten in Ordnung`);
