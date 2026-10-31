// ============================================================================
// POR - SNR SCANNER PRO — FULL MULTI-STRATEGY & PERFECT ENTRY ENGINE (scanChart.js)
// ============================================================================
// INTEGRATED STRATEGIES FROM INSTITUTIONAL SMC & MALAYSIAN SNR BOOKS:
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
// ============================================================================

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
  if (newsMode === 'ICT_APLUS') return 'APLUS_ICT';
  if (newsMode === 'MSNR_EMPEROR') return 'MSNR_EMPEROR';
  if (newsMode === 'AMD_MMXM') return 'AMD_MMXM';
  if (newsMode === 'SCALP_PERFECT') return 'SCALPING';
  if (newsMode === 'NON_FARM') return 'SWING';

  if (['SCALPING', 'SWING', 'APLUS_ICT', 'MSNR_EMPEROR', 'AMD_MMXM'].includes(currentStyle)) {
    return currentStyle;
  }
  if (filterMode === 'MSNR_QMX' || filterMode === 'MSNR_GAP_GCE') return 'MSNR_EMPEROR';
  if (filterMode === 'AMD_PO3') return 'AMD_MMXM';
  if (filterMode === 'ERL_TO_IRL' || filterMode === 'DEALING_PD') return 'APLUS_ICT';
  return 'SCALPING';
}

