// TFT Arcade – Challenge „Comp-Memory“: Board mit fünf bis acht Champions und aktiven Traits einprägen, dann nachbauen.
// Acht Runden, drei Herzen. Modi: „Training“ (mehr Zeit, ohne Herzen, ohne Wertung) und „Gewertet“. Die Reihenfolge zählt nicht.
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js – champions + traits, erzeugt mit tools/champions.js)
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste, Highscore-Eintrag, Ton und Helfer
(function () {
  'use strict';

  const stage = document.getElementById('spielflaeche');
  const data = window.TFT_ARCADE_CHAMPIONS, A = window.Arcade;
  if (!stage || !data || !data.traits || !A) return;

  const SIZES = [5, 5, 6, 6, 7, 7, 8, 8];   // Champions pro Board, Runde für Runde
  const ROUNDS = SIZES.length, HEARTS = 3;
  const MAX_MISS = 1;                       // mehr fehlende Champions kosten ein Herz
  const MS_PER_CHAMP = 1050, MS_FASTER = 45, TRAINING_PER_CHAMP = 1700;   // Merkzeit je Champion (gewertet: jede Runde etwas weniger)
  const RECALL_MS = 18000;                  // gewertet: Zeit zum Nachbauen, danach wird mit dem geprüft, was steht
  const P_CHAMP = 10, P_PERFECT = 30, P_SPEED = 20, SPEED_MS = RECALL_MS;
  const esc = A.esc;
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.4C.9 8 3.1 4 7 4c2.1 0 3.6 1.1 5 2.9C13.4 5.1 14.9 4 17 4c3.9 0 6.1 4 4.6 7.6C19.5 16.4 12 21 12 21z"/></svg>';
  const secWord = s => s === 1 ? '1 second' : `${s} seconds`;
  const champ = Object.fromEntries(data.champions.map(c => [c.id, c]));
  const traitOf = Object.fromEntries(data.traits.map(t => [t.name, t]));

  let state = 'start', round = 0, score = 0, hearts = HEARTS, board = [], options = [], picks = [];
  let totals = { right: 0, all: 0, perfect: 0 }, raf = null, timer = null, recallAt = 0, ui = {};

  const training = () => !A.isRanked(A.currentMode());
  const showMs = () => SIZES[round] * (training() ? TRAINING_PER_CHAMP : MS_PER_CHAMP - MS_FASTER * round);

  // ───────── Board bauen: ein Kern-Trait, dann Champions, die Traits mit dem Board teilen ─────────
  function makeBoard(size) {
    const core = A.shuffle(data.traits.filter(t => t.bp.length >= 2 && t.champs.length >= 3))[0];
    const chosen = A.shuffle(core.champs.filter(id => champ[id])).slice(0, Math.min(core.champs.length, Math.ceil(size / 2) + 1));
    while (chosen.length < size) {
      const shared = new Set(chosen.flatMap(id => champ[id].traits.map(([n]) => n)));
      const near = data.champions.filter(c => !chosen.includes(c.id) && c.traits.some(([n]) => shared.has(n)));
      const rest = data.champions.filter(c => !chosen.includes(c.id));
      chosen.push(A.shuffle(near.length ? near : rest)[0].id);
    }
    return chosen.map(id => champ[id]).sort((a, b) => a.cost - b.cost);
  }
  // Auswahl: Board + gleich viele „Fallen“, bevorzugt mit gemeinsamem Trait
  function makeOptions(b) {
    const ids = b.map(c => c.id), shared = new Set(b.flatMap(c => c.traits.map(([n]) => n)));
    const others = A.shuffle(data.champions.filter(c => !ids.includes(c.id)));
    const near = others.filter(c => c.traits.some(([n]) => shared.has(n)));
    const extra = [...near, ...others.filter(c => !near.includes(c))].slice(0, b.length);
    return A.shuffle(b.concat(extra));
  }

  // aktive Traits eines Boards: Anzahl, erreichte Stufe (Bronze/Silber/Gold …) – sortiert nach Stufe und Anzahl
  function activeTraits(list) {
    const count = {};
    list.forEach(c => c.traits.forEach(([n]) => { count[n] = (count[n] || 0) + 1; }));
    return Object.entries(count).map(([n, k]) => {
      const t = traitOf[n], bp = t ? t.bp : [1], level = bp.filter(x => k >= x).length;
      return { name: n, icon: t && t.icon, k, level, next: bp.find(x => x > k), max: bp.length };
    }).filter(x => x.level > 0).sort((a, b) => b.level - a.level || b.k - a.k || a.name.localeCompare(b.name, 'en'));
  }
  const tier = x => x.max === 1 ? 'is-unique' : x.level >= x.max ? 'is-gold' : x.level >= 2 ? 'is-silver' : 'is-bronze';
  const traitChips = list => activeTraits(list).map(x => `<li class="cm-trait ${tier(x)}">${x.icon ? `<img src="${A.asset(x.icon)}" alt="">` : ''}<b>${x.k}</b>${esc(x.name)}</li>`).join('')
    || '<li class="cm-trait is-empty">No active traits yet</li>';

  const hex = (c, extra = '') => `<span class="cm-hex cost-${c.cost}"><span class="cm-hex-in"><img src="${A.asset(c.img)}" alt=""></span></span>${extra}<span class="cm-name">${esc(c.name)}</span>`;

  // ───────── Startbildschirm ─────────
  function intro() {
    stop();
    state = 'start';
    const t = training();
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">${t ? 'Training · unranked' : `Ranked · ${ROUNDS} rounds · ${HEARTS} hearts`}</p>
      <h2 class="game-title">Comp Memory</h2>
      <ol class="cm-preview" aria-hidden="true">${[1, 2, 3, 4, 5].map(n => `<li class="cost-${n}"></li>`).join('')}</ol>
      <p class="game-text">${t
        ? 'Take your time: you get longer to memorize, and mistakes don’t cost hearts.'
        : `Memorize the board: champions and active traits. Then rebuild it from memory in ${RECALL_MS / 1000} seconds. The board grows from ${SIZES[0]} to ${SIZES[ROUNDS - 1]} champions; miss more than ${MAX_MISS === 1 ? 'one' : MAX_MISS} and you lose a heart.`}</p>
      <button class="btn btn-gold btn-lg" type="button" data-game-start>Let’s go</button>
    </div>`;
    stage.querySelector('[data-game-start]').addEventListener('click', start);
  }

  function stop() {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
  }

  // ───────── Spiel ─────────
  function start() {
    stop();
    round = 0; score = 0; hearts = HEARTS; totals = { right: 0, all: 0, perfect: 0 };
    state = 'play';
    stage.innerHTML = `<div class="sm cm">
      <div class="hud">
        <div class="hud-side">
          <span class="hud-pill">Round <b data-cm-round>1</b><i>/ ${ROUNDS}</i></span>
          <span class="hud-hearts" data-cm-hearts aria-label="${HEARTS} hearts"${training() ? ' hidden' : ''}>${heart.repeat(HEARTS)}</span>
        </div>
        <span class="hud-pill hud-score">Points <b data-cm-score>0</b></span>
        <div class="hud-side"></div>
      </div>
      <div class="hud-bar" aria-hidden="true"><span data-cm-timer></span></div>
      <div class="sm-head">
        <h2 class="sm-title" data-cm-title>Memorize this board!</h2>
        <p class="sm-sub" data-cm-sub aria-live="polite"></p>
      </div>
      <div class="cm-board">
        <ul class="cm-traits" data-cm-traits aria-label="Active traits"></ul>
        <ol class="cm-hexes" data-cm-hexes aria-label="Board"></ol>
      </div>
      <div class="cm-options" data-cm-options role="group" aria-label="Champions to choose from"></div>
      <div class="sm-cta">
        <button class="btn btn-gold sm-action" type="button" data-cm-action disabled></button>
        <p class="sm-hint" data-cm-hint></p>
      </div>
    </div>`;
    const q = s => stage.querySelector(s);
    ui = { round: q('[data-cm-round]'), hearts: q('[data-cm-hearts]'), score: q('[data-cm-score]'), timer: q('[data-cm-timer]'),
      title: q('[data-cm-title]'), sub: q('[data-cm-sub]'), traits: q('[data-cm-traits]'), hexes: q('[data-cm-hexes]'),
      options: q('[data-cm-options]'), action: q('[data-cm-action]'), hint: q('[data-cm-hint]') };
    ui.action.addEventListener('click', () => { if (state === 'recall') check(); else if (state === 'reveal') nextRound(); });
    newRound();
  }

  function setAction(text, enabled) {
    ui.action.textContent = text;
    ui.action.disabled = !enabled;
    ui.action.classList.toggle('is-status', !enabled);
  }

  function newRound() {
    board = makeBoard(SIZES[round]); options = makeOptions(board); picks = [];
    state = 'memorize';
    ui.round.textContent = round + 1;
    ui.options.innerHTML = '';
    ui.options.hidden = true;
    options.forEach(c => { const im = new Image(); im.src = A.asset(c.img); });
    ui.hexes.className = 'cm-hexes is-deal';
    ui.hexes.innerHTML = board.map((c, i) => `<li style="--i:${i}">${hex(c)}</li>`).join('');
    ui.traits.innerHTML = traitChips(board);
    ui.title.textContent = 'Memorize this board!';
    ui.title.className = 'sm-title';
    ui.sub.textContent = '';
    setAction('The board is about to be cleared …', false);
    ui.hint.textContent = `${board.length} champions – the order doesn’t matter.`;
    ui.timer.style.transform = 'scaleX(1)';
    A.sound('flip');
    const imgs = [...ui.hexes.querySelectorAll('img')];
    const loaded = Promise.all(imgs.map(im => im.decode ? im.decode().catch(() => {}) : Promise.resolve()));
    Promise.race([loaded, new Promise(r => setTimeout(r, 1500))]).then(() => countdown(showMs()));
  }

  function countdown(ms) {
    const t0 = performance.now(), r = round;
    stop();
    timer = setTimeout(() => { if (state === 'memorize' && round === r) cover(); }, ms);
    let lastSec = null;
    const step = () => {
      if (state !== 'memorize' || round !== r) return;
      const left = Math.max(0, ms - (performance.now() - t0)), s = Math.ceil(left / 1000);
      ui.timer.style.transform = `scaleX(${left / ms})`;
      if (s !== lastSec) {
        ui.sub.textContent = `${secWord(s)} left`;
        if (s <= 3 && s > 0 && lastSec !== null) A.sound('tick');
        lastSec = s;
      }
      if (left > 0) raf = requestAnimationFrame(step);
    };
    step();
  }

  function cover() {
    state = 'cover';
    ui.hexes.className = 'cm-hexes is-covering';
    A.sound('flip');
    timer = setTimeout(recall, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300);
  }

  // ───────── Nachbauen ─────────
  function recall() {
    state = 'recall';
    cancelAnimationFrame(raf);
    ui.hexes.className = 'cm-hexes';
    ui.title.textContent = 'Who was on the board?';
    ui.options.hidden = false;
    ui.options.innerHTML = options.map(c => `<button class="cm-opt" type="button" data-id="${c.id}">${hex(c)}</button>`).join('');
    ui.options.querySelectorAll('.cm-opt').forEach(b => b.addEventListener('click', () => toggle(b.dataset.id)));
    ui.hint.textContent = 'Click a champion on the board to take it off again.';
    render();
    recallAt = performance.now();
    // gewertet: Zeitlimit, danach wird mit dem geprüft, was auf dem Board steht
    if (!training()) { const r = round; timer = setTimeout(() => { if (state === 'recall' && round === r) check(true); }, RECALL_MS); }
    speedBar();
    const first = ui.options.querySelector('.cm-opt');
    if (first) first.focus({ preventScroll: true });
  }

  // Balken = verbleibende Zeit (zugleich Tempo-Bonus); gewertet im letzten Drittel rot, in den letzten 3 Sekunden tickt es
  function speedBar() {
    let lastSec = null;
    const step = () => {
      if (state !== 'recall') return;
      const left = Math.max(0, SPEED_MS - (performance.now() - recallAt)), s = Math.ceil(left / 1000);
      ui.timer.style.transform = `scaleX(${left / SPEED_MS})`;
      if (!training()) {
        ui.timer.parentElement.classList.toggle('is-hurry', left < SPEED_MS / 3);
        if (s !== lastSec) { if (s <= 3 && s > 0 && lastSec !== null) A.sound('tick'); lastSec = s; }
      }
      raf = requestAnimationFrame(step);
    };
    step();
  }

  // Board mit den bisher gewählten Champions; die Traits darüber rechnen sich live mit
  function render() {
    const n = board.length;
    ui.hexes.innerHTML = Array.from({ length: n }, (_, i) => {
      const c = picks[i] && champ[picks[i]];
      return c
        ? `<li><button class="cm-slot is-pick" type="button" data-id="${c.id}" aria-label="${esc(c.name)} – take off the board">${hex(c)}</button></li>`
        : `<li><span class="cm-slot is-empty" aria-hidden="true"><span class="cm-hex"><span class="cm-hex-in"></span></span><span class="cm-name">&nbsp;</span></span></li>`;
    }).join('');
    ui.hexes.querySelectorAll('.cm-slot.is-pick').forEach(b => b.addEventListener('click', () => toggle(b.dataset.id)));
    ui.traits.innerHTML = traitChips(picks.map(id => champ[id]));
    ui.options.querySelectorAll('.cm-opt').forEach(b => b.classList.toggle('is-chosen', picks.includes(b.dataset.id)));
    const left = n - picks.length;
    ui.sub.innerHTML = left ? `<b>${left}</b> ${left === 1 ? 'champion' : 'champions'} still missing from the board.` : 'Board full – check or swap.';
    setAction(left ? `${left} ${left === 1 ? 'slot' : 'slots'} left` : 'Check', !left);
  }

  // Auswahl: rauf aufs Board (solange Platz ist) bzw. wieder herunter
  function toggle(id) {
    if (state !== 'recall') return;
    if (picks.includes(id)) picks = picks.filter(x => x !== id);
    else if (picks.length < board.length) picks.push(id);
    else return;
    A.sound('click');
    render();
    if (picks.length === board.length) ui.action.focus({ preventScroll: true });
  }

  // ───────── Auflösung ─────────
  // timeUp: Zeitlimit abgelaufen – leere Plätze zählen als vergessen
  function check(timeUp) {
    if (state !== 'recall' || (!timeUp && picks.length !== board.length)) return;
    state = 'reveal';
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    ui.timer.parentElement.classList.remove('is-hurry');
    const used = performance.now() - recallAt, ids = board.map(c => c.id);
    const right = picks.filter(id => ids.includes(id)).length, miss = board.length - right, perfect = !miss;
    // Board zeigen, wie es war: richtig gemerkt = grün, vergessen = rot; falsch gesetzte stehen in der Auswahl rot
    ui.hexes.innerHTML = board.map(c => `<li class="${picks.includes(c.id) ? 'is-ok' : 'is-bad'}">${hex(c, `<span class="sm-mark" aria-hidden="true">${picks.includes(c.id) ? '✓' : '✗'}</span>`)}</li>`).join('');
    ui.traits.innerHTML = traitChips(board);
    ui.options.querySelectorAll('.cm-opt').forEach(b => {
      b.disabled = true;
      const inBoard = ids.includes(b.dataset.id), chosen = picks.includes(b.dataset.id);
      b.classList.toggle('is-wrong', chosen && !inBoard);
      b.classList.toggle('is-missed', !chosen && inBoard);
    });
    const speed = perfect ? Math.round(P_SPEED * Math.max(0, 1 - used / SPEED_MS)) : 0;
    const pts = right * P_CHAMP + (perfect ? P_PERFECT + speed : 0);
    score += pts; totals.right += right; totals.all += board.length; if (perfect) totals.perfect++;
    ui.score.textContent = score.toLocaleString('en-US');

    const lost = !training() && miss > MAX_MISS;
    if (lost) loseHeart();
    ui.title.textContent = perfect ? 'Perfect board!' : !lost ? 'Well remembered!' : timeUp ? 'Time’s up!' : 'You lost a heart!';
    ui.title.className = 'sm-title ' + (perfect ? 'is-ok' : miss <= MAX_MISS ? 'is-near' : 'is-bad');
    ui.sub.textContent = `${right} of ${board.length} champions correct · +${pts} points${perfect ? ` (incl. ${P_PERFECT} bonus${speed ? ` and ${speed} speed` : ''})` : ''}`;
    A.sound(miss <= MAX_MISS ? 'ok' : 'bad');
    const over = hearts === 0 || round + 1 >= ROUNDS;
    setAction(over ? 'See results' : 'Next round', true);
    ui.hint.textContent = over ? '' : 'Enter works too.';
    ui.action.focus({ preventScroll: true });
  }

  function loseHeart() {
    hearts--;
    const all = [...ui.hearts.querySelectorAll('svg')];
    if (all[hearts]) all[hearts].classList.add('is-lost');
    ui.hearts.setAttribute('aria-label', `${hearts} ${hearts === 1 ? 'heart' : 'hearts'}`);
  }

  function nextRound() {
    if (state !== 'reveal') return;
    round++;
    if (round < ROUNDS && hearts > 0) newRound(); else finish();
  }

  function finish() {
    state = 'done';
    stop();
    const played = Math.min(round, ROUNDS);
    const share = totals.all ? totals.right / totals.all : 0;
    const title = hearts === 0 ? 'Out of hearts!' : totals.perfect === ROUNDS ? 'Photographic memory!' : share >= .85 ? 'Great memory!' : share >= .6 ? 'Not bad at all!' : 'There’s room to improve!';
    A.sound(hearts === 0 ? 'lose' : 'win');
    A.finishRound({
      value: score,
      title,
      lines: [
        `${played} of ${ROUNDS} rounds · ${totals.perfect} perfect ${totals.perfect === 1 ? 'board' : 'boards'}`,
        `${totals.right} of ${totals.all} champions remembered`,
      ],
      shareText: `Comp Memory: ${score.toLocaleString('en-US')} points, ${totals.perfect}/${ROUNDS} perfect boards – can you remember more? #TFTArcade`,
      onReplay: start,
    });
  }

  document.addEventListener('arcade:mode', intro);
  document.addEventListener('arcade:restart', start);
  document.addEventListener('keydown', e => {
    if (stage.hidden || e.key !== 'Enter' || A.typing(e) || (e.target.closest && e.target.closest('button, a, summary, dialog'))) return;
    if (state === 'recall' && picks.length === board.length) { e.preventDefault(); check(); }
    else if (state === 'reveal') { e.preventDefault(); nextRound(); }
    else if (state === 'start') { e.preventDefault(); start(); }
  });

  intro();
})();
