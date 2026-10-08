/**
 * Por ICT Analytics System
 * Multi-account support, reset password flow, TradingView Live Charting, Contact Us screen,
 * Ambient 4K Background YouTube Audio player (Zen Flute & Guzheng), and Menu Audio Button.
 */

// ==========================================
// 1. DATA & STATE INITIALIZATION
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

let accountsDatabase = JSON.parse(localStorage.getItem("por_all_accounts")) || {
  "chungpor908@gmail.com": {
    name: "Chungpor",
    email: "chungpor908@gmail.com",
    tier: "Member",
    avatar: "por.jpg",
    trades: defaultChungporTrades
  }
};

function saveAccountsToStorage() {
  localStorage.setItem("por_all_accounts", JSON.stringify(accountsDatabase));
}

let activeUserEmail = localStorage.getItem("por_active_user") || "chungpor908@gmail.com";
let currentAccount = accountsDatabase[activeUserEmail] || accountsDatabase["chungpor908@gmail.com"];

if (currentAccount && currentAccount.email === "chungpor908@gmail.com" && currentAccount.name !== "Chungpor") {
  currentAccount.name = "Chungpor";
  accountsDatabase["chungpor908@gmail.com"].name = "Chungpor";
  saveAccountsToStorage();
}

let tradeDatabase = currentAccount.trades || {};

function saveCurrentAccountTrades() {
  if (currentAccount) {
    currentAccount.trades = tradeDatabase;
    accountsDatabase[activeUserEmail] = currentAccount;
    saveAccountsToStorage();
  }
}

let currentYear = 2026;
let currentMonth = 9; // October (0-indexed)
let selectedDateKey = "2026-10-07";
let performanceChart = null;

let currentTier = currentAccount.tier || "Member";
let isYearlyBilling = false;
let currentVerificationCode = "";

// Live TradingView Chart State
let currentChartSymbol = "OANDA:XAUUSD";
let currentChartInterval = "15";
let tradingViewWidget = null;

// Ambient YouTube Audio State
// Video link: https://youtu.be/yGbaHLXUZWY
const YT_AUDIO_VIDEO_ID = "yGbaHLXUZWY";
let ytAudioPlayer = null;
let isAudioPlaying = false;
let ytPlayerReady = false;

