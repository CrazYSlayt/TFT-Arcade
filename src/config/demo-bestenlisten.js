// TFT Arcade – Beispieldaten für die Bestenlisten (Prototyp, auf der Seite als „Demo“ markiert).
// Schlüssel: Spiel-id → Modus-id → Einträge [Name, Wert, Avatar?]. Werte im Format des Rekords (Zeit in Sekunden, Punkte als Zahl).
// Avatar: id aus src/config/avatare.js – fehlt er, ergibt er sich fest aus dem Namen.
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
      ['PoroMaster', 920, 'kronenpinguin'], ['LuluMain', 860, 'wolkenschaf'], ['TactixTom', 540, 'federritter'],
      ['ArcadeAnnie', 480, 'puschel'], ['ShopDiff', 420, 'schnabeltier'], ['GoldGoblin', 360, 'schuerfi'], ['Lvl8Lotte', 310, 'greifling'],
    ],
  },
  'was-kostet-der': {
    klassisch: [
      ['GoldGoblin', 1468], ['Augmentina', 1431], ['PenguPilot', 1390], ['BankBert', 1322], ['Lvl8Lotte', 1275],
      ['RerollRitter', 1190], ['HexHanna', 1104], ['TopFourTim', 1012], ['LuckyLoot', 930], ['ZwölfZinsen', 845],
    ],
    'klassisch:heute': [
      ['PenguPilot', 1344, 'runengolem'], ['LuckyLoot', 1210, 'zottelbock'], ['ShopDiff', 1095, 'schnabeltier'],
      ['ArcadeAnnie', 980, 'puschel'], ['TactixTom', 870, 'flatterbaer'],
    ],
  },
  'comp-memory': {
    gewertet: [
      ['HexHanna', 880], ['BoardBaron', 845], ['Augmentina', 790], ['PenguPilot', 760], ['TraitTobi', 705],
      ['Lvl8Lotte', 660], ['RerollRitter', 610], ['BankBert', 540], ['GoldGoblin', 480], ['TopFourTim', 410],
    ],
    'gewertet:heute': [
      ['BoardBaron', 812, 'runengolem'], ['ShopDiff', 734, 'schnabeltier'], ['LuluMain', 655, 'wolkenschaf'],
      ['TactixTom', 590, 'federritter'], ['ArcadeAnnie', 470, 'puschel'],
    ],
  },
  'item-quiz': {
    klassisch: [
      ['ItemIrma', 1452], ['Augmentina', 1410], ['BankBert', 1356], ['SpatulaSam', 1290], ['HexHanna', 1215],
      ['PenguPilot', 1130], ['GoldGoblin', 1040], ['Lvl8Lotte', 960], ['TopFourTim', 870], ['LuckyLoot', 780],
    ],
    'klassisch:heute': [
      ['SpatulaSam', 1388, 'schuerfi'], ['ItemIrma', 1270, 'greifling'], ['PoroMaster', 1146, 'kronenpinguin'],
      ['ShopDiff', 1010, 'schnabeltier'], ['ArcadeAnnie', 905, 'puschel'],
    ],
  },
  'trait-quiz': {
    klassisch: [
      ['TraitTobi', 1440], ['HexHanna', 1395], ['QuizQueenie', 1320], ['Augmentina', 1260], ['LoreLukas', 1185],
      ['NoItemNina', 1090], ['PenguPilot', 1015], ['BankBert', 930], ['RerollRitter', 850], ['KarussellKai', 760],
    ],
    'klassisch:heute': [
      ['QuizQueenie', 1362, 'wolkenschaf'], ['TraitTobi', 1240, 'zottelbock'], ['LuluMain', 1128, 'flatterbaer'],
      ['TactixTom', 990, 'federritter'], ['PoroMaster', 875, 'kronenpinguin'],
    ],
  },
  'champion-quiz': {
    klassisch: [
      ['Augmentina', 960], ['HexHanna', 910], ['LoreLukas', 875], ['PenguPilot', 820], ['QuizQueenie', 790],
      ['TraitTobi', 745], ['BankBert', 700], ['NoItemNina', 655], ['RerollRitter', 610], ['KarussellKai', 560],
    ],
  },
};
