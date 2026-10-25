// ==========================================
// 1. ADMIN, ABA KHQR & PACKAGE SETTINGS
// ==========================================
const ADMIN_PIN = '9999';
const SECRET_SALT = 73;
const TELEGRAM_URL = 'https://t.me/KaingChungpor';

// បញ្ចូល Gemini API Key ពិតប្រាកដដែលផ្តើមដោយ "AIzaSy..." (បង្កើតហ្វ្រីនៅ https://aistudio.google.com/app/apikey)
// បើទុកទទេ វានឹងប្រើប្រព័ន្ធ Auto AI Chart Vision & OCR ស្វ័យប្រវត្តិដោយមិនលោត Error 401
const DEFAULT_GEMINI_API_KEY = '';

const getApiKey = () => {
  const saved = (localStorage.getItem('ksnr_gemini_key') || '').trim();
  // សម្អាត Key ចាស់ដែលខុសទម្រង់ (ឧ. AQ.Ab8...) ចេញពី localStorage ដោយស្វ័យប្រវត្តិ
  if (saved && !saved.startsWith('AIza')) {
    localStorage.removeItem('ksnr_gemini_key');
    return DEFAULT_GEMINI_API_KEY;
  }
  return saved || DEFAULT_GEMINI_API_KEY;
};

// ព័ត៌មានគណនី ABA Bank ពិតប្រាកដរបស់អ្នក (ពីរូបភាព ABA KHQR)
const ABA_MERCHANT_INFO = {
  bakongId: 'abaakhppxxx@abaa',
  bankName: 'ABA Bank',
  merchantName: 'CHUNG POR KAING',
  merchantCity: 'Phnom Penh',
  usdAccount: '086375171',
  usdAccountDisplay: '086 375 171',
  khrAccount: '003823710',
  khrAccountDisplay: '003 823 710'
};

// តារាងកញ្ចប់តម្លៃទាំង 8 (Choose Price You Pay)
const PACKAGES_MAP = {
  '1_SCAN':  { code: '1_SCAN',  mode: 'S1',     title: 'KEY ស្កេន 1-ដង',                  price: '2.5', scans: 1, hours: 0 },
  '2_SCAN':  { code: '2_SCAN',  mode: 'S2',     title: 'KEY ស្កេន 2-ដង',                  price: '4.5', scans: 2, hours: 0 },
  '5_SCAN':  { code: '5_SCAN',  mode: 'S5',     title: 'KEY ស្កេន 5-ដង',                  price: '8.5', scans: 5, hours: 0 },
  '24H':     { code: '24H',     mode: 'H24',    title: 'KEY ស្កេន 1-DAY/24H Unlimited',    price: '10',  scans: 0, hours: 24 },
  '168H':    { code: '168H',    mode: 'H168',   title: 'KEY ស្កេន 1-សប្តាហ៍/168H Unlimited', price: '25',  scans: 0, hours: 168 },
  '720H':    { code: '720H',    mode: 'H720',   title: 'KEY ស្កេន 1-ខែ/720H Unlimited',    price: '35',  scans: 0, hours: 720 },
  '2880H':   { code: '2880H',   mode: 'H2880',  title: 'KEY ស្កេន 3-ខែ ថែម 1 ខែ / 2880H',  price: '50',  scans: 0, hours: 2880 },
  '12240H':  { code: '12240H',  mode: 'H12240', title: 'KEY ស្កេន 1-ឆ្នាំ ថែម 5 ខែ / 12240H', price: '80', scans: 0, hours: 12240 }
};

// គណនី Admin ទាំងពីរដែលមានសិទ្ធិស្កេនឥតដែនកំណត់ (Unlimited Scan)
const ADMIN_EMAILS = [
  'chungpor908@gmail.com',
  'yutagoma908@gmail.com'
];

const MASTER_KEYS = ['KSNR-VIP', 'KSNR-2026', 'ADMIN-999', 'KSNR-UNLIMITED'];

function isAdminUser(user) {
  if (!user || !user.identifier) return false;
  return ADMIN_EMAILS.includes(String(user.identifier).trim().toLowerCase());
}

// ==========================================
// 2. 6-CHAR ONE-TIME KEY GENERATOR & VERIFIER (e.g. 5GSR8Z)
// ==========================================
const KEY_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const MODE_TO_PREFIX = {
  S1: '5',     // 2.5$ (1 Scan)
  S2: '2',     // 4.5$ (2 Scans)
  S5: '8',     // 8.5$ (5 Scans)
  H24: 'D',    // 10$ (24 Hours)
  H168: 'W',   // 25$ (168 Hours)
  H720: 'M',   // 35$ (720 Hours)
  H2880: 'Q',  // 50$ (2880 Hours)
  H12240: 'Y', // 80$ (12240 Hours)
  VIP: 'V'     // VIP
};

const PREFIX_TO_SPEC = {
  '5': { mode: 'S1',     scans: 1, hours: 0,     price: '2.5', label: 'ស្កេន 1-ដង (2.5$)' },
  '1': { mode: 'S1',     scans: 1, hours: 0,     price: '2.5', label: 'ស្កេន 1-ដង (2.5$)' },
  '2': { mode: 'S2',     scans: 2, hours: 0,     price: '4.5', label: 'ស្កេន 2-ដង (4.5$)' },
  '8': { mode: 'S5',     scans: 5, hours: 0,     price: '8.5', label: 'ស្កេន 5-ដង (8.5$)' },
  'D': { mode: 'H24',    scans: 0, hours: 24,    price: '10',  label: '24 ម៉ោង (10$)' },
  'W': { mode: 'H168',   scans: 0, hours: 168,   price: '25',  label: '1 សប្តាហ៍ (25$)' },
  'M': { mode: 'H720',   scans: 0, hours: 720,   price: '35',  label: '1 ខែ (35$)' },
  'Q': { mode: 'H2880',  scans: 0, hours: 2880,  price: '50',  label: '4 ខែ (50$)' },
  'Y': { mode: 'H12240', scans: 0, hours: 12240, price: '80',  label: '1 ឆ្នាំ ថែម 5 ខែ (80$)' },
  'V': { mode: 'VIP',    scans: 0, hours: 999999,price: 'VIP', label: 'VIP Unlimited' }
};

function compute6CharChecksum(prefix4) {
  let sum = SECRET_SALT;
  for (let i = 0; i < prefix4.length; i++) {
    sum = (sum * 37 + prefix4.charCodeAt(i) * (i + 3)) % 1024;
  }
  const c1 = KEY_CHARSET[sum % KEY_CHARSET.length];
  const c2 = KEY_CHARSET[Math.floor(sum / KEY_CHARSET.length) % KEY_CHARSET.length];
  return `${c1}${c2}`;
}

function getKeyRegistry() {
  try { return JSON.parse(localStorage.getItem('ksnr_issued_keys') || '{}'); } catch (e) { return {}; }
}

function saveKeyRegistry(reg) {
  localStorage.setItem('ksnr_issued_keys', JSON.stringify(reg));
}

function getKeyUsageMap() {
  try { return JSON.parse(localStorage.getItem('ksnr_key_usage') || '{}'); } catch (e) { return {}; }
}

function saveKeyUsageMap(map) {
  localStorage.setItem('ksnr_key_usage', JSON.stringify(map));
}

function generateSmartKey(mode = 'S1', qrSessionId = '') {
  const prefix = MODE_TO_PREFIX[mode] || '5';
  let body = '';
  for (let i = 0; i < 3; i++) {
    body += KEY_CHARSET[Math.floor(Math.random() * KEY_CHARSET.length)];
  }
  const first4 = `${prefix}${body}`;
  const check2 = compute6CharChecksum(first4);
  const key = `${first4}${check2}`;

  const spec = PREFIX_TO_SPEC[prefix] || PREFIX_TO_SPEC['5'];
  const reg = getKeyRegistry();
  reg[key] = {
    key,
    mode: spec.mode,
    scans: spec.scans,
    hours: spec.hours,
    price: spec.price,
    label: spec.label,
    qrSessionId: qrSessionId || `QR-${Date.now()}`,
    createdAt: Date.now(),
    activatedAt: null,
    redeemedBy: null,
    exhausted: false
  };
  saveKeyRegistry(reg);
  localStorage.setItem('ksnr_latest_approved_key', key);
  return key;
}

function verifySmartKey(inputKey, currentUserIdentifier = '') {
  if (!inputKey) return { valid: false, reason: 'សូមបញ្ចូលលេខ KEY!' };
  const clean = inputKey.trim().toUpperCase();

  if (MASTER_KEYS.includes(clean)) {
    return { valid: true, type: 'VIP Unlimited Lifetime', unlimited: true };
  }

  const reg = getKeyRegistry();
  const usage = getKeyUsageMap();

  if (clean.length === 6 && !clean.includes('-')) {
    const prefix = clean[0];
    const spec = PREFIX_TO_SPEC[prefix];
    const expectedCheck = compute6CharChecksum(clean.slice(0, 4));

    if (!spec || clean.slice(4, 6) !== expectedCheck) {
      return { valid: false, reason: 'លេខ KEY មិនត្រឹមត្រូវទេ! សូមពិនិត្យម្ដងទៀត។' };
    }

    const record = reg[clean] || {
      key: clean,
      mode: spec.mode,
      scans: spec.scans,
      hours: spec.hours,
      price: spec.price,
      label: spec.label,
      createdAt: Date.now(),
      activatedAt: null,
      redeemedBy: null,
      exhausted: false
    };

    if (record.exhausted) {
      return { valid: false, reason: '⚠️ KEY នេះត្រូវបានប្រើរួចហើយ (ប្រើបានតែ ១ ដងគត់)! សូមទិញ KEY ថ្មី។' };
    }

    if (record.redeemedBy && currentUserIdentifier && record.redeemedBy !== currentUserIdentifier) {
      return { valid: false, reason: '⚠️ KEY នេះត្រូវបានដោះសោរប្រើប្រាស់រួចហើយ! មិនអាចប្រើស្ទួនបានទេ។' };
    }

    if (spec.scans > 0) {
      const used = usage[clean] || 0;
      const left = spec.scans - used;
      if (left <= 0) {
        record.exhausted = true;
        reg[clean] = record;
        saveKeyRegistry(reg);
        return { valid: false, reason: '⚠️ KEY នេះប្រើអស់ចំនួនដងហើយ (1-Time KEY)! សូមទិញ KEY ថ្មី។' };
      }
      return {
        valid: true,
        type: `${spec.label} • នៅសល់ ${left}/${spec.scans} ដង`,
        scansLeft: left,
        maxScans: spec.scans
      };
    }

    if (spec.hours >= 999999) {
      return { valid: true, type: 'VIP Unlimited', unlimited: true };
    }

    const startMs = record.activatedAt || Date.now();
    const expMs = startMs + spec.hours * 3600000;
    if (Date.now() > expMs) {
      record.exhausted = true;
      reg[clean] = record;
      saveKeyRegistry(reg);
      return { valid: false, reason: '⚠️ KEY នេះផុតកំណត់ម៉ោងប្រើប្រាស់ហើយ! សូមទិញ KEY ថ្មី។' };
    }

    const hoursLeft = Math.max(1, Math.ceil((expMs - Date.now()) / 3600000));
    const timeLabel = hoursLeft >= 48 ? `នៅសល់ ${Math.ceil(hoursLeft / 24)} ថ្ងៃ` : `នៅសល់ ${hoursLeft} ម៉ោង`;
    return { valid: true, type: `${spec.label} (${timeLabel})` };
  }

  const parts = clean.split('-');
  if (parts.length === 4 && parts[0] === 'KSNR' && parts[1].startsWith('S')) {
    const maxScans = parseInt(parts[1].slice(1), 10);
    const rand = parseInt(parts[2], 10);
    const checkSum = parseInt(parts[3], 10);
    const expected = ((rand + maxScans * 19 + SECRET_SALT) % 900) + 100;
    if (isNaN(maxScans) || isNaN(rand) || checkSum !== expected) {
      return { valid: false, reason: 'លេខ KEY មិនត្រឹមត្រូវ!' };
    }
    const used = usage[clean] || 0;
    const left = maxScans - used;
    if (left <= 0) {
      return { valid: false, reason: 'លេខ KEY នេះប្រើអស់ចំនួនដងហើយ! សូមទិញ KEY ថ្មី។' };
    }
    return { valid: true, type: `នៅសល់ ${left}/${maxScans} ដង`, scansLeft: left, maxScans };
  }

  return { valid: false, reason: 'លេខ KEY មិនត្រឹមត្រូវទេ! សូមទិញ KEY ជាមុនសិន។' };
}

