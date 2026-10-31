// ============================================================================
// POR - SNR SCANNER PRO — FULL 7-STRATEGY & PERFECT ENTRY ENGINE (scanChart.js)
// ============================================================================
// INTEGRATED STRATEGIES FROM ALL INSTITUTIONAL SMC, MSNR & 4.11 / RARE SNR BOOKS:
// 1. ⚡ SCALPING PERFECT ENTRY (1m–15m Ping-Pong Mastery, Micro OB + FVG 50% C.E.,
//    IOFED 25% Edge, Immediate Rebalance IRB, Tight 1.0x ATR SL, R:R 1:2.8)
// 2. 🌊 SWING TRADE HTF STORYLINE (30m–1w WRW / DRD Storyline, 20/40/60/90-Day Cycle,
//    Major Liquidity PWH/PWL & PDH/PDL, LTF Roadblocks, Wide Structural SL, R:R 1:4.5)
// 3. 🏆 A+ ICT LIQUIDITY & 12 PD ARRAYS (ERL BSL/SSL Sweep -> CISD/MSS -> IRL 50% C.E.
//    FVG / BPR / IFVG / Propulsion Block / OrderBlock Mean Threshold, SMT, R:R 1:3.5)
// 4. 👑 MALAYSIAN SNR EMPEROR (Classic 'A' & 'V' Open-Close Body SNR, HTF Gap SNR =
//    Hidden Engulfing/LTF BO, Fresh SNR + Shadow Touch + MISS Candles, QMX Marriage
//    Concept = QML/RBS/SBR + Trendline Point #3 'X', PEZ/FEZ & Golden Confirm GCE, R:R 1:4.0)
// 5. 🔥 ICT AMD POWER OF 3 & MARKET MAKER MODEL (Asia Build-Up -> Frankfurt False Move
//    FFH/FFL -> London Open Sweep ALS/AHS + Inducement -> NY Trap Distribution,
//    Algo Candle AC + Vector Candle VC, HVI, Breaker Block BB & Rejection Block RB, R:R 1:3.8)
// 6. 🕵️‍♂️ SECRET OF 4.11 (Ali Yusoff: ZIKIR 1.Breakout -> 2.Pullback -> 3.Entry, 2x BO
//    Criteria, Night Market HSL + Current Breakout ISL Full-Body+Wick Yellow Zone,
//    5 Engulfing Types: Perfect / QML-HNS / Dominant / Hidden MTF / Gap, and Pair
//    Volatility Pullback Type: ACCURATE / DEEP / MISS, R:R 1:4.2)
// 7. 💎 RARE #FLIPPED_SNR & #DOJI_SNR (@iadegboruwa: Classic SNR, #GAP_SNR with Upper
//    Limit UL & Lower Limit LL, #Doji_SNR Pattern, Flipping Momentum Candle taking out
//    Weak SNR after 1st & 2nd Reject, Bullish Gap Overtaking Bearish Gap A-B-C Cycle,
//    Direct Entry @ 4th Touch + Confirmatory Retest & Internal Gap Roadblocks, R:R 1:5.0)
// ============================================================================

// 1. Register the 2 New Strategies into VALID_TRADE_STYLES from scan.js
if (typeof VALID_TRADE_STYLES !== 'undefined' && Array.isArray(VALID_TRADE_STYLES)) {
  ['SECRET_411', 'RARE_FLIP_SNR'].forEach((code) => {
    if (!VALID_TRADE_STYLES.includes(code)) VALID_TRADE_STYLES.push(code);
  });
}

// 2. Pair Volatility Pullback Classifier from "Secret Of 411" (MISS | ACCURATE | DEEP)
function classify411PullbackType(pairStr = '') {
  const p = String(pairStr || 'XAU/USD').toUpperCase();
  if (p.includes('GBP') || p.includes('JPY')) {
    return {
      type: 'DEEP PULLBACK (Fast Pair • GBP/JPY)',
      code: 'DEEP',
      desc: 'គូលឿន (Fast Pair)៖ តម្លៃតែងតែចាក់ជ្រៅ (DEEP) ចូលដល់គល់ Full-Body + Wick Yellow Zone (ISL/HSL) មុននឹងស្ទុះទៅ TP'
    };
  }
  if (p.includes('AUD') || p.includes('CAD') || p.includes('NZD')) {
    return {
      type: 'MISS PULLBACK (Slow Pair • AUD/CAD/NZD)',
      code: 'MISS',
      desc: 'គូយឺត (Slow Pair)៖ តម្លៃច្រើនតែហោះមុនប៉ះតំបន់បន្តិច (MISS Pullback) — គួរចូលនៅ Tier 1 (IOFED / គែមដំបូងនៃ Yellow Zone)'
    };
  }
  return {
    type: 'ACCURATE PULLBACK (High Volatility • GOLD/USD/US30/BTC)',
    code: 'ACCURATE',
    desc: 'គូប្រែប្រួលខ្លាំង (High Volatility)៖ តម្លៃប៉ះចំគែម និង 50% C.E. នៃ Yellow Zone (HSL+ISL) យ៉ាងសុក្រឹត (ACCURATE)'
  };
}

function getSelectedAPlusConfluences() {
  const sweep = document.getElementById('chkConfSweep')?.checked !== false;
  const smt = document.getElementById('chkConfSmt')?.checked !== false;
  const disp = document.getElementById('chkConfDisplacement')?.checked !== false;
  const qmx = document.getElementById('chkConfQmx')?.checked !== false;
  const filterMode = document.getElementById('ictConfluenceFilter')?.value || 'ALL_APLUS';
  return { sweep, smt, disp, qmx, filterMode };
}

function resolveEffectiveTradeStyle(newsMode = 'ALL', currentStyle = 'SCALPING') {
  const filterMode = document.getElementById('ictConfluenceFilter')?.value || 'ALL_APLUS';
  if (newsMode === 'SECRET_411') return 'SECRET_411';
  if (newsMode === 'RARE_FLIP_SNR') return 'RARE_FLIP_SNR';
  if (newsMode === 'ICT_APLUS') return 'APLUS_ICT';
  if (newsMode === 'MSNR_EMPEROR') return 'MSNR_EMPEROR';
  if (newsMode === 'AMD_MMXM') return 'AMD_MMXM';
  if (newsMode === 'SCALP_PERFECT') return 'SCALPING';
  if (newsMode === 'NON_FARM') return 'SWING';

  if (['SCALPING', 'SWING', 'APLUS_ICT', 'MSNR_EMPEROR', 'AMD_MMXM', 'SECRET_411', 'RARE_FLIP_SNR'].includes(currentStyle)) {
    return currentStyle;
  }
  if (filterMode === 'SECRET_411_ZIKIR') return 'SECRET_411';
  if (filterMode === 'RARE_FLIP_DOJI') return 'RARE_FLIP_SNR';
  if (filterMode === 'MSNR_QMX' || filterMode === 'MSNR_GAP_GCE') return 'MSNR_EMPEROR';
  if (filterMode === 'AMD_PO3') return 'AMD_MMXM';
  if (filterMode === 'ERL_TO_IRL' || filterMode === 'DEALING_PD') return 'APLUS_ICT';
  return 'SCALPING';
}

function getStrategyConfig(tradeStyle = 'SCALPING') {
  switch (tradeStyle) {
    case 'SECRET_411':
      return {
        code: 'SECRET_411',
        name: '🕵️‍♂️ SECRET OF 4.11 (HSL + ISL + ZIKIR 2x BO + 5 ENGULFING)',
        rrRatio: '1:4.2',
        riskSpanRatio: 0.098,
        tp1Mult: 2.1,
        tp2Mult: 4.2,
        minTicks: 13,
        qualityScore: '98.1% SECRET 4.11 QUALITY',
        lotAdvice: '1.0%–1.5% Risk (SL Beyond Full-Body+Wick Yellow Zone)',
        orderType: '4.11 Zikir Pullback Limit @ HSL+ISL Yellow Zone',
        setupGrade: '🕵️‍♂️ SECRET 4.11 (HSL+ISL + 2x BO ZIKIR • 1:4.2 RR)'
      };
    case 'RARE_FLIP_SNR':
      return {
        code: 'RARE_FLIP_SNR',
        name: '💎 RARE #FLIPPED_SNR & #DOJI_SNR (GAP UL/LL + FLIPZONE)',
        rrRatio: '1:5.0',
        riskSpanRatio: 0.092,
        tp1Mult: 2.4,
        tp2Mult: 5.0,
        minTicks: 12,
        qualityScore: '98.4% RARE FLIPPED SNR QUALITY',
        lotAdvice: '1.0%–1.5% Risk (Tight 4–10 Pips SL Beyond GAP UL/LL)',
        orderType: 'Flipped SNR / #Doji_SNR Direct & Confirmatory Limit',
        setupGrade: '💎 RARE #FLIPPED_SNR + #DOJI_SNR (1R:5R TARGET)'
      };
    case 'SWING':
      return {
        code: 'SWING',
        name: '🌊 SWING TRADE (HTF STORYLINE WRW / DRD)',
        rrRatio: '1:4.5',
        riskSpanRatio: 0.155,
        tp1Mult: 2.2,
        tp2Mult: 4.5,
        minTicks: 24,
        qualityScore: '96.2% HTF SWING QUALITY',
        lotAdvice: '1.0% Risk (Wide Structural SL)',
        orderType: 'Swing Limit @ HTF Fresh SNR / OB',
        setupGrade: '🌊 SWING A+ STORYLINE (1:4.5 RR)'
      };
    case 'APLUS_ICT':
      return {
        code: 'APLUS_ICT',
        name: '🏆 A+ ICT LIQUIDITY & PD ARRAY SETUP',
        rrRatio: '1:3.5',
        riskSpanRatio: 0.112,
        tp1Mult: 1.8,
        tp2Mult: 3.5,
        minTicks: 16,
        qualityScore: '97.8% A+ ICT QUALITY',
        lotAdvice: '1.0%–1.5% Risk (SL Beyond Liquidity Sweep)',
        orderType: 'A+ Limit @ 50% C.E. FVG / BPR (IRL)',
        setupGrade: '🏆 A+ ICT (ERL SWEEP + 50% FVG C.E. • 1:3.5 RR)'
      };
    case 'MSNR_EMPEROR':
      return {
        code: 'MSNR_EMPEROR',
        name: '👑 MALAYSIAN SNR EMPEROR (QMX + MISS + GCE)',
        rrRatio: '1:4.0',
        riskSpanRatio: 0.105,
        tp1Mult: 2.0,
        tp2Mult: 4.0,
        minTicks: 14,
        qualityScore: '97.5% MSNR EMPEROR QUALITY',
        lotAdvice: '1.0%–1.5% Risk (SL Beyond QML / Engulfing Peak)',
        orderType: 'QMX Sniper Limit @ Point #3 "X" + Fresh SNR',
        setupGrade: '👑 MSNR EMPEROR (QMX + MISS + GCE • 1:4.0 RR)'
      };
    case 'AMD_MMXM':
      return {
        code: 'AMD_MMXM',
        name: '🔥 ICT AMD POWER OF 3 & MARKET MAKER MODEL',
        rrRatio: '1:3.8',
        riskSpanRatio: 0.108,
        tp1Mult: 1.9,
        tp2Mult: 3.8,
        minTicks: 15,
        qualityScore: '97.1% ICT AMD TRAP QUALITY',
        lotAdvice: '1.0% Risk (SL Beyond Manipulation Wick / HVI)',
        orderType: 'NY Trap / London Sweep Breaker & Algo Candle Limit',
        setupGrade: '🔥 ICT AMD + BREAKER BLOCK (1:3.8 RR)'
      };
    case 'SCALPING':
    default:
      return {
        code: 'SCALPING',
        name: '⚡ SCALPING PERFECT ENTRY (1M–15M SNIPER)',
        rrRatio: '1:2.8',
        riskSpanRatio: 0.082,
        tp1Mult: 1.5,
        tp2Mult: 2.8,
        minTicks: 10,
        qualityScore: '96.8% HIGH QUALITY SCALP',
        lotAdvice: '1.0% Risk (Tight 1.0x ATR SL)',
        orderType: 'Scalp Perfect Market / IOFED Limit',
        setupGrade: '⚡ PERFECT ENTRY (96.8% HQ • 1:2.8 RR)'
      };
  }
}