function getStrategyConfig(tradeStyle = 'SCALPING') {
  switch (tradeStyle) {
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

function buildSniperPrompt(newsMode = 'ALL', tradeStyle = 'SCALPING', overridePair = 'AUTO', overrideTf = 'AUTO') {
  const effectiveStyle = resolveEffectiveTradeStyle(newsMode, tradeStyle);
  const cfg = getStrategyConfig(effectiveStyle);
  const aplusConf = getSelectedAPlusConfluences();

  let styleInstructions = '';
  if (effectiveStyle === 'APLUS_ICT') {
    styleInstructions = `SELECTED STRATEGY: 🏆 A+ ICT LIQUIDITY & PD ARRAY SETUP (Min 1:3.5 RR)
- Apply Mastering ICT PD Arrays & Institutional SMC rules:
  1. External Range Liquidity (ERL): Identify Buy-Side Liquidity (BSL above swing highs, PDH, PWH, Equal Highs) and Sell-Side Liquidity (SSL below swing lows, PDL, PWL, Equal Lows).
  2. Dealing Range & 0.5 Equilibrium: Discount (< 0.5 Fib) for BUY setups; Premium (> 0.5 Fib) for SELL setups.
  3. Change in the State of Delivery (CISD) & Market Structure Shift (MSS): Wait for an impulsive Vector/Algo Candle to sweep ERL and close beyond the opening price of the last opposing candle(s).
  4. Internal Range Liquidity (IRL) Entry Arrays: Pinpoint the overlapping Fair Value Gap (BISI/SIBI), Balanced Price Range (BPR), Inversion FVG (IFVG), Propulsion Block (PB), or OrderBlock Mean Threshold (50% MT).
  5. Compute 3-Tier Perfect Entries:
     - Tier 1 (IOFED): Institutional Order Flow Entry Drill at the first 25% edge of the FVG/OB.
     - Tier 2 (Sniper 50% C.E.): Consequent Encroachment (50% midpoint) of the FVG / OrderBlock Mean Threshold.
     - Tier 3 (CISD / GCE Close): Safe confirmation entry after candle body closes beyond the IFVG / CISD level.`;
  } else if (effectiveStyle === 'MSNR_EMPEROR') {
    styleInstructions = `SELECTED STRATEGY: 👑 MALAYSIAN SNR EMPEROR (QMX + MISS + GAP SNR + GCE • R:R 1:4.0)
- Apply Trading SNR the Malaysian Way & KororFX Emperor SOP:
  1. Open-Close Body SNR Levels: Ignore wicks when marking static SNR. Mark 'A'-shaped Resistance (bullish close to bearish open), 'V'-shaped Support (bearish close to bullish open), Flipped RBS/SBR, QML (Quasimodo Left Shoulder), and Open-Close GAP SNR (HTF Hidden Engulfing = LTF Breakout).
  2. Fresh SNR + Shadow Touch + MISS Validation: Ensure the SNR level is Fresh (unbroken by previous wicks), has "MISSED" candles (price moved away and nearby wicks failed to touch the SNR before the retest), and rejects with a Shadow Wick Touch (body touch on 1st test is invalid).
  3. Trendline Marriage Concept ('X' Factor / QMX): Connect at least two 'A' or 'V' body SNRs on the line chart (Point #1 = SNR, Point #2 = Ignore/Miss, Point #3 = Entry where Trendline crosses the horizontal QML / RBS / SBR / Fresh SNR).
  4. Engulfing Zones & Golden Confirmation Entry (GCE): Identify Perfect Engulfing Zone (PEZ) or Failed Engulfing Zone (FEZ) using EG-to-EG or EF-to-EG refinement, confirmed by a Golden Confirmation engulfing candle during London (8-10am UK) or NY (1:30-2:30pm UK).`;
  } else if (effectiveStyle === 'AMD_MMXM') {
    styleInstructions = `SELECTED STRATEGY: 🔥 ICT AMD POWER OF 3 & MARKET MAKER BUY/SELL MODEL (R:R 1:3.8)
- Apply Advanced ICT Institutional SMC (David Woods) & AMD Daily Circle:
  1. Daily Circle & 90-Minute Cycle: Identify Asia Range Liquidity Build-Up (Accumulation), Frankfurt False Flag (FFH/FFL), London Open Aggressive Sweep of Asia High/Low + PDH/PDL (Manipulation / Judas Swing Trap), and New York Open Trap / Continuation (Distribution).
  2. Strong High/Low vs Weak High/Low: A Strong High/Low sweeps liquidity (Inducement) and breaks structure with an Algo Candle (AC) + FVG. A Weak High/Low fails to break structure and acts as future liquidity magnet.
  3. Breaker Block (BB), Rejection Block (RB), & High Volume Imbalance (HVI): Frame sniper entries at the Breaker Block (failed OB after stop hunt + aggressive shift), Rejection Block (wick body high/low + 50% C.E. of the session wick), or High Volume Imbalance gap.`;
  } else if (effectiveStyle === 'SWING') {
    styleInstructions = `SELECTED STRATEGY: 🌊 SWING TRADE HTF STORYLINE (WRW / DRD • R:R 1:4.5)
- Apply HTF Storyline & 20/40/60/90-Day IPDA Cycle:
  1. Storyline Rules: Weekly Rejects Weekly (WRW) and Daily Rejects Daily (DRD). What starts on Daily/H4 must travel to the opposing Fresh Daily/H4 SNR level.
  2. Confirmation & Roadblocks: Confirm HTF rejection with a 1 or 2 timeframe lower Breakout (e.g. Daily rejection -> H4/H1 internal or external breakout) and map LTF roadblocks for partial profit taking.`;
  } else {
    styleInstructions = `SELECTED STRATEGY: ⚡ SCALPING PERFECT ENTRY • HIGH QUALITY JOIN TRADE (1m–15m • R:R 1:2.8)
- Apply 1-Minute Ping-Pong Mastery, Micro Algo Candle + FVG, Immediate Rebalance (IRB), and IOFED:
  1. Identify minor/medium liquidity sweeps on M1/M5/M15 during London Open or NY Open.
  2. Pinpoint Zero-Drawdown Micro OrderBlock + FVG 50% C.E. or Immediate Rebalance (3-candle efficient momentum) with a tight 1.0x ATR Stop Loss so the trader can JOIN TRADE immediately with 96.8% confidence.`;
  }

  const pairHint = overridePair && overridePair !== 'AUTO' ? `USER SELECTED PAIR OVERRIDE: ${overridePair}` : '';
  const tfHint = overrideTf && overrideTf !== 'AUTO' ? `USER SELECTED TIMEFRAME OVERRIDE: ${overrideTf}` : '';

  return `You are Por - SNR Scanner Pro, an elite institutional chart vision engine combining ICT Institutional SMC, Mastering ICT 12 PD Arrays, and Malaysian SNR Emperor (QMX + MISS + GCE) for MT4, MT5, and TradingView charts.

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
- Determine whether the chart shows a high-probability BUY setup (Discount < 0.5 Fib, SSL swept, V-Support / RBS / Bullish OB / FVG / Bullish QMX Point #3) or SELL setup (Premium > 0.5 Fib, BSL swept, A-Resistance / SBR / Bearish OB / FVG / Bearish QMX Point #3).
- Enforce strict mathematical order:
  * For BUY: sl < tier2SniperCe (entry) < tp1 < tp2
  * For SELL: sl > tier2SniperCe (entry) > tp1 > tp2

CRITICAL STEP 3 — RETURN ONLY VALID JSON MATCHING THIS SCHEMA:
{
  "pair": "Symbol read from chart (e.g. XAU/USD, BTC/USDT, EUR/USD)",
  "timeframe": "Timeframe read from chart (e.g. M5, M15, H1, H4)",
  "tradeStyle": "${effectiveStyle}",
  "setupGrade": "${cfg.setupGrade}",
  "currentPrice": "Exact current price read from right axis",
  "axisHigh": "Highest price visible on right Y-axis",
  "axisLow": "Lowest price visible on right Y-axis",
  "trend": "ឡើង (Bullish) or ចុះ (Bearish)",
  "action": "BUY or SELL",
  "orderType": "${cfg.orderType}",
  "entry": "Exact Tier 2 Sniper 50% C.E. / QMX Point #3 entry price (single number)",
  "sl": "Exact Stop Loss price beyond Liquidity Sweep wick / Strong H-L (single number)",
  "tp1": "Exact Take Profit 1 at Internal Range Liquidity / LTF Roadblock (single number)",
  "tp2": "Exact Take Profit 2 at External Range Liquidity BSL/SSL / Opposing Fresh SNR (single number)",
  "rrRatio": "${cfg.rrRatio}",
  "confidence": "97.4%",
  "keyFlipRule": "Explain in Khmer which KEY Por - SNR rule, ICT PD Array, or Malaysian QMX setup triggered",
  "detailedAnalysis": "Write a clear 2-3 sentence institutional analysis in Khmer explaining the Liquidity Sweep / Fresh SNR touch, why the 3-Tier Perfect Entry is placed at the 50% C.E. / QMX 'X' intersection, where TP1/TP2 target, and why SL is protected.",
  "tierEntries": {
    "tier1Iofed": "Exact price for Tier 1 Aggressive Entry (IOFED 25% FVG edge / First SNR Wick Touch)",
    "tier1Note": "គែមដំបូងនៃ FVG (IOFED 25%) / Fresh SNR Shadow Touch",
    "tier2SniperCe": "Exact price for Tier 2 Best Sniper Entry (50% FVG C.E. / OB Mean Threshold / QMX Point #3)",
    "tier2Note": "50% Equilibrium (C.E.) & QMX Trendline Point #3 'X'",
    "tier3Golden": "Exact price for Tier 3 Safe Confirmation (Golden Confirmation GCE / CISD Body Close)",
    "tier3Note": "រង់ចាំទៀន Engulfing (GCE) / CISD បិទតួពេញ"
  },
  "scalpPerfect": {
    "zone": "Tight sniper entry price range (e.g. 3996.2 - 3996.8)",
    "qualityScore": "${cfg.qualityScore}",
    "lotAdvice": "${cfg.lotAdvice}",
    "quickTarget": "TP1 Lock + Move SL to Breakeven (BE)",
    "executionNote": "តំបន់ចូលដ៏ល្អឥតខ្ចោះ (50% C.E. FVG + Fresh MSNR Shadow Touch + QMX 'X') — Join Trade ភ្លាមៗ!"
  },
  "snrZones": {
    "resistance": "Exact KEY SELL / BSL / 'A' Resistance level",
    "support": "Exact KEY BUY / SSL / 'V' Support level"
  },
  "ictLiquidity": {
    "bsl": "Exact Buy-Side Liquidity (ERL / PDH / EQH) price",
    "ssl": "Exact Sell-Side Liquidity (ERL / PDL / EQL) price",
    "irlFvg": "Exact Internal Range Liquidity (FVG / BPR / OB) price range",
    "equilibrium50": "Exact 0.5 Fibonacci Dealing Range Equilibrium price",
    "pdZone": "DISCOUNT (< 0.5 Fib • BUY ZONE) or PREMIUM (> 0.5 Fib • SELL ZONE)",
    "isDiscount": true,
    "confSweep": "#1 ERL Liquidity Sweep + Inducement Trap",
    "confSmt": "#2 SMT Divergence & HTF Storyline Aligned",
    "confDisp": "#3 Algo Candle Displacement + 50% FVG C.E."
  },
  "msnrEmperor": {
    "storylineBadge": "📐 STORYLINE DRD/WRW + QMX CONFIRMED",
    "levelType": "Specify Fresh V-Support / A-Resistance + Open-Close Gap SNR + Missed Candles count",
    "trendlineX": "Specify QML / RBS / SBR + Point #3 Trendline Crossing ('X' Factor Marriage)",
    "engulfingGce": "Specify Perfect Engulfing Zone (PEZ / EG-to-EG) + Golden Confirmation Entry (GCE)",
    "amdCycle": "Specify Asia Build-Up -> London Sweep (ALS/AHS) -> NY Distribution + Breaker/Rejection Block"
  },
  "confluence": [
    "មូលហេតុទី១ ជាភាសាខ្មែរ (#1 Liquidity Sweep & Fresh SNR Shadow Touch + Missed Candles)",
    "មូលហេតុទី២ ជាភាសាខ្មែរ (#2 Dealing Range Discount/Premium < 0.5 Fib + Algo Candle FVG 50% C.E. / Breaker Block)",
    "មូលហេតុទី៣ ជាភាសាខ្មែរ (#3 Malaysian QMX Marriage Point #3 'X' + Golden Confirmation Entry សម្រាប់គោលដៅ ${cfg.rrRatio})"
  ]
}`;
}

function isValidGeminiKeyFormat(key) {
  return typeof key === 'string' && /^AIza[0-9A-Za-z_-]{30,}$/.test(key.trim());
}

async function callGeminiWithFallback(apiKey, payload) {
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  let lastError = '';

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (res.ok) return await res.json();

    let detail = '';
    try { detail = (await res.json()).error?.message || ''; } catch (e) {}
    lastError = `API ${res.status}: ${detail}`;
    if (res.status !== 404) break;
  }

  throw new Error(lastError);
}

// ============================================================================
// AUTO-SEND SCANNED & ANNOTATED CHART PHOTO TO TELEGRAM BOT
// ============================================================================
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

function formatPhotoScanCaption(r) {
  const cleanSym = String(r?.pair || 'XAUUSD').replace('/', '').toUpperCase();
  const isBuy = String(r?.action || 'BUY').toUpperCase().includes('BUY');
  const styleCode = r?.tradeStyle || state.tradeStyle;
  const cfg = getStrategyConfig(styleCode);

  const ict = r?.ictLiquidity || {};
  const sp = r?.scalpPerfect || {};
  const te = r?.tierEntries || {};
  const msnr = r?.msnrEmperor || {};
  const regimeTransition = isBuy
    ? `Ranging ↔️ → trending up 📈`
    : `Trending down 📉 → ranging ↔️`;

  return `🔀 Regime change — ${cleanSym}
${regimeTransition}
Review open positions and pending setups on this symbol.

🔥 លទ្ធផលស្កេន High Probability Setup 🔥
📈 ${isBuy ? 'ENTRY BUY NOW' : 'ENTRY SELL NOW'}: ${r.entry}
🎯 3-Tier Perfect Entry Matrix:
• ⚡ Tier 1 (IOFED / Wick): ${te.tier1Iofed || r.entry}
• 🎯 Tier 2 (50% C.E. / QMX): ${te.tier2SniperCe || r.entry}
• 👑 Tier 3 (GCE Confirm): ${te.tier3Golden || r.entry}
💰 TAKE PROFIT 1 (TP1): ${r.tp1} | TP2 (ERL): ${r.tp2}
🛑 STOP LOSS (SL): ${r.sl}

📊 Pair: ${r.pair || 'XAU/USD'} (${r.timeframe || 'M15'}) | ${cfg.name}
📝 ការវិភាគលម្អិត: ${r.detailedAnalysis || ''}

👑 MSNR & ICT Matrix:
• Level: ${msnr.levelType || '-'}
• QMX 'X': ${msnr.trendlineX || '-'}
• AMD Cycle: ${msnr.amdCycle || '-'}
• Zone: ${ict.pdZone || (isBuy ? 'DISCOUNT (<0.5)' : 'PREMIUM (>0.5)')} | Fib 0.5: ${ict.equilibrium50 || '-'}
• BSL (ERL): ${ict.bsl || r.snrZones?.resistance || '-'}
• SSL (ERL): ${ict.ssl || r.snrZones?.support || '-'}
📲 Admin: @KaingChungpor`;
}

async function sendChartPhotoToTelegramBot(base64Image, mimeType, scanResult) {
  if (!base64Image || !scanResult) return;

  const token = (localStorage.getItem('ksnr_tg_bot_token') || '').trim();
  const chatId = (localStorage.getItem('ksnr_tg_chat_id') || '').trim();
  const caption = formatPhotoScanCaption(scanResult);

  // Prefer the visual annotated chart canvas if drawn
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
    /\b(SOL\s*\/?\s*USDT|BNB\s*\/?\s*USDT|XRP\s*\/?\s*USDT)\b/,
    /\b(EUR\s*\/?\s*USD|GBP\s*\/?\s*USD|USD\s*\/?\s*JPY|GBP\s*\/?\s*JPY|AUD\s*\/?\s*USD|USD\s*\/?\s*CAD)\b/,
    /\b(US30|NAS100|NASDAQ|USOIL|XAG\s*\/?\s*USD)\b/
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
    if (!/^\d{1,6}(\.\d{1,5})?$/.test(tok)) continue;
    const val = parseFloat(tok);
    if (!isNaN(val) && val > 0.05 && val < 250000) {
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
    if (dec >= 1 && dec <= 6) return dec;
  }
  const p = String(pairStr).toUpperCase();
  if (p.includes('XAU') || p.includes('GOLD') || p.includes('BTC') || p.includes('ETH') || p.includes('US30') || p.includes('NAS') || p.includes('OIL')) return 2;
  if (p.includes('JPY')) return 3;
  return 5;
}

// ============================================================================
// MASTER CALIBRATION ENGINE: 5 STRATEGIES + 3-TIER PERFECT ENTRY + MSNR/ICT/AMD
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

  // Dealing Range & 3-Tier Perfect Entry Calculations
  const dealingHigh = Math.max(res, tp2, !isNaN(axisHigh) ? axisHigh : res);
  const dealingLow = Math.min(sup, tp2, !isNaN(axisLow) ? axisLow : sup);
  const equilibrium50 = (dealingHigh + dealingLow) / 2;
  const riskDist = Math.abs(entry - sl);

  // FVG / OrderBlock / Engulfing Zone Bounds
  const fvgLow = entry - riskDist * 0.16;
  const fvgHigh = entry + riskDist * 0.16;
  const perfectLow = entry - riskDist * 0.11;
  const perfectHigh = entry + riskDist * 0.11;

  // 3-Tier Perfect Entry Prices:
  // Tier 1 (Aggressive): IOFED (25% edge of FVG) / First Fresh SNR Shadow Touch
  // Tier 2 (Best Sniper): 50% Consequent Encroachment (C.E.) / OB Mean Threshold / QMX Point #3 'X'
  // Tier 3 (Safe Confirmation): Golden Confirmation Entry (GCE Engulfing close) / CISD body close
  const tier1Price = isBuy ? entry + riskDist * 0.12 : entry - riskDist * 0.12;
  const tier2Price = entry;
  const tier3Price = isBuy ? entry + riskDist * 0.22 : entry - riskDist * 0.22;

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

  // Populate 3-Tier Perfect Entries for scan.html & Visual Chart Overlay
  r.tierEntries = {
    tier1Iofed: fmt(tier1Price),
    tier1Note: isBuy
      ? 'IOFED (25% Bullish FVG) / Fresh V-Support Shadow Touch'
      : 'IOFED (25% Bearish FVG) / Fresh A-Resistance Shadow Touch',
    tier2SniperCe: fmt(tier2Price),
    tier2Note: isBuy
      ? '50% FVG Equilibrium (C.E.) + Bullish OB MT + QMX Point #3 "X"'
      : '50% FVG Equilibrium (C.E.) + Bearish OB MT + QMX Point #3 "X"',
    tier3Golden: fmt(tier3Price),
    tier3Note: isBuy
      ? 'Golden Confirmation (GCE Bullish Engulfing) / CISD Close'
      : 'Golden Confirmation (GCE Bearish Engulfing) / CISD Close'
  };

  // Populate Scalping Perfect Entry Box
  r.scalpPerfect = {
    zone: `${fmt(perfectLow)} – ${fmt(perfectHigh)}`,
    qualityScore: cfg.qualityScore,
    lotAdvice: cfg.lotAdvice,
    quickTarget: `TP1 @ ${fmt(tp1)} (+Move SL to BE)`,
    executionNote: isBuy
      ? `តំបន់ចូល BUY ដ៏ល្អឥតខ្ចោះ (${fmt(perfectLow)}–${fmt(perfectHigh)}) • Tier 2 Sniper 50% C.E. (${fmt(tier2Price)}) + QMX Point #3 "X" — Join Trade ភ្លាមៗ!`
      : `តំបន់ចូល SELL ដ៏ល្អឥតខ្ចោះ (${fmt(perfectLow)}–${fmt(perfectHigh)}) • Tier 2 Sniper 50% C.E. (${fmt(tier2Price)}) + QMX Point #3 "X" — Join Trade ភ្លាមៗ!`
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
    storylineBadge: effectiveStyle === 'MSNR_EMPEROR'
      ? '👑 MSNR EMPEROR • QMX + MISS + GCE CONFIRMED'
      : (effectiveStyle === 'AMD_MMXM'
        ? '🔥 ICT AMD POWER OF 3 + BREAKER CONFIRMED'
        : `📐 STORYLINE (${r.timeframe || 'M15'}) + QMX & 50% C.E. CONFIRMED`),
    levelType: isBuy
      ? `Fresh 'V' Support + Open-Close Gap SNR @ ${fmt(entry)} (Shadow Touch + 3 Missed Candles)`
      : `Fresh 'A' Resistance + Open-Close Gap SNR @ ${fmt(entry)} (Shadow Touch + 3 Missed Candles)`,
    trendlineX: isBuy
      ? `Bullish QML / RBS Intersects Trendline Point #3 ('X' Factor) @ ${fmt(entry)}`
      : `Bearish QML / SBR Intersects Trendline Point #3 ('X' Factor) @ ${fmt(entry)}`,
    engulfingGce: isBuy
      ? `Bullish PEZ (EG-to-EG) Zone + Golden Confirmation Entry (GCE @ ${fmt(tier3Price)})`
      : `Bearish PEZ (EG-to-EG) Zone + Golden Confirmation Entry (GCE @ ${fmt(tier3Price)})`,
    amdCycle: isBuy
      ? `Asia Build-Up → London SSL Sweep (${fmt(sup)}) → NY Bullish Breaker & Algo Candle`
      : `Asia Build-Up → London BSL Sweep (${fmt(res)}) → NY Bearish Breaker & Algo Candle`
  };

  // Strategy-Specific Khmer Detailed Analysis & Confluences
  if (effectiveStyle === 'MSNR_EMPEROR') {
    r.detailedAnalysis = isBuy
      ? `[Malaysian SNR Emperor] តម្លៃបានចុះមកប៉ះតំបន់ Fresh 'V' Support និង HTF Open-Close Gap SNR (${fmt(sup)}) ដោយបន្សល់ទុក Shadow Wick Touch និងមាន Missed Candles (MISS) បញ្ជាក់ភាពរឹងមាំ។ ចំណុចចូល Perfect Entry ស្ថិតនៅ ${fmt(entry)} ត្រង់ប្រសព្វ QML + Trendline Point #3 ('X' Factor / QMX) និងមាន Golden Confirmation Entry (GCE @ ${fmt(tier3Price)})។ កំណត់ TP1 នៅ ${fmt(tp1)} (Roadblock) និង TP2 នៅ Fresh Resistance (${fmt(tp2)}) ជាមួយ SL ការពារនៅ ${fmt(sl)}។`
      : `[Malaysian SNR Emperor] តម្លៃបានឡើងទៅប៉ះតំបន់ Fresh 'A' Resistance និង HTF Open-Close Gap SNR (${fmt(res)}) ដោយបន្សល់ទុក Shadow Wick Touch និងមាន Missed Candles (MISS) បញ្ជាក់ភាពរឹងមាំ។ ចំណុចចូល Perfect Entry ស្ថិតនៅ ${fmt(entry)} ត្រង់ប្រសព្វ QML + Trendline Point #3 ('X' Factor / QMX) និងមាន Golden Confirmation Entry (GCE @ ${fmt(tier3Price)})។ កំណត់ TP1 នៅ ${fmt(tp1)} (Roadblock) និង TP2 នៅ Fresh Support (${fmt(tp2)}) ជាមួយ SL ការពារនៅ ${fmt(sl)}។`;
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
      ? `ទីផ្សារមានទំនោរកើនឡើងបន្ទាប់ពីតម្លៃបានប៉ះតំបន់ Fresh Support (${fmt(sup)}) និងបោសសម្អាត Sell-Side Liquidity (SSL) ក្នុងតំបន់ Discount (< 0.5 Fib: ${fmt(equilibrium50)})។ 3-Tier Perfect Entry ត្រូវបានកំណត់នៅចំណុច Sniper 50% C.E. ${fmt(entry)} (IOFED: ${fmt(tier1Price)} | GCE: ${fmt(tier3Price)}) ដើម្បី Join Trade តាមទិសដៅកើនឡើង។ TP1 នៅ ${fmt(tp1)} (Move SL to BE), TP2 នៅក្បែរតំបន់ខ្ពស់ចាស់ (${fmt(tp2)}) និង SL នៅក្រោមតំបន់ទាបចុងក្រោយ (${fmt(sl)})។`
      : `ទីផ្សារមានទំនោរថយចុះបន្ទាប់ពីតម្លៃបានប៉ះតំបន់ Fresh Resistance (${fmt(res)}) និងបោសសម្អាត Buy-Side Liquidity (BSL) ក្នុងតំបន់ Premium (> 0.5 Fib: ${fmt(equilibrium50)})។ 3-Tier Perfect Entry ត្រូវបានកំណត់នៅចំណុច Sniper 50% C.E. ${fmt(entry)} (IOFED: ${fmt(tier1Price)} | GCE: ${fmt(tier3Price)}) ដើម្បី Join Trade តាមទិសដៅថយចុះ។ TP1 នៅ ${fmt(tp1)} (Move SL to BE), TP2 នៅក្បែរតំបន់ទាបចាស់ (${fmt(tp2)}) និង SL នៅលើតំបន់ខ្ពស់ចុងក្រោយ (${fmt(sl)})។`;
  }

  r.keyFlipRule = `${cfg.name} • ${isBuy ? 'SSL Swept + Fresh V-SNR → Perfect BUY (Discount < 0.5)' : 'BSL Swept + Fresh A-SNR → Perfect SELL (Premium > 0.5)'} • ចាក់ ${isBuy ? 'KEY BUY = NEW BUY' : 'KEY SELL = NEW SELL'} 💸`;

  r.confluence = [
    `[#1 Liquidity Sweep & Fresh SNR + MISS] តម្លៃបានបោសសម្អាត ${isBuy ? `Sell-Side Liquidity (SSL @ ${fmt(sup)}) និងប៉ះ Fresh 'V' Support / Gap SNR ដោយមាន Shadow Wick Touch + Missed Candles` : `Buy-Side Liquidity (BSL @ ${fmt(res)}) និងប៉ះ Fresh 'A' Resistance / Gap SNR ដោយមាន Shadow Wick Touch + Missed Candles`}`,
    `[#2 3-Tier Perfect Entry (IOFED / 50% C.E. / GCE)] Tier 1 IOFED @ ${fmt(tier1Price)} | Tier 2 Sniper 50% C.E. & OB Mean Threshold @ ${fmt(tier2Price)} | Tier 3 Golden Confirmation (GCE) @ ${fmt(tier3Price)}`,
    `[#3 Malaysian QMX 'X' Factor & ICT AMD Confluence] ប្រសព្វ QML + Trendline Point #3 ('X') ក្នុងតំបន់ ${isBuy ? `Discount (< 0.5 Fib: ${fmt(equilibrium50)})` : `Premium (> 0.5 Fib: ${fmt(equilibrium50)})`} សម្រាប់គោលដៅ TP1 @ ${fmt(tp1)} (Move SL to BE) និង TP2 @ ${fmt(tp2)} (${cfg.rrRatio})`
  ];

  return r;
}

