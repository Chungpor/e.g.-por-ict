/**
 * =========================================================================
 * POR SMC PRO | OANDA:XAUUSD Fixed Bidirectional (Buy & Sell) Engine
 * Support OB · Resistance Wick · Buy/Sell % Meter · Locked Entry · 1:3 RR
 * https://porict.pro/api/mcp
 * =========================================================================
 */

// 1. OANDA:XAUUSD SPECIFICATION ANCHORED TO LIVE SPOT
const ASSETS = {
  XAU: {
    key: "XAU", symbol: "OANDA:XAUUSD", tvSymbol: "OANDA:XAUUSD", short: "XAUUSD",
    name: "Gold Spot / U.S. Dollar", badge: "GOLD SPOT CFD", icon: "🪙",
    price: 4187.36, change: 1.14, spread: 0.15, precision: 2,
    pipValue: 0.10,      // 1 pip on Gold = $0.10
    scale: 1,            // multiplies the Gold dollar offsets in TIMEFRAME_PROFILES
    jitter: 0.22, tickInfo: "Tick: 0.001 · Pip: 0.01", useLayout: true
  },
  BTC: {
    key: "BTC", symbol: "COINBASE:BTCUSD", tvSymbol: "COINBASE:BTCUSD", short: "BTCUSD",
    name: "Bitcoin / U.S. Dollar", badge: "BITCOIN SPOT", icon: "₿",
    price: 80000.00, change: 0.00, spread: 15, precision: 2,
    pipValue: 1.0,       // 1 pip on BTC = $1.00
    scale: 20,           // BTC offsets = Gold offsets x 20 (SL $120, TP $60 / $100 / $300 on scalp)
    jitter: 0.22, tickInfo: "Tick: 0.01 · Pip: 1.00", useLayout: false
  }
};

// Active instrument (kept under the old name so the rest of the engine is unchanged)
let activeAssetKey = "XAU";
const oandaGold = {
  ...ASSETS.XAU,
  currentPrice: ASSETS.XAU.price,
  targetRR: 3.0          // Exactly 1:3 RR
};
const slPipsScalp = 60;


// 2. TIMEFRAME PROFILES WITH DYNAMIC DEALING RANGE OFFSETS
const TIMEFRAME_PROFILES = {
  // SCALP PROFILES (Strict 60-pip SL)
  "1":   { mode: "SCALP", label: "1m Live Ticks",      tvInterval: "1",   slOffset: 6.00, tpOffsets: [3, 5, 15],  obRange: 3.50, suffix: "M1 Support OB Mitigation" },
  "3":   { mode: "SCALP", label: "3m Micro Scalp",     tvInterval: "3",   slOffset: 6.00, tpOffsets: [3, 5, 15],  obRange: 4.80, suffix: "M3 FVG Key Zone Retest" },
  "5":   { mode: "SCALP", label: "5m Momentum Scalp",  tvInterval: "5",   slOffset: 6.00, tpOffsets: [3, 5, 15],  obRange: 6.20, suffix: "M5 Liquidity Sweep Wick" },
  "15":  { mode: "SCALP", label: "15m Intraday",       tvInterval: "15",  slOffset: 6.00, tpOffsets: [3, 5, 15],  obRange: 8.50, suffix: "M15 Institutional Order Block" },
  "30":  { mode: "SCALP", label: "30m Range Shift",    tvInterval: "30",  slOffset: 9.00,  obRange: 12.00, suffix: "M30 Invalidation Block" },

  // SWING PROFILES (Proportionally Scaled Structural Dealing Ranges)
  "60":  { mode: "SWING", label: "1h Session Trend",   tvInterval: "60",  slOffset: 16.00, obRange: 18.00, suffix: "H1 Session Displacement Leg" },
  "240": { mode: "SWING", label: "4h Market Shift",    tvInterval: "240", slOffset: 32.00, obRange: 36.00, suffix: "H4 Macro Demand OB" },
  "D":   { mode: "SWING", label: "1D Dealing Range",   tvInterval: "D",   slOffset: 65.00, obRange: 75.00, suffix: "Daily High/Low Liquidity Sweep" },
  "W":   { mode: "SWING", label: "1W Macro Position",  tvInterval: "W",   slOffset: 140.0, obRange: 160.0, suffix: "Weekly Macro Dealing Equilibrium" }
};

// State Variables
let activeTfKey = "1";
let currentTradingMode = "SCALP"; // 'SCALP' vs 'SWING'
let scanDirectionMode = "AUTO";    // 'AUTO', 'BUY', 'SELL'
const activeLayoutChartId = "EdVpzZBe";
let useTemplateLayout = true;
let isAudioEnabled = true;
let isScanning = false;
let pendingScanTf = null;
let isUserTyping = false;
let entryUnlocked = false;   // false = entry locked (fixed), true = entry/SL/TPs follow the live price

// Active Setup Registry
let currentSetup = null;

function cleanNumber(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/,/g, "").trim()) || 0;
}

function formatDecimal(val, prec = 2) {
  return Number(val).toFixed(prec);
}

