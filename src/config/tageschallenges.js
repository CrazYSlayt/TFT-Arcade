// TFT Arcade – Vorrat der Tageschallenges. Jeden Tag (Mitternacht, deutsche Zeit) ist der nächste Eintrag dran;
// alle Besucher sehen am selben Tag dieselbe Challenge. Sie basieren auf einem spielbaren Spiel (game, optional mode).
// title = kurzer Slogan auf dem Ticket, text = die genaue Vorgabe
module.exports = [
  { game: 'roll-simulator', mode: 'rush', title: 'Level 10. One 5-cost. Three stars.', text: 'Roll with the real shop odds until your 5-cost hits three stars. Can you do it in under a minute?' },
  { game: 'champion-quiz', mode: 'daily', title: 'One champion. Six clues. One try.', text: 'The Daily Puzzle: everyone is after the same champion today. How many clues do you need?' },
  { game: 'shop-memory', mode: 'ranked', title: 'Ten shops. Three hearts.', text: 'Make it through all ten rounds of Shop Memory without losing a single heart.' },
  { game: 'cost-quiz', title: 'Ten champions. Ten right prices.', text: 'Go 10 for 10 in What Does It Cost? before the clock runs out.' },
  { game: 'comp-memory', mode: 'ranked', title: 'Eight champions. One look.', text: 'Can you still rebuild the board from memory when it’s eight champions big?' },
  { game: 'item-quiz', title: 'Every recipe. No mistakes.', text: 'Answer all ten Item Quiz questions correctly.' },
  { game: 'trait-quiz', title: 'Know your breakpoints?', text: 'Score a perfect 10 out of 10 in the Trait Quiz.' },
  { game: 'shop-odds-quiz', title: 'Think you know the odds?', text: 'Get all ten Shop Odds Quiz questions right, without peeking at the table.' },
];
