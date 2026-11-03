// TFT Arcade – Challenge „Shop-Memory“: Shop kurz einprägen, Karten werden verdeckt, dann den Shop aus dem Gedächtnis rekonstruieren.
// Zehn Runden, drei Herzen. Modi (Leiste unter der Spielfläche): „Training“ (immer 6 s, ohne Herzen, ohne Wertung) und „Gewertet“.
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js, erzeugt mit tools/champions.js)
// Rahmen: window.Arcade (arcade.js) – Ergebniskarte, Rekord, Bestenliste, Highscore-Eintrag, Ton und Helfer
(function () {
  'use strict';

  const stage = document.getElementById('spielflaeche');
  const data = window.TFT_ARCADE_CHAMPIONS, A = window.Arcade;
  if (!stage || !data || !A) return;

  const ROUNDS = 10, SLOTS = 5, HEARTS = 3;
  const MIN_EXACT = 3;                 // weniger richtig platzierte Champions kosten ein Herz
  const TRAINING_MS = 6000;            // Merkzeit im Training
  const SHOW_FIRST = 4000, SHOW_LAST = 2000;   // gewertet: Merkzeit sinkt von Runde 1 bis 10
  const RECALL_MS = 12000;             // gewertet: so lange bleibt zum Zurücklegen, danach wird automatisch geprüft (leere Plätze = falsch)
  const P_EXACT = 20, P_SHOP = 10, P_PERFECT = 20, P_SPEED = 10;
  const SPEED_MS = RECALL_MS;          // Tempo-Bonus (nur für perfekte Shops): voll bei sofortiger Antwort, zum Ende des Zeitlimits weg
  const esc = A.esc;
  const coin = n => `<span class="kq-coin">${n}</span>`;
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.4C.9 8 3.1 4 7 4c2.1 0 3.6 1.1 5 2.9C13.4 5.1 14.9 4 17 4c3.9 0 6.1 4 4.6 7.6C19.5 16.4 12 21 12 21z"/></svg>';
  const secWord = s => s === 1 ? '1 Sekunde' : `${s} Sekunden`;

  let state = 'start', round = 0, score = 0, hearts = HEARTS, shop = [], options = [], picks = [], active = 0;
  let totals = { exact: 0, near: 0, perfect: 0 }, raf = null, timer = null, recallAt = 0, ui = {};

  const training = () => !A.isRanked(A.currentMode());
  const showMs = () => training() ? TRAINING_MS : Math.round(SHOW_FIRST - (SHOW_FIRST - SHOW_LAST) * round / (ROUNDS - 1));

  // ───────── Startbildschirm ─────────
  function intro() {
    stop();
    state = 'start';
    const t = training();
    stage.innerHTML = `<div class="game-intro">
      <p class="game-kicker">${t ? 'Training · ohne Wertung' : `Gewertet · ${ROUNDS} Runden · ${HEARTS} Herzen`}</p>
      <h2 class="game-title">Shop-Memory</h2>
      <ol class="sm-preview" aria-hidden="true">${[1, 2, 3, 4, 5].map(n => `<li class="cost-${n}"></li>`).join('')}</ol>
      <p class="game-text">${t
        ? `Üb in Ruhe: Der Shop bleibt jede Runde ${TRAINING_MS / 1000} Sekunden sichtbar, Fehler kosten keine Herzen.`
        : `Präg dir den Shop ein – dann wird er verdeckt. Jede Runde bleibt weniger Zeit (${SHOW_FIRST / 1000} bis ${SHOW_LAST / 1000} Sekunden), zum Zurücklegen hast du ${RECALL_MS / 1000} Sekunden. Weniger als ${MIN_EXACT} Champions am richtigen Platz kosten ein Herz.`}</p>
      <button class="btn btn-gold btn-lg" type="button" data-game-start>Los geht’s</button>
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
    round = 0; score = 0; hearts = HEARTS; totals = { exact: 0, near: 0, perfect: 0 };
    state = 'play';
    stage.innerHTML = `<div class="sm">
      <div class="hud">
        <div class="hud-side">
          <span class="hud-pill">Runde <b data-sm-round>1</b><i>/ ${ROUNDS}</i></span>
          <span class="hud-hearts" data-sm-hearts aria-label="${HEARTS} Herzen"${training() ? ' hidden' : ''}>${heart.repeat(HEARTS)}</span>
        </div>
        <span class="hud-pill hud-score">Punkte <b data-sm-score>0</b></span>
        <div class="hud-side"></div>
      </div>
      <div class="hud-bar" aria-hidden="true"><span data-sm-timer></span></div>
      <div class="sm-head">
        <h2 class="sm-title" data-sm-title>Merk dir diesen Shop!</h2>
        <p class="sm-sub" data-sm-sub aria-live="polite"></p>
      </div>
      <ol class="sm-shop" data-sm-shop aria-label="Shop"></ol>
      <div class="sm-options" data-sm-options role="group" aria-label="Champions zur Auswahl"></div>
      <div class="sm-cta">
        <button class="btn btn-gold sm-action" type="button" data-sm-action disabled></button>
        <p class="sm-hint" data-sm-hint></p>
      </div>
    </div>`;
    const q = s => stage.querySelector(s);
    ui = { round: q('[data-sm-round]'), hearts: q('[data-sm-hearts]'), score: q('[data-sm-score]'), timer: q('[data-sm-timer]'),
      title: q('[data-sm-title]'), sub: q('[data-sm-sub]'), shop: q('[data-sm-shop]'), options: q('[data-sm-options]'),
      action: q('[data-sm-action]'), hint: q('[data-sm-hint]') };
    ui.action.addEventListener('click', () => { if (state === 'recall') check(); else if (state === 'reveal') nextRound(); });
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

  // Karte wie im Shop: Rahmen und Edelstein in der Kostenfarbe, Bild, Name mit Kosten, Eigenschaften
  const traits = c => (c.traits || []).map(([n, icon]) => `<li>${icon ? `<img src="${A.asset(icon)}" alt="">` : ''}${esc(n)}</li>`).join('');
  const face = (c, extra = '') => `<span class="sm-gem" aria-hidden="true"></span>
    <span class="sm-pic"><img src="${A.asset(c.img)}" alt=""></span>${extra}
    <span class="sm-info"><span class="sm-row"><b class="sm-name">${esc(c.name)}</b><span class="sm-gold">${coin(c.cost)}</span></span><ul class="sm-traits">${traits(c)}</ul></span>`;

  function setAction(text, enabled) {
    ui.action.textContent = text;
    ui.action.disabled = !enabled;
    ui.action.classList.toggle('is-status', !enabled);
  }

  function newRound() {
    const d = deal();
    shop = d.s; options = d.o; picks = Array(SLOTS).fill(null); active = 0;
    state = 'memorize';
    ui.round.textContent = round + 1;
    ui.options.innerHTML = '';
    ui.options.hidden = true;
    options.forEach(c => { const im = new Image(); im.src = A.asset(c.img); });
    ui.shop.className = 'sm-shop is-deal';
    ui.shop.innerHTML = shop.map((c, i) => `<li style="--i:${i}"><div class="sm-card cost-${c.cost}">${face(c)}</div></li>`).join('');
    ui.title.textContent = 'Merk dir diesen Shop!';
    ui.title.className = 'sm-title';
    ui.sub.textContent = '';
    setAction('Gleich werden die Karten verdeckt …', false);
    ui.hint.textContent = 'Präge dir Champions und Reihenfolge ein.';
    ui.timer.style.transform = 'scaleX(1)';
    A.sound('flip');
    // Countdown startet erst, wenn alle fünf Bilder zu sehen sind (höchstens 1,5 s warten)
    const imgs = [...ui.shop.querySelectorAll('.sm-pic img')];
    const loaded = Promise.all(imgs.map(im => im.decode ? im.decode().catch(() => {}) : Promise.resolve()));
    Promise.race([loaded, new Promise(r => setTimeout(r, 1500))]).then(() => countdown(showMs()));
  }

  // Ende der Merkzeit per Timer (verlässlich); die Bildschirm-Frames bewegen nur Balken und Restzeit
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
        ui.sub.textContent = `Noch ${secWord(s)}`;
        if (s <= 3 && s > 0 && lastSec !== null) A.sound('tick');
        lastSec = s;
      }
      if (left > 0) raf = requestAnimationFrame(step);
    };
    step();
  }

  // Karten drehen sich um, dann beginnt das Rekonstruieren
  function cover() {
    state = 'cover';
    ui.shop.className = 'sm-shop is-covering';
    A.sound('flip');
    timer = setTimeout(recall, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280);
  }

  // ───────── Rekonstruieren ─────────
  function recall() {
    state = 'recall';
    cancelAnimationFrame(raf);
    ui.shop.className = 'sm-shop is-uncover';
    ui.title.textContent = 'Wer stand wo?';
    ui.options.hidden = false;
    ui.options.innerHTML = options.map(c => `<button class="sm-opt cost-${c.cost}" type="button" data-id="${c.id}"><img src="${A.asset(c.img)}" alt=""><span>${esc(c.name)}</span></button>`).join('');
    ui.options.querySelectorAll('.sm-opt').forEach(b => b.addEventListener('click', () => pick(b.dataset.id)));
    ui.hint.textContent = 'Klick auf einen belegten Platz macht ihn wieder frei.';
    renderSlots();
    recallAt = performance.now();
    // gewertet: Zeitlimit, danach wird mit dem geprüft, was liegt
    if (!training()) { const r = round; timer = setTimeout(() => { if (state === 'recall' && round === r) check(true); }, RECALL_MS); }
    speedBar();
    const first = ui.options.querySelector('.sm-opt');
    if (first) first.focus({ preventScroll: true });
  }

  // Balken zeigt die verbleibende Zeit (zugleich den Tempo-Bonus); im letzten Drittel rot, in den letzten 3 Sekunden tickt es
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

  const byId = id => options.find(c => c.id === id);

  function renderSlots() {
    ui.shop.innerHTML = picks.map((id, i) => {
      const c = id && byId(id), on = i === active ? ' is-active' : '';
      return c
        ? `<li><button class="sm-card cost-${c.cost} is-pick${on}" type="button" data-slot="${i}" aria-label="Platz ${i + 1}: ${esc(c.name)} – zum Entfernen klicken">${face(c)}</button></li>`
        : `<li><button class="sm-card is-back${on}" type="button" data-slot="${i}" aria-label="Platz ${i + 1}: leer"><span class="sm-num">${i + 1}</span></button></li>`;
    }).join('');
    ui.shop.querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => slot(Number(b.dataset.slot))));
    ui.options.querySelectorAll('.sm-opt').forEach(b => { b.disabled = picks.includes(b.dataset.id); });
    const full = picks.every(Boolean);
    ui.sub.innerHTML = full ? 'Alles belegt – prüfen oder Plätze ändern.' : `Wähle den Champion für <b>Platz ${active + 1}</b>.`;
    setAction(full ? 'Prüfen' : `Noch ${picks.filter(p => !p).length} ${picks.filter(p => !p).length === 1 ? 'Platz' : 'Plätze'} frei`, full);
  }

  function pick(id) {
    if (state !== 'recall' || picks.includes(id)) return;
    picks[active] = id;
    const free = picks.indexOf(null, active + 1) >= 0 ? picks.indexOf(null, active + 1) : picks.indexOf(null);
    active = free >= 0 ? free : active;
    A.sound('click');
    renderSlots();
    if (picks.every(Boolean)) ui.action.focus({ preventScroll: true });
  }

  // belegter Platz → wieder frei machen; leerer Platz → als nächstes füllen
  function slot(i) {
    if (state !== 'recall') return;
    picks[i] = null;
    active = i;
    renderSlots();
  }

  // ───────── Auflösung ─────────
  // timeUp: Zeitlimit abgelaufen – leere Plätze zählen als falsch
  function check(timeUp) {
    if (state !== 'recall' || (!timeUp && !picks.every(Boolean))) return;
    state = 'reveal';
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    ui.timer.parentElement.classList.remove('is-hurry');
    const used = performance.now() - recallAt;
    let exact = 0, near = 0;
    const ids = shop.map(c => c.id);
    ui.shop.innerHTML = shop.map((c, i) => {
      const p = picks[i], ok = p === c.id, inShop = !ok && ids.includes(p), guess = p ? byId(p).name : 'leer';
      if (ok) exact++; else if (inShop) near++;
      const cls = ok ? 'is-ok' : inShop ? 'is-near' : 'is-bad';
      const mark = `<span class="sm-mark" aria-hidden="true">${ok ? '✓' : inShop ? '~' : '✗'}</span>`;
      const tip = ok ? '' : `<span class="sm-tip">Dein Tipp: ${p ? `<s>${esc(guess)}</s>` : 'leer'}</span>`;
      return `<li><div class="sm-card cost-${c.cost} ${cls}" aria-label="Platz ${i + 1}: ${esc(c.name)} – ${ok ? 'richtig' : 'dein Tipp: ' + esc(guess)}">${face(c, mark + tip)}</div></li>`;
    }).join('');
    const perfect = exact === SLOTS;
    const speed = perfect ? Math.round(P_SPEED * Math.max(0, 1 - used / SPEED_MS)) : 0;
    const pts = exact * P_EXACT + near * P_SHOP + (perfect ? P_PERFECT + speed : 0);
    score += pts; totals.exact += exact; totals.near += near; if (perfect) totals.perfect++;
    ui.score.textContent = score.toLocaleString('de-DE');
    ui.options.querySelectorAll('.sm-opt').forEach(b => { b.disabled = true; });

    const lost = !training() && exact < MIN_EXACT;
    if (lost) loseHeart();
    ui.title.textContent = perfect ? 'Perfekter Shop!' : exact >= MIN_EXACT ? 'Gut gemerkt!' : timeUp ? 'Zeit abgelaufen!' : lost ? 'Ein Herz weg!' : 'Knapp daneben!';
    ui.title.className = 'sm-title ' + (perfect ? 'is-ok' : exact >= MIN_EXACT ? 'is-near' : 'is-bad');
    ui.sub.textContent = perfect
      ? `+${pts} Punkte (inkl. ${P_PERFECT} Bonus${speed ? ` und ${speed} Tempo` : ''})`
      : `${exact} am richtigen Platz${near ? `, ${near} im Shop, aber falsch platziert` : ''} · +${pts} Punkte`;
    A.sound(perfect || exact >= MIN_EXACT ? 'ok' : 'bad');
    const over = hearts === 0 || round + 1 >= ROUNDS;
    setAction(over ? 'Zur Auswertung' : 'Nächste Runde', true);
    ui.hint.textContent = over ? '' : 'Enter geht auch.';
    ui.action.focus({ preventScroll: true });
  }

  function loseHeart() {
    hearts--;
    const all = [...ui.hearts.querySelectorAll('svg')];
    if (all[hearts]) all[hearts].classList.add('is-lost');
    ui.hearts.setAttribute('aria-label', `${hearts} ${hearts === 1 ? 'Herz' : 'Herzen'}`);
  }

  function nextRound() {
    if (state !== 'reveal') return;
    round++;
    if (round < ROUNDS && hearts > 0) newRound(); else finish();
  }

  // ───────── Auswertung (einheitliche Ergebniskarte aus arcade.js) ─────────
  function finish() {
    state = 'done';
    stop();
    const played = Math.min(round, ROUNDS), all = played * SLOTS;
    const title = hearts === 0 ? 'Keine Herzen mehr!' : totals.perfect === ROUNDS ? 'Fotografisches Gedächtnis!' : totals.exact >= all * .7 ? 'Starkes Gedächtnis!' : totals.exact >= all * .4 ? 'Gar nicht schlecht!' : 'Da geht noch was!';
    A.sound(hearts === 0 ? 'lose' : 'win');
    A.finishRound({
      value: score,
      title,
      lines: [
        `${played} von ${ROUNDS} Runden · ${totals.perfect} ${totals.perfect === 1 ? 'Shop' : 'Shops'} perfekt`,
        `${totals.exact} von ${all} Champions am richtigen Platz${totals.near ? ` · ${totals.near} im Shop, aber falsch platziert` : ''}`,
      ],
      shareText: `Shop-Memory: ${score.toLocaleString('de-DE')} Punkte, ${totals.perfect}/${ROUNDS} perfekte Shops – merkst du dir mehr? #TFTArcade`,
      onReplay: start,
    });
  }

  // Modus gewechselt → neuer Startbildschirm; „Neu starten“ → sofort neue Runde
  document.addEventListener('arcade:mode', intro);
  document.addEventListener('arcade:restart', start);

  // Enter: prüfen bzw. weiter (außer auf Buttons/Links – die lösen Enter selbst aus)
  document.addEventListener('keydown', e => {
    if (stage.hidden || e.key !== 'Enter' || A.typing(e) || (e.target.closest && e.target.closest('button, a, summary, dialog'))) return;
    if (state === 'recall' && picks.every(Boolean)) { e.preventDefault(); check(); }
    else if (state === 'reveal') { e.preventDefault(); nextRound(); }
    else if (state === 'start') { e.preventDefault(); start(); }
  });

  intro();
})();
