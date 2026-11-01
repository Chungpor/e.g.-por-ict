/**
 * Por AI Chat — Multi-Agent AI Analyst Team & Universal Live Answer Engine (POR1.0)
 * Replies to ALL user questions (7-Agent Council + Live LLM + Deep SMC/Math Engine + Chart Snap)
 * File: por-ai-chat.js
 */
"use strict";

// ==========================================
// 0. AI CONNECTION SETTINGS
// ==========================================
// Pollinations moved to a new unified API (gen.pollinations.ai) that needs a key.
// 1) Get a FREE browser-safe "pk_..." key at https://enter.pollinations.ai/keys
// 2) Paste it below (or run in the browser console:
//    localStorage.setItem("por_ai_api_key_v1", "pk_xxx") then refresh).
// Never put a secret "sk_..." key in this file — it is public in the browser.
const PAC_AI_CONFIG = {
  apiKey: "AQ.Ab8RN6JTyai-glourxPaPV15MFAAE0XpVbiXYoaseCAVfVlSwg",
  endpoint: "https://gen.pollinations.ai/v1/chat/completions",
  model: "openai",
  // Used automatically when the key is a Google AI Studio key (starts with "AQ." or "AIza")
  geminiModels: ["gemini-3.5-flash", "gemini-flash-latest"],
  geminiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models/",
  timeoutMs: 30000,
  historyMessages: 14
};

function getAiApiKey() {
  let stored = "";
  try { stored = localStorage.getItem("por_ai_api_key_v1") || ""; } catch (e) {}
  return (stored || PAC_AI_CONFIG.apiKey || "").trim();
}

// Which provider a key belongs to: Google AI Studio keys start with "AQ." or "AIza".
function getKeyProvider(key) {
  if (/^(AQ\.|AIza)/.test(key || "")) return "gemini";
  return "pollinations";
}


// ==========================================
// 1. AI ANALYST TEAM ROSTER (7 AGENTS)
// ==========================================
const AI_ANALYST_TEAM = [
  {
    id: "all_team",
    name: "Full AI Analyst Team",
    shortName: "All Team (7 AI)",
    badge: "COUNCIL · 7 AI",
    emoji: "👥",
    role: "All 6 specialists + POR1.0 Lead reply together to every question you ask.",
    systemPersona: "You are the Full Por AI Analyst Team Council (Lead Strategist, XAUUSD Gold Specialist, BTC Quant, SMC/ICT Chartist, Risk Manager, and Macro Economist). Provide a comprehensive, direct answer to the user's exact question, and add brief specialist takeaways only when the topic is about trading or markets."
  },
  {
    id: "por_lead",
    name: "Por ICT Lead",
    shortName: "POR1.0 Lead",
    badge: "LEAD MENTOR",
    emoji: "👑",
    role: "Master Trading Mentor & Universal AI — answers trading, math, coding & general questions.",
    systemPersona: "You are POR1.0 Lead Mentor created by Por ICT. Answer any trading, technical, math, coding, or general question clearly and directly."
  },
  {
    id: "gold_desk",
    name: "Aura Gold Desk",
    shortName: "XAUUSD AI",
    badge: "XAU-AI · METALS",
    emoji: "🥇",
    role: "XAUUSD & Silver institutional order flow, DXY inverse correlation & London/NY killzones.",
    systemPersona: "You are Aura Gold (XAU-AI), Senior Precious Metals & XAUUSD Institutional Analyst. Answer the user's question with precise focus on Gold structure, liquidity sweeps, and DXY/yield correlations."
  },
  {
    id: "crypto_quant",
    name: "Satoshi Quant",
    shortName: "BTC Quant AI",
    badge: "BTC-AI · CRYPTO",
    emoji: "₿",
    role: "BTCUSDT, ETH & Altcoin liquidity pools, funding rates, open interest & whale sweeps.",
    systemPersona: "You are Satoshi Quant (BTC-AI), Senior Crypto Derivatives & Liquidity Analyst. Answer the user's question clearly, highlighting crypto market structure, stop hunts, and risk control."
  },
  {
    id: "smc_chartist",
    name: "ICT Structure AI",
    shortName: "SMC/ICT AI",
    badge: "SMC-AI · CHART",
    emoji: "🏦",
    role: "Order Blocks, Fair Value Gaps (FVG), BOS/CHoCH, OTE Fibonacci & Silver Bullet setups.",
    systemPersona: "You are ICT Structure AI (SMC-AI), Institutional Price Action & Smart Money Concepts Specialist. Answer the user's question using pure price action, liquidity, Order Blocks, and Fair Value Gaps."
  },
  {
    id: "risk_manager",
    name: "Apex Risk & Prop",
    shortName: "Risk & Prop AI",
    badge: "RISK-AI · MATH",
    emoji: "⚖️",
    role: "Exact lot-size calculator, Prop-Firm drawdown protection (FTMO) & trading psychology.",
    systemPersona: "You are Apex Risk (RISK-AI), Chief Risk Officer & Prop-Firm Performance Coach. Answer the user's question with strict mathematical position sizing, drawdown protection, and disciplined psychology."
  },
  {
    id: "macro_news",
    name: "Macro Pulse AI",
    shortName: "Macro News AI",
    badge: "NEWS-AI · MACRO",
    emoji: "🌐",
    role: "CPI, NFP, FOMC interest rates, DXY Dollar Index & high-impact economic news calendar.",
    systemPersona: "You are Macro Pulse (NEWS-AI), Global Macro Economist & Central Bank Strategist. Answer the user's question clearly, explaining how macro catalysts, yields, and news affect the user's topic."
  }
];

// ==========================================
// 2. STATE, LOGO STORAGE & CHAT HISTORY
// ==========================================
const STORAGE_KEY = "por_ai_saved_chats_v1";
const LOGO_STORAGE_KEY = "por_ai_custom_logo_v1";
const TEAM_STORAGE_KEY = "por_ai_selected_analyst_v1";
const DEFAULT_LOGO_SRC = "por.jpg";
const FALLBACK_LOGO_SRC = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80";

let savedChats = [];
let currentChatId = null;
let currentMessages = [];
let pendingImageDataUrl = null;
let pendingImageName = "";
let isAiTyping = false;
let selectedAnalystId = "all_team";

function getActiveAnalyst() {
  return AI_ANALYST_TEAM.find(function (a) { return a.id === selectedAnalystId; }) || AI_ANALYST_TEAM[0];
}

function setSelectedAnalyst(analystId) {
  const found = AI_ANALYST_TEAM.find(function (a) { return a.id === analystId; });
  if (!found) return;
  selectedAnalystId = found.id;
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, selectedAnalystId);
  } catch (e) {}

  renderAnalystTeamControls();
}

function loadSelectedAnalyst() {
  try {
    const saved = localStorage.getItem(TEAM_STORAGE_KEY);
    if (saved && AI_ANALYST_TEAM.some(function (a) { return a.id === saved; })) {
      selectedAnalystId = saved;
    }
  } catch (e) {}
}

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
// 3. RENDER AI ANALYST TEAM UI CONTROLS
// ==========================================
function renderAnalystTeamControls() {
  const active = getActiveAnalyst();

  // 1. Update Subheader Badge
  const subBadge = document.getElementById("pacSubheaderAnalystBadge");
  if (subBadge) {
    subBadge.textContent = active.emoji + " " + active.name;
  }

  // 2. Update Bottom Dock Dropdown
  const dockSelect = document.getElementById("pacDockAnalystSelect");
  if (dockSelect && dockSelect.value !== active.id) {
    dockSelect.value = active.id;
  }

  // 3. Update Input Placeholder
  const userInput = document.getElementById("pacUserInput");
  if (userInput) {
    userInput.placeholder = "Ask " + active.name + " anything (all questions answered)...";
  }

  // 4. Render Welcome Roster Cards
  const grid = document.getElementById("pacAnalystTeamGrid");
  if (grid) {
    grid.innerHTML = AI_ANALYST_TEAM.map(function (agent) {
      const isAct = agent.id === active.id ? " is-active" : "";
      return (
        '<button type="button" class="pac-analyst-card' + isAct + '" data-analyst-id="' + escHtml(agent.id) + '">' +
          '<div class="pac-analyst-Emoji">' + agent.emoji + '</div>' +
          '<div class="pac-analyst-info">' +
            '<div class="pac-analyst-top">' +
              '<span class="pac-analyst-name">' + escHtml(agent.name) + '</span>' +
              '<span class="pac-analyst-tag">' + escHtml(agent.badge) + '</span>' +
            '</div>' +
            '<div class="pac-analyst-role">' + escHtml(agent.role) + '</div>' +
          '</div>' +
        '</button>'
      );
    }).join("");

    grid.querySelectorAll(".pac-analyst-card").forEach(function (card) {
      card.addEventListener("click", function () {
        const id = card.getAttribute("data-analyst-id");
        setSelectedAnalyst(id);
      });
    });
  }

  // 5. Render Compact Stream Switcher Bar
  const streamBar = document.getElementById("pacStreamTeamBar");
  if (streamBar) {
    streamBar.innerHTML = AI_ANALYST_TEAM.map(function (agent) {
      const isAct = agent.id === active.id ? " is-active" : "";
      return (
        '<button type="button" class="pac-stream-pill' + isAct + '" data-analyst-id="' + escHtml(agent.id) + '">' +
          '<span>' + agent.emoji + '</span>' +
          '<span>' + escHtml(agent.shortName) + '</span>' +
        '</button>'
      );
    }).join("");

    streamBar.querySelectorAll(".pac-stream-pill").forEach(function (pill) {
      pill.addEventListener("click", function () {
        const id = pill.getAttribute("data-analyst-id");
        setSelectedAnalyst(id);
      });
    });
  }
}

