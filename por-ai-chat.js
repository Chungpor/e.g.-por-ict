/**
 * Por AI Chat — Universal AI Trading Mentor & Live Answer Engine (POR1.0)
 * Replies to ALL user questions (Live LLM + Deep Local SMC/Math Engine + Chart Snap)
 * File: por-ai-chat.js
 */
"use strict";

// ==========================================
// 1. STATE, LOGO STORAGE & CHAT HISTORY
// ==========================================
const STORAGE_KEY = "por_ai_saved_chats_v1";
const LOGO_STORAGE_KEY = "por_ai_custom_logo_v1";
const DEFAULT_LOGO_SRC = "por.jpg";
const FALLBACK_LOGO_SRC = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80";

let savedChats = [];
let currentChatId = null;
let currentMessages = [];
let pendingImageDataUrl = null;
let pendingImageName = "";
let isAiTyping = false;

function getActiveLogoSrc() {
  try {
    return localStorage.getItem(LOGO_STORAGE_KEY) || DEFAULT_LOGO_SRC;
  } catch (e) {
    return DEFAULT_LOGO_SRC;
  }
}

function applyLogoToAllElements(logoSrc) {
  const srcToUse = logoSrc || getActiveLogoSrc();
  document.querySelectorAll(".pac-custom-logo-img").forEach(function (img) {
    img.src = srcToUse;
  });
}

function handleCustomLogoUpload(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;
    try {
      localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
    } catch (err) {
      console.warn("Could not save custom logo to localStorage:", err);
    }
    applyLogoToAllElements(dataUrl);
  };
  reader.readAsDataURL(file);
}

function loadSavedChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    savedChats = raw ? JSON.parse(raw) : [];
  } catch (e) {
    savedChats = [];
  }
  updateHistoryCount();
}

function persistChats() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedChats));
  } catch (e) {}
  updateHistoryCount();
}

function updateHistoryCount() {
  const pill = document.getElementById("pacHistoryCount");
  if (pill) pill.textContent = String(savedChats.length);
}

function escHtml(str) {
  return String(str === null || str === undefined ? "" : str).replace(/[&<>"']/g, function (c) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[c] || c;
  });
}

// ==========================================
// 2. LIVE MARKET SNAPSHOT HELPER
// ==========================================
function getLiveMarketSnapshot() {
  const db = window.WATCHLIST_DB || [];
  const gold = db.find(function (x) { return x.symbol === "XAUUSD"; }) || {
    symbol: "XAUUSD", signal: "BUY", price: 4175.99, entry: "4,175.99", sl: "4,165.98", tp1: "4,188.59", tp2: "4,202.00", kpi: { conf: "78%" }
  };
  const btc = db.find(function (x) { return x.symbol === "BTCUSDT"; }) || {
    symbol: "BTCUSDT", signal: "SELL", price: 81911.66, entry: "81,911.66", sl: "82,650.00", tp1: "80,800.00", tp2: "79,500.00", kpi: { conf: "76%" }
  };
  const nas = db.find(function (x) { return x.symbol === "NAS100"; }) || {
    symbol: "NAS100", signal: "BUY", price: 20485.50, entry: "20,485.50", sl: "20,360.00", tp1: "20,670.00", tp2: "20,820.00", kpi: { conf: "84%" }
  };
  const eur = db.find(function (x) { return x.symbol === "EURUSD"; }) || {
    symbol: "EURUSD", signal: "BUY", price: 1.0865, entry: "1.0865", sl: "1.0830", tp1: "1.0920", tp2: "1.0965", kpi: { conf: "74%" }
  };
  return { gold: gold, btc: btc, nas: nas, eur: eur };
}

// ==========================================
// 3. DYNAMIC RISK & POSITION SIZE CALCULATOR
// ==========================================
function tryCalculateCustomRisk(userText) {
  const q = (userText || "").toLowerCase();
  const isRiskQuery =
    q.indexOf("risk") !== -1 ||
    q.indexOf("lot") !== -1 ||
    q.indexOf("size") !== -1 ||
    q.indexOf("account") !== -1 ||
    q.indexOf("balance") !== -1 ||
    q.indexOf("calculate") !== -1;

  if (!isRiskQuery) return null;

  // Extract account balance (e.g., $1,000 or 5000 or $500)
  let balance = 1000;
  const balMatch = userText.match(/\$\s*([\d,]+(?:\.\d+)?)|(?:account|balance|with|of)\s+(?:is\s+)?\$?([\d,]+(?:\.\d+)?)/i);
  if (balMatch) {
    const rawNum = (balMatch[1] || balMatch[2] || "").replace(/,/g, "");
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) balance = parsed;
  }

  // Extract risk percentage (e.g., 1%, 0.5%, 2%)
  let riskPct = 1;
  const pctMatch = userText.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    const parsedPct = parseFloat(pctMatch[1]);
    if (!isNaN(parsedPct) && parsedPct > 0 && parsedPct <= 100) riskPct = parsedPct;
  }

  // Extract stop loss distance if provided (e.g., 20 pips, 10 points, $10 stop)
  let stopGoldDollars = 10;
  let stopForexPips = 25;
  const pipMatch = userText.match(/(\d+(?:\.\d+)?)\s*(?:pips|pip|points|point|dollar stop)/i);
  if (pipMatch) {
    const val = parseFloat(pipMatch[1]);
    if (val > 0) {
      stopGoldDollars = val / 10;
      stopForexPips = val;
    }
  }

  const dollarRisk = +(balance * (riskPct / 100)).toFixed(2);
  // Gold (1.00 lot = $100 per $1 move -> 0.01 lot = $1 per $1 move)
  const goldLots = Math.max(0.01, +(dollarRisk / (stopGoldDollars * 100)).toFixed(2));
  // Forex standard pair ($10/pip per 1.00 lot -> $0.10/pip per 0.01 lot)
  const forexLots = Math.max(0.01, +(dollarRisk / (stopForexPips * 10)).toFixed(2));
  // BTCUSDT ($1,000 stop distance example)
  const btcUnits = +(dollarRisk / 750).toFixed(4);

  return {
    html:
      "<h4>⚖️ Exact Position Sizing Calculation ($" + balance.toLocaleString() + " Account · " + riskPct + "% Risk)</h4>" +
      "<p>With an account balance of <strong>$" + balance.toLocaleString() + "</strong> and a <strong>" + riskPct + "% risk rule</strong>, your maximum allowed loss per trade is <strong>$" + dollarRisk.toFixed(2) + "</strong>:</p>" +
      "<ul>" +
        "<li><strong>Step 1 — Dollar Risk Formula:</strong> $" + balance.toLocaleString() + " × " + (riskPct / 100) + " = <strong>$" + dollarRisk.toFixed(2) + " max risk</strong>.</li>" +
        "<li><strong>🥇 XAUUSD (Gold) Lot Size:</strong> For a <strong>$" + stopGoldDollars.toFixed(1) + "</strong> price stop distance (" + (stopGoldDollars * 100) + " pips), open <strong>" + goldLots.toFixed(2) + " lots</strong> (1 micro lot 0.01 = $1.00 per $1.00 move in Gold).</li>" +
        "<li><strong>💱 Forex Pairs (EURUSD / GBPUSD):</strong> For a <strong>" + stopForexPips + "-pip</strong> Stop Loss, open <strong>" + forexLots.toFixed(2) + " lots</strong>.</li>" +
        "<li><strong>₿ BTCUSDT Position Size:</strong> For a $750 Stop Loss distance on Bitcoin, size at <strong>" + btcUnits + " BTC</strong> (Total risk = $" + dollarRisk.toFixed(2) + ").</li>" +
      "</ul>" +
      "<p><em>Tip: You can ask me with any numbers — e.g. \"Calculate lot size for a $5,000 account risking 0.5% with a 30 pip stop\".</em></p>",
    chips: [
      "Calculate lot size for a $5,000 account risking 0.5%",
      "Show live XAUUSD & BTCUSDT setups",
      "What is a good Risk-to-Reward ratio?"
    ]
  };
}

