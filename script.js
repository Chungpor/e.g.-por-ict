/**
 * Por ICT - Calendar, Market Analytics & Indicators System (UNIFIED)
 *
 * LOAD ORDER in index.html (all at the end of <body>, or with `defer`):
 *   <script src="translations.js"></script>   // contains: const translations = {...}
 *   <script src="news-data.js"></script>      // contains: const rawApiPayload = {...}
 *   <script src="script.js"></script>         // this file
 *
 * translations.js and news-data.js are optional: if missing, this file falls back safely.
 */
"use strict";

// ==========================================
// 0. HELPERS
// ==========================================
const DEFAULT_EMAIL = "chungpor908@gmail.com";
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Escape text before putting it inside innerHTML (feeds and notes are untrusted). */
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`Could not read "${key}" from localStorage`, err);
    return fallback;
  }
}

function on(el, evt, handler, opts) {
  if (el) el.addEventListener(evt, handler, opts);
}

const FALLBACK_DICT = {
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  no_trade: "no trade",
  sound_on: "Music: ON",
  sound_off: "Music: OFF",
  price_monthly: "/ month",
  price_yearly: "/ year",
  btn_current_plan: "Current Plan",
  plan_starter_title: "Starter Member",
  btn_upgrade_pro: "Upgrade to Pro →",
  btn_join_vip: "Join VIP Elite →",
  tier_updated_msg: "Membership updated to ",
  verify_success: "Code verified successfully!",
  verify_resent_msg: "A new 6-digit code has been sent!",
  reset_success: "Reset link sent! Please check your inbox."
};

let currentLang = localStorage.getItem("por_lang") || "EN";

// Updated strings for Triumm Delta, Chart Analysis, Electric Flamingo Indicators & Aquamarine Por AI Chat
const EXTRA_DICT = {
  EN: {
    nav_terminal: "Triumm Delta",
    nav_analysis: "Analysis",
    nav_indicators: "Indicators",
    nav_aichat: "Por AI Chat",
    ca_sub: "SIGNAL GENERATOR",
    ca_title: "Chart Analysis",
    ca_desc: "Generate entry, stop loss and targets from live data, your own levels, or an uploaded chart screenshot, with lot-size calculation.",
    ca_btn: "OPEN CHART ANALYSIS ➔",
    ind_sub: "TECHNICAL CONFLUENCE & REGIME",
    ind_title: "Dashboard / Indicators",
    ind_desc: "Live multi-asset technical indicators (EMA 20/50/200 stack, RSI, ADX, DI Edge, ATR & CHOP) with AI regime & 5-indicator confluence scoring.",
    ind_btn: "OPEN INDICATORS ➔",
    pac_pill: "💎 POR1.0 · AQUAMARINE",
    pac_sub: "SMC & ICT AI TRADING MENTOR",
    pac_title: "Por AI Chat",
    pac_desc: "Interactive AI trading command center for XAUUSD, BTCUSDT & NAS100 with Chart Snap vision, live setups, and position sizing.",
    pac_btn: "OPEN POR AI CHAT ➔",
    term_pill: "⚡ TRIUMM DELTA AI",
    term_sub: "AUTO SIGNALS · SUPER LLM · DEEP ANALYSIS",
    term_title: "Triumm Delta",
    term_desc: "AI Market Intelligence Feed, real-time forex, crypto & macro news, AI price impact analysis, and live technical Delta Signals.",
    term_btn: "LAUNCH TRIUMM DELTA ➔",
    news_card_label: "USD FOCUS & FOREX FACTORY",
    news_card_title: "Por ICT News",
    news_card_desc: "High, Medium & Low impact USD newswire feeds with institutional ICT execution commentary.",
    news_card_btn: "READ POR ICT NEWS ➔",
    chart_card_desc: "Real-time institutional candlestick charts with customizable indicators."
  },
  KH: {
    nav_terminal: "Triumm Delta",
    nav_analysis: "វិភាគ",
    nav_indicators: "សូចនាករ (Indicators)",
    nav_aichat: "Por AI Chat",
    ca_sub: "ឧបករណ៍បង្កើតសញ្ញា",
    ca_title: "វិភាគក្រាហ្វ",
    ca_desc: "បង្កើត Entry, Stop Loss និងគោលដៅ ពីទិន្នន័យផ្ទាល់ កម្រិតរបស់អ្នក ឬរូបថតក្រាហ្វ ព្រមទាំងគណនាទំហំ Lot។",
    ca_btn: "បើកការវិភាគក្រាហ្វ ➔",
    ind_sub: "សូចនាករបច្ចេកទេស និងទិសដៅទីផ្សារ",
    ind_title: "ផ្ទាំងគ្រប់គ្រង / Indicators",
    ind_desc: "សូចនាករបច្ចេកទេសផ្ទាល់ (EMA 20/50/200, RSI, ADX, DI Edge, ATR & CHOP) ជាមួយការវាយតម្លៃទិសដៅទីផ្សារដោយ AI។",
    ind_btn: "បើក INDICATORS ➔",
    pac_pill: "💎 POR1.0 · AQUAMARINE",
    pac_sub: "ជំនួយការជួញដូរ SMC & ICT AI",
    pac_title: "Por AI Chat",
    pac_desc: "មជ្ឈមណ្ឌលជំនួយការជួញដូរ AI សម្រាប់ XAUUSD, BTCUSDT និង NAS100 ជាមួយការវិភាគរូបភាពក្រាហ្វ Chart Snap និងការគណនាហានិភ័យ 1%។",
    pac_btn: "បើក POR AI CHAT ➔",
    term_pill: "⚡ TRIUMM DELTA AI",
    term_sub: "សញ្ញាស្វ័យប្រវត្តិ · SUPER LLM · ការវិភាគស៊ីជម្រៅ",
    term_title: "Triumm Delta",
    term_desc: "ប្រព័ន្ធព័ត៌មានទីផ្សារ AI ព័ត៌មាន Forex, Crypto និង Macro ផ្ទាល់ ការវិភាគផលប៉ះពាល់តម្លៃដោយ AI និងសញ្ញាបច្ចេកទេស Delta Signals។",
    term_btn: "បើក TRIUMM DELTA ➔",
    news_card_label: "ផ្តោតលើ USD និង FOREX FACTORY",
    news_card_title: "ព័ត៌មាន Por ICT",
    news_card_desc: "ព័ត៌មាន USD ផលប៉ះពាល់ខ្ពស់ មធ្យម និងទាប ជាមួយការវិភាគ ICT កម្រិតស្ថាប័ន។",
    news_card_btn: "អានព័ត៌មាន POR ICT ➔",
    chart_card_desc: "ក្រាហ្វ Candlestick កម្រិតស្ថាប័នតាមពេលវេលាជាក់ស្តែង ជាមួយ Indicator ដែលអាចកែសម្រួលបាន។"
  }
};

function getDict() {
  const all = typeof translations !== "undefined" ? translations : { EN: FALLBACK_DICT };
  return {
    ...FALLBACK_DICT,
    ...(all.EN || {}),
    ...(all[currentLang] || {}),
    ...EXTRA_DICT.EN,
    ...(EXTRA_DICT[currentLang] || {})
  };
}

// ==========================================
// 1. DATA & STATE
// ==========================================
const defaultChungporTrades = {
  "2026-10-01": { pnl: 40.0, symbol: "XAUUSD", note: "" },
  "2026-10-02": { pnl: 45.0, symbol: "XAUUSD", note: "" },
  "2026-10-03": { pnl: 0.0, symbol: "no trade", note: "" },
  "2026-10-04": { pnl: 0.0, symbol: "no trade", note: "" },
  "2026-10-05": { pnl: 30.0, symbol: "XAUUSD", note: "" },
  "2026-10-06": { pnl: 75.0, symbol: "XAUUSD", note: "" },
  "2026-10-07": { pnl: 50.0, symbol: "XAUUSD", note: "" }
};

const defaultGenericAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

const accountsDatabase = readJson("por_all_accounts", null) || {};
if (!accountsDatabase[DEFAULT_EMAIL]) {
  accountsDatabase[DEFAULT_EMAIL] = {
    name: "Chungpor",
    email: DEFAULT_EMAIL,
    tier: "Member",
    avatar: "por.jpg",
    trades: defaultChungporTrades
  };
}
accountsDatabase[DEFAULT_EMAIL].name = "Chungpor";

function saveAccountsToStorage() {
  try {
    localStorage.setItem("por_all_accounts", JSON.stringify(accountsDatabase));
  } catch (err) {
    console.warn("Could not save accounts (storage full?)", err);
  }
}
saveAccountsToStorage();

let activeUserEmail = localStorage.getItem("por_active_user") || DEFAULT_EMAIL;
if (!accountsDatabase[activeUserEmail]) activeUserEmail = DEFAULT_EMAIL;
let currentAccount = accountsDatabase[activeUserEmail];
let tradeDatabase = currentAccount.trades || {};

function saveCurrentAccountTrades() {
  if (!currentAccount) return;
  currentAccount.trades = tradeDatabase;
  accountsDatabase[activeUserEmail] = currentAccount;
  saveAccountsToStorage();
}

const today = new Date();
let currentYear = today.getFullYear();
let currentMonth = today.getMonth(); // 0-indexed
let selectedDateKey = "";
let performanceChart = null;

let currentTier = currentAccount.tier || "Member";
let isYearlyBilling = false;
let currentVerificationCode = "";
let pendingSignupUser = null;

// TradingView
let currentChartSymbol = "OANDA:XAUUSD";
let currentChartInterval = "15";

// Audio
const YT_AUDIO_VIDEO_ID = "yGbaHLXUZWY";
let ytAudioPlayer = null;
let isAudioPlaying = false;
let ytPlayerReady = false;
let pendingPlay = false;

// News state
let currentNewsFilter = "all";     // all | usd | high | medium | low
let currentActiveNewsTab = "hot";  // hot | wire

function isLoggedIn() {
  return localStorage.getItem("por_is_logged_in") === "true";
}

// ==========================================
// 2. DOM REFERENCES
// ==========================================
const $ = (id) => document.getElementById(id);

