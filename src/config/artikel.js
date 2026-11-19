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
      title: 'TFT Rolldown Simulator: Practice Your Rolldowns',
      alt: 'TFT Rolldown Simulator: practice rolling with the real shop odds',
      intro: `<p>This TFT rolldown simulator gives you a real shop to practice with: pick your level and gold, then roll, buy XP, sell and move your units between a hex board and a nine-slot bench while your active traits update on the left. Choose a comp from the TFTClimb tier list as your target, or just roll and see what you hit.</p>`,
      sections: [
        ['How do the TFT shop odds work in the simulator?', `<p>The simulator draws each of the five shop slots separately, with the real odds for your level: on level 8, for example, a slot is a 4-cost ${S.odds[7][3]}% of the time. It then picks a champion based on the copies left in the pool – ${set} has ${S.bag.join(', ')} copies of each 1- to 5-cost. Champions you don’t buy go back into the pool on your next reroll, and opponents already hold some copies.</p>`],
        ['TFT rolldown practice: pick your level, gold and comp', `<p>Set any level from 3 to 10 and start with 50, 100, 200 or unlimited gold. Rerolling costs 2 gold and Buy XP 4 gold for 4 XP, just like in the game, and your board holds as many units as your level. Add a target comp and its units are highlighted in the shop and tracked on the right, with the carry marked. Nothing is ranked, so you can try the same rolldown as often as you like.</p>
          <p>Want a score? The ${play('100-gold-challenge', '100 Gold Challenge')} gives you one comp and 100 gold, and the ${play('3-star-rush', '3-Star Challenge')} asks for all ${copies5} copies of a 5-cost on level 10 against the clock.</p>
          <p>Not sure when to roll in a real game? The ${climb('roll-simulator', '/en/guides/tft-rolldown-guide', 'TFT Rolldown Guide on TFTClimb')} explains when each comp rolls, how much gold to keep and when to stop. Planning a specific rolldown? The ${climb('roll-simulator', '/en/tools/tft-rolldown-calculator', 'TFT Rolldown Calculator')} shows your chances for any champion, level and gold amount.</p>`],
      ],
      faq: [
        ['Does the TFT Rolldown Simulator use real shop odds?', `Yes. Shop odds, copies per champion and XP come from the ${set} data on TFTClimb.`],
        ['Is it exactly like the game?', 'No. Opponents don’t roll during the round, and there are no items, augments or interest.'],
        ['What are the controls?', 'D rerolls, F buys XP, 1 to 5 buy a champion and E sells the unit under your cursor. You can drag units between board and bench.'],
        ['Is there a leaderboard?', 'Not for free practice. Best times are in the 3-Star Challenge, high scores in the 100 Gold Challenge.'],
        FREE,
      ],
    },
    '3-star-rush': {
      title: 'TFT 3 Star Challenge: Hit a 3-Star 5-Cost',
      alt: 'TFT 3 Star Challenge: roll for a 3-star 5-cost on level 10',
      intro: `<p>The TFT 3 Star Challenge starts you on level 10 with an empty board and bench and one target: a 5-cost champion you have to take to three stars. You roll, buy, sell and move your units around on a hex board, just like in a real rolldown, while the clock counts up.</p>`,
      sections: [
        ['What are the odds of a 5-cost on level 10?', `<p>On level 10 each shop slot is a 5-cost ${odds5}% of the time, and all five slots are drawn separately. The game then picks a champion based on the copies left in the pool. ${set} has ${five} different 5-costs with ${copies5} copies each, so three stars takes every single copy of your target.</p>
          <p>Champions you don’t buy go back into the pool on your next reroll. Opponents hold 30 to 60% of the other 5-costs, which makes your target a little easier to find, but they hold no copies of your target. Without that rule three stars wouldn’t be possible.</p>`],
        ['How many rolls does a 3-star 5-cost take?', `<p>Expect around 100 rolls on level 10, which is roughly 250 gold including the nine buys. In our test runs one round in ten took fewer than 60 rolls and one in ten took more than 170, so luck plays a big part. On level 11 it was closer to 70 rolls, on level 9 closer to 170. You can try those levels in Training.</p>
          <p>Want to practice normal rolldowns with gold and levels? Try the ${play('roll-simulator', 'Rolldown Simulator')}. Planning a real one? The ${climb('3-star-rush', '/en/tools/tft-rolldown-calculator', 'TFT Rolldown Calculator on TFTClimb')} shows your chances for any champion, level and gold amount, and the ${climb('3-star-rush', '/en/guides/tft-rolldown-guide', 'TFT Rolldown Guide')} explains when a rolldown is worth it.</p>`],
      ],
      faq: [
        ['Does the TFT 3 Star Challenge use real shop odds?', `Yes. Shop odds and copies per champion come from the ${set} data on TFTClimb.`],
        ['Is it exactly like the game?', 'No. Opponents don’t roll during the round, and there are no items or augments. Gold is unlimited, so only your time counts.'],
        ['What are the controls?', 'D rerolls, 1 to 5 buy a champion and E sells the unit under your cursor. You can drag units between board and bench.'],
        FREE,
      ],
    },
    '100-gold-challenge': {
      title: 'TFT 100 Gold Challenge: One Comp, One Rolldown',
      alt: 'TFT 100 Gold Challenge: roll down for a tier list comp with 100 gold',
      intro: `<p>The TFT 100 Gold Challenge gives you a comp from the TFTClimb tier list, 100 gold and the level that comp usually rolls on. One rolldown decides your score: how many of its units can you take to two or three stars, and how much gold do you keep?</p>`,
      sections: [
        ['TFT 100 Gold Challenge scoring: what counts?', `<p>Only units on your board score, just like only your board fights in a real game. Each unit of the comp scores by its star level: 10 points for one star, 40 for two and 150 for three. The carry counts double, and every gold you have left at the end adds one point. Buying XP gives you another board slot and changes the shop odds, so leveling can pay off – or cost you the gold you needed for upgrades.</p>`],
        ['Which comps come up in the 100 Gold Challenge?', `<p>Every comp comes straight from the ${climb('100-gold-challenge', '/en/tier-list', 'TFT tier list on TFTClimb')}, from fast 8 boards to 1-cost rerolls. After the round you can open the full comp guide with items and augments. When each type of comp rolls in a real game is in the ${climb('100-gold-challenge', '/en/guides/tft-rolldown-guide', 'TFT Rolldown Guide')}. Want to practice without a score? Use Training, or the free mode of the ${play('roll-simulator', 'Rolldown Simulator')}.</p>`],
      ],
      faq: [
        ['Which level do I roll on?', 'The usual rolldown level of the comp: 5 for 1-cost reroll, 6 for 2-cost, 7 for 3-cost, 8 for fast 8 and 9 for fast 9.'],
        ['Do units on the bench count?', 'No. Only units on your board score, and the board holds as many units as your level. Positions and items don’t matter.'],
        FREE,
      ],
    },
    'champion-quiz': {
      title: 'TFT Champion Quiz: Guess the Champion',
      alt: 'TFT Champion Quiz: guess the champion from six clues',
      intro: `<p>How well do you know the ${C.champions.length} champions of ${set}? This TFT champion quiz gives you one clue at a time, and you type the name as soon as you know it. The fewer clues you need, the more points you score.</p>`,
      sections: [
        ['Which clues does the TFT Champion Quiz give?', `<p>You get six clues per champion: first the role and range, then the cost, one trait, the ability name, all traits and finally a blurred splash art. A new clue appears every five seconds. A wrong guess reveals the next one right away and tells you whether the target costs more or less and how many traits your guess shares with it.</p>`],
        ['TFT Daily Puzzle: one champion for everyone', `<p>The Daily Puzzle gives everyone the same champion. There’s no clock and you get one try per day, so you can take your time. Solve it on consecutive days to build a streak, and share your result without spoiling the answer.</p>
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
        ['How long do you see the shop in TFT Shop Memory?', `<p>In Ranked mode the shop stays visible for 4 seconds in the first round and only 2 in the last. You then have 12 seconds to rebuild it. The selection holds five extra champions with similar costs, so the cost color alone won’t save you.</p>
          <p>Fewer than three champions in the right slot costs a heart, and three hearts are all you get across ten rounds. Training gives you 6 seconds every round with no hearts at stake.</p>`],
        ['More TFT memory games', `<p>For a harder memory test, ${play('comp-memory', 'Comp Memory')} asks you to remember a whole board with its traits, and the ${play('3-star-rush', '3-Star Challenge')} tests how fast you spot your target in a real shop.</p>`],
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
        ['How big do the boards get in TFT Comp Memory?', `<p>The eight rounds grow from five to eight champions. In Ranked mode you get about one second per champion to study the board and 18 seconds to rebuild it. The order doesn’t matter, but the selection is twice the size of the board and most of the extra champions share a trait with it.</p>
          <p>Miss more than one champion and you lose one of your three hearts. Active traits update while you rebuild, which helps you check your board.</p>`],
        ['Learn the best TFT comps by heart', `<p>The boards worth remembering are the ones that win games: the ${climb('comp-memory', '/en/tier-list', 'TFT tier list on TFTClimb')} shows the current best comps, and the ${climb('comp-memory', '/en/tft-team-builder', 'TFT Team Builder')} lets you plan your own boards.</p>`],
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
        ['How much time do you get per champion?', `<p>You get 4 seconds for the first champion and only 2.5 for the last. A correct answer gives 100 points plus up to 50 for speed, and the full bonus needs an answer in under a second. Use the number keys 1 to 5 instead of the mouse if you’re chasing a high score.</p>`],
        ['Why does champion cost matter in TFT?', `<p>A champion’s cost decides how often you see it in your shop at each level. The ${climb('cost-quiz', '/en/cheatsheet/tft-shop-odds', 'TFT shop odds cheat sheet on TFTClimb')} shows the numbers, and the ${play('shop-odds-quiz', 'Shop Odds Quiz')} tests whether you know them.</p>`],
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
        ['TFT item recipes: asked both ways', `<p>The quiz asks every recipe in two directions. “What does this make?” shows two components and asks for the item. “What is it made of?” shows the finished item and asks for the recipe. Wrong answers often share a component with the right one, so you need the exact recipe.</p>
          <p>You get 6 seconds for the first question and 3.5 for the last. After each round the results list the recipes you missed.</p>`],
        ['Where can you look up TFT item recipes?', `<p>Every item with its recipe is in the ${climb('item-quiz', '/en/library', 'TFT library on TFTClimb')}. Know your recipes already? Test your synergies next in the ${play('trait-quiz', 'Trait Quiz')}.</p>`],
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
        ['What does the TFT Trait Quiz ask?', `<p>It asks three things: a trait’s breakpoints, the champion who belongs to a trait, and the trait a champion has. Wrong breakpoints always have the same number of steps and are often off by just one, so counting the numbers won’t help. Wrong champions often share another trait with the right one.</p>
          <p>You get 7 seconds for the first question and 4 for the last.</p>`],
        ['Put TFT synergies to work on a board', `<p>Try your synergies out in the ${climb('trait-quiz', '/en/tft-team-builder', 'TFT Team Builder on TFTClimb')}, or practice remembering whole boards in ${play('comp-memory', 'Comp Memory')}. Want it faster? ${play('find-the-imposter', 'Find the Imposter')} shows four champions and asks who doesn’t share the trait.</p>`],
      ],
      faq: [
        ['What is a breakpoint?', 'The number of champions at which a trait’s next bonus activates.'],
        ['Are unique traits included?', 'They can appear in the champion questions, but not in the breakpoint questions.'],
        FREE,
      ],
    },
    'find-the-imposter': {
      title: 'TFT Find the Imposter: Spot the Odd One Out',
      alt: 'TFT Find the Imposter: four champions, three share a trait',
      intro: `<p>Four champions, three of them share a trait. Find the imposter is a quick TFT odd one out game for the ${C.traits.length} traits of ${set}: spot the champion who doesn’t belong, then see every card’s traits and learn which champions really go together.</p>`,
      sections: [
        ['How hard does Find the Imposter get?', `<p>It gets harder every few rounds: in the first three the imposter has nothing in common with the others. From round four it shares a trait with one of them, and in the last three rounds with two, so you can’t just look for the odd face. Every round is checked: no second trait is shared by three of the four, and the costs never give the answer away.</p>
          <p>You get 9 seconds for the first round and 5.5 for the last. Origins and classes both count, and only traits with at least three champions are used.</p>`],
        ['Why shared traits matter in TFT', `<p>Knowing who shares a trait is what lets you pivot mid-game. Try the synergies out in the ${climb('find-the-imposter', '/en/tft-team-builder', 'TFT Team Builder on TFTClimb')}, or test breakpoints in the ${play('trait-quiz', 'Trait Quiz')}.</p>`],
      ],
      faq: [
        ['Can there be two right answers?', 'No. Every round is checked so that only one champion can be the imposter.'],
        ['How many points can I get?', 'The maximum is 1,500 per round of ten.'],
        FREE,
      ],
    },
    'splash-art-zoom': {
      title: 'TFT Splash Art Quiz: Guess the Champion from a Zoom',
      alt: 'TFT Splash Art Quiz: guess the champion from a zoomed-in splash art',
      intro: `<p>A tiny crop of a splash art slowly zooms out, and you pick the champion from four names. This TFT splash art quiz uses the art of all ${C.champions.length} champions of ${set} – the same pictures you see on your shop cards.</p>`,
      sections: [
        ['How does the scoring work in Splash Art Zoom?', `<p>Early guesses score the most: a right answer gives 50 points plus up to 100 for speed, and the full bonus needs an answer within the first second. You get 10 seconds for the first round and 7 for the last, so the picture zooms out faster as you go.</p>
          <p>The wrong names aren’t random: one costs the same as the right champion and one shares a trait with it, so knowing the roster helps.</p>`],
        ['Why learn the TFT splash arts?', `<p>Because you buy from pictures, not names: spotting a champion’s art in a split second makes every rolldown faster. Practice that in a real shop in the ${play('3-star-rush', '3-Star Challenge')}, or look up every champion in the ${climb('splash-art-zoom', '/en/library', 'TFT champion library on TFTClimb')}.</p>`],
      ],
      faq: [
        ['Which splash arts are used?', `The ones on the shop cards of ${set}, for every champion in the set.`],
        ['How many points can I get?', 'The maximum is 1,500 per round of ten.'],
        FREE,
      ],
    },
    'tft-bingo': {
      title: 'TFT Bingo: Cards for Streams, Tournaments and Your Own Games',
      alt: 'TFT Bingo: a bingo card full of TFT moments to mark',
      intro: `<p>TFT Bingo gives you a card full of TFT moments – rolldowns, loss streaks, 3-star units and the traits of ${set} – and you mark them as they happen. Play it while you watch a tournament or a stream, or in your own games, and share your card so everyone marks the same one.</p>`,
      sections: [
        ['How does TFT Bingo work?', `<p>You pick a pool and a card size, then click every moment on your card as soon as it happens; a full row, column or diagonal is a bingo. Watch Party has moments from a tournament lobby or a stream, My Game has moments from your own games, and one card can last several games. The 5×5 card has a free field in the middle, the 4×4 card is the quick one.</p>
          <p>Every card mixes common, rarer and very rare moments, so a bingo takes a while but always stays possible. Keep marking after your first line, or finish the card to see how many bingos you got.</p>`],
        ['TFT Bingo for streams and watch parties', `<p>For a stream, share your card link: everyone who opens it gets the exact same card, so your chat can race you to the first bingo. Every card has a short code for that, and your marks stay saved in your browser if you reload. Looking for something to watch? Tournaments and live streams are on <a class="art-a" href="https://www.tft-esports.com/?utm_source=tftarcade&amp;utm_medium=referral&amp;utm_campaign=tft-bingo" target="_blank" rel="noopener">TFT E-Sports</a>.</p>`],
        ['Which moments are on a TFT Bingo card?', `<p>Classic TFT moments plus moments from the current set: high trait breakpoints, unlockable champions, 2-star 5-costs and comps from the ${climb('tft-bingo', '/en/tier-list', 'TFT tier list on TFTClimb')}. Those change with every set, so the card teaches you the new traits along the way. Want to learn them properly? Try the ${play('trait-quiz', 'Trait Quiz')} or ${play('find-the-imposter', 'Find the Imposter')}.</p>`],
      ],
      faq: [
        ['Can my whole chat play the same card?', 'Yes. Share your card link and everyone who opens it gets the same card.'],
        ['Is there a leaderboard?', 'No. You mark the fields yourself, so there’s nothing to check – it’s about the fun and sharing your card.'],
        FREE,
      ],
    },
    'shop-odds-quiz': {
      title: 'TFT Shop Odds Quiz: Test Your Numbers',
      alt: 'TFT Shop Odds Quiz: test your knowledge of the shop odds',
      intro: `<p>Good rolldowns start with knowing the numbers. This TFT shop odds quiz asks ten questions on the odds per level, when each cost tier unlocks, how many copies are in the pool and how much XP you need.</p>`,
      sections: [
        ['What does the TFT Shop Odds Quiz ask?', `<p>It asks five things: the odds for a level and cost, the level for given odds, when a cost tier starts appearing, the copies per champion and the XP to the next level. The wrong answers usually come from a neighboring level or another cost tier, so a rough idea isn’t enough.</p>
          <p>You get 7 seconds for the first question and 4.5 for the last.</p>`],
        ['TFT shop odds for every level', `<p>The full table for every level is on the ${climb('shop-odds-quiz', '/en/cheatsheet/tft-shop-odds', 'TFT shop odds cheat sheet on TFTClimb')}, and the ${play('3-star-rush', '3-Star Challenge')} lets you feel what those odds mean in a real shop.</p>`],
      ],
      faq: [
        ['Do the odds apply per shop or per slot?', 'Per slot. A shop has five slots and each one is drawn separately.'],
        ['Is level 11 part of the quiz?', 'No. Level 11 is only available through augments.'],
        FREE,
      ],
    },
  };
};
