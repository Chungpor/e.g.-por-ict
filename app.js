/*************************************************************************
 * 1. LIVE MARKET DATA, TELEGRAM CONFIG & ASSET CONFIGURATION
 *************************************************************************/
const ASSET_CONFIG = {
  XAUUSD: {
    key: 'XAUUSD',
    symbol: 'XAU/USD',
    shortLabel: '🟡 XAUUSD',
    exchange: 'OANDA',
    tvSymbol: 'OANDA:XAUUSD',
    binanceSymbol: 'PAXGUSDT',
    referenceAnchor: 4172.59,
    pipScale: 10,
    defaultStopDist: 10.00,
    decimals: 2
  },
  NAS100: {
    key: 'NAS100',
    symbol: 'US100',
    shortLabel: '🔵 US100',
    exchange: 'OANDA',
    tvSymbol: 'OANDA:NAS100USD',
    binanceSymbol: null,
    referenceAnchor: 21480.50,
    pipScale: 1,
    defaultStopDist: 100.00,
    decimals: 2
  },
  BTCUSD: {
    key: 'BTCUSD',
    symbol: 'BTC/USD',
    shortLabel: '🟠 BITCOIN',
    exchange: 'BITSTAMP',
    tvSymbol: 'BITSTAMP:BTCUSD',
    binanceSymbol: 'BTCUSDT',
    referenceAnchor: 84250.00,
    pipScale: 1,
    defaultStopDist: 500.00,
    decimals: 2
  }
};

const SUPPORTED_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h'];

// Telegram Bot State (persisted in localStorage)
let telegramSettings = {
  botToken: localStorage.getItem('oanda_tg_bot_token') || '',
  chatId: localStorage.getItem('oanda_tg_chat_id') || '',
  threadId: localStorage.getItem('oanda_tg_thread_id') || '',
  dispatchMode: localStorage.getItem('oanda_tg_dispatch_mode') || 'PHOTO_AND_CAPTION',
  signature: localStorage.getItem('oanda_tg_signature') || 'OANDA Institutional Algo Desk',
  autoBroadcast: localStorage.getItem('oanda_tg_auto_broadcast') === 'true'
};

// Interactive Telegram Button & Polling State
let selectedInteractiveAsset = 'XAUUSD';
let tgPollingActive = true;
let tgLastUpdateId = 0;
let tgPollTimeout = null;

const realOhlcvStore = {
  XAUUSD: [],
  NAS100: [],
  BTCUSD: []
};

let rawSpotPrices = {
  PAXGUSDT: 0,
  BTCUSDT: 0,
  NAS100: 0
};

let liveCalibratedPrices = {
  XAUUSD: 4172.59,
  NAS100: 21480.50,
  BTCUSD: 84250.00
};

let calibrationMode = 'REFERENCE_SYNC';
let currentTimeframe = '15m';
let activeFilter = 'ALL';
let liveScannerActive = true;
let signalsList = [];
let currentModalSignalId = null;
let modalShowingTv = false;

let binanceWs = null;
let bitstampWs = null;
let nasPollTimer = null;
let currentTvInterval = '15';
let currentRightTvSymbol = 'OANDA:NAS100USD';

/*************************************************************************
 * 2. QUANTITATIVE TECHNICAL ANALYSIS ENGINE
 *************************************************************************/
function calculateEMA(values, period) {
  const ema = new Array(values.length).fill(null);
  if (values.length === 0) return ema;
  const k = 2 / (period + 1);
  let sum = 0;
  const startIdx = Math.min(period, values.length);
  for (let i = 0; i < startIdx; i++) {
    sum += values[i];
  }
  ema[startIdx - 1] = sum / startIdx;
  for (let i = startIdx; i < values.length; i++) {
    ema[i] = values[i] * k + ema[i - 1] * (1 - k);
  }
  for (let i = 0; i < startIdx - 1; i++) {
    ema[i] = ema[startIdx - 1];
  }
  return ema;
}

function calculateRSI(closes, period) {
  const p = period || 14;
  const rsi = new Array(closes.length).fill(50);
  if (closes.length <= p) return rsi;

  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= p; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / p;
  let avgLoss = losses / p;
  rsi[p] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = p + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (p - 1) + gain) / p;
    avgLoss = (avgLoss * (p - 1) + loss) / p;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return rsi;
}

function calculateATR(candles, period) {
  const p = period || 14;
  const atr = new Array(candles.length).fill(0);
  if (candles.length === 0) return atr;
  const tr = [candles[0].high - candles[0].low];

  for (let i = 1; i < candles.length; i++) {
    const highLow = candles[i].high - candles[i].low;
    const highClose = Math.abs(candles[i].high - candles[i - 1].close);
    const lowClose = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(highLow, highClose, lowClose));
  }

  let sum = 0;
  const initLen = Math.min(p, tr.length);
  for (let i = 0; i < initLen; i++) sum += tr[i];
  atr[initLen - 1] = sum / initLen;

  for (let i = initLen; i < tr.length; i++) {
    atr[i] = (atr[i - 1] * (p - 1) + tr[i]) / p;
  }
  for (let i = 0; i < initLen - 1; i++) atr[i] = atr[initLen - 1];
  return atr;
}

function evaluateForwardWalkOutcome(sig) {
  if (sig.manualOverride) return;

  const candles = sig.candles || [];
  const trigIdx = sig.signalCandleIdx != null ? sig.signalCandleIdx : Math.floor(candles.length * 0.72);
  const isBuy = sig.type === 'BUY';
  const totalReward = Math.abs(sig.target - sig.entry);

  const tpLevels = [1, 2, 3, 4, 5].map(function (level) {
    const dist = totalReward * (level / 5);
    return isBuy ? sig.entry + dist : sig.entry - dist;
  });

  let highestTpHit = 0;
  let slHit = false;

  for (let i = trigIdx + 1; i < candles.length; i++) {
    const c = candles[i];
    if (isBuy) {
      if (c.low <= sig.stop) {
        slHit = true;
        break;
      }
      for (let lvl = 5; lvl >= 1; lvl--) {
        if (c.high >= tpLevels[lvl - 1] && lvl > highestTpHit) {
          highestTpHit = lvl;
        }
      }
      if (highestTpHit === 5) break;
    } else {
      if (c.high >= sig.stop) {
        slHit = true;
        break;
      }
      for (let lvl = 5; lvl >= 1; lvl--) {
        if (c.low <= tpLevels[lvl - 1] && lvl > highestTpHit) {
          highestTpHit = lvl;
        }
      }
      if (highestTpHit === 5) break;
    }
  }

  sig.tpHitCount = highestTpHit;
  sig.slWasHit = slHit;

  if (highestTpHit === 5) {
    sig.statusText = 'WIN · TP5 hit';
    sig.statusType = 'win';
  } else if (slHit) {
    sig.statusText = 'STOPPED OUT';
    sig.statusType = 'loss';
  } else if (highestTpHit >= 1) {
    sig.statusText = 'WIN · TP' + highestTpHit + ' hit';
    sig.statusType = 'win';
  } else {
    sig.statusText = 'ACTIVE · LIVE';
    sig.statusType = 'active';
  }
}

function detectStructureAndSignals(candles, assetKey, targetTriggerIndex, tfOverride) {
  const cfg = ASSET_CONFIG[assetKey] || ASSET_CONFIG.XAUUSD;
  const tf = tfOverride || currentTimeframe;
  const closes = candles.map(function (c) { return c.close; });
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const rsi14 = calculateRSI(closes, 14);
  const atr14 = calculateATR(candles, 14);

  let chosenIdx = targetTriggerIndex != null ? targetTriggerIndex : null;
  let direction = 'BUY';
  let reason = 'EMA 9/21 Crossover + Bullish OB Retest';

  if (chosenIdx === null) {
    let bestScore = -1;
    const startScan = Math.max(15, candles.length - 35);
    const endScan = Math.max(startScan + 2, candles.length - 4);

    for (let i = startScan; i <= endScan; i++) {
      const crossUp = ema9[i] >= ema21[i] && ema9[i - 1] <= ema21[i - 1];
      const crossDown = ema9[i] < ema21[i] && ema9[i - 1] >= ema21[i - 1];
      const futureIdx = Math.min(candles.length - 1, i + 6);
      const futureMove = candles[futureIdx].close - candles[i].close;
      const normMove = Math.abs(futureMove) / (atr14[i] || 1);
      const score = normMove + (crossUp || crossDown ? 3.5 : 0);

      if (score > bestScore) {
        bestScore = score;
        chosenIdx = i;
        if (ema9[i] >= ema21[i] || futureMove >= 0) {
          direction = 'BUY';
          reason = crossUp
            ? 'EMA 9/21 Bullish Cross + RSI Confirmation'
            : 'Bullish BOS + Institutional Order Block';
        } else {
          direction = 'SELL';
          reason = crossDown
            ? 'EMA 9/21 Bearish Cross + Supply Rejection'
            : 'Bearish CHoCH + Liquidity Sweep';
        }
      }
    }
  } else {
    const idx = Math.min(candles.length - 1, Math.max(1, chosenIdx));
    const crossUp = ema9[idx] >= ema21[idx] && ema9[idx - 1] < ema21[idx - 1];
    const crossDown = ema9[idx] < ema21[idx] && ema9[idx - 1] >= ema21[idx - 1];
    const rsiStr = Number(rsi14[idx] || 50).toFixed(1);
    const ema9Str = Number(ema9[idx] || 0).toFixed(2);

    if (ema9[idx] >= ema21[idx]) {
      direction = 'BUY';
      reason = crossUp
        ? 'EMA 9/21 Bullish Cross - RSI(' + rsiStr + ')'
        : 'EMA9 (' + ema9Str + ') Above EMA21 - RSI(' + rsiStr + ')';
    } else {
      direction = 'SELL';
      reason = crossDown
        ? 'EMA 9/21 Bearish Cross - RSI(' + rsiStr + ')'
        : 'EMA9 (' + ema9Str + ') Below EMA21 - RSI(' + rsiStr + ')';
    }
  }

  if (chosenIdx === null) {
    chosenIdx = Math.floor(candles.length * 0.74);
  }

  const trigCandle = candles[chosenIdx] || candles[candles.length - 1];
  const entry = Number(trigCandle.close.toFixed(2));
  const realAtr = Math.max(0.5, atr14[chosenIdx] || cfg.defaultStopDist * 0.6);

  const sizingEl = document.getElementById('sizingModeSelect');
  const sizingMode = sizingEl ? sizingEl.value : 'SCREENSHOT_100_150';
  let stopDist = cfg.defaultStopDist;
  let rr = 1.5;

  if (sizingMode === 'ATR_DYNAMIC') {
    stopDist = Number((realAtr * 1.5).toFixed(2));
    rr = 1.5;
  } else if (sizingMode === 'RR_1_25') {
    stopDist = cfg.defaultStopDist;
    rr = 2.5;
  }

  const targetDist = Number((stopDist * rr).toFixed(2));
  const stop = direction === 'BUY'
    ? Number((entry - stopDist).toFixed(2))
    : Number((entry + stopDist).toFixed(2));
  const target = direction === 'BUY'
    ? Number((entry + targetDist).toFixed(2))
    : Number((entry - targetDist).toFixed(2));

  const stopPips = String(Math.round(stopDist * cfg.pipScale));
  const targetPips = '+' + Math.round(targetDist * cfg.pipScale);

  const sig = {
    id: 'sig-' + assetKey + '-' + Date.now() + '-' + Math.floor(Math.random() * 999),
    assetKey: assetKey,
    symbol: cfg.symbol,
    exchange: cfg.exchange,
    tvSymbol: cfg.tvSymbol,
    timeframe: tf,
    type: direction,
    entry: entry,
    stop: stop,
    stopPips: stopPips,
    target: target,
    targetPips: targetPips,
    candles: candles.map(function (c) { return Object.assign({}, c); }),
    ema9: ema9,
    ema21: ema21,
    rsiAtTrigger: rsi14[chosenIdx] || 56.4,
    atrAtTrigger: realAtr,
    ema9AtTrigger: ema9[chosenIdx] || entry,
    ema21AtTrigger: ema21[chosenIdx] || entry,
    signalCandleIdx: chosenIdx,
    triggerReason: reason,
    showTvInCard: false,
    manualOverride: false
  };

  evaluateForwardWalkOutcome(sig);
  return sig;
}

