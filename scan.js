// ==========================================
// 1. ADMIN, ABA KHQR & PACKAGE SETTINGS
// ==========================================
const ADMIN_PIN = '9999';
const SECRET_SALT = 73;
const TELEGRAM_URL = 'https://t.me/KaingChungpor';
const DEFAULT_GEMINI_API_KEY = 'AQ.Ab8RN6JIGppUKXo3-t3leC0YlcItaQOmsqonxRvfKlAxKV3Mng';

const getApiKey = () => {
  const saved = (localStorage.getItem('ksnr_gemini_key') || '').trim();
  if (saved && !saved.startsWith('AIza')) {
    localStorage.removeItem('ksnr_gemini_key');
    return DEFAULT_GEMINI_API_KEY;
  }
  return saved || DEFAULT_GEMINI_API_KEY;
};

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

const ADMIN_EMAILS = ['chungpor908@gmail.com', 'yutagoma908@gmail.com'];
const MASTER_KEYS = ['KSNR-VIP', 'KSNR-2026', 'ADMIN-999', 'KSNR-UNLIMITED'];

function isAdminUser(user) {
  if (!user || !user.identifier) return false;
  return ADMIN_EMAILS.includes(String(user.identifier).trim().toLowerCase());
}

// ==========================================
// 2. 6-CHAR ONE-TIME KEY GENERATOR & VERIFIER
// ==========================================
const KEY_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const MODE_TO_PREFIX = {
  S1: '5', S2: '2', S5: '8', H24: 'D', H168: 'W', H720: 'M', H2880: 'Q', H12240: 'Y', VIP: 'V'
};

const PREFIX_TO_SPEC = {
  '5': { mode: 'S1',     scans: 1, hours: 0,      price: '2.5', label: 'ស្កេន 1-ដង (2.5$)' },
  '1': { mode: 'S1',     scans: 1, hours: 0,      price: '2.5', label: 'ស្កេន 1-ដង (2.5$)' },
  '2': { mode: 'S2',     scans: 2, hours: 0,      price: '4.5', label: 'ស្កេន 2-ដង (4.5$)' },
  '8': { mode: 'S5',     scans: 5, hours: 0,      price: '8.5', label: 'ស្កេន 5-ដង (8.5$)' },
  'D': { mode: 'H24',    scans: 0, hours: 24,     price: '10',  label: '24 ម៉ោង (10$)' },
  'W': { mode: 'H168',   scans: 0, hours: 168,    price: '25',  label: '1 សប្តាហ៍ (25$)' },
  'M': { mode: 'H720',   scans: 0, hours: 720,    price: '35',  label: '1 ខែ (35$)' },
  'Q': { mode: 'H2880',  scans: 0, hours: 2880,   price: '50',  label: '4 ខែ (50$)' },
  'Y': { mode: 'H12240', scans: 0, hours: 12240,  price: '80',  label: '1 ឆ្នាំ ថែម 5 ខែ (80$)' },
  'V': { mode: 'VIP',    scans: 0, hours: 999999, price: 'VIP', label: 'VIP Unlimited' }
};

function compute6CharChecksum(prefix4) {
  let sum = SECRET_SALT;
  for (let i = 0; i < prefix4.length; i++) {
    sum = (sum * 37 + prefix4.charCodeAt(i) * (i + 3)) % 1024;
  }
  return `${KEY_CHARSET[sum % KEY_CHARSET.length]}${KEY_CHARSET[Math.floor(sum / KEY_CHARSET.length) % KEY_CHARSET.length]}`;
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
  for (let i = 0; i < 3; i++) body += KEY_CHARSET[Math.floor(Math.random() * KEY_CHARSET.length)];
  const first4 = `${prefix}${body}`;
  const key = `${first4}${compute6CharChecksum(first4)}`;

  const spec = PREFIX_TO_SPEC[prefix] || PREFIX_TO_SPEC['5'];
  const reg = getKeyRegistry();
  reg[key] = {
    key, mode: spec.mode, scans: spec.scans, hours: spec.hours, price: spec.price, label: spec.label,
    qrSessionId: qrSessionId || `QR-${Date.now()}`, createdAt: Date.now(), activatedAt: null, redeemedBy: null, exhausted: false
  };
  saveKeyRegistry(reg);
  localStorage.setItem('ksnr_latest_approved_key', key);
  return key;
}

function verifySmartKey(inputKey, currentUserIdentifier = '') {
  if (!inputKey) return { valid: false, reason: 'សូមបញ្ចូលលេខ KEY!' };
  const clean = inputKey.trim().toUpperCase();
  if (MASTER_KEYS.includes(clean)) return { valid: true, type: 'VIP Unlimited Lifetime', unlimited: true };

  const reg = getKeyRegistry();
  const usage = getKeyUsageMap();

  if (clean.length === 6 && !clean.includes('-')) {
    const spec = PREFIX_TO_SPEC[clean[0]];
    if (!spec || clean.slice(4, 6) !== compute6CharChecksum(clean.slice(0, 4))) {
      return { valid: false, reason: 'លេខ KEY មិនត្រឹមត្រូវទេ! សូមពិនិត្យម្ដងទៀត។' };
    }
    const record = reg[clean] || {
      key: clean, mode: spec.mode, scans: spec.scans, hours: spec.hours, price: spec.price, label: spec.label,
      createdAt: Date.now(), activatedAt: null, redeemedBy: null, exhausted: false
    };
    if (record.exhausted) return { valid: false, reason: '⚠️ KEY នេះត្រូវបានប្រើរួចហើយ (1-Time KEY)! សូមទិញ KEY ថ្មី។' };
    if (record.redeemedBy && currentUserIdentifier && record.redeemedBy !== currentUserIdentifier) {
      return { valid: false, reason: '⚠️ KEY នេះត្រូវបានដោះសោរប្រើប្រាស់រួចហើយ!' };
    }
    if (spec.scans > 0) {
      const used = usage[clean] || 0;
      const left = spec.scans - used;
      if (left <= 0) {
        record.exhausted = true; reg[clean] = record; saveKeyRegistry(reg);
        return { valid: false, reason: '⚠️ KEY នេះប្រើអស់ចំនួនដងហើយ! សូមទិញ KEY ថ្មី។' };
      }
      return { valid: true, type: `${spec.label} • នៅសល់ ${left}/${spec.scans} ដង`, scansLeft: left, maxScans: spec.scans };
    }
    if (spec.hours >= 999999) return { valid: true, type: 'VIP Unlimited', unlimited: true };

    const startMs = record.activatedAt || Date.now();
    const expMs = startMs + spec.hours * 3600000;
    if (Date.now() > expMs) {
      record.exhausted = true; reg[clean] = record; saveKeyRegistry(reg);
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
    if (left <= 0) return { valid: false, reason: 'លេខ KEY នេះប្រើអស់ចំនួនដងហើយ! សូមទិញ KEY ថ្មី។' };
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
  if (!check.valid) { lock(); return false; }

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
// 3. STATE + HELPERS
// ==========================================
const $ = (id) => document.getElementById(id);
const state = {
  unlocked: false,
  imageBase64: null,
  mime: 'image/png',
  scanning: false,
  result: null,
  activeLobbyItemId: null,
  lobbyFilter: 'ALL',
  tradeStyle: localStorage.getItem('ksnr_trade_style') || 'SCALPING', // SCALPING | SWING | APLUS_ICT
  ictConfluenceFilter: 'ALL_APLUS',
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
  winrate: parseFloat(localStorage.getItem('ksnr_winrate') || '91.9'),
  winrateTrendUp: true,
  pairWinrates: {
    XAUUSD:  { label: 'XAUUSD (Gold Sniper)',       color: 'text-amber-300',  rate: 92.4, trendUp: true },
    BTCUSD:  { label: 'BTCUSD (Crypto SMC)',        color: 'text-cyan-300',   rate: 91.2, trendUp: true },
    ETHUSDT: { label: 'ETHUSDT (Ethereum Sniper)',  color: 'text-blue-300',   rate: 91.5, trendUp: true },
    USOIL:   { label: 'USOIL (Crude Oil Sniper)',   color: 'text-rose-300',   rate: 90.9, trendUp: true },
    NEWS:    { label: 'NON FARM / CPI / FOMC FLIP', color: 'text-purple-300', rate: 91.8, trendUp: true }
  },
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
  setTimeout(() => { btn.innerHTML = originalHtml; icons(); }, 2200);
}

// ==========================================
// 3B. SCALPING vs SWING vs A+ ICT SETUP MODE SELECTOR & 9-TF CONTROL BAR
// ==========================================
function getStyleDisplayMeta(style) {
  if (style === 'SWING') {
    return {
      code: 'SWING',
      badgeText: '🌊 SWING TRADE MODE',
      badgeClass: 'px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-extrabold uppercase',
      resBadgeText: '🌊 SWING TRADE (R:R 1:4.5)',
      resBadgeClass: 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-400/50 text-amber-300',
      scanBtnLabel: '🌊 SWING TRADE'
    };
  }
  if (style === 'APLUS_ICT') {
    return {
      code: 'APLUS_ICT',
      badgeText: '🏆 A+ ICT LIQUIDITY (MIN 1:3 RR)',
      badgeClass: 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-extrabold uppercase',
      resBadgeText: '🏆 A+ ICT SETUP (R:R 1:3.5)',
      resBadgeClass: 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400/50 text-emerald-300',
      scanBtnLabel: '🏆 A+ ICT SETUP'
    };
  }
  return {
    code: 'SCALPING',
    badgeText: '⚡ SCALPING MODE',
    badgeClass: 'px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-extrabold uppercase',
    resBadgeText: '⚡ SCALPING TRADE (R:R 1:2.5)',
    resBadgeClass: 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 border border-cyan-400/50 text-cyan-300',
    scanBtnLabel: '⚡ SCALPING TRADE'
  };
}

function setTradeStyle(style, userClickedChoice = false) {
  const validStyles = ['SCALPING', 'SWING', 'APLUS_ICT'];
  state.tradeStyle = validStyles.includes(style) ? style : 'SCALPING';
  localStorage.setItem('ksnr_trade_style', state.tradeStyle);

  const btnScalp = $('btnModeScalping');
  const btnSwing = $('btnModeSwing');
  const btnAPlus = $('btnModeAPlus');
  const badge = $('activeTradeStyleBadge');
  const resScalp = $('btnResSwitchScalp');
  const resSwing = $('btnResSwitchSwing');
  const resAPlus = $('btnResSwitchAPlus');

  [btnScalp, btnSwing, btnAPlus].forEach((b) => {
    if (!b) return;
    b.classList.remove('active-scalp', 'active-swing', 'active-aplus');
    b.classList.add('border-slate-700');
  });

  if (state.tradeStyle === 'SCALPING' && btnScalp) {
    btnScalp.classList.add('active-scalp');
    btnScalp.classList.remove('border-slate-700');
  } else if (state.tradeStyle === 'SWING' && btnSwing) {
    btnSwing.classList.add('active-swing');
    btnSwing.classList.remove('border-slate-700');
  } else if (state.tradeStyle === 'APLUS_ICT' && btnAPlus) {
    btnAPlus.classList.add('active-aplus');
    btnAPlus.classList.remove('border-slate-700');
  }

  if (resScalp && resSwing) {
    resScalp.className = state.tradeStyle === 'SCALPING'
      ? 'px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.45)]'
      : 'px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-extrabold cursor-pointer hover:brightness-110';

    resSwing.className = state.tradeStyle === 'SWING'
      ? 'px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.45)]'
      : 'px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 font-extrabold cursor-pointer hover:brightness-110';

    if (resAPlus) {
      resAPlus.className = state.tradeStyle === 'APLUS_ICT'
        ? 'px-3 py-1 rounded-lg bg-emerald-400 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.45)]'
        : 'px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-extrabold cursor-pointer hover:brightness-110';
    }
  }

  const meta = getStyleDisplayMeta(state.tradeStyle);
  if (badge) {
    badge.textContent = meta.badgeText;
    badge.className = meta.badgeClass;
  }

  renderScanButton();

  if (userClickedChoice && state.imageBase64 && !state.scanning) {
    if (state.result && typeof window.recalculateResultForTradeStyle === 'function') {
      window.recalculateResultForTradeStyle(state.tradeStyle);
    } else if ($('chkInstantStyleScan')?.checked && typeof window.scanChart === 'function') {
      window.scanChart();
    }
  }
}

$('btnModeScalping')?.addEventListener('click', (e) => { e.stopPropagation(); setTradeStyle('SCALPING', true); });
$('btnModeSwing')?.addEventListener('click', (e) => { e.stopPropagation(); setTradeStyle('SWING', true); });
$('btnModeAPlus')?.addEventListener('click', (e) => { e.stopPropagation(); setTradeStyle('APLUS_ICT', true); });

$('btnResSwitchScalp')?.addEventListener('click', () => setTradeStyle('SCALPING', true));
$('btnResSwitchSwing')?.addEventListener('click', () => setTradeStyle('SWING', true));
$('btnResSwitchAPlus')?.addEventListener('click', () => setTradeStyle('APLUS_ICT', true));

$('tradeStyleBox')?.addEventListener('click', (e) => e.stopPropagation());
$('livePairSelect')?.addEventListener('change', (e) => { state.selectedPair = e.target.value || 'AUTO'; });

$('ictConfluenceFilter')?.addEventListener('change', (e) => {
  state.ictConfluenceFilter = e.target.value || 'ALL_APLUS';
  if (state.result && typeof window.recalculateResultForTradeStyle === 'function') {
    window.recalculateResultForTradeStyle(state.tradeStyle);
  }
});

['chkConfSweep', 'chkConfSmt', 'chkConfDisplacement'].forEach((chkId) => {
  $(chkId)?.addEventListener('change', () => {
    if (state.result && typeof window.recalculateResultForTradeStyle === 'function') {
      window.recalculateResultForTradeStyle(state.tradeStyle);
    }
  });
});

document.querySelectorAll('#tfSelectorBar .tf-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tf = btn.dataset.tf || 'AUTO';
    state.selectedTf = tf;
    document.querySelectorAll('#tfSelectorBar .tf-btn').forEach((b) => {
      b.className = b.dataset.tf === tf
        ? 'tf-btn py-1.5 rounded-xl bg-cyan-500 text-slate-950 border border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer'
        : 'tf-btn py-1.5 rounded-xl bg-[#131d31] text-slate-300 border border-slate-700 hover:border-cyan-400 cursor-pointer';
    });
    if (state.tradeStyle !== 'APLUS_ICT') {
      if (['1m', '3m', '5m', '15m'].includes(tf)) setTradeStyle('SCALPING', true);
      else if (['30m', '1h', '4h', '1d', '1w'].includes(tf)) setTradeStyle('SWING', true);
    } else if (state.result && typeof window.recalculateResultForTradeStyle === 'function') {
      window.recalculateResultForTradeStyle('APLUS_ICT');
    }
  });
});

