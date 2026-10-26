// TFT Arcade – lokaler Server zum Testen: baut die Seite, liefert dist/ aus wie Vercel (Adressen ohne .html)
// und baut bei jeder Änderung in src/ oder public/ automatisch neu. Aufruf: npm run dev  →  http://localhost:4173
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};

// Bauen in einem eigenen Prozess: so werden geänderte Konfigurationsdateien immer frisch eingelesen
function build() {
  try { execFileSync(process.execPath, [path.join(ROOT, 'build.js')], { stdio: 'inherit' }); }
  catch (e) { console.error('Build fehlgeschlagen – Seite bleibt auf dem letzten Stand.'); }
}
build();

let timer = null;
for (const dir of ['src', 'public']) {
  fs.watch(path.join(ROOT, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 150);
  });
}

function resolve(urlPath) {
  const p = path.normalize(decodeURIComponent(urlPath)).replace(/^([\\/])+/, '');
  if (p.includes('..')) return null;
  const cands = p === '' ? ['index.html'] : [p, p + '.html', path.join(p, 'index.html')];
  for (const c of cands) {
    const f = path.join(DIST, c);
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  // Wie Vercel (cleanUrls, ohne Schrägstrich am Ende): /seite.html → /seite, /seite/ → /seite
  if (/\.html$/.test(url.pathname) || (url.pathname.length > 1 && url.pathname.endsWith('/'))) {
    const to = url.pathname.replace(/(\/index)?\.html$/, '').replace(/\/+$/, '') || '/';
    res.writeHead(308, { Location: to + url.search });
    return res.end();
  }
  const file = resolve(url.pathname);
  const status = file ? 200 : 404;
  const f = file || path.join(DIST, '404.html');
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`\n  TFT Arcade läuft auf http://localhost:${PORT}\n  (Strg+C beendet den Server)\n`));
