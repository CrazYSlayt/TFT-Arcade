// TFT Arcade – gemeinsamer Ablauf für Quiz mit vier Antworten (Item-Quiz, Trait-Quiz …):
// Frage zeigen, eine von vier Antworten wählen (Klick oder Taste 1–4), Tempo-Bonus, Auflösung, nach zehn Fragen die Auswertung.
// Aufruf aus dem Spielskript: ArcadeQuiz({ title, kicker, intro, preview, rounds, questions, resultTitle, lines, shareText })
//   questions() → Liste von Fragen: { label, prompt (HTML), ask (HTML), options: [{ html, label }], answer (Index), solution (Text), layout }
//   layout = CSS-Variante der Antworten: 'tiles' (Bild + Name), 'recipes' (zwei Symbole), 'champs' (Champion-Bilder), 'text'
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste, Ton und Helfer
(function () {
  'use strict';

  const BASE = 100, BONUS = 50;          // Punkte für eine richtige Antwort + Tempo-Bonus
  const FULL_MS = 1500, ZERO_MS = 8000;  // Bonus voll bis FULL_MS, danach linear weniger, nach ZERO_MS weg
  const NEXT_OK = 1100, NEXT_WRONG = 2400;

  window.ArcadeQuiz = function (cfg) {
    const stage = document.getElementById('spielflaeche'), A = window.Arcade;
    if (!stage || !A) return;
    const rounds = cfg.rounds || 10;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let state = 'start', qs = [], idx = 0, score = 0, bonusSum = 0, correct = 0, wrong = [];
    let shownAt = 0, locked = false, timer = null, raf = null, ui = {};

    function intro() {
      state = 'start';
      stage.innerHTML = `<div class="game-intro">
        <p class="game-kicker">${cfg.kicker}</p>
        <h2 class="game-title">${A.esc(cfg.title)}</h2>
        ${cfg.preview || ''}
        <p class="game-text">${cfg.intro} Tipp: Die Tasten <kbd>1</kbd>–<kbd>4</kbd> sind am schnellsten.</p>
        <button class="btn btn-gold btn-lg" type="button" data-game-start>Los geht’s</button>
      </div>`;
      stage.querySelector('[data-game-start]').addEventListener('click', start);
    }

    function start() {
      clearTimeout(timer); cancelAnimationFrame(raf);
      qs = cfg.questions().slice(0, rounds);
      idx = 0; score = 0; bonusSum = 0; correct = 0; wrong = [];
      state = 'play';
      stage.innerHTML = `<div class="qz">
        <div class="hud">
          <div class="hud-side">
            <span class="hud-pill">Frage <b data-qz-n>1</b><i>/ ${qs.length}</i></span>
            <ol class="game-dots" aria-hidden="true">${qs.map(() => '<li></li>').join('')}</ol>
          </div>
          <span class="hud-pill hud-score">Punkte <b data-qz-score>0</b></span>
          <div class="hud-side"></div>
        </div>
        <div class="hud-bar" aria-hidden="true"><span data-qz-bonus></span></div>
        <p class="qz-label" data-qz-label></p>
        <div class="qz-prompt" data-qz-prompt></div>
        <p class="game-msg" data-qz-msg aria-live="polite"></p>
        <div class="qz-options" data-qz-options role="group" aria-label="Antworten"></div>
      </div>`;
      const q = s => stage.querySelector(s);
      ui = { n: q('[data-qz-n]'), score: q('[data-qz-score]'), bonus: q('[data-qz-bonus]'), label: q('[data-qz-label]'),
        prompt: q('[data-qz-prompt]'), msg: q('[data-qz-msg]'), options: q('[data-qz-options]'), dots: [...stage.querySelectorAll('.game-dots li')] };
      show();
    }

    function show() {
      const qq = qs[idx];
      locked = false;
      ui.n.textContent = idx + 1;
      ui.label.textContent = qq.label;
      ui.prompt.innerHTML = qq.prompt;
      ui.prompt.className = 'qz-prompt is-new';
      ui.msg.className = 'game-msg';
      ui.msg.innerHTML = qq.ask;
      ui.options.className = 'qz-options qz-' + (qq.layout || 'tiles');
      ui.options.innerHTML = qq.options.map((o, i) => `<button class="qz-opt" type="button" data-i="${i}" aria-label="${A.esc(o.label)}" aria-keyshortcuts="${i + 1}"><span class="qz-key" aria-hidden="true">${i + 1}</span>${o.html}</button>`).join('');
      ui.options.querySelectorAll('.qz-opt').forEach(b => b.addEventListener('click', () => answer(Number(b.dataset.i))));
      ui.dots.forEach((d, i) => d.classList.toggle('is-now', i === idx));
      // Uhr für den Tempo-Bonus startet, sobald die Bilder der Frage zu sehen sind (höchstens 1 s warten)
      const imgs = [...stage.querySelectorAll('.qz-prompt img, .qz-opt img')];
      const loaded = Promise.all(imgs.map(im => im.decode ? im.decode().catch(() => {}) : Promise.resolve()));
      Promise.race([loaded, new Promise(r => setTimeout(r, 1000))]).then(() => {
        if (state !== 'play' || qs[idx] !== qq || locked) return;
        shownAt = performance.now();
        tick();
      });
      shownAt = 0;
    }

    const bonusFor = ms => Math.round(BONUS * Math.max(0, Math.min(1, 1 - (ms - FULL_MS) / (ZERO_MS - FULL_MS))));

    function tick() {
      cancelAnimationFrame(raf);
      const step = () => {
        if (locked || !shownAt) return;
        ui.bonus.style.transform = `scaleX(${bonusFor(performance.now() - shownAt) / BONUS})`;
        raf = requestAnimationFrame(step);
      };
      step();
    }

    function answer(i) {
      if (state !== 'play' || locked) return;
      locked = true;
      cancelAnimationFrame(raf);
      const qq = qs[idx], ok = i === qq.answer;
      const bonus = ok ? bonusFor(shownAt ? performance.now() - shownAt : ZERO_MS) : 0, pts = ok ? BASE + bonus : 0;
      score += pts; bonusSum += bonus;
      if (ok) correct++; else wrong.push(qq);
      ui.options.querySelectorAll('.qz-opt').forEach((b, n) => {
        b.disabled = true;
        if (n === i) b.classList.add(ok ? 'is-right' : 'is-wrong');
        if (!ok && n === qq.answer) b.classList.add('is-answer');
      });
      if (!ok) ui.bonus.style.transform = 'scaleX(0)';
      ui.dots[idx].classList.add(ok ? 'is-ok' : 'is-bad');
      ui.score.textContent = score.toLocaleString('de-DE');
      ui.msg.textContent = ok ? `Richtig! +${pts} Punkte${bonus ? ` (davon ${bonus} Tempo-Bonus)` : ''}` : `Leider daneben – ${qq.solution}`;
      ui.msg.className = 'game-msg ' + (ok ? 'is-ok' : 'is-bad');
      A.sound(ok ? 'ok' : 'bad');
      timer = setTimeout(next, reduced ? (ok ? 1400 : 2800) : (ok ? NEXT_OK : NEXT_WRONG));
    }

    function next() {
      clearTimeout(timer);
      if (state !== 'play' || !locked) return;
      idx++;
      if (idx < qs.length) show(); else finish();
    }

    function finish() {
      state = 'done';
      const n = qs.length;
      A.finishRound({
        value: score,
        title: correct === n ? 'Perfekte Runde!' : correct >= n * .7 ? 'Starke Runde!' : correct >= n * .4 ? 'Gar nicht schlecht!' : 'Da geht noch was!',
        lines: [`${correct} von ${n} richtig · Tempo-Bonus ${bonusSum} Punkte`, ...(wrong.length && cfg.wrongLine ? [cfg.wrongLine(wrong)] : [])],
        shareText: cfg.shareText(score, correct, n),
        onReplay: start,
      });
    }

    document.addEventListener('arcade:restart', start);
    document.addEventListener('keydown', e => {
      if (stage.hidden || e.altKey || e.ctrlKey || e.metaKey || A.typing(e)) return;
      if (state === 'play' && /^[1-4]$/.test(e.key)) { const i = Number(e.key) - 1; if (qs[idx] && i < qs[idx].options.length) { e.preventDefault(); answer(i); } }
      else if (state === 'play' && e.key === 'Enter' && locked) { e.preventDefault(); next(); }
      else if (state === 'start' && e.key === 'Enter' && !e.target.closest('button, a, dialog')) { e.preventDefault(); start(); }
    });

    intro();
  };
})();
