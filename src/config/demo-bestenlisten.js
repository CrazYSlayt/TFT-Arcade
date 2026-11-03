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
      ['LoreLukas', 2280, 'runengolem'], ['Augmentina', 2160, 'wolkenschaf'], ['HexHanna', 2040, 'greifling'], ['PenguPilot', 1900, 'kronenpinguin'], ['QuizQueenie', 1780, 'puschel'],
      ['TraitTobi', 1620, 'zottelbock'], ['BankBert', 1480, 'flatterbaer'], ['NoItemNina', 1320, 'schnabeltier'], ['RerollRitter', 1160, 'federritter'], ['KarussellKai', 980, 'schuerfi'],
    ],
  },
  'roll-simulator': {
    rush: [
      ['DDDDDD', 21.4, 'runengolem'], ['RerollRitter', 26.8, 'zottelbock'], ['LuckyLoot', 31.2, 'schnabeltier'], ['PenguPilot', 35.9, 'kronenpinguin'], ['GoldGoblin', 39.5, 'schuerfi'],
      ['Lvl8Lotte', 44.1, 'puschel'], ['Streak_Stefan', 48.7, 'greifling'], ['BankBert', 53.0, 'flatterbaer'], ['ZwölfZinsen', 58.6, 'wolkenschaf'], ['TopFourTim', 64.3, 'federritter'],
    ],
  },
  'shop-odds-quiz': {
    klassisch: [
      ['OddsOskar', 1420, 'runengolem'], ['ZwölfZinsen', 1365, 'schuerfi'], ['Lvl8Lotte', 1290, 'puschel'], ['RerollRitter', 1210, 'zottelbock'], ['PenguPilot', 1130, 'kronenpinguin'],
      ['GoldGoblin', 1040, 'greifling'], ['BankBert', 950, 'flatterbaer'], ['Augmentina', 860, 'wolkenschaf'], ['LuckyLoot', 760, 'schnabeltier'], ['TopFourTim', 650, 'federritter'],
    ],
  },
};
