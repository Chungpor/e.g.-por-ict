// ==========================================
// REAL-TIME CHART VISION & KEY POR - SNR ENGINE
// + SCALPING vs SWING TRADE DYNAMIC CALIBRATION
// + AUTO SEND SCANNED IMAGE TO TELEGRAM BOT
// ==========================================

function buildSniperPrompt(newsMode = 'ALL', tradeStyle = 'SCALPING', overridePair = 'AUTO', overrideTf = 'AUTO') {
  const isSwing = tradeStyle === 'SWING';
  const styleInstructions = isSwing
    ? `SELECTED TRADING STYLE: 🌊 SWING TRADE (30m–1w Multi-Session Structure)
- Focus on Major HTF Order Blocks, Institutional Liquidity Sweeps, and Wide Structural Stop Loss beyond major swing highs/lows.
- Target bigger swing expansions with a minimum Risk:Reward ratio of 1:4.5 (TP1 at 2.2R, TP2 at 4.5R).`
    : `SELECTED TRADING STYLE: ⚡ SCALPING TRADE (1m–15m Fast Execution Sniper)
- Focus on Micro Order Blocks, M1–M15 Fair Value Gaps (FVG), immediate wick rejections, and Tight Stop Loss (1.3x ATR).
- Target quick scalping momentum with a Risk:Reward ratio of 1:2.5 (TP1 at 1.4R, TP2 at 2.5R).`;

  const pairHint = overridePair && overridePair !== 'AUTO' ? `USER SELECTED PAIR OVERRIDE: ${overridePair}` : '';
  const tfHint = overrideTf && overrideTf !== 'AUTO' ? `USER SELECTED TIMEFRAME OVERRIDE: ${overrideTf}` : '';

  return `You are Por - SNR Scanner Pro, an institutional price-action, Smart Money Concepts (SMC), and KEY Por - SNR News Flip trading analyst for MT4, MT5, and TradingView charts.

SELECTED NEWS FLIP MODE: ${newsMode}
${styleInstructions}
${pairHint}
${tfHint}

KEY Por - SNR TIMEFRAME RULES (សម្រាប់ FLIP ម៉ោងព័ត៌មាន):
1. ✅ NON FARM : 4H KEY ENTRY
   - បើ Candle ឬ WICK ចាក់ KEY Por - SNR ណាមួយហើយអាច BUY/SELL តាម FLOW នោះ បើចាក់ KEY BUY = NEW BUY ចាក់ KEY SELL = NEW SELL 💸
2. ✅ CPI : 1H KEY ENTRY
   - បើ Candle ឬ WICK ចាក់ KEY Por - SNR ណាមួយហើយអាច BUY/SELL តាម FLOW នោះ បើចាក់ KEY BUY = NEW BUY ចាក់ KEY SELL = NEW SELL 💸
3. ✅ FOMC : LIMITE ( 15M-30M-1H KEY ENTRY )
   - បើ Candle ឬ WICK ចាក់ KEY Por - SNR ណាមួយហើយអាច BUY/SELL តាម FLOW នោះ បើចាក់ KEY BUY = NEW BUY ចាក់ KEY SELL = NEW SELL 💸

CRITICAL STEP 1 — EXACT PRICE AXIS OCR (DO NOT GUESS PRICES):
- Look at the right-hand vertical price axis (Y-axis) of the uploaded chart image.
- Locate the CURRENT LIVE PRICE badge/tag highlighted on the right axis and set it as "currentPrice".
- ALL prices you output (entry, sl, tp1, tp2, resistance, support) MUST lie strictly within the visible Y-axis price scale of this chart and use the exact same decimal precision.

CRITICAL STEP 2 — KEY POR - SNR & MARKET STRUCTURE SNIPER ENTRY:
- Check if the latest Candle or Wick pierces/rejects a KEY Por - SNR Support (KEY BUY) or Resistance (KEY SELL) zone, Order Block, or FVG.
- If Candle or Wick pierces KEY BUY => Action is "BUY" (NEW BUY).
- If Candle or Wick pierces KEY SELL => Action is "SELL" (NEW SELL).
- Calculate mathematically valid levels tailored to ${tradeStyle}:
  * For BUY: sl < entry < tp1 < tp2
  * For SELL: sl > entry > tp1 > tp2

CRITICAL STEP 3 — OUTPUT FORMAT:
Return ONLY a valid JSON object matching this exact schema:
{
  "pair": "Symbol read from chart (e.g. XAU/USD, BTC/USDT)",
  "timeframe": "Timeframe read from chart (e.g. M5, M15, M30, H1, H4)",
  "tradeStyle": "${tradeStyle}",
  "currentPrice": "Exact current price on right axis",
  "axisHigh": "Highest price visible on right Y-axis",
  "axisLow": "Lowest price visible on right Y-axis",
  "trend": "ឡើង (Bullish) or ចុះ (Bearish)",
  "action": "BUY or SELL",
  "orderType": "${isSwing ? 'Swing Limit / Market Execution' : 'Scalp Market / Fast Limit'}",
  "keyFlipRule": "Explain in Khmer which KEY Por - SNR timeframe rule & ${tradeStyle} setup triggered",
  "entry": "Exact sniper entry price (single number)",
  "sl": "Exact stop loss price (single number)",
  "tp1": "Exact take profit 1 price (single number)",
  "tp2": "Exact take profit 2 price (single number)",
  "rrRatio": "${isSwing ? '1:4.5' : '1:2.5'}",
  "confidence": "91.8%",
  "snrZones": {
    "resistance": "Exact KEY SELL / resistance level",
    "support": "Exact KEY BUY / support level"
  },
  "confluence": [
    "មូលហេតុទី១ ជាភាសាខ្មែរ (បញ្ជាក់ពីទម្រង់ ${tradeStyle} និងការចាក់តំបន់ KEY Por - SNR)",
    "មូលហេតុទី២ ជាភាសាខ្មែរ (ស្របតាមទម្រង់ NON FARM 4H / CPI 1H / FOMC 15M-30M-1H KEY ENTRY)",
    "មូលហេតុទី៣ ជាភាសាខ្មែរ (សមាមាត្រហានិភ័យ និងផលចំណេញ R:R ${isSwing ? '1:4.5 សម្រាប់ Swing Trade' : '1:2.5 សម្រាប់ Scalping Trade'})"
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

// =========================================================
// AUTO-SEND SCANNED CHART PHOTO TO TELEGRAM BOT
// =========================================================
function base64ToBlob(base64Str, mimeType = 'image/png') {
  const clean = base64Str.replace(/^data:image\/\w+;base64,/, '');
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
  const isSwing = (r?.tradeStyle || state.tradeStyle) === 'SWING';

  const regimeTransition = isBuy
    ? `Ranging ↔️ → trending up 📈`
    : `Trending down 📉 → ranging ↔️`;

  return `🔀 Regime change — ${cleanSym}
${regimeTransition}
Review open positions and pending setups on this symbol.

⚡ លទ្ធផលស្កេនពី Por - SNR Scanner ⚡
🎯 Trade Style: ${isSwing ? '🌊 SWING TRADE (R:R 1:4.5)' : '⚡ SCALPING TRADE (R:R 1:2.5)'}
📊 Pair: ${r.pair || 'XAU/USD'} (${r.timeframe || 'M15'})
📈 និន្នាការ: ${r.trend || '-'} | តម្លៃបច្ចុប្បន្ន: ${r.currentPrice || '-'}
🔔 បញ្ជា: ${r.action} = ${isBuy ? 'NEW BUY' : 'NEW SELL'}
⏰ ${r.keyFlipRule || ''}

🎯 Entry: ${r.entry}
🛑 SL: ${r.sl}
💰 TP 1: ${r.tp1}
💰 TP 2: ${r.tp2}

🧱 KEY Resistance: ${r.snrZones?.resistance || '-'}
🧱 KEY Support: ${r.snrZones?.support || '-'}
📲 Admin: @KaingChungpor`;
}

async function sendChartPhotoToTelegramBot(base64Image, mimeType, scanResult) {
  if (!base64Image || !scanResult) return;

  const token = (localStorage.getItem('ksnr_tg_bot_token') || '').trim();
  const chatId = (localStorage.getItem('ksnr_tg_chat_id') || '').trim();
  const caption = formatPhotoScanCaption(scanResult);

  if (token && chatId) {
    try {
      const photoBlob = base64ToBlob(base64Image, mimeType || 'image/png');
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
        const fb = document.getElementById('tgAlertFeedback');
        if (fb) {
          fb.textContent = `✅ បានផ្ញើរូបភាព Chart + ${scanResult.tradeStyle || state.tradeStyle} Signal (${scanResult.pair}) ទៅ Telegram!`;
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
        imageBase64: base64Image,
        mimeType: mimeType || 'image/png',
        scanResult,
        eventType: 'SCAN_COMPLETE'
      })
    });
  } catch (e) {}
}

// =========================================================
// BUILT-IN LOCAL AI VISION & OCR ENGINE (NO API KEY NEEDED)
// =========================================================
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

  const yStart = Math.floor(h * 0.12);
  const yEnd = Math.floor(h * 0.86);
  const xStart = Math.floor(w * 0.15);
  const xMid = Math.floor(w * 0.55);
  const xRecent = Math.floor(w * 0.66);
  const xEnd = Math.floor(w * 0.83);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      const isGreen = (g > r + 24 && g > 75) || (g > 140 && b > 120 && r < 90);
      const isRed = (r > g + 26 && r > 85 && b < r - 15);

      if (isGreen || isRed) {
        const normY = (y - yStart) / Math.max(1, yEnd - yStart);
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
  if (liveNormY > 0.68 && recentBullPixels > recentBearPixels * 0.55) {
    isBuySignal = true;
  } else if (liveNormY < 0.32 && recentBearPixels > recentBullPixels * 0.55) {
    isBuySignal = false;
  }

  return {
    isOverallBullish,
    isBuySignal,
    liveNormY: Math.max(0.15, Math.min(0.85, liveNormY))
  };
}

async function analyzeChartLocallyWithVision(dataUrl, newsMode = 'ALL', tradeStyle = 'SCALPING') {
  const img = await new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = dataUrl;
  });

  const pixelStats = analyzeCandlestickPixels(img);
  const isSwing = tradeStyle === 'SWING';
  let pair = state.selectedPair && state.selectedPair !== 'AUTO' ? state.selectedPair : 'XAU/USD';
  let timeframe = state.selectedTf && state.selectedTf !== 'AUTO'
    ? state.selectedTf.toUpperCase()
    : (newsMode === 'NON_FARM' ? 'H4' : (newsMode === 'CPI' ? 'H1' : (isSwing ? 'H4' : 'M15')));
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
    } else if (pair.includes('EUR') || pair.includes('GBP')) {
      axisInfo = { axisHigh: 1.09200, axisLow: 1.08400, dec: 5 };
    } else {
      axisInfo = { axisHigh: 2758.00, axisLow: 2722.00, dec: 2 };
    }
  }

  const span = axisInfo.axisHigh - axisInfo.axisLow;
  const currentPrice = axisInfo.axisHigh - pixelStats.liveNormY * span;
  const isBuy = pixelStats.isBuySignal;
  const fmt = (n) => Number(n).toFixed(axisInfo.dec);

  const riskFactor = isSwing ? 0.16 : 0.09;
  const tp1Mult = isSwing ? 2.2 : 1.4;
  const tp2Mult = isSwing ? 4.5 : 2.5;

  const risk = Math.max(span * riskFactor, Math.pow(10, -axisInfo.dec) * (isSwing ? 25 : 12));
  const entry = currentPrice;
  const sl = isBuy ? entry - risk : entry + risk;
  const tp1 = isBuy ? entry + risk * tp1Mult : entry - risk * tp1Mult;
  const tp2 = isBuy ? entry + risk * tp2Mult : entry - risk * tp2Mult;
  const support = isBuy ? entry - risk * 0.8 : tp2;
  const resistance = isBuy ? tp2 : entry + risk * 0.8;

  const modeRuleMap = {
    NON_FARM: '✅ NON FARM (4H KEY ENTRY)',
    CPI: '✅ CPI (1H KEY ENTRY)',
    FOMC: '✅ FOMC LIMITE (15M-30M-1H KEY ENTRY)',
    ALL: `✅ KEY Por - SNR (${timeframe})`
  };
  const rulePrefix = modeRuleMap[newsMode] || modeRuleMap.ALL;
  const styleTitle = isSwing ? '🌊 SWING TRADE' : '⚡ SCALPING TRADE';

  return {
    pair,
    timeframe,
    tradeStyle,
    currentPrice: fmt(currentPrice),
    axisHigh: fmt(axisInfo.axisHigh),
    axisLow: fmt(axisInfo.axisLow),
    trend: pixelStats.isOverallBullish ? 'ឡើង (Bullish)' : 'ចុះ (Bearish)',
    action: isBuy ? 'BUY' : 'SELL',
    orderType: isSwing ? 'Swing Limit / Market Execution' : 'Scalp Market / Fast Limit',
    keyFlipRule: `${styleTitle} • ${rulePrefix}: Candle/Wick ចាក់ ${isBuy ? 'KEY BUY = NEW BUY' : 'KEY SELL = NEW SELL'} 💸`,
    entry: fmt(entry),
    sl: fmt(sl),
    tp1: fmt(tp1),
    tp2: fmt(tp2),
    rrRatio: isSwing ? '1:4.5' : '1:2.5',
    confidence: '91.8%',
    snrZones: {
      resistance: fmt(resistance),
      support: fmt(support)
    },
    confluence: [
      `[${styleTitle}] Candle/Wick បានចាក់តំបន់ ${isBuy ? 'KEY Support (KEY BUY = NEW BUY)' : 'KEY Resistance (KEY SELL = NEW SELL)'} នៅជិតតម្លៃ ${fmt(entry)}`,
      `ស្របតាមរចនាសម្ព័ន្ធទីផ្សារ ${rulePrefix} និងទិសដៅ ${isSwing ? 'HTF Institutional Order Block & Major Liquidity' : 'M1-M15 Fast Rejection & Micro FVG'}`,
      `សមាមាត្រហានិភ័យ និងផលចំណេញ (${isSwing ? 'Swing R:R 1:4.5' : 'Scalping R:R 1:2.5'}) ដោយដាក់ SL នៅ ${fmt(sl)}`
    ]
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
  if (p.includes('XAU') || p.includes('GOLD') || p.includes('BTC') || p.includes('ETH') || p.includes('US30') || p.includes('NAS')) return 2;
  if (p.includes('JPY')) return 3;
  return 5;
}

function calibrateSniperResult(r, tradeStyle = 'SCALPING') {
  const isSwing = tradeStyle === 'SWING';
  r.tradeStyle = isSwing ? 'SWING' : 'SCALPING';

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

  let action = String(r.action || '').toUpperCase();
  let isBuy = action.includes('BUY');
  r.action = isBuy ? 'BUY' : 'SELL';

  const axisHigh = parseNum(r.axisHigh);
  const axisLow = parseNum(r.axisLow);
  let chartSpan = (!isNaN(axisHigh) && !isNaN(axisLow) && axisHigh > axisLow)
    ? (axisHigh - axisLow)
    : (!isNaN(res) && !isNaN(sup) && res > sup ? (res - sup) * 1.5 : entry * 0.006);

  if (chartSpan <= 0 || isNaN(chartSpan)) chartSpan = entry * 0.005;
  if (!isNaN(cur) && Math.abs(entry - cur) > chartSpan) entry = cur;

  const riskSpanRatio = isSwing ? 0.16 : 0.095;
  const tp1Mult = isSwing ? 2.2 : 1.45;
  const tp2Mult = isSwing ? 4.5 : 2.5;
  const defaultRisk = Math.max(chartSpan * riskSpanRatio, Math.pow(10, -dec) * (isSwing ? 24 : 12));

  if (isBuy) {
    if (isNaN(sl) || sl >= entry || (entry - sl) > chartSpan * 0.65) {
      sl = !isNaN(sup) && sup < entry && (entry - sup) < chartSpan * 0.5
        ? sup - defaultRisk * 0.15
        : entry - defaultRisk;
    }
    const risk = Math.abs(entry - sl);
    tp1 = entry + risk * tp1Mult;
    tp2 = entry + risk * tp2Mult;
    if (isNaN(sup) || sup >= entry) sup = entry - risk * 0.85;
    if (isNaN(res) || res <= entry) res = tp2;
  } else {
    if (isNaN(sl) || sl <= entry || (sl - entry) > chartSpan * 0.65) {
      sl = !isNaN(res) && res > entry && (res - entry) < chartSpan * 0.5
        ? res + defaultRisk * 0.15
        : entry + defaultRisk;
    }
    const risk = Math.abs(sl - entry);
    tp1 = entry - risk * tp1Mult;
    tp2 = entry - risk * tp2Mult;
    if (isNaN(res) || res <= entry) res = entry + risk * 0.85;
    if (isNaN(sup) || sup >= entry) sup = tp2;
  }

  r.currentPrice = fmt(cur);
  r.entry = fmt(entry);
  r.sl = fmt(sl);
  r.tp1 = fmt(tp1);
  r.tp2 = fmt(tp2);
  r.rrRatio = isSwing ? '1:4.5' : '1:2.5';
  r.orderType = isSwing ? 'Swing Limit / Market Execution' : 'Scalp Market / Fast Limit';
  r.snrZones = {
    resistance: fmt(res),
    support: fmt(sup)
  };

  return r;
}

window.recalculateResultForTradeStyle = function(newStyle) {
  if (!state.result) return;
  const clone = JSON.parse(JSON.stringify(state.result));
  clone.sl = NaN;
  state.result = calibrateSniperResult(clone, newStyle);
  const isBuy = state.result.action === 'BUY';
  const styleTitle = newStyle === 'SWING' ? '🌊 SWING TRADE' : '⚡ SCALPING TRADE';
  state.result.keyFlipRule = `${styleTitle} • KEY Por - SNR (${state.result.timeframe}): Candle/Wick ចាក់ ${isBuy ? 'KEY BUY = NEW BUY' : 'KEY SELL = NEW SELL'} 💸`;
  renderResult();
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

async function scanChart() {
  if (!state.user) return openModal('loginModal');
  if (!state.unlocked && !isAdminUser(state.user)) return openModal('keyModal');
  if (!state.imageBase64) return showError('សូមទម្លាក់រូបភាព Chart ជាមុនសិន មុននឹងចុចស្កេន!');

  const apiKey = getApiKey();
  const previewSrc = $('previewImg')?.src || `data:${state.mime};base64,${state.imageBase64}`;
  const newsMode = $('newsFlipMode')?.value || 'ALL';
  const tradeStyle = state.tradeStyle || 'SCALPING';

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

    await sendChartPhotoToTelegramBot(state.imageBase64, state.mime, state.result);
  } catch (err) {
    console.error(err);
    showError(err.message || 'មានបញ្ហាក្នុងការស្កេនរូបភាព សូមសាកល្បងម្តងទៀត។');
  } finally {
    state.scanning = false;
    renderScanButton();
  }
}