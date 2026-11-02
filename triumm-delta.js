/**
 * Triumm Delta - AI Market Intelligence Feed Engine + 4K Video & Zen Audio
 * Live Auto-Sync with ForexFactory & https://phumea.com/triumm-delta
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
//    (Synced with https://phumea.com/triumm-delta)
// ==========================================
let TOP_MOVERS_DATA = [];
let HEATMAP_DATA = [];
let AI_INSIGHTS_DATA = [];
let DELTA_SIGNALS_DATA = [];

// ==========================================
// 3. SMART KHMER TRANSLATOR & PAIR MAPPER
// ==========================================
const PAIR_LOOKUP = {
  USD: { label: "DXY", cls: "purple" },
  EUR: { label: "EUR/USD", cls: "" },
  GBP: { label: "GBP/USD", cls: "" },
  JPY: { label: "USD/JPY", cls: "" },
  AUD: { label: "AUD/USD", cls: "" },
  CAD: { label: "USD/CAD", cls: "" },
  CHF: { label: "USD/CHF", cls: "" },
  NZD: { label: "NZD/USD", cls: "" },
  CNY: { label: "USD/CNH", cls: "" },
  ALL: { label: "XAU/USD", cls: "gold" }
};

const KHMER_GLOSSARY = [
  [/Speaks/gi, "ថ្លែងសុន្ទរកថាគោលនយោបាយ"],
  [/Fed Chairman/gi, "ប្រធានធនាគារកណ្តាលអាមេរិក (Fed)"],
  [/FOMC Member/gi, "សមាជិកគណៈកម្មាធិការ FOMC"],
  [/Gov Council Member/gi, "សមាជិកក្រុមប្រឹក្សាភិបាលធនាគារកណ្តាល"],
  [/Core CPI/gi, "សន្ទស្សន៍ថ្លៃទំនិញប្រើប្រាស់ស្នូល (Core CPI)"],
  [/CPI/gi, "សន្ទស្សន៍ថ្លៃទំនិញប្រើប្រាស់ (CPI)"],
  [/Core PPI/gi, "សន្ទស្សន៍ថ្លៃទំនិញផលិតកម្មស្នូល (Core PPI)"],
  [/PPI/gi, "សន្ទស្សន៍ថ្លៃទំនិញផលិតកម្ម (PPI)"],
  [/Core Retail Sales/gi, "ទិន្នន័យការលក់រាយស្នូល (Core Retail Sales)"],
  [/Retail Sales/gi, "ទិន្នន័យការលក់រាយ (Retail Sales)"],
  [/Unemployment Claims/gi, "ចំនួនអ្នកដាក់ពាក្យស្នើសុំអត្ថប្រយោជន៍អត់ការងារធ្វើ"],
  [/Unemployment Rate/gi, "អត្រាអ្នកអត់ការងារធ្វើ"],
  [/Employment Change/gi, "បម្រែបម្រួលអត្រាមានការងារធ្វើ"],
  [/Industrial Production/gi, "ទិន្នន័យផលិតកម្មឧស្សាហកម្ម"],
  [/Manufacturing Production/gi, "ទិន្នន័យផលិតកម្មរោងចក្រ"],
  [/Manufacturing Sales/gi, "ទិន្នន័យការលក់ផ្នែកផលិតកម្ម"],
  [/Wholesale Sales/gi, "ទិន្នន័យការលក់ដុំ"],
  [/Capacity Utilization Rate/gi, "អត្រាប្រើប្រាស់សមត្ថភាពផលិតកម្ម"],
  [/Trade Balance/gi, "តុល្យភាពពាណិជ្ជកម្ម"],
  [/Federal Budget Balance/gi, "តុល្យភាពថវិកាសហព័ន្ធ"],
  [/TIC Long-Term Purchases/gi, "ការទិញមូលបត្ររយៈពេលវែង (TIC)"],
  [/Foreign Securities Purchases/gi, "ការទិញមូលបត្របរទេស"],
  [/Import Prices/gi, "សន្ទស្សន៍តម្លៃទំនិញនាំចូល"],
  [/Housing Starts/gi, "ការចាប់ផ្តើមសាងសង់លំនៅឋានថ្មី"],
  [/Building Permits/gi, "លិខិតអនុញ្ញាតសាងសង់"],
  [/Crude Oil Inventories/gi, "ស្តុកប្រេងឆៅរបស់សហរដ្ឋអាមេរិក"],
  [/Natural Gas Storage/gi, "ស្តុកឧស្ម័នធម្មជាតិ"],
  [/Business Inventories/gi, "ស្តុកទំនិញអាជីវកម្ម"],
  [/GDP/gi, "ផលិតផលក្នុងស្រុកសរុប (GDP)"],
  [/Beige Book/gi, "របាយការណ៍សេដ្ឋកិច្ច Beige Book របស់ Fed"]
];

function translateEventToKhmer(ccy, title, forecast, previous, actual) {
  let translated = title;
  KHMER_GLOSSARY.forEach(([regex, kmText]) => {
    translated = translated.replace(regex, kmText);
  });
  const stats = [];
  if (actual) stats.push(`ជាក់ស្តែង: ${actual}`);
  if (forecast) stats.push(`ព្យាករណ៍: ${forecast}`);
  if (previous) stats.push(`មុន: ${previous}`);
  const statsSuffix = stats.length ? ` (${stats.join(" | ")})` : "";
  return `[${ccy}] ព្រឹត្តិការណ៍សេដ្ឋកិច្ច៖ ${translated}${statsSuffix}`;
}

function buildFeedItem({
  id,
  time = "just now",
  timestamp = Date.now(),
  ccy = "USD",
  title,
  sentiment = "NEUTRAL",
  source = "ForexFactory",
  category = "Other",
  impact = "LOW",
  risk = "LOW RISK",
  metrics = [],
  assetOverride = null,
  showKmInline = false,
  customKm = null
}) {
  const titleEn = title.startsWith("[") || source !== "ForexFactory" ? title : `[${ccy}] ${title}`;
  const asset = assetOverride || PAIR_LOOKUP[ccy] || { label: "DXY", cls: "purple" };

  let aiSummary = "Mixed signals — markets likely to consolidate or wait for confirmation.";
  if (sentiment === "BULLISH") {
    aiSummary = "Market-positive news — expect upward momentum across affected assets.";
  } else if (sentiment === "BEARISH") {
    aiSummary = "Risk-off signal detected — potential selling pressure ahead.";
  }

  const deepNote =
    impact === "HIGH"
      ? `High-impact ${ccy} macro catalyst on ${asset.label} — monitor M15/H1 liquidity sweep and displacement after release.`
      : impact === "MED"
      ? `Medium-impact ${ccy} release — watch session highs/lows on ${asset.label} for reaction.`
      : `Standard ${ccy} macro release — limited spot volatility expected outside key SNR zones.`;

  return {
    id,
    time,
    timestamp,
    title_en: titleEn,
    title_km: customKm || translateEventToKhmer(ccy, title.replace(/^\[[A-Z]+\]\s*/, ""), metrics[0], metrics[1]),
    show_km_inline: showKmInline,
    sentiment,
    source,
    assets: [asset],
    metrics,
    category,
    impact,
    risk,
    ai_summary: aiSummary,
    deep_note: deepNote
  };
}