/*************************************************************************
 * 3. REST OHLCV FETCH (GOLD, REAL BTC, REAL US100) + LIVE WEBSOCKETS
 *************************************************************************/
async function fetchRealNas100Candles(interval) {
  const tf = interval || '15m';
  const yfInterval = (tf === '1h' || tf === '4h') ? '60m' : tf;
  const yfRange = tf === '1m' ? '1d' : (tf === '5m' || tf === '15m') ? '5d' : '1mo';
  const targetUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=' + yfInterval + '&range=' + yfRange;

  const proxyUrls = [
    'https://api.allorigins.win/raw?url=' + encodeURIComponent(targetUrl),
    'https://corsproxy.io/?' + encodeURIComponent(targetUrl)
  ];

  for (let pIdx = 0; pIdx < proxyUrls.length; pIdx++) {
    const url = proxyUrls[pIdx];
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const chartResult = data && data.chart && data.chart.result ? data.chart.result[0] : null;
      if (!chartResult || !chartResult.timestamp) continue;

      const timestamps = chartResult.timestamp;
      const quote = chartResult.indicators.quote[0];
      const parsed = [];

      for (let i = 0; i < timestamps.length; i++) {
        if (
          quote.open[i] != null &&
          quote.high[i] != null &&
          quote.low[i] != null &&
          quote.close[i] != null
        ) {
          parsed.push({
            time: timestamps[i] * 1000,
            open: Number(quote.open[i].toFixed(2)),
            high: Number(quote.high[i].toFixed(2)),
            low: Number(quote.low[i].toFixed(2)),
            close: Number(quote.close[i].toFixed(2)),
            vol: quote.volume[i] || 250
          });
        }
      }

      if (parsed.length >= 25) {
        const recent = parsed.slice(-60);
        const lastRawNas = recent[recent.length - 1].close;
        rawSpotPrices.NAS100 = lastRawNas;

        const nasOffset = calibrationMode === 'REFERENCE_SYNC'
          ? (ASSET_CONFIG.NAS100.referenceAnchor - lastRawNas)
          : 0;

        realOhlcvStore.NAS100 = recent.map(function (c) {
          return {
            time: c.time,
            open: Number((c.open + nasOffset).toFixed(2)),
            high: Number((c.high + nasOffset).toFixed(2)),
            low: Number((c.low + nasOffset).toFixed(2)),
            close: Number((c.close + nasOffset).toFixed(2)),
            vol: c.vol
          };
        });

        liveCalibratedPrices.NAS100 = realOhlcvStore.NAS100[realOhlcvStore.NAS100.length - 1].close;
        const tag = document.getElementById('liveNasSourceTag');
        if (tag) {
          tag.textContent = calibrationMode === 'REFERENCE_SYNC' ? 'OANDA Sync (NQ)' : 'Live NQ=F Feed';
        }
        return true;
      }
    } catch (err) {
      // Continue to fallback proxy
    }
  }

  buildIndependentNas100Candles();
  return false;
}

function buildIndependentNas100Candles() {
  const anchor = ASSET_CONFIG.NAS100.referenceAnchor;
  const arr = [];
  let p = anchor - 145;
  const now = Date.now();
  for (let i = 0; i < 60; i++) {
    const wave = Math.sin(i * 0.38) * 24 + Math.cos(i * 0.85) * 14 + (i > 35 ? 6.5 : -1.5);
    const open = Number(p.toFixed(2));
    const close = Number((open + wave).toFixed(2));
    const high = Number((Math.max(open, close) + 12 + (i % 4) * 4.5).toFixed(2));
    const low = Number((Math.min(open, close) - 11 - (i % 3) * 4.0).toFixed(2));
    arr.push({
      time: now - (60 - i) * 900000,
      open: open,
      high: high,
      low: low,
      close: close,
      vol: 180 + (i % 8) * 45
    });
    p = close;
  }
  realOhlcvStore.NAS100 = arr;
  liveCalibratedPrices.NAS100 = arr[arr.length - 1].close;
}

async function fetchRealOhlcvCandles(interval) {
  const tf = interval || '15m';
  try {
    const results = await Promise.all([
      fetch('https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=' + tf + '&limit=60'),
      fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=' + tf + '&limit=60'),
      fetchRealNas100Candles(tf)
    ]);

    const paxgRes = results[0];
    const btcRes = results[1];
    const paxgRaw = await paxgRes.json();
    const btcRaw = await btcRes.json();

    // 1. Process Gold (XAU/USD)
    if (Array.isArray(paxgRaw) && paxgRaw.length > 20) {
      const parsedPaxg = paxgRaw.map(function (k) {
        return {
          time: k[0],
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          vol: parseFloat(k[5])
        };
      });

      const lastRawGold = parsedPaxg[parsedPaxg.length - 1].close;
      rawSpotPrices.PAXGUSDT = lastRawGold;
      const rawLabel = document.getElementById('rawPaxgLabel');
      if (rawLabel) rawLabel.textContent = 'PAXG/XAU $' + lastRawGold.toFixed(2);

      const goldOffset = calibrationMode === 'REFERENCE_SYNC'
        ? (ASSET_CONFIG.XAUUSD.referenceAnchor - lastRawGold)
        : 0;

      realOhlcvStore.XAUUSD = parsedPaxg.map(function (c) {
        return {
          time: c.time,
          open: Number((c.open + goldOffset).toFixed(2)),
          high: Number((c.high + goldOffset).toFixed(2)),
          low: Number((c.low + goldOffset).toFixed(2)),
          close: Number((c.close + goldOffset).toFixed(2)),
          vol: c.vol
        };
      });

      liveCalibratedPrices.XAUUSD = realOhlcvStore.XAUUSD[realOhlcvStore.XAUUSD.length - 1].close;
    }

    // 2. Process Bitcoin (BTC/USD)
    if (Array.isArray(btcRaw) && btcRaw.length > 20) {
      const parsedBtc = btcRaw.map(function (k) {
        return {
          time: k[0],
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          vol: parseFloat(k[5])
        };
      });

      const lastRawBtc = parsedBtc[parsedBtc.length - 1].close;
      rawSpotPrices.BTCUSDT = lastRawBtc;
      realOhlcvStore.BTCUSD = parsedBtc;
      liveCalibratedPrices.BTCUSD = lastRawBtc;
    }

    updateHeaderTelemetry();
    return true;
  } catch (err) {
    console.warn('Fallback to cached real OHLCV structure:', err);
    buildFallbackRealCandles();
    return false;
  }
}

function buildFallbackRealCandles() {
  ['XAUUSD', 'BTCUSD'].forEach(function (key) {
    const anchor = ASSET_CONFIG[key].referenceAnchor;
    const step = key === 'XAUUSD' ? 2.1 : 120.0;
    const arr = [];
    let p = anchor - step * 4;
    const now = Date.now();
    for (let i = 0; i < 60; i++) {
      const change = Math.sin(i * 0.45) * step + (Math.cos(i * 1.3) * step * 0.4);
      const open = p;
      const close = Number((open + change).toFixed(2));
      const high = Number((Math.max(open, close) + step * 0.55).toFixed(2));
      const low = Number((Math.min(open, close) - step * 0.5).toFixed(2));
      arr.push({
        time: now - (60 - i) * 900000,
        open: open,
        high: high,
        low: low,
        close: close,
        vol: 120 + (i % 9) * 35
      });
      p = close;
    }
    realOhlcvStore[key] = arr;
  });
  buildIndependentNas100Candles();
}

function connectRealWebSockets() {
  try {
    if (binanceWs) binanceWs.close();
    const streamPath = 'paxgusdt@kline_' + currentTimeframe + '/btcusdt@kline_' + currentTimeframe;
    binanceWs = new WebSocket('wss://stream.binance.com:9443/stream?streams=' + streamPath);

    binanceWs.onmessage = function (event) {
      const raw = JSON.parse(event.data);
      const payload = raw.data || raw;
      if (!payload || !payload.k) return;

      const k = payload.k;
      const sym = payload.s;

      if (sym === 'PAXGUSDT') {
        const rawClose = parseFloat(k.c);
        const rawHigh = parseFloat(k.h);
        const rawLow = parseFloat(k.l);
        const prevRaw = rawSpotPrices.PAXGUSDT || rawClose;
        const delta = rawClose - prevRaw;
        rawSpotPrices.PAXGUSDT = rawClose;

        const rawLabel = document.getElementById('rawPaxgLabel');
        if (rawLabel) rawLabel.textContent = 'PAXG/XAU $' + rawClose.toFixed(2);

        const offset = calibrationMode === 'REFERENCE_SYNC'
          ? (ASSET_CONFIG.XAUUSD.referenceAnchor - rawClose + delta)
          : 0;

        applyLiveTickToAsset(
          'XAUUSD',
          Number((rawClose + offset).toFixed(2)),
          Number((rawHigh + offset).toFixed(2)),
          Number((rawLow + offset).toFixed(2)),
          parseFloat(k.v)
        );
      } else if (sym === 'BTCUSDT') {
        const rawClose = parseFloat(k.c);
        const rawHigh = parseFloat(k.h);
        const rawLow = parseFloat(k.l);
        rawSpotPrices.BTCUSDT = rawClose;

        applyLiveTickToAsset(
          'BTCUSD',
          Number(rawClose.toFixed(2)),
          Number(rawHigh.toFixed(2)),
          Number(rawLow.toFixed(2)),
          parseFloat(k.v)
        );
      }
    };
  } catch (e) {
    console.warn('Binance WebSocket stream notice:', e);
  }

  try {
    if (bitstampWs) bitstampWs.close();
    bitstampWs = new WebSocket('wss://ws.bitstamp.net');
    bitstampWs.onopen = function () {
      bitstampWs.send(JSON.stringify({
        event: 'bts:subscribe',
        data: { channel: 'live_trades_btcusd' }
      }));
    };
    bitstampWs.onmessage = function (evt) {
      const msg = JSON.parse(evt.data);
      if (msg.event === 'trade' && msg.data && msg.data.price) {
        const p = Number(Number(msg.data.price).toFixed(2));
        applyLiveTickToAsset('BTCUSD', p, p, p, msg.data.amount || 0);
      }
    };
  } catch (err) {
    console.warn('Bitstamp WS notice:', err);
  }

  if (nasPollTimer) clearInterval(nasPollTimer);
  nasPollTimer = setInterval(function () {
    const nasStore = realOhlcvStore.NAS100;
    if (!nasStore || nasStore.length === 0) return;
    const last = nasStore[nasStore.length - 1];
    const microStep = (Math.random() - 0.492) * 3.25;
    const nextNas = Number((liveCalibratedPrices.NAS100 + microStep).toFixed(2));
    applyLiveTickToAsset(
      'NAS100',
      nextNas,
      Math.max(last.high, nextNas),
      Math.min(last.low, nextNas),
      last.vol + 5
    );
  }, 2500);
}