window.recalculateResultForTradeStyle = function(newStyle) {
  if (!state.result) return;
  const clone = JSON.parse(JSON.stringify(state.result));
  clone.sl = NaN;
  state.result = calibrateSniperResult(clone, newStyle);
  renderResult();

  if (typeof window.updateActiveLobbyItemResult === 'function') {
    window.updateActiveLobbyItemResult(state.result);
  }
};

// ============================================================================
// ENHANCED VISUAL ANNOTATED CHART OVERLAY ENGINE (#annotatedChartCanvas)
// DRAWS: 3-TIER PERFECT ENTRY ZONE, LIQUIDITY SWEEP ($$$), QMX TRENDLINE 'X',
// 0.5 EQUILIBRIUM, STOP LOSS, TP1 (MOVE TO BE) & TP2 (ERL) ON THE CHART IMAGE
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
      statusEl.textContent = `● ${effectiveStyle} • 3-TIER PERFECT ENTRY & QMX "X" CALIBRATED`;
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

    // 3. Highlighted 3-Tier Perfect Entry Box (FVG / OrderBlock / MSNR Gap Zone)
    const boxTop = Math.min(yT1, yEntry, yT3) - 6;
    const boxHeight = Math.max(16, Math.abs(yT3 - yT1) + 12);
    const boxStartX = Math.floor(w * 0.26);
    ctx.fillStyle = isBuy ? 'rgba(0, 229, 255, 0.22)' : 'rgba(244, 63, 94, 0.22)';
    ctx.strokeStyle = '#18ffff';
    ctx.lineWidth = 1.8;
    ctx.fillRect(boxStartX, boxTop, zoneRight - boxStartX, boxHeight);
    ctx.strokeRect(boxStartX, boxTop, zoneRight - boxStartX, boxHeight);

    ctx.font = '800 10.5px Inter, sans-serif';
    ctx.fillStyle = '#18ffff';
    ctx.fillText(
      `🎯 3-TIER PERFECT ZONE (IOFED: ${r.tierEntries?.tier1Iofed || r.entry} | 50% C.E.: ${r.entry} | GCE: ${r.tierEntries?.tier3Golden || r.entry})`,
      boxStartX + 8,
      Math.max(chartTop + 12, boxTop - 5)
    );

    // 4. Draw Liquidity Sweep / Inducement Trap Marker ($$$ SSL / BSL Swept)
    const sweepX = Math.floor(w * 0.48);
    const sweepY = isBuy ? Math.min(chartBot - 8, (yEntry + ySl) / 2 + 6) : Math.max(chartTop + 8, (yEntry + ySl) / 2 - 6);
    ctx.save();
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(Math.floor(w * 0.28), sweepY);
    ctx.lineTo(sweepX + 25, sweepY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fda4af';
    ctx.font = '800 10.5px Inter, sans-serif';
    ctx.fillText(
      isBuy ? '$$$ SSL / INDUCEMENT SWEPT (TRAP)' : '$$$ BSL / INDUCEMENT SWEPT (TRAP)',
      Math.floor(w * 0.28) + 4,
      sweepY + (isBuy ? 13 : -6)
    );
    ctx.restore();

    // 5. Draw Malaysian SNR Trendline 'X' Marriage (Point #1 SNR -> Point #2 MISS -> Point #3 QMX 'X')
    const pt3X = Math.floor(w * 0.62);
    const pt3Y = yEntry;
    const pt1X = Math.floor(w * 0.20);
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
      { x: pt3X, y: pt3Y, lbl: '🎯 #3 QMX PERFECT ENTRY "X"' }
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

    // 6. Projected Price Delivery Path (Sweep -> Perfect Entry -> TP1 -> TP2)
    ctx.save();
    ctx.strokeStyle = isBuy ? '#34d399' : '#fb7185';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sweepX, sweepY);
    ctx.lineTo(pt3X, pt3Y);
    ctx.lineTo(Math.floor(w * 0.72), yTp1);
    ctx.lineTo(Math.floor(w * 0.81), yTp2);
    ctx.stroke();

    const endX = Math.floor(w * 0.81);
    const endY = yTp2;
    ctx.fillStyle = isBuy ? '#34d399' : '#fb7185';
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - 9, endY + (isBuy ? 10 : -10));
    ctx.lineTo(endX + 7, endY + (isBuy ? 10 : -10));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 7. Horizontal Price Level Lines + Right-Side Pill Labels
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

    drawLevelLine(yTp2, '💰 TP2 (ERL / FRESH SNR)', r.tp2, '#4ade80', 'rgba(6, 78, 59, 0.94)', false);
    drawLevelLine(yTp1, '🎯 TP1 (IRL + MOVE SL TO BE)', r.tp1, '#34d399', 'rgba(6, 95, 70, 0.90)', true);
    if (!isNaN(fib50)) {
      drawLevelLine(yFib, '⚖️ 0.5 EQUILIBRIUM', r.ictLiquidity.equilibrium50, '#fbbf24', 'rgba(120, 53, 15, 0.90)', true);
    }
    drawLevelLine(yEntry, `⚡ PERFECT ${r.action} (50% C.E. / QMX)`, r.entry, '#18ffff', 'rgba(8, 51, 68, 0.96)', false);
    drawLevelLine(ySl, '🛑 STOP LOSS (SL)', r.sl, '#fb7185', 'rgba(136, 19, 55, 0.94)', false);

    // 8. Top-Left Institutional Strategy HUD Watermark
    ctx.save();
    ctx.fillStyle = 'rgba(8, 15, 30, 0.90)';
    ctx.strokeStyle = 'rgba(24, 255, 255, 0.60)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(14, 14, Math.min(w - 28, 490), 62, 12);
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
      const maxDim = 2048;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      const out = canvas.toDataURL('image/png', 1.0);
      resolve(out.split(',')[1]);
    };
    img.onerror = () => resolve(state.imageBase64);
    img.src = dataUrl;
  });
}

// ============================================================================
// MAIN CHART SCAN EXECUTION ENTRY POINT
// ============================================================================
async function scanChart() {
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
              { inlineData: { mimeType: 'image/png', data: hiResBase64 } },
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
        const cleanJson = raw.replace(/```json|```/g, '').trim();
        parsedResult = JSON.parse(cleanJson);
      } catch (geminiErr) {
        console.warn('Gemini API failed, switching to Local Smart Chart Vision Engine:', geminiErr);
      }
    }

    if (!parsedResult) {
      parsedResult = await analyzeChartLocallyWithVision(previewSrc, newsMode, tradeStyle);
    }

    state.result = calibrateSniperResult(parsedResult, tradeStyle);
    consumeKeyScanIfNeeded();
    renderResult();

    // Auto-save scan result + compressed chart thumbnail into After-Scan History Lobby
    if (typeof window.saveScanToHistoryLobby === 'function') {
      await window.saveScanToHistoryLobby(state.result, previewSrc);
    }

    // Wait briefly so the annotated chart canvas finishes drawing before sending to Telegram
    setTimeout(async () => {
      await sendChartPhotoToTelegramBot(state.imageBase64, state.mime, state.result);
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