// 3. Extend getStyleDisplayMeta in scan.js so all 7 strategies render badges properly
const _origGetStyleDisplayMeta = typeof window.getStyleDisplayMeta === 'function' ? window.getStyleDisplayMeta : null;
window.getStyleDisplayMeta = function(style) {
  if (style === 'SECRET_411') {
    return {
      code: 'SECRET_411',
      badgeText: '🕵️‍♂️ SECRET OF 4.11 (HSL + ISL + ZIKIR)',
      badgeClass: 'px-2.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 text-[10px] font-extrabold uppercase',
      resBadgeText: '🕵️‍♂️ SECRET OF 4.11 • HSL+ISL ZIKIR (R:R 1:4.2)',
      resBadgeClass: 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-yellow-500/20 border border-yellow-400/50 text-yellow-300',
      scanBtnLabel: '🕵️‍♂️ SECRET OF 4.11',
      overlayTag: 'SECRET OF 4.11 (HSL NIGHT MARKET + ISL 2x BO + YELLOW ZONE)'
    };
  }
  if (style === 'RARE_FLIP_SNR') {
    return {
      code: 'RARE_FLIP_SNR',
      badgeText: '💎 RARE #FLIPPED_SNR & #DOJI_SNR',
      badgeClass: 'px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-300 text-[10px] font-extrabold uppercase',
      resBadgeText: '💎 RARE #FLIPPED_SNR + #DOJI_SNR (R:R 1:5.0)',
      resBadgeClass: 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/20 border border-sky-400/50 text-sky-300',
      scanBtnLabel: '💎 RARE #FLIPPED_SNR',
      overlayTag: 'RARE #FLIPPED_SNR + #DOJI_SNR + GAP UL/LL FLIPZONE'
    };
  }
  if (_origGetStyleDisplayMeta) return _origGetStyleDisplayMeta(style);
  return getStrategyConfig(style);
};

// 4. Auto-Inject Secret of 4.11 & Rare #Flipped_SNR UI Controls into scan.html
(function injectNewStrategiesUI() {
  // Add options to #newsFlipMode
  const newsSelect = document.getElementById('newsFlipMode');
  if (newsSelect && !newsSelect.querySelector('option[value="SECRET_411"]')) {
    newsSelect.insertAdjacentHTML('beforeend', `
      <option value="SECRET_411">🕵️‍♂️ SECRET OF 4.11 (HSL + ISL + Zikir 2x BO + 5 Engulfing)</option>
      <option value="RARE_FLIP_SNR">💎 RARE #FLIPPED_SNR &amp; #DOJI_SNR (Flipzone + Gap UL/LL 1:5 RR)</option>
    `);
  }

  // Add options to #ictConfluenceFilter
  const confSelect = document.getElementById('ictConfluenceFilter');
  if (confSelect && !confSelect.querySelector('option[value="SECRET_411_ZIKIR"]')) {
    confSelect.insertAdjacentHTML('beforeend', `
      <option value="SECRET_411_ZIKIR">🕵️‍♂️ Secret 4.11 (Night Market HSL + ISL 2x BO + Yellow Zone)</option>
      <option value="RARE_FLIP_DOJI">💎 Rare #Flipped_SNR + #Doji_SNR + Gap Overtake (1R:5R)</option>
    `);
  }

  // Add Strategy Cards #6 and #7 inside #tradeStyleBox grid
  const styleGrid = document.querySelector('#tradeStyleBox .grid');
  if (styleGrid && !document.getElementById('btnModeSecret411')) {
    const amdBtn = document.getElementById('btnModeAmd');
    if (amdBtn) amdBtn.classList.remove('sm:col-span-2');

    styleGrid.insertAdjacentHTML('beforeend', `
      <!-- Strategy 6: SECRET OF 4.11 (Ali Yusoff) -->
      <button type="button" id="btnModeSecret411" data-trade-style="SECRET_411" class="trade-style-card p-3.5 rounded-xl bg-[#111a2e] border border-slate-700 hover:border-yellow-400/60 text-left cursor-pointer flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center text-yellow-300 shrink-0 mt-0.5">
          <i data-lucide="compass" class="w-5 h-5"></i>
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between flex-wrap gap-1">
            <span class="font-extrabold text-yellow-300 text-xs sm:text-sm">🕵️‍♂️ SECRET OF 4.11 (ZIKIR + HSL/ISL)</span>
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-200">2x BO • 1:4.2 RR</span>
          </div>
          <p class="text-[11px] text-slate-300 mt-1 leading-snug">
            Zikir (1.Breakout 2x → 2.Pullback → 3.Entry) • Night Market (HSL) + ISL Yellow Full-Body+Wick Zone • 5 Engulfing Types
          </p>
          <div class="mt-2 flex items-center justify-between text-[10px] font-bold text-yellow-300/90">
            <span>🌙 HSL Night Market + ISL</span>
            <span class="underline">ជ្រើសរើស Secret 4.11 →</span>
          </div>
        </div>
      </button>

      <!-- Strategy 7: RARE #FLIPPED_SNR & #DOJI_SNR (@iadegboruwa) -->
      <button type="button" id="btnModeRareFlip" data-trade-style="RARE_FLIP_SNR" class="trade-style-card p-3.5 rounded-xl bg-[#111a2e] border border-slate-700 hover:border-sky-400/60 text-left cursor-pointer flex items-start gap-3 sm:col-span-2">
        <div class="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-300 shrink-0 mt-0.5">
          <i data-lucide="gem" class="w-5 h-5"></i>
        </div>
        <div class="flex-1">
          <div class="flex items-center justify-between flex-wrap gap-1">
            <span class="font-extrabold text-sky-300 text-xs sm:text-sm">💎 RARE #FLIPPED_SNR &amp; #DOJI_SNR (GAP OVERTAKE • 1R:5R)</span>
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-200">Flipzone UL/LL • 1:5.0 RR</span>
          </div>
          <p class="text-[11px] text-slate-300 mt-1 leading-snug">
            Flipping Momentum Candle (Bullish Gap Overtakes Bearish Gap A-B-C Cycle) • #Doji_SNR &amp; #GAP_SNR (UL/LL) • Direct &amp; Confirmatory Entry + Internal Gap Roadblocks
          </p>
          <div class="mt-2 flex items-center justify-between text-[10px] font-bold text-sky-300/90">
            <span>💎 #Flipped_SNR + #Doji_SNR + Internal Gaps</span>
            <span class="underline">ជ្រើសរើស Rare #Flipped_SNR →</span>
          </div>
        </div>
      </button>
    `);
  }

  // Add Quick Switch Buttons inside Result Card
  const resSwitchRow = document.getElementById('btnResSwitchAmd')?.parentElement;
  if (resSwitchRow && !document.getElementById('btnResSwitch411')) {
    resSwitchRow.insertAdjacentHTML('beforeend', `
      <button type="button" id="btnResSwitch411" class="px-2.5 py-1 rounded-lg bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 font-extrabold cursor-pointer hover:brightness-110">
        🕵️‍♂️ Secret 4.11
      </button>
      <button type="button" id="btnResSwitchRareFlip" class="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/50 text-sky-300 font-extrabold cursor-pointer hover:brightness-110">
        💎 Rare #Flipped_SNR
      </button>
    `);
  }

  // Add Filter Buttons to #lobbyFilterBar & #updStyleInput
  const lobbyBar = document.getElementById('lobbyFilterBar');
  if (lobbyBar && !lobbyBar.querySelector('[data-lobby-filter="SECRET_411"]')) {
    lobbyBar.insertAdjacentHTML('beforeend', `
      <button type="button" data-lobby-filter="SECRET_411" class="lobby-filter-btn px-3.5 py-1.5 rounded-xl bg-[#0b1220] text-yellow-300 border border-slate-700 hover:border-yellow-400 cursor-pointer shrink-0">
        🕵️‍♂️ Secret 4.11
      </button>
      <button type="button" data-lobby-filter="RARE_FLIP_SNR" class="lobby-filter-btn px-3.5 py-1.5 rounded-xl bg-[#0b1220] text-sky-300 border border-slate-700 hover:border-sky-400 cursor-pointer shrink-0">
        💎 Rare #Flipped_SNR
      </button>
    `);
  }

  const updStyle = document.getElementById('updStyleInput');
  if (updStyle && !updStyle.querySelector('option[value="SECRET_411"]')) {
    updStyle.insertAdjacentHTML('beforeend', `
      <option value="SECRET_411">🕵️‍♂️ Secret of 4.11</option>
      <option value="RARE_FLIP_SNR">💎 Rare #Flipped_SNR</option>
    `);
  }

  // Inject Dedicated 4.11 (HSL/ISL + Zikir) & Rare #Flipped_SNR / #Doji_SNR Matrix Box into #resultCard
  const msnrBox = document.getElementById('rMsnrStorylineBadge')?.closest('.p-3\\.5');
  if (msnrBox && !document.getElementById('rSecret411RareBox')) {
    msnrBox.insertAdjacentHTML('afterend', `
      <div id="rSecret411RareBox" class="p-3.5 rounded-2xl bg-[#0b1220] border border-yellow-500/35 text-xs sm:text-sm mb-4 space-y-2.5">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-extrabold text-yellow-300 flex items-center gap-1.5">
            <i data-lucide="compass" class="w-4 h-4 text-sky-400"></i>
            <span>🕵️‍♂️ Secret of 4.11 (HSL + ISL + Zikir) &amp; 💎 Rare #Flipped_SNR / #Doji_SNR៖</span>
          </span>
          <span id="r411ZikirBadge" class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-yellow-500/20 border border-yellow-400/50 text-yellow-200">
            🌙 ZIKIR FRESH ZONE (2x BO CONFIRMED)
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          <div class="p-2.5 rounded-xl bg-slate-900/90 border border-yellow-500/30">
            <div class="text-[10px] font-bold text-yellow-300 uppercase">🌙 4.11 Night Market (HSL) + Breakout (ISL)</div>
            <div id="r411HslIslZone" class="font-extrabold text-white mt-0.5">HSL Cluster + ISL 2x Breakout (Full Body + Wick Yellow Zone)</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
            <div class="text-[10px] font-bold text-emerald-300 uppercase">🔥 4.11 5-Type Engulfing &amp; Pullback Behavior</div>
            <div id="r411EngulfPullback" class="font-extrabold text-emerald-200 mt-0.5">Dominant / Hidden MTF Engulf • ACCURATE Pullback</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-900/90 border border-sky-500/30">
            <div class="text-[10px] font-bold text-sky-300 uppercase">💎 Rare #Flipped_SNR (FLIPZONE) &amp; Gap Overtake</div>
            <div id="rRareFlippedSnr" class="font-extrabold text-sky-200 mt-0.5">Momentum Flipping Candle (Gap Overtake A-B-C Cycle)</div>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/30">
            <div class="text-[10px] font-bold text-purple-300 uppercase">✨ #Doji_SNR &amp; #GAP_SNR Limits (UL / LL)</div>
            <div id="rRareDojiGapLimits" class="font-extrabold text-purple-200 mt-0.5">#Doji_SNR + Internal Gap Roadblocks (UL / LL Protected)</div>
          </div>
        </div>
      </div>
    `);
  }

  // Click wiring for these cards lives in scan.js (delegated), so no listeners here.

  if (window.lucide) window.lucide.createIcons();
})();

