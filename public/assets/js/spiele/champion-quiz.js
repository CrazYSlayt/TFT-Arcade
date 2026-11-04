// TFT Arcade – „Wer ist dieser Champ?“: Champion anhand schrittweise aufgedeckter Hinweise erraten (Namen eintippen).
// Modi: „10 Runden“ (gewertet, alle 5 Sekunden ein neuer Hinweis) · „Tagesrätsel“ (ein Champion pro Tag für alle, ohne Uhr, eine Chance)
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js – mit Rolle, Reichweite und Fähigkeit, erzeugt mit tools/champions.js)
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste, Ton, Tag nach deutscher Zeit
(function () {
  'use strict';

  const stage = document.getElementById('spielflaeche');
  const data = window.TFT_ARCADE_CHAMPIONS, A = window.Arcade;
  if (!stage || !data || !A) return;
  const esc = A.esc;

  const ROUNDS = 10;
  const POINTS = [300, 240, 180, 120, 80, 40];   // Punkte nach Anzahl sichtbarer Hinweise (1 Hinweis = 300)
  const HINT_MS = 5000;                           // gewertet: alle 5 Sekunden ein neuer Hinweis …
  const LAST_MS = 6000;                           // … nach dem letzten noch 6 Sekunden, dann ist die Runde verloren
  const NEXT_MS = 2600;
  const DAILY = 'daily';
  const champs = data.champions.filter(c => c.traits.length);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Suche ohne Akzente, Apostrophe und Leerzeichen („khazix“ findet Kha’Zix)
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const coin = n => `<span class="kq-coin cost-${n}">${n}</span>`;
  const traitChip = ([name, icon]) => `<span class="cr-trait">${icon ? `<img src="${A.asset(icon)}" alt="">` : ''}${esc(name)}</span>`;
  // Name des Champions in der Fähigkeit verdecken („Karma-Verbindung“ → „???-Verbindung“)
  const hideName = (text, c) => c.name.split(/[\s'’]+/).filter(w => w.length > 2).reduce((t, w) => t.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '???'), text);
  const rangeText = r => !r ? 'Range unknown' : r <= 1 ? 'Melee' : `Ranged · range ${r}`;

  // sechs Hinweise, vom schwersten zum leichtesten
  function hintsFor(c) {
    const own = A.shuffle(c.traits);
    return [
      { label: 'Role', html: `<b>${esc(c.role || 'Unknown')}</b><small>${rangeText(c.range)}</small>` },
      { label: 'Cost', html: `${coin(c.cost)}<b>${c.cost} gold</b>` },
      { label: 'One trait', html: traitChip(own[0]) },
      { label: 'Ability', html: `<b>“${esc(hideName(c.ability || '???', c))}”</b>` },
      { label: 'All traits', html: c.traits.map(traitChip).join('') },
      { label: 'Image', html: '<b>Blurred splash art</b><small>see the image</small>', pic: true },
    ];
  }

  let state = 'start', deck = [], idx = 0, score = 0, solved = 0, hintSum = 0, results = [];
  let shown = 1, tries = [], locked = false, timer = null, raf = null, phaseAt = 0, phaseMs = 0, ui = {}, active = -1;
  const isDaily = () => A.currentMode() === DAILY;

  // ───────── Tagesrätsel: gleicher Champion für alle, Ergebnis wird pro Tag gemerkt ─────────
  const dailyChamp = day => {
    const list = [...champs].sort((a, b) => a.id.localeCompare(b.id));
    return list[(Math.imul(day, 2654435761) >>> 0) % list.length];
  };
  const dailyStore = () => A.store.get('tagesraetsel', {});
  function dailyStreak() {
    const all = dailyStore(), t = A.today().day;
    let n = 0;
    for (let d = all[t] ? t : t - 1; all[d] && all[d].won; d--) n++;
    return n;
  }
  const clock = s => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}`;

  // ───────── Startbildschirm ─────────
  function intro() {
    state = 'start';
    clearTimeout(timer); cancelAnimationFrame(raf);
    const daily = isDaily(), today = A.today(), done = daily && dailyStore()[today.day];
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">${daily ? `Daily Puzzle · ${today.label}` : `${ROUNDS} champions · Set ${esc(data.set)}`}</p>
      <h2 class="game-title">Who Is This Champ?</h2>
      <ol class="cr-preview" aria-hidden="true">${['Role', 'Cost', 'Trait', 'Ability', 'Traits', 'Image'].map(x => `<li>${x}</li>`).join('')}</ol>
      <p class="game-text">${daily
        ? (done ? `${done.won ? `Solved today with ${done.hints} ${done.hints === 1 ? 'clue' : 'clues'}` : 'Already tried today'}. The next puzzle arrives in ${clock(today.left)} hours.${dailyStreak() > 1 ? ` Streak: ${dailyStreak()} days.` : ''}`
          : 'One champion for everyone, one try per day. Reveal clues whenever you like, and every wrong guess reveals one too.')
        : 'A new clue appears every 5 seconds. Type the name as soon as you know it: fewer clues mean more points. A wrong guess reveals the next clue right away.'}</p>
      ${done ? `<button class="btn btn-ghost btn-lg" type="button" data-cr-share>Share result</button>` : `<button class="btn btn-gold btn-lg" type="button" data-game-start>${daily ? 'Start puzzle' : 'Let’s go'}</button>`}
    </div>`;
    const go = stage.querySelector('[data-game-start]');
    if (go) go.addEventListener('click', start);
    const sh = stage.querySelector('[data-cr-share]');
    if (sh) sh.addEventListener('click', () => A.share(dailyShare(done)));
  }

  // ───────── Runde ─────────
  function start() {
    clearTimeout(timer); cancelAnimationFrame(raf);
    const daily = isDaily();
    if (daily && dailyStore()[A.today().day]) return intro();
    deck = daily ? [dailyChamp(A.today().day)] : A.shuffle(champs).slice(0, ROUNDS);
    deck.forEach(c => { const im = new Image(); im.src = A.asset(c.img); });
    idx = 0; score = 0; solved = 0; hintSum = 0; results = [];
    state = 'play';
    stage.innerHTML = `<div class="cr${daily ? ' is-daily' : ''}">
      <div class="hud">
        <div class="hud-side">
          ${daily ? `<span class="hud-pill">Daily Puzzle <b>${A.today().label}</b></span>` : `<span class="hud-pill">Champion <b data-cr-n>1</b><i>/ ${deck.length}</i></span>
          <ol class="game-dots" aria-hidden="true">${deck.map(() => '<li></li>').join('')}</ol>`}
        </div>
        <span class="hud-pill hud-score">${daily ? 'Clues' : 'Points'} <b data-cr-score>${daily ? 1 : 0}</b></span>
        <div class="hud-side cr-hud-right"><span class="hud-pill">Worth <b data-cr-worth>${POINTS[0]}</b></span></div>
      </div>
      ${daily ? '' : '<div class="hud-bar" aria-hidden="true"><span data-cr-bar></span></div>'}
      <div class="cr-main">
        <figure class="cr-pic" data-cr-pic><span class="cr-q" aria-hidden="true">?</span><img alt="" width="960" height="480" hidden></figure>
        <ol class="cr-hints" data-cr-hints></ol>
      </div>
      <p class="game-msg" data-cr-msg aria-live="polite"></p>
      <form class="cr-guess" data-cr-form autocomplete="off">
        <div class="cr-field">
          <input class="cr-input" data-cr-input type="text" placeholder="Type a champion …" aria-label="Type a champion" aria-autocomplete="list" aria-controls="cr-suggest" spellcheck="false">
          <ul class="cr-suggest" id="cr-suggest" role="listbox" data-cr-suggest hidden></ul>
        </div>
        <button class="btn btn-gold" type="submit" data-cr-go>Guess</button>
        <button class="btn btn-ghost" type="button" data-cr-hint>Clue</button>
      </form>
      <ul class="cr-tries" data-cr-tries aria-label="Your guesses"></ul>
    </div>`;
    const q = s => stage.querySelector(s);
    ui = { n: q('[data-cr-n]'), score: q('[data-cr-score]'), worth: q('[data-cr-worth]'), bar: q('[data-cr-bar]'), pic: q('[data-cr-pic]'),
      img: q('[data-cr-pic] img'), hints: q('[data-cr-hints]'), msg: q('[data-cr-msg]'), form: q('[data-cr-form]'), input: q('[data-cr-input]'),
      suggest: q('[data-cr-suggest]'), hintBtn: q('[data-cr-hint]'), go: q('[data-cr-go]'), tries: q('[data-cr-tries]'), dots: [...stage.querySelectorAll('.game-dots li')] };
    ui.form.addEventListener('submit', e => { e.preventDefault(); if (locked) next(); else submit(); });
    ui.input.addEventListener('input', suggest);
    ui.input.addEventListener('keydown', onKey);
    ui.input.addEventListener('blur', () => setTimeout(() => { ui.suggest.hidden = true; }, 150));
    ui.hintBtn.addEventListener('click', () => { if (!locked) { reveal(); ui.input.focus(); } });
    show();
  }

  function show() {
    const c = deck[idx];
    locked = false; shown = 1; tries = [];
    c.hints = hintsFor(c);
    if (ui.n) ui.n.textContent = idx + 1;
    ui.dots.forEach((d, i) => d.classList.toggle('is-now', i === idx));
    ui.pic.className = 'cr-pic';
    ui.pic.querySelectorAll('figcaption').forEach(f => f.remove());
    ui.img.hidden = true;
    ui.img.src = A.asset(c.img);
    ui.tries.innerHTML = '';
    ui.input.value = ''; ui.input.disabled = false; ui.go.disabled = false; ui.go.textContent = 'Guess';
    ui.suggest.hidden = true;
    ui.msg.className = 'game-msg';
    ui.msg.innerHTML = 'Who is it? Type the name.';
    renderHints(true);
    ui.input.focus({ preventScroll: true });
    phase();
  }

  function renderHints(fresh) {
    const c = deck[idx];
    ui.hints.innerHTML = c.hints.map((h, i) => i < shown
      ? `<li class="cr-hint${fresh || i === shown - 1 ? ' is-new' : ''}"><span class="cr-hint-n">${i + 1}</span><span class="cr-hint-l">${h.label}</span><span class="cr-hint-v">${h.html}</span></li>`
      : `<li class="cr-hint is-locked"><span class="cr-hint-n">${i + 1}</span><span class="cr-hint-l">${h.label}</span><span class="cr-hint-v">?</span></li>`).join('');
    // ab Hinweis 2 (Kosten) leuchtet der Bildrahmen in der Kostenfarbe, ab Hinweis 6 ist das Bild unscharf zu sehen
    if (shown >= 2) ui.pic.classList.add('cost-' + c.cost);
    if (shown >= 6 && !locked) { ui.img.hidden = false; ui.pic.classList.add('is-blur'); }
    if (locked) return;
    if (isDaily()) ui.score.textContent = shown;
    ui.worth.textContent = POINTS[shown - 1];
    ui.hintBtn.disabled = locked || shown >= c.hints.length;
  }

  // nächster Hinweis (Knopf, falscher Tipp oder Uhr) – ohne weitere Hinweise ist die Runde verloren
  function reveal(byWrong) {
    if (locked) return;
    if (shown >= deck[idx].hints.length) { if (byWrong) lose(); return; }
    shown++;
    A.sound('flip');
    renderHints(false);
    phase();
  }

  // gewertet: Uhr bis zum nächsten Hinweis (bzw. bis zum Ende nach dem letzten)
  function phase() {
    if (isDaily()) return;
    clearTimeout(timer); cancelAnimationFrame(raf);
    const last = shown >= deck[idx].hints.length;
    phaseMs = last ? LAST_MS : HINT_MS; phaseAt = performance.now();
    timer = setTimeout(() => { if (state === 'play' && !locked) { if (last) lose(true); else reveal(); } }, phaseMs);
    let lastSec = null;
    const step = () => {
      if (locked) return;
      const left = Math.max(0, phaseMs - (performance.now() - phaseAt)), s = Math.ceil(left / 1000);
      ui.bar.style.transform = `scaleX(${left / phaseMs})`;
      ui.bar.parentElement.classList.toggle('is-hurry', last && left < phaseMs / 2);
      if (last && s !== lastSec) { if (s <= 3 && s > 0 && lastSec !== null) A.sound('tick'); lastSec = s; }
      if (left > 0) raf = requestAnimationFrame(step);
    };
    step();
  }

  // ───────── Eingabe mit Vorschlägen ─────────
  function matches(text) {
    const t = norm(text);
    if (!t) return [];
    const guessed = new Set(tries.map(x => x.id));
    const pool = champs.filter(c => !guessed.has(c.id));
    return [...pool.filter(c => norm(c.name).startsWith(t)), ...pool.filter(c => !norm(c.name).startsWith(t) && norm(c.name).includes(t))].slice(0, 6);
  }
  function suggest() {
    const list = matches(ui.input.value);
    active = list.length ? 0 : -1;
    ui.suggest.innerHTML = list.map((c, i) => `<li role="option" data-id="${c.id}" aria-selected="${i === active}"><img src="${A.asset(c.img)}" alt="" width="960" height="480">${esc(c.name)}</li>`).join('');
    ui.suggest.hidden = !list.length;
    ui.suggest.querySelectorAll('li').forEach(li => li.addEventListener('mousedown', e => { e.preventDefault(); guess(champs.find(c => c.id === li.dataset.id)); }));
  }
  function onKey(e) {
    const items = [...ui.suggest.querySelectorAll('li')];
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    } else if (e.key === 'Escape') ui.suggest.hidden = true;
  }
  function submit() {
    const items = [...ui.suggest.querySelectorAll('li')];
    const pick = !ui.suggest.hidden && items[active] ? champs.find(c => c.id === items[active].dataset.id)
      : champs.find(c => norm(c.name) === norm(ui.input.value)) || matches(ui.input.value)[0];
    if (!pick) { ui.msg.className = 'game-msg is-bad'; ui.msg.textContent = ui.input.value.trim() ? 'That champion isn’t in this set.' : 'Type a name first.'; return; }
    guess(pick);
  }

  function guess(c) {
    if (locked || !c) return;
    const goal = deck[idx];
    ui.input.value = ''; ui.suggest.hidden = true;
    if (c.id === goal.id) return win();
    tries.push(c);
    // Rückmeldung zum falschen Tipp: teurer oder billiger, gemeinsame Traits
    const shared = c.traits.filter(([n]) => goal.traits.some(([m]) => m === n)).length;
    const dir = c.cost === goal.cost ? 'same cost' : goal.cost > c.cost ? 'target costs more' : 'target costs less';
    const li = document.createElement('li');
    li.innerHTML = `<img class="cost-${c.cost}" src="${A.asset(c.img)}" alt="" width="960" height="480"><span><b>${esc(c.name)}</b><small>${dir} · ${shared ? `${shared} shared trait${shared > 1 ? 's' : ''}` : 'no shared trait'}</small></span>`;
    ui.tries.prepend(li);
    A.sound('bad');
    ui.msg.className = 'game-msg is-bad';
    ui.msg.textContent = `Not ${c.name}${shown < goal.hints.length ? ' – a new clue is revealed.' : '.'}`;
    ui.form.classList.remove('is-shake'); void ui.form.offsetWidth; ui.form.classList.add('is-shake');
    reveal(true);
  }

  function win() {
    const pts = POINTS[shown - 1];
    score += pts; solved++; hintSum += shown;
    results.push({ c: deck[idx], ok: true, hints: shown });
    end(true, `Correct – ${deck[idx].name}! +${pts} points with ${shown} ${shown === 1 ? 'clue' : 'clues'}.`);
    if (!isDaily()) ui.score.textContent = score.toLocaleString('en-US');
  }
  function lose(timeUp) {
    hintSum += shown;
    results.push({ c: deck[idx], ok: false, hints: shown });
    end(false, `${timeUp ? 'Time’s up' : 'No clues left'} – it was ${deck[idx].name}.`);
  }

  function end(ok, text) {
    locked = true;
    clearTimeout(timer); cancelAnimationFrame(raf);
    if (ui.bar) { ui.bar.style.transform = 'scaleX(0)'; ui.bar.parentElement.classList.remove('is-hurry'); }
    const c = deck[idx];
    shown = c.hints.length;
    renderHints(false);
    ui.pic.classList.remove('is-blur');
    ui.pic.classList.add(ok ? 'is-ok' : 'is-bad', 'is-solved');
    ui.img.hidden = false;
    ui.pic.insertAdjacentHTML('beforeend', `<figcaption class="kq-name">${esc(c.name)}</figcaption>`);
    ui.dots[idx] && ui.dots[idx].classList.remove('is-now');
    ui.dots[idx] && ui.dots[idx].classList.add(ok ? 'is-ok' : 'is-bad');
    ui.msg.className = 'game-msg ' + (ok ? 'is-ok' : 'is-bad');
    ui.msg.textContent = text;
    ui.input.disabled = true; ui.hintBtn.disabled = true;
    ui.go.textContent = isDaily() ? 'See results' : idx + 1 < deck.length ? 'Next' : 'See results';
    ui.go.focus({ preventScroll: true });
    A.sound(ok ? 'ok' : 'lose');
    if (isDaily()) {
      const all = dailyStore(), t = A.today().day;
      all[t] = { won: ok, hints: results[0].hints, tries: tries.length, id: c.id };
      A.store.set('tagesraetsel', all);
    }
    timer = setTimeout(next, reduced ? NEXT_MS + 1200 : NEXT_MS + (isDaily() ? 1400 : 0));
  }

  function next() {
    clearTimeout(timer);
    if (state !== 'play' || !locked) return;
    idx++;
    if (idx < deck.length) show(); else finish();
  }

  // ───────── Auswertung ─────────
  function dailyShare(r) {
    const boxes = Array.from({ length: 6 }, (_, i) => i < r.hints - 1 ? '🟥' : i === r.hints - 1 ? (r.won ? '🟩' : '🟥') : '⬛').join('');
    return `Who Is This Champ? Daily Puzzle ${A.today().label}: ${boxes} ${r.won ? `${r.hints}/6 clues` : 'not solved'} #TFTArcade`;
  }
  function finish() {
    state = 'done';
    if (isDaily()) {
      const r = dailyStore()[A.today().day], streak = dailyStreak();
      A.finishRound({
        valueText: r.won ? `${r.hints} / 6` : '–',
        title: r.won ? (r.hints <= 2 ? 'Amazing – barely any clues!' : 'Solved!') : 'Not today …',
        lines: [`It was ${results[0].c.name}.`, r.won ? `${r.hints} ${r.hints === 1 ? 'clue' : 'clues'}, ${r.tries} wrong ${r.tries === 1 ? 'guess' : 'guesses'}.` : 'There’s a new puzzle tomorrow.', ...(streak > 1 ? [`Streak: ${streak} days in a row.`] : [])],
        shareText: dailyShare(r),
        onReplay: intro,
      });
      return;
    }
    const missed = results.filter(r => !r.ok).map(r => r.c.name);
    A.finishRound({
      value: score,
      title: solved === deck.length ? 'You got them all!' : solved >= 7 ? 'Great round!' : solved >= 4 ? 'Not bad at all!' : 'There’s room to improve!',
      lines: [`${solved} of ${deck.length} guessed · ${(hintSum / deck.length).toLocaleString('en-US', { maximumFractionDigits: 1 })} clues on average`, ...(missed.length ? ['Missed: ' + missed.join(', ')] : [])],
      shareText: `Who Is This Champ? ${score.toLocaleString('en-US')} points, ${solved}/${deck.length} guessed – can you beat that? #TFTArcade`,
      onReplay: start,
    });
  }

  document.addEventListener('arcade:restart', () => (isDaily() ? intro() : start()));
  document.addEventListener('arcade:mode', intro);
  document.addEventListener('keydown', e => {
    if (stage.hidden || e.altKey || e.ctrlKey || e.metaKey || A.typing(e)) return;
    if (state === 'play' && e.key === 'Enter' && locked && !e.target.closest('button')) { e.preventDefault(); next(); }
    else if (state === 'start' && e.key === 'Enter' && !e.target.closest('button, a, dialog')) { const b = stage.querySelector('[data-game-start]'); if (b) { e.preventDefault(); start(); } }
  });

  intro();
})();
