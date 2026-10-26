// TFT Arcade – kleine Helfer für die Vorlagen
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Rekord-/Bestenlisten-Werte wie auf der Seite angezeigt (gleiche Regeln wie fmt() in public/assets/js/arcade.js)
function fmtValue(value, type) {
  if (type === 'zeit') return value.toFixed(1).replace('.', ',') + ' s';
  if (type === 'punkte') return value.toLocaleString('de-DE') + ' Pkt.';
  return String(value);
}

// JSON für <script type="application/json"> und ld+json: '<' maskieren, damit kein </script> den Block beendet
const json = v => JSON.stringify(v).replace(/</g, '\\u003c');

module.exports = { esc, fmtValue, json };
