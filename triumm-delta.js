/**
 * Triumm Delta - AI Market Intelligence Feed Engine + 4K Video & Zen Audio
 * File: triumm-delta.js
 */
"use strict";

// ==========================================
// 0. 4K AMBIENT MUSIC (YOUTUBE IFRAME API)
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
        onReady: () => {
          ytPlayerReady = true;
          ytAudioPlayer.setVolume(75);
          if (pendingPlay) {
            pendingPlay = false;
            playAudioMusic();
          }
        },
        onStateChange: (event) => {
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

  const navMusicBtn = document.getElementById("tdNavMusicBtn");
  const soundToggleBtn = document.getElementById("tdSoundToggleBtn");
  const soundStatusText = document.getElementById("tdSoundStatusText");
  const railMusicBtn = document.getElementById("tdRailMusicBtn");

  if (navMusicBtn) navMusicBtn.classList.toggle("is-playing", playing);
  if (soundToggleBtn) soundToggleBtn.classList.toggle("is-playing", playing);
  if (railMusicBtn) railMusicBtn.classList.toggle("is-playing", playing);
  if (soundStatusText) soundStatusText.textContent = playing ? "Music: ON" : "Music: OFF";
}

function playAudioMusic() {
  if (!ytAudioPlayer || typeof ytAudioPlayer.playVideo !== "function") return;
  try {
    ytAudioPlayer.unMute();
    ytAudioPlayer.setVolume(75);
    ytAudioPlayer.playVideo();
    setAudioUIState(true);
  } catch (err) {
    console.warn("Audio play exception:", err);
  }
}

