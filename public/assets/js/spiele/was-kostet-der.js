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
  const BONUS = 50;             // Tempo-Bonus: voll bis FULL_MS, danach linear weniger bis ZERO_MS
  const FULL_MS = 1000, ZERO_MS = 6000;
  const NEXT_OK = 1100, NEXT_WRONG = 2300;   // Pause bis zum nächsten Champion
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = A.esc;
  const coin = n => `<span class="kq-coin">${n}</span>`;

  let state = 'start', deck = [], idx = 0, score = 0, bonusSum = 0, correct = 0, answers = [];
  let shownAt = null, locked = false, timer = null, raf = null, ui = {};

  // ───────── Startbildschirm ─────────
  function intro() {
    state = 'start';
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">${ROUNDS} Champions · Set ${esc(data.set)}</p>
      <h2 class="game-title">Was kostet der?</h2>
      <div class="kq-preview" aria-hidden="true">${[1, 2, 3, 4, 5].map(n => `<span class="kq-chip cost-${n}">${coin(n)}</span>`).join('')}</div>
      <p class="game-text">Je schneller du richtig liegst, desto mehr Punkte. Tipp: Die Tasten <kbd>1</kbd>–<kbd>5</kbd> sind am schnellsten.</p>
      <button class="btn btn-gold btn-lg" type="button" data-game-start>Los geht’s</button>
    </div>`;
    stage.querySelector('[data-game-start]').addEventListener('click', start);
  }

  // ───────── Runde ─────────
  function start() {
    clearTimeout(timer);
    deck = A.shuffle(data.champions).slice(0, ROUNDS);
    deck.forEach(c => { const im = new Image(); im.src = A.asset(c.img); });   // Bilder vorladen
    idx = 0; score = 0; bonusSum = 0; correct = 0; answers = [];
    state = 'play';
    stage.innerHTML = `<div class="kq">
      <div class="game-hud">
        <span>Champion <b data-kq-n>1</b> / ${ROUNDS}</span>
        <ol class="game-dots" aria-hidden="true">${deck.map(() => '<li></li>').join('')}</ol>
        <span>Punkte <b data-kq-score>0</b></span>
      </div>
      <figure class="kq-figure">
        <img class="kq-img" data-kq-img alt="" width="960" height="480">
        <figcaption class="kq-name" data-kq-name></figcaption>
      </figure>
      <div class="game-timer" aria-hidden="true"><span data-kq-bonus></span></div>
      <p class="game-msg" data-kq-feedback aria-live="polite"></p>
      <div class="kq-costs" role="group" aria-label="Kosten wählen">
        ${[1, 2, 3, 4, 5].map(n => `<button class="kq-cost cost-${n}" type="button" data-cost="${n}" aria-label="${n} Gold" aria-keyshortcuts="${n}">${coin(n)}<span class="kq-gold">Gold</span></button>`).join('')}
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
    ui.img.alt = `Splash-Art von ${c.name}`;
    // vor der Antwort steht hier die Frage, danach die Auflösung
    ui.feedback.innerHTML = `Wie viel Gold kostet <b>${esc(c.name)}</b>?`;
    ui.feedback.className = 'game-msg';
    ui.figure.classList.remove('is-ok', 'is-bad');
    ui.dots.forEach((d, i) => d.classList.toggle('is-now', i === idx));
    ui.buttons.forEach(b => { b.disabled = false; b.classList.remove('is-right', 'is-wrong', 'is-answer'); });
    // Uhr für den Tempo-Bonus startet erst, wenn das Bild zu sehen ist
    const ready = () => { if (shownAt === null && state === 'play' && deck[idx] === c) { shownAt = performance.now(); tick(); } };
    ui.img.onload = ready;
    ui.img.onerror = ready;
    ui.img.src = A.asset(c.img);
    if (ui.img.complete) ready();
  }

  const bonusFor = ms => Math.round(BONUS * Math.max(0, Math.min(1, 1 - (ms - FULL_MS) / (ZERO_MS - FULL_MS))));

  // Bonus-Balken schrumpft mit der Zeit
  function tick() {
    cancelAnimationFrame(raf);
    const step = () => {
      if (locked || shownAt === null) return;
      ui.bonus.style.transform = `scaleX(${bonusFor(performance.now() - shownAt) / BONUS})`;
      raf = requestAnimationFrame(step);
    };
    step();
  }

  function answer(cost) {
    if (state !== 'play' || locked) return;
    locked = true;
    cancelAnimationFrame(raf);
    const c = deck[idx], ok = cost === c.cost;
    const bonus = ok ? bonusFor(shownAt === null ? ZERO_MS : performance.now() - shownAt) : 0;
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
    if (!ok) ui.bonus.style.transform = 'scaleX(0)';
    ui.dots[idx].classList.add(ok ? 'is-ok' : 'is-bad');
    ui.score.textContent = score.toLocaleString('de-DE');
    ui.feedback.textContent = ok
      ? `Richtig! +${pts} Punkte${bonus ? ` (davon ${bonus} Tempo-Bonus)` : ''}`
      : `Leider daneben – ${c.name} kostet ${c.cost} Gold.`;
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
    const title = correct === ROUNDS ? 'Perfekte Runde!' : correct >= 7 ? 'Starke Runde!' : correct >= 4 ? 'Gar nicht schlecht!' : 'Da geht noch was!';
    A.finishRound({
      value: score,
      title,
      lines: [
        `${correct} von ${ROUNDS} richtig · Tempo-Bonus ${bonusSum} Punkte`,
        ...(wrong.length ? ['Daneben: ' + wrong.map(a => `${a.champ.name} (${a.champ.cost} statt ${a.cost} Gold)`).join(', ')] : []),
      ],
      shareText: `Was kostet der? ${score.toLocaleString('de-DE')} Punkte, ${correct}/${ROUNDS} richtig – schlägst du mich? #TFTArcade`,
      onReplay: start,
    });
  }

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
