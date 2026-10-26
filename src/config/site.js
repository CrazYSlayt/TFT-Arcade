// TFT Arcade – Grunddaten der Seite. Alles, was auf jeder Seite gleich ist, steht hier.
module.exports = {
  name: 'TFT Arcade',
  // Adresse für canonical, Sitemap und Link-Vorschauen. Auf Vercel automatisch die Produktions-Domain
  // (VERCEL_PROJECT_PRODUCTION_URL – nach dem Verknüpfen einer eigenen Domain ist das diese), sonst SITE_URL oder die Vercel-Adresse
  url: process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'https://tft-arcade.vercel.app'),
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