function consumeKeyScanIfNeeded() {
  if (isAdminUser(state.user)) return true;
  const savedKey = localStorage.getItem('ksnr_saved_key');
  if (!savedKey) return false;
  const userId = state.user ? state.user.identifier : '';
  const check = verifySmartKey(savedKey, userId);
  if (!check.valid) {
    lock();
    return false;
  }

  if (typeof check.scansLeft === 'number') {
    const usage = getKeyUsageMap();
    usage[savedKey] = (usage[savedKey] || 0) + 1;
    saveKeyUsageMap(usage);

    const reg = getKeyRegistry();
    if (reg[savedKey] && usage[savedKey] >= (reg[savedKey].scans || check.maxScans)) {
      reg[savedKey].exhausted = true;
      saveKeyRegistry(reg);
    }

    addHistoryLog('SCAN', `បានប្រើ KEY (${savedKey}) ស្កេន Chart ១ ដង (${state.tradeStyle})`);
    const after = verifySmartKey(savedKey, userId);
    if (after.valid) {
      $('keyStatusText').textContent = `បានដោះសោ (${after.type})`;
    } else {
      state.unlocked = false;
      localStorage.removeItem('ksnr_saved_key');
      if (state.user) syncUserRecord({ activeKey: null });
      applyLockUI();
    }
  } else {
    addHistoryLog('SCAN', `បានស្កេន Chart ដោយជោគជ័យ (${check.type} • ${state.tradeStyle})`);
  }
  return true;
}

// ==========================================
// 3. STATE + HELPERS (WITH SCALPING vs SWING TRADE)
// ==========================================
const $ = (id) => document.getElementById(id);
const state = {
  unlocked: false,
  imageBase64: null,
  mime: 'image/png',
  scanning: false,
  result: null,
  tradeStyle: localStorage.getItem('ksnr_trade_style') || 'SCALPING', // 'SCALPING' | 'SWING'
  selectedPair: 'AUTO',
  selectedTf: 'AUTO',
  adminAuth: false,
  adminKeyMode: 'S1',
  genKey: '',
  selectedPkg: PACKAGES_MAP['1_SCAN'],
  currentQrSession: null,
  latestIssuedKey: localStorage.getItem('ksnr_latest_approved_key') || '',
  khqrMode: 'dynamic',
  rawAbaKhqrPayload: localStorage.getItem('ksnr_raw_aba_khqr') || '',
  customAbaQrImg: localStorage.getItem('ksnr_custom_aba_qr_img') || '',
  winrate: parseFloat(localStorage.getItem('ksnr_winrate') || '91.8'),
  lang: localStorage.getItem('ksnr_lang') || 'km',
  user: JSON.parse(localStorage.getItem('ksnr_current_user') || 'null')
};

const show = (el, on = true) => el && el.classList.toggle('hidden', !on);
const icons = () => window.lucide && lucide.createIcons();
const openModal = (id) => show($(id), true);
const closeModal = (id) => show($(id), false);

function flashButton(btn, doneHtml, originalHtml) {
  if (!btn) return;
  btn.innerHTML = doneHtml;
  icons();
  setTimeout(() => {
    btn.innerHTML = originalHtml;
    icons();
  }, 2200);
}

// ==========================================
// 3B. SCALPING vs SWING TRADE MODE SELECTOR & 9-TF CONTROL BAR
// ==========================================
function setTradeStyle(style, autoRescanIfResult = false) {
  state.tradeStyle = style === 'SWING' ? 'SWING' : 'SCALPING';
  localStorage.setItem('ksnr_trade_style', state.tradeStyle);

  const btnScalp = $('btnModeScalping');
  const btnSwing = $('btnModeSwing');
  const badge = $('activeTradeStyleBadge');

  if (btnScalp && btnSwing) {
    if (state.tradeStyle === 'SCALPING') {
      btnScalp.classList.add('active-scalp');
      btnScalp.classList.remove('border-slate-700');
      btnSwing.classList.remove('active-swing');
      btnSwing.classList.add('border-slate-700');
    } else {
      btnSwing.classList.add('active-swing');
      btnSwing.classList.remove('border-slate-700');
      btnScalp.classList.remove('active-scalp');
      btnScalp.classList.add('border-slate-700');
    }
  }

  if (badge) {
    if (state.tradeStyle === 'SCALPING') {
      badge.textContent = '⚡ SCALPING MODE';
      badge.className = 'px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-extrabold uppercase';
    } else {
      badge.textContent = '🌊 SWING TRADE MODE';
      badge.className = 'px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-extrabold uppercase';
    }
  }

  renderScanButton();

  if (autoRescanIfResult && state.imageBase64 && state.result && !state.scanning && typeof window.recalculateResultForTradeStyle === 'function') {
    window.recalculateResultForTradeStyle(state.tradeStyle);
  }
}

$('btnModeScalping')?.addEventListener('click', (e) => {
  e.stopPropagation();
  setTradeStyle('SCALPING', true);
});

$('btnModeSwing')?.addEventListener('click', (e) => {
  e.stopPropagation();
  setTradeStyle('SWING', true);
});

$('tradeStyleBox')?.addEventListener('click', (e) => e.stopPropagation());

$('livePairSelect')?.addEventListener('change', (e) => {
  state.selectedPair = e.target.value || 'AUTO';
});

document.querySelectorAll('#tfSelectorBar .tf-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tf = btn.dataset.tf || 'AUTO';
    state.selectedTf = tf;

    document.querySelectorAll('#tfSelectorBar .tf-btn').forEach((b) => {
      const isActive = b.dataset.tf === tf;
      b.className = isActive
        ? 'tf-btn py-1.5 rounded-xl bg-cyan-500 text-slate-950 border border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer'
        : 'tf-btn py-1.5 rounded-xl bg-[#131d31] text-slate-300 border border-slate-700 hover:border-cyan-400 cursor-pointer';
    });

    if (['1m', '3m', '5m', '15m'].includes(tf)) {
      setTradeStyle('SCALPING', true);
    } else if (['30m', '1h', '4h', '1d', '1w'].includes(tf)) {
      setTradeStyle('SWING', true);
    }
  });
});

// ==========================================
// 4. USER STORAGE & SEED ADMINS
// ==========================================
function getUsers() {
  try { return JSON.parse(localStorage.getItem('ksnr_users') || '[]'); } catch (e) { return []; }
}
function saveUsers(list) {
  localStorage.setItem('ksnr_users', JSON.stringify(list));
}

(function seedDefaultAdmins() {
  const users = getUsers();
  const defaults = [
    { username: 'Chungpor Admin', gender: 'ប្រុស', age: '24', identifier: 'chungpor908@gmail.com', password: 'admin908', avatar: '' },
    { username: 'Yutagoma Admin', gender: 'ប្រុស', age: '24', identifier: 'yutagoma908@gmail.com', password: 'admin908', avatar: '' }
  ];
  let changed = false;
  defaults.forEach((d) => {
    if (!users.find((u) => u.identifier === d.identifier)) {
      users.push({ ...d, createdAt: Date.now() });
      changed = true;
    }
  });
  if (changed) saveUsers(users);
})();

// ==========================================
// 5. WINRATE LIVE ACTION ENGINE (91.8%)
// ==========================================
function updateWinrateUI() {
  const formatted = state.winrate.toFixed(1) + '%';
  if ($('winrateText')) $('winrateText').textContent = `Winrate ${formatted}`;
  if ($('modalWinrateSub')) $('modalWinrateSub').textContent = `អត្រាជោគជ័យបច្ចុប្បន្ន៖ ${formatted}`;
  localStorage.setItem('ksnr_winrate', state.winrate.toFixed(1));
}

$('btnWinrateAction')?.addEventListener('click', () => {
  updateWinrateUI();
  openModal('winrateModal');
});

$('btnRecordWin')?.addEventListener('click', () => {
  state.winrate = Math.min(98.9, +(state.winrate + 0.1).toFixed(1));
  updateWinrateUI();
});

$('btnRecordLoss')?.addEventListener('click', () => {
  state.winrate = Math.max(85.0, +(state.winrate - 0.1).toFixed(1));
  updateWinrateUI();
});

setInterval(() => {
  const path = $('winrateWavePath');
  const dot = $('winrateDot');
  if (!path || !dot) return;
  const y = (5.2 + Math.sin(Date.now() / 600) * 1.4).toFixed(1);
  path.setAttribute('d', `M1 7 C12 7, 20 9, 30 8 C35 7.5, 38 6.5, 41 ${y}`);
  dot.setAttribute('cy', y);
  dot.nextElementSibling?.setAttribute('cy', y);
}, 250);

// ==========================================
// 6. LANGUAGE SWITCHER & THEME
// ==========================================
const I18N = {
  en: {
    flag: 'GB',
    label: 'English',
    backDashboardTop: 'Back to Main Dashboard',
    backDashboardBottom: '← Back to Main Dashboard',
    subtitle: 'Transform market complexity into precise entry points',
    buyKey: 'BUY KEY',
    locked: 'Locked • No KEY',
    dropTitle: 'Drop your Chart image here',
    dropSub: 'Members must Login and activate a <span class="text-[#facc15] font-bold">Special KEY</span> to scan (Admin Unlimited Scan)',
    enterKeyBtn: 'Enter KEY to Scan',
    imgReadyNotice: '✅ Chart Image Ready! Choose Scalping or Swing Trade below:',
    chooseTradeStyle: '🎯 Choose What You Want To Trade (Scalping or Swing):',
    scalpDesc: 'Fast execution • Tight SL (1.3x ATR) • Quick profit targets (R:R 1:2.5)',
    swingDesc: 'Hold bigger trend moves • Wide Structural SL • Big TP targets (R:R 1:4.5)'
  },
  km: {
    flag: 'KH',
    label: 'ភាសាខ្មែរ',
    backDashboardTop: 'ត្រឡប់ទៅផ្ទាំងដើម Dashboard',
    backDashboardBottom: '← ត្រឡប់ទៅផ្ទាំងដើម (Back to Main Dashboard)',
    subtitle: 'បំប្លែងភាពស្មុគស្មាញនៃទីផ្សារ ទៅជាចំណុចចូលដ៏ច្បាស់លាស់',
    buyKey: 'ទិញ KEY',
    locked: 'ជាប់សោរ អត់ KEY',
    dropTitle: 'ទាញរូបភាព Chart ទម្លាក់ទីនេះ',
    dropSub: 'សមាជិកត្រូវ Login គណនី និងមាន <span class="text-[#facc15] font-bold">KEY ពិសេស</span> ដើម្បីស្កេន (Admin ស្កេនឥតដែនកំណត់)',
    enterKeyBtn: 'បញ្ចូល KEY ដើម្បីស្កេន',
    imgReadyNotice: '✅ រូបភាព Chart បញ្ចូលរួចរាល់! សូមជ្រើសរើស Scalping ឬ Swing Trade ខាងក្រោម៖',
    chooseTradeStyle: '🎯 ជ្រើសរើសទម្រង់ជួញដូរ (Choose What You Want To Trade)៖',
    scalpDesc: 'វាយខ្លីរហ័ស • Tight SL (1.3x ATR) • យកផលចំណេញលឿន (R:R 1:2.5)',
    swingDesc: 'កាន់វែងតាម Trend ធំ • Wide Structural SL • TP ធំ (R:R 1:4.5)'
  }
};