// ==========================================
// 2. BILINGUAL DICTIONARY (EN & KH)
// ==========================================
const translations = {
  EN: {
    nav_home: "Home",
    nav_live_chart: "Live Chart",
    nav_membership: "Membership",
    nav_contact: "Contact Us",
    nav_audio_btn: "4K Zen Music",
    logout_btn: "Log out",

    pop_status: "Status",
    pop_approved: "● Approved",
    pop_tier: "Tier",
    pop_member: "Member",
    pop_verified: "Email verified",
    pop_yes: "Yes",
    pop_btn: "View full profile",

    breadcrumb_sections: "← Sections",
    breadcrumb_dashboard: "← Back to Dashboard",
    breadcrumb_back: "← Back",
    tag_member: "Member",
    tag_upgrade: "Upgrade ⚡",
    tag_verified: "Email verified ✓",

    prod_new_title: "New Product",
    prod_live_btn: "LIVE CHART",
    chart_category: "NEW PRODUCT",
    chart_title: "Live Market Chart",
    chart_subtitle: "Track gold, Bitcoin, and more in real time — add indicators as you like",
    asset_label: "ASSET:",
    timeframe_label: "TIMEFRAME:",
    asset_gold: "Gold",
    asset_silver: "Silver",
    tf_1m: "1m (Live Ticks)",

    contact_tag: "CONTACT US",
    contact_title: "Get in Touch with the Mentor",
    contact_subtitle: "Have questions about the course, or want to learn more? Reach out on Telegram",
    contact_telegram_label: "TELEGRAM",
    contact_channel_name: "Chungpor",
    contact_mentor_name: "Private Mentorship",

    ez_contact_btn: "EZ Contact Us",
    sound_on: "Music: ON",
    sound_off: "Music: OFF",

    title_overview: "Trading Overview",
    card_profit_title: "PROFIT",
    card_profit_sub: "This month",
    card_change_title: "CHANGE",
    card_change_sub: "vs last month",
    card_bestpair_title: "BEST PAIR",

    title_performance: "Performance",
    toggle_1w: "1W",
    toggle_1m: "1M",
    toggle_3m: "3M",

    title_calendar: "Trading Calendar",
    day_sun: "SUN",
    day_mon: "MON",
    day_tue: "TUE",
    day_wed: "WED",
    day_thu: "THU",
    day_fri: "FRI",
    day_sat: "SAT",

    login_title: "Sign In",
    login_subtitle: "Welcome back to Por ICT",
    login_email: "Email",
    login_password: "Password",
    login_forgot: "Forgot password?",
    login_submit: "Sign In",
    login_no_acc: "Don't have an account?",
    login_signup: "Sign up",

    signup_title: "Sign Up",
    signup_subtitle: "Create an account to start learning",
    signup_name: "NAME",
    signup_email: "EMAIL",
    signup_password: "PASSWORD",
    signup_confirm_password: "CONFIRM PASSWORD",
    signup_submit: "Create Account →",
    signup_already_acc: "Already have an account?",
    signup_login_link: "Log in",

    verify_title: "Verify Your Email",
    verify_subtitle_prefix: "We sent a 6-digit code to ",
    verify_code_label: "CODE",
    verify_resend: "Resend code",
    verify_back: "Back",
    verify_success: "Code verified successfully!",
    verify_resent_msg: "A new 6-digit code has been sent!",

    reset_title: "Reset Password",
    reset_subtitle: "Enter your email and we'll send you a link to reset your password",
    reset_email_label: "EMAIL",
    reset_submit: "Send Reset Link",
    reset_back: "← Back to Login",
    reset_success: "Reset link sent! Please check your inbox.",

    member_pill: "POR ICT VIP CLUB",
    member_title: "Choose Your Trading Tier",
    member_subtitle: "Unlock institutional ICT models, live market execution, and advanced analytics.",
    billing_monthly: "Monthly",
    billing_yearly: "Yearly",
    discount_badge: "Save 20%",
    price_forever: "/ forever",
    price_monthly: "/ month",
    price_yearly: "/ year",
    btn_current_plan: "Current Plan",
    btn_upgrade_pro: "Upgrade to Pro →",
    btn_join_vip: "Join VIP Elite →",
    
    plan_starter_title: "Starter Member",
    plan_starter_tagline: "Fundamental analytics & tracking",
    feat_starter_1: "Full Trading Calendar & PnL tracker",
    feat_starter_2: "1W & 1M Performance charts",
    feat_starter_3: "Standard Currency & Gold (XAUUSD) analytics",
    feat_starter_4: "Live Order Block alerts",
    feat_starter_5: "Por ICT Private Discord",

    plan_pro_title: "ICT Pro Trader",
    plan_pro_tagline: "Designed for serious prop & forex traders",
    feat_pro_1: "Everything in Starter",
    feat_pro_2: "Real-time FVG & Liquidity Sweeps",
    feat_pro_3: "Multi-Pair Unlimited Trading Journal",
    feat_pro_4: "Weekly London & NY Session Outlooks",
    feat_pro_5: "Access to Por ICT Discord Community",

    plan_elite_title: "VIP Elite Master",
    plan_elite_tagline: "Full mentorship and direct trade signals",
    feat_elite_1: "Everything in Pro Trader",
    feat_elite_2: "1-on-1 Monthly Trade Review with Por",
    feat_elite_3: "Prop Firm Pass Challenge Models",
    feat_elite_4: "Instant VIP Telegram Signals & Entries",
    feat_elite_5: "Custom ICT Algorithm Indicators",
    ribbon_popular: "MOST POPULAR",
    tier_updated_msg: "Membership updated to ",

    modal_pnl_label: "Profit/Loss ($)",
    modal_pair_label: "Trading Pair (Optional)",
    modal_note_label: "Notes (Optional)",
    modal_delete: "Delete",
    modal_save: "Save",
    no_trade: "no trade",

    months: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
  },
  KH: {
    nav_home: "ទំព័រដើម",
    nav_live_chart: "តារាង Live Chart",
    nav_membership: "សមាជិកភាព",
    nav_contact: "ទំនាក់ទំនង",
    nav_audio_btn: "តន្ត្រី Zen 4K",
    logout_btn: "ចាកចេញ",

    pop_status: "ស្ថានភាព",
    pop_approved: "● បានអនុម័ត",
    pop_tier: "ប្រភេទសមាជិក",
    pop_member: "សមាជិកទូទៅ",
    pop_verified: "អ៊ីមែលបានផ្ទៀងផ្ទាត់",
    pop_yes: "បាទ/ចាស",
    pop_btn: "មើលប្រវត្តិរូបពេញលេញ",

    breadcrumb_sections: "← ផ្នែកសិក្សា",
    breadcrumb_dashboard: "← ត្រឡប់ទៅផ្ទាំង Dashboard",
    breadcrumb_back: "← ត្រឡប់ក្រោយ",
    tag_member: "សមាជិកទូទៅ",
    tag_upgrade: "តម្លើង Tier ⚡",
    tag_verified: "អ៊ីមែលបានផ្ទៀងផ្ទាត់ ✓",

    prod_new_title: "ផលិតផលថ្មី",
    prod_live_btn: "LIVE CHART",
    chart_category: "ផលិតផលថ្មី",
    chart_title: "តារាងទីផ្សារផ្ទាល់ (Live Market Chart)",
    chart_subtitle: "តាមដានមាស Bitcoin និងច្រើនទៀតក្នុងពេលជាក់ស្តែង — អាចបន្ថែម indicators តាមចិត្ត",
    asset_label: "ទ្រព្យសកម្ម:",
    timeframe_label: "ចន្លោះពេល:",
    asset_gold: "មាស (Gold)",
    asset_silver: "ប្រាក់ (Silver)",
    tf_1m: "១នាទី (Live Ticks)",

    contact_tag: "ទំនាក់ទំនងយើង",
    contact_title: "ទាក់ទងផ្ទាល់ជាមួយគ្រូបង្រៀន",
    contact_subtitle: "មានចម្ងល់អំពីវគ្គសិក្សា ឬចង់ដឹងព័ត៌មានបន្ថែម? អាចទាក់ទងតាមរយៈ Telegram",
    contact_telegram_label: "TELEGRAM",
    contact_channel_name: "Chungpor",
    contact_mentor_name: "Private Mentorship",

    ez_contact_btn: "ទាក់ទងយើង EZ",
    sound_on: "តន្ត្រី: បើក",
    sound_off: "តន្ត្រី: បិទ",

    title_overview: "ទិដ្ឋភាពទូទៅការ Trade",
    card_profit_title: "ចំណេញ",
    card_profit_sub: "ខែនេះ",
    card_change_title: "ការប្រែប្រួល",
    card_change_sub: "ធៀបនឹងខែមុន",
    card_bestpair_title: "គូរូបិយប័ណ្ណល្អបំផុត",

    title_performance: "ដំណើរការ",
    toggle_1w: "១សប្តាហ៍",
    toggle_1m: "១ខែ",
    toggle_3m: "៣ខែ",

    title_calendar: "ប្រតិទិន Trading",
    day_sun: "SUN",
    day_mon: "MON",
    day_tue: "TUE",
    day_wed: "WED",
    day_thu: "THU",
    day_fri: "FRI",
    day_sat: "SAT",

    login_title: "ចូលគណនី",
    login_subtitle: "សូមស្វាគមន៍ត្រឡប់មកវិញកាន់ Por ICT",
    login_email: "អ៊ីមែល",
    login_password: "ពាក្យសម្ងាត់",
    login_forgot: "ភ្លេចពាក្យសម្ងាត់?",
    login_submit: "ចូលគណនី",
    login_no_acc: "មិនទាន់មានគណនីមែនទេ?",
    login_signup: "ចុះឈ្មោះ",

    signup_title: "ចុះឈ្មោះ",
    signup_subtitle: "បង្កើតគណនីដើម្បីចាប់ផ្តើមរៀន",
    signup_name: "ឈ្មោះ",
    signup_email: "អ៊ីមែល",
    signup_password: "ពាក្យសម្ងាត់",
    signup_confirm_password: "បញ្ជាក់ពាក្យសម្ងាត់",
    signup_submit: "បង្កើតគណនី →",
    signup_already_acc: "មានគណនីរួចហើយមែនទេ?",
    signup_login_link: "ចូលគណនី",

    verify_title: "ផ្ទៀងផ្ទាត់អ៊ីមែលរបស់អ្នក",
    verify_subtitle_prefix: "យើងបានផ្ញើលេខកូដ ៦ ខ្ទង់ទៅកាន់ ",
    verify_code_label: "លេខកូដ",
    verify_resend: "ផ្ញើកូដម្តងទៀត",
    verify_back: "ត្រឡប់ក្រោយ",
    verify_success: "ការផ្ទៀងផ្ទាត់បានជោគជ័យ!",
    verify_resent_msg: "លេខកូដ ៦ ខ្ទង់ថ្មីត្រូវបានផ្ញើរួចរាល់!",

    reset_title: "កំណត់ពាក្យសម្ងាត់ឡើងវិញ",
    reset_subtitle: "បញ្ចូលអ៊ីមែលរបស់អ្នក ហើយយើងនឹងផ្ញើតំណភ្ជាប់ដើម្បីកំណត់ពាក្យសម្ងាត់ឡើងវិញ",
    reset_email_label: "អ៊ីមែល",
    reset_submit: "ផ្ញើតំណភ្ជាប់កំណត់ឡើងវិញ",
    reset_back: "← ត្រឡប់ទៅចូលគណនី",
    reset_success: "តំណភ្ជាប់កំណត់ឡើងវិញត្រូវបានផ្ញើទៅអ៊ីមែលរបស់អ្នករួចរាល់!",

    member_pill: "POR ICT VIP CLUB",
    member_title: "ជ្រើសរើសប្រភេទសមាជិកភាព",
    member_subtitle: "បើកដំណើរការម៉ូឌែល ICT កម្រិតស្ថាប័ន ការវិភាគ និងការ Live Trade ជាក់ស្តែង។",
    billing_monthly: "ប្រចាំខែ",
    billing_yearly: "ប្រចាំឆ្នាំ",
    discount_badge: "ចំណេញ 20%",
    price_forever: "/ ឥតគិតថ្លៃ",
    price_monthly: "/ ខែ",
    price_yearly: "/ ឆ្នាំ",
    btn_current_plan: "គម្រោងបច្ចុប្បន្ន",
    btn_upgrade_pro: "តម្លើងទៅ Pro →",
    btn_join_vip: "ចូលរួម VIP Elite →",

    plan_starter_title: "សមាជិកទូទៅ",
    plan_starter_tagline: "ការកត់ត្រា និងតាមដានកម្រិតមូលដ្ឋាន",
    feat_starter_1: "ប្រតិទិន Trading និងការតាមដាន PnL",
    feat_starter_2: "តារាង Performance រយៈពេល ១សប្តាហ៍ & ១ខែ",
    feat_starter_3: "ការវិភាគគូរូបិយប័ណ្ណ និងមាស (XAUUSD)",
    feat_starter_4: "ការជូនដំណឹង Order Block ផ្ទាល់",
    feat_starter_5: "Discord ឯកជន Por ICT",

    plan_pro_title: "ICT Pro Trader",
    plan_pro_tagline: "សម្រាប់ Trader អាជីព និងប្រឡង Prop Firm",
    feat_pro_1: "អ្វីៗទាំងអស់ដែលមានក្នុងកម្រិតទូទៅ",
    feat_pro_2: "ទិន្នន័យ FVG & Liquidity Sweep ផ្ទាល់",
    feat_pro_3: "កត់ត្រា Trading Journal ច្រើនគូមិនកំណត់",
    feat_pro_4: "ការវិភាគទីផ្សារ Session London & NY ប្រចាំសប្តាហ៍",
    feat_pro_5: "សិទ្ធិចូលរួមសហគមន៍ Por ICT Discord",

    plan_elite_title: "VIP Elite Master",
    plan_elite_tagline: "ការបង្រៀនផ្ទាល់ និង Signal ច្បាស់លាស់",
    feat_elite_1: "អ្វីៗទាំងអស់ដែលមានក្នុងកម្រិត Pro",
    feat_elite_2: "ការត្រួតពិនិត្យ Trade ផ្ទាល់ ១ទល់១ ជាមួយលោក Por",
    feat_elite_3: "ម៉ូឌែលយុទ្ធសាស្ត្រជាប់ Prop Firm 100%",
    feat_elite_4: "Signal ផ្ទាល់ក្នុង Telegram VIP ភ្លាមៗ",
    feat_elite_5: "Indicator និងប្រព័ន្ធ ICT ផ្តាច់មុខ",
    ribbon_popular: "ពេញនិយមបំផុត",
    tier_updated_msg: "សមាជិកភាពត្រូវបានប្តូរទៅជា ",

    modal_pnl_label: "ចំណេញ/ខាត ($)",
    modal_pair_label: "គូរូបិយប័ណ្ណ (ស្រេចចិត្ត)",
    modal_note_label: "កំណត់ចំណាំ (ស្រេចចិត្ត)",
    modal_delete: "លប",
    modal_save: "រក្សាទុក",
    no_trade: "មិនបាន trade",

    months: [
      "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
      "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"
    ]
  }
};

