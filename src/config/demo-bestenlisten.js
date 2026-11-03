// TFT Arcade – Beispieldaten für die Bestenlisten (Prototyp, auf der Seite als „Beispieldaten“ markiert).
// Schlüssel: Spiel-id → Modus-id → Einträge [Name, Wert, Avatar?]. Werte im Format des Rekords (Zeit in Sekunden, Punkte als Zahl).
// Avatar: id aus src/config/avatare.js – fehlt er, ergibt er sich fest aus dem Namen.
// Eigene Einträge nach einer Runde mischt arcade.js dazu (vorerst nur im Browser). Sobald es ein Backend gibt, ersetzt es diese Datei.
module.exports = {
  '3-star-rush': {
    standard: [
      ['RerollRitter', 38.4, 'zottelbock'], ['PenguPilot', 41.9, 'kronenpinguin'], ['GoldGoblin', 44.2, 'schuerfi'], ['Streak_Stefan', 47.0, 'greifling'], ['DDDDDD', 49.6, 'runengolem'],
      ['Lvl8Lotte', 53.1, 'puschel'], ['TopFourTim', 57.8, 'federritter'], ['KarussellKai', 61.3, 'schnabeltier'], ['BankBert', 66.0, 'flatterbaer'], ['HexHanna', 72.4, 'wolkenschaf'],
    ],
    tageschallenge: [
      ['PenguPilot', 46.7, 'kronenpinguin'], ['Augmentina', 48.2, 'wolkenschaf'], ['RerollRitter', 52.9, 'zottelbock'], ['BankBert', 55.4, 'flatterbaer'], ['NoItemNina', 59.0, 'puschel'],
      ['HexHanna', 63.6, 'greifling'], ['ZwölfZinsen', 70.1, 'schuerfi'], ['LuckyLoot', 74.8, 'schnabeltier'], ['Lvl8Lotte', 79.5, 'federritter'], ['GoldGoblin', 84.0, 'runengolem'],
    ],
  },
  'shop-memory': {
    gewertet: [
      ['PoroMaster', 1240, 'kronenpinguin'], ['LuluMain', 1180, 'wolkenschaf'], ['TactixTom', 1090, 'federritter'], ['ArcadeAnnie', 1010, 'puschel'], ['ShopDiff', 960, 'schnabeltier'],
      ['NoItemNina', 890, 'greifling'], ['Lvl8Lotte', 820, 'flatterbaer'], ['BankBert', 740, 'zottelbock'], ['GoldGoblin', 650, 'schuerfi'], ['TopFourTim', 560, 'runengolem'],
    ],
  },
  'was-kostet-der': {
    klassisch: [
      ['GoldGoblin', 1468, 'schuerfi'], ['Augmentina', 1431, 'wolkenschaf'], ['PenguPilot', 1390, 'kronenpinguin'], ['BankBert', 1322, 'flatterbaer'], ['Lvl8Lotte', 1275, 'puschel'],
      ['RerollRitter', 1190, 'zottelbock'], ['HexHanna', 1104, 'greifling'], ['TopFourTim', 1012, 'federritter'], ['LuckyLoot', 930, 'schnabeltier'], ['ZwölfZinsen', 845, 'runengolem'],
    ],
  },
  'comp-memory': {
    gewertet: [
      ['BoardBaron', 880, 'runengolem'], ['HexHanna', 845, 'greifling'], ['Augmentina', 790, 'wolkenschaf'], ['PenguPilot', 760, 'kronenpinguin'], ['TraitTobi', 705, 'zottelbock'],
      ['Lvl8Lotte', 660, 'puschel'], ['RerollRitter', 610, 'federritter'], ['BankBert', 540, 'flatterbaer'], ['GoldGoblin', 480, 'schuerfi'], ['TopFourTim', 410, 'schnabeltier'],
    ],
  },
  'item-quiz': {
    klassisch: [
      ['ItemIrma', 1452, 'greifling'], ['SpatulaSam', 1410, 'schuerfi'], ['BankBert', 1356, 'flatterbaer'], ['Augmentina', 1290, 'wolkenschaf'], ['HexHanna', 1215, 'federritter'],
      ['PenguPilot', 1130, 'kronenpinguin'], ['GoldGoblin', 1040, 'runengolem'], ['Lvl8Lotte', 960, 'puschel'], ['TopFourTim', 870, 'zottelbock'], ['LuckyLoot', 780, 'schnabeltier'],
    ],
  },
  'trait-quiz': {
    klassisch: [
      ['TraitTobi', 1440, 'zottelbock'], ['QuizQueenie', 1395, 'wolkenschaf'], ['HexHanna', 1320, 'greifling'], ['Augmentina', 1260, 'puschel'], ['LoreLukas', 1185, 'runengolem'],
      ['NoItemNina', 1090, 'schnabeltier'], ['PenguPilot', 1015, 'kronenpinguin'], ['BankBert', 930, 'flatterbaer'], ['RerollRitter', 850, 'federritter'], ['KarussellKai', 760, 'schuerfi'],
    ],
  },
  'champion-quiz': {
    klassisch: [
      ['Augmentina', 960, 'wolkenschaf'], ['HexHanna', 910, 'greifling'], ['LoreLukas', 875, 'runengolem'], ['PenguPilot', 820, 'kronenpinguin'], ['QuizQueenie', 790, 'puschel'],
      ['TraitTobi', 745, 'zottelbock'], ['BankBert', 700, 'flatterbaer'], ['NoItemNina', 655, 'schnabeltier'], ['RerollRitter', 610, 'federritter'], ['KarussellKai', 560, 'schuerfi'],
    ],
  },
};