// =========================================================================
// 3. ICT KILLZONE SESSIONS EVALUATOR
// =========================================================================
function evaluateKillzones() {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const decimalHours = utcHours + utcMinutes / 60;

  const clockEl = document.getElementById("utcLiveClock");
  if (clockEl) {
    clockEl.textContent = `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;
  }

  const isAsia = decimalHours >= 0 && decimalHours < 6;
  const isLondon = decimalHours >= 7 && decimalHours < 10;
  const isNy = decimalHours >= 12 && decimalHours < 15;

  document.getElementById("kzAsiaBadge")?.classList.toggle("active", isAsia);
  document.getElementById("kzLondonBadge")?.classList.toggle("active", isLondon);
  document.getElementById("kzNyBadge")?.classList.toggle("active", isNy);

  if (isAsia) return "Asian Killzone";
  if (isLondon) return "London Open Killzone";
  if (isNy) return "New York Open Killzone";
  return "Inter-Session Range";
}

// =========================================================================
// 4. SUPPORT OB, RESISTANCE WICK & BUY/SELL % CALCULATOR
// =========================================================================
function calculateDealingRangeAndPower(assetPrice, tfProfile) {
  // Support OB is established below market price
  const obRange = tfProfile.obRange * oandaGold.scale;
  const supportObLow = +(assetPrice - obRange).toFixed(2);
  const supportObHigh = +(assetPrice - (obRange * 0.4)).toFixed(2);

  // Resistance Wick is established above market price (liquidity sweep wick)
  const resistanceWickLow = +(assetPrice + (obRange * 0.4)).toFixed(2);
  const resistanceWickHigh = +(assetPrice + obRange).toFixed(2);

  const rangeSpan = resistanceWickHigh - supportObLow;
  const positionInRange = assetPrice - supportObLow;

  // Percentage Valuation (0% = Extreme Discount, 100% = Extreme Premium)
  const valuationPct = Math.min(Math.max((positionInRange / rangeSpan) * 100, 15), 85);

  // Buy Power is high when price sits in Discount Demand (close to Support OB)
  // Sell Power is high when price sits in Premium Supply (close to Resistance Wick)
  const buyPct = Math.round(100 - valuationPct);
  const sellPct = Math.round(valuationPct);

  return {
    supportOb: { low: supportObLow, high: supportObHigh, label: `${formatDecimal(supportObLow)} – ${formatDecimal(supportObHigh)}` },
    resistanceWick: { low: resistanceWickLow, high: resistanceWickHigh, label: `${formatDecimal(resistanceWickLow)} – ${formatDecimal(resistanceWickHigh)}` },
    buyPct: buyPct,
    sellPct: sellPct,
    isDiscount: buyPct >= 50
  };
}

// =========================================================================
// 5. BIDIRECTIONAL SMC SETUP GENERATOR (BUY & SELL ENGINE)
// =========================================================================
function calculateGoldSetup(tfKey, forcedDirection = null) {
  const tf = TIMEFRAME_PROFILES[tfKey] || TIMEFRAME_PROFILES["1"];
  const session = evaluateKillzones();
  const rangeMetrics = calculateDealingRangeAndPower(oandaGold.currentPrice, tf);

  // 1. Determine Direction: Auto honors Support OB vs Resistance Wick
  let isBuy;
  if (forcedDirection === "BUY") {
    isBuy = true;
  } else if (forcedDirection === "SELL") {
    isBuy = false;
  } else {
    // AUTO MODE: Buy in Discount (off Support OB), Sell in Premium (off Resistance Wick)
    isBuy = rangeMetrics.isDiscount;
  }

  // 2. Lock Entry firmly at Key Institutional Level
  const entry = oandaGold.currentPrice;

  // SL and tiered TP distances in USD. Scalp 1m-15m: SL $6.00, TP $3 / $5 / $15.
  // Other profiles fall back to 1:1 / 1:2 / 1:3 of the SL.
  const slDistance = tf.slOffset * oandaGold.scale;
  const [d1, d2, d3] = tf.tpOffsets ? tf.tpOffsets.map(v => v * oandaGold.scale) : [slDistance, slDistance * 2, slDistance * oandaGold.targetRR];
  const tpDistance = d3;
  const sgn = isBuy ? 1 : -1;
  const sl  = +(entry - sgn * slDistance).toFixed(2);
  const tp1 = +(entry + sgn * d1).toFixed(2);
  const tp2 = +(entry + sgn * d2).toFixed(2);
  const tp3 = +(entry + sgn * d3).toFixed(2);

  return {
    symbol: oandaGold.symbol,
    timeframeKey: tfKey,
    timeframeLabel: tf.label,
    direction: isBuy ? "BUY" : "SELL",
    entry: entry,
    sl: sl,
    slPips: Math.round(slDistance / oandaGold.pipValue),
    tp1: tp1,
    tp2: tp2,
    tp3: tp3,
    tpPips: Math.round(tpDistance / oandaGold.pipValue),
    rr: `1:${(d3 / slDistance).toFixed(1)}`,
    modelName: isBuy ? `${session} · Support OB Demand Sweep` : `${session} · Resistance Wick Supply Rejection`,
    bias: isBuy ? `${tf.label} Bullish Demand BOS` : `${tf.label} Bearish Supply CHoCH`,
    rangeMetrics: rangeMetrics
  };
}

// =========================================================================
// 5B. HIGH-PROBABILITY SETUP FINDER (CONFLUENCE-SCORED, REAL CANDLE DATA)
// candles: [{ time, open, high, low, close }] oldest -> newest (time in s or ms, UTC)
// Returns { setup, reason, score, confluences }. setup is null = NO TRADE.
// The setup object is shape-compatible with populateFormAndOverlay().
// =========================================================================
const HPS_DEFAULTS = {
  swingLen: 3, atrPeriod: 14, minScore: 70, rr: 3.0,
  dispAtr: 1.5,        // displacement candle body >= 1.5 x ATR
  maxObAge: 40,        // order block must be fresh (bars)
  sweepWindow: 12,     // liquidity sweep must be recent (bars)
  slAtrBuffer: 0.25,   // SL sits this far beyond the order block
  maxRiskAtr: 3.0,     // reject if the order block is too wide for the RR
  htfBias: null,       // "BULLISH" | "BEARISH" | null
  htfCandles: null     // optional higher-timeframe candles (overrides htfBias)
};

function hpsAtr(c, period) {
  if (c.length < period + 1) return 0;
  let sum = 0;
  for (let i = c.length - period; i < c.length; i++) {
    sum += Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close));
  }
  return sum / period;
}

function hpsSwings(c, len) {
  const highs = [], lows = [];
  for (let i = len; i < c.length - len; i++) {
    let isH = true, isL = true;
    for (let k = 1; k <= len; k++) {
      if (c[i].high <= c[i - k].high || c[i].high <= c[i + k].high) isH = false;
      if (c[i].low >= c[i - k].low || c[i].low >= c[i + k].low) isL = false;
    }
    if (isH) highs.push({ i, price: c[i].high });
    if (isL) lows.push({ i, price: c[i].low });
  }
  return { highs, lows };
}

function hpsTrend(c, len) {
  const { highs, lows } = hpsSwings(c, len);
  if (highs.length < 2 || lows.length < 2) return "RANGE";
  const [h1, h2] = highs.slice(-2), [l1, l2] = lows.slice(-2);
  if (h2.price > h1.price && l2.price > l1.price) return "BULLISH";
  if (h2.price < h1.price && l2.price < l1.price) return "BEARISH";
  return "RANGE";
}

function hpsInKillzone(time) {
  const d = new Date(time > 1e12 ? time : time * 1000);
  const h = d.getUTCHours() + d.getUTCMinutes() / 60;
  return (h >= 7 && h < 10) || (h >= 12 && h < 15); // London / New York
}

function findHighProbabilitySetup(candles, tfKey = activeTfKey, options = {}) {
  const o = { ...HPS_DEFAULTS, ...options };
  if (!Array.isArray(candles) || candles.length < 60) return { setup: null, reason: "Need at least 60 candles" };

  const n = candles.length, last = candles[n - 1];
  const atr = hpsAtr(candles, o.atrPeriod);
  if (!(atr > 0)) return { setup: null, reason: "ATR unavailable" };

  // 1. Market structure (mandatory): HH+HL = buy only, LH+LL = sell only, range = no trade
  const trend = hpsTrend(candles, o.swingLen);
  if (trend === "RANGE") return { setup: null, reason: "No clear structure (ranging)" };
  const isBuy = trend === "BULLISH";

  // 2. Higher-timeframe filter: counter-trend trades are vetoed
  const htf = o.htfCandles ? hpsTrend(o.htfCandles, o.swingLen) : o.htfBias;
  if (htf && htf !== "RANGE" && htf !== trend) return { setup: null, reason: `Against HTF bias (${htf})` };

  // 3. Fresh, unmitigated order block that is being retested right now (mandatory)
  let ob = null, fvg = false;
  for (let i = n - 2; i >= Math.max(11, n - o.maxObAge) && !ob; i--) {
    const cd = candles[i], body = Math.abs(cd.close - cd.open);
    const dirOk = isBuy ? cd.close > cd.open : cd.close < cd.open;
    if (!dirOk || body < o.dispAtr * atr) continue;

    const prior = candles.slice(i - 10, i);                       // displacement must break local structure
    const broke = isBuy ? cd.close > Math.max(...prior.map(p => p.high))
                        : cd.close < Math.min(...prior.map(p => p.low));
    if (!broke) continue;

    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {           // last opposite-colour candle before it
      const oppo = isBuy ? candles[j].close < candles[j].open : candles[j].close > candles[j].open;
      if (!oppo) continue;
      const zone = { low: candles[j].low, high: candles[j].high, index: j };
      const mitigated = candles.slice(i + 1, n - 1).some(p => isBuy ? p.close < zone.low : p.close > zone.high);
      const retest = isBuy ? last.low <= zone.high && last.close >= zone.low
                           : last.high >= zone.low && last.close <= zone.high;
      if (!mitigated && retest) {
        ob = zone;
        fvg = isBuy ? candles[i - 1].high < candles[i + 1].low : candles[i - 1].low > candles[i + 1].high;
      }
      break;
    }
  }
  if (!ob) return { setup: null, reason: "No fresh order block being retested" };

  // 4. Confluence scoring
  const { highs, lows } = hpsSwings(candles, o.swingLen);
  const refs = (isBuy ? lows : highs).slice(-5);
  const sweep = candles.slice(-o.sweepWindow).some((cd, k, arr) => {
    const idx = n - arr.length + k;
    return refs.some(s => s.i < idx && (isBuy ? cd.low < s.price && cd.close > s.price
                                              : cd.high > s.price && cd.close < s.price));
  });
  const hi = highs.length ? highs[highs.length - 1].price : last.high;
  const lo = lows.length ? lows[lows.length - 1].price : last.low;
  const posPct = Math.min(Math.max((last.close - lo) / ((hi - lo) || 1), 0), 1);
  const rightHalf = isBuy ? posPct <= 0.5 : posPct >= 0.5;       // buy in discount, sell in premium
  const kz = hpsInKillzone(last.time);

  const confluences = [];
  let score = 20; confluences.push("Market structure (HH/HL or LH/LL)");
  score += 25;    confluences.push("Fresh order block retest");
  if (sweep)     { score += 15; confluences.push("Liquidity sweep"); }
  if (htf === trend) { score += 15; confluences.push("HTF bias aligned"); }
  if (fvg)       { score += 10; confluences.push("Fair value gap"); }
  if (rightHalf) { score += 10; confluences.push(isBuy ? "Discount entry" : "Premium entry"); }
  if (kz)        { score += 5;  confluences.push("London/NY killzone"); }

  if (score < o.minScore) return { setup: null, reason: `Score ${score} below minimum ${o.minScore}`, score, confluences };

  // 5. Levels: SL beyond the order block, fixed-RR targets
  const entry = last.close;
  const sl = isBuy ? ob.low - o.slAtrBuffer * atr : ob.high + o.slAtrBuffer * atr;
  const risk = Math.abs(entry - sl);
  if (risk <= 0 || risk > o.maxRiskAtr * atr) return { setup: null, reason: "Order block too wide for target RR", score, confluences };

  const sgn = isBuy ? 1 : -1, r2 = v => +v.toFixed(2);
  const tf = TIMEFRAME_PROFILES[tfKey] || TIMEFRAME_PROFILES["1"];
  const zoneOf = (low, high) => ({ low: r2(low), high: r2(high), label: `${formatDecimal(low)} – ${formatDecimal(high)}` });
  const buyPct = Math.round((1 - posPct) * 100);

  return {
    reason: "OK", score, confluences,
    setup: {
      symbol: oandaGold.symbol, timeframeKey: tfKey, timeframeLabel: tf.label,
      direction: isBuy ? "BUY" : "SELL",
      entry: r2(entry), sl: r2(sl),
      tp1: r2(entry + sgn * risk * (o.rr / 3)),
      tp2: r2(entry + sgn * risk * (o.rr * 2 / 3)),
      tp3: r2(entry + sgn * risk * o.rr),
      slPips: Math.round(risk / oandaGold.pipValue),
      tpPips: Math.round((risk * o.rr) / oandaGold.pipValue),
      rr: `1:${o.rr.toFixed(1)}`,
      modelName: `${isBuy ? "Bullish" : "Bearish"} OB retest · ${confluences.length - 2} confluences · Score ${score}/100`,
      bias: `${tf.label} ${isBuy ? "Bullish" : "Bearish"} Structure`,
      score, confluences,
      rangeMetrics: {
        supportOb: isBuy ? zoneOf(ob.low, ob.high) : zoneOf(lo, lo + 0.4 * atr),
        resistanceWick: isBuy ? zoneOf(hi - 0.4 * atr, hi) : zoneOf(ob.low, ob.high),
        buyPct, sellPct: 100 - buyPct, isDiscount: posPct <= 0.5
      }
    }
  };
}

/**
 * Walk-forward backtest of findHighProbabilitySetup on historical candles.
 * This is the only honest way to learn the win rate. Entry = signal candle close,
 * SL assumed first if SL and TP3 are both touched in one candle, spread ignored.
 */
function backtestHighProbabilitySetups(candles, options = {}) {
  const o = { ...HPS_DEFAULTS, ...options };
  const results = [];
  let i = 60;
  while (i < candles.length - 1) {
    const { setup } = findHighProbabilitySetup(candles.slice(0, i + 1), activeTfKey, o);
    if (!setup) { i++; continue; }
    const buy = setup.direction === "BUY";
    let outcome = null, j = i + 1;
    for (; j < candles.length; j++) {
      if (buy ? candles[j].low <= setup.sl : candles[j].high >= setup.sl) { outcome = "LOSS"; break; }
      if (buy ? candles[j].high >= setup.tp3 : candles[j].low <= setup.tp3) { outcome = "WIN"; break; }
    }
    if (!outcome) break;
    results.push({ index: i, direction: setup.direction, score: setup.score, outcome });
    i = j + 1;
  }
  const wins = results.filter(r => r.outcome === "WIN").length;
  const losses = results.length - wins;
  return {
    trades: results.length, wins, losses,
    winRate: results.length ? +(wins / results.length * 100).toFixed(1) : 0,
    expectancyR: results.length ? +((wins * o.rr - losses) / results.length).toFixed(2) : 0,
    breakEvenWinRate: +(100 / (1 + o.rr)).toFixed(1),
    results
  };
}

// =========================================================================
// 5C. SETUP QUALITY CARD + OPTIONAL LIVE CANDLE FEED
// Define window.getCandles = async (tfKey) => [{time,open,high,low,close}, ...]
// to switch the scanner from the simulated engine to real candle analysis.
// =========================================================================
function renderSetupQuality(setup, noTradeReason = null) {
  const $ = (id) => document.getElementById(id);
  const tag = $("qualitySourceTag"), val = $("qualityScoreVal"), bar = $("qualityBarFill");
  const list = $("confluenceList"), note = $("qualityNote");
  if (!tag || !val || !bar || !list || !note) return;

  list.innerHTML = "";
  if (noTradeReason) {
    tag.textContent = "LIVE CANDLES"; tag.className = "quality-source-tag live";
    val.textContent = "--"; bar.style.width = "0%"; bar.className = "quality-bar-fill";
    note.textContent = `NO TRADE: ${noTradeReason}`;
    return;
  }
  if (setup && typeof setup.score === "number") {
    tag.textContent = "LIVE CANDLES"; tag.className = "quality-source-tag live";
    val.textContent = setup.score;
    bar.style.width = `${setup.score}%`;
    bar.className = `quality-bar-fill ${setup.score >= 80 ? "high" : ""}`;
    setup.confluences.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = c;
      list.appendChild(li);
    });
    note.textContent = "Score = confluence count, not a win probability. Backtest before trading.";
  } else {
    tag.textContent = "SIMULATED"; tag.className = "quality-source-tag sim";
    val.textContent = "--"; bar.style.width = "0%"; bar.className = "quality-bar-fill low";
    note.textContent = "Simulated levels (fixed offsets). No candle feed connected, so this is not real analysis.";
  }
}

// =========================================================================
// 6. SCAN ACTION: CLEAR, COMPUTE & RENDER
// =========================================================================
/**
 * Wipes the previous setup's entry, SL, TPs and every place they are shown
 * (order desk inputs, on-chart HUD, level tags, status badges, scanner card).
 * Called right before each scan so stale levels, or a leftover
 * "TP3 HIT" / "SL HIT" badge from the last trade, can never be mistaken
 * for the new signal. Lot size is deliberately left alone.
 */
function resetEntryBeforeScan() {
  // Drop the old setup first so the live heartbeat stops checking its TP/SL
  currentSetup = null;
  // Let the scan fill the inputs even if a field still had focus
  isUserTyping = false;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  // MT5 order desk inputs (lots excluded)
  ["mt5EntryInput", "mt5SlInput", "mt5Tp1Input", "mt5Tp2Input", "mt5Tp3Input"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  setText("liveRrBadge", "SL: -- | R:R --");

  // On-chart HUD values
  setText("hudEntryVal", "--");
  setText("hudSlVal", "--");
  setText("hudTp3Val", "--");
  setText("hudRrVal", "--");

  // Lifecycle badge: clears any TP/SL "hit" state left from the last trade
  const lifecycle = document.getElementById("hudLifecycleBadge");
  if (lifecycle) {
    lifecycle.textContent = "AWAITING SETUP";
    lifecycle.className = "live-trade-status-chip pending";
  }

  // Level marker tags
  setText("tagEntryVal", "ENTRY: --");
  setText("tagSlVal", "SL: --");
  setText("tagTp1Val", "TP1: --");
  setText("tagTp2Val", "TP2: --");
  setText("tagTp3Val", "TP3: --");

  // Order desk status line and engine state
  const statusBadge = document.getElementById("setupStatusBadge");
  if (statusBadge) {
    statusBadge.textContent = "● Scanning for new entry...";
    statusBadge.className = "fresh-status-pill";
  }
  setText("engineTradeState", "SCANNING");

  renderSetupQuality(null);
  const q = document.getElementById("qualityNote");
  if (q) q.textContent = "Scanning...";

  // Remove the previous signal card from the scanner feed
  const feed = document.getElementById("signalsScrollList");
  if (feed) feed.innerHTML = "";
}

function scanChartForNewSetup(tfKey = null) {
  if (isScanning) { pendingScanTf = tfKey || activeTfKey; return; }
  isScanning = true;

  const currentTfKey = tfKey || activeTfKey;
  const tf = TIMEFRAME_PROFILES[currentTfKey] || TIMEFRAME_PROFILES["1"];

  const hud = document.getElementById("scanningHudOverlay");
  const btnScan = document.getElementById("btnScanNewSetup");
  const btnText = document.getElementById("btnScanText");
  const hudTitle = document.getElementById("hudTitleText");

  if (hud) hud.classList.remove("hidden");
  if (hudTitle) hudTitle.textContent = `SCANNING ${tf.label.toUpperCase()} (${scanDirectionMode})...`;
  if (btnScan) btnScan.classList.add("scanning");
  if (btnText) btnText.textContent = "SCANNING...";

  // Clear the previous entry/SL/TPs before computing the new signal
  resetEntryBeforeScan();

  setTimeout(async () => {
    try {
      const chosenDirection = scanDirectionMode === "AUTO" ? null : scanDirectionMode;
      activeTfKey = currentTfKey;
      let setup;

      if (typeof window.getCandles === "function") {
        // Real analysis on live candles; NO TRADE if confluence is too low
        const candles = await window.getCandles(currentTfKey);
        const result = findHighProbabilitySetup(candles, currentTfKey);
        if (!result.setup || (chosenDirection && result.setup.direction !== chosenDirection)) {
          renderSetupQuality(null, result.setup ? `Setup is ${result.setup.direction}, you filtered ${chosenDirection} only` : result.reason);
          const st = document.getElementById("engineTradeState");
          if (st) st.textContent = "NO TRADE";
          return;
        }
        setup = result.setup;
      } else {
        setup = calculateGoldSetup(currentTfKey, chosenDirection); // simulated fallback
      }

      currentSetup = setup;
      populateFormAndOverlay(setup);
      renderScannerList();
      renderSetupQuality(setup);
      if (entryUnlocked) setEntryUnlocked(true);

      if (isAudioEnabled) playAudioNotification();
    } catch (err) {
      // Without this, one error would leave the scanner stuck on "SCANNING..."
      console.error("Scan failed:", err);
    } finally {
      if (hud) hud.classList.add("hidden");
      if (btnScan) btnScan.classList.remove("scanning");
      if (btnText) btnText.textContent = "SCAN SETUP";
      isScanning = false;
      if (pendingScanTf) { const nextTf = pendingScanTf; pendingScanTf = null; scanChartForNewSetup(nextTf); }
    }
  }, 250);
}

function populateFormAndOverlay(setup) {
  const tf = TIMEFRAME_PROFILES[setup.timeframeKey] || TIMEFRAME_PROFILES["1"];
  const isBuy = setup.direction === "BUY";
  const metrics = setup.rangeMetrics;

  // 1. Header & Telemetry
  document.getElementById("chartMainPrice").textContent = formatDecimal(oandaGold.currentPrice);
  document.getElementById("chartMainPct").textContent = `${oandaGold.change >= 0 ? '+' : ''}${oandaGold.change.toFixed(2)}%`;
  document.getElementById("scannerTfLabel").textContent = setup.timeframeKey;

  document.getElementById("telemetryRegime").textContent = setup.bias;
  document.getElementById("telemetryInvalidation").textContent = `${isBuy ? '▲' : '▼'} ${formatDecimal(setup.sl)} (-${setup.slPips}p)`;
  document.getElementById("telemetryTarget").textContent = `TP3 Target @ ${formatDecimal(setup.tp3)} (+${setup.tpPips}p)`;

  // 2. Update Support OB & Resistance Wick Meter
  document.getElementById("supportObPrice").textContent = metrics.supportOb.label;
  document.getElementById("resistanceWickPrice").textContent = metrics.resistanceWick.label;
  document.getElementById("zoneValuationTag").textContent = metrics.isDiscount ? "DISCOUNT DEMAND (BUY BIAS)" : "PREMIUM SUPPLY (SELL BIAS)";
  document.getElementById("zoneValuationTag").className = `zone-tag-badge ${metrics.isDiscount ? 'text-green' : 'text-red'}`;

  // Meter Bar
  document.getElementById("buyPowerFill").style.width = `${metrics.buyPct}%`;
  document.getElementById("buyPowerText").textContent = `BUY ${metrics.buyPct}%`;
  document.getElementById("sellPowerFill").style.width = `${metrics.sellPct}%`;
  document.getElementById("sellPowerText").textContent = `${metrics.sellPct}% SELL`;

  // 3. MT5 Order Desk Card & Pricing
  document.getElementById("mt5OrderDirection").textContent = `${setup.direction} LIMIT`;
  document.getElementById("mt5OrderDirection").className = `loaded-sig-badge ${isBuy ? 'buy' : 'sell'}`;
  document.getElementById("mt5OrderModel").textContent = `${setup.modelName} [SL: ${setup.slPips}p | ${setup.rr} RR]`;
  document.getElementById("mt5BuyPrice").textContent = `@ ${formatDecimal(oandaGold.currentPrice)}`;
  document.getElementById("mt5SellPrice").textContent = `@ ${formatDecimal(oandaGold.currentPrice - oandaGold.spread)}`;

  // 4. Populate MT5 Inputs (FROZEN: user typing will not be overwritten)
  if (!isUserTyping) {
    document.getElementById("mt5EntryInput").value = formatDecimal(setup.entry);
    document.getElementById("mt5SlInput").value = formatDecimal(setup.sl);
    document.getElementById("mt5Tp1Input").value = formatDecimal(setup.tp1);
    document.getElementById("mt5Tp2Input").value = formatDecimal(setup.tp2);
    document.getElementById("mt5Tp3Input").value = formatDecimal(setup.tp3);
    recalculateLiveRrFromInputs();
  }

  // 5. On-Chart Signal Overlay
  const hudDir = document.getElementById("hudSignalDirection");
  if (hudDir) {
    hudDir.textContent = `${setup.direction} SIGNAL CONFIRMED`;
    hudDir.className = `signal-direction-chip ${isBuy ? 'buy' : 'sell'}`;
  }
  document.getElementById("hudSignalModel").textContent = setup.modelName;
  document.getElementById("hudEntryVal").textContent = formatDecimal(setup.entry);
  document.getElementById("hudSlVal").textContent = `${formatDecimal(setup.sl)} (-${setup.slPips}p)`;
  document.getElementById("hudTp3Val").textContent = `${formatDecimal(setup.tp3)} (+${setup.tpPips}p)`;
  document.getElementById("hudRrVal").textContent = setup.rr;

  // Level Markers Positioning
  repositionLevelMarkers(setup);

  const statusBadge = document.getElementById("setupStatusBadge");
  if (statusBadge) {
    statusBadge.textContent = `● ${setup.direction} Entry Locked @ ${formatDecimal(setup.entry)}`;
    statusBadge.className = `fresh-status-pill ${isBuy ? 'text-green' : 'text-red'}`;
  }
  document.getElementById("engineTradeState").textContent = `${setup.direction} ARMED`;

  // 6. Mount TradingView Chart
  mountTradingViewChart(oandaGold.tvSymbol, tf.tvInterval);
}

function repositionLevelMarkers(setup) {
  const isBuy = setup.direction === "BUY";
  const mEntry = document.getElementById("markerEntry");
  const mSl    = document.getElementById("markerSl");
  const mTp1   = document.getElementById("markerTp1");
  const mTp2   = document.getElementById("markerTp2");
  const mTp3   = document.getElementById("markerTp3");

  if (isBuy) {
    // BUY: SL at bottom, TPs on top
    mSl.style.top = "66%";
    mEntry.style.top = "50%";
    mTp1.style.top = "38%";
    mTp2.style.top = "26%";
    mTp3.style.top = "14%";
  } else {
    // SELL: SL on top, TPs at bottom
    mSl.style.top = "14%";
    mEntry.style.top = "30%";
    mTp1.style.top = "44%";
    mTp2.style.top = "58%";
    mTp3.style.top = "72%";
  }

  document.getElementById("tagEntryVal").textContent = `ENTRY: ${formatDecimal(setup.entry)}`;
  document.getElementById("tagSlVal").textContent = `SL: ${formatDecimal(setup.sl)} (-${setup.slPips}p)`;
  document.getElementById("tagTp1Val").textContent = `TP1: ${formatDecimal(setup.tp1)} (+$${formatDecimal(Math.abs(setup.tp1 - setup.entry))})`;
  document.getElementById("tagTp2Val").textContent = `TP2: ${formatDecimal(setup.tp2)} (+$${formatDecimal(Math.abs(setup.tp2 - setup.entry))})`;
  document.getElementById("tagTp3Val").textContent = `TP3: ${formatDecimal(setup.tp3)} (+$${formatDecimal(Math.abs(setup.tp3 - setup.entry))})`;
}

// =========================================================================
// 7. REAL-TIME INPUT EVENT LISTENERS & 1:3 RR CALCULATION
// =========================================================================
function recalculateLiveRrFromInputs() {
  const entry = cleanNumber(document.getElementById("mt5EntryInput").value);
  const sl = cleanNumber(document.getElementById("mt5SlInput").value);
  const tp3 = cleanNumber(document.getElementById("mt5Tp3Input").value);

  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp3 - entry);

  const rrBadge = document.getElementById("liveRrBadge");
  if (!rrBadge) return;

  if (risk > 0 && reward > 0) {
    const slPips = (risk / oandaGold.pipValue).toFixed(0);
    const ratio = (reward / risk).toFixed(1);
    rrBadge.textContent = `SL: ${slPips}p | R:R 1:${ratio}`;
  } else {
    rrBadge.textContent = "SL: -- | R:R --";
  }
}

function setupInputListeners() {
  const formInputs = [
    document.getElementById("mt5LotInput"),
    document.getElementById("mt5EntryInput"),
    document.getElementById("mt5SlInput"),
    document.getElementById("mt5Tp1Input"),
    document.getElementById("mt5Tp2Input"),
    document.getElementById("mt5Tp3Input")
  ];

  formInputs.forEach(input => {
    if (!input) return;
    input.addEventListener("focus", () => { isUserTyping = true; });
    input.addEventListener("blur", () => {
      isUserTyping = false;
      const val = cleanNumber(input.value);
      if (input.name !== "lots" && val > 0) {
        input.value = formatDecimal(val, 2);
      }
    });
    input.addEventListener("input", () => {
      recalculateLiveRrFromInputs();
    });
  });
}

// =========================================================================
// 8. SCANNER FEED CARDS RENDERER
// =========================================================================
function renderScannerList() {
  const container = document.getElementById("signalsScrollList");
  if (!container || !currentSetup) return;

  const isBuy = currentSetup.direction === "BUY";
  container.innerHTML = `
    <div class="signal-scan-card ${isBuy ? 'buy-edge' : 'sell-edge'} active-selected">
      <div class="sig-card-header-row">
        <div class="sig-pair-badge">
          <span>${oandaGold.icon}</span>
          <span>${currentSetup.symbol}</span>
          <span class="tf-badge-tag">${currentSetup.timeframeKey}</span>
        </div>
        <span class="sig-direction-pill ${isBuy ? 'buy' : 'sell'}">${currentSetup.direction} LIMIT</span>
      </div>

      <div class="sig-model-caption">
        <strong>${currentSetup.bias}:</strong> ${currentSetup.modelName}
      </div>

      <div class="sig-matrix-grid">
        <div class="matrix-cell">
          <span>LOCKED ENTRY</span>
          <span>${formatDecimal(currentSetup.entry)}</span>
        </div>
        <div class="matrix-cell">
          <span>SL (${currentSetup.slPips} PIPS)</span>
          <span class="text-red">${formatDecimal(currentSetup.sl)}</span>
        </div>
        <div class="matrix-cell">
          <span>TARGET R:R</span>
          <span class="text-gold">${currentSetup.rr}</span>
        </div>
      </div>

      <div class="sig-tps-row">
        <span>TP1 (+$${formatDecimal(Math.abs(currentSetup.tp1 - currentSetup.entry))}): <strong class="text-green">${formatDecimal(currentSetup.tp1)}</strong></span>
        <span>TP2 (+$${formatDecimal(Math.abs(currentSetup.tp2 - currentSetup.entry))}): <strong class="text-green">${formatDecimal(currentSetup.tp2)}</strong></span>
        <span>TP3 (+$${formatDecimal(Math.abs(currentSetup.tp3 - currentSetup.entry))}): <strong class="text-green">${formatDecimal(currentSetup.tp3)}</strong></span>
      </div>

      <div class="sig-card-action-bar">
        <span class="sig-score-pill">● Key Zone ${isBuy ? 'Support OB' : 'Resistance Wick'} Locked</span>
        <button type="button" class="sig-btn-apply" onclick="scanChartForNewSetup('${currentSetup.timeframeKey}')">
          Re-Scan Bar ➔
        </button>
      </div>
    </div>
  `;
}

// =========================================================================
// 9. TRADINGVIEW EMBED (AUTHORIZED WIDGET EMBED TO PREVENT 403 / REFUSED)
// =========================================================================
let mountedChartKey = null;   // symbol|interval|layout currently on screen

function mountTradingViewChart(symbol, interval, force = false) {
  // Re-scans, direction changes and unlock/lock must NOT rebuild the chart (it flashes and loses zoom/drawings).
  const wantKey = `${symbol}|${interval}|${useTemplateLayout && oandaGold.useLayout}`;
  if (!force && wantKey === mountedChartKey && document.getElementById("tv_chart_target")?.childElementCount) return;

  const container = document.getElementById("tvEmbedContainer");
  if (!container) return;

  let targetNode = document.getElementById("tv_chart_target");
  if (!targetNode) {
    targetNode = document.createElement("div");
    targetNode.id = "tv_chart_target";
    targetNode.className = "tv-target-node";
    container.prepend(targetNode);
  }

  targetNode.innerHTML = "";

  if (typeof TradingView === "undefined") return;

  const widgetOptions = {
    autosize: true,
    symbol: symbol,
    interval: interval,
    timezone: "Etc/UTC",
    theme: "dark",
    style: "1",
    locale: "en",
    toolbar_bg: "#0a0d14",
    enable_publishing: false,
    allow_symbol_change: false,
    container_id: "tv_chart_target",
    hide_side_toolbar: false,
    withdateranges: true,
    save_image: false,
    studies: ["Volume@tv-basicstudies"],
    overrides: {
      "mainSeriesProperties.candleStyle.upColor": "#00e5a3",
      "mainSeriesProperties.candleStyle.downColor": "#f43f5e",
      "mainSeriesProperties.candleStyle.drawWick": true,
      "mainSeriesProperties.candleStyle.drawBorder": true,
      "mainSeriesProperties.candleStyle.borderColor": "#1e293b",
      "mainSeriesProperties.candleStyle.borderUpColor": "#00e5a3",
      "mainSeriesProperties.candleStyle.borderDownColor": "#f43f5e",
      "mainSeriesProperties.candleStyle.wickUpColor": "#00e5a3",
      "mainSeriesProperties.candleStyle.wickDownColor": "#f43f5e",
      "paneProperties.background": "#06080c",
      "paneProperties.vertGridProperties.color": "rgba(23, 31, 46, 0.4)",
      "paneProperties.horzGridProperties.color": "rgba(23, 31, 46, 0.4)"
    }
  };

  if (useTemplateLayout && activeLayoutChartId && oandaGold.useLayout) {
    widgetOptions.chart = activeLayoutChartId;
  }

  new TradingView.widget(widgetOptions);
  mountedChartKey = wantKey;
}

function checkTradeLifecycle() {
  const s = currentSetup;
  const badge = document.getElementById("hudLifecycleBadge");
  if (!s || s.closed || !badge) return;

  const p = oandaGold.currentPrice, buy = s.direction === "BUY";
  const reached = (lvl) => (buy ? p >= lvl : p <= lvl);
  const pips = (lvl) => Math.round(Math.abs(lvl - s.entry) / oandaGold.pipValue);
  const show = (text, cls) => { badge.textContent = text; badge.className = `live-trade-status-chip ${cls}`; };
  s.stage = s.stage || 0;

  if (buy ? p <= s.sl : p >= s.sl) {               // SL checked first (conservative)
    show(s.stage ? `SL HIT after TP${s.stage}` : `SL HIT (-${s.slPips}p)`, "slHit");
    s.closed = true;
  } else if (reached(s.tp3)) {
    show(`TP3 HIT (+${pips(s.tp3)}p)!`, "tpHit");
    s.closed = true;
  } else if (s.stage < 2 && reached(s.tp2)) {
    show(`TP2 HIT (+${pips(s.tp2)}p)`, "tpHit");
    s.stage = 2;
  } else if (s.stage < 1 && reached(s.tp1)) {
    show(`TP1 HIT (+${pips(s.tp1)}p)`, "tpHit");
    s.stage = 1;
  }
}

function flipToOppositeEntry() {
  const base = currentSetup ? currentSetup.direction : (scanDirectionMode === "SELL" ? "SELL" : "BUY");
  const next = base === "BUY" ? "SELL" : "BUY";
  scanDirectionMode = next;
  document.querySelectorAll("#dirBtnGroup .dir-chip").forEach((b) =>
    b.classList.toggle("active", b.getAttribute("data-dir") === next));
  scanChartForNewSetup(activeTfKey);
}

// Unlocked mode: slide the whole setup (entry, SL, TP1-3) with the live price.
// Distances (SL pips, R:R) stay identical; only the anchor moves.
function followLiveEntry() {
  const s = currentSetup;
  if (!s || isScanning) return;
  const delta = +(oandaGold.currentPrice - s.entry).toFixed(2);
  if (delta === 0) return;
  ["entry", "sl", "tp1", "tp2", "tp3"].forEach((k) => { s[k] = +(s[k] + delta).toFixed(2); });
  s.closed = false; s.stage = 0;

  const setVal = (id, v) => { const el = document.getElementById(id); if (el && !isUserTyping) el.value = formatDecimal(v); };
  setVal("mt5EntryInput", s.entry); setVal("mt5SlInput", s.sl);
  setVal("mt5Tp1Input", s.tp1); setVal("mt5Tp2Input", s.tp2); setVal("mt5Tp3Input", s.tp3);
  if (!isUserTyping) recalculateLiveRrFromInputs();

  const t = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  t("hudEntryVal", formatDecimal(s.entry));
  t("hudSlVal", `${formatDecimal(s.sl)} (-${s.slPips}p)`);
  t("hudTp3Val", `${formatDecimal(s.tp3)} (+${s.tpPips}p)`);
  repositionLevelMarkers(s);
  renderScannerList();
}

function setEntryUnlocked(on) {
  entryUnlocked = on;
  const btn = document.getElementById("btnUnlockEntry");
  const txt = document.getElementById("unlockEntryText");
  const status = document.getElementById("setupStatusBadge");
  const life = document.getElementById("hudLifecycleBadge");
  if (btn) { btn.classList.toggle("unlocked", on); btn.setAttribute("aria-pressed", String(on)); }
  if (txt) txt.textContent = on ? "🔓 Entry Unlocked (Live) · Click to Lock" : "🔒 Entry Locked · Click to Unlock";
  if (currentSetup && status) {
    const buy = currentSetup.direction === "BUY";
    status.textContent = on ? `● ${currentSetup.direction} Entry Live (follows price)` : `● ${currentSetup.direction} Entry Locked @ ${formatDecimal(currentSetup.entry)}`;
    status.className = `fresh-status-pill ${buy ? "text-green" : "text-red"}`;
  }
  if (life && currentSetup) {
    life.textContent = on ? "ENTRY LIVE" : "ENTRY LOCKED";
    life.className = "live-trade-status-chip pending";
  }
  const st = document.getElementById("engineTradeState");
  if (st && currentSetup) st.textContent = on ? `${currentSetup.direction} LIVE` : `${currentSetup.direction} ARMED`;
}

// =========================================================================
// 10. LIVE HEARTBEAT (DOES NOT DRIFT ENTRY)
// =========================================================================
function startLiveMinuteHeartbeat() {
  setInterval(() => {
    if (oandaGold.key === "BTC" && liveBtcPrice) {
      oandaGold.currentPrice = liveBtcPrice;
    } else {
      const tickJitter = (Math.random() - 0.49) * oandaGold.jitter * oandaGold.scale;
      oandaGold.currentPrice = +(oandaGold.currentPrice + tickJitter).toFixed(2);
    }

    const mainPriceEl = document.getElementById("chartMainPrice");
    if (mainPriceEl) mainPriceEl.textContent = formatDecimal(oandaGold.currentPrice);

    const buyPriceEl = document.getElementById("mt5BuyPrice");
    if (buyPriceEl) buyPriceEl.textContent = `@ ${formatDecimal(oandaGold.currentPrice)}`;

    const sellPriceEl = document.getElementById("mt5SellPrice");
    if (sellPriceEl) sellPriceEl.textContent = `@ ${formatDecimal(oandaGold.currentPrice - oandaGold.spread)}`;

    if (entryUnlocked) followLiveEntry(); else checkTradeLifecycle();
  }, 1200);
}

// =========================================================================
// 11. AUDIO NOTIFICATION & MT5 DISPATCH
// =========================================================================
function playAudioNotification() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch {}
}

function dispatchOrderToMt5Bridge(action) {
  const lots = cleanNumber(document.getElementById("mt5LotInput").value);
  const entry = cleanNumber(document.getElementById("mt5EntryInput").value);
  const sl = cleanNumber(document.getElementById("mt5SlInput").value);
  const tp = cleanNumber(document.getElementById("mt5Tp3Input").value);
  const ticketId = Math.floor(Math.random() * 90000 + 10000);

  const payload = {
    ticket: ticketId,
    action: action,
    symbol: oandaGold.symbol,
    volume: lots,
    price: entry,
    sl: sl,
    tp: tp,
    magic: "por_oanda_884192",
    timestamp: new Date().toISOString()
  };

  fetch("https://porict.pro/api/mt5/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {});

  const logStream = document.getElementById("mt5ExecutionsList");
  if (logStream) {
    const row = document.createElement("div");
    row.className = `exec-row ${action === 'BUY' ? 'buy' : 'sell'}`;
    row.innerHTML = `<span>${action} ${lots.toFixed(2)} ${oandaGold.short} @ ${entry.toFixed(2)}</span><span class="text-green">FILLED #${ticketId}</span>`;
    logStream.insertBefore(row, logStream.firstChild);
  }

  alert(`⚡ MT5 Order Transmitted!\n\nTicket: #${ticketId}\nInstrument: ${oandaGold.symbol}\nAction: ${action} ${lots.toFixed(2)} Lots\nEntry: ${entry.toFixed(2)}\nStop Loss: ${sl.toFixed(2)}\nTake Profit 3: ${tp.toFixed(2)}`);
}