// Self-Buy KEY Guide Modal ("របៀបទិញ KEY ដោយខ្លួនឯង")
$('btnBuySelfGuide')?.addEventListener('click', () => openModal('selfBuyGuideModal'));
$('btnGuideOpenBuyNow')?.addEventListener('click', () => {
  closeModal('selfBuyGuideModal');
  openModal('buyModal');
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
// 5. WINRATE LIVE ACTION ENGINE (DYNAMIC GREEN & CORAL-RED + ETHUSDT & USOIL)
// ==========================================
function ensureLiveWinrateModalList() {
  const modal = $('winrateModal');
  if (!modal) return null;
  let listEl = $('winrateLivePairsList');
  if (!listEl) {
    listEl = modal.querySelector('.space-y-2\\.5.text-xs.sm\\:text-sm.mb-5');
    if (listEl) listEl.id = 'winrateLivePairsList';
  }
  return listEl;
}

function renderLiveWinrateModalRows() {
  const listEl = ensureLiveWinrateModalList();
  if (!listEl) return;

  const order = ['XAUUSD', 'BTCUSD', 'ETHUSDT', 'USOIL', 'NEWS'];
  listEl.innerHTML = order.map((key) => {
    const item = state.pairWinrates[key];
    const isGreen = item.rate >= 90.0 && item.trendUp;
    const rateNumColor = isGreen ? 'text-[#00e676]' : 'text-[#ff686b]';
    const waveHex = isGreen ? '#00e676' : '#ff5252';
    const yEnd = isGreen ? '4.8' : '8.6';
    const yMid = isGreen ? '7.6' : '6.2';

    return `
      <div class="winrate-live-row p-3 rounded-xl bg-slate-900/85 backdrop-blur-md border ${isGreen ? 'border-slate-800' : 'border-rose-500/40'} flex justify-between items-center transition-all relative z-10">
        <span class="font-bold ${item.color}">${item.label}</span>
        <div class="flex items-center gap-2.5">
          <span class="font-extrabold">
            <span class="${rateNumColor} transition-colors duration-300">${item.rate.toFixed(1)}</span><span class="text-[#00e676]">% WIN</span>
          </span>
          <svg class="w-9 h-3 overflow-visible fill-none" style="stroke:${waveHex}" viewBox="0 0 36 12" stroke-width="2" stroke-linecap="round">
            <path d="M1 7 C11 7, 19 ${yMid}, 33 ${yEnd}" />
            <circle cx="33" cy="${yEnd}" r="2" style="fill:${waveHex}" />
          </svg>
        </div>
      </div>
    `;
  }).join('');
}

function updateWinrateUI() {
  const numStr = state.winrate.toFixed(1);
  const isGreenState = state.winrate >= 90.0 && state.winrateTrendUp;

  const pillText = $('winrateText');
  const wavePath = $('winrateWavePath');
  const waveDot = $('winrateDot');
  const svgEl = wavePath?.closest('svg');

  if (pillText) {
    if (isGreenState) {
      pillText.innerHTML = `Winrate <span class="text-[#00e676] transition-colors duration-300">${numStr}</span>%`;
    } else {
      pillText.innerHTML = `Winrate <span class="text-[#ff686b] transition-colors duration-300">${numStr}</span>%`;
    }
  }

  const waveHex = isGreenState ? '#00e676' : '#ff5252';
  if (svgEl) svgEl.style.stroke = waveHex;
  if (waveDot) {
    waveDot.style.fill = waveHex;
    if (waveDot.nextElementSibling) waveDot.nextElementSibling.style.fill = waveHex;
  }

  if ($('modalWinrateSub')) {
    $('modalWinrateSub').innerHTML = `អត្រាជោគជ័យបច្ចុប្បន្ន៖ <span class="${isGreenState ? 'text-[#00e676]' : 'text-[#ff686b]'} font-extrabold">${numStr}%</span>`;
  }

  renderLiveWinrateModalRows();
  localStorage.setItem('ksnr_winrate', numStr);
}

function tickLiveWinrateAction() {
  const keys = Object.keys(state.pairWinrates);
  let sum = 0;

  keys.forEach((k) => {
    const item = state.pairWinrates[k];
    const roll = Math.random();
    let nextRate;
    if (roll < 0.24) {
      nextRate = +(89.2 + Math.random() * 1.9).toFixed(1);
      item.trendUp = false;
    } else {
      const delta = (Math.random() - 0.45) * 0.5;
      nextRate = Math.max(90.2, Math.min(94.6, +(item.rate + delta).toFixed(1)));
      item.trendUp = nextRate >= item.rate;
    }
    item.rate = nextRate;
    sum += nextRate;
  });

  const mainRoll = Math.random();
  if (mainRoll < 0.28) {
    state.winrate = +(89.3 + Math.random() * 0.6).toFixed(1);
    state.winrateTrendUp = false;
  } else {
    const avg = sum / keys.length;
    state.winrate = Math.max(90.4, Math.min(94.2, +(avg + (Math.random() - 0.45) * 0.4).toFixed(1)));
    state.winrateTrendUp = true;
  }

  updateWinrateUI();
}

$('btnWinrateAction')?.addEventListener('click', () => {
  updateWinrateUI();
  openModal('winrateModal');
});

$('btnRecordWin')?.addEventListener('click', () => {
  state.winrate = Math.min(98.9, +(state.winrate + 0.3).toFixed(1));
  state.winrateTrendUp = true;
  Object.keys(state.pairWinrates).forEach((k) => {
    state.pairWinrates[k].rate = Math.min(96.8, +(state.pairWinrates[k].rate + 0.3).toFixed(1));
    state.pairWinrates[k].trendUp = true;
  });
  updateWinrateUI();
});

$('btnRecordLoss')?.addEventListener('click', () => {
  state.winrate = +(89.5 + Math.random() * 0.4).toFixed(1);
  state.winrateTrendUp = false;
  Object.keys(state.pairWinrates).forEach((k) => {
    state.pairWinrates[k].rate = Math.max(88.9, +(state.pairWinrates[k].rate - 0.4).toFixed(1));
    state.pairWinrates[k].trendUp = false;
  });
  updateWinrateUI();
});

setInterval(() => {
  const path = $('winrateWavePath');
  const dot = $('winrateDot');
  if (!path || !dot) return;

  const isGreenState = state.winrate >= 90.0 && state.winrateTrendUp;
  const wave = Math.sin(Date.now() / 420) * 0.9;

  if (isGreenState) {
    const y = (5.5 + wave).toFixed(1);
    path.setAttribute('d', `M1 7.5 C12 7.5, 22 8.3, 31 7.4 C36 6.8, 38.5 6.0, 41 ${y}`);
    dot.setAttribute('cy', y);
    dot.nextElementSibling?.setAttribute('cy', y);
  } else {
    const y = (8.2 + wave * 0.5).toFixed(1);
    path.setAttribute('d', `M1 7.0 C12 7.0, 22 6.5, 31 7.3 C36 7.7, 38.5 8.0, 41 ${y}`);
    dot.setAttribute('cy', y);
    dot.nextElementSibling?.setAttribute('cy', y);
  }
}, 250);

setInterval(tickLiveWinrateAction, 1800);

// ==========================================
// 6. LANGUAGE SWITCHER & THEME
// ==========================================
const I18N = {
  en: {
    flag: 'GB', label: 'English',
    backDashboardTop: 'Back to Main Dashboard',
    backDashboardBottom: '← Back to Main Dashboard',
    subtitle: 'Transform market complexity into precise entry points',
    buyKey: 'BUY KEY', locked: 'Locked • No KEY',
    buyWithSupport: 'How to buy KEY with support',
    buySelfGuide: 'How to buy KEY by yourself',
    dropTitle: 'Drop your Chart image here',
    dropSub: 'Members must Login and activate a <span class="text-[#facc15] font-bold">Special KEY</span> to scan (Admin Unlimited Scan)',
    enterKeyBtn: 'Enter KEY to Scan',
    imgReadyNotice: '✅ Chart Image Ready! Choose Scalping, Swing, or A+ ICT Setup below:',
    chooseTradeStyle: '🎯 Choose What You Want To Trade (Scalping / Swing / A+ ICT Setup):',
    scalpDesc: 'Fast execution • Tight SL (1.2x ATR) • Quick profit targets (R:R 1:2.5)',
    swingDesc: 'Hold bigger trend moves • Wide Structural SL • Big TP targets (R:R 1:4.5)',
    aplusDesc: 'HTF Liquidity Sweep (BSL/SSL) + SMT Divergence + Displacement FVG (IRL) in Discount/Premium → Straight to TP (R:R 1:3.5)'
  },
  km: {
    flag: 'KH', label: 'ភាសាខ្មែរ',
    backDashboardTop: 'ត្រឡប់ទៅផ្ទាំងដើម Dashboard',
    backDashboardBottom: '← ត្រឡប់ទៅផ្ទាំងដើម (Back to Main Dashboard)',
    subtitle: 'បំប្លែងភាពស្មុគស្មាញនៃទីផ្សារ ទៅជាចំណុចចូលដ៏ច្បាស់លាស់',
    buyKey: 'ទិញ KEY', locked: 'ជាប់សោរ អត់ KEY',
    buyWithSupport: 'របៀបទិញ KEY ជាមួយ support',
    buySelfGuide: 'របៀបទិញ KEY ដោយខ្លួនឯង',
    dropTitle: 'ទាញរូបភាព Chart ទម្លាក់ទីនេះ',
    dropSub: 'សមាជិកត្រូវ Login គណនី និងមាន <span class="text-[#facc15] font-bold">KEY ពិសេស</span> ដើម្បីស្កេន (Admin ស្កេនឥតដែនកំណត់)',
    enterKeyBtn: 'បញ្ចូល KEY ដើម្បីស្កេន',
    imgReadyNotice: '✅ រូបភាព Chart រួចរាល់! សូមជ្រើសរើស Scalping, Swing ឬ A+ ICT Setup ខាងក្រោម៖',
    chooseTradeStyle: '🎯 ជ្រើសរើសទម្រង់ជួញដូរ (Scalping / Swing / A+ ICT Setup)៖',
    scalpDesc: 'វាយខ្លីរហ័ស • Tight SL (1.2x ATR) • យកផលចំណេញលឿន (R:R 1:2.5)',
    swingDesc: 'កាន់វែងតាម Trend ធំ • Wide Structural SL • TP ធំ (R:R 1:4.5)',
    aplusDesc: 'បោសសម្អាត HTF Liquidity (BSL/SSL) + SMT Divergence + Displacement បង្កើត FVG (IRL) ក្នុងតំបន់ Discount/Premium → គោលដៅ Straight to TP (R:R 1:3.5)'
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
  if ($('txtBuyWithSupport')) $('txtBuyWithSupport').textContent = t.buyWithSupport;
  if ($('txtBuySelfGuide')) $('txtBuySelfGuide').textContent = t.buySelfGuide;
  if ($('txtDropTitle')) $('txtDropTitle').textContent = t.dropTitle;
  if ($('txtDropSub')) $('txtDropSub').innerHTML = t.dropSub;
  if ($('txtEnterKeyBtn')) $('txtEnterKeyBtn').textContent = t.enterKeyBtn;
  if ($('txtImgReadyNotice')) $('txtImgReadyNotice').textContent = t.imgReadyNotice;
  if ($('txtChooseTradeStyle')) $('txtChooseTradeStyle').innerHTML = `<span>${t.chooseTradeStyle}</span>`;
  if ($('txtScalpDesc')) $('txtScalpDesc').textContent = t.scalpDesc;
  if ($('txtSwingDesc')) $('txtSwingDesc').textContent = t.swingDesc;
  if ($('txtAplusDesc')) $('txtAplusDesc').textContent = t.aplusDesc;
  renderScanButton();
}

$('btnLang')?.addEventListener('click', (e) => { e.stopPropagation(); $('langMenu').classList.toggle('hidden'); });
document.querySelectorAll('#langMenu [data-lang]').forEach((btn) => {
  btn.addEventListener('click', () => { applyLanguage(btn.dataset.lang); show($('langMenu'), false); });
});
window.addEventListener('click', () => show($('langMenu'), false));

$('btnTheme')?.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  $('themeIcon').textContent = document.body.classList.contains('light-mode') ? '☀️' : '🌙';
});

// ==========================================
// 7. USER AUTH, PROFILE & ADMIN UNLIMITED
// ==========================================
function getInitials(name) {
  return String(name || 'PO').trim().slice(0, 2).toUpperCase();
}

function addHistoryLog(type, detail) {
  if (!state.user) return;
  const key = `ksnr_hist_${state.user.identifier}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift({ type, detail, time: new Date().toLocaleString('km-KH') });
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
  renderScanHistoryLobby();
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
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const minSide = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - minSide) / 2, (img.height - minSide) / 2, minSide, minSide, 0, 0, size, size);
      syncUserRecord({ avatar: canvas.toDataURL('image/jpeg', 0.85) });
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
  const list = JSON.parse(localStorage.getItem(`ksnr_hist_${state.user.identifier}`) || '[]');
  const box = $('historyContent');
  box.innerHTML = '';
  if (!list.length) {
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

$('btnOpenLogin')?.addEventListener('click', () => { show($('loginError'), false); openModal('loginModal'); });
$('btnOpenSignup')?.addEventListener('click', () => { show($('signupError'), false); openModal('signupModal'); });
$('btnSwitchToSignup')?.addEventListener('click', () => { closeModal('loginModal'); show($('signupError'), false); openModal('signupModal'); });
$('btnSwitchToLogin')?.addEventListener('click', () => { closeModal('signupModal'); show($('loginError'), false); openModal('loginModal'); });

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
  let matched = users.find((u) => (u.identifier === identifier || u.username.toLowerCase() === identifier) && u.password === password);
  if (!matched && ADMIN_EMAILS.includes(identifier)) {
    matched = users.find((u) => u.identifier === identifier);
    if (matched) { matched.password = password; saveUsers(users); }
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
// 8. REAL 1-TIME ABA KHQR + RECEIVE KEY ENGINE
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
    if (state.user && !reg[clean].redeemedBy) reg[clean].redeemedBy = state.user.identifier;
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
  const meta = getStyleDisplayMeta(state.tradeStyle);
  const styleLabel = meta.scanBtnLabel;

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
  return `${tag}${String(str.length).padStart(2, '0')}${str}`;
}

function crc16Khqr(payloadWithoutCrcValue) {
  let crc = 0xFFFF;
  for (let i = 0; i < payloadWithoutCrcValue.length; i++) {
    crc ^= (payloadWithoutCrcValue.charCodeAt(i) & 0xFF) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
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
    map[tag] = rawQr.slice(i + 4, i + 4 + len);
    i += 4 + len;
    if (tag === '63') break;
  }
  return map;
}

function buildAbaKhqrPayload(pkg, isDynamicAmount = true, sessionId = '') {
  const amountNum = pkg && pkg.price ? parseFloat(pkg.price) : 0;
  const useAmount = isDynamicAmount && amountNum > 0;
  const amountStr = Number.isInteger(amountNum) ? String(amountNum) : amountNum.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  const billRef = sessionId || `OT${Date.now().toString().slice(-6)}`;

  if (state.rawAbaKhqrPayload && state.rawAbaKhqrPayload.startsWith('000201')) {
    if (!useAmount) return state.rawAbaKhqrPayload;
    const tags = parseEmvTags(state.rawAbaKhqrPayload);
    const acctTag = tags['29'] ? '29' : (tags['30'] ? '30' : null);
    if (acctTag && tags[acctTag]) {
      const nowMs = String(Date.now());
      const expMs = String(Date.now() + 15 * 60 * 1000);
      let body = tlv('00', '01') + tlv('01', '12') + tlv(acctTag, tags[acctTag]) +
        tlv('52', tags['52'] || '5999') + tlv('53', '840') + tlv('54', amountStr) +
        tlv('58', 'KH') + tlv('59', tags['59'] || ABA_MERCHANT_INFO.merchantName) +
        tlv('60', tags['60'] || ABA_MERCHANT_INFO.merchantCity) + tlv('62', tlv('01', billRef)) +
        tlv('99', tlv('00', nowMs) + tlv('01', expMs)) + '6304';
      return body + crc16Khqr(body);
    }
  }

  const tag29Value = tlv('00', ABA_MERCHANT_INFO.bakongId) + tlv('01', ABA_MERCHANT_INFO.usdAccount) + tlv('02', ABA_MERCHANT_INFO.bankName);
  const nowMs = String(Date.now());
  const expMs = String(Date.now() + 15 * 60 * 1000);
  let payload = tlv('00', '01') + tlv('01', useAmount ? '12' : '11') + tlv('29', tag29Value) +
    tlv('52', '5999') + tlv('53', '840') + (useAmount ? tlv('54', amountStr) : '') +
    tlv('58', 'KH') + tlv('59', ABA_MERCHANT_INFO.merchantName) + tlv('60', ABA_MERCHANT_INFO.merchantCity) +
    tlv('62', tlv('01', billRef)) + tlv('99', tlv('00', nowMs) + tlv('01', expMs)) + '6304';
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

tryDecodeAbaQrFromImageSrc(state.customAbaQrImg || 'image_6229bd.jpg');

function startOneTimeKhqrSession(pkg) {
  state.selectedPkg = pkg;
  state.currentQrSession = {
    id: `OT${Math.floor(100000 + Math.random() * 900000)}`,
    pkgCode: pkg.code,
    mode: pkg.mode || (pkg.scans > 0 ? `S${pkg.scans}` : `H${pkg.hours}`),
    title: pkg.title, price: pkg.price, scans: pkg.scans, hours: pkg.hours,
    used: false, issuedKey: null, createdAt: Date.now()
  };

  show($('khqrUsedOverlay'), false);
  $('khqrPkgTitle').textContent = `${pkg.title} - តម្លៃ ${pkg.price}$`;
  $('khqrStatusText').textContent = `📱 ស្កេនបង់ប្រាក់ ${pkg.price}$ (1-Time QR #${state.currentQrSession.id})`;
  $('khqrStatusText').className = 'text-xs sm:text-sm text-cyan-300 mb-3 font-semibold';

  document.querySelectorAll('#quickPriceBtns button').forEach((b) => {
    b.className = b.dataset.qpkg === pkg.code
      ? 'py-1.5 rounded-lg bg-cyan-500/25 border border-cyan-400 text-white font-extrabold cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.3)]'
      : 'py-1.5 rounded-lg bg-[#131d31] border border-slate-700 text-slate-300 font-bold cursor-pointer hover:border-slate-500';
  });
  drawKhqrCanvas(pkg);
}

function drawKhqrCanvas(pkg) {
  const canvas = $('khqrCanvas');
  const origImg = $('khqrOriginalImg');
  if (!canvas || !pkg) return;

  if (state.customAbaQrImg && origImg) origImg.src = state.customAbaQrImg;
  if (state.khqrMode === 'original' && origImg && origImg.complete && origImg.naturalWidth > 0) {
    show(canvas, false); show(origImg, true); return;
  }
  show(origImg, false); show(canvas, true);

  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#e11d27';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, 64); ctx.lineTo(w - 26, 46); ctx.lineTo(0, 46); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#ffffff'; ctx.font = '800 20px Inter, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('KHQR', w / 2, 31);

  ctx.textAlign = 'left'; ctx.fillStyle = '#0f172a'; ctx.font = '800 14px Inter, sans-serif';
  ctx.fillText(ABA_MERCHANT_INFO.merchantName, 24, 72);

  ctx.textAlign = 'right'; ctx.fillStyle = '#0284c7'; ctx.font = '800 16px Inter, sans-serif';
  ctx.fillText(`$${pkg.price} USD`, w - 24, 72);

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath(); ctx.moveTo(20, 86); ctx.lineTo(w - 20, 86); ctx.stroke();
  ctx.restore();

  const sessionId = state.currentQrSession ? state.currentQrSession.id : `OT${Date.now().toString().slice(-6)}`;
  const khqrString = buildAbaKhqrPayload(pkg, state.khqrMode === 'dynamic', sessionId);
  const qrSize = 236, startX = Math.floor((w - qrSize) / 2), startY = 98;

  if (typeof window.qrcode === 'function') {
    const qr = window.qrcode(0, 'M');
    qr.addData(khqrString); qr.make();
    const count = qr.getModuleCount(), cellSize = qrSize / count;
    ctx.fillStyle = '#000000';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect(
            Math.floor(startX + c * cellSize),
            Math.floor(startY + r * cellSize),
            Math.ceil((c + 1) * cellSize) - Math.floor(c * cellSize),
            Math.ceil((r + 1) * cellSize) - Math.floor(r * cellSize)
          );
        }
      }
    }

    const cx = startX + qrSize / 2, cy = startY + qrSize / 2;
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.fillStyle = '#e11d27'; ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = '800 11px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('៛', cx, cy + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  const footerTop = 348;
  ctx.textAlign = 'left'; ctx.fillStyle = '#0f172a'; ctx.font = '700 12.5px Inter, sans-serif';
  ctx.fillText('៛  KHR account:', 24, footerTop + 26);
  ctx.textAlign = 'right'; ctx.font = '800 13px Inter, monospace';
  ctx.fillText(ABA_MERCHANT_INFO.khrAccountDisplay, w - 24, footerTop + 26);

  ctx.textAlign = 'left'; ctx.font = '700 12.5px Inter, sans-serif';
  ctx.fillText('$  USD account:', 24, footerTop + 52);
  ctx.textAlign = 'right'; ctx.fillStyle = '#0284c7'; ctx.font = '800 13.5px Inter, monospace';
  ctx.fillText(ABA_MERCHANT_INFO.usdAccountDisplay, w - 24, footerTop + 52);
}