const loginView = $("loginView");
const signupView = $("signupView");
const verifyView = $("verifyView");
const resetPasswordView = $("resetPasswordView");
const dashboardView = $("dashboardView");
const newsView = $("newsView");
const liveChartView = $("liveChartView");
const membershipView = $("membershipView");
const contactView = $("contactView");

const loginForm = $("loginForm");
const navLogoutBtn = $("navLogoutBtn");
const navProfileWrapper = $("navProfileWrapper");
const navCenterLinks = $("navCenterLinks");
const navHomeLink = $("navHomeLink");
const navNewsLink = $("navNewsLink");
const navLiveChartLink = $("navLiveChartLink");
const navIndicatorsLink = $("navIndicatorsLink");
const navPorAiChatLink = $("navPorAiChatLink");
const navMembershipLink = $("navMembershipLink");
const navContactLink = $("navContactLink");
const navMusicBtn = $("navMusicBtn");

const mobileMenuBtn = $("mobileMenuBtn");
const mobileMenuDrawer = $("mobileMenuDrawer");
const mobileDrawerBackdrop = $("mobileDrawerBackdrop");
const mobileHomeLink = $("mobileHomeLink");
const mobileNewsLink = $("mobileNewsLink");
const mobileLiveChartLink = $("mobileLiveChartLink");
const mobileIndicatorsLink = $("mobileIndicatorsLink");
const mobilePorAiChatLink = $("mobilePorAiChatLink");
const mobileMembershipLink = $("mobileMembershipLink");
const mobileContactLink = $("mobileContactLink");
const mobileMusicBtn = $("mobileMusicBtn");
const mobileMusicStateText = $("mobileMusicStateText");
const mobileLogoutLink = $("mobileLogoutLink");
const mobileViewProfileBtn = $("mobileViewProfileBtn");
const mobileEzContactFab = $("mobileEzContactFab");

const newsBackBtn = $("newsBackBtn");
const openNewsFromDashBtn = $("openNewsFromDashBtn");
const membershipBackBtn = $("membershipBackBtn");
const liveChartBackBtn = $("liveChartBackBtn");
const contactBackBtn = $("contactBackBtn");
const openLiveChartBtn = $("openLiveChartBtn");
const bannerUpgradeBtn = $("bannerUpgradeBtn");

const hotNewsItemsList = $("hotNewsItemsList");
const wireCardsGrid = $("wireCardsGrid");
const newsFeedCounter = $("newsFeedCounter");
const liveIctClock = $("liveIctClock");
const jsonApiBtn = $("jsonApiBtn");
const newsFiltersContainer = $("newsFiltersContainer");
const ffCalendarExternalBtn = $("ffCalendarExternalBtn");
const tabHotNewsBtn = $("tabHotNewsBtn");
const tabNewswireBtn = $("tabNewswireBtn");
const hotReadsSection = $("hotReadsSection");
const newswireSection = $("newswireSection");

const soundToggleBtn = $("soundToggleBtn");
const soundStatusText = $("soundStatusText");

const togglePasswordBtn = $("togglePasswordBtn");
const loginPasswordInput = $("loginPassword");
const loginEmailInput = $("loginEmail");
const forgotPasswordLink = $("forgotPasswordLink");

const goToSignupBtn = $("goToSignupBtn");
const goToLoginBtn = $("goToLoginBtn");
const signupForm = $("signupForm");
const signupNameInput = $("signupName");
const signupEmailInput = $("signupEmail");
const signupPasswordInput = $("signupPassword");
const signupConfirmInput = $("signupConfirmPassword");
const signupErrorMsg = $("signupErrorMsg");
const toggleSignupPasswordBtn = $("toggleSignupPasswordBtn");
const toggleSignupConfirmBtn = $("toggleSignupConfirmBtn");

const verifyEmailDisplay = $("verifyEmailDisplay");
const otpBoxes = document.querySelectorAll(".otp-box");
const resendCodeBtn = $("resendCodeBtn");
const verifyBackBtn = $("verifyBackBtn");
const verifyStatusMsg = $("verifyStatusMsg");

const resetPasswordForm = $("resetPasswordForm");
const resetEmailInput = $("resetEmailInput");
const resetBackToLoginBtn = $("resetBackToLoginBtn");
const resetStatusMsg = $("resetStatusMsg");

const emailToast = $("emailToast");
const toastTitle = $("toastTitle");
const toastDesc = $("toastDesc");
const toastFillBtn = $("toastFillBtn");
const toastCloseBtn = $("toastCloseBtn");

const billingCycleToggle = $("billingCycleToggle");
const billingMonthlyLabel = $("billingMonthlyLabel");
const billingYearlyLabel = $("billingYearlyLabel");
const priceProDisplay = document.querySelector(".price-pro-display");
const priceEliteDisplay = document.querySelector(".price-elite-display");
const priceCycleLabels = document.querySelectorAll(".price-cycle-label");

const avatarUploadTrigger = $("avatarUploadTrigger");
const avatarFileInput = $("avatarFileInput");
const profileAvatarImg = $("profileAvatarImg");
const popoverAvatarImg = $("popoverAvatarImg");
const mobileUserAvatar = $("mobileUserAvatar");
const profileNameEl = $("profileName");
const profileEmailEl = $("profileEmail");
const popoverNameEl = $("popoverName");
const popoverEmailEl = $("popoverEmail");
const mobileUserName = $("mobileUserName");
const mobileUserEmail = $("mobileUserEmail");
const bannerTierTag = $("bannerTierTag");
const popoverTierBadge = $("popoverTierBadge");
const mobileTierBadge = $("mobileTierBadge");

const themeToggleSwitch = $("themeToggleSwitch");
const thumbSun = document.querySelector(".thumb-sun");
const thumbMoon = document.querySelector(".thumb-moon");

const langToggleBtn = $("langToggleBtn");
const langMenu = $("langMenu");
const langOptions = document.querySelectorAll(".lang-option");

const navProfileTrigger = $("navProfileTrigger");
const profilePopoverCard = $("profilePopoverCard");
const viewFullProfileBtn = $("viewFullProfileBtn");
const profileCardSection = $("profileCardSection");

const calendarGrid = $("calendarDaysGrid");
const monthLabel = $("currentMonthLabel");
const prevBtn = $("prevMonthBtn");
const nextBtn = $("nextMonthBtn");

const statProfitEl = $("statProfitValue");
const statBestPairEl = $("statBestPair");
const statBestPairPnlEl = $("statBestPairPnl");
const statChangeEl = $("statChangeValue");

const modal = $("tradeModal");
const closeModalBtn = $("closeModalBtn");
const modalDateTitle = $("modalDateTitle");
const tradeForm = $("tradeForm");
const deleteTradeBtn = $("deleteTradeBtn");
const inputPnl = $("inputPnl");
const inputSymbol = $("inputSymbol");
const inputNote = $("inputNote");

// ==========================================
// 3. HEADLINE NEWS DATA (from news-data.js)
// ==========================================
const rawHeadlines =
  typeof rawApiPayload !== "undefined" && rawApiPayload && Array.isArray(rawApiPayload.data)
    ? rawApiPayload.data
    : [];

const porIctNewsData = rawHeadlines.map((item) => ({
  ...item,
  url: item.url ? item.url.replace("zoqira.pro", "porict.com") : "#",
  source: item.source === "Zoqira" || !item.source ? "Por ICT Newswire" : item.source,
  impact: (item.impact || "LOW").toUpperCase()
}));

const USD_SYMBOLS = new Set(["USD", "XAUUSD", "DXY", "US500", "US30", "NAS100", "US10Y"]);

function isUsdInstrument(item) {
  return Array.isArray(item.affected) && item.affected.some((sym) => USD_SYMBOLS.has(sym));
}

function generateIctGuidance(item) {
  if (item.regime === "RISK_OFF") {
    if (item.bias && item.bias.USD === "BULLISH" && item.bias.XAUUSD === "BULLISH") {
      return "Bullish Safe-Haven Expansion: Accumulate Gold & USD dips into M15 Fair Value Gaps (FVG); fade European cross rallies.";
    }
    return "Institutional Risk-Off: Target Sell-Side Liquidity (SSL) under previous session lows on equity indices; long USD on retracements.";
  }
  if (item.impact === "HIGH") {
    return "High Impact Volatility Event: Wait for 15-minute institutional displacement and Judas Swing completion before execution.";
  }
  if (item.impact === "MEDIUM") {
    return "Medium Catalyst: Monitor London/NY session overlap order blocks and liquidity pools on XAUUSD and major USD pairs.";
  }
  return "Low Impact Macro Flow: Scalp session ranges; rely on technical order flow and daily highs/lows.";
}

// ==========================================
// 4. ECONOMIC CALENDAR (live feed + honest fallback)
// ==========================================
let liveForexEvents = [];
let dataSourceLabel = "Loading…";
let isDemoData = false;