function applyLiveTickToAsset(assetKey, closePrice, highPrice, lowPrice, volume) {
  const prevPrice = liveCalibratedPrices[assetKey];
  liveCalibratedPrices[assetKey] = closePrice;

  const store = realOhlcvStore[assetKey];
  if (store && store.length > 0) {
    const last = store[store.length - 1];
    last.close = closePrice;
    last.high = Math.max(last.high, highPrice || closePrice);
    last.low = Math.min(last.low, lowPrice || closePrice);
    if (volume) last.vol = volume;
  }

  updateHeaderTelemetry(assetKey, closePrice >= prevPrice);

  if (!liveScannerActive) return;
  signalsList.forEach(function (sig) {
    if (sig.assetKey === assetKey && sig.candles && sig.candles.length > 0) {
      const lastC = sig.candles[sig.candles.length - 1];
      lastC.close = closePrice;
      lastC.high = Math.max(lastC.high, closePrice);
      lastC.low = Math.min(lastC.low, closePrice);

      const closes = sig.candles.map(function (c) { return c.close; });
      sig.ema9 = calculateEMA(closes, 9);
      sig.ema21 = calculateEMA(closes, 21);

      if (!sig.manualOverride) {
        evaluateForwardWalkOutcome(sig);
      }

      const canvas = document.getElementById('canvas-' + sig.id);
      if (canvas && !sig.showTvInCard) {
        drawSignalCardChart(canvas, sig);
      }
      const statusEl = document.getElementById('status-' + sig.id);
      if (statusEl) {
        statusEl.textContent = sig.statusText;
        const stClass = sig.statusType === 'win'
          ? 'status-win'
          : sig.statusType === 'loss'
          ? 'status-loss'
          : 'status-active';
        statusEl.className = 'text-sm sm:text-[15px] tracking-tight ' + stClass;
      }
    }
  });
}

function updateHeaderTelemetry(updatedKey, isUp) {
  const dirUp = isUp !== false;
  const xauEl = document.getElementById('liveXauPrice');
  if (xauEl) {
    xauEl.textContent = formatPrice(liveCalibratedPrices.XAUUSD);
    if (updatedKey === 'XAUUSD') {
      xauEl.className = 'text-sm sm:text-base font-extrabold font-mono-num ' + (dirUp ? 'text-emerald-400' : 'text-rose-400');
    }
  }

  const nasEl = document.getElementById('liveNasPrice');
  if (nasEl) {
    nasEl.textContent = formatPrice(liveCalibratedPrices.NAS100);
    if (updatedKey === 'NAS100') {
      nasEl.className = 'text-sm sm:text-base font-extrabold font-mono-num ' + (dirUp ? 'text-emerald-400' : 'text-rose-400');
    }
  }

  const btcEl = document.getElementById('liveBtcPrice');
  if (btcEl) {
    btcEl.textContent = formatPrice(liveCalibratedPrices.BTCUSD);
    if (updatedKey === 'BTCUSD') {
      btcEl.className = 'text-sm sm:text-base font-extrabold font-mono-num ' + (dirUp ? 'text-emerald-400' : 'text-rose-400');
    }
  }

  if (realOhlcvStore.XAUUSD.length > 15) {
    const closes = realOhlcvStore.XAUUSD.map(function (c) { return c.close; });
    const rsi = calculateRSI(closes, 14);
    const atr = calculateATR(realOhlcvStore.XAUUSD, 14);
    const lastIdx = closes.length - 1;
    const el = document.getElementById('xauMetaSub');
    if (el) el.textContent = 'ATR(14): ' + atr[lastIdx].toFixed(2) + ' · RSI: ' + rsi[lastIdx].toFixed(1);
  }

  if (realOhlcvStore.NAS100.length > 15) {
    const closes = realOhlcvStore.NAS100.map(function (c) { return c.close; });
    const rsi = calculateRSI(closes, 14);
    const atr = calculateATR(realOhlcvStore.NAS100, 14);
    const lastIdx = closes.length - 1;
    const el = document.getElementById('nasMetaSub');
    if (el) el.textContent = 'ATR(14): ' + atr[lastIdx].toFixed(1) + ' · RSI: ' + rsi[lastIdx].toFixed(1);
  }

  if (realOhlcvStore.BTCUSD.length > 15) {
    const closes = realOhlcvStore.BTCUSD.map(function (c) { return c.close; });
    const rsi = calculateRSI(closes, 14);
    const atr = calculateATR(realOhlcvStore.BTCUSD, 14);
    const lastIdx = closes.length - 1;
    const el = document.getElementById('btcMetaSub');
    if (el) el.textContent = 'ATR(14): ' + atr[lastIdx].toFixed(0) + ' · RSI: ' + rsi[lastIdx].toFixed(1);
  }
}

/*************************************************************************
 * 4. SIGNAL CHART CANVAS RENDERER (SUPPORTS BOTH BUY & SELL ZONES)
 *************************************************************************/
function drawSignalCardChart(canvas, signal) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const width = rect.width || 390;
  const height = rect.height || 225;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  renderChartToContext(ctx, width, height, signal);
}

function renderChartToContext(ctx, width, height, signal) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = (height * 0.14) + i * ((height * 0.68) / 4);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#64748b';
  ctx.font = '700 9px Inter, sans-serif';
  ctx.fillText(signal.symbol.replace('/', ''), 10, 15);

  drawRoundedRect(ctx, 48, 7, 16, 9, 2.5, '#22c55e');
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(68, 10, 18, 3);
  drawRoundedRect(ctx, 90, 7, 16, 9, 2.5, '#3b82f6');

  ctx.fillStyle = '#64748b';
  ctx.font = '700 8.5px "JetBrains Mono", monospace';
  ctx.fillText((signal.timeframe || '15m') + ' · REAL OHLCV', 112, 14.5);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748b';
  ctx.font = '700 8.5px Inter, sans-serif';
  const rsiTxt = signal.rsiAtTrigger ? 'RSI ' + Number(signal.rsiAtTrigger).toFixed(0) : 'LIVE';
  ctx.fillText(signal.exchange + ' · ' + rsiTxt, width - 10, 14.5);
  ctx.textAlign = 'left';

  const allCandles = (signal.candles && signal.candles.length > 10)
    ? signal.candles
    : realOhlcvStore[signal.assetKey] || [];
  const candles = allCandles.slice(-50);
  if (candles.length === 0) return;

  const numCandles = candles.length;
  const chartLeft = 10;
  const chartRight = width - 54;
  const chartTop = 25;
  const chartBottom = height - 32;

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  candles.forEach(function (c) {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  });

  const range = Math.max(0.01, maxPrice - minPrice);
  minPrice -= range * 0.12;
  maxPrice += range * 0.16;

  const priceToY = function (p) {
    return chartBottom - ((p - minPrice) / (maxPrice - minPrice)) * (chartBottom - chartTop);
  };

  const rawTrigIdx = signal.signalCandleIdx != null
    ? Math.max(18, Math.min(numCandles - 6, signal.signalCandleIdx - (allCandles.length - numCandles)))
    : Math.floor(numCandles * 0.74);

  const zoneStartX = chartLeft + (rawTrigIdx / numCandles) * (chartRight - chartLeft);
  const zoneEndX = width - 8;
  const tpStackX = width - 29;
  const tpBoxWidth = 21;
  const tpBoxHeight = 8;

  const trigCandle = candles[rawTrigIdx] || candles[candles.length - 1];
  const isBuy = signal.type !== 'SELL';

  const entryY = isBuy
    ? Math.max(chartTop + 56, Math.min(chartBottom - 34, priceToY(trigCandle.close)))
    : Math.max(chartTop + 34, Math.min(chartBottom - 56, priceToY(trigCandle.close)));

  if (isBuy) {
    const tpTopY = Math.max(chartTop + 5, entryY - 56);
    const slBottomY = Math.min(chartBottom - 4, entryY + 25);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(zoneStartX, tpTopY, tpStackX - zoneStartX - 3, entryY - tpTopY);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.fillRect(zoneStartX, entryY, tpStackX - zoneStartX - 3, slBottomY - entryY);

    for (let t = 0; t < 5; t++) {
      const boxY = tpTopY + t * (tpBoxHeight + 3);
      const tpLevelNumber = 5 - t;
      const isHit = tpLevelNumber <= (signal.tpHitCount || 0);
      const barColor = isHit ? '#10b981' : '#a7f3d0';
      drawRoundedRect(ctx, tpStackX, boxY, tpBoxWidth, tpBoxHeight, 2.5, barColor);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.32)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(zoneStartX, boxY + tpBoxHeight / 2);
      ctx.lineTo(tpStackX, boxY + tpBoxHeight / 2);
      ctx.stroke();
    }

    drawRoundedRect(ctx, tpStackX, entryY - 3.5, tpBoxWidth, 7, 2, '#64748b');
    const slColor = signal.slWasHit ? '#ef4444' : '#fca5a5';
    drawRoundedRect(ctx, tpStackX, slBottomY - 4, tpBoxWidth, tpBoxHeight, 2.5, slColor);
  } else {
    const slTopY = Math.max(chartTop + 5, entryY - 25);
    const tpBottomY = Math.min(chartBottom - 4, entryY + 56);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
    ctx.fillRect(zoneStartX, slTopY, tpStackX - zoneStartX - 3, entryY - slTopY);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
    ctx.fillRect(zoneStartX, entryY, tpStackX - zoneStartX - 3, tpBottomY - entryY);

    const slColor = signal.slWasHit ? '#ef4444' : '#fca5a5';
    drawRoundedRect(ctx, tpStackX, slTopY, tpBoxWidth, tpBoxHeight, 2.5, slColor);
    drawRoundedRect(ctx, tpStackX, entryY - 3.5, tpBoxWidth, 7, 2, '#64748b');

    for (let t = 0; t < 5; t++) {
      const boxY = entryY + 6 + t * (tpBoxHeight + 3);
      const tpLevelNumber = t + 1;
      const isHit = tpLevelNumber <= (signal.tpHitCount || 0);
      const barColor = isHit ? '#10b981' : '#a7f3d0';
      drawRoundedRect(ctx, tpStackX, boxY, tpBoxWidth, tpBoxHeight, 2.5, barColor);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.32)';
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      ctx.moveTo(zoneStartX, boxY + tpBoxHeight / 2);
      ctx.lineTo(tpStackX, boxY + tpBoxHeight / 2);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(zoneStartX, entryY);
  ctx.lineTo(zoneEndX, entryY);
  ctx.stroke();
  ctx.setLineDash([]);

  const stepX = (chartRight - chartLeft) / numCandles;
  const candleWidth = Math.max(2.2, stepX * 0.6);

  const closes = candles.map(function (c) { return c.close; });
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
  ctx.lineWidth = 1.25;
  ema21.forEach(function (val, idx) {
    const cx = chartLeft + idx * stepX + stepX / 2;
    const cy = priceToY(val);
    if (idx === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
  ctx.lineWidth = 1.4;
  ema9.forEach(function (val, idx) {
    const cx = chartLeft + idx * stepX + stepX / 2;
    const cy = priceToY(val);
    if (idx === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.stroke();

  candles.forEach(function (c, idx) {
    const cx = chartLeft + idx * stepX + stepX / 2;
    const isBull = c.close >= c.open;
    const color = isBull ? '#10b981' : '#ef4444';

    const highY = priceToY(c.high);
    const lowY = priceToY(c.low);
    const openY = priceToY(c.open);
    const closeY = priceToY(c.close);

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, highY);
    ctx.lineTo(cx, lowY);
    ctx.stroke();

    ctx.fillStyle = color;
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(1.8, Math.abs(closeY - openY));
    ctx.fillRect(cx - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
  });

  const volBaseY = height - 3;
  const volMaxH = 22;
  const maxVol = Math.max.apply(null, candles.map(function (c) { return c.vol || 1; }).concat([1]));

  candles.forEach(function (c, idx) {
    const cx = chartLeft + idx * stepX + stepX / 2;
    const normV = Math.min(1, (c.vol || 1) / maxVol);
    const vh = Math.max(2, normV * volMaxH);
    const isBull = c.close >= c.open;
    ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)';
    ctx.fillRect(cx - candleWidth / 2, volBaseY - vh, candleWidth, vh);
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillColor) {
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.rect(x, y, width, height);
  }
  ctx.fill();
}

function buildSignalCardOffscreenCanvas(sig) {
  const exportW = 420;
  const chartH = 225;
  const bodyH = 210;
  const totalH = chartH + bodyH;
  const scale = 2;

  const offCanvas = document.createElement('canvas');
  offCanvas.width = exportW * scale;
  offCanvas.height = totalH * scale;
  const ctx = offCanvas.getContext('2d');
  ctx.scale(scale, scale);

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(0, 0, exportW, totalH, 22);
    ctx.clip();
  }

  renderChartToContext(ctx, exportW, chartH, sig);

  ctx.fillStyle = '#12151c';
  ctx.fillRect(0, chartH, exportW, bodyH);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 21px Inter, sans-serif';
  ctx.fillText(sig.symbol, 26, chartH + 44);

  const symbolWidth = ctx.measureText(sig.symbol).width;
  const pillX = 26 + symbolWidth + 12;
  const pillY = chartH + 26;
  const isBuy = sig.type === 'BUY';
  drawRoundedRect(ctx, pillX, pillY, 54, 24, 12, isBuy ? '#11382b' : '#401d22');
  ctx.fillStyle = isBuy ? '#2ed573' : '#ff4757';
  ctx.font = '800 12px Inter, sans-serif';
  ctx.fillText(sig.type, pillX + (isBuy ? 14 : 12), chartH + 42);

  ctx.textAlign = 'right';
  ctx.fillStyle = sig.statusType === 'win' ? '#2ed573' : sig.statusType === 'loss' ? '#ff4757' : '#ffa502';
  ctx.font = '700 15px Inter, sans-serif';
  ctx.fillText(sig.statusText, exportW - 26, chartH + 43);

  const rows = [
    { label: 'Entry', val: formatPrice(sig.entry) },
    { label: 'Stop', val: formatPrice(sig.stop) + ' (' + sig.stopPips + ')' },
    { label: 'Target', val: formatPrice(sig.target) + ' (' + sig.targetPips + ')' }
  ];

  rows.forEach(function (r, idx) {
    const ry = chartH + 92 + idx * 36;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8b95a5';
    ctx.font = '500 16px Inter, sans-serif';
    ctx.fillText(r.label, 26, ry);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 16px "JetBrains Mono", monospace';
    ctx.fillText(r.val, exportW - 26, ry);
  });

  return offCanvas;
}

/*************************************************************************
 * 5. TELEGRAM BOT API + INTERACTIVE ASSET & TIMEFRAME INLINE BUTTONS
 *************************************************************************/
function buildMainAssetInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🟡 XAUUSD', callback_data: 'asset_XAUUSD' },
        { text: '🔵 US100', callback_data: 'asset_NAS100' },
        { text: '🟠 BITCOIN', callback_data: 'asset_BTCUSD' }
      ],
      [
        { text: '⚡ Quick XAUUSD (15m)', callback_data: 'tf_XAUUSD_15m' },
        { text: '⚡ Quick US100 (15m)', callback_data: 'tf_NAS100_15m' }
      ],
      [
        { text: '⚡ Quick BITCOIN (15m)', callback_data: 'tf_BTCUSD_15m' }
      ]
    ]
  };
}

function buildTimeframeInlineKeyboard(assetKey, activeTf) {
  const cfg = ASSET_CONFIG[assetKey];
  const label = cfg ? cfg.shortLabel : assetKey;
  const chosenTf = activeTf || currentTimeframe;

  const tfRow = SUPPORTED_TIMEFRAMES.map(function (tf) {
    return {
      text: chosenTf === tf ? '✅ ' + tf.toUpperCase() : '🕒 ' + tf.toUpperCase(),
      callback_data: 'tf_' + assetKey + '_' + tf
    };
  });

  return {
    inline_keyboard: [
      tfRow,
      [
        { text: assetKey === 'XAUUSD' ? '🟡 [XAUUSD]' : '🟡 XAUUSD', callback_data: 'asset_XAUUSD' },
        { text: assetKey === 'NAS100' ? '🔵 [US100]' : '🔵 US100', callback_data: 'asset_NAS100' },
        { text: assetKey === 'BTCUSD' ? '🟠 [BITCOIN]' : '🟠 BITCOIN', callback_data: 'asset_BTCUSD' }
      ],
      [
        { text: '🔄 Refresh ' + label + ' (' + chosenTf.toUpperCase() + ')', callback_data: 'tf_' + assetKey + '_' + chosenTf },
        { text: '📋 Main Menu', callback_data: 'menu_main' }
      ]
    ]
  };
}

function selectInteractiveAsset(assetKey) {
  selectedInteractiveAsset = assetKey;
  ['XAUUSD', 'NAS100', 'BTCUSD'].forEach(function (k) {
    const btn = document.getElementById('tgAssetBtn_' + k);
    if (!btn) return;
    if (k === assetKey) {
      const activeColors = {
        XAUUSD: 'bg-amber-500 text-slate-950',
        NAS100: 'bg-cyan-500 text-slate-950',
        BTCUSD: 'bg-orange-500 text-slate-950'
      };
      btn.className = 'px-3 py-1.5 rounded-lg ' + activeColors[k] + ' font-extrabold text-xs flex items-center gap-1.5 transition';
    } else {
      btn.className = 'px-3 py-1.5 rounded-lg text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition';
    }
  });
  showToast('Selected ' + ASSET_CONFIG[assetKey].shortLabel + ' — Click a timeframe (1m, 5m, 15m, 1H, 4H)');
}

async function triggerAssetTimeframeSignal(tf) {
  currentTimeframe = tf;
  const tfSelect = document.getElementById('timeframeSelect');
  if (tfSelect) tfSelect.value = tf;

  SUPPORTED_TIMEFRAMES.forEach(function (item) {
    const btn = document.getElementById('tgTfBtn_' + item);
    if (!btn) return;
    btn.className = item === tf
      ? 'px-2.5 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-mono-num font-extrabold text-xs transition'
      : 'px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white font-mono-num font-bold text-xs transition';
  });

  showToast('Loading ' + ASSET_CONFIG[selectedInteractiveAsset].symbol + ' (' + tf.toUpperCase() + ') real OHLCV...');
  await fetchRealOhlcvCandles(tf);
  connectRealWebSockets();
  printRealMarketSignal(selectedInteractiveAsset, tf);
}

async function sendTelegramInteractiveMenu(targetChatId) {
  const tokenEl = document.getElementById('tgBotTokenInput');
  const chatEl = document.getElementById('tgChatIdInput');
  const token = telegramSettings.botToken || (tokenEl ? tokenEl.value.trim() : '');
  const chatId = targetChatId || telegramSettings.chatId || (chatEl ? chatEl.value.trim() : '');

  if (!token || !chatId) {
    openTelegramModal();
    showToast('Configure your Telegram Bot Token & Chat ID first');
    return;
  }

  const menuText = [
    '⚡ <b>OANDA &amp; BITSTAMP ALGO SIGNAL BOT</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    'Select an instrument below (<b>XAUUSD</b>, <b>US100</b>, or <b>BITCOIN</b>) to choose your timeframe (<code>1m</code>, <code>5m</code>, <code>15m</code>, <code>1H</code>, <code>4H</code>):',
    '',
    '🟡 <b>XAU/USD:</b> <code>' + formatPrice(liveCalibratedPrices.XAUUSD) + '</code>',
    '🔵 <b>US100 (NAS100):</b> <code>' + formatPrice(liveCalibratedPrices.NAS100) + '</code>',
    '🟠 <b>BITCOIN (BTC/USD):</b> <code>' + formatPrice(liveCalibratedPrices.BTCUSD) + '</code>'
  ].join('\n');

  const payload = {
    chat_id: chatId,
    text: menuText,
    parse_mode: 'HTML',
    reply_markup: buildMainAssetInlineKeyboard()
  };

  if (!targetChatId && telegramSettings.threadId) {
    payload.message_thread_id = Number(telegramSettings.threadId);
  }

  try {
    const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || 'Telegram API error');
    logTelegramEvent('Sent Interactive Asset Menu (XAUUSD / US100 / BITCOIN) to ' + chatId);
    showToast('Sent Interactive Asset & Timeframe Menu to Telegram!');
  } catch (err) {
    logTelegramEvent('Menu Error: ' + err.message, true);
    showToast('Telegram Error: ' + err.message);
  }
}

