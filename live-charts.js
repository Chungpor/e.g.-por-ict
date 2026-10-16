/**
 * Live Charts AI — TradingView + Live Chart Scanner + Best Setup Engine + 4-LLM Consensus Council
 * File: live-charts.js
 */
"use strict";

// ==========================================
// 0. 4K ZEN AMBIENT AUDIO (YOUTUBE IFRAME API)
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
// 1. AUTO-INJECT SCANNER STYLES (FALLBACK)
// ==========================================
function injectScannerStyles() {
  if (document.getElementById("lcDynamicScannerStyles")) return;
  const style = document.createElement("style");
  style.id = "lcDynamicScannerStyles";
  style.textContent = [
    ".lc-scan-laser-overlay { position:absolute; inset:0; pointer-events:none; z-index:25; opacity:0; transition:opacity 0.22s ease; background:radial-gradient(circle at 50% 50%, rgba(32,178,170,0.12) 0%, transparent 70%); overflow:hidden; }",
    ".lc-scan-laser-overlay.is-scanning { opacity:1; }",
    ".lc-scan-beam { position:absolute; top:0; left:0; width:100%; height:3px; background:linear-gradient(90deg, transparent 0%, #20b2aa 25%, #5eead4 50%, #20b2aa 75%, transparent 100%); box-shadow:0 0 18px #20b2aa, 0 0 32px #20b2aa; animation:lcLaserSweep 0.75s ease-in-out infinite alternate; }",
    "@keyframes lcLaserSweep { 0% { top:4%; } 100% { top:94%; } }",
    ".lc-scan-hud { position:absolute; top:14px; left:50%; transform:translateX(-50%); background:rgba(4,14,18,0.94); border:1px solid #20b2aa; color:#20b2aa; font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:800; padding:5px 14px; border-radius:20px; box-shadow:0 0 20px rgba(32,178,170,0.4); white-space:nowrap; }",
    ".lc-watch-item.scanning-pulse { border-color:#20b2aa !important; background:rgba(32,178,170,0.22) !important; transform:translateX(3px); }",
    ".lc-llm-pill.llm-active-vote { border-color:#20b2aa !important; background:rgba(32,178,170,0.28) !important; color:#ffffff !important; box-shadow:0 0 12px rgba(32,178,170,0.5); }",
    ".lc-flash-highlight { border-color:#20b2aa !important; box-shadow:0 0 18px rgba(32,178,170,0.38); transition:all 0.3s ease; }",
    ".lc-signals-list-view { display:flex; flex-direction:column; gap:8px; }",
    ".lc-signals-list-head { display:flex; align-items:center; justify-content:space-between; font-size:11.5px; font-weight:800; padding:4px 2px; }",
    ".lc-sig-feed-card { background:rgba(14,22,34,0.94); border:1px solid rgba(32,178,170,0.28); border-radius:10px; padding:10px 12px; cursor:pointer; display:flex; flex-direction:column; gap:7px; transition:all 0.16s ease; }",
    ".lc-sig-feed-card:hover, .lc-sig-feed-card.active { border-color:#20b2aa; background:rgba(32,178,170,0.14); }",
    ".lc-sig-feed-top { display:flex; align-items:center; justify-content:space-between; font-size:12px; }",
    ".lc-sig-feed-tf { display:block; font-size:10px; color:#64748b; margin-top:2px; }",
    ".lc-sig-feed-levels { display:flex; align-items:center; justify-content:space-between; font-family:'JetBrains Mono',monospace; font-size:10.5px; color:#94a3b8; padding-top:5px; border-top:1px solid rgba(32,178,170,0.14); }"
  ].join("\n");
  document.head.appendChild(style);
}

// ==========================================
// 2. SHARED DATA & ENGINE
// ==========================================
// WATCHLIST_DB, TF_CONFIG, PLAYBOOK_NAMES, fmtPrice() and
// computeDynamicAnalysisForAsset() now live in live-engine.js (loaded before this file).

// ==========================================
// 3. STATE & HELPERS
// ==========================================
let activeAsset = WATCHLIST_DB[0];
let activeTimeframe = "30";
let activeCategory = "ALL";
let activePanelTab = "analysis";
let watchSearchQuery = "";
let isScanning = false;
let lastBestSetupIndex = -1;



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
  WATCHLIST_DB.forEach(function (item) {
    computeDynamicAnalysisForAsset(item, activeTimeframe, settings.playbook, settings.risk, settings.horizon);
  });
}

