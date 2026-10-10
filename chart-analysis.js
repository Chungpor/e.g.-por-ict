"use strict";
/**
 * Por ICT - Chart Analysis
 * Modes: Manual Entry (your levels), Upload Chart (AI via /api/analyze-chart), Live Chart (Binance candles).
 * Output is a rules-based / AI-assisted idea, never a guarantee.
 */

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- instruments ----------
// bn = Binance symbol used for live candles. XAUUSD uses PAXG (tokenised gold), which tracks spot closely but not exactly.
const PAIRS = {
  XAUUSD: { tv: "OANDA:XAUUSD",  bn: "PAXGUSDT", mult: 100,    dec: 2 },
  BTCUSD: { tv: "COINBASE:BTCUSD", bn: "BTCUSDT", mult: 1,     dec: 2 },
  ETHUSD: { tv: "COINBASE:ETHUSD", bn: "ETHUSDT", mult: 1,     dec: 2 },
  EURUSD: { tv: "OANDA:EURUSD",  bn: null,       mult: 100000, dec: 5 },
  GBPUSD: { tv: "OANDA:GBPUSD",  bn: null,       mult: 100000, dec: 5 },
  USDJPY: { tv: "OANDA:USDJPY",  bn: null,       mult: "jpy",  dec: 3 }
};
const TFS = {
  "1m": { tv: "1", bn: "1m", label: "1m" }, "5m": { tv: "5", bn: "5m", label: "5m" }, "15m": { tv: "15", bn: "15m", label: "15m" },
  "30m": { tv: "30", bn: "30m", label: "30m" }, "1h": { tv: "60", bn: "1h", label: "1h" }, "4h": { tv: "240", bn: "4h", label: "4h" },
  "1d": { tv: "D", bn: "1d", label: "1D" }
};

const STRATEGIES = {
  "Price Action": ["Support & Resistance", "Supply & Demand", "Trendline Trading", "Channel Trading", "Breakout Trading", "Retest Trading", "Pullback Trading", "Range Trading", "Candlestick Trading", "Market Structure Trading", "Swing High / Swing Low Trading", "Multi-Timeframe Analysis"],
  "SMC & ICT": ["ICT", "Smart Money Concepts (SMC)", "Liquidity Sweep Trading", "Order Block Trading", "Fair Value Gap (FVG) Trading", "Break of Structure (BOS)", "Change of Character (CHOCH)", "Premium / Discount Zones", "Killzone Trading"],
  "Indicators": ["Moving Average Crossover", "RSI Divergence", "MACD Trading", "Bollinger Bands", "Fibonacci Retracement"]
};
const DEFAULT_STRATEGY = "Market Structure + EMA Trend";