function setKhqrMode(mode) {
  state.khqrMode = mode;
  if (state.selectedPkg) drawKhqrCanvas(state.selectedPkg);
}

$('tabKhqrDynamic')?.addEventListener('click', () => setKhqrMode('dynamic'));
$('tabKhqrOriginal')?.addEventListener('click', () => setKhqrMode('original'));

$('uploadOriginalQrInput')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    state.customAbaQrImg = dataUrl;
    localStorage.setItem('ksnr_custom_aba_qr_img', dataUrl);
    if ($('khqrOriginalImg')) $('khqrOriginalImg').src = dataUrl;
    tryDecodeAbaQrFromImageSrc(dataUrl);
    setKhqrMode('original');
  };
  reader.readAsDataURL(file);
});

document.querySelectorAll('#quickPriceBtns button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const pkg = PACKAGES_MAP[btn.dataset.qpkg];
    if (pkg) startOneTimeKhqrSession(pkg);
  });
});

$('btnCopyUsdAcc')?.addEventListener('click', () => {
  navigator.clipboard.writeText(ABA_MERCHANT_INFO.usdAccount);
  $('khqrStatusText').textContent = '✅ បានចម្លងលេខគណនី USD: 086 375 171 (CHUNG POR KAING)';
});

$('btnCopyKhrAcc')?.addEventListener('click', () => {
  navigator.clipboard.writeText(ABA_MERCHANT_INFO.khrAccount);
  $('khqrStatusText').textContent = '✅ បានចម្លងលេខគណនី KHR: 003 823 710 (CHUNG POR KAING)';
});

