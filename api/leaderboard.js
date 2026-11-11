// TFT Arcade – öffentliche Bestenlisten als Vercel-Funktion unter /api/leaderboard
//   GET  ?game=<id>        → { boards: { [spiel]: { [modus]: [{ id, name, avatar, value, date }] } } }   (ohne game: alle Spiele, 20 s zwischengespeichert)
//   POST { entries: [{ game, mode, name, avatar, value }] }  → { results: [{ id, rank } | { error }] }   (bis zu 30 Einträge auf einmal)
// Speicher: Upstash Redis (dieselbe Datenbank wie TFTClimb, eigene Schlüssel tftarcade:…). Zugangsdaten legt Vercel als
// KV_REST_API_URL / KV_REST_API_TOKEN an (bzw. UPSTASH_REDIS_REST_URL / _TOKEN) – sie stehen nie im Code.
// Pro Spiel und Modus bleiben nur die besten 100. Werte aus dem Browser lassen sich fälschen; deshalb Grenzen je Spiel
// (record.min / record.max in src/config/games.js), Namensfilter und höchstens 6 Anfragen pro Minute und IP (nur als Hash, 60 s gespeichert).
const crypto = require('crypto');
const games = require('../src/config/games');
const AVATARS = require('../src/config/avatare').map(a => a.id);

const MAX = 100, BATCH = 30, PER_MINUTE = 6;
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Regeln je Spiel: gewertete Modi, Richtung, erlaubter Wertebereich
const RULES = Object.fromEntries(games.filter(g => g.status === 'live' && g.record).map(g => [g.id, {
  modes: g.modes.filter(m => m.ranked !== false).map(m => m.id),
  lower: !!g.record.lowerIsBetter, type: g.record.type, min: g.record.min || 0, max: g.record.max,
}]));

// Namen: 2–12 Zeichen wie im Formular, keine Beleidigungen und keine Namen, die nach Team oder Riot aussehen
const NAME_OK = /^[\p{L}\p{N}][\p{L}\p{N} _.-]{1,11}$/u;
const BLOCK = ['admin', 'moderator', 'riotgames', 'official', 'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'nigg', 'nigga', 'fag', 'retard', 'rape', 'nazi', 'hitler', 'heil', 'kike', 'spic', 'chink', 'tranny',
  'hure', 'fotze', 'schlampe', 'wichser', 'arschloch', 'hurensohn', 'missgeburt', 'schwuchtel', 'spast', 'behindert', 'kanake', 'neger', 'judensau'];
const flat = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[0@4]/g, m => ({ 0: 'o', '@': 'a', 4: 'a' })[m]).replace(/[1!]/g, 'i').replace(/3/g, 'e').replace(/5/g, 's').replace(/7/g, 't').replace(/[^a-z]/g, '');
const nameOk = n => NAME_OK.test(n) && !BLOCK.some(w => flat(n).includes(w));

const key = (game, mode) => `tftarcade:lb:${game}:${mode}`;

async function redis(cmds) {
  const res = await fetch(`${URL_}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!res.ok) throw new Error('Redis ' + res.status);
  return (await res.json()).map(r => r.result);
}

// Liste eines Modus: bester zuerst; Gleichstand: wer zuerst da war, bleibt vorn (wie am Automaten)
function rows(raw, lower) {
  const list = [];
  for (let i = 0; i < (raw || []).length; i += 2) {
    try { const e = JSON.parse(raw[i]); list.push({ id: e.i, name: e.n, avatar: e.a, date: e.d, value: Number(raw[i + 1]) }); } catch (err) { /* kaputter Eintrag */ }
  }
  return list.sort((a, b) => (lower ? a.value - b.value : b.value - a.value) || a.date - b.date);
}

function check(e) {
  const r = e && RULES[e.game];
  if (!r || !r.modes.includes(e.mode)) return 'unknown game or mode';
  const name = String(e.name || '').trim().replace(/\s+/g, ' ');
  if (!nameOk(name)) return 'name not allowed';
  const v = Number(e.value);
  if (!Number.isFinite(v) || v < r.min || (r.max != null && v > r.max)) return 'value out of range';
  if (r.type === 'punkte' && !Number.isInteger(v)) return 'value out of range';
  return null;
}

async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function send(res, status, data, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache || 'no-store');
  res.end(JSON.stringify(data));
}

module.exports = async (req, res) => {
  if (!URL_ || !TOKEN) return send(res, 503, { boards: null, error: 'storage not configured' }, 's-maxage=60');
  try {
    if (req.method === 'GET') {
      const q = (req.query && req.query.game) || new URL(req.url, 'http://x').searchParams.get('game');
      const ids = q ? [q].filter(id => RULES[id]) : Object.keys(RULES);
      const pairs = ids.flatMap(id => RULES[id].modes.map(m => [id, m]));
      const raw = pairs.length ? await redis(pairs.map(([id, m]) => [RULES[id].lower ? 'ZRANGE' : 'ZREVRANGE', key(id, m), '0', String(MAX - 1), 'WITHSCORES'])) : [];
      const boards = {};
      pairs.forEach(([id, m], i) => { (boards[id] = boards[id] || {})[m] = rows(raw[i], RULES[id].lower); });
      return send(res, 200, { boards }, 's-maxage=20, stale-while-revalidate=60');
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'method not allowed' });

    // höchstens 6 Anfragen pro Minute und IP; die IP wird nur als Hash und nur 60 Sekunden gespeichert
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const rl = 'tftarcade:rl:' + crypto.createHash('sha256').update(ip + new Date().toISOString().slice(0, 10)).digest('hex').slice(0, 24);
    const [count] = await redis([['INCR', rl], ['EXPIRE', rl, '60']]);
    if (count > PER_MINUTE) return send(res, 429, { error: 'too many requests' });

    const list = ((await body(req)).entries || []).slice(0, BATCH);
    const results = [];
    for (const e of list) {
      const err = check(e);
      if (err) { results.push({ error: err }); continue; }
      const r = RULES[e.game], k = key(e.game, e.mode);
      const entry = { i: crypto.randomBytes(6).toString('hex'), n: String(e.name).trim().replace(/\s+/g, ' '), a: AVATARS.includes(e.avatar) ? e.avatar : AVATARS[0], d: Date.now() };
      const member = JSON.stringify(entry);
      // eintragen, auf die besten 100 kürzen, Platz abfragen (null = nicht unter den besten 100)
      const out = await redis([
        ['ZADD', k, String(Number(e.value)), member],
        r.lower ? ['ZREMRANGEBYRANK', k, String(MAX), '-1'] : ['ZREMRANGEBYRANK', k, '0', String(-(MAX + 1))],
        [r.lower ? 'ZRANK' : 'ZREVRANK', k, member],
      ]);
      results.push({ id: entry.i, date: entry.d, rank: out[2] == null ? null : Number(out[2]) + 1 });
    }
    return send(res, 200, { results });
  } catch (e) {
    return send(res, 502, { boards: null, error: 'storage error' }, 's-maxage=10');
  }
};