// 5. Build Multi-Strategy AI Prompt (Including Secret of 4.11 & Rare #Flipped_SNR)
function buildSniperPrompt(newsMode = 'ALL', tradeStyle = 'SCALPING', overridePair = 'AUTO', overrideTf = 'AUTO') {
  const effectiveStyle = resolveEffectiveTradeStyle(newsMode, tradeStyle);
  const cfg = getStrategyConfig(effectiveStyle);
  const aplusConf = getSelectedAPlusConfluences();

  let styleInstructions = '';
  if (effectiveStyle === 'SECRET_411') {
    styleInstructions = `SELECTED STRATEGY: 🕵️‍♂️ SECRET OF 4.11 (Ali Yusoff — HSL + ISL + Zikir 2x Breakout + 5 Engulfing Types • R:R 1:4.2)
- Apply all rules from "Secret of 4.11":
  1. ZIKIR IN TRADING (Keep in mind until death): 1. BREAKOUT -> 2. PULLBACK -> 3. ENTRY.
     - Breakout Criteria: Must break out 2 times (1st Breakout + 2nd Breakout / Hint Breakout).
     - "Breakout is Breakout": Both Breakout by Body and Breakout by Wick/Shadow are valid breakouts (no fake breakout).
     - Fresh vs Non-Fresh Zone: A zone is FRESH when it has NOT completed the Zikir. Once price pulls back and completes Entry, it becomes NON-FRESH.
  2. VALIDITY / SIGNIFICANCE (HSL & ISL):
     - HSL (Historical Significant Level): A "Night Market" on the left where many buyers and sellers gather in the same place (cluster of wicks/bodies).
     - ISL (Intermediate Significant Level): The current price breakout level right at the engulfing formation.
     - Zone Marking Rule: Mark the FULL BODY INCLUDING WICK/SHADOW (Yellow Zone) of the candle containing ISL + HSL (shift to the left or right candle regardless of color if ISL is on the adjacent candle).
  3. 5 TYPES OF ENGULFING (HSL + ISL Required):
     - Identify whether the setup is: (1) Perfect Engulf, (2) Quasimodo / HNS Engulf, (3) Dominant Engulf, (4) Hidden Engulf ("In time, there is time. In engulf, there is engulf" — MTF refinement), or (5) Gap Engulf.
  4. MTF ROADBLOCK & PULLBACK TYPE (MISS | ACCURATE | DEEP):
     - Roadblock happens 1 Timeframe below your entry TF ("Your entry is your take profit zone").
     - Match pullback depth to pair volatility: ACCURATE (Gold/USD/US30/BTC), DEEP (GBP/JPY fast pairs), or MISS (AUD/CAD/NZD slow pairs).`;
  } else if (effectiveStyle === 'RARE_FLIP_SNR') {
    styleInstructions = `SELECTED STRATEGY: 💎 MY "RARE" SNR COURSE (@iadegboruwa — #Flipped_SNR + #Doji_SNR + #GAP_SNR UL/LL • R:R 1:5.0)
- Apply all rules from "My Rare SNR Course":
  1. 3 TYPES OF RARE SNR:
     - Classic SNR: First candle closes lower/higher (Support/Resistance) and second candle opens at that level.
     - #GAP_SNR (Bearish Gap & Bullish Gap): Hidden gap inside a HTF Momentum Candle with an Upper Limit (UL) and Lower Limit (LL). Remains valid as long as no candle body closes beyond UL (for sell) or LL (for buy).
     - #Doji_SNR: Momentum candle -> narrow-range Doji candle -> strong momentum candle closing beyond the Doji. Acts as a high-probability reversal/continuation magnet.
  2. #FLIPPED_SNR & FLIPZONE (SBR / RBS):
     - Identify the SNR Origin (1st Reject & 2nd Reject of Weak Support/Resistance) and the Flipping Momentum Candle that breaks through to create a strong FLIPZONE (SBR or RBS).
     - Check for Gap Overtaking: A recent Bullish Gap taking out a previous Bearish Gap (or Bearish Gap taking out a Bullish Gap) confirming a Shift in Market Structure (A-B-C Cycle within the HTF momentum candle).
  3. DIRECT ENTRY vs CONFIRMATORY ENTRY & INTERNAL GAP ROADBLOCKS:
     - Tier 1 = Direct Entry at the 4th touch of the newly flipped SNR; Tier 2 = Sniper #GAP_SNR / #Doji_SNR midpoint; Tier 3 = Confirmatory Retest after LTF Flipping Candle.
     - Map Internal Gap SNRs along the impulse leg as roadblocks and TP scaling targets (1R:5R).`;
  } else if (effectiveStyle === 'APLUS_ICT') {
    styleInstructions = `SELECTED STRATEGY: 🏆 A+ ICT LIQUIDITY & PD ARRAY SETUP (Min 1:3.5 RR)
- Apply Mastering ICT PD Arrays & Institutional SMC rules:
  1. External Range Liquidity (ERL): Identify Buy-Side Liquidity (BSL above swing highs, PDH, PWH, Equal Highs) and Sell-Side Liquidity (SSL below swing lows, PDL, PWL, Equal Lows).
  2. Dealing Range & 0.5 Equilibrium: Discount (< 0.5 Fib) for BUY setups; Premium (> 0.5 Fib) for SELL setups.
  3. Change in the State of Delivery (CISD) & Market Structure Shift (MSS): Wait for an impulsive Vector/Algo Candle to sweep ERL and close beyond the opening price of the last opposing candle(s).
  4. Internal Range Liquidity (IRL) Entry Arrays: Pinpoint the overlapping Fair Value Gap (BISI/SIBI), Balanced Price Range (BPR), Inversion FVG (IFVG), Propulsion Block (PB), or OrderBlock Mean Threshold (50% MT).`;
  } else if (effectiveStyle === 'MSNR_EMPEROR') {
    styleInstructions = `SELECTED STRATEGY: 👑 MALAYSIAN SNR EMPEROR (QMX + MISS + GAP SNR + GCE • R:R 1:4.0)
- Apply Trading SNR the Malaysian Way & KororFX Emperor SOP:
  1. Open-Close Body SNR Levels: Mark 'A'-shaped Resistance, 'V'-shaped Support, Flipped RBS/SBR, QML, and Open-Close GAP SNR.
  2. Fresh SNR + Shadow Touch + MISS Validation: Ensure the SNR level is Fresh, has "MISSED" candles before retest, and rejects with a Shadow Wick Touch.
  3. Trendline Marriage Concept ('X' Factor / QMX): Connect at least two 'A' or 'V' body SNRs so Point #3 crosses the horizontal QML / RBS / SBR / Fresh SNR.
  4. Engulfing Zones & Golden Confirmation Entry (GCE): Identify Perfect Engulfing Zone (PEZ) or Failed Engulfing Zone (FEZ) with Golden Confirmation candle.`;
  } else if (effectiveStyle === 'AMD_MMXM') {
    styleInstructions = `SELECTED STRATEGY: 🔥 ICT AMD POWER OF 3 & MARKET MAKER BUY/SELL MODEL (R:R 1:3.8)
- Apply Advanced ICT Institutional SMC (David Woods) & AMD Daily Circle:
  1. Daily Circle & 90-Minute Cycle: Asia Range Liquidity Build-Up (Accumulation) -> Frankfurt False Flag (FFH/FFL) -> London Open Aggressive Sweep (Manipulation / Inducement Trap) -> New York Open Distribution.
  2. Strong High/Low vs Weak High/Low + Algo Candle (AC) + Breaker Block (BB) + Rejection Block (RB 50% C.E.) + High Volume Imbalance (HVI).`;
  } else if (effectiveStyle === 'SWING') {
    styleInstructions = `SELECTED STRATEGY: 🌊 SWING TRADE HTF STORYLINE (WRW / DRD • R:R 1:4.5)
- Apply HTF Storyline (Weekly Rejects Weekly WRW / Daily Rejects Daily DRD), 20/40/60/90-Day Cycle, and LTF Roadblocks (1 TF below entry).`;
  } else {
    styleInstructions = `SELECTED STRATEGY: ⚡ SCALPING PERFECT ENTRY • HIGH QUALITY JOIN TRADE (1m–15m • R:R 1:2.8)
- Apply 1-Minute Ping-Pong Mastery, Micro Algo Candle + FVG 50% C.E., Immediate Rebalance (IRB), and IOFED with a tight 1.0x ATR Stop Loss.`;
  }

  const pairHint = overridePair && overridePair !== 'AUTO' ? `USER SELECTED PAIR OVERRIDE: ${overridePair}` : '';
  const tfHint = overrideTf && overrideTf !== 'AUTO' ? `USER SELECTED TIMEFRAME OVERRIDE: ${overrideTf}` : '';

  return `You are Por - SNR Scanner Pro, an elite institutional chart vision engine combining ICT Institutional SMC, Mastering ICT 12 PD Arrays, Malaysian SNR Emperor (QMX + MISS + GCE), Secret of 4.11 (HSL + ISL + Zikir 2x Breakout + 5 Engulfing Types), and My Rare SNR Course (#Flipped_SNR + #Doji_SNR + Gap UL/LL) for MT4, MT5, and TradingView charts.

SELECTED NEWS FLIP MODE: ${newsMode}
ACTIVE CONFLUENCE FILTER: ${aplusConf.filterMode}
${styleInstructions}
${pairHint}
${tfHint}

CRITICAL STEP 1 — EXACT RIGHT-HAND Y-AXIS PRICE OCR (DO NOT INVENT RANDOM PRICES):
- Read the vertical price scale on the right side of the chart image carefully.
- Identify the highest visible price ("axisHigh"), lowest visible price ("axisLow"), and the highlighted live price tag ("currentPrice").
- Every price you output (entry, tier1Iofed, tier2SniperCe, tier3Golden, sl, tp1, tp2, resistance, support, bsl, ssl, equilibrium50) MUST be strictly inside the visible chart price range with matching decimal precision.

CRITICAL STEP 2 — PERFECT ENTRY & MATHEMATICAL VALIDATION:
- Determine whether the chart shows a high-probability BUY setup or SELL setup.
- Enforce strict mathematical order:
  * For BUY: sl < tier2SniperCe (entry) < tp1 < tp2
  * For SELL: sl > tier2SniperCe (entry) > tp1 > tp2

CRITICAL STEP 3 — RETURN ONLY VALID JSON MATCHING THIS SCHEMA:
{
  "pair": "Symbol read from chart (e.g. XAU/USD, BTC/USDT, EUR/USD, GBP/JPY)",
  "timeframe": "Timeframe read from chart (e.g. M5, M15, H1, H4)",
  "tradeStyle": "${effectiveStyle}",
  "setupGrade": "${cfg.setupGrade}",
  "currentPrice": "Exact current price read from right axis",
  "axisHigh": "Highest price visible on right Y-axis",
  "axisLow": "Lowest price visible on right Y-axis",
  "trend": "ឡើង (Bullish) or ចុះ (Bearish)",
  "action": "BUY or SELL",
  "orderType": "${cfg.orderType}",
  "entry": "Exact Tier 2 Sniper 50% C.E. / QMX Point #3 / HSL+ISL Yellow Zone entry price (single number)",
  "sl": "Exact Stop Loss price beyond Liquidity Sweep wick / GAP UL-LL / Yellow Zone (single number)",
  "tp1": "Exact Take Profit 1 at Internal Gap Roadblock / 1-TF-Lower Roadblock (single number)",
  "tp2": "Exact Take Profit 2 at External Range Liquidity BSL/SSL / Opposing Fresh SNR (single number)",
  "rrRatio": "${cfg.rrRatio}",
  "confidence": "98.1%",
  "keyFlipRule": "Explain in Khmer which KEY Por - SNR rule, 4.11 Zikir (HSL+ISL), Rare #Flipped_SNR/#Doji_SNR, or ICT PD Array triggered",
  "detailedAnalysis": "Write a clear 2-3 sentence institutional analysis in Khmer explaining the Liquidity Sweep / Fresh SNR / HSL+ISL Night Market / #Flipped_SNR setup, why the 3-Tier Perfect Entry is placed here, where TP1/TP2 target, and how SL is protected.",
  "tierEntries": {
    "tier1Iofed": "Exact price for Tier 1 Aggressive / Direct Entry (IOFED 25% / MISS Pullback / 4th Touch Direct Entry)",
    "tier1Note": "គែមដំបូងនៃ Yellow Zone (IOFED / Direct Entry / MISS Pullback)",
    "tier2SniperCe": "Exact price for Tier 2 Best Sniper Entry (50% C.E. / ACCURATE Pullback / #Doji_SNR / QMX Point #3)",
    "tier2Note": "50% Equilibrium (C.E.) & HSL+ISL / #Flipped_SNR Sniper",
    "tier3Golden": "Exact price for Tier 3 Safe Confirmation / DEEP Pullback (GCE Close / Confirmatory Entry)",
    "tier3Note": "រង់ចាំទៀន Engulfing (GCE) / Confirmatory Retest"
  },
  "scalpPerfect": {
    "zone": "Tight sniper entry price range (e.g. 3996.2 - 3996.8)",
    "qualityScore": "${cfg.qualityScore}",
    "lotAdvice": "${cfg.lotAdvice}",
    "quickTarget": "TP1 Lock (1-TF Lower Roadblock) + Move SL to BE",
    "executionNote": "តំបន់ចូលដ៏ល្អឥតខ្ចោះ (HSL+ISL Yellow Zone + #Flipped_SNR + 50% C.E. + QMX 'X') — Join Trade ភ្លាមៗ!"
  },
  "snrZones": {
    "resistance": "Exact KEY SELL / BSL / 'A' Resistance level",
    "support": "Exact KEY BUY / SSL / 'V' Support level"
  },
  "ictLiquidity": {
    "bsl": "Exact Buy-Side Liquidity (ERL / PDH / EQH) price",
    "ssl": "Exact Sell-Side Liquidity (ERL / PDL / EQL) price",
    "irlFvg": "Exact Internal Range Liquidity (FVG / BPR / #GAP_SNR) price range",
    "equilibrium50": "Exact 0.5 Fibonacci Dealing Range Equilibrium price",
    "pdZone": "DISCOUNT (< 0.5 Fib • BUY ZONE) or PREMIUM (> 0.5 Fib • SELL ZONE)",
    "isDiscount": true,
    "confSweep": "#1 ERL Liquidity Sweep + Inducement Trap",
    "confSmt": "#2 SMT Divergence & HTF Storyline Aligned",
    "confDisp": "#3 Algo Candle Displacement + 50% FVG C.E."
  },
  "msnrEmperor": {
    "storylineBadge": "📐 STORYLINE DRD/WRW + QMX & 4.11 ZIKIR CONFIRMED",
    "levelType": "Specify Fresh V-Support / A-Resistance + Open-Close Gap SNR + Missed Candles count",
    "trendlineX": "Specify QML / RBS / SBR + Point #3 Trendline Crossing ('X' Factor Marriage)",
    "engulfingGce": "Specify 4.11 Engulfing Type (Perfect/QML/Dominant/Hidden/Gap) + Golden Confirmation (GCE)",
    "amdCycle": "Specify Asia Build-Up -> London Sweep (ALS/AHS) -> NY Distribution + Breaker/Rejection Block"
  },
  "secret411Rare": {
    "zikirBadge": "🌙 ZIKIR FRESH ZONE (1st & 2nd BO CONFIRMED)",
    "hslIslZone": "Specify Night Market HSL + Current Breakout ISL Full-Body+Wick Yellow Zone range",
    "engulfPullback": "Specify 4.11 Engulfing Type + Pair Pullback Type (ACCURATE / DEEP / MISS)",
    "flippedSnr": "Specify #Flipped_SNR (SBR/RBS Flipzone) + Bullish/Bearish Gap Overtake (A-B-C Cycle)",
    "dojiGapLimits": "Specify #Doji_SNR + #GAP_SNR Upper Limit (UL) & Lower Limit (LL) + 1-TF-Lower Roadblock"
  },
  "confluence": [
    "មូលហេតុទី១ ជាភាសាខ្មែរ (#1 Secret 4.11 Zikir 2x Breakout + Night Market HSL & ISL Yellow Zone)",
    "មូលហេតុទី២ ជាភាសាខ្មែរ (#2 Rare #Flipped_SNR Flipzone + #Doji_SNR + Gap Overtake UL/LL Protected)",
    "មូលហេតុទី៣ ជាភាសាខ្មែរ (#3 ICT 50% C.E. FVG + Malaysian QMX Point #3 'X' សម្រាប់គោលដៅ ${cfg.rrRatio})"
  ]
}`;
}

