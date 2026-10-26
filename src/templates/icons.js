// TFT Arcade – Symbole als Inline-SVG. Farben kommen aus dem CSS:
// .i-a = Akzentfarbe der Bude (currentColor), .i-d = dunkle Details, .i-l = helle Lichter, .i-s = Linien
const svg = (body, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${body}</svg>`;

const STAR = (cx, cy, r) => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    p.push((cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1));
  }
  return `M${p.join('L')}Z`;
};

const ART = {
  // Marktstand mit Shop-Angeboten
  shop: `<path class="i-a" d="M7 22l5-12h40l5 12z"/><path class="i-l" d="M17 10h6l-2 12h-7zM29 10h6v12h-6zM41 10h6l3 12h-7z" opacity=".55"/>
    <path class="i-a" d="M7 22a4.2 4.2 0 0 0 8.4 0 4.2 4.2 0 0 0 8.4 0 4.2 4.2 0 0 0 8.4 0 4.2 4.2 0 0 0 8.4 0 4.2 4.2 0 0 0 8.4 0 4.2 4.2 0 0 0 8.4 0z"/>
    <rect class="i-d" x="11" y="29" width="42" height="25" rx="3"/><rect class="i-l" x="15" y="33" width="9" height="12" rx="1.5"/><rect class="i-a" x="27.5" y="33" width="9" height="12" rx="1.5"/><rect class="i-l" x="40" y="33" width="9" height="12" rx="1.5"/>
    <rect class="i-a" x="15" y="48" width="34" height="3" rx="1.5" opacity=".7"/>`,
  // drei Sterne (3-Sterne-Champion)
  stars: `<path class="i-a" d="${STAR(32, 27, 16)}"/><path class="i-l" d="${STAR(13, 40, 9)}"/><path class="i-l" d="${STAR(51, 40, 9)}"/>
    <rect class="i-d" x="14" y="50" width="36" height="6" rx="3"/><rect class="i-a" x="14" y="50" width="24" height="6" rx="3"/>`,
  // Münzstapel
  coin: `<ellipse class="i-d" cx="26" cy="49" rx="15" ry="5"/><rect class="i-a" x="11" y="38" width="30" height="11"/><ellipse class="i-a" cx="26" cy="49" rx="15" ry="5"/><ellipse class="i-l" cx="26" cy="38" rx="15" ry="5"/>
    <rect class="i-a" x="11" y="30" width="30" height="8"/><ellipse class="i-l" cx="26" cy="30" rx="15" ry="5"/>
    <circle class="i-a" cx="44" cy="22" r="13"/><circle class="i-l" cx="44" cy="22" r="9"/><path class="i-d" d="M41 17h5a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h5M44 14v3M44 29v3" fill="none" stroke-width="2.2" stroke-linecap="round"/>`,
  // Fragezeichen im Sechseck
  question: `<path class="i-a" d="M32 5l23 13v28L32 59 9 46V18z"/><path class="i-d" d="M32 11l18 10.3v21.4L32 53 14 42.7V21.3z"/>
    <path class="i-l" d="M25 26a7 7 0 1 1 10.5 6c-2.3 1.4-3.5 2.6-3.5 5.5" fill="none" stroke-width="5" stroke-linecap="round"/><circle class="i-l" cx="32" cy="45" r="3.2"/>`,
  // Schwert (Item)
  sword: `<path class="i-l" d="M44 8h12v12L30 46l-12-12z"/><path class="i-a" d="M50 14L26 38" stroke-width="3" fill="none"/><path class="i-a" d="M14 32l18 18-4 4-18-18z"/>
    <path class="i-d" d="M17 43l4 4-9 9a2.8 2.8 0 0 1-4-4z"/><circle class="i-a" cx="10" cy="54" r="3"/>`,
  // Lupe
  zoom: `<circle class="i-a" cx="27" cy="27" r="19"/><circle class="i-d" cx="27" cy="27" r="13.5"/><path class="i-l" d="M19 25a8 8 0 0 1 8-8" fill="none" stroke-width="3.5" stroke-linecap="round"/>
    <path class="i-a" d="M40 41l6-6 13 13a4.2 4.2 0 0 1-6 6z"/><path class="i-l" d="${STAR(52, 13, 7)}"/>`,
  // Roulette-Rad
  wheel: `<circle class="i-d" cx="32" cy="34" r="25"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a1 = i * Math.PI / 4, a2 = a1 + Math.PI / 4, r = 21, x1 = 32 + Math.cos(a1) * r, y1 = 34 + Math.sin(a1) * r, x2 = 32 + Math.cos(a2) * r, y2 = 34 + Math.sin(a2) * r; return `<path class="${i % 2 ? 'i-a' : 'i-l'}" d="M32 34L${x1.toFixed(1)} ${y1.toFixed(1)}A21 21 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}z"/>`; }).join('')}
    <circle class="i-d" cx="32" cy="34" r="6"/><circle class="i-a" cx="32" cy="34" r="3"/><path class="i-a" d="M26 3h12l-6 11z"/>`,
  // Bingo-Karte
  bingo: `<rect class="i-a" x="8" y="6" width="48" height="52" rx="5"/><rect class="i-d" x="12" y="16" width="40" height="38" rx="2"/>
    <rect class="i-l" x="8" y="6" width="48" height="8" rx="4" opacity=".5"/>
    ${[0, 1, 2].map(r => [0, 1, 2].map(c => `<rect class="i-l" x="${15 + c * 12.5}" y="${19 + r * 11.7}" width="9" height="8.5" rx="1.5" opacity="${(r + c) % 2 ? '.35' : '.8'}"/>`).join('')).join('')}
    <circle class="i-a" cx="32" cy="35" r="7" opacity=".9"/><path class="i-l" d="${STAR(32, 35, 5)}"/>`,
  // Augment-Sechseck
  hex: `<path class="i-a" d="M32 4l24 14v28L32 60 8 46V18z"/><path class="i-l" d="M32 11l18 10.5v21L32 53 14 42.5v-21z" opacity=".35"/>
    <path class="i-d" d="M32 17l12 7v14l-12 7-12-7V24z"/><path class="i-l" d="M32 23v16M24 31h16" stroke-width="4" stroke-linecap="round" fill="none"/>`,
  // Karussell
  carousel: `<path class="i-a" d="M32 4L6 22h52z"/><path class="i-l" d="M32 4l-8 18h16z" opacity=".5"/>
    <path class="i-a" d="M6 22a4.4 4.4 0 0 0 8.7 0 4.4 4.4 0 0 0 8.7 0 4.4 4.4 0 0 0 8.6 0 4.4 4.4 0 0 0 8.7 0 4.4 4.4 0 0 0 8.7 0 4.4 4.4 0 0 0 8.6 0z"/>
    <path class="i-s" d="M14 27v20M32 27v20M50 27v20" stroke-width="2.5"/><rect class="i-d" x="6" y="50" width="52" height="7" rx="3.5"/>
    <circle class="i-l" cx="14" cy="38" r="4"/><circle class="i-a" cx="32" cy="42" r="4"/><circle class="i-l" cx="50" cy="36" r="4"/>`,
  // verdeckte Karten (Shop-Memory)
  memory: `<rect class="i-d" x="6" y="14" width="22" height="30" rx="3" transform="rotate(-10 17 29)"/><rect class="i-a" x="7" y="15" width="20" height="28" rx="3" transform="rotate(-10 17 29)"/>
    <rect class="i-d" x="36" y="14" width="22" height="30" rx="3" transform="rotate(10 47 29)"/><rect class="i-a" x="37" y="15" width="20" height="28" rx="3" transform="rotate(10 47 29)"/>
    <rect class="i-d" x="20" y="10" width="24" height="34" rx="3"/><rect class="i-l" x="22" y="12" width="20" height="30" rx="2"/>
    <path class="i-d" d="M28 22a4.5 4.5 0 1 1 6.5 4c-1.5.8-2.5 1.6-2.5 3.5" fill="none" stroke-width="3.2" stroke-linecap="round"/><circle class="i-d" cx="32" cy="35" r="2"/>
    <rect class="i-a" x="14" y="50" width="36" height="6" rx="3"/>`,
  // Pokal (Bestenliste)
  trophy: `<path class="i-a" d="M18 6h28v14a14 14 0 0 1-28 0z"/><path class="i-l" d="M23 9h5v12a9 9 0 0 1-3-1.5z" opacity=".55"/>
    <path class="i-a" d="M18 10H8v4a12 12 0 0 0 12 12l1-5a7 7 0 0 1-7-7zM46 10h10v4a12 12 0 0 1-12 12l-1-5a7 7 0 0 0 7-7z"/>
    <rect class="i-a" x="28" y="33" width="8" height="10"/><rect class="i-d" x="16" y="43" width="32" height="13" rx="3"/><rect class="i-a" x="21" y="47" width="22" height="5" rx="2"/>
    <path class="i-l" d="${STAR(32, 18, 6)}"/>`,
  // Stoppuhr (Kategorie Challenges)
  stopwatch: `<rect class="i-a" x="26" y="3" width="12" height="6" rx="2"/><path class="i-a" d="M47 12l5 5-3 3-5-5z"/><circle class="i-a" cx="32" cy="36" r="23"/><circle class="i-d" cx="32" cy="36" r="17.5"/>
    <path class="i-l" d="M32 36V24M32 36l8 6" stroke-width="4" stroke-linecap="round" fill="none"/><circle class="i-l" cx="32" cy="36" r="3"/>`,
  // Ticket mit Stern (Kategorie Party)
  ticket: `<path class="i-a" d="M6 18a4 4 0 0 1 4-4h44a4 4 0 0 1 4 4v7a7 7 0 0 0 0 14v7a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4v-7a7 7 0 0 0 0-14z"/>
    <path class="i-d" d="M42 18v28" stroke-width="2" stroke-dasharray="3 3" fill="none"/><path class="i-l" d="${STAR(24, 32, 11)}"/><circle class="i-l" cx="50" cy="32" r="3"/>`,
};

// Kleine Bedien-Symbole (Linien, 24er Raster)
const UI = {
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>',
  share: '<path d="M4 12v7h16v-7M12 3v12M7 8l5-5 5 5"/>',
  replay: '<path d="M4 4v6h6"/><path d="M5.6 15a8 8 0 1 0 1.3-8.4L4 10"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  ticket: '<path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M15 6v12" stroke-dasharray="2 2"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.3-1.3a4 4 0 0 1-5-5L14 2z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M7.5 14h2M11 14h2M14.5 14h2M7.5 17h2M11 17h2"/>',
};

const art = key => svg(ART[key] || ART.question, 'art');
const ui = (key, cls = 'ui') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${UI[key] || ''}</svg>`;

module.exports = { art, ui, ART, UI };
