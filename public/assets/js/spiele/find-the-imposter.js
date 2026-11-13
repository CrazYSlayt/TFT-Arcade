// TFT Arcade – Quiz „Find the Imposter“: vier Champions, drei teilen einen Trait – welcher gehört nicht dazu?
// Jede Frage wird geprüft, damit es genau eine Lösung gibt: kein zweiter Trait, den drei der vier teilen und der auf einen anderen
// Champion zeigt, und keine Kosten, die den Imposter verraten (nie drei mit gleichen Kosten).
// Schwierigkeit steigt: Fragen 1–3 teilt der Imposter keinen Trait mit den anderen, 4–7 mit einem, 8–10 mit zweien (Täuschung).
// Nach der Antwort zeigen die Karten ihre Traits, der gemeinsame leuchtet – so lernt man das Set beim Spielen.
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js) · Ablauf: window.ArcadeQuiz (quiz.js)
(function () {
  'use strict';

  const data = window.TFT_ARCADE_CHAMPIONS, A = window.Arcade;
  if (!data || !data.traits || !A || !window.ArcadeQuiz) return;
  const esc = A.esc;
  const champs = data.champions.filter(c => c.traits.length);
  const byId = Object.fromEntries(champs.map(c => [c.id, c]));
  const has = (c, name) => c.traits.some(([n]) => n === name);
  const members = t => t.champs.filter(id => byId[id]).map(id => byId[id]);
  const groups = data.traits.filter(t => members(t).length >= 3);   // nur Traits mit mindestens drei Champions
  const shares = (a, b) => a.traits.some(([n]) => has(b, n));

  // genau eine Lösung? – jeder andere Trait, den drei der vier haben, muss ebenfalls den Imposter ausschließen; Kosten dürfen nichts verraten
  function fair(four, imp) {
    const names = new Set(four.flatMap(c => c.traits.map(([n]) => n)));
    for (const n of names) {
      const holders = four.filter(c => has(c, n));
      if (holders.length === 3 && holders.includes(imp)) return false;
    }
    const cost = {};
    four.forEach(c => { cost[c.cost] = (cost[c.cost] || 0) + 1; });
    return !Object.values(cost).some(k => k === 3);
  }

  // level 0: Imposter teilt mit keinem der drei einen Trait · 1: mit genau einem · 2: mit mindestens zweien
  function question(level, used) {
    for (let tries = 0; tries < 600; tries++) {
      const strict = tries < 450;
      const t = A.shuffle(groups.filter(g => !used.traits.has(g.name)))[0] || A.shuffle(groups)[0];
      const trio = A.shuffle(members(t)).slice(0, 3);
      const pool = A.shuffle(champs.filter(c => !has(c, t.name) && !used.imps.has(c.id)));
      const imp = pool.find(c => {
        const k = trio.filter(m => shares(m, c)).length;
        return (!strict || (level === 0 ? k === 0 : level === 1 ? k === 1 : k >= 2)) && fair([...trio, c], c);
      });
      if (!imp) continue;
      used.traits.add(t.name); used.imps.add(imp.id);
      const opts = A.shuffle([...trio, imp]);
      return {
        label: ['Find the imposter', 'Sneaky imposter', 'Master of disguise'][level],
        prompt: `<div class="fi-prompt"><span class="fi-lead">Three of them share a trait.</span><span class="fi-sub">One is the imposter.</span></div>`,
        ask: 'Who doesn’t belong?',
        layout: 'champs fi-champs',
        options: opts.map(c => ({ html: tile(c, t.name), label: c.name })),
        answer: opts.indexOf(imp),
        solution: `${trio.map(c => c.name).join(', ')} are ${t.name} – ${imp.name} isn’t.`,
        trait: t.name,
      };
    }
    return null;
  }

  // Karte: Bild und Name; die Traits liegen verdeckt auf dem Bild und erscheinen nach der Antwort (der gesuchte leuchtet)
  function tile(c, key) {
    const tr = c.traits.map(([n, icon]) => `<span class="${n === key ? 'is-key' : ''}">${icon ? `<img src="${A.asset(icon)}" alt="">` : ''}${esc(n)}</span>`).join('');
    return `<span class="fi-pic"><img class="qz-champ cost-${c.cost}" src="${A.asset(c.img)}" alt="" width="960" height="480"><span class="fi-traits" aria-hidden="true">${tr}</span></span><span class="qz-name">${esc(c.name)}</span>`;
  }

  const preview = A.shuffle(groups)[0];
  const previewChamps = A.shuffle(members(preview)).slice(0, 3);
  window.ArcadeQuiz({
    title: 'Find the Imposter',
    kicker: `10 rounds · ${groups.length} traits · Set ${esc(data.set)}`,
    time: [9000, 5500],
    intro: 'Four champions, three of them share a trait. Spot the one who doesn’t belong. It gets sneakier as you go: later imposters share traits with some of the others. After every answer you see all their traits.',
    preview: `<div class="fi-preview" aria-hidden="true">${previewChamps.map(c => `<img class="cost-${c.cost}" src="${A.asset(c.img)}" alt="" width="960" height="480">`).join('')}<span>?</span></div>`,
    questions: () => {
      const used = { traits: new Set(), imps: new Set() };
      return [0, 0, 0, 1, 1, 1, 1, 2, 2, 2].map(l => question(l, used)).filter(Boolean);
    },
    wrongLine: wrong => `Traits to review: ${[...new Set(wrong.map(q => q.trait))].join(', ')}`,
    shareText: (score, correct, n) => `Find the Imposter: ${score.toLocaleString('en-US')} points, ${correct}/${n} imposters caught – can you spot them faster? #TFTArcade`,
  });
})();