// ==========================================
// 4. FULL BASELINE FEED FROM PHUMEA.COM/TRIUMM-DELTA
// ==========================================
let FEED_ITEMS_DATA = [];

// ==========================================
// 5. STATE & HELPERS
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

function formatRelativeTime(timestampMs) {
  if (!timestampMs || isNaN(timestampMs)) return "just now";
  const diffSec = Math.floor((Date.now() - timestampMs) / 1000);
  if (diffSec < -90) {
    const m = Math.ceil(-diffSec / 60);
    if (m < 60) return `in ${m}m`;
    const h = Math.floor(m / 60);
    return h < 24 ? `in ${h}h ${m % 60}m` : `in ${Math.floor(h / 24)}d`;
  }
  if (diffSec < 90) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

// ==========================================
// 6. RENDER DASHBOARD PANELS & LIVE KPIs
// ==========================================
function updateDashboardMetrics() {
  const now = Date.now();
  const totalItems = FEED_ITEMS_DATA.length;
  const highCount = FEED_ITEMS_DATA.filter((i) => i.impact === "HIGH").length;
  const bullishCount = FEED_ITEMS_DATA.filter((i) => i.sentiment === "BULLISH").length;
  const sourcesCount = new Set(FEED_ITEMS_DATA.map((i) => i.source)).size;

  const setText = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
  setText("kpiItemsCount", `${totalItems} ITEMS`);
  setText("kpiMoversCount", `${DELTA_SIGNALS_DATA.length} MOVERS`);
  setText("kpiHighCount", `${highCount} HIGH`);
  setText("kpiSourcesCount", `${sourcesCount} SOURCES`);
  setText("kpiBullishCount", `${bullishCount} BULLISH`);

  // Sentiment bar: last 50 released / published items
  const sample = FEED_ITEMS_DATA.filter((x) => x.timestamp <= now).slice(0, 50);
  const total = sample.length;
  const bull = sample.filter((x) => x.sentiment === "BULLISH").length;
  const bear = sample.filter((x) => x.sentiment === "BEARISH").length;
  const bullPct = total ? Math.round((bull / total) * 100) : 0;
  const bearPct = total ? Math.round((bear / total) * 100) : 0;
  const neutPct = total ? Math.max(0, 100 - bullPct - bearPct) : 100;

  const w = (id, p) => { const el = document.getElementById(id); if (el) el.style.width = `${p}%`; };
  w("sentBarBull", bullPct); w("sentBarNeut", neutPct); w("sentBarBear", bearPct);
  setText("sentLblBull", `▲ ${bullPct}% Bullish`);
  setText("sentLblNeut", `◆ ${neutPct}% Neutral`);
  setText("sentLblBear", `▼ ${bearPct}% Bearish`);
  setText("sentimentAnalyzedText", `${total} analyzed`);

  recomputePanels();
}

function renderTopMovers() {
  const container = document.getElementById("topMoversList");
  if (!container) return;

  if (!TOP_MOVERS_DATA.length) { container.innerHTML = '<div class="td-card-meta">Waiting for live prices…</div>'; return; }
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

  if (!AI_INSIGHTS_DATA.length) { container.innerHTML = '<div class="td-card-meta">Waiting for live news…</div>'; return; }
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

  if (!DELTA_SIGNALS_DATA.length) {
    container.innerHTML = '<div class="td-card-meta" style="grid-column:1/-1;">Calculating live signals from market candles…</div>';
    return;
  }
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
            <span class="td-price-num green" id="tdLiveTick_${i}" style="${sig.prevLive != null && sig.live !== sig.prevLive ? (sig.live > sig.prevLive ? 'color:#00e676;' : 'color:#ef4444;') : ''}">${sig.live.toFixed(sig.decimals)} ●</span>
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
// 7. RENDER INTELLIGENCE FEED STREAM
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

  const displayTotal = FEED_ITEMS_DATA.length;
  if (countEl) {
    const isUnfiltered =
      filterState.sentiment === "ALL" &&
      filterState.source === "ALL" &&
      filterState.category === "ALL" &&
      filterState.impact === "ALL" &&
      !filterState.search;
    countEl.textContent = isUnfiltered
      ? `Showing ${displayTotal} of ${displayTotal} items`
      : `Showing ${filtered.length} of ${displayTotal} items`;
  }

  updateDashboardMetrics();

  if (filtered.length === 0) {
    stream.innerHTML = `
      <div class="td-glass-card" style="text-align:center; padding:28px; color:var(--td-text-muted);">
        No intelligence feed items match the current filters.
      </div>
    `;
    return;
  }

  const openDrawers = new Set([...document.querySelectorAll(".td-ai-drawer.open")].map((d) => d.id));
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
      ? `<p class="td-feed-khmer" id="km_${escapeHtml(item.id)}">${escapeHtml(item.title_km || "កំពុងបកប្រែ…")}</p>`
      : `
        <button type="button" class="td-translate-pill" onclick="toggleFeedKhmer('${escapeHtml(item.id)}')">
          文A បកប្រែ → ខ្មែរ
        </button>
        <p class="td-feed-khmer" id="km_${escapeHtml(item.id)}" style="display:none;">${escapeHtml(item.title_km || "")}</p>
      `;

    return `
      <article class="td-feed-card">
        <div class="td-feed-top">
          <span class="td-feed-time" data-ts="${item.timestamp}">🕒 ${escapeHtml(formatRelativeTime(item.timestamp))}</span>
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

  openDrawers.forEach((id) => { const d = document.getElementById(id); if (d) d.classList.add("open"); });
  if (filterState.globalKhmer) {
    filtered.filter((i) => !i.title_km).slice(0, 15).forEach((item) => {
      ensureKhmer(item).then((t) => {
        const el = document.getElementById(`km_${item.id}`);
        if (el && t) el.textContent = t;
      });
    });
  }
}

// ==========================================
// 8. LIVE DATA ENGINE (no demo data)
//    - Calendar : ForexFactory weekly JSON (faireconomy)
//    - News     : CNBC / Yahoo Finance / Cointelegraph RSS, analysed locally
//    - Signals  : live Yahoo Finance candles -> EMA / RSI / ADX / MACD / Bollinger
//    All requests try direct first, then fall back through CORS proxies.
// ==========================================
let FF_ITEMS = [];
let NEWS_ITEMS = [];
const kmCache = new Map();

async function fetchRaw(targetUrl, timeoutMs = 8000) {
  const routes = [
    (u) => u,
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
  ];
  for (const build of routes) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(build(targetUrl), { signal: controller.signal, cache: "no-store" });
      clearTimeout(timer);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 20) return text;
      }
    } catch (e) {
      clearTimeout(timer);
    }
  }
  return null;
}

async function fetchJson(url) {
  const text = await fetchRaw(url);
  if (!text) return null;
  try { return JSON.parse(text); } catch (e) { return null; }
}

function setFeedStatus(ok) {
  const label = document.querySelector(".td-live-pill span:nth-child(2)");
  if (!label) return;
  label.textContent = ok ? "LIVE FEED SYNC" : "OFFLINE — RETRYING";
}

function hashId(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function rebuildFeed() {
  const now = Date.now();
  const all = [...FF_ITEMS, ...NEWS_ITEMS];
  const upcoming = all.filter((i) => i.timestamp > now).sort((a, b) => a.timestamp - b.timestamp);
  const past = all.filter((i) => i.timestamp <= now).sort((a, b) => b.timestamp - a.timestamp);
  FEED_ITEMS_DATA = [...upcoming, ...past];
  renderFeedStream();
}

// ---------- ForexFactory economic calendar ----------
async function fetchLiveForexFactoryFeed() {
  const refreshBtn = document.getElementById("tdRefreshBtn");
  if (refreshBtn) refreshBtn.style.transform = "rotate(360deg)";

  let events = await fetchJson("https://nfs.faireconomy.media/ff_calendar_thisweek.json");
  if (Array.isArray(events) && events.length) {
    try { localStorage.setItem("td_ff_cache", JSON.stringify(events)); } catch (e) {}
  } else {
    try { events = JSON.parse(localStorage.getItem("td_ff_cache") || "null"); } catch (e) { events = null; }
  }

  if (Array.isArray(events) && events.length) {
    const now = Date.now();
    const INVERSE = /unemployment|jobless|claims|deficit/i;

    FF_ITEMS = events
      .map((ev) => ({ ev, ts: ev.date ? new Date(ev.date).getTime() : NaN }))
      .filter((x) => !isNaN(x.ts) && x.ts <= now + 24 * 3600000)
      .map(({ ev, ts }) => {
        const ccy = String(ev.country || "USD").toUpperCase();
        const title = String(ev.title || "").trim();
        const rawImpact = String(ev.impact || "Low").toUpperCase();
        const impact = rawImpact.startsWith("HIGH") ? "HIGH" : rawImpact.startsWith("MED") ? "MED" : "LOW";

        let sentiment = "NEUTRAL";
        if (ev.actual && ev.forecast) {
          const a = parseFloat(String(ev.actual).replace(/[^0-9.-]/g, ""));
          const f = parseFloat(String(ev.forecast).replace(/[^0-9.-]/g, ""));
          if (!isNaN(a) && !isNaN(f) && a !== f) {
            const better = INVERSE.test(title) ? a < f : a > f;
            sentiment = better ? "BULLISH" : "BEARISH";
          }
        }

        const category = /oil|crude|gas|gold|silver|opec/i.test(title) ? "Commodities" : "Forex";
        const metrics = [];
        if (ev.actual) metrics.push(`A ${ev.actual}`);
        if (ev.forecast) metrics.push(`F ${ev.forecast}`);
        if (ev.previous) metrics.push(`P ${ev.previous}`);

        const item = buildFeedItem({
          id: `ff_${hashId(`${ccy}|${title}|${ev.date}`)}`,
          timestamp: ts,
          ccy,
          title,
          sentiment,
          source: "ForexFactory",
          category,
          impact,
          risk: impact === "HIGH" ? "MEDIUM RISK" : "LOW RISK",
          metrics,
          customKm: translateEventToKhmer(ccy, title, ev.forecast, ev.previous, ev.actual)
        });
        return item;
      });

    LIVE_STATE.ff = true;
    rebuildFeed();
  } else {
    LIVE_STATE.ff = false;
  }
  setFeedStatus(LIVE_STATE.ff || LIVE_STATE.news || LIVE_STATE.prices);

  if (refreshBtn) setTimeout(() => { refreshBtn.style.transform = ""; }, 400);
}

const LIVE_STATE = { ff: null, news: null, prices: null };

// ---------- Live news (RSS) + local AI analysis ----------
const NEWS_FEEDS = [
  { name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
  { name: "CNBC Markets", url: "https://www.cnbc.com/id/20910258/device/rss/rss.html" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss" }
];

const BULL_WORDS = /\b(surge[sd]?|soar(s|ed|ing)?|jump(s|ed)?|rall(y|ies|ied)|rise[sn]?|rising|climb(s|ed)?|gain(s|ed)?|beat(s)?|record high|upgrade[sd]?|boost(s|ed)?|strong|growth|rebound(s|ed)?|recover(s|ed|y)?|optimis\w+|bullish|approv(e|es|ed|al)|breakthrough|expands?|partnership|cuts? rates?|ceasefire|deal)\b/i;
const BEAR_WORDS = /\b(fall(s|en)?|drop(s|ped)?|plunge[sd]?|slump(s|ed)?|tumble[sd]?|sink(s)?|crash(es|ed)?|loss(es)?|miss(es|ed)?|downgrade[sd]?|weak(er|ens)?|recession|fear(s)?|sell-?off|war|attack(s|ed)?|ban(s|ned)?|probe|lawsuit|layoffs?|warn(s|ed|ing)?|bearish|default|tariffs?|sanctions?|hack(ed)?|bankrupt\w*|collapse[sd]?|slash(es|ed)?|concern(s)?)\b/i;
const HIGH_WORDS = /\b(fed|fomc|powell|warsh|cpi|inflation|payrolls|nfp|rate (cut|hike)|war|crash|plunge|tariffs?|default|emergency|ceasefire|sanctions?|bank failure|shutdown)\b/i;
const MED_WORDS = /\b(earnings|gdp|jobs|oil|opec|bitcoin|ethereum|ecb|boj|boe|treasury|yields?|ipo|merger|acquisition)\b/i;

const ASSET_KEYWORDS = [
  [/bitcoin|\bbtc\b/i, { label: "BTC/USD", cls: "" }],
  [/ethereum|\beth\b/i, { label: "ETH/USD", cls: "" }],
  [/\bgold\b/i, { label: "XAU/USD", cls: "gold" }],
  [/\boil\b|crude|brent|\bwti\b|opec/i, { label: "USOIL", cls: "" }],
  [/dollar|\bdxy\b|\bfed\b|treasury/i, { label: "DXY", cls: "purple" }],
  [/\beuro\b|\becb\b|eurozone/i, { label: "EUR/USD", cls: "" }],
  [/\byen\b|\bboj\b|japan/i, { label: "USD/JPY", cls: "" }],
  [/sterling|\bpound\b|\bboe\b|britain|\buk\b/i, { label: "GBP/USD", cls: "" }],
  [/nasdaq/i, { label: "NDX", cls: "" }],
  [/s&p|s&amp;p/i, { label: "SPX", cls: "" }],
  [/\bdow\b/i, { label: "US30", cls: "" }]
];

function classifyHeadline(title) {
  let category = "Other";
  if (/bitcoin|\bbtc\b|ethereum|\beth\b|crypto|solana|\bxrp\b|binance|stablecoin|altcoin|\betf\b.*(bitcoin|crypto)/i.test(title)) category = "Crypto";
  else if (/\boil\b|crude|brent|\bwti\b|\bgold\b|silver|copper|natural gas|opec/i.test(title)) category = "Commodities";
  else if (/dollar|\beuro\b|\byen\b|sterling|forex|currency|\bfx\b|yuan/i.test(title)) category = "Forex";
  else if (/\bwar\b|sanction|ceasefire|missile|tariff|election|nato|ukraine|russia|china|israel|iran|gaza|trade deal|trump|congress|senate/i.test(title)) category = "Geopolitics";
  else if (/stock|shares|earnings|\bipo\b|s&p|nasdaq|\bdow\b|rally|index|\$[A-Z]{1,5}\b|ceo|revenue|profit/i.test(title)) category = "Equities";

  const score = (BULL_WORDS.test(title) ? 1 : 0) - (BEAR_WORDS.test(title) ? 1 : 0);
  const sentiment = score > 0 ? "BULLISH" : score < 0 ? "BEARISH" : "NEUTRAL";
  const impact = HIGH_WORDS.test(title) ? "HIGH" : MED_WORDS.test(title) ? "MED" : "LOW";

  let asset = null;
  const cashtag = title.match(/\$([A-Z]{1,5})\b/);
  if (cashtag) asset = { label: cashtag[1], cls: "" };
  if (!asset) {
    for (const [re, a] of ASSET_KEYWORDS) {
      if (re.test(title)) { asset = a; break; }
    }
  }
  return { category, sentiment, impact, asset: asset || { label: "MARKETS", cls: "" } };
}

function parseRssItems(xmlText, publisher) {
  let doc;
  try { doc = new DOMParser().parseFromString(xmlText, "text/xml"); } catch (e) { return []; }
  const out = [];
  doc.querySelectorAll("item").forEach((node) => {
    const title = (node.querySelector("title")?.textContent || "").replace(/\s+/g, " ").trim();
    const pub = node.querySelector("pubDate")?.textContent;
    const ts = pub ? Date.parse(pub) : NaN;
    if (!title || isNaN(ts)) return;
    out.push({ title, ts, publisher });
  });
  return out.sort((a, b) => b.ts - a.ts).slice(0, 15);
}

async function fetchLiveNews() {
  const results = await Promise.all(
    NEWS_FEEDS.map(async (f) => {
      const text = await fetchRaw(f.url);
      return text ? parseRssItems(text, f.name) : [];
    })
  );

  const cutoff = Date.now() - 48 * 3600000;
  const seen = new Set();
  const items = results.flat()
    .filter((n) => n.ts >= cutoff && n.ts <= Date.now() + 600000)
    .filter((n) => {
      const k = n.title.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  if (!items.length) { LIVE_STATE.news = false; setFeedStatus(LIVE_STATE.ff || LIVE_STATE.news || LIVE_STATE.prices); return; }

  NEWS_ITEMS = items.map((n) => {
    const c = classifyHeadline(n.title);
    const item = buildFeedItem({
      id: `ai_${hashId(n.title)}`,
      timestamp: n.ts,
      ccy: "USD",
      title: n.title,
      sentiment: c.sentiment,
      source: "TriummAI",
      category: c.category,
      impact: c.impact,
      risk: c.impact === "HIGH" ? "HIGH RISK" : c.impact === "MED" ? "MEDIUM RISK" : "LOW RISK",
      metrics: [n.publisher],
      assetOverride: c.asset,
      customKm: "—"
    });
    item.title_km = kmCache.get(n.title) || "";
    item.deep_note = `${c.impact}-impact ${c.category.toLowerCase()} headline on ${c.asset.label} (via ${n.publisher}). Headline tone reads ${c.sentiment.toLowerCase()} — watch ${c.asset.label} for reaction near key liquidity levels.`;
    return item;
  });

  LIVE_STATE.news = true;
  setFeedStatus(true);
  rebuildFeed();
}

// ---------- Live Khmer translation for headlines (on demand) ----------
async function ensureKhmer(item) {
  if (item.title_km) return item.title_km;
  if (kmCache.has(item.title_en)) { item.title_km = kmCache.get(item.title_en); return item.title_km; }
  try {
    const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(item.title_en)}&langpair=en|km`);
    const j = await r.json();
    const t = j && j.responseData && j.responseData.translatedText;
    if (t && !/MYMEMORY WARNING|INVALID/i.test(t)) {
      kmCache.set(item.title_en, t);
      item.title_km = t;
    }
  } catch (e) {}
  return item.title_km || "";
}

