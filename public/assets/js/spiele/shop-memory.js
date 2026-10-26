// TFT Arcade – Challenge „Shop-Memory“: Shop kurz einprägen, Karten werden verdeckt, dann den Shop aus dem Gedächtnis rekonstruieren.
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js, erzeugt mit tools/champions.js)
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste, Highscore-Eintrag und Helfer
(function () {
  'use strict';

  const stage = document.getElementById('spielflaeche');
  const data = window.TFT_ARCADE_CHAMPIONS, A = window.Arcade;
  if (!stage || !data || !A) return;

  const ROUNDS = 5, SLOTS = 5;
  const SHOW_MS = [5000, 4000, 3500, 3000, 2500];   // so lange ist der Shop pro Runde zu sehen
  const P_EXACT = 100;     // richtiger Champion am richtigen Platz
  const P_SHOP = 50;       // richtiger Champion, falscher Platz
  const P_PERFECT = 100;   // Bonus für einen komplett richtigen Shop
  const esc = A.esc;
  const coin = n => `<span class="kq-coin">${n}</span>`;
  const sec = ms => (ms / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  let state = 'start', round = 0, score = 0, shop = [], options = [], picks = [], active = 0;
  let totals = { exact: 0, near: 0, perfect: 0 }, raf = null, timer = null, ui = {};

  // ───────── Startbildschirm ─────────
  function intro() {
    state = 'start';
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">${ROUNDS} Runden · ${SLOTS} Champions pro Shop</p>
      <h2 class="game-title">Shop-Memory</h2>
      <p class="game-text">Präg dir den Shop ein – nach ${sec(SHOW_MS[0])} Sekunden wird er verdeckt. Dann setzt du ihn in der richtigen Reihenfolge wieder zusammen. Jede Runde bleibt weniger Zeit.</p>
      <button class="btn btn-gold btn-lg" type="button" data-game-start>Los geht’s</button>
    </div>`;
    stage.querySelector('[data-game-start]').addEventListener('click', start);
  }

  // ───────── Spiel ─────────
  function start() {
    clearTimeout(timer);
    round = 0; score = 0; totals = { exact: 0, near: 0, perfect: 0 };
    state = 'play';
    stage.innerHTML = `<div class="sm">
      <div class="game-hud">
        <span>Runde <b data-sm-round>1</b> / ${ROUNDS}</span>
        <ol class="game-dots" aria-hidden="true">${Array.from({ length: ROUNDS }, () => '<li></li>').join('')}</ol>
        <span>Punkte <b data-sm-score>0</b></span>
      </div>
      <ol class="sm-shop" data-sm-shop aria-label="Shop"></ol>
      <div class="game-timer" aria-hidden="true"><span data-sm-timer></span></div>
      <p class="game-msg" data-sm-msg aria-live="polite"></p>
      <div class="sm-options" data-sm-options role="group" aria-label="Champions zur Auswahl"></div>
      <div class="sm-actions">
        <button class="btn btn-gold" type="button" data-sm-check hidden>Prüfen</button>
        <button class="btn btn-gold" type="button" data-sm-next hidden></button>
      </div>
    </div>`;
    const q = s => stage.querySelector(s);
    ui = { round: q('[data-sm-round]'), score: q('[data-sm-score]'), shop: q('[data-sm-shop]'), timer: q('[data-sm-timer]'), msg: q('[data-sm-msg]'),
      options: q('[data-sm-options]'), check: q('[data-sm-check]'), next: q('[data-sm-next]'), dots: [...stage.querySelectorAll('.game-dots li')] };
    ui.check.addEventListener('click', check);
    ui.next.addEventListener('click', nextRound);
    newRound();
  }

  // Shop + Auswahl: 5 Champions im Shop, dazu 5 „Fallen“ mit möglichst gleichen Kosten
  function deal() {
    const deck = A.shuffle(data.champions);
    const s = deck.slice(0, SLOTS), rest = deck.slice(SLOTS), extra = [];
    s.forEach(c => {
      const i = rest.findIndex(x => x.cost === c.cost);
      extra.push(i >= 0 ? rest.splice(i, 1)[0] : rest.shift());
    });
    return { s, o: A.shuffle(s.concat(extra)) };
  }

  const face = (c, extra = '') => `<img src="${A.asset(c.img)}" alt="">${extra}<span class="sm-cost">${coin(c.cost)}</span><span class="sm-name">${esc(c.name)}</span>`;

  function newRound() {
    const d = deal();
    shop = d.s; options = d.o; picks = Array(SLOTS).fill(null); active = 0;
    state = 'memorize';
    ui.round.textContent = round + 1;
    ui.dots.forEach((dot, i) => dot.classList.toggle('is-now', i === round));
    ui.check.hidden = true; ui.next.hidden = true;
    ui.options.classList.add('is-waiting');
    ui.options.innerHTML = '';
    options.forEach(c => { const im = new Image(); im.src = A.asset(c.img); });
    ui.shop.innerHTML = shop.map(c => `<li><div class="sm-card cost-${c.cost}">${face(c)}</div></li>`).join('');
    ui.msg.className = 'game-msg';
    ui.msg.innerHTML = '<b>Merk dir den Shop!</b>';
    ui.timer.style.transform = 'scaleX(1)';
    // Countdown startet erst, wenn alle fünf Bilder zu sehen sind (höchstens 1,5 s warten)
    const imgs = [...ui.shop.querySelectorAll('img')];
    const loaded = Promise.all(imgs.map(im => im.decode ? im.decode().catch(() => {}) : Promise.resolve()));
    Promise.race([loaded, new Promise(r => setTimeout(r, 1500))]).then(() => countdown(SHOW_MS[round]));
  }

  // Ende der Merkzeit per Timer (verlässlich); die Bildschirm-Frames bewegen nur Balken und Restzeit
  function countdown(ms) {
    const t0 = performance.now(), r = round;
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    timer = setTimeout(() => { if (state === 'memorize' && round === r) recall(); }, ms);
    const step = () => {
      if (state !== 'memorize' || round !== r) return;
      const left = Math.max(0, ms - (performance.now() - t0));
      ui.timer.style.transform = `scaleX(${left / ms})`;
      ui.msg.innerHTML = `<b>Merk dir den Shop!</b> Noch ${sec(left)} s`;
      if (left > 0) raf = requestAnimationFrame(step);
    };
    step();
  }

  // ───────── Rekonstruieren ─────────
  function recall() {
    state = 'recall';
    cancelAnimationFrame(raf);
    ui.timer.style.transform = 'scaleX(0)';
    ui.options.classList.remove('is-waiting');
    ui.options.innerHTML = options.map(c => `<button class="sm-opt" type="button" data-id="${c.id}"><img src="${A.asset(c.img)}" alt=""><span>${esc(c.name)}</span></button>`).join('');
    ui.options.querySelectorAll('.sm-opt').forEach(b => b.addEventListener('click', () => pick(b.dataset.id)));
    ui.check.hidden = false;
    renderSlots();
    const first = ui.options.querySelector('.sm-opt');
    if (first) first.focus({ preventScroll: true });
  }

  const byId = id => options.find(c => c.id === id);

  function renderSlots() {
    ui.shop.innerHTML = picks.map((id, i) => {
      const c = id && byId(id), on = i === active ? ' is-active' : '';
      return c
        ? `<li><button class="sm-card is-pick${on}" type="button" data-slot="${i}" aria-label="Platz ${i + 1}: ${esc(c.name)} – zum Entfernen klicken"><img src="${A.asset(c.img)}" alt=""><span class="sm-name">${esc(c.name)}</span></button></li>`
        : `<li><button class="sm-card is-back${on}" type="button" data-slot="${i}" aria-label="Platz ${i + 1}: leer"><span class="sm-num">${i + 1}</span></button></li>`;
    }).join('');
    ui.shop.querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => slot(Number(b.dataset.slot))));
    ui.options.querySelectorAll('.sm-opt').forEach(b => { b.disabled = picks.includes(b.dataset.id); });
    const full = picks.every(Boolean);
    ui.check.disabled = !full;
    ui.msg.className = 'game-msg';
    ui.msg.innerHTML = full ? 'Alles belegt – <b>Prüfen</b> oder Plätze ändern.' : `Wer stand auf <b>Platz ${active + 1}</b>?`;
  }

  function pick(id) {
    if (state !== 'recall' || picks.includes(id)) return;
    picks[active] = id;
    const free = picks.indexOf(null, active + 1) >= 0 ? picks.indexOf(null, active + 1) : picks.indexOf(null);
    active = free >= 0 ? free : active;
    renderSlots();
    if (picks.every(Boolean)) ui.check.focus({ preventScroll: true });
  }

  // belegter Platz → wieder frei machen; leerer Platz → als nächstes füllen
  function slot(i) {
    if (state !== 'recall') return;
    picks[i] = null;
    active = i;
    renderSlots();
  }

  // ───────── Auflösung ─────────
  function check() {
    if (state !== 'recall' || !picks.every(Boolean)) return;
    state = 'reveal';
    let exact = 0, near = 0;
    const ids = shop.map(c => c.id);
    ui.shop.innerHTML = shop.map((c, i) => {
      const p = picks[i], ok = p === c.id, inShop = !ok && ids.includes(p);
      if (ok) exact++; else if (inShop) near++;
      const cls = ok ? 'is-ok' : inShop ? 'is-near' : 'is-bad';
      const mark = `<span class="sm-mark" aria-hidden="true">${ok ? '✓' : inShop ? '~' : '✗'}</span>`;
      const tip = ok ? '' : `<span class="sm-tip">Dein Tipp: <s>${esc(byId(p).name)}</s></span>`;
      return `<li><div class="sm-card cost-${c.cost} ${cls}" aria-label="Platz ${i + 1}: ${esc(c.name)} – ${ok ? 'richtig' : 'dein Tipp: ' + esc(byId(p).name)}">${face(c, mark + tip)}</div></li>`;
    }).join('');
    const perfect = exact === SLOTS;
    const pts = exact * P_EXACT + near * P_SHOP + (perfect ? P_PERFECT : 0);
    score += pts; totals.exact += exact; totals.near += near; if (perfect) totals.perfect++;
    ui.score.textContent = score.toLocaleString('de-DE');
    ui.dots[round].classList.add(perfect ? 'is-ok' : exact + near >= 3 ? 'is-near' : 'is-bad');
    ui.options.querySelectorAll('.sm-opt').forEach(b => { b.disabled = true; });
    ui.msg.className = 'game-msg ' + (perfect ? 'is-ok' : exact + near >= 3 ? 'is-near' : 'is-bad');
    ui.msg.textContent = perfect
      ? `Perfekter Shop! +${pts} Punkte (inkl. ${P_PERFECT} Bonus)`
      : `${exact} am richtigen Platz${near ? `, ${near} im Shop, aber falsch platziert` : ''} · +${pts} Punkte`;
    ui.check.hidden = true;
    ui.next.textContent = round + 1 < ROUNDS ? 'Nächste Runde' : 'Zur Auswertung';
    ui.next.hidden = false;
    ui.next.focus({ preventScroll: true });
  }

  function nextRound() {
    if (state !== 'reveal') return;
    round++;
    if (round < ROUNDS) newRound(); else finish();
  }

  // ───────── Auswertung (einheitliche Ergebniskarte aus arcade.js) ─────────
  function finish() {
    state = 'done';
    const all = ROUNDS * SLOTS;
    const title = totals.perfect === ROUNDS ? 'Fotografisches Gedächtnis!' : totals.exact >= all * .7 ? 'Starkes Gedächtnis!' : totals.exact >= all * .4 ? 'Gar nicht schlecht!' : 'Da geht noch was!';
    A.finishRound({
      value: score,
      title,
      lines: [
        `${totals.exact} von ${all} Champions am richtigen Platz${totals.near ? ` · ${totals.near} im Shop, aber falsch platziert` : ''}`,
        `${totals.perfect} von ${ROUNDS} Shops perfekt`,
      ],
      shareText: `Shop-Memory: ${score.toLocaleString('de-DE')} Punkte, ${totals.perfect}/${ROUNDS} perfekte Shops – merkst du dir mehr? #TFTArcade`,
      onReplay: start,
    });
  }

  // Enter: prüfen bzw. weiter (außer auf Buttons/Links – die lösen Enter selbst aus)
  document.addEventListener('keydown', e => {
    if (stage.hidden || e.key !== 'Enter' || A.typing(e) || (e.target.closest && e.target.closest('button, a, summary'))) return;
    if (state === 'recall' && picks.every(Boolean)) { e.preventDefault(); check(); }
    else if (state === 'reveal') { e.preventDefault(); nextRound(); }
    else if (state === 'start') { e.preventDefault(); start(); }
  });

  intro();
})();
