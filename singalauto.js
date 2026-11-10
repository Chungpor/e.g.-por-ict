/**
 * K-SNR Auto Signal API — drop-in Express router for the Por ICT server.
 *   GET  /api/price?symbol=XAU_USD
 *   GET  /api/candles?symbol=XAU_USD&granularity=M5
 *   POST /api/ai          (Gemini explanation; uses your existing GEMINI_API_KEY)
 * .env needs:  OANDA_TOKEN=...   OANDA_ENV=practice|live
 * Requires Node 18+ (global fetch).
 */
const express = require('express');

const INST = new Set(['XAU_USD', 'XAG_USD', 'EUR_USD', 'GBP_USD', 'AUD_USD', 'USD_JPY', 'WTICO_USD']);
const GRAN = new Set(['M5', 'M30', 'H1', 'D']);
const PAIRS = new Set(['XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD', 'EURUSD', 'GBPUSD', 'AUDUSD', 'USDJPY', 'USOIL']);
const FRAMES = new Set(['M5', 'M30', 'H1', 'D1']);

const httpErr = (status, message) => Object.assign(new Error(message), { status });
const memo = new Map();
async function cached(key, ttl, fn) {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  const v = await fn();
  memo.set(key, { t: Date.now(), v });
  return v;
}

async function oanda(p) {
  const token = process.env.OANDA_TOKEN;
  if (!token) throw httpErr(500, 'OANDA_TOKEN is missing in .env');
  const base = process.env.OANDA_ENV === 'live' ? 'https://api-fxtrade.oanda.com' : 'https://api-fxpractice.oanda.com';
  const r = await fetch(base + p, {
    headers: { Authorization: 'Bearer ' + token, 'Accept-Datetime-Format': 'UNIX' },
    signal: AbortSignal.timeout(10000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw httpErr(r.status === 401 ? 502 : r.status, j.errorMessage || 'OANDA HTTP ' + r.status);
  return j;
}

async function gemini(b) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw httpErr(500, 'GEMINI_API_KEY is missing in .env');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const lang = b.lang === 'en' ? 'English' : 'Khmer (ភាសាខ្មែរ)';
  const prompt =
    `You are a cautious trading assistant. In ${lang}, write at most 70 words explaining this trade signal in plain language: why the direction, where risk is, and what to watch. Do not promise profit. End with one short risk reminder.\n` +
    `Pair: ${b.pair}\nTimeframe: ${b.frame}\nDirection: ${b.buy ? 'BUY' : 'SELL'}\nEntry: ${b.entry}\nStop loss: ${b.sl}\nTake profit: ${b.tp}\nR:R: 1:${(+b.rr).toFixed(2)}\nGrade: ${String(b.grade).slice(0, 1)}\nRules triggered: ${String(b.note || '').slice(0, 300)}`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    signal: AbortSignal.timeout(30000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw httpErr(502, (j.error && j.error.message) || 'Gemini HTTP ' + r.status);
  const text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || '').join('').trim();
  if (!text) throw httpErr(502, 'Empty AI response');
  return text;
}

module.exports = function signalApi({ aiGate } = {}) {
  const router = express.Router();
  // CORS: lets auto.html opened from Live Server (port 5500) or file:// call this API on :3001
  router.use((req, res, next) => {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
  router.use(express.json({ limit: '50kb' })); // no-op if the main server already parsed the body
  const hits = new Map(); // simple per-IP limit for the AI route: 10 / minute
  const limitAi = (req, res, next) => {
    const now = Date.now(), ip = req.ip || 'x';
    const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
    if (recent.length >= 10) return res.status(429).json({ error: 'Too many AI requests, try again in a minute' });
    recent.push(now); hits.set(ip, recent); next();
  };
  const wrap = fn => async (req, res) => {
    try { res.json(await fn(req)); }
    catch (e) { res.status(e.status || 500).json({ error: e.message }); }
  };

  router.get('/api/price', wrap(async req => {
    const s = String(req.query.symbol || '');
    if (!INST.has(s)) throw httpErr(400, 'Unknown symbol');
    const price = await cached('p' + s, 2000, async () => {
      const j = await oanda(`/v3/instruments/${s}/candles?granularity=S5&count=1&price=M`);
      if (!j.candles || !j.candles.length) throw httpErr(502, 'No price');
      return +j.candles[0].mid.c;
    });
    return { price, env: process.env.OANDA_ENV === 'live' ? 'live' : 'practice' };
  }));

  router.get('/api/candles', wrap(async req => {
    const s = String(req.query.symbol || ''), g = String(req.query.granularity || '');
    if (!INST.has(s) || !GRAN.has(g)) throw httpErr(400, 'Unknown symbol or granularity');
    const candles = await cached('c' + s + g, 10000, async () => {
      const j = await oanda(`/v3/instruments/${s}/candles?granularity=${g}&count=120&price=M`);
      return j.candles.map(c => ({ t: Math.round(+c.time * 1000), o: +c.mid.o, h: +c.mid.h, l: +c.mid.l, c: +c.mid.c, complete: c.complete }));
    });
    return { candles };
  }));

  router.post('/api/ai', aiGate || ((q, r, n) => n()), limitAi, wrap(async req => {
    const b = req.body || {};
    if (!['entry', 'sl', 'tp', 'rr'].every(k => Number.isFinite(+b[k])) || !PAIRS.has(b.pair) || !FRAMES.has(b.frame))
      throw httpErr(400, 'Bad signal data');
    return { text: await gemini(b) };
  }));

  return router;
};