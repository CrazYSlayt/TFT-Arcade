// TFT Arcade – Champion-Daten für die Spiele aus den TFTClimb-Spieldaten übernehmen und Bilder selbst hosten.
// Aufruf: npm run champions   (optional: node tools/champions.js <Pfad zu tft-data-<Set>.js>)
//
// 1. liest das Live-Set aus ../TFT/data (sets.js → tft-data-<Set>.js, erzeugt von TFTClimb aus CommunityDragon)
// 2. lädt je Champion das große Splash-Bild (splash_centered, 1024×512) von CommunityDragon – fehlt es, die Kachel (256×256)
// 3. verkleinert auf 960×480 JPG (tools/bild-konvertieren.ps1) → public/assets/img/champions/<id>.jpg
// 4. schreibt public/assets/js/spiele/daten/champions.js (als Skript statt JSON, damit es auch per Doppelklick ohne Server lädt)
// Heruntergeladene Originale bleiben in tools/cache/ (nicht veröffentlicht), ein zweiter Lauf lädt nur Neues.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CLIMB = path.join(ROOT, '..', 'TFT', 'data');
const CACHE = path.join(__dirname, 'cache', 'champions');
const IMG_OUT = path.join(ROOT, 'public', 'assets', 'img', 'champions');
const DATA_OUT = path.join(ROOT, 'public', 'assets', 'js', 'spiele', 'daten', 'champions.js');

function load(file) {
  const window = {};
  new Function('window', fs.readFileSync(file, 'utf8'))(window);
  return window;
}

function dataFile() {
  if (process.argv[2]) return path.resolve(process.argv[2]);
  const sets = load(path.join(CLIMB, 'sets.js')).TFT_SETS;
  const live = sets.find(s => s.status === 'live') || sets[0];
  return path.join(CLIMB, live.file);
}

// gleiche Adress-Kurzform wie TFTClimb (champSlug)
const slug = n => n.toLowerCase().replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function download(url, file) {
  if (fs.existsSync(file)) return true;
  const res = await fetch(url);
  if (!res.ok) return false;
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return true;
}

async function main() {
  const file = dataFile();
  const d = load(file).TFT_DATA;
  console.log(`Set ${d.set} · Patch ${d.version} · ${d.champions.length} Champions aus ${path.relative(ROOT, file)}`);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.mkdirSync(IMG_OUT, { recursive: true });
  fs.mkdirSync(path.dirname(DATA_OUT), { recursive: true });

  const list = [], jobs = [];
  for (const c of d.champions) {
    if (!(c.c >= 1 && c.c <= 5)) continue;
    const id = slug(c.n);
    const wide = c.sq.includes('splash_tile') ? c.sq.replace('splash_tile', 'splash_centered') : null;
    let src = null, mode = 'wide';
    if (wide && await download(d.cdn + wide, path.join(CACHE, id + '-wide.png'))) src = path.join(CACHE, id + '-wide.png');
    else if (await download(d.cdn + c.sq, path.join(CACHE, id + '-tile.png'))) { src = path.join(CACHE, id + '-tile.png'); mode = 'tile'; }
    if (!src) { console.warn(`  ✖ kein Bild für ${c.n} – Champion wird ausgelassen`); continue; }
    jobs.push({ src, out: path.join(IMG_OUT, id + '.jpg'), mode });
    list.push({ id, name: c.de || c.n, cost: c.c, img: `assets/img/champions/${id}.jpg` });
  }

  // Bilder umrechnen (Windows: System.Drawing über PowerShell, wie die anderen Bild-Werkzeuge im Projekt)
  const jobFile = path.join(CACHE, 'jobs.json');
  fs.writeFileSync(jobFile, JSON.stringify(jobs));
  execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'bild-konvertieren.ps1'), jobFile], { stdio: 'inherit' });

  // nicht mehr enthaltene Champions (z. B. nach einem Set-Wechsel) aus dem Bildordner entfernen
  const keep = new Set(list.map(c => c.id + '.jpg'));
  for (const f of fs.readdirSync(IMG_OUT)) if (!keep.has(f)) fs.rmSync(path.join(IMG_OUT, f));

  list.sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'de'));
  const out = { set: d.set, version: d.version, generated: d.generated, champions: list };
  fs.writeFileSync(DATA_OUT, `// TFT Arcade – Champions des Live-Sets (automatisch erzeugt mit tools/champions.js, nicht von Hand bearbeiten)\n// Quelle: TFTClimb-Spieldaten / CommunityDragon ${d.version} · Set ${d.set}\nwindow.TFT_ARCADE_CHAMPIONS = ${JSON.stringify(out)};\n`);
  const tiles = jobs.filter(j => j.mode === 'tile').length;
  console.log(`✔ ${list.length} Champions → ${path.relative(ROOT, DATA_OUT)} (${list.length - tiles} große Splash-Bilder, ${tiles} Kacheln)`);
}

main().catch(e => { console.error(e); process.exit(1); });