function formatDuration(totalMinutes) {
  const m = Math.abs(totalMinutes);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${mm}m`;
  return `${mm}m`;
}

function computeTiming(diffMinutes, impact, currency) {
  let status;
  let countdown;
  let isHot;
  if (diffMinutes > 0) {
    status = "UPCOMING";
    countdown = `in ${formatDuration(diffMinutes)}`;
    isHot = diffMinutes <= 60 && (impact === "HIGH" || currency === "USD");
  } else if (diffMinutes >= -15) {
    status = "JUST_RELEASED";
    countdown = `Released ${formatDuration(diffMinutes)} ago`;
    isHot = true;
  } else {
    status = "PASSED";
    countdown = `${formatDuration(diffMinutes)} ago`;
    isHot = false;
  }
  return { status, countdown, isHot };
}

function getIctStrategyTip(impact, currency, diffMinutes) {
  if (impact === "HIGH" && diffMinutes > 0 && diffMinutes <= 30) {
    return "CRITICAL ICT PLAYBOOK: High volatility release approaching. Avoid early positioning; await Judas swing completion and M15 Fair Value Gap (FVG) displacement.";
  }
  if (impact === "HIGH" && diffMinutes <= 0 && diffMinutes >= -15) {
    return "INSTITUTIONAL EXECUTION: Session liquidity swept. Look for entries on retests of newly formed M5/M15 Order Blocks in trend direction.";
  }
  if (currency === "USD") {
    return "USD Macro Catalyst: Cross-reference DXY institutional displacement with Gold (XAUUSD) key liquidity pools.";
  }
  return "Standard Session Range: Respect session highs/lows and internal liquidity.";
}

function formatIctTime(date) {
  return `${date.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Phnom_Penh", hour: "2-digit", minute: "2-digit", hour12: false
  })} ICT`;
}

function buildEvent(base, id) {
  const releaseMs = new Date(base.release_date_iso).getTime();
  const diff = Math.round((releaseMs - Date.now()) / 60000);
  const t = computeTiming(diff, base.impact, base.currency);
  return {
    ...base,
    id,
    diff_minutes: diff,
    status: t.status,
    countdown: t.countdown,
    is_hot: t.isHot,
    release_time_ict: formatIctTime(new Date(releaseMs)),
    ict_playbook: getIctStrategyTip(base.impact, base.currency, diff)
  };
}

/** DEMO ONLY: invented events anchored to "now". Always labelled as demo in the UI. */
function generateDemoEvents() {
  const seed = [
    { title: "Core CPI m/m", impact: "HIGH", forecast: "0.3%", previous: "0.2%", offset: 14, km: "សន្ទស្សន៍ថ្លៃទំនិញប្រើប្រាស់ស្នូលប្រចាំខែ (Core CPI)" },
    { title: "CPI y/y", impact: "HIGH", forecast: "2.6%", previous: "2.5%", offset: 14, km: "អត្រាអតិផរណាប្រចាំឆ្នាំរបស់អាមេរិក (CPI y/y)" },
    { title: "Unemployment Claims", impact: "HIGH", forecast: "219K", previous: "225K", offset: 38, km: "ចំនួនពាក្យសុំជំនួយអត់ការងារធ្វើប្រចាំសប្តាហ៍" },
    { title: "Fed Chair Speaks", impact: "HIGH", forecast: "-", previous: "-", offset: 75, km: "សុន្ទរកថាប្រធានធនាគារកណ្តាលអាមេរិក" },
    { title: "Core Retail Sales m/m", impact: "HIGH", forecast: "0.4%", previous: "0.1%", offset: 130, km: "ទិន្នន័យការលក់រាយស្នូលរបស់អាមេរិក" },
    { title: "PPI m/m", impact: "MEDIUM", forecast: "0.2%", previous: "0.0%", offset: 195, km: "សន្ទស្សន៍ថ្លៃផលិតករអាមេរិក (PPI m/m)" },
    { title: "Prelim UoM Consumer Sentiment", impact: "MEDIUM", forecast: "71.0", previous: "70.1", offset: 280, km: "ទំនុកចិត្តអ្នកប្រើប្រាស់សាកលវិទ្យាល័យ Michigan" },
    { title: "Crude Oil Inventories", impact: "MEDIUM", forecast: "-1.2M", previous: "+1.8M", offset: -10, km: "ស្តុកប្រេងឆៅសហរដ្ឋអាមេរិក EIA" },
    { title: "10-y Bond Auction", impact: "LOW", forecast: "-", previous: "4.12%", offset: -45, km: "ការដេញថ្លៃប័ណ្ណបំណុលរតនាគាររយៈពេល ១០ ឆ្នាំ" }
  ];
  return seed.map((s, i) =>
    buildEvent({
      title: s.title,
      title_km: s.km,
      currency: "USD",
      impact: s.impact,
      forecast: s.forecast,
      previous: s.previous,
      actual: "",
      release_date_iso: new Date(Date.now() + s.offset * 60000).toISOString()
    }, `demo_${i}`)
  );
}

function normalizeImpact(raw) {
  const v = String(raw || "").toUpperCase();
  return v === "HIGH" || v === "MEDIUM" ? v : "LOW";
}

async function fetchWithTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadCalendarEvents() {
  const FEED = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
  const proxied = "https://api.allorigins.win/raw?url=" + encodeURIComponent(FEED);
  const isGithub = window.location.hostname.includes("github.io");
  const sources = isGithub ? [proxied] : ["/api/forexfactory/live", proxied];

  let rawEvents = null;
  let feedIsCached = false;
  for (const url of sources) {
    try {
      const data = await fetchWithTimeout(url);
      if (data && data.source === "synthetic") {
        console.warn("Server returned sample data; trying next source");
        continue;
      }
      const list = (Array.isArray(data) ? data : data && data.data) || [];
      const usable = list
        .map((ev) => ev && { ...ev, date: ev.date || ev.release_date_iso, country: ev.country || ev.currency })
        .filter((ev) => ev && ev.date && !isNaN(new Date(ev.date).getTime()));
      if (usable.length > 0) {
        rawEvents = usable;
        feedIsCached = !!(data && data.source === "stale_cache");
        break;
      }
    } catch (err) {
      console.warn("Calendar source failed:", url, err.message || err);
    }
  }

  if (rawEvents) {
    liveForexEvents = rawEvents
      .filter((ev) => ev && ev.date && !isNaN(new Date(ev.date).getTime()))
      .map((ev, i) =>
        buildEvent({
          title: ev.title,
          title_km: "",
          currency: ev.country,
          impact: normalizeImpact(ev.impact),
          forecast: ev.forecast || "-",
          previous: ev.previous || "-",
          actual: ev.actual || "",
          release_date_iso: new Date(ev.date).toISOString()
        }, `ff_${i}`)
      );
    dataSourceLabel = feedIsCached ? "ForexFactory (cached, feed temporarily offline)" : "ForexFactory Live Sync";
    isDemoData = false;
  } else {
    liveForexEvents = generateDemoEvents();
    dataSourceLabel = "DEMO DATA (feed offline)";
    isDemoData = true;
  }
  recalculateCountdowns();
}

function recalculateCountdowns() {
  liveForexEvents.forEach((ev) => {
    const diff = Math.round((new Date(ev.release_date_iso).getTime() - Date.now()) / 60000);
    const t = computeTiming(diff, ev.impact, ev.currency);
    ev.diff_minutes = diff;
    ev.status = t.status;
    ev.countdown = t.countdown;
    ev.is_hot = t.isHot;
    ev.ict_playbook = getIctStrategyTip(ev.impact, ev.currency, diff);
  });
  renderHotNewsSection();
  renderWireNewsSection();
}

// ==========================================
// 5. NEWS RENDERING
// ==========================================
function matchesEventFilter(ev) {
  switch (currentNewsFilter) {
    case "usd": return ev.currency === "USD";
    case "high": return ev.impact === "HIGH";
    case "medium": return ev.impact === "MEDIUM";
    case "low": return ev.impact === "LOW";
    default: return true;
  }
}

function matchesHeadlineFilter(item) {
  switch (currentNewsFilter) {
    case "usd": return isUsdInstrument(item);
    case "high": return item.impact === "HIGH";
    case "medium": return item.impact === "MEDIUM";
    case "low": return item.impact === "LOW";
    default: return true;
  }
}

function isHotEvent(ev) {
  return ev.is_hot || ev.status === "JUST_RELEASED" || (ev.impact === "HIGH" && ev.status !== "PASSED");
}

function inEventWindow(ev) {
  return ev.diff_minutes >= -720 && ev.diff_minutes <= 4320;
}

function eventTitle(ev) {
  return currentLang === "KH" && ev.title_km ? ev.title_km : ev.title;
}

function eventCardHot(ev) {
  const countdownPill = ev.is_hot
    ? `<span class="hot-release-indicator">🔥 HOT RELEASE · ${esc(ev.countdown)}</span>`
    : `<span class="release-time-indicator">⏱️ ${esc(ev.countdown)}</span>`;
  const statusBadge = ev.status === "JUST_RELEASED" ? `<span class="just-released-pill">● JUST RELEASED</span>` : "";

  return `
    <article class="hot-news-item-card ${ev.is_hot ? "is-hot-border" : ""}" data-impact="${esc(ev.impact)}">
      <span class="impact-badge-pill ${ev.impact.toLowerCase()}">${esc(ev.impact)}</span>
      <div class="hot-item-content">
        <div class="hot-headline-row" style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <h3 class="hot-item-title">${esc(eventTitle(ev))}</h3>
          ${countdownPill}
        </div>
        <div class="hot-meta-tags-row">
          <span class="market-sentiment-tag tag-bullish">${esc(ev.currency)} FOCUS</span>
          <span class="por-wire-source-tag">${esc(dataSourceLabel)}</span>
          <span class="por-wire-source-tag">Release: <strong>${esc(ev.release_time_ict)}</strong></span>
          ${statusBadge}
        </div>
        <div class="macro-values-row" style="display:flex; gap:12px; font-size:12px; margin:4px 0; color:var(--text-sub);">
          <span>Forecast: <strong style="color:var(--text-main);">${esc(ev.forecast)}</strong></span>
          <span>Previous: <strong style="color:var(--text-main);">${esc(ev.previous)}</strong></span>
          ${ev.actual ? `<span>Actual: <strong style="color:#10b981;">${esc(ev.actual)}</strong></span>` : ""}
        </div>
        <div class="hot-ict-action-row">
          <span class="ict-bolt">⚡</span>
          <span>${esc(ev.ict_playbook)}</span>
        </div>
      </div>
    </article>`;
}

function headlineCardHot(item) {
  const titleText = currentLang === "KH" ? item.title_km || item.title_en : item.title_en;

  let biasTagsHtml = "";
  if (item.bias && typeof item.bias === "object" && !Array.isArray(item.bias)) {
    biasTagsHtml = Object.keys(item.bias).map((sym) => {
      const sentiment = String(item.bias[sym]).toLowerCase();
      const cls = sentiment === "bullish" ? "tag-bullish" : "tag-bearish";
      return `<span class="market-sentiment-tag ${cls}">${esc(sym)} ${esc(sentiment)}</span>`;
    }).join("");
  } else if (Array.isArray(item.affected)) {
    biasTagsHtml = item.affected.map((sym) => `<span class="market-sentiment-tag tag-neutral">${esc(sym)}</span>`).join("");
  }

  const why = item.why
    ? `<p class="hot-item-catalyst-summary"><strong>${esc(item.regime || item.category)} ·</strong> ${esc(item.why)}</p>`
    : "";

  return `
    <article class="hot-news-item-card" data-impact="${esc(item.impact)}">
      <span class="impact-badge-pill ${item.impact.toLowerCase()}">${esc(item.impact)}</span>
      <div class="hot-item-content">
        <h3 class="hot-item-title">${esc(titleText)}</h3>
        <div class="hot-meta-tags-row">
          ${biasTagsHtml}
          <span class="por-wire-source-tag">${esc(item.source)}</span>
          <span class="por-wire-source-tag">${esc(item.published_at_ict)}</span>
        </div>
        ${why}
        <div class="hot-ict-action-row">
          <span class="ict-bolt">⚡</span>
          <span>${esc(generateIctGuidance(item))}</span>
        </div>
      </div>
    </article>`;
}

function renderHotNewsSection() {
  if (!hotNewsItemsList) return;

  const hotEvents = liveForexEvents
    .filter((ev) => isHotEvent(ev) && matchesEventFilter(ev))
    .sort((a, b) => Math.abs(a.diff_minutes) - Math.abs(b.diff_minutes));

  const hotHeadlines = porIctNewsData.filter((item) => {
    const hasCatalyst = item.is_mover === true || item.impact === "HIGH" || (item.why && item.impact === "MEDIUM");
    return hasCatalyst && matchesHeadlineFilter(item);
  });

  const demoNotice = isDemoData
    ? `<div style="padding:10px 14px; margin-bottom:10px; border-radius:10px; font-size:12.5px; background:rgba(245,158,11,0.12); color:var(--warning-amber);">
         ⚠️ DEMO DATA: the live calendar feed is offline. Times below are NOT real releases.
       </div>`
    : "";

  if (hotEvents.length === 0 && hotHeadlines.length === 0) {
    hotNewsItemsList.innerHTML = `${demoNotice}
      <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13.5px;">
        No hot reads right now for the "${esc(currentNewsFilter.toUpperCase())}" filter.
      </div>`;
    return;
  }

  hotNewsItemsList.innerHTML =
    demoNotice + hotEvents.map(eventCardHot).join("") + hotHeadlines.map(headlineCardHot).join("");
}

function renderWireNewsSection() {
  if (!wireCardsGrid) return;

  const events = liveForexEvents
    .filter((ev) => inEventWindow(ev) && matchesEventFilter(ev))
    .sort((a, b) => new Date(a.release_date_iso) - new Date(b.release_date_iso));
  const headlines = porIctNewsData.filter(matchesHeadlineFilter);

  if (newsFeedCounter) {
    newsFeedCounter.textContent = `Showing ${events.length} economic events · ${headlines.length} headlines`;
  }

  if (events.length === 0 && headlines.length === 0) {
    wireCardsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
        No headlines available for the selected filter.
      </div>`;
    return;
  }

  const eventCards = events.map((ev) => `
    <article class="wire-news-card ${ev.is_hot ? "is-hot-border" : ""}" data-impact="${esc(ev.impact)}">
      <div class="wire-card-top-bar">
        <span class="impact-badge-pill ${ev.impact.toLowerCase()}">${esc(ev.impact)}</span>
        <span class="wire-category-tag">${esc(ev.currency)} MACRO</span>
        <span class="wire-time-ago">${esc(ev.release_time_ict)} (${esc(ev.countdown)})</span>
      </div>
      <h4 class="wire-english-title">${esc(eventTitle(ev))}</h4>
      <div class="wire-asset-tags-group">
        <span class="wire-asset-pill usd-positive">Forecast: ${esc(ev.forecast)}</span>
        <span class="wire-asset-pill">Prev: ${esc(ev.previous)}</span>
        ${ev.actual ? `<span class="wire-asset-pill text-green">Actual: ${esc(ev.actual)}</span>` : ""}
        <span class="wire-asset-pill">${esc(dataSourceLabel)}</span>
      </div>
    </article>`).join("");

  const headlineCards = headlines.map((item) => {
    const pills = Array.isArray(item.affected) && item.affected.length > 0
      ? item.affected.map((sym) => {
          let extra = "";
          if (item.bias && item.bias[sym]) extra = item.bias[sym] === "BULLISH" ? "usd-positive" : item.bias[sym] === "BEARISH" ? "usd-negative" : "";
          return `<span class="wire-asset-pill ${extra}">${esc(sym)}</span>`;
        }).join("")
      : `<span class="wire-asset-pill">${esc(item.category)}</span>`;

    return `
      <article class="wire-news-card" data-impact="${esc(item.impact)}">
        <div class="wire-card-top-bar">
          <span class="impact-badge-pill ${item.impact.toLowerCase()}">${esc(item.impact)}</span>
          <span class="wire-category-tag">${esc(item.category)}</span>
          <span class="wire-time-ago">${esc(item.published_at_ict)}</span>
        </div>
        <h4 class="wire-english-title">${esc(item.title_en)}</h4>
        <p class="wire-khmer-title">${esc(item.title_km || item.title_en)}</p>
        <div class="wire-asset-tags-group">${pills}</div>
      </article>`;
  }).join("");

  wireCardsGrid.innerHTML = eventCards + headlineCards;
}