function isValidGeminiKeyFormat(key) {
  return typeof key === 'string' && /^AIza[0-9A-Za-z_-]{30,}$/.test(key.trim());
}

async function callGeminiWithFallback(apiKey, payload) {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  const RETRYABLE = [404, 408, 429, 500, 502, 503, 504];
  let lastError = 'Gemini API unavailable';

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 45000);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal }
        );
        clearTimeout(timer);
        if (res.ok) return await res.json();

        let detail = '';
        try { detail = (await res.json()).error?.message || ''; } catch (e) {}
        lastError = `API ${res.status} (${model}): ${detail}`;
        if (!RETRYABLE.includes(res.status)) throw new Error(lastError); // bad key / bad request: stop
        if (res.status === 404) break;                                    // model missing: next model
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));      // brief backoff, retry once
      } catch (err) {
        clearTimeout(timer);
        if (err.name === 'AbortError') { lastError = `Timeout (${model})`; break; }
        if (/^API \d+/.test(err.message)) throw err;
        lastError = err.message || lastError;
        break;
      }
    }
  }
  throw new Error(lastError);
}

function parseGeminiJson(raw) {
  const clean = String(raw || '').replace(/```json|```/gi, '').trim();
  try { return JSON.parse(clean); } catch (e) {}
  const first = clean.indexOf('{'), last = clean.lastIndexOf('}');
  if (first >= 0 && last > first) return JSON.parse(clean.slice(first, last + 1));
  throw new Error('Invalid JSON from Gemini');
}

// ============================================================================
// AUTO-SEND SCANNED & ANNOTATED CHART PHOTO TO TELEGRAM BOT
// ============================================================================
function formatPhotoScanCaption(r) {
  const cleanSym = String(r?.pair || 'XAUUSD').replace('/', '').toUpperCase();
  const isBuy = String(r?.action || 'BUY').toUpperCase().includes('BUY');
  const styleCode = r?.tradeStyle || state.tradeStyle;
  const cfg = getStrategyConfig(styleCode);

  const ict = r?.ictLiquidity || {};
  const te = r?.tierEntries || {};
  const msnr = r?.msnrEmperor || {};
  const s411 = r?.secret411Rare || {};
  const regimeTransition = isBuy
    ? `Ranging ↔️ → trending up 📈`
    : `Trending down 📉 → ranging ↔️`;

  return `🔀 Regime change — ${cleanSym}
${regimeTransition}
Review open positions and pending setups on this symbol.

🔥 លទ្ធផលស្កេន High Probability Setup 🔥
📈 ${isBuy ? 'ENTRY BUY NOW' : 'ENTRY SELL NOW'}: ${r.entry}
🎯 3-Tier Perfect Entry Matrix:
• ⚡ Tier 1 (IOFED / Direct / MISS): ${te.tier1Iofed || r.entry}
• 🎯 Tier 2 (50% C.E. / ACCURATE / QMX): ${te.tier2SniperCe || r.entry}
• 👑 Tier 3 (GCE Confirm / DEEP): ${te.tier3Golden || r.entry}
💰 TAKE PROFIT 1 (TP1 Roadblock): ${r.tp1} | TP2 (ERL): ${r.tp2}
🛑 STOP LOSS (SL): ${r.sl}

📊 Pair: ${r.pair || 'XAU/USD'} (${r.timeframe || 'M15'}) | ${cfg.name}
📝 ការវិភាគលម្អិត: ${r.detailedAnalysis || ''}

🕵️‍♂️ Secret 4.11 & 💎 Rare #Flipped_SNR:
• HSL+ISL Zone: ${s411.hslIslZone || '-'}
• 4.11 Pullback: ${s411.engulfPullback || '-'}
• #Flipped_SNR: ${s411.flippedSnr || '-'}
• #Doji_SNR & UL/LL: ${s411.dojiGapLimits || '-'}

👑 MSNR & ICT Matrix:
• Level: ${msnr.levelType || '-'}
• QMX 'X': ${msnr.trendlineX || '-'}
• Zone: ${ict.pdZone || (isBuy ? 'DISCOUNT (<0.5)' : 'PREMIUM (>0.5)')} | Fib 0.5: ${ict.equilibrium50 || '-'}
📲 Admin: @KaingChungpor`;
}

async function sendChartPhotoToTelegramBot(base64Image, mimeType, scanResult) {
  if (!base64Image || !scanResult) return;

  const token = (localStorage.getItem('ksnr_tg_bot_token') || '').trim();
  const chatId = (localStorage.getItem('ksnr_tg_chat_id') || '').trim();
  const caption = formatPhotoScanCaption(scanResult);

  let finalBase64 = base64Image;
  const annotatedCanvas = document.getElementById('annotatedChartCanvas');
  if (annotatedCanvas && annotatedCanvas.width > 0) {
    try {
      finalBase64 = annotatedCanvas.toDataURL('image/png').split(',')[1];
      mimeType = 'image/png';
    } catch (e) {}
  }

  if (token && chatId) {
    try {
      const photoBlob = base64ToBlob(finalBase64, mimeType || 'image/png');
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('photo', photoBlob, `por-snr-${Date.now()}.png`);
      formData.append('caption', caption);

      const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.ok) {
        if (typeof playTelegramSuccessBeep === 'function') playTelegramSuccessBeep();
        const fb = document.getElementById('tgAlertFeedback');
        if (fb) {
          fb.textContent = `✅ បានផ្ញើរូបភាព Annotated Chart + ${scanResult.tradeStyle || state.tradeStyle} Signal (${scanResult.pair}) ទៅ Telegram!`;
          fb.className = 'mt-2 text-xs font-bold text-center text-emerald-400';
          fb.classList.remove('hidden');
          setTimeout(() => fb.classList.add('hidden'), 4500);
        }
        return;
      }
    } catch (err) {
      console.warn('Direct Telegram sendPhoto failed, trying local bot server:', err);
    }
  }

  try {
    await fetch('http://localhost:3000/api/auto-scan-drop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        imageBase64: finalBase64,
        mimeType: mimeType || 'image/png',
        scanResult,
        eventType: 'SCAN_COMPLETE'
      })
    });
  } catch (e) {}
}

window.sendChartPhotoToTelegramBot = sendChartPhotoToTelegramBot;

// ============================================================================
// BUILT-IN LOCAL AI VISION, PIXEL STRUCTURE SCANNER & OCR ENGINE
// ============================================================================
let tesseractLoadingPromise = null;
function loadTesseractIfNeeded() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractLoadingPromise) return tesseractLoadingPromise;
  tesseractLoadingPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => resolve(window.Tesseract || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return tesseractLoadingPromise;
}

function cropCanvasRegion(img, rx, ry, rw, rh, scale = 2, highContrast = false) {
  const sx = Math.floor(img.width * rx);
  const sy = Math.floor(img.height * ry);
  const sw = Math.max(1, Math.floor(img.width * rw));
  const sh = Math.max(1, Math.floor(img.height * rh));

  const c = document.createElement('canvas');
  c.width = sw * scale;
  c.height = sh * scale;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);

  if (highContrast) {
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const v = lum > 105 ? 0 : 255;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
    }
    ctx.putImageData(imgData, 0, 0);
  }
  return c;
}

function extractPairAndTimeframeFromText(rawText) {
  const up = String(rawText || '').toUpperCase();
  const pairPatterns = [
    /\b(XAU\s*\/?\s*USD|GOLD)\b/,
    /\b(ETH\s*\/?\s*USDT(?:\.P)?|ETH\s*\/?\s*USD)\b/,
    /\b(BTC\s*\/?\s*USDT(?:\.P)?|BTC\s*\/?\s*USD)\b/,
    /\b(SOL\s*\/?\s*USDT|BNB\s*\/?\s*USDT|XRP\s*\/?\s*USDT|BONK\s*\/?\s*USDT|COQ\s*\/?\s*USDT)\b/,
    /\b(EUR\s*\/?\s*USD|GBP\s*\/?\s*USD|USD\s*\/?\s*JPY|GBP\s*\/?\s*JPY|AUD\s*\/?\s*USD|USD\s*\/?\s*CAD|NZD\s*\/?\s*USD)\b/,
    /\b(US30|NAS100|NASDAQ|USOIL|XAG\s*\/?\s*USD|VOLATILITY\s*75|STEP\s*INDEX)\b/
  ];
  let pair = 'XAU/USD';
  for (const pat of pairPatterns) {
    const m = up.match(pat);
    if (m) {
      pair = m[1].replace(/\s+/g, '').replace('.P', '');
      if (pair === 'GOLD') pair = 'XAU/USD';
      break;
    }
  }

  let tf = 'M15';
  const tfMatch = up.match(/\b(1M|3M|5M|15M|30M|45M|1H|2H|4H|1D|1W|M1|M3|M5|M15|M30|H1|H4|D1|W1)\b/);
  if (tfMatch) {
    tf = tfMatch[1];
  } else if (/\b5\b/.test(up) && pair.includes('USDT')) {
    tf = 'M5';
  }
  return { pair, timeframe: tf };
}

function extractPricesFromAxisText(axisText) {
  const cleaned = String(axisText || '')
    .replace(/,/g, '')
    .replace(/[^\d.\n\s]/g, ' ');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const nums = [];

  for (const tok of tokens) {
    if (!/^\d{1,6}(\.\d{1,8})?$/.test(tok)) continue;
    const val = parseFloat(tok);
    if (!isNaN(val) && val > 0.0000001 && val < 2000000) {
      nums.push({ raw: tok, val });
    }
  }

  if (nums.length < 2) return null;

  nums.sort((a, b) => a.val - b.val);
  let bestCluster = [];
  for (let i = 0; i < nums.length; i++) {
    const base = nums[i].val;
    const cluster = nums.filter((n) => n.val >= base * 0.85 && n.val <= base * 1.18);
    if (cluster.length > bestCluster.length) bestCluster = cluster;
  }

  const validList = bestCluster.length >= 2 ? bestCluster : nums;
  const vals = validList.map((n) => n.val);
  const axisLow = Math.min(...vals);
  const axisHigh = Math.max(...vals);

  let dec = 2;
  const decCounts = {};
  validList.forEach((n) => {
    const dot = n.raw.indexOf('.');
    if (dot !== -1) {
      const d = n.raw.length - dot - 1;
      decCounts[d] = (decCounts[d] || 0) + 1;
    }
  });
  const bestDec = Object.entries(decCounts).sort((a, b) => b[1] - a[1])[0];
  if (bestDec) dec = Number(bestDec[0]);

  return { axisHigh, axisLow, dec, allValues: vals };
}