// ==========================================
// 4. LIVE MARKET SNAPSHOT HELPER
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
// 5. MULTI-AGENT COUNCIL SYNTHESIS BUILDER
// ==========================================
function buildTeamCouncilBlock(userText) {
  const q = (userText || "").toLowerCase();
  const snap = getLiveMarketSnapshot();

  let smcNote = "Wait for a 15m/5m liquidity sweep followed by a displacement CHoCH and Fair Value Gap (FVG) retest before entering.";
  let goldCryptoNote;
  const liveNow = LIVE_PRICE_CACHE.data;
  if (liveNow && liveNow.ok) {
    const parts = [];
    ["XAUUSD", "BTCUSDT"].forEach(function (s) {
      const it = liveNow.items[s];
      if (it) parts.push(s + " " + fmtLivePrice(s, it.price) + (isFinite(it.changePct) ? " (" + (it.changePct >= 0 ? "+" : "") + it.changePct.toFixed(2) + "% 24h)" : ""));
    });
    goldCryptoNote = "Live: " + parts.join(" · ") + ". Build levels from these prices and the session high/low, and watch for liquidity sweeps.";
  } else {
    goldCryptoNote = "Live price feed unavailable right now — check your chart for current XAUUSD / BTCUSDT prices before acting.";
  }

  const macroNote = "Monitor DXY Dollar Index inverse correlation and avoid opening fresh positions 15 minutes before high-impact USD news (CPI/NFP/FOMC). Check the economic calendar for exact times.";
  const riskNote = "Cap risk at 0.5%–1.0% per trade ($10 max risk per $1,000 balance) and secure 50% partials at 1:1.5 to 1:2 R:R.";

  return (
    '<div class="pac-team-council-grid">' +
      '<div class="pac-council-desk-card">' +
        '<div class="pac-council-desk-title"><span>🏦 ICT Structure AI</span><span>SMC-AI</span></div>' +
        '<div>' + smcNote + '</div>' +
      '</div>' +
      '<div class="pac-council-desk-card">' +
        '<div class="pac-council-desk-title"><span>🥇₿ Asset Desks (Gold &amp; BTC)</span><span>LIVE FEED</span></div>' +
        '<div>' + goldCryptoNote + '</div>' +
      '</div>' +
      '<div class="pac-council-desk-card">' +
        '<div class="pac-council-desk-title"><span>🌐 Macro Pulse AI</span><span>NEWS-AI</span></div>' +
        '<div>' + macroNote + '</div>' +
      '</div>' +
      '<div class="pac-council-desk-card">' +
        '<div class="pac-council-desk-title"><span>⚖️ Apex Risk &amp; Prop AI</span><span>RISK-AI</span></div>' +
        '<div>' + riskNote + '</div>' +
      '</div>' +
    '</div>'
  );
}

// ==========================================
// 6. DYNAMIC RISK & MATH CALCULATOR
// ==========================================
function tryCalculateCustomRisk(userText) {
  const q = (userText || "").toLowerCase();

  // Check if user is asking a pure arithmetic/math expression (e.g., "what is 250 * 1.5")
  const mathMatch = userText.match(/(?:what is|calculate|math|solve)?\s*([\d]+(?:\.\d+)?)\s*([\+\-\*\/x])\s*([\d]+(?:\.\d+)?)/i);
  if (mathMatch && q.indexOf("account") === -1 && q.indexOf("risk") === -1 && q.indexOf("lot") === -1) {
    const a = parseFloat(mathMatch[1]);
    const op = mathMatch[2].toLowerCase();
    const b = parseFloat(mathMatch[3]);
    let res = 0;
    if (op === "+") res = a + b;
    else if (op === "-") res = a - b;
    else if (op === "*" || op === "x") res = a * b;
    else if (op === "/" && b !== 0) res = a / b;

    return {
      html:
        "<h4>🧮 Instant Math &amp; Quantitative Calculation</h4>" +
        "<p>Result for <strong>" + a + " " + op + " " + b + "</strong> = <strong>" + (+res.toFixed(4)) + "</strong></p>" +
        "<p>Need position sizing or R:R math? Tell our <strong>Apex Risk AI</strong> your account balance and risk % (for example: <em>\"Calculate lot size for a $2,500 account risking 1%\"</em>).</p>",
      chips: [
        "How do I size my position if my account is $1,000 and I risk 1% per trade?",
        "Assemble the Full AI Analyst Team",
        "Show live XAUUSD & BTCUSDT setups"
      ]
    };
  }

  const isRiskQuery =
    q.indexOf("risk") !== -1 ||
    hasWord(q, "lot") ||
    q.indexOf("size") !== -1 ||
    q.indexOf("account") !== -1 ||
    q.indexOf("balance") !== -1 ||
    q.indexOf("calculate") !== -1;

  if (!isRiskQuery) return null;

  let balance = 1000;
  const balMatch = userText.match(/\$\s*([\d,]+(?:\.\d+)?)|(?:account|balance|with|of)\s+(?:is\s+)?\$?([\d,]+(?:\.\d+)?)/i);
  if (balMatch) {
    const rawNum = (balMatch[1] || balMatch[2] || "").replace(/,/g, "");
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) balance = parsed;
  }

  let riskPct = 1;
  const pctMatch = userText.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) {
    const parsedPct = parseFloat(pctMatch[1]);
    if (!isNaN(parsedPct) && parsedPct > 0 && parsedPct <= 100) riskPct = parsedPct;
  }

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
  const goldLots = Math.max(0.01, +(dollarRisk / (stopGoldDollars * 100)).toFixed(2));
  const forexLots = Math.max(0.01, +(dollarRisk / (stopForexPips * 10)).toFixed(2));
  const btcUnits = +(dollarRisk / 750).toFixed(4);

  return {
    html:
      "<h4>⚖️ Apex Risk AI — Exact Position Sizing ($" + balance.toLocaleString() + " Account · " + riskPct + "% Risk)</h4>" +
      "<p>With an account balance of <strong>$" + balance.toLocaleString() + "</strong> and a <strong>" + riskPct + "% risk rule</strong>, your maximum allowed loss per trade is <strong>$" + dollarRisk.toFixed(2) + "</strong>:</p>" +
      "<ul>" +
        "<li><strong>Step 1 — Dollar Risk Formula:</strong> $" + balance.toLocaleString() + " × " + (riskPct / 100) + " = <strong>$" + dollarRisk.toFixed(2) + " max risk</strong>.</li>" +
        "<li><strong>🥇 XAUUSD (Gold) Lot Size:</strong> For a <strong>$" + stopGoldDollars.toFixed(1) + "</strong> price stop distance (" + (stopGoldDollars * 100) + " pips), open <strong>" + goldLots.toFixed(2) + " lots</strong> (0.01 micro lot = $1.00 per $1.00 move in Gold).</li>" +
        "<li><strong>💱 Forex Pairs (EURUSD / GBPUSD):</strong> For a <strong>" + stopForexPips + "-pip</strong> Stop Loss, open <strong>" + forexLots.toFixed(2) + " lots</strong>.</li>" +
        "<li><strong>₿ BTCUSDT Position Size:</strong> For a $750 Stop Loss distance on Bitcoin, size at <strong>" + btcUnits + " BTC</strong> (Total risk = $" + dollarRisk.toFixed(2) + ").</li>" +
      "</ul>",
    chips: [
      "Calculate lot size for a $5,000 account risking 0.5%",
      "Explain Prop Firm drawdown rules (FTMO)",
      "Show live XAUUSD & BTCUSDT setups"
    ]
  };
}


// Whole-word keyword test (avoids "eth" matching "method", "rsi" matching "version", etc.)
function hasWord(q, w) {
  return new RegExp("(^|[^a-z0-9])" + w + "([^a-z0-9]|$)").test(q);
}

function isTradingTopic(text) {
  return /(^|[^a-z0-9])(trade|trading|trader|xau|xauusd|gold|btc|btcusdt|bitcoin|eth|crypto|forex|eurusd|gbpusd|usdjpy|nas100|us30|smc|ict|fvg|bos|choch|order block|liquidity|stop loss|take profit|lot size|pip|pips|leverage|prop firm|ftmo|dxy|cpi|nfp|fomc|candle|candlestick|support|resistance|silver bullet|killzone|signal|chart)([^a-z0-9]|$)/i.test(text || "");
}

