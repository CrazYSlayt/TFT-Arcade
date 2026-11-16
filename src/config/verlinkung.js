// TFT Arcade – Verlinkung ins TFT-Netzwerk (TFTClimb ist die Hauptseite, die Arcade ein Zulieferer).
// Alle Links tragen UTM-Werte, damit die Klicks in den Analytics der Zielseite erscheinen:
// utm_source=tftarcade · utm_medium=referral · utm_campaign=<Spiel-id oder „footer“> · utm_content=<Stelle: result | footer>
const utm = (url, campaign, content) => `${url}${url.includes('?') ? '&' : '?'}utm_source=tftarcade&utm_medium=referral&utm_campaign=${campaign}&utm_content=${content}`;

// Netzwerk-Zeile im Footer
const network = [
  { name: 'TFTClimb', url: 'https://www.tftclimb.com/en', text: 'tier lists, tools & coaching' },
  { name: 'TFT E-Sports', url: 'https://www.tft-esports.com/', text: 'tournaments & live streams' },
];

// eine Zeile auf der Ergebniskarte nach jeder Runde: [Adresse auf TFTClimb, Satz davor, Linktext]
// Das Champion-Rätsel ersetzt sie nach der Runde durch die Seite des gesuchten Champions (finishRound({ climb })).
const result = {
  'roll-simulator': ['/en/guides/tft-rolldown-guide', 'When should you roll in a real game?', 'Read the TFT Rolldown Guide'],
  '3-star-rush': ['/en/tools/tft-rolldown-calculator', 'Chasing a 3-star in a real game?', 'Check your odds with the Rolldown Calculator'],
  '100-gold-challenge': ['/en/tier-list', 'Want more comps like this?', 'See the TFT tier list'],
  'champion-quiz': ['/en/library', 'Want to know the whole roster?', 'Browse every champion on TFTClimb'],
  'cost-quiz': ['/en/cheatsheet/tft-shop-odds', 'Cost decides when a champion shows up in your shop.', 'See the shop odds on TFTClimb'],
  'item-quiz': ['/en/library', 'Missed a recipe?', 'Look up every item on TFTClimb'],
  'trait-quiz': ['/en/tft-team-builder', 'Know your synergies?', 'Plan a board in the Team Builder'],
  'find-the-imposter': ['/en/tft-team-builder', 'Know which champions fit together?', 'Build a board in the Team Builder'],
  'shop-odds-quiz': ['/en/cheatsheet/tft-shop-odds', 'Want every level at a glance?', 'Open the shop odds cheat sheet'],
  'shop-memory': ['/en/tier-list', 'Know what to look for in your shop?', 'See the best comps right now'],
  'comp-memory': ['/en/tier-list', 'Remember the boards that win.', 'See the TFT tier list'],
};

module.exports = { utm, network, result, CLIMB: 'https://www.tftclimb.com' };
