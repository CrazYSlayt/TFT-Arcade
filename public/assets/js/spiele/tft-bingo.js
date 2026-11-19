// TFT Arcade – „TFT Bingo“: eine Karte voller TFT-Momente zum Abhaken, beim Zuschauen (Watch Party) oder in eigenen Spielen (My Game).
// Karten 5×5 (freies Feld in der Mitte) oder 4×4. Jede Karte hat einen Code (z. B. W5-K3F9QZ = Watch Party, 5×5, Zufallswert):
// derselbe Code ergibt dieselbe Karte – ein geteilter Link (?card=…) gibt dem ganzen Chat dieselbe Karte, solange die Set-Daten gleich sind.
// Felder: feste Momente (setunabhängig) plus Momente aus den Set-Daten (Trait-Stufen, freischaltbare Champions, 5-Coster, Comps der TFTClimb-Tierlist).
// Schwierigkeit d: 1 = häufig, 2 = seltener, 3 = sehr selten – jede Karte mischt alle drei, damit ein Bingo dauert, aber erreichbar bleibt.
// Keine Wertung: Abhaken lässt sich nicht prüfen. Markierungen bleiben im Browser (je Karten-Code).
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js), window.TFT_ARCADE_COMPS (daten/comps.js) · Rahmen: window.Arcade (arcade.js)
(function () {
  'use strict';

  const stage = document.getElementById('spielflaeche');
  const data = window.TFT_ARCADE_CHAMPIONS, C = window.TFT_ARCADE_COMPS, A = window.Arcade;
  if (!stage || !A) return;
  const esc = A.esc;

  const POOLS = { watch: { letter: 'W', label: 'Watch Party' }, game: { letter: 'G', label: 'My Game' } };
  const SIZES = { 5: { label: '5×5 Classic', quota: [11, 9, 4], setMax: 6 }, 4: { label: '4×4 Quick', quota: [8, 6, 2], setMax: 4 } };

  // ───────── Feste Momente ─────────
  const FIXED = {
    watch: [
      [1, 'Someone rolls down to 0 gold'], [1, 'A player goes on a 3-round win streak'], [1, 'A player goes on a 3-round loss streak'],
      [1, 'Someone loses a fight by a single unit'], [1, 'Someone hits a 2-star 4-cost'], [1, 'A player levels to 8 on stage 4'],
      [1, 'Two players go for the same comp'], [1, 'The caster says “highroll”'], [1, 'Chat spams “GG”'], [1, 'The streamer blames RNG'],
      [1, 'Someone gets an emblem'], [1, 'A player is out before stage 5'], [1, 'Someone hits a 3-star 1-cost'],
      [1, 'Someone completes an item on stage 2'], [1, 'Someone sits on a full bench'], [1, 'Someone repositions right before a fight'],
      [2, 'Someone hits a 3-star 2-cost'], [2, 'Someone hits a 3-star 3-cost'], [2, 'Someone fields a 2-star 5-cost'],
      [2, 'A reroll comp takes 1st place'], [2, 'Someone wins a fight with one unit left'], [2, 'Someone picks a prismatic augment'],
      [2, 'A player survives a round on 5 HP or less'], [2, 'Someone sells their carry and pivots'], [2, 'Someone reaches level 9'],
      [2, 'Someone loses on purpose for a loss streak'], [2, 'A player under 20 HP still makes top 4'], [2, 'The last two players are within 10 HP'],
      [2, 'A fight ends in a draw'], [2, 'Someone rolls down and hits nothing'],
      [3, 'Someone 3-stars a 4-cost'], [3, 'Someone 3-stars a 5-cost'], [3, 'Someone wins from below 20 HP'], [3, 'Someone wins 8 rounds in a row'],
      [3, 'Someone reaches level 10'], [3, 'The same player wins two games in a row'], [3, 'The winner never loses a player fight'],
    ],
    game: [
      [1, 'Win your first player fight'], [1, 'Lose a fight by a single unit'], [1, 'Complete an item on stage 2'], [1, 'Reach 50 gold'],
      [1, 'Go on a 3-round win streak'], [1, 'Go on a 3-round loss streak'], [1, 'Hit a 2-star 4-cost'], [1, 'Roll down to 0 gold'],
      [1, 'Get an emblem'], [1, 'Level to 8 on stage 4'], [1, 'Have 4 active traits at once'], [1, 'Put 3 items on one unit'],
      [1, 'Grab the item you wanted on the carousel'], [1, 'Make top 4'], [1, 'Sell a unit you just bought'],
      [2, 'Hit a 3-star 1-cost'], [2, 'Hit a 3-star 2-cost'], [2, 'Hit a 3-star 3-cost'], [2, 'Hit a 2-star 5-cost'], [2, 'Reach level 9'],
      [2, 'Win a fight with one unit left'], [2, 'Go on a 5-round win streak'], [2, 'Survive a round on 10 HP or less'],
      [2, 'Sell your carry and pivot'], [2, 'Get a prismatic augment'], [2, 'Have 7 two-star units on your board'],
      [2, 'Make top 4 after dropping below 30 HP'],
      [3, 'Win the game'], [3, 'Hit a 3-star 4-cost'], [3, 'Reach level 10'], [3, 'Win without dropping below 50 HP'],
      [3, 'Go on an 8-round win streak'],
    ],
  };

  // ───────── Momente aus den Set-Daten (key verhindert Doppeltes, z. B. zwei Stufen desselben Traits) ─────────
  function setEvents(pool) {
    if (!data) return [];
    const w = pool === 'watch', out = [];
    const byId = Object.fromEntries(data.champions.map(c => [c.id, c]));
    for (const t of data.traits) {
      if (t.bp.length < 3 || t.champs.length < 4) continue;
      const hi = t.bp[t.bp.length - 1], mid = t.bp[t.bp.length - 2];
      out.push({ d: 2, key: 't:' + t.id, icon: t.icon, kind: 'trait', t: w ? `Someone activates ${t.name} ${mid}` : `Activate ${t.name} ${mid}` });
      if (hi >= 7) out.push({ d: 3, key: 't:' + t.id, icon: t.icon, kind: 'trait', t: w ? `Someone activates ${t.name} ${hi}` : `Activate ${t.name} ${hi}` });
    }
    for (const c of data.champions) {
      if (c.lock) out.push({ d: 2, key: 'c:' + c.id, icon: c.img, kind: 'champ', t: w ? `Someone unlocks ${c.name}` : `Unlock ${c.name}` });
      if (c.cost === 5) out.push({ d: 3, key: 'c:' + c.id, icon: c.img, kind: 'champ', t: w ? `Someone fields a 2-star ${c.name}` : `Field a 2-star ${c.name}` });
    }
    const comps = C && String(C.set) === String(data.set) ? C.comps || [] : [];
    for (const k of comps) {
      const carry = byId[k.carry];
      out.push({ d: 1, key: 'k:' + k.key, icon: carry && carry.img, kind: 'champ', t: w ? `Someone plays ${k.name}` : `Play ${k.name}` });
    }
    return out;
  }

  // ───────── Zufall mit Startwert: gleicher Code = gleiche Karte ─────────
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const shuffle = (list, r) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const makeCode = (pool, size) => `${POOLS[pool].letter}${size}-${Math.floor(Math.random() * 2176782336).toString(36).toUpperCase().padStart(6, '0')}`;
  function parseCode(code) {
    const m = /^([WG])([45])-([0-9A-Z]{1,6})$/.exec(String(code || '').toUpperCase());
    if (!m) return null;
    return { code: m[0], pool: m[1] === 'W' ? 'watch' : 'game', size: Number(m[2]), seed: parseInt(m[3], 36) };
  }

  // Karte aus dem Code: je Schwierigkeit die festgelegte Anzahl, Set-Momente höchstens setMax; dann gemischt, bei 5×5 Mitte frei
  function build(card) {
    const r = rng(card.seed), S = SIZES[card.size];
    const all = FIXED[card.pool].map(([d, t]) => ({ d, t })).concat(setEvents(card.pool));
    const picks = [], keys = new Set(), kinds = { t: 0, c: 0, k: 0 };
    let setCount = 0;
    // Set-Momente: insgesamt höchstens setMax, je Art (Trait, Champion, Comp) höchstens die Hälfte davon – damit die Karte gemischt bleibt
    const kind = e => e.key.split(':')[0];
    const ok = e => !(e.key && (keys.has(e.key) || setCount >= S.setMax || kinds[kind(e)] >= S.setMax / 2));
    const take = e => { picks.push(e); if (e.key) { keys.add(e.key); kinds[kind(e)]++; setCount++; } };
    S.quota.forEach((n, i) => {
      const list = shuffle(all.filter(e => e.d === i + 1), r);
      for (const e of list) { if (n <= 0) break; if (ok(e) && !picks.includes(e)) { take(e); n--; } }
    });
    // falls ein Pool zu klein ist: mit beliebigen Momenten auffüllen
    const need = card.size * card.size - (card.size === 5 ? 1 : 0);
    for (const e of shuffle(all, r)) { if (picks.length >= need) break; if (ok(e) && !picks.includes(e)) take(e); }
    const cells = shuffle(picks, r);
    if (card.size === 5) cells.splice(12, 0, { free: true, t: 'Free field' });
    return cells;
  }

  // alle Linien (Zeilen, Spalten, zwei Diagonalen) als Feld-Indizes
  function linesOf(n) {
    const L = [];
    for (let i = 0; i < n; i++) { L.push([...Array(n)].map((_, j) => i * n + j)); L.push([...Array(n)].map((_, j) => j * n + i)); }
    L.push([...Array(n)].map((_, j) => j * n + j)); L.push([...Array(n)].map((_, j) => j * n + n - 1 - j));
    return L;
  }

  // Markierungen je Karte im Browser (die letzten 12 Karten)
  const saved = code => (A.store.get('bingo_marks', {})[code]) || [];
  function save(code, marks) {
    const all = A.store.get('bingo_marks', {});
    delete all[code]; all[code] = marks;
    const keys = Object.keys(all); while (keys.length > 12) delete all[keys.shift()];
    A.store.set('bingo_marks', all);
  }

  let state = 'start', card = null, cells = [], marks = new Set(), done = new Set(), size = 5, ui = {}, bannerTimer = null;
  const pool = () => (POOLS[A.currentMode()] ? A.currentMode() : 'watch');
  const cardUrl = code => `${location.origin}${location.pathname}?card=${code}`;
  function setUrl(code) {
    const u = new URL(location.href);
    if (code) { u.searchParams.set('card', code); u.searchParams.set('mode', parseCode(code).pool); } else u.searchParams.delete('card');
    history.replaceState(null, '', u);
  }

  // ───────── Startbildschirm ─────────
  function intro() {
    state = 'start'; card = null; setUrl(null);
    const p = pool(), w = p === 'watch';
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">${POOLS[p].label}${data ? ` · Set ${esc(data.set)}` : ''}</p>
      <h2 class="game-title">${w ? 'Bingo for your watch party' : 'Bingo for your own games'}</h2>
      <p class="game-text">${w
        ? 'Watching a tournament or a stream? Mark every moment that happens in the lobby. Share your card link and your chat or your friends play the exact same card.'
        : 'Mark the moments as they happen in your own games – one card can last several games. Share the link to race your friends on the same card.'} A full row, column or diagonal is a bingo.</p>
      <div class="srs-levels bg-sizes" role="group" aria-label="Card size">${[5, 4].map(n => `<button class="srs-level${n === size ? ' is-on' : ''}" type="button" data-size="${n}">${SIZES[n].label}</button>`).join('')}</div>
      <button class="btn btn-gold btn-lg" type="button" data-game-start>Get my card</button>
    </div>`;
    stage.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => { size = Number(b.dataset.size); A.sound('click'); intro(); }));
    stage.querySelector('[data-game-start]').addEventListener('click', () => deal());
  }

  // ───────── Karte ─────────
  function deal(code) {
    const c = parseCode(code || makeCode(pool(), size));
    if (!c) return intro();
    card = c; size = c.size;
    cells = build(c);
    marks = new Set(saved(c.code).filter(i => i >= 0 && i < cells.length && !cells[i].free));
    cells.forEach((x, i) => { if (x.free) marks.add(i); });
    done = new Set();
    state = 'play';
    setUrl(c.code);
    render();
    check(false);
  }

  function render() {
    const n = card.size;
    stage.innerHTML = `<div class="bg">
      <div class="hud">
        <div class="hud-side"><span class="hud-pill">Card <b>${esc(card.code)}</b></span></div>
        <span class="hud-pill hud-score">Bingos <b data-bg-count>0</b></span>
        <div class="hud-side bg-tools">
          <button class="btn btn-ghost btn-sm" type="button" data-bg-share>Share card</button>
          <button class="btn btn-ghost btn-sm" type="button" data-bg-new>New card</button>
        </div>
      </div>
      <p class="game-msg bg-sub">${POOLS[card.pool].label} · ${n}×${n}${data ? ` · Set ${esc(data.set)}` : ''}</p>
      <div class="bg-card bg-${n}" role="grid" aria-label="Bingo card">
        ${cells.map((x, i) => x.free
          ? `<span class="bg-cell is-free is-on" data-i="${i}"><span class="bg-star" aria-hidden="true">★</span><span class="bg-t">Free</span></span>`
          : `<button class="bg-cell bg-d${x.d}${x.kind ? ' is-set' : ''}" type="button" data-i="${i}" aria-pressed="false">${x.icon ? `<img class="bg-ic is-${x.kind}" src="${A.asset(x.icon)}" alt="" loading="lazy">` : ''}<span class="bg-t">${esc(x.t)}</span></button>`).join('')}
        <div class="bg-banner" data-bg-banner hidden><b>BINGO!</b><span data-bg-banner-sub></span></div>
      </div>
      <p class="bg-legend"><span class="bg-dot bg-d1"></span>common <span class="bg-dot bg-d2"></span>rarer <span class="bg-dot bg-d3"></span>very rare</p>
      <div class="bg-actions"><button class="btn btn-gold" type="button" data-bg-finish>Finish card</button></div>
    </div>`;
    const q = s => stage.querySelector(s);
    ui = { count: q('[data-bg-count]'), banner: q('[data-bg-banner]'), bannerSub: q('[data-bg-banner-sub]'), cells: [...stage.querySelectorAll('.bg-cell')] };
    ui.cells.forEach(el => {
      const i = Number(el.dataset.i);
      paint(i);
      if (el.tagName === 'BUTTON') el.addEventListener('click', () => toggle(i));
    });
    q('[data-bg-share]').addEventListener('click', () => A.share(`Play TFT Bingo (${POOLS[card.pool].label}) with me – same card for everyone:`, cardUrl(card.code)));
    q('[data-bg-new]').addEventListener('click', () => { A.sound('flip'); deal(makeCode(card.pool, card.size)); });
    q('[data-bg-finish]').addEventListener('click', finish);
  }

  function paint(i) {
    const el = ui.cells[i];
    if (!el) return;
    el.classList.toggle('is-on', marks.has(i));
    if (el.tagName === 'BUTTON') el.setAttribute('aria-pressed', String(marks.has(i)));
  }

  function toggle(i) {
    if (state !== 'play' || cells[i].free) return;
    if (marks.has(i)) { marks.delete(i); A.sound('click'); } else { marks.add(i); A.sound('tick'); }
    paint(i);
    save(card.code, [...marks].filter(x => !cells[x].free));
    check(true);
  }

  // Linien prüfen; neue Bingos feiern (Banner + Ton), aufgelöste Linien verlieren ihr Leuchten
  function check(celebrate) {
    const lines = linesOf(card.size).filter(l => l.every(i => marks.has(i)));
    const ids = new Set(lines.map(l => l.join(',')));
    const fresh = lines.filter(l => !done.has(l.join(',')));
    done = ids;
    const lit = new Set(lines.flat());
    ui.cells.forEach((el, i) => el.classList.toggle('is-line', lit.has(i)));
    ui.count.textContent = lines.length;
    if (celebrate && fresh.length) {
      fresh.flat().forEach(i => { const el = ui.cells[i]; el.classList.remove('is-pop'); void el.offsetWidth; el.classList.add('is-pop'); });
      const full = marks.size === cells.length;
      ui.bannerSub.textContent = full ? 'Blackout – the whole card!' : lines.length === 1 ? 'Your first line!' : `${lines.length} lines on this card`;
      ui.banner.hidden = false; ui.banner.classList.remove('is-show'); void ui.banner.offsetWidth; ui.banner.classList.add('is-show');
      A.sound('win');
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => { ui.banner.hidden = true; }, 2400);
    }
    return lines.length;
  }

  // ───────── Auswertung ─────────
  function finish() {
    if (state !== 'play') return;
    state = 'done';
    const n = check(false), marked = [...marks].filter(i => !cells[i].free).length, total = cells.filter(x => !x.free).length;
    const full = marked === total, label = POOLS[card.pool].label;
    A.finishRound({
      valueText: n ? `${n} bingo${n === 1 ? '' : 's'}` : 'No bingo',
      title: full ? 'Blackout! Every field marked' : n >= 3 ? 'What a card!' : n ? 'Bingo!' : 'So close …',
      lines: [`${marked} of ${total} moments marked`, `Card ${card.code} · ${label} · ${card.size}×${card.size}`],
      shareText: `TFT Bingo (${label}): ${n ? `${n} bingo${n === 1 ? '' : 's'}` : `${marked}/${total} moments`} on card ${card.code} – play the same card:`,
      shareUrl: cardUrl(card.code),
      quiet: true,
      onReplay: () => deal(makeCode(card.pool, card.size)),   // „Play again“ = frische Karte
    });
  }

  // Modus-Wechsel (Watch Party ↔ My Game): neue Karte im anderen Pool, sonst Startbildschirm
  document.addEventListener('arcade:mode', () => { if (state === 'play' || state === 'done') deal(makeCode(pool(), size)); else intro(); });
  // „Restart“: frische Karte gleicher Art
  document.addEventListener('arcade:restart', () => deal(makeCode(pool(), size)));

  // Start: Karte aus dem Link (?card=…) – Modus-Knopf passend setzen –, sonst Startbildschirm
  const linked = parseCode(new URLSearchParams(location.search).get('card'));
  if (linked) {
    const radio = document.querySelector(`[data-modes] input[value="${linked.pool}"]`);
    if (radio) radio.checked = true;
    size = linked.size;
    deal(linked.code);
  } else intro();
})();