let currentLang = localStorage.getItem("por_lang") || "EN";

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("por_lang", lang);

  const dict = translations[lang] || translations.EN;
  document.documentElement.lang = lang === "KH" ? "km" : "en";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  const currentLangLabel = document.getElementById("currentLangLabel");
  if (currentLangLabel) currentLangLabel.textContent = lang;

  document.querySelectorAll(".lang-option").forEach((opt) => {
    opt.classList.toggle("active", opt.getAttribute("data-lang") === lang);
  });

  const soundStatusText = document.getElementById("soundStatusText");
  if (soundStatusText) {
    soundStatusText.textContent = isAudioPlaying ? dict.sound_on : dict.sound_off;
  }

  const mobileMusicStateText = document.getElementById("mobileMusicStateText");
  if (mobileMusicStateText) {
    mobileMusicStateText.textContent = isAudioPlaying ? "ON" : "OFF";
  }

  renderCalendar();
  updateTierButtons();
}

// ==========================================
// 3. DOM ELEMENT REFERENCES
// ==========================================
const loginView = document.getElementById("loginView");
const signupView = document.getElementById("signupView");
const verifyView = document.getElementById("verifyView");
const resetPasswordView = document.getElementById("resetPasswordView");
const dashboardView = document.getElementById("dashboardView");
const liveChartView = document.getElementById("liveChartView");
const membershipView = document.getElementById("membershipView");
const contactView = document.getElementById("contactView");

const loginForm = document.getElementById("loginForm");
const navLogoutBtn = document.getElementById("navLogoutBtn");
const navProfileWrapper = document.getElementById("navProfileWrapper");
const navCenterLinks = document.getElementById("navCenterLinks");
const navHomeLink = document.getElementById("navHomeLink");
const navLiveChartLink = document.getElementById("navLiveChartLink");
const navMembershipLink = document.getElementById("navMembershipLink");
const navContactLink = document.getElementById("navContactLink");
const navMusicBtn = document.getElementById("navMusicBtn");

// Mobile Drawer Elements
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenuDrawer = document.getElementById("mobileMenuDrawer");
const mobileDrawerBackdrop = document.getElementById("mobileDrawerBackdrop");
const mobileHomeLink = document.getElementById("mobileHomeLink");
const mobileLiveChartLink = document.getElementById("mobileLiveChartLink");
const mobileMembershipLink = document.getElementById("mobileMembershipLink");
const mobileContactLink = document.getElementById("mobileContactLink");
const mobileMusicBtn = document.getElementById("mobileMusicBtn");
const mobileMusicStateText = document.getElementById("mobileMusicStateText");
const mobileLogoutLink = document.getElementById("mobileLogoutLink");
const mobileViewProfileBtn = document.getElementById("mobileViewProfileBtn");

const mobileEzContactFab = document.getElementById("mobileEzContactFab");

const membershipBackBtn = document.getElementById("membershipBackBtn");
const liveChartBackBtn = document.getElementById("liveChartBackBtn");
const contactBackBtn = document.getElementById("contactBackBtn");
const openLiveChartBtn = document.getElementById("openLiveChartBtn");
const bannerUpgradeBtn = document.getElementById("bannerUpgradeBtn");

const soundToggleBtn = document.getElementById("soundToggleBtn");
const soundStatusText = document.getElementById("soundStatusText");

const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const loginPasswordInput = document.getElementById("loginPassword");
const loginEmailInput = document.getElementById("loginEmail");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");

const goToSignupBtn = document.getElementById("goToSignupBtn");
const goToLoginBtn = document.getElementById("goToLoginBtn");
const signupForm = document.getElementById("signupForm");
const signupNameInput = document.getElementById("signupName");
const signupEmailInput = document.getElementById("signupEmail");
const signupPasswordInput = document.getElementById("signupPassword");
const signupConfirmInput = document.getElementById("signupConfirmPassword");
const signupErrorMsg = document.getElementById("signupErrorMsg");
const toggleSignupPasswordBtn = document.getElementById("toggleSignupPasswordBtn");
const toggleSignupConfirmBtn = document.getElementById("toggleSignupConfirmBtn");

const verifyEmailDisplay = document.getElementById("verifyEmailDisplay");
const otpBoxes = document.querySelectorAll(".otp-box");
const resendCodeBtn = document.getElementById("resendCodeBtn");
const verifyBackBtn = document.getElementById("verifyBackBtn");
const verifyStatusMsg = document.getElementById("verifyStatusMsg");

const resetPasswordForm = document.getElementById("resetPasswordForm");
const resetEmailInput = document.getElementById("resetEmailInput");
const resetBackToLoginBtn = document.getElementById("resetBackToLoginBtn");
const resetStatusMsg = document.getElementById("resetStatusMsg");

