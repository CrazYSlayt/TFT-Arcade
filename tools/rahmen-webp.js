// TFT Arcade – wandelt die ausgeschnittenen Buden-Rahmen (tools/cache/rahmen/*.png, von tools/rahmen-schneiden.ps1)
// in WebP mit Transparenz um und bringt alle vier auf dieselbe Größe (die des ersten PNGs) → public/assets/img/rahmen/<farbe>.webp
// Umwandlung per Chrome im Hintergrund (Canvas → WebP, gesteuert über die DevTools-Schnittstelle),
// damit kein Bildprogramm installiert sein muss.  Aufruf: node tools/rahmen-webp.js
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const SRC = path.join(__dirname, 'cache', 'rahmen');
const OUT = path.join(__dirname, '..', 'public', 'assets', 'img', 'rahmen');
const Q = 0.86, PORT = 9333;
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(f => fs.existsSync(f));

const names = fs.readdirSync(SRC).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4));
// Zielgröße = Größe des ersten PNGs (Breite/Höhe stehen im PNG-Kopf ab Byte 16)
const head = fs.readFileSync(path.join(SRC, names[0] + '.png'));
const W = head.readUInt32BE(16), H = head.readUInt32BE(20);
console.log(`Zielgröße ${W}×${H} – im CSS (Spielkarten) muss aspect-ratio ${W} / ${H} stehen`);
const pngs = Object.fromEntries(names.map(n => [n, 'data:image/png;base64,' + fs.readFileSync(path.join(SRC, n + '.png')).toString('base64')]));
const script = `(async () => {
  const pngs = ${JSON.stringify(pngs)}, res = {};
  for (const n of Object.keys(pngs)) {
    const im = new Image(); im.src = pngs[n]; await im.decode();
    const c = document.createElement('canvas'); c.width = ${W}; c.height = ${H};
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, ${W}, ${H});
    res[n] = c.toDataURL('image/webp', ${Q});
  }
  return JSON.stringify(res);
})()`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'arcade-chrome-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let target;
    for (let i = 0; i < 50 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch (e) { await sleep(200); }
    }
    if (!target) throw new Error('Chrome nicht erreichbar');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });
    const reply = await new Promise(ok => {
      ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id === 1) ok(m); };
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: script, awaitPromise: true, returnByValue: true } }));
    });
    ws.close();
    if (!reply.result || !reply.result.result || typeof reply.result.result.value !== 'string') throw new Error(JSON.stringify(reply).slice(0, 300));
    const data = JSON.parse(reply.result.result.value);
    fs.mkdirSync(OUT, { recursive: true });
    for (const [n, url] of Object.entries(data)) {
      const buf = Buffer.from(url.split(',')[1], 'base64');
      fs.writeFileSync(path.join(OUT, n + '.webp'), buf);
      console.log(`  ${n}.webp  ${(buf.length / 1024).toFixed(0)} KB`);
    }
    console.log(`✔ ${Object.keys(data).length} Rahmen → public/assets/img/rahmen/`);
  } finally {
    chrome.kill();
    await sleep(500);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* Chrome gibt den Ordner manchmal verzögert frei */ }
  }
}

main().catch(e => { console.error('✖ ' + e.message); process.exit(1); });
