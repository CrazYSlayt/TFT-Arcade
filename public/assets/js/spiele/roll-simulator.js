// TFT Arcade – Rolldown Simulator und 100 Gold Challenge (gleiche Technik, Aufbau nach dem Spiel, Optik der Arcade).
// Trait-Leiste links, Board (4 × 7 Sechsecke) und Bank (9 Plätze) in der Mitte, Ziel rechts, unten die Shop-Leiste:
// links „Buy XP“ und „Reroll“ übereinander, darüber Level mit XP, Odds und Gold; beim Ziehen einer Einheit wird sie zu „Sell for Xg“.
// Spiele und Modi:
//   Rolldown Simulator (roll-simulator): „free“ – Level, Gold und Ziel-Comp frei wählbar, ohne Wertung ·
//                                        „rush“ – Level 10, leeres Board, rollen bis ein 5-Koster 3 Sterne hat (Bestzeit)
//   100 Gold Challenge (100-gold-challenge): „ranked“ – zufällige Comp aus der TFTClimb-Tierlist, 100 Gold, Level je nach Spielstil (Punkte) ·
//                                            „training“ – Comp frei wählbar, ohne Wertung
// Daten: daten/champions.js (Champions, Traits), daten/shop.js (Odds, Kopien, XP), daten/comps.js (Comps der TFTClimb-Tierlist)
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste und Ton
(function () {
  'use strict';

  const stage = document.getElementById('spielflaeche');
  const data = window.TFT_ARCADE_CHAMPIONS, S = window.TFT_ARCADE_SHOP, C = window.TFT_ARCADE_COMPS, A = window.Arcade;
  if (!stage || !data || !S || !A) return;
  const esc = A.esc, GAME = stage.dataset.game;

  const SLOTS = 5, BENCH = 9, ROWS = 4, COLS = 7, REROLL = 2, XP_COST = 4, XP_GAIN = 4, MAX_LEVEL = 10, COPIES = 9;
  const GOLD_START = 100;                         // 100 Gold Challenge
  const FREE_LEVELS = [3, 4, 5, 6, 7, 8, 9, 10], FREE_GOLD = [50, 100, 200, Infinity];
  // Level, auf dem eine Comp ihren Rolldown macht (Spielstil aus der Tierlist)
  const STYLE_LEVEL = { '1-Cost Reroll': 5, '2-Cost Reroll': 6, '3-Cost Reroll': 7, '4-Cost Fast 8': 8, 'Fast 9': 9, 'Lose Streak': 7 };
  // Punkte der 100 Gold Challenge je Einheit der Comp nach Sternen (Carry zählt doppelt), dazu 1 Punkt je übrigem Gold
  const STAR_POINTS = [0, 10, 40, 150];

  const champs = data.champions;
  const byId = Object.fromEntries(champs.map(c => [c.id, c]));
  const byCost = [1, 2, 3, 4, 5].map(k => champs.filter(c => c.cost === k));
  const traitBy = Object.fromEntries((data.traits || []).map(t => [t.name, t]));
  const comps = ((C && C.comps) || []).filter(c => c.units.every(id => byId[id]));
  const coin = n => `<span class="kq-coin">${n}</span>`;
  const stars = n => '★'.repeat(n);
  const sec = ms => (ms / 1000).toFixed(1);
  const goldText = g => g === Infinity ? '∞' : String(g);
  const copiesOf = star => 3 ** (star - 1);
  const sellValue = (c, star) => star === 1 ? c.cost : c.cost * copiesOf(star) - (c.cost > 1 ? 1 : 0);

  let mode = '', state = 'start', level = 8, xp = 0, gold = 0, pool = {}, shop = [], units = [], uidNext = 1;
  let target = null, comp = null, rolls = 0, spent = 0, startAt = 0, timer = null, raf = null, selected = null, drag = null, ghost = null, ui = {};
  let choice = { level: 8, gold: 100, comp: '' };   // Auswahl im freien Modus bzw. Training
  const mouse = { x: -1, y: -1 };
  let goalClosed = !!A.store.get('rd_ziel_zu', false);   // Ziel-Kasten rechts eingeklappt (merkt sich die Wahl)
  const isRush = () => mode === 'rush';
  const isGold = () => GAME === '100-gold-challenge';
  const ranked = () => A.isRanked(mode);

  // ───────── Einheiten auf Board und Bank ─────────
  const unitAt = (at, pos) => units.find(u => u.at === at && u.pos === pos);
  const onBoard = () => units.filter(u => u.at === 'board');
  const freeBench = () => { for (let i = 0; i < BENCH; i++) if (!unitAt('bench', i)) return i; return -1; };
  const bestStar = id => units.filter(u => u.id === id).reduce((s, u) => Math.max(s, u.star), 0);
  const copiesOwned = id => units.filter(u => u.id === id).reduce((s, u) => s + copiesOf(u.star), 0);

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

  // ───────── Traits auf dem Board (jeder Champion zählt einmal) ─────────
  function activeTraits() {
    const count = {};
    [...new Set(onBoard().map(u => u.id))].forEach(id => byId[id].traits.forEach(([n]) => { count[n] = (count[n] || 0) + 1; }));
    return Object.entries(count).map(([name, k]) => {
      const t = traitBy[name] || { bp: [1] }, bp = t.bp.length ? t.bp : [1], reached = bp.filter(x => k >= x).length;
      const tier = !reached ? 'is-off' : bp.length === 1 ? 'is-unique' : reached === bp.length ? (bp.length >= 4 ? 'is-prism' : 'is-gold') : reached >= 2 ? 'is-silver' : 'is-bronze';
      return { name, icon: t.icon, k, bp, reached, tier };
    }).sort((a, b) => (b.reached > 0) - (a.reached > 0) || b.reached - a.reached || b.k - a.k || a.name.localeCompare(b.name, 'en'));
  }

  // ───────── Punkte der 100 Gold Challenge ─────────
  // nur Einheiten auf dem Board zählen – wie im Spiel kämpft die Bank nicht mit
  const boardStar = id => onBoard().filter(u => u.id === id).reduce((s, u) => Math.max(s, u.star), 0);
  const compPoints = () => comp ? comp.units.reduce((s, id) => s + STAR_POINTS[Math.min(3, boardStar(id))] * (id === comp.carry ? 2 : 1), 0) : 0;
  const score = () => compPoints() + (gold === Infinity ? 0 : gold);

  // ───────── Aufbau einer Runde ─────────
  function setup() {
    units = []; shop = []; uidNext = 1; selected = null; rolls = 0; spent = 0; xp = 0; target = null; comp = null;
    if (isRush()) {
      level = MAX_LEVEL; gold = Infinity;
      target = A.shuffle(byCost[4])[0];
    } else if (isGold()) {
      comp = (!ranked() && comps.find(c => c.key === choice.comp)) || A.shuffle(comps)[0] || null;
      level = comp ? STYLE_LEVEL[comp.style] || 8 : 8; gold = GOLD_START;
    } else {
      comp = comps.find(c => c.key === choice.comp) || null;
      level = choice.level; gold = choice.gold;
    }
    // Pool: im 3-Star-Modus halten die Gegner 30–60 % der anderen 5-Koster und nichts vom Ziel, sonst bis zu 35 % von jedem Champion
    pool = {};
    champs.forEach(c => {
      const bag = S.bag[c.cost - 1];
      const share = isRush() ? (c.id === target.id ? 0 : c.cost === 5 ? 0.3 + Math.random() * 0.3 : Math.random() * 0.4) : Math.random() * 0.35;
      pool[c.id] = bag - Math.round(bag * share);
    });
    roll();
  }

  // ───────── Startbildschirm ─────────
  function compOptions(sel) {
    return comps.map(c => `<option value="${esc(c.key)}"${c.key === sel ? ' selected' : ''}>${esc(c.name)} · ${esc(c.tier)} · ${esc(c.style)}</option>`).join('');
  }
  function intro() {
    state = 'start';
    clearTimeout(timer); cancelAnimationFrame(raf);
    mode = A.currentMode();
    let kicker, title, text, controls = '';
    if (isRush()) {
      kicker = `Set ${esc(data.set)} · real shop odds · Level ${MAX_LEVEL}`;
      title = '3 stars on a 5-cost';
      text = 'Empty board, empty bench, one 5-cost target: roll on level 10 until you own all nine copies. Gold doesn’t matter, only your time does – the clock starts with the round.';
    } else if (isGold()) {
      kicker = `Set ${esc(data.set)} · comps from the TFTClimb tier list`;
      title = ranked() ? '100 gold. One comp.' : 'Pick a comp and roll';
      text = ranked()
        ? 'You get a random comp from the TFTClimb tier list, 100 gold and the level that comp usually rolls on. Buy, level and sell to hit as many two- and three-star units as you can – only units on your board score, and every unused gold counts as a point.'
        : 'Pick any comp from the tier list and practice its rolldown with 100 gold. Nothing here counts for the leaderboard.';
      if (!ranked()) controls = `<label class="rd-pick">Comp <select data-pick-comp>${compOptions(choice.comp || (comps[0] && comps[0].key))}</select></label>`;
    } else {
      kicker = `Set ${esc(data.set)} · real shop odds`;
      title = 'Free rolldown';
      text = 'Pick your level and gold, and optionally a comp from the TFTClimb tier list to roll for. Buy XP, reroll, sell – just like in a real game. Nothing here counts for the leaderboard.';
      controls = `<div class="rd-choose">
        <div class="rs-levels" role="group" aria-label="Level">${FREE_LEVELS.map(l => `<button class="rs-level${l === choice.level ? ' is-on' : ''}" type="button" data-level="${l}">Lvl ${l}</button>`).join('')}</div>
        <div class="rs-levels" role="group" aria-label="Gold">${FREE_GOLD.map(g => `<button class="rs-level${g === choice.gold ? ' is-on' : ''}" type="button" data-gold="${g}">${goldText(g)} gold</button>`).join('')}</div>
        <label class="rd-pick">Target comp <select data-pick-comp><option value="">No target</option>${compOptions(choice.comp)}</select></label>
      </div>`;
    }
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">${kicker}</p>
      <h2 class="game-title">${title}</h2>
      <p class="game-text">${text} Keys: <kbd>D</kbd> reroll, <kbd>F</kbd> buy XP, <kbd>1</kbd>–<kbd>5</kbd> buy, <kbd>E</kbd> sell the unit under your cursor.</p>
      ${controls}
      <button class="btn btn-gold btn-lg" type="button" data-game-start>Let’s go</button>
    </div>`;
    stage.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => { choice.level = Number(b.dataset.level); intro(); }));
    stage.querySelectorAll('[data-gold]').forEach(b => b.addEventListener('click', () => { choice.gold = Number(b.dataset.gold); intro(); }));
    const sel = stage.querySelector('[data-pick-comp]');
    if (sel) { if (isGold() && !choice.comp) choice.comp = sel.value; sel.addEventListener('change', () => { choice.comp = sel.value; }); }
    stage.querySelector('[data-game-start]').addEventListener('click', start);
  }

  function start() {
    clearTimeout(timer); cancelAnimationFrame(raf);
    mode = A.currentMode();
    setup();
    state = 'play';
    const hexes = Array.from({ length: ROWS }, (_, r) => `<div class="ts-row${r % 2 ? ' is-odd' : ''}">${Array.from({ length: COLS }, (_, c) => `<div class="ts-hex" data-cell="board:${r * COLS + c}"></div>`).join('')}</div>`).join('');
    // Spielansicht: Arena mit schrägem Board, Bank vorne, Traits links, Ziel rechts (einklappbar), Leiste oben, Shop unten
    stage.innerHTML = `<div class="rd">
      <div class="rd-arena">
        <div class="hud rd-stagebar">
          <span class="hud-pill">Time <b data-rd-clock>0.0</b></span>
          <span class="hud-pill hud-score">${isGold() ? 'Points' : 'Rolls'} <b data-rd-score>0</b></span>
          <span class="hud-pill">${isGold() ? 'Rolls' : 'Gold spent'} <b data-rd-side>0</b></span>
        </div>
        <ol class="rd-traits" data-rd-traits aria-label="Active traits"></ol>
        <div class="rd-floor">
          <div class="ts-board rd-board" data-rd-board aria-label="Board">${hexes}</div>
          <div class="ts-bench" aria-label="Bench">${Array.from({ length: BENCH }, (_, i) => `<div class="ts-slot" data-cell="bench:${i}"></div>`).join('')}</div>
        </div>
        <aside class="rd-goalbox${goalClosed ? ' is-closed' : ''}" aria-label="Target">
          <button class="rd-goal-tog" type="button" data-rd-goaltog aria-expanded="${!goalClosed}">${isRush() ? 'Target' : comp ? 'Target comp' : 'Your rolldown'}<span aria-hidden="true">▾</span></button>
          <div class="rd-goal" data-rd-goal></div>
        </aside>
        <p class="game-msg" data-rd-msg aria-live="polite"></p>
      </div>
      <div class="rd-shop" data-sellzone>
        <div class="rd-shop-top">
          <span class="rd-lvl">Lvl. <b data-rd-level></b><span class="rd-xp"><i data-rd-xpbar></i></span><small data-rd-xp></small></span>
          <p class="rs-odds" data-rd-odds></p>
          <span class="rd-gold"><span class="kq-coin" aria-hidden="true"></span><b data-rd-gold></b></span>
          <span class="rd-tolevel" data-rd-tolevel></span>
          ${isRush() ? '' : '<button class="btn btn-sm btn-ghost rd-done" type="button" data-rd-done>Done</button>'}
        </div>
        <div class="rd-shop-main">
          <div class="rd-actions">
            <button class="rd-btn" type="button" data-rd-xp-btn aria-keyshortcuts="F"><span>Buy XP</span><small>${coin(XP_COST)}</small><i aria-hidden="true">F</i></button>
            <button class="rd-btn is-roll" type="button" data-rd-roll aria-keyshortcuts="D"><span>Reroll</span><small>${coin(REROLL)}</small><i aria-hidden="true">D</i></button>
          </div>
          <ul class="rs-shop rd-cards" data-rd-shop></ul>
          <div class="rd-sell" aria-hidden="true"><span>Sell for <b data-rd-sell>0</b>g</span></div>
        </div>
      </div>
    </div>`;
    const q = s => stage.querySelector(s);
    ui = { clock: q('[data-rd-clock]'), score: q('[data-rd-score]'), side: q('[data-rd-side]'), traits: q('[data-rd-traits]'), board: q('[data-rd-board]'), goal: q('[data-rd-goal]'),
      msg: q('[data-rd-msg]'), level: q('[data-rd-level]'), xp: q('[data-rd-xp]'), xpbar: q('[data-rd-xpbar]'), odds: q('[data-rd-odds]'), gold: q('[data-rd-gold]'), tolevel: q('[data-rd-tolevel]'),
      shop: q('[data-rd-shop]'), bar: q('[data-sellzone]'), sell: q('[data-rd-sell]'), roll: q('[data-rd-roll]'), xpBtn: q('[data-rd-xp-btn]'), done: q('[data-rd-done]') };
    ui.roll.addEventListener('click', reroll);
    ui.xpBtn.addEventListener('click', buyXp);
    if (ui.done) ui.done.addEventListener('click', () => finish());
    q('[data-rd-goaltog]').addEventListener('click', e => {
      goalClosed = !goalClosed;
      A.store.set('rd_ziel_zu', goalClosed);
      e.currentTarget.parentNode.classList.toggle('is-closed', goalClosed);
      e.currentTarget.setAttribute('aria-expanded', String(!goalClosed));
    });
    ui.shop.addEventListener('click', e => { const b = e.target.closest('[data-slot]'); if (b && !drag) buy(Number(b.dataset.slot)); });
    stage.querySelectorAll('[data-cell]').forEach(cell => cell.addEventListener('click', () => { if (selected != null && !cell.querySelector('[data-uid]')) moveTo(selected, cellOf(cell)); }));
    msg(isRush() ? `Your target: <b>${esc(target.name)}</b> – you need all ${COPIES} copies.`
      : comp ? `Target comp: <b>${esc(comp.name)}</b> – two-star as many of its units as you can.` : 'Roll, buy and level – there’s no target this time.');
    render(true);
    startAt = performance.now();
    const step = () => { if (state !== 'play') return; ui.clock.textContent = sec(performance.now() - startAt); raf = requestAnimationFrame(step); };
    step();
  }

  function msg(html, cls) { ui.msg.innerHTML = html; ui.msg.className = 'game-msg' + (cls ? ' ' + cls : ''); }
  const pay = n => { if (gold !== Infinity) gold -= n; spent += n; };

  // ───────── Aktionen ─────────
  function reroll() {
    if (state !== 'play') return;
    if (gold < REROLL) { msg('Not enough gold to reroll – sell a unit or click Done.', 'is-bad'); A.sound('bad'); return; }
    pay(REROLL); rolls++;
    roll();
    A.sound('flip');
    render(true);
  }

  function buyXp() {
    if (state !== 'play') return;
    if (level >= MAX_LEVEL) { msg('You’re already at the highest level.'); return; }
    if (gold < XP_COST) { msg('Not enough gold for XP.', 'is-bad'); A.sound('bad'); return; }
    pay(XP_COST); xp += XP_GAIN;
    let up = false;
    while (level < MAX_LEVEL && xp >= S.xp[level - 1]) { xp -= S.xp[level - 1]; level++; up = true; }
    if (level >= MAX_LEVEL) xp = 0;
    if (up) { msg(`Level ${level}! Your board holds ${level} units now, and the shop odds changed.`, 'is-ok'); A.sound('ok'); } else A.sound('click');
    render(false);
  }

  function buy(i) {
    if (state !== 'play') return;
    const id = shop[i];
    if (!id) return;
    const c = byId[id], free = freeBench(), ones = units.filter(u => u.id === id && u.star === 1).length;
    if (gold < c.cost) { msg(`${esc(c.name)} costs ${c.cost} gold – you only have ${goldText(gold)}.`, 'is-bad'); A.sound('bad'); return; }
    if (free < 0 && ones < 2) { msg('Your bench is full – sell a unit or move one to the board.', 'is-bad'); A.sound('bad'); return; }
    shop[i] = null; pay(c.cost);
    units.push({ uid: uidNext++, id, star: 1, at: 'bench', pos: free });
    const up = merge(id);
    const goal = isRush() ? id === target.id : comp && comp.units.includes(id);
    if (up) msg(`<b>${esc(c.name)}</b> is ${up} stars!`, 'is-ok');
    else if (isRush() && goal) msg(`${esc(c.name)}: ${copiesOwned(id)}/${COPIES} copies.`, 'is-ok');
    else msg(`${esc(c.name)} bought.`);
    A.sound(up === 3 ? 'win' : goal || up ? 'ok' : 'click');
    render(false);
    if (isRush() && bestStar(target.id) >= 3) finish();
  }

  function sell(uid) {
    if (state !== 'play') return;
    const u = units.find(x => x.uid === uid);
    if (!u) return;
    const c = byId[u.id], v = sellValue(c, u.star);
    units = units.filter(x => x !== u);
    pool[u.id] += copiesOf(u.star);
    if (gold !== Infinity) gold += v;
    spent -= v;
    if (selected === uid) selected = null;
    const oops = isRush() ? u.id === target.id : comp && comp.units.includes(u.id);
    msg(`${esc(c.name)} ${stars(u.star)} sold: +${v} gold.${oops ? ' Careful – that one was part of your target!' : ''}`, oops ? 'is-bad' : '');
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
    if (to.at === 'board' && u.at === 'bench' && !other && onBoard().length >= level) { msg(`Your board is full (${level}/${level}) – level up, swap a unit or move one to the bench.`, 'is-bad'); A.sound('bad'); return render(false); }
    if (other) { other.at = u.at; other.pos = u.pos; }
    u.at = to.at; u.pos = to.pos;
    msg('');
    A.sound('click');
    render(false);
  }

  // ───────── Ziehen & Ablegen (Maus und Touch) ─────────
  // Mit der Maus wird nur gezogen – ein Fehlklick wählt nichts aus und markiert keinen Text. Auf dem Handy wählt ein Tippen aus, ein zweites Tippen verschiebt.
  stage.addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-uid]');
    if (!el || state !== 'play' || e.button > 0) return;
    e.preventDefault();
    const sel = window.getSelection && window.getSelection();
    if (sel && sel.rangeCount) sel.removeAllRanges();
    drag = { uid: Number(el.dataset.uid), x: e.clientX, y: e.clientY, el, moved: false, touch: e.pointerType !== 'mouse' };
  });
  stage.addEventListener('dragstart', e => { if (state === 'play') e.preventDefault(); });
  document.addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!drag) return;
    // Maustaste außerhalb des Fensters losgelassen: Ziehen abbrechen statt hängen zu bleiben
    if (!drag.touch && e.buttons === 0) { endDrag(e, true); return; }
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.moved = true;
      ghost = drag.el.cloneNode(true);
      ghost.className += ' ts-ghost';
      document.body.appendChild(ghost);
      drag.el.classList.add('is-dragging');
      const u = units.find(x => x.uid === drag.uid);
      ui.sell.textContent = u ? sellValue(byId[u.id], u.star) : 0;
      ui.bar.classList.add('is-sell');
      ui.board.classList.add('is-dragging');
      stage.querySelector('.rd').classList.add('is-drag');   // Figuren lassen den Mauszeiger durch, damit das Feld dahinter das Ziel ist
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
    if (ui.bar) ui.bar.classList.remove('is-sell');
    if (ui.board) ui.board.classList.remove('is-dragging');
    stage.querySelectorAll('.is-over, .is-dragging, .is-drag').forEach(x => x.classList.remove('is-over', 'is-dragging', 'is-drag'));
    if (cancel || state !== 'play') return;
    if (!d.moved) { // Klick: mit der Maus ohne Wirkung (Fehlklick), auf dem Handy auswählen bzw. tauschen
      if (!d.touch) { if (selected != null) { selected = null; render(false); } return; }
      if (selected === d.uid) { selected = null; render(false); }
      else if (selected != null) { const u = units.find(x => x.uid === d.uid); moveTo(selected, { at: u.at, pos: u.pos }); }
      else { selected = d.uid; render(false); msg('Selected – tap a hex to move it, or drag it onto the shop to sell it.'); }
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
  const isGoalUnit = id => isRush() ? id === target.id : !!(comp && comp.units.includes(id));
  const unitHtml = u => {
    const c = byId[u.id];
    return `<div class="ts-unit cost-${c.cost}${isGoalUnit(u.id) ? ' is-goal' : ''}${selected === u.uid ? ' is-sel' : ''}" data-uid="${u.uid}" title="${esc(c.name)} ${stars(u.star)} – drag to move, press E or drop on the shop to sell (+${sellValue(c, u.star)} gold)">
      <span class="ts-unit-in"><img src="${A.asset(c.img)}" alt="" width="960" height="480" draggable="false"></span>
      <span class="ts-stars s${u.star}">${stars(u.star)}</span><span class="ts-name">${esc(c.name)}</span></div>`;
  };
  // Shop-Karte wie im Spiel: Bild über die ganze Karte, Traits oben links, Name und Kosten in der Leiste unten
  function card(c, i) {
    const goal = isGoalUnit(c.id), have = copiesOwned(c.id);
    return `<li><button class="rd-card cost-${c.cost}${goal && !ranked() ? ' is-target' : ''}" type="button" data-slot="${i}" aria-label="${esc(c.name)}, ${c.cost} gold" aria-keyshortcuts="${i + 1}">
      <img src="${A.asset(c.img)}" alt="" width="960" height="480" draggable="false">
      <span class="rd-card-traits">${c.traits.map(([n, icon]) => `<span>${icon ? `<img src="${A.asset(icon)}" alt="">` : ''}${esc(n)}</span>`).join('')}</span>
      ${have ? `<span class="rd-card-have">${have}×</span>` : ''}
      <span class="rd-card-bar"><b>${esc(c.name)}</b><span>${coin(c.cost)}</span></span>
    </button></li>`;
  }
  function traitsHtml() {
    const list = activeTraits();
    if (!list.length) return '<li class="rd-trait is-empty">Put units on the board to activate traits.</li>';
    return list.slice(0, 12).map(t => `<li class="rd-trait ${t.tier}">
      <span class="rd-trait-hex">${t.icon ? `<img src="${A.asset(t.icon)}" alt="">` : ''}</span>
      <b class="rd-trait-n">${t.k}</b>
      <span class="rd-trait-tx"><span class="rd-trait-name">${esc(t.name)}</span><span class="rd-trait-bp">${t.bp.map((x, i) => `<i class="${i < t.reached ? 'is-on' : ''}">${x}</i>`).join('<em>›</em>')}</span></span>
    </li>`).join('');
  }
  function goalHtml() {
    if (isRush()) {
      const have = copiesOwned(target.id), best = bestStar(target.id), inPool = Math.max(0, pool[target.id]) + shop.filter(x => x === target.id).length;
      return `<p class="rs-h">Target: 3 stars</p>
        <div class="ts-goal-pic cost-5"><img src="${A.asset(target.img)}" alt="" width="960" height="480"><span class="ts-goal-stars s${best}">${best ? stars(best) : ''}</span></div>
        <b class="ts-goal-name">${esc(target.name)}</b>
        <ol class="ts-pips" aria-label="Copies">${Array.from({ length: COPIES }, (_, i) => `<li class="${i < have ? 'is-on' : ''}"></li>`).join('')}</ol>
        <p class="ts-goal-info">${have}/${COPIES} copies · <b>${inPool}</b> left in the pool</p>`;
    }
    if (!comp) {
      return `<p class="rs-h">Your rolldown</p><p class="ts-goal-info">Level <b>${level}</b> · <b>${rolls}</b> rolls · <b>${spent}</b> gold spent</p>
        <p class="ts-goal-info">Want a goal? Pick a target comp on the start screen.</p>`;
    }
    // Sterne auf dem Board zählen; was nur auf der Bank steht, erscheint blass mit Hinweis
    return `<p class="rs-h">Target comp</p>
      <b class="rd-comp-name"><span class="rd-tier t-${esc(comp.tier)}">${esc(comp.tier)}</span>${esc(comp.name)}</b>
      <small class="rd-comp-style">${esc(comp.style)}</small>
      <ul class="rd-comp-units">${comp.units.map(id => {
        const c = byId[id], b = boardStar(id), s = bestStar(id), bench = !b && s;
        return `<li class="${b ? 'is-have is-board' : bench ? 'is-bench' : ''}"${bench ? ' title="On your bench – put it on the board to count"' : ''}>
          <span class="rd-cu-pic cost-${c.cost}"><img src="${A.asset(c.img)}" alt="" width="960" height="480"></span>
          <span class="rd-cu-name">${esc(c.name)}${id === comp.carry ? ' <em>carry</em>' : ''}</span>
          <span class="rd-cu-stars s${b || s}">${b || s ? stars(b || s) : '–'}</span></li>`;
      }).join('')}</ul>
      ${isGold() ? '<p class="ts-goal-info">Only units on your board score.</p>' : ''}`;
  }

  function render(fresh) {
    stage.querySelectorAll('[data-cell]').forEach(cell => {
      const { at, pos } = cellOf(cell), u = unitAt(at, pos);
      cell.innerHTML = u ? unitHtml(u) : '';
      cell.classList.toggle('is-filled', !!u);
    });
    ui.board.dataset.count = `${onBoard().length}/${level}`;
    ui.traits.innerHTML = traitsHtml();
    ui.goal.innerHTML = goalHtml();
    ui.score.textContent = isGold() ? score().toLocaleString('en-US') : rolls;
    ui.side.textContent = isGold() ? rolls : spent;
    ui.level.textContent = level;
    const need = level < MAX_LEVEL ? S.xp[level - 1] : 0;
    ui.xp.textContent = level < MAX_LEVEL ? `${xp}/${need}` : 'max';
    ui.xpbar.style.width = level < MAX_LEVEL ? `${Math.round(xp / need * 100)}%` : '100%';
    ui.gold.textContent = goldText(gold);
    // wie im Spiel: was das nächste Level kostet und wie viel Gold danach übrig bleibt
    const cost = level < MAX_LEVEL ? Math.ceil((need - xp) / XP_GAIN) * XP_COST : 0;
    ui.tolevel.innerHTML = level < MAX_LEVEL && gold !== Infinity ? `<span class="kq-coin" aria-hidden="true"></span><b class="${gold >= cost ? 'is-ok' : 'is-bad'}">${cost}</b> to level${gold >= cost ? ` · ${gold} › ${gold - cost}` : ''}` : '';
    ui.odds.innerHTML = S.odds[level - 1].map((o, k) => `<span class="cost-${k + 1}"><i></i>${o}%</span>`).join('');
    ui.shop.className = 'rs-shop rd-cards' + (fresh ? ' is-deal' : '');
    ui.shop.innerHTML = shop.map((id, i) => id ? card(byId[id], i) : '<li class="rs-sold" aria-hidden="true"></li>').join('');
    ui.xpBtn.disabled = level >= MAX_LEVEL;
    ui.roll.classList.toggle('is-poor', gold < REROLL);
    ui.xpBtn.classList.toggle('is-poor', gold < XP_COST);
  }

  // ───────── Auswertung ─────────
  const climbLink = () => comp ? { path: `/en/comps/${comp.key}`, lead: `Want to play ${comp.name}?`, text: 'See the full comp on TFTClimb' } : null;
  function finish() {
    if (state !== 'play') return;
    state = 'done';
    cancelAnimationFrame(raf);
    const ms = performance.now() - startAt, secs = Math.round(ms / 100) / 10;
    ui.clock.textContent = sec(ms);
    const unitLine = comp ? comp.units.map(id => `${byId[id].name} ${boardStar(id) ? stars(boardStar(id)) : '–'}`).join(', ') : '';
    const twos = comp ? comp.units.filter(id => boardStar(id) >= 2).length : 0;
    let o;
    if (isRush()) {
      o = {
        ...(ranked() ? { value: secs } : { valueText: `${sec(ms)} s` }),
        title: secs < 60 ? 'What a highroll!' : secs < 100 ? 'Three stars!' : 'Finally!',
        lines: [`${target.name} is 3 stars · level ${level}`, `${rolls} rolls · ${spent} gold spent`],
        shareText: `TFT Rolldown Simulator: ${target.name} 3 stars in ${sec(ms)} seconds and ${rolls} rolls – can you beat that? #TFTArcade`,
      };
    } else if (isGold()) {
      const pts = score();
      o = {
        ...(ranked() ? { value: pts } : { valueText: `${pts.toLocaleString('en-US')} pts` }),
        title: twos >= comp.units.length - 1 ? 'Rolldown of the year!' : twos >= comp.units.length / 2 ? 'Strong board!' : twos ? 'Not bad at all!' : 'The shop wasn’t kind today …',
        lines: [`${comp.name}: ${twos} of ${comp.units.length} units two-star or better`, unitLine, `${rolls} rolls · ${gold} gold left · level ${level}`],
        shareText: `100 Gold Challenge: ${pts.toLocaleString('en-US')} points with ${comp.name} – can you roll better? #TFTArcade`,
        climb: climbLink(),
      };
    } else {
      o = {
        valueText: `${rolls} rolls`,
        title: 'Rolldown done',
        lines: [`Level ${level} · ${spent} gold spent · ${onBoard().length} units on the board`, ...(comp ? [`${comp.name}: ${twos} of ${comp.units.length} units two-star or better`, unitLine] : [])],
        shareText: `I just practiced a rolldown in the TFT Rolldown Simulator – ${rolls} rolls on level ${level}. #TFTArcade`,
        ...(comp ? { climb: climbLink() } : {}),
      };
    }
    timer = setTimeout(() => A.finishRound({ ...o, onReplay: start }), isRush() ? 900 : 200);
  }

  document.addEventListener('arcade:restart', start);
  document.addEventListener('arcade:mode', intro);
  document.addEventListener('keydown', e => {
    if (stage.hidden || e.altKey || e.ctrlKey || e.metaKey || A.typing(e)) return;
    const k = e.key.toLowerCase();
    if (state === 'play' && k === 'd') { e.preventDefault(); reroll(); }
    else if (state === 'play' && k === 'f') { e.preventDefault(); buyXp(); }
    else if (state === 'play' && /^[1-5]$/.test(k)) { e.preventDefault(); buy(Number(k) - 1); }
    else if (state === 'play' && k === 'e') {
      // E verkauft die Einheit unter dem Mauszeiger – ohne Maus die ausgewählte (Klick)
      const under = hovered(), uid = under != null ? under : selected;
      if (uid != null) { e.preventDefault(); sell(uid); }
    }
    else if (state === 'play' && e.key === 'Escape' && selected != null) { selected = null; render(false); }
    else if (state === 'start' && e.key === 'Enter' && !e.target.closest('button, a, dialog, select')) { e.preventDefault(); start(); }
  });

  intro();
})();
