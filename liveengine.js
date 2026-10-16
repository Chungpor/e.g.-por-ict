/**
 * Live Engine: shared market data + AI scan engine (no DOM access).
 * File: live-engine.js
 *
 * Load this BEFORE the page script:
 *   live-charts.html -> <script src="live-engine.js"></script> then live-charts.js
 *   index.html       -> <script src="live-engine.js"></script> then script.js
 *
 * Exposes globals: WATCHLIST_DB, TF_CONFIG, PLAYBOOK_NAMES, fmtPrice(),
 * computeDynamicAnalysisForAsset(). Output is simulated demo analysis, not financial advice.
 */
"use strict";

// ==========================================
// 2. 7 LIVE WATCHLIST & 4-LLM COUNCIL DATABASE
// ==========================================
const WATCHLIST_DB = [
  {
    symbol: "XAUUSD",
    tvSymbol: "OANDA:XAUUSD",
    name: "Gold",
    icon: "🥇",
    category: "Metals",
    signal: "BUY",
    price: 4175.99,
    baseAtr: 8.5,
    decimals: 2,
    bestPlaybook: "smc",
    baseConf: 78,
    baseWin: 62,
    baseInd: 68,
    readerScore: "Bullish +40",
    structureTag: "Uptrend (HH + HL)",
    readerSummary: "Chart reads bullish (strong): bullish market structure. Key support at 4,167.84.",
    rr: "R:R 1.3 / 2.0 / 2.8",
    entry: "4,175.99",
    sl: "4,165.98",
    tp1: "4,188.59",
    tp2: "4,196.02",
    tp3: "4,204.03",
    regime: ["contracting vol", "strong trend", "confluence +6"],
    kpi: { conf: "78%", win: "62%", ind: "68%", risk: "100%" },
    observations: [],
    agents: []
  },
  {
    symbol: "BTCUSDT",
    tvSymbol: "BINANCE:BTCUSDT",
    name: "Bitcoin",
    icon: "₿",
    category: "Crypto",
    signal: "SELL",
    price: 81911.66,
    baseAtr: 620.0,
    decimals: 2,
    bestPlaybook: "smc",
    baseConf: 76,
    baseWin: 58,
    baseInd: 62,
    readerScore: "Bearish -35",
    structureTag: "Lower Highs (LH + LL)",
    readerSummary: "Chart reads bearish: resistance sweep at 82,450 with M15 bearish displacement.",
    rr: "R:R 1.5 / 2.2 / 3.0",
    entry: "81,911.66",
    sl: "82,650.00",
    tp1: "80,800.00",
    tp2: "80,150.00",
    tp3: "79,400.00",
    regime: ["high vol", "bearish displacement", "confluence +6"],
    kpi: { conf: "76%", win: "58%", ind: "62%", risk: "95%" },
    observations: [],
    agents: []
  },
  {
    symbol: "ETHUSDT",
    tvSymbol: "BINANCE:ETHUSDT",
    name: "Ethereum",
    icon: "Ξ",
    category: "Crypto",
    signal: "SELL",
    price: 2424.26,
    baseAtr: 34.0,
    decimals: 2,
    bestPlaybook: "trend",
    baseConf: 71,
    baseWin: 55,
    baseInd: 59,
    readerScore: "Bearish -28",
    structureTag: "Range Breakdown",
    readerSummary: "Chart reads bearish: trading below EMA50 with supply overhead at 2,460.",
    rr: "R:R 1.4 / 2.1 / 2.9",
    entry: "2,424.26",
    sl: "2,468.00",
    tp1: "2,365.00",
    tp2: "2,330.00",
    tp3: "2,290.00",
    regime: ["weak RS", "EMA50 rejection", "confluence +5"],
    kpi: { conf: "71%", win: "55%", ind: "59%", risk: "92%" },
    observations: [],
    agents: []
  },
  {
    symbol: "EURUSD",
    tvSymbol: "FX:EURUSD",
    name: "Euro / USD",
    icon: "€",
    category: "Forex",
    signal: "SELL",
    price: 1.0920,
    baseAtr: 0.0032,
    decimals: 4,
    bestPlaybook: "ict",
    baseConf: 74,
    baseWin: 57,
    baseInd: 61,
    readerScore: "Bearish -22",
    structureTag: "London Sweep",
    readerSummary: "DXY strength pressuring EURUSD below 1.0940 session liquidity.",
    rr: "R:R 1.4 / 2.0 / 2.8",
    entry: "1.0920",
    sl: "1.0958",
    tp1: "1.0865",
    tp2: "1.0835",
    tp3: "1.0805",
    regime: ["PDH swept", "DXY bid", "confluence +6"],
    kpi: { conf: "74%", win: "57%", ind: "61%", risk: "100%" },
    observations: [],
    agents: []
  },
  {
    symbol: "GBPUSD",
    tvSymbol: "FX:GBPUSD",
    name: "Pound / USD",
    icon: "£",
    category: "Forex",
    signal: "HOLD",
    price: 1.2810,
    baseAtr: 0.0038,
    decimals: 4,
    bestPlaybook: "smc",
    baseConf: 63,
    baseWin: 51,
    baseInd: 53,
    readerScore: "Neutral +5",
    structureTag: "Consolidation",
    readerSummary: "GBPUSD equilibrating inside 1.2780-1.2845 range; await breakout displacement.",
    rr: "R:R 1.5 / 2.2 / 3.0",
    entry: "1.2810",
    sl: "1.2765",
    tp1: "1.2875",
    tp2: "1.2910",
    tp3: "1.2950",
    regime: ["equilibrium 50%", "range bound", "confluence +4"],
    kpi: { conf: "63%", win: "51%", ind: "53%", risk: "90%" },
    observations: [],
    agents: []
  },
  {
    symbol: "NAS100",
    tvSymbol: "PEPPERSTONE:NAS100",
    name: "Nasdaq 100",
    icon: "◆",
    category: "Indices",
    signal: "BUY",
    price: 20485.50,
    baseAtr: 105.0,
    decimals: 2,
    bestPlaybook: "ict",
    baseConf: 84,
    baseWin: 66,
    baseInd: 72,
    readerScore: "Bullish +44",
    structureTag: "Uptrend (HH + HL)",
    readerSummary: "Semiconductor & AI data-center inflows driving NAS100 above NY opening range.",
    rr: "R:R 1.5 / 2.3 / 3.2",
    entry: "20,485.50",
    sl: "20,360.00",
    tp1: "20,670.00",
    tp2: "20,780.00",
    tp3: "20,895.00",
    regime: ["NY Silver Bullet", "strong trend", "confluence +8"],
    kpi: { conf: "84%", win: "66%", ind: "72%", risk: "100%" },
    observations: [],
    agents: []
  },
  {
    symbol: "US30",
    tvSymbol: "PEPPERSTONE:US30",
    name: "Dow Jones",
    icon: "▲",
    category: "Indices",
    signal: "BUY",
    price: 43120.00,
    baseAtr: 145.0,
    decimals: 2,
    bestPlaybook: "trend",
    baseConf: 75,
    baseWin: 59,
    baseInd: 63,
    readerScore: "Bullish +36",
    structureTag: "Relative Strength",
    readerSummary: "US30 showing relative strength above 43,000 institutional demand zone.",
    rr: "R:R 1.4 / 2.1 / 2.9",
    entry: "43,120.00",
    sl: "42,950.00",
    tp1: "43,360.00",
    tp2: "43,490.00",
    tp3: "43,620.00",
    regime: ["demand defended", "EMA stack bull", "confluence +6"],
    kpi: { conf: "75%", win: "59%", ind: "63%", risk: "100%" },
    observations: [],
    agents: []
  }
];