function setNewsTab(tab) {
  currentActiveNewsTab = tab === "wire" ? "wire" : "hot";
  const isHot = currentActiveNewsTab === "hot";
  if (tabHotNewsBtn) tabHotNewsBtn.classList.toggle("active", isHot);
  if (tabNewswireBtn) tabNewswireBtn.classList.toggle("active", !isHot);
  if (hotReadsSection) hotReadsSection.classList.toggle("hidden", !isHot);
  if (newswireSection) newswireSection.classList.toggle("hidden", isHot);
}

on(tabHotNewsBtn, "click", () => setNewsTab("hot"));
on(tabNewswireBtn, "click", () => setNewsTab("wire"));

if (newsFiltersContainer) {
  const filterButtons = newsFiltersContainer.querySelectorAll(".filter-pill-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      currentNewsFilter = e.currentTarget.getAttribute("data-filter") || "all";
      renderHotNewsSection();
      renderWireNewsSection();
    });
  });
}

on(ffCalendarExternalBtn, "click", () => console.log("Forex Factory: https://www.forexfactory.com/"));

on(jsonApiBtn, "click", () => {
  const payload = {
    provider: "Por ICT Newswire",
    data_source: dataSourceLabel,
    is_demo: isDemoData,
    timestamp: new Date().toISOString(),
    events: liveForexEvents,
    headlines: porIctNewsData
  };
  navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    .then(() => alert("Por ICT JSON payload copied to clipboard! 📋"))
    .catch(() => {
      console.log("Por ICT API Payload:", payload);
      alert("Could not copy. Payload logged to the browser console.");
    });
});

function updateIctClock() {
  if (!liveIctClock) return;
  liveIctClock.textContent = `${new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Phnom_Penh", hour12: false })} ICT`;
}

// ==========================================
// 6. LANGUAGE
// ==========================================
function setLanguage(lang) {
  currentLang = lang === "KH" ? "KH" : "EN";
  localStorage.setItem("por_lang", currentLang);

  const dict = getDict();
  document.documentElement.lang = currentLang === "KH" ? "km" : "en";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  const label = $("currentLangLabel");
  if (label) label.textContent = currentLang;
  document.querySelectorAll(".lang-option").forEach((opt) => {
    opt.classList.toggle("active", opt.getAttribute("data-lang") === currentLang);
  });

  if (soundStatusText) soundStatusText.textContent = isAudioPlaying ? dict.sound_on : dict.sound_off;
  if (mobileMusicStateText) mobileMusicStateText.textContent = isAudioPlaying ? "ON" : "OFF";

  renderCalendar();
  updateTierButtons();
  renderHotNewsSection();
  renderWireNewsSection();
}

if (langToggleBtn && langMenu) {
  langToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    langMenu.classList.toggle("show");
    if (profilePopoverCard) profilePopoverCard.classList.remove("show");
  });
  langOptions.forEach((opt) => {
    opt.addEventListener("click", (e) => {
      setLanguage(e.currentTarget.getAttribute("data-lang") || "EN");
      langMenu.classList.remove("show");
    });
  });
}

if (navProfileTrigger && profilePopoverCard) {
  navProfileTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    profilePopoverCard.classList.toggle("show");
    if (langMenu) langMenu.classList.remove("show");
  });
}

on(viewFullProfileBtn, "click", () => {
  if (profilePopoverCard) profilePopoverCard.classList.remove("show");
  goToProfileCard();
});
on(mobileViewProfileBtn, "click", () => {
  closeMobileDrawer();
  goToProfileCard();
});

function goToProfileCard() {
  if (dashboardView && dashboardView.classList.contains("hidden")) enterDashboard();
  if (profileCardSection) profileCardSection.scrollIntoView({ behavior: "smooth" });
}

document.addEventListener("click", () => {
  if (langMenu) langMenu.classList.remove("show");
  if (profilePopoverCard) profilePopoverCard.classList.remove("show");
});

// ==========================================
// 7. THEME
// ==========================================
function applyTheme(theme) {
  const isLight = theme === "light";
  if (isLight) document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
  if (thumbSun) thumbSun.classList.toggle("hidden", !isLight);
  if (thumbMoon) thumbMoon.classList.toggle("hidden", isLight);

  localStorage.setItem("por_theme", theme);
  if (dashboardView && !dashboardView.classList.contains("hidden")) initOrUpdateChart();
  if (liveChartView && !liveChartView.classList.contains("hidden")) initTradingViewChart();
}

function toggleTheme() {
  applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
}
on(themeToggleSwitch, "click", toggleTheme);
on(themeToggleSwitch, "keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTheme(); }
});
langOptions.forEach((opt) => {
  opt.setAttribute("role", "button");
  opt.setAttribute("tabindex", "0");
  opt.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); opt.click(); }
  });
});

// ==========================================
// 8. AMBIENT AUDIO
// ==========================================
window.onYouTubeIframeAPIReady = function () {
  initYouTubeAudio();
};

