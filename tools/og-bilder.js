// TFT Arcade – Vorschaubilder (og:image) der Spiele erzeugen → public/assets/img/og/<slug>.jpg (1200 × 630, für Google, Discord, WhatsApp, X)
// Pro Spiel eine Vorlage im Stil der Seite – bewusst ohne Set, Patch und veränderliche Zahlen, damit das Bild auch nach Patches stimmt.
// Chrome rendert die Vorlage im Hintergrund (DevTools-Schnittstelle), dasselbe Bild steht auch im Artikel unter dem Spiel.
// Aufruf: node tools/og-bilder.js   – nach neuen Spielen, einem neuen Set oder neuen Maskottchen
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const OUT = path.join(PUB, 'assets', 'img', 'og');
const TMP = path.join(__dirname, 'cache', 'og');
const PORT = 9335, W = 1200, H = 630;
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(f => fs.existsSync(f));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const file = p => pathToFileURL(path.join(PUB, p)).href;

function data(script, name) {
  const window = {};
  new Function('window', fs.readFileSync(path.join(PUB, 'assets/js/spiele/daten', script), 'utf8'))(window);
  return window[name];
}
const champs = data('champions.js', 'TFT_ARCADE_CHAMPIONS');
const items = data('items.js', 'TFT_ARCADE_ITEMS');
const champ = id => champs.champions.find(c => c.id === id) || champs.champions[0];
const costColor = ['#aab2c0', '#3fcf6e', '#3ba3ff', '#c264f2', '#ffbf3a'];

// rechte Bildhälfte je Spiel
const coin = (n, s = 92) => `<span class="coin" style="--k:${costColor[n - 1]};--s:${s}px">${n}</span>`;
const hex = (src, k, s = 150) => `<span class="hex" style="--k:${k};--s:${s}px"><span><img src="${src}"></span></span>`;
const card = (src, k) => `<span class="card" style="--k:${k}"><img src="${src}"></span>`;
const back = k => `<span class="card back" style="--k:${k}"></span>`;
const pick = ids => ids.map(champ);
const illu = n => `<div class="illu"><img src="${file(`assets/img/karten/${n}.jpg`)}"></div>`;
const TRAITS = champs.traits.filter(t => t.icon && t.bp.length >= 2).slice(0, 7);
const VISUAL = {
  'roll-simulator': () => illu('roll-simulator'),
  'champion-quiz': () => illu('champion-quiz'),
  'shop-memory': () => `<div class="fan">${[1, 3, 5, 4, 2].map(k => back(costColor[k - 1])).join('')}</div>`,
  'comp-memory': () => `<div class="hexes">${[2, 3, 4, 5, 4, 3].map((k, i) => champs.champions.filter(c => c.cost === k)[i]).map(c => hex(file(c.img), costColor[c.cost - 1], 146)).join('')}</div>`,
  'cost-quiz': () => `<div class="stack"><div class="pic" style="--k:${costColor[3]}"><img src="${file(champs.champions.find(c => c.cost === 4).img)}"></div><div class="coins">${[1, 2, 3, 4, 5].map(n => coin(n)).join('')}</div></div>`,
  'item-quiz': () => { const [a, b] = items.components; return `<div class="recipe"><img class="ic" src="${file(a.img)}"><b>+</b><img class="ic" src="${file(b.img)}"><b>=</b><span class="ic q">?</span></div>`; },
  'trait-quiz': () => `<div class="hexes traits">${TRAITS.map(t => `<span class="thex"><span><img src="${file(t.icon)}"></span></span>`).join('')}</div>`,
  'shop-odds-quiz': () => `<div class="stack"><div class="bars">${[[18, 1], [32, 2], [56, 3], [78, 4], [42, 5]].map(([h, k]) => `<i style="height:${h * 3}px;--k:${costColor[k - 1]}"></i>`).join('')}</div><div class="coins">${[1, 2, 3, 4, 5].map(n => coin(n)).join('')}</div></div>`,
};