// ==========================================
// 3. TIMEFRAMES, PLAYBOOKS & PRICE FORMAT
// ==========================================
const TF_CONFIG = {
  "1":   { label: "1m",  atrMult: 0.28, horizon: "Scalp",    timeLeft: "⏳ 12m left",     confMod: -3 },
  "5":   { label: "5m",  atrMult: 0.48, horizon: "Scalp",    timeLeft: "⏳ 25m left",     confMod: -1 },
  "15":  { label: "15m", atrMult: 0.75, horizon: "Scalp",    timeLeft: "⏳ 45m left",     confMod: 1 },
  "30":  { label: "30m", atrMult: 1.00, horizon: "Intraday", timeLeft: "⏳ 1h 30m left",  confMod: 2 },
  "60":  { label: "1h",  atrMult: 1.45, horizon: "Intraday", timeLeft: "⏳ 3h 15m left",  confMod: 4 },
  "240": { label: "4h",  atrMult: 2.35, horizon: "Swing",    timeLeft: "⏳ 11h 40m left", confMod: 5 },
  "D":   { label: "1d",  atrMult: 4.10, horizon: "Swing",    timeLeft: "⏳ 1d 18h left",  confMod: 6 }
};

const PLAYBOOK_NAMES = {
  auto: "Auto (AI Dynamic Selection)",
  smc: "SMC Order Block + FVG",
  ict: "ICT Judas Swing + Silver Bullet",
  trend: "EMA Momentum Continuation"
};