// ==========================================
// 7. DEEP LOCAL SMC & MULTI-TEAM KNOWLEDGE ENGINE
// ==========================================
function buildSmartLocalResponse(userText, hasImage) {
  const q = (userText || "").trim().toLowerCase();
  const snap = getLiveMarketSnapshot();

  // 1. Chart Snap Image Analysis
  if (hasImage) {
    return {
      isMatched: true,
      html:
        "<h4>📸 AI Analyst Team Chart Snap — Structure, Liquidity &amp; Execution Read</h4>" +
        "<p>Our <strong>7-Agent AI Analyst Team</strong> inspected your uploaded chart screenshot for market structure, liquidity pools, and institutional footprints:</p>" +
        "<ul>" +
          "<li><strong>🏦 SMC Structure Desk:</strong> Price is interacting with a high-confluence zone featuring prior Break of Structure (<strong>BOS</strong>) displacement and an unmitigated Fair Value Gap (<strong>FVG</strong>).</li>" +
          "<li><strong>🥇₿ Liquidity Mapping Desk:</strong> Resting Buy-Side Liquidity (<strong>BSL</strong>) sits above the recent swing high, while Sell-Side Liquidity (<strong>SSL</strong>) clusters below the session low.</li>" +
          "<li><strong>⚖️ Risk &amp; Execution Desk:</strong> Wait for a liquidity sweep + 5m/15m Change of Character (<strong>CHoCH</strong>) body close. Place your Stop Loss beyond the invalidation swing extreme and target <strong>1:2 to 1:3 R:R</strong>.</li>" +
        "</ul>" +
        buildTeamCouncilBlock(userText),
      chips: [
        "Explain Break of Structure (BOS) vs CHoCH",
        "How do I spot a valid Order Block?",
        "How do I size my position if my account is $1,000 and I risk 1% per trade?"
      ]
    };
  }

  // 2. Full AI Analyst Team Briefing / Command Center
  if (q.indexOf("command center") !== -1 || q.indexOf("por ai chat") !== -1 || q.indexOf("assemble") !== -1 || q.indexOf("analyst team") !== -1 || q.indexOf("all team") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>💎 Por AI Analyst Team — Live 7-Agent Institutional Briefing</h4>" +
        "<p>All <strong>7 AI Analysts</strong> are online and synchronized with your live market feed. Here is our desk-by-desk consensus right now:</p>" +
        "<ul>" +
          "<li><strong>🥇 Aura Gold Desk (XAUUSD · " + snap.gold.signal + " · " + snap.gold.kpi.conf + "):</strong> Entry <strong>" + snap.gold.entry + "</strong> | Stop Loss: <strong>" + snap.gold.sl + "</strong> | TP1: <strong>" + snap.gold.tp1 + "</strong> | TP2: <strong>" + snap.gold.tp2 + "</strong>.</li>" +
          "<li><strong>₿ Satoshi Quant Desk (BTCUSDT · " + snap.btc.signal + " · " + snap.btc.kpi.conf + "):</strong> Entry <strong>" + snap.btc.entry + "</strong> | Stop Loss: <strong>" + snap.btc.sl + "</strong> | TP1: <strong>" + snap.btc.tp1 + "</strong>.</li>" +
          "<li><strong>◆ US Indices Desk (NAS100 · " + snap.nas.signal + " · " + snap.nas.kpi.conf + "):</strong> Entry <strong>" + snap.nas.entry + "</strong> | Stop Loss: <strong>" + snap.nas.sl + "</strong> | TP1: <strong>" + snap.nas.tp1 + "</strong>.</li>" +
          "<li><strong>💱 Forex Desk (EURUSD · " + snap.eur.signal + " · " + snap.eur.kpi.conf + "):</strong> Entry <strong>" + snap.eur.entry + "</strong> | Stop Loss: <strong>" + snap.eur.sl + "</strong> | TP1: <strong>" + snap.eur.tp1 + "</strong>.</li>" +
        "</ul>" +
        buildTeamCouncilBlock(userText),
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
        "<h4>👋 Hello! We Are the Por AI Analyst Team (POR1.0 · 7 Agents)</h4>" +
        "<p>Ask us <strong>any question</strong> in English, Khmer, or any language — our specialist desks reply to everything:</p>" +
        "<ul>" +
          "<li><strong>👑 Por ICT Lead:</strong> Universal trading mentor, coding/PineScript helper, and general Q&amp;A assistant.</li>" +
          "<li><strong>🥇 Aura Gold &amp; ₿ Satoshi Quant:</strong> Live XAUUSD, BTCUSDT, ETH, Forex &amp; Index trade plans.</li>" +
          "<li><strong>🏦 ICT Structure &amp; 🌐 Macro Pulse:</strong> Order Blocks, FVGs, BOS/CHoCH, Silver Bullet, and CPI/NFP/FOMC news analysis.</li>" +
          "<li><strong>⚖️ Apex Risk AI:</strong> Instant lot-size calculator and Prop-Firm drawdown protection.</li>" +
        "</ul>",
      chips: [
        "Assemble the Full AI Analyst Team",
        "What is the current market regime and what should I focus on today?",
        "How do I size my position if my account is $1,000 and I risk 1% per trade?"
      ]
    };
  }

  // 4. Prop Firm / FTMO / Funded Account Rules
  if (hasWord(q, "prop") || q.indexOf("ftmo") !== -1 || q.indexOf("funded") !== -1 || q.indexOf("drawdown") !== -1 || q.indexOf("challenge") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>🏆 Apex Risk AI — How to Pass &amp; Keep a Prop-Firm Funded Account</h4>" +
        "<p>Most prop-firm challenges have a <strong>5% Maximum Daily Drawdown</strong> and a <strong>10% Maximum Overall Drawdown</strong>. Here is the exact math to never blow your funded account:</p>" +
        "<ul>" +
          "<li><strong>Risk 0.25% to 0.50% Per Trade:</strong> At 0.5% risk, it takes <strong>10 consecutive losses in a single day</strong> to breach the 5% daily limit—giving you massive survival breathing room.</li>" +
          "<li><strong>Daily Loss Circuit Breaker:</strong> Stop trading for the day if you lose <strong>2 trades in a row (-1% total)</strong>.</li>" +
          "<li><strong>One A+ Setup Per Session:</strong> Focus only on London Open or NY Silver Bullet setups with 1:2.5+ R:R. Three winning trades at 1:3 R:R (+4.5%) puts you more than halfway to passing Phase 1!</li>" +
        "</ul>",
      chips: [
        "Calculate lot size for a $10,000 account risking 0.5%",
        "How do I build a daily pre-trade checklist?",
        "Give me the full XAUUSD SMC trade plan"
      ]
    };
  }

  // 5. Macro News / CPI / NFP / FOMC / DXY
  if (hasWord(q, "cpi") || hasWord(q, "nfp") || q.indexOf("fomc") !== -1 || q.indexOf("powell") !== -1 || q.indexOf("news") !== -1 || hasWord(q, "dxy") || q.indexOf("inflation") !== -1 || hasWord(q, "fed")) {
    return {
      isMatched: true,
      html:
        "<h4>🌐 Macro Pulse AI — Trading CPI, NFP, FOMC &amp; DXY Correlations</h4>" +
        "<p>High-impact red-folder USD economic releases drive institutional liquidity injections:</p>" +
        "<ul>" +
          "<li><strong>DXY (US Dollar Index) Inverse Rule:</strong> When <strong>DXY surges bullish</strong> (stronger USD / higher yields), <strong>XAUUSD, EURUSD, GBPUSD, and BTCUSDT</strong> typically face bearish pressure. When DXY drops, Gold and risk assets rally.</li>" +
          "<li><strong>The 15-Minute News Rule:</strong> Never hold a tight stop loss 5 minutes before <strong>CPI, NFP, or FOMC</strong>. Spreads widen and algorithms whip both sides of liquidity (Judas Swing).</li>" +
          "<li><strong>Post-News SMC Entry:</strong> Wait <strong>15 to 30 minutes after the news release</strong>. Let the initial spike sweep resting highs/lows, then trade the 5m CHoCH + Fair Value Gap retracement once spreads normalize.</li>" +
        "</ul>",
      chips: [
        "Give me the full XAUUSD SMC trade plan",
        "Give me the full BTCUSDT trade plan",
        "How do I avoid fake breakouts?"
      ]
    };
  }

  // 6. Dynamic Risk & Lot Size Calculator
  if (q.indexOf("risk") !== -1 || hasWord(q, "lot") || q.indexOf("position size") !== -1 || q.indexOf("size my position") !== -1 || q.indexOf("1,000") !== -1 || q.indexOf("calculate") !== -1) {
    if (q.indexOf("reward") !== -1 || q.indexOf("r:r") !== -1 || q.indexOf("ratio") !== -1) {
      return {
        isMatched: true,
        html:
          "<h4>🎯 Risk-to-Reward Ratio (R:R) — How Profitable Traders Stay Ahead</h4>" +
          "<p><strong>Risk-to-Reward (R:R)</strong> compares how much money you risk on a trade to how much profit you target:</p>" +
          "<ul>" +
            "<li><strong>1:2 R:R Example:</strong> Risking <strong>$10</strong> to make <strong>$20</strong>. Even with a <strong>40% win rate</strong>, you grow your account (+$80 won vs. -$60 lost over 10 trades = <strong>+$20 net profit</strong>).</li>" +
            "<li><strong>1:3 R:R (SMC Standard):</strong> Risking <strong>$10</strong> to make <strong>$30</strong>. You only need a <strong>30% win rate</strong> to be consistently profitable!</li>" +
            "<li><strong>Golden Rule:</strong> Never take a trade with less than <strong>1:1.5 R:R</strong>.</li>" +
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

  // 6b. Price prediction / forecast questions (honest scenario answer — nobody can predict price)
  if (/(^|[^a-z0-9])(predict|prediction|forecast|tomorrow|tmr|tmrw|next week|will .* (go|reach|hit)|up or down)([^a-z0-9]|$)/.test(q)) {
    let asset = snap.gold, label = "XAUUSD (Gold)";
    if (hasWord(q, "btc") || q.indexOf("bitcoin") !== -1 || q.indexOf("crypto") !== -1) { asset = snap.btc; label = "BTCUSDT"; }
    else if (q.indexOf("nas") !== -1) { asset = snap.nas; label = "NAS100"; }
    else if (q.indexOf("eur") !== -1) { asset = snap.eur; label = "EURUSD"; }
    const feedIsLive = Array.isArray(window.WATCHLIST_DB) && window.WATCHLIST_DB.length > 0;
    const bull = asset.signal === "BUY";
    return {
      isMatched: true,
      html:
        "<h4>🔮 " + label + " — Scenario Outlook (not a prediction)</h4>" +
        "<p>Nobody can reliably predict tomorrow's price. What we can do is prepare <strong>if/then scenarios</strong> around key levels. " +
        (feedIsLive ? "Levels below come from your terminal feed." : "<strong>Note:</strong> your live terminal feed is not loaded here, so these levels are <em>sample values</em> — check your real chart before using them.") + "</p>" +
        "<ul>" +
          "<li><strong>" + (bull ? "Bullish" : "Bearish") + " scenario (current bias " + asset.signal + "):</strong> valid while price holds " + (bull ? "above" : "below") + " <strong>" + asset.sl + "</strong>; first target <strong>" + asset.tp1 + "</strong>, extended <strong>" + asset.tp2 + "</strong>.</li>" +
          "<li><strong>Invalidation:</strong> a candle <em>body close</em> through <strong>" + asset.sl + "</strong> cancels the idea — then bias flips or you stay flat.</li>" +
          "<li><strong>Tomorrow's catalysts:</strong> check the economic calendar (CPI/NFP/FOMC, USD data) and the London / NY open — most moves start in those windows.</li>" +
          "<li><strong>Plan:</strong> mark yesterday's high/low and the Asian range, wait for a liquidity sweep + CHoCH, risk max 0.5–1% per trade.</li>" +
        "</ul>" +
        "<p><em>Educational analysis, not financial advice.</em> For a real conversational forecast discussion, connect the live AI (API key).</p>",
      chips: [
        "Explain Break of Structure (BOS) vs CHoCH",
        "How do I build a daily pre-trade checklist?",
        "How do I size my position if my account is $1,000 and I risk 1% per trade?"
      ]
    };
  }

  // 7. Specific XAUUSD (Gold) Trade Plan
  if (q.indexOf("xauusd") !== -1 || q.indexOf("gold") !== -1 || hasWord(q, "xau")) {
    return {
      isMatched: true,
      html:
        "<h4>🥇 Aura Gold AI — XAUUSD Live SMC Trade Plan &amp; Key Levels</h4>" +
        "<p>Current live feed bias for <strong>XAUUSD</strong> is <strong>" + snap.gold.signal + " (" + snap.gold.kpi.conf + " confidence)</strong>:</p>" +
        "<ul>" +
          "<li><strong>Actionable Entry Zone:</strong> <strong>" + snap.gold.entry + "</strong> (wait for M15/M30 order block mitigation &amp; rejection wick).</li>" +
          "<li><strong>Invalidation / Stop Loss (SL):</strong> <strong>" + snap.gold.sl + "</strong> (placed safely beyond the structure swing point).</li>" +
          "<li><strong>Take Profit Targets:</strong> TP1 at <strong>" + snap.gold.tp1 + "</strong> (secure 50% partials &amp; move SL to breakeven) · Extended target near <strong>" + snap.gold.tp2 + "</strong>.</li>" +
          "<li><strong>Session Timing:</strong> Peak institutional displacement occurs during <strong>London Open (07:00–10:00 UTC)</strong> and <strong>NY Silver Bullet (14:00–15:00 UTC)</strong>.</li>" +
        "</ul>",
      chips: [
        "Calculate lot size for XAUUSD on a $1,000 account",
        "Give me the full BTCUSDT trade plan",
        "How do I trade the NY Silver Bullet session?"
      ]
    };
  }

  // 8. Specific BTCUSDT / Crypto Trade Plan
  if (q.indexOf("btcusdt") !== -1 || q.indexOf("bitcoin") !== -1 || hasWord(q, "btc") || q.indexOf("crypto") !== -1 || hasWord(q, "eth") || q.indexOf("solana") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>₿ Satoshi Quant AI — BTCUSDT &amp; Crypto Liquidity Trade Plan</h4>" +
        "<p>Current live feed bias for <strong>BTCUSDT</strong> is <strong>" + snap.btc.signal + " (" + snap.btc.kpi.conf + " confidence)</strong>:</p>" +
        "<ul>" +
          "<li><strong>Actionable Entry Zone:</strong> <strong>" + snap.btc.entry + "</strong> (watching institutional supply &amp; Fair Value Gap reaction).</li>" +
          "<li><strong>Invalidation / Stop Loss (SL):</strong> <strong>" + snap.btc.sl + "</strong> (above the recent liquidity sweep high).</li>" +
          "<li><strong>Take Profit Targets:</strong> TP1 at <strong>" + snap.btc.tp1 + "</strong> · Secondary liquidity draw near <strong>79,500.00</strong>.</li>" +
          "<li><strong>Quant Execution Note:</strong> Crypto frequently sweeps equal highs/lows to liquidate over-leveraged perpetual futures before reversing—always wait for a 15m candle body close (CHoCH).</li>" +
        "</ul>",
      chips: [
        "Give me the full XAUUSD SMC trade plan",
        "Explain Break of Structure (BOS) vs CHoCH",
        "How do I avoid fake breakouts?"
      ]
    };
  }

  // 9. Forex / Indices (EURUSD, GBPUSD, USDJPY, NAS100, US30)
  if (q.indexOf("eurusd") !== -1 || q.indexOf("gbpusd") !== -1 || q.indexOf("usdjpy") !== -1 || q.indexOf("nas100") !== -1 || q.indexOf("nasdaq") !== -1 || q.indexOf("us30") !== -1 || q.indexOf("forex") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>📊 Multi-Asset Desk — NAS100 &amp; Major Forex Setups</h4>" +
        "<p>Here are the active institutional structure levels for US Indices and Major Forex pairs:</p>" +
        "<ul>" +
          "<li><strong>◆ NAS100 (Nasdaq 100) — " + snap.nas.signal + " (" + snap.nas.kpi.conf + "):</strong> Entry <strong>" + snap.nas.entry + "</strong> | SL: <strong>" + snap.nas.sl + "</strong> | TP1: <strong>" + snap.nas.tp1 + "</strong> (Best traded during the 09:30–11:00 AM EST NY Equities Open).</li>" +
          "<li><strong>💱 EURUSD — " + snap.eur.signal + " (" + snap.eur.kpi.conf + "):</strong> Entry <strong>" + snap.eur.entry + "</strong> | SL: <strong>" + snap.eur.sl + "</strong> | TP1: <strong>" + snap.eur.tp1 + "</strong> (Watch London session liquidity sweeps of the Asian range).</li>" +
          "<li><strong>Execution Rule:</strong> Align EURUSD/GBPUSD with inverse DXY structure, and wait for a 5m Fair Value Gap entry after session liquidity is swept.</li>" +
        "</ul>",
      chips: [
        "Give me the full XAUUSD SMC trade plan",
        "Give me the full BTCUSDT trade plan",
        "How do I trade the NY Silver Bullet session?"
      ]
    };
  }

  // 10. Order Blocks (OB) & Fair Value Gaps (FVG)
  if (q.indexOf("order block") !== -1 || hasWord(q, "fvg") || q.indexOf("fair value gap") !== -1 || q.indexOf("imbalance") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>🏦 ICT Structure AI — Order Blocks (OB) &amp; Fair Value Gaps (FVG)</h4>" +
        "<p>Institutions leave clear footprints on the chart called <strong>Order Blocks</strong> and <strong>FVGs</strong>:</p>" +
        "<ul>" +
          "<li><strong>Bullish Order Block:</strong> The last <em>bearish (red) candle</em> prior to an explosive bullish impulse that breaks structure (BOS). When price returns to this candle, institutional buy limit orders defend it.</li>" +
          "<li><strong>Bearish Order Block:</strong> The last <em>bullish (green) candle</em> before an aggressive drop that breaks structure downward.</li>" +
          "<li><strong>Fair Value Gap (FVG):</strong> A 3-candle imbalance where Candle 2 is so large that there is an open gap between <strong>Candle 1's High</strong> and <strong>Candle 3's Low</strong>. Price acts like a magnet to refill the 50% equilibrium (Consequent Encroachment) before continuing.</li>" +
          "<li><strong>A+ Setup Rule:</strong> Only trade Order Blocks that have an unmitigated FVG directly in front of them after a liquidity sweep!</li>" +
        "</ul>",
      chips: [
        "Explain Break of Structure (BOS) vs CHoCH",
        "How do I trade the NY Silver Bullet session?",
        "Upload a chart screenshot with Chart Snap"
      ]
    };
  }

  // 11. BOS vs CHoCH (Market Structure Shifts)
  if (hasWord(q, "bos") || q.indexOf("choch") !== -1 || q.indexOf("break of structure") !== -1 || q.indexOf("change of character") !== -1 || hasWord(q, "mss")) {
    return {
      isMatched: true,
      html:
        "<h4>🔄 ICT Structure AI — Break of Structure (BOS) vs. Change of Character (CHoCH)</h4>" +
        "<p>Knowing the difference between <strong>BOS</strong> and <strong>CHoCH</strong> tells you whether a trend is continuing or reversing:</p>" +
        "<ul>" +
          "<li><strong>BOS (Break of Structure — Trend Continuation):</strong> In an uptrend (Higher Highs &amp; Higher Lows), when price closes above the previous Higher High, that is a bullish <strong>BOS</strong>.</li>" +
          "<li><strong>CHoCH (Change of Character — Trend Reversal):</strong> In an uptrend, when sellers push price down and <em>close below the most recent Higher Low</em>, that first break against the trend is a <strong>CHoCH</strong>.</li>" +
          "<li><strong>Pro Tip:</strong> Always demand a <strong>candle body close</strong> (not just a wick!) to confirm a true BOS or CHoCH.</li>" +
        "</ul>",
      chips: [
        "How do I avoid fake breakouts?",
        "Explain Order Blocks and Fair Value Gaps (FVG)",
        "Show live XAUUSD & BTCUSDT setups"
      ]
    };
  }

  // 12. Silver Bullet / Killzones / Best Time to Trade
  if (q.indexOf("silver bullet") !== -1 || q.indexOf("killzone") !== -1 || q.indexOf("session") !== -1 || q.indexOf("best time") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>⏱️ ICT Killzones &amp; The NY Silver Bullet Strategy</h4>" +
        "<p>Smart Money executes predominantly during specific high-liquidity windows:</p>" +
        "<ul>" +
          "<li><strong>London Open Killzone:</strong> <strong>02:00 – 05:00 AM EST</strong> (14:00 – 17:00 Phnom Penh time). Ideal for EURUSD, GBPUSD, and XAUUSD session sweeps.</li>" +
          "<li><strong>New York Open Killzone:</strong> <strong>07:00 – 10:00 AM EST</strong> (19:00 – 22:00 Phnom Penh time). Peak displacement for XAUUSD, NAS100, and BTCUSDT.</li>" +
          "<li><strong>The ICT Silver Bullet (10:00 – 11:00 AM EST / 22:00 – 23:00 ICT):</strong> Wait for price to sweep a pre-10 AM high/low, then enter on the first 5m/1m Fair Value Gap (FVG) targeting opposing liquidity.</li>" +
        "</ul>",
      chips: [
        "Give me the full XAUUSD SMC trade plan",
        "Explain Order Blocks and Fair Value Gaps (FVG)",
        "How do I build a daily pre-trade checklist?"
      ]
    };
  }

  // 13. Fake Breakouts / Liquidity Sweeps
  if (q.indexOf("fake breakout") !== -1 || q.indexOf("fakeout") !== -1 || q.indexOf("liquidity") !== -1 || q.indexOf("sweep") !== -1 || q.indexOf("stop hunt") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>🪤 How to Spot Liquidity Sweeps &amp; Avoid Fake Breakouts</h4>" +
        "<p>Institutions engineer <strong>Liquidity Sweeps (Fake Breakouts)</strong> right above resistance and below support:</p>" +
        "<ul>" +
          "<li><strong>Why Fakeouts Happen:</strong> Above equal highs sit thousands of retail Buy Stops and short Stop Losses. Smart Money pushes price just above the level to grab that liquidity before reversing.</li>" +
          "<li><strong>Wick vs. Body Rule:</strong> If a candle pierces above resistance with a long wick but <strong>closes back inside the range</strong>, it is a Liquidity Sweep—do NOT buy the breakout!</li>" +
          "<li><strong>Safe Execution:</strong> Wait for a full 15m/1H <strong>candle body close</strong> beyond the level, followed by a pullback into the newly formed Fair Value Gap.</li>" +
        "</ul>",
      chips: [
        "Explain Break of Structure (BOS) vs CHoCH",
        "Explain what support and resistance are, with a simple real-life example",
        "Show live XAUUSD & BTCUSDT setups"
      ]
    };
  }

  // 14. Beginner Roadmap
  if (q.indexOf("beginner") !== -1 || q.indexOf("teach me") !== -1 || q.indexOf("first things") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>⭐ Welcome to Por AI — Your Step-by-Step Trading Foundation</h4>" +
        "<p>Here are the <strong>4 core pillars</strong> our AI Analyst Team teaches every trader first:</p>" +
        "<ol>" +
          "<li><strong>Market Structure (The Map):</strong> Markets move in Uptrends (Higher Highs + Higher Lows), Downtrends (Lower Highs + Lower Lows), or Ranges.</li>" +
          "<li><strong>Key Levels (Where to Act):</strong> Identify <strong>Support / Order Blocks</strong> (demand floors) and <strong>Resistance / Supply</strong> (ceilings).</li>" +
          "<li><strong>Risk Management (Survival First):</strong> Never risk more than <strong>1%</strong> of your account on a single trade. Always use a hard Stop Loss (SL).</li>" +
          "<li><strong>Risk-to-Reward (R:R):</strong> Aim for setups where your Take Profit (TP) is at least <strong>2× larger</strong> than your Stop Loss (1:2 R:R).</li>" +
        "</ol>",
      chips: [
        "Explain what support and resistance are, with a simple real-life example",
        "How do I size my position if my account is $1,000 and I risk 1% per trade?",
        "How do I read a candlestick chart? Explain what each candle tells me."
      ]
    };
  }

  // 15. Support & Resistance
  if (q.indexOf("support") !== -1 || q.indexOf("resistance") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>📊 Support &amp; Resistance — The Floor and Ceiling of Price</h4>" +
        "<p>Think of price like a <strong>bouncing ball inside a multi-story house</strong>:</p>" +
        "<ul>" +
          "<li><strong>Support (The Floor):</strong> A price zone where buyers consistently step in because the asset is discounted.</li>" +
          "<li><strong>Resistance (The Ceiling):</strong> A price zone where sellers take profit or open shorts because price is at a premium.</li>" +
          "<li><strong>The Role Reversal Rule:</strong> When price breaks decisively <em>through</em> a ceiling (Resistance), that old ceiling becomes the new floor (Support) on the next pullback!</li>" +
        "</ul>",
      chips: [
        "Explain Order Blocks and Fair Value Gaps (FVG)",
        "How do I avoid fake breakouts?",
        "What is the current market regime and what should I focus on today?"
      ]
    };
  }

  // 16. Market Regime / Today's Outlook
  if (q.indexOf("regime") !== -1 || q.indexOf("outlook") !== -1 || q.indexOf("focus on today") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>🧭 AI Analyst Team — Live Market Regime &amp; Multi-Asset Focus</h4>" +
        "<p>Current macro conditions show <strong>High Volatility</strong> with institutional order flow across Metals, Crypto, and US Indices:</p>" +
        "<ul>" +
          "<li><strong>🥇 XAUUSD (Gold) — " + snap.gold.signal + " (" + snap.gold.kpi.conf + " conf):</strong> Holding structure near <strong>" + snap.gold.entry + "</strong> | SL: <strong>" + snap.gold.sl + "</strong> | TP1: <strong>" + snap.gold.tp1 + "</strong>.</li>" +
          "<li><strong>₿ BTCUSDT (Bitcoin) — " + snap.btc.signal + " (" + snap.btc.kpi.conf + " conf):</strong> Watching supply around <strong>" + snap.btc.entry + "</strong> | SL: <strong>" + snap.btc.sl + "</strong> | TP1: <strong>" + snap.btc.tp1 + "</strong>.</li>" +
          "<li><strong>◆ NAS100 (Nasdaq) — " + snap.nas.signal + " (" + snap.nas.kpi.conf + " conf):</strong> Momentum near <strong>" + snap.nas.entry + "</strong> | TP1: <strong>" + snap.nas.tp1 + "</strong>.</li>" +
        "</ul>" +
        buildTeamCouncilBlock(userText),
      chips: [
        "Give me the full XAUUSD SMC trade plan",
        "Give me the full BTCUSDT trade plan",
        "How do I trade the NY Silver Bullet session?"
      ]
    };
  }

  // 17. Trading Mistakes / Psychology / Checklist
  if (q.indexOf("mistake") !== -1 || q.indexOf("lose money") !== -1 || q.indexOf("psychology") !== -1 || q.indexOf("emotion") !== -1 || q.indexOf("checklist") !== -1) {
    if (q.indexOf("checklist") !== -1) {
      return {
        isMatched: true,
        html:
          "<h4>✅ 5-Point Pre-Trade Execution Checklist</h4>" +
          "<ol>" +
            "<li><strong>HTF Bias (4H / 1H):</strong> Am I trading aligned with higher-timeframe market structure?</li>" +
            "<li><strong>Liquidity Taken:</strong> Has price swept a recent session high/low or equal highs/lows first?</li>" +
            "<li><strong>Confirmation (M15 / M5):</strong> Did price produce a clear CHoCH/BOS with displacement leaving a Fair Value Gap (FVG)?</li>" +
            "<li><strong>News Check:</strong> Are we clear of red-folder USD news (CPI, NFP, FOMC) in the next 15 minutes?</li>" +
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
        "<h4>🧠 5 Account-Killing Mistakes &amp; How Our AI Team Fixes Them</h4>" +
        "<ol>" +
          "<li><strong>Moving or Removing Stop Losses:</strong> Turning a 1% loss into a 20% drawdown. <em>Fix:</em> Set hard SL before entry.</li>" +
          "<li><strong>Revenge Trading After a Loss:</strong> Doubling lot size emotionally. <em>Fix:</em> Stop for the day after 2 consecutive losses.</li>" +
          "<li><strong>FOMO Chasing Big Candles:</strong> Buying at resistance exhaustion. <em>Fix:</em> Only enter at pre-marked Order Blocks or FVGs.</li>" +
          "<li><strong>Over-Leveraging Small Accounts:</strong> Risking 10%+ per trade. <em>Fix:</em> Risk 0.5%–1.0% per trade.</li>" +
          "<li><strong>No Trading Playbook:</strong> Trading random pairs. <em>Fix:</em> Focus on XAUUSD &amp; BTCUSDT during London/NY killzones.</li>" +
        "</ol>",
      chips: [
        "How do I build a daily pre-trade checklist?",
        "How do I size my position if my account is $1,000 and I risk 1% per trade?",
        "What is the current market regime and what should I focus on today?"
      ]
    };
  }

  // 18. Candlesticks & Chart Reading
  if (q.indexOf("candlestick") !== -1 || q.indexOf("read my chart") !== -1 || q.indexOf("each candle") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>👁️ Reading Candlesticks — The Language of Buyers &amp; Sellers</h4>" +
        "<p>Every candlestick tells you <strong>4 prices</strong> (Open, High, Low, Close) and reveals who won the battle:</p>" +
        "<ul>" +
          "<li><strong>The Candle Body (Open to Close):</strong> A large green/cyan body shows strong buyer displacement. A large red body shows aggressive seller control.</li>" +
          "<li><strong>The Wicks / Shadows (High &amp; Low):</strong> Long upper wicks show <em>supply rejection</em>. Long lower wicks show <em>demand absorption</em> (liquidity sweep).</li>" +
          "<li><strong>3 High-Probability Signatures:</strong> Look for <strong>Liquidity Sweep Pin Bars</strong> at key levels, <strong>Engulfing Displacement Candles</strong> that leave a Fair Value Gap, and <strong>Inside Bar Consolidations</strong>.</li>" +
        "</ul>",
      chips: [
        "Upload a chart screenshot with Chart Snap",
        "Explain Break of Structure (BOS) vs CHoCH",
        "Explain Order Blocks and Fair Value Gaps (FVG)"
      ]
    };
  }

  // 19. Indicators (RSI, MACD, EMA, Fibonacci)
  if (hasWord(q, "rsi") || q.indexOf("macd") !== -1 || hasWord(q, "ema") || q.indexOf("moving average") !== -1 || q.indexOf("fibonacci") !== -1 || q.indexOf("indicator") !== -1) {
    return {
      isMatched: true,
      html:
        "<h4>📈 Combining Indicators &amp; Fibonacci with Smart Money Price Action</h4>" +
        "<ul>" +
          "<li><strong>Fibonacci Optimal Trade Entry (OTE):</strong> Draw Fib from Swing Low to Swing High. The <strong>0.618 to 0.786 retracement zone</strong> aligns directly with institutional Order Blocks.</li>" +
          "<li><strong>RSI Divergence (14):</strong> When price makes a Lower Low into a 4H/1H Order Block, but RSI makes a <em>Higher Low</em>, it confirms seller exhaustion.</li>" +
          "<li><strong>EMA 50 &amp; EMA 200:</strong> Use on the 1H/4H chart to confirm dynamic institutional trend bias.</li>" +
        "</ul>",
      chips: [
        "Explain Order Blocks and Fair Value Gaps (FVG)",
        "Give me the full XAUUSD SMC trade plan",
        "How do I build a daily pre-trade checklist?"
      ]
    };
  }

  // 20. Universal Smart Synthesis Fallback (When offline or for any custom question)
  return {
    isMatched: false,
    html:
      "<h4>⚡ " + escHtml(getActiveAnalyst().name) + " — Complete Analysis: \"" + escHtml(userText) + "\"</h4>" +
      "<p>Our <strong>AI Analyst Team</strong> analyzed your question (<em>\"" + escHtml(userText) + "\"</em>) across structure, macro context, and execution:</p>" +
      "<ul>" +
        "<li><strong>1. Direct Answer &amp; Core Principle:</strong> Start by defining the higher-timeframe context (4H/1H trend and key liquidity pools) before making any execution decision on <strong>" + escHtml(userText) + "</strong>.</li>" +
        "<li><strong>2. Step-by-Step Action Plan:</strong> Wait for price to sweep resting stops into an unmitigated Order Block or Fair Value Gap, confirm with a 15m/5m CHoCH body close, and size your position at <strong>0.5%–1.0% max risk</strong>.</li>" +
        "<li><strong>3. Live Terminal Benchmarks:</strong> <strong>XAUUSD</strong> is <strong>" + snap.gold.signal + " @ " + snap.gold.entry + "</strong> (SL " + snap.gold.sl + ", TP1 " + snap.gold.tp1 + ") · <strong>BTCUSDT</strong> is <strong>" + snap.btc.signal + " @ " + snap.btc.entry + "</strong> (SL " + snap.btc.sl + ", TP1 " + snap.btc.tp1 + ").</li>" +
      "</ul>" +
      buildTeamCouncilBlock(userText),
    chips: [
      "👥 Ask Full AI Analyst Team for a second opinion",
      "Give me the full XAUUSD SMC trade plan",
      "How do I size my position if my account is $1,000 and I risk 1% per trade?"
    ]
  };
}