const GAMES = [
  { id: 'roll-simulator', slug: 'tft-roll-simulator', a: 'TFT Roll', b: 'Simulator', sub: 'Three stars on a 5-cost', line: 'Hex board, bench and real shop odds' },
  { id: 'champion-quiz', slug: 'tft-champion-quiz', a: 'TFT Champion', b: 'Quiz', sub: 'Who is this champ?', line: 'Six clues and a Daily Puzzle' },
  { id: 'shop-memory', slug: 'tft-shop-memory', a: 'TFT Shop', b: 'Memory', sub: 'Remember the shop', line: 'Quick look. Flip. Rebuild it.' },
  { id: 'comp-memory', slug: 'tft-comp-memory', a: 'TFT Comp', b: 'Memory', sub: 'Remember the board', line: 'Study it. Memorize it. Rebuild it.' },
  { id: 'cost-quiz', slug: 'tft-champion-cost-quiz', a: 'TFT Cost', b: 'Quiz', sub: 'What does it cost?', line: 'One champion. Five prices.' },
  { id: 'item-quiz', slug: 'tft-item-quiz', a: 'TFT Item', b: 'Quiz', sub: 'Do you know every recipe?', line: 'Two parts. One item.' },
  { id: 'trait-quiz', slug: 'tft-trait-quiz', a: 'TFT Trait', b: 'Quiz', sub: 'Do you know every synergy?', line: 'Breakpoints, champions, traits' },
  { id: 'shop-odds-quiz', slug: 'tft-shop-odds-quiz', a: 'TFT Shop Odds', b: 'Quiz', sub: 'Do you know the odds?', line: 'Level, cost, percent' },
];

const CSS = `
@font-face { font-family: 'Lilita One'; src: url(${file('assets/fonts/LilitaOne-latin.woff2')}) format('woff2'); }
@font-face { font-family: 'Barlow'; font-weight: 700; src: url(${file('assets/fonts/Barlow-700-latin.woff2')}) format('woff2'); }
@font-face { font-family: 'Barlow Condensed'; font-weight: 700; src: url(${file('assets/fonts/BarlowCondensed-700-latin.woff2')}) format('woff2'); }
* { box-sizing: border-box; margin: 0; }
body { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; color: #fff; font-family: 'Barlow'; background: #160a28; }
.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 20%; filter: saturate(1.1); }
.shade { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(16, 7, 30, .96) 0, rgba(16, 7, 30, .9) 44%, rgba(16, 7, 30, .55) 100%); }
.frame { position: absolute; inset: 14px; border: 3px solid #f2b13c; border-radius: 18px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .5), 0 0 26px rgba(255, 190, 70, .35); }
.left { position: absolute; left: 62px; top: 56px; bottom: 56px; width: 600px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 12px; font: 400 34px/1 'Lilita One'; letter-spacing: .04em; }
.brand img { width: 52px; height: 52px; }
.brand i { font-style: normal; color: #ffc94a; }
.kick { margin-top: auto; font: 700 24px/1 'Barlow Condensed'; letter-spacing: .14em; text-transform: uppercase; color: #46e3d2; }
h1 { margin: 12px 0 14px; font: 400 92px/.98 'Lilita One'; color: #fff1d6; text-shadow: 0 4px 0 #6b2c1a, 0 10px 22px rgba(0, 0, 0, .55); }
h1 span { display: block; color: #ffc94a; }
.sub { font: 700 34px/1.15 'Barlow'; }
.line { margin-top: 10px; margin-bottom: auto; font: 700 24px/1.2 'Barlow'; color: #d9cdee; }
.right { position: absolute; right: 44px; top: 44px; bottom: 44px; width: 490px; display: grid; place-items: center; }
.mascot { position: absolute; right: 26px; bottom: 22px; width: 150px; height: 150px; object-fit: contain; filter: drop-shadow(0 8px 14px rgba(0, 0, 0, .6)); }
.illu { width: 490px; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 16px; border: 4px solid #f2b13c; box-shadow: 0 16px 34px rgba(0, 0, 0, .6); transform: rotate(2deg); }
.illu img { width: 100%; height: 100%; object-fit: cover; }
.coin { display: inline-grid; place-items: center; width: var(--s); height: var(--s); border-radius: 50%; font: 400 calc(var(--s) * .55)/1 'Lilita One'; color: #1a0b00; background: radial-gradient(circle at 35% 30%, #fff, var(--k) 62%); box-shadow: 0 5px 0 rgba(0, 0, 0, .45), inset 0 0 0 3px rgba(255, 255, 255, .35); }
.coins { display: flex; gap: 6px; }
.stack { display: grid; gap: 22px; justify-items: center; transform: translateY(-34px); }
.pic { width: 470px; aspect-ratio: 2 / 1; overflow: hidden; border-radius: 16px; border: 4px solid var(--k); box-shadow: 0 0 30px -4px var(--k); }
.pic img { width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }
.fan { display: flex; justify-content: center; }
.card { width: 130px; height: 190px; margin-left: -28px; border-radius: 12px; border: 4px solid var(--k); box-shadow: 0 0 22px -4px var(--k), 0 12px 22px rgba(0, 0, 0, .6); }
.card.back { background: repeating-linear-gradient(45deg, #2c1252 0 10px, #241044 10px 20px); }
.fan .card:nth-child(1) { transform: rotate(-14deg) translateY(26px); } .fan .card:nth-child(2) { transform: rotate(-7deg) translateY(8px); } .fan .card:nth-child(4) { transform: rotate(7deg) translateY(8px); } .fan .card:nth-child(5) { transform: rotate(14deg) translateY(26px); }
.hexes { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 8px; width: 470px; }
.hex { display: block; width: var(--s); height: calc(var(--s) * 1.1547); padding: 5px; clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); background: var(--k); }
.hex span { display: block; width: 100%; height: 100%; overflow: hidden; clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); }
.hex img { width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }
.thex { display: grid; place-items: center; width: 130px; height: 150px; clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); background: linear-gradient(180deg, #ffe17c, #b9771c); }
.thex span { display: grid; place-items: center; width: 118px; height: 138px; clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%); background: radial-gradient(circle at 50% 30%, #7a52c0, #2a1248 72%); }
.thex img { width: 62%; }
.recipe { display: flex; align-items: center; gap: 12px; font: 400 62px/1 'Lilita One'; color: #ffc94a; }
.recipe b { font-weight: 400; }
.ic { display: grid; place-items: center; width: 122px; height: 122px; border-radius: 16px; border: 4px solid #c99a3c; background: #0b0416; box-shadow: 0 10px 22px rgba(0, 0, 0, .6); }
.ic.q { border: 4px dashed #ffc94a; color: #ffc94a; }
.bars { display: flex; align-items: flex-end; gap: 22px; height: 250px; }
.bars i { width: 68px; border-radius: 10px 10px 4px 4px; background: linear-gradient(180deg, var(--k), color-mix(in srgb, var(--k) 45%, #160a28)); box-shadow: 0 0 22px -4px var(--k); }
`;