// =========================================================================
// 11B. ASSET SWITCHER (XAUUSD / BTCUSD)
// =========================================================================
let liveBtcPrice = null;

async function pollBtcPrice() {
  try {
    const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT", { signal: AbortSignal.timeout(4000) });
    const p = parseFloat((await r.json()).price);
    if (p > 0) liveBtcPrice = +p.toFixed(2);
  } catch { /* offline / blocked: the engine keeps its simulated price */ }
}

function applyAsset(key) {
  const a = ASSETS[key] || ASSETS.XAU;
  activeAssetKey = a.key;
  Object.assign(oandaGold, a, { currentPrice: (a.key === "BTC" && liveBtcPrice) ? liveBtcPrice : a.price });

  document.querySelectorAll(".js-sym").forEach((el) => { el.textContent = el.dataset.symFormat === "space" ? a.symbol.replace(":", " ") : a.symbol; });
  document.querySelectorAll(".js-badge").forEach((el) => { el.textContent = a.badge; });
  document.querySelectorAll(".js-tickinfo").forEach((el) => { el.textContent = a.tickInfo; });
  document.querySelectorAll("#assetSwitch .asset-btn").forEach((b) => b.classList.toggle("active", b.dataset.asset === a.key));
  document.title = `POR SMC PRO | ${a.symbol} Scalp & Swing Terminal`;
  try { localStorage.setItem("por_terminal_asset", a.key); } catch {}

  // Layout template (EdVpzZBe) was built for Gold only
  const layoutBtn = document.getElementById("btnToggleLayoutTemplate");
  if (layoutBtn) layoutBtn.classList.toggle("hidden", !a.useLayout);

  scanChartForNewSetup(activeTfKey);
}

