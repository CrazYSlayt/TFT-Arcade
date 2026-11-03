// TFT Arcade – Shop-Odds-Quiz: Shop-Chancen pro Level, Kopien im Pool und XP bis zum nächsten Level.
// Daten: window.TFT_ARCADE_SHOP (daten/shop.js – aus TFTClimbs custom-<Set>.js, erzeugt mit tools/champions.js) · Ablauf: window.ArcadeQuiz (quiz.js)
(function () {
  'use strict';

  const S = window.TFT_ARCADE_SHOP, A = window.Arcade;
  if (!S || !A || !window.ArcadeQuiz) return;
  const MAX_LEVEL = 10;                                   // Level 11 gibt es nur über Augments – nicht abgefragt
  const levels = S.odds.slice(0, MAX_LEVEL).map((row, i) => ({ lvl: i + 1, row }));
  const coin = k => `<span class="kq-coin cost-${k}">${k}</span>`;
  const big = (top, sub) => `<div class="qz-subject"><span class="so-big">${top}</span>${sub ? `<span class="qz-subject-name">${sub}</span>` : ''}</div>`;
  const pctTxt = v => `${v} %`;
  // vier Antworten aus der richtigen und möglichst nahen falschen Zahlen (keine doppelten)
  function options(right, pool, fmt) {
    const near = [...new Set(pool.filter(v => v !== right))].sort((a, b) => Math.abs(a - right) - Math.abs(b - right));
    const wrong = A.shuffle(near.slice(0, 5)).slice(0, 3);
    const opts = A.shuffle([right, ...wrong]);
    return { options: opts.map(v => ({ html: `<span class="qz-steps">${fmt(v)}</span>`, label: fmt(v) })), answer: opts.indexOf(right) };
  }

  // „Wie hoch ist die Chance?“: Level + Kosten → Prozent pro Shop-Slot. Falsche Antworten aus Nachbar-Leveln und anderen Kosten.
  function oddsQ(lvl, k) {
    const right = S.odds[lvl - 1][k - 1];
    const pool = [...S.odds[lvl - 1], ...[-2, -1, 1, 2].map(d => (S.odds[lvl - 1 + d] || [])[k - 1]).filter(v => v != null), right + 5, Math.max(1, right - 5)].filter(v => v > 0);
    return {
      label: 'Wie hoch ist die Chance?',
      prompt: big(`Level ${lvl}`, `${coin(k)} ${k}-Kosten`),
      ask: `Wie hoch ist auf <b>Level ${lvl}</b> die Chance auf einen <b>${k}-Kosten</b> pro Shop-Slot?`,
      layout: 'text', ...options(right, pool, pctTxt),
      solution: `Level ${lvl}: ${right} % pro Slot für ${k}-Kosten.`,
    };
  }
  // „Welches Level?“: Kosten + Prozent → Level (nur eindeutige Werte)
  function levelQ(k) {
    const cand = levels.filter(l => l.row[k - 1] > 0 && levels.filter(m => m.row[k - 1] === l.row[k - 1]).length === 1);
    const l = cand[Math.floor(Math.random() * cand.length)], right = l.lvl;
    const pool = levels.filter(m => m.row[k - 1] > 0).map(m => m.lvl);
    return {
      label: 'Welches Level?',
      prompt: big(pctTxt(l.row[k - 1]), `${coin(k)} ${k}-Kosten`),
      ask: `Auf welchem Level hast du <b>${l.row[k - 1]} %</b> Chance auf einen <b>${k}-Kosten</b>?`,
      layout: 'text', ...options(right, pool, v => `Level ${v}`),
      solution: `Auf Level ${right} sind es ${l.row[k - 1]} % für ${k}-Kosten.`,
    };
  }
  // „Ab wann?“: erstes Level, auf dem eine Kostenstufe im Shop erscheinen kann
  function unlockQ(k) {
    const right = levels.find(l => l.row[k - 1] > 0).lvl;
    return {
      label: 'Ab wann?',
      prompt: big(coin(k), `${k}-Kosten`),
      ask: `Ab welchem Level können <b>${k}-Kosten</b> im Shop auftauchen?`,
      layout: 'text', ...options(right, levels.map(l => l.lvl), v => `Level ${v}`),
      solution: `${k}-Kosten gibt es ab Level ${right} (${levels[right - 1].row[k - 1]} %).`,
    };
  }
  // „Wie viele Kopien?“: Kopien pro Champion einer Kostenstufe im geteilten Pool
  function bagQ(k) {
    const right = S.bag[k - 1];
    return {
      label: 'Wie viele Kopien?',
      prompt: big(coin(k), `${k}-Kosten`),
      ask: `Wie viele Kopien gibt es im Pool von <b>jedem ${k}-Kosten</b>-Champion?`,
      layout: 'text', ...options(right, [...S.bag, right + 2, right - 2, right + 5].filter(v => v > 0), v => `${v} Kopien`),
      solution: `Jeder ${k}-Kosten-Champion hat ${right} Kopien im Pool.`,
    };
  }
  // „Wie viel XP?“: XP von Level x auf x+1
  function xpQ(lvl) {
    const right = S.xp[lvl - 1];
    return {
      label: 'Wie viel XP?',
      prompt: big(`${lvl} → ${lvl + 1}`, 'Level-Aufstieg'),
      ask: `Wie viel XP brauchst du von <b>Level ${lvl}</b> auf <b>Level ${lvl + 1}</b>?`,
      layout: 'text', ...options(right, [...S.xp, right + 4, right - 4, right + 8].filter(v => v > 0), v => `${v} XP`),
      solution: `Von Level ${lvl} auf ${lvl + 1} brauchst du ${right} XP (${Math.ceil(right / 4)}× XP kaufen = ${Math.ceil(right / 4) * 4} Gold).`,
    };
  }

  // Fragen mit echten Unterschieden: Level 4–10, Kosten mit Chance > 0
  const oddsPairs = levels.filter(l => l.lvl >= 4).flatMap(l => l.row.map((v, i) => v > 0 && v < 100 ? [l.lvl, i + 1] : null)).filter(Boolean);

  window.ArcadeQuiz({
    title: 'Shop-Odds-Quiz',
    kicker: `10 Fragen · Set ${A.esc(S.set)}`,
    time: [7000, 4500],
    intro: 'Wie hoch ist die Chance auf einen 4-Kosten auf Level 8? Ab wann kommen 5-Kosten? Wie viele Kopien gibt es von jedem Champion? Je schneller du richtig liegst, desto mehr Punkte.',
    preview: `<div class="qz-preview" aria-hidden="true">${[1, 2, 3, 4, 5].map(coin).join('')}</div>`,
    // vier Chancen-Fragen, zwei „Welches Level?“, je eine zu Freischaltung, Kopien und XP, dazu noch eine XP- oder Kopien-Frage
    questions: () => {
      const odds = A.shuffle(oddsPairs).slice(0, 4).map(([l, k]) => oddsQ(l, k));
      const lv = A.shuffle([2, 3, 4, 5]).slice(0, 2).map(levelQ);
      const bags = A.shuffle([1, 2, 3, 4, 5]).slice(0, 2);
      const xps = A.shuffle([3, 4, 5, 6, 7, 8, 9]).slice(0, 1);
      return A.shuffle([...odds, ...lv, unlockQ(A.shuffle([3, 4, 5])[0]), ...bags.map(bagQ), ...xps.map(xpQ)]);
    },
    wrongLine: () => 'Zum Nachlesen: die Odds-Tabelle unter dem Spiel.',
    shareText: (score, correct, n) => `Shop-Odds-Quiz: ${score.toLocaleString('de-DE')} Punkte, ${correct}/${n} richtig – kennst du die Shop-Chancen besser? #TFTArcade`,
  });
})();
