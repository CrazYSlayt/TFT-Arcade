// TFT Arcade – 3-Star Roll Simulator: auf Level 10 rollen, bis dein 5-Kosten-Champion drei Sterne hat.
// Board aus Sechsecken (4 × 7) und Bank (9 Plätze) wie im Spiel: Einheiten per Ziehen oder Klick verschieben, aufs Shop-Feld ziehen = verkaufen.
// Modi: „Training“ (ohne Uhr, Level wählbar, Ziel im Shop markiert, Trefferchance) · „Gegen die Uhr“ (gewertet: Bestzeit bis 3 Sterne)
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js) und window.TFT_ARCADE_SHOP (daten/shop.js – Odds, Kopien pro Champion aus TFTClimb)
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste und Ton
(function () {
  'use strict';

  const stage = document.getElementById('spielflaeche');
  const data = window.TFT_ARCADE_CHAMPIONS, S = window.TFT_ARCADE_SHOP, A = window.Arcade;
  if (!stage || !data || !S || !A) return;
  const esc = A.esc;

  const SLOTS = 5, BENCH = 9, ROWS = 4, COLS = 7, REROLL = 2;
  const LEVEL = 10, LEVELS = [9, 10, 11];        // gewertet immer Level 10, im Training wählbar (11 nur über Augments)
  const START_COPIES = 3;                         // der Ziel-5-Koster steht schon auf 2 Sternen
  const OTHERS = [0.3, 0.6];                      // Gegner halten 30–60 % der anderen 5-Koster (spätes Spiel), von 1–4-Kostern bis zu 40 %
  const MAX_MS = 180000;                          // nach 3 Minuten ist die Runde vorbei
  const TEAM = 7;                                 // weitere Einheiten auf dem Board zu Beginn

  const champs = data.champions;
  const byId = Object.fromEntries(champs.map(c => [c.id, c]));
  const byCost = [1, 2, 3, 4, 5].map(k => champs.filter(c => c.cost === k));
  const rand = n => Math.floor(Math.random() * n);
  const coin = n => `<span class="kq-coin">${n}</span>`;
  const stars = n => '★'.repeat(n);
  const pct = x => `${x.toLocaleString('de-DE', { maximumFractionDigits: x < 10 ? 1 : 0 })} %`;
  const sec = ms => (ms / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const copiesOf = star => 3 ** (star - 1);
  const sellValue = (c, star) => star === 1 ? c.cost : c.cost * copiesOf(star) - (c.cost > 1 ? 1 : 0);

  let mode = 'training', state = 'start', level = LEVEL, trainLevel = LEVEL, pool = {}, shop = [], units = [], uidNext = 1, target = null;
  let rolls = 0, spent = 0, wrong = 0, startAt = 0, timer = null, raf = null, selected = null, drag = null, ghost = null, ui = {};
  const ranked = () => mode !== 'training';

  // ───────── Einheiten auf Board und Bank ─────────
  const unitAt = (at, pos) => units.find(u => u.at === at && u.pos === pos);
  const onBoard = () => units.filter(u => u.at === 'board').length;
  const freeBench = () => { for (let i = 0; i < BENCH; i++) if (!unitAt('bench', i)) return i; return -1; };
  const targetUnit = () => units.filter(u => u.id === target.id).sort((a, b) => b.star - a.star)[0];
  const targetCopies = () => units.filter(u => u.id === target.id).reduce((s, u) => s + copiesOf(u.star), 0);
  function add(id, star, at, pos) { const u = { uid: uidNext++, id, star, at, pos }; units.push(u); pool[id] -= copiesOf(star); return u; }

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

  // ───────── Aufbau: Ziel-5-Koster auf 2 Sternen, ein passendes Team auf dem Board, zwei Einheiten auf der Bank ─────────
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
    add(target.id, 2, 'board', 3 * COLS + 3);
    // Team: Champions mit gemeinsamem Trait zuerst, Kosten 3–5; Tanks und Kämpfer vorne, der Rest hinten
    const shares = c => c.traits.some(([n]) => target.traits.some(([m]) => m === n));
    const cand = A.shuffle(champs.filter(c => c.id !== target.id && c.cost >= 3));
    const team = [...cand.filter(shares), ...cand.filter(c => !shares(c))].slice(0, TEAM);
    const front = [1, 2, 3, 4, 5, 0, 6].map(i => i), back = [3 * COLS + 2, 3 * COLS + 4, 3 * COLS + 1, 3 * COLS + 5, 2 * COLS + 3, 2 * COLS + 2, 2 * COLS + 4];
    team.forEach(c => {
      const star = c.cost === 5 ? 1 : c.cost === 4 ? 1 + rand(2) : 2;
      const tank = /Tank|Kämpfer/.test(c.role || '');
      const pos = (tank ? front : back).find(p => !unitAt('board', p)) ?? [...front, ...back].find(p => !unitAt('board', p));
      if (pool[c.id] >= copiesOf(star)) add(c.id, star, 'board', pos);
    });
    A.shuffle(champs.filter(c => c.cost <= 3 && !units.some(u => u.id === c.id))).slice(0, 2).forEach((c, i) => add(c.id, 1, 'bench', i));
    roll();
  }

  // ───────── Startbildschirm ─────────
  function intro() {
    state = 'start';
    clearTimeout(timer); cancelAnimationFrame(raf);
    mode = A.currentMode();
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">Set ${esc(data.set)} · echte Shop-Chancen · ${ranked() ? `Level ${LEVEL}` : 'Training'}</p>
      <h2 class="game-title">3 Sterne auf einem 5-Koster</h2>
      <ol class="rs-preview" aria-hidden="true">${[1, 2, 3].map(() => `<li class="cost-5">${coin(5)}</li>`).join('')}</ol>
      <p class="game-text">${ranked()
        ? 'Dein 5-Koster steht schon auf 2 Sternen – roll auf Level 10, bis er 3 Sterne hat. Gold ist egal, nur die Zeit zählt: Die Uhr startet mit deiner ersten Aktion.'
        : 'Roll ohne Uhr, bis dein 5-Koster 3 Sterne hat. Das Ziel ist im Shop markiert, und du siehst die Chance auf eine Kopie im nächsten Shop.'}
        Tasten: <kbd>D</kbd> rollen, <kbd>1</kbd>–<kbd>5</kbd> kaufen, <kbd>E</kbd> verkaufen. Einheiten ziehst du zwischen Board und Bank hin und her.</p>
      ${ranked() ? '' : `<div class="rs-levels" role="group" aria-label="Level">${LEVELS.map(l => `<button class="rs-level${l === trainLevel ? ' is-on' : ''}" type="button" data-level="${l}">Level ${l}${l === 11 ? '<small>Augment</small>' : ''}</button>`).join('')}</div>`}
      <button class="btn btn-gold btn-lg" type="button" data-game-start>Los geht’s</button>
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
        <div class="hud-side"><span class="hud-pill">Zeit <b data-ts-clock>0,0</b></span></div>
        <span class="hud-pill hud-score">Rolls <b data-ts-rolls>0</b></span>
        <div class="hud-side cr-hud-right"><span class="hud-pill">Gold <b data-ts-spent>0</b></span></div>
      </div>
      <div class="ts-arena">
        <div class="ts-board" data-ts-board aria-label="Board">${hexes}</div>
        <aside class="ts-goal" aria-label="Ziel">
          <p class="rs-h">Ziel: 3 Sterne</p>
          <div class="ts-goal-pic cost-5"><img src="${A.asset(target.img)}" alt="" width="960" height="480"><span class="ts-goal-stars" data-ts-goal-stars></span></div>
          <b class="ts-goal-name">${esc(target.name)}</b>
          <ol class="ts-pips" data-ts-pips aria-label="Kopien">${Array.from({ length: 9 }, () => '<li></li>').join('')}</ol>
          <p class="ts-goal-info" data-ts-info></p>
        </aside>
      </div>
      <div class="ts-bench" aria-label="Bank">${Array.from({ length: BENCH }, (_, i) => `<div class="ts-slot" data-cell="bench:${i}"></div>`).join('')}</div>
      <p class="game-msg" data-ts-msg aria-live="polite"></p>
      <div class="ts-shopbar" data-sellzone>
        <div class="ts-shop-top"><span class="ts-lvl">Level <b>${level}</b></span><p class="rs-odds" data-ts-odds></p><span class="ts-sellhint" data-ts-sellhint>Hierher ziehen = verkaufen</span></div>
        <div class="ts-shop-main">
          <button class="rs-btn is-roll" type="button" data-ts-roll aria-keyshortcuts="D"><span>Neu rollen</span><small>${coin(REROLL)} · D</small></button>
          <ul class="rs-shop" data-ts-shop></ul>
        </div>
      </div>
    </div>`;
    const q = s => stage.querySelector(s);
    ui = { clock: q('[data-ts-clock]'), rolls: q('[data-ts-rolls]'), spent: q('[data-ts-spent]'), board: q('[data-ts-board]'), pips: [...stage.querySelectorAll('[data-ts-pips] li')],
      goalStars: q('[data-ts-goal-stars]'), info: q('[data-ts-info]'), msg: q('[data-ts-msg]'), shop: q('[data-ts-shop]'), odds: q('[data-ts-odds]'), roll: q('[data-ts-roll]'), bar: q('[data-sellzone]') };
    ui.roll.addEventListener('click', reroll);
    ui.shop.addEventListener('click', e => { const b = e.target.closest('[data-slot]'); if (b && !drag) buy(Number(b.dataset.slot)); });
    stage.querySelectorAll('[data-cell]').forEach(cell => cell.addEventListener('click', () => { if (selected != null && !cell.querySelector('[data-uid]')) moveTo(selected, cellOf(cell)); }));
    msg(`Dein Ziel: <b>${esc(target.name)}</b> – 6 Kopien fehlen noch.${ranked() ? ' Die Uhr startet mit dem ersten Rollen oder Kaufen.' : ''}`);
    render(true);
  }

  // Uhr (gewertet): startet mit der ersten Aktion, nach 3 Minuten ist Schluss
  function begin() {
    if (startAt) return;
    startAt = performance.now();
    if (!ranked()) return;
    timer = setTimeout(() => finish(false), MAX_MS);
    const step = () => { if (state !== 'play') return; ui.clock.textContent = sec(performance.now() - startAt); raf = requestAnimationFrame(step); };
    step();
  }

  function msg(html, cls) { ui.msg.innerHTML = html; ui.msg.className = 'game-msg' + (cls ? ' ' + cls : ''); }

  // ───────── Aktionen ─────────
  function reroll() {
    if (state !== 'play') return;
    begin();
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
    if (free < 0 && ones < 2) { msg('Die Bank ist voll – verkauf eine Einheit oder stell sie aufs Board.', 'is-bad'); A.sound('bad'); return; }
    begin();
    shop[i] = null; spent += c.cost;
    if (id !== target.id) wrong++;
    units.push({ uid: uidNext++, id, star: 1, at: 'bench', pos: free });
    const up = merge(id);
    if (id === target.id) {
      msg(up === 3 ? `<b>${esc(c.name)}</b> hat 3 Sterne!` : `${esc(c.name)}: ${targetCopies()}/9 Kopien.`, 'is-ok');
      A.sound(up === 3 ? 'win' : 'ok');
    } else { msg(`${esc(c.name)} gekauft${up ? ` – jetzt ${up} Sterne` : ''}.`); A.sound('click'); }
    render(false);
    if (targetUnit() && targetUnit().star >= 3) finish(true);
  }

  function sell(uid) {
    if (state !== 'play') return;
    const u = units.find(x => x.uid === uid);
    if (!u) return;
    const c = byId[u.id], v = sellValue(c, u.star);
    units = units.filter(x => x !== u);
    pool[u.id] += copiesOf(u.star); spent -= v;
    if (selected === uid) selected = null;
    msg(`${esc(c.name)} ${stars(u.star)} verkauft: +${v} Gold.${u.id === target.id ? ' Ups – das war dein Ziel!' : ''}`, u.id === target.id ? 'is-bad' : '');
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
    if (to.at === 'board' && u.at === 'bench' && !other && onBoard() >= level) { msg(`Das Board ist voll (${level}/${level}) – tausch eine Einheit oder stell eine auf die Bank.`, 'is-bad'); A.sound('bad'); return render(false); }
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
      else { selected = d.uid; render(false); msg('Ausgewählt – klick auf ein Feld zum Verschieben oder drück E zum Verkaufen.'); }
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

  // ───────── Darstellung ─────────
  const unitHtml = u => {
    const c = byId[u.id];
    return `<div class="ts-unit cost-${c.cost}${u.id === target.id ? ' is-goal' : ''}${selected === u.uid ? ' is-sel' : ''}" data-uid="${u.uid}" title="${esc(c.name)} ${stars(u.star)} – ziehen zum Verschieben, aufs Shop-Feld zum Verkaufen (+${sellValue(c, u.star)} Gold)">
      <span class="ts-unit-in"><img src="${A.asset(c.img)}" alt="" width="960" height="480" draggable="false"></span>
      <span class="ts-stars s${u.star}">${stars(u.star)}</span><span class="ts-name">${esc(c.name)}</span></div>`;
  };
  function card(c, i) {
    const goal = c.id === target.id;
    return `<li><button class="rs-card cost-${c.cost}${goal && !ranked() ? ' is-target' : ''}" type="button" data-slot="${i}" aria-label="${esc(c.name)}, ${c.cost} Gold" aria-keyshortcuts="${i + 1}">
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
    ui.info.innerHTML = `${have}/9 Kopien · noch <b>${inPool}</b> im Pool${ranked() ? '' : `<br>Chance pro Shop: <b>${pct(hitChance())}</b>`}`;
    ui.shop.className = 'rs-shop' + (fresh ? ' is-deal' : '');
    ui.shop.innerHTML = shop.map((id, i) => id ? card(byId[id], i) : '<li class="rs-sold" aria-hidden="true"></li>').join('');
    ui.odds.innerHTML = S.odds[level - 1].map((o, k) => `<span class="cost-${k + 1}"><i></i>${o} %</span>`).join('');
  }

  // ───────── Auswertung ─────────
  function finish(won) {
    if (state !== 'play') return;
    state = 'done';
    clearTimeout(timer); cancelAnimationFrame(raf);
    const ms = startAt ? performance.now() - startAt : 0, secs = Math.round(ms / 100) / 10;
    if (ranked()) ui.clock.textContent = sec(ms);
    setTimeout(() => A.finishRound({
      ...(won && ranked() ? { value: secs } : { valueText: won ? `${sec(ms)} s` : `${targetCopies()}/9` }),
      title: won ? (secs < 40 ? 'Was für ein Highroll!' : secs < 75 ? 'Drei Sterne!' : 'Geschafft – endlich!') : 'Zeit abgelaufen',
      lines: [
        `${target.name} ${won ? 'auf 3 Sternen' : `${targetCopies()}/9 Kopien`} · Level ${level}`,
        `${rolls} Rolls · ${spent} Gold ausgegeben${wrong ? ` · ${wrong} ${wrong === 1 ? 'Fehlkauf' : 'Fehlkäufe'}` : ''}`,
      ],
      shareText: won ? `3-Star Roll Simulator: ${target.name} in ${sec(ms)} Sekunden und ${rolls} Rolls auf 3 Sternen – schaffst du’s schneller? #TFTArcade` : `3-Star Roll Simulator: ${target.name} nach ${rolls} Rolls nur ${targetCopies()}/9 – Pech gehabt! #TFTArcade`,
      onReplay: start,
    }), won ? 900 : 0);
  }

  document.addEventListener('arcade:restart', start);
  document.addEventListener('arcade:mode', intro);
  document.addEventListener('keydown', e => {
    if (stage.hidden || e.altKey || e.ctrlKey || e.metaKey || A.typing(e)) return;
    const k = e.key.toLowerCase();
    if (state === 'play' && k === 'd') { e.preventDefault(); reroll(); }
    else if (state === 'play' && /^[1-5]$/.test(k)) { e.preventDefault(); buy(Number(k) - 1); }
    else if (state === 'play' && k === 'e') {
      // E verkauft die ausgewählte Einheit – sonst die unter dem Mauszeiger
      const hover = stage.querySelector('[data-uid]:hover');
      const uid = selected != null ? selected : hover ? Number(hover.dataset.uid) : null;
      if (uid != null) { e.preventDefault(); sell(uid); }
    }
    else if (state === 'play' && e.key === 'Escape' && selected != null) { selected = null; render(false); }
    else if (state === 'start' && e.key === 'Enter' && !e.target.closest('button, a, dialog')) { e.preventDefault(); start(); }
  });

  intro();
})();