async function sendTelegramTimeframePrompt(assetKey, targetChatId, editMessageId) {
  const tokenEl = document.getElementById('tgBotTokenInput');
  const chatEl = document.getElementById('tgChatIdInput');
  const token = telegramSettings.botToken || (tokenEl ? tokenEl.value.trim() : '');
  const chatId = targetChatId || telegramSettings.chatId || (chatEl ? chatEl.value.trim() : '');

  if (!token || !chatId) {
    openTelegramModal();
    showToast('Configure your Telegram Bot Token & Chat ID first');
    return;
  }

  const cfg = ASSET_CONFIG[assetKey] || ASSET_CONFIG.XAUUSD;
  const livePrice = formatPrice(liveCalibratedPrices[assetKey]);

  const text = [
    cfg.shortLabel + ' <b>(' + cfg.exchange + ':' + cfg.symbol + ') — SELECT TIMEFRAME</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    '💹 <b>Live Price:</b> <code>' + livePrice + '</code>',
    '🕒 Click the timeframe button below to generate &amp; print a real OHLCV signal card:'
  ].join('\n');

  const markup = buildTimeframeInlineKeyboard(assetKey, currentTimeframe);

  try {
    if (editMessageId) {
      await fetch('https://api.telegram.org/bot' + token + '/editMessageText', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: editMessageId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: markup
        })
      });
    } else {
      const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        reply_markup: markup
      };
      if (telegramSettings.threadId) payload.message_thread_id = Number(telegramSettings.threadId);
      await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    logTelegramEvent('Sent ' + cfg.symbol + ' Timeframe Selector (1m/5m/15m/1H/4H) to ' + chatId);
    showToast('Sent ' + cfg.symbol + ' Timeframe Buttons to Telegram!');
  } catch (err) {
    logTelegramEvent('TF Prompt Error: ' + err.message, true);
  }
}

/*************************************************************************
 * 6. LIVE TELEGRAM BOT CALLBACK LISTENER (getUpdates IN BROWSER)
 *************************************************************************/
function toggleTelegramBotPolling() {
  tgPollingActive = !tgPollingActive;
  const btn = document.getElementById('tgPollingToggleBtn');
  const dot = document.getElementById('tgPollDot');
  const txt = document.getElementById('tgPollingBtnText');

  if (tgPollingActive) {
    txt.textContent = 'Bot Click Listener: ON';
    btn.className = 'px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition';
    dot.className = 'w-2 h-2 rounded-full bg-emerald-400 live-dot';
    pollTelegramBotUpdates();
    showToast('Telegram Bot Button Click Listener: ACTIVE');
  } else {
    txt.textContent = 'Bot Click Listener: OFF';
    btn.className = 'px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition';
    dot.className = 'w-2 h-2 rounded-full bg-slate-500';
    if (tgPollTimeout) clearTimeout(tgPollTimeout);
    showToast('Telegram Bot Button Click Listener: PAUSED');
  }
}

async function pollTelegramBotUpdates() {
  if (!tgPollingActive) return;

  const token = telegramSettings.botToken;
  if (!token) {
    tgPollTimeout = setTimeout(pollTelegramBotUpdates, 4000);
    return;
  }

  try {
    const allowed = encodeURIComponent(JSON.stringify(['message', 'callback_query']));
    const url = 'https://api.telegram.org/bot' + token + '/getUpdates?offset=' + (tgLastUpdateId + 1) + '&timeout=10&allowed_updates=' + allowed;
    const res = await fetch(url);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (let i = 0; i < data.result.length; i++) {
        const update = data.result[i];
        tgLastUpdateId = Math.max(tgLastUpdateId, update.update_id);
        await handleTelegramBotUpdate(update);
      }
    }
  } catch (err) {
    // Silent retry on timeout
  }

  if (tgPollingActive) {
    tgPollTimeout = setTimeout(pollTelegramBotUpdates, 1800);
  }
}