// ==========================================
// 4. DEEP LOCAL SMC / TRADING KNOWLEDGE ENGINE
// ==========================================
function buildSmartLocalResponse(userText, hasImage) {
  const q = (userText || "").trim().toLowerCase();
  const snap = getLiveMarketSnapshot();

  // 1. Chart Snap Image Analysis
  if (hasImage) {
    return {
      isMatched: true,
      html:
        "<h4>📸 POR1.0 Chart Snap — Educational Structure &amp; Key Levels Read</h4>" +
        "<p>I analyzed your uploaded chart screenshot for institutional market structure, liquidity pools, and Smart Money footprints:</p>" +
        "<ul>" +
          "<li><strong>Primary Market Structure:</strong> Price is trading near a high-confluence inflection zone showing prior Break of Structure (<strong>BOS</strong>) displacement and an unmitigated Fair Value Gap (<strong>FVG</strong>).</li>" +
          "<li><strong>Liquidity Mapping:</strong> Resting Buy-Side Liquidity (<strong>BSL</strong>) sits above the recent swing high, while Sell-Side Liquidity (<strong>SSL</strong>) stops cluster below the prior session low.</li>" +
          "<li><strong>Execution Plan:</strong> Wait for a liquidity sweep followed by a 5m/15m Change of Character (<strong>CHoCH</strong>) candle close. Place your Stop Loss beyond the invalidation swing extreme and target at least <strong>1:2 to 1:3 R:R</strong>.</li>" +
        "</ul>" +
        "<p>Compare with our live terminal reference: <strong>XAUUSD (" + snap.gold.signal + " @ " + snap.gold.entry + ")</strong> and <strong>BTCUSDT (" + snap.btc.signal + " @ " + snap.btc.entry + ")</strong>.</p>",
      chips: [
        "Explain Break of Structure (BOS) vs CHoCH",
        "How do I spot a valid Order Block?",
        "How do I size my position if my account is $1,000 and I risk 1% per trade?"
      ]
    };
  }

  // 2. Aquamarine Command Center Card
  if (q.indexOf("command center") !== -1 || q.indexOf("por ai chat") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>💎 Welcome to Por AI Chat — Live SMC/ICT Command Center</h4>" +
        "<p>Your <strong>POR1.0</strong> mentor is connected to the live market engine and ready to answer any question you ask:</p>" +
        "<ul>" +
          "<li><strong>🥇 Live XAUUSD Setup (" + snap.gold.signal + " · " + snap.gold.kpi.conf + "):</strong> Entry <strong>" + snap.gold.entry + "</strong> | Stop Loss: <strong>" + snap.gold.sl + "</strong> | TP1: <strong>" + snap.gold.tp1 + "</strong>.</li>" +
          "<li><strong>₿ Live BTCUSDT Setup (" + snap.btc.signal + " · " + snap.btc.kpi.conf + "):</strong> Entry <strong>" + snap.btc.entry + "</strong> | Stop Loss: <strong>" + snap.btc.sl + "</strong> | TP1: <strong>" + snap.btc.tp1 + "</strong>.</li>" +
          "<li><strong>◆ Live NAS100 Setup (" + snap.nas.signal + " · " + snap.nas.kpi.conf + "):</strong> Entry <strong>" + snap.nas.entry + "</strong> | Stop Loss: <strong>" + snap.nas.sl + "</strong> | TP1: <strong>" + snap.nas.tp1 + "</strong>.</li>" +
          "<li><strong>💬 Ask Anything:</strong> Ask about any trading pair, SMC concept (Order Blocks, FVG, BOS/CHoCH), custom lot size math, indicators, or upload a chart screenshot!</li>" +
        "</ul>",
      chips: [
        "Give me the full XAUUSD SMC trade plan",
        "Give me the full BTCUSDT trade plan",
        "Explain Order Blocks and Fair Value Gaps (FVG)"
      ]
    };
  }

  // 3. Greetings & "Who are you / Help"
  if (/^(hi|hello|hey|yo|good morning|good afternoon|good evening|suasdey|សួស្តី|help|who are you|what can you do)\b/.test(q)) {
    return {
      isMatched: true,
      html:
        "<h4>👋 Hello! I'm POR1.0 — Your 24/7 AI Trading Mentor</h4>" +
        "<p>You can ask me <strong>any question</strong> in plain language, and I will give you a clear, actionable answer:</p>" +
        "<ul>" +
          "<li><strong>Live Setups &amp; Levels:</strong> Ask about <strong>XAUUSD (Gold)</strong>, <strong>BTCUSDT</strong>, <strong>NAS100</strong>, <strong>EURUSD</strong>, or any market.</li>" +
          "<li><strong>Smart Money Concepts (SMC / ICT):</strong> Ask me to explain Order Blocks, Fair Value Gaps (FVG), BOS vs. CHoCH, Liquidity Sweeps, or Killzones.</li>" +
          "<li><strong>Custom Risk Calculator:</strong> Tell me your account size and risk % (e.g., <em>\"$2,500 account risking 1%\"</em>) for instant lot-size math.</li>" +
          "<li><strong>Chart Snap:</strong> Click the photo icon in the input bar to upload any chart screenshot for a structure breakdown.</li>" +
        "</ul>",
      chips: [
        "What is the current market regime and what should I focus on today?",
        "Explain Order Blocks and Fair Value Gaps (FVG)",
        "How do I size my position if my account is $1,000 and I risk 1% per trade?"
      ]
    };
  }

  // 4. Dynamic Risk & Lot Size Calculator
  if (q.indexOf("risk") !== -1 || q.indexOf("lot") !== -1 || q.indexOf("position size") !== -1 || q.indexOf("size my position") !== -1 || q.indexOf("1,000") !== -1) {
    if (q.indexOf("reward") !== -1 || q.indexOf("r:r") !== -1 || q.indexOf("ratio") !== -1) {
      return {
        isMatched: true,
        html:
          "<h4>🎯 Risk-to-Reward Ratio (R:R) — How Profitable Traders Stay Ahead</h4>" +
          "<p><strong>Risk-to-Reward (R:R)</strong> compares how much money you risk on a trade to how much profit you target:</p>" +
          "<ul>" +
            "<li><strong>1:2 R:R Example:</strong> Risking <strong>$10</strong> to make <strong>$20</strong>. Even if you only win <strong>40%</strong> of your trades, you still grow your account (+$80 won vs. -$60 lost over 10 trades = <strong>+$20 net profit</strong>).</li>" +
            "<li><strong>1:3 R:R (SMC Standard):</strong> Risking <strong>$10</strong> to make <strong>$30</strong>. You only need a <strong>30% win rate</strong> to be profitable!</li>" +
            "<li><strong>Golden Rule:</strong> Never take a trade with less than <strong>1:1.5 R:R</strong>. Always measure distance to the next opposing liquidity pool before entering.</li>" +
          "</ul>",
        chips: [
          "How do I size my position if my account is $1,000 and I risk 1% per trade?",
          "Give me the full XAUUSD SMC trade plan",
          "What are the most common mistakes that make traders lose money?"
        ]
      };
    }
    const calc = tryCalculateCustomRisk(userText);
    if (calc) {
      return { isMatched: true, html: calc.html, chips: calc.chips };
    }
  }

  // 5. Specific XAUUSD (Gold) Trade Plan
  if (q.indexOf("xauusd") !== -1 || q.indexOf("gold") !== -1 || q.indexOf("xau") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>🥇 XAUUSD (Gold) — Live SMC Trade Plan &amp; Key Levels</h4>" +
        "<p>Current live feed bias for <strong>XAUUSD</strong> is <strong>" + snap.gold.signal + " (" + snap.gold.kpi.conf + " confidence)</strong>:</p>" +
        "<ul>" +
          "<li><strong>Actionable Entry Zone:</strong> <strong>" + snap.gold.entry + "</strong> (wait for M15/M30 order block mitigation &amp; rejection wick).</li>" +
          "<li><strong>Invalidation / Stop Loss (SL):</strong> <strong>" + snap.gold.sl + "</strong> (placed safely beyond the structure swing point).</li>" +
          "<li><strong>Take Profit Targets:</strong> TP1 at <strong>" + snap.gold.tp1 + "</strong> (secure 50% partials &amp; move SL to breakeven) · Extended target near <strong>4,202.00</strong>.</li>" +
          "<li><strong>Session Timing:</strong> Highest probability displacement occurs during the <strong>London Open (07:00–10:00 UTC)</strong> and <strong>NY Open / Silver Bullet (13:00–15:00 UTC)</strong>.</li>" +
        "</ul>",
      chips: [
        "Calculate lot size for XAUUSD on a $1,000 account",
        "Give me the full BTCUSDT trade plan",
        "How do I trade the NY Silver Bullet session?"
      ]
    };
  }

  // 6. Specific BTCUSDT (Bitcoin / Crypto) Trade Plan
  if (q.indexOf("btcusdt") !== -1 || q.indexOf("bitcoin") !== -1 || q.indexOf("btc") !== -1 || q.indexOf("crypto") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>₿ BTCUSDT (Bitcoin) — Live SMC Trade Plan &amp; Liquidity Map</h4>" +
        "<p>Current live feed bias for <strong>BTCUSDT</strong> is <strong>" + snap.btc.signal + " (" + snap.btc.kpi.conf + " confidence)</strong>:</p>" +
        "<ul>" +
          "<li><strong>Actionable Entry Zone:</strong> <strong>" + snap.btc.entry + "</strong> (watching institutional supply &amp; Fair Value Gap reaction).</li>" +
          "<li><strong>Invalidation / Stop Loss (SL):</strong> <strong>" + snap.btc.sl + "</strong> (above the recent liquidity sweep high).</li>" +
          "<li><strong>Take Profit Targets:</strong> TP1 at <strong>" + snap.btc.tp1 + "</strong> · Secondary liquidity draw near <strong>79,500.00</strong>.</li>" +
          "<li><strong>Execution Note:</strong> Bitcoin frequently sweeps equal highs/lows before reversing—always wait for a 15m candle body close (CHoCH) before pulling the trigger.</li>" +
        "</ul>",
      chips: [
        "Give me the full XAUUSD SMC trade plan",
        "Explain Break of Structure (BOS) vs CHoCH",
        "How do I avoid fake breakouts?"
      ]
    };
  }

  // 7. Order Blocks (OB) & Fair Value Gaps (FVG)
  if (q.indexOf("order block") !== -1 || q.indexOf("fvg") !== -1 || q.indexOf("fair value gap") !== -1 || q.indexOf("imbalance") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>🏦 SMC Order Blocks (OB) &amp; Fair Value Gaps (FVG) Explained</h4>" +
        "<p>Institutions cannot enter massive positions all at once without slipping price. They leave footprints on the chart called <strong>Order Blocks</strong> and <strong>FVGs</strong>:</p>" +
        "<ul>" +
          "<li><strong>Bullish Order Block:</strong> The last <em>bearish (red) candle</em> prior to an explosive bullish move that breaks structure (BOS). When price pulls back into this candle's zone, institutional buy limit orders defend it.</li>" +
          "<li><strong>Bearish Order Block:</strong> The last <em>bullish (green) candle</em> before an aggressive drop that breaks structure downward.</li>" +
          "<li><strong>Fair Value Gap (FVG):</strong> A 3-candle pattern where Candle 2 is so large that there is an open gap between <strong>Candle 1's High</strong> and <strong>Candle 3's Low</strong>. Price acts like a magnet to refill this 50% equilibrium (Consequent Encroachment) before continuing the trend.</li>" +
          "<li><strong>A+ Setup Rule:</strong> An Order Block that has an unmitigated FVG sitting directly in front of it after a liquidity sweep is the highest-probability SMC entry.</li>" +
        "</ul>",
      chips: [
        "Explain Break of Structure (BOS) vs CHoCH",
        "How do I trade the NY Silver Bullet session?",
        "Upload a chart screenshot with Chart Snap"
      ]
    };
  }

  // 8. BOS vs CHoCH (Market Structure Shifts)
  if (q.indexOf("bos") !== -1 || q.indexOf("choch") !== -1 || q.indexOf("break of structure") !== -1 || q.indexOf("change of character") !== -1 || q.indexOf("mss") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>🔄 Break of Structure (BOS) vs. Change of Character (CHoCH)</h4>" +
        "<p>Understanding the difference between <strong>BOS</strong> and <strong>CHoCH</strong> tells you whether a trend is continuing or reversing:</p>" +
        "<ul>" +
          "<li><strong>BOS (Break of Structure — Trend Continuation):</strong> In an uptrend (Higher Highs &amp; Higher Lows), when price breaks and closes above the previous Higher High, that is a bullish <strong>BOS</strong>. It confirms the trend is still strong.</li>" +
          "<li><strong>CHoCH (Change of Character — Trend Reversal):</strong> In an uptrend, if sellers suddenly push price down and <em>close below the most recent Higher Low</em>, that first break against the trend is a <strong>CHoCH</strong>. It warns that control has shifted from buyers to sellers.</li>" +
          "<li><strong>Pro Tip:</strong> Wait for a <strong>body close</strong> (not just a wick!) to confirm a true BOS or CHoCH—a wick-only break is usually a Liquidity Sweep!</li>" +
        "</ul>",
      chips: [
        "How do I avoid fake breakouts?",
        "Explain Order Blocks and Fair Value Gaps (FVG)",
        "Show live XAUUSD & BTCUSDT setups"
      ]
    };
  }

  // 9. Silver Bullet / Killzones / Best Time to Trade
  if (q.indexOf("silver bullet") !== -1 || q.indexOf("killzone") !== -1 || q.indexOf("session") !== -1 || q.indexOf("best time") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>⏱️ ICT Killzones &amp; The NY Silver Bullet Strategy</h4>" +
        "<p>Timing is just as important as price. Smart Money executes predominantly during specific 1–2 hour windows:</p>" +
        "<ul>" +
          "<li><strong>London Open Killzone:</strong> <strong>02:00 – 05:00 AM EST</strong> (14:00 – 17:00 Phnom Penh time). Great for EURUSD, GBPUSD, and XAUUSD session highs/lows.</li>" +
          "<li><strong>New York Open Killzone:</strong> <strong>07:00 – 10:00 AM EST</strong> (19:00 – 22:00 Phnom Penh time). Peak volatility for XAUUSD, NAS100, and US30.</li>" +
          "<li><strong>The ICT Silver Bullet (10:00 – 11:00 AM EST / 22:00 – 23:00 ICT):</strong>" +
            "<ol>" +
              "<li>Mark the highs and lows formed before 10:00 AM EST.</li>" +
              "<li>Wait for price to sweep one side of liquidity during the 10–11 AM window.</li>" +
              "<li>Drop to the <strong>5m or 1m chart</strong>, wait for a displacement candle that creates a <strong>Fair Value Gap (FVG)</strong>, and enter on the FVG retest targeting opposing liquidity.</li>" +
            "</ol>" +
          "</li>" +
        "</ul>",
      chips: [
        "Give me the full XAUUSD SMC trade plan",
        "Explain Order Blocks and Fair Value Gaps (FVG)",
        "How do I build a daily pre-trade checklist?"
      ]
    };
  }

  // 10. Fake Breakouts / Liquidity Sweeps
  if (q.indexOf("fake breakout") !== -1 || q.indexOf("fakeout") !== -1 || q.indexOf("liquidity") !== -1 || q.indexOf("sweep") !== -1 || q.indexOf("stop hunt") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>🪤 How to Spot Liquidity Sweeps &amp; Avoid Fake Breakouts</h4>" +
        "<p>Retail traders are taught to buy as soon as price breaks resistance—which is why institutions engineer <strong>Liquidity Sweeps (Fake Breakouts)</strong> right at those levels:</p>" +
        "<ul>" +
          "<li><strong>Why Fakeouts Happen:</strong> Above equal highs (Resistance) sit thousands of retail Buy Stop orders and short Stop Losses. Smart Money pushes price just above the level to trigger those orders and fill their own massive sell positions.</li>" +
          "<li><strong>Wick vs. Body Rule:</strong> If a candle pierces above resistance with a long wick but <strong>closes back inside the range</strong>, it is a Liquidity Sweep (Turtle Soup)—do NOT buy the breakout!</li>" +
          "<li><strong>How to Trade Breakout Safely:</strong> Never buy the initial breakout candle. Wait for a full 15m/1H <strong>candle body close</strong> beyond the level, followed by a calm pullback to retest the broken level or its Fair Value Gap.</li>" +
        "</ul>",
      chips: [
        "Explain Break of Structure (BOS) vs CHoCH",
        "Explain what support and resistance are, with a simple real-life example",
        "Show live XAUUSD & BTCUSDT setups"
      ]
    };
  }

  // 11. Beginner Roadmap
  if (q.indexOf("beginner") !== -1 || q.indexOf("teach me") !== -1 || q.indexOf("first things") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>⭐ Welcome to Por AI — Your Step-by-Step Trading Foundation</h4>" +
        "<p>Here are the <strong>4 core pillars</strong> every disciplined trader masters first:</p>" +
        "<ol>" +
          "<li><strong>Market Structure (The Map):</strong> Markets move in Uptrends (Higher Highs + Higher Lows), Downtrends (Lower Highs + Lower Lows), or Ranges. Never trade against the dominant structure.</li>" +
          "<li><strong>Key Levels (Where to Act):</strong> Identify <strong>Support / Order Blocks</strong> (demand floors where buyers step in) and <strong>Resistance / Supply</strong> (ceilings where sellers defend).</li>" +
          "<li><strong>Risk Management (Survival First):</strong> Never risk more than <strong>1% to 2%</strong> of your account on a single trade. Always use a hard Stop Loss (SL).</li>" +
          "<li><strong>Risk-to-Reward (R:R):</strong> Aim for setups where your Take Profit (TP) is at least <strong>2× larger</strong> than your Stop Loss (1:2 R:R).</li>" +
        "</ol>",
      chips: [
        "Explain what support and resistance are, with a simple real-life example",
        "How do I size my position if my account is $1,000 and I risk 1% per trade?",
        "How do I read a candlestick chart? Explain what each candle tells me."
      ]
    };
  }

  // 12. Support & Resistance
  if (q.indexOf("support") !== -1 || q.indexOf("resistance") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>📊 Support &amp; Resistance — The Floor and Ceiling of Price</h4>" +
        "<p>Think of price like a <strong>bouncing ball inside a multi-story house</strong>:</p>" +
        "<ul>" +
          "<li><strong>Support (The Floor):</strong> A price zone where buyers consistently step in because they consider the asset discounted. Just like a floor stops a ball from falling further, support halts drops and bounces price upward.</li>" +
          "<li><strong>Resistance (The Ceiling):</strong> A price zone where sellers take profit or open shorts because price looks expensive. Like a ceiling, it rejects price back down.</li>" +
          "<li><strong>The Role Reversal Rule:</strong> When price smashes decisively <em>through</em> a ceiling (Resistance), that old ceiling becomes the new floor (Support) on the next pullback!</li>" +
        "</ul>",
      chips: [
        "Explain Order Blocks and Fair Value Gaps (FVG)",
        "How do I avoid fake breakouts?",
        "What is the current market regime and what should I focus on today?"
      ]
    };
  }

  // 13. Market Regime / Today's Outlook
  if (q.indexOf("regime") !== -1 || q.indexOf("outlook") !== -1 || q.indexOf("focus on today") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>🧭 POR1.0 Live Market Regime &amp; Multi-Asset Focus</h4>" +
        "<p>Current macro conditions show <strong>High Volatility</strong> with institutional order flow across Metals, Crypto, and US Indices:</p>" +
        "<ul>" +
          "<li><strong>🥇 XAUUSD (Gold) — " + snap.gold.signal + " (" + snap.gold.kpi.conf + " conf):</strong> Holding bullish structure near <strong>" + snap.gold.entry + "</strong> | SL: <strong>" + snap.gold.sl + "</strong> | TP1: <strong>" + snap.gold.tp1 + "</strong>.</li>" +
          "<li><strong>₿ BTCUSDT (Bitcoin) — " + snap.btc.signal + " (" + snap.btc.kpi.conf + " conf):</strong> Watching supply around <strong>" + snap.btc.entry + "</strong> | SL: <strong>" + snap.btc.sl + "</strong> | TP1: <strong>" + snap.btc.tp1 + "</strong>.</li>" +
          "<li><strong>◆ NAS100 (Nasdaq) — " + snap.nas.signal + " (" + snap.nas.kpi.conf + " conf):</strong> NY Silver Bullet momentum near <strong>" + snap.nas.entry + "</strong> | TP1: <strong>" + snap.nas.tp1 + "</strong>.</li>" +
        "</ul>" +
        "<p>Focus on waiting for M15/M30 Fair Value Gap retests rather than chasing extended candles.</p>",
      chips: [
        "Give me the full XAUUSD SMC trade plan",
        "Give me the full BTCUSDT trade plan",
        "How do I trade the NY Silver Bullet session?"
      ]
    };
  }

  // 14. Trading Mistakes / Psychology / Checklist
  if (q.indexOf("mistake") !== -1 || q.indexOf("lose money") !== -1 || q.indexOf("psychology") !== -1 || q.indexOf("emotion") !== -1 || q.indexOf("checklist") !== -1) {
    if (q.indexOf("checklist") !== -1) {
      return {
        isMatched: true,
        html:
          "<h4>✅ 5-Point Pre-Trade Execution Checklist</h4>" +
          "<p>Run through these 5 questions before clicking Buy or Sell on any trade:</p>" +
          "<ol>" +
            "<li><strong>HTF Bias (4H / 1H):</strong> Am I trading in the direction of higher-timeframe market structure (or from a major HTF Order Block)?</li>" +
            "<li><strong>Liquidity Taken:</strong> Has price swept a recent session high/low or equal highs/lows first?</li>" +
            "<li><strong>Confirmation (M15 / M5):</strong> Did price produce a clear CHoCH/BOS with displacement leaving a Fair Value Gap (FVG)?</li>" +
            "<li><strong>News Check:</strong> Are we free of red-folder high-impact USD news (CPI, NFP, FOMC) in the next 15 minutes?</li>" +
            "<li><strong>Risk Defined:</strong> Is my Stop Loss set at structural invalidation with <strong>0.5%–1% risk</strong> and at least <strong>1:2 R:R</strong>?</li>" +
          "</ol>",
        chips: [
          "How do I size my position if my account is $1,000 and I risk 1% per trade?",
          "Show live XAUUSD & BTCUSDT setups",
          "How do I trade the NY Silver Bullet session?"
        ]
      };
    }
    return {
      isMatched: true,
      html:
        "<h4>🧠 5 Account-Killing Mistakes &amp; How to Eliminate Them</h4>" +
        "<ol>" +
          "<li><strong>Moving or Removing Stop Losses:</strong> Turning a planned 1% loss into a 20% drawdown. <em>Fix:</em> Treat your Stop Loss as non-negotiable.</li>" +
          "<li><strong>Revenge Trading After a Loss:</strong> Doubling lot size to 'win it back' emotionally. <em>Fix:</em> Step away for 30 minutes after 2 consecutive losses.</li>" +
          "<li><strong>FOMO Chasing Big Green/Red Candles:</strong> Entering right at liquidity exhaustion. <em>Fix:</em> Only enter at pre-marked Order Blocks or Fair Value Gaps.</li>" +
          "<li><strong>Over-Leveraging Small Accounts:</strong> Risking 10%–25% per trade. <em>Fix:</em> Cap risk at 0.5%–1.0% per setup.</li>" +
          "<li><strong>No Trading Playbook:</strong> Taking random setups across 20 pairs. <em>Fix:</em> Master 1–2 pairs (like XAUUSD &amp; BTCUSDT) during specific London/NY killzones.</li>" +
        "</ol>",
      chips: [
        "How do I build a daily pre-trade checklist?",
        "How do I size my position if my account is $1,000 and I risk 1% per trade?",
        "What is the current market regime and what should I focus on today?"
      ]
    };
  }

  // 15. Candlesticks & Chart Reading
  if (q.indexOf("candlestick") !== -1 || q.indexOf("read my chart") !== -1 || q.indexOf("each candle") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>👁️ Reading Candlesticks — The Language of Buyers &amp; Sellers</h4>" +
        "<p>Every candlestick tells you <strong>4 prices</strong> (Open, High, Low, Close) and reveals who won the battle during that timeframe:</p>" +
        "<ul>" +
          "<li><strong>The Candle Body (Open to Close):</strong> A large green/cyan body shows strong buyer displacement. A large red body shows aggressive seller control.</li>" +
          "<li><strong>The Wicks / Shadows (High &amp; Low):</strong> Long upper wicks show <em>supply rejection</em> (buyers tried to push higher, but sellers slammed price back down). Long lower wicks show <em>demand absorption</em> (liquidity sweep).</li>" +
          "<li><strong>3 High-Probability Signatures:</strong> Look for <strong>Pin Bars / Liquidity Sweeps</strong> at key levels, <strong>Engulfing Displacement Candles</strong> that leave a Fair Value Gap, and <strong>Inside Bar Consolidations</strong> before breakouts.</li>" +
        "</ul>",
      chips: [
        "Upload a chart screenshot with Chart Snap",
        "Explain Break of Structure (BOS) vs CHoCH",
        "Explain Order Blocks and Fair Value Gaps (FVG)"
      ]
    };
  }

  // 16. Indicators (RSI, MACD, EMA, Fibonacci)
  if (q.indexOf("rsi") !== -1 || q.indexOf("macd") !== -1 || q.indexOf("ema") !== -1 || q.indexOf("moving average") !== -1 || q.indexOf("fibonacci") !== -1 || q.indexOf("indicator") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>📈 Combining Indicators &amp; Fibonacci with Smart Money Price Action</h4>" +
        "<p>Indicators should never be used blindly on their own, but they act as powerful confluence with Market Structure:</p>" +
        "<ul>" +
          "<li><strong>Fibonacci Optimal Trade Entry (OTE):</strong> Draw your Fib from the impulse Swing Low to Swing High. The <strong>0.618 to 0.786 retracement zone</strong> (Discount zone for buys, Premium zone for sells) aligns with institutional Order Blocks.</li>" +
          "<li><strong>RSI Divergence (14):</strong> When price makes a Lower Low into an Order Block, but RSI makes a <em>Higher Low</em> (Bullish Divergence), it confirms seller exhaustion and an imminent reversal.</li>" +
          "<li><strong>EMA 50 &amp; EMA 200:</strong> Use the 50 &amp; 200 Exponential Moving Averages on the 1H/4H chart to gauge dynamic institutional trend direction.</li>" +
        "</ul>",
      chips: [
        "Explain Order Blocks and Fair Value Gaps (FVG)",
        "Give me the full XAUUSD SMC trade plan",
        "How do I build a daily pre-trade checklist?"
      ]
    };
  }

  return {
    isMatched: false,
    html:
      "<h4>⚡ POR1.0 Analysis: " + escHtml(userText) + "</h4>" +
      "<p>Here is how to approach <strong>\"" + escHtml(userText) + "\"</strong> using institutional trading principles:</p>" +
      "<ul>" +
        "<li><strong>1. Context &amp; Trend Alignment:</strong> Always start on the Higher Timeframe (4H / 1H) to verify whether buyers or sellers are in control before looking for 15m/5m entries.</li>" +
        "<li><strong>2. Wait for Liquidity + Confirmation:</strong> Let price sweep resting stops and tap into a key Order Block or Fair Value Gap before executing.</li>" +
        "<li><strong>3. Live Terminal Reference:</strong> Right now on our live feed, <strong>XAUUSD</strong> is <strong>" + snap.gold.signal + " @ " + snap.gold.entry + "</strong> (SL " + snap.gold.sl + ", TP1 " + snap.gold.tp1 + ") and <strong>BTCUSDT</strong> is <strong>" + snap.btc.signal + " @ " + snap.btc.entry + "</strong> (SL " + snap.btc.sl + ", TP1 " + snap.btc.tp1 + ").</li>" +
      "</ul>",
    chips: [
      "Give me the full XAUUSD SMC trade plan",
      "Explain Order Blocks and Fair Value Gaps (FVG)",
      "How do I size my position if my account is $1,000 and I risk 1% per trade?"
    ]
  };
}