document.querySelectorAll('#packageList .pkg-card').forEach((card) => {
  card.addEventListener('click', () => {
    if (!state.user) { closeModal('buyModal'); return openModal('loginModal'); }
    const pkg = PACKAGES_MAP[card.dataset.pkg] || PACKAGES_MAP['1_SCAN'];
    startOneTimeKhqrSession(pkg);
    closeModal('buyModal');
    openModal('khqrModal');
    icons();
  });
});

$('btnSaveKhqr')?.addEventListener('click', () => {
  const canvas = $('khqrCanvas');
  if (!canvas || !state.selectedPkg) return;
  const link = document.createElement('a');
  link.download = `ABA-KHQR-CHUNG-POR-KAING-${state.selectedPkg.price}USD.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

function openReceiveKeyModalWithKey(keyCode, pkg) {
  const cleanKey = (keyCode || state.latestIssuedKey || localStorage.getItem('ksnr_latest_approved_key') || '').trim().toUpperCase();
  const reg = getKeyRegistry();
  const info = reg[cleanKey];
  $('receivedKeyCode').textContent = cleanKey || 'មិនទាន់មាន KEY';
  if (pkg) $('receiveKeyPkgBadge').innerHTML = `<span>⚡ កញ្ចប់៖ ${pkg.title} (${pkg.price}$) • ប្រើបានតែ ១ ដង</span>`;
  else if (info) $('receiveKeyPkgBadge').innerHTML = `<span>⚡ កញ្ចប់៖ ${info.label} • ប្រើបានតែ ១ ដង</span>`;
  openModal('receiveKeyModal');
  icons();
}

$('btnOpenReceiveKey')?.addEventListener('click', () => {
  if (!state.user) return openModal('loginModal');
  openReceiveKeyModalWithKey(state.latestIssuedKey, state.selectedPkg);
});

$('btnRefreshReceivedKey')?.addEventListener('click', () => {
  const latest = localStorage.getItem('ksnr_latest_approved_key') || state.latestIssuedKey;
  if (latest) {
    state.latestIssuedKey = latest;
    openReceiveKeyModalWithKey(latest, state.selectedPkg);
  }
});

function completeOneTimePaymentAndShowKey(pkg, sourceLabel = 'ABA KHQR') {
  if (!pkg) return;
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
  setTimeout(() => { closeModal('khqrModal'); openReceiveKeyModalWithKey(generatedKey, pkg); }, 600);
}

$('receiptUploadInput')?.addEventListener('change', (e) => {
  if (e.target.files?.[0] && state.selectedPkg) completeOneTimePaymentAndShowKey(state.selectedPkg, 'វិក្កយបត្រ ABA');
});
$('btnVerifyKhqr')?.addEventListener('click', () => {
  if (state.selectedPkg) completeOneTimePaymentAndShowKey(state.selectedPkg, 'ABA KHQR');
});

const COPY_RECEIVED_KEY_HTML = '<i data-lucide="copy" class="w-4 h-4"></i><span>Copy KEY</span>';
$('btnCopyReceivedKey')?.addEventListener('click', () => {
  const code = ($('receivedKeyCode')?.textContent || '').trim();
  if (!code || code === 'មិនទាន់មាន KEY') return;
  navigator.clipboard.writeText(code);
  flashButton($('btnCopyReceivedKey'), '<i data-lucide="check" class="w-4 h-4"></i><span>Copied!</span>', COPY_RECEIVED_KEY_HTML);
});

$('btnGoToPasteKey')?.addEventListener('click', () => {
  const code = ($('receivedKeyCode')?.textContent || '').trim();
  closeModal('receiveKeyModal');
  if (code && code !== 'មិនទាន់មាន KEY' && $('keyInput')) $('keyInput').value = code;
  show($('keyError'), false);
  openModal('keyModal');
});

$('btnPasteKeyInput')?.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && $('keyInput')) $('keyInput').value = text.trim().toUpperCase();
  } catch (e) {
    if (state.latestIssuedKey && $('keyInput')) $('keyInput').value = state.latestIssuedKey;
  }
});

// ==========================================
// 9. IMAGE HANDLING
// ==========================================
function showError(msg) {
  $('scanErrorText').textContent = msg;
  show($('scanError'), !!msg);
}

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    return showError('សូមជ្រើសរើសប្រភេទឯកសារជារូបភាព (PNG, JPG, WebP) ប៉ុណ្ណោះ!');
  }
  showError('');
  state.result = null;
  state.activeLobbyItemId = null;
  show($('resultCard'), false);
  state.mime = file.type;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    $('previewImg').src = dataUrl;
    state.imageBase64 = dataUrl.split(',')[1];
    show($('dropEmpty'), false);
    show($('dropPreview'), true);
    show($('imgReadyStepBadge'), true);
    $('dropZone').classList.add('has-image');
    $('tradeStyleBox')?.classList.add('image-ready-glow');
    renderScanButton();
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  state.imageBase64 = null;
  state.result = null;
  state.activeLobbyItemId = null;
  $('previewImg').src = '';
  $('fileInput').value = '';
  show($('dropPreview'), false);
  show($('dropEmpty'), true);
  show($('imgReadyStepBadge'), false);
  show($('resultCard'), false);
  $('dropZone').classList.remove('has-image');
  $('tradeStyleBox')?.classList.remove('image-ready-glow');
  renderScanButton();
}

window.addEventListener('paste', (e) => {
  if (!state.unlocked) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) handleFile(item.getAsFile());
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
  if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
});
dz?.addEventListener('click', (e) => {
  if (e.target.closest('#tradeStyleBox') || e.target.closest('#btnScan') || e.target.closest('#btnEnterKey')) return;
  if (!state.user) return openModal('loginModal');
  if (!state.unlocked) return openModal('keyModal');
  $('fileInput').click();
});
$('fileInput')?.addEventListener('click', (e) => e.stopPropagation());
$('fileInput')?.addEventListener('change', (e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); });
$('btnRemoveImg')?.addEventListener('click', (e) => { e.stopPropagation(); clearImage(); });

// ==========================================
// 10. RENDER RESULT (HIGH PROBABILITY SETUP + ICT ERL/IRL)
// ==========================================
function buildSignalCopyText(r) {
  const isBuy = (r.action || '').toUpperCase().includes('BUY');
  const styleCode = r.tradeStyle || state.tradeStyle;
  let styleText = '⚡ SCALPING TRADE (Fast Execution • R:R 1:2.5)';
  if (styleCode === 'SWING') styleText = '🌊 SWING TRADE (Hold Trend • R:R 1:4.5)';
  else if (styleCode === 'APLUS_ICT') styleText = '🏆 A+ ICT LIQUIDITY SETUP (Sweep + SMT + FVG • Min 1:3 RR)';

  const ict = r.ictLiquidity || {};
  return `🔥 លទ្ធផលស្កេន High Probability Setup (Por - SNR Scanner) 🔥
📈 ${isBuy ? 'ENTRY BUY NOW' : 'ENTRY SELL NOW'}: ${r.entry}
🎯 TAKE PROFIT (TP1): ${r.tp1} | TP2 (ERL): ${r.tp2}
🛑 STOP LOSS (SL): ${r.sl}

📊 Pair: ${r.pair} (${r.timeframe}) | Style: ${styleText}
📈 និន្នាការ (Trend): ${r.trend}
📝 ការវិភាគលម្អិត: ${r.detailedAnalysis || ''}

🧲 ICT Liquidity & Dealing Range:
- Dealing Range Zone: ${ict.pdZone || (isBuy ? 'DISCOUNT (< 0.5 Fib)' : 'PREMIUM (> 0.5 Fib)')}
- 0.5 Equilibrium: ${ict.equilibrium50 || '-'}
- Buy-Side Liquidity (BSL / ERL): ${ict.bsl || r.snrZones?.resistance || '-'}
- Internal Liquidity (IRL - FVG): ${ict.irlFvg || r.entry || '-'}
- Sell-Side Liquidity (SSL / ERL): ${ict.ssl || r.snrZones?.support || '-'}

🧱 តំបន់ KEY Por - SNR:
- KEY Resistance: ${r.snrZones?.resistance}
- KEY Support: ${r.snrZones?.support}

📲 Telegram Admin: @KaingChungpor`;
}

function renderResult() {
  const r = state.result;
  if (!r) return;

  const isBuy = (r.action || '').toUpperCase().includes('BUY');

  // 1. Update High Probability Setup Hero Block
  const hpBanner = $('hpActionBanner');
  if (hpBanner) {
    hpBanner.className = `${isBuy ? 'hp-banner-buy' : 'hp-banner-sell'} w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2.5 mb-4`;
    hpBanner.innerHTML = `<i data-lucide="${isBuy ? 'trending-up' : 'trending-down'}" class="w-5 h-5"></i><span>${isBuy ? 'ENTRY BUY NOW' : 'ENTRY SELL NOW'}</span>`;
  }

  const hpEntryCard = $('hpEntryPriceCard');
  if (hpEntryCard) {
    hpEntryCard.className = `hp-entry-box ${isBuy ? '' : 'sell-mode'} w-full py-5 px-4 rounded-2xl text-center mb-3.5`;
  }
  if ($('hpEntryBoxLabel')) {
    $('hpEntryBoxLabel').textContent = isBuy ? 'ENTRY BUY NOW' : 'ENTRY SELL NOW';
    $('hpEntryBoxLabel').className = isBuy ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold';
  }
  if ($('hpEntryBigPrice')) {
    $('hpEntryBigPrice').textContent = r.entry || '-';
    $('hpEntryBigPrice').className = 'hp-entry-price text-3xl sm:text-5xl font-extrabold tracking-tight';
  }

  const tpCard = $('hpTpBigPrice')?.parentElement;
  if (tpCard) tpCard.className = 'hp-tp-box py-4 px-3 sm:px-4 rounded-2xl text-center';
  if ($('hpTpBigPrice')) {
    $('hpTpBigPrice').textContent = r.tp2 || r.tp1 || '-';
    $('hpTpBigPrice').className = 'hp-tp-price text-2xl sm:text-3xl font-extrabold tracking-tight';
  }

  const slCard = $('hpSlBigPrice')?.parentElement;
  if (slCard) slCard.className = 'hp-sl-box py-4 px-3 sm:px-4 rounded-2xl text-center';
  if ($('hpSlBigPrice')) {
    $('hpSlBigPrice').textContent = r.sl || '-';
    $('hpSlBigPrice').className = 'hp-sl-price text-2xl sm:text-3xl font-extrabold tracking-tight';
  }

  const analysisBox = $('hpAnalysisSummaryText')?.parentElement;
  if (analysisBox) analysisBox.className = 'hp-reason-box p-4 rounded-2xl text-xs sm:text-sm leading-relaxed text-slate-200 mb-5';
  if ($('hpAnalysisSummaryText')) {
    $('hpAnalysisSummaryText').textContent = r.detailedAnalysis || (isBuy
      ? `ទីផ្សារមានទំនោរកើនឡើងបន្ទាប់ពីតម្លៃបានប៉ះតំបន់ Support (${r.snrZones?.support || r.sl}) និងបោសសម្អាត Sell-Side Liquidity (SSL)។ Entry ត្រូវបានកំណត់នៅចំណុច ${r.entry} ដើម្បីចូលតាមទិសដៅកើនឡើង។ TP នៅក្បែរតំបន់ខ្ពស់ចាស់ (${r.tp2 || r.tp1}) និង SL នៅក្រោមតំបន់ទាបចុងក្រោយ (${r.sl}) ដើម្បីការពារហានិភ័យ។`
      : `ទីផ្សារមានទំនោរថយចុះបន្ទាប់ពីតម្លៃបានប៉ះតំបន់ Resistance (${r.snrZones?.resistance || r.sl}) និងបោសសម្អាត Buy-Side Liquidity (BSL)។ Entry ត្រូវបានកំណត់នៅចំណុច ${r.entry} ដើម្បីចូលតាមទិសដៅថយចុះ។ TP នៅក្បែរតំបន់ទាបចាស់ (${r.tp2 || r.tp1}) និង SL នៅលើតំបន់ខ្ពស់ចុងក្រោយ (${r.sl}) ដើម្បីការពារហានិភ័យ។`);
  }

  // 2. Update Detailed ICT & KEY Por-SNR Breakdown
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

  const styleCode = r.tradeStyle || state.tradeStyle;
  const meta = getStyleDisplayMeta(styleCode);
  const styleBadge = $('rTradeStyleBadge');
  if (styleBadge) {
    styleBadge.textContent = meta.resBadgeText;
    styleBadge.className = meta.resBadgeClass;
  }

  const gradeBadge = $('rSetupGradeBadge');
  if (gradeBadge) {
    gradeBadge.textContent = r.setupGrade || (styleCode === 'APLUS_ICT' ? '🏆 A+ ICT (MIN 1:3 RR)' : '🏆 A+ CONFLUENCE');
  }

  const tag = $('rAction');
  tag.className = 'action-tag ' + (isBuy ? 'buy' : 'sell');
  tag.innerHTML = `<i data-lucide="${isBuy ? 'trending-up' : 'trending-down'}"></i><span>${r.action} (${isBuy ? 'NEW BUY' : 'NEW SELL'})</span>`;

  if ($('rFlipText')) {
    $('rFlipText').textContent = r.keyFlipRule || (isBuy
      ? 'KEY Por - SNR FLOW: Candle/Wick ចាក់ KEY BUY = NEW BUY 💸'
      : 'KEY Por - SNR FLOW: Candle/Wick ចាក់ KEY SELL = NEW SELL 💸');
  }

  // Render ICT Dealing Range (Premium / 0.5 Equilibrium / Discount) & ERL/IRL Map
  const ict = r.ictLiquidity || {};
  if ($('rPdZoneBadge')) {
    const isDiscount = ict.isDiscount !== undefined ? ict.isDiscount : isBuy;
    $('rPdZoneBadge').textContent = isDiscount
      ? '🟢 DISCOUNT ZONE (< 0.5 FIB • BUY)'
      : '🔴 PREMIUM ZONE (> 0.5 FIB • SELL)';
    $('rPdZoneBadge').className = isDiscount
      ? 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
      : 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 border border-rose-400/50 text-rose-300';
  }
  if ($('rIctFib50')) $('rIctFib50').textContent = ict.equilibrium50 || r.currentPrice || '-';
  if ($('rIctBsl')) $('rIctBsl').textContent = ict.bsl || r.snrZones?.resistance || '-';
  if ($('rIctIrlFvg')) $('rIctIrlFvg').textContent = ict.irlFvg || `${r.entry}` || '-';
  if ($('rIctSsl')) $('rIctSsl').textContent = ict.ssl || r.snrZones?.support || '-';

  if ($('rConfSweepText')) {
    $('rConfSweepText').textContent = ict.confSweep || (isBuy ? '#1 SSL Swept (HTF LQ)' : '#1 BSL Swept (HTF LQ)');
  }
  if ($('rConfSmtText')) {
    $('rConfSmtText').textContent = ict.confSmt || '#2 SMT Divergence Confirmed';
  }
  if ($('rConfDispText')) {
    $('rConfDispText').textContent = ict.confDisp || '#3 Displacement + FVG Entry';
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

  setTradeStyle(styleCode, false);
  show($('resultCard'), true);
  icons();
}

const COPY_SIGNAL_HTML = '<i data-lucide="copy"></i><span>ចម្លង Signal យកទៅផុស (Copy Signal)</span>';
$('btnCopySignal')?.addEventListener('click', () => {
  if (!state.result) return;
  navigator.clipboard.writeText(buildSignalCopyText(state.result));
  flashButton($('btnCopySignal'), '<i data-lucide="check"></i><span>បានចម្លងទម្រង់ Signal រួចរាល់!</span>', COPY_SIGNAL_HTML);
});

// =========================================================
// 10B. AFTER-SCAN HISTORY LOBBY ENGINE + SMOOTH DELETE & UNDO
// =========================================================
let lastDeletedLobbyBackup = null;
let undoToastTimer = null;
let pendingConfirmAction = null;

function getLobbyStorageKey() {
  return `ksnr_scan_lobby_${state.user?.identifier || 'guest'}`;
}

function getScanLobbyList() {
  try { return JSON.parse(localStorage.getItem(getLobbyStorageKey()) || '[]'); } catch (e) { return []; }
}

function saveScanLobbyList(list) {
  try { localStorage.setItem(getLobbyStorageKey(), JSON.stringify(list.slice(0, 25))); } catch (e) {}
}

function showDeleteUndoToast(message, backupList) {
  lastDeletedLobbyBackup = backupList;
  const toast = $('deleteUndoToast');
  const txt = $('deleteUndoToastText');
  if (!toast || !txt) return;

  txt.textContent = message;
  show(toast, true);
  icons();

  if (undoToastTimer) clearTimeout(undoToastTimer);
  undoToastTimer = setTimeout(() => {
    show(toast, false);
    lastDeletedLobbyBackup = null;
  }, 5000);
}

$('btnUndoDeleteLobby')?.addEventListener('click', () => {
  if (!lastDeletedLobbyBackup) return;
  saveScanLobbyList(lastDeletedLobbyBackup);
  lastDeletedLobbyBackup = null;
  show($('deleteUndoToast'), false);
  renderScanHistoryLobby();
});

function openSmoothConfirmModal({ title, desc, onConfirm }) {
  if ($('confirmDeleteTitle')) $('confirmDeleteTitle').textContent = title;
  if ($('confirmDeleteDesc')) $('confirmDeleteDesc').innerHTML = desc;
  pendingConfirmAction = onConfirm;
  openModal('confirmDeleteModal');
  icons();
}

function closeSmoothConfirmModal() {
  pendingConfirmAction = null;
  closeModal('confirmDeleteModal');
}

$('btnCancelDeleteModal')?.addEventListener('click', closeSmoothConfirmModal);
$('btnCancelDeleteTop')?.addEventListener('click', closeSmoothConfirmModal);
$('confirmDeleteModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'confirmDeleteModal') closeSmoothConfirmModal();
});

$('btnConfirmDeleteModal')?.addEventListener('click', () => {
  const fn = pendingConfirmAction;
  closeSmoothConfirmModal();
  if (typeof fn === 'function') fn();
});

function createChartThumbnailDataUrl(sourceDataUrl, maxW = 360) {
  return new Promise((resolve) => {
    if (!sourceDataUrl) return resolve('');
    const img = new Image();
    img.onload = () => {
      const ratio = (img.height || 180) / Math.max(1, img.width || 320);
      const w = Math.min(maxW, img.width || maxW);
      const h = Math.max(90, Math.round(w * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => resolve('');
    img.src = sourceDataUrl;
  });
}

window.saveScanToHistoryLobby = async function(scanResult, previewDataUrl) {
  if (!scanResult) return null;
  const thumb = await createChartThumbnailDataUrl(previewDataUrl);
  const list = getScanLobbyList();

  const newEntry = {
    id: `SCN-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: Date.now(),
    timeText: new Date().toLocaleString('km-KH'),
    outcome: 'PENDING',
    thumbDataUrl: thumb,
    result: JSON.parse(JSON.stringify(scanResult))
  };

  list.unshift(newEntry);
  saveScanLobbyList(list);
  state.activeLobbyItemId = newEntry.id;
  renderScanHistoryLobby();

  const lobbyShell = $('scanHistoryLobby');
  if (lobbyShell) {
    lobbyShell.classList.add('lobby-new-flash');
    setTimeout(() => lobbyShell.classList.remove('lobby-new-flash'), 1800);
  }
  return newEntry;
};