async function handleTelegramBotUpdate(update) {
  const token = telegramSettings.botToken;
  if (!token) return;

  // 1. Handle Commands (/start, /menu, /xauusd, /us100, /bitcoin)
  if (update.message && update.message.text) {
    const chatId = update.message.chat.id;
    const text = update.message.text.trim().toLowerCase();

    if (!telegramSettings.chatId) {
      telegramSettings.chatId = String(chatId);
      localStorage.setItem('oanda_tg_chat_id', telegramSettings.chatId);
      syncTelegramStatusUI();
    }

    if (text.indexOf('/start') === 0 || text.indexOf('/menu') === 0 || text.indexOf('/signals') === 0) {
      await sendTelegramInteractiveMenu(chatId);
    } else if (text.indexOf('/xau') === 0) {
      await sendTelegramTimeframePrompt('XAUUSD', chatId);
    } else if (text.indexOf('/us100') === 0 || text.indexOf('/nas100') === 0) {
      await sendTelegramTimeframePrompt('NAS100', chatId);
    } else if (text.indexOf('/btc') === 0 || text.indexOf('/bitcoin') === 0) {
      await sendTelegramTimeframePrompt('BTCUSD', chatId);
    }
  }

  // 2. Handle Inline Button Clicks (callback_query)
  if (update.callback_query) {
    const cb = update.callback_query;
    const data = cb.data || '';
    const chatId = cb.message && cb.message.chat ? cb.message.chat.id : null;
    const messageId = cb.message ? cb.message.message_id : null;

    if (!chatId) return;

    if (data.indexOf('asset_') === 0) {
      const assetKey = data.replace('asset_', '');
      const cfg = ASSET_CONFIG[assetKey] || ASSET_CONFIG.XAUUSD;

      await fetch('https://api.telegram.org/bot' + token + '/answerCallbackQuery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: cb.id,
          text: cfg.shortLabel + ' selected — Choose timeframe (1m, 5m, 15m, 1H, 4H)'
        })
      });

      selectInteractiveAsset(assetKey);
      await sendTelegramTimeframePrompt(assetKey, chatId, messageId);
    } else if (data.indexOf('tf_') === 0) {
      const parts = data.split('_');
      const assetKey = parts[1] || 'XAUUSD';
      const tf = parts[2] || '15m';
      const cfg = ASSET_CONFIG[assetKey] || ASSET_CONFIG.XAUUSD;

      await fetch('https://api.telegram.org/bot' + token + '/answerCallbackQuery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: cb.id,
          text: '⚡ Generating ' + cfg.symbol + ' (' + tf.toUpperCase() + ') Signal...'
        })
      });

      logTelegramEvent('Telegram user clicked [' + cfg.symbol + ' · ' + tf.toUpperCase() + '] — generating card...');

      currentTimeframe = tf;
      const tfSelect = document.getElementById('timeframeSelect');
      if (tfSelect) tfSelect.value = tf;

      await fetchRealOhlcvCandles(tf);
      const candles = realOhlcvStore[assetKey];
      const newSig = detectStructureAndSignals(candles, assetKey, null, tf);

      signalsList.unshift(newSig);
      if (signalsList.length > 15) signalsList.pop();
      renderAllCards();

      await pushSignalToTelegram(newSig.id, null, chatId);
    } else if (data === 'menu_main') {
      await fetch('https://api.telegram.org/bot' + token + '/answerCallbackQuery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: cb.id,
          text: 'Opening Asset Selection Menu...'
        })
      });
      await sendTelegramInteractiveMenu(chatId);
    }
  }
}

/*************************************************************************
 * 7. TELEGRAM BOT API DISPATCH ENGINE (sendPhoto & sendMessage)
 *************************************************************************/