const emailToast = document.getElementById("emailToast");
const toastTitle = document.getElementById("toastTitle");
const toastDesc = document.getElementById("toastDesc");
const toastCodeValue = document.getElementById("toastCodeValue");
const toastFillBtn = document.getElementById("toastFillBtn");
const toastCloseBtn = document.getElementById("toastCloseBtn");

const billingCycleToggle = document.getElementById("billingCycleToggle");
const billingMonthlyLabel = document.getElementById("billingMonthlyLabel");
const billingYearlyLabel = document.getElementById("billingYearlyLabel");
const priceProDisplay = document.querySelector(".price-pro-display");
const priceEliteDisplay = document.querySelector(".price-elite-display");
const priceCycleLabels = document.querySelectorAll(".price-cycle-label");

const avatarUploadTrigger = document.getElementById("avatarUploadTrigger");
const avatarFileInput = document.getElementById("avatarFileInput");
const profileAvatarImg = document.getElementById("profileAvatarImg");
const popoverAvatarImg = document.getElementById("popoverAvatarImg");
const mobileUserAvatar = document.getElementById("mobileUserAvatar");
const profileNameEl = document.getElementById("profileName");
const profileEmailEl = document.getElementById("profileEmail");
const popoverNameEl = document.getElementById("popoverName");
const popoverEmailEl = document.getElementById("popoverEmail");
const mobileUserName = document.getElementById("mobileUserName");
const mobileUserEmail = document.getElementById("mobileUserEmail");
const bannerTierTag = document.getElementById("bannerTierTag");
const popoverTierBadge = document.getElementById("popoverTierBadge");
const mobileTierBadge = document.getElementById("mobileTierBadge");

const themeToggleSwitch = document.getElementById("themeToggleSwitch");
const thumbSun = document.querySelector(".thumb-sun");
const thumbMoon = document.querySelector(".thumb-moon");

const langToggleBtn = document.getElementById("langToggleBtn");
const langMenu = document.getElementById("langMenu");
const langOptions = document.querySelectorAll(".lang-option");

const navProfileTrigger = document.getElementById("navProfileTrigger");
const profilePopoverCard = document.getElementById("profilePopoverCard");
const viewFullProfileBtn = document.getElementById("viewFullProfileBtn");
const profileCardSection = document.getElementById("profileCardSection");

const calendarGrid = document.getElementById("calendarDaysGrid");
const monthLabel = document.getElementById("currentMonthLabel");
const prevBtn = document.getElementById("prevMonthBtn");
const nextBtn = document.getElementById("nextMonthBtn");

const statProfitEl = document.getElementById("statProfitValue");
const statBestPairEl = document.getElementById("statBestPair");
const statBestPairPnlEl = document.getElementById("statBestPairPnl");
const statChangeEl = document.getElementById("statChangeValue");

const modal = document.getElementById("tradeModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalDateTitle = document.getElementById("modalDateTitle");
const tradeForm = document.getElementById("tradeForm");
const deleteTradeBtn = document.getElementById("deleteTradeBtn");
const inputPnl = document.getElementById("inputPnl");
const inputSymbol = document.getElementById("inputSymbol");
const inputNote = document.getElementById("inputNote");

let pendingSignupUser = null;

// ==========================================
// 4. AMBIENT YOUTUBE AUDIO ENGINE
// ==========================================
window.onYouTubeIframeAPIReady = function() {
  initYouTubeAudio();
};

function initYouTubeAudio() {
  const container = document.getElementById("youtubeAudioPlayer");
  if (!container || typeof YT === "undefined" || !YT.Player) return;

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
          const savedSoundState = localStorage.getItem("por_music_playing");
          if (savedSoundState === "true") {
            playAudioMusic();
          }
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            setAudioUIState(true);
          } else if (event.data === YT.PlayerState.PAUSED) {
            setAudioUIState(false);
          } else if (event.data === YT.PlayerState.ENDED) {
            if (ytAudioPlayer && ytAudioPlayer.playVideo) {
              ytAudioPlayer.playVideo();
            }
          }
        }
      }
    });
  } catch (err) {
    console.warn("YouTube audio player init notice:", err);
  }
}

function setAudioUIState(isPlaying) {
  isAudioPlaying = isPlaying;
  localStorage.setItem("por_music_playing", isPlaying ? "true" : "false");

  const dict = translations[currentLang] || translations.EN;
  
  if (soundToggleBtn) {
    soundToggleBtn.classList.toggle("is-playing", isPlaying);
  }
  if (soundStatusText) {
    soundStatusText.textContent = isPlaying ? dict.sound_on : dict.sound_off;
  }
  if (navMusicBtn) {
    navMusicBtn.classList.toggle("is-playing", isPlaying);
  }
  if (mobileMusicBtn) {
    mobileMusicBtn.classList.toggle("is-playing", isPlaying);
  }
  if (mobileMusicStateText) {
    mobileMusicStateText.textContent = isPlaying ? "ON" : "OFF";
  }
}

function playAudioMusic() {
  if (ytAudioPlayer && typeof ytAudioPlayer.playVideo === "function") {
    try {
      ytAudioPlayer.unMute();
      ytAudioPlayer.setVolume(75);
      ytAudioPlayer.playVideo();
      setAudioUIState(true);
    } catch (err) {
      console.warn("Audio play exception:", err);
    }
  }
}

function pauseAudioMusic() {
  if (ytAudioPlayer && typeof ytAudioPlayer.pauseVideo === "function") {
    try {
      ytAudioPlayer.pauseVideo();
      setAudioUIState(false);
    } catch (err) {
      console.warn("Audio pause exception:", err);
    }
  }
}

function toggleAudioPlayback() {
  if (!ytPlayerReady) {
    initYouTubeAudio();
    setTimeout(() => {
      if (ytAudioPlayer && typeof ytAudioPlayer.playVideo === "function") {
        playAudioMusic();
      }
    }, 600);
    return;
  }

  if (isAudioPlaying) {
    pauseAudioMusic();
  } else {
    playAudioMusic();
  }
}

if (soundToggleBtn) soundToggleBtn.addEventListener("click", toggleAudioPlayback);
if (navMusicBtn) navMusicBtn.addEventListener("click", toggleAudioPlayback);
if (mobileMusicBtn) mobileMusicBtn.addEventListener("click", toggleAudioPlayback);

// Interaction audio bootstrap
document.addEventListener("click", () => {
  if (localStorage.getItem("por_music_playing") === "true" && !isAudioPlaying && ytPlayerReady) {
    playAudioMusic();
  }
}, { once: true });

if (window.YT && window.YT.Player) {
  initYouTubeAudio();
}

// ==========================================
// 5. THEME & LANGUAGE CONTROLLER
// ==========================================
function applyTheme(theme) {
  const isLight = theme === "light";
  if (isLight) {
    document.documentElement.setAttribute("data-theme", "light");
    if (thumbSun) thumbSun.classList.remove("hidden");
    if (thumbMoon) thumbMoon.classList.add("hidden");
  } else {
    document.documentElement.removeAttribute("data-theme");
    if (thumbSun) thumbSun.classList.add("hidden");
    if (thumbMoon) thumbMoon.classList.remove("hidden");
  }

  localStorage.setItem("por_theme", theme);
  if (dashboardView && !dashboardView.classList.contains("hidden")) {
    initOrUpdateChart(true);
  }
  if (liveChartView && !liveChartView.classList.contains("hidden")) {
    initTradingViewChart();
  }
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  applyTheme(isLight ? "dark" : "light");
}