function initYouTubeAudio() {
  const container = $("youtubeAudioPlayer");
  if (ytAudioPlayer || !container || typeof YT === "undefined" || !YT.Player) return;

  try {
    ytAudioPlayer = new YT.Player("youtubeAudioPlayer", {
      height: "1",
      width: "1",
      videoId: YT_AUDIO_VIDEO_ID,
      playerVars: {
        autoplay: 0, controls: 0, disablekb: 1, fs: 0,
        loop: 1, playlist: YT_AUDIO_VIDEO_ID,
        modestbranding: 1, playsinline: 1, rel: 0
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
  const dict = getDict();
  if (soundToggleBtn) soundToggleBtn.classList.toggle("is-playing", playing);
  if (soundStatusText) soundStatusText.textContent = playing ? dict.sound_on : dict.sound_off;
  if (navMusicBtn) navMusicBtn.classList.toggle("is-playing", playing);
  if (mobileMusicBtn) mobileMusicBtn.classList.toggle("is-playing", playing);
  if (mobileMusicStateText) mobileMusicStateText.textContent = playing ? "ON" : "OFF";
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

on(soundToggleBtn, "click", toggleAudioPlayback);
on(navMusicBtn, "click", toggleAudioPlayback);
on(mobileMusicBtn, "click", toggleAudioPlayback);

document.addEventListener("click", () => {
  if (localStorage.getItem("por_music_playing") === "true" && !isAudioPlaying) {
    if (ytPlayerReady) playAudioMusic();
    else { pendingPlay = true; initYouTubeAudio(); }
  }
}, { once: true });

// ==========================================
// 9. ACCOUNTS
// ==========================================
function loadAccount(email) {
  activeUserEmail = email;
  localStorage.setItem("por_active_user", email);

  if (!accountsDatabase[email]) {
    accountsDatabase[email] = {
      name: email === DEFAULT_EMAIL ? "Chungpor" : email.split("@")[0],
      email,
      tier: "Member",
      avatar: defaultGenericAvatar,
      trades: {}
    };
    saveAccountsToStorage();
  }

  currentAccount = accountsDatabase[email];
  tradeDatabase = currentAccount.trades || (currentAccount.trades = {});
  currentTier = currentAccount.tier || "Member";

  const set = (el, text) => { if (el) el.textContent = text; };
  set(profileNameEl, currentAccount.name);
  set(profileEmailEl, currentAccount.email);
  set(popoverNameEl, currentAccount.name);
  set(popoverEmailEl, currentAccount.email);
  set(mobileUserName, currentAccount.name);
  set(mobileUserEmail, currentAccount.email);

  const avatarSrc = currentAccount.avatar || defaultGenericAvatar;
  [profileAvatarImg, popoverAvatarImg, mobileUserAvatar].forEach((img) => { if (img) img.src = avatarSrc; });

  [bannerTierTag, popoverTierBadge, mobileTierBadge].forEach((el) => set(el, currentTier));
  updateTierButtons();
}

if (avatarUploadTrigger && avatarFileInput) {
  avatarUploadTrigger.addEventListener("click", () => avatarFileInput.click());
  avatarFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const photo = evt.target.result;
      currentAccount.avatar = photo;
      saveAccountsToStorage();
      [profileAvatarImg, popoverAvatarImg, mobileUserAvatar].forEach((img) => { if (img) img.src = photo; });
    };
    reader.readAsDataURL(file);
  });
}

// ==========================================
// 10. AUTH (demo only: runs in the browser, not secure)
// ==========================================
function showAuthView(viewEl) {
  [loginView, signupView, verifyView, resetPasswordView].forEach((v) => { if (v) v.classList.add("hidden"); });
  if (viewEl) viewEl.classList.remove("hidden");
}

on(goToSignupBtn, "click", (e) => {
  e.preventDefault();
  showAuthView(signupView);
  if (signupErrorMsg) signupErrorMsg.classList.add("hidden");
  if (signupForm) signupForm.reset();
});
on(goToLoginBtn, "click", (e) => { e.preventDefault(); showAuthView(loginView); });

on(forgotPasswordLink, "click", (e) => {
  e.preventDefault();
  showAuthView(resetPasswordView);
  if (resetStatusMsg) resetStatusMsg.classList.add("hidden");
  if (resetEmailInput) {
    resetEmailInput.value = loginEmailInput ? loginEmailInput.value : "";
    setTimeout(() => resetEmailInput.focus(), 50);
  }
});

on(resetBackToLoginBtn, "click", (e) => {
  e.preventDefault();
  showAuthView(loginView);
  if (resetStatusMsg) resetStatusMsg.classList.add("hidden");
});

on(resetPasswordForm, "submit", (e) => {
  e.preventDefault();
  const email = resetEmailInput.value.trim().toLowerCase();
  if (resetStatusMsg) {
    resetStatusMsg.textContent = getDict().reset_success;
    resetStatusMsg.className = "reset-status-msg success";
    resetStatusMsg.classList.remove("hidden");
  }
  if (toastTitle) toastTitle.textContent = "Password Reset Link";
  if (toastDesc) toastDesc.innerHTML = `Reset link sent to: <strong>${esc(email)}</strong>`;
  if (toastFillBtn) toastFillBtn.classList.add("hidden");
  showToast(10000);
});

function showToast(ms) {
  if (!emailToast) return;
  emailToast.classList.remove("hidden");
  setTimeout(() => emailToast.classList.add("hidden"), ms);
}

function bindPasswordToggle(btn, input) {
  on(btn, "click", () => {
    if (input) input.type = input.type === "password" ? "text" : "password";
  });
}
bindPasswordToggle(togglePasswordBtn, loginPasswordInput);
bindPasswordToggle(toggleSignupPasswordBtn, signupPasswordInput);
bindPasswordToggle(toggleSignupConfirmBtn, signupConfirmInput);

on(loginForm, "submit", (e) => {
  e.preventDefault();
  const email = loginEmailInput.value.trim().toLowerCase();
  if (!email) return;
  loadAccount(email);
  enterDashboard();
});

function showSignupError(en, kh) {
  if (!signupErrorMsg) return;
  signupErrorMsg.textContent = currentLang === "KH" ? kh : en;
  signupErrorMsg.classList.remove("hidden");
}

on(signupForm, "submit", (e) => {
  e.preventDefault();
  const name = signupNameInput.value.trim();
  const email = signupEmailInput.value.trim().toLowerCase();
  const pass = signupPasswordInput.value;
  const confirm = signupConfirmInput.value;

  if (pass !== confirm) return showSignupError("Passwords do not match!", "ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ!");
  if (pass.length < 6) return showSignupError("Password must be at least 6 characters!", "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ!");
  if (accountsDatabase[email]) return showSignupError("This email is already registered. Please log in.", "អ៊ីមែលនេះបានចុះឈ្មោះរួចហើយ។ សូមចូលគណនី។");

  pendingSignupUser = { name, email, tier: "Member", avatar: defaultGenericAvatar, trades: {} };

  if (verifyEmailDisplay) verifyEmailDisplay.textContent = email;
  showAuthView(verifyView);
  otpBoxes.forEach((b) => (b.value = ""));
  if (otpBoxes[0]) setTimeout(() => otpBoxes[0].focus(), 50);
  generateAndSendCode(email);
});

function generateAndSendCode() {
  currentVerificationCode = String(Math.floor(100000 + Math.random() * 900000));
  if (toastTitle) toastTitle.textContent = "New Email from Por ICT";
  if (toastDesc) toastDesc.innerHTML = `Your 6-digit verification code is: <strong id="toastCodeValue">${currentVerificationCode}</strong>`;
  if (toastFillBtn) toastFillBtn.classList.remove("hidden");
  showToast(15000);
}

on(toastCloseBtn, "click", () => { if (emailToast) emailToast.classList.add("hidden"); });

on(toastFillBtn, "click", () => {
  if (currentVerificationCode && otpBoxes.length === 6) {
    currentVerificationCode.split("").forEach((digit, i) => { otpBoxes[i].value = digit; });
    otpBoxes[5].focus();
    checkCompleteOTP();
    if (emailToast) emailToast.classList.add("hidden");
  }
});

otpBoxes.forEach((input, index) => {
  input.addEventListener("input", (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    e.target.value = val ? val[0] : "";
    if (val && index < otpBoxes.length - 1) otpBoxes[index + 1].focus();
    checkCompleteOTP();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) otpBoxes[index - 1].focus();
  });
  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;
    pasted.split("").forEach((ch, i) => { if (otpBoxes[i]) otpBoxes[i].value = ch; });
    otpBoxes[Math.min(pasted.length, otpBoxes.length - 1)].focus();
    checkCompleteOTP();
  });
});

function setVerifyStatus(text, type) {
  if (!verifyStatusMsg) return;
  verifyStatusMsg.textContent = text;
  verifyStatusMsg.className = `verify-status-msg ${type}`;
  verifyStatusMsg.classList.remove("hidden");
}

function checkCompleteOTP() {
  const entered = Array.from(otpBoxes).map((b) => b.value).join("");
  if (entered.length !== 6) return;

  if (entered === currentVerificationCode) {
    setVerifyStatus(getDict().verify_success, "success");
    if (emailToast) emailToast.classList.add("hidden");

    if (pendingSignupUser) {
      accountsDatabase[pendingSignupUser.email] = pendingSignupUser;
      saveAccountsToStorage();
      loadAccount(pendingSignupUser.email);
      pendingSignupUser = null;
    }
    setTimeout(enterDashboard, 450);
  } else {
    setVerifyStatus(
      currentLang === "KH" ? "លេខកូដមិនត្រឹមត្រូវទេ! សូមព្យាយាមម្តងទៀត" : "Invalid code! Please try again.",
      "error"
    );
    otpBoxes.forEach((b) => (b.value = ""));
    if (otpBoxes[0]) otpBoxes[0].focus();
  }
}

on(resendCodeBtn, "click", () => {
  generateAndSendCode(pendingSignupUser ? pendingSignupUser.email : activeUserEmail);
  setVerifyStatus(getDict().verify_resent_msg, "success");
  otpBoxes.forEach((b) => (b.value = ""));
  if (otpBoxes[0]) otpBoxes[0].focus();
});

on(verifyBackBtn, "click", () => {
  showAuthView(signupView);
  if (verifyStatusMsg) verifyStatusMsg.classList.add("hidden");
});

// ==========================================
// 11. ROUTING
// ==========================================
function hideAllViews() {
  [loginView, signupView, verifyView, resetPasswordView, dashboardView, newsView, liveChartView, membershipView, contactView]
    .forEach((v) => { if (v) v.classList.add("hidden"); });
}