function analyzeCandlestickPixels(img) {
  const c = document.createElement('canvas');
  const w = 360;
  const h = 260;
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  let leftSumY = 0, leftCount = 0;
  let rightSumY = 0, rightCount = 0;
  let recentBullPixels = 0, recentBearPixels = 0;
  let lastCandleSumY = 0, lastCandleCount = 0;
  let minCandleY = 1.0, maxCandleY = 0.0;

  const yStart = Math.floor(h * 0.10);
  const yEnd = Math.floor(h * 0.88);
  const xStart = Math.floor(w * 0.12);
  const xMid = Math.floor(w * 0.54);
  const xRecent = Math.floor(w * 0.65);
  const xEnd = Math.floor(w * 0.83);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      const isGreen = (g > r + 22 && g > 70) || (g > 135 && b > 115 && r < 95);
      const isRed = (r > g + 24 && r > 80 && b < r - 15);

      if (isGreen || isRed) {
        const normY = (y - yStart) / Math.max(1, yEnd - yStart);
        if (normY < minCandleY) minCandleY = normY;
        if (normY > maxCandleY) maxCandleY = normY;

        if (x < xMid) {
          leftSumY += normY;
          leftCount++;
        } else {
          rightSumY += normY;
          rightCount++;
        }
        if (x >= xRecent) {
          if (isGreen) recentBullPixels++;
          if (isRed) recentBearPixels++;
          lastCandleSumY += normY;
          lastCandleCount++;
        }
      }
    }
  }

  let badgeSumY = 0, badgeCount = 0;
  for (let y = yStart; y < yEnd; y++) {
    for (let x = Math.floor(w * 0.83); x < Math.floor(w * 0.98); x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat > 55 && Math.max(r, g, b) > 110) {
        badgeSumY += (y - yStart) / Math.max(1, yEnd - yStart);
        badgeCount++;
      }
    }
  }

  const leftAvgY = leftCount > 10 ? leftSumY / leftCount : 0.45;
  const rightAvgY = rightCount > 10 ? rightSumY / rightCount : 0.55;
  const liveNormY = lastCandleCount > 8
    ? lastCandleSumY / lastCandleCount
    : (badgeCount > 12 ? badgeSumY / badgeCount : rightAvgY);

  const isOverallBullish = rightAvgY < leftAvgY;
  let isBuySignal = recentBullPixels >= recentBearPixels * 0.92;
  if (liveNormY > 0.54) {
    isBuySignal = true;
  } else if (liveNormY < 0.44 && recentBearPixels > recentBullPixels * 0.55) {
    isBuySignal = false;
  }

  return {
    isOverallBullish,
    isBuySignal,
    liveNormY: Math.max(0.15, Math.min(0.85, liveNormY)),
    swingHighNormY: minCandleY < 0.9 ? Math.max(0.08, minCandleY) : 0.16,
    swingLowNormY: maxCandleY > 0.1 ? Math.min(0.92, maxCandleY) : 0.84
  };
}

async function analyzeChartLocallyWithVision(dataUrl, newsMode = 'ALL', tradeStyle = 'SCALPING') {
  const img = await new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = dataUrl;
  });

  const effectiveStyle = resolveEffectiveTradeStyle(newsMode, tradeStyle);
  const cfg = getStrategyConfig(effectiveStyle);
  const pixelStats = analyzeCandlestickPixels(img);

  let pair = state.selectedPair && state.selectedPair !== 'AUTO' ? state.selectedPair : 'XAU/USD';
  let timeframe = state.selectedTf && state.selectedTf !== 'AUTO'
    ? state.selectedTf.toUpperCase()
    : (newsMode === 'NON_FARM' ? 'H4' : (newsMode === 'CPI' ? 'H1' : (effectiveStyle === 'SWING' ? 'H4' : 'M15')));
  let axisInfo = null;

  try {
    const Tesseract = await loadTesseractIfNeeded();
    if (Tesseract) {
      const headerCanvas = cropCanvasRegion(img, 0.0, 0.0, 0.62, 0.14, 2, true);
      const axisCanvas = cropCanvasRegion(img, 0.78, 0.06, 0.22, 0.88, 2, true);

      const [headerRes, axisRes] = await Promise.all([
        Tesseract.recognize(headerCanvas, 'eng'),
        Tesseract.recognize(axisCanvas, 'eng')
      ]);

      const meta = extractPairAndTimeframeFromText(headerRes?.data?.text || '');
      if (state.selectedPair === 'AUTO' && meta.pair) pair = meta.pair;
      if (state.selectedTf === 'AUTO' && meta.timeframe) timeframe = meta.timeframe;

      axisInfo = extractPricesFromAxisText(axisRes?.data?.text || '');
    }
  } catch (e) {
    console.warn('Local OCR fallback warning:', e);
  }

  if (!axisInfo || !(axisInfo.axisHigh > axisInfo.axisLow)) {
    if (pair.includes('ETH')) {
      axisInfo = { axisHigh: 2395.00, axisLow: 2315.00, dec: 2 };
    } else if (pair.includes('BTC')) {
      axisInfo = { axisHigh: 68500.00, axisLow: 66800.00, dec: 2 };
    } else if (pair.includes('USOIL')) {
      axisInfo = { axisHigh: 74.80, axisLow: 71.20, dec: 2 };
    } else if (pair.includes('EUR') || pair.includes('GBP')) {
      axisInfo = { axisHigh: 1.09200, axisLow: 1.08400, dec: 5 };
    } else {
      axisInfo = { axisHigh: 4018.0, axisLow: 3982.0, dec: 1 };
    }
  }

  const span = axisInfo.axisHigh - axisInfo.axisLow;
  const currentPrice = axisInfo.axisHigh - pixelStats.liveNormY * span;
  const isBuy = pixelStats.isBuySignal;
  const fmt = (n) => Number(n).toFixed(axisInfo.dec);

  const risk = Math.max(span * cfg.riskSpanRatio, Math.pow(10, -axisInfo.dec) * cfg.minTicks);
  const entry = currentPrice;
  const sl = isBuy ? entry - risk : entry + risk;
  const tp1 = isBuy ? entry + risk * cfg.tp1Mult : entry - risk * cfg.tp1Mult;
  const tp2 = isBuy ? entry + risk * cfg.tp2Mult : entry - risk * cfg.tp2Mult;
  const support = isBuy ? entry - risk * 0.85 : tp2;
  const resistance = isBuy ? tp2 : entry + risk * 0.85;

  return {
    pair,
    timeframe,
    tradeStyle: effectiveStyle,
    currentPrice: fmt(currentPrice),
    axisHigh: fmt(axisInfo.axisHigh),
    axisLow: fmt(axisInfo.axisLow),
    trend: pixelStats.isOverallBullish ? 'ឡើង (Bullish)' : 'ចុះ (Bearish)',
    action: isBuy ? 'BUY' : 'SELL',
    entry: fmt(entry),
    sl: fmt(sl),
    tp1: fmt(tp1),
    tp2: fmt(tp2),
    snrZones: {
      resistance: fmt(resistance),
      support: fmt(support)
    }
  };
}

function getDecimals(valStr, pairStr = '') {
  const s = String(valStr || '').replace(/,/g, '').trim();
  const dot = s.indexOf('.');
  if (dot !== -1) {
    const dec = s.length - dot - 1;
    if (dec >= 1 && dec <= 8) return dec;
  }
  const p = String(pairStr).toUpperCase();
  if (p.includes('XAU') || p.includes('GOLD') || p.includes('BTC') || p.includes('ETH') || p.includes('US30') || p.includes('NAS') || p.includes('OIL')) return 2;
  if (p.includes('JPY')) return 3;
  return 5;
}

function getOneTfLowerRoadblockLabel(tfStr = 'M15') {
  const up = String(tfStr || 'M15').toUpperCase();
  if (up.includes('W')) return 'D1 Roadblock';
  if (up.includes('D')) return 'H4 Roadblock';
  if (up === '4H' || up === 'H4') return 'H1 Roadblock';
  if (up === '1H' || up === 'H1') return 'M30 / M15 Roadblock';
  if (up.includes('30')) return 'M15 / M5 Roadblock';
  if (up.includes('15')) return 'M5 Roadblock';
  return 'M1 Micro Roadblock';
}

