// TFT Arcade – Quiz „Trait-Quiz“: Stufen eines Traits, Champion zum Trait, Trait zum Champion.
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js – champions + traits, erzeugt mit tools/champions.js) · Ablauf: window.ArcadeQuiz (quiz.js)
(function () {
  'use strict';

  const data = window.TFT_ARCADE_CHAMPIONS, A = window.Arcade;
  if (!data || !data.traits || !A || !window.ArcadeQuiz) return;
  const esc = A.esc;
  const champ = Object.fromEntries(data.champions.map(c => [c.id, c]));
  const traits = data.traits.filter(t => t.champs.some(id => champ[id]));
  const stepped = traits.filter(t => t.bp.length >= 2);          // Traits mit mehreren Stufen (keine Einzel-Traits)
  const bpText = bp => bp.join(' · ');
  const hasTrait = (c, t) => c.traits.some(([n]) => n === t.name);

  const badge = (t, big) => `<span class="qz-trait${big ? ' is-big' : ''}">${t.icon ? `<img src="${A.asset(t.icon)}" alt="">` : ''}</span>`;
  const traitPrompt = t => `<div class="qz-subject">${badge(t, true)}<span class="qz-subject-name">${esc(t.name)}</span></div>`;
  const champTile = c => `<img class="qz-champ cost-${c.cost}" src="${A.asset(c.img)}" alt="" width="960" height="480"><span class="qz-name">${esc(c.name)}</span>`;

  // „Welche Stufen?“: richtige Stufen gegen verschobene und fremde Stufen
  function steps(t) {
    const right = bpText(t.bp), seen = new Set([right]), wrong = [];
    const add = bp => { const s = bpText(bp); if (bp.every(x => x >= 1) && !seen.has(s)) { seen.add(s); wrong.push(s); } };
    add(t.bp.map(x => x + 1));
    add(t.bp.map(x => x - 1));
    A.shuffle(stepped).filter(x => x.bp.length === t.bp.length).forEach(x => add(x.bp));
    A.shuffle(stepped).forEach(x => add(x.bp));
    const opts = A.shuffle([right, ...A.shuffle(wrong).slice(0, 3)]);
    return {
      label: 'Welche Stufen?',
      prompt: traitPrompt(t),
      ask: `Ab wie vielen Champions greift <b>${esc(t.name)}</b>?`,
      layout: 'text',
      options: opts.map(s => ({ html: `<span class="qz-steps">${s}</span>`, label: s.replace(/ · /g, ', ') })),
      answer: opts.indexOf(right),
      solution: `${t.name} hat die Stufen ${right}.`,
    };
  }

  // „Wer gehört dazu?“: ein Champion mit dem Trait, drei ohne (bevorzugt gleiche Kosten)
  function whoHas(t) {
    const right = champ[A.shuffle(t.champs.filter(id => champ[id]))[0]];
    const without = A.shuffle(data.champions.filter(c => !hasTrait(c, t)));
    const wrong = [...without.filter(c => c.cost === right.cost), ...without.filter(c => c.cost !== right.cost)].slice(0, 3);
    const opts = A.shuffle([right, ...wrong]);
    return {
      label: 'Wer gehört dazu?',
      prompt: traitPrompt(t),
      ask: `Welcher Champion hat den Trait <b>${esc(t.name)}</b>?`,
      layout: 'champs',
      options: opts.map(c => ({ html: champTile(c), label: c.name })),
      answer: opts.indexOf(right),
      solution: `${right.name} gehört zu ${t.name}.`,
    };
  }

  // „Welcher Trait?“: Champion zeigen, einer seiner Traits gegen drei fremde
  function whichTrait(c) {
    const own = traits.filter(t => hasTrait(c, t)), right = A.shuffle(own)[0];
    const opts = A.shuffle([right, ...A.shuffle(traits.filter(t => !own.includes(t))).slice(0, 3)]);
    return {
      label: 'Welcher Trait?',
      prompt: `<div class="qz-subject is-champ"><img class="qz-champ-big cost-${c.cost}" src="${A.asset(c.img)}" alt="" width="960" height="480"><span class="qz-subject-name">${esc(c.name)}</span></div>`,
      ask: `Welchen dieser Traits hat <b>${esc(c.name)}</b>?`,
      layout: 'tiles',
      options: opts.map(t => ({ html: `${badge(t)}<span class="qz-name">${esc(t.name)}</span>`, label: t.name })),
      answer: opts.indexOf(right),
      solution: `${c.name} hat ${own.map(t => t.name).join(', ')}.`,
    };
  }

  window.ArcadeQuiz({
    title: 'Trait-Quiz',
    kicker: `10 Fragen · ${traits.length} Traits · Set ${esc(data.set)}`,
    intro: 'Ab wie vielen Champions greift ein Trait, wer gehört dazu, welchen Trait hat dieser Champion? Je schneller du richtig liegst, desto mehr Punkte.',
    preview: `<div class="qz-preview" aria-hidden="true">${A.shuffle(stepped).slice(0, 4).map(t => badge(t)).join('')}</div>`,
    // vier Stufen-Fragen, je drei der anderen Arten, in zufälliger Reihenfolge; kein Trait wird zweimal gefragt
    questions: () => {
      const st = A.shuffle(stepped).slice(0, 4), who = A.shuffle(traits.filter(t => !st.includes(t))).slice(0, 3);
      const withChamps = A.shuffle(data.champions.filter(c => c.traits.length));
      return A.shuffle([...st.map(steps), ...who.map(whoHas), ...withChamps.slice(0, 3).map(whichTrait)]);
    },
    shareText: (score, correct, n) => `Trait-Quiz: ${score.toLocaleString('de-DE')} Punkte, ${correct}/${n} richtig – kennst du die Synergien besser? #TFTArcade`,
  });
})();