// ==========================================
// 5. RENDER WATCHLIST SIDEBAR
// ==========================================
function renderWatchlist() {
  const container = document.getElementById("lcWatchlistContainer");
  const countEl = document.getElementById("lcWatchCount");
  if (!container) return;

  const filtered = WATCHLIST_DB.filter(function (item) {
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
      const found = WATCHLIST_DB.find(function (x) { return x.symbol === sym; });
      if (found) {
        activeAsset = found;
        runLiveChartAnalysis({ reloadWidget: true, reason: "Symbol Switch" });
      }
    });
  });
}

// ==========================================
// 6. TRADINGVIEW LIVE CHART WIDGET & SCAN OVERLAY
// ==========================================
function ensureChartScanOverlay() {
  const viewport = document.querySelector(".lc-tv-viewport");
  if (!viewport) return null;
  viewport.style.position = "relative";

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
  const dur = duration || 850;
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

function initTradingViewWidget() {
  const target = document.getElementById("lc_tradingview_chart");
  if (!target || typeof TradingView === "undefined") return;
  target.innerHTML = "";

  new TradingView.widget({
    autosize: true,
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

  ensureChartScanOverlay();
}

// ==========================================
// 7. UPDATE AI READER & 4-LLM COUNCIL PANEL
// ==========================================
function updateCenterAndRightPanels(customCouncilBanner) {
  const setTxt = function (id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  const formattedPrice = fmtPrice(activeAsset.price, activeAsset.decimals);
  const tfInfo = TF_CONFIG[activeTimeframe] || TF_CONFIG["30"];

  setTxt("lcActiveSymTitle", activeAsset.symbol);
  setTxt("lcTopLivePrice", formattedPrice);
  setTxt("lcReaderScoreBadge", activeAsset.readerScore);
  setTxt("lcReaderSummaryText", activeAsset.readerSummary);

  const scoreBadge = document.getElementById("lcReaderScoreBadge");
  if (scoreBadge) {
    if (activeAsset.signal === "SELL") {
      scoreBadge.style.background = "#ef4444";
      scoreBadge.style.color = "#ffffff";
    } else if (activeAsset.signal === "HOLD") {
      scoreBadge.style.background = "#f59e0b";
      scoreBadge.style.color = "#04101c";
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
    dirBadge.className = "lc-active-dir-badge " + (activeAsset.signal === "SELL" ? "sell" : "buy");
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
      '<div class="lc-level-row"><span>Entry ' + escHtml(activeAsset.signal) + '</span><span class="val" style="color:var(--lc-cyan);">' + escHtml(activeAsset.entry) + '</span></div>' +
      '<div class="lc-level-row"><span>Stop Loss</span><span class="val" style="color:#f87171;">' + escHtml(activeAsset.sl) + '</span></div>' +
      '<div class="lc-level-row"><span>Take Profit 1</span><span class="val" style="color:var(--lc-neon-green);">' + escHtml(activeAsset.tp1) + '</span></div>' +
      '<div class="lc-level-row"><span>Take Profit 2</span><span class="val" style="color:var(--lc-neon-green);">' + escHtml(activeAsset.tp2) + '</span></div>' +
      '<div class="lc-level-row"><span>Take Profit 3</span><span class="val" style="color:var(--lc-neon-green);">' + escHtml(activeAsset.tp3) + '</span></div>';
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
// 8. RIGHT PANEL TABS & SIGNALS (6) VIEW
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

  const ranked = WATCHLIST_DB.slice().sort(function (a, b) {
    return (b.CompositeScore || 0) - (a.CompositeScore || 0);
  });

  const tfLabel = (TF_CONFIG[activeTimeframe] && TF_CONFIG[activeTimeframe].label) ? TF_CONFIG[activeTimeframe].label : "30m";

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
      '<span style="color:var(--lc-neon-green);font-size:10.5px;">Ranked by AI Confluence</span>' +
    '</div>' +
    cardsHtml;

  sigBox.querySelectorAll(".lc-sig-feed-card").forEach(function (card) {
    card.addEventListener("click", function () {
      const sym = card.getAttribute("data-sig-sym");
      const target = WATCHLIST_DB.find(function (x) { return x.symbol === sym; });
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
// 9. CORE ACTIONS: ANALYZE, BEST SETUP & 4-LLM COUNCIL
// ==========================================
function runLiveChartAnalysis(options) {
  const opts = options || {};
  const reloadWidget = Boolean(opts.reloadWidget);
  const analyzeBtn = document.getElementById("lcAnalyzeSetupBtn");
  const statusEl = document.getElementById("lcCouncilStatusText");
  const tfLabel = (TF_CONFIG[activeTimeframe] && TF_CONFIG[activeTimeframe].label) ? TF_CONFIG[activeTimeframe].label : "30m";
  const settings = getCurrentFilterSettings();

  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "⏳ Scanning...";
  }

  triggerVisualChartScan("📊 SCANNING " + activeAsset.symbol + " (" + tfLabel + ") · " + settings.playbook.toUpperCase() + "...", 650);

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
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = "📊 Analyze";
    }
    const resolvedPb = settings.playbook === "auto" ? activeAsset.bestPlaybook.toUpperCase() : settings.playbook.toUpperCase();
    updateCenterAndRightPanels(
      "✓ Live Scan Complete (" + tfLabel + " · " + resolvedPb + "): " + activeAsset.signal + " setup locked at " + activeAsset.entry + " | SL " + activeAsset.sl + " | TP1 " + activeAsset.tp1 + " (" + activeAsset.kpi.conf + " conf)."
    );
  }, 420);
}

function runBestSetupScanner() {
  if (isScanning) return;
  isScanning = true;

  const bestBtn = document.getElementById("lcBestSetupBtn");
  const statusEl = document.getElementById("lcCouncilStatusText");

  if (bestBtn) {
    bestBtn.disabled = true;
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
  triggerVisualChartScan("✦ AI SCANNING ALL 7 MARKETS FOR BEST SETUP...", 1250);

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

      const actionable = WATCHLIST_DB
        .filter(function (x) { return x.signal !== "HOLD"; })
        .sort(function (a, b) { return (b.CompositeScore || 0) - (a.CompositeScore || 0); });

      let winner = actionable[0] || WATCHLIST_DB[0];
      if (winner.symbol === activeAsset.symbol && actionable.length > 1 && lastBestSetupIndex === 0) {
        winner = actionable[1];
        lastBestSetupIndex = 1;
      } else {
        lastBestSetupIndex = 0;
      }

      const prevSymbol = activeAsset.symbol;
      activeAsset = winner;

      const pbSelect = document.getElementById("lcPlaybookSelect");
      if (pbSelect && pbSelect.value !== "auto") {
        pbSelect.value = winner.bestPlaybook || "auto";
      }

      refreshAllAssetsAnalysis();
      renderWatchlist();
      if (prevSymbol !== activeAsset.symbol) {
        initTradingViewWidget();
      }

      const tfLabel = (TF_CONFIG[activeTimeframe] && TF_CONFIG[activeTimeframe].label) ? TF_CONFIG[activeTimeframe].label : "30m";
      const pbName = PLAYBOOK_NAMES[winner.bestPlaybook] || "SMC Order Block + FVG";

      updateCenterAndRightPanels(
        "🏆 BEST SETUP FOUND: " + winner.symbol + " (" + winner.signal + " · " + tfLabel + ") via " + pbName + " — " + winner.kpi.conf + " Confidence, " + winner.rr + ", Entry " + winner.entry + "."
      );

      if (bestBtn) {
        bestBtn.disabled = false;
        bestBtn.textContent = "✦ Best setup";
      }
      isScanning = false;
    }
  }, 140);
}

function runFourLlmCouncil() {
  const btn = document.getElementById("lcRunCouncilBtn");
  const statusEl = document.getElementById("lcCouncilStatusText");
  const pills = document.querySelectorAll(".lc-llm-badges-row .lc-llm-pill");

  if (!statusEl || !btn) return;
  btn.disabled = true;
  btn.textContent = "⏳ Running 4 LLMs...";

  triggerVisualChartScan("🧠 4-LLM COUNCIL EVALUATING " + activeAsset.symbol + "...", 950);

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
      btn.disabled = false;
      btn.textContent = "✦ Run Council";
      updateCenterAndRightPanels(
        "✓ 4-LLM Council Unanimous (" + activeAsset.kpi.conf + " confidence): " + activeAsset.signal + " " + activeAsset.symbol + " at " + activeAsset.entry + " | SL " + activeAsset.sl + " | TP1 " + activeAsset.tp1 + "."
      );
    }
  }, 220);
}

// ==========================================
// 10. INTERACTIVE EVENTS, SHORTCUTS & LIVE STREAM
// ==========================================
function bindEvents() {
  document.querySelectorAll("#lcTimeframeGroup .lc-tf-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#lcTimeframeGroup .lc-tf-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      activeTimeframe = btn.getAttribute("data-tf") || "30";

      const horizonSelect = document.getElementById("lcHorizonSelect");
      const tfCfg = TF_CONFIG[activeTimeframe];
      if (horizonSelect && tfCfg) {
        if (tfCfg.horizon === "Scalp") horizonSelect.value = "Scalp (M1–M15)";
        else if (tfCfg.horizon === "Swing") horizonSelect.value = "Swing (H4–D1)";
        else horizonSelect.value = "Intraday";
      }

      runLiveChartAnalysis({ reloadWidget: true, reason: "Timeframe Change" });
    });
  });

  document.querySelectorAll("#lcClassTabs .lc-class-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll("#lcClassTabs .lc-class-tab").forEach(function (t) { t.classList.remove("active"); });
      tab.classList.add("active");
      activeCategory = tab.getAttribute("data-cat") || "ALL";
      renderWatchlist();
    });
  });

  document.querySelectorAll("#lcPanelTabs .lc-p-tab").forEach(function (tabBtn) {
    tabBtn.addEventListener("click", function () {
      const tabName = tabBtn.getAttribute("data-tab") || "analysis";
      switchRightPanelTab(tabName);
    });
  });

  ["lcPlaybookSelect", "lcRiskSelect", "lcHorizonSelect"].forEach(function (selectId) {
    const el = document.getElementById(selectId);
    if (el) {
      el.addEventListener("change", function () {
        runLiveChartAnalysis({ reloadWidget: false, reason: "Filter Updated" });
      });
    }
  });

  const searchEl = document.getElementById("lcWatchSearch");
  if (searchEl) {
    searchEl.addEventListener("input", function (e) {
      watchSearchQuery = e.target.value.trim();
      renderWatchlist();
    });
  }

  const workspace = document.getElementById("lcWorkspace");
  const toggleSidebar = function () {
    if (workspace) workspace.classList.toggle("sidebar-collapsed");
  };
  const sideBtn = document.getElementById("lcToggleSidebarBtn");
  const scSideBtn = document.getElementById("scSidebar");
  if (sideBtn) sideBtn.addEventListener("click", toggleSidebar);
  if (scSideBtn) scSideBtn.addEventListener("click", toggleSidebar);

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

  const councilBtn = document.getElementById("lcRunCouncilBtn");
  const scCouncilBtn = document.getElementById("scRunCouncil");
  if (councilBtn) councilBtn.addEventListener("click", runFourLlmCouncil);
  if (scCouncilBtn) scCouncilBtn.addEventListener("click", runFourLlmCouncil);

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
      const panel = document.getElementById("lcAiPanel");
      if (panel) panel.scrollIntoView({ behavior: "smooth" });
      runLiveChartAnalysis({ reloadWidget: false });
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
    } else if (key === "s") {
      e.preventDefault();
      if (searchEl) searchEl.focus();
    }
  });

  ["lcNavMusicBtn", "lcSoundToggleBtn"].forEach(function (id) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", toggleAudioPlayback);
  });
}