if (themeToggleSwitch) themeToggleSwitch.addEventListener("click", toggleTheme);

applyTheme(localStorage.getItem("por_theme") || "dark");
setLanguage(currentLang);

// ==========================================
// 6. ACCOUNT SWITCHER & STATE SYNC
// ==========================================
function loadAccount(email) {
  activeUserEmail = email;
  localStorage.setItem("por_active_user", email);

  if (!accountsDatabase[email]) {
    accountsDatabase[email] = {
      name: email === "chungpor908@gmail.com" ? "Chungpor" : email.split("@")[0],
      email: email,
      tier: "Member",
      avatar: defaultGenericAvatar,
      trades: {}
    };
    saveAccountsToStorage();
  }

  currentAccount = accountsDatabase[email];
  tradeDatabase = currentAccount.trades || {};
  currentTier = currentAccount.tier || "Member";

  if (profileNameEl) profileNameEl.textContent = currentAccount.name;
  if (profileEmailEl) profileEmailEl.textContent = currentAccount.email;
  if (popoverNameEl) popoverNameEl.textContent = currentAccount.name;
  if (popoverEmailEl) popoverEmailEl.textContent = currentAccount.email;
  if (mobileUserName) mobileUserName.textContent = currentAccount.name;
  if (mobileUserEmail) mobileUserEmail.textContent = currentAccount.email;

  const avatarSrc = currentAccount.avatar || defaultGenericAvatar;
  if (profileAvatarImg) profileAvatarImg.src = avatarSrc;
  if (popoverAvatarImg) popoverAvatarImg.src = avatarSrc;
  if (mobileUserAvatar) mobileUserAvatar.src = avatarSrc;

  if (bannerTierTag) bannerTierTag.textContent = currentTier;
  if (popoverTierBadge) popoverTierBadge.textContent = currentTier;
  if (mobileTierBadge) mobileTierBadge.textContent = currentTier;

  updateTierButtons();
}

if (avatarUploadTrigger && avatarFileInput) {
  avatarUploadTrigger.addEventListener("click", () => avatarFileInput.click());

  avatarFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const photo = evt.target.result;
        currentAccount.avatar = photo;
        saveAccountsToStorage();

        if (profileAvatarImg) profileAvatarImg.src = photo;
        if (popoverAvatarImg) popoverAvatarImg.src = photo;
        if (mobileUserAvatar) mobileUserAvatar.src = photo;
      };
      reader.readAsDataURL(file);
    }
  });
}

// ==========================================
// 7. LANGUAGE MENU & POPOVER HANDLERS
// ==========================================
if (langToggleBtn && langMenu) {
  langToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    langMenu.classList.toggle("show");
    if (profilePopoverCard) profilePopoverCard.classList.remove("show");
  });

  langOptions.forEach((opt) => {
    opt.addEventListener("click", (e) => {
      const selectedLang = e.target.getAttribute("data-lang");
      setLanguage(selectedLang);
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

  if (viewFullProfileBtn && profileCardSection) {
    viewFullProfileBtn.addEventListener("click", () => {
      profilePopoverCard.classList.remove("show");
      if (dashboardView.classList.contains("hidden")) {
        openDashboardView();
      }
      profileCardSection.scrollIntoView({ behavior: "smooth" });
    });
  }
}

document.addEventListener("click", () => {
  if (langMenu) langMenu.classList.remove("show");
  if (profilePopoverCard) profilePopoverCard.classList.remove("show");
});

// Mobile Drawer Controls
function openMobileDrawer() {
  if (mobileMenuDrawer) mobileMenuDrawer.classList.remove("hidden");
}

function closeMobileDrawer() {
  if (mobileMenuDrawer) mobileMenuDrawer.classList.add("hidden");
}

if (mobileMenuBtn) mobileMenuBtn.addEventListener("click", openMobileDrawer);
if (mobileDrawerBackdrop) mobileDrawerBackdrop.addEventListener("click", closeMobileDrawer);

if (mobileViewProfileBtn && profileCardSection) {
  mobileViewProfileBtn.addEventListener("click", () => {
    closeMobileDrawer();
    if (dashboardView.classList.contains("hidden")) {
      openDashboardView();
    }
    profileCardSection.scrollIntoView({ behavior: "smooth" });
  });
}

// ==========================================
// 8. LOGIN, SIGN UP & RESET PASSWORD
// ==========================================
if (goToSignupBtn) {
  goToSignupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loginView.classList.add("hidden");
    signupView.classList.remove("hidden");
    resetPasswordView.classList.add("hidden");
    if (signupErrorMsg) signupErrorMsg.classList.add("hidden");
    signupForm.reset();
  });
}

if (goToLoginBtn) {
  goToLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    signupView.classList.add("hidden");
    resetPasswordView.classList.add("hidden");
    loginView.classList.remove("hidden");
  });
}

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginView.classList.add("hidden");
    signupView.classList.add("hidden");
    verifyView.classList.add("hidden");
    resetPasswordView.classList.remove("hidden");
    if (resetStatusMsg) resetStatusMsg.classList.add("hidden");
    if (resetEmailInput) {
      resetEmailInput.value = loginEmailInput ? loginEmailInput.value : "";
      setTimeout(() => resetEmailInput.focus(), 50);
    }
  });
}

if (resetBackToLoginBtn) {
  resetBackToLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    resetPasswordView.classList.add("hidden");
    loginView.classList.remove("hidden");
    if (resetStatusMsg) resetStatusMsg.classList.add("hidden");
  });
}

if (resetPasswordForm) {
  resetPasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = resetEmailInput.value.trim().toLowerCase();
    const dict = translations[currentLang] || translations.EN;

    if (resetStatusMsg) {
      resetStatusMsg.textContent = dict.reset_success;
      resetStatusMsg.className = "reset-status-msg success";
      resetStatusMsg.classList.remove("hidden");
    }

    if (toastTitle) toastTitle.textContent = "Password Reset Link";
    if (toastDesc) toastDesc.innerHTML = `Reset link sent to: <strong>${email}</strong>`;
    if (toastFillBtn) toastFillBtn.classList.add("hidden");
    if (emailToast) {
      emailToast.classList.remove("hidden");
      setTimeout(() => emailToast.classList.add("hidden"), 10000);
    }
  });
}

if (togglePasswordBtn && loginPasswordInput) {
  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = loginPasswordInput.type === "password";
    loginPasswordInput.type = isPassword ? "text" : "password";
  });
}

if (toggleSignupPasswordBtn && signupPasswordInput) {
  toggleSignupPasswordBtn.addEventListener("click", () => {
    const isPass = signupPasswordInput.type === "password";
    signupPasswordInput.type = isPass ? "text" : "password";
  });
}