function fmtPrice(num, decimals) {
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ==========================================
// 4. DYNAMIC CHART ANALYSIS & LEVEL ENGINE
// ==========================================
function computeDynamicAnalysisForAsset(asset, tfKey, playbookMode, riskMode, horizonMode) {
  const tf = TF_CONFIG[tfKey] || TF_CONFIG["30"];
  const resolvedPlaybook = playbookMode === "auto" ? (asset.bestPlaybook || "smc") : playbookMode;
  const playbookLabel = PLAYBOOK_NAMES[resolvedPlaybook] || PLAYBOOK_NAMES.smc;

  let slMult = 1.15;
  let rr1 = 1.4, rr2 = 2.2, rr3 = 3.1;
  let riskScoreStr = "100%";

  if (riskMode.indexOf("Low") !== -1) {
    slMult = 0.90;
    rr1 = 1.6; rr2 = 2.5; rr3 = 3.6;
    riskScoreStr = "100%";
  } else if (riskMode.indexOf("Aggressive") !== -1) {
    slMult = 1.40;
    rr1 = 1.3; rr2 = 2.0; rr3 = 2.8;
    riskScoreStr = "88%";
  } else {
    slMult = 1.12;
    rr1 = 1.4; rr2 = 2.1; rr3 = 3.0;
    riskScoreStr = asset.category === "Crypto" ? "95%" : "100%";
  }

  let horizonMult = 1.0;
  if (horizonMode.indexOf("Scalp") !== -1) horizonMult = 0.65;
  else if (horizonMode.indexOf("Swing") !== -1) horizonMult = 1.75;

  const effectiveAtr = asset.baseAtr * tf.atrMult * horizonMult;
  const slDist = Math.max(effectiveAtr * slMult, Math.pow(10, -asset.decimals) * 15);

  const p = asset.price;
  const isSell = asset.signal === "SELL";
  const dirSign = isSell ? -1 : 1;

  const slNum = p - dirSign * slDist;
  const tp1Num = p + dirSign * (slDist * rr1);
  const tp2Num = p + dirSign * (slDist * rr2);
  const tp3Num = p + dirSign * (slDist * rr3);

  const keyLevel = p - dirSign * (slDist * 0.68);
  const fvgLow = p - dirSign * (slDist * 0.25);
  const fvgHigh = p + dirSign * (slDist * 0.18);

  asset.entry = fmtPrice(p, asset.decimals);
  asset.sl = fmtPrice(slNum, asset.decimals);
  asset.tp1 = fmtPrice(tp1Num, asset.decimals);
  asset.tp2 = fmtPrice(tp2Num, asset.decimals);
  asset.tp3 = fmtPrice(tp3Num, asset.decimals);
  asset.rr = "R:R " + rr1.toFixed(1) + " / " + rr2.toFixed(1) + " / " + rr3.toFixed(1);

  const playbookBonus = resolvedPlaybook === asset.bestPlaybook ? 5 : 2;
  const jitter = Math.floor((Math.sin(p * 13.7) + 1) * 2);
  const confVal = Math.min(96, Math.max(58, asset.baseConf + tf.confMod + playbookBonus + jitter));
  const winVal = Math.min(82, Math.max(48, asset.baseWin + Math.round(tf.confMod * 0.7) + (playbookBonus > 3 ? 3 : 0)));
  const indVal = Math.min(90, Math.max(50, asset.baseInd + tf.confMod + jitter));
  const confluenceCount = Math.min(9, Math.max(4, Math.round((confVal - 45) / 6)));

  asset.kpi = {
    conf: confVal + "%",
    win: winVal + "%",
    ind: indVal + "%",
    risk: riskScoreStr
  };

  asset.CompositeScore = confVal + winVal * 0.5 + (rr2 * 10) + (asset.signal === "HOLD" ? -18 : 0);

  const scoreMag = Math.round((confVal - 45) * 1.1);
  const keyLevelStr = fmtPrice(keyLevel, asset.decimals);
  const fvgLowStr = fmtPrice(fvgLow, asset.decimals);
  const fvgHighStr = fmtPrice(fvgHigh, asset.decimals);

  if (asset.signal === "BUY") {
    asset.readerScore = "Bullish +" + scoreMag;
    asset.structureTag = resolvedPlaybook === "ict" ? ("NY Silver Bullet (" + tf.label + ")") : ("Uptrend (HH + HL · " + tf.label + ")");
    asset.readerSummary = tf.label + " scan bullish (" + playbookLabel + "): structure holding above " + keyLevelStr + " invalidation. Target TP1 " + asset.tp1 + ".";
  } else if (asset.signal === "SELL") {
    asset.readerScore = "Bearish -" + scoreMag;
    asset.structureTag = resolvedPlaybook === "ict" ? ("Judas Sweep (" + tf.label + ")") : ("Lower Highs (LH + LL · " + tf.label + ")");
    asset.readerSummary = tf.label + " scan bearish (" + playbookLabel + "): supply defending " + keyLevelStr + ". Downside magnet at " + asset.tp1 + ".";
  } else {
    asset.readerScore = "Neutral +" + Math.max(3, Math.round(scoreMag * 0.25));
    asset.structureTag = "Range Equilibrium (" + tf.label + ")";
    asset.readerSummary = tf.label + " scan neutral: equilibrating near " + asset.entry + ". Wait for displacement beyond " + keyLevelStr + " or " + asset.tp1 + ".";
  }

  asset.regime = [
    tf.label + " " + resolvedPlaybook.toUpperCase(),
    isSell ? "supply control" : "demand control",
    "confluence +" + confluenceCount
  ];

  if (isSell) {
    asset.observations = [
      {
        title: "📉 Bearish " + tf.label + " Structure (LH + LL)",
        text: "Price rejected premium supply near " + keyLevelStr + " — structure invalidation sits at SL " + asset.sl + "."
      },
      {
        title: "🟥 " + playbookLabel + " Trigger",
        text: "Unmitigated bearish zone between " + fvgHighStr + " and " + keyLevelStr + " capping intraday pullbacks."
      },
      {
        title: "💧 Sell-Side Liquidity Pool",
        text: "Resting stop clusters identified below " + asset.tp1 + " and " + asset.tp2 + " acting as primary downside draw on liquidity."
      },
      {
        title: "🌡️ Momentum & Volatility Filter",
        text: "Bearish order flow confirmed on " + tf.label + " with " + confVal + "% model confidence and " + asset.rr + " reward profile."
      }
    ];
  } else {
    asset.observations = [
      {
        title: "📈 Bullish " + tf.label + " Structure (HH + HL)",
        text: "Buyers defending higher-low support at " + keyLevelStr + " — structure invalidation sits below SL " + asset.sl + "."
      },
      {
        title: "🟩 " + playbookLabel + " Trigger",
        text: "Bullish displacement left an active demand imbalance at " + fvgLowStr + " to " + fvgHighStr + "."
      },
      {
        title: "💧 Buy-Side Liquidity Target",
        text: "Equal highs and buy-stops resting above " + asset.tp1 + " and " + asset.tp2 + " serve as the immediate institutional magnet."
      },
      {
        title: "🌡️ Momentum & Volatility Filter",
        text: "EMA20/50 stack aligned constructively on " + tf.label + " (" + confVal + "% confidence, confluence +" + confluenceCount + ")."
      }
    ];
  }

  const biasWord = isSell ? "Bearish" : (asset.signal === "HOLD" ? "Neutral-Bull" : "Bullish");
  const convLevel = confVal >= 76 ? "High conviction" : "Medium conviction";

  asset.agents = [
    {
      title: "📐 Technical Analyst",
      role: "Indicators, " + tf.label + " structure & " + resolvedPlaybook.toUpperCase(),
      bias: biasWord,
      conviction: convLevel,
      text: tf.label + " structure favors " + asset.signal + " continuation via " + playbookLabel + ". Key invalidation anchored at " + keyLevelStr + " with indicator confluence at " + asset.kpi.ind + "."
    },
    {
      title: "🌍 Fundamental Analyst",
      role: "Macro, rates & cross-asset flows",
      bias: biasWord,
      conviction: "Medium conviction",
      text: "Cross-asset liquidity and session flows align with " + asset.symbol + " " + asset.signal + " bias. Current " + horizonMode + " horizon supports holding toward " + asset.tp1 + "."
    },
    {
      title: "🧠 Sentiment Analyst",
      role: "Positioning & liquidity pools",
      bias: biasWord,
      conviction: convLevel,
      text: "Retail counter-trend positioning is trapped near " + asset.entry + ". Expect liquidity sweep through " + asset.tp1 + " (" + rr1.toFixed(1) + "R) before major rebalancing."
    },
    {
      title: "🛡️ Risk Manager",
      role: "Sizing, " + riskMode + " & exposure",
      bias: biasWord,
      conviction: "High conviction",
      text: "Mode: " + riskMode + ". Entry " + asset.entry + " | Adaptive SL " + asset.sl + " | Targets " + asset.tp1 + " / " + asset.tp2 + " / " + asset.tp3 + " (" + asset.rr + "). Confluence +" + confluenceCount + "."
    }
  ];
}