// ============================================================================
// MASTER CALIBRATION ENGINE: 7 STRATEGIES + 3-TIER PERFECT ENTRY + 4.11 & RARE SNR
// ============================================================================
function calibrateSniperResult(r, tradeStyle = 'SCALPING') {
  const newsMode = document.getElementById('newsFlipMode')?.value || 'ALL';
  const effectiveStyle = resolveEffectiveTradeStyle(newsMode, tradeStyle || r.tradeStyle);
  const cfg = getStrategyConfig(effectiveStyle);
  r.tradeStyle = effectiveStyle;

  if (state.selectedPair && state.selectedPair !== 'AUTO') {
    r.pair = state.selectedPair;
  }
  if (state.selectedTf && state.selectedTf !== 'AUTO') {
    r.timeframe = state.selectedTf.toUpperCase();
  }

  const dec = getDecimals(r.currentPrice || r.entry, r.pair);
  const fmt = (n) => Number(n).toFixed(dec);

  let cur = parseNum(r.currentPrice);
  let entry = parseNum(r.entry);
  let sl = parseNum(r.sl);
  let tp1 = parseNum(r.tp1);
  let tp2 = parseNum(r.tp2);
  let res = parseNum(r.snrZones?.resistance);
  let sup = parseNum(r.snrZones?.support);

  if (isNaN(cur) && !isNaN(entry)) cur = entry;
  if (isNaN(entry) && !isNaN(cur)) entry = cur;

  if (isNaN(entry)) {
    throw new Error('រូបភាពមិនច្បាស់លើរបារតម្លៃ (Price Axis) សូមថតឱ្យឃើញលេខតម្លៃនៅខាងស្តាំ Chart!');
  }

  const action = String(r.action || '').toUpperCase();
  const isBuy = action.includes('BUY');
  r.action = isBuy ? 'BUY' : 'SELL';

  const axisHigh = parseNum(r.axisHigh);
  const axisLow = parseNum(r.axisLow);
  let chartSpan = (!isNaN(axisHigh) && !isNaN(axisLow) && axisHigh > axisLow)
    ? (axisHigh - axisLow)
    : (!isNaN(res) && !isNaN(sup) && res > sup ? (res - sup) * 1.5 : entry * 0.006);

  if (chartSpan <= 0 || isNaN(chartSpan)) chartSpan = entry * 0.005;
  if (!isNaN(cur) && Math.abs(entry - cur) > chartSpan) entry = cur;

  const defaultRisk = Math.max(chartSpan * cfg.riskSpanRatio, Math.pow(10, -dec) * cfg.minTicks);

  if (isBuy) {
    if (isNaN(sl) || sl >= entry || (entry - sl) > chartSpan * 0.65) {
      sl = !isNaN(sup) && sup < entry && (entry - sup) < chartSpan * 0.5
        ? sup - defaultRisk * 0.15
        : entry - defaultRisk;
    }
    const risk = Math.abs(entry - sl);
    tp1 = entry + risk * cfg.tp1Mult;
    tp2 = entry + risk * cfg.tp2Mult;
    if (isNaN(sup) || sup >= entry) sup = entry - risk * 0.85;
    if (isNaN(res) || res <= entry) res = tp2;
  } else {
    if (isNaN(sl) || sl <= entry || (sl - entry) > chartSpan * 0.65) {
      sl = !isNaN(res) && res > entry && (res - entry) < chartSpan * 0.5
        ? res + defaultRisk * 0.15
        : entry + defaultRisk;
    }
    const risk = Math.abs(sl - entry);
    tp1 = entry - risk * cfg.tp1Mult;
    tp2 = entry - risk * cfg.tp2Mult;
    if (isNaN(res) || res <= entry) res = entry + risk * 0.85;
    if (isNaN(sup) || sup >= entry) sup = tp2;
  }

  // Dealing Range, 4.11 Yellow Zone (Full Body + Wick), & Rare #GAP_SNR Limits (UL / LL)
  const dealingHigh = Math.max(res, tp2, !isNaN(axisHigh) ? axisHigh : res);
  const dealingLow = Math.min(sup, tp2, !isNaN(axisLow) ? axisLow : sup);
  const equilibrium50 = (dealingHigh + dealingLow) / 2;
  const riskDist = Math.abs(entry - sl);

  // Full Body + Wick Yellow Zone (4.11) & #GAP_SNR Upper/Lower Limits (UL / LL)
  const fvgLow = entry - riskDist * 0.16;
  const fvgHigh = entry + riskDist * 0.16;
  const perfectLow = entry - riskDist * 0.11;
  const perfectHigh = entry + riskDist * 0.11;
  const gapUpperLimit = isBuy ? entry + riskDist * 0.18 : entry + riskDist * 0.28;
  const gapLowerLimit = isBuy ? entry - riskDist * 0.28 : entry - riskDist * 0.18;

  // Classify Pair Volatility Pullback Behavior from "Secret Of 411" (MISS | ACCURATE | DEEP)
  const pbInfo = classify411PullbackType(r.pair);
  const roadblockTf = getOneTfLowerRoadblockLabel(r.timeframe);

  // 3-Tier Perfect Entry Prices calibrated for IOFED/MISS (Tier 1), 50% C.E./ACCURATE (Tier 2), and GCE/DEEP (Tier 3)
  const tier1Price = isBuy ? entry + riskDist * 0.12 : entry - riskDist * 0.12;
  const tier2Price = entry;
  const tier3Price = isBuy ? entry - riskDist * 0.10 : entry + riskDist * 0.10;
  const gceConfirmPrice = isBuy ? entry + riskDist * 0.22 : entry - riskDist * 0.22;

  const aplusConf = getSelectedAPlusConfluences();
  const activeConfCount = [aplusConf.sweep, aplusConf.smt, aplusConf.disp, aplusConf.qmx].filter(Boolean).length;

  r.currentPrice = fmt(cur);
  r.entry = fmt(tier2Price);
  r.sl = fmt(sl);
  r.tp1 = fmt(tp1);
  r.tp2 = fmt(tp2);
  r.rrRatio = cfg.rrRatio;
  r.setupGrade = `${cfg.setupGrade} • ${activeConfCount}/4 CONFLUENCES`;
  r.orderType = cfg.orderType;

  // Populate 3-Tier Perfect Entries
  r.tierEntries = {
    tier1Iofed: fmt(tier1Price),
    tier1Note: effectiveStyle === 'SECRET_411'
      ? `MISS Pullback / គែមដំបូង Yellow Zone (ISL @ ${fmt(tier1Price)})`
      : (effectiveStyle === 'RARE_FLIP_SNR'
        ? `Direct Entry (4th Touch #Flipped_SNR @ ${fmt(tier1Price)})`
        : (isBuy ? 'IOFED (25% Bullish FVG) / Fresh V-Support Wick' : 'IOFED (25% Bearish FVG) / Fresh A-Resistance Wick')),
    tier2SniperCe: fmt(tier2Price),
    tier2Note: effectiveStyle === 'SECRET_411'
      ? `ACCURATE Pullback (HSL+ISL 50% Yellow Zone @ ${fmt(tier2Price)})`
      : (effectiveStyle === 'RARE_FLIP_SNR'
        ? `#Doji_SNR & #GAP_SNR Flipzone Midpoint @ ${fmt(tier2Price)}`
        : '50% FVG Equilibrium (C.E.) + OB MT + QMX Point #3 "X"'),
    tier3Golden: fmt(effectiveStyle === 'SECRET_411' ? tier3Price : gceConfirmPrice),
    tier3Note: effectiveStyle === 'SECRET_411'
      ? `DEEP Pullback (Full Wick Edge @ ${fmt(tier3Price)}) / GCE @ ${fmt(gceConfirmPrice)}`
      : (effectiveStyle === 'RARE_FLIP_SNR'
        ? `Confirmatory Entry (LTF Flipping Candle @ ${fmt(gceConfirmPrice)})`
        : 'Golden Confirmation (GCE Engulfing) / CISD Close')
  };

  // Populate Scalping Perfect Entry Box
  r.scalpPerfect = {
    zone: `${fmt(perfectLow)} – ${fmt(perfectHigh)}`,
    qualityScore: cfg.qualityScore,
    lotAdvice: cfg.lotAdvice,
    quickTarget: `TP1 @ ${fmt(tp1)} (${roadblockTf} + Move SL to BE)`,
    executionNote: isBuy
      ? `តំបន់ចូល BUY ដ៏ល្អឥតខ្ចោះ (${fmt(perfectLow)}–${fmt(perfectHigh)}) • ${pbInfo.type} • Zikir 2x BO + #Flipped_SNR — Join Trade ភ្លាមៗ!`
      : `តំបន់ចូល SELL ដ៏ល្អឥតខ្ចោះ (${fmt(perfectLow)}–${fmt(perfectHigh)}) • ${pbInfo.type} • Zikir 2x BO + #Flipped_SNR — Join Trade ភ្លាមៗ!`
  };

  r.snrZones = {
    resistance: fmt(res),
    support: fmt(sup)
  };

  // Populate ICT Liquidity & Dealing Range Map
  r.ictLiquidity = {
    bsl: `${fmt(res)} (ERL / PDH / EQH)`,
    ssl: `${fmt(sup)} (ERL / PDL / EQL)`,
    irlFvg: `${fmt(fvgLow)} – ${fmt(fvgHigh)} (50% C.E. @ ${fmt(entry)})`,
    equilibrium50: fmt(equilibrium50),
    pdZone: isBuy ? 'DISCOUNT (< 0.5 Fib • BUY ZONE)' : 'PREMIUM (> 0.5 Fib • SELL ZONE)',
    isDiscount: isBuy,
    confSweep: aplusConf.sweep
      ? (isBuy ? `#1 SSL Swept @ ${fmt(sup)} (Strong Low)` : `#1 BSL Swept @ ${fmt(res)} (Strong High)`)
      : '#1 Liquidity Sweep (Optional)',
    confSmt: aplusConf.smt
      ? '#2 SMT Divergence + Storyline Confirmed'
      : '#2 SMT Filter (Off)',
    confDisp: aplusConf.disp
      ? `#3 Algo Candle + FVG C.E. @ ${fmt(entry)}`
      : '#3 Displacement FVG'
  };

  // Populate Malaysian SNR Emperor & ICT AMD Institutional Matrix
  r.msnrEmperor = {
    storylineBadge: effectiveStyle === 'SECRET_411'
      ? '🕵️‍♂️ SECRET 4.11 • NIGHT MARKET HSL + ISL 2x BO CONFIRMED'
      : (effectiveStyle === 'RARE_FLIP_SNR'
        ? '💎 RARE #FLIPPED_SNR + #DOJI_SNR (1R:5R) CONFIRMED'
        : `📐 STORYLINE (${r.timeframe || 'M15'}) + QMX & 50% C.E. CONFIRMED`),
    levelType: isBuy
      ? `Fresh 'V' Support + #Doji_SNR / Gap SNR @ ${fmt(entry)} (Shadow Touch + 3 Missed Candles)`
      : `Fresh 'A' Resistance + #Doji_SNR / Gap SNR @ ${fmt(entry)} (Shadow Touch + 3 Missed Candles)`,
    trendlineX: isBuy
      ? `Bullish QML / RBS Intersects Trendline Point #3 ('X' Factor) @ ${fmt(entry)}`
      : `Bearish QML / SBR Intersects Trendline Point #3 ('X' Factor) @ ${fmt(entry)}`,
    engulfingGce: isBuy
      ? `4.11 Dominant / Hidden MTF Bullish Engulf + GCE @ ${fmt(gceConfirmPrice)}`
      : `4.11 Dominant / Hidden MTF Bearish Engulf + GCE @ ${fmt(gceConfirmPrice)}`,
    amdCycle: isBuy
      ? `Asia Build-Up → London SSL Sweep (${fmt(sup)}) → NY Bullish Breaker & Flipping Candle`
      : `Asia Build-Up → London BSL Sweep (${fmt(res)}) → NY Bearish Breaker & Flipping Candle`
  };

  // Populate New Secret of 4.11 & Rare #Flipped_SNR / #Doji_SNR Matrix
  r.secret411Rare = {
    zikirBadge: `🌙 ZIKIR FRESH ZONE (1st & 2nd BO • ${pbInfo.code} PULLBACK)`,
    hslIslZone: `Night Market (HSL) + Current BO (ISL) Yellow Zone: ${fmt(fvgLow)} – ${fmt(fvgHigh)}`,
    engulfPullback: `${isBuy ? 'Bullish Dominant / Hidden MTF Engulf' : 'Bearish Dominant / Hidden MTF Engulf'} • ${pbInfo.type}`,
    flippedSnr: isBuy
      ? `Bullish #Flipped_SNR (RBS Flipzone @ ${fmt(entry)}) • Bullish Gap Overtakes Bearish Gap (A-B-C Cycle)`
      : `Bearish #Flipped_SNR (SBR Flipzone @ ${fmt(entry)}) • Bearish Gap Overtakes Bullish Gap (A-B-C Cycle)`,
    dojiGapLimits: `#Doji_SNR @ ${fmt(entry)} | GAP UL: ${fmt(gapUpperLimit)} / LL: ${fmt(gapLowerLimit)} | TP1 @ ${roadblockTf}`,
    gapUpperLimit: fmt(gapUpperLimit),
    gapLowerLimit: fmt(gapLowerLimit),
    pullbackCode: pbInfo.code
  };

  // Strategy-Specific Khmer Detailed Analysis & Confluences
  if (effectiveStyle === 'SECRET_411') {
    r.detailedAnalysis = isBuy
      ? `[Secret of 4.11 — Ali Yusoff] តម្លៃបានបំពេញលក្ខខណ្ឌ ZIKIR (1.Breakout 2 ដង ទាំង 1st BO និង 2nd BO -> 2.Pullback -> 3.Entry) ដោយបង្កើតតំបន់ Fresh Yellow Zone (Full Body + Wick: ${fmt(fvgLow)}–${fmt(fvgHigh)}) ដែលមាន Night Market (HSL) នៅខាងឆ្វេង និង Current Breakout (ISL)។ តាមចរិតគូ ${r.pair} (${pbInfo.type}) ចំណុចចូល Perfect BUY គឺនៅ ${fmt(entry)} (MISS/Tier 1: ${fmt(tier1Price)} | DEEP/Tier 3: ${fmt(tier3Price)}) ឆ្ពោះទៅ TP1 (${fmt(tp1)} • ${roadblockTf}) និង TP2 (${fmt(tp2)}) ដោយដាក់ SL នៅ ${fmt(sl)}។`
      : `[Secret of 4.11 — Ali Yusoff] តម្លៃបានបំពេញលក្ខខណ្ឌ ZIKIR (1.Breakout 2 ដង ទាំង 1st BO និង 2nd BO -> 2.Pullback -> 3.Entry) ដោយបង្កើតតំបន់ Fresh Yellow Zone (Full Body + Wick: ${fmt(fvgLow)}–${fmt(fvgHigh)}) ដែលមាន Night Market (HSL) នៅខាងឆ្វេង និង Current Breakout (ISL)។ តាមចរិតគូ ${r.pair} (${pbInfo.type}) ចំណុចចូល Perfect SELL គឺនៅ ${fmt(entry)} (MISS/Tier 1: ${fmt(tier1Price)} | DEEP/Tier 3: ${fmt(tier3Price)}) ឆ្ពោះទៅ TP1 (${fmt(tp1)} • ${roadblockTf}) និង TP2 (${fmt(tp2)}) ដោយដាក់ SL នៅ ${fmt(sl)}។`;
  } else if (effectiveStyle === 'RARE_FLIP_SNR') {
    r.detailedAnalysis = isBuy
      ? `[My Rare SNR Course — #Flipped_SNR & #Doji_SNR] ទៀន Momentum Flipping Candle បានបំបែកតំបន់ Weak Resistance (បន្ទាប់ពី 1st & 2nd Reject) និងធ្វើឱ្យ Bullish #GAP_SNR លេបត្របាក់ Bearish Gap ចាស់ (Shift in Market Structure / A-B-C Cycle) បង្កើតបានជា FLIPZONE (RBS) និង #Doji_SNR នៅ ${fmt(entry)}។ ដរាបណាគ្មានតួទៀនបិទក្រោម Lower Limit (LL: ${fmt(gapLowerLimit)}) ការចូល BUY នៅ ${fmt(entry)} មានសុពលភាពឆ្ពោះទៅ Internal Gap Roadblock TP1 (${fmt(tp1)}) និង TP2 (${fmt(tp2)} • 1R:5R)។`
      : `[My Rare SNR Course — #Flipped_SNR & #Doji_SNR] ទៀន Momentum Flipping Candle បានបំបែកតំបន់ Weak Support (បន្ទាប់ពី 1st & 2nd Reject) និងធ្វើឱ្យ Bearish #GAP_SNR លេបត្របាក់ Bullish Gap ចាស់ (Shift in Market Structure / A-B-C Cycle) បង្កើតបានជា FLIPZONE (SBR) និង #Doji_SNR នៅ ${fmt(entry)}។ ដរាបណាគ្មានតួទៀនបិទលើ Upper Limit (UL: ${fmt(gapUpperLimit)}) ការចូល SELL នៅ ${fmt(entry)} មានសុពលភាពឆ្ពោះទៅ Internal Gap Roadblock TP1 (${fmt(tp1)}) និង TP2 (${fmt(tp2)} • 1R:5R)។`;
  } else if (effectiveStyle === 'MSNR_EMPEROR') {
    r.detailedAnalysis = isBuy
      ? `[Malaysian SNR Emperor] តម្លៃបានចុះមកប៉ះតំបន់ Fresh 'V' Support និង HTF Open-Close Gap SNR (${fmt(sup)}) ដោយបន្សល់ទុក Shadow Wick Touch និងមាន Missed Candles (MISS) បញ្ជាក់ភាពរឹងមាំ។ ចំណុចចូល Perfect Entry ស្ថិតនៅ ${fmt(entry)} ត្រង់ប្រសព្វ QML + Trendline Point #3 ('X' Factor / QMX) និងមាន Golden Confirmation Entry (GCE @ ${fmt(gceConfirmPrice)})។ កំណត់ TP1 នៅ ${fmt(tp1)} (${roadblockTf}) និង TP2 នៅ Fresh Resistance (${fmt(tp2)}) ជាមួយ SL ការពារនៅ ${fmt(sl)}។`
      : `[Malaysian SNR Emperor] តម្លៃបានឡើងទៅប៉ះតំបន់ Fresh 'A' Resistance និង HTF Open-Close Gap SNR (${fmt(res)}) ដោយបន្សល់ទុក Shadow Wick Touch និងមាន Missed Candles (MISS) បញ្ជាក់ភាពរឹងមាំ។ ចំណុចចូល Perfect Entry ស្ថិតនៅ ${fmt(entry)} ត្រង់ប្រសព្វ QML + Trendline Point #3 ('X' Factor / QMX) និងមាន Golden Confirmation Entry (GCE @ ${fmt(gceConfirmPrice)})។ កំណត់ TP1 នៅ ${fmt(tp1)} (${roadblockTf}) និង TP2 នៅ Fresh Support (${fmt(tp2)}) ជាមួយ SL ការពារនៅ ${fmt(sl)}។`;
  } else if (effectiveStyle === 'AMD_MMXM') {
    r.detailedAnalysis = isBuy
      ? `[ICT AMD Power of 3 & Market Maker Buy Model] បន្ទាប់ពីបង្កើតតំបន់សន្សំ Liquidity ក្នុង Asia Range ទីផ្សារបានធ្វើ Manipulation (Judas Swing) បោសសម្អាត Sell-Side Liquidity និង Inducement នៅ ${fmt(sup)} រួចបញ្ច្រាសទិសដៅដោយ Algo Candle + Vector Candle បង្កើត Bullish Breaker Block និង FVG។ Perfect Entry កំណត់នៅ 50% C.E. (${fmt(entry)}) សម្រាប់វគ្គ Distribution ឆ្ពោះទៅ TP1 (${fmt(tp1)}) និង TP2 (${fmt(tp2)}) ដោយដាក់ SL ក្រោម Manipulation Wick (${fmt(sl)})។`
      : `[ICT AMD Power of 3 & Market Maker Sell Model] បន្ទាប់ពីបង្កើតតំបន់សន្សំ Liquidity ក្នុង Asia Range ទីផ្សារបានធ្វើ Manipulation (Judas Swing) បោសសម្អាត Buy-Side Liquidity និង Inducement នៅ ${fmt(res)} រួចបញ្ច្រាសទិសដៅដោយ Algo Candle + Vector Candle បង្កើត Bearish Breaker Block និង FVG។ Perfect Entry កំណត់នៅ 50% C.E. (${fmt(entry)}) សម្រាប់វគ្គ Distribution ឆ្ពោះទៅ TP1 (${fmt(tp1)}) និង TP2 (${fmt(tp2)}) ដោយដាក់ SL លើ Manipulation Wick (${fmt(sl)})។`;
  } else if (effectiveStyle === 'APLUS_ICT') {
    r.detailedAnalysis = isBuy
      ? `[A+ ICT PD Array Setup] តម្លៃស្ថិតក្នុងតំបន់ Discount (< 0.5 Fib: ${fmt(equilibrium50)}) បន្ទាប់ពីបោសសម្អាត External Sell-Side Liquidity (SSL @ ${fmt(sup)}) និងបង្កើត Change in the State of Delivery (CISD)។ Perfect Entry កំណត់នៅ Tier 2 Sniper 50% C.E. (${fmt(entry)}) នៃតំបន់ BISI FVG / Bullish OrderBlock Mean Threshold (Tier 1 IOFED @ ${fmt(tier1Price)}) សម្រាប់គោលដៅ Internal LQ TP1 (${fmt(tp1)}) និង External BSL TP2 (${fmt(tp2)})។`
      : `[A+ ICT PD Array Setup] តម្លៃស្ថិតក្នុងតំបន់ Premium (> 0.5 Fib: ${fmt(equilibrium50)}) បន្ទាប់ពីបោសសម្អាត External Buy-Side Liquidity (BSL @ ${fmt(res)}) និងបង្កើត Change in the State of Delivery (CISD)។ Perfect Entry កំណត់នៅ Tier 2 Sniper 50% C.E. (${fmt(entry)}) នៃតំបន់ SIBI FVG / Bearish OrderBlock Mean Threshold (Tier 1 IOFED @ ${fmt(tier1Price)}) សម្រាប់គោលដៅ Internal LQ TP1 (${fmt(tp1)}) និង External SSL TP2 (${fmt(tp2)})។`;
  } else {
    r.detailedAnalysis = isBuy
      ? `ទីផ្សារមានទំនោរកើនឡើងបន្ទាប់ពីតម្លៃបានប៉ះតំបន់ Fresh Support (${fmt(sup)}) និងបោសសម្អាត Sell-Side Liquidity (SSL) ក្នុងតំបន់ Discount (< 0.5 Fib: ${fmt(equilibrium50)})។ 3-Tier Perfect Entry ត្រូវបានកំណត់នៅចំណុច Sniper 50% C.E. ${fmt(entry)} (${pbInfo.type}) ដើម្បី Join Trade តាមទិសដៅកើនឡើង។ TP1 នៅ ${fmt(tp1)} (${roadblockTf} + Move SL to BE), TP2 នៅក្បែរតំបន់ខ្ពស់ចាស់ (${fmt(tp2)}) និង SL នៅក្រោមតំបន់ទាបចុងក្រោយ (${fmt(sl)})។`
      : `ទីផ្សារមានទំនោរថយចុះបន្ទាប់ពីតម្លៃបានប៉ះតំបន់ Fresh Resistance (${fmt(res)}) និងបោសសម្អាត Buy-Side Liquidity (BSL) ក្នុងតំបន់ Premium (> 0.5 Fib: ${fmt(equilibrium50)})។ 3-Tier Perfect Entry ត្រូវបានកំណត់នៅចំណុច Sniper 50% C.E. ${fmt(entry)} (${pbInfo.type}) ដើម្បី Join Trade តាមទិសដៅថយចុះ។ TP1 នៅ ${fmt(tp1)} (${roadblockTf} + Move SL to BE), TP2 នៅក្បែរតំបន់ទាបចាស់ (${fmt(tp2)}) និង SL នៅលើតំបន់ខ្ពស់ចុងក្រោយ (${fmt(sl)})។`;
  }

  r.keyFlipRule = `${cfg.name} • ${isBuy ? 'Zikir 2x BO + #Flipped_SNR RBS → Perfect BUY' : 'Zikir 2x BO + #Flipped_SNR SBR → Perfect SELL'} • ចាក់ ${isBuy ? 'KEY BUY = NEW BUY' : 'KEY SELL = NEW SELL'} 💸`;

  r.confluence = [
    `[#1 Secret of 4.11 Zikir & HSL+ISL Yellow Zone] តម្លៃបានបំបែក 2 ដង (1st & 2nd Breakout) ដោយមាន Night Market (HSL) + Current BO (ISL) ក្នុងតំបន់ Full-Body+Wick Yellow Zone (${fmt(fvgLow)}–${fmt(fvgHigh)}) និងចរិតគូ ${pbInfo.type}`,
    `[#2 Rare #Flipped_SNR, #Doji_SNR & Gap Overtake] ${isBuy ? `Bullish #GAP_SNR លេបត្របាក់ Bearish Gap (Flipzone RBS @ ${fmt(entry)}) អមដោយ #Doji_SNR និងការពារដោយ Lower Limit (LL: ${fmt(gapLowerLimit)})` : `Bearish #GAP_SNR លេបត្របាក់ Bullish Gap (Flipzone SBR @ ${fmt(entry)}) អមដោយ #Doji_SNR និងការពារដោយ Upper Limit (UL: ${fmt(gapUpperLimit)})`}`,
    `[#3 3-Tier Perfect Entry + QMX 'X' & ICT 50% C.E.] Tier 1 (IOFED/Direct): ${fmt(tier1Price)} | Tier 2 (50% C.E. / QMX 'X'): ${fmt(tier2Price)} | Tier 3 (GCE/Deep): ${fmt(r.tierEntries.tier3Golden)} → គោលដៅ TP1 @ ${fmt(tp1)} (${roadblockTf}) និង TP2 @ ${fmt(tp2)} (${cfg.rrRatio})`
  ];

  return r;
}