if (toggleSignupConfirmBtn && signupConfirmInput) {
  toggleSignupConfirmBtn.addEventListener("click", () => {
    const isPass = signupConfirmInput.type === "password";
    signupConfirmInput.type = isPass ? "text" : "password";
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginEmailInput.value.trim().toLowerCase();
    loadAccount(email);
    enterDashboard();
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = signupNameInput.value.trim();
    const email = signupEmailInput.value.trim().toLowerCase();
    const pass = signupPasswordInput.value;
    const confirm = signupConfirmInput.value;

    if (pass !== confirm) {
      if (signupErrorMsg) {
        signupErrorMsg.textContent = currentLang === "KH" 
          ? "ពាក្យសម្ងាត់ទាំងពីរមិនត្រូវគ្នាទេ!" 
          : "Passwords do not match!";
        signupErrorMsg.classList.remove("hidden");
      }
      return;
    }

    if (pass.length < 6) {
      if (signupErrorMsg) {
        signupErrorMsg.textContent = currentLang === "KH" 
          ? "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ!" 
          : "Password must be at least 6 characters!";
        signupErrorMsg.classList.remove("hidden");
      }
      return;
    }

    pendingSignupUser = {
      name: name,
      email: email,
      tier: "Member",
      avatar: defaultGenericAvatar,
      trades: {}
    };

    if (verifyEmailDisplay) verifyEmailDisplay.textContent = email;

    signupView.classList.add("hidden");
    verifyView.classList.remove("hidden");

    otpBoxes.forEach((b) => (b.value = ""));
    if (otpBoxes[0]) setTimeout(() => otpBoxes[0].focus(), 50);

    generateAndSendCode(email);
  });
}

function generateAndSendCode(recipientEmail) {
  currentVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  if (toastTitle) toastTitle.textContent = "New Email from Por ICT";
  if (toastDesc) toastDesc.innerHTML = `Your 6-digit verification code is: <strong id="toastCodeValue">${currentVerificationCode}</strong>`;
  if (toastFillBtn) toastFillBtn.classList.remove("hidden");
  if (emailToast) {
    emailToast.classList.remove("hidden");
    setTimeout(() => {
      if (emailToast) emailToast.classList.add("hidden");
    }, 15000);
  }
}

if (toastCloseBtn) {
  toastCloseBtn.addEventListener("click", () => {
    if (emailToast) emailToast.classList.add("hidden");
  });
}

if (toastFillBtn) {
  toastFillBtn.addEventListener("click", () => {
    if (currentVerificationCode && otpBoxes.length === 6) {
      currentVerificationCode.split("").forEach((digit, i) => {
        otpBoxes[i].value = digit;
      });
      otpBoxes[5].focus();
      checkCompleteOTP();
      if (emailToast) emailToast.classList.add("hidden");
    }
  });
}

// ==========================================
// 9. 6-DIGIT OTP BOX HANDLING
// ==========================================
if (otpBoxes.length > 0) {
  otpBoxes.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      const val = e.target.value.replace(/[^0-9]/g, "");
      e.target.value = val ? val[0] : "";

      if (val && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }

      checkCompleteOTP();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        otpBoxes[index - 1].focus();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData)
        .getData("text")
        .replace(/[^0-9]/g, "")
        .slice(0, 6);

      if (pasteData) {
        pasteData.split("").forEach((char, i) => {
          if (otpBoxes[i]) otpBoxes[i].value = char;
        });
        const nextIdx = Math.min(pasteData.length, otpBoxes.length - 1);
        otpBoxes[nextIdx].focus();
        checkCompleteOTP();
      }
    });
  });
}

function checkCompleteOTP() {
  const enteredCode = Array.from(otpBoxes).map((b) => b.value).join("");
  if (enteredCode.length === 6) {
    if (enteredCode === currentVerificationCode) {
      if (verifyStatusMsg) {
        const dict = translations[currentLang] || translations.EN;
        verifyStatusMsg.textContent = dict.verify_success;
        verifyStatusMsg.className = "verify-status-msg success";
        verifyStatusMsg.classList.remove("hidden");
      }
      if (emailToast) emailToast.classList.add("hidden");

      if (pendingSignupUser) {
        accountsDatabase[pendingSignupUser.email] = pendingSignupUser;
        saveAccountsToStorage();
        loadAccount(pendingSignupUser.email);
        pendingSignupUser = null;
      }

      setTimeout(() => {
        enterDashboard();
      }, 450);
    } else {
      if (verifyStatusMsg) {
        verifyStatusMsg.textContent = currentLang === "KH" 
          ? "លេខកូដមិនត្រឹមត្រូវទេ! សូមព្យាយាមម្តងទៀត" 
          : "Invalid code! Please try again.";
        verifyStatusMsg.className = "verify-status-msg error";
        verifyStatusMsg.classList.remove("hidden");
      }
      otpBoxes.forEach((b) => (b.value = ""));
      if (otpBoxes[0]) otpBoxes[0].focus();
    }
  }
}

if (resendCodeBtn) {
  resendCodeBtn.addEventListener("click", () => {
    const email = pendingSignupUser ? pendingSignupUser.email : activeUserEmail;
    generateAndSendCode(email);

    const dict = translations[currentLang] || translations.EN;
    if (verifyStatusMsg) {
      verifyStatusMsg.textContent = dict.verify_resent_msg;
      verifyStatusMsg.className = "verify-status-msg success";
      verifyStatusMsg.classList.remove("hidden");
    }
    otpBoxes.forEach((b) => (b.value = ""));
    if (otpBoxes[0]) otpBoxes[0].focus();
  });
}

if (verifyBackBtn) {
  verifyBackBtn.addEventListener("click", () => {
    verifyView.classList.add("hidden");
    signupView.classList.remove("hidden");
    if (verifyStatusMsg) verifyStatusMsg.classList.add("hidden");
  });
}

// ==========================================
// 10. PERSISTENT SESSION CONTROLLER
// ==========================================
function hideAllViews() {
  if (loginView) loginView.classList.add("hidden");
  if (signupView) signupView.classList.add("hidden");
  if (verifyView) verifyView.classList.add("hidden");
  if (resetPasswordView) resetPasswordView.classList.add("hidden");
  if (dashboardView) dashboardView.classList.add("hidden");
  if (liveChartView) liveChartView.classList.add("hidden");
  if (membershipView) membershipView.classList.add("hidden");
  if (contactView) contactView.classList.add("hidden");
}

function updateNavActiveLink(activeLinkEl, mobileActiveLinkEl) {
  [navHomeLink, navLiveChartLink, navMembershipLink, navContactLink].forEach((link) => {
    if (link) link.classList.remove("active");
  });
  if (activeLinkEl) activeLinkEl.classList.add("active");

  [mobileHomeLink, mobileLiveChartLink, mobileMembershipLink, mobileContactLink].forEach((link) => {
    if (link) link.classList.remove("active");
  });
  if (mobileActiveLinkEl) mobileActiveLinkEl.classList.add("active");
}

function enterDashboard() {
  localStorage.setItem("por_is_logged_in", "true");

  hideAllViews();
  if (dashboardView) dashboardView.classList.remove("hidden");

  if (navLogoutBtn) navLogoutBtn.classList.remove("hidden");
  if (navProfileWrapper) navProfileWrapper.classList.remove("hidden");
  if (navCenterLinks) navCenterLinks.classList.remove("hidden");
  if (mobileMenuBtn) mobileMenuBtn.classList.remove("hidden");

  updateNavActiveLink(navHomeLink, mobileHomeLink);

  renderCalendar();
  initOrUpdateChart(true);
}

function handleLogout() {
  localStorage.setItem("por_is_logged_in", "false");

  hideAllViews();
  if (loginView) loginView.classList.remove("hidden");

  if (navLogoutBtn) navLogoutBtn.classList.add("hidden");
  if (navProfileWrapper) navProfileWrapper.classList.add("hidden");
  if (navCenterLinks) navCenterLinks.classList.add("hidden");
  if (mobileMenuBtn) mobileMenuBtn.classList.add("hidden");
  if (profilePopoverCard) profilePopoverCard.classList.remove("show");
  closeMobileDrawer();
}

