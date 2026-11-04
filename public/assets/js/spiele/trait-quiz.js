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

  // „Welche Stufen?“: nur Reihen gleicher Länge (sonst verrät die Anzahl die Antwort) –
  // eine Stufe um 1 verschoben, alle verschoben oder die Stufen eines anderen Traits
  function steps(t) {
    const right = bpText(t.bp), seen = new Set([right]), near = [], other = [];
    const ok = bp => bp.every((x, i) => x >= 1 && (!i || x > bp[i - 1]));
    const add = (bp, list) => { const s = bpText(bp); if (ok(bp) && !seen.has(s)) { seen.add(s); list.push(s); } };
    t.bp.forEach((x, i) => [1, -1].forEach(d => add(t.bp.map((y, j) => j === i ? y + d : y), near)));
    add(t.bp.map(x => x + 1), near);
    add(t.bp.map(x => x - 1), near);
    A.shuffle(stepped).filter(x => x.bp.length === t.bp.length).forEach(x => add(x.bp, other));
    // zwei knapp daneben, eine fremde Reihe – falls zu wenige, auffüllen
    const pick = [...A.shuffle(near).slice(0, 2), ...other.slice(0, 1)];
    for (const s of [...A.shuffle(near), ...other]) if (pick.length < 3 && !pick.includes(s)) pick.push(s);
    const opts = A.shuffle([right, ...pick.slice(0, 3)]);
    return {
      label: 'Which breakpoints?',
      prompt: traitPrompt(t),
      ask: `At how many champions does <b>${esc(t.name)}</b> activate?`,
      layout: 'text',
      options: opts.map(s => ({ html: `<span class="qz-steps">${s}</span>`, label: s.replace(/ · /g, ', ') })),
      answer: opts.indexOf(right),
      solution: `${t.name} has the breakpoints ${right}.`,
    };
  }

  // „Wer gehört dazu?“: ein Champion mit dem Trait, drei ohne (bevorzugt gleiche Kosten)
  function whoHas(t) {
    const right = champ[A.shuffle(t.champs.filter(id => champ[id]))[0]];
    // falsche Champions: bevorzugt mit einem gemeinsamen Trait mit dem richtigen, sonst gleiche Kosten
    const without = A.shuffle(data.champions.filter(c => !hasTrait(c, t)));
    const shares = c => c.traits.some(([n]) => right.traits.some(([m]) => m === n));
    const wrong = [...without.filter(shares), ...without.filter(c => !shares(c) && c.cost === right.cost), ...without.filter(c => !shares(c) && c.cost !== right.cost)].slice(0, 3);
    const opts = A.shuffle([right, ...wrong]);
    return {
      label: 'Who belongs to it?',
      prompt: traitPrompt(t),
      ask: `Which champion has the trait <b>${esc(t.name)}</b>?`,
      layout: 'champs',
      options: opts.map(c => ({ html: champTile(c), label: c.name })),
      answer: opts.indexOf(right),
      solution: `${right.name} belongs to ${t.name}.`,
    };
  }

  // „Welcher Trait?“: Champion zeigen, einer seiner Traits gegen drei fremde
  function whichTrait(c) {
    const own = traits.filter(t => hasTrait(c, t)), right = A.shuffle(own)[0];
    const opts = A.shuffle([right, ...A.shuffle(traits.filter(t => !own.includes(t))).slice(0, 3)]);
    return {
      label: 'Which trait?',
      prompt: `<div class="qz-subject is-champ"><img class="qz-champ-big cost-${c.cost}" src="${A.asset(c.img)}" alt="" width="960" height="480"><span class="qz-subject-name">${esc(c.name)}</span></div>`,
      ask: `Which of these traits does <b>${esc(c.name)}</b> have?`,
      layout: 'tiles',
      options: opts.map(t => ({ html: `${badge(t)}<span class="qz-name">${esc(t.name)}</span>`, label: t.name })),
      answer: opts.indexOf(right),
      solution: `${c.name} has ${own.map(t => t.name).join(', ')}.`,
    };
  }

  window.ArcadeQuiz({
    title: 'Trait Quiz',
    kicker: `10 questions · ${traits.length} traits · Set ${esc(data.set)}`,
    time: [7000, 4000],
    intro: 'How many champions activate a trait, who belongs to it, and which trait does this champion have? The faster you’re right, the more points you score.',
    preview: `<div class="qz-preview" aria-hidden="true">${A.shuffle(stepped).slice(0, 4).map(t => badge(t)).join('')}</div>`,
    // vier Stufen-Fragen, je drei der anderen Arten, in zufälliger Reihenfolge; kein Trait wird zweimal gefragt
    questions: () => {
      const st = A.shuffle(stepped).slice(0, 4), who = A.shuffle(traits.filter(t => !st.includes(t))).slice(0, 3);
      const withChamps = A.shuffle(data.champions.filter(c => c.traits.length));
      return A.shuffle([...st.map(steps), ...who.map(whoHas), ...withChamps.slice(0, 3).map(whichTrait)]);
    },
    shareText: (score, correct, n) => `Trait Quiz: ${score.toLocaleString('en-US')} points, ${correct}/${n} correct – do you know the synergies better? #TFTArcade`,
  });
})();