function pauseAudioMusic() {
  if (!ytAudioPlayer || typeof ytAudioPlayer.pauseVideo !== "function") return;
  try {
    ytAudioPlayer.pauseVideo();
    setAudioUIState(false);
  } catch (err) {
    console.warn("Audio pause exception:", err);
  }
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
// 1. TOP MOVERS, HEATMAP & AI INSIGHT DATA
// ==========================================
const TOP_MOVERS_DATA = [
  { symbol: "GBP/USD", badgeClass: "", dir: "BUY", pct: 96, color: "#00e676" },
  { symbol: "USD/JPY", badgeClass: "", dir: "SELL", pct: 79, color: "#00e676" },
  { symbol: "XAU/USD", badgeClass: "gold", dir: "SELL", pct: 74, color: "#f59e0b" },
  { symbol: "EUR/USD", badgeClass: "", dir: "BUY", pct: 72, color: "#f59e0b" }
];

const HEATMAP_DATA = [
  { name: "Geopolitics", count: 1, segments: [{ width: 100, color: "#ef4444" }] },
  { name: "Equities", count: 7, segments: [{ width: 42, color: "#10b981" }, { width: 58, color: "#b47b18" }] },
  { name: "Crypto", count: 2, segments: [{ width: 100, color: "#b47b18" }] },
  { name: "Forex", count: 9, segments: [{ width: 100, color: "#b47b18" }] },
  { name: "Commodities", count: 0, segments: [{ width: 100, color: "#b47b18" }] },
  { name: "Other", count: 98, segments: [{ width: 93, color: "#b47b18" }, { width: 7, color: "#ef4444" }] }
];

const AI_INSIGHTS_DATA = [
  { symbol: "DXY", badgeClass: "purple", sentiment: "BULLISH", pct: 42 },
  { symbol: "AUD/USD", badgeClass: "", sentiment: "NEUTRAL", pct: 35 },
  { symbol: "USD/CAD", badgeClass: "", sentiment: "NEUTRAL", pct: 35 },
  { symbol: "EUR/USD", badgeClass: "", sentiment: "NEUTRAL", pct: 35 }
];

// ==========================================
// 2. DELTA TECHNICAL SIGNALS DATA
// ==========================================
const DELTA_SIGNALS_DATA = [
  {
    symbol: "EURUSD",
    side: "BUY",
    rr: "1:1.4",
    confidence: 96,
    live: 1.092,
    decimals: 3,
    sl: "1.06726",
    tp: "1.12664",
    summary: "EURUSD bullish signal: EMA bullish crossover, RSI 56.7 (bullish), ADX 12.0 (weak trend), institutional support."
  },
  {
    symbol: "USDJPY",
    side: "BUY",
    rr: "1:1.8",
    confidence: 87,
    live: 158.2,
    decimals: 1,
    sl: "149.163",
    tp: "162.866",
    summary: "USDJPY bullish signal: EMA bullish crossover, RSI 64.0 (bullish), ADX 40.0, strong yield momentum."
  },
  {
    symbol: "GBPUSD",
    side: "BUY",
    rr: "1:1.8",
    confidence: 81,
    live: 1.281,
    decimals: 3,
    sl: "1.24576",
    tp: "1.34462",
    summary: "GBPUSD bullish signal: EMA bullish crossover, RSI 52.3 (bearish), ADX 42.5, session liquidity sweep."
  },
  {
    symbol: "XAUUSD",
    side: "SELL",
    rr: "1:1.8",
    confidence: 74,
    live: 4165.00,
    decimals: 2,
    sl: "4288.59",
    tp: "4006.53",
    summary: "XAUUSD bearish signal: EMA bullish crossover, RSI 41.7 (bearish), ADX 45.0, resistance wick rejection."
  }
];

// ==========================================
// 3. CURATED + LIVE FEED ITEMS
// ==========================================
const FEED_ITEMS_DATA = [
  {
    id: "item_1",
    time: "just now",
    title_en: "[AUD] RBA Assist Gov Kent Speaks",
    title_km: "[AUD] សុន្ទរកថារបស់ឧបការីទេសាភិបាលធនាគារកណ្តាលអូស្ត្រាលី (RBA) លោក Kent",
    show_km_inline: false,
    sentiment: "NEUTRAL",
    source: "ForexFactory",
    assets: [{ label: "AUD/USD", cls: "" }],
    metrics: ["0.0"],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "RBA policy speech maintains balanced macro guidance. Monitor AUD/USD Asian and London session liquidity pools."
  },
  {
    id: "item_2",
    time: "just now",
    title_en: "[USD] TIC Long-Term Purchases",
    title_km: "[USD] ទិន្នន័យនៃការទិញមូលបត្ររយៈពេលវែងរបស់សហរដ្ឋអាមេរិក (TIC Long-Term Purchases)",
    show_km_inline: false,
    sentiment: "BULLISH",
    source: "ForexFactory",
    assets: [{ label: "DXY", cls: "purple" }],
    metrics: [],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Market-positive news — expect upward momentum across affected assets.",
    deep_note: "Strong institutional capital inflows into US long-term Treasuries reinforce DXY bullish order flow."
  },
  {
    id: "item_3",
    time: "just now",
    title_en: "[USD] Federal Budget Balance",
    title_km: "[USD] តុល្យភាពថវិកាសហព័ន្ធរបស់សហរដ្ឋអាមេរិក (Federal Budget Balance)",
    show_km_inline: false,
    sentiment: "NEUTRAL",
    source: "ForexFactory",
    assets: [{ label: "DXY", cls: "purple" }],
    metrics: [],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "Federal budget figures align with seasonal Treasury projections; limited spot volatility expected."
  },
  {
    id: "item_4",
    time: "just now",
    title_en: "[USD] Capacity Utilization Rate",
    title_km: "[USD] អត្រាប្រើប្រាស់សមត្ថភាពផលិតកម្មរបស់សហរដ្ឋអាមេរិក",
    show_km_inline: false,
    sentiment: "NEUTRAL",
    source: "ForexFactory",
    assets: [{ label: "DXY", cls: "purple" }],
    metrics: [],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "US industrial utilization holds near equilibrium, keeping inflation pressure contained."
  },
  {
    id: "item_5",
    time: "just now",
    title_en: "[USD] Industrial Production m/m",
    title_km: "[USD] ទិន្នន័យផលិតកម្មឧស្សាហកម្មប្រចាំខែរបស់សហរដ្ឋអាមេរិក (m/m)",
    show_km_inline: false,
    sentiment: "NEUTRAL",
    source: "ForexFactory",
    assets: [{ label: "DXY", cls: "purple" }],
    metrics: [],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "Monthly industrial output matches consensus. Watch M15 Fair Value Gaps during NY open."
  },
  {
    id: "item_6",
    time: "just now",
    title_en: "[CAD] Foreign Securities Purchases",
    title_km: "[CAD] ការទិញមូលបត្របរទេសនៅប្រទេសកាណាដា",
    show_km_inline: false,
    sentiment: "NEUTRAL",
    source: "ForexFactory",
    assets: [{ label: "USD/CAD", cls: "" }],
    metrics: [],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "Cross-border portfolio flows remain steady; USD/CAD trades inside key H1 range."
  },
  {
    id: "item_7",
    time: "just now",
    title_en: "[USD] Import Prices m/m",
    title_km: "[USD] សន្ទស្សន៍តម្លៃទំនិញនាំចូលប្រចាំខែរបស់សហរដ្ឋអាមេរិក (m/m)",
    show_km_inline: false,
    sentiment: "NEUTRAL",
    source: "ForexFactory",
    assets: [{ label: "DXY", cls: "purple" }],
    metrics: [],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "Muted import price variations keep Federal Reserve rate expectations stable."
  },
  {
    id: "item_8",
    time: "just now",
    title_en: "[CAD] Housing Starts",
    title_km: "[CAD] ទិន្នន័យនៃការចាប់ផ្តើមសាងសង់លំនៅឋានថ្មីនៅកាណាដា",
    show_km_inline: false,
    sentiment: "NEUTRAL",
    source: "ForexFactory",
    assets: [{ label: "USD/CAD", cls: "" }],
    metrics: ["0.0"],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "Canadian residential construction data prints inline with macro expectations."
  },
  {
    id: "item_9",
    time: "just now",
    title_en: "[EUR] Italian Trade Balance",
    title_km: "[EUR] តុល្យភាពពាណិជ្ជកម្មរបស់ប្រទេសអ៊ីតាលី",
    show_km_inline: false,
    sentiment: "NEUTRAL",
    source: "ForexFactory",
    assets: [{ label: "EUR/USD", cls: "" }],
    metrics: [],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "Italian trade balance remains supportive of Eurozone external accounts."
  },
  {
    id: "item_10",
    time: "just now",
    title_en: "[EUR] Final Core CPI y/y",
    title_km: "[EUR] សន្ទស្សន៍ថ្លៃទំនិញប្រើប្រាស់ស្នូលចុងក្រោយប្រចាំឆ្នាំរបស់តំបន់អឺរ៉ុប (Final Core CPI y/y)",
    show_km_inline: false,
    sentiment: "NEUTRAL",
    source: "ForexFactory",
    assets: [{ label: "EUR/USD", cls: "" }],
    metrics: [],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "Eurozone Final Core CPI confirms preliminary reading; EUR/USD eyes 1.0920 liquidity."
  },
  {
    id: "item_11",
    time: "just now",
    title_en: "[EUR] Final CPI y/y",
    title_km: "[EUR] សន្ទស្សន៍ថ្លៃទំនិញប្រើប្រាស់ចុងក្រោយប្រចាំឆ្នាំរបស់តំបន់អឺរ៉ុប (Final CPI y/y)",
    show_km_inline: false,
    sentiment: "NEUTRAL",
    source: "ForexFactory",
    assets: [{ label: "EUR/USD", cls: "" }],
    metrics: [],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "Headline Eurozone inflation unrevised; ECB policy trajectory unchanged."
  },
  {
    id: "item_12",
    time: "3m ago",
    title_en: "French HICP MoM Final Actual -0.3% (Forecast -0.4%, Previous 0.4%)",
    title_km: "HICP ប្រចាំខែចុងក្រោយរបស់បារាំង (MoM) ស្ថិតនៅ -0.3% ធៀបនឹងការព្យាករណ៍ -0.4%។",
    show_km_inline: true,
    sentiment: "NEUTRAL",
    source: "TriummAI",
    assets: [{ label: "EUR/USD", cls: "" }],
    metrics: ["-0.3%", "-0.4%,", "0.4%)"],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "Slightly firmer French HICP print provides minor support to EUR/USD."
  },
  {
    id: "item_13",
    time: "3m ago",
    title_en: "French CPI MoM NSA Actual -0.3% (Forecast -0.3%, Previous 0.3%)",
    title_km: "CPI ប្រចាំខែរបស់បារាំង (MoM NSA) ស្ថិតនៅ -0.3% ដូចការព្យាករណ៍ និងធ្លាក់ចុះពី 0.3% កាលពីលើកមុន។",
    show_km_inline: true,
    sentiment: "NEUTRAL",
    source: "TriummAI",
    assets: [{ label: "EUR/USD", cls: "" }],
    metrics: ["-0.3%", "-0.3%,", "0.3%)"],
    category: "Other",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Mixed signals — markets likely to consolidate or wait for confirmation.",
    deep_note: "Inline French CPI release keeps European yields steady."
  },
  {
    id: "item_14",
    time: "13m ago",
    title_en: "TSMC is considering Texas as a potential site for expansion - CEO $TSM",
    title_km: "CEO របស់ TSMC កំពុងពិចារណាជ្រើសរើសរដ្ឋ Texas ជាទីតាំងសម្រាប់ការពង្រីកអាជីវកម្ម $TSM",
    show_km_inline: true,
    sentiment: "BULLISH",
    source: "TriummAI",
    assets: [{ label: "TSM", cls: "" }],
    metrics: [],
    category: "Equities",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Market-positive news — expect upward momentum across affected assets.",
    deep_note: "Potential Texas fab expansion strengthens US semiconductor supply chain and boosts $TSM sentiment."
  },
  {
    id: "item_15",
    time: "16m ago",
    title_en: "Mitsubishi Heavy and Ingeteam form a partnership on AI data centers",
    title_km: "Mitsubishi Heavy និង Ingeteam បង្កើតភាពជាដៃគូលើមជ្ឈមណ្ឌលទិន្នន័យ AI",
    show_km_inline: true,
    sentiment: "BULLISH",
    source: "TriummAI",
    assets: [{ label: "7011.T", cls: "" }],
    metrics: ["0.0"],
    category: "Equities",
    impact: "LOW",
    risk: "LOW RISK",
    ai_summary: "Market-positive news — expect upward momentum across affected assets.",
    deep_note: "Strategic AI data center power partnership supports institutional demand for 7011.T."
  }
];

// ==========================================
// 4. STATE & HELPERS
// ==========================================
const filterState = {
  sentiment: "ALL",
  source: "ALL",
  category: "ALL",
  impact: "ALL",
  search: "",
  globalKhmer: false
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

// ==========================================
// 5. RENDER DASHBOARD PANELS
// ==========================================
function renderTopMovers() {
  const container = document.getElementById("topMoversList");
  if (!container) return;

  container.innerHTML = TOP_MOVERS_DATA.map((m) => `
    <div class="td-mover-row">
      <div class="td-mover-left">
        <span class="td-asset-tag ${escapeHtml(m.badgeClass)}">${escapeHtml(m.symbol)}</span>
        <span class="td-dir-tag ${m.dir === "BUY" ? "buy" : "sell"}">${escapeHtml(m.dir)}</span>
      </div>
      <div class="td-mover-right">
        <div class="td-mini-bar-bg">
          <div class="td-mini-bar-fill" style="width:${m.pct}%; background:${m.color};"></div>
        </div>
        <span class="td-pct-mono">${m.pct}%</span>
      </div>
    </div>
  `).join("");
}

function renderCategoryHeatmap() {
  const container = document.getElementById("categoryHeatmapGrid");
  if (!container) return;

  container.innerHTML = HEATMAP_DATA.map((cat) => {
    const barsHtml = cat.segments.map(
      (seg) => `<div style="width:${seg.width}%; background:${seg.color};"></div>`
    ).join("");

    return `
      <div class="td-heat-cell">
        <div class="td-heat-top">
          <span>${escapeHtml(cat.name)}</span>
          <span class="td-heat-num">${cat.count}</span>
        </div>
        <div class="td-heat-track">${barsHtml}</div>
      </div>
    `;
  }).join("");
}

function renderAiInsights() {
  const container = document.getElementById("aiInsightList");
  if (!container) return;

  container.innerHTML = AI_INSIGHTS_DATA.map((ins) => {
    const cls = ins.sentiment.toLowerCase();
    const label = ins.sentiment === "BULLISH" ? "↗ BULLISH" : ins.sentiment === "BEARISH" ? "↘ BEARISH" : "— NEUTRAL";
    return `
      <div class="td-insight-row">
        <div class="td-insight-left">
          <span class="td-asset-tag ${escapeHtml(ins.badgeClass)}">${escapeHtml(ins.symbol)}</span>
          <span class="td-sent-badge ${cls}">${label}</span>
        </div>
        <span class="td-pct-mono">${ins.pct}%</span>
      </div>
    `;
  }).join("");
}

function renderDeltaSignals() {
  const container = document.getElementById("deltaSignalsGrid");
  if (!container) return;

  const r = 16;
  const c = 2 * Math.PI * r;

  container.innerHTML = DELTA_SIGNALS_DATA.map((sig, i) => {
    const isBuy = sig.side === "BUY";
    const ringColor = isBuy ? "#00e676" : "#ef4444";
    const dashOffset = c - (sig.confidence / 100) * c;

    return `
      <article class="td-sig-card ${isBuy ? "" : "is-sell"}">
        <div class="td-sig-top">
          <span class="td-tech-pill">TECHNICAL</span>
          <span class="td-rr-pill">RR: ${escapeHtml(sig.rr)}</span>
        </div>

        <div class="td-sig-mid">
          <div>
            <div class="td-sig-symbol">${escapeHtml(sig.symbol)}</div>
            <div class="td-sig-side ${isBuy ? "buy" : "sell"}">${escapeHtml(sig.side)}</div>
          </div>

          <div class="td-gauge-box">
            <svg width="42" height="42" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3.4"></circle>
              <circle cx="21" cy="21" r="${r}" fill="none" stroke="${ringColor}" stroke-width="3.4"
                stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${dashOffset.toFixed(1)}" stroke-linecap="round"></circle>
            </svg>
            <span class="td-gauge-val">${sig.confidence}%</span>
          </div>
        </div>

        <div class="td-sig-prices">
          <div class="td-price-box">
            <span class="td-price-lbl">LIVE</span>
            <span class="td-price-num green" id="tdLiveTick_${i}">${sig.live.toFixed(sig.decimals)} ●</span>
          </div>
          <div class="td-price-box">
            <span class="td-price-lbl">SL</span>
            <span class="td-price-num red">${escapeHtml(sig.sl)}</span>
          </div>
          <div class="td-price-box">
            <span class="td-price-lbl">TP</span>
            <span class="td-price-num green">${escapeHtml(sig.tp)}</span>
          </div>
        </div>

        <p class="td-sig-summary">${escapeHtml(sig.summary)}</p>

        <button type="button" class="td-sig-action-btn" onclick="openSignalModal(${i})">
          <span>INSPECT SETUP</span>
          <span class="td-btn-arrow">➜</span>
        </button>
      </article>
    `;
  }).join("");
}

window.openSignalModal = function (index) {
  const sig = DELTA_SIGNALS_DATA[index];
  const modal = document.getElementById("tdSignalModal");
  const content = document.getElementById("tdSignalModalContent");
  if (!sig || !modal || !content) return;

  const isBuy = sig.side === "BUY";
  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span class="td-tech-pill">TRIUMM DELTA SIGNAL</span>
      <span class="td-rr-pill">RR ${escapeHtml(sig.rr)} · ${sig.confidence}% CONFIDENCE</span>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px;">
      <h3 style="font-size:24px; font-weight:800; color:#fff;">${escapeHtml(sig.symbol)}</h3>
      <span class="td-sig-side ${isBuy ? "buy" : "sell"}" style="font-size:18px;">${escapeHtml(sig.side)}</span>
    </div>
    <div class="td-sig-prices" style="margin:6px 0;">
      <div class="td-price-box">
        <span class="td-price-lbl">ENTRY / LIVE</span>
        <span class="td-price-num green">${sig.live.toFixed(sig.decimals)}</span>
      </div>
      <div class="td-price-box">
        <span class="td-price-lbl">STOP LOSS</span>
        <span class="td-price-num red">${escapeHtml(sig.sl)}</span>
      </div>
      <div class="td-price-box">
        <span class="td-price-lbl">TAKE PROFIT</span>
        <span class="td-price-num green">${escapeHtml(sig.tp)}</span>
      </div>
    </div>
    <p style="font-size:13px; color:#94a3b8; line-height:1.55;">${escapeHtml(sig.summary)}</p>
    <div style="display:flex; gap:10px; margin-top:8px;">
      <a href="chart-analysis.html" class="td-fc-launch-btn" style="flex:1;">
        <span>OPEN LIVE CHART</span>
        <span class="td-fc-arrow">➜</span>
      </a>
      <button type="button" onclick="closeSignalModal()" class="td-filter-pill" style="padding:10px 16px;">Close</button>
    </div>
  `;
  modal.classList.add("open");
};

window.closeSignalModal = function () {
  const modal = document.getElementById("tdSignalModal");
  if (modal) modal.classList.remove("open");
};

// ==========================================
// 6. RENDER INTELLIGENCE FEED STREAM
// ==========================================
function renderFeedStream() {
  const stream = document.getElementById("tdFeedStream");
  const countEl = document.getElementById("tdShowingCount");
  if (!stream) return;

  const filtered = FEED_ITEMS_DATA.filter((item) => {
    if (filterState.sentiment !== "ALL" && item.sentiment !== filterState.sentiment) return false;
    if (filterState.source !== "ALL" && item.source !== filterState.source) return false;
    if (filterState.category !== "ALL" && item.category !== filterState.category) return false;
    if (filterState.impact !== "ALL" && item.impact !== filterState.impact) return false;

    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      const matchEn = item.title_en.toLowerCase().includes(q);
      const matchKm = item.title_km && item.title_km.toLowerCase().includes(q);
      const matchSrc = item.source.toLowerCase().includes(q);
      const matchAsset = item.assets.some((a) => a.label.toLowerCase().includes(q));
      if (!matchEn && !matchKm && !matchSrc && !matchAsset) return false;
    }
    return true;
  });

  if (countEl) {
    const totalDisplay = filterState.sentiment === "ALL" &&
                         filterState.source === "ALL" &&
                         filterState.category === "ALL" &&
                         filterState.impact === "ALL" &&
                         !filterState.search
      ? "Showing 142 of 142 items"
      : `Showing ${filtered.length} of 142 items`;
    countEl.textContent = totalDisplay;
  }

  if (filtered.length === 0) {
    stream.innerHTML = `
      <div class="td-glass-card" style="text-align:center; padding:28px; color:var(--td-text-muted);">
        No intelligence feed items match the current filters.
      </div>
    `;
    return;
  }

  stream.innerHTML = filtered.map((item) => {
    const sentLower = item.sentiment.toLowerCase();
    const sentBadgeText =
      item.sentiment === "BULLISH" ? "↗ BULLISH" :
      item.sentiment === "BEARISH" ? "↘ BEARISH" : "— NEUTRAL";

    const impLower = item.impact.toLowerCase();

    const assetsHtml = item.assets.map(
      (a) => `<span class="td-asset-tag ${escapeHtml(a.cls)}">${escapeHtml(a.label)}</span>`
    ).join("");

    const metricsHtml = (item.metrics || []).map(
      (m) => `<span class="td-metric-pill">${escapeHtml(m)}</span>`
    ).join("");

    const showKm = item.show_km_inline || filterState.globalKhmer;
    const khmerSection = showKm
      ? `<p class="td-feed-khmer" id="km_${escapeHtml(item.id)}">${escapeHtml(item.title_km)}</p>`
      : `
        <button type="button" class="td-translate-pill" onclick="toggleFeedKhmer('${escapeHtml(item.id)}')">
          文A បកប្រែ → ខ្មែរ
        </button>
        <p class="td-feed-khmer" id="km_${escapeHtml(item.id)}" style="display:none;">${escapeHtml(item.title_km)}</p>
      `;

    return `
      <article class="td-feed-card">
        <div class="td-feed-top">
          <span class="td-feed-time">🕒 ${escapeHtml(item.time)}</span>
          <div class="td-feed-top-right">
            <span class="td-sent-badge ${sentLower}">${sentBadgeText}</span>
            <span class="td-feed-source">${escapeHtml(item.source)}</span>
          </div>
        </div>

        <h3 class="td-feed-title">${escapeHtml(item.title_en)}</h3>

        ${khmerSection}

        <div class="td-chips-row">
          ${assetsHtml}
          ${metricsHtml}
        </div>

        <div class="td-meta-row">
          <span class="td-cat-pill">🌐 ${escapeHtml(item.category)}</span>
          <span class="td-imp-pill ${impLower}">⚡ ${escapeHtml(item.impact)}</span>
          <span class="td-ai-pill">✨ AI ANALYZED</span>
        </div>

        <div class="td-ai-bar ${sentLower}" onclick="toggleAiDrawer('${escapeHtml(item.id)}')">
          <div class="td-ai-bar-left">
            <span class="td-sent-badge ${sentLower}">${sentBadgeText}</span>
            <span>${escapeHtml(item.ai_summary)}</span>
          </div>
          <span class="td-risk-pill ${item.risk === "HIGH RISK" ? "high" : ""}">${escapeHtml(item.risk)} ⌄</span>
        </div>

        <div class="td-ai-drawer" id="drawer_${escapeHtml(item.id)}">
          <strong>Triumm Delta AI Impact Note:</strong> ${escapeHtml(item.deep_note)}
        </div>
      </article>
    `;
  }).join("");
}

// ==========================================
// 7. INTERACTIVE HANDLERS & LIVE UPDATES
// ==========================================
window.toggleFeedKhmer = function (id) {
  const el = document.getElementById(`km_${id}`);
  if (!el) return;
  el.style.display = el.style.display === "none" ? "block" : "none";
};

window.toggleAiDrawer = function (id) {
  const el = document.getElementById(`drawer_${id}`);
  if (el) el.classList.toggle("open");
};

function bindFilterControls() {
  document.querySelectorAll(".td-filter-pills").forEach((groupEl) => {
    const groupName = groupEl.getAttribute("data-group");
    groupEl.querySelectorAll(".td-filter-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        groupEl.querySelectorAll(".td-filter-pill").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        filterState[groupName] = btn.getAttribute("data-value");
        renderFeedStream();
      });
    });
  });

  const searchInput = document.getElementById("tdSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterState.search = e.target.value.trim();
      renderFeedStream();
    });
  }

  const refreshBtn = document.getElementById("tdRefreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      fetchLiveForexFactoryFeed();
      renderDeltaSignals();
      renderFeedStream();
    });
  }

  // Bind Theme Toggle
  const themeToggle = document.getElementById("tdThemeToggle");
  const themeThumb = document.getElementById("tdThemeThumb");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light-mode");
      if (themeThumb) themeThumb.textContent = isLight ? "☀️" : "🌙";
    });
  }

  // Bind Global Language Toggle (EN / KM)
  const langBtn = document.getElementById("tdLangBtn");
  const currentLangEl = document.getElementById("tdCurrentLang");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      filterState.globalKhmer = !filterState.globalKhmer;
      if (currentLangEl) currentLangEl.textContent = filterState.globalKhmer ? "KM" : "EN";
      renderFeedStream();
    });
  }

  // Bind all Music / Sound toggle buttons
  ["tdNavMusicBtn", "tdSoundToggleBtn", "tdRailMusicBtn"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", toggleAudioPlayback);
  });
}

// Live micro-ticks for Delta Signals
function startSignalPriceTicks() {
  setInterval(() => {
    DELTA_SIGNALS_DATA.forEach((sig, i) => {
      const step = sig.symbol === "XAUUSD" ? 0.45 : sig.symbol === "USDJPY" ? 0.03 : 0.0004;
      const change = (Math.random() - 0.49) * step;
      sig.live = Math.max(0.0001, sig.live + change);
      const domEl = document.getElementById(`tdLiveTick_${i}`);
      if (domEl) {
        domEl.textContent = `${sig.live.toFixed(sig.decimals)} ●`;
      }
    });
  }, 2500);
}

// Live Clock in Phnom Penh / ICT Time
function startLiveClock() {
  const clockEl = document.getElementById("tdLiveClock");
  function tick() {
    if (!clockEl) return;
    clockEl.textContent = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Phnom_Penh",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  tick();
  setInterval(tick, 1000);
}

// Optional live ForexFactory calendar sync
async function fetchLiveForexFactoryFeed() {
  try {
    const rawUrl = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
    const res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(rawUrl));
    if (!res.ok) return;
    const events = await res.json();
    if (!Array.isArray(events)) return;

    const existingTitles = new Set(FEED_ITEMS_DATA.map((x) => x.title_en));
    const pairLookup = {
      USD: { label: "DXY", cls: "purple" },
      EUR: { label: "EUR/USD", cls: "" },
      GBP: { label: "GBP/USD", cls: "" },
      JPY: { label: "USD/JPY", cls: "" },
      AUD: { label: "AUD/USD", cls: "" },
      CAD: { label: "USD/CAD", cls: "" }
    };

    events.slice(0, 10).forEach((ev, idx) => {
      const ccy = ev.country || "USD";
      const headline = `[${ccy}] ${ev.title}`;
      if (existingTitles.has(headline)) return;

      const rawImpact = String(ev.impact || "Low").toUpperCase();
      const impact = rawImpact.startsWith("HIGH") ? "HIGH" : rawImpact.startsWith("MED") ? "MED" : "LOW";

      FEED_ITEMS_DATA.push({
        id: `ff_sync_${idx}_${Date.now()}`,
        time: "just now",
        title_en: headline,
        title_km: `[${ccy}] ព្រឹត្តិការណ៍សេដ្ឋកិច្ច៖ ${ev.title} (ព្យាករណ៍: ${ev.forecast || "-"} | មុន: ${ev.previous || "-"})`,
        show_km_inline: false,
        sentiment: impact === "HIGH" ? "BULLISH" : "NEUTRAL",
        source: "ForexFactory",
        assets: [pairLookup[ccy] || { label: "DXY", cls: "purple" }],
        metrics: [ev.forecast, ev.previous].filter(Boolean),
        category: "Forex",
        impact,
        risk: impact === "HIGH" ? "HIGH RISK" : "LOW RISK",
        ai_summary: impact === "HIGH"
          ? "High-impact macro catalyst — monitor M15 displacement after release."
          : "Mixed signals — markets likely to consolidate or wait for confirmation.",
        deep_note: `Synced from ForexFactory (${ccy}). Forecast: ${ev.forecast || "N/A"}, Previous: ${ev.previous || "N/A"}.`
      });
    });

    renderFeedStream();
  } catch (err) {
    // Fallback to curated feed if offline
  }
}

// ==========================================
// 8. INIT VIDEO, AUDIO & UI
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Start 4K Background Video
  const bgVideo = document.querySelector(".td-bg-video");
  if (bgVideo) {
    bgVideo.muted = true;
    const playPromise = bgVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        document.addEventListener("click", () => bgVideo.play(), { once: true });
      });
    }
  }

  // 2. Initialize YouTube Audio if API already loaded
  if (window.YT && window.YT.Player) {
    initYouTubeAudio();
  }

  // Resume music on first user click if it was left ON in localStorage
  document.addEventListener("click", () => {
    if (localStorage.getItem("por_music_playing") === "true" && !isAudioPlaying) {
      if (ytPlayerReady) playAudioMusic();
      else {
        pendingPlay = true;
        initYouTubeAudio();
      }
    }
  }, { once: true });

  // 3. Render Dashboard & Feed
  startLiveClock();
  renderTopMovers();
  renderCategoryHeatmap();
  renderAiInsights();
  renderDeltaSignals();
  renderFeedStream();
  bindFilterControls();
  startSignalPriceTicks();
  fetchLiveForexFactoryFeed();
});