const page = g => `<!doctype html><meta charset="utf-8"><style>${CSS}</style>
<img class="bg" src="${file('assets/img/arcade-hintergrund-1536.jpg')}"><div class="shade"></div><div class="frame"></div>
<div class="left">
  <div class="brand"><img src="${file('assets/brand/favicon-192.png')}"><span>TFT <i>ARCADE</i></span></div>
  <div class="kick">Free TFT game</div>
  <h1>${g.a}<span>${g.b}</span></h1>
  <div class="sub">${g.sub}</div>
  <div class="line">${g.line}</div>
</div>
<div class="right">${VISUAL[g.id]()}</div>
<img class="mascot" src="${file('assets/img/avatare/kronenpinguin.webp')}">`;

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'arcade-og-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let target;
    for (let i = 0; i < 50 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) { await sleep(200); }
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => { ws.onopen = r; });
    let id = 0;
    const open = {};
    ws.onmessage = e => { const m = JSON.parse(e.data); if (open[m.id]) { open[m.id](m); delete open[m.id]; } };
    const send = (method, params = {}) => new Promise(r => { open[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    await send('Page.enable');
    for (const g of GAMES) {
      const html = path.join(TMP, g.slug + '.html');
      fs.writeFileSync(html, page(g));
      await send('Page.navigate', { url: pathToFileURL(html).href });
      await sleep(500);
      await send('Runtime.evaluate', { expression: 'Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => {}))])', awaitPromise: true });
      await sleep(150);
      const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
      fs.writeFileSync(path.join(OUT, g.slug + '.jpg'), Buffer.from(shot.result.data, 'base64'));
      console.log(`  ${g.slug}.jpg  ${Math.round(fs.statSync(path.join(OUT, g.slug + '.jpg')).size / 1024)} KB`);
    }
    ws.close();
    console.log(`✔ ${GAMES.length} Vorschaubilder → public/assets/img/og/`);
  } finally {
    chrome.kill();
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* Chrome hält den Ordner noch */ }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