// ==========================================
// 8. LIVE AI ENGINE — REAL CONVERSATION (ANSWERS ANY QUESTION, REMEMBERS CONTEXT)
// ==========================================

// ----- 8-0. REAL-TIME MARKET PRICES (free public APIs, no key, fetched in the browser) -----
const LIVE_PRICE_CACHE = { data: null, ts: 0 };

async function fetchJsonQuick(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, timeoutMs || 6000);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBinanceTickers() {
  const q = encodeURIComponent(JSON.stringify(["BTCUSDT", "ETHUSDT", "PAXGUSDT", "EURUSDT"]));
  const hosts = ["https://api.binance.com", "https://data-api.binance.vision"];
  for (let i = 0; i < hosts.length; i++) {
    try {
      const arr = await fetchJsonQuick(hosts[i] + "/api/v3/ticker/24hr?symbols=" + q, 6000);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch (e) { /* try next host */ }
  }
  return null;
}

async function fetchGoldSpot() {
  try {
    const j = await fetchJsonQuick("https://api.gold-api.com/price/XAU", 6000);
    const p = parseFloat(j && j.price);
    if (p > 0) return { price: p, updatedAt: j.updatedAt || null };
  } catch (e) { /* fall back to PAXG proxy */ }
  return null;
}

function fmtLivePrice(sym, p) {
  if (!isFinite(p)) return "n/a";
  if (sym === "EURUSD") return p.toFixed(5);
  return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function fetchLiveMarketPrices() {
  const now = Date.now();
  if (LIVE_PRICE_CACHE.data && now - LIVE_PRICE_CACHE.ts < 15000) return LIVE_PRICE_CACHE.data;

  const results = await Promise.all([fetchBinanceTickers(), fetchGoldSpot()]);
  const tick = results[0], gold = results[1];
  const by = {};
  (tick || []).forEach(function (t) { by[t.symbol] = t; });

  const mk = function (t, source) {
    return t ? {
      price: parseFloat(t.lastPrice), changePct: parseFloat(t.priceChangePercent),
      high: parseFloat(t.highPrice), low: parseFloat(t.lowPrice), source: source
    } : null;
  };

  const items = {};
  if (by.BTCUSDT) items.BTCUSDT = mk(by.BTCUSDT, "Binance");
  if (by.ETHUSDT) items.ETHUSDT = mk(by.ETHUSDT, "Binance");
  if (by.EURUSDT) items.EURUSD = mk(by.EURUSDT, "Binance EURUSDT (close proxy for EURUSD)");

  if (gold) {
    items.XAUUSD = { price: gold.price, source: "gold-api.com spot" };
  } else if (by.PAXGUSDT) {
    items.XAUUSD = mk(by.PAXGUSDT, "Binance PAXGUSDT (gold-token proxy, ~spot gold)");
  }
  if (items.XAUUSD && by.PAXGUSDT && items.XAUUSD.changePct === undefined) {
    items.XAUUSD.changePct = parseFloat(by.PAXGUSDT.priceChangePercent);
    items.XAUUSD.high = parseFloat(by.PAXGUSDT.highPrice);
    items.XAUUSD.low = parseFloat(by.PAXGUSDT.lowPrice);
    items.XAUUSD.statsNote = "24h change/high/low are from PAXGUSDT (gold-token proxy)";
  }

  const out = { fetchedAt: new Date(), items: items, ok: Object.keys(items).length > 0 };
  if (out.ok) { LIVE_PRICE_CACHE.data = out; LIVE_PRICE_CACHE.ts = now; }
  return out;
}

function buildLiveDataBlock(live, searchOn) {
  if (!live || !live.ok) {
    return "LIVE MARKET DATA: the real-time price feed FAILED to load. Do NOT quote any current price or level as fact. " + (searchOn ? "You may use Google Search to find the current price and state the source and time; if you cannot verify it, say so." : "Tell the user live prices are unavailable right now and answer conceptually only.");
  }
  const lines = [];
  ["XAUUSD", "BTCUSDT", "ETHUSDT", "EURUSD"].forEach(function (s) {
    const it = live.items[s];
    if (!it) return;
    let line = s + ": " + fmtLivePrice(s, it.price);
    if (isFinite(it.changePct)) line += " | 24h " + (it.changePct >= 0 ? "+" : "") + it.changePct.toFixed(2) + "%";
    if (isFinite(it.high) && isFinite(it.low)) line += " | 24h high " + fmtLivePrice(s, it.high) + " / low " + fmtLivePrice(s, it.low);
    line += " | source: " + it.source;
    if (it.statsNote) line += " (" + it.statsNote + ")";
    lines.push(line);
  });
  const missing = ["XAUUSD", "BTCUSDT", "ETHUSDT", "EURUSD"].filter(function (s) { return !live.items[s]; });
  return (
    "REAL-TIME MARKET DATA (fetched " + live.fetchedAt.toUTCString() + "):\n" + lines.join("\n") + "\n" +
    (searchOn
      ? "NO BUILT-IN FEED for: NAS100/US indices, DXY, US Treasury yields, other forex pairs, economic calendar/news" + (missing.length ? ", " + missing.join(", ") : "") + ". For these use Google Search, state the source and the time of the data, and if you cannot verify a number say so instead of guessing.\n" +
        "DATA RULES: For the symbols listed above use ONLY those numbers as the current price (they are fresher than search results). NEVER invent prices, yields, news, or event dates. "
      : "NOT AVAILABLE (no live feed — never state numbers for these): NAS100/US indices, DXY, US Treasury yields, other forex pairs, economic calendar/news" +
        (missing.length ? ", " + missing.join(", ") : "") + ".\n" +
        "DATA RULES: Use ONLY the numbers above as current prices. NEVER invent prices, DXY, yields, news, or event dates. If asked about something not listed, say you have no live feed for it. ") +
    "For forecasts or trade ideas: say clearly that nobody can predict price, give if/then scenarios, and derive every level from the live price and the 24h high/low above (never from memory), labelled educational."
  );
}

function buildLiveStampHtml(live, usedSearch) {
  if (!live || !live.ok) {
    return '<div class="pac-live-stamp pac-live-stamp-bad">⚠️ Live price feed unavailable — no current prices were used.</div>';
  }
  const parts = [];
  ["XAUUSD", "BTCUSDT", "EURUSD"].forEach(function (s) {
    if (live.items[s]) parts.push(s + " " + fmtLivePrice(s, live.items[s].price));
  });
  return '<div class="pac-live-stamp">📡 Live data · ' + parts.join(" · ") + " · " +
    live.fetchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + (usedSearch ? " · 🔎 web search on" : "") + "</div>";
}

function conversationIsTrading() {
  return currentMessages.slice(-6).some(function (m) { return m.role === "user" && isTradingTopic(m.text); });
}

// ----- 8a. Safe Markdown -> HTML renderer (escapes first, so AI output can never inject HTML) -----
function mdInline(s) {
  let t = escHtml(s);
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
  t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return t;
}

function renderMarkdown(raw) {
  let text = String(raw || "").replace(/\r\n/g, "\n");
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (!text) return "";

  const lines = text.split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // Code fence
    if (/^```/.test(trimmed)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
      i++;
      html += "<pre><code>" + escHtml(buf.join("\n")) + "</code></pre>";
      continue;
    }

    // Table (header row + separator row)
    if (trimmed.charAt(0) === "|" && i + 1 < lines.length && /^\|?\s*:?-{2,}/.test(lines[i + 1].trim())) {
      const splitRow = function (r) { return r.trim().replace(/^\||\|$/g, "").split("|").map(function (c) { return c.trim(); }); };
      const head = splitRow(trimmed);
      i += 2;
      let rows = "";
      while (i < lines.length && lines[i].trim().charAt(0) === "|") {
        rows += "<tr>" + splitRow(lines[i]).map(function (c) { return "<td>" + mdInline(c) + "</td>"; }).join("") + "</tr>";
        i++;
      }
      html += '<div class="pac-table-wrap"><table><thead><tr>' +
        head.map(function (c) { return "<th>" + mdInline(c) + "</th>"; }).join("") +
        "</tr></thead><tbody>" + rows + "</tbody></table></div>";
      continue;
    }

    // Heading
    const h = trimmed.match(/^#{1,6}\s+(.*)$/);
    if (h) { html += "<h4>" + mdInline(h[1]) + "</h4>"; i++; continue; }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { html += "<hr>"; i++; continue; }

    // Lists
    if (/^([-*•])\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      const ordered = /^\d+[.)]\s+/.test(trimmed);
      const re = ordered ? /^\d+[.)]\s+/ : /^([-*•])\s+/;
      let items = "";
      while (i < lines.length && re.test(lines[i].trim())) {
        items += "<li>" + mdInline(lines[i].trim().replace(re, "")) + "</li>";
        i++;
      }
      html += (ordered ? "<ol>" : "<ul>") + items + (ordered ? "</ol>" : "</ul>");
      continue;
    }

    // Paragraph (merge consecutive plain lines)
    const para = [];
    while (i < lines.length && lines[i].trim() &&
           !/^(```|#{1,6}\s|([-*•])\s|\d+[.)]\s)/.test(lines[i].trim()) &&
           lines[i].trim().charAt(0) !== "|") {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length) html += "<p>" + mdInline(para.join("\n")).replace(/\n/g, "<br>") + "</p>";
    else i++;
  }
  return html;
}

function htmlToPlainText(html) {
  try {
    const doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  } catch (e) {
    return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}

// ----- 8b. Build the multi-turn message list (this is what gives back-and-forth memory) -----
function buildChatMessages(systemPrompt, imageDataUrl) {
  const recent = currentMessages.slice(-PAC_AI_CONFIG.historyMessages);
  while (recent.length && recent[0].role !== "user") recent.shift();

  const msgs = [{ role: "system", content: systemPrompt }];
  recent.forEach(function (m, idx) {
    const isLast = idx === recent.length - 1;
    if (m.role === "user") {
      if (isLast && imageDataUrl) {
        msgs.push({
          role: "user",
          content: [
            { type: "text", text: m.text },
            { type: "image_url", image_url: { url: imageDataUrl } }
          ]
        });
      } else {
        msgs.push({ role: "user", content: m.text + (m.image ? "\n[The user attached a chart screenshot here]" : "") });
      }
    } else {
      const plain = (m.plainText || htmlToPlainText(m.html)).slice(0, 3000);
      if (plain) msgs.push({ role: "assistant", content: plain });
    }
  });
  return msgs;
}

// ----- 8c. One chat-completion request (OpenAI-compatible JSON or plain-text reply) -----
async function requestChatCompletion(url, apiKey, model, messages, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
  try {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = "Bearer " + apiKey;

    const res = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ model: model, messages: messages, private: true }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const raw = await res.text();
    try {
      const data = JSON.parse(raw);
      const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (typeof content === "string" && content.trim()) return content;
    } catch (parseErr) { /* not JSON — maybe plain text */ }

    if (raw && raw.trim() && raw.trim().charAt(0) !== "{") return raw;
    throw new Error("Empty AI response");
  } finally {
    clearTimeout(timer);
  }
}

// ----- 8c-2. Google Gemini (native REST, key sent in the x-goog-api-key header) -----
function toGeminiPayload(messages, useSearch) {
  const system = messages.length && messages[0].role === "system" ? messages[0].content : "";
  const contents = [];
  messages.slice(system ? 1 : 0).forEach(function (m) {
    const role = m.role === "assistant" ? "model" : "user";
    const parts = [];
    if (Array.isArray(m.content)) {
      m.content.forEach(function (p) {
        if (p.type === "text") parts.push({ text: p.text });
        else if (p.type === "image_url" && p.image_url && p.image_url.url) {
          const mt = /^data:([^;]+);base64,(.+)$/.exec(p.image_url.url);
          if (mt) parts.push({ inlineData: { mimeType: mt[1], data: mt[2] } });
        }
      });
    } else {
      parts.push({ text: String(m.content || "") });
    }
    if (parts.length) contents.push({ role: role, parts: parts });
  });
  const body = { contents: contents };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  if (useSearch) body.tools = [{ google_search: {} }];
  return body;
}

async function requestGeminiCompletion(model, apiKey, messages, useSearch, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
  try {
    const res = await fetch(PAC_AI_CONFIG.geminiEndpoint + encodeURIComponent(model) + ":generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(toGeminiPayload(messages, useSearch)),
      signal: controller.signal
    });
    const raw = await res.text();
    if (!res.ok) {
      let detail = "";
      try {
        const j = JSON.parse(raw);
        detail = (j.error && (j.error.message || j.error.status)) || "";
      } catch (e) {}
      const err = new Error("HTTP " + res.status + (detail ? ": " + String(detail).slice(0, 180) : ""));
      err.httpStatus = res.status;
      throw err;
    }
    const data = JSON.parse(raw);
    const cand = data && data.candidates && data.candidates[0];
    const parts = (cand && cand.content && cand.content.parts) || [];
    const text = parts.filter(function (p) { return p.text && !p.thought; }).map(function (p) { return p.text; }).join("");
    if (!text.trim()) {
      const why = (cand && cand.finishReason) || (data && data.promptFeedback && data.promptFeedback.blockReason) || "empty";
      throw new Error("Gemini returned no text (" + why + ")");
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function buildSystemPrompt(analyst, live, useLive, searchOn) {
  let tracked = "";
  const db = Array.isArray(window.WATCHLIST_DB) ? window.WATCHLIST_DB : [];
  if (db.length) {
    tracked = "Signals tracked in the user's own terminal: " + db.slice(0, 6).map(function (x) {
      return x.symbol + " " + x.signal + " entry " + x.entry + " SL " + x.sl + " TP1 " + x.tp1;
    }).join("; ") + ". ";
  }
  return (
    analyst.systemPersona + " " +
    "You are part of the POR1.0 AI Analyst Team created by Por ICT. " +
    "This is a live back-and-forth chat: use the earlier messages for context and answer follow-ups naturally (for example 'why?', 'explain more', 'what about gold?'). Ask one short clarifying question only if you truly cannot answer without it. " +
    "Answer ANY topic the user asks about (trading, math, coding, business, daily life, general knowledge). Never force trading talk into a non-trading question. " +
    "Always reply in the same language the user writes in (Khmer question -> Khmer answer, English -> English). " +
    "Keep answers short for simple or casual messages and go deeper only when the user asks for detail. " +
    "Format with simple Markdown only: short paragraphs, '- ' bullet lists, '1. ' numbered lists, **bold**, tables, and ``` code blocks. Do not use HTML. " +
    (useLive ? buildLiveDataBlock(live, searchOn) + " " : "You have no live market feed in this message; never quote current prices as fact. ") +
    tracked +
    "For trade ideas add one short line that it is educational analysis, not financial advice."
  );
}

// ----- 8d. Main entry: AI first for EVERYTHING, local knowledge only as an offline fallback -----
async function fetchLiveAiAnswer(userText, imageDataUrl) {
  const analyst = getActiveAnalyst();
  const hasImage = Boolean(imageDataUrl);
  const trading = isTradingTopic(userText) || hasImage;

  const wantsLive = trading || conversationIsTrading() || (analyst.id !== "all_team" && analyst.id !== "por_lead");
  const live = wantsLive ? await fetchLiveMarketPrices() : null;
  const apiKey = getAiApiKey();
  const provider = apiKey ? getKeyProvider(apiKey) : "none";

  const attempts = [];
  if (provider === "gemini") {
    const gm = PAC_AI_CONFIG.geminiModels;
    attempts.push({ kind: "gemini", model: gm[0], search: wantsLive });   // best: web search for DXY / yields / news
    if (wantsLive) attempts.push({ kind: "gemini", model: gm[0], search: false });
    if (gm[1]) attempts.push({ kind: "gemini", model: gm[1], search: false });
  } else if (provider === "pollinations") {
    attempts.push({ kind: "openai", url: PAC_AI_CONFIG.endpoint, key: apiKey, model: PAC_AI_CONFIG.model });
  }
  attempts.push({ kind: "openai", url: "https://text.pollinations.ai/openai", key: "", model: "openai" });
  attempts.push({ kind: "openai", url: "https://text.pollinations.ai/", key: "", model: "openai" });

  let lastError = "";
  let primaryError = "";   // error from the FIRST (main) provider — the one worth showing
  let geminiAuthFailed = false;
  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    if (a.kind === "gemini" && geminiAuthFailed) continue;
    try {
      const sys = buildSystemPrompt(analyst, live, wantsLive, a.kind === "gemini" && a.search);
      const messages = buildChatMessages(sys, imageDataUrl);
      const aiText = a.kind === "gemini"
        ? await requestGeminiCompletion(a.model, apiKey, messages, a.search, PAC_AI_CONFIG.timeoutMs)
        : await requestChatCompletion(a.url, a.key, a.model, messages, PAC_AI_CONFIG.timeoutMs);
      let html = renderMarkdown(aiText);
      if (html) {
        if (analyst.id === "all_team" && trading) html += buildTeamCouncilBlock(userText);
        if (wantsLive) html += buildLiveStampHtml(live, a.kind === "gemini" && a.search);
        return {
          analyst: analyst,
          html: html,
          plainText: aiText,
          chips: trading
            ? [
                "👥 Ask Full AI Analyst Team for a second opinion",
                "Give me the full XAUUSD SMC trade plan",
                "How do I size my position if my account is $1,000 and I risk 1% per trade?"
              ]
            : []
        };
      }
    } catch (err) {
      const label = a.kind === "gemini" ? "Gemini (" + a.model + (a.search ? " + search" : "") + ")" : (a.url.indexOf("gen.pollinations") !== -1 ? "Pollinations key" : "Pollinations no-key");
      lastError = label + " → " + String((err && err.message) || err);
      if (!primaryError) primaryError = lastError;
      if (a.kind === "gemini" && err && (err.httpStatus === 401 || err.httpStatus === 403)) geminiAuthFailed = true;
      console.warn("AI attempt failed:", lastError);
    }
  }

  // ---- Offline / AI unreachable: use built-in trading knowledge if it matches, else be honest ----
  const localCheck = buildSmartLocalResponse(userText, hasImage);
  const note =
    '<p style="color:#fbbf24;font-size:12px;">⚠️ Live AI is not reachable right now — showing built-in answer. ' +
    'មិនអាចភ្ជាប់ទៅ AI បានទេ (សូមពិនិត្យ API key ឬអ៊ីនធឺណិត)។ <br><code>' + escHtml(primaryError || lastError || (apiKey ? "unknown error" : "No API key set")) + '</code></p>';

  if (hasImage || localCheck.isMatched) {
    let finalHtml = note + localCheck.html;
    if (analyst.id === "all_team" && finalHtml.indexOf("pac-team-council-grid") === -1) {
      finalHtml += buildTeamCouncilBlock(userText);
    }
    return { analyst: analyst, html: finalHtml, chips: localCheck.chips };
  }

  return {
    analyst: analyst,
    html:
      "<h4>⚠️ Can't reach the AI right now · មិនអាចភ្ជាប់ AI បានទេ</h4>" +
      "<p>I couldn't get a live answer to your question. Reason: <code>" + escHtml(primaryError || lastError || (apiKey ? "unknown error" : "No API key set")) + "</code>. This is usually a missing or invalid API key.</p>" +
      "<ul>" +
        '<li>Get a free <strong>pk_...</strong> key at <a href="https://enter.pollinations.ai/keys" target="_blank" rel="noopener noreferrer">enter.pollinations.ai/keys</a>.</li>' +
        "<li>Paste it into <strong>PAC_AI_CONFIG.apiKey</strong> (Pollinations <strong>pk_</strong> key or a Google AI Studio key) at the top of <strong>por-ai-chat.js</strong>, then refresh.</li>" +
        "<li>Then send your question again — the chat will answer anything and remember the conversation.</li>" +
      "</ul>",
    chips: userText.length < 80 ? [userText] : []
  };
}

// ==========================================
// 9. UI RENDERING & MESSAGE STREAMING
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
  const currentAgent = getActiveAnalyst();

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
      const msgAgent = m.analyst || currentAgent;
      const headerHtml =
        '<div class="pac-msg-analyst-header">' +
          '<span class="pac-msg-analyst-left">' +
            '<span>' + (msgAgent.emoji || "🤖") + '</span>' +
            '<span>' + escHtml(msgAgent.name || "Por AI Analyst Team") + '</span>' +
          '</span>' +
          '<span class="pac-msg-analyst-role">' + escHtml(msgAgent.badge || "POR1.0") + '</span>' +
        '</div>';

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
            headerHtml +
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
          currentAgent.emoji + ' ' + escHtml(currentAgent.name) + ' is analyzing and preparing your answer...' +
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
      } else if (promptText === "👥 Ask Full AI Analyst Team for a second opinion") {
        setSelectedAnalyst("all_team");
        const lastUserMsg = currentMessages.slice().reverse().find(function (x) { return x.role === "user"; });
        sendUserMessage(lastUserMsg ? "Assemble the Full AI Analyst Team for: " + lastUserMsg.text : "Assemble the Full AI Analyst Team");
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

  const reply = await fetchLiveAiAnswer(userMsg.text, usedImage);

  isAiTyping = false;
  currentMessages.push({
    role: "ai",
    analyst: reply.analyst,
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
// 10. CHART SNAP IMAGE UPLOAD HANDLING
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
// 11. CHATS HISTORY DRAWER
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
    list.innerHTML = '<div style="color:var(--pac-text-muted);font-size:12px;text-align:center;padding:24px 8px;">No saved chats yet. Pick an AI Analyst or click any question card to start!</div>';
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
// 12. BIND EVENTS & INITIALIZE
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

  // Bottom Dock Analyst Selector Dropdown
  const dockSelect = document.getElementById("pacDockAnalystSelect");
  if (dockSelect) {
    dockSelect.addEventListener("change", function (e) {
      setSelectedAnalyst(e.target.value);
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
  loadSelectedAnalyst();
  applyLogoToAllElements();
  loadSavedChats();
  renderAnalystTeamControls();
  bindPorAiEvents();
});