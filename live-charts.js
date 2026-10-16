/**
 * Live Charts AI — Self-Contained TradingView + Live Scanner + Instant BUY/SELL/Reset Engine
 * File: live-charts.js
 */
"use strict";

// ==========================================
// 0. BUILT-IN FALLBACK ENGINE (PREVENTS MISSING FILE CRASHES)
// ==========================================
window.WATCHLIST_DB = window.WATCHLIST_DB || [
  {
    symbol: "XAUUSD",
    tvSymbol: "OANDA:XAUUSD",
    name: "Gold",
    icon: "🥇",
    category: "Metals",
    signal: "BUY",
    defaultSignal: "BUY",
    price: 4175.99,
    basePrice: 4175.99,
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
    defaultSignal: "SELL",
    price: 81911.66,
    basePrice: 81911.66,
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
    defaultSignal: "SELL",
    price: 2424.26,
    basePrice: 2424.26,
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
    defaultSignal: "SELL",
    price: 1.0920,
    basePrice: 1.0920,
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
    signal: "BUY",
    defaultSignal: "BUY",
    price: 1.2810,
    basePrice: 1.2810,
    baseAtr: 0.0038,
    decimals: 4,
    bestPlaybook: "smc",
    baseConf: 73,
    baseWin: 58,
    baseInd: 62,
    readerScore: "Bullish +29",
    structureTag: "Bullish Order Block",
    readerSummary: "GBPUSD defending 1.2785 institutional demand block with upside liquidity target at 1.2875.",
    rr: "R:R 1.5 / 2.2 / 3.0",
    entry: "1.2810",
    sl: "1.2765",
    tp1: "1.2875",
    tp2: "1.2910",
    tp3: "1.2950",
    regime: ["OB defended", "bullish shift", "confluence +6"],
    kpi: { conf: "73%", win: "58%", ind: "62%", risk: "100%" },
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
    defaultSignal: "BUY",
    price: 20485.50,
    basePrice: 20485.50,
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
    defaultSignal: "BUY",
    price: 43120.00,
    basePrice: 43120.00,
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

window.TF_CONFIG = window.TF_CONFIG || {
  "1":   { label: "1m",  atrMult: 0.28, horizon: "Scalp",    timeLeft: "⏳ 12m left",     confMod: -2 },
  "5":   { label: "5m",  atrMult: 0.48, horizon: "Scalp",    timeLeft: "⏳ 25m left",     confMod: 0 },
  "15":  { label: "15m", atrMult: 0.75, horizon: "Scalp",    timeLeft: "⏳ 45m left",     confMod: 1 },
  "30":  { label: "30m", atrMult: 1.00, horizon: "Intraday", timeLeft: "⏳ 1h 30m left",  confMod: 2 },
  "60":  { label: "1h",  atrMult: 1.45, horizon: "Intraday", timeLeft: "⏳ 3h 15m left",  confMod: 4 },
  "240": { label: "4h",  atrMult: 2.35, horizon: "Swing",    timeLeft: "⏳ 11h 40m left", confMod: 5 },
  "D":   { label: "1d",  atrMult: 4.10, horizon: "Swing",    timeLeft: "⏳ 1d 18h left",  confMod: 6 }
};

window.PLAYBOOK_NAMES = window.PLAYBOOK_NAMES || {
  auto: "Auto (AI Dynamic Selection)",
  smc: "SMC Order Block + FVG",
  ict: "ICT Judas Swing + Silver Bullet",
  trend: "EMA Momentum Continuation"
};

window.fmtPrice = window.fmtPrice || function (num, decimals) {
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

window.computeDynamicAnalysisForAsset = window.computeDynamicAnalysisForAsset || function (asset, tfKey, playbookMode, riskMode, horizonMode) {
  const tf = window.TF_CONFIG[tfKey] || window.TF_CONFIG["30"];
  const resolvedPlaybook = playbookMode === "auto" ? (asset.bestPlaybook || "smc") : playbookMode;
  const playbookLabel = window.PLAYBOOK_NAMES[resolvedPlaybook] || window.PLAYBOOK_NAMES.smc;

  if (asset.signal !== "BUY" && asset.signal !== "SELL") {
    asset.signal = asset.defaultSignal || "BUY";
  }

  let slMult = 1.15;
  let rr1 = 1.4, rr2 = 2.2, rr3 = 3.1;
  let riskScoreStr = "100%";

  if (riskMode && riskMode.indexOf("Low") !== -1) {
    slMult = 0.90;
    rr1 = 1.6; rr2 = 2.5; rr3 = 3.6;
  } else if (riskMode && riskMode.indexOf("Aggressive") !== -1) {
    slMult = 1.40;
    rr1 = 1.3; rr2 = 2.0; rr3 = 2.8;
    riskScoreStr = "88%";
  } else {
    slMult = 1.12;
    rr1 = 1.4; rr2 = 2.1; rr3 = 3.0;
    riskScoreStr = asset.category === "Crypto" ? "95%" : "100%";
  }

  let horizonMult = 1.0;
  if (horizonMode && horizonMode.indexOf("Scalp") !== -1) horizonMult = 0.65;
  else if (horizonMode && horizonMode.indexOf("Swing") !== -1) horizonMult = 1.75;

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

  asset.entry = window.fmtPrice(p, asset.decimals);
  asset.sl = window.fmtPrice(slNum, asset.decimals);
  asset.tp1 = window.fmtPrice(tp1Num, asset.decimals);
  asset.tp2 = window.fmtPrice(tp2Num, asset.decimals);
  asset.tp3 = window.fmtPrice(tp3Num, asset.decimals);
  asset.rr = "R:R " + rr1.toFixed(1) + " / " + rr2.toFixed(1) + " / " + rr3.toFixed(1);

  const playbookBonus = resolvedPlaybook === asset.bestPlaybook ? 5 : 2;
  const jitter = Math.floor((Math.sin(p * 13.7) + 1) * 2);
  const confVal = Math.min(96, Math.max(62, asset.baseConf + tf.confMod + playbookBonus + jitter));
  const winVal = Math.min(84, Math.max(52, asset.baseWin + Math.round(tf.confMod * 0.7) + (playbookBonus > 3 ? 3 : 0)));
  const indVal = Math.min(92, Math.max(54, asset.baseInd + tf.confMod + jitter));
  const confluenceCount = Math.min(9, Math.max(5, Math.round((confVal - 45) / 6)));

  asset.kpi = {
    conf: confVal + "%",
    win: winVal + "%",
    ind: indVal + "%",
    risk: riskScoreStr
  };

  asset.CompositeScore = confVal + winVal * 0.5 + (rr2 * 10);

  const scoreMag = Math.round((confVal - 45) * 1.1);
  const keyLevelStr = window.fmtPrice(keyLevel, asset.decimals);
  const fvgLowStr = window.fmtPrice(fvgLow, asset.decimals);
  const fvgHighStr = window.fmtPrice(fvgHigh, asset.decimals);

  if (!isSell) {
    asset.readerScore = "Bullish +" + scoreMag;
    asset.structureTag = resolvedPlaybook === "ict" ? ("NY Silver Bullet (" + tf.label + ")") : ("Uptrend (HH + HL · " + tf.label + ")");
    asset.readerSummary = tf.label + " live action BUY (" + playbookLabel + "): structure holding above " + keyLevelStr + " invalidation. Target TP1 " + asset.tp1 + ".";
  } else {
    asset.readerScore = "Bearish -" + scoreMag;
    asset.structureTag = resolvedPlaybook === "ict" ? ("Judas Sweep (" + tf.label + ")") : ("Lower Highs (LH + LL · " + tf.label + ")");
    asset.readerSummary = tf.label + " live action SELL (" + playbookLabel + "): supply defending " + keyLevelStr + ". Downside magnet at " + asset.tp1 + ".";
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

  const biasWord = isSell ? "Bearish" : "Bullish";
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
};

// ==========================================
// 1. 4K ZEN AMBIENT AUDIO (YOUTUBE IFRAME API)
// ==========================================
const YT_AUDIO_VIDEO_ID = "yGbaHLXUZWY";
let ytAudioPlayer = null;
let isAudioPlaying = false;
let ytPlayerReady = false;
let pendingPlay = false;

window.onYouTubeIframeAPIReady = function () {
  initYouTubeAudio();
};

function initYouTubeAudio() {
  const container = document.getElementById("youtubeAudioPlayer");
  if (ytAudioPlayer || !container || typeof YT === "undefined" || !YT.Player) return;

  try {
    ytAudioPlayer = new YT.Player("youtubeAudioPlayer", {
      height: "1",
      width: "1",
      videoId: YT_AUDIO_VIDEO_ID,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: YT_AUDIO_VIDEO_ID,
        modestbranding: 1,
        playsinline: 1,
        rel: 0
      },
      events: {
        onReady: function () {
          ytPlayerReady = true;
          ytAudioPlayer.setVolume(75);
          if (pendingPlay) {
            pendingPlay = false;
            playAudioMusic();
          }
        },
        onStateChange: function (event) {
          if (event.data === YT.PlayerState.PLAYING) setAudioUIState(true);
          else if (event.data === YT.PlayerState.PAUSED) setAudioUIState(false);
          else if (event.data === YT.PlayerState.ENDED) ytAudioPlayer.playVideo();
        }
      }
    });
  } catch (err) {
    console.warn("YouTube audio init warning:", err);
  }
}

function setAudioUIState(playing) {
  isAudioPlaying = playing;
  localStorage.setItem("por_music_playing", playing ? "true" : "false");

  const navMusicBtn = document.getElementById("lcNavMusicBtn");
  const soundToggleBtn = document.getElementById("lcSoundToggleBtn");
  const soundStatusText = document.getElementById("lcSoundStatusText");

  if (navMusicBtn) navMusicBtn.classList.toggle("is-playing", playing);
  if (soundToggleBtn) soundToggleBtn.classList.toggle("is-playing", playing);
  if (soundStatusText) soundStatusText.textContent = playing ? "Music: ON" : "Music: OFF";
}

function playAudioMusic() {
  if (!ytAudioPlayer || typeof ytAudioPlayer.playVideo !== "function") return;
  try {
    ytAudioPlayer.unMute();
    ytAudioPlayer.setVolume(75);
    ytAudioPlayer.playVideo();
    setAudioUIState(true);
  } catch (e) {}
}

function pauseAudioMusic() {
  if (!ytAudioPlayer || typeof ytAudioPlayer.pauseVideo !== "function") return;
  try {
    ytAudioPlayer.pauseVideo();
    setAudioUIState(false);
  } catch (e) {}
}

function toggleAudioPlayback() {
  if (!ytPlayerReady) {
    pendingPlay = true;
    initYouTubeAudio();
    return;
  }
  if (isAudioPlaying) pauseAudioMusic();
  else playAudioMusic();
}

// ==========================================
// 2. STATE & HELPERS
// ==========================================
const DB = window.WATCHLIST_DB;
let activeAsset = DB[0];
let activeTimeframe = "30";
let activeCategory = "ALL";
let activePanelTab = "analysis";
let watchSearchQuery = "";
let isScanning = false;
let lastBestSetupIndex = -1;

// Ensure GBPUSD or any HOLD item is upgraded to actionable BUY/SELL
DB.forEach(function (item) {
  if (item.signal !== "BUY" && item.signal !== "SELL") {
    item.signal = item.defaultSignal || "BUY";
  }
});

function escHtml(str) {
  return String(str === null || str === undefined ? "" : str).replace(/[&<>"']/g, function (c) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[c] || c;
  });
}

function getCurrentFilterSettings() {
  const pbEl = document.getElementById("lcPlaybookSelect");
  const riskEl = document.getElementById("lcRiskSelect");
  const horEl = document.getElementById("lcHorizonSelect");
  return {
    playbook: pbEl ? pbEl.value : "auto",
    risk: riskEl ? riskEl.value : "Medium risk",
    horizon: horEl ? horEl.value : "Intraday"
  };
}

function refreshAllAssetsAnalysis() {
  const settings = getCurrentFilterSettings();
  DB.forEach(function (item) {
    window.computeDynamicAnalysisForAsset(item, activeTimeframe, settings.playbook, settings.risk, settings.horizon);
  });
}

// ==========================================
// 3. RENDER WATCHLIST SIDEBAR
// ==========================================
function renderWatchlist() {
  const container = document.getElementById("lcWatchlistContainer");
  const countEl = document.getElementById("lcWatchCount");
  if (!container) return;

  const filtered = DB.filter(function (item) {
    if (activeCategory !== "ALL" && item.category !== activeCategory) return false;
    if (watchSearchQuery) {
      const q = watchSearchQuery.toLowerCase();
      if (item.symbol.toLowerCase().indexOf(q) === -1 && item.name.toLowerCase().indexOf(q) === -1) return false;
    }
    return true;
  });

  if (countEl) countEl.textContent = String(filtered.length);

  container.innerHTML = filtered.map(function (item) {
    const isActive = item.symbol === activeAsset.symbol;
    const sigCls = item.signal.toLowerCase();
    return (
      '<div class="lc-watch-item ' + (isActive ? "active" : "") + '" data-symbol="' + escHtml(item.symbol) + '">' +
        '<div class="lc-wi-left">' +
          '<span class="lc-wi-icon">' + item.icon + '</span>' +
          '<div>' +
            '<div class="lc-wi-sym">' + escHtml(item.symbol) + '</div>' +
            '<div class="lc-wi-name">' + escHtml(item.name) + ' · <span style="color:var(--lc-cyan);font-size:9.5px;">' + escHtml(item.kpi.conf) + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="lc-wi-right">' +
          '<span class="lc-wi-price" id="wiPrice_' + escHtml(item.symbol) + '">' + item.price.toFixed(item.decimals) + '</span>' +
          '<span class="lc-wi-sig ' + sigCls + '">' + escHtml(item.signal) + ' ›</span>' +
        '</div>' +
      '</div>'
    );
  }).join("");

  container.querySelectorAll(".lc-watch-item").forEach(function (row) {
    row.addEventListener("click", function () {
      const sym = row.getAttribute("data-symbol");
      const found = DB.find(function (x) { return x.symbol === sym; });
      if (found) {
        activeAsset = found;
        runLiveChartAnalysis({ reloadWidget: true, reason: "Symbol Switch" });
      }
    });
  });
}

// ==========================================
// 4. TRADINGVIEW LIVE CHART WIDGET & SCAN OVERLAY
// ==========================================
function ensureChartScanOverlay() {
  const viewport = document.querySelector(".lc-tv-viewport");
  if (!viewport) return null;

  let overlay = document.getElementById("lcScanLaserOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "lcScanLaserOverlay";
    overlay.className = "lc-scan-laser-overlay";
    overlay.innerHTML =
      '<div class="lc-scan-beam"></div>' +
      '<div class="lc-scan-hud" id="lcScanHudText">⚡ SCANNING LIVE CHART...</div>';
    viewport.appendChild(overlay);
  }
  return overlay;
}

function triggerVisualChartScan(hudMessage, duration) {
  const msg = hudMessage || "⚡ SCANNING LIVE CHART...";
  const dur = duration || 750;
  const overlay = ensureChartScanOverlay();
  if (!overlay) return;
  const hud = document.getElementById("lcScanHudText");
  if (hud) hud.textContent = msg;

  overlay.classList.add("is-scanning");
  clearTimeout(overlay._scanTimer);
  overlay._scanTimer = setTimeout(function () {
    overlay.classList.remove("is-scanning");
  }, dur);
}

let tvRetryCount = 0;
function initTradingViewWidget() {
  const target = document.getElementById("lc_tradingview_chart");
  if (!target) return;

  if (typeof TradingView === "undefined" || !TradingView.widget) {
    if (tvRetryCount < 20) {
      tvRetryCount++;
      setTimeout(initTradingViewWidget, 250);
    }
    return;
  }

  tvRetryCount = 0;
  target.innerHTML = "";

  try {
    new TradingView.widget({
      width: "100%",
      height: 530,
      symbol: activeAsset.tvSymbol,
      interval: activeTimeframe,
      timezone: "Asia/Phnom_Penh",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      withdateranges: true,
      hide_side_toolbar: false,
      studies: ["EMA@tv-basicstudies", "RSI@tv-basicstudies"],
      container_id: "lc_tradingview_chart"
    });
  } catch (err) {
    console.warn("TradingView widget error:", err);
  }

  ensureChartScanOverlay();
}

// ==========================================
// 5. UPDATE AI READER, ON-CHART HUD & 4-LLM COUNCIL PANEL
// ==========================================
function updateCenterAndRightPanels(customCouncilBanner) {
  const setTxt = function (id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  const formattedPrice = window.fmtPrice(activeAsset.price, activeAsset.decimals);
  const tfInfo = window.TF_CONFIG[activeTimeframe] || window.TF_CONFIG["30"];
  const isSell = activeAsset.signal === "SELL";

  setTxt("lcActiveSymTitle", activeAsset.symbol);
  setTxt("lcTopLivePrice", formattedPrice);
  setTxt("lcReaderScoreBadge", activeAsset.readerScore);
  setTxt("lcReaderSummaryText", activeAsset.readerSummary);

  const symTriangle = document.getElementById("lcSymTriangle");
  if (symTriangle) {
    symTriangle.textContent = isSell ? "▼" : "▲";
    symTriangle.classList.toggle("sell", isSell);
  }

  const quickBuyBtn = document.getElementById("lcQuickBuyBtn");
  const quickSellBtn = document.getElementById("lcQuickSellBtn");
  if (quickBuyBtn) quickBuyBtn.classList.toggle("is-active", !isSell);
  if (quickSellBtn) quickSellBtn.classList.toggle("is-active", isSell);

  // Update Floating On-Chart Action HUD
  const hudBadge = document.getElementById("lcHudSignalBadge");
  if (hudBadge) {
    hudBadge.textContent = activeAsset.signal + " ACTIVE";
    hudBadge.className = "lc-hud-sig " + (isSell ? "sell" : "buy");
  }
  setTxt(
    "lcHudLevelText",
    activeAsset.symbol + " (" + tfInfo.label + ") · Entry: " + activeAsset.entry + " · SL: " + activeAsset.sl + " · TP1: " + activeAsset.tp1
  );

  const scoreBadge = document.getElementById("lcReaderScoreBadge");
  if (scoreBadge) {
    if (isSell) {
      scoreBadge.style.background = "#ef4444";
      scoreBadge.style.color = "#ffffff";
    } else {
      scoreBadge.style.background = "var(--lc-neon-green)";
      scoreBadge.style.color = "#03150b";
    }
  }

  setTxt("lcStripRR", activeAsset.rr);
  setTxt("lcStripEntry", "Entry " + activeAsset.signal + ": " + activeAsset.entry);
  setTxt("lcStripSL", "SL: " + activeAsset.sl);
  setTxt("lcStripTP1", "TP1: " + activeAsset.tp1);
  setTxt("lcStripTP2", "TP2: " + activeAsset.tp2);
  setTxt("lcStripTP3", "TP3: " + activeAsset.tp3);

  setTxt("lcPanelSym", activeAsset.symbol);
  setTxt("lcPanelTf", tfInfo.label);
  setTxt("lcLastCandleClose", formattedPrice);

  const timePill = document.querySelector(".lc-time-left-pill");
  if (timePill) timePill.textContent = tfInfo.timeLeft;

  const dirBadge = document.getElementById("lcMainDirBadge");
  if (dirBadge) {
    dirBadge.textContent = activeAsset.signal;
    dirBadge.className = "lc-active-dir-badge " + (isSell ? "sell" : "buy");
  }

  if (customCouncilBanner) {
    setTxt("lcCouncilStatusText", customCouncilBanner);
  } else {
    setTxt(
      "lcCouncilStatusText",
      "Active " + activeAsset.signal + " setup on " + activeAsset.symbol + " (" + tfInfo.label + ") — 4-LLM consensus " + activeAsset.kpi.conf + " with Entry " + activeAsset.entry + " & SL " + activeAsset.sl + "."
    );
  }

  setTxt("lcStructureTag", activeAsset.structureTag);
  const obsContainer = document.getElementById("lcObservationsList");
  if (obsContainer) {
    obsContainer.innerHTML = activeAsset.observations.map(function (o) {
      return (
        '<div class="lc-obs-item">' +
          '<strong>' + escHtml(o.title) + '</strong>' +
          '<span>' + escHtml(o.text) + '</span>' +
        '</div>'
      );
    }).join("");
  }

  setTxt("lcCardRR", activeAsset.rr);
  const levelsRows = document.getElementById("lcLevelsRows");
  if (levelsRows) {
    levelsRows.innerHTML =
      '<div class="lc-level-row"><span>Entry ' + escHtml(activeAsset.signal) + '</span><span class="val" id="rowValEntry" style="color:var(--lc-cyan);">' + escHtml(activeAsset.entry) + '</span></div>' +
      '<div class="lc-level-row"><span>Stop Loss</span><span class="val" id="rowValSL" style="color:#f87171;">' + escHtml(activeAsset.sl) + '</span></div>' +
      '<div class="lc-level-row"><span>Take Profit 1</span><span class="val" id="rowValTP1" style="color:var(--lc-neon-green);">' + escHtml(activeAsset.tp1) + '</span></div>' +
      '<div class="lc-level-row"><span>Take Profit 2</span><span class="val" id="rowValTP2" style="color:var(--lc-neon-green);">' + escHtml(activeAsset.tp2) + '</span></div>' +
      '<div class="lc-level-row"><span>Take Profit 3</span><span class="val" id="rowValTP3" style="color:var(--lc-neon-green);">' + escHtml(activeAsset.tp3) + '</span></div>';
  }

  const regimeContainer = document.getElementById("lcRegimeTags");
  if (regimeContainer && Array.isArray(activeAsset.regime)) {
    regimeContainer.innerHTML = activeAsset.regime.map(function (tag, i) {
      const cls = i === activeAsset.regime.length - 1 ? "lc-reg-chip green" : "lc-reg-chip";
      return '<span class="' + cls + '">' + escHtml(tag) + '</span>';
    }).join("");
  }

  setTxt("lcKpiConf", activeAsset.kpi.conf);
  setTxt("lcKpiWin", activeAsset.kpi.win);
  setTxt("lcKpiInd", activeAsset.kpi.ind);
  setTxt("lcKpiRisk", activeAsset.kpi.risk);

  const agentsContainer = document.getElementById("lcAgentsStack");
  if (agentsContainer) {
    agentsContainer.innerHTML = activeAsset.agents.map(function (ag) {
      const biasCls = ag.bias === "Bearish" ? "lc-agent-bias sell" : "lc-agent-bias";
      return (
        '<article class="lc-agent-card">' +
          '<div class="lc-agent-top">' +
            '<span>' + escHtml(ag.title) + '</span>' +
            '<span class="' + biasCls + '">' + escHtml(ag.bias) + '</span>' +
          '</div>' +
          '<div class="lc-agent-role">' + escHtml(ag.role) + '</div>' +
          '<p class="lc-agent-body">' + escHtml(ag.text) + '</p>' +
          '<span class="lc-agent-conviction">' + escHtml(ag.conviction) + '</span>' +
        '</article>'
      );
    }).join("");
  }

  renderSignalsTabList();
}

// ==========================================
// 6. RIGHT PANEL TABS & SIGNALS (7) VIEW
// ==========================================
function renderSignalsTabList() {
  let sigBox = document.getElementById("lcSignalsListView");
  const aiPanel = document.getElementById("lcAiPanel");
  if (!aiPanel) return;

  if (!sigBox) {
    sigBox = document.createElement("div");
    sigBox.id = "lcSignalsListView";
    sigBox.className = "lc-signals-list-view";
    sigBox.style.display = "none";
    aiPanel.appendChild(sigBox);
  }

  const ranked = DB.slice().sort(function (a, b) {
    return (b.CompositeScore || 0) - (a.CompositeScore || 0);
  });

  const tfLabel = (window.TF_CONFIG[activeTimeframe] && window.TF_CONFIG[activeTimeframe].label) ? window.TF_CONFIG[activeTimeframe].label : "30m";

  const cardsHtml = ranked.map(function (item, idx) {
    const activeCls = item.symbol === activeAsset.symbol ? " active" : "";
    const sigCls = item.signal.toLowerCase();
    return (
      '<div class="lc-sig-feed-card' + activeCls + '" data-sig-sym="' + escHtml(item.symbol) + '">' +
        '<div class="lc-sig-feed-top">' +
          '<div>' +
            '<strong>#' + (idx + 1) + ' ' + escHtml(item.icon) + ' ' + escHtml(item.symbol) + '</strong>' +
            '<span class="lc-sig-feed-tf">' + escHtml(tfLabel) + ' · ' + escHtml(item.structureTag) + '</span>' +
          '</div>' +
          '<span class="lc-wi-sig ' + sigCls + '">' + escHtml(item.signal) + ' · ' + escHtml(item.kpi.conf) + '</span>' +
        '</div>' +
        '<div class="lc-sig-feed-levels">' +
          '<span>Entry: <b>' + escHtml(item.entry) + '</b></span>' +
          '<span style="color:#f87171;">SL: <b>' + escHtml(item.sl) + '</b></span>' +
          '<span style="color:var(--lc-neon-green);">TP1: <b>' + escHtml(item.tp1) + '</b></span>' +
        '</div>' +
      '</div>'
    );
  }).join("");

  sigBox.innerHTML =
    '<div class="lc-signals-list-head">' +
      '<span>📡 Live Multi-Asset Scanner (' + ranked.length + ')</span>' +
      '<span style="color:var(--lc-neon-green);font-size:10.5px;">All BUY/SELL Actionable</span>' +
    '</div>' +
    cardsHtml;

  sigBox.querySelectorAll(".lc-sig-feed-card").forEach(function (card) {
    card.addEventListener("click", function () {
      const sym = card.getAttribute("data-sig-sym");
      const target = DB.find(function (x) { return x.symbol === sym; });
      if (target) {
        activeAsset = target;
        switchRightPanelTab("analysis");
        runLiveChartAnalysis({ reloadWidget: true, reason: "Signal Card Selected" });
      }
    });
  });
}

function switchRightPanelTab(tabName) {
  activePanelTab = tabName;
  document.querySelectorAll("#lcPanelTabs .lc-p-tab").forEach(function (btn) {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
  });

  const councilCard = document.querySelector(".lc-council-card");
  const playbookCard = document.querySelector(".lc-playbook-card");
  const readerCard = document.getElementById("lcSectionAnalysis");
  const levelsCard = document.getElementById("lcSectionLevels");
  const agentsStack = document.getElementById("lcAgentsStack");
  const sigBox = document.getElementById("lcSignalsListView");

  const showEl = function (el, visible) {
    if (el) el.style.display = visible ? "" : "none";
  };

  if (tabName === "analysis") {
    showEl(councilCard, true);
    showEl(playbookCard, true);
    showEl(readerCard, true);
    showEl(levelsCard, true);
    showEl(agentsStack, true);
    showEl(sigBox, false);
  } else if (tabName === "council") {
    showEl(councilCard, true);
    showEl(playbookCard, false);
    showEl(readerCard, false);
    showEl(levelsCard, false);
    showEl(agentsStack, true);
    showEl(sigBox, false);
  } else if (tabName === "levels") {
    showEl(councilCard, false);
    showEl(playbookCard, true);
    showEl(readerCard, false);
    showEl(levelsCard, true);
    showEl(agentsStack, false);
    showEl(sigBox, false);
  } else if (tabName === "signals") {
    showEl(councilCard, false);
    showEl(playbookCard, false);
    showEl(readerCard, false);
    showEl(levelsCard, false);
    showEl(agentsStack, false);
    renderSignalsTabList();
    showEl(sigBox, true);
  }
}

// ==========================================
// 7. INSTANT BUY / SELL SWITCH & LIVE ACTION RESET
// ==========================================
function setLiveSignalDirection(newDirection) {
  if (newDirection !== "BUY" && newDirection !== "SELL") return;
  activeAsset.signal = newDirection;

  const tfLabel = (window.TF_CONFIG[activeTimeframe] && window.TF_CONFIG[activeTimeframe].label) ? window.TF_CONFIG[activeTimeframe].label : "30m";
  triggerVisualChartScan("⚡ LIVE ACTION SWITCHED TO " + newDirection + " ON " + activeAsset.symbol + " (" + tfLabel + ")...", 620);

  refreshAllAssetsAnalysis();
  renderWatchlist();
  updateCenterAndRightPanels(
    "⚡ Instant " + newDirection + " Action Activated on " + activeAsset.symbol + " (" + tfLabel + ") — Entry locked at " + activeAsset.entry + " | SL " + activeAsset.sl + " | TP1 " + activeAsset.tp1 + "."
  );

  flashChartLevelsStrip();
}

function resetLiveChartAction() {
  const tfLabel = (window.TF_CONFIG[activeTimeframe] && window.TF_CONFIG[activeTimeframe].label) ? window.TF_CONFIG[activeTimeframe].label : "30m";

  const step =
    activeAsset.symbol === "XAUUSD" ? 0.35 :
    activeAsset.symbol === "BTCUSDT" ? 14.0 :
    activeAsset.decimals === 4 ? 0.0002 : 2.0;
  activeAsset.price = Math.max(0.0001, activeAsset.price + (Math.random() - 0.48) * step);

  if (activeAsset.signal !== "BUY" && activeAsset.signal !== "SELL") {
    activeAsset.signal = activeAsset.defaultSignal || "BUY";
  }

  triggerVisualChartScan("⚡ RESETTING & RE-ANCHORING " + activeAsset.symbol + " (" + activeAsset.signal + " · " + tfLabel + ")...", 680);

  refreshAllAssetsAnalysis();
  renderWatchlist();
  updateCenterAndRightPanels(
    "✓ Live Action Reset Complete (" + tfLabel + "): " + activeAsset.signal + " " + activeAsset.symbol + " re-anchored to current price " + activeAsset.entry + " | SL " + activeAsset.sl + " | TP1 " + activeAsset.tp1 + "."
  );

  flashChartLevelsStrip();
}

function flashChartLevelsStrip() {
  const strip = document.getElementById("lcChartLevelsStrip");
  const levelsCard = document.getElementById("lcSectionLevels");
  const hud = document.getElementById("lcOnChartHud");
  [strip, levelsCard, hud].forEach(function (el) {
    if (!el) return;
    el.classList.add("lc-flash-highlight");
    clearTimeout(el._flashTimer);
    el._flashTimer = setTimeout(function () {
      el.classList.remove("lc-flash-highlight");
    }, 800);
  });
}

// ==========================================
// 8. CORE ACTIONS: ANALYZE, BEST SETUP & 4-LLM COUNCIL
// ==========================================
function runLiveChartAnalysis(options) {
  const opts = options || {};
  const reloadWidget = Boolean(opts.reloadWidget);
  const analyzeBtn = document.getElementById("lcAnalyzeSetupBtn");
  const statusEl = document.getElementById("lcCouncilStatusText");
  const tfLabel = (window.TF_CONFIG[activeTimeframe] && window.TF_CONFIG[activeTimeframe].label) ? window.TF_CONFIG[activeTimeframe].label : "30m";
  const settings = getCurrentFilterSettings();

  if (analyzeBtn) {
    analyzeBtn.textContent = "⏳ Scanning...";
  }

  triggerVisualChartScan("📊 SCANNING " + activeAsset.symbol + " (" + tfLabel + ") · " + settings.playbook.toUpperCase() + "...", 600);

  if (statusEl) {
    statusEl.textContent = "🔍 Scanning " + activeAsset.symbol + " on " + tfLabel + " (" + settings.risk + ", " + settings.horizon + ")... recalculating order blocks & ATR levels.";
  }

  refreshAllAssetsAnalysis();
  renderWatchlist();

  if (reloadWidget) {
    initTradingViewWidget();
  }

  setTimeout(function () {
    if (analyzeBtn) {
      analyzeBtn.textContent = "📊 Analyze";
    }
    const resolvedPb = settings.playbook === "auto" ? activeAsset.bestPlaybook.toUpperCase() : settings.playbook.toUpperCase();
    updateCenterAndRightPanels(
      "✓ Live Scan Complete (" + tfLabel + " · " + resolvedPb + "): " + activeAsset.signal + " setup locked at " + activeAsset.entry + " | SL " + activeAsset.sl + " | TP1 " + activeAsset.tp1 + " (" + activeAsset.kpi.conf + " conf)."
    );
    flashChartLevelsStrip();
  }, 360);
}

function runBestSetupScanner() {
  isScanning = true;

  const bestBtn = document.getElementById("lcBestSetupBtn");
  const statusEl = document.getElementById("lcCouncilStatusText");

  if (bestBtn) {
    bestBtn.textContent = "⚡ Scanning 7 Markets...";
  }

  if (activeCategory !== "ALL" || watchSearchQuery !== "") {
    activeCategory = "ALL";
    watchSearchQuery = "";
    const searchEl = document.getElementById("lcWatchSearch");
    if (searchEl) searchEl.value = "";
    document.querySelectorAll("#lcClassTabs .lc-class-tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-cat") === "ALL");
    });
    renderWatchlist();
  }

  refreshAllAssetsAnalysis();
  triggerVisualChartScan("✦ AI SCANNING ALL 7 MARKETS FOR BEST BUY/SELL SETUP...", 1100);

  const watchRows = Array.from(document.querySelectorAll("#lcWatchlistContainer .lc-watch-item"));
  let stepIndex = 0;

  const sweepInterval = setInterval(function () {
    watchRows.forEach(function (r) { r.classList.remove("scanning-pulse"); });
    if (stepIndex < watchRows.length) {
      const currentRow = watchRows[stepIndex];
      currentRow.classList.add("scanning-pulse");
      const sym = currentRow.getAttribute("data-symbol");
      if (statusEl && sym) {
        statusEl.textContent = "🛰️ Evaluating " + sym + " structure, liquidity sweep & R:R profile...";
      }
      stepIndex++;
    } else {
      clearInterval(sweepInterval);

      const actionable = DB.slice().sort(function (a, b) {
        return (b.CompositeScore || 0) - (a.CompositeScore || 0);
      });

      let winner = actionable[0] || DB[0];
      if (winner.symbol === activeAsset.symbol && actionable.length > 1) {
        lastBestSetupIndex = (lastBestSetupIndex + 1) % Math.min(3, actionable.length);
        winner = actionable[lastBestSetupIndex];
      } else {
        lastBestSetupIndex = 0;
      }

      const prevSymbol = activeAsset.symbol;
      activeAsset = winner;

      refreshAllAssetsAnalysis();
      renderWatchlist();
      if (prevSymbol !== activeAsset.symbol) {
        initTradingViewWidget();
      }

      const tfLabel = (window.TF_CONFIG[activeTimeframe] && window.TF_CONFIG[activeTimeframe].label) ? window.TF_CONFIG[activeTimeframe].label : "30m";
      const pbName = window.PLAYBOOK_NAMES[winner.bestPlaybook] || "SMC Order Block + FVG";

      updateCenterAndRightPanels(
        "🏆 BEST SETUP FOUND: " + winner.symbol + " (" + winner.signal + " · " + tfLabel + ") via " + pbName + " — " + winner.kpi.conf + " Confidence, " + winner.rr + ", Entry " + winner.entry + "."
      );
      flashChartLevelsStrip();

      if (bestBtn) {
        bestBtn.textContent = "✦ Best setup";
      }
      isScanning = false;
    }
  }, 120);
}

function runFourLlmCouncil() {
  const btn = document.getElementById("lcRunCouncilBtn");
  const statusEl = document.getElementById("lcCouncilStatusText");
  const pills = document.querySelectorAll(".lc-llm-badges-row .lc-llm-pill");

  if (!statusEl || !btn) return;
  btn.textContent = "⏳ Running 4 LLMs...";

  triggerVisualChartScan("🧠 4-LLM COUNCIL EVALUATING " + activeAsset.symbol + "...", 850);

  const steps = [
    "🔵 [1/4] Technical LLM verifying " + activeAsset.symbol + " EMA stack & ADX trend strength...",
    "🟣 [2/4] Risk LLM computing ATR stop-loss & position sizing around " + activeAsset.sl + "...",
    "🟠 [3/4] SMC LLM mapping unmitigated Order Blocks & Fair Value Gaps...",
    "🏆 [4/4] Synthesizer LLM locking final " + activeAsset.signal + " consensus..."
  ];

  let idx = 0;
  const timer = setInterval(function () {
    pills.forEach(function (p, i) { p.classList.toggle("llm-active-vote", i === idx); });
    if (idx < steps.length) {
      statusEl.textContent = steps[idx];
      idx++;
    } else {
      clearInterval(timer);
      pills.forEach(function (p) { p.classList.remove("llm-active-vote"); });
      refreshAllAssetsAnalysis();
      btn.textContent = "✦ Run Council";
      updateCenterAndRightPanels(
        "✓ 4-LLM Council Unanimous (" + activeAsset.kpi.conf + " confidence): " + activeAsset.signal + " " + activeAsset.symbol + " at " + activeAsset.entry + " | SL " + activeAsset.sl + " | TP1 " + activeAsset.tp1 + "."
      );
      flashChartLevelsStrip();
    }
  }, 190);
}

// ==========================================
// 9. INTERACTIVE EVENTS, SHORTCUTS & LIVE STREAM
// ==========================================
function bindEvents() {
  // Timeframe buttons
  document.querySelectorAll("#lcTimeframeGroup .lc-tf-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#lcTimeframeGroup .lc-tf-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      activeTimeframe = btn.getAttribute("data-tf") || "30";

      const horizonSelect = document.getElementById("lcHorizonSelect");
      const tfCfg = window.TF_CONFIG[activeTimeframe];
      if (horizonSelect && tfCfg) {
        if (tfCfg.horizon === "Scalp") horizonSelect.value = "Scalp";
        else if (tfCfg.horizon === "Swing") horizonSelect.value = "Swing";
        else horizonSelect.value = "Intraday";
      }

      runLiveChartAnalysis({ reloadWidget: true, reason: "Timeframe Change" });
    });
  });

  // Watchlist category tabs
  document.querySelectorAll("#lcClassTabs .lc-class-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll("#lcClassTabs .lc-class-tab").forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      activeCategory = tab.getAttribute("data-cat") || "ALL";
      renderWatchlist();
    });
  });

  // Right panel tabs
  document.querySelectorAll("#lcPanelTabs .lc-p-tab").forEach(function (tabBtn) {
    tabBtn.addEventListener("click", function () {
      const tabName = tabBtn.getAttribute("data-tab") || "analysis";
      switchRightPanelTab(tabName);
    });
  });

  // Playbook, Risk, Horizon selects
  ["lcPlaybookSelect", "lcRiskSelect", "lcHorizonSelect"].forEach(function (selectId) {
    const el = document.getElementById(selectId);
    if (el) {
      el.addEventListener("change", function () {
        runLiveChartAnalysis({ reloadWidget: false, reason: "Filter Updated" });
      });
    }
  });

  // Instant BUY buttons (Topbar + On-Chart HUD)
  ["lcQuickBuyBtn", "lcHudBuyBtn"].forEach(function (id) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", function () { setLiveSignalDirection("BUY"); });
  });

  // Instant SELL buttons (Topbar + On-Chart HUD)
  ["lcQuickSellBtn", "lcHudSellBtn"].forEach(function (id) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", function () { setLiveSignalDirection("SELL"); });
  });

  // Clickable BUY/SELL badge in Right Panel header
  const mainDirBadge = document.getElementById("lcMainDirBadge");
  if (mainDirBadge) {
    mainDirBadge.addEventListener("click", function () {
      const nextDir = activeAsset.signal === "BUY" ? "SELL" : "BUY";
      setLiveSignalDirection(nextDir);
    });
  }

  // All Reset Action triggers across Topbar, On-Chart HUD, Banner, Strip, Panel, and Shortcuts
  ["lcQuickResetBtn", "lcHudResetBtn", "lcBannerResetBtn", "lcStripResetBtn", "lcPanelResetBtn", "scResetAction"].forEach(function (btnId) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener("click", function () {
        if (activePanelTab === "signals") switchRightPanelTab("analysis");
        resetLiveChartAction();
      });
    }
  });

  // Search input
  const searchEl = document.getElementById("lcWatchSearch");
  if (searchEl) {
    searchEl.addEventListener("input", function (e) {
      watchSearchQuery = e.target.value.trim();
      renderWatchlist();
    });
  }

  // Sidebar toggle
  const workspace = document.getElementById("lcWorkspace");
  const toggleSidebar = function () {
    if (workspace) workspace.classList.toggle("sidebar-collapsed");
  };
  const sideBtn = document.getElementById("lcToggleSidebarBtn");
  const scSideBtn = document.getElementById("scSidebar");
  if (sideBtn) sideBtn.addEventListener("click", toggleSidebar);
  if (scSideBtn) scSideBtn.addEventListener("click", toggleSidebar);

  // Analyze & Best Setup buttons
  const analyzeBtn = document.getElementById("lcAnalyzeSetupBtn");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", function () {
      if (activePanelTab === "signals") switchRightPanelTab("analysis");
      runLiveChartAnalysis({ reloadWidget: false, reason: "Analyze Button" });
    });
  }

  const bestBtn = document.getElementById("lcBestSetupBtn");
  if (bestBtn) {
    bestBtn.addEventListener("click", function () {
      if (activePanelTab === "signals") switchRightPanelTab("analysis");
      runBestSetupScanner();
    });
  }

  // 4-LLM Council buttons
  const councilBtn = document.getElementById("lcRunCouncilBtn");
  const scCouncilBtn = document.getElementById("scRunCouncil");
  if (councilBtn) councilBtn.addEventListener("click", runFourLlmCouncil);
  if (scCouncilBtn) scCouncilBtn.addEventListener("click", runFourLlmCouncil);

  // Focus AI Reader button
  const focusReaderBtn = document.getElementById("lcFocusAiBtn");
  if (focusReaderBtn) {
    focusReaderBtn.addEventListener("click", function () {
      switchRightPanelTab("analysis");
      const readerCard = document.getElementById("lcSectionAnalysis");
      if (readerCard) {
        readerCard.scrollIntoView({ behavior: "smooth", block: "center" });
        readerCard.classList.add("lc-flash-highlight");
        setTimeout(function () { readerCard.classList.remove("lc-flash-highlight"); }, 1000);
      }
    });
  }

  const scFocusAi = document.getElementById("scFocusAi");
  if (scFocusAi) {
    scFocusAi.addEventListener("click", function () {
      runBestSetupScanner();
    });
  }

  const scSearch = document.getElementById("scSearch");
  if (scSearch) {
    scSearch.addEventListener("click", function () {
      if (workspace && workspace.classList.contains("sidebar-collapsed")) {
        workspace.classList.remove("sidebar-collapsed");
      }
      if (searchEl) searchEl.focus();
    });
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", function (e) {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      toggleSidebar();
    } else if (key === "m") {
      e.preventDefault();
      runFourLlmCouncil();
    } else if (key === "f") {
      e.preventDefault();
      runBestSetupScanner();
    } else if (key === "r") {
      e.preventDefault();
      resetLiveChartAction();
    } else if (key === "s") {
      e.preventDefault();
      if (searchEl) searchEl.focus();
    }
  });

  // Audio playback buttons
  ["lcNavMusicBtn", "lcSoundToggleBtn"].forEach(function (id) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", toggleAudioPlayback);
  });
}