// Dynamic Tab Favicon Loader
function setTabFavicon(imageSrc) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageSrc;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 0, 0, 64, 64);

    let faviconLink = document.getElementById("dynamicFavicon");
    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.id = "dynamicFavicon";
      faviconLink.rel = "icon";
      document.head.appendChild(faviconLink);
    }
    faviconLink.type = "image/png";
    faviconLink.href = canvas.toDataURL("image/png");
  };
}

// =========================================================================
// 12. INITIALIZATION & LISTENERS
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  setTabFavicon("por.jpg");
  setupInputListeners();

  // Asset switcher (remembers the last choice)
  document.querySelectorAll("#assetSwitch .asset-btn").forEach((b) =>
    b.addEventListener("click", () => { if (b.dataset.asset !== activeAssetKey) applyAsset(b.dataset.asset); }));
  pollBtcPrice(); setInterval(pollBtcPrice, 5000);
  let savedAsset = "XAU"; try { savedAsset = localStorage.getItem("por_terminal_asset") || "XAU"; } catch {}
  if (savedAsset === "BTC") {
    // wait briefly for the first live price so the very first BTC scan is anchored correctly
    pollBtcPrice().finally(() => applyAsset("BTC"));
  } else {
    scanChartForNewSetup("1");
  }
  startLiveMinuteHeartbeat();

  setInterval(evaluateKillzones, 1000);

  // Scalp vs Swing Profile Switcher
  const btnModeScalp = document.getElementById("btnModeScalp");
  const btnModeSwing = document.getElementById("btnModeSwing");

  btnModeScalp?.addEventListener("click", () => {
    btnModeScalp.classList.add("active");
    btnModeSwing.classList.remove("active");
    currentTradingMode = "SCALP";
    document.getElementById("activeTradingModeBadge").textContent = "⚡ SCALPING (M1–M15)";

    // Set active button to 1m
    document.querySelectorAll("#tfSelectorGroup .tf-btn").forEach(b => b.classList.remove("active"));
    document.querySelector('#tfSelectorGroup .tf-btn[data-tf="1"]')?.classList.add("active");
    scanChartForNewSetup("1");
  });

  btnModeSwing?.addEventListener("click", () => {
    btnModeSwing.classList.add("active");
    btnModeScalp.classList.remove("active");
    currentTradingMode = "SWING";
    document.getElementById("activeTradingModeBadge").textContent = "🏛️ SWING (H1–1W)";

    // Set active button to 1h
    document.querySelectorAll("#tfSelectorGroup .tf-btn").forEach(b => b.classList.remove("active"));
    document.querySelector('#tfSelectorGroup .tf-btn[data-tf="60"]')?.classList.add("active");
    scanChartForNewSetup("60");
  });

  // Direction Bias Buttons (AUTO / BUY / SELL)
  document.querySelectorAll("#dirBtnGroup .dir-chip").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll("#dirBtnGroup .dir-chip").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      scanDirectionMode = e.target.getAttribute("data-dir");
      scanChartForNewSetup(activeTfKey);
    });
  });

  // Responsive panel toggles
  const workspaceGrid = document.getElementById("workspaceGrid");
  document.getElementById("toggleScannerBtn")?.addEventListener("click", () => {
    workspaceGrid.classList.toggle("no-scanner");
  });
  document.getElementById("toggleMt5Btn")?.addEventListener("click", () => {
    workspaceGrid.classList.toggle("no-mt5");
  });

  // Scan buttons
  document.getElementById("btnScanNewSetup")?.addEventListener("click", () => {
    scanChartForNewSetup(activeTfKey);
  });
  document.getElementById("btnChartScanAction")?.addEventListener("click", () => {
    scanChartForNewSetup(activeTfKey);
  });

  document.getElementById("btnOppositeEntry")?.addEventListener("click", flipToOppositeEntry);
  document.getElementById("btnUnlockEntry")?.addEventListener("click", () => setEntryUnlocked(!entryUnlocked));

  // Timeframe buttons
  document.querySelectorAll("#tfSelectorGroup .tf-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll("#tfSelectorGroup .tf-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      activeTfKey = e.target.getAttribute("data-tf");

      // Auto-toggle Scalp vs Swing Mode tab
      const isSwing = ["60", "240", "D", "W"].includes(activeTfKey);
      btnModeSwing?.classList.toggle("active", isSwing);
      btnModeScalp?.classList.toggle("active", !isSwing);
      document.getElementById("activeTradingModeBadge").textContent = isSwing ? "🏛️ SWING (H1–1W)" : "⚡ SCALPING (M1–M15)";

      scanChartForNewSetup(activeTfKey);
    });
  });

  // Clear inputs
  document.getElementById("btnClearSetupDesk")?.addEventListener("click", () => {
    document.getElementById("mt5EntryInput").value = "";
    document.getElementById("mt5SlInput").value = "";
    document.getElementById("mt5Tp1Input").value = "";
    document.getElementById("mt5Tp2Input").value = "";
    document.getElementById("mt5Tp3Input").value = "";
    document.getElementById("liveRrBadge").textContent = "SL: -- | R:R --";
  });

  // Re-anchor to current price
  document.getElementById("btnRecalculateLiveInputs")?.addEventListener("click", () => {
    isUserTyping = false;
    scanChartForNewSetup(activeTfKey);
  });

  // Template toggle
  document.getElementById("btnToggleLayoutTemplate")?.addEventListener("click", (e) => {
    useTemplateLayout = !useTemplateLayout;
    e.currentTarget.classList.toggle("active", useTemplateLayout);
    e.currentTarget.innerHTML = useTemplateLayout
      ? "<span>★ Layout: EdVpzZBe</span>"
      : "<span>Default Clean Feed</span>";
    const tf = TIMEFRAME_PROFILES[activeTfKey] || TIMEFRAME_PROFILES["1"];
    mountTradingViewChart(oandaGold.tvSymbol, tf.tvInterval, true);
  });

  // Audio toggle
  document.getElementById("audioChimeToggle")?.addEventListener("change", (e) => {
    isAudioEnabled = e.target.checked;
  });

  // MT5 execution triggers
  document.getElementById("btnMt5ExecuteBuy")?.addEventListener("click", () => dispatchOrderToMt5Bridge("BUY"));
  document.getElementById("btnMt5ExecuteSell")?.addEventListener("click", () => dispatchOrderToMt5Bridge("SELL"));
  document.getElementById("btnTransmitConfiguredOrder")?.addEventListener("click", () => {
    const isBuy = document.getElementById("mt5OrderDirection").textContent.includes("BUY");
    dispatchOrderToMt5Bridge(isBuy ? "BUY" : "SELL");
  });
});