// Live Price Micro-Ticks + Live Level Auto-Sync
function startLivePriceStream() {
  setInterval(function () {
    WATCHLIST_DB.forEach(function (item) {
      const step =
        item.symbol === "XAUUSD" ? 0.45 :
        item.symbol === "BTCUSDT" ? 18.0 :
        item.decimals === 4 ? 0.0002 : 2.5;
      const delta = (Math.random() - 0.49) * step;
      item.price = Math.max(0.0001, item.price + delta);

      const wiEl = document.getElementById("wiPrice_" + item.symbol);
      if (wiEl) wiEl.textContent = item.price.toFixed(item.decimals);
    });

    // Dynamically recalculate levels on live tick so chart & panel stay 100% synced
    refreshAllAssetsAnalysis();

    const formatted = fmtPrice(activeAsset.price, activeAsset.decimals);
    const topEl = document.getElementById("lcTopLivePrice");
    const closeEl = document.getElementById("lcLastCandleClose");
    if (topEl) topEl.textContent = formatted;
    if (closeEl) closeEl.textContent = formatted;

    // Keep Entry/SL/TP strip & table synced with live price ticks
    const setTxt = function (id, val) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setTxt("lcStripEntry", "Entry " + activeAsset.signal + ": " + activeAsset.entry);
    setTxt("lcStripSL", "SL: " + activeAsset.sl);
    setTxt("lcStripTP1", "TP1: " + activeAsset.tp1);
    setTxt("lcStripTP2", "TP2: " + activeAsset.tp2);
    setTxt("lcStripTP3", "TP3: " + activeAsset.tp3);
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
// 11. INITIALIZE EVERYTHING
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  injectScannerStyles();

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
});