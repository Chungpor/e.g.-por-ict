/**
 * Por ICT - Calendar & Market Analytics System
 * Full JavaScript Engine with:
 * - Live Ingestion of News API with instant rebranding (zoqira.pro -> Por ICT)
 * - Forex Factory Official Sync (https://www.forexfactory.com/)
 * - USD Focus Filters: High Impact (Red), Medium (Orange), Low (Yellow)
 * - Bilingual Support (English & Khmer via title_en / title_km)
 * - TradingView Institutional Charting, Calendar Trade Journal & Analytics
 * - Multi-account authentication, OTP verification, Ambient 4K Audio Engine
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
const YT_AUDIO_VIDEO_ID = "yGbaHLXUZWY";
let ytAudioPlayer = null;
let isAudioPlaying = false;
let ytPlayerReady = false;

// Active News Filter State
let currentNewsFilter = "usd"; // Default focused on USD

// ==========================================
// 2. RAW JSON API INGESTION & POR ICT TRANSFORMATION
// ==========================================
const rawApiPayload = {
  "count": 50,
  "data": [
    {
      "id": 26260,
      "slug": "9797494-eu-the-ggas-system-is-prepared-for-winter-despite-lower-storage-level",
      "title_en": "EU: The Ggas system is prepared for winter despite lower storage levels.",
      "title_km": "អឺរ៉ុប៖ ប្រព័ន្ធឧស្ម័នរួចរាល់សម្រាប់រដូវរងារ ទោះបីជាកម្រិតស្តុកទាបក៏ដោយ។",
      "category": "COMMODITY",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["TTF", "USOIL"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:50 ICT",
      "url": "https://zoqira.pro/news/9797494-eu-the-ggas-system-is-prepared-for-winter-despite-lower-storage-level",
      "source": "Zoqira"
    },
    {
      "id": 26258,
      "slug": "9797493-head-of-irans-atomic-energy-organization-iran-will-not-abandon-urani",
      "title_en": "Head Of Iran's Atomic Energy Organization: Iran will not abandon uranium enrichment or hand over its uranium - State Media.",
      "title_km": "ប្រធានអង្គការថាមពលបរមាណូអ៊ីរ៉ង់៖ អ៊ីរ៉ង់នឹងមិនបោះបង់ការចម្រាញ់អ៊ុយរ៉ាញ៉ូម ឬប្រគល់អ៊ុយរ៉ាញ៉ូមរបស់ខ្លួនឡើយ - ទីភ្នាក់ងារព័ត៌មានរដ្ឋ។",
      "category": "GEOPOLITICS",
      "impact": "MEDIUM",
      "is_mover": false,
      "affected": ["XAUUSD", "USOIL", "USD"],
      "bias": { "XAUUSD": "BULLISH", "USOIL": "BULLISH", "USD": "BULLISH" },
      "regime": "RISK_OFF",
      "why": "Iran's refusal to curb enrichment keeps nuclear-deal hopes alive but raises sanctions and conflict risk, supporting haven gold and dollar and adding an oil risk premium.",
      "published_at_ict": "08 Oct 2026 • 22:49 ICT",
      "url": "https://zoqira.pro/news/9797493-head-of-irans-atomic-energy-organization-iran-will-not-abandon-urani",
      "source": "Zoqira"
    },
    {
      "id": 26259,
      "slug": "9797492-yemens-houthis-attacked-the-airport-in-najran-and-the-airbase-in-kham",
      "title_en": "Yemen's Houthis attacked the airport in Najran and the airbase in Khamis Mushait with ballistic missiles - Houthi Spokesperson.",
      "title_km": "អ្នកនាំពាក្យហ៊ូធី៖ ក្រុមហ៊ូធីក្នុងប្រទេសយេមែន បានវាយប្រហារអាកាសយានដ្ឋាននៅ Najran និងមូលដ្ឋានទ័ពអាកាសនៅ Khamis Mushait ដោយមីស៊ីលបាលីស្ទីក។",
      "category": "GEOPOLITICS",
      "impact": "MEDIUM",
      "is_mover": false,
      "affected": ["XAUUSD", "USOIL", "USD"],
      "bias": { "XAUUSD": "BULLISH", "USOIL": "BULLISH", "USD": "BULLISH" },
      "regime": "RISK_OFF",
      "why": "Strikes on Saudi soil raise Middle East supply and escalation risk, driving haven demand for gold and the dollar while oil gains on supply fear.",
      "published_at_ict": "08 Oct 2026 • 22:48 ICT",
      "url": "https://zoqira.pro/news/9797492-yemens-houthis-attacked-the-airport-in-najran-and-the-airbase-in-kham",
      "source": "Zoqira"
    },
    {
      "id": 26256,
      "slug": "9797491-irans-major-general-vahidi-no-extra-regional-power-has-the-right-to",
      "title_en": "Iran's Major General Vahidi: No extra-regional power has the right to threaten or interfere in the Strait of Hormuz or the Persian Gulf.",
      "title_km": "ឧត្តមសេនីយ៍ធំអ៊ីរ៉ង់ វ៉ាហ៊ីឌី៖ គ្មានមហាអំណាចក្រៅតំបន់ណាមានសិទ្ធិគំរាមកំហែង ឬជ្រៀតជ្រែកក្នុងច្រកសមុទ្រហ័រមូស ឬឈូងសមុទ្រពែរ្ស៊ីនោះទេ។",
      "category": "GEOPOLITICS",
      "impact": "MEDIUM",
      "is_mover": false,
      "affected": ["USOIL", "XAUUSD", "USD"],
      "bias": { "USOIL": "BULLISH", "XAUUSD": "BULLISH", "USD": "BULLISH" },
      "regime": "RISK_OFF",
      "why": "Iranian warning over Hormuz keeps tanker and supply risk premium alive, supporting oil and haven flows into gold and USD.",
      "published_at_ict": "08 Oct 2026 • 22:47 ICT",
      "url": "https://zoqira.pro/news/9797491-irans-major-general-vahidi-no-extra-regional-power-has-the-right-to",
      "source": "Zoqira"
    },
    {
      "id": 26257,
      "slug": "9797488-yemens-houthis-attacked-riyadhs-king-khalid-airport-with-two-missile",
      "title_en": "Yemen's Houthis attacked Riyadh's King Khalid Airport with two missiles - Houthi Spokesperson.",
      "title_km": "អ្នកនាំពាក្យហ៊ូធី៖ ក្រុមហ៊ូធីក្នុងប្រទេសយេមែនបានវាយប្រហារអាកាសយានដ្ឋាន King Khalid នៅទីក្រុងរីយ៉ាដដោយមីស៊ីលពីរ។",
      "category": "GEOPOLITICS",
      "impact": "HIGH",
      "is_mover": true,
      "affected": ["XAUUSD", "USOIL", "USD", "US500"],
      "bias": { "XAUUSD": "BULLISH", "USOIL": "BULLISH", "USD": "BULLISH", "US500": "BEARISH" },
      "regime": "RISK_OFF",
      "why": "Strike on Saudi soil raises Gulf supply and escalation risk, driving haven demand for gold and USD while oil spikes and equities fall.",
      "published_at_ict": "08 Oct 2026 • 22:46 ICT",
      "url": "https://zoqira.pro/news/9797488-yemens-houthis-attacked-riyadhs-king-khalid-airport-with-two-missile",
      "source": "Zoqira"
    },
    {
      "id": 26255,
      "slug": "9797484-irans-major-general-vahidi-irgc-navy-ready-to-respond-decisively-to",
      "title_en": "Iran's Major General Vahidi: IRGC Navy ready to respond decisively to unauthorized vessels entering waters under its control.",
      "title_km": "ឧត្តមសេនីយ៍វ៉ាហ៊ីឌី នៃអ៊ីរ៉ង់៖ កងទ័ពជើងទឹក IRGC ត្រៀមខ្លួនឆ្លើយតបយ៉ាងដាច់ខាត ចំពោះនាវាដែលចូលក្នុងតំបន់ទឹកក្រោមការគ្រប់គ្រងរបស់ខ្លួនដោយគ្មានការអនុញ្ញាត។",
      "category": "GEOPOLITICS",
      "impact": "MEDIUM",
      "is_mover": false,
      "affected": ["XAUUSD", "USOIL", "USD"],
      "bias": { "XAUUSD": "BULLISH", "USOIL": "BULLISH", "USD": "BULLISH" },
      "regime": "RISK_OFF",
      "why": "Threat to Gulf shipping raises oil supply risk and drives safe-haven flows into gold and the dollar.",
      "published_at_ict": "08 Oct 2026 • 22:44 ICT",
      "url": "https://zoqira.pro/news/9797484-irans-major-general-vahidi-irgc-navy-ready-to-respond-decisively-to",
      "source": "Zoqira"
    },
    {
      "id": 26254,
      "slug": "9797481-us-4-week-bill-bid-to-cover-actual-2400-forecast-previous-2830",
      "title_en": "US 4-Week Bill Bid-to-Cover Actual 2.400 (Forecast -, Previous 2.830)",
      "title_km": "អត្រាតម្លៃដេញថ្លៃលើវិក័យប័ត្ររយៈពេល ៤ សប្តាហ៍របស់សហរដ្ឋអាមេរិកធ្លាក់មក ២.៤០០ (ព្យាករណ៍ - លើកមុន ២.៨៣០)",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:32 ICT",
      "url": "https://zoqira.pro/news/9797481-us-4-week-bill-bid-to-cover-actual-2400-forecast-previous-2830",
      "source": "Zoqira"
    },
    {
      "id": 26253,
      "slug": "9797482-us-4-week-bill-high-yield-actual-3980-forecast-previous-3890",
      "title_en": "US 4-Week Bill High Yield Actual 3.980% (Forecast -, Previous 3.890%)",
      "title_km": "ទិន្នផលមធ្យមនៃវិក័យប័ត្ររយៈពេល ៤ សប្តាហ៍របស់សហរដ្ឋអាមេរិកឡើងដល់ ៣.៩៨០% (ព្យាករណ៍ - លើកមុន ៣.៨៩០%)",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:32 ICT",
      "url": "https://zoqira.pro/news/9797482-us-4-week-bill-high-yield-actual-3980-forecast-previous-3890",
      "source": "Zoqira"
    },
    {
      "id": 26252,
      "slug": "9797483-us-4-week-bill-auction",
      "title_en": "US 4-Week Bill Auction",
      "title_km": "ការដេញថ្លៃវិក្កយបត្ររយៈពេល ៤ សប្តាហ៍របស់សហរដ្ឋអាមេរិក",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:32 ICT",
      "url": "https://zoqira.pro/news/9797483-us-4-week-bill-auction",
      "source": "Zoqira"
    },
    {
      "id": 26251,
      "slug": "9797455-us-publishes-diesel-executive-order-in-federal-register",
      "title_en": "US publishes diesel executive order in Federal register",
      "title_km": "សហរដ្ឋអាមេរិកបានចេញផ្សាយបទបញ្ជាប្រតិបត្តិស្តីពីម៉ាស៊ីនដុតដោយប្រើប្រេងឌីសែលនៅក្នុងទិនានុប្បវត្តិសហព័ន្ធ",
      "category": "COMMODITY",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USOIL"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:18 ICT",
      "url": "https://zoqira.pro/news/9797455-us-publishes-diesel-executive-order-in-federal-register",
      "source": "Zoqira"
    },
    {
      "id": 26250,
      "slug": "9797452-most-ownership-in-us-russia-oil-deal-to-go-to-middle-east-funds-nyt",
      "title_en": "Most ownership in US-Russia oil deal to go to Middle East funds - NYT",
      "title_km": "ការកាន់កាប់ភាគច្រើននៅក្នុងកិច្ចព្រមព្រៀងប្រេងរវាងសហរដ្ឋអាមេរិក និងរុស្ស៊ី នឹងទៅលើមូលនិធិមជ្ឈិមបូព៌ា - NYT",
      "category": "COMMODITY",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USOIL", "BRENT"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:16 ICT",
      "url": "https://zoqira.pro/news/9797452-most-ownership-in-us-russia-oil-deal-to-go-to-middle-east-funds-nyt",
      "source": "Zoqira"
    },
    {
      "id": 26249,
      "slug": "9797449-fed-bids-for-4-week-bills-total-93-bln",
      "title_en": "Fed bids for 4-Week bills total $9.3 bln",
      "title_km": "ធនាគារកណ្តាលអាមេរិក (Fed) ដាក់ដេញថ្លៃទិញវិក្កយបត្រ ៤ សប្តាហ៍ សរុប ៩,៣ ពាន់លានដុល្លារ",
      "category": "CENTRAL_BANK",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:15 ICT",
      "url": "https://zoqira.pro/news/9797449-fed-bids-for-4-week-bills-total-93-bln",
      "source": "Zoqira"
    },
    {
      "id": 26247,
      "slug": "9797448-cbos-swagel-i-do-think-fiscal-trajectory-will-put-pressure-on-rates",
      "title_en": "CBO's Swagel: I do think fiscal trajectory will put pressure on rates",
      "title_km": "លោក Swagel នៃ CBO៖ ខ្ញុំគិតថា ទិសដៅហិរញ្ញវត្ថុសាធារណៈនឹងដាក់សម្ពាធលើអត្រាការប្រាក់",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD", "US10Y"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:13 ICT",
      "url": "https://zoqira.pro/news/9797448-cbos-swagel-i-do-think-fiscal-trajectory-will-put-pressure-on-rates",
      "source": "Zoqira"
    },
    {
      "id": 26248,
      "slug": "9797447-cbo-director-swagel-i-think-the-debt-concerns-impact-on-yields-is-sm",
      "title_en": "CBO Director Swagel: I think the debt concern's impact on yields is small.",
      "title_km": "នាយក CBO លោក Swagel៖ ខ្ញុំគិតថា កង្វល់អំពីបំណុលមានផលប៉ះពាល់តិចតួចលើទិន្នផលប័ណ្ណបំណុល",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD", "US10Y"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:12 ICT",
      "url": "https://zoqira.pro/news/9797447-cbo-director-swagel-i-think-the-debt-concerns-impact-on-yields-is-sm",
      "source": "Zoqira"
    },
    {
      "id": 26245,
      "slug": "9797446-cbo-director-swagel-growth-estimates-for-debt-stabilization-assume-4",
      "title_en": "CBO Director Swagel: Growth estimates for debt stabilization assume 4%-5% rates.",
      "title_km": "នាយក CBO លោក Swagel៖ ការប៉ាន់ស្មានកំណើនសម្រាប់ស្ថិរភាពបំណុលសន្មតអត្រា ៤%-៥%។",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD", "US10Y"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:07 ICT",
      "url": "https://zoqira.pro/news/9797446-cbo-director-swagel-growth-estimates-for-debt-stabilization-assume-4",
      "source": "Zoqira"
    },
    {
      "id": 26246,
      "slug": "9797445-cbo-director-swagel-we-need-5-6-gdp-gains-to-stabilize-debt-via-gro",
      "title_en": "CBO Director Swagel: We need 5%-6% GDP gains to stabilize debt via growth.",
      "title_km": "នាយក CBO លោក Swagel៖ យើងត្រូវការកំណើន GDP ៥%-៦% ដើម្បីធ្វើឱ្យបំណុលមានស្ថិរភាពតាមរយៈកំណើន។",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD", "US10Y"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:06 ICT",
      "url": "https://zoqira.pro/news/9797445-cbo-director-swagel-we-need-5-6-gdp-gains-to-stabilize-debt-via-gro",
      "source": "Zoqira"
    },
    {
      "id": 26241,
      "slug": "9797442-cbo-director-swagel-theres-a-structural-fiscal-deficit-of-6",
      "title_en": "CBO Director Swagel: There's a structural fiscal deficit of 6%.",
      "title_km": "នាយក CBO លោក Swagel៖ មានឱនភាពសារពើពន្ធរចនាសម្ព័ន្ធចំនួន ៦%",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD", "US500"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:01 ICT",
      "url": "https://zoqira.pro/news/9797442-cbo-director-swagel-theres-a-structural-fiscal-deficit-of-6",
      "source": "Zoqira"
    },
    {
      "id": 26242,
      "slug": "9797441-cbo-director-swagel-it-could-be-markets-bring-forward-the-need-to-act",
      "title_en": "CBO Director Swagel: It could be markets bring forward the need to act on debt.",
      "title_km": "នាយក CBO លោក Swagel៖ ទីផ្សារអាចនាំឱ្យមានតម្រូវការប្រតិបត្តិលើបំណុលលឿនជាងមុន",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD", "US500"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:01 ICT",
      "url": "https://zoqira.pro/news/9797441-cbo-director-swagel-it-could-be-markets-bring-forward-the-need-to-act",
      "source": "Zoqira"
    },
    {
      "id": 26243,
      "slug": "9797438-us-treasury-announces-bill-auctions",
      "title_en": "US Treasury Announces Bill Auctions",
      "title_km": "ក្រសួងរតនាគារអាមេរិកប្រកាសការដេញថ្លៃវិក្កយបត្រ",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 22:00 ICT",
      "url": "https://zoqira.pro/news/9797438-us-treasury-announces-bill-auctions",
      "source": "Zoqira"
    },
    {
      "id": 26244,
      "slug": "9797436-cbo-director-swagel-it-is-unlikely-that-growth-alone-can-stabilize-th",
      "title_en": "CBO Director Swagel: It is unlikely that growth alone can stabilize the debt trajectory.",
      "title_km": "នាយក CBO លោក Swagel៖ មិនទំនងថាកំណើនតែឯងអាចធ្វើឱ្យគន្លងបំណុលមានស្ថិរភាពទេ",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD", "US500"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:59 ICT",
      "url": "https://zoqira.pro/news/9797436-cbo-director-swagel-it-is-unlikely-that-growth-alone-can-stabilize-th",
      "source": "Zoqira"
    },
    {
      "id": 26238,
      "slug": "9797435-centcom-leaders-highlighted-building-momentum-for-freedom-of-navigati",
      "title_en": "CENTCOM: Leaders highlighted building momentum for freedom of navigation as commercial traffic flow increases - Post on X",
      "title_km": "CENTCOM៖ មេដឹកនាំបានសង្កត់ធ្ងន់លើការកសាងកម្លាំងជំរុញសម្រាប់សេរីភាពនៃការធ្វើដំណើរតាមសមុទ្រ ខណៈចរាចរណ៍ពាណិជ្ជកម្មកើនឡើង - បង្ហោះនៅលើ X",
      "category": "GEOPOLITICS",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USOIL", "XAUUSD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:54 ICT",
      "url": "https://zoqira.pro/news/9797435-centcom-leaders-highlighted-building-momentum-for-freedom-of-navigati",
      "source": "Zoqira"
    },
    {
      "id": 26239,
      "slug": "9797434-the-ukmto-gets-a-time-late-report-of-an-incident-in-hormuz-on-october",
      "title_en": "The UKMTO gets a time-late report of an incident in Hormuz on October 6th.",
      "title_km": "UKMTO ទទួលបានរបាយការណ៍យឺតពេលអំពីឧបទ្ទវហេតុមួយនៅច្រកសមុទ្រ Hormuz នៅថ្ងៃទី 6 ខែតុលា។",
      "category": "GEOPOLITICS",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USOIL", "XAUUSD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:54 ICT",
      "url": "https://zoqira.pro/news/9797434-the-ukmto-gets-a-time-late-report-of-an-incident-in-hormuz-on-october",
      "source": "Zoqira"
    },
    {
      "id": 26240,
      "slug": "9797433-us-centcom-briefed-international-shipping-partners-on-hormuz-today-p",
      "title_en": "US CENTCOM briefed international shipping partners on Hormuz today - Post on X.",
      "title_km": "US CENTCOM បានផ្តល់សេចក្តីសង្ខេបដល់ដៃគូដឹកជញ្ជូនអន្តរជាតិអំពីច្រកសមុទ្រ Hormuz នៅថ្ងៃនេះ - បង្ហោះនៅលើ X។",
      "category": "GEOPOLITICS",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USOIL", "XAUUSD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:54 ICT",
      "url": "https://zoqira.pro/news/9797433-us-centcom-briefed-international-shipping-partners-on-hormuz-today-p",
      "source": "Zoqira"
    },
    {
      "id": 26235,
      "slug": "9797432-us-vp-vance-holds-press-conference-on-fighting-visa-fraud-watch-liv",
      "title_en": "US VP Vance Holds Press Conference on Fighting Visa Fraud - WATCH LIVE",
      "title_km": "អនុប្រធានាធិបតីអាមេរិក វ៉ាន់ស៍ ប្រារព្ធពិធីសន្និសីទសារព័ត៌មានស្តីពីការប្រយុទ្ធប្រឆាំងការក្លែងបន្លំទិដ្ឋាការ - ទស្សនាផ្ទាល់",
      "category": "OTHER",
      "impact": "LOW",
      "is_mover": false,
      "affected": [],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:53 ICT",
      "url": "https://zoqira.pro/news/9797432-us-vp-vance-holds-press-conference-on-fighting-visa-fraud-watch-liv",
      "source": "Zoqira"
    },
    {
      "id": 26236,
      "slug": "9797431-us-vp-vance-to-adobe-and-other-tech-companies-stop-defrauding-us-work",
      "title_en": "US VP Vance to Adobe and other tech companies: Stop defrauding US workers. $ADBE",
      "title_km": "អនុប្រធានាធិបតីអាមេរិក វ៉ាន់ស៍ ទៅកាន់ Adobe និងក្រុមហ៊ុនបច្ចេកវិទ្យាផ្សេងទៀត៖ ឈប់បោកប្រាស់កម្មករអាមេរិក។ $ADBE",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["ADBE"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:53 ICT",
      "url": "https://zoqira.pro/news/9797431-us-vp-vance-to-adobe-and-other-tech-companies-stop-defrauding-us-work",
      "source": "Zoqira"
    },
    {
      "id": 26237,
      "slug": "9797430-us-vp-vance-on-microsoft-perm-suspension-it-will-last-as-long-as-need",
      "title_en": "US VP Vance on Microsoft PERM suspension: It will last as long as needed. $MSFT",
      "title_km": "អនុប្រធានាធិបតីអាមេរិក វ៉ាន់ស៍ ស្តីពីការផ្អាក PERM របស់ Microsoft៖ វានឹងបន្តដរាបណាចាំបាច់។ $MSFT",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["MSFT"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:52 ICT",
      "url": "https://zoqira.pro/news/9797430-us-vp-vance-on-microsoft-perm-suspension-it-will-last-as-long-as-need",
      "source": "Zoqira"
    },
    {
      "id": 26233,
      "slug": "9797429-the-pentagon-to-commit-200m-to-cloud-labs-in-fiscal-year-2028",
      "title_en": "The Pentagon to commit $200m to cloud labs in fiscal year 2028.",
      "title_km": "ក្រសួងការពារជាតិអាមេរិកនឹងចំណាយ ២០០ លានដុល្លារលើមន្ទីរពិសោធន៍ពពកក្នុងឆ្នាំសារពើពន្ធ ២០២៨។",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["US500", "NAS100"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:51 ICT",
      "url": "https://zoqira.pro/news/9797429-the-pentagon-to-commit-200m-to-cloud-labs-in-fiscal-year-2028",
      "source": "Zoqira"
    },
    {
      "id": 26234,
      "slug": "9797428-the-pentagon-announces-350m-in-quantum-computing-initiatives",
      "title_en": "The Pentagon announces $350m in quantum computing initiatives.",
      "title_km": "ក្រសួងការពារជាតិអាមេរិកប្រកាសគំនិតផ្តួចផ្តើមកុំព្យូទ័រកង់ទូម ៣៥០ លានដុល្លារ។",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["NAS100", "US500"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:50 ICT",
      "url": "https://zoqira.pro/news/9797428-the-pentagon-announces-350m-in-quantum-computing-initiatives",
      "source": "Zoqira"
    },
    {
      "id": 26232,
      "slug": "9797427-us-vp-vance-we-dont-want-to-harm-microsoft-but-they-must-employ-us",
      "title_en": "US VP Vance: We don't want to harm Microsoft, but they must employ US workers. $MSFT",
      "title_km": "អនុប្រធានាធិបតីអាមេរិក វ៉ាន់ស៍៖ យើងមិនចង់បំផ្លាញ Microsoft ទេ ប៉ុន្តែពួកគេត្រូវជួលកម្មករអាមេរិក",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["MSFT"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:49 ICT",
      "url": "https://zoqira.pro/news/9797427-us-vp-vance-we-dont-want-to-harm-microsoft-but-they-must-employ-us",
      "source": "Zoqira"
    },
    {
      "id": 26231,
      "slug": "9797422-uk-police-two-men-arrested-for-trespass-offences-at-cambridgeshire-ra",
      "title_en": "UK Police: Two men arrested for trespass offences at Cambridgeshire RAF base.",
      "title_km": "ប៉ូលិសអង់គ្លេស៖ បុរសពីរនាក់ត្រូវបានចាប់ខ្លួនពីបទរំលោភចូលទឹកដីនៅមូលដ្ឋានទ័ពអាកាស RAF ក្នុងតំបន់ Cambridgeshire។",
      "category": "GEOPOLITICS",
      "impact": "LOW",
      "is_mover": false,
      "affected": [],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:46 ICT",
      "url": "https://zoqira.pro/news/9797422-uk-police-two-men-arrested-for-trespass-offences-at-cambridgeshire-ra",
      "source": "Zoqira"
    },
    {
      "id": 26230,
      "slug": "9797403-feds-musalem-speaks-watch-live",
      "title_en": "Fed's Musalem Speaks - WATCH LIVE",
      "title_km": "សម្តីរបស់លោក Musalem នៃធនាគារកណ្តាលអាមេរិក - ទស្សនាផ្ទាល់",
      "category": "CENTRAL_BANK",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:40 ICT",
      "url": "https://zoqira.pro/news/9797403-feds-musalem-speaks-watch-live",
      "source": "Zoqira"
    },
    {
      "id": 26229,
      "slug": "9797402-openai-bans-russia-origin-chatgpt-accounts-linked-to-influence-operati",
      "title_en": "OpenAI Bans Russia-Origin ChatGPT Accounts Linked to Influence Operations",
      "title_km": "OpenAI បានផ្អាកគណនី ChatGPT ដែលមានប្រភពពីរុស្ស៊ី ពាក់ព័ន្ធនឹងប្រតិបត្តិការឥទ្ធិពល",
      "category": "GEOPOLITICS",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["US500", "NAS100"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:39 ICT",
      "url": "https://zoqira.pro/news/9797402-openai-bans-russia-origin-chatgpt-accounts-linked-to-influence-operati",
      "source": "Zoqira"
    },
    {
      "id": 26228,
      "slug": "9797401-us-vp-vance-microsoft-abused-a-visa-system-while-reducing-us-workers",
      "title_en": "US VP Vance: Microsoft abused a visa system while reducing US workers. $MSFT",
      "title_km": "អនុប្រធានាធិបតីអាមេរិក វ៉ាន់ស៍៖ ក្រុមហ៊ុន Microsoft បានប្រើប្រាស់ប្រព័ន្ធទិដ្ឋាការខុសច្បាប់ ខណៈកាត់បន្ថយកម្មករអាមេរិក",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["MSFT"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:35 ICT",
      "url": "https://zoqira.pro/news/9797401-us-vp-vance-microsoft-abused-a-visa-system-while-reducing-us-workers",
      "source": "Zoqira"
    },
    {
      "id": 26226,
      "slug": "9797400-nyses-martin-500-bln-market-cap-added-this-year",
      "title_en": "NYSE's Martin: $500 bln market cap added this year.",
      "title_km": "លោក Martin នៃ NYSE៖ តម្លៃទីផ្សារកើនឡើង ៥០០ ពាន់លានដុល្លារនៅឆ្នាំនេះ។",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["US500", "NAS100", "US30"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:33 ICT",
      "url": "https://zoqira.pro/news/9797400-nyses-martin-500-bln-market-cap-added-this-year",
      "source": "Zoqira"
    },
    {
      "id": 26227,
      "slug": "9797399-nvidia-commits-1b-to-advance-us-science-over-the-next-five-years-nv",
      "title_en": "NVIDIA commits $1b to advance US science over the next five years. $NVDA",
      "title_km": "ក្រុមហ៊ុន NVIDIA ប្តេជ្ញាចំណាយ ១ ពាន់លានដុល្លារដើម្បីជំរុញវិទ្យាសាស្ត្រអាមេរិកក្នុងរយៈពេល ៥ ឆ្នាំខាងមុខ។ $NVDA",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["NVDA", "NAS100"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:32 ICT",
      "url": "https://zoqira.pro/news/9797399-nvidia-commits-1b-to-advance-us-science-over-the-next-five-years-nv",
      "source": "Zoqira"
    },
    {
      "id": 26224,
      "slug": "9797382-ukraine-has-hit-russias-omsk-oil-refinery-statement",
      "title_en": "Ukraine has hit Russia's Omsk oil refinery - Statement.",
      "title_km": "អ៊ុយក្រែនបានវាយប្រហាររោងចក្រចម្រាញ់ប្រេង Omsk របស់រុស្ស៊ី - សេចក្តីថ្លែងការណ៍",
      "category": "GEOPOLITICS",
      "impact": "HIGH",
      "is_mover": true,
      "affected": ["USOIL", "XAUUSD", "USD"],
      "bias": { "USOIL": "BULLISH", "XAUUSD": "BULLISH", "USD": "BULLISH" },
      "regime": "RISK_OFF",
      "why": "Strike on a Russian refinery raises oil supply risk, lifting crude while haven demand boosts gold and the dollar.",
      "published_at_ict": "08 Oct 2026 • 21:31 ICT",
      "url": "https://zoqira.pro/news/9797382-ukraine-has-hit-russias-omsk-oil-refinery-statement",
      "source": "Zoqira"
    },
    {
      "id": 26225,
      "slug": "9797377-eia-natural-gas-change-bcf-actual-85b-forecast-82b-previous-64b",
      "title_en": "EIA Natural Gas Change BCF Actual 85B (Forecast 82B, Previous 64B)",
      "title_km": "ការផ្លាស់ប្តូរឧស្ម័នធម្មជាតិ EIA BCF ជាក់ស្តែង 85B (ព្យាករណ៍ 82B, មុន 64B)",
      "category": "COMMODITY",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["NGAS"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:30 ICT",
      "url": "https://zoqira.pro/news/9797377-eia-natural-gas-change-bcf-actual-85b-forecast-82b-previous-64b",
      "source": "Zoqira"
    },
    {
      "id": 26222,
      "slug": "9797375-us-vp-vance-the-us-is-reforming-h-1b-and-j-1-visa-programs",
      "title_en": "US VP Vance: The US is reforming H-1B and J-1 Visa programs.",
      "title_km": "អនុប្រធានាធិបតីអាមេរិក វ៉ាន់ស៍៖ អាមេរិកកំពុងកែទម្រង់កម្មវិធីទិដ្ឋាការ H-1B និង J-1។",
      "category": "OTHER",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:23 ICT",
      "url": "https://zoqira.pro/news/9797375-us-vp-vance-the-us-is-reforming-h-1b-and-j-1-visa-programs",
      "source": "Zoqira"
    },
    {
      "id": 26223,
      "slug": "9797374-us-vp-vance-the-us-is-suspending-the-perm-program-for-microsoft-the",
      "title_en": "US VP Vance: The US is suspending the PERM program for Microsoft. The message to Microsoft is you've got to hire American workers. $MSFT",
      "title_km": "អនុប្រធានាធិបតីអាមេរិក វ៉ាន់ស៍៖ អាមេរិកកំពុងផ្អាកកម្មវិធី PERM សម្រាប់ Microsoft។ សារទៅកាន់ Microsoft គឺអ្នកត្រូវជួលកម្មករអាមេរិក។ $MSFT",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["MSFT"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:22 ICT",
      "url": "https://zoqira.pro/news/9797374-us-vp-vance-the-us-is-suspending-the-perm-program-for-microsoft-the",
      "source": "Zoqira"
    },
    {
      "id": 26220,
      "slug": "9797373-irans-head-of-the-atomic-energy-the-us-and-israel-have-put-pressure",
      "title_en": "Iran's Head of the Atomic Energy: The US and Israel have put pressure on the IAEA to inspect sites that have been targeted by attacks and to provide them with reports and observations from the ground - IRIB News.",
      "title_km": "ប្រធានអង្គការថាមពលបរមាណូអ៊ីរ៉ង់៖ អាមេរិក និងអ៊ីស្រាអែល បានដាក់សម្ពាធលើ IAEA ឱ្យត្រួតពិនិត្យទីតាំងដែលត្រូវបានវាយប្រហារ និងផ្តល់របាយការណ៍ និងការសង្កេតពីដីគោក - IRIB News។",
      "category": "GEOPOLITICS",
      "impact": "MEDIUM",
      "is_mover": false,
      "affected": ["XAUUSD", "USOIL", "USD"],
      "bias": { "XAUUSD": "BULLISH", "USOIL": "BULLISH", "USD": "BULLISH" },
      "regime": "RISK_OFF",
      "why": "Iran-IAEA tension raises Middle East supply risk and safe-haven demand, lifting gold, oil and the dollar together.",
      "published_at_ict": "08 Oct 2026 • 21:19 ICT",
      "url": "https://zoqira.pro/news/9797373-irans-head-of-the-atomic-energy-the-us-and-israel-have-put-pressure",
      "source": "Zoqira"
    },
    {
      "id": 26221,
      "slug": "9797366-crypto-fear-and-greed-index-64100-greed",
      "title_en": "Crypto Fear and Greed Index: 64/100 = Greed",
      "title_km": "សន្ទស្សន៍ភាពភ័យខ្លាច និងលោភលន់លើគ្រីបតូ៖ 64/100 = លោភលន់",
      "category": "CRYPTO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["BTCUSDT"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:18 ICT",
      "url": "https://zoqira.pro/news/9797366-crypto-fear-and-greed-index-64100-greed",
      "source": "Zoqira"
    },
    {
      "id": 26218,
      "slug": "9797364-fear-and-greed-index-41100-fear",
      "title_en": "Fear and Greed Index: 41/100 = Fear",
      "title_km": "សន្ទស្សន៍ភ័យខ្លាច និងលោភលន់៖ ៤១/១០០ = ភ័យខ្លាច",
      "category": "OTHER",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["US500", "BTCUSDT"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:17 ICT",
      "url": "https://zoqira.pro/news/9797364-fear-and-greed-index-41100-fear",
      "source": "Zoqira"
    },
    {
      "id": 26219,
      "slug": "9797363-irans-president-pezeshkian-arrives-in-turkmenistan-and-will-hold-bil",
      "title_en": "Iran's President Pezeshkian arrives in Turkmenistan, and will hold bilateral meetings and discussions with Putin - Tasnim News.",
      "title_km": "ប្រធានាធិបតីអ៊ីរ៉ង់ លោក Pezeshkian បានមកដល់តួកមេនីស្ថាន ហើយនឹងជួបប្រជុំទ្វេភាគី និងពិភាក្សាជាមួយលោក ពូទីន - ទីភ្នាក់ងារព័ត៌មាន Tasnim។",
      "category": "GEOPOLITICS",
      "impact": "MEDIUM",
      "is_mover": false,
      "affected": ["USOIL", "XAUUSD", "USD"],
      "bias": { "USOIL": "BULLISH", "XAUUSD": "BULLISH", "USD": "BULLISH" },
      "regime": "RISK_OFF",
      "why": "Iran-Russia talks raise the odds of tighter sanctions and supply risk, lifting oil and driving safe-haven flows into gold and the dollar.",
      "published_at_ict": "08 Oct 2026 • 21:16 ICT",
      "url": "https://zoqira.pro/news/9797363-irans-president-pezeshkian-arrives-in-turkmenistan-and-will-hold-bil",
      "source": "Zoqira"
    },
    {
      "id": 26215,
      "slug": "9797360-att-launches-flagship-pact-with-openai-forming-an-in-house-legal-des",
      "title_en": "AT&T launches flagship pact with OpenAI, forming an in-house legal design partnership. $T",
      "title_km": "AT&T ចាប់ដៃជាមួយ OpenAI ក្នុងកិច្ចសហការរចនាផ្នែកច្បាប់ក្នុងផ្ទះ",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["T"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:02 ICT",
      "url": "https://zoqira.pro/news/9797360-att-launches-flagship-pact-with-openai-forming-an-in-house-legal-des",
      "source": "Zoqira"
    },
    {
      "id": 26217,
      "slug": "9797338-us-wholesale-sales-mom-actual-18-forecast-previous-08",
      "title_en": "US Wholesale Sales MoM Actual 1.8% (Forecast -, Previous 0.8%)",
      "title_km": "ការលក់ដុំសហរដ្ឋអាមេរិកប្រចាំខែ ជាក់ស្តែង 1.8% (ព្យាករណ៍ -, លើកមុន 0.8%)",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:00 ICT",
      "url": "https://zoqira.pro/news/9797338-us-wholesale-sales-mom-actual-18-forecast-previous-08",
      "source": "Zoqira"
    },
    {
      "id": 26216,
      "slug": "9797339-us-wholesale-inventories-mom-revised-actual-05-forecast-07-previ",
      "title_en": "US Wholesale Inventories MoM Revised Actual 0.5% (Forecast 0.7%, Previous 0.7%)",
      "title_km": "ស្តុកលក់ដុំសហរដ្ឋអាមេរិកប្រចាំខែ ត្រូវបានកែសម្រួលជា 0.5% (ព្យាករណ៍ 0.7%, លើកមុន 0.7%)",
      "category": "MACRO",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["USD"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 21:00 ICT",
      "url": "https://zoqira.pro/news/9797339-us-wholesale-inventories-mom-revised-actual-05-forecast-07-previ",
      "source": "Zoqira"
    },
    {
      "id": 26214,
      "slug": "9797337-pakistan-news-reports-of-pakistani-fighter-jets-participating-in-the",
      "title_en": "Pakistan: News reports of Pakistani fighter jets participating in the attack on Yemen are false and fabricated - Fars News.",
      "title_km": "ប៉ាគីស្ថាន៖ របាយការណ៍ព័ត៌មានអំពីយន្តហោះចម្បាំងប៉ាគីស្ថានចូលរួមវាយប្រហារលើយេម៉េន គឺជាការមិនពិត និងប្រឌិត - Fars News។",
      "category": "GEOPOLITICS",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["XAUUSD", "USOIL"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 20:57 ICT",
      "url": "https://zoqira.pro/news/9797337-pakistan-news-reports-of-pakistani-fighter-jets-participating-in-the",
      "source": "Zoqira"
    },
    {
      "id": 26212,
      "slug": "9797318-saudi-arabia-debris-from-the-houthi-rocket-fell-on-a-medical-complex",
      "title_en": "Saudi Arabia: Debris from the Houthi rocket fell on a medical complex.",
      "title_km": "អារ៉ាប៊ីសាអូឌីត៖ បំណែកនៃគ្រាប់រ៉ុក្កែតរបស់ហ៊ូធី បានធ្លាក់លើមណ្ឌលពេទ្យមួយ។",
      "category": "GEOPOLITICS",
      "impact": "MEDIUM",
      "is_mover": false,
      "affected": ["XAUUSD", "USOIL", "USD"],
      "bias": { "XAUUSD": "BULLISH", "USOIL": "BULLISH", "USD": "BULLISH" },
      "regime": "RISK_OFF",
      "why": "Attack on Saudi infrastructure raises Middle East supply risk, lifting oil and driving safe-haven flows into gold and the dollar.",
      "published_at_ict": "08 Oct 2026 • 20:35 ICT",
      "url": "https://zoqira.pro/news/9797318-saudi-arabia-debris-from-the-houthi-rocket-fell-on-a-medical-complex",
      "source": "Zoqira"
    },
    {
      "id": 26213,
      "slug": "9797317-saudi-arabia-shrapnel-fell-after-interception-over-riyadh",
      "title_en": "Saudi Arabia: Shrapnel fell after interception over Riyadh.",
      "title_km": "អារ៉ាប៊ីសាអូឌីត៖ បំណែកគ្រាប់បានធ្លាក់បន្ទាប់ពីការស្ទាក់ចាប់ពីលើអាកាសនៅរីយ៉ាដ។",
      "category": "GEOPOLITICS",
      "impact": "MEDIUM",
      "is_mover": false,
      "affected": ["XAUUSD", "USOIL", "USD"],
      "bias": { "XAUUSD": "BULLISH", "USOIL": "BULLISH", "USD": "BULLISH" },
      "regime": "RISK_OFF",
      "why": "Interception over Riyadh signals escalating regional conflict, adding oil supply-risk premium and safe-haven demand for gold and USD.",
      "published_at_ict": "08 Oct 2026 • 20:34 ICT",
      "url": "https://zoqira.pro/news/9797317-saudi-arabia-shrapnel-fell-after-interception-over-riyadh",
      "source": "Zoqira"
    },
    {
      "id": 26211,
      "slug": "9797301-moo-imbalance",
      "title_en": "MOO Imbalance",
      "title_km": "អតុល្យភាព MOO",
      "category": "EQUITIES",
      "impact": "LOW",
      "is_mover": false,
      "affected": ["US500"],
      "bias": [],
      "regime": null,
      "why": null,
      "published_at_ict": "08 Oct 2026 • 20:30 ICT",
      "url": "https://zoqira.pro/news/9797301-moo-imbalance",
      "source": "Zoqira"
    }
  ]
};

// Rebrand zoqira.pro and Zoqira source to Por ICT
const porIctNewsData = rawApiPayload.data.map((item) => {
  const transformedUrl = item.url ? item.url.replace("zoqira.pro", "porict.com") : "#";
  const transformedSource = (item.source === "Zoqira" || !item.source) ? "Por ICT Newswire" : item.source;
  return {
    ...item,
    url: transformedUrl,
    source: transformedSource,
    impact: (item.impact || "LOW").toUpperCase()
  };
});

// Helper: Check if an item is relevant to USD / US instruments
function isUsdInstrument(item) {
  if (!item.affected || !Array.isArray(item.affected)) return false;
  return item.affected.some((sym) => 
    sym === "USD" || 
    sym === "XAUUSD" || 
    sym.startsWith("US") || 
    sym === "DXY" || 
    sym === "NAS100" || 
    sym === "US500" || 
    sym === "US30" || 
    sym === "US10Y" || 
    sym === "USOIL"
  );
}

// Generate actionable institutional ICT playbook advice based on bias & regime
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
// 3. BILINGUAL DICTIONARY (EN & KH)
// ==========================================
const translations = {
  EN: {
    nav_home: "Home",
    nav_news: "Por ICT News",
    nav_live_chart: "Live Chart",
    nav_membership: "Membership",
    nav_contact: "Contact Us",
    nav_audio_btn: "4K Zen Music",
    logout_btn: "Log out",

    pop_status: "Status",
    pop_approved: "● Approved",
    pop_tier: "Tier",
    pop_member: "Member",
    pop_admin: "Admin",
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

    ff_banner_title: "Economic Events & USD High-Impact Calendar",
    ff_banner_desc: "Real-time releases filtered directly for institutional ICT traders. Track red, orange, and yellow folders on Forex Factory.",
    news_kicker: "LIVE NEWSWIRE · ព័ត៌មានទីផ្សារ",
    news_main_title: "Market news",
    news_sub_desc: "Real-time market-moving headlines, translated to Khmer and scored for impact. Focused on USD currency pairs.",
    filter_all: "All",
    filter_usd_only: "💵 USD Only (Hot)",
    filter_high: "High Impact",
    filter_medium: "Medium",
    filter_low: "Low",
    title_usd_wire: "USD Economic Newswire Feed",

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
    nav_news: "ព័ត៌មាន Por ICT",
    nav_live_chart: "តារាង Live Chart",
    nav_membership: "សមាជិកភាព",
    nav_contact: "ទំនាក់ទំនង",
    nav_audio_btn: "តន្ត្រី Zen 4K",
    logout_btn: "ចាកចេញ",

    pop_status: "ស្ថានភាព",
    pop_approved: "● បានអនុម័ត",
    pop_tier: "ប្រភេទសមាជិក",
    pop_member: "សមាជិកទូទៅ",
    pop_admin: "អ្នកគ្រប់គ្រង",
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

    ff_banner_title: "ព្រឹត្តិការណ៍សេដ្ឋកិច្ច និងប្រតិទិនព័ត៌មាន USD សំខាន់ៗ",
    ff_banner_desc: "ព័ត៌មានជាក់ស្តែងសម្រាប់ ICT Trader តាមដាន folder ក្រហម ទឹកក្រូច និងលឿងនៅលើ Forex Factory។",
    news_kicker: "LIVE NEWSWIRE · ព័ត៌មានទីផ្សារ",
    news_main_title: "ព័ត៌មានទីផ្សារ",
    news_sub_desc: "ព័ត៌មានរំជើបរំជួលទីផ្សារ បកប្រែជាភាសាខ្មែរ និងវាស់ស្ទង់ឥទ្ធិពល ផ្តោតលើគូរូបិយប័ណ្ណ USD។",
    filter_all: "ទាំងអស់",
    filter_usd_only: "💵 USD តែប៉ុណ្ណោះ (ក្តៅៗ)",
    filter_high: "ឥទ្ធិពលខ្លាំង (High)",
    filter_medium: "មធ្យម (Medium)",
    filter_low: "ទាប (Low)",
    title_usd_wire: "ព័ត៌មានសេដ្ឋកិច្ច USD ផ្ទាល់",

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
    modal_delete: "លុប",
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
  renderHotNewsSection();
  renderWireNewsSection();
}

// ==========================================
// 4. DOM ELEMENT REFERENCES
// ==========================================
const loginView = document.getElementById("loginView");
const signupView = document.getElementById("signupView");
const verifyView = document.getElementById("verifyView");
const resetPasswordView = document.getElementById("resetPasswordView");
const dashboardView = document.getElementById("dashboardView");
const newsView = document.getElementById("newsView");
const liveChartView = document.getElementById("liveChartView");
const membershipView = document.getElementById("membershipView");
const contactView = document.getElementById("contactView");

const loginForm = document.getElementById("loginForm");
const navLogoutBtn = document.getElementById("navLogoutBtn");
const navProfileWrapper = document.getElementById("navProfileWrapper");
const navCenterLinks = document.getElementById("navCenterLinks");
const navHomeLink = document.getElementById("navHomeLink");
const navNewsLink = document.getElementById("navNewsLink");
const navLiveChartLink = document.getElementById("navLiveChartLink");
const navMembershipLink = document.getElementById("navMembershipLink");
const navContactLink = document.getElementById("navContactLink");
const navMusicBtn = document.getElementById("navMusicBtn");

// Mobile Drawer Elements
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenuDrawer = document.getElementById("mobileMenuDrawer");
const mobileDrawerBackdrop = document.getElementById("mobileDrawerBackdrop");
const mobileHomeLink = document.getElementById("mobileHomeLink");
const mobileNewsLink = document.getElementById("mobileNewsLink");
const mobileLiveChartLink = document.getElementById("mobileLiveChartLink");
const mobileMembershipLink = document.getElementById("mobileMembershipLink");
const mobileContactLink = document.getElementById("mobileContactLink");
const mobileMusicBtn = document.getElementById("mobileMusicBtn");
const mobileMusicStateText = document.getElementById("mobileMusicStateText");
const mobileLogoutLink = document.getElementById("mobileLogoutLink");
const mobileViewProfileBtn = document.getElementById("mobileViewProfileBtn");

const mobileEzContactFab = document.getElementById("mobileEzContactFab");

// Navigation buttons
const newsBackBtn = document.getElementById("newsBackBtn");
const openNewsFromDashBtn = document.getElementById("openNewsFromDashBtn");
const membershipBackBtn = document.getElementById("membershipBackBtn");
const liveChartBackBtn = document.getElementById("liveChartBackBtn");
const contactBackBtn = document.getElementById("contactBackBtn");
const openLiveChartBtn = document.getElementById("openLiveChartBtn");
const bannerUpgradeBtn = document.getElementById("bannerUpgradeBtn");

// Newsfeed DOM Elements
const hotNewsItemsList = document.getElementById("hotNewsItemsList");
const wireCardsGrid = document.getElementById("wireCardsGrid");
const newsFeedCounter = document.getElementById("newsFeedCounter");
const liveIctClock = document.getElementById("liveIctClock");
const jsonApiBtn = document.getElementById("jsonApiBtn");
const newsFiltersContainer = document.getElementById("newsFiltersContainer");
const ffCalendarExternalBtn = document.getElementById("ffCalendarExternalBtn");

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
// 5. POR ICT NEWS & FOREX FACTORY CONTROLLER
// ==========================================
function openNewsView(e) {
  if (e) e.preventDefault();
  hideAllViews();
  if (newsView) newsView.classList.remove("hidden");

  updateNavActiveLink(navNewsLink, mobileNewsLink);
  if (profilePopoverCard) profilePopoverCard.classList.remove("show");
  closeMobileDrawer();

  renderHotNewsSection();
  renderWireNewsSection();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

if (openNewsFromDashBtn) openNewsFromDashBtn.addEventListener("click", openNewsView);
if (navNewsLink) navNewsLink.addEventListener("click", openNewsView);
if (mobileNewsLink) mobileNewsLink.addEventListener("click", openNewsView);
if (newsBackBtn) newsBackBtn.addEventListener("click", openDashboardView);

// Forex Factory direct visit tracker
if (ffCalendarExternalBtn) {
  ffCalendarExternalBtn.addEventListener("click", () => {
    console.log("Forex Factory sync: https://www.forexfactory.com/");
  });
}

// Live ICT Clock (Phnom Penh UTC+7)
function updateIctClock() {
  if (!liveIctClock) return;
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Phnom_Penh",
    hour12: false
  });
  liveIctClock.textContent = `${timeString} ICT`;
}
setInterval(updateIctClock, 1000);
updateIctClock();

// News Filter Toolbar Handlers
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

// Render "Por ICT New Hot Reads" Section (Movers, High/Medium Impact, Why Catalyst, Regime)
function renderHotNewsSection() {
  if (!hotNewsItemsList) return;

  const hotCandidates = porIctNewsData.filter((item) => {
    const hasCatalyst = item.is_mover === true || item.impact === "HIGH" || (item.why && item.impact === "MEDIUM");
    if (!hasCatalyst) return false;

    if (currentNewsFilter === "all") return true;
    if (currentNewsFilter === "usd") return isUsdInstrument(item);
    if (currentNewsFilter === "high") return item.impact === "HIGH";
    if (currentNewsFilter === "medium") return item.impact === "MEDIUM";
    if (currentNewsFilter === "low") return item.impact === "LOW";
    return true;
  });

  if (hotCandidates.length === 0) {
    hotNewsItemsList.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
        No Hot Reads match the active filter criteria.
      </div>
    `;
    return;
  }

  hotNewsItemsList.innerHTML = hotCandidates.map((item) => {
    const impactClass = item.impact.toLowerCase();
    const impactLabel = item.impact;
    const titleText = currentLang === "KH" ? (item.title_km || item.title_en) : item.title_en;

    // Bias sentiment tags
    let biasTagsHtml = "";
    if (item.bias && typeof item.bias === "object" && !Array.isArray(item.bias)) {
      biasTagsHtml = Object.keys(item.bias).map((sym) => {
        const sentiment = item.bias[sym].toLowerCase();
        const sentClass = sentiment === "bullish" ? "tag-bullish" : "tag-bearish";
        return `<span class="market-sentiment-tag ${sentClass}">${sym} ${sentiment}</span>`;
      }).join("");
    } else if (item.affected && Array.isArray(item.affected)) {
      biasTagsHtml = item.affected.map((sym) => {
        return `<span class="market-sentiment-tag tag-neutral">${sym}</span>`;
      }).join("");
    }

    const whyCatalyst = item.why ? `
      <p class="hot-item-catalyst-summary">
        <strong>${item.regime || item.category} ·</strong> ${item.why}
      </p>
    ` : "";

    const ictAdvice = generateIctGuidance(item);

    return `
      <article class="hot-news-item-card" data-impact="${item.impact}">
        <span class="impact-badge-pill ${impactClass}">${impactLabel}</span>
        <div class="hot-item-content">
          <h3 class="hot-item-title">${titleText}</h3>
          
          <div class="hot-meta-tags-row">
            ${biasTagsHtml}
            <span class="por-wire-source-tag">${item.source}</span>
            <span class="por-wire-source-tag">${item.published_at_ict}</span>
          </div>

          ${whyCatalyst}

          <div class="hot-ict-action-row">
            <span class="ict-bolt">⚡</span>
            <span>${ictAdvice}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Render "USD Economic Newswire Feed" Grid Section
function renderWireNewsSection() {
  if (!wireCardsGrid) return;

  const wireCandidates = porIctNewsData.filter((item) => {
    if (currentNewsFilter === "all") return true;
    if (currentNewsFilter === "usd") return isUsdInstrument(item);
    if (currentNewsFilter === "high") return item.impact === "HIGH";
    if (currentNewsFilter === "medium") return item.impact === "MEDIUM";
    if (currentNewsFilter === "low") return item.impact === "LOW";
    return true;
  });

  if (newsFeedCounter) {
    newsFeedCounter.textContent = `Showing ${wireCandidates.length} headlines`;
  }

  if (wireCandidates.length === 0) {
    wireCardsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
        No headlines available for the selected filter.
      </div>
    `;
    return;
  }

  wireCardsGrid.innerHTML = wireCandidates.map((item) => {
    const impactClass = item.impact.toLowerCase();
    const impactLabel = item.impact;

    let affectedPillsHtml = "";
    if (item.affected && Array.isArray(item.affected) && item.affected.length > 0) {
      affectedPillsHtml = item.affected.map((sym) => {
        let extraClass = "";
        if (item.bias && item.bias[sym]) {
          extraClass = item.bias[sym] === "BULLISH" ? "usd-positive" : "usd-negative";
        }
        return `<span class="wire-asset-pill ${extraClass}">${sym}</span>`;
      }).join("");
    } else {
      affectedPillsHtml = `<span class="wire-asset-pill">${item.category}</span>`;
    }

    return `
      <article class="wire-news-card" data-impact="${item.impact}">
        <div class="wire-card-top-bar">
          <span class="impact-badge-pill ${impactClass}">${impactLabel}</span>
          <span class="wire-category-tag">${item.category}</span>
          <span class="wire-time-ago">${item.published_at_ict}</span>
        </div>

        <h4 class="wire-english-title">${item.title_en}</h4>
        <p class="wire-khmer-title">${item.title_km || item.title_en}</p>

        <div class="wire-asset-tags-group">
          ${affectedPillsHtml}
        </div>
      </article>
    `;
  }).join("");
}

// JSON API Endpoint preview / Copy handler
if (jsonApiBtn) {
  jsonApiBtn.addEventListener("click", () => {
    const apiExportPayload = {
      provider: "Por ICT Newswire",
      forexFactorySync: "https://www.forexfactory.com/",
      timestamp: new Date().toISOString(),
      count: porIctNewsData.length,
      data: porIctNewsData
    };

    navigator.clipboard.writeText(JSON.stringify(apiExportPayload, null, 2))
      .then(() => {
        alert("Por ICT USD Newswire JSON payload copied to clipboard! 📋");
      })
      .catch(() => {
        console.log("Por ICT API Payload:", apiExportPayload);
        alert("Por ICT API Payload logged to browser developer console.");
      });
  });
}

// ==========================================
// 6. AMBIENT YOUTUBE AUDIO ENGINE
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

document.addEventListener("click", () => {
  if (localStorage.getItem("por_music_playing") === "true" && !isAudioPlaying && ytPlayerReady) {
    playAudioMusic();
  }
}, { once: true });

if (window.YT && window.YT.Player) {
  initYouTubeAudio();
}

// ==========================================
// 7. THEME & LANGUAGE CONTROLLER
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
// 8. ACCOUNT SWITCHER & STATE SYNC
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

// Language Menu & Popover Handlers
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
// 9. AUTHENTICATION & PASSWORD FLOW
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

// 6-Digit OTP Box Handling
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
  if (newsView) newsView.classList.add("hidden");
  if (liveChartView) liveChartView.classList.add("hidden");
  if (membershipView) membershipView.classList.add("hidden");
  if (contactView) contactView.classList.add("hidden");
}

function updateNavActiveLink(activeLinkEl, mobileActiveLinkEl) {
  [navHomeLink, navNewsLink, navLiveChartLink, navMembershipLink, navContactLink].forEach((link) => {
    if (link) link.classList.remove("active");
  });
  if (activeLinkEl) activeLinkEl.classList.add("active");

  [mobileHomeLink, mobileNewsLink, mobileLiveChartLink, mobileMembershipLink, mobileContactLink].forEach((link) => {
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

// Ambient video playback safeguard
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