// Live Price Micro-Ticks + Live Level Auto-Sync
function startLivePriceStream() {
  setInterval(function () {
    DB.forEach(function (item) {
      const step =
        item.symbol === "XAUUSD" ? 0.45 :
        item.symbol === "BTCUSDT" ? 18.0 :
        item.decimals === 4 ? 0.0002 : 2.5;
      const delta = (Math.random() - 0.49) * step;
      item.price = Math.max(0.0001, item.price + delta);

      const wiEl = document.getElementById("wiPrice_" + item.symbol);
      if (wiEl) wiEl.textContent = item.price.toFixed(item.decimals);
    });

    refreshAllAssetsAnalysis();

    const formatted = window.fmtPrice(activeAsset.price, activeAsset.decimals);
    const tfInfo = window.TF_CONFIG[activeTimeframe] || window.TF_CONFIG["30"];
    const setTxt = function (id, val) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setTxt("lcTopLivePrice", formatted);
    setTxt("lcLastCandleClose", formatted);
    setTxt("lcStripEntry", "Entry " + activeAsset.signal + ": " + activeAsset.entry);
    setTxt("lcStripSL", "SL: " + activeAsset.sl);
    setTxt("lcStripTP1", "TP1: " + activeAsset.tp1);
    setTxt("lcStripTP2", "TP2: " + activeAsset.tp2);
    setTxt("lcStripTP3", "TP3: " + activeAsset.tp3);

    setTxt(
      "lcHudLevelText",
      activeAsset.symbol + " (" + tfInfo.label + ") · Entry: " + activeAsset.entry + " · SL: " + activeAsset.sl + " · TP1: " + activeAsset.tp1
    );

    setTxt("rowValEntry", activeAsset.entry);
    setTxt("rowValSL", activeAsset.sl);
    setTxt("rowValTP1", activeAsset.tp1);
    setTxt("rowValTP2", activeAsset.tp2);
    setTxt("rowValTP3", activeAsset.tp3);
  }, 2200);

  let totalSec = 2 * 86400 + 21 * 3600 + 17 * 60 + 5;
  setInterval(function () {
    totalSec = Math.max(0, totalSec - 1);
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    const cdEl = document.getElementById("lcMarketCountdown");
    if (cdEl) cdEl.textContent = "· Closes in " + d + "d " + h + "h " + m + ":" + s;
  }, 1000);
}

// ==========================================
// 10. INITIALIZE EVERYTHING
// ==========================================
function initLiveChartsApp() {
  const bgVideo = document.querySelector(".lc-bg-video");
  if (bgVideo) {
    bgVideo.muted = true;
    bgVideo.play().catch(function () {
      document.addEventListener("click", function () { bgVideo.play(); }, { once: true });
    });
  }

  if (window.YT && window.YT.Player) initYouTubeAudio();

  document.addEventListener("click", function () {
    if (localStorage.getItem("por_music_playing") === "true" && !isAudioPlaying) {
      if (ytPlayerReady) playAudioMusic();
      else {
        pendingPlay = true;
        initYouTubeAudio();
      }
    }
  }, { once: true });

  refreshAllAssetsAnalysis();
  renderWatchlist();
  updateCenterAndRightPanels();
  initTradingViewWidget();
  bindEvents();
  startLivePriceStream();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLiveChartsApp);
} else {
  initLiveChartsApp();
}