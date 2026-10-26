// TFT Arcade – die vier Bereiche der Spielhalle.
// slug = Adresse (/simulatoren …), color = Farbe der Bude (gold | coral | teal | violet), icon = Symbol aus templates/icons.js
// seo: title ≤ 60 Zeichen, desc ≤ 134 Zeichen mit Keyword, h1 ≤ 54 Zeichen (sichtbar), kw = Keyword für den SEO-Check
module.exports = [
  {
    id: 'simulatoren',
    slug: 'simulatoren',
    name: 'Simulatoren',
    color: 'gold',
    icon: 'shop',
    tagline: 'Shop rollen, Champions kaufen, Kopien sammeln.',
    intro: 'Hier rollst du ohne LP-Verlust: Shop auffrischen, Champions kaufen und schauen, wie weit dein Gold reicht. Ideal zum Üben und für zwischendurch.',
    seo: {
      title: 'TFT Simulatoren – Roll Simulator & mehr | TFT Arcade',
      desc: 'TFT Simulatoren im Browser: Shop rollen, Champions kaufen und Kopien sammeln – kostenlos und ohne Anmeldung.',
      h1: 'TFT-Simulatoren',
      kw: 'TFT Simulator',
    },
  },
  {
    id: 'challenges',
    slug: 'challenges',
    name: 'Challenges',
    color: 'coral',
    icon: 'stopwatch',
    tagline: 'Gegen die Uhr, gegen das Budget, gegen dich selbst.',
    intro: 'Feste Ziele, harte Grenzen, ehrliche Rekorde: In den Challenges jagst du Bestzeiten und schaust, wer mit dem wenigsten Gold ans Ziel kommt.',
    seo: {
      title: 'TFT Challenges – 3-Star Rush & Gold-Challenge | TFT Arcade',
      desc: 'TFT Challenges: Sammle neun Kopien gegen die Uhr oder schaff das Ziel mit festem Budget. Jag deinen Rekord – ohne Anmeldung.',
      h1: 'TFT-Challenges',
      kw: 'TFT Challenge',
    },
  },
  {
    id: 'quiz',
    slug: 'quiz',
    name: 'Quiz',
    color: 'teal',
    icon: 'question',
    tagline: 'Champions erraten, Items zuordnen, Wissen testen.',
    intro: 'Wie gut kennst du TFT wirklich? Erkenne Champions an wenigen Hinweisen, ordne Items zu und sammle Punkte für jede richtige Antwort.',
    seo: {
      title: 'TFT Quiz – Champions & Items erraten | TFT Arcade',
      desc: 'TFT Quiz: Erkenne Champions an Hinweisen, ordne Items zu und sammle Punkte. Kostenlos im Browser, ohne Anmeldung.',
      h1: 'TFT-Quiz',
      kw: 'TFT Quiz',
    },
  },
  {
    id: 'party',
    slug: 'party',
    name: 'Party',
    color: 'violet',
    icon: 'ticket',
    tagline: 'Lustige Vorgaben für dein nächstes echtes Match.',
    intro: 'Für Spieleabende, Streams und Runden mit Freunden: Zieh eine verrückte Vorgabe für dein nächstes TFT-Match und schau, ob du sie trotzdem gewinnst.',
    seo: {
      title: 'TFT Party-Spiele – Challenge-Roulette | TFT Arcade',
      desc: 'TFT Party-Spiele für Freunde und Streams: Zieh eine lustige Vorgabe für dein nächstes Match. Kostenlos und ohne Anmeldung.',
      h1: 'TFT-Party-Spiele',
      kw: 'TFT Party',
    },
  },
];