const T = {
  EN: {
    back: "← Por ICT", title: "Chart Analysis", subtitle: "Technical Signal Generator", market_setup: "Market Setup",
    tab_manual: "Manual Entry", tab_upload: "Upload Chart", tab_live: "Live Chart", pair: "PAIR", timeframe: "TIMEFRAME",
    m_price: "CURRENT PRICE", m_dir: "DIRECTION", m_low: "SUPPORT / SWING LOW", m_high: "RESISTANCE / SWING HIGH",
    u_tap: "Tap to upload chart screenshots", u_hint: "PNG, JPG or WebP up to 5MB each, max 3 images",
    mtf_auto: "Use higher-timeframe alignment (auto-detect HTF trend when available)", mtf: "Multi-Timeframe Context",
    htf: "HIGHER TIMEFRAME", htf_trend: "HTF TREND", sizing: "Position Sizing", sizing_hint: "Helps calculate suggested lot size based on your risk",
    account: "ACCOUNT SIZE ($)", risk: "RISK PER TRADE (%)", strategy: "ANALYSIS STRATEGY", notes: "ADDITIONAL NOTES",
    analyze_live: "Analyze Live Chart & Generate Signal", analyze_manual: "Calculate Signal", analyze_upload: "Analyze Chart Image & Generate Signal",
    disclaimer: "Educational tool only, not financial advice. Signals come from simple rules or AI reading of a chart and are never guaranteed. Trading carries a high risk of loss."
  },
  KH: {
    back: "← Por ICT", title: "វិភាគក្រាហ្វ", subtitle: "ឧបករណ៍បង្កើតសញ្ញាបច្ចេកទេស", market_setup: "ការកំណត់ទីផ្សារ",
    tab_manual: "បញ្ចូលដោយដៃ", tab_upload: "ផ្ទុកឡើងក្រាហ្វ", tab_live: "ក្រាហ្វផ្ទាល់", pair: "គូប្រាក់", timeframe: "ស៊ុមពេលវេលា",
    m_price: "តម្លៃបច្ចុប្បន្ន", m_dir: "ទិសដៅ", m_low: "ជំនួយ / SWING LOW", m_high: "ទប់ទល់ / SWING HIGH",
    u_tap: "ចុចដើម្បីផ្ទុកឡើងរូបថតក្រាហ្វ", u_hint: "PNG, JPG ឬ WebP ម្នាក់ៗមិនលើស 5MB អតិបរមា 3 រូប",
    mtf_auto: "ប្រើការតម្រឹមស៊ុមពេលវេលាធំជាង (រកទិសដៅ HTF ដោយស្វ័យប្រវត្តិ)", mtf: "បរិបទស៊ុមពេលវេលាច្រើន",
    htf: "ស៊ុមពេលវេលាធំជាង", htf_trend: "និន្នាការ HTF", sizing: "ទំហំទីតាំង", sizing_hint: "ជួយគណនាទំហំ Lot ដែលស្នើតាមហានិភ័យរបស់អ្នក",
    account: "ទំហំគណនី ($)", risk: "ហានិភ័យក្នុងមួយការជួញដូរ (%)", strategy: "យុទ្ធសាស្ត្រវិភាគ", notes: "កំណត់ចំណាំបន្ថែម",
    analyze_live: "វិភាគក្រាហ្វផ្ទាល់ និងបង្កើតសញ្ញា", analyze_manual: "គណនាសញ្ញា", analyze_upload: "វិភាគរូបក្រាហ្វ និងបង្កើតសញ្ញា",
    disclaimer: "ឧបករណ៍ការអប់រំប៉ុណ្ណោះ មិនមែនជាដំបូន្មានហិរញ្ញវត្ថុទេ។ សញ្ញាមកពីច្បាប់សាមញ្ញ ឬ AI អានក្រាហ្វ ហើយមិនមានការធានាឡើយ។ ការជួញដូរមានហានិភ័យខាតបង់ខ្ពស់។"
  }
};
let lang = localStorage.getItem("por_lang") === "KH" ? "KH" : "EN";
function applyLang() {
  document.documentElement.lang = lang === "KH" ? "km" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { const v = T[lang][el.dataset.i18n] || T.EN[el.dataset.i18n]; if (v) el.textContent = v; });
  updateAnalyzeLabel();
}

// ---------- state ----------
let mode = "live";
let strategy = DEFAULT_STRATEGY;
let images = []; // {media_type, data, url}
let mountedKey = null;

// ---------- chart ----------
function mountChart(force = false) {
  const pair = $("pairSelect").value, tf = $("tfSelect").value;
  const key = `${pair}|${tf}`;
  $("liveTitle").textContent = `Live Chart — ${pair} • ${TFS[tf].label}`;
  const node = $("tv_ca_chart");
  if (!node) return;

  // "Open in TradingView" link (always available, also works if the embed is blocked)
  let link = $("tvOpenLink");
  if (!link) {
    link = document.createElement("a");
    link.id = "tvOpenLink"; link.className = "ca-btn2"; link.target = "_blank"; link.rel = "noopener";
    link.style.cssText = "display:inline-block;margin-top:10px";
    link.textContent = "Open chart in TradingView ↗";
    node.closest(".ca-chart-box").insertAdjacentElement("afterend", link);
  }
  link.href = "https://www.tradingview.com/chart/?symbol=" + encodeURIComponent(PAIRS[pair].tv) + "&interval=" + TFS[tf].tv;

  if (!force && key === mountedKey && node.querySelector("iframe")) return;
  mountedKey = key;
  node.innerHTML = "";

  // Modern TradingView embed (the old tv.js widget often renders blank)
  const holder = document.createElement("div");
  holder.className = "tradingview-widget-container";
  holder.style.cssText = "height:100%;width:100%";
  const inner = document.createElement("div");
  inner.className = "tradingview-widget-container__widget";
  inner.style.cssText = "height:100%;width:100%";
  holder.appendChild(inner);
  const sc = document.createElement("script");
  sc.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
  sc.async = true;
  sc.text = JSON.stringify({
    autosize: true, symbol: PAIRS[pair].tv, interval: TFS[tf].tv, timezone: "Etc/UTC", theme: "dark", style: "1", locale: "en",
    backgroundColor: "#0c0e11", gridColor: "rgba(255,255,255,0.05)", hide_side_toolbar: true, allow_symbol_change: false,
    save_image: false, calendar: false, support_host: "https://www.tradingview.com"
  });
  holder.appendChild(sc);
  node.appendChild(holder);

  // If nothing loaded after a while (blocked network / adblock), say so instead of showing an empty box.
  const myKey = key;
  setTimeout(() => {
    if (mountedKey === myKey && !node.querySelector("iframe") && !node.querySelector(".ca-chart-fail")) {
      const m = document.createElement("div");
      m.className = "ca-chart-fail";
      m.style.cssText = "height:100%;display:grid;place-items:center;text-align:center;padding:20px;color:#94a3b8;font-size:13px;line-height:1.6";
      m.textContent = "The TradingView chart could not load (network, ad-blocker or VPN may block it). Use the button below to open it, or switch to Manual Entry.";
      node.appendChild(m);
    }
  }, 10000);
}

