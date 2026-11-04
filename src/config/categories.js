// TFT Arcade – die vier Bereiche der Arcade.
// slug = Adresse (/simulators …), color = Farbe der Bude (gold | coral | teal | violet), icon = Symbol aus templates/icons.js
// seo: title ≤ 60 Zeichen, desc ≤ 134 Zeichen mit Keyword, h1 ≤ 54 Zeichen (sichtbar), kw = Keyword für den SEO-Check
module.exports = [
  {
    id: 'simulators',
    slug: 'simulators',
    name: 'Simulators',
    color: 'gold',
    icon: 'shop',
    tagline: 'Roll the shop, buy champions, collect copies.',
    intro: 'Roll without losing LP: refresh the shop, buy champions and see how far your gold goes. Great for practice or a quick break.',
    seo: {
      title: 'TFT Simulators – Roll Simulator & More | TFT Arcade',
      desc: 'TFT Simulators in your browser: Roll the shop, buy champions and collect copies. Free to play, no sign-up needed.',
      h1: 'TFT Simulators',
      kw: 'TFT Simulator',
    },
  },
  {
    id: 'challenges',
    slug: 'challenges',
    name: 'Challenges',
    color: 'coral',
    icon: 'stopwatch',
    tagline: 'Against the clock, the budget and yourself.',
    intro: 'Fixed goals, hard limits, honest records: chase best times and see who gets there with the least gold.',
    seo: {
      title: 'TFT Challenges – Shop & Comp Memory | TFT Arcade',
      desc: 'TFT Challenges: Memorize shops and boards, race the clock and chase your record. Free to play in your browser, no sign-up needed.',
      h1: 'TFT Challenges',
      kw: 'TFT Challenge',
    },
  },
  {
    id: 'quiz',
    slug: 'quiz',
    name: 'Quizzes',
    color: 'teal',
    icon: 'question',
    tagline: 'Guess champions, match items, test your knowledge.',
    intro: 'How well do you really know TFT? Name champions from a few clues, match items and score points for every right answer.',
    seo: {
      title: 'TFT Quiz – Guess Champions & Items | TFT Arcade',
      desc: 'TFT Quiz: Name champions from clues, match items and learn the shop odds. Free to play in your browser, no sign-up needed.',
      h1: 'TFT Quizzes',
      kw: 'TFT Quiz',
    },
  },
  {
    id: 'party',
    slug: 'party',
    name: 'Party',
    color: 'violet',
    icon: 'ticket',
    tagline: 'Funny rules for your next real match.',
    intro: 'For game nights, streams and rounds with friends: draw a crazy rule for your next TFT match and see if you can still win.',
    seo: {
      title: 'TFT Party Games – Challenge Roulette | TFT Arcade',
      desc: 'TFT Party games for friends and streams: Draw a funny rule for your next match. Free to play in your browser, no sign-up needed.',
      h1: 'TFT Party Games',
      kw: 'TFT Party',
    },
  },
];