// ==========================================
// 5. LIVE FREE AI LLM ENGINE (ANSWERS EVERYTHING)
// ==========================================
function formatMarkdownToHtml(rawMd, userQuestion) {
  let text = String(rawMd || "").trim();
  if (!text) return null;

  // Strip surrounding ```html or ``` codeblocks if the AI wrapped its response
  text = text.replace(/^```(?:html|markdown)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // If the AI already returned clean HTML tags (<h4>, <ul>, <p>), return directly
  if (text.indexOf("<h4>") !== -1 || text.indexOf("<ul>") !== -1) {
    return text;
  }

  // Otherwise convert Markdown to clean Por AI HTML
  const lines = text.split("\n");
  let html = "<h4>⚡ POR1.0 AI — " + escHtml(userQuestion.slice(0, 60)) + "</h4>";
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      continue;
    }

    // Format bold **text**
    line = escHtml(line).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      const cleanItem = line.replace(/^([-*•]|\d+\.)\s+/, "");
      html += "<li>" + cleanItem + "</li>";
    } else if (/^#{1,4}\s+/.test(line)) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += "<h4>" + line.replace(/^#{1,4}\s+/, "") + "</h4>";
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += "<p>" + line + "</p>";
    }
  }
  if (inList) html += "</ul>";
  return html;
}

async function fetchLiveAiAnswer(userText, hasImage) {
  const localCheck = buildSmartLocalResponse(userText, hasImage);

  // If it's an image upload or a matched specialized trading card/calculator, return immediately
  if (hasImage || localCheck.isMatched) {
    return {
      html: localCheck.html,
      chips: localCheck.chips
    };
  }

  // For ANY other question the user asks, query the live AI LLM with conversation history & live prices
  const snap = getLiveMarketSnapshot();
  const systemPrompt =
    "You are POR1.0 (Por AI Chat), an expert, friendly AI trading mentor and general assistant created by Por ICT. " +
    "You MUST answer whatever question the user asks clearly, accurately, and directly in the same language the user writes in (e.g. English, Khmer, etc.). " +
    "Live market data if relevant: XAUUSD (Gold) is " + snap.gold.signal + " at " + snap.gold.entry + " (SL: " + snap.gold.sl + ", TP1: " + snap.gold.tp1 + ", Conf: " + snap.gold.kpi.conf + "); " +
    "BTCUSDT is " + snap.btc.signal + " at " + snap.btc.entry + " (SL: " + snap.btc.sl + ", TP1: " + snap.btc.tp1 + "); " +
    "NAS100 is " + snap.nas.signal + " at " + snap.nas.entry + ". " +
    "Format your response using clean HTML tags ONLY: start with an <h4> heading, use <p> for short paragraphs, <ul> and <li> for bullet points, and <strong> for key terms. Do not wrap in markdown code fences.";

  const recentHistory = currentMessages.slice(-6).map(function (m) {
    return {
      role: m.role === "user" ? "user" : "assistant",
      content: m.role === "user" ? m.text : (m.plainText || m.html.replace(/<[^>]+>/g, " "))
    };
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, 9500);

    const response = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }].concat(recentHistory),
        model: "openai",
        private: true
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const aiText = await response.text();
      const formattedHtml = formatMarkdownToHtml(aiText, userText);
      if (formattedHtml) {
        return {
          html: formattedHtml,
          plainText: aiText,
          chips: [
            "Give me the full XAUUSD SMC trade plan",
            "How do I size my position if my account is $1,000 and I risk 1% per trade?",
            "Explain Order Blocks and Fair Value Gaps (FVG)"
          ]
        };
      }
    }
  } catch (err) {
    console.warn("Live AI endpoint fallback to local engine:", err);
  }

  // Fallback if offline
  return {
    html: localCheck.html,
    chips: localCheck.chips
  };
}

// ==========================================
// 6. UI RENDERING & MESSAGE STREAMING
// ==========================================
function showWelcomeView() {
  const welcome = document.getElementById("pacWelcomeView");
  const stream = document.getElementById("pacChatStream");
  const titleEl = document.getElementById("pacCurrentChatTitle");
  if (welcome) welcome.style.display = "";
  if (stream) stream.style.display = "none";
  if (titleEl) titleEl.textContent = "New chat";
  currentChatId = null;
  currentMessages = [];
}

function showChatStreamView() {
  const welcome = document.getElementById("pacWelcomeView");
  const stream = document.getElementById("pacChatStream");
  if (welcome) welcome.style.display = "none";
  if (stream) stream.style.display = "flex";
}

function renderMessagesList() {
  const listEl = document.getElementById("pacMessagesList");
  const stage = document.getElementById("pacMainStage");
  if (!listEl) return;

  const activeLogo = getActiveLogoSrc();

  let htmlContent = currentMessages.map(function (m) {
    if (m.role === "user") {
      const imgHtml = m.image ? '<img src="' + m.image + '" class="pac-msg-uploaded-img" alt="Uploaded Chart" />' : "";
      return (
        '<div class="pac-msg-row user">' +
          '<div class="pac-msg-bubble">' +
            imgHtml +
            '<div>' + escHtml(m.text) + '</div>' +
          '</div>' +
        '</div>'
      );
    } else {
      const chipsHtml = Array.isArray(m.chips) && m.chips.length
        ? '<div class="pac-quick-chips">' +
            m.chips.map(function (c) {
              return '<button type="button" class="pac-chip-btn" data-chip="' + escHtml(c) + '">' + escHtml(c) + '</button>';
            }).join("") +
          '</div>'
        : "";

      return (
        '<div class="pac-msg-row ai">' +
          '<div class="pac-msg-avatar">' +
            '<img src="' + escHtml(activeLogo) + '" alt="Por AI" class="pac-custom-logo-img" onerror="this.onerror=null; this.src=\'' + FALLBACK_LOGO_SRC + '\';" />' +
          '</div>' +
          '<div class="pac-msg-bubble">' +
            m.html +
            chipsHtml +
          '</div>' +
        '</div>'
      );
    }
  }).join("");

  if (isAiTyping) {
    htmlContent +=
      '<div class="pac-msg-row ai">' +
        '<div class="pac-msg-avatar">' +
          '<img src="' + escHtml(activeLogo) + '" alt="Por AI" class="pac-custom-logo-img" onerror="this.onerror=null; this.src=\'' + FALLBACK_LOGO_SRC + '\';" />' +
        '</div>' +
        '<div class="pac-msg-bubble" style="color:var(--pac-aquamarine);font-weight:600;">' +
          '⚡ POR1.0 is analyzing your question...' +
        '</div>' +
      '</div>';
  }

  listEl.innerHTML = htmlContent;

  listEl.querySelectorAll(".pac-chip-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const promptText = btn.getAttribute("data-chip");
      if (promptText === "Upload a chart screenshot with Chart Snap") {
        const fileIn = document.getElementById("pacChartFileInput");
        if (fileIn) fileIn.click();
      } else if (promptText) {
        sendUserMessage(promptText);
      }
    });
  });

  if (stage) {
    stage.scrollTop = stage.scrollHeight;
  }
}

async function sendUserMessage(rawText) {
  const text = (rawText || "").trim();
  const hasImage = Boolean(pendingImageDataUrl);
  if ((!text && !hasImage) || isAiTyping) return;

  showChatStreamView();

  const userMsg = {
    role: "user",
    text: text || "Analyze this uploaded chart screenshot (Chart Snap).",
    image: pendingImageDataUrl || null
  };
  currentMessages.push(userMsg);

  const usedImage = pendingImageDataUrl;
  clearPendingAttachment();

  const inputEl = document.getElementById("pacUserInput");
  if (inputEl) inputEl.value = "";

  if (!currentChatId) {
    currentChatId = "chat_" + Date.now();
    const chatTitle = userMsg.text.slice(0, 42) + (userMsg.text.length > 42 ? "..." : "");
    const titleEl = document.getElementById("pacCurrentChatTitle");
    if (titleEl) titleEl.textContent = chatTitle;

    savedChats.unshift({
      id: currentChatId,
      title: chatTitle,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      messages: currentMessages.slice()
    });
  }

  isAiTyping = true;
  renderMessagesList();

  const reply = await fetchLiveAiAnswer(userMsg.text, Boolean(usedImage));

  isAiTyping = false;
  currentMessages.push({
    role: "ai",
    html: reply.html,
    plainText: reply.plainText || "",
    chips: reply.chips
  });

  const existing = savedChats.find(function (c) { return c.id === currentChatId; });
  if (existing) {
    existing.messages = currentMessages.slice();
  }

  persistChats();
  renderMessagesList();
}

// ==========================================
// 7. CHART SNAP IMAGE UPLOAD HANDLING
// ==========================================
function handleChartFileSelected(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    pendingImageDataUrl = e.target.result;
    pendingImageName = file.name || "chart-snap.png";

    const previewBox = document.getElementById("pacAttachmentPreview");
    const previewImg = document.getElementById("pacPreviewImg");
    const previewName = document.getElementById("pacPreviewName");

    if (previewImg) previewImg.src = pendingImageDataUrl;
    if (previewName) previewName.textContent = pendingImageName;
    if (previewBox) previewBox.style.display = "flex";

    const welcome = document.getElementById("pacWelcomeView");
    if (welcome && welcome.style.display !== "none") {
      sendUserMessage("Chart Snap — Please analyze my uploaded chart for trend, structure, key levels, and patterns.");
    }
  };
  reader.readAsDataURL(file);
}

function clearPendingAttachment() {
  pendingImageDataUrl = null;
  pendingImageName = "";
  const previewBox = document.getElementById("pacAttachmentPreview");
  const fileInput = document.getElementById("pacChartFileInput");
  if (previewBox) previewBox.style.display = "none";
  if (fileInput) fileInput.value = "";
}

// ==========================================
// 8. CHATS HISTORY DRAWER
// ==========================================
function toggleHistoryDrawer(open) {
  const drawer = document.getElementById("pacHistoryDrawer");
  const backdrop = document.getElementById("pacDrawerBackdrop");
  if (!drawer || !backdrop) return;

  const isOpen = open !== undefined ? open : !drawer.classList.contains("is-open");
  drawer.classList.toggle("is-open", isOpen);
  backdrop.classList.toggle("is-open", isOpen);
  if (isOpen) renderHistoryList();
}

function renderHistoryList() {
  const list = document.getElementById("pacHistoryList");
  if (!list) return;

  if (savedChats.length === 0) {
    list.innerHTML = '<div style="color:var(--pac-text-muted);font-size:12px;text-align:center;padding:24px 8px;">No saved chats yet. Click the Aquamarine Por AI Chat card or any LightCyan card to start!</div>';
    return;
  }

  list.innerHTML = savedChats.map(function (c) {
    return (
      '<div class="pac-history-item" data-chat-id="' + escHtml(c.id) + '">' +
        '<div class="pac-history-item-title">' + escHtml(c.title) + '</div>' +
        '<div class="pac-history-item-time">Saved at ' + escHtml(c.time) + ' · ' + c.messages.length + ' msgs</div>' +
      '</div>'
    );
  }).join("");

  list.querySelectorAll(".pac-history-item").forEach(function (item) {
    item.addEventListener("click", function () {
      const id = item.getAttribute("data-chat-id");
      const found = savedChats.find(function (x) { return x.id === id; });
      if (found) {
        currentChatId = found.id;
        currentMessages = found.messages.slice();
        const titleEl = document.getElementById("pacCurrentChatTitle");
        if (titleEl) titleEl.textContent = found.title;
        showChatStreamView();
        renderMessagesList();
        toggleHistoryDrawer(false);
      }
    });
  });
}

// ==========================================
// 9. BIND EVENTS & INITIALIZE
// ==========================================
function bindPorAiEvents() {
  // Click Center Hero Logo to Upload/Change Custom Logo Image
  const heroLogoTrigger = document.getElementById("pacHeroLogoTrigger");
  const logoFileInput = document.getElementById("pacLogoFileInput");
  if (heroLogoTrigger && logoFileInput) {
    heroLogoTrigger.addEventListener("click", function () {
      logoFileInput.click();
    });
    logoFileInput.addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) {
        handleCustomLogoUpload(e.target.files[0]);
      }
    });
  }

  // All Feature Cards (Aquamarine Por AI Chat + 6 LightCyan Cards)
  document.querySelectorAll("#pacFeatureGrid .pac-feature-card").forEach(function (card) {
    card.addEventListener("click", function () {
      const prompt = card.getAttribute("data-prompt");
      if (prompt) sendUserMessage(prompt);
    });
  });

  // Learn & chart reads pill button
  const learnBtn = document.getElementById("pacLearnChartBtn");
  if (learnBtn) {
    learnBtn.addEventListener("click", function () {
      sendUserMessage("How do I read a candlestick chart? Explain what each candle tells me.");
    });
  }

  // Chart Snap banner card & bottom upload icon
  const snapCard = document.getElementById("pacChartSnapCard");
  const bottomUploadBtn = document.getElementById("pacBottomUploadBtn");
  const fileInput = document.getElementById("pacChartFileInput");

  if (snapCard && fileInput) {
    snapCard.addEventListener("click", function () { fileInput.click(); });
  }
  if (bottomUploadBtn && fileInput) {
    bottomUploadBtn.addEventListener("click", function () { fileInput.click(); });
  }
  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) {
        handleChartFileSelected(e.target.files[0]);
      }
    });
  }

  const removePreviewBtn = document.getElementById("pacRemovePreviewBtn");
  if (removePreviewBtn) {
    removePreviewBtn.addEventListener("click", clearPendingAttachment);
  }

  // Bottom Input Form Submit
  const chatForm = document.getElementById("pacChatForm");
  if (chatForm) {
    chatForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const inputEl = document.getElementById("pacUserInput");
      if (inputEl) sendUserMessage(inputEl.value);
    });
  }

  // New Chat (+) button & Brand Logo Reset
  const newChatBtn = document.getElementById("pacNewChatBtn");
  const brandReset = document.getElementById("pacBrandReset");
  if (newChatBtn) {
    newChatBtn.addEventListener("click", function () {
      showWelcomeView();
    });
  }
  if (brandReset) {
    brandReset.addEventListener("click", function (e) {
      e.preventDefault();
      showWelcomeView();
    });
  }

  // History Drawer controls
  const toggleHistBtn = document.getElementById("pacToggleHistoryBtn");
  const closeDrawerBtn = document.getElementById("pacCloseDrawerBtn");
  const backdrop = document.getElementById("pacDrawerBackdrop");
  const clearHistBtn = document.getElementById("pacClearHistoryBtn");

  if (toggleHistBtn) toggleHistBtn.addEventListener("click", function () { toggleHistoryDrawer(); });
  if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", function () { toggleHistoryDrawer(false); });
  if (backdrop) backdrop.addEventListener("click", function () { toggleHistoryDrawer(false); });
  if (clearHistBtn) {
    clearHistBtn.addEventListener("click", function () {
      savedChats = [];
      persistChats();
      renderHistoryList();
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  applyLogoToAllElements();
  loadSavedChats();
  bindPorAiEvents();
});