// ---------- UI wiring ----------
function setMode(m) {
  mode = m;
  document.querySelectorAll("#modeTabs .ca-tab").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
  $("panelLive").classList.toggle("hidden", m !== "live");
  $("panelManual").classList.toggle("hidden", m !== "manual");
  $("panelUpload").classList.toggle("hidden", m !== "upload");
  $("mtfCheckRow").classList.toggle("hidden", m !== "live");
  updateAnalyzeLabel();
  hideError();
  if (m === "live") mountChart();
}
function updateAnalyzeLabel() {
  const k = mode === "live" ? "analyze_live" : mode === "manual" ? "analyze_manual" : "analyze_upload";
  $("analyzeText").textContent = T[lang][k];
}
function showError(msg) { const b = $("errorBox"); b.textContent = msg; b.classList.remove("hidden"); b.scrollIntoView({ behavior: "smooth", block: "center" }); }
function hideError() { $("errorBox").classList.add("hidden"); }

function buildStrategyList(filter = "") {
  const f = filter.trim().toLowerCase(), list = $("strategyList");
  list.innerHTML = "";
  Object.entries(STRATEGIES).forEach(([cat, items]) => {
    const shown = items.filter((i) => !f || i.toLowerCase().includes(f));
    if (!shown.length) return;
    const h = document.createElement("div"); h.className = "ca-cat";
    h.innerHTML = `<span>⌄ ${esc(cat)}</span><span>${shown.length}</span>`; list.appendChild(h);
    shown.forEach((name) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "ca-opt" + (name === strategy ? " sel" : ""); b.textContent = name;
      b.addEventListener("click", () => { strategy = name; $("strategyLabel").textContent = name; closeStrategy(); });
      list.appendChild(b);
    });
  });
}
function openStrategy() { $("strategyMenu").classList.remove("hidden"); $("strategyBtn").setAttribute("aria-expanded", "true"); buildStrategyList($("strategySearch").value); $("strategySearch").focus(); }
function closeStrategy() { $("strategyMenu").classList.add("hidden"); $("strategyBtn").setAttribute("aria-expanded", "false"); }

// uploads
function renderThumbs() {
  const box = $("thumbs"); box.innerHTML = "";
  images.forEach((img, i) => {
    const d = document.createElement("div"); d.className = "ca-thumb";
    d.innerHTML = `<img alt="chart ${i + 1}" src="${img.url}" /><button type="button" aria-label="Remove">×</button>`;
    d.querySelector("button").addEventListener("click", () => { images.splice(i, 1); renderThumbs(); });
    box.appendChild(d);
  });
}
function addFiles(fileList) {
  hideError();
  for (const f of fileList) {
    if (images.length >= 3) { showError("Maximum 3 images."); break; }
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { showError("Only PNG, JPG or WebP images are allowed."); continue; }
    if (f.size > 5 * 1024 * 1024) { showError(`${f.name} is larger than 5MB.`); continue; }
    const r = new FileReader();
    r.onload = () => { images.push({ media_type: f.type, data: String(r.result).split(",")[1], url: String(r.result) }); renderThumbs(); };
    r.readAsDataURL(f);
  }
}