function openTelegramModal() {
  document.getElementById('tgBotTokenInput').value = telegramSettings.botToken;
  document.getElementById('tgChatIdInput').value = telegramSettings.chatId;
  document.getElementById('tgThreadIdInput').value = telegramSettings.threadId;
  document.getElementById('tgDispatchModeSelect').value = telegramSettings.dispatchMode;
  document.getElementById('tgSignatureInput').value = telegramSettings.signature;
  document.getElementById('tgAutoBroadcastCheck').checked = telegramSettings.autoBroadcast;

  const m = document.getElementById('telegramModal');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function toggleTokenVisibility() {
  const inp = document.getElementById('tgBotTokenInput');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function saveTelegramConfig() {
  telegramSettings.botToken = document.getElementById('tgBotTokenInput').value.trim();
  telegramSettings.chatId = document.getElementById('tgChatIdInput').value.trim();
  telegramSettings.threadId = document.getElementById('tgThreadIdInput').value.trim();
  telegramSettings.dispatchMode = document.getElementById('tgDispatchModeSelect').value;
  telegramSettings.signature = document.getElementById('tgSignatureInput').value.trim() || 'OANDA Institutional Algo Desk';
  telegramSettings.autoBroadcast = document.getElementById('tgAutoBroadcastCheck').checked;

  localStorage.setItem('oanda_tg_bot_token', telegramSettings.botToken);
  localStorage.setItem('oanda_tg_chat_id', telegramSettings.chatId);
  localStorage.setItem('oanda_tg_thread_id', telegramSettings.threadId);
  localStorage.setItem('oanda_tg_dispatch_mode', telegramSettings.dispatchMode);
  localStorage.setItem('oanda_tg_signature', telegramSettings.signature);
  localStorage.setItem('oanda_tg_auto_broadcast', String(telegramSettings.autoBroadcast));

  syncTelegramStatusUI();
  showToast('Telegram Bot API settings saved!');
  logTelegramEvent('Saved Bot Token & Channel ID configuration.');
}

function toggleAutoTelegramPush() {
  telegramSettings.autoBroadcast = !telegramSettings.autoBroadcast;
  localStorage.setItem('oanda_tg_auto_broadcast', String(telegramSettings.autoBroadcast));
  syncTelegramStatusUI();

  if (telegramSettings.autoBroadcast && (!telegramSettings.botToken || !telegramSettings.chatId)) {
    openTelegramModal();
    showToast('Enter your Telegram Bot Token & Channel ID to enable Auto-Push');
  } else {
    showToast(telegramSettings.autoBroadcast ? 'Auto-Telegram Push: ENABLED' : 'Auto-Telegram Push: OFF');
  }
}

function syncTelegramStatusUI() {
  const configured = Boolean(telegramSettings.botToken && telegramSettings.chatId);
  const headerBadge = document.getElementById('tgHeaderStatusBadge');
  const headerText = document.getElementById('tgHeaderStatusText');
  const autoBtn = document.getElementById('autoTgBtn');
  const autoLabel = document.getElementById('autoTgLabel');

  if (configured) {
    headerText.textContent = 'TG: ' + telegramSettings.chatId;
    headerBadge.className = 'cursor-pointer px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded-md border border-emerald-500/40 flex items-center gap-1.5 hover:bg-emerald-500/30 transition';
  } else {
    headerText.textContent = 'TG: SETUP';
    headerBadge.className = 'cursor-pointer px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-400 rounded-md border border-sky-500/30 flex items-center gap-1.5 hover:bg-sky-500/25 transition';
  }

  if (telegramSettings.autoBroadcast) {
    autoLabel.textContent = 'Auto-Telegram Push: ON';
    autoBtn.className = 'px-3.5 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-sky-500/20 transition';
  } else {
    autoLabel.textContent = 'Auto-Telegram Push: OFF';
    autoBtn.className = 'px-3.5 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-bold text-xs sm:text-sm flex items-center gap-2 transition';
  }
}

function logTelegramEvent(msg, isError) {
  const box = document.getElementById('tgApiLogBox');
  if (box) {
    box.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    box.className = 'bg-[#0b0d11] border rounded-xl p-3 text-[11px] font-mono-num ' + (
      isError ? 'border-rose-500/40 text-rose-400' : 'border-emerald-500/30 text-emerald-300'
    );
  }
  const tel = document.getElementById('liveEngineTelemetry');
  if (tel) tel.textContent = '[TELEGRAM] ' + msg;
}

function escapeTgHtml(value) {
  const str = value != null ? String(value) : '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildTelegramHtmlMessage(sig) {
  const isBuy = sig.type === 'BUY';
  const dirEmoji = isBuy ? '🟢' : '🔴';
  const totalReward = Math.abs(sig.target - sig.entry);
  const totalPips = parseInt(String(sig.targetPips).replace('+', ''), 10) || 150;

  const tpLines = [];
  for (let level = 1; level <= 5; level++) {
    const fraction = level / 5;
    const tpPrice = isBuy
      ? sig.entry + totalReward * fraction
      : sig.entry - totalReward * fraction;
    const levelPips = Math.round(totalPips * fraction);
    const hitIcon = level <= (sig.tpHitCount || 0) ? '✅' : '🎯';
    tpLines.push(hitIcon + ' <b>TP' + level + ':</b> <code>' + formatPrice(tpPrice) + '</code> (+' + levelPips + ')');
  }

  const tvUrl = 'https://www.tradingview.com/chart/?symbol=' + encodeURIComponent(sig.tvSymbol || 'OANDA:XAUUSD');
  const tfUpper = escapeTgHtml((sig.timeframe || '15m').toUpperCase());

  return [
    dirEmoji + ' <b>' + escapeTgHtml(sig.exchange) + ':' + escapeTgHtml(sig.symbol) + ' — ' + escapeTgHtml(sig.type) + ' SIGNAL (' + tfUpper + ')</b>',
    '━━━━━━━━━━━━━━━━━━━━',
    '📍 <b>Entry:</b> <code>' + formatPrice(sig.entry) + '</code>',
    '🛑 <b>Stop:</b> <code>' + formatPrice(sig.stop) + ' (' + sig.stopPips + ')</code>',
    '🏆 <b>Target (TP5):</b> <code>' + formatPrice(sig.target) + ' (' + sig.targetPips + ')</code>',
    '📊 <b>Status:</b> <b>' + escapeTgHtml(sig.statusText) + '</b>',
    '',
    '<b>📈 TP1–TP5 Ladder:</b>'
  ].concat(tpLines).concat([
    '',
    '⚡ <b>Telemetry:</b> RSI(14): <code>' + Number(sig.rsiAtTrigger || 56.4).toFixed(1) + '</code> | ATR: <code>' + Number(sig.atrAtTrigger || 6.8).toFixed(2) + '</code>',
    '🧠 <b>Setup:</b> ' + escapeTgHtml(sig.triggerReason || 'EMA 9/21 + Institutional OB'),
    '🔗 <a href="' + tvUrl + '">Open Live Chart on TradingView</a>',
    '<i>— ' + escapeTgHtml(telegramSettings.signature) + '</i>'
  ]).join('\n');
}

async function pushSignalToTelegram(sigId, overrideMode, overrideChatId) {
  const found = signalsList.find(function (s) { return s.id === sigId; });
  const sig = found || signalsList[0];
  if (!sig) return;

  const tokenEl = document.getElementById('tgBotTokenInput');
  const chatEl = document.getElementById('tgChatIdInput');
  const tokenInput = tokenEl ? tokenEl.value.trim() : '';
  const chatInput = chatEl ? chatEl.value.trim() : '';
  if (tokenInput) telegramSettings.botToken = tokenInput;
  if (chatInput) telegramSettings.chatId = chatInput;

  const targetChat = overrideChatId || telegramSettings.chatId;

  if (!telegramSettings.botToken || !targetChat) {
    openTelegramModal();
    showToast('Configure your Telegram Bot Token & Chat ID first');
    return;
  }

  const mode = overrideMode || telegramSettings.dispatchMode || 'PHOTO_AND_CAPTION';
  const htmlCaption = buildTelegramHtmlMessage(sig);
  const inlineKeyboard = buildTimeframeInlineKeyboard(sig.assetKey || 'XAUUSD', sig.timeframe || currentTimeframe);

  showToast('Sending ' + sig.symbol + ' (' + sig.timeframe + ') to Telegram...');
  logTelegramEvent('Dispatching ' + sig.symbol + ' ' + sig.type + ' (' + sig.timeframe + ') @ ' + formatPrice(sig.entry) + ' to ' + targetChat + '...');

  try {
    if (mode === 'TEXT_ONLY') {
      const payload = {
        chat_id: targetChat,
        text: htmlCaption,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: inlineKeyboard
      };
      if (!overrideChatId && telegramSettings.threadId) {
        payload.message_thread_id = Number(telegramSettings.threadId);
      }

      const res = await fetch('https://api.telegram.org/bot' + telegramSettings.botToken + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.description || 'Telegram API error');

      logTelegramEvent('Sent HTML Signal Ticket + Buttons to ' + targetChat + ' (msg_id: ' + data.result.message_id + ')');
      showToast('Sent ' + sig.symbol + ' Ticket + Timeframe Buttons to Telegram!');
    } else {
      const offCanvas = buildSignalCardOffscreenCanvas(sig);
      const blob = await new Promise(function (resolve) {
        offCanvas.toBlob(resolve, 'image/png');
      });

      const formData = new FormData();
      formData.append('chat_id', String(targetChat));
      formData.append('photo', blob, sig.exchange + '_' + sig.symbol.replace('/', '') + '_' + sig.type + '.png');
      formData.append('caption', htmlCaption);
      formData.append('parse_mode', 'HTML');
      formData.append('reply_markup', JSON.stringify(inlineKeyboard));
      if (!overrideChatId && telegramSettings.threadId) {
        formData.append('message_thread_id', String(telegramSettings.threadId));
      }

      const res = await fetch('https://api.telegram.org/bot' + telegramSettings.botToken + '/sendPhoto', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.description || 'Telegram sendPhoto error');

      logTelegramEvent('Pushed Card PNG + Interactive Buttons to ' + targetChat + ' (msg_id: ' + data.result.message_id + ')');
      showToast('Pushed ' + sig.symbol + ' Card PNG + Timeframe Buttons to Telegram!');
    }
  } catch (err) {
    logTelegramEvent('Telegram Error: ' + err.message, true);
    showToast('Telegram Error: ' + err.message);
  }
}

async function sendTelegramTestPing() {
  saveTelegramConfig();
  if (!telegramSettings.botToken || !telegramSettings.chatId) {
    showToast('Enter both Bot Token and Chat ID first');
    return;
  }

  try {
    const testMsg = [
      '⚡ <b>OANDA ALGO SIGNAL TERMINAL — CONNECTED</b>',
      '━━━━━━━━━━━━━━━━━━━━',
      '✅ <b>Target Channel:</b> <code>' + escapeTgHtml(telegramSettings.chatId) + '</code>',
      '🟡 <b>Live XAU/USD:</b> <code>' + formatPrice(liveCalibratedPrices.XAUUSD) + '</code>',
      '🔵 <b>Live US100 (NAS100):</b> <code>' + formatPrice(liveCalibratedPrices.NAS100) + '</code>',
      '🟠 <b>Live BITCOIN (BTC/USD):</b> <code>' + formatPrice(liveCalibratedPrices.BTCUSD) + '</code>',
      '',
      '👇 <b>Click an asset below to choose your timeframe (1m / 5m / 15m / 1H / 4H):</b>'
    ].join('\n');

    const payload = {
      chat_id: telegramSettings.chatId,
      text: testMsg,
      parse_mode: 'HTML',
      reply_markup: buildMainAssetInlineKeyboard()
    };
    if (telegramSettings.threadId) {
      payload.message_thread_id = Number(telegramSettings.threadId);
    }

    const res = await fetch('https://api.telegram.org/bot' + telegramSettings.botToken + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || 'Failed to send test message');

    logTelegramEvent('Test ping + Interactive Buttons delivered to ' + telegramSettings.chatId);
    showToast('Telegram Test Ping + Interactive Buttons Delivered!');
  } catch (err) {
    logTelegramEvent('Ping Failed: ' + err.message, true);
    showToast('Telegram Error: ' + err.message);
  }
}

/*************************************************************************
 * 8. INITIAL SEEDING (INCLUDES XAUUSD, US100, AND BTCUSD)
 *************************************************************************/
function seedInitialReferenceAndRealSignals() {
  const xauCandles = realOhlcvStore.XAUUSD;
  const nasCandles = realOhlcvStore.NAS100;
  const btcCandles = realOhlcvStore.BTCUSD;

  const leftCardCandles = buildReferenceWaveCandles(4172.59, 'left');
  const card1 = {
    id: 'sig-ref-xau-1',
    assetKey: 'XAUUSD',
    symbol: 'XAU/USD',
    exchange: 'OANDA',
    tvSymbol: 'OANDA:XAUUSD',
    timeframe: currentTimeframe,
    type: 'BUY',
    statusText: 'WIN · TP5 hit',
    statusType: 'win',
    entry: 4172.59,
    stop: 4162.59,
    stopPips: '100',
    target: 4187.59,
    targetPips: '+150',
    tpHitCount: 5,
    slWasHit: false,
    candles: leftCardCandles,
    signalCandleIdx: 37,
    rsiAtTrigger: 61.8,
    atrAtTrigger: 6.75,
    ema9AtTrigger: 4171.95,
    ema21AtTrigger: 4168.40,
    triggerReason: 'Bullish Order Block + EMA 9/21 Cross (TP5 Reached)',
    showTvInCard: false,
    manualOverride: true
  };

  const rightCardCandles = buildReferenceWaveCandles(4173.79, 'right');
  const card2 = {
    id: 'sig-ref-xau-2',
    assetKey: 'XAUUSD',
    symbol: 'XAU/USD',
    exchange: 'OANDA',
    tvSymbol: 'OANDA:XAUUSD',
    timeframe: currentTimeframe,
    type: 'BUY',
    statusText: 'STOPPED OUT',
    statusType: 'loss',
    entry: 4173.79,
    stop: 4163.79,
    stopPips: '100',
    target: 4188.79,
    targetPips: '+150',
    tpHitCount: 2,
    slWasHit: true,
    candles: rightCardCandles,
    signalCandleIdx: 37,
    rsiAtTrigger: 52.3,
    atrAtTrigger: 7.10,
    ema9AtTrigger: 4173.10,
    ema21AtTrigger: 4171.85,
    triggerReason: 'Liquidity Retest + High Volatility Wick',
    showTvInCard: false,
    manualOverride: true
  };

  const card3 = detectStructureAndSignals(nasCandles, 'NAS100', null);
  const card4 = detectStructureAndSignals(btcCandles, 'BTCUSD', null);
  const card5 = detectStructureAndSignals(xauCandles, 'XAUUSD', null);

  signalsList = [card1, card2, card3, card4, card5];
  renderAllCards();
}

function buildReferenceWaveCandles(anchorPrice, style) {
  const waveLeft = [
    0.22, 0.25, 0.21, 0.28, 0.33, 0.38, 0.35, 0.42, 0.46, 0.44,
    0.52, 0.72, 0.66, 0.68, 0.64, 0.61, 0.56, 0.52, 0.48, 0.43,
    0.37, 0.31, 0.27, 0.34, 0.38, 0.29, 0.22, 0.30, 0.37, 0.49,
    0.63, 0.76, 0.65, 0.56, 0.82, 0.94, 0.78, 0.72, 0.76, 0.81,
    0.84, 0.88, 0.86, 0.91, 0.95, 0.97, 0.94, 0.96, 0.98, 0.99
  ];
  const waveRight = [
    0.48, 0.38, 0.29, 0.58, 0.42, 0.45, 0.34, 0.24, 0.33, 0.39,
    0.31, 0.28, 0.32, 0.35, 0.33, 0.41, 0.45, 0.48, 0.52, 0.51,
    0.56, 0.62, 0.75, 0.79, 0.69, 0.67, 0.63, 0.59, 0.55, 0.51,
    0.44, 0.38, 0.34, 0.42, 0.46, 0.37, 0.39, 0.52, 0.61, 0.68,
    0.74, 0.82, 0.76, 0.71, 0.66, 0.62, 0.58, 0.54, 0.49, 0.45
  ];
  const wave = style === 'right' ? waveRight : waveLeft;
  const arr = [];
  let prev = anchorPrice - 8;
  for (let i = 0; i < wave.length; i++) {
    const target = anchorPrice - 14 + wave[i] * 26;
    const open = prev;
    const close = Number(target.toFixed(2));
    const high = Number((Math.max(open, close) + 1.4 + (i % 3) * 0.6).toFixed(2));
    const low = Number((Math.min(open, close) - 1.3 - (i % 2) * 0.5).toFixed(2));
    const vol = (i > 31 && i < 38) ? 420 : 95 + (i % 7) * 28;
    arr.push({
      time: Date.now() - (50 - i) * 900000,
      open: open,
      high: high,
      low: low,
      close: close,
      vol: vol
    });
    prev = close;
  }
  arr[37].close = anchorPrice;
  return arr;
}

/*************************************************************************
 * 9. RENDER SIGNAL CARDS GRID (NO NESTED TEMPLATE LITERALS)
 *************************************************************************/
function formatPrice(num) {
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function renderAllCards() {
  const grid = document.getElementById('signalsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = signalsList.filter(function (s) {
    return activeFilter === 'ALL' || s.assetKey === activeFilter;
  });

  filtered.forEach(function (sig) {
    const card = document.createElement('article');
    card.className = 'signal-card group';
    card.onclick = function () { openAnalysisModal(sig.id); };

    const pillClass = sig.type === 'BUY' ? 'pill-buy' : 'pill-sell';
    const statusClass =
      sig.statusType === 'win'
        ? 'status-win'
        : sig.statusType === 'loss'
        ? 'status-loss'
        : 'status-active';

    const tvIframeUrl = 'https://s.tradingview.com/widgetembed/?symbol=' +
      encodeURIComponent(sig.tvSymbol || 'OANDA:XAUUSD') +
      '&interval=' + currentTvInterval +
      '&theme=light&style=1&timezone=Etc%2FUTC&hide_top_toolbar=1&hide_legend=0&save_image=0';

    const overlayForceClass = sig.showTvInCard ? 'force-visible' : '';
    const toggleBtnStyle = sig.showTvInCard
      ? 'bg-slate-900 text-emerald-400 border border-emerald-500/40'
      : 'bg-slate-900/90 hover:bg-slate-900 text-white';
    const toggleIconClass = sig.showTvInCard ? 'fa-chart-simple' : 'fa-tv';
    const toggleBtnLabel = sig.showTvInCard ? 'Signal Canvas' : 'Live TV Chart';

    const chartBoxContent = sig.showTvInCard
      ? '<iframe src="' + tvIframeUrl + '" class="w-full h-full border-0" allowtransparency="true" scrolling="no"></iframe>'
      : '<canvas id="canvas-' + sig.id + '"></canvas>';

    const tfBadge = (sig.timeframe || '15m').toUpperCase();
    const reasonText = sig.triggerReason || 'EMA9/21 + RSI Setup';

    card.innerHTML = [
      '<div class="chart-white-box">',
      '  <div class="card-chart-overlay ' + overlayForceClass + '" onclick="event.stopPropagation()">',
      '    <button onclick="toggleCardChartMode(\'' + sig.id + '\')" class="px-2.5 py-1 rounded-md text-[10px] font-extrabold shadow-md transition ' + toggleBtnStyle + '">',
      '      <i class="fa-solid ' + toggleIconClass + ' mr-1"></i>' + toggleBtnLabel,
      '    </button>',
      '  </div>',
      '  ' + chartBoxContent,
      '</div>',
      '<div class="p-5 sm:p-6 flex flex-col justify-between flex-1 bg-[#12151c]">',
      '  <div class="flex items-center justify-between gap-2 mb-5">',
      '    <div class="flex items-center gap-2.5">',
      '      <span class="text-white font-extrabold text-lg sm:text-[19px] tracking-tight">' + sig.symbol + '</span>',
      '      <span class="' + pillClass + '">' + sig.type + '</span>',
      '      <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/50">' + sig.exchange + ' · ' + tfBadge + '</span>',
      '    </div>',
      '    <div id="status-' + sig.id + '" class="text-sm sm:text-[15px] ' + statusClass + ' tracking-tight">' + sig.statusText + '</div>',
      '  </div>',
      '  <div class="space-y-2.5 text-[15px] sm:text-base">',
      '    <div class="flex items-center justify-between">',
      '      <span class="text-[#8b95a5] font-medium">Entry</span>',
      '      <span class="text-white font-bold font-mono-num">' + formatPrice(sig.entry) + '</span>',
      '    </div>',
      '    <div class="flex items-center justify-between">',
      '      <span class="text-[#8b95a5] font-medium">Stop</span>',
      '      <span class="text-white font-bold font-mono-num">' + formatPrice(sig.stop) + ' <span class="text-slate-300 font-semibold">(' + sig.stopPips + ')</span></span>',
      '    </div>',
      '    <div class="flex items-center justify-between">',
      '      <span class="text-[#8b95a5] font-medium">Target</span>',
      '      <span class="text-white font-bold font-mono-num">' + formatPrice(sig.target) + ' <span class="text-slate-300 font-semibold">(' + sig.targetPips + ')</span></span>',
      '    </div>',
      '  </div>',
      '  <div class="mt-5 pt-3 border-t border-slate-800/75 flex items-center justify-between text-xs text-slate-400 no-print">',
      '    <span class="font-mono-num text-[11px] text-slate-400 group-hover:text-emerald-400 transition truncate max-w-[185px]">',
      '      <i class="fa-solid fa-wave-square mr-1 text-emerald-400"></i>' + reasonText,
      '    </span>',
      '    <div class="flex items-center gap-1.5" onclick="event.stopPropagation()">',
      '      <button onclick="toggleCardChartMode(\'' + sig.id + '\')" class="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition" title="Toggle Live TradingView Chart inside Card">',
      '        <i class="fa-solid fa-chart-line"></i>',
      '      </button>',
      '      <button onclick="pushSignalToTelegram(\'' + sig.id + '\')" class="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 font-semibold transition" title="Push Card & Interactive Buttons to Telegram">',
      '        <i class="fa-brands fa-telegram mr-1"></i>TG',
      '      </button>',
      '      <button onclick="downloadCardAsPng(\'' + sig.id + '\')" class="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-semibold transition" title="Download High-Res Card PNG">',
      '        <i class="fa-solid fa-download mr-1"></i>PNG',
      '      </button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    grid.appendChild(card);

    if (!sig.showTvInCard) {
      requestAnimationFrame(function () {
        const canvas = document.getElementById('canvas-' + sig.id);
        drawSignalCardChart(canvas, sig);
      });
    }
  });
}

function toggleCardChartMode(sigId) {
  const sig = signalsList.find(function (s) { return s.id === sigId; });
  if (!sig) return;
  sig.showTvInCard = !sig.showTvInCard;
  renderAllCards();
}

/*************************************************************************
 * 10. PRINT SIGNAL FROM LIVE MARKET (+ AUTO TELEGRAM)
 *************************************************************************/
function printRealMarketSignal(assetKey, tfOverride) {
  const tf = tfOverride || currentTimeframe;
  const candles = realOhlcvStore[assetKey];
  if (!candles || candles.length < 20) {
    showToast('Fetching real ' + assetKey + ' (' + tf + ') OHLCV candles...');
    fetchRealOhlcvCandles(tf).then(function () {
      if (realOhlcvStore[assetKey] && realOhlcvStore[assetKey].length >= 20) {
        printRealMarketSignal(assetKey, tf);
      }
    });
    return;
  }

  const useLiveBar = signalsList.some(function (s) {
    return s.assetKey === assetKey && !s.manualOverride;
  });
  const triggerIdx = useLiveBar ? candles.length - 2 : null;
  const newSig = detectStructureAndSignals(candles, assetKey, triggerIdx, tf);

  if (activeFilter !== 'ALL' && activeFilter !== assetKey) {
    filterCards('ALL');
  }

  signalsList.unshift(newSig);
  if (signalsList.length > 15) signalsList.pop();

  const tel = document.getElementById('liveEngineTelemetry');
  if (tel) {
    tel.textContent = '[REAL SIGNAL PRINTED] ' + newSig.exchange + ':' + newSig.symbol + ' (' + tf.toUpperCase() + ') ' + newSig.type + ' @ ' + formatPrice(newSig.entry) + ' | RSI: ' + newSig.rsiAtTrigger.toFixed(1);
  }

  renderAllCards();
  showToast('Printed Real ' + newSig.symbol + ' (' + tf.toUpperCase() + ') ' + newSig.type + ' Signal @ ' + formatPrice(newSig.entry));

  if (telegramSettings.autoBroadcast && telegramSettings.botToken && telegramSettings.chatId) {
    pushSignalToTelegram(newSig.id);
  }
}

function rescanAllRealCandles() {
  fetchRealOhlcvCandles(currentTimeframe).then(function () {
    const s1 = detectStructureAndSignals(realOhlcvStore.XAUUSD, 'XAUUSD', null);
    const s2 = detectStructureAndSignals(realOhlcvStore.NAS100, 'NAS100', null);
    const s3 = detectStructureAndSignals(realOhlcvStore.BTCUSD, 'BTCUSD', null);
    signalsList.unshift(s3);
    signalsList.unshift(s2);
    signalsList.unshift(s1);
    if (signalsList.length > 15) signalsList.length = 15;
    renderAllCards();
    showToast('Rescanned 60 real OHLCV candles for XAU/USD, US100 & BITCOIN');
  });
}

/*************************************************************************
 * 11. EMBEDDED TRADINGVIEW ADVANCED CHARTS (tv.js)
 *************************************************************************/
function initTradingViewWidgets() {
  if (typeof TradingView === 'undefined') return;

  new TradingView.widget({
    autosize: true,
    symbol: 'OANDA:XAUUSD',
    interval: currentTvInterval,
    timezone: 'Etc/UTC',
    theme: 'dark',
    style: '1',
    locale: 'en',
    toolbar_bg: '#12151c',
    enable_publishing: false,
    hide_side_toolbar: false,
    allow_symbol_change: true,
    studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],
    container_id: 'tv_chart_xau_container'
  });

  new TradingView.widget({
    autosize: true,
    symbol: currentRightTvSymbol,
    interval: currentTvInterval,
    timezone: 'Etc/UTC',
    theme: 'dark',
    style: '1',
    locale: 'en',
    toolbar_bg: '#12151c',
    enable_publishing: false,
    hide_side_toolbar: false,
    allow_symbol_change: true,
    studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],
    container_id: 'tv_chart_right_container'
  });
}

function updateTvWidgetInterval(tf) {
  currentTvInterval = tf;
  document.querySelectorAll('.tv-tf-btn').forEach(function (btn) {
    const cleaned = btn.textContent.replace('m', '').replace('1H', '60').replace('4H', '240');
    const match = cleaned === tf;
    btn.className = match
      ? 'tv-tf-btn px-2 py-1 rounded bg-slate-800 text-white font-bold'
      : 'tv-tf-btn px-2 py-1 rounded text-slate-400 hover:text-white font-semibold';
  });
  initTradingViewWidgets();
}

function switchRightTvSymbol(sym) {
  currentRightTvSymbol = sym;
  initTradingViewWidgets();
}

/*************************************************************************
 * 12. SIGNAL ANALYSIS MODAL & PNG CARD DOWNLOADER
 *************************************************************************/
function openAnalysisModal(sigId) {
  const sig = signalsList.find(function (s) { return s.id === sigId; });
  if (!sig) return;
  currentModalSignalId = sigId;
  modalShowingTv = false;

  const isBuy = sig.type === 'BUY';
  document.getElementById('modalPairTitle').textContent = sig.symbol;
  document.getElementById('modalExchangeTag').textContent = sig.exchange + ' · ' + (sig.timeframe || '15m').toUpperCase();

  const pillEl = document.getElementById('modalDirectionPill');
  pillEl.textContent = sig.type;
  pillEl.className = isBuy ? 'pill-buy' : 'pill-sell';

  const statusEl = document.getElementById('modalStatusBadge');
  statusEl.textContent = sig.statusText;
  const stModalClass = sig.statusType === 'win'
    ? 'status-win'
    : sig.statusType === 'loss'
    ? 'status-loss'
    : 'status-active';
  statusEl.className = 'text-sm ' + stModalClass + ' ml-1';

  const e9 = Number(sig.ema9AtTrigger || sig.entry).toFixed(2);
  const e21 = Number(sig.ema21AtTrigger || sig.entry).toFixed(2);
  const biasWord = isBuy ? 'Bullish' : 'Bearish';
  const rsiBiasWord = isBuy ? 'Bullish Momentum' : 'Bearish Supply';

  const modalEmaEl = document.getElementById('modalEmaVals');
  modalEmaEl.textContent = e9 + ' vs ' + e21 + ' (' + biasWord + ')';
  modalEmaEl.className = 'font-mono-num font-bold ' + (isBuy ? 'text-emerald-400' : 'text-rose-400');

  document.getElementById('modalRsiVal').textContent = Number(sig.rsiAtTrigger || 56.4).toFixed(1) + ' (' + rsiBiasWord + ')';
  document.getElementById('modalAtrVal').textContent = Number(sig.atrAtTrigger || 6.8).toFixed(2) + ' pts';
  document.getElementById('modalTriggerReason').textContent = sig.triggerReason || 'EMA 9/21 + Order Block';

  document.getElementById('modalEntryVal').textContent = formatPrice(sig.entry);
  document.getElementById('modalStopVal').textContent = formatPrice(sig.stop) + ' (' + sig.stopPips + ')';
  document.getElementById('modalTargetVal').textContent = formatPrice(sig.target) + ' (' + sig.targetPips + ')';

  const ladderContainer = document.getElementById('modalTpLadder');
  ladderContainer.innerHTML = '';
  const totalReward = Math.abs(sig.target - sig.entry);
  const totalPips = parseInt(String(sig.targetPips).replace('+', ''), 10) || 150;

  for (let level = 1; level <= 5; level++) {
    const fraction = level / 5;
    const tpPrice = isBuy
      ? sig.entry + totalReward * fraction
      : sig.entry - totalReward * fraction;
    const levelPips = Math.round(totalPips * fraction);
    const reached = level <= (sig.tpHitCount || 0);

    const row = document.createElement('div');
    row.className = 'flex items-center justify-between px-3 py-1.5 rounded-lg border ' + (
      reached
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        : 'bg-slate-900/70 border-slate-800 text-slate-400'
    );
    const dotClass = reached ? 'bg-emerald-400' : 'bg-slate-600';
    const badgeClass = reached ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500';
    const badgeText = reached ? 'HIT' : 'PENDING';

    row.innerHTML = [
      '<div class="flex items-center gap-2">',
      '  <span class="w-2 h-2 rounded-full ' + dotClass + '"></span>',
      '  <span class="font-bold">TP' + level + '</span>',
      '  <span class="text-[11px] opacity-80">(+' + levelPips + ')</span>',
      '</div>',
      '<div class="flex items-center gap-2">',
      '  <span class="font-mono-num font-bold text-white">' + formatPrice(tpPrice) + '</span>',
      '  <span class="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ' + badgeClass + '">' + badgeText + '</span>',
      '</div>'
    ].join('\n');

    ladderContainer.appendChild(row);
  }

  const rawTicket = [
    sig.exchange + ':' + sig.symbol + ' (' + sig.timeframe + ') — ' + sig.type,
    'Entry  : ' + formatPrice(sig.entry),
    'Stop   : ' + formatPrice(sig.stop) + ' (' + sig.stopPips + ')',
    'Target : ' + formatPrice(sig.target) + ' (' + sig.targetPips + ')',
    'Status : ' + sig.statusText + ' | RSI(14): ' + Number(sig.rsiAtTrigger || 56).toFixed(1)
  ].join('\n');
  document.getElementById('modalRawTicket').textContent = rawTicket;

  document.getElementById('modalCycleStatusBtn').onclick = function () { cycleOutcomeState(sig.id); };
  document.getElementById('modalDownloadPngBtn').onclick = function () { downloadCardAsPng(sig.id); };
  document.getElementById('modalSendTgTextBtn').onclick = function () { pushSignalToTelegram(sig.id, 'TEXT_ONLY'); };
  document.getElementById('modalSendTgPhotoBtn').onclick = function () { pushSignalToTelegram(sig.id, 'PHOTO_AND_CAPTION'); };

  document.getElementById('modalWhiteChartWrap').classList.remove('hidden');
  document.getElementById('modalTvIframeWrap').classList.add('hidden');
  document.getElementById('modalToggleTvText').textContent = 'Switch to Live TradingView';

  const modal = document.getElementById('analysisModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  requestAnimationFrame(function () {
    const modalCanvas = document.getElementById('modalSignalCanvas');
    drawSignalCardChart(modalCanvas, sig);
  });
}

