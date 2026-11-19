// TFT Arcade – schneidet ein Blatt mit Symbolen (transparentes PNG, z. B. aus ChatGPT) in einzelne WebP-Bilder.
// Aufruf: node tools/symbole-schneiden.js <blatt.png> <name1,name2,…> [Größe=192]
//   → public/assets/img/symbole/<name>.webp (quadratisch, Symbol mittig) – Namen in Leserichtung (Zeile für Zeile, links nach rechts)
// Ablauf (in Chrome per Canvas, wie tools/rahmen-webp.js – kein Bildprogramm nötig):
//   1. fast unsichtbare Reste vom Freistellen (Deckkraft < 24 von 255) entfernen
//   2. zusammenhängende Flächen finden, Krümel (< 400 Pixel) verwerfen, nahe Flächen zu einem Symbol zusammenfassen (z. B. drei Sterne)
//   3. Symbole nach Zeilen und Spalten sortieren, zuschneiden, quadratisch und mittig verkleinern, als WebP speichern
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const [sheet, namesArg, sizeArg] = process.argv.slice(2);
if (!sheet || !namesArg) { console.error('Aufruf: node tools/symbole-schneiden.js <blatt.png> <name1,name2,…> [Größe]'); process.exit(1); }
const names = namesArg.split(',').map(s => s.trim()).filter(Boolean);
const SIZE = Number(sizeArg) || 192, Q = 0.9, PORT = 9337;
const OUT = path.join(__dirname, '..', 'public', 'assets', 'img', 'symbole');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(f => fs.existsSync(f));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const script = `(async () => {
  const img = new Image(); img.src = ${JSON.stringify('data:image/png;base64,' + fs.readFileSync(sheet).toString('base64'))};
  await img.decode();
  const W = img.width, H = img.height, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, W, H), px = id.data;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 24) { px[i] = 0; px[i - 1] = px[i - 2] = px[i - 3] = 0; }
  g.putImageData(id, 0, 0);
  // Flächen (8er-Nachbarschaft)
  const lab = new Int32Array(W * H), comps = [];
  for (let s = 0; s < W * H; s++) {
    if (lab[s] || !px[s * 4 + 3]) continue;
    const n = comps.length + 1, st = [s]; lab[s] = n;
    let area = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
    while (st.length) {
      const p = st.pop(), x = p % W, y = (p - x) / W; area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx; if (!lab[q] && px[q * 4 + 3]) { lab[q] = n; st.push(q); }
      }
    }
    comps.push({ n, area, x0, y0, x1, y1 });
  }
  // Krümel weg, nahe Flächen zusammenfassen
  let groups = comps.filter(k => k.area >= 400).map(k => ({ ...k, ids: [k.n] }));
  const GAP = 28;
  for (let merged = true; merged;) {
    merged = false;
    for (let i = 0; i < groups.length && !merged; i++) for (let j = i + 1; j < groups.length && !merged; j++) {
      const a = groups[i], b = groups[j];
      if (a.x0 - GAP <= b.x1 && b.x0 - GAP <= a.x1 && a.y0 - GAP <= b.y1 && b.y0 - GAP <= a.y1) {
        groups[i] = { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), area: a.area + b.area, ids: a.ids.concat(b.ids) };
        groups.splice(j, 1); merged = true;
      }
    }
  }
  // Leserichtung: Zeilen nach der Mitte, dann links nach rechts
  groups.forEach(k => { k.cy = (k.y0 + k.y1) / 2; k.cx = (k.x0 + k.x1) / 2; });
  groups.sort((a, b) => a.cy - b.cy);
  const rows = [];
  for (const k of groups) { const r = rows.find(r => Math.abs(r.cy - k.cy) < 120); if (r) r.items.push(k); else rows.push({ cy: k.cy, items: [k] }); }
  const order = rows.flatMap(r => r.items.sort((a, b) => a.cx - b.cx));
  // ausschneiden: nur die Pixel des Symbols (keine Krümel aus der Nachbarschaft), quadratisch und mittig
  const res = [];
  for (const k of order) {
    const w = k.x1 - k.x0 + 1, h = k.y1 - k.y0 + 1, keep = new Set(k.ids);
    const cut = document.createElement('canvas'); cut.width = w; cut.height = h;
    const cg = cut.getContext('2d'), cd = cg.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const s = (k.y0 + y) * W + k.x0 + x;
      if (!keep.has(lab[s])) continue;
      const o = (y * w + x) * 4; cd.data.set(px.subarray(s * 4, s * 4 + 4), o);
    }
    cg.putImageData(cd, 0, 0);
    const out = document.createElement('canvas'); out.width = out.height = ${SIZE};
    const og = out.getContext('2d'); og.imageSmoothingQuality = 'high';
    const pad = ${SIZE} * 0.04, sc = (${SIZE} - 2 * pad) / Math.max(w, h);
    og.drawImage(cut, (${SIZE} - w * sc) / 2, (${SIZE} - h * sc) / 2, w * sc, h * sc);
    res.push({ box: [k.x0, k.y0, w, h], webp: out.toDataURL('image/webp', ${Q}) });
  }
  return JSON.stringify(res);
})()`;

(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'symbole-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--mute-audio', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let t; for (let i = 0; i < 50 && !t; i++) { try { t = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(x => x.type === 'page'); } catch (e) { await sleep(200); } }
    const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
    const r = await new Promise(res => { ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id === 1) res(d); }; ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: script, awaitPromise: true, returnByValue: true } })); });
    ws.close();
    if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
    const list = JSON.parse(r.result.result.value);
    console.log(`${list.length} Symbole gefunden, ${names.length} Namen`);
    if (list.length !== names.length) { list.forEach((s, i) => console.log(`  ${i + 1}: Feld ${s.box.join(',')}`)); throw new Error('Anzahl passt nicht – Namen prüfen'); }
    fs.mkdirSync(OUT, { recursive: true });
    list.forEach((s, i) => {
      const f = path.join(OUT, names[i] + '.webp');
      fs.writeFileSync(f, Buffer.from(s.webp.split(',')[1], 'base64'));
      console.log(`  ${names[i]}.webp  ${Math.round(fs.statSync(f).size / 1024)} KB  (aus ${s.box.join(',')})`);
    });
  } finally { chrome.kill(); }
})().catch(e => { console.error(e.message || e); process.exit(1); });