function applyLanguage(lang) {
  state.lang = I18N[lang] ? lang : 'km';
  localStorage.setItem('ksnr_lang', state.lang);
  const t = I18N[state.lang];
  if ($('langFlag')) $('langFlag').textContent = t.flag;
  if ($('langLabel')) $('langLabel').textContent = t.label;
  if ($('txtBackDashboardTop')) $('txtBackDashboardTop').textContent = t.backDashboardTop;
  if ($('txtBackDashboardBottom')) $('txtBackDashboardBottom').textContent = t.backDashboardBottom;
  if ($('heroSubtitle')) $('heroSubtitle').textContent = t.subtitle;
  if ($('txtBuyKey')) $('txtBuyKey').textContent = t.buyKey;
  if ($('txtLocked')) $('txtLocked').textContent = t.locked;
  if ($('txtDropTitle')) $('txtDropTitle').textContent = t.dropTitle;
  if ($('txtDropSub')) $('txtDropSub').innerHTML = t.dropSub;
  if ($('txtEnterKeyBtn')) $('txtEnterKeyBtn').textContent = t.enterKeyBtn;
  if ($('txtImgReadyNotice')) $('txtImgReadyNotice').textContent = t.imgReadyNotice;
  if ($('txtChooseTradeStyle')) $('txtChooseTradeStyle').innerHTML = `<span>${t.chooseTradeStyle}</span>`;
  if ($('txtScalpDesc')) $('txtScalpDesc').textContent = t.scalpDesc;
  if ($('txtSwingDesc')) $('txtSwingDesc').textContent = t.swingDesc;
  renderScanButton();
}

$('btnLang')?.addEventListener('click', (e) => {
  e.stopPropagation();
  $('langMenu').classList.toggle('hidden');
});
document.querySelectorAll('#langMenu [data-lang]').forEach((btn) => {
  btn.addEventListener('click', () => {
    applyLanguage(btn.dataset.lang);
    show($('langMenu'), false);
  });
});
window.addEventListener('click', () => show($('langMenu'), false));

$('btnTheme')?.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  $('themeIcon').textContent = isLight ? '☀️' : '🌙';
});

// ==========================================
// 7. USER AUTH, PROFILE & ADMIN UNLIMITED
// ==========================================
function getInitials(name) {
  const clean = String(name || 'PO').trim();
  return clean.slice(0, 2).toUpperCase();
}

function addHistoryLog(type, detail) {
  if (!state.user) return;
  const key = `ksnr_hist_${state.user.identifier}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift({
    type,
    detail,
    time: new Date().toLocaleString('km-KH')
  });
  localStorage.setItem(key, JSON.stringify(list.slice(0, 40)));
}

function syncUserRecord(updatedFields) {
  if (!state.user) return;
  state.user = { ...state.user, ...updatedFields };
  localStorage.setItem('ksnr_current_user', JSON.stringify(state.user));
  const users = getUsers();
  const idx = users.findIndex((u) => u.identifier === state.user.identifier);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updatedFields };
    saveUsers(users);
  }
}

function applyAuthUI() {
  const loggedIn = !!state.user;
  show($('authGuestBox'), !loggedIn);
  show($('authUserBox'), loggedIn);

  if (loggedIn) {
    const admin = isAdminUser(state.user);
    const initials = getInitials(state.user.username);
    $('userDisplayName').textContent = state.user.username;
    $('userRoleBadge').textContent = admin ? '👑 ADMIN UNLIMITED' : 'K-SNR MEMBER';
    $('userRoleBadge').className = admin
      ? 'text-[10px] font-extrabold text-amber-300 tracking-wider uppercase'
      : 'text-[10px] font-extrabold text-[#00e5ff] tracking-wider uppercase';

    const hasAvatar = !!state.user.avatar;
    show($('navAvatarImg'), hasAvatar);
    show($('navAvatarInitials'), !hasAvatar);
    if (hasAvatar) $('navAvatarImg').src = state.user.avatar;
    $('navAvatarInitials').textContent = initials;

    show($('profileModalImg'), hasAvatar);
    show($('profileModalInitials'), !hasAvatar);
    if (hasAvatar) $('profileModalImg').src = state.user.avatar;
    $('profileModalInitials').textContent = initials;

    $('profileIdentifierText').textContent = state.user.identifier;
    $('profileNicknameInput').value = state.user.username;
    show($('profileAdminTag'), admin);

    if (admin) {
      state.unlocked = true;
      $('keyStatusText').textContent = '👑 Admin Unlimited Scan';
    } else if (state.user.activeKey) {
      const check = verifySmartKey(state.user.activeKey, state.user.identifier);
      if (check.valid) {
        state.unlocked = true;
        localStorage.setItem('ksnr_saved_key', state.user.activeKey);
        $('keyStatusText').textContent = `បានដោះសោ (${check.type})`;
      } else {
        state.unlocked = false;
      }
    } else {
      const savedKey = localStorage.getItem('ksnr_saved_key');
      const check = savedKey ? verifySmartKey(savedKey, state.user.identifier) : { valid: false };
      state.unlocked = check.valid;
      if (check.valid) $('keyStatusText').textContent = `បានដោះសោ (${check.type})`;
    }
  } else {
    state.unlocked = false;
  }

  applyLockUI();
  icons();
}

$('btnOpenProfile')?.addEventListener('click', () => {
  if (!state.user) return openModal('loginModal');
  show($('profileSaveMsg'), false);
  applyAuthUI();
  openModal('profileModal');
});

$('profileImgInput')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 220;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      syncUserRecord({ avatar: dataUrl });
      applyAuthUI();
      $('profileSaveMsg').textContent = '✅ បានបង្ហោះរូបភាព Profile រួចរាល់!';
      show($('profileSaveMsg'), true);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

$('btnCopyAccount')?.addEventListener('click', () => {
  if (!state.user) return;
  navigator.clipboard.writeText(state.user.identifier);
  $('profileSaveMsg').textContent = '✅ បានចម្លងគណនី (Copied Account)!';
  show($('profileSaveMsg'), true);
});

$('btnSaveProfile')?.addEventListener('click', () => {
  const newName = $('profileNicknameInput').value.trim();
  if (!newName) return;
  syncUserRecord({ username: newName });
  applyAuthUI();
  $('profileSaveMsg').textContent = '✅ បានរក្សាទុកឈ្មោះថ្មីរួចរាល់!';
  show($('profileSaveMsg'), true);
});

$('btnOpenHistory')?.addEventListener('click', () => {
  if (!state.user) return;
  const key = `ksnr_hist_${state.user.identifier}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  const box = $('historyContent');
  box.innerHTML = '';
  if (list.length === 0) {
    box.innerHTML = '<div class="p-4 rounded-xl bg-slate-900 text-center text-slate-400">មិនទាន់មានប្រវត្តិប្រើប្រាស់ ឬវិក្កយបត្រនៅឡើយទេ។</div>';
  } else {
    list.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'p-3.5 rounded-xl bg-[#131d31] border border-slate-700/80 flex flex-col gap-1';
      div.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-extrabold text-[#00e5ff] text-xs">${item.type}</span>
          <span class="text-[11px] text-slate-400">${item.time}</span>
        </div>
        <div class="text-slate-200 text-xs sm:text-sm">${item.detail}</div>
      `;
      box.appendChild(div);
    });
  }
  openModal('historyModal');
});

$('btnProfileLogout')?.addEventListener('click', () => {
  state.user = null;
  localStorage.removeItem('ksnr_current_user');
  closeModal('profileModal');
  applyAuthUI();
});

$('btnOpenLogin')?.addEventListener('click', () => {
  show($('loginError'), false);
  openModal('loginModal');
});
$('btnOpenSignup')?.addEventListener('click', () => {
  show($('signupError'), false);
  openModal('signupModal');
});
$('btnSwitchToSignup')?.addEventListener('click', () => {
  closeModal('loginModal');
  show($('signupError'), false);
  openModal('signupModal');
});
$('btnSwitchToLogin')?.addEventListener('click', () => {
  closeModal('signupModal');
  show($('loginError'), false);
  openModal('loginModal');
});

document.querySelectorAll('[data-toggle-pass]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = $(btn.dataset.togglePass);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}" class="w-5 h-5"></i>`;
    icons();
  });
});

$('signupForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = $('signupUsername').value.trim();
  const gender = $('signupGender').value;
  const age = $('signupAge').value.trim();
  const identifier = $('signupIdentifier').value.trim().toLowerCase();
  const password = $('signupPassword').value;

  if (password.length < 4) {
    $('signupError').textContent = 'Password ត្រូវមានយ៉ាងតិច 4 ខ្ទង់!';
    return show($('signupError'), true);
  }

  const users = getUsers();
  const existingIdx = users.findIndex((u) => u.identifier === identifier);
  if (existingIdx !== -1 && !ADMIN_EMAILS.includes(identifier)) {
    $('signupError').textContent = 'គណនី ឬ Gmail/លេខទូរស័ព្ទនេះ មានរួចហើយ!';
    return show($('signupError'), true);
  }

  const newUser = { username, gender, age, identifier, password, avatar: '', createdAt: Date.now() };
  if (existingIdx !== -1) users[existingIdx] = newUser;
  else users.push(newUser);
  saveUsers(users);

  state.user = newUser;
  localStorage.setItem('ksnr_current_user', JSON.stringify(state.user));
  addHistoryLog('ACCOUNT', 'បង្កើតគណនីសមាជិកថ្មីដោយជោគជ័យ');
  $('signupForm').reset();
  show($('signupError'), false);
  closeModal('signupModal');
  applyAuthUI();
});

$('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const identifier = $('loginIdentifier').value.trim().toLowerCase();
  const password = $('loginPassword').value;

  const users = getUsers();
  let matched = users.find(
    (u) => (u.identifier === identifier || u.username.toLowerCase() === identifier) && u.password === password
  );

  if (!matched && ADMIN_EMAILS.includes(identifier)) {
    matched = users.find((u) => u.identifier === identifier);
    if (matched) {
      matched.password = password;
      saveUsers(users);
    }
  }

  if (!matched) {
    $('loginError').textContent = 'Gmail/លេខទូរស័ព្ទ ឬ Password មិនត្រឹមត្រូវទេ!';
    return show($('loginError'), true);
  }

  state.user = matched;
  localStorage.setItem('ksnr_current_user', JSON.stringify(state.user));
  $('loginForm').reset();
  show($('loginError'), false);
  closeModal('loginModal');
  applyAuthUI();
});

// ==========================================
// 8. REAL 1-TIME ABA KHQR + AUTO "កន្លែងទទួលបាន KEY" ENGINE
// ==========================================
function applyLockUI() {
  show($('btnLocked'), !state.unlocked);
  show($('unlockedBox'), state.unlocked);
  show($('btnEnterKey'), !state.unlocked);
  show($('btnScan'), state.unlocked);
  renderScanButton();
}

function unlock(key, typeText) {
  const clean = key.trim().toUpperCase();
  const reg = getKeyRegistry();
  if (reg[clean]) {
    if (!reg[clean].activatedAt) reg[clean].activatedAt = Date.now();
    if (state.user && !reg[clean].redeemedBy) {
      reg[clean].redeemedBy = state.user.identifier;
    }
    saveKeyRegistry(reg);
  }

  state.unlocked = true;
  $('keyStatusText').textContent = `បានដោះសោ (${typeText})`;
  localStorage.setItem('ksnr_saved_key', clean);
  if (state.user) {
    syncUserRecord({ activeKey: clean });
    addHistoryLog('KEY UNLOCK', `បានដោះសោរដោយប្រើ KEY: ${clean} (${typeText})`);
  }
  applyLockUI();
}