// ---------- indicators ----------
const ema = (arr, n) => { const k = 2 / (n + 1); let e = arr[0]; return arr.map((v, i) => (i === 0 ? e : (e = v * k + e * (1 - k)))); };
function atr(c, p = 14) {
  if (c.length <= p) return 0; let s = 0;
  for (let i = c.length - p; i < c.length; i++) s += Math.max(c[i].h - c[i].l, Math.abs(c[i].h - c[i - 1].c), Math.abs(c[i].l - c[i - 1].c));
  return s / p;
}
function rsi(closes, p = 14) {
  if (closes.length <= p) return 50; let g = 0, l = 0;
  for (let i = closes.length - p; i < closes.length; i++) { const d = closes[i] - closes[i - 1]; if (d >= 0) g += d; else l -= d; }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
function swings(c, len = 3) {
  const highs = [], lows = [];
  for (let i = len; i < c.length - len; i++) {
    let H = true, L = true;
    for (let k = 1; k <= len; k++) { if (c[i].h <= c[i - k].h || c[i].h <= c[i + k].h) H = false; if (c[i].l >= c[i - k].l || c[i].l >= c[i + k].l) L = false; }
    if (H) highs.push({ i, p: c[i].h }); if (L) lows.push({ i, p: c[i].l });
  }
  return { highs, lows };
}
function structure(c) {
  const { highs, lows } = swings(c);
  if (highs.length < 2 || lows.length < 2) return "RANGE";
  const [h1, h2] = highs.slice(-2), [l1, l2] = lows.slice(-2);
  if (h2.p > h1.p && l2.p > l1.p) return "BULLISH";
  if (h2.p < h1.p && l2.p < l1.p) return "BEARISH";
  return "RANGE";
}
function trendOf(c) {
  const closes = c.map((x) => x.c), e20 = ema(closes, 20), e50 = ema(closes, 50), n = closes.length - 1;
  const st = structure(c);
  if (e20[n] > e50[n] && closes[n] > e50[n] && st !== "BEARISH") return "BULLISH";
  if (e20[n] < e50[n] && closes[n] < e50[n] && st !== "BULLISH") return "BEARISH";
  return "RANGE";
}

const BN_HOSTS = ["https://api.binance.com", "https://data-api.binance.vision", "https://api1.binance.com", "https://api2.binance.com", "https://api3.binance.com"];
let bnHostIdx = 0;
async function fetchCandles(binanceSymbol, interval, limit = 300) {
  let lastErr;
  // Some networks block api.binance.com, so try the mirrors too and remember the one that works.
  for (let n = 0; n < BN_HOSTS.length; n++) {
    const host = BN_HOSTS[(bnHostIdx + n) % BN_HOSTS.length];
    try {
      const r = await fetch(`${host}/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) throw new Error(`Market data error ${r.status}`);
      const rows = await r.json();
      bnHostIdx = (bnHostIdx + n) % BN_HOSTS.length;
      return rows.map((k) => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] }));
    } catch (e) { lastErr = e; }
  }
  throw new Error("Could not load live market data (Binance may be blocked on this network or VPN). Try Manual Entry, or a different connection. " + (lastErr && lastErr.message ? "(" + lastErr.message + ")" : ""));
}

// ---------- engines ----------
function liveEngine(c, htfTrend, strat) {
  const closes = c.map((x) => x.c), n = closes.length - 1, last = c[n];
  const a = atr(c), r = rsi(closes), e20 = ema(closes, 20), e50 = ema(closes, 50), e9 = ema(closes, 9), e21 = ema(closes, 21), st = structure(c);
  if (!(a > 0)) return { dir: null, reason: "Not enough data for ATR." };

  const crossed = (up) => [0, 1, 2, 3, 4].some((k) => (up ? e9[n - k - 1] <= e21[n - k - 1] && e9[n - k] > e21[n - k]
                                                          : e9[n - k - 1] >= e21[n - k - 1] && e9[n - k] < e21[n - k]));
  const crossUp = crossed(true), crossDn = crossed(false);

  const long = [
    ["EMA20 above EMA50", e20[n] > e50[n]], ["Price above EMA50", last.c > e50[n]], ["Bullish market structure (HH + HL)", st === "BULLISH"],
    ["RSI healthy for longs (45–70)", r >= 45 && r <= 70], htfTrend ? [`Higher timeframe ${htfTrend.toLowerCase()}`, htfTrend === "BULLISH"] : null
  ].filter(Boolean);
  const short = [
    ["EMA20 below EMA50", e20[n] < e50[n]], ["Price below EMA50", last.c < e50[n]], ["Bearish market structure (LH + LL)", st === "BEARISH"],
    ["RSI healthy for shorts (30–55)", r >= 30 && r <= 55], htfTrend ? [`Higher timeframe ${htfTrend.toLowerCase()}`, htfTrend === "BEARISH"] : null
  ].filter(Boolean);
  if (strat === "Moving Average Crossover") { long.push(["Fresh EMA9/21 bullish cross (last 5 bars)", crossUp]); short.push(["Fresh EMA9/21 bearish cross (last 5 bars)", crossDn]); }

  const ls = long.filter((x) => x[1]).length, ss = short.filter((x) => x[1]).length;
  const total = long.length, need = Math.ceil(total * 0.7);
  let dir = null;
  if (ls >= need && ls > ss) dir = "BUY"; else if (ss >= need && ss > ls) dir = "SELL";
  const info = { atr: a, rsi: r, structure: st, price: last.c };
  if (!dir) return { dir: null, reason: `No clean setup: ${ls}/${total} bullish and ${ss}/${total} bearish confluences. Waiting is a valid decision.`, info };

  const { highs, lows } = swings(c);
  const buy = dir === "BUY", entry = last.c;
  const ref = buy ? lows.slice(-1)[0]?.p : highs.slice(-1)[0]?.p;
  let sl = buy ? (ref && entry - ref >= 0.8 * a && entry - ref <= 3 * a ? ref - 0.25 * a : entry - 1.5 * a)
               : (ref && ref - entry >= 0.8 * a && ref - entry <= 3 * a ? ref + 0.25 * a : entry + 1.5 * a);
  const conf = (buy ? long : short).filter((x) => x[1]).map((x) => x[0]);
  const miss = (buy ? long : short).filter((x) => !x[1]).map((x) => x[0]);
  return { dir, entry, sl, confluences: conf, missing: miss, score: `${conf.length}/${total}`, info,
    notes: [`ATR(14) = ${a.toFixed(4)}; stop is placed ${ref ? "beyond the last swing" : "1.5 × ATR away"}.`, `RSI(14) = ${r.toFixed(1)}.`] };
}

function manualEngine(price, low, high, dirPref, strat) {
  if (!(price > 0) || !(low > 0) || !(high > 0)) return { dir: null, reason: "Enter the current price, support and resistance." };
  if (high <= low) return { dir: null, reason: "Resistance must be above support." };
  if (price < low || price > high) return { dir: null, reason: "Price is outside your support/resistance range. Update the levels." };
  const pos = (price - low) / (high - low);
  const dir = dirPref === "AUTO" ? (pos <= 0.5 ? "BUY" : "SELL") : dirPref;
  const buy = dir === "BUY", range = high - low, buf = 0.1 * range;
  const sl = buy ? low - buf : high + buf;
  const zone = pos <= 0.5 ? "discount (lower half)" : "premium (upper half)";
  const against = (buy && pos > 0.5) || (!buy && pos < 0.5);
  return { dir, entry: price, sl, confluences: [`Price is in the ${zone} of your range (${(pos * 100).toFixed(0)}%)`, buy ? "Stop below your support" : "Stop above your resistance"],
    missing: against ? [buy ? "Buying in the premium half is lower quality" : "Selling in the discount half is lower quality"] : [], score: null,
    notes: [`Stop buffer = 10% of your range (${buf.toFixed(4)}).`, `Strategy label: ${strat}. Manual mode uses only the levels you typed.`] };
}

// ---------- position sizing + result ----------
function sizeLots(pairKey, entry, sl, account, riskPct) {
  const dist = Math.abs(entry - sl); if (!(dist > 0)) return null;
  const p = PAIRS[pairKey]; const mult = p.mult === "jpy" ? 100000 / entry : p.mult;
  const riskUsd = account * riskPct / 100, raw = riskUsd / (dist * mult);
  const lots = Math.floor(raw * 100) / 100;
  return { riskUsd, lots, minWarn: lots < 0.01, actualRisk: Math.max(lots, 0.01) * dist * mult };
}
function renderResult(pairKey, tf, res, extra = {}) {
  const card = $("resultCard"); card.classList.remove("hidden");
  const dec = PAIRS[pairKey].dec, f = (v) => Number(v).toFixed(dec);
  if (!res.dir) {
    card.innerHTML = `<div class="ca-res-head"><span class="ca-dir none">NO TRADE</span><span class="ca-res-meta">${esc(pairKey)} • ${esc(tf)}</span></div>
      <div class="ca-res-block"><p>${esc(res.reason || "No setup found.")}</p></div>`;
    card.scrollIntoView({ behavior: "smooth", block: "start" }); return;
  }
  const buy = res.dir === "BUY", risk = Math.abs(res.entry - res.sl), sg = buy ? 1 : -1;
  const tp = [1, 2, 3].map((m) => res.tps?.[m - 1] ?? res.entry + sg * risk * m);
  const rr = (Math.abs(tp[2] - res.entry) / risk).toFixed(1);
  const sz = sizeLots(pairKey, res.entry, res.sl, +$("accountSize").value || 0, +$("riskPct").value || 0);
  const list = (arr) => (arr && arr.length ? arr.map((x) => `<li>${esc(x)}</li>`).join("") : "");
  const signalText = `${pairKey} ${res.dir} @ ${f(res.entry)} | SL ${f(res.sl)} | TP1 ${f(tp[0])} | TP2 ${f(tp[1])} | TP3 ${f(tp[2])} | R:R 1:${rr}`;
  card.innerHTML = `
    <div class="ca-res-head"><span class="ca-dir ${buy ? "buy" : "sell"}">${buy ? "▲ BUY" : "▼ SELL"} ${esc(pairKey)}</span>
      <span class="ca-res-meta">${esc(tf)} • ${esc(strategy)}${res.score ? ` • Confluence ${esc(res.score)}` : ""}${extra.source ? ` • ${esc(extra.source)}` : ""}</span></div>
    <div class="ca-levels">
      <div class="ca-level en"><span>ENTRY</span><strong>${f(res.entry)}</strong></div>
      <div class="ca-level sl"><span>STOP LOSS</span><strong>${f(res.sl)}</strong></div>
      <div class="ca-level tp"><span>TP1 (1R)</span><strong>${f(tp[0])}</strong></div>
      <div class="ca-level tp"><span>TP2 (2R)</span><strong>${f(tp[1])}</strong></div>
      <div class="ca-level tp"><span>TP3 (3R)</span><strong>${f(tp[2])}</strong></div>
      <div class="ca-level"><span>R:R</span><strong>1:${rr}</strong></div>
      ${sz ? `<div class="ca-level"><span>SUGGESTED LOTS</span><strong>${sz.minWarn ? "&lt; 0.01" : sz.lots.toFixed(2)}</strong></div>
      <div class="ca-level"><span>RISK ($)</span><strong>${sz.riskUsd.toFixed(2)}</strong></div>` : ""}
    </div>
    ${sz && sz.minWarn ? `<div class="ca-res-block"><p>Your risk amount is too small for the minimum 0.01 lot at this stop distance (0.01 lot would risk about $${sz.actualRisk.toFixed(2)}). Use a smaller lot size on a micro/cent account, a tighter stop, or a higher risk %.</p></div>` : ""}
    ${res.confluences?.length ? `<div class="ca-res-block"><h3>WHAT SUPPORTS IT</h3><ul>${list(res.confluences)}</ul></div>` : ""}
    ${res.missing?.length ? `<div class="ca-res-block"><h3>WHAT IS MISSING / RISKS</h3><ul>${list(res.missing)}</ul></div>` : ""}
    ${extra.summary ? `<div class="ca-res-block"><h3>ANALYSIS</h3><p>${esc(extra.summary)}</p></div>` : ""}
    ${res.notes?.length ? `<div class="ca-res-block"><h3>NOTES</h3><ul>${list(res.notes)}</ul></div>` : ""}
    <div class="ca-res-actions"><button type="button" class="ca-btn2" id="copySignalBtn">Copy signal</button><a class="ca-btn2" href="terminal.html">Open Terminal</a></div>`;
  $("copySignalBtn").addEventListener("click", (e) => { navigator.clipboard?.writeText(signalText).then(() => { e.target.textContent = "Copied ✓"; setTimeout(() => (e.target.textContent = "Copy signal"), 1500); }); });
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- analyze ----------
async function analyze() {
  hideError();
  const pairKey = $("pairSelect").value, tfKey = $("tfSelect").value, btn = $("analyzeBtn");
  btn.disabled = true; const original = $("analyzeText").textContent; $("analyzeText").textContent = "Analyzing…";
  try {
    if (mode === "manual") {
      const res = manualEngine(+$("mPrice").value, +$("mLow").value, +$("mHigh").value, $("mDir").value, strategy);
      renderResult(pairKey, TFS[tfKey].label, res, { source: "Manual levels" });
    } else if (mode === "live") {
      const p = PAIRS[pairKey];
      if (!p.bn) { showError(`Live candle data is available for XAUUSD, BTCUSD and ETHUSD. For ${pairKey}, use Manual Entry or Upload Chart (the chart above is still live).`); return; }
      const candles = await fetchCandles(p.bn, TFS[tfKey].bn);
      if (candles.length < 60) throw new Error("Not enough candles returned.");
      let htf = $("htfTrend").value; let htfNote = null;
      if (htf === "auto" || !htf) htf = null;
      const htfTf = $("htfSelect").value;
      if (!htf && $("mtfAuto").checked && htfTf !== "same") { try { htf = trendOf(await fetchCandles(p.bn, TFS[htfTf].bn)); htfNote = `Auto-detected ${TFS[htfTf].label} trend: ${htf}.`; } catch { htfNote = "Could not load higher-timeframe data; ignored."; } }
      if (htf === "RANGE") htf = "RANGE";
      const res = liveEngine(candles, htf, strategy);
      if (res.notes && htfNote) res.notes.unshift(htfNote);
      if (pairKey === "XAUUSD") (res.notes = res.notes || []).push("XAUUSD candles come from PAXG (tokenised gold). Prices track spot gold closely but can differ by a few dollars; confirm levels on your broker's chart.");
      renderResult(pairKey, TFS[tfKey].label, res, { source: "Live data" });
    } else {
      if (!images.length) { showError("Upload at least one chart screenshot first."); return; }
      const resp = await fetch("/api/analyze-chart", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: images.map(({ media_type, data }) => ({ media_type, data })), pair: pairKey, timeframe: TFS[tfKey].label,
          strategy, notes: $("notes").value, htfTimeframe: $("htfSelect").value, htfTrend: $("htfTrend").value })
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.success) throw new Error(json.error || `Analysis failed (${resp.status}).`);
      const a = json.analysis;
      const dir = a.direction === "BUY" || a.direction === "SELL" ? a.direction : null;
      renderResult(pairKey, TFS[tfKey].label, dir ? { dir, entry: +a.entry, sl: +a.stop_loss, tps: [a.tp1, a.tp2, a.tp3].map(Number).filter((x) => x > 0).length === 3 ? [a.tp1, a.tp2, a.tp3].map(Number) : null,
        confluences: a.supporting || [], missing: a.risks || [], notes: [] } : { dir: null, reason: a.summary || "No clear setup in the image." }, { source: "AI chart reading", summary: a.summary });
    }
  } catch (err) {
    showError(err.name === "TimeoutError" ? "Market data timed out. Check your connection and try again." : err.message || "Something went wrong.");
  } finally {
    btn.disabled = false; $("analyzeText").textContent = original; updateAnalyzeLabel();
  }
}

// ---------- init ----------
document.addEventListener("DOMContentLoaded", () => {
  applyLang();
  document.querySelectorAll("#modeTabs .ca-tab").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  $("pairSelect").addEventListener("change", () => { if (mode === "live") mountChart(); });
  $("tfSelect").addEventListener("change", () => { if (mode === "live") mountChart(); });
  $("strategyBtn").addEventListener("click", () => ($("strategyMenu").classList.contains("hidden") ? openStrategy() : closeStrategy()));
  $("strategySearch").addEventListener("input", (e) => buildStrategyList(e.target.value));
  $("strategyClear").addEventListener("click", () => { strategy = DEFAULT_STRATEGY; $("strategyLabel").textContent = DEFAULT_STRATEGY; closeStrategy(); });
  document.addEventListener("click", (e) => { if (!$("strategyBox").contains(e.target)) closeStrategy(); });
  const dz = $("dropZone");
  dz.addEventListener("click", () => $("fileInput").click());
  dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") $("fileInput").click(); });
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("drag"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("drag"));
  dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("drag"); addFiles(e.dataTransfer.files); });
  $("fileInput").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  $("analyzeBtn").addEventListener("click", analyze);
  buildStrategyList();
  setMode("live");
  window.addEventListener("load", () => mountChart());
});
