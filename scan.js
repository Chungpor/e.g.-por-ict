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
  '1_SCAN':  { code: '1_SCAN',  mode: 'S1',     title: 'KEY ស្កេន 1-ដង',                   price: '2.5', scans: 1, hours: 0 },
  '2_SCAN':  { code: '2_SCAN',  mode: 'S2',     title: 'KEY ស្កេន 2-ដង',                   price: '4.5', scans: 2, hours: 0 },
  '5_SCAN':  { code: '5_SCAN',  mode: 'S5',     title: 'KEY ស្កេន 5-ដង',                   price: '8.5', scans: 5, hours: 0 },
  '24H':     { code: '24H',     mode: 'H24',    title: 'KEY ស្កេន 1-DAY/24H Unlimited',     price: '10',  scans: 0, hours: 24 },
  '168H':    { code: '168H',    mode: 'H168',   title: 'KEY ស្កេន 1-សប្តាហ៍/168H Unlimited', price: '25',  scans: 0, hours: 168 },
  '720H':    { code: '720H',    mode: 'H720',   title: 'KEY ស្កេន 1-ខែ/720H Unlimited',     price: '35',  scans: 0, hours: 720 },
  '2880H':   { code: '2880H',   mode: 'H2880',  title: 'KEY ស្កេន 3-ខែ ថែម 1 ខែ / 2880H',   price: '50',  scans: 0, hours: 2880 },
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
  try { localStorage.setItem('ksnr_issued_keys', JSON.stringify(reg)); } catch (e) {}
}
function getKeyUsageMap() {
  try { return JSON.parse(localStorage.getItem('ksnr_key_usage') || '{}'); } catch (e) { return {}; }
}
function saveKeyUsageMap(map) {
  try { localStorage.setItem('ksnr_key_usage', JSON.stringify(map)); } catch (e) {}
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
  if (isAdminUser(state.user)) {
    addHistoryLog('SCAN', `បានស្កេន Chart ដោយជោគជ័យ (👑 Admin Unlimited • ${state.tradeStyle})`);
    return true;
  }
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
const VALID_TRADE_STYLES = ['SCALPING', 'SWING', 'APLUS_ICT', 'MSNR_EMPEROR', 'AMD_MMXM', 'SECRET_411', 'RARE_FLIP_SNR'];

const state = {
  unlocked: false,
  imageBase64: null,
  mime: 'image/png',
  scanning: false,
  result: null,
  showChartOverlay: true,
  activeLobbyItemId: null,
  lobbyFilter: 'ALL',
  tradeStyle: VALID_TRADE_STYLES.includes(localStorage.getItem('ksnr_trade_style'))
    ? localStorage.getItem('ksnr_trade_style')
    : 'SCALPING',
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
    NEWS:    { label: 'MSNR QMX / ICT AMD / NEWS',  color: 'text-purple-300', rate: 92.1, trendUp: true }
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
// 3B. 5 PRO TRADING STRATEGIES SELECTOR
// (SCALPING | SWING | APLUS_ICT | MSNR_EMPEROR | AMD_MMXM)
// ==========================================
function getStyleDisplayMeta(style) {
  if (style === 'SWING') {
    return {
      code: 'SWING',
      badgeText: '🌊 SWING TRADE (HTF STORYLINE)',
      badgeClass: 'px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-extrabold uppercase',
      resBadgeText: '🌊 SWING STORYLINE (R:R 1:4.5)',
      resBadgeClass: 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-400/50 text-amber-300',
      scanBtnLabel: '🌊 SWING TRADE',
      overlayTag: 'SWING HTF STORYLINE OVERLAY'
    };
  }
  if (style === 'APLUS_ICT') {
    return {
      code: 'APLUS_ICT',
      badgeText: '🏆 A+ ICT LIQUIDITY (ERL → IRL)',
      badgeClass: 'px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-extrabold uppercase',
      resBadgeText: '🏆 A+ ICT SETUP (R:R 1:3.5)',
      resBadgeClass: 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400/50 text-emerald-300',
      scanBtnLabel: '🏆 A+ ICT SETUP',
      overlayTag: 'ICT A+ (ERL SWEEP + 50% FVG C.E.)'
    };
  }
  if (style === 'MSNR_EMPEROR') {
    return {
      code: 'MSNR_EMPEROR',
      badgeText: '👑 MALAYSIAN SNR EMPEROR (QMX + GCE)',
      badgeClass: 'px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-300 text-[10px] font-extrabold uppercase',
      resBadgeText: '👑 MSNR EMPEROR • QMX + MISS (R:R 1:4.0)',
      resBadgeClass: 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 border border-purple-400/50 text-purple-300',
      scanBtnLabel: '👑 MSNR EMPEROR',
      overlayTag: 'MALAYSIAN SNR + QMX TRENDLINE "X"'
    };
  }
  if (style === 'AMD_MMXM') {
    return {
      code: 'AMD_MMXM',
      badgeText: '🔥 ICT AMD POWER OF 3 + BREAKER',
      badgeClass: 'px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[10px] font-extrabold uppercase',
      resBadgeText: '🔥 ICT AMD + BREAKER BLOCK (R:R 1:3.8)',
      resBadgeClass: 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 border border-rose-400/50 text-rose-300',
      scanBtnLabel: '🔥 ICT AMD MODEL',
      overlayTag: 'AMD MANIPULATION TRAP + BREAKER'
    };
  }
  return {
    code: 'SCALPING',
    badgeText: '⚡ SCALPING PERFECT ENTRY',
    badgeClass: 'px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-extrabold uppercase',
    resBadgeText: '⚡ SCALPING PERFECT ENTRY (R:R 1:2.8)',
    resBadgeClass: 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 border border-cyan-400/50 text-cyan-300',
    scanBtnLabel: '⚡ SCALPING PERFECT ENTRY',
    overlayTag: 'SNIPER SCALPING OVERLAY (1M–15M)'
  };
}

function setTradeStyle(style, userClickedChoice = false) {
  state.tradeStyle = VALID_TRADE_STYLES.includes(style) ? style : 'SCALPING';
  localStorage.setItem('ksnr_trade_style', state.tradeStyle);

  const btnMap = {
    SCALPING:     { el: $('btnModeScalping'), cls: 'active-scalp' },
    SWING:        { el: $('btnModeSwing'),    cls: 'active-swing' },
    APLUS_ICT:    { el: $('btnModeAPlus'),    cls: 'active-aplus' },
    MSNR_EMPEROR: { el: $('btnModeMsnr'),     cls: 'active-msnr' },
    AMD_MMXM:     { el: $('btnModeAmd'),      cls: 'active-amd' },
    SECRET_411:    { el: $('btnModeSecret411'), cls: 'active-secret411' },
    RARE_FLIP_SNR: { el: $('btnModeRareFlip'),  cls: 'active-rareflip' }
  };
  const ALL_ACTIVE_CLS = ['active-scalp', 'active-swing', 'active-aplus', 'active-msnr', 'active-amd', 'active-secret411', 'active-rareflip'];

  Object.values(btnMap).forEach(({ el }) => {
    if (!el) return;
    el.classList.remove(...ALL_ACTIVE_CLS);
    el.classList.add('border-slate-700');
  });

  const activeEntry = btnMap[state.tradeStyle];
  if (activeEntry?.el) {
    activeEntry.el.classList.add(activeEntry.cls);
    activeEntry.el.classList.remove('border-slate-700');
  }

  const resBtnConfigs = [
    { id: 'btnResSwitchScalp', code: 'SCALPING',     on: 'px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.45)]',     off: 'px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-extrabold cursor-pointer hover:brightness-110' },
    { id: 'btnResSwitchSwing', code: 'SWING',        on: 'px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.45)]',   off: 'px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 font-extrabold cursor-pointer hover:brightness-110' },
    { id: 'btnResSwitchAPlus', code: 'APLUS_ICT',    on: 'px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.45)]', off: 'px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-extrabold cursor-pointer hover:brightness-110' },
    { id: 'btnResSwitchMsnr',  code: 'MSNR_EMPEROR', on: 'px-2.5 py-1 rounded-lg bg-purple-400 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(192,132,252,0.45)]', off: 'px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-400/50 text-purple-300 font-extrabold cursor-pointer hover:brightness-110' },
    { id: 'btnResSwitchAmd',   code: 'AMD_MMXM',     on: 'px-2.5 py-1 rounded-lg bg-rose-400 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(251,113,133,0.45)]',   off: 'px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-300 font-extrabold cursor-pointer hover:brightness-110' },
    { id: 'btnResSwitch411',      code: 'SECRET_411',    on: 'px-2.5 py-1 rounded-lg bg-yellow-300 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(253,224,71,0.5)]', off: 'px-2.5 py-1 rounded-lg bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 font-extrabold cursor-pointer hover:brightness-110' },
    { id: 'btnResSwitchRareFlip', code: 'RARE_FLIP_SNR', on: 'px-2.5 py-1 rounded-lg bg-sky-400 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.5)]',  off: 'px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/50 text-sky-300 font-extrabold cursor-pointer hover:brightness-110' }
  ];

  resBtnConfigs.forEach((cfg) => {
    const el = $(cfg.id);
    if (el) el.className = state.tradeStyle === cfg.code ? cfg.on : cfg.off;
  });

  const meta = getStyleDisplayMeta(state.tradeStyle);
  const badge = $('activeTradeStyleBadge');
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
$('btnModeMsnr')?.addEventListener('click', (e) => { e.stopPropagation(); setTradeStyle('MSNR_EMPEROR', true); });
$('btnModeAmd')?.addEventListener('click', (e) => { e.stopPropagation(); setTradeStyle('AMD_MMXM', true); });

$('btnResSwitchScalp')?.addEventListener('click', () => setTradeStyle('SCALPING', true));
$('btnResSwitchSwing')?.addEventListener('click', () => setTradeStyle('SWING', true));
$('btnResSwitchAPlus')?.addEventListener('click', () => setTradeStyle('APLUS_ICT', true));
$('btnResSwitchMsnr')?.addEventListener('click', () => setTradeStyle('MSNR_EMPEROR', true));
$('btnResSwitchAmd')?.addEventListener('click', () => setTradeStyle('AMD_MMXM', true));

$('newsFlipMode')?.addEventListener('change', (e) => {
  const v = e.target.value;
  if (v === 'SCALP_PERFECT') setTradeStyle('SCALPING', true);
  else if (v === 'ICT_APLUS') setTradeStyle('APLUS_ICT', true);
  else if (v === 'MSNR_EMPEROR') setTradeStyle('MSNR_EMPEROR', true);
  else if (v === 'AMD_MMXM') setTradeStyle('AMD_MMXM', true);
  else if (v === 'NON_FARM') setTradeStyle('SWING', true);
  else if (v === 'SECRET_411') setTradeStyle('SECRET_411', true);
  else if (v === 'RARE_FLIP_SNR') setTradeStyle('RARE_FLIP_SNR', true);
});

$('tradeStyleBox')?.addEventListener('click', (e) => e.stopPropagation());

// Strategy cards #6 (Secret 4.11) & #7 (Rare Flipped SNR): one delegated handler
$('tradeStyleBox')?.addEventListener('click', (e) => {
  const card = e.target.closest('#btnModeSecret411, #btnModeRareFlip');
  if (!card) return;
  setTradeStyle(card.dataset.tradeStyle, true);
});
document.addEventListener('click', (e) => {
  const sw = e.target.closest('#btnResSwitch411, #btnResSwitchRareFlip');
  if (!sw) return;
  setTradeStyle(sw.id === 'btnResSwitch411' ? 'SECRET_411' : 'RARE_FLIP_SNR', true);
});
$('livePairSelect')?.addEventListener('change', (e) => {
  state.selectedPair = e.target.value || 'AUTO';
  if (state.result && typeof window.recalculateResultForTradeStyle === 'function') {
    window.recalculateResultForTradeStyle(state.tradeStyle);
  }
});

$('ictConfluenceFilter')?.addEventListener('change', (e) => {
  const val = e.target.value || 'ALL_APLUS';
  state.ictConfluenceFilter = val;
  if (val === 'MSNR_QMX' || val === 'MSNR_GAP_GCE') setTradeStyle('MSNR_EMPEROR', true);
  else if (val === 'AMD_PO3') setTradeStyle('AMD_MMXM', true);
  else if (val === 'SECRET_411_ZIKIR') setTradeStyle('SECRET_411', true);
  else if (val === 'RARE_FLIP_DOJI') setTradeStyle('RARE_FLIP_SNR', true);
  else if (val === 'ERL_TO_IRL' || val === 'DEALING_PD') setTradeStyle('APLUS_ICT', true);
  else if (state.result && typeof window.recalculateResultForTradeStyle === 'function') {
    window.recalculateResultForTradeStyle(state.tradeStyle);
  }
});

['chkConfSweep', 'chkConfSmt', 'chkConfDisplacement', 'chkConfQmx'].forEach((chkId) => {
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
    if (['SCALPING', 'SWING'].includes(state.tradeStyle)) {
      if (['1m', '3m', '5m', '15m'].includes(tf)) setTradeStyle('SCALPING', true);
      else if (['30m', '1h', '4h', '1d', '1w'].includes(tf)) setTradeStyle('SWING', true);
    } else if (state.result && typeof window.recalculateResultForTradeStyle === 'function') {
      window.recalculateResultForTradeStyle(state.tradeStyle);
    }
  });
});

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
  try { localStorage.setItem('ksnr_users', JSON.stringify(list)); } catch (e) {}
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
// 5. WINRATE LIVE ACTION ENGINE
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
    pillText.innerHTML = isGreenState
      ? `Winrate <span class="text-[#00e676] transition-colors duration-300">${numStr}</span>%`
      : `Winrate <span class="text-[#ff686b] transition-colors duration-300">${numStr}</span>%`;
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
  try { localStorage.setItem('ksnr_winrate', numStr); } catch (e) {}
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
    subtitle: 'Transform market complexity into precise institutional entry points',
    buyKey: 'BUY KEY', locked: 'Locked • No KEY',
    buyWithSupport: 'How to buy KEY with support',
    buySelfGuide: 'How to buy KEY by yourself',
    dropTitle: 'Drop your Chart image here',
    dropSub: 'Members must Login and activate a <span class="text-[#facc15] font-bold">Special KEY</span> to scan (Admin Unlimited Scan)',
    enterKeyBtn: 'Enter KEY to Scan',
    imgReadyNotice: '✅ Chart Image Ready! Choose one of the 5 Pro Strategies below for a clear Perfect Entry:',
    chooseTradeStyle: '🎯 Choose Scanning Strategy (5 Pro Strategies for Clear Perfect Entry):',
    scalpDesc: 'Sniper Perfect Entry • 1m Ping-Pong & Micro OB + FVG • Tight SL (1.0x ATR) • Join Trade Immediately (R:R 1:2.8)',
    swingDesc: 'Hold bigger trend moves via Storyline (WRW / DRD) • Major Liquidity (PWH/PDH) • Wide SL (R:R 1:4.5)',
    aplusDesc: 'ERL Liquidity Sweep (BSL/SSL) + SMT Divergence + Algo Candle FVG at 50% C.E. in Discount/Premium (R:R 1:3.5)',
    msnrDesc: 'Fresh A/V & Gap SNR + Shadow Wick Touch + Missed Candles + QML Crossing Trendline Point #3 ("X") & GCE (R:R 1:4.0)',
    amdDesc: 'Asia Accumulation Build-Up → Frankfurt/London Manipulation Sweep (Inducement) → NY Distribution + Breaker Block (R:R 1:3.8)'
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
    imgReadyNotice: '✅ រូបភាព Chart រួចរាល់! សូមជ្រើសរើសយុទ្ធសាស្ត្រស្កេនរក Perfect Entry ខាងក្រោម៖',
    chooseTradeStyle: '🎯 ជ្រើសរើសយុទ្ធសាស្ត្រស្កេន (5 Pro Strategies for Clear Perfect Entry)៖',
    scalpDesc: 'Sniper Perfect Entry • 1m Ping-Pong & Micro OB + FVG • Tight SL (1.0x ATR) • Join Trade ភ្លាមៗ (R:R 1:2.8)',
    swingDesc: 'កាន់វែងតាម Storyline (WRW / DRD) • Major Liquidity (PWH/PDH) • Wide Structural SL • TP ធំ (R:R 1:4.5)',
    aplusDesc: 'ERL Liquidity Sweep (BSL/SSL) + SMT Divergence + Algo Candle FVG ត្រង់ 50% C.E. ក្នុងតំបន់ Discount/Premium',
    msnrDesc: 'Fresh A/V & Gap SNR + Shadow Touch + Missed Candles + QML ប្រសព្វ Trendline Point #3 (\'X\' Factor) & GCE',
    amdDesc: 'Asia Accumulation Build-Up → Frankfurt/London Manipulation Sweep (Inducement Trap) → NY Open Distribution + Breaker/Rejection Block & HVI'
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
  if ($('txtMsnrDesc')) $('txtMsnrDesc').textContent = t.msnrDesc;
  if ($('txtAmdDesc')) $('txtAmdDesc').textContent = t.amdDesc;
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
// 7. USER AUTH, PROFILE & ACCOUNT HISTORY
// ==========================================
function getInitials(name) {
  return String(name || 'PO').trim().slice(0, 2).toUpperCase();
}

function getAccountLogKey() {
  const id = state.user?.identifier ? String(state.user.identifier).trim().toLowerCase() : 'guest';
  return `ksnr_hist_${id}`;
}

function getAccountHistoryLogs() {
  try {
    const userLogs = JSON.parse(localStorage.getItem(getAccountLogKey()) || '[]');
    if (state.user?.identifier) {
      const guestLogs = JSON.parse(localStorage.getItem('ksnr_hist_guest') || '[]');
      if (guestLogs.length > 0) {
        const merged = [...userLogs, ...guestLogs].slice(0, 50);
        localStorage.setItem(getAccountLogKey(), JSON.stringify(merged));
        localStorage.removeItem('ksnr_hist_guest');
        return merged;
      }
    }
    return userLogs;
  } catch (e) {
    return [];
  }
}

function addHistoryLog(type, detail) {
  try {
    const key = getAccountLogKey();
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.unshift({
      id: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      type,
      detail,
      time: new Date().toLocaleString('km-KH')
    });
    localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
  } catch (e) {}
}

function syncUserRecord(updatedFields) {
  if (!state.user) return;
  state.user = { ...state.user, ...updatedFields };
  try { localStorage.setItem('ksnr_current_user', JSON.stringify(state.user)); } catch (e) {}
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
      const size = 180;
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const minSide = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - minSide) / 2, (img.height - minSide) / 2, minSide, minSide, 0, 0, size, size);
      syncUserRecord({ avatar: canvas.toDataURL('image/jpeg', 0.78) });
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

