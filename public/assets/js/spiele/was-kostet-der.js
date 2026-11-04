// TFT Arcade – Quiz „Was kostet der?“: Champion ansehen, Kosten von 1 bis 5 tippen.
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js, erzeugt mit tools/champions.js)
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste und Highscore-Eintrag
(function () {
  'use strict';

  const stage = document.getElementById('spielflaeche');
  const data = window.TFT_ARCADE_CHAMPIONS, A = window.Arcade;
  if (!stage || !data || !A) return;

  const ROUNDS = 10;            // Champions pro Runde
  const BASE = 100;             // Punkte für eine richtige Antwort
  const BONUS = 50;             // Tempo-Bonus: voll bis FULL_MS, danach linear weniger bis zum Zeitlimit
  const FULL_MS = 800;
  const LIMIT_FIRST = 4000, LIMIT_LAST = 2500;   // Zeitlimit pro Champion, schrumpft bis zum letzten; abgelaufen = falsch
  const NEXT_OK = 1100, NEXT_WRONG = 2300;   // Pause bis zum nächsten Champion
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = A.esc;
  const coin = n => `<span class="kq-coin">${n}</span>`;

  let state = 'start', deck = [], idx = 0, score = 0, bonusSum = 0, correct = 0, answers = [];
  let shownAt = null, limit = LIMIT_FIRST, locked = false, timer = null, raf = null, late = 0, ui = {};

  // ───────── Startbildschirm ─────────
  function intro() {
    state = 'start';
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">${ROUNDS} Champions · Set ${esc(data.set)}</p>
      <h2 class="game-title">What Does It Cost?</h2>
      <div class="kq-preview" aria-hidden="true">${[1, 2, 3, 4, 5].map(n => `<span class="kq-chip cost-${n}">${coin(n)}</span>`).join('')}</div>
      <p class="game-text">You get ${LIMIT_FIRST / 1000} seconds per champion, down to ${(LIMIT_LAST / 1000).toLocaleString('en-US')} at the end. The faster you’re right, the more points you score. Tip: the keys <kbd>1</kbd>–<kbd>5</kbd> are the fastest.</p>
      <button class="btn btn-gold btn-lg" type="button" data-game-start>Let’s go</button>
    </div>`;
    stage.querySelector('[data-game-start]').addEventListener('click', start);
  }

  // ───────── Runde ─────────
  function start() {
    clearTimeout(timer);
    deck = A.shuffle(data.champions).slice(0, ROUNDS);
    deck.forEach(c => { const im = new Image(); im.src = A.asset(c.img); });   // Bilder vorladen
    idx = 0; score = 0; bonusSum = 0; correct = 0; answers = []; late = 0;
    state = 'play';
    stage.innerHTML = `<div class="kq">
      <div class="hud">
        <div class="hud-side">
          <span class="hud-pill">Champion <b data-kq-n>1</b><i>/ ${ROUNDS}</i></span>
          <ol class="game-dots" aria-hidden="true">${deck.map(() => '<li></li>').join('')}</ol>
        </div>
        <span class="hud-pill hud-score">Points <b data-kq-score>0</b></span>
        <div class="hud-side"></div>
      </div>
      <div class="hud-bar" aria-hidden="true"><span data-kq-bonus></span></div>
      <figure class="kq-figure">
        <img class="kq-img" data-kq-img alt="" width="960" height="480">
        <figcaption class="kq-name" data-kq-name></figcaption>
      </figure>
      <p class="game-msg" data-kq-feedback aria-live="polite"></p>
      <div class="kq-costs" role="group" aria-label="Pick the cost">
        ${[1, 2, 3, 4, 5].map(n => `<button class="kq-cost cost-${n}" type="button" data-cost="${n}" aria-label="${n} gold" aria-keyshortcuts="${n}">${coin(n)}<span class="kq-gold">gold</span></button>`).join('')}
      </div>
    </div>`;
    const q = s => stage.querySelector(s);
    ui = { n: q('[data-kq-n]'), score: q('[data-kq-score]'), img: q('[data-kq-img]'), name: q('[data-kq-name]'),
      bonus: q('[data-kq-bonus]'), feedback: q('[data-kq-feedback]'), figure: q('.kq-figure'), dots: [...stage.querySelectorAll('.game-dots li')],
      buttons: [...stage.querySelectorAll('.kq-cost')] };
    ui.buttons.forEach(b => b.addEventListener('click', () => answer(Number(b.dataset.cost))));
    show();
  }

  function show() {
    const c = deck[idx];
    locked = false; shownAt = null;
    ui.n.textContent = idx + 1;
    ui.name.textContent = c.name;
    ui.img.alt = `Splash art of ${c.name}`;
    // vor der Antwort steht hier die Frage, danach die Auflösung
    ui.feedback.innerHTML = `How much gold does <b>${esc(c.name)}</b> cost?`;
    ui.feedback.className = 'game-msg';
    ui.figure.classList.remove('is-ok', 'is-bad');
    ui.dots.forEach((d, i) => d.classList.toggle('is-now', i === idx));
    ui.buttons.forEach(b => { b.disabled = false; b.classList.remove('is-right', 'is-wrong', 'is-answer'); });
    ui.bonus.style.transform = 'scaleX(1)';
    limit = Math.round(LIMIT_FIRST - (LIMIT_FIRST - LIMIT_LAST) * idx / (ROUNDS - 1));
    // Uhr startet erst, wenn das Bild zu sehen ist; das Zeitlimit endet per Timer (verlässlich)
    const ready = () => {
      if (shownAt !== null || state !== 'play' || deck[idx] !== c) return;
      shownAt = performance.now();
      clearTimeout(timer);
      timer = setTimeout(() => { if (state === 'play' && deck[idx] === c && !locked) answer(0); }, limit);
      tick();
    };
    ui.img.onload = ready;
    ui.img.onerror = ready;
    ui.img.src = A.asset(c.img);
    if (ui.img.complete) ready();
  }

  const bonusFor = ms => Math.round(BONUS * Math.max(0, Math.min(1, 1 - (ms - FULL_MS) / (limit - FULL_MS))));

  // Zeitbalken schrumpft; im letzten Drittel rot und pulsierend
  function tick() {
    cancelAnimationFrame(raf);
    const step = () => {
      if (locked || shownAt === null) return;
      const left = Math.max(0, limit - (performance.now() - shownAt));
      ui.bonus.style.transform = `scaleX(${left / limit})`;
      ui.bonus.parentElement.classList.toggle('is-hurry', left < limit / 3);
      if (left > 0) raf = requestAnimationFrame(step);
    };
    step();
  }

  // cost = 0: Zeit abgelaufen
  function answer(cost) {
    if (state !== 'play' || locked) return;
    locked = true;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    ui.bonus.parentElement.classList.remove('is-hurry');
    if (!cost) late++;
    const c = deck[idx], ok = cost === c.cost;
    const bonus = ok ? bonusFor(shownAt === null ? limit : performance.now() - shownAt) : 0;
    const pts = ok ? BASE + bonus : 0;
    score += pts; bonusSum += bonus; if (ok) correct++;
    answers.push({ champ: c, cost, ok });

    ui.buttons.forEach(b => {
      const n = Number(b.dataset.cost);
      b.disabled = true;
      if (n === cost) b.classList.add(ok ? 'is-right' : 'is-wrong');
      if (!ok && n === c.cost) b.classList.add('is-answer');
    });
    ui.figure.classList.add(ok ? 'is-ok' : 'is-bad');
    A.sound(ok ? 'ok' : 'bad');
    if (!ok) ui.bonus.style.transform = 'scaleX(0)';
    ui.dots[idx].classList.add(ok ? 'is-ok' : 'is-bad');
    ui.score.textContent = score.toLocaleString('en-US');
    ui.feedback.textContent = ok
      ? `Correct! +${pts} points${bonus ? ` (${bonus} speed bonus)` : ''}`
      : `${cost ? 'Not quite' : 'Time’s up'} – ${c.name} costs ${c.cost} gold.`;
    ui.feedback.className = 'game-msg ' + (ok ? 'is-ok' : 'is-bad');
    timer = setTimeout(next, reduced ? (ok ? 1400 : 2600) : (ok ? NEXT_OK : NEXT_WRONG));
  }

  function next() {
    clearTimeout(timer);
    if (state !== 'play' || !locked) return;
    idx++;
    if (idx < ROUNDS) show(); else finish();
  }

  // ───────── Auswertung (einheitliche Ergebniskarte aus arcade.js) ─────────
  function finish() {
    state = 'done';
    const wrong = answers.filter(a => !a.ok);
    const title = correct === ROUNDS ? 'Perfect round!' : correct >= 7 ? 'Great round!' : correct >= 4 ? 'Not bad at all!' : 'There’s room to improve!';
    A.finishRound({
      value: score,
      title,
      lines: [
        `${correct} of ${ROUNDS} correct · speed bonus ${bonusSum} points${late ? ` · ${late}× too slow` : ''}`,
        ...(wrong.length ? ['Missed: ' + wrong.map(a => `${a.champ.name} (${a.cost ? `${a.cost} instead of ${a.champ.cost}` : `${a.champ.cost}`} gold)`).join(', ')] : []),
      ],
      shareText: `What Does It Cost? ${score.toLocaleString('en-US')} points, ${correct}/${ROUNDS} correct – can you beat me? #TFTArcade`,
      onReplay: start,
    });
  }

  // „Neu starten“ in der Leiste unter der Spielfläche
  document.addEventListener('arcade:restart', start);

  // ───────── Tastatur: 1–5 antworten, Enter = weiter ─────────
  document.addEventListener('keydown', e => {
    if (stage.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if (A.typing(e)) return;
    if (state === 'play' && /^[1-5]$/.test(e.key)) { e.preventDefault(); answer(Number(e.key)); }
    else if (state === 'play' && e.key === 'Enter' && locked) { e.preventDefault(); next(); }
    else if (state === 'start' && e.key === 'Enter' && !e.target.closest('button, a')) { e.preventDefault(); start(); }
  });

  intro();
})();
