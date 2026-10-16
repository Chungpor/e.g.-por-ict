/**
 * Por AI Chat — Aquamarine "Por AI Chat" Feature Card + 6 LightCyan Cards + Custom Logo & Chart Snap
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
// 2. POR1.0 AI KNOWLEDGE & LIVE MARKET ENGINE
// ==========================================
function getLiveMarketSnapshot() {
  const db = window.WATCHLIST_DB || [];
  const gold = db.find(function (x) { return x.symbol === "XAUUSD"; }) || {
    symbol: "XAUUSD", signal: "BUY", price: 4175.99, entry: "4,175.99", sl: "4,165.98", tp1: "4,188.59", kpi: { conf: "78%" }
  };
  const btc = db.find(function (x) { return x.symbol === "BTCUSDT"; }) || {
    symbol: "BTCUSDT", signal: "SELL", price: 81911.66, entry: "81,911.66", sl: "82,650.00", tp1: "80,800.00", kpi: { conf: "76%" }
  };
  const nas = db.find(function (x) { return x.symbol === "NAS100"; }) || {
    symbol: "NAS100", signal: "BUY", price: 20485.50, entry: "20,485.50", sl: "20,360.00", tp1: "20,670.00", kpi: { conf: "84%" }
  };
  return { gold: gold, btc: btc, nas: nas };
}

function buildMentorResponse(userText, hasImage) {
  const q = (userText || "").toLowerCase();
  const snap = getLiveMarketSnapshot();

  // Handler for the new Aquamarine "Por AI Chat" Feature Card
  if (q.indexOf("command center") !== -1 || q.indexOf("por ai chat") !== -1) {
    return {
      title: "💎 Por AI Chat (POR1.0) — Aquamarine Command Center Active",
      html:
        "<h4>💎 Welcome to Por AI Chat — Live SMC/ICT Command Center</h4>" +
        "<p>Your <strong>Por AI Chat</strong> assistant is synced with the live market engine. Here is what you can do right now:</p>" +
        "<ul>" +
          "<li><strong>🥇 Live XAUUSD Setup (" + snap.gold.signal + " · " + snap.gold.kpi.conf + "):</strong> Actionable Entry at <strong>" + snap.gold.entry + "</strong> | Stop Loss: <strong>" + snap.gold.sl + "</strong> | Target TP1: <strong>" + snap.gold.tp1 + "</strong>.</li>" +
          "<li><strong>₿ Live BTCUSDT Setup (" + snap.btc.signal + " · " + snap.btc.kpi.conf + "):</strong> Actionable Entry at <strong>" + snap.btc.entry + "</strong> | Stop Loss: <strong>" + snap.btc.sl + "</strong> | Target TP1: <strong>" + snap.btc.tp1 + "</strong>.</li>" +
          "<li><strong>📸 Chart Snap Vision:</strong> Upload any TradingView screenshot for an instant Order Block, Fair Value Gap (FVG), and Liquidity Sweep breakdown.</li>" +
          "<li><strong>⚖️ Dynamic Risk Calculator:</strong> Ask me to calculate exact lot sizes for your account balance on Gold, Crypto, or Forex.</li>" +
        "</ul>" +
        "<p>Select an action below or type any trading question into the dock:</p>",
      chips: [
        "What is the current market regime and what should I focus on today?",
        "How do I size my position if my account is $1,000 and I risk 1% per trade?",
        "Upload a chart screenshot with Chart Snap"
      ]
    };
  }

  if (hasImage) {
    return {
      title: "📸 POR1.0 Chart Snap — Structure & Key Levels Read",
      html:
        "<h4>📸 POR1.0 Chart Snap — Educational Structure Read</h4>" +
        "<p>I scanned your uploaded chart for market structure, liquidity pools, and institutional order blocks:</p>" +
        "<ul>" +
          "<li><strong>Primary Market Structure:</strong> Price is reacting near an institutional inflection zone with clear Break of Structure (<strong>BOS</strong>) momentum and an unmitigated Fair Value Gap (<strong>FVG</strong>).</li>" +
          "<li><strong>Key Liquidity Zones:</strong> Buy-side liquidity rests above the recent swing high, while sell-side stop clusters sit directly below the prior session low.</li>" +
          "<li><strong>Execution Checklist:</strong> Wait for a 15m/30m displacement candle close before entering. Place your Stop Loss beyond the invalidation swing point and target at least <strong>1:2 R:R</strong>.</li>" +
        "</ul>" +
        "<p>Want to compare this against our live streaming terminal levels for <strong>XAUUSD (" + snap.gold.entry + ")</strong> or <strong>BTCUSDT (" + snap.btc.entry + ")</strong>?</p>",
      chips: [
        "Show live XAUUSD & BTCUSDT outlook",
        "How do I spot an Order Block?",
        "How do I calculate 1% risk on this setup?"
      ]
    };
  }

  if (q.indexOf("beginner") !== -1 || q.indexOf("teach me") !== -1 || q.indexOf("new") !== -1) {
    return {
      title: "⭐ Beginner Step-by-Step Trading Roadmap",
      html:
        "<h4>⭐ Welcome to Por AI — Your Step-by-Step Trading Foundation</h4>" +
        "<p>Here are the <strong>4 core pillars</strong> every disciplined trader masters first:</p>" +
        "<ol>" +
          "<li><strong>Market Structure (The Map):</strong> Markets move in Uptrends (Higher Highs + Higher Lows), Downtrends (Lower Highs + Lower Lows), or Ranges. Never trade against the dominant structure.</li>" +
          "<li><strong>Key Levels (Where to Act):</strong> Identify <strong>Support</strong> (demand floors where buyers step in) and <strong>Resistance</strong> (supply ceilings where sellers defend).</li>" +
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

  if (q.indexOf("support") !== -1 || q.indexOf("resistance") !== -1 || q.indexOf("concept") !== -1) {
    return {
      title: "📊 Support & Resistance Explained Simply",
      html:
        "<h4>📊 Support &amp; Resistance — The Floor and Ceiling of Price</h4>" +
        "<p>Think of price like a <strong>bouncing ball inside a multi-story house</strong>:</p>" +
        "<ul>" +
          "<li><strong>Support (The Floor):</strong> A price level where buyers consistently step in because they consider the asset discounted. Just like a floor stops a ball from falling further, support halts drops and bounces price upward.</li>" +
          "<li><strong>Resistance (The Ceiling):</strong> A price level where sellers take profit or open shorts because price looks expensive. Like a ceiling, it rejects price back down.</li>" +
          "<li><strong>The Role Reversal Rule:</strong> When price smashes decisively <em>through</em> a ceiling (Resistance), that old ceiling becomes the new floor (Support) on the next pullback!</li>" +
        "</ul>",
      chips: [
        "What is an SMC Order Block vs standard support?",
        "How do I avoid fake breakouts?",
        "What is the current market regime and what should I focus on today?"
      ]
    };
  }

  if (q.indexOf("1,000") !== -1 || q.indexOf("risk") !== -1 || q.indexOf("size") !== -1) {
    return {
      title: "⚖️ Position Sizing Formula ($1,000 Account @ 1% Risk)",
      html:
        "<h4>⚖️ Exact Position Sizing Formula ($1,000 Account · 1% Risk)</h4>" +
        "<p>If your account is <strong>$1,000</strong> and you risk <strong>1%</strong> per trade, your maximum dollar loss if your Stop Loss is hit is exactly <strong>$10.00</strong>.</p>" +
        "<ul>" +
          "<li><strong>Step 1 — Dollar Risk:</strong> $1,000 × 0.01 = <strong>$10 risk</strong>.</li>" +
          "<li><strong>Step 2 — Measure Stop Loss Distance:</strong> Suppose you buy <strong>XAUUSD (Gold)</strong> at <strong>4,176.00</strong> with a Stop Loss at <strong>4,166.00</strong> ($10 price distance = 100 pips).</li>" +
          "<li><strong>Step 3 — Calculate Lot Size:</strong> Position Size = Dollar Risk ÷ Stop Distance. On XAUUSD (100 oz contract), a <strong>0.01 micro lot</strong> moves $1.00 per $1.00 move in Gold, which equals <strong>$10.00 risk</strong> for a $10.00 stop distance.</li>" +
        "</ul>",
      chips: [
        "Calculate lot size for BTCUSDT",
        "What are the most common mistakes that make traders lose money?",
        "What is a good Risk-to-Reward ratio?"
      ]
    };
  }

  if (q.indexOf("regime") !== -1 || q.indexOf("outlook") !== -1 || q.indexOf("today") !== -1 || q.indexOf("xauusd") !== -1 || q.indexOf("btcusdt") !== -1) {
    return {
      title: "🧭 Live Market Regime & Today's High-Conviction Focus",
      html:
        "<h4>🧭 POR1.0 Live Market Regime &amp; Multi-Asset Focus</h4>" +
        "<p>Current macro conditions show <strong>High Volatility</strong> with selective institutional flows across Metals, Crypto, and US Indices:</p>" +
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

  if (q.indexOf("mistake") !== -1 || q.indexOf("lose money") !== -1 || q.indexOf("improve") !== -1) {
    return {
      title: "🧠 Top 5 Mistakes That Cost Traders Money (And How to Fix Them)",
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

  if (q.indexOf("candlestick") !== -1 || q.indexOf("read my chart") !== -1 || q.indexOf("candle") !== -1 || q.indexOf("chart reads") !== -1) {
    return {
      title: "👁️ How to Read Candlesticks & Market Structure Like a Pro",
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
        "What is the current market regime and what should I focus on today?"
      ]
    };
  }

  return {
    title: "⚡ POR1.0 Trading Mentor Analysis",
    html:
      "<h4>⚡ POR1.0 Analysis: " + escHtml(userText) + "</h4>" +
      "<p>Here is a structured breakdown based on Smart Money Concepts (SMC) and institutional risk management:</p>" +
      "<ul>" +
        "<li><strong>Structure First:</strong> Identify whether the higher timeframe (4H / 1H) is forming Higher Highs (bullish) or Lower Lows (bearish) before dropping to 15m/30m for entry.</li>" +
        "<li><strong>Liquidity &amp; PD Arrays:</strong> Wait for price to sweep resting liquidity (equal highs/lows) and tap into an unmitigated Order Block or Fair Value Gap.</li>" +
        "<li><strong>Live Terminal Reference:</strong> Right now on our live feed, <strong>XAUUSD</strong> is <strong>" + snap.gold.signal + " @ " + snap.gold.entry + "</strong> (SL " + snap.gold.sl + ", TP1 " + snap.gold.tp1 + ") and <strong>BTCUSDT</strong> is <strong>" + snap.btc.signal + " @ " + snap.btc.entry + "</strong>.</li>" +
      "</ul>",
    chips: [
      "What is the current market regime and what should I focus on today?",
      "How do I size my position if my account is $1,000 and I risk 1% per trade?",
      "Explain what support and resistance are, with a simple real-life example"
    ]
  };
}

// ==========================================
// 3. UI RENDERING & MESSAGE STREAMING
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

  listEl.innerHTML = currentMessages.map(function (m) {
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

function sendUserMessage(rawText) {
  const text = (rawText || "").trim();
  const hasImage = Boolean(pendingImageDataUrl);
  if (!text && !hasImage) return;

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

  const reply = buildMentorResponse(userMsg.text, Boolean(usedImage));
  currentMessages.push({
    role: "ai",
    html: reply.html,
    chips: reply.chips
  });

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
  } else {
    const existing = savedChats.find(function (c) { return c.id === currentChatId; });
    if (existing) {
      existing.messages = currentMessages.slice();
    }
  }

  persistChats();
  renderMessagesList();
}

// ==========================================
// 4. CHART SNAP IMAGE UPLOAD HANDLING
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
// 5. CHATS HISTORY DRAWER
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
// 6. BIND EVENTS & INITIALIZE
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