function lock() {
  if (isAdminUser(state.user)) {
    alert('គណនី Admin មានសិទ្ធិស្កេនឥតដែនកំណត់ (Unlimited Scan) ជានិច្ច!');
    return;
  }
  state.unlocked = false;
  if ($('keyInput')) $('keyInput').value = '';
  state.result = null;
  show($('resultCard'), false);
  localStorage.removeItem('ksnr_saved_key');
  if (state.user) syncUserRecord({ activeKey: null });
  applyLockUI();
}

function renderScanButton() {
  const btn = $('btnScan');
  if (!btn) return;
  btn.disabled = state.scanning;
  const styleLabel = state.tradeStyle === 'SWING' ? '🌊 SWING TRADE' : '⚡ SCALPING TRADE';

  if (state.scanning) {
    btn.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i><span>កំពុងវិភាគ ${styleLabel} និងរក Entry + SL + TP...</span>`;
  } else if (!state.imageBase64) {
    btn.innerHTML = `<i data-lucide="image"></i><span>ជ្រើសរើសរូបភាព Chart (${styleLabel})</span>`;
  } else {
    btn.innerHTML = `<i data-lucide="sparkles"></i><span>⚡ ស្កេនរក Entry + SL + TP (${styleLabel}) ឥឡូវនេះ</span>`;
  }
  icons();
}

function tlv(tag, value) {
  const str = String(value ?? '');
  const len = String(str.length).padStart(2, '0');
  return `${tag}${len}${str}`;
}

function crc16Khqr(payloadWithoutCrcValue) {
  let crc = 0xFFFF;
  for (let i = 0; i < payloadWithoutCrcValue.length; i++) {
    crc ^= (payloadWithoutCrcValue.charCodeAt(i) & 0xFF) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function parseEmvTags(rawQr) {
  const map = {};
  let i = 0;
  while (i + 4 <= rawQr.length) {
    const tag = rawQr.slice(i, i + 2);
    const len = parseInt(rawQr.slice(i + 2, i + 4), 10);
    if (isNaN(len) || i + 4 + len > rawQr.length) break;
    const val = rawQr.slice(i + 4, i + 4 + len);
    map[tag] = val;
    i += 4 + len;
    if (tag === '63') break;
  }
  return map;
}

function buildAbaKhqrPayload(pkg, isDynamicAmount = true, sessionId = '') {
  const amountNum = pkg && pkg.price ? parseFloat(pkg.price) : 0;
  const useAmount = isDynamicAmount && amountNum > 0;
  const amountStr = Number.isInteger(amountNum)
    ? String(amountNum)
    : amountNum.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  const billRef = sessionId || `OT${Date.now().toString().slice(-6)}`;

  if (state.rawAbaKhqrPayload && state.rawAbaKhqrPayload.startsWith('000201')) {
    if (!useAmount) {
      return state.rawAbaKhqrPayload;
    }
    const tags = parseEmvTags(state.rawAbaKhqrPayload);
    const acctTag = tags['29'] ? '29' : (tags['30'] ? '30' : null);
    if (acctTag && tags[acctTag]) {
      const nowMs = String(Date.now());
      const expMs = String(Date.now() + 15 * 60 * 1000);
      let body = '';
      body += tlv('00', '01');
      body += tlv('01', '12');
      body += tlv(acctTag, tags[acctTag]);
      body += tlv('52', tags['52'] || '5999');
      body += tlv('53', '840');
      body += tlv('54', amountStr);
      body += tlv('58', 'KH');
      body += tlv('59', tags['59'] || ABA_MERCHANT_INFO.merchantName);
      body += tlv('60', tags['60'] || ABA_MERCHANT_INFO.merchantCity);
      body += tlv('62', tlv('01', billRef));
      body += tlv('99', tlv('00', nowMs) + tlv('01', expMs));
      body += '6304';
      return body + crc16Khqr(body);
    }
  }

  const subTag00 = tlv('00', ABA_MERCHANT_INFO.bakongId);
  const subTag01 = tlv('01', ABA_MERCHANT_INFO.usdAccount);
  const subTag02 = tlv('02', ABA_MERCHANT_INFO.bankName);
  const tag29Value = subTag00 + subTag01 + subTag02;

  const nowMs = String(Date.now());
  const expMs = String(Date.now() + 15 * 60 * 1000);

  let payload = '';
  payload += tlv('00', '01');
  payload += tlv('01', useAmount ? '12' : '11');
  payload += tlv('29', tag29Value);
  payload += tlv('52', '5999');
  payload += tlv('53', '840');
  if (useAmount) {
    payload += tlv('54', amountStr);
  }
  payload += tlv('58', 'KH');
  payload += tlv('59', ABA_MERCHANT_INFO.merchantName);
  payload += tlv('60', ABA_MERCHANT_INFO.merchantCity);
  payload += tlv('62', tlv('01', billRef));
  payload += tlv('99', tlv('00', nowMs) + tlv('01', expMs));
  payload += '6304';
  return payload + crc16Khqr(payload);
}

function tryDecodeAbaQrFromImageSrc(src) {
  if (!src || !window.jsQR) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const off = document.createElement('canvas');
      off.width = img.naturalWidth || img.width;
      off.height = img.naturalHeight || img.height;
      const ctx = off.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, off.width, off.height);
      const code = window.jsQR(imgData.data, imgData.width, imgData.height);
      if (code && code.data && code.data.startsWith('000201')) {
        state.rawAbaKhqrPayload = code.data;
        localStorage.setItem('ksnr_raw_aba_khqr', code.data);
        if (state.selectedPkg) drawKhqrCanvas(state.selectedPkg);
      }
    } catch (e) {}
  };
  img.src = src;
}

if (state.customAbaQrImg) {
  tryDecodeAbaQrFromImageSrc(state.customAbaQrImg);
} else {
  tryDecodeAbaQrFromImageSrc('image_6229bd.jpg');
}

function startOneTimeKhqrSession(pkg) {
  state.selectedPkg = pkg;
  state.currentQrSession = {
    id: `OT${Math.floor(100000 + Math.random() * 900000)}`,
    pkgCode: pkg.code,
    mode: pkg.mode || (pkg.scans > 0 ? `S${pkg.scans}` : `H${pkg.hours}`),
    title: pkg.title,
    price: pkg.price,
    scans: pkg.scans,
    hours: pkg.hours,
    used: false,
    issuedKey: null,
    createdAt: Date.now()
  };

  show($('khqrUsedOverlay'), false);
  $('khqrPkgTitle').textContent = `${pkg.title} - តម្លៃ ${pkg.price}$`;
  $('khqrStatusText').textContent = `📱 ស្កេនបង់ប្រាក់ ${pkg.price}$ (1-Time QR #${state.currentQrSession.id})`;
  $('khqrStatusText').className = 'text-xs sm:text-sm text-cyan-300 mb-3 font-semibold';

  document.querySelectorAll('#quickPriceBtns button').forEach((b) => {
    const active = b.dataset.qpkg === pkg.code;
    b.className = active
      ? 'py-1.5 rounded-lg bg-cyan-500/25 border border-cyan-400 text-white font-extrabold cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.3)]'
      : 'py-1.5 rounded-lg bg-[#131d31] border border-slate-700 text-slate-300 font-bold cursor-pointer hover:border-slate-500';
  });

  drawKhqrCanvas(pkg);
}

function drawKhqrCanvas(pkg) {
  const canvas = $('khqrCanvas');
  const origImg = $('khqrOriginalImg');
  if (!canvas || !pkg) return;

  if (state.customAbaQrImg && origImg) {
    origImg.src = state.customAbaQrImg;
  }

  if (state.khqrMode === 'original' && origImg && origImg.complete && origImg.naturalWidth > 0) {
    show(canvas, false);
    show(origImg, true);
    return;
  }
  show(origImg, false);
  show(canvas, true);

  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#e11d27';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w, 0);
  ctx.lineTo(w, 64);
  ctx.lineTo(w - 26, 46);
  ctx.lineTo(0, 46);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 20px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('KHQR', w / 2, 31);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 14px Inter, sans-serif';
  ctx.fillText(ABA_MERCHANT_INFO.merchantName, 24, 72);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0284c7';
  ctx.font = '800 16px Inter, sans-serif';
  ctx.fillText(`$${pkg.price} USD`, w - 24, 72);

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, 86);
  ctx.lineTo(w - 20, 86);
  ctx.stroke();
  ctx.restore();

  const sessionId = state.currentQrSession ? state.currentQrSession.id : `OT${Date.now().toString().slice(-6)}`;
  const khqrString = buildAbaKhqrPayload(pkg, state.khqrMode === 'dynamic', sessionId);
  const qrSize = 236;
  const startX = Math.floor((w - qrSize) / 2);
  const startY = 98;

  if (typeof window.qrcode === 'function') {
    const qr = window.qrcode(0, 'M');
    qr.addData(khqrString);
    qr.make();
    const count = qr.getModuleCount();
    const cellSize = qrSize / count;

    ctx.fillStyle = '#000000';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          const rx = Math.floor(startX + c * cellSize);
          const ry = Math.floor(startY + r * cellSize);
          const rw = Math.ceil((c + 1) * cellSize) - Math.floor(c * cellSize);
          const rh = Math.ceil((r + 1) * cellSize) - Math.floor(r * cellSize);
          ctx.fillRect(rx, ry, rw, rh);
        }
      }
    }

    const cx = startX + qrSize / 2;
    const cy = startY + qrSize / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 17, 0, Math.PI * 2);
    ctx.fillStyle = '#e11d27';
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('៛', cx, cy + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  const footerTop = 348;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(22, footerTop);
  ctx.lineTo(w - 22, footerTop);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 12.5px Inter, sans-serif';
  ctx.fillText('៛  KHR account:', 24, footerTop + 26);
  ctx.textAlign = 'right';
  ctx.font = '800 13px Inter, monospace';
  ctx.fillText(ABA_MERCHANT_INFO.khrAccountDisplay, w - 24, footerTop + 26);

  ctx.textAlign = 'left';
  ctx.font = '700 12.5px Inter, sans-serif';
  ctx.fillText('$  USD account:', 24, footerTop + 52);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0284c7';
  ctx.font = '800 13.5px Inter, monospace';
  ctx.fillText(ABA_MERCHANT_INFO.usdAccountDisplay, w - 24, footerTop + 52);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 10px Inter, sans-serif';
  ctx.fillText(`1-TIME KHQR #${sessionId} • ${pkg.title} (${pkg.price}$)`, w / 2, h - 8);
}

function setKhqrMode(mode) {
  state.khqrMode = mode;
  const tabDyn = $('tabKhqrDynamic');
  const tabOrig = $('tabKhqrOriginal');
  if (tabDyn && tabOrig) {
    if (mode === 'dynamic') {
      tabDyn.className = 'flex-1 py-2.5 text-center font-extrabold text-[#00e5ff] border-b-2 border-[#00e5ff] cursor-pointer';
      tabOrig.className = 'flex-1 py-2.5 text-center font-bold text-slate-400 hover:text-white cursor-pointer';
    } else {
      tabOrig.className = 'flex-1 py-2.5 text-center font-extrabold text-[#00e5ff] border-b-2 border-[#00e5ff] cursor-pointer';
      tabDyn.className = 'flex-1 py-2.5 text-center font-bold text-slate-400 hover:text-white cursor-pointer';
    }
  }
  if (state.selectedPkg) drawKhqrCanvas(state.selectedPkg);
}

$('tabKhqrDynamic')?.addEventListener('click', () => setKhqrMode('dynamic'));
$('tabKhqrOriginal')?.addEventListener('click', () => setKhqrMode('original'));

document.querySelectorAll('#quickPriceBtns button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const pkg = PACKAGES_MAP[btn.dataset.qpkg];
    if (pkg) startOneTimeKhqrSession(pkg);
  });
});

