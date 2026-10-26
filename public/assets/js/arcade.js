// TFT Arcade – gemeinsame Funktionen aller Seiten:
// Rekorde im Browser, Modus-Umschalter mit Bestenliste, Tageschallenge, Teilen und die Auswertung nach einer Runde.
// Spiele nutzen window.Arcade (siehe unten: Arcade.finishRound, Arcade.share, Arcade.history …).
(function () {
  'use strict';

  const PREFIX = 'tftarcade_';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ───────── Speicher (nur im Browser; privat/gesperrt → leise ohne Speichern weiter) ─────────
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(PREFIX + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; } catch (e) { return false; }
    },
  };

  // Werte wie auf der Seite (gleiche Regeln wie fmtValue() in src/templates/helpers.js)
  function fmt(value, type) {
    if (type === 'zeit') return value.toFixed(1).replace('.', ',') + ' s';
    if (type === 'punkte') return value.toLocaleString('de-DE') + ' Pkt.';
    return String(value);
  }
  // Seitenlink wie im HTML (/quiz); per Doppelklick geöffnet (file://) → quiz.html relativ zu dist/ (vgl. FILE_LINKS in layout.js)
  function pageLink(href) {
    if (location.protocol !== 'file:' || href.charAt(0) !== '/') return href;
    const m = href.match(/^([^?#]*)(.*)$/), root = document.documentElement.getAttribute('data-root') || '';
    return root + (m[1] === '/' ? 'index.html' : m[1].slice(1) + '.html') + m[2];
  }
  const fmtDate = ts => new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // ───────── Helfer für die Spielskripte ─────────
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // Pfad zu einer Datei in public/ (z. B. Champion-Bild) – funktioniert online und per Doppelklick
  const asset = p => (document.documentElement.getAttribute('data-root') || '') + String(p).replace(/^\//, '');
  // Tastatur-Eingaben gehören dem Spiel nur, wenn gerade nicht in ein Feld getippt wird (z. B. Highscore-Name)
  const typing = e => !!(e.target.closest && e.target.closest('input, textarea, select, [contenteditable]'));

  // ───────── Persönliche Rekorde: { [spiel]: { [modus]: { value, date } } } ─────────
  const records = {
    all() { return store.get('rekorde', {}); },
    get(game, mode) { const r = records.all()[game]; return r && r[mode] || null; },
    best(game, lowerIsBetter) {
      const r = records.all()[game]; if (!r) return null;
      return Object.values(r).reduce((b, x) => !b || (lowerIsBetter ? x.value < b.value : x.value > b.value) ? x : b, null);
    },
    // speichert nur, wenn besser; gibt true zurück bei neuem Rekord
    save(game, mode, value, lowerIsBetter) {
      const all = records.all(), cur = all[game] && all[game][mode];
      if (cur && (lowerIsBetter ? value >= cur.value : value <= cur.value)) return false;
      all[game] = all[game] || {};
      all[game][mode] = { value, date: Date.now() };
      store.set('rekorde', all);
      return true;
    },
  };

  // Rekord-Hinweise auf Spielkarten (bester Wert über alle Modi)
  function fillCardRecords() {
    $$('[data-record-slot]').forEach(el => {
      const lower = el.dataset.lower === '1', r = records.best(el.dataset.recordSlot, lower);
      if (!r) return;
      el.lastElementChild.textContent = 'Rekord: ' + fmt(r.value, el.dataset.type);
      el.hidden = false;
    });
  }

  // ───────── Spielseite: Modus, Rekord-Box, Bestenliste ─────────
  const page = $('[data-game-page]');
  const gameId = page && page.dataset.gamePage;

  function currentMode() {
    const checked = $('[data-modes] input:checked');
    if (checked) return checked.value;
    const list = $('[data-board]');
    return list ? list.dataset.board : 'standard';
  }

  function renderRecordBox() {
    const box = $('[data-record-box]');
    if (!box) return;
    const r = records.get(box.dataset.recordBox, currentMode());
    $('[data-record-value]', box).textContent = r ? fmt(r.value, box.dataset.type) : '–';
    $('[data-record-sub]', box).textContent = r ? `Aufgestellt am ${fmtDate(r.date)}` : 'Noch kein Rekord – spiel eine Runde!';
  }

  // ───────── Bestenlisten: Beispieldaten + eigene Namenseinträge ─────────
  // Einträge: { [spiel]: { [modus]: [{ id, name, value, date }] } } – vorerst nur im Browser.
  // Für öffentliche Listen hier später ein Backend anbinden (laden + eintragen), die Darstellung bleibt gleich.
  const entries = {
    all() { return store.get('eintraege', {}); },
    list(game, mode) { const a = entries.all(); return (a[game] && a[game][mode]) || []; },
    add(game, mode, name, value) {
      const a = entries.all(), e = { id: Date.now().toString(36), name, value, date: Date.now() };
      a[game] = a[game] || {};
      (a[game][mode] = a[game][mode] || []).push(e);
      store.set('eintraege', a);
      return e;
    },
  };
  let lastEntryId = null;

  // sortierte Liste eines Modus (Gleichstand: wer zuerst da war, bleibt vorn – wie am Automaten)
  function boardRowsFor(root, mode) {
    let demo = [];
    try { demo = JSON.parse($('[data-board-data]', root).textContent)[mode] || []; } catch (e) { demo = []; }
    const lower = root.dataset.lower === '1';
    const rows = demo.map(([name, value]) => ({ name, value }))
      .concat(entries.list(root.dataset.boardRoot, mode).map(e => ({ ...e, mine: true })));
    rows.sort((a, b) => (lower ? a.value - b.value : b.value - a.value) || (a.date || 0) - (b.date || 0));
    return rows.slice(0, Number(root.dataset.size) || 10);
  }
  // Platz, den ein neuer Wert bekäme – null, wenn er nicht in die Liste passt
  function rankFor(root, mode, value) {
    const lower = root.dataset.lower === '1', size = Number(root.dataset.size) || 10;
    const rank = boardRowsFor(root, mode).filter(r => lower ? r.value <= value : r.value >= value).length + 1;
    return rank <= size ? rank : null;
  }

  // zeichnet die Liste des aktiven Modus neu (Liste im Seitenbereich oder Tabelle der Hall of Fame)
  function renderBoard(root) {
    const mode = root.dataset.mode, type = root.dataset.type;
    $$('[data-board]', root).forEach(list => {
      list.hidden = list.dataset.board !== mode;
      if (list.hidden) return;
      const tr = list.tagName === 'TBODY', rows = boardRowsFor(root, mode);
      list.innerHTML = rows.length ? '' : (tr ? '<tr class="empty"><td colspan="3">Noch keine Einträge.</td></tr>' : '<li class="empty">Noch keine Einträge.</li>');
      rows.forEach((r, i) => {
        const row = document.createElement(tr ? 'tr' : 'li');
        if (r.mine) row.className = 'is-you' + (r.id === lastEntryId ? ' is-new' : '');
        [['rank', i + 1], ['who', r.name], ['val', fmt(r.value, type)]].forEach(([cls, text]) => {
          const cell = document.createElement(tr ? 'td' : 'span');
          cell.className = cls;
          cell.textContent = text;
          row.appendChild(cell);
        });
        list.appendChild(row);
      });
    });
    $$('[data-board-tab]', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.boardTab === mode)));
    const label = $(`[data-modes] input[value="${mode}"] + span`), out = $('[data-board-mode]', root);
    if (label && out) out.textContent = label.textContent;
  }
  const renderBoards = () => $$('[data-board-root]').forEach(renderBoard);

  // Hall of Fame: Modus-Knöpfe je Automat, eigener Rekord je Spiel
  function initHallOfFame() {
    $$('[data-board-tab]').forEach(b => b.addEventListener('click', () => {
      const root = b.closest('[data-board-root]');
      root.dataset.mode = b.dataset.boardTab;
      renderBoard(root);
    }));
    $$('[data-hof-record]').forEach(el => {
      const r = records.best(el.dataset.hofRecord, el.dataset.lower === '1');
      if (r) el.textContent = fmt(r.value, el.dataset.type);
    });
  }

  function initGamePage() {
    if (!page) return;
    // Modus aus der Adresse (?modus=tageschallenge), z. B. vom Ticket der Tageschallenge
    const want = new URLSearchParams(location.search).get('modus');
    const radio = want && $(`[data-modes] input[value="${CSS.escape(want)}"]`);
    if (radio) radio.checked = true;
    const root = $('[data-board-root]');
    const sync = () => { if (root) { root.dataset.mode = currentMode(); renderBoard(root); } };
    $$('[data-modes] input').forEach(i => i.addEventListener('change', () => {
      const u = new URL(location.href);
      u.searchParams.set('modus', i.value);
      history.replaceState(null, '', u);
      renderRecordBox(); sync();
      document.dispatchEvent(new CustomEvent('arcade:mode', { detail: { mode: i.value } }));
    }));
    renderRecordBox(); sync(); renderHistory();
  }

  // ───────── Verlauf (z. B. zuletzt gezogene Vorgaben im Challenge-Roulette) ─────────
  const history_ = {
    list(game) { return store.get('verlauf_' + game, []); },
    add(game, text, max = 8) {
      const list = [{ text, date: Date.now() }, ...history_.list(game)].slice(0, max);
      store.set('verlauf_' + game, list);
      renderHistory();
      return list;
    },
  };
  function renderHistory() {
    const box = $('[data-history]');
    if (!box) return;
    const list = history_.list(box.dataset.history), ol = $('[data-history-list]', box);
    ol.innerHTML = '';
    list.forEach(e => {
      const li = document.createElement('li');
      li.textContent = e.text;
      const s = document.createElement('small');
      s.textContent = new Date(e.date).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' Uhr';
      li.appendChild(s);
      ol.appendChild(li);
    });
    $('[data-history-empty]', box).hidden = list.length > 0;
  }

  // ───────── Meldung & Teilen ─────────
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.innerHTML = '<svg class="ui" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span></span>';
    t.lastElementChild.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* Fallback unten */ }
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  // Ergebnis teilen: kurze Nachricht + Spiel-Link in die Zwischenablage
  async function share(message, url) {
    const link = url || (location.origin + location.pathname);
    const ok = await copy(`${message}\n${link}`);
    toast(ok ? 'Ergebnis kopiert – jetzt einfach einfügen!' : 'Kopieren nicht möglich – bitte manuell markieren.');
    return ok;
  }

  // ───────── Auswertung nach einer Runde ─────────
  // Arcade.finishRound({ value, title, lines: [], shareText, lowerIsBetter, onReplay })
  // speichert den Rekord (falls die Seite einen hat), zeigt die Auswertung und verbindet „Nochmal spielen“/„Ergebnis teilen“.
  function finishRound(o) {
    const el = $('#auswertung');
    if (!el) return;
    const box = $('[data-record-box]'), mode = currentMode();
    let isRecord = false;
    if (box && typeof o.value === 'number') {
      isRecord = records.save(box.dataset.recordBox, mode, o.value, box.dataset.lower === '1');
      renderRecordBox(); renderBoards();
    }
    $('[data-result-title]', el).textContent = o.title || 'Runde vorbei!';
    $('[data-result-value]', el).textContent = typeof o.value === 'number' && box ? fmt(o.value, box.dataset.type) : (o.valueText || '');
    $('[data-result-record]', el).hidden = !isRecord;
    const ul = $('[data-result-lines]', el);
    ul.innerHTML = '';
    (o.lines || []).forEach(l => { const li = document.createElement('li'); li.textContent = l; ul.appendChild(li); });
    // Ergebniskarte erscheint an Stelle der Spielfläche; „Nochmal spielen“ holt die Spielfläche zurück
    const stage = $('#spielflaeche');
    if (stage) stage.hidden = true;
    $('[data-result-replay]', el).onclick = () => {
      el.hidden = true;
      if (stage) stage.hidden = false;
      if (o.onReplay) o.onReplay();
      if (stage) stage.scrollIntoView({ block: 'nearest' });
    };
    $('[data-result-share]', el).onclick = () => share(o.shareText || `${page.dataset.gameTitle}: ${$('[data-result-value]', el).textContent} – schaffst du das? #TFTArcade`);
    el.hidden = false;
    const entry = highscoreEntry(el, mode, o.value);
    (entry || el).focus({ preventScroll: true });
    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    fillCardRecords();
    return isRecord;
  }

  // Namenseintrag wie am Automaten: nur wenn das Ergebnis in die Top 10 kommt. Gibt das Eingabefeld zurück (für den Fokus).
  const NAME_OK = /^[\p{L}\p{N}][\p{L}\p{N} _.-]{1,11}$/u;
  function highscoreEntry(el, mode, value) {
    const form = $('[data-hs-form]', el), done = $('[data-hs-done]', el), root = $('[data-board-root]');
    if (!form || !root) return null;
    form.hidden = true; done.hidden = true;
    const rank = typeof value === 'number' ? rankFor(root, mode, value) : null;
    if (!rank) return null;
    const input = $('.hs-input', form);
    $('[data-hs-rank]', form).textContent = rank;
    input.value = store.get('name', '');
    input.oninput = () => input.setCustomValidity('');
    form.onsubmit = ev => {
      ev.preventDefault();
      const name = input.value.trim().replace(/\s+/g, ' ');
      if (!NAME_OK.test(name)) {
        input.setCustomValidity('2–12 Zeichen: Buchstaben, Zahlen, Leerzeichen, _ . und -');
        input.reportValidity();
        return;
      }
      store.set('name', name);
      const e = entries.add(root.dataset.boardRoot, mode, name, value);
      lastEntryId = e.id;
      renderBoards();
      const place = boardRowsFor(root, mode).findIndex(r => r.id === e.id) + 1;
      $('[data-hs-place]', done).textContent = place;
      $('[data-hs-link]', done).setAttribute('href', pageLink('/bestenliste') + '#' + root.dataset.boardRoot);
      form.hidden = true; form.onsubmit = null;
      done.hidden = false;
      toast(`${name} steht jetzt auf Platz ${place}!`);
    };
    form.hidden = false;
    return input;
  }

  // ───────── Tageschallenge: gleiche Challenge für alle an einem Tag (deutsche Zeit) ─────────
  function berlinParts(d) {
    const p = {};
    new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
      .formatToParts(d).forEach(x => { p[x.type] = Number(x.value); });
    return p;
  }
  function initDaily() {
    const data = $('#daily-data');
    if (!data) return;
    let pool;
    try { pool = JSON.parse(data.textContent); } catch (e) { return; }
    if (!pool.length) return;
    const now = berlinParts(new Date());
    const day = Math.floor(Date.UTC(now.year, now.month - 1, now.day) / 864e5);
    const d = pool[day % pool.length];
    const set = (sel, text) => { const el = $(sel); if (el) el.textContent = text; };
    set('[data-daily-title]', d.title);
    set('[data-daily-text]', d.text);
    set('[data-daily-game]', d.gameTitle);
    set('[data-daily-date]', new Date(Date.UTC(now.year, now.month - 1, now.day, 12)).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }));
    $('[data-daily-link]').setAttribute('href', pageLink(d.href));
    const out = $('[data-daily-countdown]');
    const pad = n => String(n).padStart(2, '0');
    const tick = () => {
      const t = berlinParts(new Date());
      const left = 86400 - (t.hour * 3600 + t.minute * 60 + t.second);
      out.textContent = `${pad(Math.floor(left / 3600))}:${pad(Math.floor(left % 3600 / 60))}:${pad(left % 60)}`;
      if (left <= 1) setTimeout(initDaily, 1500);
    };
    tick();
    clearInterval(initDaily.timer);
    initDaily.timer = setInterval(tick, 1000);
  }

  // ───────── Startseite: Filter-Pillen über den Spielkarten ─────────
  // „Alle Spiele“ zeigt die hervorgehobenen Spiele, ein Bereich alle seine Spiele (auch „Demnächst“)
  function initFilter() {
    const grid = $('[data-filter-grid]');
    if (!grid) return;
    const pills = $$('[data-filter]'), more = $('[data-filter-more]');
    pills.forEach(p => p.addEventListener('click', () => {
      const f = p.dataset.filter;
      pills.forEach(x => x.setAttribute('aria-pressed', String(x === p)));
      $$('.gcard', grid).forEach(c => { c.hidden = f === 'alle' ? !c.hasAttribute('data-featured') : c.dataset.cat !== f; });
      if (more) {
        more.hidden = f === 'alle';
        if (f !== 'alle') $('a', more).setAttribute('href', pageLink('/' + f));
      }
    }));
  }

  // ───────── Mega-Menü „Spielhalle“ ─────────
  // Öffnet beim Darüberfahren (kurze Verzögerung, damit es beim Vorbeifahren nicht aufspringt) und per Klick/Tastatur;
  // schließt mit Esc, Klick daneben oder wenn der Fokus das Menü verlässt. Ohne JavaScript öffnet es per :focus-within (CSS).
  function initMega() {
    const li = $('[data-mega]');
    if (!li) return;
    li.dataset.js = '1';
    const btn = $('.nav-trigger', li), hover = matchMedia('(hover: hover) and (pointer: fine)');
    let t = null;
    const set = open => { clearTimeout(t); li.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); };
    // mit Maus ist es beim Klicken meist schon offen → Klick öffnet nur; auf Touch-Geräten schaltet er um
    btn.addEventListener('click', () => set(hover.matches ? true : !li.classList.contains('is-open')));
    li.addEventListener('mouseenter', () => { if (!hover.matches) return; clearTimeout(t); t = setTimeout(() => set(true), 90); });
    li.addEventListener('mouseleave', () => { if (!hover.matches) return; clearTimeout(t); t = setTimeout(() => set(false), 220); });
    li.addEventListener('focusout', e => { if (!li.contains(e.relatedTarget)) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && li.classList.contains('is-open')) { set(false); btn.focus(); } });
    document.addEventListener('click', e => { if (!li.contains(e.target)) set(false); });
  }

  // „Zufallsspiel“: springt in ein zufälliges spielbares Spiel
  function initRandomGame() {
    $$('[data-random-game]').forEach(a => a.addEventListener('click', e => {
      let list = [];
      try { list = JSON.parse(a.dataset.randomGame); } catch (err) { list = []; }
      if (!list.length) return;
      e.preventDefault();
      location.href = pageLink(list[Math.floor(Math.random() * list.length)]);
    }));
  }

  // Kopfleiste: auf der Startseite durchsichtig über dem Bild, beim Scrollen mit Hintergrund
  function initTopbar() {
    const bar = $('.topbar');
    if (!bar) return;
    const upd = () => bar.classList.toggle('is-scrolled', window.scrollY > 8);
    upd();
    window.addEventListener('scroll', upd, { passive: true });
  }

  // ───────── Start ─────────
  window.Arcade = { store, records, entries, fmt, share, copy, toast, finishRound, history: history_, currentMode, gameId, esc, shuffle, asset, typing };
  fillCardRecords();
  renderBoards();
  initHallOfFame();
  initGamePage();
  initDaily();
  initFilter();
  initTopbar();
  initMega();
  initRandomGame();
})();
