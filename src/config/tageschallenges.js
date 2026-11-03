// TFT Arcade – Vorrat der Tageschallenges. Jeden Tag (Mitternacht, deutsche Zeit) ist der nächste Eintrag dran;
// alle Besucher sehen am selben Tag dieselbe Challenge. Sie basieren auf einem vorhandenen Spielmodus (game + mode).
// title = kurzer Slogan auf dem Ticket, text = die genaue Vorgabe
module.exports = [
  { game: '3-star-rush', mode: 'tageschallenge', title: '9 Kopien. 60 Sekunden. Schaffst du’s?', text: 'Bring den Ziel-Champion des Tages auf drei Sterne – in unter 60 Sekunden.' },
  { game: '3-star-rush', mode: 'tageschallenge', title: 'Drei Sterne, höchstens 40 Rerolls.', text: 'Jeder Fehlkauf kostet dich 2 Sekunden. Spar dir die Panik-Rolls.' },
  { game: '3-star-rush', mode: 'tageschallenge', title: 'Neun Kopien. Null Fehlkäufe.', text: 'Kein einziger falscher Kauf erlaubt. Schaffst du den perfekten Lauf?' },
  { game: '3-star-rush', mode: 'tageschallenge', title: 'Knapper Pool. Gleiche Uhr.', text: 'Heute sind weniger Kopien im Umlauf – halt trotzdem durch!' },
  { game: 'champion-quiz', mode: 'tagesraetsel', title: 'Ein Champion. Sechs Hinweise. Eine Chance.', text: 'Das Tagesrätsel: Heute suchen alle denselben Champion – wie viele Hinweise brauchst du?' },
  { game: 'roll-simulator', mode: 'rush', title: 'Level 10. Ein 5-Koster. Drei Sterne.', text: 'Roll mit den echten Shop-Chancen, bis dein 5-Koster drei Sterne hat – schaffst du es unter einer Minute?' },
];