if (navLogoutBtn) navLogoutBtn.addEventListener("click", handleLogout);
if (mobileLogoutLink) mobileLogoutLink.addEventListener("click", handleLogout);

const savedLoginState = localStorage.getItem("por_is_logged_in");
if (savedLoginState === "true") {
  loadAccount(activeUserEmail);
  enterDashboard();
} else {
  loadAccount(activeUserEmail);
}

// ==========================================
// 11. LIVE MARKET CHART CONTROLS
// ==========================================
function openLiveChartView(e) {
  if (e) e.preventDefault();
  hideAllViews();
  if (liveChartView) liveChartView.classList.remove("hidden");

  updateNavActiveLink(navLiveChartLink, mobileLiveChartLink);
  if (profilePopoverCard) profilePopoverCard.classList.remove("show");
  closeMobileDrawer();

  initTradingViewChart();
}

function openDashboardView(e) {
  if (e) e.preventDefault();
  enterDashboard();
  closeMobileDrawer();
}

if (openLiveChartBtn) openLiveChartBtn.addEventListener("click", openLiveChartView);
if (navLiveChartLink) navLiveChartLink.addEventListener("click", openLiveChartView);
if (mobileLiveChartLink) mobileLiveChartLink.addEventListener("click", openLiveChartView);
if (liveChartBackBtn) liveChartBackBtn.addEventListener("click", openDashboardView);

function initTradingViewChart() {
  const container = document.getElementById("tradingview_live_chart");
  if (!container || typeof TradingView === "undefined") return;

  const isLight = document.documentElement.getAttribute("data-theme") === "light";

  container.innerHTML = "";

  tradingViewWidget = new TradingView.widget({
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

document.querySelectorAll("#assetPillsTrack .chart-pill-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll("#assetPillsTrack .chart-pill-btn").forEach((b) => b.classList.remove("active"));
    e.currentTarget.classList.add("active");
    currentChartSymbol = e.currentTarget.getAttribute("data-symbol");
    initTradingViewChart();
  });
});

document.querySelectorAll("#timeframePillsTrack .chart-pill-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll("#timeframePillsTrack .chart-pill-btn").forEach((b) => b.classList.remove("active"));
    e.currentTarget.classList.add("active");
    currentChartInterval = e.currentTarget.getAttribute("data-interval");
    initTradingViewChart();
  });
});

// ==========================================
// 12. CONTACT US CONTROLLER
// ==========================================
function openContactView(e) {
  if (e) e.preventDefault();
  hideAllViews();
  if (contactView) contactView.classList.remove("hidden");

  updateNavActiveLink(navContactLink, mobileContactLink);
  if (profilePopoverCard) profilePopoverCard.classList.remove("show");
  closeMobileDrawer();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

if (navContactLink) navContactLink.addEventListener("click", openContactView);
if (mobileContactLink) mobileContactLink.addEventListener("click", openContactView);
if (mobileEzContactFab) mobileEzContactFab.addEventListener("click", openContactView);
if (contactBackBtn) contactBackBtn.addEventListener("click", openDashboardView);

// ==========================================
// 13. MEMBERSHIP & BILLING ROUTING
// ==========================================
function openMembershipView(e) {
  if (e) e.preventDefault();
  hideAllViews();
  if (membershipView) membershipView.classList.remove("hidden");

  updateNavActiveLink(navMembershipLink, mobileMembershipLink);
  if (profilePopoverCard) profilePopoverCard.classList.remove("show");
  closeMobileDrawer();

  updateTierButtons();
}

if (navMembershipLink) navMembershipLink.addEventListener("click", openMembershipView);
if (mobileMembershipLink) mobileMembershipLink.addEventListener("click", openMembershipView);
if (bannerUpgradeBtn) bannerUpgradeBtn.addEventListener("click", openMembershipView);
if (membershipBackBtn) membershipBackBtn.addEventListener("click", openDashboardView);
if (navHomeLink) navHomeLink.addEventListener("click", openDashboardView);
if (mobileHomeLink) mobileHomeLink.addEventListener("click", openDashboardView);

if (billingCycleToggle) {
  billingCycleToggle.addEventListener("click", () => {
    isYearlyBilling = !isYearlyBilling;
    billingCycleToggle.classList.toggle("yearly", isYearlyBilling);
    billingMonthlyLabel.classList.toggle("active", !isYearlyBilling);
    billingYearlyLabel.classList.toggle("active", isYearlyBilling);

    const dict = translations[currentLang] || translations.EN;

    if (isYearlyBilling) {
      if (priceProDisplay) priceProDisplay.textContent = "$278";
      if (priceEliteDisplay) priceEliteDisplay.textContent = "$758";
      priceCycleLabels.forEach((el) => (el.textContent = dict.price_yearly));
    } else {
      if (priceProDisplay) priceProDisplay.textContent = "$29";
      if (priceEliteDisplay) priceEliteDisplay.textContent = "$79";
      priceCycleLabels.forEach((el) => (el.textContent = dict.price_monthly));
    }
  });
}

function applyUserTier(newTier) {
  currentTier = newTier;
  currentAccount.tier = newTier;
  saveAccountsToStorage();

  if (bannerTierTag) bannerTierTag.textContent = newTier;
  if (popoverTierBadge) popoverTierBadge.textContent = newTier;
  if (mobileTierBadge) mobileTierBadge.textContent = newTier;

  updateTierButtons();
}

function updateTierButtons() {
  const dict = translations[currentLang] || translations.EN;
  const tierButtons = document.querySelectorAll(".tier-select-btn");

  tierButtons.forEach((btn) => {
    const targetTier = btn.getAttribute("data-target-tier");
    if (targetTier === currentTier) {
      btn.classList.add("is-active-plan");
      btn.textContent = `✓ ${dict.btn_current_plan}`;
    } else {
      btn.classList.remove("is-active-plan");
      if (targetTier === "Member") btn.textContent = dict.plan_starter_title;
      if (targetTier === "ICT Pro") btn.textContent = dict.btn_upgrade_pro;
      if (targetTier === "VIP Elite") btn.textContent = dict.btn_join_vip;
    }
  });
}

document.querySelectorAll(".tier-select-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const targetTier = e.currentTarget.getAttribute("data-target-tier");
    if (targetTier === currentTier) return;

    applyUserTier(targetTier);

    const dict = translations[currentLang] || translations.EN;
    alert(`${dict.tier_updated_msg}${targetTier}! 🎉`);
  });
});

