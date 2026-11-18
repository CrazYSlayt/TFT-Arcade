// TFT Arcade – Quiz „Splash Art Zoom“: ein stark vergrößerter Ausschnitt einer Splash Art zoomt langsam heraus – welcher Champion ist es?
// Vier Namen zur Auswahl (einer mit gleichen Kosten, einer mit gemeinsamem Trait, einer zufällig), früh raten bringt mehr Punkte.
// Der Zoom läuft über CSS (.qz-prompt.is-running, Dauer = Zeitlimit der Frage aus quiz.js), nach der Antwort ist das ganze Bild zu sehen.
// Daten: window.TFT_ARCADE_CHAMPIONS (daten/champions.js – beim Set-Wechsel mit npm run champions neu, das Spiel passt sich von selbst an)
// Ablauf: window.ArcadeQuiz (quiz.js)
(function () {
  'use strict';

  const data = window.TFT_ARCADE_CHAMPIONS, A = window.Arcade;
  if (!data || !A || !window.ArcadeQuiz) return;
  const esc = A.esc;
  const champs = data.champions.filter(c => c.img);
  const shares = (a, b) => a.traits.some(([n]) => b.traits.some(([m]) => m === n));
  const rnd = (a, b) => Math.round(a + Math.random() * (b - a));

  // Antworten: der Champion + einer mit gleichen Kosten + einer mit gemeinsamem Trait + einer zufällig (keine doppelt)
  function options(c) {
    const others = A.shuffle(champs.filter(x => x !== c)), pick = [];
    const take = test => { const x = others.find(o => !pick.includes(o) && test(o)); if (x) pick.push(x); };
    take(o => o.cost === c.cost);
    take(o => shares(o, c));
    take(() => true);
    while (pick.length < 3) take(() => true);
    return A.shuffle([c, ...pick]);
  }

  function question(c) {
    const opts = options(c);
    // Zoom-Mittelpunkt: zufällig irgendwo auf der Figur (nicht immer das Gesicht), nie ganz am Rand.
    // Kachel-Bilder (art 'tile'): der Champion sitzt im mittleren Quadrat (25–75 % der Breite), Zoom schwächer (CSS .is-tile)
    const tile = c.art === 'tile';
    const x = tile ? rnd(36, 64) : rnd(22, 78), y = tile ? rnd(20, 75) : rnd(15, 70);
    return {
      label: 'Who’s behind the zoom?',
      prompt: `<div class="sz-frame cost-${c.cost}${tile ? ' is-tile' : ''}"><img class="sz-img" src="${A.asset(c.img)}" alt="" width="960" height="480" draggable="false" style="transform-origin:${x}% ${y}%"></div>`,
      ask: 'The picture zooms out – name the champion as early as you can.',
      layout: 'text sz-opts',
      options: opts.map(o => ({ html: `<span class="sz-name">${esc(o.name)}</span>`, label: o.name })),
      answer: opts.indexOf(c),
      solution: `It’s ${c.name}.`,
      champ: c,
    };
  }

  window.ArcadeQuiz({
    title: 'Splash Art Zoom',
    kicker: `10 rounds · ${champs.length} champions · Set ${esc(data.set)}`,
    time: [10000, 7000],
    points: [50, 100],
    unit: 'round',
    intro: 'A tiny piece of a champion’s splash art slowly zooms out. Pick the right name before the full picture shows – the earlier you’re right, the more points you get.',
    preview: `<div class="sz-preview" aria-hidden="true">${A.shuffle(champs).slice(0, 3).map(c => `<span class="cost-${c.cost}"><img src="${A.asset(c.img)}" alt="" width="960" height="480" style="transform-origin:${rnd(35, 65)}% ${rnd(20, 45)}%"></span>`).join('')}</div>`,
    questions: () => A.shuffle(champs).slice(0, 10).map(question),
    wrongLine: wrong => `Champions to learn: ${wrong.map(q => q.champ.name).join(', ')}`,
    shareText: (score, correct, n) => `Splash Art Zoom: ${score.toLocaleString('en-US')} points, ${correct}/${n} champions spotted – can you name them sooner? #TFTArcade`,
  });
})();