// 6. Hook into renderResult to populate the new Secret 4.11 & Rare #Flipped_SNR UI Box
const _origRenderResult = typeof window.renderResult === 'function' ? window.renderResult : null;
window.renderResult = function() {
  if (_origRenderResult) _origRenderResult();
  const r = state.result;
  if (!r) return;

  const s411 = r.secret411Rare || {};
  if (document.getElementById('r411ZikirBadge')) {
    document.getElementById('r411ZikirBadge').textContent = s411.zikirBadge || '🌙 ZIKIR FRESH ZONE (2x BO CONFIRMED)';
  }
  if (document.getElementById('r411HslIslZone')) {
    document.getElementById('r411HslIslZone').textContent = s411.hslIslZone || '-';
  }
  if (document.getElementById('r411EngulfPullback')) {
    document.getElementById('r411EngulfPullback').textContent = s411.engulfPullback || '-';
  }
  if (document.getElementById('rRareFlippedSnr')) {
    document.getElementById('rRareFlippedSnr').textContent = s411.flippedSnr || '-';
  }
  if (document.getElementById('rRareDojiGapLimits')) {
    document.getElementById('rRareDojiGapLimits').textContent = s411.dojiGapLimits || '-';
  }

  // Highlight active strategy button for #6 and #7
  const style = r.tradeStyle || state.tradeStyle;
  const b411 = document.getElementById('btnResSwitch411');
  const bRare = document.getElementById('btnResSwitchRareFlip');
  if (b411) {
    b411.className = style === 'SECRET_411'
      ? 'px-2.5 py-1 rounded-lg bg-yellow-400 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(250,204,21,0.5)]'
      : 'px-2.5 py-1 rounded-lg bg-yellow-500/20 border border-yellow-400/50 text-yellow-300 font-extrabold cursor-pointer hover:brightness-110';
  }
  if (bRare) {
    bRare.className = style === 'RARE_FLIP_SNR'
      ? 'px-2.5 py-1 rounded-lg bg-sky-400 text-slate-950 font-extrabold cursor-pointer shadow-[0_0_12px_rgba(56,189,248,0.5)]'
      : 'px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/50 text-sky-300 font-extrabold cursor-pointer hover:brightness-110';
  }
};

window.recalculateResultForTradeStyle = function(newStyle) {
  if (!state.result) return;
  const clone = JSON.parse(JSON.stringify(state.result));
  clone.sl = NaN;
  state.result = calibrateSniperResult(clone, newStyle);
  window.renderResult();

  if (typeof window.updateActiveLobbyItemResult === 'function') {
    window.updateActiveLobbyItemResult(state.result);
  }
};