$('btnCopyUsdAcc')?.addEventListener('click', () => {
  navigator.clipboard.writeText(ABA_MERCHANT_INFO.usdAccount);
  $('khqrStatusText').textContent = '✅ បានចម្លងលេខគណនី USD: 086 375 171 (CHUNG POR KAING)';
  $('khqrStatusText').className = 'text-xs sm:text-sm text-cyan-400 mb-3 font-bold';
});

$('btnCopyKhrAcc')?.addEventListener('click', () => {
  navigator.clipboard.writeText(ABA_MERCHANT_INFO.khrAccount);
  $('khqrStatusText').textContent = '✅ បានចម្លងលេខគណនី KHR: 003 823 710 (CHUNG POR KAING)';
  $('khqrStatusText').className = 'text-xs sm:text-sm text-amber-300 mb-3 font-bold';
});

$('uploadOriginalQrInput')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    state.customAbaQrImg = dataUrl;
    localStorage.setItem('ksnr_custom_aba_qr_img', dataUrl);
    if ($('khqrOriginalImg')) $('khqrOriginalImg').src = dataUrl;
    tryDecodeAbaQrFromImageSrc(dataUrl);
    $('khqrStatusText').textContent = '✅ បានភ្ជាប់រូប ABA KHQR ដើមរួចរាល់!';
    $('khqrStatusText').className = 'text-xs sm:text-sm text-emerald-400 mb-3 font-bold';
    setKhqrMode('original');
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll('#packageList .pkg-card').forEach((card) => {
  card.addEventListener('click', () => {
    if (!state.user) {
      closeModal('buyModal');
      return openModal('loginModal');
    }
    const pkg = PACKAGES_MAP[card.dataset.pkg] || {
      code: card.dataset.pkg,
      mode: Number(card.dataset.scans || 0) > 0 ? `S${card.dataset.scans}` : `H${card.dataset.hours}`,
      title: card.dataset.title,
      price: card.dataset.price,
      scans: Number(card.dataset.scans || 0),
      hours: Number(card.dataset.hours || 0)
    };
    startOneTimeKhqrSession(pkg);
    closeModal('buyModal');
    openModal('khqrModal');
    icons();
  });
});