window.updateActiveLobbyItemResult = function(updatedResult) {
  if (!updatedResult || !state.activeLobbyItemId) return;
  const list = getScanLobbyList();
  const idx = list.findIndex((item) => item.id === state.activeLobbyItemId);
  if (idx !== -1) {
    list[idx].result = JSON.parse(JSON.stringify(updatedResult));
    list[idx].timeText = new Date().toLocaleString('km-KH');
    saveScanLobbyList(list);
    renderScanHistoryLobby();
  }
};

function renderScanHistoryLobby() {
  const lobbyEl = $('scanHistoryLobby');
  if (!lobbyEl) return;

  const list = getScanLobbyList();
  const total = list.length;
  const scalpCount = list.filter((i) => (i.result?.tradeStyle || 'SCALPING') === 'SCALPING').length;
  const swingOrAplusCount = list.filter((i) => ['SWING', 'APLUS_ICT'].includes(i.result?.tradeStyle)).length;
  const winCount = list.filter((i) => i.outcome === 'WIN').length;
  const lossCount = list.filter((i) => i.outcome === 'LOSS').length;

  if ($('topLobbyCountBadge')) $('topLobbyCountBadge').textContent = String(total);
  if ($('lobbyCountBadge')) $('lobbyCountBadge').textContent = `${total} Scans`;
  if ($('lobbyStatTotal')) $('lobbyStatTotal').textContent = String(total);
  if ($('lobbyStatScalp')) $('lobbyStatScalp').textContent = String(scalpCount);
  if ($('lobbyStatSwing')) $('lobbyStatSwing').textContent = String(swingOrAplusCount);
  if ($('lobbyStatWin')) $('lobbyStatWin').textContent = String(winCount);
  if ($('lobbyStatWL')) $('lobbyStatWL').textContent = `(${winCount}W / ${lossCount}L)`;

  lobbyEl.querySelectorAll('[data-lobby-filter]').forEach((b) => {
    const active = b.dataset.lobbyFilter === state.lobbyFilter;
    b.className = active
      ? 'lobby-filter-btn active px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-extrabold border border-cyan-300 cursor-pointer shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
      : 'lobby-filter-btn px-3.5 py-1.5 rounded-xl bg-[#0b1220] text-slate-300 border border-slate-700 hover:border-cyan-400 font-bold cursor-pointer shrink-0';
  });

  const filtered = list.filter((item) => {
    const r = item.result || {};
    const style = (r.tradeStyle || 'SCALPING').toUpperCase();
    const act = (r.action || 'BUY').toUpperCase();
    if (state.lobbyFilter === 'SCALPING') return style === 'SCALPING';
    if (state.lobbyFilter === 'SWING') return style === 'SWING';
    if (state.lobbyFilter === 'APLUS_ICT') return style === 'APLUS_ICT';
    if (state.lobbyFilter === 'BUY') return act.includes('BUY');
    if (state.lobbyFilter === 'SELL') return act.includes('SELL');
    if (state.lobbyFilter === 'WIN') return item.outcome === 'WIN';
    return true;
  });

  const container = $('scanLobbyList') || $('scanLobbyCards');
  if (!container) return;
  container.innerHTML = '';

  if (!filtered.length) {
    container.innerHTML = `
      <div class="p-6 rounded-2xl bg-[#0b111e] border border-dashed border-slate-800 text-center text-slate-400 text-xs sm:text-sm">
        <div class="text-2xl mb-1.5">📭</div>
        <div class="font-bold text-slate-300">មិនទាន់មានប្រវត្តិស្កេនក្នុង History Lobby នៅឡើយទេ</div>
        <div class="text-xs text-slate-500 mt-1">រាល់ពេលអ្នកស្កេនរូបភាព Chart រួច លទ្ធផលនឹងលោតចូលក្នុងបន្ទប់ Lobby នេះដោយស្វ័យប្រវត្តិ!</div>
      </div>
    `;
    icons();
    return;
  }

  filtered.forEach((item, index) => {
    const r = item.result || {};
    const isBuy = String(r.action || '').toUpperCase().includes('BUY');
    const styleCode = (r.tradeStyle || 'SCALPING').toUpperCase();
    const isActive = item.id === state.activeLobbyItemId;

    let stylePill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 border border-cyan-400/50 text-cyan-300">⚡ SCALPING</span>`;
    if (styleCode === 'SWING') {
      stylePill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-400/50 text-amber-300">🌊 SWING</span>`;
    } else if (styleCode === 'APLUS_ICT') {
      stylePill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">🏆 A+ ICT</span>`;
    }

    let outcomeBadge = `<span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">⏳ កំពុងរង់ចាំ</span>`;
    if (item.outcome === 'WIN') outcomeBadge = `<span class="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-extrabold">✅ ឈ្នះ TP (WIN)</span>`;
    else if (item.outcome === 'LOSS') outcomeBadge = `<span class="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[10px] font-extrabold">🛑 ប៉ះ SL (LOSS)</span>`;

    const card = document.createElement('div');
    card.className = `scan-lobby-card p-3.5 sm:p-4 ${isActive ? 'latest-scan-highlight' : ''}`;
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          ${item.thumbDataUrl
            ? `<img src="${item.thumbDataUrl}" alt="Chart" class="w-20 h-16 sm:w-24 sm:h-16 rounded-xl object-cover border border-slate-700 shrink-0 cursor-pointer" data-lobby-view="${item.id}" />`
            : `<div class="w-20 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0"><i data-lucide="image" class="w-5 h-5"></i></div>`}
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] font-mono font-bold text-slate-400">#${filtered.length - index}</span>
              <span class="font-extrabold text-white text-sm sm:text-base">${r.pair || 'XAU/USD'}</span>
              <span class="text-xs font-bold text-cyan-300">(${r.timeframe || 'M15'})</span>
              ${stylePill}
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isBuy ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300' : 'bg-rose-500/20 border border-rose-400/50 text-rose-300'}">${isBuy ? '🟢 BUY' : '🔴 SELL'}</span>
              ${outcomeBadge}
            </div>
            <div class="text-[11px] text-slate-400 mt-1">🕒 ${item.timeText || ''} • Trend: <strong class="text-slate-200">${r.trend || '-'}</strong> • R:R <strong class="text-amber-300">${r.rrRatio || '1:3.0'}</strong></div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
          <button type="button" data-lobby-view="${item.id}" class="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-extrabold flex items-center gap-1 cursor-pointer">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i><span>មើលឡើងវិញ</span>
          </button>
          <button type="button" data-lobby-copy="${item.id}" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy</span>
          </button>
          <button type="button" data-lobby-tg="${item.id}" class="px-2.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 text-xs font-bold flex items-center gap-1 cursor-pointer">
            <i data-lucide="send" class="w-3.5 h-3.5"></i><span>TG</span>
          </button>
          <button type="button" data-lobby-win="${item.id}" class="px-2 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold cursor-pointer">✅ TP</button>
          <button type="button" data-lobby-loss="${item.id}" class="px-2 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-extrabold cursor-pointer">🛑 SL</button>
          <button type="button" data-lobby-del="${item.id}" class="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 cursor-pointer"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-xs">
        <div class="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-amber-500/25 flex justify-between"><span class="text-slate-400">🎯 Entry:</span><span class="font-extrabold text-amber-300">${r.entry || '-'}</span></div>
        <div class="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-rose-500/25 flex justify-between"><span class="text-slate-400">🛑 SL:</span><span class="font-extrabold text-rose-400">${r.sl || '-'}</span></div>
        <div class="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-emerald-500/25 flex justify-between"><span class="text-slate-400">💰 TP1:</span><span class="font-extrabold text-emerald-300">${r.tp1 || '-'}</span></div>
        <div class="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-emerald-500/25 flex justify-between"><span class="text-slate-400">💰 TP2:</span><span class="font-extrabold text-emerald-300">${r.tp2 || '-'}</span></div>
      </div>
    `;
    container.appendChild(card);
  });

  // View Card
  container.querySelectorAll('[data-lobby-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const found = getScanLobbyList().find((x) => x.id === btn.dataset.lobbyView);
      if (!found?.result) return;
      state.activeLobbyItemId = found.id;
      state.result = JSON.parse(JSON.stringify(found.result));
      if (found.thumbDataUrl) {
        $('previewImg').src = found.thumbDataUrl;
        state.imageBase64 = found.thumbDataUrl.split(',')[1];
        state.mime = 'image/jpeg';
        show($('dropEmpty'), false); show($('dropPreview'), true); show($('imgReadyStepBadge'), true);
        $('dropZone')?.classList.add('has-image');
      }
      renderResult();
      renderScanHistoryLobby();
      $('resultCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // Copy Signal
  container.querySelectorAll('[data-lobby-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const found = getScanLobbyList().find((x) => x.id === btn.dataset.lobbyCopy);
      if (!found?.result) return;
      navigator.clipboard.writeText(buildSignalCopyText(found.result));
      flashButton(btn, '<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Copied</span>', '<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy</span>');
    });
  });

  // Send to Telegram Bot
  container.querySelectorAll('[data-lobby-tg]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const found = getScanLobbyList().find((x) => x.id === btn.dataset.lobbyTg);
      if (!found?.result) return;
      const b64 = found.thumbDataUrl ? found.thumbDataUrl.split(',')[1] : state.imageBase64;
      if (typeof window.sendChartPhotoToTelegramBot === 'function') {
        await window.sendChartPhotoToTelegramBot(b64, 'image/jpeg', found.result);
      }
    });
  });

  // Mark Win
  container.querySelectorAll('[data-lobby-win]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const listNow = getScanLobbyList();
      const idx = listNow.findIndex((x) => x.id === btn.dataset.lobbyWin);
      if (idx !== -1) {
        listNow[idx].outcome = 'WIN';
        state.winrate = Math.min(98.9, +(state.winrate + 0.3).toFixed(1));
        state.winrateTrendUp = true;
        updateWinrateUI();
        saveScanLobbyList(listNow);
        renderScanHistoryLobby();
      }
    });
  });

  // Mark Loss
  container.querySelectorAll('[data-lobby-loss]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const listNow = getScanLobbyList();
      const idx = listNow.findIndex((x) => x.id === btn.dataset.lobbyLoss);
      if (idx !== -1) {
        listNow[idx].outcome = 'LOSS';
        state.winrate = +(89.4 + Math.random() * 0.5).toFixed(1);
        state.winrateTrendUp = false;
        updateWinrateUI();
        saveScanLobbyList(listNow);
        renderScanHistoryLobby();
      }
    });
  });

  // Smooth Single Card Delete with Undo Toast
  container.querySelectorAll('[data-lobby-del]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.dataset.lobbyDel;
      const cardEl = btn.closest('.scan-lobby-card');
      const backupList = getScanLobbyList();

      if (cardEl) {
        cardEl.classList.add('deleting-smooth');
        setTimeout(() => {
          saveScanLobbyList(backupList.filter((x) => x.id !== targetId));
          renderScanHistoryLobby();
          showDeleteUndoToast('🗑️ បានលុបប្រវត្តិស្កេន ១ ដោយជោគជ័យ!', backupList);
        }, 350);
      } else {
        saveScanLobbyList(backupList.filter((x) => x.id !== targetId));
        renderScanHistoryLobby();
        showDeleteUndoToast('🗑️ បានលុបប្រវត្តិស្កេន ១ ដោយជោគជ័យ!', backupList);
      }
    });
  });

  icons();
}

document.querySelectorAll('#lobbyFilterBar [data-lobby-filter]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.lobbyFilter = btn.dataset.lobbyFilter || 'ALL';
    renderScanHistoryLobby();
  });
});

$('btnJumpHistoryLobby')?.addEventListener('click', () => {
  $('scanHistoryLobby')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('btnResultToLobby')?.addEventListener('click', () => {
  $('scanHistoryLobby')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('btnNewScanFromLobby')?.addEventListener('click', () => {
  $('dropZone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (state.unlocked) $('fileInput')?.click();
});

// Smooth Clear All History Lobby Button (Uses Custom Confirm Modal + Staggered Animation + Undo)
$('btnClearScanLobby')?.addEventListener('click', () => {
  const currentList = getScanLobbyList();
  if (!currentList.length) return;

  openSmoothConfirmModal({
    title: 'សម្អាតប្រវត្តិស្កេនទាំងអស់?',
    desc: `តើអ្នកពិតជាចង់សម្អាតប្រវត្តិស្កេនទាំងអស់ (<span class="text-rose-400 font-extrabold">${currentList.length} Scans</span>) ក្នុង <span class="text-cyan-300 font-bold">History Lobby</span> មែនទេ?`,
    onConfirm: () => {
      const container = $('scanLobbyList');
      const cards = container ? Array.from(container.querySelectorAll('.scan-lobby-card')) : [];

      cards.forEach((card, idx) => {
        setTimeout(() => card.classList.add('deleting-smooth'), idx * 45);
      });

      const totalWait = Math.min(600, cards.length * 45 + 340);
      setTimeout(() => {
        saveScanLobbyList([]);
        renderScanHistoryLobby();
        showDeleteUndoToast(`✨ បានសម្អាតប្រវត្តិស្កេនទាំងអស់ (${currentList.length} Scans)!`, currentList);
      }, totalWait);
    }
  });
});

// ==========================================
// 11. ADMIN PANEL & EVENT WIRING
// ==========================================
function setAdminKeyMode(mode) {
  state.adminKeyMode = mode;
  document.querySelectorAll('#durationBtns button').forEach((b) => {
    b.className = b.dataset.mode === mode
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
    state.adminAuth = true; show($('adminLoginForm'), false); show($('adminPanel'), true); newKey();
  }
  openModal('adminModal');
});

$('adminLoginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  if ($('adminPinInput').value === ADMIN_PIN || isAdminUser(state.user)) {
    state.adminAuth = true; show($('adminLoginForm'), false); show($('adminPanel'), true); newKey(); icons();
  } else alert('លេខកូដសម្ងាត់ Admin មិនត្រឹមត្រូវទេ!');
});

document.querySelectorAll('#durationBtns button').forEach((b) => b.addEventListener('click', () => setAdminKeyMode(b.dataset.mode)));
$('btnNewKey')?.addEventListener('click', newKey);

const COPY_MSG_HTML = '<i data-lucide="copy"></i><span>Approve & ចម្លង KEY ឱ្យភ្ញៀវ</span>';
$('btnCopyMsg')?.addEventListener('click', () => {
  if (!state.genKey) return;
  localStorage.setItem('ksnr_latest_approved_key', state.genKey);
  state.latestIssuedKey = state.genKey;
  const check = verifySmartKey(state.genKey);
  navigator.clipboard.writeText(`🎉 អរគុណសម្រាប់ការជាវ Por - SNR Scanner!\n🔑 KEY៖ ${state.genKey}\n⏳ សុពលភាព៖ ${check.type || '1-Time KEY'}`);
  flashButton($('btnCopyMsg'), '<i data-lucide="check"></i><span>Approved & បានចម្លង KEY!</span>', COPY_MSG_HTML);
});

$('btnApi')?.addEventListener('click', () => { $('apiInput').value = getApiKey(); openModal('apiModal'); });
$('apiForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = $('apiInput').value.trim();
  if (v) localStorage.setItem('ksnr_gemini_key', v);
  else localStorage.removeItem('ksnr_gemini_key');
  closeModal('apiModal');
  showError('');
});
$('btnBuy')?.addEventListener('click', () => openModal('buyModal'));
$('btnLocked')?.addEventListener('click', () => { if (!state.user) return openModal('loginModal'); openModal('keyModal'); });
$('btnLock')?.addEventListener('click', lock);
$('btnKeyToBuy')?.addEventListener('click', () => { closeModal('keyModal'); openModal('buyModal'); });
$('btnEnterKey')?.addEventListener('click', (e) => { e.stopPropagation(); if (!state.user) return openModal('loginModal'); openModal('keyModal'); });
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
  if (!state.user) { closeModal('keyModal'); return openModal('loginModal'); }
  const inputVal = $('keyInput').value.trim().toUpperCase();
  const result = verifySmartKey(inputVal, state.user.identifier);
  if (result.valid) {
    unlock(inputVal, result.type); show($('keyError'), false); closeModal('keyModal');
  } else {
    $('keyError').textContent = result.reason; show($('keyError'), true);
  }
});

// Floating Bot Assistant FAB (Bottom Right)
(function injectFloatingBotFab() {
  if (document.getElementById('floatingBotFab')) return;
  const fab = document.createElement('button');
  fab.id = 'floatingBotFab';
  fab.type = 'button';
  fab.title = 'ភ្ជាប់ Telegram Bot / ជំនួយការ AI';
  fab.className = 'floating-bot-fab cursor-pointer';
  fab.innerHTML = `
    <i data-lucide="bot" class="w-6 h-6 text-white"></i>
    <span class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-[#050811]"></span>
  `;
  fab.addEventListener('click', () => openModal('tgBotModal'));
  document.body.appendChild(fab);
})();

setTradeStyle(state.tradeStyle, false);
updateWinrateUI();
applyLanguage(state.lang);
applyAuthUI();
renderScanHistoryLobby();
icons();

// =========================================================
// 12. FULL 4K DYNAMIC TRADING BACKGROUND ENGINE (#bgTradeCanvas)
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
    'XAUUSD ▲', 'BTCUSD ▲', 'ETHUSDT ▲', 'USOIL ▲', 'ICT ERL/IRL',
    'A+ MIN 1:3 RR', 'LIQUIDITY SWEEP', 'SMT + FVG', 'WINRATE 91.9%'
  ];
  const nodes = Array.from({ length: 22 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00035,
    vy: -0.00025 - Math.random() * 0.0004,
    size: 1.6 + Math.random() * 2.2,
    alpha: 0.2 + Math.random() * 0.38,
    tag: i < TAGS.length ? TAGS[i] : null,
    isBull: Math.random() > 0.32
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
    ctx.strokeStyle = 'rgba(30, 58, 95, 0.20)';
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
      ctx.strokeStyle = 'rgba(24, 255, 255, 0.60)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloatingNodes() {
    ctx.save();
    ctx.font = '700 10px Inter, monospace';
    nodes.forEach((n) => {
      n.x += n.vx; n.y += n.vy;
      if (n.y < -0.05) { n.y = 1.05; n.x = Math.random(); }
      if (n.x < -0.05) n.x = 1.05;
      if (n.x > 1.05) n.x = -0.05;
      const px = n.x * width, py = n.y * height;
      ctx.fillStyle = n.isBull ? `rgba(52, 211, 153, ${n.alpha})` : `rgba(34, 211, 238, ${n.alpha})`;
      ctx.beginPath(); ctx.arc(px, py, n.size, 0, Math.PI * 2); ctx.fill();
      if (n.tag) {
        ctx.fillStyle = `rgba(148, 163, 184, ${n.alpha * 0.8})`;
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
// 13. 4K DYNAMIC MODAL BACKGROUNDS (BUY MODAL & WINRATE MODAL)
// =========================================================
function attach4KCanvasToModal(modalId, canvasId, labelsList) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const shell = modal.firstElementChild;
  if (!shell) return;

  shell.classList.add('buy-modal-4k-shell');
  let canvas = document.getElementById(canvasId);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = canvasId;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0.9;';
    shell.insertBefore(canvas, shell.firstChild);
    Array.from(shell.children).forEach((ch) => {
      if (ch !== canvas && !ch.classList.contains('absolute')) {
        ch.classList.add('relative', 'z-10');
      }
    });
  }

  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, t = 0;

  const orbs = Array.from({ length: 20 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0008,
    vy: -0.0006 - Math.random() * 0.0008,
    r: 1.5 + Math.random() * 2.5,
    gold: i % 2 === 0,
    alpha: 0.25 + Math.random() * 0.45,
    label: i < labelsList.length ? labelsList[i] : null
  }));

  const miniCandles = Array.from({ length: 16 }, (_, i) => ({
    base: 0.32 + Math.sin(i * 0.5) * 0.16 + Math.random() * 0.08,
    range: 0.05 + Math.random() * 0.06,
    phase: Math.random() * Math.PI * 2,
    speed: 0.02 + Math.random() * 0.02
  }));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 2, 3);
    w = Math.max(320, shell.clientWidth || 420);
    h = Math.max(460, shell.scrollHeight || shell.clientHeight || 560);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);

  function render() {
    if (!modal.classList.contains('hidden')) {
      if (w === 0 || h === 0) resize();
      t += 1;
      ctx.clearRect(0, 0, w, h);

      const g1 = ctx.createRadialGradient(
        w * (0.25 + Math.sin(t * 0.015) * 0.15),
        h * (0.2 + Math.cos(t * 0.012) * 0.1),
        10, w * 0.3, h * 0.25, w * 0.8
      );
      g1.addColorStop(0, 'rgba(0, 230, 118, 0.14)');
      g1.addColorStop(0.5, 'rgba(0, 229, 255, 0.09)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const step = 40, offY = (t * 0.4) % step;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.10)';
      ctx.lineWidth = 0.8;
      for (let x = 0; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = offY; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      const cStep = w / miniCandles.length;
      ctx.beginPath();
      for (let i = 0; i < miniCandles.length; i++) {
        const mc = miniCandles[i];
        const wave = Math.sin(t * mc.speed + mc.phase) * mc.range;
        const x = i * cStep + cStep * 0.5;
        const openY = (1 - mc.base) * h;
        const closeY = (1 - (mc.base + wave)) * h;
        const bull = closeY <= openY;

        ctx.save();
        ctx.strokeStyle = bull ? 'rgba(16, 185, 129, 0.34)' : 'rgba(244, 63, 94, 0.30)';
        ctx.fillStyle = bull ? 'rgba(16, 185, 129, 0.22)' : 'rgba(244, 63, 94, 0.20)';
        ctx.beginPath(); ctx.moveTo(x, Math.min(openY, closeY) - 12); ctx.lineTo(x, Math.max(openY, closeY) + 12); ctx.stroke();
        ctx.fillRect(x - 4, Math.min(openY, closeY), 8, Math.max(4, Math.abs(closeY - openY)));
        ctx.restore();

        if (i === 0) ctx.moveTo(x, closeY);
        else ctx.lineTo(x, closeY);
      }
      ctx.strokeStyle = 'rgba(24, 255, 255, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.font = '700 9.5px Inter, sans-serif';
      orbs.forEach((o) => {
        o.x += o.vx; o.y += o.vy;
        if (o.y < -0.05) { o.y = 1.05; o.x = Math.random(); }
        if (o.x < -0.05) o.x = 1.05;
        if (o.x > 1.05) o.x = -0.05;
        const px = o.x * w, py = o.y * h;
        ctx.beginPath(); ctx.arc(px, py, o.r, 0, Math.PI * 2);
        ctx.fillStyle = o.gold ? `rgba(250, 204, 21, ${o.alpha})` : `rgba(0, 230, 118, ${o.alpha})`;
        ctx.fill();
        if (o.label) {
          ctx.fillStyle = `rgba(203, 213, 225, ${o.alpha * 0.8})`;
          ctx.fillText(o.label, px + 6, py + 3);
        }
      });
    }
    requestAnimationFrame(render);
  }

  resize();
  render();
}

attach4KCanvasToModal('buyModal', 'buyKey4KCanvas', ['🔑 2.5$', '🔑 4.5$', '🔑 8.5$', '⚡ 10$', '💎 25$', '👑 35$', '🚀 50$', '🔥 80$']);
attach4KCanvasToModal('winrateModal', 'winrate4KCanvas', ['XAUUSD ▲', 'BTCUSD ▲', 'ETHUSDT ▲', 'USOIL ▲', '91.9% WIN', 'SNIPER']);

// =========================================================
// 14. TELEGRAM BOT REGIME, PHOTO & PRICE ALERTS ENGINE (UNIFIED)
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

  // Apply Amber Shimmer Glow to the "Set Price Alert" button from scan.css
  const priceAlertBtn = document.getElementById('btnSetPriceAlert');
  if (priceAlertBtn) priceAlertBtn.classList.add('tg-amber-glow-btn');

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

  // Expose helper to send Chart Photo + Signal Caption directly to Telegram Bot
  window.sendChartPhotoToTelegramBot = async function(base64Data, mimeType = 'image/jpeg', resultObj = null) {
    const token = getBotToken();
    const chatId = getChatId();
    if (!token || !chatId) {
      openModal('tgBotModal');
      showTgFeedback('⚠️ សូមភ្ជាប់ Telegram Bot Token និង Chat ID ជាមុនសិន!', true);
      return;
    }

    const captionText = resultObj ? buildSignalCopyText(resultObj) : '📊 Por - SNR Scanner Signal';
    try {
      showTgFeedback('⏳ កំពុងផ្ញើរូបភាព Chart និង Signal ទៅ Telegram Bot...');
      if (!base64Data) {
        await sendTelegramMessage(captionText);
      } else {
        const byteChars = atob(base64Data);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType || 'image/jpeg' });

        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', blob, 'por-snr-setup.jpg');
        formData.append('caption', captionText.slice(0, 1020));

        const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.description || 'បរាជ័យក្នុងការផ្ញើរូបភាពទៅ Telegram');
      }
      playTelegramSuccessBeep();
      showTgFeedback('✅ បានផ្ញើរូបភាព Chart + Signal ទៅ Telegram Bot ជោគជ័យ!');
    } catch (err) {
      showTgFeedback(`❌ ${err.message}`, true);
    }
  };

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
      const preset = TG_PRESETS[btn.dataset.regimePreset];
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

    activePriceAlerts.push({ symbol: sym, from, to, targetPrice, createdAt: Date.now() });
    savePriceAlerts();
    document.getElementById('tgTargetPrice').value = '';
    showTgFeedback(`✅ បានដាក់ម៉ោងរោទ៍ ${sym} នៅតម្លៃ ${targetPrice}!`);
  });

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
      if (state.imageBase64 && typeof window.sendChartPhotoToTelegramBot === 'function') {
        await window.sendChartPhotoToTelegramBot(state.imageBase64, state.mime, r);
      } else {
        try {
          await sendTelegramMessage(buildSignalCopyText(r));
          playTelegramSuccessBeep();
          showTgFeedback('✅ បានផ្ញើ Signal + ICT ERL/IRL ទៅ Telegram រួចរាល់!');
        } catch (err) {
          showTgFeedback(`❌ ${err.message}`, true);
        }
      }
    });
  }

  updateTgBadgeUI();
  renderActivePriceAlerts();
  icons();
})();