// ==========================================
// 14. CALENDAR SYSTEM
// ==========================================
function renderCalendar() {
  if (!calendarGrid || !monthLabel) return;

  const dict = translations[currentLang] || translations.EN;
  monthLabel.textContent = `${dict.months[currentMonth]} ${currentYear}`;
  calendarGrid.innerHTML = "";

  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day-empty";
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateKey = `${currentYear}-${mm}-${dd}`;
    const trade = tradeDatabase[dateKey];

    const cell = document.createElement("div");
    cell.className = "day-cell";

    if (dateKey === selectedDateKey) {
      cell.classList.add("cell-selected");
    }

    let tradeMarkup = "";
    if (trade) {
      if (trade.pnl > 0) {
        cell.classList.add("cell-win");
        tradeMarkup = `
          <div>
            <div class="pnl-value">+${trade.pnl.toFixed(1)}</div>
            <div class="symbol-name">${trade.symbol || "TRADE"}</div>
          </div>
        `;
      } else if (trade.pnl === 0) {
        cell.classList.add("cell-neutral");
        tradeMarkup = `
          <div>
            <div class="pnl-value">-0.0</div>
            <div class="symbol-name">${trade.symbol || dict.no_trade}</div>
          </div>
        `;
      } else {
        cell.classList.add("cell-loss");
        tradeMarkup = `
          <div>
            <div class="pnl-value">-${Math.abs(trade.pnl).toFixed(1)}</div>
            <div class="symbol-name">${trade.symbol || "TRADE"}</div>
          </div>
        `;
      }
    }

    cell.innerHTML = `
      <span class="day-number">${day}</span>
      ${tradeMarkup}
    `;

    cell.addEventListener("click", () => openTradeModal(dateKey, day));
    calendarGrid.appendChild(cell);
  }

  syncTopStats();
}

// ==========================================
// 15. TRADE MODAL (SAVE & DELETE)
// ==========================================
function openTradeModal(dateKey, dayNumber) {
  if (!modal) return;
  selectedDateKey = dateKey;

  const dict = translations[currentLang] || translations.EN;
  if (modalDateTitle) {
    modalDateTitle.textContent = `${dict.months[currentMonth]} ${dayNumber}, ${currentYear}`;
  }

  const currentTrade = tradeDatabase[dateKey];
  if (currentTrade) {
    if (inputPnl) inputPnl.value = currentTrade.pnl;
    if (inputSymbol) inputSymbol.value = (currentTrade.symbol === "no trade" || currentTrade.symbol === dict.no_trade) ? "" : (currentTrade.symbol || "");
    if (inputNote) inputNote.value = currentTrade.note || "";
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

if (closeModalBtn) closeModalBtn.addEventListener("click", closeTradeModal);

if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeTradeModal();
  });
}

if (tradeForm) {
  tradeForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const dict = translations[currentLang] || translations.EN;
    const pnlValue = parseFloat(inputPnl.value);
    const symbolValue = inputSymbol.value.trim() || (pnlValue === 0 ? dict.no_trade : "XAUUSD");
    const noteValue = inputNote.value.trim();

    tradeDatabase[selectedDateKey] = {
      pnl: isNaN(pnlValue) ? 0 : pnlValue,
      symbol: symbolValue,
      note: noteValue
    };

    saveCurrentAccountTrades();
    closeTradeModal();
    renderCalendar();
    initOrUpdateChart(true);
  });
}

if (deleteTradeBtn) {
  deleteTradeBtn.addEventListener("click", () => {
    if (tradeDatabase[selectedDateKey]) {
      delete tradeDatabase[selectedDateKey];
      saveCurrentAccountTrades();
      closeTradeModal();
      renderCalendar();
      initOrUpdateChart(true);
    }
  });
}

// ==========================================
// 16. METRIC KPI SYNC
// ==========================================
function syncTopStats() {
  let totalProfit = 0;
  let tradeCount = 0;
  const symbolProfits = {};

  Object.keys(tradeDatabase).forEach((key) => {
    const parts = key.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;

    if (y === currentYear && m === currentMonth) {
      const item = tradeDatabase[key];
      totalProfit += item.pnl || 0;
      tradeCount++;

      if (item.symbol && item.symbol !== "no trade" && item.symbol !== "មិនបាន trade") {
        symbolProfits[item.symbol] = (symbolProfits[item.symbol] || 0) + item.pnl;
      }
    }
  });

  if (statProfitEl) {
    statProfitEl.textContent = `${totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(0)}`;
  }

  let bestPair = "None";
  let maxProfit = -Infinity;
  Object.keys(symbolProfits).forEach((sym) => {
    if (symbolProfits[sym] > maxProfit) {
      maxProfit = symbolProfits[sym];
      bestPair = sym;
    }
  });

  if (statBestPairEl) statBestPairEl.textContent = tradeCount > 0 && maxProfit !== -Infinity ? bestPair : "None";
  if (statBestPairPnlEl) {
    statBestPairPnlEl.textContent = tradeCount > 0 && maxProfit !== -Infinity ? `${maxProfit >= 0 ? "+" : ""}${maxProfit.toFixed(0)}` : "+0";
  }

  if (statChangeEl) {
    statChangeEl.textContent = tradeCount > 0 ? "+100.0%" : "0.0%";
  }

  const spProfit = document.getElementById("sparklineProfit");
  const spChange = document.getElementById("sparklineChange");
  const spBest = document.getElementById("sparklineBest");

  if (tradeCount === 0) {
    if (spProfit) spProfit.setAttribute("d", "M 0 35 L 200 35");
    if (spChange) spChange.setAttribute("d", "M 0 35 L 200 35");
    if (spBest) spBest.setAttribute("d", "M 0 35 L 200 35");
  } else {
    if (spProfit) spProfit.setAttribute("d", "M 0 35 Q 25 33, 50 20 T 100 15 L 200 15");
    if (spChange) spChange.setAttribute("d", "M 0 35 Q 25 33, 50 20 T 100 15 L 200 15");
    if (spBest) spBest.setAttribute("d", "M 0 35 Q 25 33, 50 20 T 100 15 L 200 15");
  }
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
    initOrUpdateChart(true);
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
    initOrUpdateChart(true);
  });
}

// ==========================================
// 17. PERFORMANCE CHART ENGINE
// ==========================================
function initOrUpdateChart(forceRecreate = false) {
  const canvas = document.getElementById("performanceChart");
  if (!canvas || typeof Chart === "undefined") return;

  const isLightMode = document.documentElement.getAttribute("data-theme") === "light";
  const tickColor = isLightMode ? "#64748b" : "#94a3b8";
  const lineColor = isLightMode ? "#0d9488" : "#10b981";

  let cumulative = 0;
  const labels = [];
  const points = [];

  const dict = translations[currentLang] || translations.EN;

  const keys = Object.keys(tradeDatabase).sort();
  keys.forEach((k) => {
    const parts = k.split("-");
    const m = parseInt(parts[1], 10) - 1;
    const day = parts[2];

    if (m === currentMonth) {
      cumulative += tradeDatabase[k].pnl;
      labels.push(`${dict.months[m].slice(0, 3)} ${parseInt(day, 10)}`);
      points.push(cumulative);
    }
  });

  const finalLabels = labels.length > 0 ? labels : ["Start", "Current"];
  const finalPoints = points.length > 0 ? points : [0, 0];

  if (forceRecreate && performanceChart) {
    performanceChart.destroy();
    performanceChart = null;
  }

  if (!performanceChart) {
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, isLightMode ? "rgba(13, 148, 136, 0.28)" : "rgba(16, 185, 129, 0.35)");
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
          x: {
            grid: { display: false },
            ticks: { color: tickColor, font: { size: 11, family: "Plus Jakarta Sans" } }
          },
          y: { display: false, grid: { display: false } }
        }
      }
    });
  } else {
    performanceChart.data.labels = finalLabels;
    performanceChart.data.datasets[0].data = finalPoints;
    performanceChart.update();
  }
}

document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
  });
});

const bgVideo = document.querySelector(".bg-video");
if (bgVideo) {
  bgVideo.muted = true;
  const playPromise = bgVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      document.addEventListener("click", () => bgVideo.play(), { once: true });
    });
  }
}