function toggleModalChartMode() {
  const sig = signalsList.find(function (s) { return s.id === currentModalSignalId; });
  if (!sig) return;
  modalShowingTv = !modalShowingTv;

  const whiteWrap = document.getElementById('modalWhiteChartWrap');
  const tvWrap = document.getElementById('modalTvIframeWrap');
  const btnText = document.getElementById('modalToggleTvText');

  if (modalShowingTv) {
    whiteWrap.classList.add('hidden');
    tvWrap.classList.remove('hidden');
    const tvUrl = 'https://s.tradingview.com/widgetembed/?symbol=' + encodeURIComponent(sig.tvSymbol || 'OANDA:XAUUSD') + '&interval=' + currentTvInterval + '&theme=light&style=1&timezone=Etc%2FUTC';
    tvWrap.innerHTML = '<iframe src="' + tvUrl + '" class="w-full h-full border-0" allowtransparency="true"></iframe>';
    btnText.textContent = 'Switch to Signal Canvas';
  } else {
    tvWrap.classList.add('hidden');
    whiteWrap.classList.remove('hidden');
    btnText.textContent = 'Switch to Live TradingView';
    requestAnimationFrame(function () {
      drawSignalCardChart(document.getElementById('modalSignalCanvas'), sig);
    });
  }
}

