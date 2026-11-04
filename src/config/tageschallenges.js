// TFT Arcade – Vorrat der Tageschallenges. Jeden Tag (Mitternacht, deutsche Zeit) ist der nächste Eintrag dran;
// alle Besucher sehen am selben Tag dieselbe Challenge. Sie basieren auf einem vorhandenen Spielmodus (game + mode).
// title = kurzer Slogan auf dem Ticket, text = die genaue Vorgabe
module.exports = [
  { game: '3-star-rush', mode: 'daily', title: '9 copies. 60 seconds. Can you do it?', text: 'Get today’s target champion to three stars in under 60 seconds.' },
  { game: '3-star-rush', mode: 'daily', title: 'Three stars, 40 rerolls at most.', text: 'Every wrong buy costs you 2 seconds. Skip the panic rolls.' },
  { game: '3-star-rush', mode: 'daily', title: 'Nine copies. Zero wrong buys.', text: 'Not a single wrong buy allowed. Can you pull off the perfect run?' },
  { game: '3-star-rush', mode: 'daily', title: 'Tight pool. Same clock.', text: 'Fewer copies are in circulation today. Hang in there!' },
  { game: 'champion-quiz', mode: 'daily', title: 'One champion. Six clues. One try.', text: 'The Daily Puzzle: everyone is after the same champion today. How many clues do you need?' },
  { game: 'roll-simulator', mode: 'rush', title: 'Level 10. One 5-cost. Three stars.', text: 'Roll with the real shop odds until your 5-cost hits three stars. Can you do it in under a minute?' },
];
