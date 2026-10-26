// TFT Arcade – Beispieldaten für die Bestenlisten (Prototyp, auf der Seite als „Demo“ markiert).
// Schlüssel: Spiel-id → Modus-id → Einträge [Name, Wert]. Werte im Format des Rekords (Zeit in Sekunden, Punkte als Zahl).
// Eigene Einträge nach einer Runde mischt arcade.js dazu (vorerst nur im Browser). Sobald es ein Backend gibt, ersetzt es diese Datei.
module.exports = {
  '3-star-rush': {
    standard: [
      ['RerollRitter', 38.4], ['PenguPilot', 41.9], ['GoldGoblin', 44.2], ['Streak_Stefan', 47.0], ['DDDDDD', 49.6],
      ['Lvl8Lotte', 53.1], ['TopFourTim', 57.8], ['KarussellKai', 61.3], ['BankBert', 66.0], ['HexHanna', 72.4],
    ],
    tageschallenge: [
      ['PenguPilot', 46.7], ['Augmentina', 48.2], ['RerollRitter', 52.9], ['BankBert', 55.4], ['NoItemNina', 59.0],
      ['HexHanna', 63.6], ['ZwölfZinsen', 70.1], ['LuckyLoot', 74.8], ['Lvl8Lotte', 79.5], ['GoldGoblin', 84.0],
    ],
  },
  'shop-memory': {
    klassisch: [
      ['Augmentina', 2850], ['HexHanna', 2700], ['RerollRitter', 2550], ['KarussellKai', 2400], ['PenguPilot', 2250],
      ['NoItemNina', 2050], ['Lvl8Lotte', 1900], ['BankBert', 1700], ['GoldGoblin', 1550], ['TopFourTim', 1300],
    ],
  },
  'was-kostet-der': {
    klassisch: [
      ['GoldGoblin', 1468], ['Augmentina', 1431], ['PenguPilot', 1390], ['BankBert', 1322], ['Lvl8Lotte', 1275],
      ['RerollRitter', 1190], ['HexHanna', 1104], ['TopFourTim', 1012], ['LuckyLoot', 930], ['ZwölfZinsen', 845],
    ],
  },
  'champion-quiz': {
    klassisch: [
      ['Augmentina', 960], ['HexHanna', 910], ['LoreLukas', 875], ['PenguPilot', 820], ['QuizQueenie', 790],
      ['TraitTobi', 745], ['BankBert', 700], ['NoItemNina', 655], ['RerollRitter', 610], ['KarussellKai', 560],
    ],
  },
};
