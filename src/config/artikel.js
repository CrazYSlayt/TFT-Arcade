// TFT Arcade – SEO-Artikel unter den Spielen (Muster wie bei den TFTClimb-Tools): Einleitung mit Vorschaubild, Abschnitte, FAQ ganz unten.
// Die Arcade besetzt Spiel-Begriffe (simulator, quiz, game, daily, practice); Nachschlage-Themen (Odds, Rechner, Tierlist) verlinken auf TFTClimb.
// Nur belegbare Aussagen: Zahlen des Sets kommen aus den Daten (ctx.shop, ctx.champions, ctx.items) und bleiben dadurch nach Patches richtig.
// title = H2 des Artikels, alt = Alt-Text des Bildes (mit Keyword), intro/sections = HTML, faq = [Frage, Antwort]
const CLIMB = 'https://www.tftclimb.com';

module.exports = ctx => {
  const S = ctx.shop, C = ctx.champions, I = ctx.items, set = `Set ${S.set}`;
  const copies5 = S.bag[4], five = S.distinct[4], odds5 = S.odds[9][4];
  // Links im Fließtext: zur Arcade ohne Zusatz, zu TFTClimb mit UTM-Werten (Klicks erscheinen in dessen Analytics)
  const play = (id, text) => `<a class="art-a" href="${ctx.gameUrl(ctx.games.find(g => g.id === id))}">${text}</a>`;
  const climb = (id, url, text) => `<a class="art-a" href="${CLIMB}${url}?utm_source=tftarcade&amp;utm_medium=referral&amp;utm_campaign=${id}" target="_blank" rel="noopener">${text}</a>`;
  const FREE = ['Is it free?', 'Yes. It runs in your browser, with no download and no sign-up.'];

  return {
    'roll-simulator': {
      title: 'TFT Roll Simulator: Hit a 3-Star 5-Cost',
      alt: 'TFT Roll Simulator: roll for a 3-star 5-cost on level 10',
      intro: `<p>This TFT roll simulator starts you on level 10 with an empty board and bench and one target: a 5-cost champion you have to take to three stars. You roll, buy, sell and move your units around on a hex board, just like in a real rolldown, while the clock counts up.</p>`,
      sections: [
        ['How the shop works', `<p>Every shop has five slots, and each slot is drawn separately. On level 10 a slot is a 5-cost ${odds5}% of the time. The simulator then picks a champion based on the copies left in the pool. ${set} has ${five} different 5-costs with ${copies5} copies each, so three stars takes every single copy of your target.</p>
          <p>Champions you don’t buy go back into the pool on your next reroll. Opponents hold 30 to 60% of the other 5-costs, which makes your target a little easier to find, but they hold no copies of your target. Without that rule three stars wouldn’t be possible.</p>`],
        ['How many rolls does it take?', `<p>Expect around 100 rolls on level 10, which is roughly 250 gold including the nine buys. In our test runs one round in ten took fewer than 60 rolls and one in ten took more than 170, so luck plays a big part. On level 11 it was closer to 70 rolls, on level 9 closer to 170. You can try those levels in Training.</p>
          <p>Planning a real rolldown? The ${climb('roll-simulator', '/en/tools/tft-rolldown-calculator', 'TFT Rolldown Calculator on TFTClimb')} shows your chances for any champion, level and gold amount.</p>`],
      ],
      faq: [
        ['Does the TFT Roll Simulator use real shop odds?', `Yes. Shop odds and copies per champion come from the ${set} data on TFTClimb.`],
        ['Is it exactly like the game?', 'No. Opponents don’t roll during the round, and there are no items or augments. Gold is unlimited, so only your time counts.'],
        ['What are the controls?', 'D rerolls, 1 to 5 buy a champion and E sells the unit under your cursor. You can drag units between board and bench.'],
        FREE,
      ],
    },
    'champion-quiz': {
      title: 'TFT Champion Quiz: Guess the Champion',
      alt: 'TFT Champion Quiz: guess the champion from six clues',
      intro: `<p>How well do you know the ${C.champions.length} champions of ${set}? This TFT champion quiz gives you one clue at a time, and you type the name as soon as you know it. The fewer clues you need, the more points you score.</p>`,
      sections: [
        ['Six clues per champion', `<p>You start with the role and range, then get the cost, one trait, the ability name, all traits and finally a blurred splash art. A new clue appears every five seconds. A wrong guess reveals the next one right away and tells you whether the target costs more or less and how many traits your guess shares with it.</p>`],
        ['The Daily Puzzle', `<p>The Daily Puzzle gives everyone the same champion. There’s no clock and you get one try per day, so you can take your time. Solve it on consecutive days to build a streak, and share your result without spoiling the answer.</p>
          <p>Stuck on a champion? The ${climb('champion-quiz', '/en/library', 'TFT champion library on TFTClimb')} lists every unit with its cost and traits.</p>`],
      ],
      faq: [
        ['How do points work?', 'One clue is worth 300 points, then 240, 180, 120, 80 and 40 with all six. Ten rounds give a maximum of 3,000 points.'],
        ['When does the Daily Puzzle change?', 'At midnight German time.'],
        ['Which champions can come up?', `Every champion in ${set}.`],
        FREE,
      ],
    },
    'shop-memory': {
      title: 'TFT Shop Memory: Remember the Shop',
      alt: 'TFT Shop Memory: memorize the shop and rebuild it',
      intro: `<p>TFT Shop Memory is a memory game built around the shop. You see five champions for a few seconds, the cards flip over, and you put every champion back in the right slot.</p>`,
      sections: [
        ['Less time every round', `<p>In Ranked mode the shop stays visible for 4 seconds in the first round and only 2 in the last. You then have 12 seconds to rebuild it. The selection holds five extra champions with similar costs, so the cost color alone won’t save you.</p>
          <p>Fewer than three champions in the right slot costs a heart, and three hearts are all you get across ten rounds. Training gives you 6 seconds every round with no hearts at stake.</p>`],
        ['Want more of a challenge?', `<p>${play('comp-memory', 'Comp Memory')} asks you to remember a whole board with its traits, and the ${play('roll-simulator', '3-Star Roll Simulator')} tests how fast you spot your target in a real shop.</p>`],
      ],
      faq: [
        ['How do points work?', 'The right champion in the right slot gives 20 points, in the shop but in the wrong slot 10. A perfect shop adds a 20 point bonus and up to 10 for speed. The maximum is 1,300.'],
        ['Does Training count for the leaderboard?', 'No. Only Ranked counts for records and the leaderboard.'],
        FREE,
      ],
    },
    'comp-memory': {
      title: 'TFT Comp Memory: Remember the Board',
      alt: 'TFT Comp Memory: memorize the board and rebuild it',
      intro: `<p>TFT Comp Memory shows you a board of five to eight champions together with its active traits. Memorize it, then rebuild it from memory before the time runs out.</p>`,
      sections: [
        ['A bigger board every round', `<p>The eight rounds grow from five to eight champions. In Ranked mode you get about one second per champion to study the board and 18 seconds to rebuild it. The order doesn’t matter, but the selection is twice the size of the board and most of the extra champions share a trait with it.</p>
          <p>Miss more than one champion and you lose one of your three hearts. Active traits update while you rebuild, which helps you check your board.</p>`],
        ['Boards worth remembering', `<p>Want to learn the comps that actually win games? The ${climb('comp-memory', '/en/tier-list', 'TFT tier list on TFTClimb')} shows the current best comps, and the ${climb('comp-memory', '/en/tft-team-builder', 'TFT Team Builder')} lets you plan your own boards.</p>`],
      ],
      faq: [
        ['How do points work?', 'Each correct champion gives 10 points. A complete board adds a 30 point bonus and up to 20 for speed. The maximum is 920.'],
        ['Do positions matter?', 'No. You only need the right champions on the board.'],
        FREE,
      ],
    },
    'cost-quiz': {
      title: 'TFT Cost Quiz: What Does This Champion Cost?',
      alt: 'TFT Cost Quiz: guess how much gold a champion costs',
      intro: `<p>Every set shuffles the roster, so champion costs are easy to mix up. This TFT cost quiz shows you ten champions from ${set}, and you pick the right cost from 1 to 5 gold before the time runs out.</p>`,
      sections: [
        ['Faster answers, more points', `<p>You get 4 seconds for the first champion and only 2.5 for the last. A correct answer gives 100 points plus up to 50 for speed, and the full bonus needs an answer in under a second. Use the number keys 1 to 5 instead of the mouse if you’re chasing a high score.</p>`],
        ['Why cost matters', `<p>A champion’s cost decides how often you see it in your shop at each level. The ${climb('cost-quiz', '/en/cheatsheet/tft-shop-odds', 'TFT shop odds cheat sheet on TFTClimb')} shows the numbers, and the ${play('shop-odds-quiz', 'Shop Odds Quiz')} tests whether you know them.</p>`],
      ],
      faq: [
        ['How many points can I get?', 'The maximum is 1,500 per round: ten correct answers with the full speed bonus.'],
        ['What happens when time runs out?', 'It counts as wrong, and the right cost is revealed.'],
        FREE,
      ],
    },
    'item-quiz': {
      title: 'TFT Item Quiz: Learn Every Recipe',
      alt: 'TFT Item Quiz: which components make which item',
      intro: `<p>Knowing your item recipes saves time on every carousel and every slam. This TFT item quiz covers the ${I.items.length} items you can build from the ${I.components.length} components, with ten questions per round.</p>`,
      sections: [
        ['Two types of questions', `<p>“What does this make?” shows two components and asks for the item. “What is it made of?” shows the finished item and asks for the recipe. Wrong answers often share a component with the right one, so you need the exact recipe.</p>
          <p>You get 6 seconds for the first question and 3.5 for the last. After each round the results list the recipes you missed.</p>`],
        ['Keep learning', `<p>Look up items in the ${climb('item-quiz', '/en/library', 'TFT library on TFTClimb')}, or test your knowledge of synergies in the ${play('trait-quiz', 'Trait Quiz')}.</p>`],
      ],
      faq: [
        ['Which items are in the quiz?', 'All items built from two components. Emblems and artifacts aren’t included.'],
        ['How many points can I get?', 'The maximum is 1,500 per round.'],
        FREE,
      ],
    },
    'trait-quiz': {
      title: 'TFT Trait Quiz: Breakpoints and Synergies',
      alt: 'TFT Trait Quiz: breakpoints and synergies of the current set',
      intro: `<p>How many champions does a trait need, and who belongs to it? This TFT trait quiz asks ten questions on the ${C.traits.length} traits of ${set}.</p>`,
      sections: [
        ['Three types of questions', `<p>You name a trait’s breakpoints, pick the champion who belongs to a trait, or pick the trait a champion has. Wrong breakpoints always have the same number of steps and are often off by just one, so counting the numbers won’t help. Wrong champions often share another trait with the right one.</p>
          <p>You get 7 seconds for the first question and 4 for the last.</p>`],
        ['From quiz to board', `<p>Try your synergies out in the ${climb('trait-quiz', '/en/tft-team-builder', 'TFT Team Builder on TFTClimb')}, or practice remembering whole boards in ${play('comp-memory', 'Comp Memory')}.</p>`],
      ],
      faq: [
        ['What is a breakpoint?', 'The number of champions at which a trait’s next bonus activates.'],
        ['Are unique traits included?', 'They can appear in the champion questions, but not in the breakpoint questions.'],
        FREE,
      ],
    },
    'shop-odds-quiz': {
      title: 'TFT Shop Odds Quiz: Test Your Numbers',
      alt: 'TFT Shop Odds Quiz: test your knowledge of the shop odds',
      intro: `<p>Good rolldowns start with knowing the numbers. This TFT shop odds quiz asks ten questions on the odds per level, when each cost tier unlocks, how many copies are in the pool and how much XP you need.</p>`,
      sections: [
        ['Five types of questions', `<p>You name the odds for a level and cost, find the level for given odds, say when a cost tier starts appearing, and recall copies per champion and XP to the next level. The wrong answers usually come from a neighboring level or another cost tier, so a rough idea isn’t enough.</p>
          <p>You get 7 seconds for the first question and 4.5 for the last.</p>`],
        ['Put it into practice', `<p>The ${climb('shop-odds-quiz', '/en/cheatsheet/tft-shop-odds', 'TFT shop odds cheat sheet on TFTClimb')} has every level, and the ${play('roll-simulator', '3-Star Roll Simulator')} lets you feel what those odds mean in a real shop.</p>`],
      ],
      faq: [
        ['Do the odds apply per shop or per slot?', 'Per slot. A shop has five slots and each one is drawn separately.'],
        ['Is level 11 part of the quiz?', 'No. Level 11 is only available through augments.'],
        FREE,
      ],
    },
  };
};
