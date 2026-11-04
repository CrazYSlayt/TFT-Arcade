// TFT Arcade – Beispieldaten für die Bestenlisten (Prototyp, auf der Seite als „Sample data“ markiert).
// Schlüssel: Spiel-id → Modus-id → Einträge [Name, Wert, Avatar?]. Werte im Format des Rekords (Zeit in Sekunden, Punkte als Zahl).
// Avatar: id aus src/config/avatare.js – fehlt er, ergibt er sich fest aus dem Namen.
// Eigene Einträge nach einer Runde mischt arcade.js dazu (vorerst nur im Browser). Sobald es ein Backend gibt, ersetzt es diese Datei.
module.exports = {
  'shop-memory': {
    ranked: [
      ['PoroMaster', 1240, 'kronenpinguin'], ['LuluMain', 1180, 'wolkenschaf'], ['TactixTom', 1090, 'federritter'], ['ArcadeAnnie', 1010, 'puschel'], ['ShopDiff', 960, 'schnabeltier'],
      ['NoItemNina', 890, 'greifling'], ['Lvl8Lucy', 820, 'flatterbaer'], ['BenchBert', 740, 'zottelbock'], ['GoldGoblin', 650, 'schuerfi'], ['TopFourTim', 560, 'runengolem'],
    ],
  },
  'cost-quiz': {
    classic: [
      ['GoldGoblin', 1468, 'schuerfi'], ['Augmentina', 1431, 'wolkenschaf'], ['PenguPilot', 1390, 'kronenpinguin'], ['BenchBert', 1322, 'flatterbaer'], ['Lvl8Lucy', 1275, 'puschel'],
      ['RerollRyan', 1190, 'zottelbock'], ['HexHanna', 1104, 'greifling'], ['TopFourTim', 1012, 'federritter'], ['LuckyLoot', 930, 'schnabeltier'], ['InterestIan', 845, 'runengolem'],
    ],
  },
  'comp-memory': {
    ranked: [
      ['BoardBaron', 880, 'runengolem'], ['HexHanna', 845, 'greifling'], ['Augmentina', 790, 'wolkenschaf'], ['PenguPilot', 760, 'kronenpinguin'], ['TraitToby', 705, 'zottelbock'],
      ['Lvl8Lucy', 660, 'puschel'], ['RerollRyan', 610, 'federritter'], ['BenchBert', 540, 'flatterbaer'], ['GoldGoblin', 480, 'schuerfi'], ['TopFourTim', 410, 'schnabeltier'],
    ],
  },
  'item-quiz': {
    classic: [
      ['ItemIrene', 1452, 'greifling'], ['SpatulaSam', 1410, 'schuerfi'], ['BenchBert', 1356, 'flatterbaer'], ['Augmentina', 1290, 'wolkenschaf'], ['HexHanna', 1215, 'federritter'],
      ['PenguPilot', 1130, 'kronenpinguin'], ['GoldGoblin', 1040, 'runengolem'], ['Lvl8Lucy', 960, 'puschel'], ['TopFourTim', 870, 'zottelbock'], ['LuckyLoot', 780, 'schnabeltier'],
    ],
  },
  'trait-quiz': {
    classic: [
      ['TraitToby', 1440, 'zottelbock'], ['QuizQueenie', 1395, 'wolkenschaf'], ['HexHanna', 1320, 'greifling'], ['Augmentina', 1260, 'puschel'], ['LoreLuke', 1185, 'runengolem'],
      ['NoItemNina', 1090, 'schnabeltier'], ['PenguPilot', 1015, 'kronenpinguin'], ['BenchBert', 930, 'flatterbaer'], ['RerollRyan', 850, 'federritter'], ['CarouselKai', 760, 'schuerfi'],
    ],
  },
  'champion-quiz': {
    classic: [
      ['LoreLuke', 2280, 'runengolem'], ['Augmentina', 2160, 'wolkenschaf'], ['HexHanna', 2040, 'greifling'], ['PenguPilot', 1900, 'kronenpinguin'], ['QuizQueenie', 1780, 'puschel'],
      ['TraitToby', 1620, 'zottelbock'], ['BenchBert', 1480, 'flatterbaer'], ['NoItemNina', 1320, 'schnabeltier'], ['RerollRyan', 1160, 'federritter'], ['CarouselKai', 980, 'schuerfi'],
    ],
  },
  'roll-simulator': {
    rush: [
      ['DDDDDD', 27.9, 'runengolem'], ['RerollRyan', 33.4, 'zottelbock'], ['LuckyLoot', 38.2, 'schnabeltier'], ['PenguPilot', 42.6, 'kronenpinguin'], ['GoldGoblin', 47.1, 'schuerfi'],
      ['Lvl8Lucy', 52.3, 'puschel'], ['StreakSteve', 58.8, 'greifling'], ['BenchBert', 63.5, 'flatterbaer'], ['InterestIan', 69.2, 'wolkenschaf'], ['TopFourTim', 76.4, 'federritter'],
    ],
  },
  'shop-odds-quiz': {
    classic: [
      ['OddsOscar', 1420, 'runengolem'], ['InterestIan', 1365, 'schuerfi'], ['Lvl8Lucy', 1290, 'puschel'], ['RerollRyan', 1210, 'zottelbock'], ['PenguPilot', 1130, 'kronenpinguin'],
      ['GoldGoblin', 1040, 'greifling'], ['BenchBert', 950, 'flatterbaer'], ['Augmentina', 860, 'wolkenschaf'], ['LuckyLoot', 760, 'schnabeltier'], ['TopFourTim', 650, 'federritter'],
    ],
  },
};
