// TFT Arcade – Quiz „Item-Quiz“: zwei Komponenten → welches Item? bzw. Item → welches Rezept?
// Daten: window.TFT_ARCADE_ITEMS (daten/items.js, erzeugt mit tools/champions.js) · Ablauf: window.ArcadeQuiz (quiz.js)
(function () {
  'use strict';

  const data = window.TFT_ARCADE_ITEMS, A = window.Arcade;
  if (!data || !A || !window.ArcadeQuiz) return;
  const esc = A.esc;
  const comp = Object.fromEntries(data.components.map(c => [c.id, c]));
  const icon = (x, cls = '') => `<img class="qz-icon${cls}" src="${A.asset(x.img)}" alt="" width="128" height="128">`;
  const recipeText = it => it.comp.map(c => comp[c].name).join(' + ');
  const sameRecipe = (a, b) => [...a].sort().join() === [...b].sort().join();

  // falsche Antworten: bevorzugt Items, die eine Komponente mit dem richtigen teilen
  function distractItems(it) {
    const others = A.shuffle(data.items.filter(x => x !== it));
    const near = others.filter(x => x.comp.some(c => it.comp.includes(c)));
    return [...near, ...others.filter(x => !near.includes(x))].slice(0, 3);
  }
  // falsche Rezepte: eine Komponente des richtigen Rezepts gegen eine andere getauscht
  function distractRecipes(it) {
    const out = [], ids = Object.keys(comp);
    for (let n = 0; n < 40 && out.length < 3; n++) {
      const keep = n % 2, r = [it.comp[keep], ids[Math.floor(Math.random() * ids.length)]];
      if (!sameRecipe(r, it.comp) && !out.some(o => sameRecipe(o, r))) out.push(r);
    }
    return out;
  }

  // „Was ergibt das?“: zwei Komponenten → vier Items
  function forward(it) {
    const opts = A.shuffle([it, ...distractItems(it)]);
    return {
      label: 'What does this make?',
      prompt: `<div class="qz-recipe">${icon(comp[it.comp[0]])}<span class="qz-op">+</span>${icon(comp[it.comp[1]])}<span class="qz-op">=</span><span class="qz-mystery">?</span></div>`,
      ask: `<b>${esc(comp[it.comp[0]].name)}</b> + <b>${esc(comp[it.comp[1]].name)}</b> makes …`,
      layout: 'tiles',
      options: opts.map(o => ({ html: `${icon(o)}<span class="qz-name">${esc(o.name)}</span>`, label: o.name })),
      answer: opts.indexOf(it),
      solution: `${recipeText(it)} makes ${it.name}.`,
      item: it,
    };
  }

  // „Woraus besteht das?“: Item → vier Rezepte
  function backward(it) {
    const opts = A.shuffle([it.comp, ...distractRecipes(it)]);
    return {
      label: 'What is it made of?',
      prompt: `<div class="qz-recipe">${icon(it, ' is-big')}</div>`,
      ask: `What do you build <b>${esc(it.name)}</b> from?`,
      layout: 'recipes',
      options: opts.map(r => ({ html: `<span class="qz-pair">${icon(comp[r[0]])}<span class="qz-op">+</span>${icon(comp[r[1]])}</span><span class="qz-name">${esc(comp[r[0]].name)} + ${esc(comp[r[1]].name)}</span>`, label: `${comp[r[0]].name} and ${comp[r[1]].name}` })),
      answer: opts.indexOf(it.comp),
      solution: `${it.name} = ${recipeText(it)}.`,
      item: it,
    };
  }

  window.ArcadeQuiz({
    title: 'Item Quiz',
    kicker: `10 questions · ${data.items.length} recipes · Set ${esc(data.set)}`,
    time: [6000, 3500],
    intro: 'Two components: which item do they make? Or the other way round: what is it built from? The faster you’re right, the more points you score.',
    preview: `<div class="qz-recipe is-preview" aria-hidden="true">${A.shuffle(data.components).slice(0, 2).map(c => icon(c)).join('<span class="qz-op">+</span>')}<span class="qz-op">=</span><span class="qz-mystery">?</span></div>`,
    // je fünf Fragen beider Arten in zufälliger Reihenfolge, kein Item doppelt
    questions: () => {
      const kinds = A.shuffle([forward, forward, forward, forward, forward, backward, backward, backward, backward, backward]);
      return A.shuffle(data.items).slice(0, 10).map((it, i) => kinds[i](it));
    },
    wrongLine: list => 'Worth remembering: ' + list.map(q => `${q.item.name} = ${recipeText(q.item)}`).join(' · '),
    shareText: (score, correct, n) => `Item Quiz: ${score.toLocaleString('en-US')} points, ${correct}/${n} recipes correct – do you know more? #TFTArcade`,
  });
})();
