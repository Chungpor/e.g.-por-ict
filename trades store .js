"use strict";
/**
 * Por ICT - trade store (shared by chart-analysis.html and my-trades.html).
 * Saves every generated signal, then checks live candles to see whether price hit TP or SL.
 * Data is kept in localStorage per logged-in account (same pattern as the rest of the site).
 */
(function () {
  const BN_HOSTS = [
    "https://api.binance.com",
    "https://data-api.binance.vision",
    "https://api1.binance.com",
    "https://api2.binance.com",
    "https://api3.binance.com",
  ];
  const SETTINGS_KEY = "por_trades_settings";
  const MAX_TRADES = 500;
  let hostIdx = 0;

  // Pair Image Lookup Map for XAUUSD, BTCUSD, ETHUSD, EURUSD, GBPUSD, USDJPY
  const PAIR_IMAGES = {
    XAUUSD: "image_6652d9.png",
    BTCUSD: "image_665600.png",
    ETHUSD: "image_66565b.png",
    EURUSD: "image_7034b8.png",
    GBPUSD: "image_70381d.png",
    USDJPY: "image_704059.png",
  };

  function getPairIcon(pair) {
    if (!pair) return null;
    const clean = String(pair).toUpperCase().replace(/[^A-Z]/g, "");
    if (PAIR_IMAGES[clean]) return PAIR_IMAGES[clean];
    if (clean.includes("XAU") || clean.includes("GOLD") || clean.includes("PAXG")) return PAIR_IMAGES.XAUUSD;
    if (clean.includes("BTC")) return PAIR_IMAGES.BTCUSD;
    if (clean.includes("ETH")) return PAIR_IMAGES.ETHUSD;
    if (clean.includes("EUR")) return PAIR_IMAGES.EURUSD;
    if (clean.includes("GBP")) return PAIR_IMAGES.GBPUSD;
    if (clean.includes("JPY")) return PAIR_IMAGES.USDJPY;
    return null;
  }

  // Safe timeout helper for browsers that do not support AbortSignal.timeout
  function timeoutSignal(ms) {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      return AbortSignal.timeout(ms);
    }
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), ms);
    return ctrl.signal;
  }

  // Auto-detect Binance symbols if not explicitly supplied
  function resolveBnSymbol(pair) {
    if (!pair) return null;
    const clean = String(pair).toUpperCase().replace(/[^A-Z]/g, "");
    const map = {
      BTC: "BTCUSDT",
      BTCUSD: "BTCUSDT",
      BTCUSDT: "BTCUSDT",
      ETH: "ETHUSDT",
      ETHUSD: "ETHUSDT",
      ETHUSDT: "ETHUSDT",
      XAU: "PAXGUSDT",
      XAUUSD: "PAXGUSDT",
      GOLD: "PAXGUSDT",
      PAXG: "PAXGUSDT",
      PAXGUSD: "PAXGUSDT",
      PAXGUSDT: "PAXGUSDT",
      SOL: "SOLUSDT",
      SOLUSD: "SOLUSDT",
      SOLUSDT: "SOLUSDT",
      BNB: "BNBUSDT",
      BNBUSD: "BNBUSDT",
      BNBUSDT: "BNBUSDT",
    };
    return map[clean] || (clean.endsWith("USDT") ? clean : null);
  }

  function userKey() {
    let email = "guest";
    try {
      email = localStorage.getItem("por_active_user") || "guest";
    } catch (e) {}
    return "por_trades_v1_" + email;
  }

  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(userKey()) || "[]");
      return Array.isArray(v) ? v : [];
    } catch (e) {
      return [];
    }
  }

  function save(list) {
    try {
      localStorage.setItem(userKey(), JSON.stringify(list.slice(0, MAX_TRADES)));
      return true;
    } catch (e) {
      return false;
    }
  }

  function settings() {
    let s = {};
    try {
      s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    } catch (e) {}
    return { winTp: [1, 2, 3].includes(s.winTp) ? s.winTp : 1 };
  }

  function setSettings(patch) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings(), ...patch }));
    } catch (e) {}
  }

  /**
   * Add a signal to history. Returns {trade, duplicate}.
   * A signal is a duplicate if an unresolved trade with the same pair, timeframe, direction and stop already exists.
   */
  function add(sig) {
    const list = load();
    const dup = list.find(
      (t) =>
        !t.manual &&
        t.pair === sig.pair &&
        t.tf === sig.tf &&
        t.dir === sig.dir &&
        Math.abs(t.sl - sig.sl) < Math.abs(sig.entry - sig.sl) * 0.02 &&
        resultOf(t).state === "open"
    );
    if (dup) return { trade: dup, duplicate: true };

    const bnSymbol = sig.bn || resolveBnSymbol(sig.pair);
    const parsedTps = Array.isArray(sig.tps)
      ? sig.tps.map(Number)
      : [sig.tp1, sig.tp2, sig.tp3].filter((v) => v != null).map(Number);

    const trade = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      createdAt: Date.now(),
      pair: sig.pair,
      image: sig.image || getPairIcon(sig.pair),
      tf: sig.tf,
      dir: sig.dir,
      entry: +sig.entry,
      sl: +sig.sl,
      tps: parsedTps,
      dec: sig.dec != null ? Number(sig.dec) : (String(sig.entry).split(".")[1] || "").length || 2,
      strategy: sig.strategy || "",
      source: sig.source || "",
      lots: sig.lots ?? null,
      riskUsd: sig.riskUsd ?? null,
      auto: sig.auto !== undefined ? Boolean(sig.auto && bnSymbol) : Boolean(bnSymbol),
      bn: bnSymbol || null,
      hits: { tp: [null, null, null], sl: null },
      checkedFrom: Date.now(),
      lastCheck: null,
      manual: null,
      note: "",
      followed: null,
    };

    list.unshift(trade);
    save(list);
    return { trade, duplicate: false };
  }

  function update(id, patch) {
    const list = load(),
      i = list.findIndex((t) => t.id === id);
    if (i < 0) return null;
    list[i] = { ...list[i], ...patch };
    save(list);
    return list[i];
  }

  function remove(id) {
    save(load().filter((t) => t.id !== id));
  }

  function clearAll() {
    save([]);
  }

  /** Work out the outcome of one trade. winTp = which target counts as "TP hit" (1, 2 or 3). */
  function resultOf(t, winTp = settings().winTp) {
    const risk = Math.abs(t.entry - t.sl) || 1;
    const rOf = (n) => {
      const target = t.tps && t.tps[n - 1] != null ? t.tps[n - 1] : t.entry;
      return Math.abs(target - t.entry) / risk || n;
    };

    if (t.manual) {
      const m = t.manual;
      if (m.result === "win") return { state: "win", level: m.level, r: rOf(m.level), at: m.at, by: "manual" };
      if (m.result === "loss") return { state: "loss", r: -1, at: m.at, by: "manual" };
      return { state: "be", r: 0, at: m.at, by: "manual" };
    }

    const tpAt = t.hits && t.hits.tp ? t.hits.tp[winTp - 1] : null;
    const slAt = t.hits ? t.hits.sl : null;

    // If both happen in the same candle we cannot know the order, so count it as a loss (the cautious choice).
    if (tpAt && (!slAt || tpAt < slAt)) return { state: "win", level: winTp, r: rOf(winTp), at: tpAt, by: "auto" };
    if (slAt) return { state: "loss", r: -1, at: slAt, by: "auto" };
    return { state: "open", r: 0 };
  }

  // ---- auto tracking: Binance first, Bybit as backup when Binance is blocked on the user's network ----
  const BYBIT = "https://api.bybit.com";
  const BYBIT_IV = { "1m": "1", "5m": "5", "15m": "15", "30m": "30", "1h": "60", "4h": "240", "1d": "D" };
  let bnDownUntil = 0;

  async function binanceRange(symbol, interval, startTime) {
    const out = [];
    let from = startTime;
    for (let page = 0; page < 15; page++) {
      let rows = null,
        lastErr;
      for (let n = 0; n < BN_HOSTS.length; n++) {
        const host = BN_HOSTS[(hostIdx + n) % BN_HOSTS.length];
        try {
          const r = await fetch(
            `${host}/api/v3/klines?symbol=${symbol}&interval=${interval}&startTime=${from}&limit=1000`,
            { signal: timeoutSignal(4000) }
          );
          if (!r.ok) throw new Error("Market data error " + r.status);
          rows = await r.json();
          hostIdx = (hostIdx + n) % BN_HOSTS.length;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!rows) throw lastErr || new Error("Market data unavailable");
      rows.forEach((k) => out.push({ t: k[0], h: +k[2], l: +k[3] }));
      if (rows.length < 1000) break;
      from = rows[rows.length - 1][0] + 1;
    }
    return out;
  }

  // Bybit returns newest first, so page backwards from "now" until we reach startTime.
  async function bybitRange(symbol, interval, startTime) {
    const iv = BYBIT_IV[interval];
    if (!iv) throw new Error("Unsupported interval");
    const out = [];
    let end = Date.now();
    for (let page = 0; page < 15; page++) {
      const r = await fetch(
        `${BYBIT}/v5/market/kline?category=spot&symbol=${symbol}&interval=${iv}&start=${startTime}&end=${end}&limit=1000`,
        { signal: timeoutSignal(6000) }
      );
      if (!r.ok) throw new Error("Backup market data error " + r.status);
      const j = await r.json();
      if (j.retCode !== 0 || !j.result || !Array.isArray(j.result.list)) throw new Error("Backup market data unavailable");
      const rows = j.result.list;
      rows.forEach((k) => out.push({ t: +k[0], h: +k[2], l: +k[3] }));
      if (rows.length < 1000) break;
      end = +rows[rows.length - 1][0] - 1;
    }
    return out.sort((a, b) => a.t - b.t);
  }

  async function fetchRange(symbol, interval, startTime) {
    const order = Date.now() < bnDownUntil ? ["bybit", "binance"] : ["binance", "bybit"];
    let lastErr;
    for (const src of order) {
      try {
        const rows = src === "binance" ? await binanceRange(symbol, interval, startTime) : await bybitRange(symbol, interval, startTime);
        if (src === "binance") bnDownUntil = 0;
        return rows;
      } catch (e) {
        lastErr = e;
        if (src === "binance") bnDownUntil = Date.now() + 5 * 60 * 1000;
      }
    }
    throw lastErr || new Error("Market data unavailable");
  }

  function scan(t, candles) {
    const buy = t.dir === "BUY";
    for (const c of candles) {
      if (c.t < t.checkedFrom - 60000) continue;

      // If already stopped out or resolved, do not scan subsequent candles
      if (t.hits.sl) break;
      if (t.tps.length && t.tps.every((_, i) => t.hits.tp[i])) break;

      const slHit = buy ? c.l <= t.sl : c.h >= t.sl;
      const tpHitsNow = [];
      t.tps.forEach((p, i) => {
        if (!t.hits.tp[i] && (buy ? c.h >= p : c.l <= p)) {
          tpHitsNow.push(i);
        }
      });

      // If both hit in the same candle: treat as SL (cautious choice) and break immediately
      if (slHit && tpHitsNow.length) {
        t.hits.sl = c.t;
        break;
      }

      if (slHit) {
        t.hits.sl = c.t;
        break;
      }

      tpHitsNow.forEach((i) => {
        t.hits.tp[i] = c.t;
      });
    }

    if (candles.length) t.checkedFrom = candles[candles.length - 1].t;
    t.lastCheck = Date.now();
  }

  /** Check every unresolved auto-tracked trade. Returns how many were checked and how many just resolved. */
  async function trackAll() {
    const list = load();
    let checked = 0,
      resolved = 0,
      failed = 0;
    for (const t of list) {
      if (!t.auto || !t.bn || t.manual || resultOf(t).state !== "open") continue;
      try {
        const age = Date.now() - t.createdAt;
        const candles = await fetchRange(t.bn, age > 3 * 864e5 ? "5m" : "1m", t.checkedFrom);
        scan(t, candles);
        checked++;
        if (resultOf(t).state !== "open") resolved++;
      } catch (e) {
        failed++;
      }
    }
    if (checked) save(list);
    return { checked, resolved, failed };
  }

  /** Performance numbers for a list of trades. */
  function stats(list) {
    const rows = list.map((t) => ({ t, r: resultOf(t) }));
    const done = rows
      .filter((x) => x.r.state !== "open")
      .sort((a, b) => (a.r.at || a.t.createdAt || 0) - (b.r.at || b.t.createdAt || 0));
    const wins = done.filter((x) => x.r.state === "win"),
      losses = done.filter((x) => x.r.state === "loss"),
      be = done.filter((x) => x.r.state === "be");
    const totalR = done.reduce((s, x) => s + x.r.r, 0);
    const gp = wins.reduce((s, x) => s + x.r.r, 0),
      gl = Math.abs(losses.reduce((s, x) => s + x.r.r, 0));
    const decided = wins.length + losses.length;
    let run = 0,
      peak = 0,
      maxDd = 0;
    const curve = done.map((x) => {
      run += x.r.r;
      peak = Math.max(peak, run);
      maxDd = Math.max(maxDd, peak - run);
      return run;
    });
    let bestStreak = 0,
      cur = 0;
    done.forEach((x) => {
      if (x.r.state === "win") {
        cur++;
        bestStreak = Math.max(bestStreak, cur);
      } else if (x.r.state === "loss") {
        cur = 0;
      }
    });
    const byPair = {};
    done.forEach((x) => {
      const p = (byPair[x.t.pair] ||= {
        pair: x.t.pair,
        image: getPairIcon(x.t.pair),
        wins: 0,
        losses: 0,
        r: 0,
      });
      if (x.r.state === "win") p.wins++;
      else if (x.r.state === "loss") p.losses++;
      p.r += x.r.r;
    });

    return {
      total: list.length,
      open: rows.length - done.length,
      closed: done.length,
      wins: wins.length,
      losses: losses.length,
      be: be.length,
      winRate: decided ? (wins.length / decided) * 100 : null,
      totalR,
      avgR: done.length ? totalR / done.length : null,
      profitFactor: gl > 0 ? gp / gl : gp > 0 ? Infinity : null,
      maxDd,
      bestStreak,
      curve,
      byPair: Object.values(byPair).sort((a, b) => b.r - a.r),
    };
  }

  window.PAIR_IMAGES = PAIR_IMAGES;
  window.getPairIcon = getPairIcon;

  window.PorTrades = {
    load,
    save,
    add,
    update,
    remove,
    clearAll,
    resultOf,
    trackAll,
    stats,
    settings,
    setSettings,
    getPairIcon,
  };
  window.TradesStore = window.PorTrades;
})();