function closeMobileDrawer() {
  if (mobileMenuDrawer) mobileMenuDrawer.classList.add("hidden");
}
on(mobileMenuBtn, "click", () => { if (mobileMenuDrawer) mobileMenuDrawer.classList.remove("hidden"); });
on(mobileDrawerBackdrop, "click", closeMobileDrawer);

function updateNavActiveLink(activeEl, mobileActiveEl) {
  [navHomeLink, navNewsLink, navLiveChartLink, navIndicatorsLink, navPorAiChatLink, navMembershipLink, navContactLink]
    .forEach((l) => l && l.classList.remove("active"));
  if (activeEl) activeEl.classList.add("active");
  [mobileHomeLink, mobileNewsLink, mobileLiveChartLink, mobileIndicatorsLink, mobilePorAiChatLink, mobileMembershipLink, mobileContactLink]
    .forEach((l) => l && l.classList.remove("active"));
  if (mobileActiveEl) mobileActiveEl.classList.add("active");
}

function showAppView(viewEl, navEl, mobileEl) {
  hideAllViews();
  if (viewEl) viewEl.classList.remove("hidden");
  updateNavActiveLink(navEl, mobileEl);
  if (profilePopoverCard) profilePopoverCard.classList.remove("show");
  closeMobileDrawer();
}

function revealNav(show) {
  [navLogoutBtn, navProfileWrapper, navCenterLinks, mobileMenuBtn].forEach((el) => {
    if (el) el.classList.toggle("hidden", !show);
  });
}

function enterDashboard() {
  localStorage.setItem("por_is_logged_in", "true");
  showAppView(dashboardView, navHomeLink, mobileHomeLink);
  revealNav(true);
  renderCalendar();
  initOrUpdateChart();
}

function openDashboardView(e) {
  if (e) e.preventDefault();
  if (!isLoggedIn()) return;
  enterDashboard();
}