// ---------- Technical indicators ----------
function emaArr(v, p) {
  const k = 2 / (p + 1);
  const out = [];
  let e = v[0];
  for (let i = 0; i < v.length; i++) {
    e = i === 0 ? v[0] : v[i] * k + e * (1 - k);
    out.push(e);
  }
  return out;
}

function rsiLast(c, p = 14) {
  if (c.length < p + 1) return 50;
  let g = 0, l = 0;
  for (let i = 1; i <= p; i++) {
    const d = c[i] - c[i - 1];
    if (d >= 0) g += d; else l -= d;
  }
  let ag = g / p, al = l / p;
  for (let i = p + 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    ag = (ag * (p - 1) + Math.max(d, 0)) / p;
    al = (al * (p - 1) + Math.max(-d, 0)) / p;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}

function adxAtr(h, l, c, p = 14) {
  const TR = [], PD = [], MD = [];
  for (let i = 1; i < c.length; i++) {
    const up = h[i] - h[i - 1];
    const dn = l[i - 1] - l[i];
    PD.push(up > dn && up > 0 ? up : 0);
    MD.push(dn > up && dn > 0 ? dn : 0);
    TR.push(Math.max(h[i] - l[i], Math.abs(h[i] - c[i - 1]), Math.abs(l[i] - c[i - 1])));
  }
  if (TR.length < p * 2) return { adx: 0, pdi: 0, mdi: 0, atr: TR.length ? TR[TR.length - 1] : 0 };

  let trS = 0, pS = 0, mS = 0;
  for (let i = 0; i < p; i++) { trS += TR[i]; pS += PD[i]; mS += MD[i]; }
  const dx = [];
  let pdi = 0, mdi = 0;
  for (let i = p; i <= TR.length; i++) {
    if (i > p) {
      trS = trS - trS / p + TR[i - 1];
      pS = pS - pS / p + PD[i - 1];
      mS = mS - mS / p + MD[i - 1];
    }
    pdi = trS ? (100 * pS) / trS : 0;
    mdi = trS ? (100 * mS) / trS : 0;
    dx.push((100 * Math.abs(pdi - mdi)) / ((pdi + mdi) || 1));
  }
  let adx = dx.slice(0, p).reduce((a, b) => a + b, 0) / Math.min(p, dx.length);
  for (let j = p; j < dx.length; j++) adx = (adx * (p - 1) + dx[j]) / p;
  return { adx, pdi, mdi, atr: trS / p };
}

function computeSignal(cfg, bars, livePrice) {
  const c = bars.map((b) => b.c), h = bars.map((b) => b.h), l = bars.map((b) => b.l);
  const price = livePrice || c[c.length - 1];
  const n = c.length - 1;

  const ema9 = emaArr(c, 9)[n], ema21 = emaArr(c, 21)[n], ema50 = emaArr(c, 50)[n];
  const rsi = rsiLast(c, 14);
  const { adx, pdi, mdi, atr } = adxAtr(h, l, c, 14);
  const macdLine = emaArr(c, 12).map((v, i) => v - emaArr(c, 26)[i]);
  const macdHist = macdLine[n] - emaArr(macdLine, 9)[n];
  const win = c.slice(-20);
  const mean = win.reduce((a, b) => a + b, 0) / win.length;
  const sd = Math.sqrt(win.reduce((a, b) => a + (b - mean) ** 2, 0) / win.length) || 1e-9;
  const pctB = (price - (mean - 2 * sd)) / (4 * sd);
  const roc = c[n] - c[Math.max(0, n - 10)];

  // 7 confirmation layers: +1 bullish, -1 bearish, 0 neutral
  const layers = [
    ema9 > ema21 ? 1 : -1,
    price > ema50 ? 1 : -1,
    rsi > 55 ? 1 : rsi < 45 ? -1 : 0,
    macdHist > 0 ? 1 : macdHist < 0 ? -1 : 0,
    adx >= 20 ? (pdi > mdi ? 1 : -1) : 0,
    pctB > 0.55 ? 1 : pctB < 0.45 ? -1 : 0,
    roc > 0 ? 1 : roc < 0 ? -1 : 0
  ];
  const bull = layers.filter((x) => x > 0).length;
  const bear = layers.filter((x) => x < 0).length;
  const isBuy = bull === bear ? ema9 > ema21 : bull > bear;
  const aligned = Math.max(bull, bear);
  const confidence = Math.min(96, Math.max(40, Math.round(42 + (aligned / 7) * 54)));

  const dist = Math.max(atr * 1.5, price * 0.0006);
  const d = cfg.decimals;
  const sl = isBuy ? price - dist : price + dist;
  const tp = isBuy ? price + dist * 1.8 : price - dist * 1.8;
  const bbTxt = pctB > 0.8 ? "Bollinger Bands overbought" : pctB < 0.2 ? "Bollinger Bands oversold" : "Bollinger Bands neutral";

  return {
    symbol: cfg.symbol,
    side: isBuy ? "BUY" : "SELL",
    rr: "1:1.8",
    confidence,
    live: price,
    decimals: d,
    sl: sl.toFixed(d),
    tp: tp.toFixed(d),
    summary: `${cfg.symbol} ${isBuy ? "bullish" : "bearish"} signal: EMA ${ema9 > ema21 ? "bullish" : "bearish"} crossover, RSI ${rsi.toFixed(1)} (${rsi > 55 ? "bullish" : rsi < 45 ? "bearish" : "neutral"}), ADX ${adx.toFixed(1)} (${adx >= 25 ? "trending" : adx >= 20 ? "building" : "ranging"}). ${bbTxt}. ${aligned}/7 confirmation layers aligned.`
  };
}

const SIGNAL_CONFIG = [
  { symbol: "EURUSD", yahoo: ["EURUSD=X"], decimals: 5 },
  { symbol: "GBPUSD", yahoo: ["GBPUSD=X"], decimals: 5 },
  { symbol: "USDJPY", yahoo: ["JPY=X"], decimals: 3 },
  { symbol: "XAUUSD", yahoo: ["XAUUSD=X", "GC=F"], decimals: 2 }
];

async function fetchYahooBars(ysym) {
  for (const host of ["query1", "query2"]) {
    const j = await fetchJson(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ysym)}?interval=15m&range=5d`);
    const r = j && j.chart && j.chart.result && j.chart.result[0];
    if (!r || !r.timestamp) continue;
    const q = r.indicators.quote[0];
    const bars = [];
    r.timestamp.forEach((t, i) => {
      if ([q.open[i], q.high[i], q.low[i], q.close[i]].every((v) => v != null)) {
        bars.push({ t: t * 1000, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i] });
      }
    });
    if (bars.length >= 60) return { bars, price: r.meta && r.meta.regularMarketPrice };
  }
  return null;
}

async function refreshSignals() {
  const results = await Promise.all(SIGNAL_CONFIG.map(async (cfg) => {
    for (const ysym of cfg.yahoo) {
      const data = await fetchYahooBars(ysym);
      if (data) return { cfg, data };
    }
    return { cfg, data: null };
  }));

  let okCount = 0;
  let newestBar = 0;
  results.forEach(({ cfg, data }, i) => {
    if (!data) return;
    okCount++;
    newestBar = Math.max(newestBar, data.bars[data.bars.length - 1].t);
    const prev = DELTA_SIGNALS_DATA.find((s) => s.symbol === cfg.symbol);
    const sig = computeSignal(cfg, data.bars, data.price);
    sig.prevLive = prev ? prev.live : sig.live;
    const idx = DELTA_SIGNALS_DATA.findIndex((s) => s.symbol === cfg.symbol);
    if (idx >= 0) DELTA_SIGNALS_DATA[idx] = sig; else DELTA_SIGNALS_DATA.push(sig);
  });

  LIVE_STATE.prices = okCount > 0;
  setFeedStatus(LIVE_STATE.ff || LIVE_STATE.news || LIVE_STATE.prices);

  const liveEl = document.querySelector("#deltaSignalsSection .td-signals-live");
  if (liveEl && okCount > 0) {
    const closed = Date.now() - newestBar > 45 * 60000;
    liveEl.innerHTML = closed
      ? `<span class="td-live-dot"></span> Market closed · last bar ${new Date(newestBar).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
      : `<span class="td-live-dot"></span> Live`;
  }

  if (okCount > 0) {
    // keep fixed card order
    DELTA_SIGNALS_DATA.sort((a, b) => SIGNAL_CONFIG.findIndex((c) => c.symbol === a.symbol) - SIGNAL_CONFIG.findIndex((c) => c.symbol === b.symbol));
    renderDeltaSignals();
    recomputePanels();
  }
}

// ---------- Derived panels (Top Movers, Heatmap, AI Insight, KPIs) ----------
function recomputePanels() {
  // Top movers = live technical signals ranked by confidence
  TOP_MOVERS_DATA = [...DELTA_SIGNALS_DATA]
    .sort((a, b) => b.confidence - a.confidence)
    .map((s) => ({
      symbol: `${s.symbol.slice(0, 3)}/${s.symbol.slice(3)}`,
      badgeClass: s.symbol.startsWith("XAU") ? "gold" : "",
      dir: s.side,
      pct: s.confidence,
      color: s.symbol.startsWith("XAU") ? "#f59e0b" : s.side === "BUY" ? "#00e676" : "#ef4444"
    }));

  // Category heatmap from the live feed
  const cats = ["Geopolitics", "Equities", "Crypto", "Forex", "Commodities", "Other"];
  HEATMAP_DATA = cats.map((name) => {
    const items = FEED_ITEMS_DATA.filter((i) => i.category === name);
    const total = items.length;
    if (!total) return { name, count: 0, segments: [{ width: 100, color: "#b47b18" }] };
    const bull = items.filter((i) => i.sentiment === "BULLISH").length;
    const bear = items.filter((i) => i.sentiment === "BEARISH").length;
    const neut = total - bull - bear;
    const segs = [
      { width: Math.round((bull / total) * 100), color: "#10b981" },
      { width: Math.round((neut / total) * 100), color: "#b47b18" },
      { width: Math.round((bear / total) * 100), color: "#ef4444" }
    ].filter((s) => s.width > 0);
    return { name, count: total, segments: segs };
  });

  // AI insight: sentiment per asset from the live feed
  const byAsset = new Map();
  FEED_ITEMS_DATA.forEach((i) => {
    if (i.timestamp > Date.now()) return;
    i.assets.forEach((a) => {
      const row = byAsset.get(a.label) || { cls: a.cls, bull: 0, bear: 0, neut: 0 };
      if (i.sentiment === "BULLISH") row.bull++; else if (i.sentiment === "BEARISH") row.bear++; else row.neut++;
      byAsset.set(a.label, row);
    });
  });
  AI_INSIGHTS_DATA = [...byAsset.entries()]
    .map(([symbol, r]) => {
      const total = r.bull + r.bear + r.neut;
      let sentiment = "NEUTRAL", count = r.neut;
      if (r.bull > r.bear && r.bull >= r.neut) { sentiment = "BULLISH"; count = r.bull; }
      else if (r.bear > r.bull && r.bear >= r.neut) { sentiment = "BEARISH"; count = r.bear; }
      return { symbol, badgeClass: r.cls, sentiment, pct: Math.round((count / total) * 100), total };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  renderTopMovers();
  renderCategoryHeatmap();
  renderAiInsights();
}

// ==========================================
// 9. INTERACTIVE HANDLERS & LIVE TIMERS
// ==========================================
window.toggleFeedKhmer = function (id) {
  const el = document.getElementById(`km_${id}`);
  if (!el) return;
  const show = el.style.display === "none";
  el.style.display = show ? "block" : "none";
  const item = FEED_ITEMS_DATA.find((x) => x.id === id);
  if (show && item && !item.title_km) {
    el.textContent = "កំពុងបកប្រែ…";
    ensureKhmer(item).then((t) => { el.textContent = t || item.title_en; });
  }
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
      fetchLiveNews();
      refreshSignals();
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

// ==========================================
// 10. INIT VIDEO, AUDIO, FEED & AUTO-POLLING
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

  // 3. Render Dashboard & Feed Immediately
  startLiveClock();
  renderTopMovers();
  renderCategoryHeatmap();
  renderAiInsights();
  renderDeltaSignals();
  renderFeedStream();
  bindFilterControls();

  // 4. Live data: calendar, news, technical signals (auto-polling)
  fetchLiveForexFactoryFeed();
  fetchLiveNews();
  refreshSignals();
  setInterval(fetchLiveForexFactoryFeed, 120000);
  setInterval(fetchLiveNews, 180000);
  setInterval(refreshSignals, 45000);
  setInterval(() => {
    document.querySelectorAll(".td-feed-time[data-ts]").forEach((el) => {
      el.textContent = `🕒 ${formatRelativeTime(Number(el.dataset.ts))}`;
    });
  }, 30000);
});

// ==========================================
// DYNAMIC 4K BACKGROUND TOGGLE
// pref: "on" | "off" | null (null = ON by default in every theme)
// ==========================================
function applyBg4k() {
  let pref = null;
  try { pref = localStorage.getItem("td_bg4k"); } catch (e) {}
  const isLight = document.body.classList.contains("light-mode");
  const on = pref !== "off"; // default ON (dark + light mode) unless the user turned it off
  document.body.classList.toggle("bg-4k-on", on);

  const btn = document.getElementById("tdBgToggleBtn");
  const label = document.getElementById("tdBgStatusText");
  if (btn) { btn.classList.toggle("is-on", on); btn.setAttribute("aria-pressed", String(on)); }
  if (label) label.textContent = `4K Background: ${on ? "ON" : "OFF"}`;

  const video = document.querySelector(".td-bg-video");
  if (video && on) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
  else if (video) video.pause();
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("tdBgToggleBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const nowOn = document.body.classList.contains("bg-4k-on");
      try { localStorage.setItem("td_bg4k", nowOn ? "off" : "on"); } catch (e) {}
      applyBg4k();
    });
  }
  const themeToggle = document.getElementById("tdThemeToggle");
  if (themeToggle) themeToggle.addEventListener("click", applyBg4k);
  applyBg4k();
});