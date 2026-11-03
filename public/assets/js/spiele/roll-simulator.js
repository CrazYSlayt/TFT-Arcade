// TFT Arcade – Roll Simulator: Shop rollen, Champions kaufen, Kopien sammeln – mit den echten Shop-Chancen und dem geteilten Pool des Sets.
// Modi: „Training“ (Rolldown ohne Uhr, mit Trefferchance) · „Rolldown“ (gewertet: Reroll-Carry auf drei Sterne, 45 Sekunden)
//       „Shop-Speed“ (gewertet: 30 Sekunden kostenlos rollen und nur die Ziel-Champions kaufen)
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js) und window.TFT_ARCADE_SHOP (daten/shop.js – Odds, Kopien pro Champion, XP aus TFTClimb)
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste und Ton
(function () {
  'use strict';

  const stage = document.getElementById('spielflaeche');
  const data = window.TFT_ARCADE_CHAMPIONS, S = window.TFT_ARCADE_SHOP, A = window.Arcade;
  if (!stage || !data || !S || !A) return;
  const esc = A.esc;

  const SLOTS = 5, BENCH = 9, REROLL = 2, XP_COST = 4, XP_GAIN = 4, MAX_LEVEL = 10;
  const ROLL_MS = 45000, SPEED_MS = 30000;
  // Rolldown-Szenarien: Reroll-Carry dieser Kosten auf diesem Level, Startgold. Du hast den Carry schon zweimal auf 2 Sternen (6 Kopien).
  const SCENARIOS = [{ cost: 1, level: 5, gold: 50 }, { cost: 2, level: 6, gold: 60 }, { cost: 3, level: 7, gold: 70 }];
  const START_COPIES = 6, SPEED_LEVEL = 8, SPEED_TARGETS = 4;
  // Punkte: Rolldown je neue Kopie des Carrys / der Nebenziele, Bonus für 3 bzw. 2 Sterne, Restgold und Restzeit zählen nur mit 3 Sternen
  const P_CARRY = 40, P_SIDE = 20, P_THREE = 200, P_TWO = 40, P_GOLD = 2, P_SEC = 5;
  const P_HIT = 10, P_WRONG = 5, P_MISS = 3;   // Shop-Speed

  const champs = data.champions;
  const byId = Object.fromEntries(champs.map(c => [c.id, c]));
  const byCost = [1, 2, 3, 4, 5].map(k => champs.filter(c => c.cost === k));
  const rand = n => Math.floor(Math.random() * n);
  const pick = list => list[rand(list.length)];
  const coin = n => `<span class="kq-coin">${n}</span>`;
  const stars = n => '★'.repeat(n);
  const pct = x => `${x.toLocaleString('de-DE', { maximumFractionDigits: x < 10 ? 1 : 0 })} %`;
  const secs = ms => Math.ceil(ms / 1000);

  let mode = 'training', state = 'start', level = 1, xp = 0, gold = 0, own = {}, order = [], pool = {}, shop = [], comp = [], targets = new Set();
  let rolls = 0, buys = 0, wrong = 0, missed = 0, hits = 0, startAt = 0, limit = 0, timer = null, raf = null, ui = {}, sc = null;
  const timed = () => mode !== 'training';
  const speed = () => mode === 'speed';

  // ───────── Einheiten: Kopien → Sterne (3 Kopien = 2 Sterne, 9 = 3 Sterne) ─────────
  function unitsOf(n) {
    const out = [];
    for (let i = 0; i < Math.floor(n / 9); i++) out.push(3);
    for (let i = 0; i < Math.floor(n % 9 / 3); i++) out.push(2);
    for (let i = 0; i < n % 3; i++) out.push(1);
    return out;
  }
  // Bank: alle Einheiten außer der besten jedes Comp-Champions (die steht auf dem Board)
  function benchUnits(extra) {
    const list = [];
    order.forEach(id => {
      const n = (own[id] || 0) + (extra === id ? 1 : 0);
      const u = unitsOf(n);
      (comp.includes(id) ? u.slice(1) : u).forEach(star => list.push({ id, star }));
    });
    if (extra && !order.includes(extra)) list.push({ id: extra, star: 1 });
    return list;
  }
  const sellValue = (c, star) => star === 1 ? c.cost : c.cost * 3 ** (star - 1) - (c.cost > 1 ? 1 : 0);
  const best = id => unitsOf(own[id] || 0)[0] || 0;

  // ───────── Shop: Kostenstufe nach den Odds des Levels, Champion nach den Kopien, die noch im Pool sind ─────────
  function drawSlot() {
    const odds = S.odds[level - 1];
    const left = byCost.map(list => list.reduce((s, c) => s + pool[c.id], 0));
    let w = odds.map((o, k) => left[k] > 0 ? o : 0), sum = w.reduce((a, b) => a + b, 0);
    if (!sum) return null;
    let r = Math.random() * sum, k = 0;
    while (r >= w[k]) r -= w[k++];
    let x = Math.random() * left[k];
    for (const c of byCost[k]) { x -= pool[c.id]; if (x < 0) { pool[c.id]--; return c.id; } }
    return null;
  }
  function roll() {
    shop.forEach(id => { if (id) pool[id]++; });   // nicht gekaufte Champions gehen zurück in den Pool
    shop = Array.from({ length: SLOTS }, drawSlot);
  }
  // Chance auf mindestens eine Kopie eines Champions im nächsten Shop
  function hitChance(id) {
    const c = byId[id], k = c.cost - 1, all = byCost[k].reduce((s, x) => s + pool[x.id], 0);
    if (!all || !pool[id]) return 0;
    const p = S.odds[level - 1][k] / 100 * pool[id] / all;
    return (1 - (1 - p) ** SLOTS) * 100;
  }

  // ───────── Aufbau einer Runde ─────────
  function setup() {
    level = 1; xp = 0; gold = 0; own = {}; order = []; shop = []; comp = []; targets = new Set();
    rolls = 0; buys = 0; wrong = 0; missed = 0; hits = 0;
    pool = Object.fromEntries(champs.map(c => [c.id, S.bag[c.cost - 1]]));
    if (speed()) {
      // vier Ziel-Champions, die sich einen Trait teilen (wie eine echte Comp), Kosten 1–4
      level = SPEED_LEVEL;
      const cand = champs.filter(c => c.cost <= 4);
      const trait = pick(data.traits.filter(t => t.champs.filter(id => byId[id] && byId[id].cost <= 4).length >= 3));
      const core = A.shuffle(trait.champs.filter(id => byId[id] && byId[id].cost <= 4)).slice(0, SPEED_TARGETS);
      const fill = A.shuffle(cand.filter(c => !core.includes(c.id))).map(c => c.id);
      comp = [...core, ...fill].slice(0, SPEED_TARGETS).sort((a, b) => byId[a].cost - byId[b].cost);
      comp.forEach(id => targets.add(id));
      roll();
      return;
    }
    sc = pick(SCENARIOS);
    level = sc.level; gold = sc.gold;
    const carry = pick(byCost[sc.cost - 1].filter(c => c.traits.length >= 2));
    const shares = c => c.traits.some(([n]) => carry.traits.some(([m]) => m === n));
    const sideCand = A.shuffle(champs.filter(c => c.id !== carry.id && c.cost >= sc.cost && c.cost <= sc.cost + 1 && S.odds[level - 1][c.cost - 1] > 0));
    const sides = [...sideCand.filter(shares), ...sideCand.filter(c => !shares(c))].slice(0, 2);
    comp = [carry.id, ...sides.map(c => c.id)];
    // Gegner halten schon Kopien: vom Carry 0–3, von den Nebenzielen 0–2, von allen anderen bis zu 40 %
    champs.forEach(c => {
      const bag = S.bag[c.cost - 1];
      const taken = c.id === carry.id ? rand(4) : comp.includes(c.id) ? rand(3) : Math.round(bag * Math.random() * 0.4);
      pool[c.id] = bag - taken;
    });
    const give = (id, n) => { own[id] = (own[id] || 0) + n; pool[id] -= n; if (!order.includes(id)) order.push(id); };
    give(carry.id, START_COPIES);
    sides.forEach(c => give(c.id, 1));
    // zwei Einheiten auf der Bank, die du verkaufen kannst
    A.shuffle(champs.filter(c => !comp.includes(c.id) && c.cost <= sc.cost + 1)).slice(0, 2).forEach(c => give(c.id, 1));
    roll();
  }

  // ───────── Startbildschirm ─────────
  function intro() {
    state = 'start';
    clearTimeout(timer); cancelAnimationFrame(raf);
    mode = A.currentMode();
    const texts = {
      training: 'Dein Carry steht schon zweimal auf 2 Sternen – bring ihn auf 3 Sterne, bevor das Gold alle ist. Ohne Uhr, dafür siehst du nach jedem Shop deine Trefferchance.',
      rolldown: `Bring deinen Reroll-Carry auf 3 Sterne – mit festem Gold und nur ${ROLL_MS / 1000} Sekunden. Gegner halten schon Kopien, die Bank hat nur ${BENCH} Plätze. Restgold und Restzeit geben Bonuspunkte.`,
      speed: `${SPEED_MS / 1000} Sekunden, Rollen kostet nichts: Kauf nur die vier Ziel-Champions. Falsche Käufe und übersehene Ziele kosten Punkte.`,
    };
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">Set ${esc(data.set)} · echte Shop-Chancen</p>
      <h2 class="game-title">${speed() ? 'Shop-Speed' : 'Rolldown'}</h2>
      <ol class="rs-preview" aria-hidden="true">${[1, 2, 3, 4, 5].map(k => `<li class="cost-${k}">${coin(k)}</li>`).join('')}</ol>
      <p class="game-text">${texts[mode] || texts.training} Tasten: <kbd>D</kbd> rollen${speed() ? '' : ', <kbd>F</kbd> XP kaufen'}, <kbd>1</kbd>–<kbd>5</kbd> kaufen.</p>
      <button class="btn btn-gold btn-lg" type="button" data-game-start>Los geht’s</button>
    </div>`;
    stage.querySelector('[data-game-start]').addEventListener('click', start);
  }

  function start() {
    clearTimeout(timer); cancelAnimationFrame(raf);
    mode = A.currentMode();
    setup();
    state = 'play';
    champs.forEach(c => { if (comp.includes(c.id)) { const im = new Image(); im.src = A.asset(c.img); } });
    stage.innerHTML = `<div class="rs${speed() ? ' is-speed' : ''}">
      <div class="hud">
        <div class="hud-side">
          ${speed() ? '<span class="hud-pill">Treffer <b data-rs-hits>0</b></span>' : '<span class="hud-pill rs-gold">Gold <b data-rs-gold></b></span><span class="hud-pill">Level <b data-rs-level></b><i data-rs-xp></i></span>'}
        </div>
        <span class="hud-pill hud-score">${timed() ? 'Zeit' : 'Rolls'} <b data-rs-clock>${timed() ? secs(speed() ? SPEED_MS : ROLL_MS) : 0}</b></span>
        <div class="hud-side cr-hud-right"><span class="hud-pill">Punkte <b data-rs-score>0</b></span></div>
      </div>
      ${timed() ? '<div class="hud-bar" aria-hidden="true"><span data-rs-bar></span></div>' : ''}
      <section class="rs-goal" aria-label="${speed() ? 'Ziel-Champions' : 'Dein Board'}">
        <p class="rs-h">${speed() ? 'Kauf nur diese:' : 'Dein Board'}</p>
        <ul class="rs-comp" data-rs-comp></ul>
        <p class="rs-info" data-rs-info></p>
      </section>
      ${speed() ? '' : `<section class="rs-bench-wrap" aria-label="Bank"><p class="rs-h">Bank <span data-rs-bench-n></span></p><ul class="rs-bench" data-rs-bench></ul></section>`}
      <p class="game-msg" data-rs-msg aria-live="polite"></p>
      <div class="rs-shopbar">
        <div class="rs-actions">
          ${speed() ? '' : `<button class="rs-btn" type="button" data-rs-xp-btn aria-keyshortcuts="F"><span>XP kaufen</span><small>${coin(XP_COST)} · F</small></button>`}
          <button class="rs-btn is-roll" type="button" data-rs-roll aria-keyshortcuts="D"><span>Neu rollen</span><small>${speed() ? 'gratis' : coin(REROLL)} · D</small></button>
        </div>
        <ul class="rs-shop" data-rs-shop></ul>
      </div>
      <div class="rs-foot">
        <p class="rs-odds" data-rs-odds></p>
        ${speed() ? '' : '<button class="btn btn-ghost" type="button" data-rs-done>Fertig</button>'}
      </div>
    </div>`;
    const q = s => stage.querySelector(s);
    ui = { gold: q('[data-rs-gold]'), level: q('[data-rs-level]'), xp: q('[data-rs-xp]'), clock: q('[data-rs-clock]'), score: q('[data-rs-score]'), hits: q('[data-rs-hits]'),
      bar: q('[data-rs-bar]'), comp: q('[data-rs-comp]'), info: q('[data-rs-info]'), bench: q('[data-rs-bench]'), benchN: q('[data-rs-bench-n]'), msg: q('[data-rs-msg]'),
      shop: q('[data-rs-shop]'), odds: q('[data-rs-odds]'), roll: q('[data-rs-roll]'), xpBtn: q('[data-rs-xp-btn]'), done: q('[data-rs-done]') };
    ui.roll.addEventListener('click', reroll);
    if (ui.xpBtn) ui.xpBtn.addEventListener('click', buyXp);
    if (ui.done) ui.done.addEventListener('click', () => finish('done'));
    ui.shop.addEventListener('click', e => { const b = e.target.closest('[data-slot]'); if (b) buy(Number(b.dataset.slot)); });
    if (ui.bench) ui.bench.addEventListener('click', e => { const b = e.target.closest('[data-sell]'); if (b) sell(b.dataset.sell, Number(b.dataset.star)); });
    msg(speed() ? 'Los! Kauf die Ziel-Champions, roll weiter mit D.' : `Dein Carry: <b>${esc(byId[comp[0]].name)}</b> – noch ${9 - own[comp[0]]} Kopien bis 3 Sterne.`);
    render(true);
    if (timed()) { startAt = performance.now(); limit = speed() ? SPEED_MS : ROLL_MS; timer = setTimeout(() => finish('time'), limit); tick(); }
  }

  function tick() {
    cancelAnimationFrame(raf);
    let lastSec = null;
    const step = () => {
      if (state !== 'play') return;
      const left = Math.max(0, limit - (performance.now() - startAt)), s = secs(left);
      ui.bar.style.transform = `scaleX(${left / limit})`;
      ui.bar.parentElement.classList.toggle('is-hurry', left < 10000);
      if (s !== lastSec) { ui.clock.textContent = s; if (s <= 5 && s > 0 && lastSec !== null) A.sound('tick'); lastSec = s; }
      if (left > 0) raf = requestAnimationFrame(step);
    };
    step();
  }

  function msg(html, cls) { ui.msg.innerHTML = html; ui.msg.className = 'game-msg' + (cls ? ' ' + cls : ''); }

  // ───────── Aktionen ─────────
  function reroll() {
    if (state !== 'play') return;
    if (!speed() && gold < REROLL) { msg('Nicht genug Gold zum Rollen – verkauf etwas von der Bank oder klick auf „Fertig“.', 'is-bad'); A.sound('bad'); return; }
    if (speed()) {
      const left = shop.filter(id => id && targets.has(id)).length;
      if (left) { missed += left; msg(`${left} Ziel-Champion${left > 1 ? 's' : ''} übersehen (−${left * P_MISS}).`, 'is-bad'); }
    } else gold -= REROLL;
    rolls++;
    roll();
    A.sound('flip');
    render(true);
  }

  function buyXp() {
    if (state !== 'play' || speed()) return;
    if (level >= MAX_LEVEL) { msg('Höchstes Level erreicht.'); return; }
    if (gold < XP_COST) { msg('Nicht genug Gold für XP.', 'is-bad'); A.sound('bad'); return; }
    gold -= XP_COST; xp += XP_GAIN;
    while (level < MAX_LEVEL && xp >= S.xp[level - 1]) { xp -= S.xp[level - 1]; level++; msg(`Level ${level}! Die Shop-Chancen haben sich verändert.`, 'is-ok'); A.sound('ok'); }
    if (level >= MAX_LEVEL) xp = 0;
    A.sound('click');
    render(false);
  }

  function buy(i) {
    if (state !== 'play') return;
    const id = shop[i];
    if (!id) return;
    const c = byId[id];
    if (speed()) {
      shop[i] = null; pool[id]++;
      if (targets.has(id)) { hits++; A.sound('ok'); msg(`+${P_HIT} – ${esc(c.name)}`, 'is-ok'); }
      else { wrong++; A.sound('bad'); msg(`${esc(c.name)} gehört nicht dazu (−${P_WRONG}).`, 'is-bad'); }
      render(false);
      return;
    }
    if (gold < c.cost) { msg(`${esc(c.name)} kostet ${c.cost} Gold – du hast nur ${gold}.`, 'is-bad'); A.sound('bad'); return; }
    if (benchUnits(id).length > BENCH) { msg('Die Bank ist voll – verkauf zuerst eine Einheit.', 'is-bad'); A.sound('bad'); return; }
    const before = best(id);
    gold -= c.cost; shop[i] = null; buys++;
    own[id] = (own[id] || 0) + 1;
    if (!order.includes(id)) order.push(id);
    if (!comp.includes(id)) wrong++;
    const now = best(id);
    if (now > before && now >= 2) { msg(`${esc(c.name)} hat jetzt ${now} Sterne!`, 'is-ok'); A.sound(now === 3 ? 'win' : 'ok'); }
    else { A.sound('click'); if (comp.includes(id)) msg(`${esc(c.name)}: ${Math.min(own[id], 9)}/9 Kopien.`); }
    render(false);
    if (goalsDone()) finish('goal');
  }

  function sell(id, star) {
    if (state !== 'play' || speed() || comp.includes(id)) return;
    const c = byId[id], n = 3 ** (star - 1), v = sellValue(c, star);
    own[id] -= n; pool[id] += n; gold += v;
    if (!own[id]) order = order.filter(x => x !== id);
    msg(`${esc(c.name)} verkauft: +${v} Gold.`);
    A.sound('click');
    render(false);
  }

  const goalsDone = () => !speed() && own[comp[0]] >= 9 && comp.slice(1).every(id => own[id] >= 3);

  // ───────── Punkte ─────────
  function points(timeLeft) {
    if (speed()) return Math.max(0, hits * P_HIT - wrong * P_WRONG - missed * P_MISS);
    const carry = Math.min(own[comp[0]] || 0, 9), three = carry >= 9;
    let p = (carry - START_COPIES) * P_CARRY;
    comp.slice(1).forEach(id => { const n = Math.min(own[id] || 0, 3); p += (n - 1) * P_SIDE + (n >= 3 ? P_TWO : 0); });
    if (three) p += P_THREE + gold * P_GOLD + (timeLeft ? Math.floor(timeLeft / 1000) * P_SEC : 0);
    return Math.max(0, p);
  }

  // ───────── Darstellung ─────────
  function card(c, i) {
    const tgt = comp.includes(c.id);
    const label = `${c.name}, ${c.cost} Gold${tgt ? ' – Ziel' : ''}`;
    return `<li><button class="rs-card cost-${c.cost}${speed() ? '' : tgt ? ' is-target' : ''}" type="button" data-slot="${i}" aria-label="${esc(label)}" aria-keyshortcuts="${i + 1}">
      <span class="rs-pic"><img src="${A.asset(c.img)}" alt="" width="960" height="480"></span>
      <span class="rs-row"><b class="rs-name">${esc(c.name)}</b><span class="rs-cost">${coin(c.cost)}</span></span>
      <span class="rs-traits">${c.traits.map(([n, icon]) => `<span>${icon ? `<img src="${A.asset(icon)}" alt="">` : ''}${esc(n)}</span>`).join('')}</span>
      ${!speed() && own[c.id] ? `<span class="rs-have">${c.id === comp[0] ? `${Math.min(own[c.id], 9)}/9` : tgt ? `${Math.min(own[c.id], 3)}/3` : `${own[c.id]}×`}</span>` : ''}
    </button></li>`;
  }

  function render(fresh) {
    const odds = S.odds[level - 1];
    if (ui.gold) { ui.gold.textContent = gold; ui.level.textContent = level; ui.xp.textContent = level >= MAX_LEVEL ? '' : `${xp}/${S.xp[level - 1]} XP`; }
    if (ui.hits) ui.hits.textContent = hits;
    if (!timed()) ui.clock.textContent = rolls;
    ui.score.textContent = points(timed() ? limit - (performance.now() - startAt) : 0).toLocaleString('de-DE');
    ui.comp.innerHTML = comp.map((id, n) => {
      const c = byId[id], have = own[id] || 0, goal = speed() ? 0 : n === 0 ? 9 : 3, st = best(id);
      return `<li class="rs-unit cost-${c.cost}${!speed() && have >= goal ? ' is-done' : ''}${n === 0 && !speed() ? ' is-carry' : ''}">
        <span class="rs-unit-pic"><img src="${A.asset(c.img)}" alt="" width="960" height="480">${st ? `<span class="rs-stars s${st}">${stars(st)}</span>` : ''}</span>
        <span class="rs-unit-name">${esc(c.name)}</span>
        ${speed() ? `<span class="rs-unit-sub">${coin(c.cost)}</span>` : `<span class="rs-unit-sub">${Math.min(have, goal)}/${goal}${n === 0 ? ' · Carry' : ''}</span>`}
      </li>`;
    }).join('');
    if (speed()) ui.info.textContent = `Treffer ${hits} · Fehlkäufe ${wrong} · übersehen ${missed}`;
    else {
      const carry = comp[0], left = pool[carry] + shop.filter(x => x === carry).length;
      ui.info.innerHTML = `${esc(byId[carry].name)}: noch <b>${left}</b> im Pool${mode === 'training' ? ` · Chance pro Shop auf mind. eine Kopie: <b>${pct(hitChance(carry))}</b>` : ''}`;
    }
    if (ui.bench) {
      const units = benchUnits();
      ui.benchN.textContent = `${units.length}/${BENCH}`;
      ui.bench.innerHTML = Array.from({ length: BENCH }, (_, i) => {
        const u = units[i];
        if (!u) return '<li class="rs-slot is-empty"></li>';
        const c = byId[u.id], locked = comp.includes(u.id);
        return `<li class="rs-slot"><button class="rs-bunit cost-${c.cost}" type="button" data-sell="${u.id}" data-star="${u.star}" ${locked ? 'disabled title="Gehört zu deinem Board"' : `title="Verkaufen: +${sellValue(c, u.star)} Gold"`} aria-label="${esc(c.name)} ${u.star} Sterne${locked ? '' : ` – verkaufen für ${sellValue(c, u.star)} Gold`}">
          <img src="${A.asset(c.img)}" alt="" width="960" height="480"><span class="rs-stars s${u.star}">${stars(u.star)}</span>${locked ? '' : `<span class="rs-sell">+${sellValue(c, u.star)}</span>`}</button></li>`;
      }).join('');
    }
    ui.shop.className = 'rs-shop' + (fresh ? ' is-deal' : '');
    ui.shop.innerHTML = shop.map((id, i) => id ? card(byId[id], i) : '<li class="rs-sold" aria-hidden="true"></li>').join('');
    ui.odds.innerHTML = `<span>Level ${level}:</span>${odds.map((o, k) => `<span class="cost-${k + 1}"><i></i>${o} %</span>`).join('')}`;
    if (ui.xpBtn) ui.xpBtn.disabled = level >= MAX_LEVEL;
    ui.roll.classList.toggle('is-poor', !speed() && gold < REROLL);
  }

  // ───────── Auswertung ─────────
  function finish(why) {
    if (state !== 'play') return;
    const left = timed() ? Math.max(0, limit - (performance.now() - startAt)) : 0;
    state = 'done';
    clearTimeout(timer); cancelAnimationFrame(raf);
    const score = points(why === 'goal' ? left : 0);
    const reason = why === 'time' ? 'Zeit abgelaufen' : why === 'goal' ? 'Alle Ziele erreicht' : 'Rolldown beendet';
    if (speed()) {
      A.finishRound({
        value: score,
        title: hits >= 15 && !wrong ? 'Adlerauge!' : hits >= 10 ? 'Flinke Finger!' : 'Da geht noch was!',
        lines: [`${hits} Treffer in ${rolls} Shops · ${wrong} ${wrong === 1 ? 'Fehlkauf' : 'Fehlkäufe'} · ${missed} übersehen`],
        shareText: `Shop-Speed: ${score} Punkte, ${hits} Treffer in ${SPEED_MS / 1000} Sekunden – schaffst du mehr? #TFTArcade`,
        onReplay: start,
      });
      return;
    }
    const carry = byId[comp[0]], three = own[carry.id] >= 9;
    const sides = comp.slice(1).map(id => `${byId[id].name} ${best(id) >= 2 ? '2★' : `${own[id] || 0}/3`}`).join(', ');
    A.finishRound({
      value: score,
      title: three ? (goalsDone() ? 'Perfekter Rolldown!' : 'Drei Sterne!') : best(carry.id) >= 2 && own[carry.id] >= 8 ? 'So knapp!' : 'Kein Highroll heute …',
      lines: [`${reason} · ${carry.name}: ${Math.min(own[carry.id], 9)}/9 Kopien${three ? ' – 3 Sterne!' : ''}`, `Nebenziele: ${sides}`, `${rolls} Rolls · ${gold} Gold übrig${wrong ? ` · ${wrong} Käufe außerhalb des Boards` : ''}`],
      shareText: `Rolldown: ${score} Punkte${three ? ` – ${carry.name} auf 3 Sternen` : ''} in ${rolls} Rolls. Schaffst du’s? #TFTArcade`,
      onReplay: start,
    });
  }

  document.addEventListener('arcade:restart', start);
  document.addEventListener('arcade:mode', intro);
  document.addEventListener('keydown', e => {
    if (stage.hidden || e.altKey || e.ctrlKey || e.metaKey || A.typing(e)) return;
    const k = e.key.toLowerCase();
    if (state === 'play' && k === 'd') { e.preventDefault(); reroll(); }
    else if (state === 'play' && k === 'f') { e.preventDefault(); buyXp(); }
    else if (state === 'play' && /^[1-5]$/.test(k)) { e.preventDefault(); buy(Number(k) - 1); }
    else if (state === 'start' && e.key === 'Enter' && !e.target.closest('button, a, dialog')) { e.preventDefault(); start(); }
  });

  intro();
})();