function openNewsView(e) {
  if (e) e.preventDefault();
  if (!isLoggedIn()) return;
  showAppView(newsView, navNewsLink, mobileNewsLink);
  setNewsTab(currentActiveNewsTab);
  recalculateCountdowns();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openLiveChartView(e) {
  if (e) e.preventDefault();
  if (!isLoggedIn()) return;
  showAppView(liveChartView, navLiveChartLink, mobileLiveChartLink);
  lcvRender();
  initTradingViewChart();
}

function openContactView(e) {
  if (e) e.preventDefault();
  if (!isLoggedIn()) return;
  showAppView(contactView, navContactLink, mobileContactLink);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openMembershipView(e) {
  if (e) e.preventDefault();
  if (!isLoggedIn()) return;
  showAppView(membershipView, navMembershipLink, mobileMembershipLink);
  updateTierButtons();
}

function handleLogout() {
  localStorage.setItem("por_is_logged_in", "false");
  hideAllViews();
  if (loginView) loginView.classList.remove("hidden");
  revealNav(false);
  if (profilePopoverCard) profilePopoverCard.classList.remove("show");
  closeMobileDrawer();
}

[navHomeLink, mobileHomeLink, newsBackBtn, membershipBackBtn, liveChartBackBtn, contactBackBtn]
  .forEach((el) => on(el, "click", openDashboardView));
[openNewsFromDashBtn, navNewsLink, mobileNewsLink].forEach((el) => on(el, "click", openNewsView));
[openLiveChartBtn, navLiveChartLink, mobileLiveChartLink].forEach((el) => on(el, "click", openLiveChartView));
[navContactLink, mobileContactLink, mobileEzContactFab].forEach((el) => on(el, "click", openContactView));
[navMembershipLink, mobileMembershipLink, bannerUpgradeBtn].forEach((el) => on(el, "click", openMembershipView));
on(navLogoutBtn, "click", handleLogout);
on(mobileLogoutLink, "click", handleLogout);

// ==========================================
// 12. LIVE MARKET CHART: TRADINGVIEW + AI SCANNER
// ==========================================
const lcvEngineReady =
  typeof WATCHLIST_DB !== "undefined" && typeof computeDynamicAnalysisForAsset === "function";

let lcvAsset = lcvEngineReady ? WATCHLIST_DB[0] : null;
let lcvBusy = false;
let lcvLastBest = "";
let lcvScanTimer = null;

const lcvSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function initTradingViewChart() {
  const container = $("tradingview_live_chart");
  if (!container) return;

  if (typeof TradingView === "undefined") {
    container.innerHTML =
      '<div style="padding:24px;color:var(--text-muted);font-size:13px;">The TradingView script could not load. Check your connection and refresh.</div>';
    return;
  }

  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  container.innerHTML = "";

  new TradingView.widget({
    autosize: true,
    symbol: currentChartSymbol,
    interval: currentChartInterval,
    timezone: "Asia/Phnom_Penh",
    theme: isLight ? "light" : "dark",
    style: "1",
    locale: "en",
    enable_publishing: false,
    allow_symbol_change: true,
    withdateranges: true,
    hide_side_toolbar: false,
    container_id: "tradingview_live_chart"
  });
}

function lcvSettings() {
  const pb = $("lcPlaybookSelect");
  const risk = $("lcRiskSelect");
  const hor = $("lcHorizonSelect");
  return {
    playbook: pb ? pb.value : "auto",
    risk: risk ? risk.value : "Medium risk",
    horizon: hor ? hor.value : "Intraday"
  };
}

function lcvRefreshAll() {
  if (!lcvEngineReady) return;
  const s = lcvSettings();
  WATCHLIST_DB.forEach((item) => {
    computeDynamicAnalysisForAsset(item, currentChartInterval, s.playbook, s.risk, s.horizon);
  });
}

function lcvTfLabel() {
  const tf = TF_CONFIG[currentChartInterval] || TF_CONFIG["15"];
  return tf.label;
}

function lcvTimeLeftText() {
  const mins = currentChartInterval === "D" ? 1440 : parseInt(currentChartInterval, 10) || 15;
  const step = mins * 60000;
  const total = Math.max(0, Math.floor((step - (Date.now() % step)) / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `⏳ ${d}d ${h}h left`;
  if (h > 0) return `⏳ ${h}h ${String(m).padStart(2, "0")}m left`;
  if (m > 0) return `⏳ ${m}m ${String(s).padStart(2, "0")}s left`;
  return `⏳ ${s}s left`;
}

function lcvUpdateTimeLeft() {
  const pill = $("lcTimeLeftPill");
  if (pill) pill.textContent = lcvTimeLeftText();
}

function lcvSet(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function lcvRenderLevels() {
  const a = lcvAsset;
  lcvSet("lcStripRR", a.rr.replace("R:R ", "R:R "));
  lcvSet("lcStripEntry", `Entry ${a.signal}: ${a.entry}`);
  lcvSet("lcStripSL", `SL: ${a.sl}`);
  lcvSet("lcStripTP1", `TP1: ${a.tp1}`);
  lcvSet("lcStripTP2", `TP2: ${a.tp2}`);
  lcvSet("lcStripTP3", `TP3: ${a.tp3}`);

  lcvSet("lcCardRR", a.rr);
  const rows = $("lcLevelsRows");
  if (rows) {
    rows.innerHTML =
      `<div class="lc-level-row"><span>Entry ${esc(a.signal)}</span><span class="val">${esc(a.entry)}</span></div>` +
      `<div class="lc-level-row"><span>Stop Loss</span><span class="val" style="color:var(--danger-soft);">${esc(a.sl)}</span></div>` +
      `<div class="lc-level-row"><span>Take Profit 1</span><span class="val" style="color:var(--lc-accent);">${esc(a.tp1)}</span></div>` +
      `<div class="lc-level-row"><span>Take Profit 2</span><span class="val" style="color:var(--lc-accent);">${esc(a.tp2)}</span></div>` +
      `<div class="lc-level-row"><span>Take Profit 3</span><span class="val" style="color:var(--lc-accent);">${esc(a.tp3)}</span></div>`;
  }
}

function lcvRender(councilText) {
  if (!lcvEngineReady || !lcvAsset) return;
  const a = lcvAsset;
  const price = fmtPrice(a.price, a.decimals);
  const sideClass = a.signal === "SELL" ? "sell" : a.signal === "HOLD" ? "hold" : "buy";

  lcvSet("lcActiveSymTitle", a.symbol);
  lcvSet("lcTopLivePrice", price);
  lcvSet("lcReaderScoreBadge", a.readerScore);
  lcvSet("lcStructureTag", a.structureTag);
  lcvSet("lcReaderSummaryText", a.readerSummary);
  lcvSet("lcPanelSym", a.symbol);
  lcvSet("lcPanelTf", lcvTfLabel());
  lcvSet("lcLastCandleClose", price);

  const banner = $("lcAiReaderBanner");
  if (banner) {
    banner.classList.toggle("is-sell", sideClass === "sell");
    banner.classList.toggle("is-hold", sideClass === "hold");
  }
  const badge = $("lcMainDirBadge");
  if (badge) {
    badge.textContent = a.signal;
    badge.className = `lc-active-dir-badge ${sideClass}`;
  }

  lcvSet(
    "lcCouncilStatusText",
    councilText ||
      `Active ${a.signal} setup on ${a.symbol} (${lcvTfLabel()}). 4-LLM consensus ${a.kpi.conf} with Entry ${a.entry} and SL ${a.sl}.`
  );

  const obs = $("lcObservationsList");
  if (obs) {
    obs.innerHTML = a.observations
      .map((o) => `<div class="lc-obs-item"><strong>${esc(o.title)}</strong><span>${esc(o.text)}</span></div>`)
      .join("");
  }

  lcvRenderLevels();

  const regime = $("lcRegimeTags");
  if (regime && Array.isArray(a.regime)) {
    regime.innerHTML = a.regime
      .map((tag, i) => `<span class="lc-reg-chip${i === a.regime.length - 1 ? " green" : ""}">${esc(tag)}</span>`)
      .join("");
  }

  lcvSet("lcKpiConf", a.kpi.conf);
  lcvSet("lcKpiWin", a.kpi.win);
  lcvSet("lcKpiInd", a.kpi.ind);
  lcvSet("lcKpiRisk", a.kpi.risk);

  const agents = $("lcAgentsStack");
  if (agents) {
    agents.innerHTML = a.agents
      .map((ag) => `
        <article class="lc-agent-card">
          <div class="lc-agent-top">
            <span>${esc(ag.title)}</span>
            <span class="lc-agent-bias${ag.bias === "Bearish" ? " sell" : ""}">${esc(ag.bias)}</span>
          </div>
          <div class="lc-agent-role">${esc(ag.role)}</div>
          <p class="lc-agent-body">${esc(ag.text)}</p>
          <span class="lc-agent-conviction">${esc(ag.conviction)}</span>
        </article>`)
      .join("");
  }

  lcvUpdateTimeLeft();
}

function lcvShowScan(text, ms) {
  const overlay = $("lcScanLaserOverlay");
  if (!overlay) return;
  lcvSet("lcScanHudText", text);
  overlay.classList.add("is-scanning");
  clearTimeout(lcvScanTimer);
  if (ms) lcvScanTimer = setTimeout(() => overlay.classList.remove("is-scanning"), ms);
}

function lcvHideScan() {
  clearTimeout(lcvScanTimer);
  const overlay = $("lcScanLaserOverlay");
  if (overlay) overlay.classList.remove("is-scanning");
}

function lcvFlash(el) {
  if (!el) return;
  el.classList.add("lc-flash-highlight");
  setTimeout(() => el.classList.remove("lc-flash-highlight"), 900);
}

function lcvSetButtons(disabled, activeId, activeText) {
  const defaults = {
    lcAnalyzeSetupBtn: "📊 Analyze",
    lcBestSetupBtn: "✦ Best setup",
    lcRunCouncilBtn: "✦ Run 4-LLM Council"
  };
  Object.keys(defaults).forEach((id) => {
    const btn = $(id);
    if (!btn) return;
    btn.disabled = disabled;
    btn.textContent = disabled && id === activeId ? activeText : defaults[id];
  });
}

function lcvSelectAsset(item, reloadChart) {
  lcvAsset = item;
  currentChartSymbol = item.tvSymbol;
  document.querySelectorAll("#assetPillsTrack .chart-pill-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-short") === item.symbol);
  });
  lcvRefreshAll();
  lcvRender();
  if (reloadChart) initTradingViewChart();
}

async function lcvAnalyze() {
  if (lcvBusy || !lcvEngineReady) return;
  lcvBusy = true;
  const s = lcvSettings();
  lcvSetButtons(true, "lcAnalyzeSetupBtn", "⏳ Scanning...");
  lcvShowScan(`📊 SCANNING ${lcvAsset.symbol} (${lcvTfLabel()}) · ${s.playbook.toUpperCase()}...`);
  lcvSet("lcCouncilStatusText", `🔍 Scanning ${lcvAsset.symbol} on ${lcvTfLabel()} (${s.risk}, ${s.horizon})... recalculating order blocks and ATR levels.`);

  await lcvSleep(1000);
  lcvRefreshAll();
  const pb = s.playbook === "auto" ? lcvAsset.bestPlaybook.toUpperCase() : s.playbook.toUpperCase();
  lcvRender(`✓ Live scan complete (${lcvTfLabel()} · ${pb}): ${lcvAsset.signal} setup at ${lcvAsset.entry} | SL ${lcvAsset.sl} | TP1 ${lcvAsset.tp1} (${lcvAsset.kpi.conf} conf).`);
  lcvFlash($("lcAiReaderBanner"));
  lcvHideScan();
  lcvSetButtons(false);
  lcvBusy = false;
}

async function lcvBestSetup() {
  if (lcvBusy || !lcvEngineReady) return;
  lcvBusy = true;
  lcvSetButtons(true, "lcBestSetupBtn", "⚡ Scanning 7 Markets...");
  lcvRefreshAll();

  for (const item of WATCHLIST_DB) {
    lcvShowScan(`✦ SCANNING ${item.symbol}...`);
    lcvSet("lcCouncilStatusText", `🛰️ Evaluating ${item.symbol} structure, liquidity sweep and R:R profile...`);
    await lcvSleep(160);
  }

  const actionable = WATCHLIST_DB
    .filter((x) => x.signal !== "HOLD")
    .sort((a, b) => (b.CompositeScore || 0) - (a.CompositeScore || 0));

  let winner = actionable[0] || WATCHLIST_DB[0];
  if (winner.symbol === lcvAsset.symbol && winner.symbol === lcvLastBest && actionable.length > 1) {
    winner = actionable[1];
  }
  lcvLastBest = winner.symbol;

  const changed = winner.symbol !== lcvAsset.symbol;
  const pb = $("lcPlaybookSelect");
  if (pb && pb.value !== "auto") pb.value = winner.bestPlaybook || "auto";

  lcvSelectAsset(winner, changed);
  lcvRender(`🏆 Best setup: ${winner.symbol} (${winner.signal} · ${lcvTfLabel()}) via ${PLAYBOOK_NAMES[winner.bestPlaybook] || "SMC Order Block + FVG"} — ${winner.kpi.conf} confidence, ${winner.rr}, Entry ${winner.entry}.`);
  lcvFlash($("lcAiReaderBanner"));
  lcvHideScan();
  lcvSetButtons(false);
  lcvBusy = false;
}

async function lcvCouncil() {
  if (lcvBusy || !lcvEngineReady) return;
  lcvBusy = true;
  lcvSetButtons(true, "lcRunCouncilBtn", "⏳ Running 4 LLMs...");
  lcvShowScan(`🧠 4-LLM COUNCIL EVALUATING ${lcvAsset.symbol}...`);

  const a = lcvAsset;
  const steps = [
    `🔵 [1/4] Technical LLM verifying ${a.symbol} EMA stack and ADX trend strength...`,
    `🟣 [2/4] Risk LLM computing ATR stop-loss and position sizing around ${a.sl}...`,
    `🟠 [3/4] SMC LLM mapping unmitigated order blocks and fair value gaps...`,
    `🏆 [4/4] Synthesizer LLM locking the final ${a.signal} read...`
  ];
  const pills = document.querySelectorAll("#liveChartView .lc-llm-badges-row .lc-llm-pill");

  for (let i = 0; i < steps.length; i++) {
    pills.forEach((p, idx) => p.classList.toggle("llm-active-vote", idx === i));
    lcvSet("lcCouncilStatusText", steps[i]);
    await lcvSleep(650);
  }
  pills.forEach((p) => p.classList.remove("llm-active-vote"));

  lcvRefreshAll();
  lcvRender(`✓ 4-LLM council complete (${lcvAsset.kpi.conf} confidence): ${lcvAsset.signal} ${lcvAsset.symbol} at ${lcvAsset.entry} | SL ${lcvAsset.sl} | TP1 ${lcvAsset.tp1}.`);
  lcvFlash($("lcCouncilStatusText") && $("lcCouncilStatusText").closest(".lc-council-banner-card"));
  lcvHideScan();
  lcvSetButtons(false);
  lcvBusy = false;
}

function lcvTickPrices() {
  if (!lcvEngineReady || !liveChartView || liveChartView.classList.contains("hidden")) return;

  WATCHLIST_DB.forEach((item) => {
    const step = item.symbol === "XAUUSD" ? 0.45 : item.symbol === "BTCUSDT" ? 18.0 : item.decimals === 4 ? 0.0002 : 2.5;
    item.price = Math.max(0.0001, item.price + (Math.random() - 0.49) * step);
  });

  lcvRefreshAll();
  const price = fmtPrice(lcvAsset.price, lcvAsset.decimals);
  lcvSet("lcTopLivePrice", price);
  lcvSet("lcLastCandleClose", price);
  lcvRenderLevels();
}

function lcvInit() {
  document.querySelectorAll("#assetPillsTrack .chart-pill-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const short = e.currentTarget.getAttribute("data-short");
      const item = lcvEngineReady ? WATCHLIST_DB.find((x) => x.symbol === short) : null;
      if (item) {
        lcvSelectAsset(item, true);
      } else {
        document.querySelectorAll("#assetPillsTrack .chart-pill-btn").forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        currentChartSymbol = e.currentTarget.getAttribute("data-symbol");
        initTradingViewChart();
      }
    });
  });

  document.querySelectorAll("#timeframePillsTrack .chart-pill-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll("#timeframePillsTrack .chart-pill-btn").forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      currentChartInterval = e.currentTarget.getAttribute("data-interval");
      lcvRefreshAll();
      lcvRender();
      initTradingViewChart();
    });
  });

  ["lcPlaybookSelect", "lcRiskSelect", "lcHorizonSelect"].forEach((id) => {
    on($(id), "change", () => {
      lcvRefreshAll();
      lcvRender();
    });
  });

  on($("lcAnalyzeSetupBtn"), "click", lcvAnalyze);
  on($("lcBestSetupBtn"), "click", lcvBestSetup);
  on($("lcRunCouncilBtn"), "click", lcvCouncil);

  if (lcvEngineReady) {
    lcvRefreshAll();
    lcvRender();
    setInterval(lcvTickPrices, 2200);
  }
  setInterval(lcvUpdateTimeLeft, 1000);
}

// ==========================================
// 13. MEMBERSHIP & BILLING
// ==========================================
on(billingCycleToggle, "click", () => {
  isYearlyBilling = !isYearlyBilling;
  billingCycleToggle.classList.toggle("yearly", isYearlyBilling);
  if (billingMonthlyLabel) billingMonthlyLabel.classList.toggle("active", !isYearlyBilling);
  if (billingYearlyLabel) billingYearlyLabel.classList.toggle("active", isYearlyBilling);

  const dict = getDict();
  if (priceProDisplay) priceProDisplay.textContent = isYearlyBilling ? "$278" : "$29";
  if (priceEliteDisplay) priceEliteDisplay.textContent = isYearlyBilling ? "$758" : "$79";
  priceCycleLabels.forEach((el) => (el.textContent = isYearlyBilling ? dict.price_yearly : dict.price_monthly));
});

function applyUserTier(newTier) {
  currentTier = newTier;
  currentAccount.tier = newTier;
  saveAccountsToStorage();
  [bannerTierTag, popoverTierBadge, mobileTierBadge].forEach((el) => { if (el) el.textContent = newTier; });
  updateTierButtons();
}