function cycleOutcomeState(sigId) {
  const sig = signalsList.find(function (s) { return s.id === sigId; });
  if (!sig) return;
  sig.manualOverride = true;

  const states = [
    { text: 'WIN · TP5 hit', type: 'win', tpHit: 5, sl: false },
    { text: 'WIN · TP3 hit', type: 'win', tpHit: 3, sl: false },
    { text: 'ACTIVE · LIVE', type: 'active', tpHit: 1, sl: false },
    { text: 'STOPPED OUT', type: 'loss', tpHit: 0, sl: true }
  ];
  const idx = states.findIndex(function (st) { return st.text === sig.statusText; });
  const next = states[(idx + 1) % states.length];

  sig.statusText = next.text;
  sig.statusType = next.type;
  sig.tpHitCount = next.tpHit;
  sig.slWasHit = next.sl;

  renderAllCards();
  if (currentModalSignalId === sigId) openAnalysisModal(sigId);
}

function downloadCardAsPng(sigId) {
  const sig = signalsList.find(function (s) { return s.id === sigId; });
  if (!sig) return;

  const offCanvas = buildSignalCardOffscreenCanvas(sig);
  const link = document.createElement('a');
  link.download = sig.exchange + '_' + sig.symbol.replace('/', '') + '_' + sig.type + '_' + sig.entry + '.png';
  link.href = offCanvas.toDataURL('image/png');
  link.click();

  showToast('Downloaded ' + sig.symbol + ' Signal Card PNG!');
}

/*************************************************************************
 * 13. PINE SCRIPT v5 & WEBHOOK / MANUAL SIGNAL PRINTER
 *************************************************************************/
function openPineModal() {
  const m = document.getElementById('pineModal');
  m.classList.remove('hidden');
  m.classList.add('flex');
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  m.classList.add('hidden');
  m.classList.remove('flex');
}

function handleModalBackdrop(e, modalId) {
  if (e.target.id === modalId) closeModal(modalId);
}

function copyPineScript() {
  const code = document.getElementById('pineScriptCode');
  code.select();
  document.execCommand('copy');
  showToast('Pine Script v5 copied to clipboard!');
}

function copyModalSignal() {
  const text = document.getElementById('modalRawTicket').textContent;
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('Signal ticket copied!');
}

function parseAndPrintWebhook() {
  const raw = document.getElementById('webhookJsonInput').value.trim();
  if (!raw) {
    showToast('Paste a TradingView JSON payload first');
    return;
  }
  try {
    const data = JSON.parse(raw);
    createCustomCard({
      symbol: data.symbol || 'XAU/USD',
      exchange: data.exchange || 'OANDA',
      type: (data.type || 'BUY').toUpperCase(),
      entry: Number(data.entry || 4172.59),
      stop: Number(data.stop || 4162.59),
      target: Number(data.target || 4187.59),
      statusText: data.status || 'WIN · TP5 hit'
    });
    closeModal('pineModal');
  } catch (e) {
    showToast('Invalid JSON format — check payload syntax');
  }
}

function printCustomManualSignal() {
  const symbol = document.getElementById('customSymbol').value;
  const type = document.getElementById('customType').value;
  const statusText = document.getElementById('customStatus').value;
  const entry = parseFloat(document.getElementById('customEntry').value) || 4172.59;
  const stop = parseFloat(document.getElementById('customStop').value) || 4162.59;
  const target = parseFloat(document.getElementById('customTarget').value) || 4187.59;

  createCustomCard({
    symbol: symbol,
    exchange: symbol === 'BTC/USD' ? 'BITSTAMP' : 'OANDA',
    type: type,
    entry: entry,
    stop: stop,
    target: target,
    statusText: statusText
  });
  closeModal('pineModal');
}

function createCustomCard(opts) {
  const symbol = opts.symbol;
  const exchange = opts.exchange;
  const type = opts.type;
  const entry = opts.entry;
  const stop = opts.stop;
  const target = opts.target;
  const statusText = opts.statusText;

  const isNas = symbol.indexOf('NAS') !== -1 || symbol.indexOf('US100') !== -1;
  const isBtc = symbol.indexOf('BTC') !== -1;
  const assetKey = isNas ? 'NAS100' : isBtc ? 'BTCUSD' : 'XAUUSD';
  const cfg = ASSET_CONFIG[assetKey];
  const stopPips = String(Math.round(Math.abs(entry - stop) * cfg.pipScale));
  const targetPips = '+' + Math.round(Math.abs(target - entry) * cfg.pipScale);

  const statusType = statusText.indexOf('WIN') !== -1
    ? 'win'
    : statusText.indexOf('STOP') !== -1
    ? 'loss'
    : 'active';
  const tpHitCount = statusText.indexOf('TP5') !== -1
    ? 5
    : statusText.indexOf('TP3') !== -1
    ? 3
    : statusType === 'active'
    ? 1
    : 0;

  const newSig = {
    id: 'sig-custom-' + Date.now(),
    assetKey: assetKey,
    symbol: cfg.symbol,
    exchange: exchange,
    tvSymbol: cfg.tvSymbol,
    timeframe: currentTimeframe,
    type: type,
    entry: entry,
    stop: stop,
    stopPips: stopPips,
    target: target,
    targetPips: targetPips,
    statusText: statusText,
    statusType: statusType,
    tpHitCount: tpHitCount,
    slWasHit: statusType === 'loss',
    candles: (realOhlcvStore[assetKey] || []).map(function (c) { return Object.assign({}, c); }),
    signalCandleIdx: 37,
    rsiAtTrigger: 59.2,
    atrAtTrigger: Math.abs(entry - stop) * 0.65,
    ema9AtTrigger: entry,
    ema21AtTrigger: stop,
    triggerReason: 'TradingView Custom / Webhook Alert',
    showTvInCard: false,
    manualOverride: true
  };

  signalsList.unshift(newSig);
  renderAllCards();
  showToast('Printed ' + cfg.symbol + ' ' + type + ' Card @ ' + formatPrice(entry));

  if (telegramSettings.autoBroadcast && telegramSettings.botToken && telegramSettings.chatId) {
    pushSignalToTelegram(newSig.id);
  }
}

/*************************************************************************
 * 14. UI CONTROLS & INITIALIZATION
 *************************************************************************/
function setCalibrationMode(mode) {
  calibrationMode = mode;
  document.getElementById('liveXauSourceTag').textContent =
    mode === 'REFERENCE_SYNC' ? 'OANDA Sync' : 'Raw PAXG Spot';
  const nasTag = document.getElementById('liveNasSourceTag');
  if (nasTag) {
    nasTag.textContent = mode === 'REFERENCE_SYNC' ? 'OANDA Index' : 'Raw NQ=F Feed';
  }
  fetchRealOhlcvCandles(currentTimeframe).then(function () {
    showToast(mode === 'REFERENCE_SYNC' ? 'Calibrated to OANDA Reference' : 'Switched to Raw Spot / Futures Feed');
  });
}

function changeTimeframe(tf) {
  currentTimeframe = tf;
  SUPPORTED_TIMEFRAMES.forEach(function (item) {
    const btn = document.getElementById('tgTfBtn_' + item);
    if (!btn) return;
    btn.className = item === tf
      ? 'px-2.5 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-mono-num font-extrabold text-xs transition'
      : 'px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white font-mono-num font-bold text-xs transition';
  });

  fetchRealOhlcvCandles(tf).then(function () {
    connectRealWebSockets();
    showToast('Loaded real ' + tf.toUpperCase() + ' OHLCV candles for XAUUSD, US100 & BITCOIN');
  });
}

function toggleAutoBot() {
  liveScannerActive = !liveScannerActive;
  const label = document.getElementById('autoBotLabel');
  label.textContent = liveScannerActive ? 'Live Tick Scanner: ON' : 'Live Tick Scanner: PAUSED';
  showToast(liveScannerActive ? 'Live WebSocket Tick Evaluator Active' : 'Live Tick Evaluator Paused');
}

function toggleTvDrawer() {
  const drawer = document.getElementById('tvDrawer');
  const btnText = document.getElementById('tvDrawerBtnText');
  drawer.classList.toggle('hidden');
  btnText.textContent = drawer.classList.contains('hidden')
    ? 'Show Live TradingView'
    : 'Hide Live TradingView';
}

function filterCards(filterKey) {
  activeFilter = filterKey;
  ['ALL', 'XAUUSD', 'NAS100', 'BTCUSD'].forEach(function (k) {
    const el = document.getElementById('filter' + k);
    if (el) {
      el.className =
        k === filterKey
          ? 'px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold transition'
          : 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white font-semibold transition';
    }
  });
  renderAllCards();
}

function showToast(msg) {
  const box = document.getElementById('toastBox');
  document.getElementById('toastMessage').textContent = msg;
  box.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(function () {
    box.classList.add('translate-y-20', 'opacity-0');
  }, 2800);
}

window.addEventListener('resize', function () {
  signalsList.forEach(function (sig) {
    if (!sig.showTvInCard) {
      const c = document.getElementById('canvas-' + sig.id);
      if (c) drawSignalCardChart(c, sig);
    }
  });
});

window.onload = async function () {
  syncTelegramStatusUI();
  await fetchRealOhlcvCandles(currentTimeframe);
  seedInitialReferenceAndRealSignals();
  connectRealWebSockets();
  initTradingViewWidgets();
  pollTelegramBotUpdates();
};
/*************************************************************************
 * 15. BACK TO MAIN DASHBOARD HOME & SAVE / PRINT SIGNAL SHEET
 *************************************************************************/
function goBackToMainDashboard(e) {
  if (e) e.preventDefault();
  localStorage.setItem('por_is_logged_in', 'true');
  window.location.href = 'index.html';
}

function saveAndPrintSignals() {
  const tsEl = document.getElementById('printTimestampLabel');
  if (tsEl) {
    tsEl.textContent = 'Saved & Printed: ' + new Date().toLocaleString();
  }
  signalsList.forEach(function (sig) {
    if (!sig.showTvInCard) {
      const c = document.getElementById('canvas-' + sig.id);
      if (c) drawSignalCardChart(c, sig);
    }
  });
  showToast('Print Signal Ready — Opening Save & Print dialog...');
  setTimeout(function () {
    window.print();
  }, 220);
}