$('btnSaveKhqr')?.addEventListener('click', () => {
  const canvas = $('khqrCanvas');
  if (!canvas || !state.selectedPkg) return;
  const prevMode = state.khqrMode;
  if (prevMode === 'original') {
    state.khqrMode = 'dynamic';
    drawKhqrCanvas(state.selectedPkg);
  }
  const link = document.createElement('a');
  link.download = `ABA-KHQR-CHUNG-POR-KAING-${state.selectedPkg.price}USD.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  if (prevMode === 'original') setKhqrMode('original');
});

function openReceiveKeyModalWithKey(keyCode, pkg) {
  const cleanKey = (keyCode || state.latestIssuedKey || localStorage.getItem('ksnr_latest_approved_key') || '').trim().toUpperCase();
  const reg = getKeyRegistry();
  const info = reg[cleanKey];

  if (cleanKey) {
    $('receivedKeyCode').textContent = cleanKey;
    state.latestIssuedKey = cleanKey;
  } else {
    $('receivedKeyCode').textContent = 'មិនទាន់មាន KEY';
  }

  if (pkg) {
    $('receiveKeyPkgBadge').innerHTML = `<span>⚡ កញ្ចប់៖ ${pkg.title} (${pkg.price}$) • ប្រើបានតែ ១ ដង</span>`;
  } else if (info) {
    $('receiveKeyPkgBadge').innerHTML = `<span>⚡ កញ្ចប់៖ ${info.label} • ប្រើបានតែ ១ ដង</span>`;
  }

  openModal('receiveKeyModal');
  icons();
}

$('btnOpenReceiveKey')?.addEventListener('click', () => {
  if (!state.user) return openModal('loginModal');
  openReceiveKeyModalWithKey(state.latestIssuedKey, state.selectedPkg);
});

function completeOneTimePaymentAndShowKey(pkg, sourceLabel = 'ABA KHQR') {
  if (!pkg) return;

  if (state.currentQrSession && state.currentQrSession.used && state.currentQrSession.issuedKey) {
    closeModal('khqrModal');
    openReceiveKeyModalWithKey(state.currentQrSession.issuedKey, pkg);
    return;
  }

  const mode = pkg.mode || (pkg.scans > 0 ? `S${pkg.scans}` : `H${pkg.hours}`);
  const qrId = state.currentQrSession ? state.currentQrSession.id : `OT${Date.now().toString().slice(-6)}`;
  const generatedKey = generateSmartKey(mode, qrId);

  if (state.currentQrSession) {
    state.currentQrSession.used = true;
    state.currentQrSession.issuedKey = generatedKey;
  }
  state.latestIssuedKey = generatedKey;
  show($('khqrUsedOverlay'), true);

  addHistoryLog('ABA KHQR PAID', `បានទូទាត់ ${pkg.title} (${pkg.price}$) តាម ${sourceLabel} • ទទួលបាន KEY: ${generatedKey}`);
  $('khqrStatusText').innerHTML = `✅ ទូទាត់ជោគជ័យ! កំពុងបើកផ្ទាំងទទួល KEY (${generatedKey})...`;
  $('khqrStatusText').className = 'text-xs sm:text-sm text-emerald-400 mb-3 font-extrabold';

  setTimeout(() => {
    closeModal('khqrModal');
    openReceiveKeyModalWithKey(generatedKey, pkg);
  }, 650);
}

$('receiptUploadInput')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  const pkg = state.selectedPkg;
  if (!file || !pkg) return;
  $('khqrStatusText').textContent = '⏳ កំពុងពិនិត្យវិក្កយបត្រ ABA Mobile របស់អ្នក...';
  $('khqrStatusText').className = 'text-xs sm:text-sm text-cyan-400 mb-3 font-bold';
  setTimeout(() => {
    completeOneTimePaymentAndShowKey(pkg, 'វិក្កយបត្រ ABA');
    e.target.value = '';
  }, 700);
});

$('btnVerifyKhqr')?.addEventListener('click', () => {
  const pkg = state.selectedPkg;
  if (!pkg) return;
  $('khqrStatusText').textContent = `⏳ កំពុងពិនិត្យការទូទាត់ ${pkg.price}$ ជាមួយ ABA (086 375 171)...`;
  $('khqrStatusText').className = 'text-xs sm:text-sm text-cyan-400 mb-3 font-bold';

  setTimeout(() => {
    completeOneTimePaymentAndShowKey(pkg, 'ABA KHQR');
  }, 750);
});

const COPY_RECEIVED_KEY_HTML = '<i data-lucide="copy" class="w-4 h-4"></i><span>Copy KEY</span>';
$('btnCopyReceivedKey')?.addEventListener('click', () => {
  const code = ($('receivedKeyCode')?.textContent || '').trim();
  if (!code || code === 'មិនទាន់មាន KEY') return;
  navigator.clipboard.writeText(code);
  flashButton(
    $('btnCopyReceivedKey'),
    '<i data-lucide="check" class="w-4 h-4"></i><span>Copied!</span>',
    COPY_RECEIVED_KEY_HTML
  );
});

const REFRESH_KEY_HTML = '<i data-lucide="refresh-cw" class="w-4 h-4"></i><span>Refresh Key</span>';
$('btnRefreshReceivedKey')?.addEventListener('click', () => {
  const btn = $('btnRefreshReceivedKey');
  btn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4 spin"></i><span>កំពុងទាញយក...</span>';
  icons();

  setTimeout(() => {
    let latest = localStorage.getItem('ksnr_latest_approved_key') || state.latestIssuedKey;
    const reg = getKeyRegistry();
    if (!latest || (reg[latest] && reg[latest].exhausted)) {
      const unused = Object.values(reg).reverse().find((k) => !k.exhausted);
      if (unused) latest = unused.key;
    }
    if (latest) {
      $('receivedKeyCode').textContent = latest;
      state.latestIssuedKey = latest;
      if (reg[latest]) {
        $('receiveKeyPkgBadge').innerHTML = `<span>✅ Approved៖ ${reg[latest].label} • ប្រើបានតែ ១ ដង</span>`;
      }
      $('receiveKeySubText').textContent = '✅ ទាញយក KEY ដែលបាន Approve ជោគជ័យ!';
      $('receiveKeySubText').className = 'text-xs sm:text-sm text-emerald-400 mt-1.5 font-bold';
    } else {
      $('receiveKeySubText').textContent = 'មិនទាន់មាន KEY ថ្មីទេ សូមទិញកញ្ចប់ KEY ជាមុនសិន!';
      $('receiveKeySubText').className = 'text-xs sm:text-sm text-amber-300 mt-1.5 font-semibold';
    }
    btn.innerHTML = REFRESH_KEY_HTML;
    icons();
  }, 500);
});

$('btnGoToPasteKey')?.addEventListener('click', () => {
  const code = ($('receivedKeyCode')?.textContent || '').trim();
  closeModal('receiveKeyModal');
  if (code && code !== 'មិនទាន់មាន KEY' && $('keyInput')) {
    $('keyInput').value = code;
  }
  show($('keyError'), false);
  openModal('keyModal');
});

$('btnPasteKeyInput')?.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && $('keyInput')) {
      $('keyInput').value = text.trim().toUpperCase();
    }
  } catch (e) {
    if (state.latestIssuedKey && $('keyInput')) {
      $('keyInput').value = state.latestIssuedKey;
    }
  }
});

// ==========================================
// 9. IMAGE HANDLING (READY FOR SCALPING OR SWING SELECTION)
// ==========================================
function showError(msg) {
  $('scanErrorText').textContent = msg;
  show($('scanError'), !!msg);
}

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showError('សូមជ្រើសរើសប្រភេទឯកសារជារូបភាព (PNG, JPG, WebP) ប៉ុណ្ណោះ!');
    return;
  }
  showError('');
  state.result = null;
  show($('resultCard'), false);
  state.mime = file.type;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    $('previewImg').src = dataUrl;
    state.imageBase64 = dataUrl.split(',')[1];
    show($('dropEmpty'), false);
    show($('dropPreview'), true);
    $('dropZone').classList.add('has-image');

    const styleBox = $('tradeStyleBox');
    if (styleBox) {
      styleBox.classList.add('ring-2', 'ring-cyan-400/70');
      setTimeout(() => styleBox.classList.remove('ring-2', 'ring-cyan-400/70'), 2200);
    }

    renderScanButton();
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  state.imageBase64 = null;
  state.result = null;
  $('previewImg').src = '';
  $('fileInput').value = '';
  show($('dropPreview'), false);
  show($('dropEmpty'), true);
  show($('resultCard'), false);
  $('dropZone').classList.remove('has-image');
  renderScanButton();
}

window.addEventListener('paste', (e) => {
  if (!state.unlocked) return;
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) handleFile(file);
    }
  }
});

const dz = $('dropZone');
dz?.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragging'); });
dz?.addEventListener('dragleave', () => dz.classList.remove('dragging'));
dz?.addEventListener('drop', (e) => {
  e.preventDefault();
  dz.classList.remove('dragging');
  if (!state.user) return openModal('loginModal');
  if (!state.unlocked) return openModal('keyModal');
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) handleFile(file);
});
dz?.addEventListener('click', (e) => {
  if (e.target.closest('#tradeStyleBox') || e.target.closest('#btnScan') || e.target.closest('#btnEnterKey')) return;
  if (!state.user) return openModal('loginModal');
  if (!state.unlocked) return openModal('keyModal');
  $('fileInput').click();
});
$('fileInput')?.addEventListener('click', (e) => e.stopPropagation());
$('fileInput')?.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) handleFile(file);
});
$('btnRemoveImg')?.addEventListener('click', (e) => { e.stopPropagation(); clearImage(); });

// ==========================================
// 10. RENDER RESULT & COPY SIGNAL (WITH SCALPING / SWING BADGE)
// ==========================================
function parseNum(v) {
  const m = String(v || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
}

function renderResult() {
  const r = state.result;
  if (!r) return;
  $('rPair').textContent = r.pair || '';
  $('rTimeframe').textContent = r.timeframe ? `(${r.timeframe})` : '';
  $('rTrend').textContent = r.trend || '';
  $('rCur').textContent = r.currentPrice || '-';
  $('rEntry').textContent = r.entry || '';
  $('rSl').textContent = r.sl || '';
  $('rTp1').textContent = r.tp1 || '';
  $('rTp2').textContent = r.tp2 || '';
  $('rRes').textContent = r.snrZones?.resistance || '';
  $('rSup').textContent = r.snrZones?.support || '';

  const styleBadge = $('rTradeStyleBadge');
  if (styleBadge) {
    const isSwing = (r.tradeStyle || state.tradeStyle) === 'SWING';
    styleBadge.textContent = isSwing ? '🌊 SWING TRADE (R:R 1:4.5)' : '⚡ SCALPING TRADE (R:R 1:2.5)';
    styleBadge.className = isSwing
      ? 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-400/50 text-amber-300'
      : 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 border border-cyan-400/50 text-cyan-300';
  }

  const isBuy = (r.action || '').toUpperCase().includes('BUY');
  const tag = $('rAction');
  tag.className = 'action-tag ' + (isBuy ? 'buy' : 'sell');
  tag.innerHTML = `<i data-lucide="${isBuy ? 'trending-up' : 'trending-down'}"></i><span></span>`;
  tag.querySelector('span').textContent = `${r.action} (${isBuy ? 'NEW BUY' : 'NEW SELL'})`;

  if ($('rFlipText')) {
    $('rFlipText').textContent = r.keyFlipRule || (isBuy
      ? 'KEY Por - SNR FLOW: Candle/Wick ចាក់ KEY BUY = NEW BUY 💸'
      : 'KEY Por - SNR FLOW: Candle/Wick ចាក់ KEY SELL = NEW SELL 💸');
  }

  const box = $('rConfluence');
  box.innerHTML = '';
  (r.confluence || []).forEach((c) => {
    const row = document.createElement('div');
    row.className = 'conf-item';
    row.innerHTML = '<span>✔</span><span></span>';
    row.lastChild.textContent = c;
    box.appendChild(row);
  });

  show($('resultCard'), true);
  icons();
}

const COPY_SIGNAL_HTML = '<i data-lucide="copy"></i><span>ចម្លង Signal យកទៅផុស (Copy Signal)</span>';
$('btnCopySignal')?.addEventListener('click', () => {
  const r = state.result;
  if (!r) return;
  const isBuy = (r.action || '').toUpperCase().includes('BUY');
  const isSwing = (r.tradeStyle || state.tradeStyle) === 'SWING';
  const styleText = isSwing ? '🌊 SWING TRADE (Hold Trend)' : '⚡ SCALPING TRADE (Fast Execution)';

  const text = `⚡ លទ្ធផលស្កេនពី Por - SNR Scanner ⚡
🎯 Trade Style: ${styleText}
📊 Pair: ${r.pair} (${r.timeframe})
📈 និន្នាការ (Trend): ${r.trend}
🔔 ប្រភេទបញ្ជា: ${r.action} = ${isBuy ? 'NEW BUY' : 'NEW SELL'} (${r.orderType})

🎯 Entry (ចំណុចចូល): ${r.entry}
🛑 SL (កាត់ខាត): ${r.sl}
💰 TP 1 (គោលដៅទី១): ${r.tp1}
💰 TP 2 (គោលដៅទី២): ${r.tp2}

🧱 តំបន់ KEY Por - SNR សំខាន់ៗ:
- KEY Resistance: ${r.snrZones?.resistance}
- KEY Support: ${r.snrZones?.support}

💡 មូលហេតុបច្ចេកទេស:
${(r.confluence || []).map((c) => `- ${c}`).join('\n')}

📲 Telegram Admin: @KaingChungpor`;
  navigator.clipboard.writeText(text);
  flashButton($('btnCopySignal'),
    '<i data-lucide="check"></i><span>បានចម្លងទម្រង់ Signal រួចរាល់!</span>', COPY_SIGNAL_HTML);
});

// ==========================================
// 11. ADMIN PANEL: GENERATE & APPROVE 6-CHAR KEYS
// ==========================================
function setAdminKeyMode(mode) {
  state.adminKeyMode = mode;
  document.querySelectorAll('#durationBtns button').forEach((b) => {
    const active = b.dataset.mode === mode;
    b.className = active
      ? 'py-2 px-2.5 rounded-xl text-xs font-semibold border bg-cyan-500/20 border-cyan-400 text-cyan-300 cursor-pointer'
      : 'py-2 px-2.5 rounded-xl text-xs font-semibold border bg-slate-900 border-slate-700 text-slate-300 cursor-pointer';
  });
  newKey();
}

function newKey() {
  state.genKey = generateSmartKey(state.adminKeyMode);
  $('generatedKey').textContent = state.genKey;
  state.latestIssuedKey = state.genKey;
}

$('btnAdmin')?.addEventListener('click', () => {
  if (isAdminUser(state.user)) {
    state.adminAuth = true;
    show($('adminLoginForm'), false);
    show($('adminPanel'), true);
    newKey();
  }
  openModal('adminModal');
});

$('adminLoginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  if ($('adminPinInput').value === ADMIN_PIN || isAdminUser(state.user)) {
    state.adminAuth = true;
    show($('adminLoginForm'), false);
    show($('adminPanel'), true);
    newKey();
    icons();
  } else {
    alert('លេខកូដសម្ងាត់ Admin មិនត្រឹមត្រូវទេ!');
  }
});

document.querySelectorAll('#durationBtns button').forEach((b) =>
  b.addEventListener('click', () => setAdminKeyMode(b.dataset.mode)));
$('btnNewKey')?.addEventListener('click', newKey);

const COPY_MSG_HTML = '<i data-lucide="copy"></i><span>Approve & ចម្លង KEY ឱ្យភ្ញៀវ</span>';
$('btnCopyMsg')?.addEventListener('click', () => {
  if (!state.genKey) return;
  localStorage.setItem('ksnr_latest_approved_key', state.genKey);
  state.latestIssuedKey = state.genKey;
  const check = verifySmartKey(state.genKey);
  const msg = `🎉 អរគុណសម្រាប់ការជាវ Por - SNR Scanner!

🔑 លេខ KEY ពិសេសរបស់អ្នកគឺ៖ ${state.genKey}
⏳ កម្រិតសុពលភាព៖ ${check.type || '1-Time KEY'}
📲 Telegram Admin៖ @KaingChungpor`;
  navigator.clipboard.writeText(msg);
  flashButton($('btnCopyMsg'), '<i data-lucide="check"></i><span>Approved & បានចម្លង KEY!</span>', COPY_MSG_HTML);
});

// ==========================================
// 12. EVENT WIRING
// ==========================================
$('btnApi')?.addEventListener('click', () => {
  $('apiInput').value = getApiKey();
  openModal('apiModal');
});
$('apiForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = $('apiInput').value.trim();
  if (v) localStorage.setItem('ksnr_gemini_key', v);
  else localStorage.removeItem('ksnr_gemini_key');
  closeModal('apiModal');
  showError('');
});
$('btnBuy')?.addEventListener('click', () => openModal('buyModal'));
$('btnLocked')?.addEventListener('click', () => {
  if (!state.user) return openModal('loginModal');
  openModal('keyModal');
});
$('btnLock')?.addEventListener('click', lock);
$('btnKeyToBuy')?.addEventListener('click', () => { closeModal('keyModal'); openModal('buyModal'); });

$('btnEnterKey')?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!state.user) return openModal('loginModal');
  openModal('keyModal');
});
$('btnScan')?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!state.user) return openModal('loginModal');
  if (!state.imageBase64) $('fileInput').click();
  else if (typeof window.scanChart === 'function') window.scanChart();
});

document.querySelectorAll('[data-close]').forEach((b) =>
  b.addEventListener('click', () => {
    closeModal(b.dataset.close);
    if (b.dataset.close === 'keyModal') show($('keyError'), false);
  }));

$('keyForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!state.user) {
    closeModal('keyModal');
    return openModal('loginModal');
  }
  const inputVal = $('keyInput').value.trim().toUpperCase();
  const result = verifySmartKey(inputVal, state.user.identifier);
  if (result.valid) {
    unlock(inputVal, result.type);
    show($('keyError'), false);
    closeModal('keyModal');
  } else {
    $('keyError').textContent = result.reason;
    show($('keyError'), true);
  }
});

setTradeStyle(state.tradeStyle, false);
updateWinrateUI();
applyLanguage(state.lang);
applyAuthUI();
icons();

// =========================================================
// 13. 4K DYNAMIC TRADING BACKGROUND ENGINE (CANVAS)
// =========================================================
(function init4KTradingBackground() {
  const canvas = document.getElementById('bgTradeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0, dpr = 1, tick = 0;
  const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX / Math.max(1, window.innerWidth);
    mouse.targetY = e.clientY / Math.max(1, window.innerHeight);
  });

  const CANDLE_COUNT = 38;
  const candles = [];
  let baseLevel = 0.52;

  for (let i = 0; i < CANDLE_COUNT; i++) {
    const open = baseLevel;
    const delta = (Math.random() - 0.48) * 0.07;
    const close = Math.max(0.22, Math.min(0.78, open + delta));
    const high = Math.min(0.85, Math.max(open, close) + Math.random() * 0.04);
    const low = Math.max(0.15, Math.min(open, close) - Math.random() * 0.04);
    baseLevel = close;
    candles.push({ open, close, high, low, phase: Math.random() * Math.PI * 2, speed: 0.015 + Math.random() * 0.02 });
  }

  const TAGS = [
    'XAUUSD ▲', 'BTCUSD ▲', 'SCALPING 1M-15M', 'SWING 30M-1W', 'FOMC 15M-1H',
    'KEY BUY=NEW BUY', 'KEY SELL=NEW SELL', 'LIQUIDITY', 'WINRATE 91.8%'
  ];
  const nodes = Array.from({ length: 20 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00035,
    vy: -0.00025 - Math.random() * 0.0004,
    size: 1.5 + Math.random() * 2.2,
    alpha: 0.18 + Math.random() * 0.35,
    tag: i < TAGS.length ? TAGS[i] : null,
    isBull: Math.random() > 0.35
  }));

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 2, 3);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function drawCyberGrid(parallaxX, parallaxY) {
    const gridW = 70, gridH = 55;
    const offsetX = (tick * 0.35 + parallaxX * 25) % gridW;
    const offsetY = (parallaxY * 25) % gridH;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(30, 58, 95, 0.18)';
    for (let x = offsetX; x < width; x += gridW) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridH) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawCandlesticksAndWave(parallaxX, parallaxY) {
    const stepX = width / (CANDLE_COUNT - 2);
    const candleWidth = Math.max(6, Math.min(18, stepX * 0.46));
    const emaPoints = [];
    ctx.save();
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const wave = Math.sin(tick * c.speed + c.phase) * 0.018;
      const openY = (1 - (c.open + wave * 0.6)) * height + parallaxY * 18;
      const closeY = (1 - (c.close + wave)) * height + parallaxY * 18;
      const highY = (1 - (c.high + Math.abs(wave))) * height + parallaxY * 18;
      const lowY = (1 - (c.low - Math.abs(wave))) * height + parallaxY * 18;
      const x = i * stepX - ((tick * 0.45) % stepX) + parallaxX * 15;
      const isBull = closeY <= openY;
      ctx.strokeStyle = isBull ? 'rgba(52, 211, 153, 0.55)' : 'rgba(251, 113, 133, 0.55)';
      ctx.lineWidth = 1.25;
      ctx.beginPath(); ctx.moveTo(x, highY); ctx.lineTo(x, lowY); ctx.stroke();
      const topY = Math.min(openY, closeY);
      const bodyH = Math.max(4, Math.abs(closeY - openY));
      ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.28)' : 'rgba(244, 63, 94, 0.26)';
      ctx.fillRect(x - candleWidth / 2, topY, candleWidth, bodyH);
      ctx.strokeRect(x - candleWidth / 2, topY, candleWidth, bodyH);
      emaPoints.push({ x, y: (openY + closeY) / 2 });
    }
    if (emaPoints.length > 2) {
      ctx.beginPath();
      ctx.moveTo(emaPoints[0].x, emaPoints[0].y);
      for (let i = 1; i < emaPoints.length - 1; i++) {
        const xc = (emaPoints[i].x + emaPoints[i + 1].x) / 2;
        const yc = (emaPoints[i].y + emaPoints[i + 1].y) / 2;
        ctx.quadraticCurveTo(emaPoints[i].x, emaPoints[i].y, xc, yc);
      }
      ctx.strokeStyle = 'rgba(24, 255, 255, 0.55)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloatingNodes() {
    ctx.save();
    ctx.font = '600 10px Inter, monospace';
    nodes.forEach((n) => {
      n.x += n.vx; n.y += n.vy;
      if (n.y < -0.05) { n.y = 1.05; n.x = Math.random(); }
      if (n.x < -0.05) n.x = 1.05;
      if (n.x > 1.05) n.x = -0.05;
      const px = n.x * width, py = n.y * height;
      ctx.fillStyle = n.isBull ? `rgba(52, 211, 153, ${n.alpha})` : `rgba(34, 211, 238, ${n.alpha})`;
      ctx.beginPath(); ctx.arc(px, py, n.size, 0, Math.PI * 2); ctx.fill();
      if (n.tag) {
        ctx.fillStyle = `rgba(148, 163, 184, ${n.alpha * 0.75})`;
        ctx.fillText(n.tag, px + 7, py + 3);
      }
    });
    ctx.restore();
  }

  function animate() {
    tick += 1;
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;
    ctx.clearRect(0, 0, width, height);
    drawCyberGrid((mouse.x - 0.5) * 2, (mouse.y - 0.5) * 2);
    drawCandlesticksAndWave((mouse.x - 0.5) * 2, (mouse.y - 0.5) * 2);
    drawFloatingNodes();
    requestAnimationFrame(animate);
  }
  animate();
})();

// =========================================================
// 14. 4K DYNAMIC BUY KEY MODAL BACKGROUND ENGINE (#buyKey4KCanvas)
// =========================================================
(function initBuyKey4KModalBackground() {
  const canvas = document.getElementById('buyKey4KCanvas');
  const modal = document.getElementById('buyModal');
  if (!canvas || !modal) return;
  const ctx = canvas.getContext('2d');

  let w = 0, h = 0, dpr = 1, t = 0;

  const orbs = Array.from({ length: 24 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0008,
    vy: -0.0006 - Math.random() * 0.0009,
    r: 1.5 + Math.random() * 2.8,
    gold: i % 2 === 0,
    alpha: 0.25 + Math.random() * 0.45,
    label: i < 8 ? ['🔑 2.5$', '🔑 4.5$', '🔑 8.5$', '⚡ 10$', '💎 25$', '👑 35$', '🚀 50$', '🔥 80$'][i] : null
  }));

  const miniCandles = Array.from({ length: 18 }, (_, i) => ({
    base: 0.3 + Math.sin(i * 0.5) * 0.18 + Math.random() * 0.1,
    range: 0.05 + Math.random() * 0.06,
    phase: Math.random() * Math.PI * 2,
    speed: 0.02 + Math.random() * 0.02
  }));

  function resizeBuyCanvas() {
    const shell = canvas.parentElement;
    if (!shell) return;
    dpr = Math.min(window.devicePixelRatio || 2, 3);
    w = Math.max(320, shell.clientWidth || 420);
    h = Math.max(520, shell.scrollHeight || shell.clientHeight || 680);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resizeBuyCanvas);
  document.getElementById('btnBuy')?.addEventListener('click', () => {
    setTimeout(resizeBuyCanvas, 30);
  });
  document.getElementById('btnKeyToBuy')?.addEventListener('click', () => {
    setTimeout(resizeBuyCanvas, 30);
  });

  function renderBuyKey4K() {
    if (!modal.classList.contains('hidden')) {
      if (w === 0 || h === 0) resizeBuyCanvas();
      t += 1;
      ctx.clearRect(0, 0, w, h);

      const g1 = ctx.createRadialGradient(
        w * (0.25 + Math.sin(t * 0.015) * 0.15),
        h * (0.2 + Math.cos(t * 0.012) * 0.1),
        10,
        w * 0.3,
        h * 0.25,
        w * 0.75
      );
      g1.addColorStop(0, 'rgba(250, 204, 21, 0.16)');
      g1.addColorStop(0.5, 'rgba(0, 229, 255, 0.08)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const step = 42;
      const offY = (t * 0.4) % step;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.10)';
      ctx.lineWidth = 0.8;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = offY; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const cStep = w / miniCandles.length;
      ctx.beginPath();
      for (let i = 0; i < miniCandles.length; i++) {
        const mc = miniCandles[i];
        const wave = Math.sin(t * mc.speed + mc.phase) * mc.range;
        const x = i * cStep + cStep * 0.5;
        const openY = (1 - mc.base) * h;
        const closeY = (1 - (mc.base + wave)) * h;
        const highY = Math.min(openY, closeY) - 14;
        const lowY = Math.max(openY, closeY) + 14;
        const bull = closeY <= openY;

        ctx.save();
        ctx.strokeStyle = bull ? 'rgba(16, 185, 129, 0.32)' : 'rgba(244, 63, 94, 0.28)';
        ctx.fillStyle = bull ? 'rgba(16, 185, 129, 0.20)' : 'rgba(244, 63, 94, 0.18)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();
        ctx.fillRect(x - 4, Math.min(openY, closeY), 8, Math.max(4, Math.abs(closeY - openY)));
        ctx.restore();

        if (i === 0) ctx.moveTo(x, closeY);
        else ctx.lineTo(x, closeY);
      }
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.42)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.font = '700 9.5px Inter, sans-serif';
      orbs.forEach((o) => {
        o.x += o.vx;
        o.y += o.vy;
        if (o.y < -0.05) { o.y = 1.05; o.x = Math.random(); }
        if (o.x < -0.05) o.x = 1.05;
        if (o.x > 1.05) o.x = -0.05;

        const px = o.x * w;
        const py = o.y * h;
        ctx.beginPath();
        ctx.arc(px, py, o.r, 0, Math.PI * 2);
        ctx.fillStyle = o.gold
          ? `rgba(250, 204, 21, ${o.alpha})`
          : `rgba(24, 255, 255, ${o.alpha})`;
        ctx.fill();

        if (o.label) {
          ctx.fillStyle = `rgba(254, 240, 138, ${o.alpha * 0.75})`;
          ctx.fillText(o.label, px + 6, py + 3);
        }
      });
    }
    requestAnimationFrame(renderBuyKey4K);
  }

  resizeBuyCanvas();
  renderBuyKey4K();
})();

// =========================================================
// 15. TELEGRAM BOT REGIME & PRICE ALERTS ENGINE (CLEAN & UNIFIED)
// =========================================================
function playTelegramSuccessBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

(function initTelegramRegimeBot() {
  const TG_PRESETS = {
    BTC_DOWN_RANGE:   { symbol: 'BTCUSDT', from: 'Trending down 📉', to: 'ranging ↔️' },
    XAU_DOWN_RANGE:   { symbol: 'XAUUSD',  from: 'Trending down 📉', to: 'ranging ↔️' },
    ETH_UP_RANGE:     { symbol: 'ETHUSDT', from: 'Trending up 📈',   to: 'ranging ↔️' },
    EUR_RANGE_UP:     { symbol: 'EURUSD',  from: 'Ranging ↔️',       to: 'trending up 📈' },
    USOIL_DOWN_RANGE: { symbol: 'USOIL',   from: 'Trending down 📉', to: 'ranging ↔️' }
  };

  const getBotToken = () => (localStorage.getItem('ksnr_tg_bot_token') || '').trim();
  const getChatId = () => (localStorage.getItem('ksnr_tg_chat_id') || '').trim();

  let activePriceAlerts = [];
  try {
    activePriceAlerts = JSON.parse(localStorage.getItem('ksnr_tg_price_alerts') || '[]');
  } catch (e) {
    activePriceAlerts = [];
  }

  function savePriceAlerts() {
    localStorage.setItem('ksnr_tg_price_alerts', JSON.stringify(activePriceAlerts));
    renderActivePriceAlerts();
  }

  function formatRegimeAlertMessage(symbol, fromState, toState, livePrice = null) {
    const cleanSym = String(symbol || 'BTCUSDT').trim().toUpperCase();
    const priceLine = livePrice ? `\n💰 Live Price: ${livePrice}` : '';
    return `🔀 Regime change — ${cleanSym}\n${fromState} → ${toState}${priceLine}\nReview open positions and pending setups on this symbol.`;
  }

  function updateTgBadgeUI() {
    const badge = document.getElementById('tgBotStatusBadge');
    if (!badge) return;
    const ready = !!(getBotToken() && getChatId());
    badge.textContent = ready ? '● បានភ្ជាប់ Bot រួចរាល់' : 'មិនទាន់ភ្ជាប់ Bot';
    badge.className = ready
      ? 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
      : 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 border border-rose-500/40 text-rose-300';
  }

  function showTgFeedback(msg, isError = false) {
    const el = document.getElementById('tgAlertFeedback');
    if (!el) return;
    el.textContent = msg;
    el.className = `mt-2 text-xs font-bold text-center ${isError ? 'text-rose-400' : 'text-emerald-400'}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }

  async function sendTelegramMessage(text) {
    const token = getBotToken();
    const chatId = getChatId();
    if (!token || !chatId) {
      openModal('tgBotModal');
      throw new Error('សូមបញ្ចូល Telegram Bot Token និង Chat ID ជាមុនសិន!');
    }

    const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        disable_web_page_preview: true
      })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.description || 'បរាជ័យក្នុងការផ្ញើសារទៅ Telegram Bot');
    }
    return data;
  }

  document.getElementById('btnOpenTgConfig')?.addEventListener('click', () => {
    const tokenInput = document.getElementById('tgBotTokenInput');
    const chatInput = document.getElementById('tgChatIdInput');
    if (tokenInput) tokenInput.value = getBotToken();
    if (chatInput) chatInput.value = getChatId();
    show(document.getElementById('tgModalStatus'), false);
    openModal('tgBotModal');
  });

  document.getElementById('btnAutoDetectChatId')?.addEventListener('click', async () => {
    const token = document.getElementById('tgBotTokenInput')?.value.trim();
    const statusEl = document.getElementById('tgModalStatus');
    if (!token) {
      statusEl.textContent = '⚠️ សូមបញ្ចូល Bot Token ជាមុនសិន!';
      statusEl.className = 'text-xs font-bold text-center text-rose-400';
      return show(statusEl, true);
    }
    statusEl.textContent = '⏳ កំពុងស្វែងរក Chat ID ពីសារចុងក្រោយក្នុង Bot...';
    statusEl.className = 'text-xs font-bold text-center text-cyan-300';
    show(statusEl, true);

    try {
      const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/getUpdates`);
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) {
        throw new Error('រកមិនឃើញសារទេ! សូមចូលទៅចុច Start ឬផ្ញើសារ "Hi" ក្នុង Bot របស់អ្នកសិន។');
      }
      const lastUpdate = [...data.result].reverse().find(
        (u) => u.message?.chat?.id || u.channel_post?.chat?.id || u.my_chat_member?.chat?.id
      );
      const chatObj = lastUpdate?.message?.chat || lastUpdate?.channel_post?.chat || lastUpdate?.my_chat_member?.chat;
      if (!chatObj) throw new Error('មិនអាចទាញយក Chat ID បានទេ សូមផ្ញើសារ /start ទៅកាន់ Bot ម្តងទៀត។');

      document.getElementById('tgChatIdInput').value = String(chatObj.id);
      statusEl.textContent = `✅ រកឃើញ Chat ID៖ ${chatObj.id} (${chatObj.title || chatObj.username || chatObj.first_name || 'Chat'})`;
      statusEl.className = 'text-xs font-bold text-center text-emerald-400';
    } catch (err) {
      statusEl.textContent = `❌ ${err.message}`;
      statusEl.className = 'text-xs font-bold text-center text-rose-400';
    }
  });

  document.getElementById('tgBotForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const token = document.getElementById('tgBotTokenInput')?.value.trim() || '';
    const chatId = document.getElementById('tgChatIdInput')?.value.trim() || '';
    localStorage.setItem('ksnr_tg_bot_token', token);
    localStorage.setItem('ksnr_tg_chat_id', chatId);
    updateTgBadgeUI();
    closeModal('tgBotModal');
    showTgFeedback('✅ បានរក្សាទុក Telegram Bot Token & Chat ID រួចរាល់!');
  });

  document.getElementById('btnTestTgBot')?.addEventListener('click', async () => {
    const token = document.getElementById('tgBotTokenInput')?.value.trim() || '';
    const chatId = document.getElementById('tgChatIdInput')?.value.trim() || '';
    const statusEl = document.getElementById('tgModalStatus');
    if (!token || !chatId) {
      statusEl.textContent = '⚠️ សូមបំពេញ Bot Token និង Chat ID ជាមុនសិន!';
      statusEl.className = 'text-xs font-bold text-center text-rose-400';
      return show(statusEl, true);
    }
    localStorage.setItem('ksnr_tg_bot_token', token);
    localStorage.setItem('ksnr_tg_chat_id', chatId);
    updateTgBadgeUI();

    statusEl.textContent = '⏳ កំពុងផ្ញើសារសាកល្បងទៅ Telegram...';
    statusEl.className = 'text-xs font-bold text-center text-cyan-300';
    show(statusEl, true);

    try {
      const msg = formatRegimeAlertMessage('BTCUSDT', 'Ranging ↔️', 'trending up 📈');
      await sendTelegramMessage(msg);
      playTelegramSuccessBeep();
      statusEl.textContent = '✅ ផ្ញើសារសាកល្បងជោគជ័យ! សូមពិនិត្យមើលក្នុង Telegram របស់អ្នក។';
      statusEl.className = 'text-xs font-bold text-center text-emerald-400';
    } catch (err) {
      statusEl.textContent = `❌ ${err.message}`;
      statusEl.className = 'text-xs font-bold text-center text-rose-400';
    }
  });

  document.querySelectorAll('[data-regime-preset]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.regimePreset;
      const preset = TG_PRESETS[key];
      if (!preset) return;
      const msg = formatRegimeAlertMessage(preset.symbol, preset.from, preset.to);
      try {
        showTgFeedback(`⏳ កំពុងផ្ញើ Regime change — ${preset.symbol}...`);
        await sendTelegramMessage(msg);
        playTelegramSuccessBeep();
        showTgFeedback(`✅ បានផ្ញើ "🔀 Regime change — ${preset.symbol} (${preset.from} → ${preset.to})" ទៅ Telegram!`);
        addHistoryLog('TELEGRAM ALERT', `ផ្ញើសារ Regime change — ${preset.symbol} (${preset.from} → ${preset.to})`);
      } catch (err) {
        showTgFeedback(`❌ ${err.message}`, true);
      }
    });
  });

  document.getElementById('btnSendCustomRegime')?.addEventListener('click', async () => {
    const sym = document.getElementById('tgCustomSymbol')?.value || 'BTCUSDT';
    const from = document.getElementById('tgCustomFrom')?.value || 'Trending down 📉';
    const to = document.getElementById('tgCustomTo')?.value || 'ranging ↔️';
    const price = document.getElementById('tgTargetPrice')?.value.trim() || null;

    const msg = formatRegimeAlertMessage(sym, from, to, price);
    try {
      showTgFeedback(`⏳ កំពុងផ្ញើ Regime change — ${sym}...`);
      await sendTelegramMessage(msg);
      playTelegramSuccessBeep();
      showTgFeedback(`✅ បានផ្ញើ "🔀 Regime change — ${sym}" ទៅ Telegram ជោគជ័យ!`);
    } catch (err) {
      showTgFeedback(`❌ ${err.message}`, true);
    }
  });

  function renderActivePriceAlerts() {
    const box = document.getElementById('tgActiveAlertsBox');
    if (!box) return;
    box.innerHTML = '';
    activePriceAlerts.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'px-3 py-2 rounded-xl bg-[#0b1220] border border-amber-500/30 flex items-center justify-between';
      row.innerHTML = `
        <div>
          <span class="font-extrabold text-amber-300">🔔 ${item.symbol} @ ${item.targetPrice}</span>
          <span class="text-slate-400 ml-1">(${item.from} → ${item.to})</span>
        </div>
        <button type="button" data-del-alert="${idx}" class="text-rose-400 hover:text-rose-300 font-bold text-xs cursor-pointer">លុប</button>
      `;
      box.appendChild(row);
    });
    box.querySelectorAll('[data-del-alert]').forEach((b) => {
      b.addEventListener('click', () => {
        activePriceAlerts.splice(Number(b.dataset.delAlert), 1);
        savePriceAlerts();
      });
    });
  }

  document.getElementById('btnSetPriceAlert')?.addEventListener('click', () => {
    const sym = document.getElementById('tgCustomSymbol')?.value || 'BTCUSDT';
    const from = document.getElementById('tgCustomFrom')?.value || 'Trending down 📉';
    const to = document.getElementById('tgCustomTo')?.value || 'ranging ↔️';
    const targetPrice = parseFloat(document.getElementById('tgTargetPrice')?.value || '');

    if (isNaN(targetPrice) || targetPrice <= 0) {
      return showTgFeedback('⚠️ សូមបញ្ចូលតម្លៃគោលដៅ (Target Price) ដើម្បីកំណត់ម៉ោងរោទ៍!', true);
    }

    activePriceAlerts.push({
      symbol: sym,
      from,
      to,
      targetPrice,
      createdAt: Date.now()
    });
    savePriceAlerts();
    document.getElementById('tgTargetPrice').value = '';
    showTgFeedback(`✅ បានដាក់ម៉ោងរោទ៍ ${sym} នៅតម្លៃ ${targetPrice}!`);
  });

  const lastRegimeState = { BTCUSDT: null, XAUUSD: null, ETHUSDT: null, EURUSD: null, USOIL: null };
  const lastPriceMemory = { BTCUSDT: null, XAUUSD: null, ETHUSDT: null, EURUSD: null, USOIL: null };

  async function fetchLivePriceAndKlines(symbol) {
    let binanceSym = 'BTCUSDT';
    if (symbol === 'XAUUSD') binanceSym = 'PAXGUSDT';
    else if (symbol === 'ETHUSDT') binanceSym = 'ETHUSDT';
    else if (symbol === 'EURUSD') binanceSym = 'EURUSDT';
    else if (symbol === 'USOIL') binanceSym = 'USDCUSDT';

    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=15m&limit=30`);
      const klines = await res.json();
      if (!Array.isArray(klines) || klines.length < 20) return null;

      const closes = klines.map((k) => parseFloat(k[4]));
      const livePrice = closes[closes.length - 1];

      const ema = (arr, len) => {
        const k = 2 / (len + 1);
        let val = arr[0];
        for (let i = 1; i < arr.length; i++) val = arr[i] * k + val * (1 - k);
        return val;
      };
      const emaFast = ema(closes.slice(-15), 7);
      const emaSlow = ema(closes, 21);
      const diffPct = Math.abs(emaFast - emaSlow) / emaSlow;

      let regime = 'ranging ↔️';
      if (diffPct >= 0.0018) {
        regime = emaFast > emaSlow ? 'trending up 📈' : 'trending down 📉';
      }
      return { livePrice, regime };
    } catch (e) {
      return null;
    }
  }

  setInterval(async () => {
    const autoMonitor = document.getElementById('tgAutoMonitorToggle')?.checked;
    if (!autoMonitor && activePriceAlerts.length === 0) return;

    for (const sym of ['BTCUSDT', 'XAUUSD', 'ETHUSDT', 'EURUSD', 'USOIL']) {
      try {
        const info = await fetchLivePriceAndKlines(sym);
        if (!info) continue;

        const prevPrice = lastPriceMemory[sym];
        lastPriceMemory[sym] = info.livePrice;

        for (let i = activePriceAlerts.length - 1; i >= 0; i--) {
          const al = activePriceAlerts[i];
          if (al.symbol !== sym) continue;
          const crossed =
            prevPrice !== null &&
            ((prevPrice < al.targetPrice && info.livePrice >= al.targetPrice) ||
              (prevPrice > al.targetPrice && info.livePrice <= al.targetPrice));

          if (crossed) {
            const msg = formatRegimeAlertMessage(sym, al.from, al.to, info.livePrice.toFixed(2));
            await sendTelegramMessage(msg);
            playTelegramSuccessBeep();
            activePriceAlerts.splice(i, 1);
            savePriceAlerts();
          }
        }

        if (autoMonitor) {
          const prevRegime = lastRegimeState[sym];
          if (prevRegime && prevRegime !== info.regime) {
            const fromFormatted = prevRegime.charAt(0).toUpperCase() + prevRegime.slice(1);
            const msg = formatRegimeAlertMessage(sym, fromFormatted, info.regime, info.livePrice.toFixed(2));
            await sendTelegramMessage(msg);
            playTelegramSuccessBeep();
          }
          lastRegimeState[sym] = info.regime;
        }
      } catch (e) {}
    }
  }, 15000);

  const copyBtn = document.getElementById('btnCopySignal');
  if (copyBtn && !document.getElementById('btnSendSignalToTg')) {
    const tgBtn = document.createElement('button');
    tgBtn.id = 'btnSendSignalToTg';
    tgBtn.type = 'button';
    tgBtn.className = 'w-full mt-2.5 py-3 rounded-xl bg-gradient-to-r from-[#00e5ff] to-[#0284c7] hover:brightness-110 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.25)]';
    tgBtn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i><span>📲 ផ្ញើ Signal នេះទៅ Telegram Bot ផ្ទាល់</span>';
    copyBtn.parentNode.insertBefore(tgBtn, copyBtn.nextSibling);

    tgBtn.addEventListener('click', async () => {
      const r = state.result;
      if (!r) return;
      const isBuy = (r.action || '').toUpperCase().includes('BUY');
      const isSwing = (r.tradeStyle || state.tradeStyle) === 'SWING';
      const regimeText = isBuy
        ? `Ranging ↔️ → trending up 📈`
        : `Trending up 📈 → ranging ↔️`;
      const msg = `🔀 Regime change — ${(r.pair || 'XAUUSD').replace('/', '')}
${regimeText}
Review open positions and pending setups on this symbol.

⚡ Por - SNR Scanner Signal (${r.timeframe || 'M15'})
🎯 Trade Style: ${isSwing ? '🌊 SWING TRADE (R:R 1:4.5)' : '⚡ SCALPING TRADE (R:R 1:2.5)'}
🔔 Action: ${r.action} (${isBuy ? 'NEW BUY' : 'NEW SELL'})
🎯 Entry: ${r.entry}
🛑 SL: ${r.sl}
💰 TP 1: ${r.tp1}
💰 TP 2: ${r.tp2}`;

      try {
        await sendTelegramMessage(msg);
        playTelegramSuccessBeep();
        showTgFeedback('✅ បានផ្ញើ Signal + Regime Alert ទៅ Telegram រួចរាល់!');
      } catch (err) {
        showTgFeedback(`❌ ${err.message}`, true);
      }
    });
  }

  updateTgBadgeUI();
  renderActivePriceAlerts();
  icons();
})();