function updateTierButtons() {
  const dict = getDict();
  document.querySelectorAll(".tier-select-btn").forEach((btn) => {
    const target = btn.getAttribute("data-target-tier");
    if (target === currentTier) {
      btn.classList.add("is-active-plan");
      btn.textContent = `✓ ${dict.btn_current_plan}`;
    } else {
      btn.classList.remove("is-active-plan");
      if (target === "Member") btn.textContent = dict.plan_starter_title;
      if (target === "ICT Pro") btn.textContent = dict.btn_upgrade_pro;
      if (target === "VIP Elite") btn.textContent = dict.btn_join_vip;
    }
  });
}

document.querySelectorAll(".tier-select-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const target = e.currentTarget.getAttribute("data-target-tier");
    if (target === currentTier) return;
    applyUserTier(target);
    alert(`${getDict().tier_updated_msg}${target}! 🎉`);
  });
});

// ==========================================
// 14. TRADING CALENDAR
// ==========================================
function renderCalendar() {
  if (!calendarGrid || !monthLabel) return;

  const dict = getDict();
  monthLabel.textContent = `${dict.months[currentMonth]} ${currentYear}`;
  calendarGrid.innerHTML = "";

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDayIndex; i++) {
    const empty = document.createElement("div");
    empty.className = "day-empty";
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day++) {
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateKey = `${currentYear}-${mm}-${dd}`;
    const trade = tradeDatabase[dateKey];

    const cell = document.createElement("div");
    cell.className = "day-cell";
    if (dateKey === selectedDateKey) cell.classList.add("cell-selected");

    let markup = "";
    if (trade) {
      const pnl = Number(trade.pnl) || 0;
      const symbol = esc(trade.symbol || "TRADE");
      if (pnl > 0) {
        cell.classList.add("cell-win");
        markup = `<div><div class="pnl-value">+${pnl.toFixed(1)}</div><div class="symbol-name">${symbol}</div></div>`;
      } else if (pnl === 0) {
        cell.classList.add("cell-neutral");
        const label = !trade.symbol || trade.symbol === "no trade" ? dict.no_trade : symbol;
        markup = `<div><div class="pnl-value">0.0</div><div class="symbol-name">${label}</div></div>`;
      } else {
        cell.classList.add("cell-loss");
        markup = `<div><div class="pnl-value">-${Math.abs(pnl).toFixed(1)}</div><div class="symbol-name">${symbol}</div></div>`;
      }
    }

    cell.innerHTML = `<span class="day-number">${day}</span>${markup}`;
    cell.addEventListener("click", () => openTradeModal(dateKey, day));
    calendarGrid.appendChild(cell);
  }

  syncTopStats();
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
  initOrUpdateChart();
}
on(prevBtn, "click", () => changeMonth(-1));
on(nextBtn, "click", () => changeMonth(1));

// ==========================================
// 15. TRADE MODAL
// ==========================================
function openTradeModal(dateKey, dayNumber) {
  if (!modal) return;
  selectedDateKey = dateKey;
  const dict = getDict();
  if (modalDateTitle) modalDateTitle.textContent = `${dict.months[currentMonth]} ${dayNumber}, ${currentYear}`;

  const trade = tradeDatabase[dateKey];
  if (trade) {
    if (inputPnl) inputPnl.value = trade.pnl;
    if (inputSymbol) inputSymbol.value = trade.symbol === "no trade" || trade.symbol === dict.no_trade ? "" : trade.symbol || "";
    if (inputNote) inputNote.value = trade.note || "";
    if (deleteTradeBtn) deleteTradeBtn.classList.remove("hidden");
  } else {
    if (inputPnl) inputPnl.value = "";
    if (inputSymbol) inputSymbol.value = "";
    if (inputNote) inputNote.value = "";
    if (deleteTradeBtn) deleteTradeBtn.classList.add("hidden");
  }

  modal.classList.add("active");
  if (inputPnl) setTimeout(() => inputPnl.focus(), 60);
}

function closeTradeModal() {
  if (modal) modal.classList.remove("active");
}

on(closeModalBtn, "click", closeTradeModal);
on(modal, "click", (e) => { if (e.target === modal) closeTradeModal(); });

on(tradeForm, "submit", (e) => {
  e.preventDefault();
  const dict = getDict();
  const pnlValue = parseFloat(inputPnl.value);
  const pnl = isNaN(pnlValue) ? 0 : pnlValue;
  const symbol = inputSymbol.value.trim() || (pnl === 0 ? dict.no_trade : "XAUUSD");

  tradeDatabase[selectedDateKey] = { pnl, symbol, note: inputNote.value.trim() };
  saveCurrentAccountTrades();
  closeTradeModal();
  renderCalendar();
  initOrUpdateChart();
});

on(deleteTradeBtn, "click", () => {
  if (!tradeDatabase[selectedDateKey]) return;
  delete tradeDatabase[selectedDateKey];
  saveCurrentAccountTrades();
  closeTradeModal();
  renderCalendar();
  initOrUpdateChart();
});

// ==========================================
// 16. KPI STATS
// ==========================================
function monthTotal(year, month) {
  let total = 0;
  Object.keys(tradeDatabase).forEach((key) => {
    const [y, m] = key.split("-").map((n) => parseInt(n, 10));
    if (y === year && m - 1 === month) total += Number(tradeDatabase[key].pnl) || 0;
  });
  return total;
}

function syncTopStats() {
  let totalProfit = 0;
  let tradeCount = 0;
  const symbolProfits = {};

  Object.keys(tradeDatabase).forEach((key) => {
    const [y, m] = key.split("-").map((n) => parseInt(n, 10));
    if (y !== currentYear || m - 1 !== currentMonth) return;

    const item = tradeDatabase[key];
    const pnl = Number(item.pnl) || 0;
    totalProfit += pnl;
    tradeCount++;
    if (item.symbol && item.symbol !== "no trade" && item.symbol !== "មិនបាន trade") {
      symbolProfits[item.symbol] = (symbolProfits[item.symbol] || 0) + pnl;
    }
  });

  if (statProfitEl) statProfitEl.textContent = `${totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(0)}`;

  let bestPair = "None";
  let maxProfit = -Infinity;
  Object.keys(symbolProfits).forEach((sym) => {
    if (symbolProfits[sym] > maxProfit) { maxProfit = symbolProfits[sym]; bestPair = sym; }
  });
  const hasBest = tradeCount > 0 && maxProfit !== -Infinity;
  if (statBestPairEl) statBestPairEl.textContent = hasBest ? bestPair : "None";
  if (statBestPairPnlEl) statBestPairPnlEl.textContent = hasBest ? `${maxProfit >= 0 ? "+" : ""}${maxProfit.toFixed(0)}` : "+0";

  if (statChangeEl) {
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevTotal = monthTotal(prevYear, prevMonth);
    if (prevTotal === 0) {
      statChangeEl.textContent = totalProfit === 0 ? "0.0%" : "+100.0%";
    } else {
      const pct = ((totalProfit - prevTotal) / Math.abs(prevTotal)) * 100;
      statChangeEl.textContent = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    }
  }

  const flat = "M 0 35 L 200 35";
  const rising = "M 0 35 Q 25 33, 50 20 T 100 15 L 200 15";
  ["sparklineProfit", "sparklineChange", "sparklineBest"].forEach((id) => {
    const el = $(id);
    if (el) el.setAttribute("d", tradeCount === 0 ? flat : rising);
  });
}

// ==========================================
// 17. PERFORMANCE CHART
// ==========================================
function initOrUpdateChart() {
  const canvas = $("performanceChart");
  if (!canvas || typeof Chart === "undefined") return;

  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const tickColor = isLight ? "#64748b" : "#94a3b8";
  const lineColor = isLight ? "#0d9488" : "#10b981";

  let cumulative = 0;
  const labels = [];
  const points = [];

  Object.keys(tradeDatabase).sort().forEach((key) => {
    const [y, m, d] = key.split("-").map((n) => parseInt(n, 10));
    if (y !== currentYear || m - 1 !== currentMonth) return;
    cumulative += Number(tradeDatabase[key].pnl) || 0;
    labels.push(`${MONTH_ABBR[m - 1]} ${d}`);
    points.push(cumulative);
  });

  const finalLabels = labels.length ? labels : ["Start", "Current"];
  const finalPoints = points.length ? points : [0, 0];

  if (performanceChart) {
    performanceChart.destroy();
    performanceChart = null;
  }

  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, isLight ? "rgba(13, 148, 136, 0.28)" : "rgba(16, 185, 129, 0.35)");
  gradient.addColorStop(1, "rgba(16, 185, 129, 0.0)");

  performanceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: finalLabels,
      datasets: [{
        data: finalPoints,
        borderColor: lineColor,
        borderWidth: 2.8,
        pointRadius: points.length > 0 ? 0 : 2,
        fill: true,
        backgroundColor: gradient,
        tension: 0.45
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11, family: "Plus Jakarta Sans" } } },
        y: { display: false, grid: { display: false } }
      }
    }
  });
}

document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
    e.currentTarget.classList.add("active");
  });
});

// ==========================================
// 18. BACKGROUND VIDEO
// ==========================================
const bgVideo = document.querySelector(".bg-video");
if (bgVideo) {
  bgVideo.muted = true;
  const p = bgVideo.play();
  if (p !== undefined) {
    p.catch(() => document.addEventListener("click", () => bgVideo.play(), { once: true }));
  }
}

// ==========================================
// 19. INIT (runs once, after everything above is defined)
// ==========================================
setInterval(updateIctClock, 1000);
updateIctClock();

applyTheme(localStorage.getItem("por_theme") || "dark");
loadAccount(activeUserEmail);
setLanguage(currentLang);
setNewsTab(currentActiveNewsTab);
lcvInit();

if (window.YT && window.YT.Player) initYouTubeAudio();

loadCalendarEvents();
setInterval(recalculateCountdowns, 15 * 1000);

if (isLoggedIn()) {
  enterDashboard();
} else {
  hideAllViews();
  if (loginView) loginView.classList.remove("hidden");
  revealNav(false);
}