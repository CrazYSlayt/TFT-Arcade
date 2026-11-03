// TFT Arcade – gemeinsamer Ablauf für Quiz mit vier Antworten (Item-Quiz, Trait-Quiz …):
// Frage zeigen, eine von vier Antworten wählen (Klick oder Taste 1–4), Tempo-Bonus, Auflösung, nach zehn Fragen die Auswertung.
// Aufruf aus dem Spielskript: ArcadeQuiz({ title, kicker, intro, preview, rounds, time, questions, wrongLine, shareText })
//   questions() → Liste von Fragen: { label, prompt (HTML), ask (HTML), options: [{ html, label }], answer (Index), solution (Text), layout }
//   layout = CSS-Variante der Antworten: 'tiles' (Bild + Name), 'recipes' (zwei Symbole), 'champs' (Champion-Bilder), 'text'
//   time = [ms für die erste Frage, ms für die letzte] – Zeitlimit pro Frage, schrumpft von Frage zu Frage; abgelaufen = falsch
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste, Ton und Helfer
(function () {
  'use strict';

  const BASE = 100, BONUS = 50;          // Punkte für eine richtige Antwort + Tempo-Bonus
  const FULL_MS = 1000;                  // Bonus voll bis FULL_MS, danach linear weniger bis zum Zeitlimit
  const NEXT_OK = 1100, NEXT_WRONG = 2400;

  window.ArcadeQuiz = function (cfg) {
    const stage = document.getElementById('spielflaeche'), A = window.Arcade;
    if (!stage || !A) return;
    const rounds = cfg.rounds || 10, time = cfg.time || [8000, 5000];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let state = 'start', qs = [], idx = 0, score = 0, bonusSum = 0, correct = 0, wrong = [], late = 0;
    let shownAt = 0, limit = 0, locked = false, timer = null, raf = null, ui = {};
    // Zeitlimit der aktuellen Frage: von time[0] (erste) bis time[1] (letzte)
    const limitFor = i => Math.round(time[0] - (time[0] - time[1]) * i / Math.max(1, qs.length - 1));
    const sec = ms => (ms / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 });

    function intro() {
      state = 'start';
      stage.innerHTML = `<div class="game-intro">
        <p class="game-kicker">${cfg.kicker}</p>
        <h2 class="game-title">${A.esc(cfg.title)}</h2>
        ${cfg.preview || ''}
        <p class="game-text">${cfg.intro} Pro Frage bleiben dir ${sec(time[0])} Sekunden, zum Schluss nur noch ${sec(time[1])}. Tipp: Die Tasten <kbd>1</kbd>–<kbd>4</kbd> sind am schnellsten.</p>
        <button class="btn btn-gold btn-lg" type="button" data-game-start>Los geht’s</button>
      </div>`;
      stage.querySelector('[data-game-start]').addEventListener('click', start);
    }

    function start() {
      clearTimeout(timer); cancelAnimationFrame(raf);
      qs = cfg.questions().slice(0, rounds);
      idx = 0; score = 0; bonusSum = 0; correct = 0; wrong = []; late = 0;
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
      ui.bonus.style.transform = 'scaleX(1)';
      ui.bonus.parentElement.classList.remove('is-hurry');
      limit = limitFor(idx);
      // Uhr startet, sobald die Bilder der Frage zu sehen sind (höchstens 1 s warten); Ende per Timer (verlässlich)
      const imgs = [...stage.querySelectorAll('.qz-prompt img, .qz-opt img')];
      const loaded = Promise.all(imgs.map(im => im.decode ? im.decode().catch(() => {}) : Promise.resolve()));
      shownAt = 0;
      Promise.race([loaded, new Promise(r => setTimeout(r, 1000))]).then(() => {
        if (state !== 'play' || qs[idx] !== qq || locked) return;
        shownAt = performance.now();
        clearTimeout(timer);
        timer = setTimeout(() => { if (state === 'play' && qs[idx] === qq && !locked) answer(-1); }, limit);
        tick();
      });
    }

    // Bonus voll bis FULL_MS, danach linear weniger, beim Zeitlimit weg
    const bonusFor = ms => Math.round(BONUS * Math.max(0, Math.min(1, 1 - (ms - FULL_MS) / (limit - FULL_MS))));

    // Balken = verbleibende Zeit; im letzten Drittel rot und pulsierend, in den letzten 2 Sekunden tickt es
    function tick() {
      cancelAnimationFrame(raf);
      let lastSec = null;
      const step = () => {
        if (locked || !shownAt) return;
        const left = Math.max(0, limit - (performance.now() - shownAt)), s = Math.ceil(left / 1000);
        ui.bonus.style.transform = `scaleX(${left / limit})`;
        ui.bonus.parentElement.classList.toggle('is-hurry', left < limit / 3);
        if (s !== lastSec) { if (s <= 2 && s > 0 && lastSec !== null) A.sound('tick'); lastSec = s; }
        if (left > 0) raf = requestAnimationFrame(step);
      };
      step();
    }

    // i = -1: Zeit abgelaufen
    function answer(i) {
      if (state !== 'play' || locked) return;
      locked = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      ui.bonus.parentElement.classList.remove('is-hurry');
      const qq = qs[idx], ok = i === qq.answer;
      const bonus = ok ? bonusFor(shownAt ? performance.now() - shownAt : limit) : 0, pts = ok ? BASE + bonus : 0;
      score += pts; bonusSum += bonus;
      if (ok) correct++; else wrong.push(qq);
      if (i < 0) late++;
      ui.options.querySelectorAll('.qz-opt').forEach((b, n) => {
        b.disabled = true;
        if (n === i) b.classList.add(ok ? 'is-right' : 'is-wrong');
        if (!ok && n === qq.answer) b.classList.add('is-answer');
      });
      if (!ok) ui.bonus.style.transform = 'scaleX(0)';
      ui.dots[idx].classList.add(ok ? 'is-ok' : 'is-bad');
      ui.score.textContent = score.toLocaleString('de-DE');
      ui.msg.textContent = ok ? `Richtig! +${pts} Punkte${bonus ? ` (davon ${bonus} Tempo-Bonus)` : ''}` : `${i < 0 ? 'Zeit abgelaufen' : 'Leider daneben'} – ${qq.solution}`;
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
        lines: [`${correct} von ${n} richtig · Tempo-Bonus ${bonusSum} Punkte${late ? ` · ${late}× zu langsam` : ''}`, ...(wrong.length && cfg.wrongLine ? [cfg.wrongLine(wrong)] : [])],
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
