// TFT Arcade – Grunddaten der Seite. Alles, was auf jeder Seite gleich ist, steht hier.
module.exports = {
  name: 'TFT Arcade',
  // Adresse für canonical, Sitemap und Link-Vorschauen: immer die www-Domain (wie bei TFTClimb).
  // tftarcade.com und tft-arcade.vercel.app leiten per vercel.json dorthin weiter. SITE_URL überschreibt sie (z. B. für Tests).
  url: process.env.SITE_URL || 'https://www.tftarcade.com',
  lang: 'en',
  locale: 'en_US',
  themeColor: '#160a28',
  ogImage: '/assets/img/tft-arcade-vorschau.jpg',
  // Google Analytics 4 (eigene Property, nicht die von TFTClimb); leer = kein Tag und kein Cookie-Hinweis
  gaId: 'G-KF7DHE0TE4',
  // Kontakt und Anbieter (wie bei TFTClimb) – für Impressum, Datenschutz und Feedback
  email: 'info@tftclimb.com',
  owner: { name: 'Claudio Vecchione', street: 'Am Markt 15', city: '65795 Hattersheim', country: 'Germany' },
  // Reihenfolge der Hauptnavigation = ids aus categories.js
  nav: ['simulators', 'challenges', 'quiz', 'party'],
  footer: [
    { href: '/about', label: 'About TFT Arcade' },
    { href: '/feedback', label: 'Feedback' },
    { href: '/legal-notice', label: 'Legal Notice' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/privacy', label: 'Cookie settings', cookies: true },   // öffnet den Cookie-Hinweis (arcade.js)
  ],
};
