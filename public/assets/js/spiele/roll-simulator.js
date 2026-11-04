// TFT Arcade – 3-Star Roll Simulator: auf Level 10 rollen, bis ein 5-Kosten-Champion drei Sterne hat. Board und Bank sind zu Beginn leer.
// Board aus Sechsecken (4 × 7) und Bank (9 Plätze) wie im Spiel: Einheiten per Ziehen oder Klick verschieben, aufs Shop-Feld ziehen oder E = verkaufen.
// Modi: „Time Trial“ (gewertet: Bestzeit bis 3 Sterne) · „Training“ (Level wählbar, Ziel markiert, Trefferchance). Die Uhr läuft in beiden hoch.
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js) und window.TFT_ARCADE_SHOP (daten/shop.js – Odds, Kopien pro Champion aus TFTClimb)
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste und Ton
(function () {
  'use strict';

  const stage = document.getElementById('spielflaeche');
  const data = window.TFT_ARCADE_CHAMPIONS, S = window.TFT_ARCADE_SHOP, A = window.Arcade;
  if (!stage || !data || !S || !A) return;
  const esc = A.esc;

  const SLOTS = 5, BENCH = 9, ROWS = 4, COLS = 7, REROLL = 2, COPIES = 9;
  const LEVEL = 10, LEVELS = [9, 10, 11];        // gewertet immer Level 10, im Training wählbar (11 nur über Augments)
  const OTHERS = [0.3, 0.6];                      // Gegner halten 30–60 % der anderen 5-Koster (spätes Spiel), von 1–4-Kostern bis zu 40 %

  const champs = data.champions;
  const byId = Object.fromEntries(champs.map(c => [c.id, c]));
  const byCost = [1, 2, 3, 4, 5].map(k => champs.filter(c => c.cost === k));
  const coin = n => `<span class="kq-coin">${n}</span>`;
  const stars = n => '★'.repeat(n);
  const pct = x => `${x.toLocaleString('en-US', { maximumFractionDigits: x < 10 ? 1 : 0 })}%`;
  const sec = ms => (ms / 1000).toFixed(1);
  const copiesOf = star => 3 ** (star - 1);
  const sellValue = (c, star) => star === 1 ? c.cost : c.cost * copiesOf(star) - (c.cost > 1 ? 1 : 0);

  let mode = 'rush', state = 'start', level = LEVEL, trainLevel = LEVEL, pool = {}, shop = [], units = [], uidNext = 1, target = null;
  let rolls = 0, spent = 0, wrong = 0, startAt = 0, timer = null, raf = null, selected = null, drag = null, ghost = null, ui = {};
  const mouse = { x: -1, y: -1 };
  const ranked = () => mode !== 'training';

  // ───────── Einheiten auf Board und Bank ─────────
  const unitAt = (at, pos) => units.find(u => u.at === at && u.pos === pos);
  const onBoard = () => units.filter(u => u.at === 'board').length;
  const freeBench = () => { for (let i = 0; i < BENCH; i++) if (!unitAt('bench', i)) return i; return -1; };
  const targetUnit = () => units.filter(u => u.id === target.id).sort((a, b) => b.star - a.star)[0];
  const targetCopies = () => units.filter(u => u.id === target.id).reduce((s, u) => s + copiesOf(u.star), 0);

  // drei gleiche Einheiten werden eins – die neue steht dort, wo schon eine auf dem Board war, sonst auf dem vordersten Bankplatz
  function merge(id) {
    let up = 0;
    for (const star of [1, 2]) {
      let list = units.filter(u => u.id === id && u.star === star);
      while (list.length >= 3) {
        const three = [...list.filter(u => u.at === 'board'), ...list.filter(u => u.at === 'bench' && u.pos >= 0).sort((a, b) => a.pos - b.pos), ...list.filter(u => u.pos < 0)].slice(0, 3);
        const keep = three[0];
        units = units.filter(u => u === keep || !three.includes(u));
        keep.star = star + 1; up = keep.star;
        list = units.filter(u => u.id === id && u.star === star);
      }
    }
    return up;
  }

  // ───────── Shop: Kostenstufe nach den Odds des Levels, Champion nach den Kopien im Pool ─────────
  function drawSlot() {
    const odds = S.odds[level - 1];
    const left = byCost.map(list => list.reduce((s, c) => s + Math.max(0, pool[c.id]), 0));
    const w = odds.map((o, k) => left[k] > 0 ? o : 0), sum = w.reduce((a, b) => a + b, 0);
    if (!sum) return null;
    let r = Math.random() * sum, k = 0;
    while (r >= w[k]) r -= w[k++];
    let x = Math.random() * left[k];
    for (const c of byCost[k]) { x -= Math.max(0, pool[c.id]); if (x < 0) { pool[c.id]--; return c.id; } }
    return null;
  }
  function roll() {
    shop.forEach(id => { if (id) pool[id]++; });   // nicht gekaufte Champions gehen zurück in den Pool
    shop = Array.from({ length: SLOTS }, drawSlot);
  }
  function hitChance() {
    const all = byCost[4].reduce((s, x) => s + pool[x.id], 0);
    if (!all || pool[target.id] <= 0) return 0;
    const p = S.odds[level - 1][4] / 100 * pool[target.id] / all;
    return (1 - (1 - p) ** SLOTS) * 100;
  }

  // ───────── Aufbau: Board und Bank sind leer, alle neun Kopien des Ziels liegen im Pool ─────────
  function setup() {
    level = ranked() ? LEVEL : trainLevel;
    units = []; shop = []; uidNext = 1; selected = null;
    rolls = 0; spent = 0; wrong = 0; startAt = 0;
    target = A.shuffle(byCost[4])[0];
    pool = {};
    champs.forEach(c => {
      const bag = S.bag[c.cost - 1];
      const share = c.id === target.id ? 0 : c.cost === 5 ? OTHERS[0] + Math.random() * (OTHERS[1] - OTHERS[0]) : Math.random() * 0.4;
      pool[c.id] = bag - Math.round(bag * share);
    });
    roll();
  }

  // ───────── Startbildschirm ─────────
  function intro() {
    state = 'start';
    clearTimeout(timer); cancelAnimationFrame(raf);
    mode = A.currentMode();
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">Set ${esc(data.set)} · real shop odds · ${ranked() ? `Level ${LEVEL}` : 'Training'}</p>
      <h2 class="game-title">3 stars on a 5-cost</h2>
      <ol class="rs-preview" aria-hidden="true">${[1, 2, 3].map(() => `<li class="cost-5">${coin(5)}</li>`).join('')}</ol>
      <p class="game-text">${ranked()
        ? 'Empty board, empty bench, one 5-cost target: roll on level 10 until you own all nine copies. Gold doesn’t matter, only your time does – the clock starts with the round.'
        : 'Same round, no leaderboard: pick your level, the target is highlighted in the shop and you see your chance of hitting a copy in the next shop.'}
        Keys: <kbd>D</kbd> reroll, <kbd>1</kbd>–<kbd>5</kbd> buy, <kbd>E</kbd> sell the unit under your cursor. Drag units between board and bench.</p>
      ${ranked() ? '' : `<div class="rs-levels" role="group" aria-label="Level">${LEVELS.map(l => `<button class="rs-level${l === trainLevel ? ' is-on' : ''}" type="button" data-level="${l}">Level ${l}${l === 11 ? '<small>Augment</small>' : ''}</button>`).join('')}</div>`}
      <button class="btn btn-gold btn-lg" type="button" data-game-start>Let’s go</button>
    </div>`;
    stage.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => { trainLevel = Number(b.dataset.level); intro(); }));
    stage.querySelector('[data-game-start]').addEventListener('click', start);
  }

  function start() {
    clearTimeout(timer); cancelAnimationFrame(raf);
    mode = A.currentMode();
    setup();
    state = 'play';
    const hexes = Array.from({ length: ROWS }, (_, r) => `<div class="ts-row${r % 2 ? ' is-odd' : ''}">${Array.from({ length: COLS }, (_, c) => `<div class="ts-hex" data-cell="board:${r * COLS + c}"></div>`).join('')}</div>`).join('');
    stage.innerHTML = `<div class="ts">
      <div class="hud">
        <div class="hud-side"><span class="hud-pill">Time <b data-ts-clock>0.0</b></span></div>
        <span class="hud-pill hud-score">Rolls <b data-ts-rolls>0</b></span>
        <div class="hud-side cr-hud-right"><span class="hud-pill">Gold <b data-ts-spent>0</b></span></div>
      </div>
      <div class="ts-arena">
        <div class="ts-board" data-ts-board aria-label="Board">${hexes}</div>
        <aside class="ts-goal" aria-label="Target">
          <p class="rs-h">Target: 3 stars</p>
          <div class="ts-goal-pic cost-5"><img src="${A.asset(target.img)}" alt="" width="960" height="480"><span class="ts-goal-stars" data-ts-goal-stars></span></div>
          <b class="ts-goal-name">${esc(target.name)}</b>
          <ol class="ts-pips" data-ts-pips aria-label="Copies">${Array.from({ length: COPIES }, () => '<li></li>').join('')}</ol>
          <p class="ts-goal-info" data-ts-info></p>
        </aside>
      </div>
      <div class="ts-bench" aria-label="Bench">${Array.from({ length: BENCH }, (_, i) => `<div class="ts-slot" data-cell="bench:${i}"></div>`).join('')}</div>
      <p class="game-msg" data-ts-msg aria-live="polite"></p>
      <div class="ts-shopbar" data-sellzone>
        <div class="ts-shop-top">
          <button class="ts-roll" type="button" data-ts-roll aria-keyshortcuts="D">Reroll ${coin(REROLL)}<kbd>D</kbd></button>
          <span class="ts-lvl">Level <b>${level}</b></span>
          <p class="rs-odds" data-ts-odds></p>
          <span class="ts-sellhint">Drop here to sell</span>
        </div>
        <ul class="rs-shop" data-ts-shop></ul>
      </div>
    </div>`;
    const q = s => stage.querySelector(s);
    ui = { clock: q('[data-ts-clock]'), rolls: q('[data-ts-rolls]'), spent: q('[data-ts-spent]'), board: q('[data-ts-board]'), pips: [...stage.querySelectorAll('[data-ts-pips] li')],
      goalStars: q('[data-ts-goal-stars]'), info: q('[data-ts-info]'), msg: q('[data-ts-msg]'), shop: q('[data-ts-shop]'), odds: q('[data-ts-odds]'), roll: q('[data-ts-roll]'), bar: q('[data-sellzone]') };
    ui.roll.addEventListener('click', reroll);
    ui.shop.addEventListener('click', e => { const b = e.target.closest('[data-slot]'); if (b && !drag) buy(Number(b.dataset.slot)); });
    stage.querySelectorAll('[data-cell]').forEach(cell => cell.addEventListener('click', () => { if (selected != null && !cell.querySelector('[data-uid]')) moveTo(selected, cellOf(cell)); }));
    msg(`Your target: <b>${esc(target.name)}</b> – you need all ${COPIES} copies.`);
    render(true);
    runClock();
  }

  // Uhr läuft ab dem Rundenstart hoch
  function runClock() {
    startAt = performance.now();
    const step = () => { if (state !== 'play') return; ui.clock.textContent = sec(performance.now() - startAt); raf = requestAnimationFrame(step); };
    step();
  }

  function msg(html, cls) { ui.msg.innerHTML = html; ui.msg.className = 'game-msg' + (cls ? ' ' + cls : ''); }

  // ───────── Aktionen ─────────
  function reroll() {
    if (state !== 'play') return;
    rolls++; spent += REROLL;
    roll();
    A.sound('flip');
    render(true);
  }

  function buy(i) {
    if (state !== 'play') return;
    const id = shop[i];
    if (!id) return;
    const c = byId[id], free = freeBench(), ones = units.filter(u => u.id === id && u.star === 1).length;
    if (free < 0 && ones < 2) { msg('Your bench is full – sell a unit or move one to the board.', 'is-bad'); A.sound('bad'); return; }
    shop[i] = null; spent += c.cost;
    if (id !== target.id) wrong++;
    units.push({ uid: uidNext++, id, star: 1, at: 'bench', pos: free });
    const up = merge(id);
    if (id === target.id) {
      msg(up === 3 ? `<b>${esc(c.name)}</b> is 3 stars!` : `${esc(c.name)}: ${targetCopies()}/${COPIES} copies.`, 'is-ok');
      A.sound(up === 3 ? 'win' : 'ok');
    } else { msg(`${esc(c.name)} bought${up ? ` – now ${up} stars` : ''}.`); A.sound('click'); }
    render(false);
    if (targetUnit() && targetUnit().star >= 3) finish();
  }

  function sell(uid) {
    if (state !== 'play') return;
    const u = units.find(x => x.uid === uid);
    if (!u) return;
    const c = byId[u.id], v = sellValue(c, u.star);
    units = units.filter(x => x !== u);
    pool[u.id] += copiesOf(u.star); spent -= v;
    if (selected === uid) selected = null;
    msg(`${esc(c.name)} ${stars(u.star)} sold: +${v} gold.${u.id === target.id ? ' Oops – that was your target!' : ''}`, u.id === target.id ? 'is-bad' : '');
    A.sound('click');
    render(false);
  }

  const cellOf = el => { const [at, pos] = el.dataset.cell.split(':'); return { at, pos: Number(pos) }; };
  // Einheit verschieben; auf ein belegtes Feld = tauschen. Aufs Board nur, solange dort Platz ist (so viele Einheiten wie das Level).
  function moveTo(uid, to) {
    const u = units.find(x => x.uid === uid);
    if (!u || !to) return;
    selected = null;
    if (u.at === to.at && u.pos === to.pos) return render(false);
    const other = unitAt(to.at, to.pos);
    if (to.at === 'board' && u.at === 'bench' && !other && onBoard() >= level) { msg(`Your board is full (${level}/${level}) – swap a unit or move one to the bench.`, 'is-bad'); A.sound('bad'); return render(false); }
    if (other) { other.at = u.at; other.pos = u.pos; }
    u.at = to.at; u.pos = to.pos;
    msg('');
    A.sound('click');
    render(false);
  }

  // ───────── Ziehen & Ablegen (Maus und Touch); ein Klick ohne Ziehen wählt aus ─────────
  stage.addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-uid]');
    if (!el || state !== 'play' || e.button > 0) return;
    drag = { uid: Number(el.dataset.uid), x: e.clientX, y: e.clientY, el, moved: false };
  });
  document.addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.moved = true;
      ghost = drag.el.cloneNode(true);
      ghost.className += ' ts-ghost';
      document.body.appendChild(ghost);
      drag.el.classList.add('is-dragging');
      ui.bar.classList.add('is-sell');
    }
    ghost.style.transform = `translate(${e.clientX - 36}px, ${e.clientY - 42}px)`;
    const t = dropTarget(e.clientX, e.clientY);
    stage.querySelectorAll('.is-over').forEach(x => x.classList.remove('is-over'));
    if (t && t.el) t.el.classList.add('is-over');
  });
  function endDrag(e, cancel) {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (ghost) { ghost.remove(); ghost = null; }
    ui.bar && ui.bar.classList.remove('is-sell');
    stage.querySelectorAll('.is-over, .is-dragging').forEach(x => x.classList.remove('is-over', 'is-dragging'));
    if (cancel || state !== 'play') return;
    if (!d.moved) { // Klick
      if (selected === d.uid) { selected = null; render(false); }
      else if (selected != null) { const u = units.find(x => x.uid === d.uid); moveTo(selected, { at: u.at, pos: u.pos }); }
      else { selected = d.uid; render(false); msg('Selected – click a hex to move it or press E to sell it.'); }
      return;
    }
    const t = dropTarget(e.clientX, e.clientY);
    if (!t) return render(false);
    if (t.sell) sell(d.uid); else moveTo(d.uid, t.cell);
  }
  document.addEventListener('pointerup', e => endDrag(e));
  document.addEventListener('pointercancel', e => endDrag(e, true));
  function dropTarget(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el || !stage.contains(el)) return null;
    const cell = el.closest('[data-cell]');
    if (cell) return { el: cell, cell: cellOf(cell) };
    const sz = el.closest('[data-sellzone]');
    return sz ? { el: sz, sell: true } : null;
  }
  // Einheit unter dem Mauszeiger (über die Position, damit es auch direkt nach dem Neuzeichnen stimmt)
  function hovered() {
    const el = mouse.x >= 0 && document.elementFromPoint(mouse.x, mouse.y), u = el && el.closest('[data-uid]');
    return u && stage.contains(u) ? Number(u.dataset.uid) : null;
  }

  // ───────── Darstellung ─────────
  const unitHtml = u => {
    const c = byId[u.id];
    return `<div class="ts-unit cost-${c.cost}${u.id === target.id ? ' is-goal' : ''}${selected === u.uid ? ' is-sel' : ''}" data-uid="${u.uid}" title="${esc(c.name)} ${stars(u.star)} – drag to move, press E or drop on the shop to sell (+${sellValue(c, u.star)} gold)">
      <span class="ts-unit-in"><img src="${A.asset(c.img)}" alt="" width="960" height="480" draggable="false"></span>
      <span class="ts-stars s${u.star}">${stars(u.star)}</span><span class="ts-name">${esc(c.name)}</span></div>`;
  };
  function card(c, i) {
    const goal = c.id === target.id;
    return `<li><button class="rs-card cost-${c.cost}${goal && !ranked() ? ' is-target' : ''}" type="button" data-slot="${i}" aria-label="${esc(c.name)}, ${c.cost} gold" aria-keyshortcuts="${i + 1}">
      <span class="rs-pic"><img src="${A.asset(c.img)}" alt="" width="960" height="480" draggable="false"></span>
      <span class="rs-row"><b class="rs-name">${esc(c.name)}</b><span class="rs-cost">${coin(c.cost)}</span></span>
      <span class="rs-traits">${c.traits.map(([n, icon]) => `<span>${icon ? `<img src="${A.asset(icon)}" alt="">` : ''}${esc(n)}</span>`).join('')}</span>
    </button></li>`;
  }

  function render(fresh) {
    stage.querySelectorAll('[data-cell]').forEach(cell => {
      const { at, pos } = cellOf(cell), u = unitAt(at, pos);
      cell.innerHTML = u ? unitHtml(u) : '';
      cell.classList.toggle('is-filled', !!u);
    });
    ui.board.dataset.count = `${onBoard()}/${level}`;
    ui.rolls.textContent = rolls;
    ui.spent.textContent = spent;
    const have = targetCopies(), best = targetUnit();
    ui.pips.forEach((p, i) => p.classList.toggle('is-on', i < have));
    ui.goalStars.textContent = best ? stars(best.star) : '';
    ui.goalStars.className = 'ts-goal-stars s' + (best ? best.star : 0);
    const inPool = Math.max(0, pool[target.id]) + shop.filter(x => x === target.id).length;
    ui.info.innerHTML = `${have}/${COPIES} copies · <b>${inPool}</b> left in the pool${ranked() ? '' : `<br>Chance per shop: <b>${pct(hitChance())}</b>`}`;
    ui.shop.className = 'rs-shop' + (fresh ? ' is-deal' : '');
    ui.shop.innerHTML = shop.map((id, i) => id ? card(byId[id], i) : '<li class="rs-sold" aria-hidden="true"></li>').join('');
    ui.odds.innerHTML = S.odds[level - 1].map((o, k) => `<span class="cost-${k + 1}"><i></i>${o}%</span>`).join('');
  }

  // ───────── Auswertung ─────────
  function finish() {
    if (state !== 'play') return;
    state = 'done';
    cancelAnimationFrame(raf);
    const ms = performance.now() - startAt, secs = Math.round(ms / 100) / 10;
    ui.clock.textContent = sec(ms);
    timer = setTimeout(() => A.finishRound({
      ...(ranked() ? { value: secs } : { valueText: `${sec(ms)} s` }),
      title: secs < 60 ? 'What a highroll!' : secs < 100 ? 'Three stars!' : 'Finally!',
      lines: [
        `${target.name} is 3 stars · level ${level}`,
        `${rolls} rolls · ${spent} gold spent${wrong ? ` · ${wrong} other ${wrong === 1 ? 'buy' : 'buys'}` : ''}`,
      ],
      shareText: `3-Star Roll Simulator: ${target.name} 3 stars in ${sec(ms)} seconds and ${rolls} rolls – can you beat that? #TFTArcade`,
      onReplay: start,
    }), 900);
  }

  document.addEventListener('arcade:restart', start);
  document.addEventListener('arcade:mode', intro);
  document.addEventListener('keydown', e => {
    if (stage.hidden || e.altKey || e.ctrlKey || e.metaKey || A.typing(e)) return;
    const k = e.key.toLowerCase();
    if (state === 'play' && k === 'd') { e.preventDefault(); reroll(); }
    else if (state === 'play' && /^[1-5]$/.test(k)) { e.preventDefault(); buy(Number(k) - 1); }
    else if (state === 'play' && k === 'e') {
      // E verkauft die Einheit unter dem Mauszeiger – ohne Maus die ausgewählte (Klick)
      const under = hovered(), uid = under != null ? under : selected;
      if (uid != null) { e.preventDefault(); sell(uid); }
    }
    else if (state === 'play' && e.key === 'Escape' && selected != null) { selected = null; render(false); }
    else if (state === 'start' && e.key === 'Enter' && !e.target.closest('button, a, dialog')) { e.preventDefault(); start(); }
  });

  intro();
})();
