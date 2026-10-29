// TFT Arcade – Grunddaten der Seite. Alles, was auf jeder Seite gleich ist, steht hier.
module.exports = {
  name: 'TFT Arcade',
  // Adresse für canonical, Sitemap und Link-Vorschauen: immer die www-Domain (wie bei TFTClimb).
  // tftarcade.com und tft-arcade.vercel.app leiten per vercel.json dorthin weiter. SITE_URL überschreibt sie (z. B. für Tests).
  url: process.env.SITE_URL || 'https://www.tftarcade.com',
  lang: 'de',
  locale: 'de_DE',
  themeColor: '#160a28',
  ogImage: '/assets/img/tft-arcade-vorschau.jpg',
  // Kontakt und Anbieter (wie bei TFTClimb) – für Impressum, Datenschutz und Feedback
  email: 'info@tftclimb.com',
  owner: { name: 'Claudio Vecchione', street: 'Am Markt 15', city: '65795 Hattersheim', country: 'Deutschland' },
  // Reihenfolge der Hauptnavigation = ids aus categories.js
  nav: ['simulatoren', 'challenges', 'quiz', 'party'],
  footer: [
    { href: '/ueber-tft-arcade', label: 'Über TFT Arcade' },
    { href: '/feedback', label: 'Feedback' },
    { href: '/impressum', label: 'Impressum' },
    { href: '/datenschutz', label: 'Datenschutz' },
  ],
};
