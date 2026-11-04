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
  const pctTxt = v => `${v}%`;
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
      label: 'What are the odds?',
      prompt: big(`Level ${lvl}`, `${coin(k)} ${k}-cost`),
      ask: `On <b>level ${lvl}</b>, what are the odds of a <b>${k}-cost</b> per shop slot?`,
      layout: 'text', ...options(right, pool, pctTxt),
      solution: `Level ${lvl}: ${right}% per slot for ${k}-costs.`,
    };
  }
  // „Welches Level?“: Kosten + Prozent → Level (nur eindeutige Werte)
  function levelQ(k) {
    const cand = levels.filter(l => l.row[k - 1] > 0 && levels.filter(m => m.row[k - 1] === l.row[k - 1]).length === 1);
    const l = cand[Math.floor(Math.random() * cand.length)], right = l.lvl;
    const pool = levels.filter(m => m.row[k - 1] > 0).map(m => m.lvl);
    return {
      label: 'Which level?',
      prompt: big(pctTxt(l.row[k - 1]), `${coin(k)} ${k}-cost`),
      ask: `On which level do you have a <b>${l.row[k - 1]}%</b> chance of a <b>${k}-cost</b>?`,
      layout: 'text', ...options(right, pool, v => `Level ${v}`),
      solution: `Level ${right} has ${l.row[k - 1]}% for ${k}-costs.`,
    };
  }
  // „Ab wann?“: erstes Level, auf dem eine Kostenstufe im Shop erscheinen kann
  function unlockQ(k) {
    const right = levels.find(l => l.row[k - 1] > 0).lvl;
    return {
      label: 'From when?',
      prompt: big(coin(k), `${k}-cost`),
      ask: `From which level can <b>${k}-costs</b> appear in the shop?`,
      layout: 'text', ...options(right, levels.map(l => l.lvl), v => `Level ${v}`),
      solution: `${k}-costs start on level ${right} (${levels[right - 1].row[k - 1]}%).`,
    };
  }
  // „Wie viele Kopien?“: Kopien pro Champion einer Kostenstufe im geteilten Pool
  function bagQ(k) {
    const right = S.bag[k - 1];
    return {
      label: 'How many copies?',
      prompt: big(coin(k), `${k}-cost`),
      ask: `How many copies of <b>each ${k}-cost</b> champion are in the pool?`,
      layout: 'text', ...options(right, [...S.bag, right + 2, right - 2, right + 5].filter(v => v > 0), v => `${v} copies`),
      solution: `Each ${k}-cost champion has ${right} copies in the pool.`,
    };
  }
  // „Wie viel XP?“: XP von Level x auf x+1
  function xpQ(lvl) {
    const right = S.xp[lvl - 1];
    return {
      label: 'How much XP?',
      prompt: big(`${lvl} → ${lvl + 1}`, 'Level up'),
      ask: `How much XP do you need from <b>level ${lvl}</b> to <b>level ${lvl + 1}</b>?`,
      layout: 'text', ...options(right, [...S.xp, right + 4, right - 4, right + 8].filter(v => v > 0), v => `${v} XP`),
      solution: `Level ${lvl} to ${lvl + 1} takes ${right} XP (${Math.ceil(right / 4)}× buy XP = ${Math.ceil(right / 4) * 4} gold).`,
    };
  }

  // Fragen mit echten Unterschieden: Level 4–10, Kosten mit Chance > 0
  const oddsPairs = levels.filter(l => l.lvl >= 4).flatMap(l => l.row.map((v, i) => v > 0 && v < 100 ? [l.lvl, i + 1] : null)).filter(Boolean);

  window.ArcadeQuiz({
    title: 'Shop Odds Quiz',
    kicker: `10 questions · Set ${A.esc(S.set)}`,
    time: [7000, 4500],
    intro: 'What are the odds of a 4-cost on level 8? When do 5-costs start? How many copies of each champion are there? The faster you’re right, the more points you score.',
    preview: `<div class="qz-preview" aria-hidden="true">${[1, 2, 3, 4, 5].map(coin).join('')}</div>`,
    // vier Chancen-Fragen, zwei „Welches Level?“, je eine zu Freischaltung, Kopien und XP, dazu noch eine XP- oder Kopien-Frage
    questions: () => {
      const odds = A.shuffle(oddsPairs).slice(0, 4).map(([l, k]) => oddsQ(l, k));
      const lv = A.shuffle([2, 3, 4, 5]).slice(0, 2).map(levelQ);
      const bags = A.shuffle([1, 2, 3, 4, 5]).slice(0, 2);
      const xps = A.shuffle([3, 4, 5, 6, 7, 8, 9]).slice(0, 1);
      return A.shuffle([...odds, ...lv, unlockQ(A.shuffle([3, 4, 5])[0]), ...bags.map(bagQ), ...xps.map(xpQ)]);
    },
    wrongLine: () => 'Look it up in the odds table below the game.',
    shareText: (score, correct, n) => `Shop Odds Quiz: ${score.toLocaleString('en-US')} points, ${correct}/${n} correct – do you know the shop odds better? #TFTArcade`,
  });
})();
