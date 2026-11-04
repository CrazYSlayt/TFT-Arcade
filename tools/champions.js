// TFT Arcade – Champion-Daten für die Spiele aus den TFTClimb-Spieldaten übernehmen und Bilder selbst hosten.
// Aufruf: npm run champions   (optional: node tools/champions.js <Pfad zu tft-data-<Set>.js>)
//
// 1. liest das Live-Set aus ../TFT/data (sets.js → tft-data-<Set>.js, erzeugt von TFTClimb aus CommunityDragon)
// 2. lädt je Champion das große Splash-Bild (splash_centered, 1024×512) von CommunityDragon – fehlt es, die Kachel (256×256)
// 3. verkleinert auf 960×480 JPG (tools/bild-konvertieren.ps1) → public/assets/img/champions/<id>.jpg
// 4. lädt die Symbole der Eigenschaften (Traits, weiß auf transparent) → public/assets/img/traits/<id>.png
// 5. schreibt public/assets/js/spiele/daten/champions.js (als Skript statt JSON, damit es auch per Doppelklick ohne Server lädt):
//    Champions (Kosten, Bild, Traits) und Traits (Stufen = ab wie vielen Champions aktiv, zugehörige Champions)
// 6. Items: Komponenten und daraus baubare Items (Rezept aus zwei Komponenten) samt Symbol
//    → public/assets/img/items/<id>.webp (über tools/rahmen-webp.js) und public/assets/js/spiele/daten/items.js
// 7. Shop-Regeln (Odds, Kopien pro Champion, XP) aus custom-<Set>.js → public/assets/js/spiele/daten/shop.js
// Heruntergeladene Originale bleiben in tools/cache/ (nicht veröffentlicht), ein zweiter Lauf lädt nur Neues.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CLIMB = path.join(ROOT, '..', 'TFT', 'data');
const CACHE = path.join(__dirname, 'cache', 'champions');
const IMG_OUT = path.join(ROOT, 'public', 'assets', 'img', 'champions');
const TRAIT_OUT = path.join(ROOT, 'public', 'assets', 'img', 'traits');
const DATA_OUT = path.join(ROOT, 'public', 'assets', 'js', 'spiele', 'daten', 'champions.js');
const ITEM_CACHE = path.join(__dirname, 'cache', 'items');
const ITEM_DATA_OUT = path.join(ROOT, 'public', 'assets', 'js', 'spiele', 'daten', 'items.js');
const SHOP_DATA_OUT = path.join(ROOT, 'public', 'assets', 'js', 'spiele', 'daten', 'shop.js');

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
  fs.mkdirSync(TRAIT_OUT, { recursive: true });

  // Die Seite ist englisch: Namen aus den Spieldaten (n = englisch), Fähigkeiten aus tft-data-<Set>-en.js
  const enFile = path.join(CLIMB, `tft-data-${d.set}-en.js`);
  const en = fs.existsSync(enFile) ? load(enFile).TFT_DATA_EN || {} : {};
  const abilityOf = c => (((en.champions || {})[c.api] || {}).n) || null;

  // Eigenschaften: Name (so stehen sie beim Champion) + Symbol
  const traits = {};
  for (const t of d.traits || []) {
    const id = slug(t.n);
    const ok = t.icon && await download(d.cdn + t.icon.toLowerCase(), path.join(TRAIT_OUT, id + '.png'));
    traits[t.n] = { id, name: t.n, icon: ok ? `assets/img/traits/${id}.png` : null, bp: t.bp || [], champs: [] };
  }

  // Rollen je Champion (rollen-<Set>.js, aus dem TFT-Client) – fehlt die Datei, bleibt die Rolle leer
  const rolesFile = path.join(CLIMB, `rollen-${d.set}.js`);
  const roles = fs.existsSync(rolesFile) ? (load(rolesFile).TFT_ROLES || {}).champions || {} : {};

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
    const own = (c.t || []).map(n => traits[n]).filter(Boolean);
    own.forEach(t => t.champs.push(id));
    list.push({
      id, name: c.n, cost: c.c, img: `assets/img/champions/${id}.jpg`, traits: own.map(t => t.icon ? [t.name, t.icon] : [t.name]),
      // für das Champion-Rätsel: Rolle (aus Riots Empfehlungen), Reichweite in Feldern, Name der Fähigkeit
      role: roleLabel(roles[c.n]), range: (c.st && c.st.range) || null, ability: abilityOf(c),
    });
  }

  // Bilder umrechnen (Windows: System.Drawing über PowerShell, wie die anderen Bild-Werkzeuge im Projekt)
  const jobFile = path.join(CACHE, 'jobs.json');
  fs.writeFileSync(jobFile, JSON.stringify(jobs));
  execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'bild-konvertieren.ps1'), jobFile], { stdio: 'inherit' });

  // nicht mehr enthaltene Champions (z. B. nach einem Set-Wechsel) aus dem Bildordner entfernen
  const keep = new Set(list.map(c => c.id + '.jpg'));
  for (const f of fs.readdirSync(IMG_OUT)) if (!keep.has(f)) fs.rmSync(path.join(IMG_OUT, f));

  list.sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'en'));
  // Traits mit Champions; bp = Stufen (ab so vielen Champions aktiv)
  const traitList = Object.values(traits).filter(t => t.champs.length)
    .map(t => ({ id: t.id, name: t.name, icon: t.icon, bp: t.bp, champs: t.champs }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const out = { set: d.set, version: d.version, generated: d.generated, champions: list, traits: traitList };
  fs.writeFileSync(DATA_OUT, `// TFT Arcade – Champions und Traits des Live-Sets (automatisch erzeugt mit tools/champions.js, nicht von Hand bearbeiten)\n// Quelle: TFTClimb-Spieldaten / CommunityDragon ${d.version} · Set ${d.set}\nwindow.TFT_ARCADE_CHAMPIONS = ${JSON.stringify(out)};\n`);
  const tiles = jobs.filter(j => j.mode === 'tile').length;
  console.log(`✔ ${list.length} Champions, ${traitList.length} Traits → ${path.relative(ROOT, DATA_OUT)} (${list.length - tiles} große Splash-Bilder, ${tiles} Kacheln)`);

  await itemData(d);
  shopData(d, list);
}

// Riots Rollen-Schlüssel (z. B. „MagicTank“, „AttackSpecialist_Ammo“) → kurze Bezeichnung wie „AP Tank“
const ROLE_KINDS = ['Assassin', 'Caster', 'Fighter', 'Marksman', 'Specialist', 'Tank'];
function roleLabel(key) {
  const m = /^(Attack|Magic)([A-Za-z]+?)(?:_.*)?$/.exec(key || '');
  return m && ROLE_KINDS.includes(m[2]) ? `${m[1] === 'Attack' ? 'AD' : 'AP'} ${m[2]}` : null;
}

// Shop-Regeln (Odds pro Level, Kopien pro Champion, XP) aus TFTClimbs custom-<Set>.js → daten/shop.js
function shopData(d, list) {
  const file = path.join(CLIMB, `custom-${d.set}.js`);
  const shop = fs.existsSync(file) && (load(file).TFT_CUSTOM || {}).shop;
  if (!shop || !Array.isArray(shop.odds)) { console.warn(`  ✖ keine Shop-Daten in ${path.relative(ROOT, file)} – daten/shop.js bleibt unverändert`); return; }
  // Champions pro Kosten wie bei TFTClimb (SHOP_DISTINCT): alle Champions der Set-Daten mit dieser Stufe
  const distinct = [1, 2, 3, 4, 5].map(c => list.filter(x => x.cost === c).length);
  const out = { set: d.set, version: d.version, bag: shop.bag, odds: shop.odds, xp: shop.xp, distinct };
  fs.writeFileSync(SHOP_DATA_OUT, `// TFT Arcade – Shop-Regeln des Live-Sets (automatisch erzeugt mit tools/champions.js aus TFTClimbs custom-${d.set}.js, nicht von Hand bearbeiten)\n// odds[Level-1][Kosten-1] = Chance pro Shop-Slot in % · bag = Kopien pro Champion · xp[i] = XP von Level i+1 auf i+2 · distinct = Champions pro Kosten\nwindow.TFT_ARCADE_SHOP = ${JSON.stringify(out)};\n`);
  console.log(`✔ Shop-Regeln (Level 1–${shop.odds.length}) → ${path.relative(ROOT, SHOP_DATA_OUT)}`);
}

// Komponenten + Items, die aus genau zwei Komponenten gebaut werden (cat 'craft'; Embleme, Artefakte usw. nicht)
async function itemData(d) {
  fs.mkdirSync(ITEM_CACHE, { recursive: true });
  const short = id => slug(id.replace(/^DA_(Component_)?/, ''));
  const used = new Set(d.items.filter(i => i.cat === 'craft').flatMap(i => i.comp || []));
  const pick = async (i) => {
    const id = short(i.id);
    const ok = i.icon && await download(d.cdn + i.icon.toLowerCase(), path.join(ITEM_CACHE, id + '.png'));
    if (!ok) console.warn(`  ✖ kein Symbol für ${i.en || i.de}`);
    return ok ? { id, name: i.en || i.de, img: `assets/img/items/${id}.webp` } : null;
  };
  const components = (await Promise.all(d.items.filter(i => i.cat === 'component' && used.has(i.id)).map(pick))).filter(Boolean);
  const known = new Set(components.map(c => c.id));
  const items = [];
  for (const i of d.items.filter(x => x.cat === 'craft' && (x.comp || []).length === 2)) {
    const comp = i.comp.map(short);
    if (!comp.every(c => known.has(c))) continue;
    const it = await pick(i);
    if (it) items.push({ ...it, comp });
  }
  // Symbole in WebP umwandeln (alle gleich groß, über Chrome – siehe tools/rahmen-webp.js)
  for (const f of fs.readdirSync(ITEM_CACHE)) if (![...components, ...items].some(x => x.id + '.png' === f)) fs.rmSync(path.join(ITEM_CACHE, f));
  execFileSync(process.execPath, [path.join(__dirname, 'rahmen-webp.js'), '128', '128', 'items'], { stdio: 'inherit', cwd: ROOT });
  items.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  const out = { set: d.set, version: d.version, components, items };
  fs.writeFileSync(ITEM_DATA_OUT, `// TFT Arcade – Komponenten und baubare Items des Live-Sets (automatisch erzeugt mit tools/champions.js, nicht von Hand bearbeiten)\n// Quelle: TFTClimb-Spieldaten / CommunityDragon ${d.version} · Set ${d.set}\nwindow.TFT_ARCADE_ITEMS = ${JSON.stringify(out)};\n`);
  console.log(`✔ ${components.length} Komponenten, ${items.length} Items → ${path.relative(ROOT, ITEM_DATA_OUT)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
