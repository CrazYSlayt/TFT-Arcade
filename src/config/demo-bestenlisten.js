// TFT Arcade – Beispieldaten für die Bestenlisten (Prototyp, auf der Seite als „Demo“ markiert).
// Schlüssel: Spiel-id → Modus-id → Einträge [Name, Wert]. Werte im Format des Rekords (Zeit in Sekunden, Punkte als Zahl).
// „<Modus>:heute“ = Liste für den Reiter „Heute“ auf der Spielseite (fehlt sie, zeigt „Heute“ nur eigene Einträge von heute).
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
    gewertet: [
      ['Augmentina', 1240], ['HexHanna', 1180], ['RerollRitter', 1090], ['KarussellKai', 1010], ['PenguPilot', 960],
      ['NoItemNina', 890], ['Lvl8Lotte', 820], ['BankBert', 740], ['GoldGoblin', 650], ['TopFourTim', 560],
    ],
    'gewertet:heute': [
      ['PoroMaster', 920], ['LuluMain', 860], ['TactixTom', 540], ['ArcadeAnnie', 480], ['ShopDiff', 420],
      ['GoldGoblin', 360], ['Lvl8Lotte', 310],
    ],
  },
  'was-kostet-der': {
    klassisch: [
      ['GoldGoblin', 1468], ['Augmentina', 1431], ['PenguPilot', 1390], ['BankBert', 1322], ['Lvl8Lotte', 1275],
      ['RerollRitter', 1190], ['HexHanna', 1104], ['TopFourTim', 1012], ['LuckyLoot', 930], ['ZwölfZinsen', 845],
    ],
    'klassisch:heute': [
      ['PenguPilot', 1344], ['LuckyLoot', 1210], ['ShopDiff', 1095], ['ArcadeAnnie', 980], ['TactixTom', 870],
    ],
  },
  'champion-quiz': {
    klassisch: [
      ['Augmentina', 960], ['HexHanna', 910], ['LoreLukas', 875], ['PenguPilot', 820], ['QuizQueenie', 790],
      ['TraitTobi', 745], ['BankBert', 700], ['NoItemNina', 655], ['RerollRitter', 610], ['KarussellKai', 560],
    ],
  },
};