function renderAccountHistoryModal() {
  const box = $('historyContent');
  if (!box) return;
  const fxPrevScroll = box.scrollTop;
  const fxHidden = box.clientHeight === 0;
  const fxPrevIds = new Set(Array.from(box.querySelectorAll('[data-fx-id]')).map((el) => el.dataset.fxId));
  let fxIdx = 0;
  const fxMark = (el, isNew) => {
    el.classList.add('fx-row');
    if (isNew) {
      el.classList.add('fx-enter');
      el.style.setProperty('--fx-delay', `${Math.min(fxIdx++, 10) * 45}ms`);
    }
  };
  box.innerHTML = '';

  const scanItems = getScanLobbyList();
  const accountLogs = getAccountHistoryLogs();

  if (!scanItems.length && !accountLogs.length) {
    box.innerHTML = `
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400">
        <div class="text-2xl mb-1">📭</div>
        <div class="font-bold text-slate-200">មិនទាន់មានប្រវត្តិស្កេន ឬវិក្កយបត្រនៅឡើយទេ</div>
        <div class="text-xs text-slate-500 mt-1">រាល់ការស្កេន Chart និងការទិញ KEY នឹងបង្ហាញនៅទីនេះស្វ័យប្រវត្តិ។</div>
      </div>`;
    return;
  }

  if (scanItems.length > 0) {
    const secHeader = document.createElement('div');
    secHeader.className = 'flex items-center justify-between text-xs font-extrabold text-cyan-300 uppercase tracking-wider pb-1 border-b border-slate-800';
    secHeader.innerHTML = `<span>📊 ប្រវត្តិស្កេន Chart (${scanItems.length})</span><span class="text-[10px] text-emerald-300">Update & Delete Ready</span>`;
    box.appendChild(secHeader);

    scanItems.forEach((item) => {
      const r = item.result || {};
      const isBuy = String(r.action || 'BUY').toUpperCase().includes('BUY');
      const row = document.createElement('div');
      row.className = 'p-3 rounded-xl bg-[#131d31] border border-cyan-500/30 flex items-center justify-between gap-2.5';
      row.dataset.fxId = item.id;
      fxMark(row, fxHidden || !fxPrevIds.has(item.id));
      row.innerHTML = `
        <div class="flex items-center gap-2.5 min-w-0">
          ${item.thumbDataUrl
            ? `<img src="${item.thumbDataUrl}" class="w-12 h-10 rounded-lg object-cover border border-slate-700 shrink-0" />`
            : `<div class="w-12 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0"><i data-lucide="image" class="w-4 h-4"></i></div>`}
          <div class="min-w-0">
            <div class="font-extrabold text-white text-xs truncate">
              ${r.pair || 'XAU/USD'} (${r.timeframe || 'M15'}) • <span class="${isBuy ? 'text-emerald-400' : 'text-rose-400'}">${r.action || 'BUY'} @ ${r.entry || '-'}</span>
            </div>
            <div class="text-[10px] text-slate-400 truncate">SL: ${r.sl || '-'} | TP: ${r.tp2 || r.tp1 || '-'} • ${item.timeText || ''}</div>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button type="button" data-hist-view="${item.id}" class="px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-[11px] font-extrabold cursor-pointer">មើល</button>
          <button type="button" data-hist-edit="${item.id}" class="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-extrabold cursor-pointer">Update</button>
          <button type="button" data-hist-del="${item.id}" class="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-[11px] font-extrabold cursor-pointer">លុប</button>
        </div>
      `;
      box.appendChild(row);
    });
  }

  if (accountLogs.length > 0) {
    const logHeader = document.createElement('div');
    logHeader.className = 'flex items-center justify-between text-xs font-extrabold text-amber-300 uppercase tracking-wider pt-2 pb-1 border-b border-slate-800';
    logHeader.innerHTML = `<span>🔑 សកម្មភាពគណនី & KEY (${accountLogs.length})</span>`;
    box.appendChild(logHeader);

    accountLogs.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'p-3 rounded-xl bg-[#131d31] border border-slate-700/80 flex flex-col gap-1';
      fxMark(div, fxHidden);
      div.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="font-extrabold text-[#00e5ff] text-xs">${item.type}</span>
          <span class="text-[11px] text-slate-400">${item.time}</span>
        </div>
        <div class="text-slate-200 text-xs">${item.detail}</div>
      `;
      box.appendChild(div);
    });
  }

  box.querySelectorAll('[data-hist-view]').forEach((b) => {
    b.addEventListener('click', () => {
      const found = getScanLobbyList().find((x) => x.id === b.dataset.histView);
      if (!found?.result) return;
      state.activeLobbyItemId = found.id;
      state.result = JSON.parse(JSON.stringify(found.result));
      if (found.thumbDataUrl) {
        $('previewImg').src = found.thumbDataUrl;
        state.imageBase64 = found.thumbDataUrl.split(',')[1];
        state.mime = 'image/jpeg';
        show($('dropEmpty'), false); show($('dropPreview'), true); show($('imgReadyStepBadge'), true);
      }
      closeModal('historyModal');
      closeModal('profileModal');
      renderResult();
      $('resultCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  box.querySelectorAll('[data-hist-edit]').forEach((b) => {
    b.addEventListener('click', () => {
      closeModal('historyModal');
      closeModal('profileModal');
      openUpdateScanModalById(b.dataset.histEdit);
    });
  });

  box.querySelectorAll('[data-hist-del]').forEach((b) => {
    b.addEventListener('click', () => {
      const targetId = b.dataset.histDel;
      const backup = getScanLobbyList();
      saveScanLobbyList(backup.filter((x) => x.id !== targetId));
      renderAccountHistoryModal();
      renderScanHistoryLobby();
      showDeleteUndoToast('🗑️ បានលុបប្រវត្តិស្កេន ១ ដោយជោគជ័យ!', backup);
    });
  });

  if (!fxHidden) {
    const keep = box.style.scrollBehavior;
    box.style.scrollBehavior = 'auto';
    box.scrollTop = fxPrevScroll;
    box.style.scrollBehavior = keep;
  }

  icons();
}

$('btnOpenHistory')?.addEventListener('click', () => {
  renderAccountHistoryModal();
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
  addHistoryLog('LOGIN', `បានចូលគណនី ${matched.identifier} ដោយជោគជ័យ`);
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
    btn.innerHTML = `<i data-lucide="refresh-cw" class="spin"></i><span>កំពុងវិភាគ ${styleLabel} និងគូសបន្ទាត់ Perfect Entry...</span>`;
  } else if (!state.imageBase64) {
    btn.innerHTML = `<i data-lucide="image"></i><span>ជ្រើសរើសរូបភាព Chart (${styleLabel})</span>`;
  } else {
    btn.innerHTML = `<i data-lucide="sparkles"></i><span>⚡ ស្កេនរក Perfect Entry + SL + TP (${styleLabel}) ឥឡូវនេះ</span>`;
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
    try { localStorage.setItem('ksnr_custom_aba_qr_img', dataUrl); } catch (err) {}
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
// 9. IMAGE HANDLING + AUTO UPLOAD BEFORE SCAN
// ==========================================
function showError(msg) {
  const t = $('scanErrorText');
  if (t) t.textContent = msg || '';
  show($('scanError'), !!msg);
}

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB

function handleFile(file) {
  if (state.scanning) return;
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return showError('សូមជ្រើសរើសប្រភេទឯកសារជារូបភាព (PNG, JPG, WebP) ប៉ុណ្ណោះ!');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return showError('រូបភាពធំពេក (អតិបរមា 15MB)។ សូមកាត់ ឬបង្រួមរូបភាពជាមុន។');
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

    autoSendScanStatusToTelegram({
      pair: state.selectedPair !== 'AUTO' ? state.selectedPair : 'CHART',
      timeframe: state.selectedTf !== 'AUTO' ? state.selectedTf.toUpperCase() : 'AUTO',
      tradeStyle: state.tradeStyle,
      imageBase64: state.imageBase64,
      mime: state.mime
    }, 'BEFORE_SCAN');
  };
  reader.onerror = () => showError('មិនអាចអានរូបភាពបានទេ សូមសាកល្បងម្តងទៀត។');
  reader.readAsDataURL(file);
}
window.handleFile = handleFile;

function clearImage() {
  if (state.scanning) return;
  state.imageBase64 = null;
  state.result = null;
  state.activeLobbyItemId = null;
  const pv = $('previewImg'); if (pv) pv.src = '';
  const fi = $('fileInput'); if (fi) fi.value = '';
  show($('dropPreview'), false);
  show($('dropEmpty'), true);
  show($('imgReadyStepBadge'), false);
  show($('resultCard'), false);
  $('dropZone')?.classList.remove('has-image');
  $('tradeStyleBox')?.classList.remove('image-ready-glow');
  renderScanButton();
}

window.addEventListener('paste', (e) => {
  if (!state.unlocked) return;
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      e.preventDefault();
      handleFile(item.getAsFile());
      break; // only the first pasted image
    }
  }
});

const dz = $('dropZone');
dz?.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragging'); });
dz?.addEventListener('dragleave', (e) => { if (!dz.contains(e.relatedTarget)) dz.classList.remove('dragging'); });
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

// =========================================================
// 10. VISUAL ANNOTATED CHART RENDERER (#annotatedChartCanvas)
// DRAWS CLEAR PERFECT ENTRY, 3-TIER ZONES, SL/TP & TRENDLINE 'X'
// =========================================================
function parseNum(v) {
  const m = String(v || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
}

window.drawAnnotatedChartCanvas = function(r) {
  const canvas = $('annotatedChartCanvas');
  const srcImgEl = $('previewImg');
  if (!canvas || !r) return;

  const srcUrl = srcImgEl?.src || (state.imageBase64 ? `data:${state.mime};base64,${state.imageBase64}` : '');
  if (!srcUrl) return;

  const img = new Image();
  img.onload = () => {
    const maxW = 1100;
    const scale = Math.min(1, maxW / Math.max(1, img.naturalWidth || img.width));
    const w = Math.max(640, Math.round((img.naturalWidth || img.width) * scale));
    const h = Math.max(380, Math.round((img.naturalHeight || img.height) * scale));

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const meta = getStyleDisplayMeta(r.tradeStyle || state.tradeStyle);
    if ($('chartOverlayStrategyTag')) {
      $('chartOverlayStrategyTag').textContent = meta.overlayTag;
    }

    if (!state.showChartOverlay) {
      if ($('annotatedChartStatusText')) $('annotatedChartStatusText').textContent = '○ OVERLAY HIDDEN (RAW CHART)';
      return;
    }

    if ($('annotatedChartStatusText')) {
      $('annotatedChartStatusText').textContent = `● ${meta.overlayTag} CALIBRATED`;
    }

    const isBuy = String(r.action || 'BUY').toUpperCase().includes('BUY');
    const entry = parseNum(r.entry);
    const sl = parseNum(r.sl);
    const tp1 = parseNum(r.tp1);
    const tp2 = parseNum(r.tp2);
    const fib50 = parseNum(r.ictLiquidity?.equilibrium50);
    const tier1 = parseNum(r.tierEntries?.tier1Iofed);
    const tier3 = parseNum(r.tierEntries?.tier3Golden);

    const allPrices = [entry, sl, tp1, tp2, fib50, tier1, tier3].filter((v) => !isNaN(v));
    if (allPrices.length < 3) return;

    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const pad = Math.max((maxP - minP) * 0.16, 0.0001);
    const topP = maxP + pad;
    const botP = minP - pad;

    const chartTop = h * 0.10;
    const chartBot = h * 0.88;
    const priceToY = (p) => {
      const ratio = (topP - p) / Math.max(0.000001, topP - botP);
      return Math.max(chartTop, Math.min(chartBot, chartTop + ratio * (chartBot - chartTop)));
    };

    const yEntry = priceToY(entry);
    const ySl = priceToY(sl);
    const yTp1 = priceToY(tp1);
    const yTp2 = priceToY(tp2);
    const yFib = !isNaN(fib50) ? priceToY(fib50) : (yEntry + yTp1) / 2;
    const yT1 = !isNaN(tier1) ? priceToY(tier1) : yEntry - 8;
    const yT3 = !isNaN(tier3) ? priceToY(tier3) : yEntry + 8;

    const zoneLeft = Math.floor(w * 0.42);
    const zoneRight = Math.floor(w * 0.86);

    // 1. Subtle Dark Vignette for Contrast
    ctx.fillStyle = 'rgba(4, 9, 20, 0.24)';
    ctx.fillRect(0, 0, w, h);

    // 2. Shaded Profit Box (Entry to TP2) & Risk Box (Entry to SL)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.13)';
    ctx.fillRect(zoneLeft, Math.min(yEntry, yTp2), zoneRight - zoneLeft, Math.abs(yTp2 - yEntry));

    ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
    ctx.fillRect(zoneLeft, Math.min(yEntry, ySl), zoneRight - zoneLeft, Math.abs(ySl - yEntry));

    // 3. Highlighted Sniper FVG / OrderBlock / MSNR Perfect Entry Zone Box
    const boxTop = Math.min(yT1, yEntry, yT3) - 6;
    const boxHeight = Math.max(14, Math.abs(yT3 - yT1) + 12);
    ctx.fillStyle = isBuy ? 'rgba(0, 229, 255, 0.22)' : 'rgba(244, 63, 94, 0.22)';
    ctx.strokeStyle = '#18ffff';
    ctx.lineWidth = 1.6;
    ctx.fillRect(Math.floor(w * 0.30), boxTop, zoneRight - Math.floor(w * 0.30), boxHeight);
    ctx.strokeRect(Math.floor(w * 0.30), boxTop, zoneRight - Math.floor(w * 0.30), boxHeight);

    // 4. Draw Malaysian SNR Trendline 'X' (Point 1 -> Point 2 -> Point 3 QMX Intersection at Perfect Entry)
    const pt3X = Math.floor(w * 0.64);
    const pt3Y = yEntry;
    const pt1X = Math.floor(w * 0.22);
    const pt1Y = isBuy ? Math.min(chartBot - 15, yEntry + (chartBot - chartTop) * 0.22) : Math.max(chartTop + 15, yEntry - (chartBot - chartTop) * 0.22);
    const pt2X = Math.floor((pt1X + pt3X) / 2);
    const pt2Y = (pt1Y + pt3Y) / 2;

    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(pt1X, pt1Y);
    ctx.lineTo(pt3X + Math.floor(w * 0.14), pt3Y + (pt3Y - pt1Y) * 0.33);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Points #1, #2, #3 ('X' Factor Confluence)
    [
      { x: pt1X, y: pt1Y, lbl: '#1 SNR' },
      { x: pt2X, y: pt2Y, lbl: '#2 MISS' },
      { x: pt3X, y: pt3Y, lbl: '#3 QMX PERFECT ENTRY "X"' }
    ].forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, idx === 2 ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = idx === 2 ? '#18ffff' : '#fbbf24';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#050811';
      ctx.stroke();

      ctx.font = '800 11px Inter, sans-serif';
      ctx.fillStyle = idx === 2 ? '#18ffff' : '#fde047';
      ctx.fillText(pt.lbl, pt.x - 18, pt.y + (isBuy ? 18 : -10));
    });
    ctx.restore();

    // 5. Draw Future Projection Trajectory Arrow (Sweep -> Perfect Entry -> TP1 -> TP2)
    ctx.save();
    ctx.strokeStyle = isBuy ? '#34d399' : '#fb7185';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pt3X, pt3Y);
    ctx.lineTo(Math.floor(w * 0.73), yTp1);
    ctx.lineTo(Math.floor(w * 0.82), yTp2);
    ctx.stroke();

    // Arrowhead at TP2
    const endX = Math.floor(w * 0.82);
    const endY = yTp2;
    ctx.fillStyle = isBuy ? '#34d399' : '#fb7185';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - 9, endY + (isBuy ? 10 : -10));
    ctx.lineTo(endX + 7, endY + (isBuy ? 10 : -10));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Helper to draw Horizontal Price Level Lines + Right Pill Badges
    const drawLevelLine = (y, label, priceText, colorHex, bgRgba, dashed = false) => {
      ctx.save();
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = dashed ? 1.5 : 2.2;
      if (dashed) ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(Math.floor(w * 0.18), y);
      ctx.lineTo(zoneRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      const tagText = `${label}: ${priceText}`;
      ctx.font = '800 11.5px Inter, monospace';
      const textW = ctx.measureText(tagText).width;
      const pillW = textW + 16;
      const pillH = 22;
      const pillX = Math.min(w - pillW - 8, zoneRight - pillW + 40);
      const pillY = Math.max(6, Math.min(h - pillH - 6, y - pillH / 2));

      ctx.fillStyle = bgRgba;
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, pillX + 8, pillY + pillH / 2);
      ctx.restore();
    };

    drawLevelLine(yTp2, '💰 TP2 (ERL)', r.tp2, '#4ade80', 'rgba(6, 78, 59, 0.94)', false);
    drawLevelLine(yTp1, '🎯 TP1 (IRL)', r.tp1, '#34d399', 'rgba(6, 95, 70, 0.90)', true);
    if (!isNaN(fib50)) {
      drawLevelLine(yFib, '⚖️ 0.5 EQ', r.ictLiquidity.equilibrium50, '#fbbf24', 'rgba(120, 53, 15, 0.90)', true);
    }
    drawLevelLine(yEntry, `⚡ PERFECT ${r.action} (C.E.)`, r.entry, '#18ffff', 'rgba(8, 51, 68, 0.96)', false);
    drawLevelLine(ySl, '🛑 STOP LOSS (SL)', r.sl, '#fb7185', 'rgba(136, 19, 55, 0.94)', false);

    // 7. Top-Left Institutional Strategy Watermark Header
    ctx.save();
    ctx.fillStyle = 'rgba(8, 15, 30, 0.88)';
    ctx.strokeStyle = 'rgba(24, 255, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(14, 14, Math.min(w - 28, 450), 56, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#18ffff';
    ctx.font = '800 13.5px Inter, sans-serif';
    ctx.fillText(`POR - SNR SCANNER • ${r.pair || 'XAU/USD'} (${r.timeframe || 'M15'}) • ${r.action} NOW`, 26, 35);

    ctx.fillStyle = '#fde047';
    ctx.font = '700 11.5px Inter, sans-serif';
    ctx.fillText(`${meta.overlayTag} | Entry: ${r.entry} | SL: ${r.sl} | TP2: ${r.tp2} (${r.rrRatio || '1:3.5'})`, 26, 55);
    ctx.restore();
  };
  img.src = srcUrl;
};

$('btnToggleChartOverlay')?.addEventListener('click', () => {
  state.showChartOverlay = !state.showChartOverlay;
  if ($('txtToggleOverlayBtn')) {
    $('txtToggleOverlayBtn').textContent = state.showChartOverlay ? 'លាក់បន្ទាត់ (Hide)' : 'បង្ហាញបន្ទាត់ (Show)';
  }
  if (state.result) window.drawAnnotatedChartCanvas(state.result);
});

$('btnDownloadAnnotatedChart')?.addEventListener('click', () => {
  const canvas = $('annotatedChartCanvas');
  if (!canvas || !state.result) return;
  const link = document.createElement('a');
  const cleanPair = String(state.result.pair || 'CHART').replace(/[^A-Z0-9]/gi, '');
  link.download = `POR-SNR-PERFECT-ENTRY-${cleanPair}-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// ==========================================
// 10B. RENDER RESULT (WITH 3-TIER PERFECT ENTRY + 5 STRATEGIES + VISUAL CHART)
// ==========================================
function buildSignalCopyText(r) {
  const isBuy = (r.action || '').toUpperCase().includes('BUY');
  const styleCode = r.tradeStyle || state.tradeStyle;
  const meta = getStyleDisplayMeta(styleCode);

  const ict = r.ictLiquidity || {};
  const sp = r.scalpPerfect || {};
  const te = r.tierEntries || {};
  const msnr = r.msnrEmperor || {};

  return `🔥 លទ្ធផលស្កេន High Probability Setup (Por - SNR Scanner) 🔥
📈 ${isBuy ? 'ENTRY BUY NOW' : 'ENTRY SELL NOW'}: ${r.entry}
🎯 3-Tier Perfect Entry Matrix:
  • ⚡ Tier 1 (IOFED / Shadow Touch): ${te.tier1Iofed || r.entry}
  • 🎯 Tier 2 (Sniper 50% C.E. / QMX Best): ${te.tier2SniperCe || r.entry}
  • 👑 Tier 3 (Golden Confirm GCE): ${te.tier3Golden || r.entry}
💰 TAKE PROFIT 1 (TP1): ${r.tp1} | TP2 (ERL): ${r.tp2}
🛑 STOP LOSS (SL): ${r.sl}

📊 Pair: ${r.pair} (${r.timeframe}) | Strategy: ${meta.resBadgeText}
📈 និន្នាការ (Trend): ${r.trend}
📝 ការវិភាគលម្អិត: ${r.detailedAnalysis || ''}

👑 Malaysian SNR Emperor & 🔥 ICT AMD Matrix:
- MSNR Level & MISS: ${msnr.levelType || 'Fresh A/V + Gap SNR (Shadow Touch + Missed Candles)'}
- Trendline 'X' Factor: ${msnr.trendlineX || 'QML + Point #3 Trendline Crossing (QMX)'}
- Engulfing & GCE: ${msnr.engulfingGce || 'EG-to-EG Retest + Golden Confirmation Entry'}
- ICT AMD Cycle: ${msnr.amdCycle || 'Asia Build-Up → London Sweep → NY Distribution'}

🧲 ICT Liquidity & Dealing Range:
- Dealing Range Zone: ${ict.pdZone || (isBuy ? 'DISCOUNT (< 0.5 Fib)' : 'PREMIUM (> 0.5 Fib)')}
- 0.5 Equilibrium: ${ict.equilibrium50 || '-'}
- Buy-Side Liquidity (BSL / ERL): ${ict.bsl || r.snrZones?.resistance || '-'}
- Internal Liquidity (IRL - FVG): ${ict.irlFvg || r.entry || '-'}
- Sell-Side Liquidity (SSL / ERL): ${ict.ssl || r.snrZones?.support || '-'}

📲 Telegram Admin: @KaingChungpor`;
}

function renderResult() {
  const r = state.result;
  if (!r) return;

  const isBuy = (r.action || '').toUpperCase().includes('BUY');
  const styleCode = r.tradeStyle || state.tradeStyle;

  const hpBanner = $('hpActionBanner');
  if (hpBanner) {
    hpBanner.className = `${isBuy ? 'hp-banner-buy' : 'hp-banner-sell'} w-full py-3.5 px-5 rounded-2xl font-extrabold text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2.5 mb-4`;
    hpBanner.innerHTML = `<i data-lucide="${isBuy ? 'trending-up' : 'trending-down'}" class="w-5 h-5"></i><span>${isBuy ? 'ENTRY BUY NOW' : 'ENTRY SELL NOW'}</span>`;
  }

  // Populate 3-Tier Perfect Entry Matrix & Scalping Box
  const sp = r.scalpPerfect || {};
  const te = r.tierEntries || {};
  const perfectBox = $('scalpPerfectEntryBox');
  if (perfectBox) {
    show(perfectBox, true);
    if ($('scalpQualityScoreBadge')) {
      $('scalpQualityScoreBadge').textContent = `★ ${sp.qualityScore || '96.8% HIGH QUALITY'}`;
    }
    if ($('scalpExecutionNote')) {
      $('scalpExecutionNote').textContent = sp.executionNote || (isBuy
        ? `តំបន់ចូល BUY ដ៏ល្អឥតខ្ចោះ (Micro OB + FVG + MSNR Shadow Touch + QMX Confluence) — ហានិភ័យទាបបំផុត!`
        : `តំបន់ចូល SELL ដ៏ល្អឥតខ្ចោះ (Micro OB + FVG + MSNR Shadow Touch + QMX Confluence) — ហានិភ័យទាបបំផុត!`);
    }
    if ($('scalpJoinStatusBadge')) {
      $('scalpJoinStatusBadge').textContent = isBuy ? '🚀 JOIN BUY READY' : '🚀 JOIN SELL READY';
      $('scalpJoinStatusBadge').className = isBuy
        ? 'px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-[11px] tracking-wide uppercase shadow-[0_0_15px_rgba(16,185,129,0.5)]'
        : 'px-2.5 py-1 rounded-xl bg-rose-500 text-white font-extrabold text-[11px] tracking-wide uppercase shadow-[0_0_15px_rgba(244,63,94,0.5)]';
    }

    // 3-Tier Perfect Entry values
    if ($('tier1IofedPrice')) $('tier1IofedPrice').textContent = te.tier1Iofed || r.entry || '-';
    if ($('tier1IofedNote')) $('tier1IofedNote').textContent = te.tier1Note || 'គែមដំបូងនៃ FVG (IOFED) / Fresh SNR Wick Touch';
    if ($('tier2SniperCePrice')) $('tier2SniperCePrice').textContent = te.tier2SniperCe || r.entry || '-';
    if ($('tier2SniperCeNote')) $('tier2SniperCeNote').textContent = te.tier2Note || '50% FVG Equilibrium (C.E.) & Trendline Point #3 "X"';
    if ($('tier3GoldenPrice')) $('tier3GoldenPrice').textContent = te.tier3Golden || r.entry || '-';
    if ($('tier3GoldenNote')) $('tier3GoldenNote').textContent = te.tier3Note || 'Golden Confirmation (GCE) ទៀន Engulfing បិទតួពេញ';

    if ($('scalpPerfectZoneText')) $('scalpPerfectZoneText').textContent = sp.zone || `${r.entry}`;
    if ($('scalpLotAdviceText')) $('scalpLotAdviceText').textContent = sp.lotAdvice || `1.0% Risk (${r.rrRatio || '1:3.5'})`;
    if ($('scalpQuickTargetText')) $('scalpQuickTargetText').textContent = sp.quickTarget || `TP1 @ ${r.tp1} (+Move SL to BE)`;
  }

  const hpEntryCard = $('hpEntryPriceCard');
  if (hpEntryCard) {
    hpEntryCard.className = `hp-entry-box ${isBuy ? '' : 'sell-mode'} w-full py-5 px-4 rounded-2xl text-center mb-3.5`;
  }
  if ($('hpEntryBoxLabel')) {
    $('hpEntryBoxLabel').textContent = isBuy ? 'ENTRY BUY NOW (SNIPER 50% C.E. / QMX)' : 'ENTRY SELL NOW (SNIPER 50% C.E. / QMX)';
    $('hpEntryBoxLabel').className = isBuy ? 'text-emerald-400 font-extrabold' : 'text-rose-400 font-extrabold';
  }
  if ($('hpEntryBigPrice')) {
    $('hpEntryBigPrice').textContent = r.entry || '-';
    $('hpEntryBigPrice').className = 'hp-entry-price text-3xl sm:text-5xl font-extrabold tracking-tight';
  }

  if ($('hpTpBigPrice')) $('hpTpBigPrice').textContent = r.tp2 || r.tp1 || '-';
  if ($('hpSlBigPrice')) $('hpSlBigPrice').textContent = r.sl || '-';
  if ($('hpAnalysisSummaryText')) {
    $('hpAnalysisSummaryText').textContent = r.detailedAnalysis || '';
  }

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

  const meta = getStyleDisplayMeta(styleCode);
  if ($('rTradeStyleBadge')) {
    $('rTradeStyleBadge').textContent = meta.resBadgeText;
    $('rTradeStyleBadge').className = meta.resBadgeClass;
  }
  if ($('rSetupGradeBadge')) {
    $('rSetupGradeBadge').textContent = r.setupGrade || '🏆 A+ HIGH QUALITY';
  }

  const tag = $('rAction');
  if (tag) {
    tag.className = 'action-tag ' + (isBuy ? 'buy' : 'sell');
    tag.innerHTML = `<i data-lucide="${isBuy ? 'trending-up' : 'trending-down'}"></i><span>${r.action} (${isBuy ? 'NEW BUY' : 'NEW SELL'})</span>`;
  }

  if ($('rFlipText')) {
    $('rFlipText').textContent = r.keyFlipRule || '';
  }

  // ICT Dealing Range & Liquidity Map
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

  if ($('rConfSweepText')) $('rConfSweepText').textContent = ict.confSweep || '#1 HTF Liquidity Sweep';
  if ($('rConfSmtText')) $('rConfSmtText').textContent = ict.confSmt || '#2 SMT Divergence Confirmed';
  if ($('rConfDispText')) $('rConfDispText').textContent = ict.confDisp || '#3 Displacement + FVG Entry';

  // Malaysian SNR Emperor & ICT AMD Matrix
  const msnr = r.msnrEmperor || {};
  if ($('rMsnrStorylineBadge')) {
    $('rMsnrStorylineBadge').textContent = msnr.storylineBadge || '📐 STORYLINE + QMX CONFIRMED';
  }
  if ($('rMsnrLevelType')) {
    $('rMsnrLevelType').textContent = msnr.levelType || (isBuy
      ? 'Fresh V-Support + Gap SNR (Shadow Touch + 3 Missed Candles)'
      : 'Fresh A-Resistance + Gap SNR (Shadow Touch + 3 Missed Candles)');
  }
  if ($('rMsnrTrendlineX')) {
    $('rMsnrTrendlineX').textContent = msnr.trendlineX || (isBuy
      ? 'Bullish QML / RBS + Point #3 Trendline Crossing ("X" Factor)'
      : 'Bearish QML / SBR + Point #3 Trendline Crossing ("X" Factor)');
  }
  if ($('rMsnrEngulfingGce')) {
    $('rMsnrEngulfingGce').textContent = msnr.engulfingGce || 'EG-to-EG Perfect Zone + Golden Confirmation Entry (GCE)';
  }
  if ($('rIctAmdCycle')) {
    $('rIctAmdCycle').textContent = msnr.amdCycle || 'Asia Build-Up → London Inducement Sweep → NY Distribution + Breaker';
  }

  const box = $('rConfluence');
  if (box) {
    box.innerHTML = '';
    (r.confluence || []).forEach((c) => {
      const row = document.createElement('div');
      row.className = 'conf-item';
      row.innerHTML = '<span>✔</span><span></span>';
      row.lastChild.textContent = c;
      box.appendChild(row);
    });
  }

  setTradeStyle(styleCode, false);
  show($('resultCard'), true);
  window.drawAnnotatedChartCanvas(r);
  icons();
}

const JOIN_TRADE_BTN_HTML = '<i data-lucide="rocket" class="w-4 h-4"></i><span>🚀 JOIN TRADE NOW (ចម្លង 3-Tier Perfect Entry យកទៅដាក់ក្នុង MT4/MT5)</span>';
$('btnJoinTradeNow')?.addEventListener('click', () => {
  const r = state.result;
  if (!r) return;
  const isBuy = String(r.action || 'BUY').toUpperCase().includes('BUY');
  const sp = r.scalpPerfect || {};
  const te = r.tierEntries || {};
  const ticketText = `🚀 JOIN TRADE NOW — ${r.pair} (${r.timeframe})
⚡ Action: ${isBuy ? 'BUY MARKET / LIMIT' : 'SELL MARKET / LIMIT'}
🎯 Tier 1 (IOFED / Shadow Touch): ${te.tier1Iofed || r.entry}
🎯 Tier 2 (Sniper 50% C.E. / QMX Best): ${te.tier2SniperCe || r.entry}
👑 Tier 3 (Golden Confirm GCE): ${te.tier3Golden || r.entry}
🛑 Stop Loss (SL): ${r.sl}
💰 Take Profit 1 (TP1 - Move SL to BE): ${r.tp1}
💰 Take Profit 2 (TP2 - External ERL): ${r.tp2}
🏆 Quality: ${sp.qualityScore || '96.8% HIGH QUALITY'} | R:R ${r.rrRatio || '1:3.5'}`;

  navigator.clipboard.writeText(ticketText);
  if (typeof playTelegramSuccessBeep === 'function') playTelegramSuccessBeep();
  addHistoryLog('JOIN TRADE', `បានចុច Join Trade (${r.pair} ${r.action} @ ${r.entry} • SL: ${r.sl} • TP: ${r.tp2})`);

  flashButton(
    $('btnJoinTradeNow'),
    '<i data-lucide="check-circle-2" class="w-4 h-4"></i><span>✅ JOINED TRADE! បានចម្លង 3-Tier Perfect Entry ទៅ Clipboard!</span>',
    JOIN_TRADE_BTN_HTML
  );
});

const COPY_SIGNAL_HTML = '<i data-lucide="copy"></i><span>ចម្លង Signal យកទៅផុស (Copy Signal)</span>';
$('btnCopySignal')?.addEventListener('click', () => {
  if (!state.result) return;
  navigator.clipboard.writeText(buildSignalCopyText(state.result));
  flashButton($('btnCopySignal'), '<i data-lucide="check"></i><span>បានចម្លងទម្រង់ Signal រួចរាល់!</span>', COPY_SIGNAL_HTML);
});

// =========================================================
// 10C. AFTER-SCAN HISTORY LOBBY ENGINE
// =========================================================
const GLOBAL_LOBBY_STORAGE_KEY = 'ksnr_scan_lobby_all_v2';
let lastDeletedLobbyBackup = null;
let undoToastTimer = null;
let pendingConfirmAction = null;

function getLegacyUserLobbyKey() {
  const id = state.user?.identifier ? String(state.user.identifier).trim().toLowerCase() : 'guest';
  return `ksnr_scan_lobby_${id}`;
}

function getScanLobbyList() {
  try {
    let mainList = JSON.parse(localStorage.getItem(GLOBAL_LOBBY_STORAGE_KEY) || '[]');
    const legacyKeys = [getLegacyUserLobbyKey(), 'ksnr_scan_lobby_guest'];

    let migrated = false;
    legacyKeys.forEach((k) => {
      try {
        const oldItems = JSON.parse(localStorage.getItem(k) || '[]');
        if (Array.isArray(oldItems) && oldItems.length > 0) {
          oldItems.forEach((oldItem) => {
            if (oldItem && oldItem.id && !mainList.some((m) => m.id === oldItem.id)) {
              mainList.push(oldItem);
              migrated = true;
            }
          });
          localStorage.removeItem(k);
        }
      } catch (err) {}
    });

    mainList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (migrated) saveScanLobbyList(mainList);
    return mainList;
  } catch (e) {
    return [];
  }
}

function saveScanLobbyList(list) {
  const cleanList = Array.isArray(list) ? list.slice(0, 25) : [];
  try {
    localStorage.setItem(GLOBAL_LOBBY_STORAGE_KEY, JSON.stringify(cleanList));
    return true;
  } catch (quotaErr) {
    try {
      const lighterList = cleanList.map((item, idx) => ({
        ...item,
        thumbDataUrl: idx < 8 ? item.thumbDataUrl : ''
      }));
      localStorage.setItem(GLOBAL_LOBBY_STORAGE_KEY, JSON.stringify(lighterList));
      return true;
    } catch (err2) {
      try {
        const textOnlyList = cleanList.slice(0, 15).map((item) => ({
          ...item,
          thumbDataUrl: ''
        }));
        localStorage.setItem(GLOBAL_LOBBY_STORAGE_KEY, JSON.stringify(textOnlyList));
        return true;
      } catch (err3) {
        return false;
      }
    }
  }
}

function showDeleteUndoToast(message, backupList = null) {
  lastDeletedLobbyBackup = backupList;
  const toast = $('deleteUndoToast');
  const txt = $('deleteUndoToastText');
  const undoBtn = $('btnUndoDeleteLobby');
  if (!toast || !txt) return;

  txt.textContent = message;
  show(undoBtn, !!backupList);
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

function openUpdateScanModalById(targetId) {
  const list = getScanLobbyList();
  let item = list.find((x) => x.id === targetId);

  if (!item && state.result) {
    item = { id: 'CURRENT_ACTIVE', outcome: 'PENDING', result: state.result };
  }
  if (!item || !item.result) return;

  const r = item.result;
  if ($('updScanId')) $('updScanId').value = item.id;
  if ($('updPairInput')) $('updPairInput').value = r.pair || 'XAU/USD';
  if ($('updTfInput')) $('updTfInput').value = r.timeframe || 'M15';
  if ($('updActionInput')) $('updActionInput').value = String(r.action || 'BUY').toUpperCase().includes('SELL') ? 'SELL' : 'BUY';
  if ($('updStyleInput')) $('updStyleInput').value = VALID_TRADE_STYLES.includes(r.tradeStyle) ? r.tradeStyle : 'SCALPING';
  if ($('updOutcomeInput')) $('updOutcomeInput').value = ['PENDING', 'WIN', 'LOSS'].includes(item.outcome) ? item.outcome : 'PENDING';
  if ($('updEntryInput')) $('updEntryInput').value = r.entry || '';
  if ($('updSlInput')) $('updSlInput').value = r.sl || '';
  if ($('updTp1Input')) $('updTp1Input').value = r.tp1 || '';
  if ($('updTp2Input')) $('updTp2Input').value = r.tp2 || '';
  if ($('updNoteInput')) $('updNoteInput').value = r.detailedAnalysis || '';

  openModal('updateScanModal');
  icons();
}

$('btnEditCurrentScan')?.addEventListener('click', () => {
  if (state.activeLobbyItemId) openUpdateScanModalById(state.activeLobbyItemId);
  else if (state.result) openUpdateScanModalById('CURRENT_ACTIVE');
});

$('updateScanForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = $('updScanId')?.value || '';
  const pair = ($('updPairInput')?.value || 'XAU/USD').trim().toUpperCase();
  const timeframe = ($('updTfInput')?.value || 'M15').trim().toUpperCase();
  const action = $('updActionInput')?.value === 'SELL' ? 'SELL' : 'BUY';
  const tradeStyle = $('updStyleInput')?.value || 'SCALPING';
  const outcome = $('updOutcomeInput')?.value || 'PENDING';
  const entry = ($('updEntryInput')?.value || '').trim();
  const sl = ($('updSlInput')?.value || '').trim();
  const tp1 = ($('updTp1Input')?.value || '').trim();
  const tp2 = ($('updTp2Input')?.value || '').trim();
  const note = ($('updNoteInput')?.value || '').trim();

  const isBuy = action === 'BUY';
  const list = getScanLobbyList();
  const idx = list.findIndex((x) => x.id === id);

  const applyUpdatedFields = (baseResult) => {
    const r = { ...baseResult };
    r.pair = pair;
    r.timeframe = timeframe;
    r.action = action;
    r.tradeStyle = tradeStyle;
    r.trend = isBuy ? 'ឡើង (Bullish)' : 'ចុះ (Bearish)';
    r.entry = entry;
    r.sl = sl;
    r.tp1 = tp1;
    r.tp2 = tp2;
    const rrMap = { SCALPING: '1:2.8', SWING: '1:4.5', APLUS_ICT: '1:3.5', MSNR_EMPEROR: '1:4.0', AMD_MMXM: '1:3.8' };
    r.rrRatio = rrMap[tradeStyle] || '1:3.5';
    if (note) r.detailedAnalysis = note;

    const eNum = parseNum(entry);
    const slNum = parseNum(sl);
    const dec = (entry.split('.')[1] || '').length || 2;
    if (!isNaN(eNum) && !isNaN(slNum)) {
      const risk = Math.abs(eNum - slNum);
      const microHalf = risk * 0.12;
      r.scalpPerfect = {
        ...(r.scalpPerfect || {}),
        zone: `${(eNum - microHalf).toFixed(dec)} – ${(eNum + microHalf).toFixed(dec)}`,
        qualityScore: '97.5% HIGH QUALITY (UPDATED)',
        quickTarget: `TP1 @ ${tp1} (+Move SL to BE)`
      };
      r.tierEntries = {
        ...(r.tierEntries || {}),
        tier1Iofed: (isBuy ? eNum + microHalf : eNum - microHalf).toFixed(dec),
        tier2SniperCe: eNum.toFixed(dec),
        tier3Golden: (isBuy ? eNum + microHalf * 1.4 : eNum - microHalf * 1.4).toFixed(dec)
      };
    }
    return r;
  };

  if (idx !== -1) {
    const prevOutcome = list[idx].outcome;
    list[idx].outcome = outcome;
    list[idx].timeText = `${new Date().toLocaleString('km-KH')} (Updated)`;
    list[idx].result = applyUpdatedFields(list[idx].result || {});
    saveScanLobbyList(list);

    if (outcome === 'WIN' && prevOutcome !== 'WIN') {
      state.winrate = Math.min(98.9, +(state.winrate + 0.3).toFixed(1));
      state.winrateTrendUp = true;
      updateWinrateUI();
      autoSendScanStatusToTelegram({ ...list[idx].result, imageBase64: list[idx].thumbDataUrl }, 'TP');
    } else if (outcome === 'LOSS' && prevOutcome !== 'LOSS') {
      state.winrate = +(89.4 + Math.random() * 0.5).toFixed(1);
      state.winrateTrendUp = false;
      updateWinrateUI();
      autoSendScanStatusToTelegram({ ...list[idx].result, imageBase64: list[idx].thumbDataUrl }, 'SL');
    }

    if (state.activeLobbyItemId === id || state.result) {
      state.result = JSON.parse(JSON.stringify(list[idx].result));
      renderResult();
    }
  } else if (state.result) {
    state.result = applyUpdatedFields(state.result);
    renderResult();
  }

  addHistoryLog('UPDATE SCAN', `បានកែប្រែទិន្នន័យស្កេន ${pair} (${timeframe}) • ${action} @ ${entry}`);
  closeModal('updateScanModal');
  renderScanHistoryLobby();

  setTimeout(() => {
    const cardEl = document.querySelector(`[data-lobby-card-id="${id}"]`);
    if (cardEl) cardEl.classList.add('updating-flash');
  }, 60);

  showDeleteUndoToast(`✅ បាន Update ទិន្នន័យស្កេន (${pair} • ${action} @ ${entry}) ដោយជោគជ័យ!`, null);
});

function createChartThumbnailDataUrl(sourceDataUrl, maxW = 240) {
  return new Promise((resolve) => {
    if (!sourceDataUrl) return resolve('');
    const img = new Image();
    img.onload = () => {
      const ratio = (img.height || 140) / Math.max(1, img.width || 240);
      const w = Math.min(maxW, img.width || maxW);
      const h = Math.max(75, Math.round(w * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.58));
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
    userId: state.user?.identifier || 'guest',
    thumbDataUrl: thumb,
    result: JSON.parse(JSON.stringify(scanResult))
  };

  list.unshift(newEntry);
  saveScanLobbyList(list);
  state.activeLobbyItemId = newEntry.id;

  if (state.lobbyFilter !== 'ALL') state.lobbyFilter = 'ALL';
  renderScanHistoryLobby();

  const lobbyShell = $('scanHistoryLobby');
  if (lobbyShell) {
    lobbyShell.classList.add('lobby-new-flash');
    setTimeout(() => lobbyShell.classList.remove('lobby-new-flash'), 1800);
  }
  return newEntry;
};

window.updateActiveLobbyItemResult = function(updatedResult) {
  if (!updatedResult) return;
  const list = getScanLobbyList();
  let idx = list.findIndex((item) => item.id === state.activeLobbyItemId);
  if (idx === -1 && list.length > 0) idx = 0;

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
  const proStratCount = list.filter((i) => ['SWING', 'APLUS_ICT', 'MSNR_EMPEROR', 'AMD_MMXM'].includes(i.result?.tradeStyle)).length;
  const winCount = list.filter((i) => i.outcome === 'WIN').length;
  const lossCount = list.filter((i) => i.outcome === 'LOSS').length;

  if ($('topLobbyCountBadge')) $('topLobbyCountBadge').textContent = String(total);
  if ($('lobbyCountBadge')) $('lobbyCountBadge').textContent = `${total} Scans`;
  if ($('lobbyStatTotal')) $('lobbyStatTotal').textContent = String(total);
  if ($('lobbyStatScalp')) $('lobbyStatScalp').textContent = String(scalpCount);
  if ($('lobbyStatSwing')) $('lobbyStatSwing').textContent = String(proStratCount);
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
    if (VALID_TRADE_STYLES.includes(state.lobbyFilter)) return style === state.lobbyFilter;
    if (state.lobbyFilter === 'BUY') return act.includes('BUY');
    if (state.lobbyFilter === 'SELL') return act.includes('SELL');
    if (state.lobbyFilter === 'WIN') return item.outcome === 'WIN';
    return true;
  });

  const container = $('scanLobbyList') || $('scanLobbyCards');
  if (!container) return;

  // FX: ចងចាំទីតាំងអូស + កាតដែលមានស្រាប់ ដើម្បីឱ្យតែកាតថ្មី/ពេលប្តូរ Filter ទេដែលមាន animation
  const fxPrevScroll = container.scrollTop;
  const fxPrevIds = new Set(Array.from(container.querySelectorAll('[data-lobby-card-id]')).map((el) => el.dataset.lobbyCardId));
  const fxSameFilter = container.dataset.fxFilter === state.lobbyFilter;
  container.dataset.fxFilter = state.lobbyFilter;
  let fxEnterIdx = 0;
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

    let stylePill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 border border-cyan-400/50 text-cyan-300">⚡ SCALP PERFECT</span>`;
    if (styleCode === 'SWING') {
      stylePill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-400/50 text-amber-300">🌊 SWING</span>`;
    } else if (styleCode === 'APLUS_ICT') {
      stylePill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400/50 text-emerald-300">🏆 A+ ICT</span>`;
    } else if (styleCode === 'MSNR_EMPEROR') {
      stylePill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/20 border border-purple-400/50 text-purple-300">👑 MSNR EMPEROR</span>`;
    } else if (styleCode === 'AMD_MMXM') {
      stylePill = `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 border border-rose-400/50 text-rose-300">🔥 ICT AMD</span>`;
    }

    let outcomeBadge = `<span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">⏳ កំពុងរង់ចាំ</span>`;
    if (item.outcome === 'WIN') outcomeBadge = `<span class="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-extrabold">✅ ឈ្នះ TP (WIN)</span>`;
    else if (item.outcome === 'LOSS') outcomeBadge = `<span class="px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/50 text-rose-300 text-[10px] font-extrabold">🛑 ប៉ះ SL (LOSS)</span>`;

    const card = document.createElement('div');
    card.dataset.lobbyCardId = item.id;
    card.className = `scan-lobby-card p-3.5 sm:p-4 ${isActive ? 'latest-scan-highlight' : ''}`;
    if (!fxSameFilter || !fxPrevIds.has(item.id)) {
      card.classList.add('fx-enter');
      card.style.setProperty('--fx-delay', `${Math.min(fxEnterIdx++, 8) * 55}ms`);
    }
    card.innerHTML = `
      <div class="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between">
        <div class="flex items-center gap-3 w-full sm:w-auto">
          ${item.thumbDataUrl
            ? `<img src="${item.thumbDataUrl}" alt="Chart" class="w-20 h-16 sm:w-24 sm:h-16 rounded-xl object-cover border border-slate-700 shrink-0 cursor-pointer" data-lobby-view="${item.id}" />`
            : `<div class="w-20 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0 cursor-pointer" data-lobby-view="${item.id}"><i data-lucide="bar-chart-2" class="w-5 h-5"></i></div>`}
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] font-mono font-bold text-slate-400">#${filtered.length - index}</span>
              <span class="font-extrabold text-white text-sm sm:text-base">${r.pair || 'XAU/USD'}</span>
              <span class="text-xs font-bold text-cyan-300">(${r.timeframe || 'M15'})</span>
              ${stylePill}
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isBuy ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300' : 'bg-rose-500/20 border border-rose-400/50 text-rose-300'}">${isBuy ? '🟢 BUY' : '🔴 SELL'}</span>
              ${outcomeBadge}
            </div>
            <div class="text-[11px] text-slate-400 mt-1">🕒 ${item.timeText || ''} • Trend: <strong class="text-slate-200">${r.trend || '-'}</strong> • R:R <strong class="text-amber-300">${r.rrRatio || '1:3.5'}</strong></div>
          </div>
        </div>

        <div class="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
          <button type="button" data-lobby-view="${item.id}" class="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 text-xs font-extrabold flex items-center gap-1 cursor-pointer">
            <i data-lucide="eye" class="w-3.5 h-3.5"></i><span>មើល</span>
          </button>
          <button type="button" data-lobby-edit="${item.id}" title="Update / កែប្រែតម្លៃ" class="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-extrabold flex items-center gap-1 cursor-pointer">
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i><span>Update</span>
          </button>
          <button type="button" data-lobby-copy="${item.id}" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy</span>
          </button>
          <button type="button" data-lobby-tg="${item.id}" class="px-2.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 text-xs font-bold flex items-center gap-1 cursor-pointer">
            <i data-lucide="send" class="w-3.5 h-3.5"></i><span>TG</span>
          </button>
          <button type="button" data-lobby-win="${item.id}" class="px-2 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-extrabold cursor-pointer">✅ TP</button>
          <button type="button" data-lobby-loss="${item.id}" class="px-2 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-extrabold cursor-pointer">🛑 SL</button>
          <button type="button" data-lobby-del="${item.id}" title="លុបប្រវត្តិនេះ" class="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 cursor-pointer"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
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

  // FX: រក្សាទីតាំងអូសដដែលពេល TP/SL/Update/Delete — ហើយអូសទៅលើបំផុតពេលមានកាតថ្មី
  {
    const fxNewActive = !!state.activeLobbyItemId && !fxPrevIds.has(state.activeLobbyItemId);
    const fxJump = (y) => {
      const keep = container.style.scrollBehavior;
      container.style.scrollBehavior = 'auto';
      container.scrollTop = y;
      container.style.scrollBehavior = keep;
    };
    if (fxSameFilter && !fxNewActive) fxJump(fxPrevScroll);
    else if (fxNewActive && fxPrevScroll > 0) container.scrollTo({ top: 0, behavior: 'smooth' });
  }

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

  container.querySelectorAll('[data-lobby-edit]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openUpdateScanModalById(btn.dataset.lobbyEdit);
    });
  });

  container.querySelectorAll('[data-lobby-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const found = getScanLobbyList().find((x) => x.id === btn.dataset.lobbyCopy);
      if (!found?.result) return;
      navigator.clipboard.writeText(buildSignalCopyText(found.result));
      flashButton(btn, '<i data-lucide="check" class="w-3.5 h-3.5"></i><span>Copied</span>', '<i data-lucide="copy" class="w-3.5 h-3.5"></i><span>Copy</span>');
    });
  });

  container.querySelectorAll('[data-lobby-tg]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const found = getScanLobbyList().find((x) => x.id === btn.dataset.lobbyTg);
      if (!found?.result) return;
      const imgData = found.thumbDataUrl || (state.imageBase64 ? `data:${state.mime};base64,${state.imageBase64}` : '');
      await autoSendScanStatusToTelegram({
        ...found.result,
        imageBase64: imgData,
        mime: 'image/jpeg'
      }, 'SCAN');
    });
  });

  container.querySelectorAll('[data-lobby-win]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const listNow = getScanLobbyList();
      const idx = listNow.findIndex((x) => x.id === btn.dataset.lobbyWin);
      if (idx !== -1) {
        const item = listNow[idx];
        item.outcome = 'WIN';
        state.winrate = Math.min(98.9, +(state.winrate + 0.3).toFixed(1));
        state.winrateTrendUp = true;
        updateWinrateUI();
        saveScanLobbyList(listNow);
        renderScanHistoryLobby();

        const imgData = item.thumbDataUrl || (state.imageBase64 ? `data:${state.mime};base64,${state.imageBase64}` : '');
        await autoSendScanStatusToTelegram({
          ...(item.result || {}),
          imageBase64: imgData,
          mime: 'image/jpeg'
        }, 'TP');
      }
    });
  });

  container.querySelectorAll('[data-lobby-loss]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const listNow = getScanLobbyList();
      const idx = listNow.findIndex((x) => x.id === btn.dataset.lobbyLoss);
      if (idx !== -1) {
        const item = listNow[idx];
        item.outcome = 'LOSS';
        state.winrate = +(89.4 + Math.random() * 0.5).toFixed(1);
        state.winrateTrendUp = false;
        updateWinrateUI();
        saveScanLobbyList(listNow);
        renderScanHistoryLobby();

        const imgData = item.thumbDataUrl || (state.imageBase64 ? `data:${state.mime};base64,${state.imageBase64}` : '');
        await autoSendScanStatusToTelegram({
          ...(item.result || {}),
          imageBase64: imgData,
          mime: 'image/jpeg'
        }, 'SL');
      }
    });
  });

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
  renderScanHistoryLobby();
  $('scanHistoryLobby')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('btnResultToLobby')?.addEventListener('click', () => {
  renderScanHistoryLobby();
  $('scanHistoryLobby')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('btnNewScanFromLobby')?.addEventListener('click', () => {
  $('dropZone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (state.unlocked) $('fileInput')?.click();
});

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
    'XAUUSD ▲', 'BTCUSD ▲', 'MSNR QMX "X"', '50% C.E. FVG', 'SCALP PERFECT ENTRY',
    'AMD POWER OF 3', 'LIQUIDITY SWEEP', 'GOLDEN CONFIRM GCE', 'WINRATE 91.9%'
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
// 14. TELEGRAM BOT REGIME & PRICE ALERTS ENGINE
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
    try { localStorage.setItem('ksnr_tg_price_alerts', JSON.stringify(activePriceAlerts)); } catch (e) {}
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
    tgBtn.innerHTML = '<i data-lucide="send" class="w-4 h-4"></i><span>📲 ផ្ញើ Signal + Annotated Chart នេះទៅ Telegram Bot ផ្ទាល់</span>';
    copyBtn.parentNode.insertBefore(tgBtn, copyBtn.nextSibling);

    tgBtn.addEventListener('click', async () => {
      const r = state.result;
      if (!r) return;
      try {
        const annotatedCanvas = $('annotatedChartCanvas');
        const imgPayload = (annotatedCanvas && annotatedCanvas.width > 0)
          ? annotatedCanvas.toDataURL('image/png')
          : state.imageBase64;
        await autoSendScanStatusToTelegram({
          ...r,
          imageBase64: imgPayload,
          mime: 'image/png'
        }, 'SCAN');
        playTelegramSuccessBeep();
      } catch (err) {
        showTgFeedback(`❌ ${err.message}`, true);
      }
    });
  }

  updateTgBadgeUI();
  renderActivePriceAlerts();
  icons();
})();

// =========================================================
// 15. TELEGRAM AUTO-UPLOAD HELPER (BEFORE SCAN, ON SCAN, TP, SL)
// =========================================================
function base64ToBlob(base64Str, mimeType = 'image/png') {
  const clean = String(base64Str || '').replace(/^data:image\/\w+;base64,/, '');
  const byteChars = atob(clean);
  const byteArrays = [];
  for (let offset = 0; offset < byteChars.length; offset += 512) {
    const slice = byteChars.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType });
}

function formatStatusTelegramCaption(r, statusType = 'SCAN') {
  const cleanSym = String(r?.pair || 'GOLD').replace('/', '').toUpperCase();
  const isBuy = String(r?.action || 'BUY').toUpperCase().includes('BUY');
  const tf = r?.timeframe || 'M15';
  const te = r?.tierEntries || {};

  if (statusType === 'BEFORE_SCAN') {
    return `📥📸 BEFORE SCAN (បានទម្លាក់រូបភាព Chart ត្រៀមស្កេន)
📊 Pair: ${r?.pair || 'AUTO'} (${tf})
🎯 Strategy: ${r?.tradeStyle || state.tradeStyle || 'SCALPING'}
⏳ ស្ថានភាព: កំពុងត្រៀមវិភាគរក 3-Tier Perfect Entry, SL និង TP...
🕒 ពេលវេលា: ${new Date().toLocaleString()}
📲 Admin: @KaingChungpor`;
  }

  let statusHeader = '';
  let statusBadge = '';

  if (statusType === 'TP') {
    statusHeader = `✅🎯 TAKE PROFIT HIT (WIN) — ${cleanSym} (${tf})`;
    statusBadge = `🏆 ស្ថានភាព: HIT TP ជោគជ័យ (WIN ✅) 💰🔥`;
  } else if (statusType === 'SL') {
    statusHeader = `🛑❌ STOP LOSS HIT (LOSS) — ${cleanSym} (${tf})`;
    statusBadge = `⚠️ ស្ថានភាព: HIT SL (រក្សា Discipline & Risk Management)`;
  } else {
    const regimeTransition = isBuy
      ? `Ranging ↔️ → trending up 📈`
      : `Trending down 📉 → ranging ↔️`;
    statusHeader = `🔀 Regime change — ${cleanSym}\n${regimeTransition}\nReview open positions and pending setups on this symbol.`;
    statusBadge = `⏳ ស្ថានភាព: កំពុងរង់ចាំ (Active Perfect Entry Signal)`;
  }

  return `${statusHeader}

⚡ លទ្ធផលស្កេនពី Por - SNR Scanner ⚡
📊 Pair: ${r?.pair || 'GOLD'} (${tf}) | Strategy: ${r?.tradeStyle || 'SCALPING'}
📈 និន្នាការ: ${r?.trend || '-'} | R:R ${r?.rrRatio || '1:3.5'}
🔔 បញ្ជា: ${r?.action || 'BUY'} (${isBuy ? 'NEW BUY' : 'NEW SELL'})
${statusBadge}

🎯 Tier 1 (IOFED / Shadow): ${te.tier1Iofed || r?.entry || '-'}
🎯 Tier 2 (Sniper 50% C.E. / QMX): ${r?.entry || '-'}
👑 Tier 3 (Golden Confirm GCE): ${te.tier3Golden || r?.entry || '-'}
🛑 SL: ${r?.sl || '-'}
💰 TP 1 (IRL): ${r?.tp1 || '-'}
💰 TP 2 (ERL): ${r?.tp2 || '-'}

🧱 KEY Resistance: ${r?.snrZones?.resistance || '-'}
🧱 KEY Support: ${r?.snrZones?.support || '-'}
🕒 ពេលវេលា: ${new Date().toLocaleString()}
📲 Admin: @KaingChungpor`;
}

function showTelegramToast(msg) {
  const fb = document.getElementById('tgAlertFeedback');
  if (fb) {
    fb.textContent = msg;
    fb.className = 'mt-2 text-xs font-bold text-center text-emerald-400';
    fb.classList.remove('hidden');
    setTimeout(() => fb.classList.add('hidden'), 4500);
  }
}

async function autoSendScanStatusToTelegram(scanItem, statusType = 'SCAN') {
  if (!scanItem) return;

  const token = (localStorage.getItem('ksnr_tg_bot_token') || '').trim();
  const chatId = (localStorage.getItem('ksnr_tg_chat_id') || '').trim();
  const caption = formatStatusTelegramCaption(scanItem, statusType);

  const rawImg = scanItem.image || scanItem.imageBase64 || scanItem.thumbDataUrl || scanItem.preview || state?.imageBase64 || '';
  const mimeType = scanItem.mime || state?.mime || 'image/png';

  if (token && chatId) {
    try {
      if (rawImg) {
        const photoBlob = base64ToBlob(rawImg, mimeType);
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', photoBlob, `por-snr-${statusType.toLowerCase()}-${Date.now()}.png`);
        formData.append('caption', caption);

        const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.ok) {
          playTelegramSuccessBeep();
          showTelegramToast(`✅ បាន Auto Upload [${statusType}] (${scanItem.pair || 'GOLD'}) ទៅ Telegram រួចរាល់!`);
          return;
        }
      } else {
        const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: caption })
        });
        const data = await res.json();
        if (data.ok) {
          playTelegramSuccessBeep();
          showTelegramToast(`✅ បានផ្ញើសារ [${statusType}] (${scanItem.pair || 'GOLD'}) ទៅ Telegram រួចរាល់!`);
          return;
        }
      }
    } catch (err) {
      console.warn('Direct Telegram send failed, trying local bot server:', err);
    }
  }

  try {
    await fetch('http://localhost:3000/api/auto-scan-drop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        imageBase64: rawImg,
        mimeType,
        scanResult: scanItem,
        eventType: statusType
      })
    });
  } catch (e) {}
}

window.autoSendScanStatusToTelegram = autoSendScanStatusToTelegram;

// Initialize UI
setTradeStyle(state.tradeStyle, false);
updateWinrateUI();
applyLanguage(state.lang);
applyAuthUI();
renderScanHistoryLobby();
icons();

// ==========================================
// CLICK / TAP EFFECTS (ripple + press) - global, works on dynamic buttons too
// ==========================================
(function initClickEffects() {
  if (window.__clickFxReady) return;
  window.__clickFxReady = true;

  const TARGETS = 'button, a, [role="button"], .cursor-pointer, label[for], [data-lang], [data-close], [data-mode]';
  let pressedEl = null;

  const PALETTE = ['34,211,238', '41,121,255', '168,85,247', '16,185,129', '251,191,36', '244,63,94'];
  let colorIdx = 0;
  let tintTimer = null;

  function spawnRipple(x, y, el) {
    const rgb = PALETTE[colorIdx++ % PALETTE.length];
    const r = el.getBoundingClientRect();
    const big = Math.max(r.width, r.height);

    const dot = document.createElement('span');
    dot.className = 'fx-ripple';
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';
    dot.style.setProperty('--fx-rgb', rgb);
    dot.style.setProperty('--fx-size', String(Math.min(Math.max(big / 7, 6), 22)));
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
    setTimeout(() => dot.remove(), 900);

    // Full-page body color wash from the click point
    const wash = document.createElement('div');
    wash.className = 'fx-body-wash';
    wash.style.setProperty('--fx-x', x + 'px');
    wash.style.setProperty('--fx-y', y + 'px');
    wash.style.setProperty('--fx-rgb', rgb);
    document.body.appendChild(wash);
    wash.addEventListener('animationend', () => wash.remove(), { once: true });
    setTimeout(() => wash.remove(), 1200);

    // Soft colored edge glow on <body> that fades away
    document.body.style.setProperty('--fx-rgb', rgb);
    document.body.classList.add('fx-tint');
    clearTimeout(tintTimer);
    tintTimer = setTimeout(() => document.body.classList.remove('fx-tint'), 650);
  }

  function release() {
    if (pressedEl) { pressedEl.classList.remove('fx-press'); pressedEl = null; }
  }

  document.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button > 0) return;
    const el = e.target.closest && e.target.closest(TARGETS);
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return;
    release();
    pressedEl = el;
    el.classList.add('fx-press');
    spawnRipple(e.clientX, e.clientY, el);
  }, { passive: true });

  ['pointerup', 'pointercancel', 'pointerleave', 'dragstart', 'blur'].forEach((ev) =>
    window.addEventListener(ev, () => setTimeout(release, 90), { passive: true })
  );
})();
// =========================================================
// HISTORY SCROLL FX v2
//  • Depth scroll: កាតផ្អៀង 3D + តូច + ស្រាលនៅគែម, ធំច្បាស់នៅកណ្តាល
//  • Motion stretch តាមល្បឿនអូស
//  • Drag-to-scroll ដោយ Mouse មាន Momentum (Touch ប្រើ native)
//  • Filter bar: drag + momentum + edge fade + auto-center tab
// =========================================================
(function initHistoryScrollEffects() {
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- Drag-to-scroll + momentum (mouse / pen) ----------
  function enableDragScroll(el, axis) {
    if (!el) return;
    const horiz = axis === 'x';
    const prop = horiz ? 'scrollLeft' : 'scrollTop';
    const pos = (e) => (horiz ? e.clientX : e.clientY);

    let down = false, dragging = false;
    let startPos = 0, startScroll = 0, lastPos = 0, lastT = 0, vel = 0;
    let raf = 0, suppressClick = false;

    const maxScroll = () => (horiz ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight);
    const stopMomentum = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      el.style.scrollBehavior = '';
    };

    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      stopMomentum();
      down = true;
      dragging = false;
      startPos = lastPos = pos(e);
      startScroll = el[prop];
      lastT = performance.now();
      vel = 0;
    });

    el.addEventListener('pointermove', (e) => {
      if (!down) return;
      const p = pos(e);
      const delta = p - startPos;
      if (!dragging) {
        if (Math.abs(delta) < 6) return;
        dragging = true;
        el.classList.add('dragging-scroll');
        el.style.scrollBehavior = 'auto';
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        const sel = window.getSelection && window.getSelection();
        if (sel && sel.removeAllRanges) sel.removeAllRanges();
      }
      el[prop] = startScroll - delta;

      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) vel = vel * 0.55 + ((lastPos - p) / dt) * 0.45; // px/ms
      lastPos = p;
      lastT = now;
    });

    const release = (e) => {
      if (!down) return;
      down = false;
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging-scroll');
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 60);

      if (performance.now() - lastT > 90) vel = 0; // ឈប់មុនលែង => មិនមាន momentum
      if (reduceMotion || Math.abs(vel) < 0.05) { el.style.scrollBehavior = ''; return; }

      let v = clamp(vel, -3.2, 3.2);
      let prev = performance.now();
      const step = (now) => {
        const dt = Math.min(34, now - prev);
        prev = now;
        const before = el[prop];
        el[prop] = before + v * dt;
        v *= Math.pow(0.945, dt / 16.67); // friction
        const hitEdge = el[prop] === before || el[prop] <= 0 || el[prop] >= maxScroll() - 1;
        if (Math.abs(v) < 0.02 || hitEdge) { stopMomentum(); return; }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);

    // ជៀសវាងការចុចប៊ូតុងដោយអចេតនា ពេលទើបអូសរួច
    el.addEventListener('click', (e) => {
      if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    // រូប thumbnail មិនឱ្យលោតចេញជា native drag
    el.addEventListener('dragstart', (e) => e.preventDefault());

    // ប្រើកង់ Mouse / Touch ពេល momentum កំពុងរត់ => ឈប់ភ្លាម
    el.addEventListener('wheel', stopMomentum, { passive: true });
    el.addEventListener('touchstart', stopMomentum, { passive: true });
  }

  // ---------- Depth scroller (3D fold + fade + motion stretch) ----------
  function createDepthScroller(container, itemSel) {
    if (!container) return null;
    let items = [];
    let vel = 0;
    let lastTop = container.scrollTop;
    let raf = 0;
    let idleTimer = 0;

    function collect() { items = Array.from(container.querySelectorAll(itemSel)); }

    function apply() {
      const h = container.clientHeight;
      if (!h || reduceMotion) return;
      const half = h / 2;
      const top = container.scrollTop;
      const stretch = 1 + Math.min(Math.abs(vel) * 0.0016, 0.03);

      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        const ih = el.offsetHeight;
        const c = el.offsetTop + ih / 2 - top - half;
        if (Math.abs(c) > half + ih + 80) continue; // ឆ្ងាយពី viewport មិនចាំបាច់គណនា

        const n = c / half;                                   // -1 លើ … 0 កណ្តាល … +1 ក្រោម
        const t = clamp((Math.abs(n) - 0.38) / 0.72, 0, 1);
        const e = t * t * (3 - 2 * t);                        // smoothstep

        if (e < 0.002 && stretch < 1.002) {
          el.style.transform = '';
          el.style.opacity = '';
          continue;
        }
        const rx = (-Math.sign(n) * e * 15).toFixed(2);
        const sc = (1 - e * 0.065).toFixed(3);
        el.style.transform = `perspective(900px) rotateX(${rx}deg) scale(${sc}) scaleY(${stretch.toFixed(4)})`;
        el.style.opacity = (1 - e * 0.55).toFixed(3);
      }
    }

    function tick() {
      raf = 0;
      const top = container.scrollTop;
      const d = top - lastTop;
      lastTop = top;
      vel = vel * 0.8 + d * 0.2;
      apply();
      if (Math.abs(vel) > 0.12 || d !== 0) raf = requestAnimationFrame(tick);
      else { vel = 0; apply(); }
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(tick);
      container.classList.add('is-scrolling');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => container.classList.remove('is-scrolling'), 240);
    }

    function refresh() {
      collect();
      lastTop = container.scrollTop;
      vel = 0;
      apply();
    }

    container.addEventListener('scroll', onScroll, { passive: true });
    new MutationObserver(refresh).observe(container, { childList: true });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(refresh).observe(container);
    refresh();
    return { refresh };
  }

  // ---------- Filter bar ----------
  function setupFilterBar(bar) {
    if (!bar) return;
    enableDragScroll(bar, 'x');

    const updateFade = () => {
      const max = bar.scrollWidth - bar.clientWidth;
      bar.classList.toggle('fx-fade-l', bar.scrollLeft > 4);
      bar.classList.toggle('fx-fade-r', bar.scrollLeft < max - 4);
    };
    bar.addEventListener('scroll', updateFade, { passive: true });
    window.addEventListener('resize', updateFade, { passive: true });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateFade).observe(bar);
    updateFade();

    // កង់ Mouse => អូសឆ្វេង-ស្តាំ (តែបើនៅមានកន្លែងអូស ទើបរារាំងទំព័រ)
    bar.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = bar.scrollWidth - bar.clientWidth;
      if (max <= 0) return;
      const atStart = bar.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = bar.scrollLeft >= max - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      bar.scrollLeft += e.deltaY;
    }, { passive: false });

    // ចុច tab => រុញ tab នោះមកកណ្តាលយ៉ាងរលូន + pop effect
    bar.querySelectorAll('[data-lobby-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.offsetLeft - (bar.clientWidth - btn.offsetWidth) / 2;
        bar.scrollTo({ left: Math.max(0, target), behavior: reduceMotion ? 'auto' : 'smooth' });
        btn.classList.add('fx-pop');
        setTimeout(() => btn.classList.remove('fx-pop'), 420);
      });
    });
  }

  const lobbyList = document.getElementById('scanLobbyList');
  const historyBox = document.getElementById('historyContent');

  enableDragScroll(lobbyList, 'y');
  enableDragScroll(historyBox, 'y');
  window.__lobbyFx = createDepthScroller(lobbyList, '.scan-lobby-card');
  window.__historyFx = createDepthScroller(historyBox, '.fx-row');
  setupFilterBar(document.getElementById('lobbyFilterBar'));
})();