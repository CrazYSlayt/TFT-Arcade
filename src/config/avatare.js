// TFT Arcade – Charaktere als Avatare für die Bestenlisten (Bilder: public/assets/img/avatare/<id>.webp,
// ausgeschnitten mit tools/avatare-schneiden.ps1 aus quellen/avatare/charaktere.png, Reihenfolge wie im Bild).
// Nach einer Runde wählt man beim Highscore-Eintrag einen davon; Beispiel-Einträge bekommen einen festen über ihren Namen.
// Hintergrundfarbe des runden Avatars: .av-<id> in arcade.css
module.exports = [
  { id: 'kronenpinguin', name: 'Crown Penguin' },
  { id: 'flatterbaer', name: 'Flutter Bear' },
  { id: 'schuerfi', name: 'Digger' },
  { id: 'puschel', name: 'Fluffball' },
  { id: 'schnabeltier', name: 'Platypus' },
  { id: 'wolkenschaf', name: 'Cloud Sheep' },
  { id: 'federritter', name: 'Feather Knight' },
  { id: 'runengolem', name: 'Rune Golem' },
  { id: 'greifling', name: 'Grifflet' },
  { id: 'zottelbock', name: 'Shaggy Goat' },
];