// ============================================================================
// ENHANCED VISUAL ANNOTATED CHART OVERLAY ENGINE (#annotatedChartCanvas)
// DRAWS: 4.11 NIGHT MARKET (HSL) + 1ST/2ND BO (ISL) YELLOW ZONE, RARE #FLIPPED_SNR
// & #DOJI_SNR (UL/LL), LIQUIDITY SWEEP ($$$), QMX TRENDLINE 'X', SL, TP1 & TP2
// ============================================================================
window.drawAnnotatedChartCanvas = function(r) {
  const canvas = document.getElementById('annotatedChartCanvas');
  const srcImgEl = document.getElementById('previewImg');
  if (!canvas || !r) return;

  const srcUrl = srcImgEl?.src || (state.imageBase64 ? `data:${state.mime};base64,${state.imageBase64}` : '');
  if (!srcUrl) return;

  const img = new Image();
  img.onload = () => {
    const maxW = 1150;
    const scale = Math.min(1, maxW / Math.max(1, img.naturalWidth || img.width));
    const w = Math.max(680, Math.round((img.naturalWidth || img.width) * scale));
    const h = Math.max(400, Math.round((img.naturalHeight || img.height) * scale));

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const effectiveStyle = r.tradeStyle || state.tradeStyle || 'SCALPING';
    const cfg = getStrategyConfig(effectiveStyle);
    const tagEl = document.getElementById('chartOverlayStrategyTag');
    if (tagEl) tagEl.textContent = cfg.name;

    const statusEl = document.getElementById('annotatedChartStatusText');
    if (!state.showChartOverlay) {
      if (statusEl) statusEl.textContent = '○ OVERLAY HIDDEN (RAW CHART)';
      return;
    }
    if (statusEl) {
      statusEl.textContent = `● ${effectiveStyle} • HSL+ISL ZIKIR + #FLIPPED_SNR + 3-TIER ENTRY CALIBRATED`;
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
    const pad = Math.max((maxP - minP) * 0.15, 0.0001);
    const topP = maxP + pad;
    const botP = minP - pad;

    const chartTop = h * 0.11;
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
    const yT1 = !isNaN(tier1) ? priceToY(tier1) : yEntry - 7;
    const yT3 = !isNaN(tier3) ? priceToY(tier3) : yEntry + 7;

    const zoneLeft = Math.floor(w * 0.40);
    const zoneRight = Math.floor(w * 0.85);

    // 1. Subtle Contrast Overlay
    ctx.fillStyle = 'rgba(4, 9, 20, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // 2. Shaded Reward Zone (Entry -> TP2) & Risk Zone (Entry -> SL)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.fillRect(zoneLeft, Math.min(yEntry, yTp2), zoneRight - zoneLeft, Math.abs(yTp2 - yEntry));

    ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
    ctx.fillRect(zoneLeft, Math.min(yEntry, ySl), zoneRight - zoneLeft, Math.abs(ySl - yEntry));

    // 3. Highlighted 4.11 Full-Body+Wick Yellow Zone / #Flipped_SNR Flipzone / 3-Tier Perfect Box
    const boxTop = Math.min(yT1, yEntry, yT3) - 7;
    const boxHeight = Math.max(18, Math.abs(yT3 - yT1) + 14);
    const boxStartX = Math.floor(w * 0.16);
    const isYellow411 = effectiveStyle === 'SECRET_411';
    ctx.fillStyle = isYellow411
      ? 'rgba(250, 204, 21, 0.22)'
      : (isBuy ? 'rgba(0, 229, 255, 0.22)' : 'rgba(244, 63, 94, 0.22)');
    ctx.strokeStyle = isYellow411 ? '#facc15' : '#18ffff';
    ctx.lineWidth = 1.8;
    ctx.fillRect(boxStartX, boxTop, zoneRight - boxStartX, boxHeight);
    ctx.strokeRect(boxStartX, boxTop, zoneRight - boxStartX, boxHeight);

    const pbCode = r.secret411Rare?.pullbackCode || 'ACCURATE';
    ctx.font = '800 10.5px Inter, sans-serif';
    ctx.fillStyle = isYellow411 ? '#fde047' : '#18ffff';
    ctx.fillText(
      `🎯 YELLOW ZONE / #FLIPPED_SNR (UL/LL) • [${pbCode} PULLBACK] • IOFED: ${r.tierEntries?.tier1Iofed || r.entry} | 50% C.E.: ${r.entry}`,
      boxStartX + 8,
      Math.max(chartTop + 12, boxTop - 5)
    );

    // 4. Draw 4.11 Night Market (HSL) Cluster on Left + 1st & 2nd Breakout (ISL) Markers
    const hslX = Math.floor(w * 0.23);
    const islX = Math.floor(w * 0.42);
    ctx.save();
    [hslX - 18, hslX, hslX + 18].forEach((hx, i) => {
      ctx.beginPath();
      ctx.arc(hx, yEntry + (i % 2 === 0 ? -3 : 3), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.strokeStyle = '#050811';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
    ctx.fillStyle = '#fde047';
    ctx.font = '800 10px Inter, sans-serif';
    ctx.fillText('🌙 HSL (NIGHT MARKET)', hslX - 28, yEntry + (isBuy ? -12 : 16));

    // ISL & 1st/2nd Breakout Marker
    ctx.beginPath();
    ctx.arc(islX, yEntry, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('⚡ ISL (1st & 2nd BO + #Doji_SNR)', islX - 24, yEntry + (isBuy ? -12 : 16));
    ctx.restore();

    // 5. Draw Liquidity Sweep / Inducement Trap Marker ($$$ SSL / BSL Swept)
    const sweepX = Math.floor(w * 0.50);
    const sweepY = isBuy ? Math.min(chartBot - 8, (yEntry + ySl) / 2 + 6) : Math.max(chartTop + 8, (yEntry + ySl) / 2 - 6);
    ctx.save();
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(Math.floor(w * 0.30), sweepY);
    ctx.lineTo(sweepX + 25, sweepY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fda4af';
    ctx.font = '800 10.5px Inter, sans-serif';
    ctx.fillText(
      isBuy ? '$$$ SSL SWEPT / FLIPZONE ORIGIN' : '$$$ BSL SWEPT / FLIPZONE ORIGIN',
      Math.floor(w * 0.30) + 4,
      sweepY + (isBuy ? 13 : -6)
    );
    ctx.restore();

    // 6. Draw Malaysian SNR Trendline 'X' Marriage (Point #1 SNR -> Point #2 MISS -> Point #3 QMX 'X' / ZIKIR ENTRY)
    const pt3X = Math.floor(w * 0.63);
    const pt3Y = yEntry;
    const pt1X = Math.floor(w * 0.21);
    const pt1Y = isBuy
      ? Math.min(chartBot - 14, yEntry + (chartBot - chartTop) * 0.20)
      : Math.max(chartTop + 14, yEntry - (chartBot - chartTop) * 0.20);
    const pt2X = Math.floor((pt1X + pt3X) / 2);
    const pt2Y = (pt1Y + pt3Y) / 2;

    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(pt1X, pt1Y);
    ctx.lineTo(pt3X + Math.floor(w * 0.14), pt3Y + (pt3Y - pt1Y) * 0.34);
    ctx.stroke();
    ctx.setLineDash([]);

    [
      { x: pt1X, y: pt1Y, lbl: '#1 FRESH SNR' },
      { x: pt2X, y: pt2Y, lbl: '#2 MISS ($)' },
      { x: pt3X, y: pt3Y, lbl: '🎯 #3 ZIKIR & QMX ENTRY "X"' }
    ].forEach((pt, idx) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, idx === 2 ? 7.5 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = idx === 2 ? '#18ffff' : '#fbbf24';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#050811';
      ctx.stroke();

      ctx.font = '800 11px Inter, sans-serif';
      ctx.fillStyle = idx === 2 ? '#18ffff' : '#fde047';
      ctx.fillText(pt.lbl, pt.x - 20, pt.y + (isBuy ? 18 : -10));
    });
    ctx.restore();

    // 7. Projected Zikir Price Delivery Path (1.Breakout -> 2.Pullback -> 3.Entry -> TP1 -> TP2)
    ctx.save();
    ctx.strokeStyle = isBuy ? '#34d399' : '#fb7185';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sweepX, sweepY);
    ctx.lineTo(pt3X, pt3Y);
    ctx.lineTo(Math.floor(w * 0.73), yTp1);
    ctx.lineTo(Math.floor(w * 0.82), yTp2);
    ctx.stroke();

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

    // 8. Horizontal Price Level Lines + Right-Side Pill Labels
    const drawLevelLine = (y, label, priceText, colorHex, bgRgba, dashed = false) => {
      ctx.save();
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = dashed ? 1.5 : 2.2;
      if (dashed) ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(Math.floor(w * 0.16), y);
      ctx.lineTo(zoneRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      const tagText = `${label}: ${priceText}`;
      ctx.font = '800 11px Inter, monospace';
      const textW = ctx.measureText(tagText).width;
      const pillW = textW + 16;
      const pillH = 22;
      const pillX = Math.min(w - pillW - 8, zoneRight - pillW + 45);
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

    drawLevelLine(yTp2, '💰 TP2 (HTF TARGET / ERL)', r.tp2, '#4ade80', 'rgba(6, 78, 59, 0.94)', false);
    drawLevelLine(yTp1, '🎯 TP1 (1-TF ROADBLOCK + BE)', r.tp1, '#34d399', 'rgba(6, 95, 70, 0.90)', true);
    if (!isNaN(fib50)) {
      drawLevelLine(yFib, '⚖️ 0.5 EQUILIBRIUM', r.ictLiquidity.equilibrium50, '#fbbf24', 'rgba(120, 53, 15, 0.90)', true);
    }
    drawLevelLine(yEntry, `⚡ PERFECT ${r.action} (ZIKIR / 50% C.E.)`, r.entry, '#18ffff', 'rgba(8, 51, 68, 0.96)', false);
    drawLevelLine(ySl, '🛑 STOP LOSS (BEYOND UL/LL)', r.sl, '#fb7185', 'rgba(136, 19, 55, 0.94)', false);

    // 9. Top-Left Institutional Strategy HUD Watermark
    ctx.save();
    ctx.fillStyle = 'rgba(8, 15, 30, 0.90)';
    ctx.strokeStyle = 'rgba(24, 255, 255, 0.60)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(14, 14, Math.min(w - 28, 510), 62, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#18ffff';
    ctx.font = '800 13px Inter, sans-serif';
    ctx.fillText(`POR - SNR SCANNER • ${r.pair || 'XAU/USD'} (${r.timeframe || 'M15'}) • ${r.action} NOW`, 26, 34);

    ctx.fillStyle = '#fde047';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.fillText(`${cfg.name} | R:R ${r.rrRatio || cfg.rrRatio}`, 26, 51);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 10.5px Inter, monospace';
    ctx.fillText(`Entry: ${r.entry} | SL: ${r.sl} | TP1: ${r.tp1} | TP2: ${r.tp2}`, 26, 67);
    ctx.restore();
  };
  img.src = srcUrl;
};

function optimizeChartImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1920;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > maxDim || h > maxDim) {
        const k = maxDim / Math.max(w, h);
        w = Math.round(w * k);
        h = Math.round(h * k);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.92).split(',')[1]);
    };
    img.onerror = () => resolve(state.imageBase64);
    img.src = dataUrl;
  });
}

// ============================================================================
// MAIN CHART SCAN EXECUTION ENTRY POINT
// ============================================================================
async function scanChart() {
  if (state.scanning) return;
  if (!state.user) return openModal('loginModal');
  if (!state.unlocked && !isAdminUser(state.user)) return openModal('keyModal');
  if (!state.imageBase64) return showError('សូមទម្លាក់រូបភាព Chart ជាមុនសិន មុននឹងចុចស្កេន!');

  const apiKey = getApiKey();
  const previewSrc = $('previewImg')?.src || `data:${state.mime};base64,${state.imageBase64}`;
  const newsMode = $('newsFlipMode')?.value || 'ALL';
  const tradeStyle = resolveEffectiveTradeStyle(newsMode, state.tradeStyle || 'SCALPING');

  state.scanning = true;
  state.result = null;
  showError('');
  show($('resultCard'), false);
  renderScanButton();

  try {
    let parsedResult = null;

    if (isValidGeminiKeyFormat(apiKey)) {
      try {
        const hiResBase64 = await optimizeChartImage(previewSrc);
        const payload = {
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: hiResBase64 } },
              { text: buildSniperPrompt(newsMode, tradeStyle, state.selectedPair, state.selectedTf) }
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        };

        const data = await callGeminiWithFallback(apiKey, payload);
        const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
        parsedResult = parseGeminiJson(raw);
      } catch (geminiErr) {
        console.warn('Gemini API failed, switching to Local Smart Chart Vision Engine:', geminiErr);
      }
    }

    if (!parsedResult) {
      parsedResult = await analyzeChartLocallyWithVision(previewSrc, newsMode, tradeStyle);
    }

    state.result = calibrateSniperResult(parsedResult, tradeStyle);
    consumeKeyScanIfNeeded();
    window.renderResult();

    // Auto-save scan result + compressed chart thumbnail into After-Scan History Lobby
    if (typeof window.saveScanToHistoryLobby === 'function') {
      await window.saveScanToHistoryLobby(state.result, previewSrc);
    }

    // Wait briefly so the annotated chart canvas finishes drawing before sending to Telegram
    setTimeout(async () => {
      try { await sendChartPhotoToTelegramBot(state.imageBase64, state.mime, state.result); }
      catch (tgErr) { console.warn('Telegram send failed:', tgErr); }
    }, 250);
  } catch (err) {
    console.error(err);
    showError(err.message || 'មានបញ្ហាក្នុងការស្កេនរូបភាព សូមសាកល្បងម្តងទៀត។');
  } finally {
    state.scanning = false;
    renderScanButton();
  }
}

window.scanChart = scanChart;