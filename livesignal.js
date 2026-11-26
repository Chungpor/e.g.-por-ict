/* ===== Live Signal · XAU/USD (Full Support & Resistance + 500-Path Scenarios) =====
   Data  : Binance PAXGUSDT OHLCV candles (CORS-open) aligned to live XAU/USD Spot
           (gold-api.com -> goldprice.org -> Swissquote -> PAXGUSDT fallback)
   S/R   : 1) Classic Daily Pivots (R3, R2, R1, P, S1, S2, S3)
           2) Fibonacci Daily Pivots (0.382 / 0.618 / 1.000)
           3) Real-Time 1H Swing High / Swing Low Structure (fractal pivot clusters)
   Signal: 1H EMA20/EMA50 + Spot vs EMA20 + 1H RSI(14) + 15m Momentum + Spot vs Pivot
           + ATR(14) S/R-buffered Entry / SL / TP1 / TP2 + 500 Monte-Carlo 4H paths
   Educational analytics only — not financial advice. */
(function () {
  'use strict';

  var CFG = {
    paths: 500,
    horizonMin: 240,
    stepMin: 15,
    spotEveryMs: 20000,
    candlesEveryMs: 180000,
    maxPts: 5.5,
    analyzeUrl: 'https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD'
  };

  /* ---------- utilities ---------- */
  function fmt(v) {
    if (v === null || v === undefined || !isFinite(v)) return '--';
    return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function distStr(level, spot) {
    var d = level - spot;
    var pct = (d / spot) * 100;
    return (d >= 0 ? '+' : '') + d.toFixed(1) + ' (' + (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%)';
  }

  function ema(arr, n) {
    var k = 2 / (n + 1), e = arr[0];
    for (var i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
    return e;
  }

  function rsi(arr, n) {
    n = n || 14;
    if (arr.length <= n) return 50;
    var g = 0, l = 0, i, d;
    for (i = 1; i <= n; i++) {
      d = arr[i] - arr[i - 1];
      if (d >= 0) g += d; else l -= d;
    }
    g /= n; l /= n;
    for (i = n + 1; i < arr.length; i++) {
      d = arr[i] - arr[i - 1];
      g = (g * (n - 1) + Math.max(d, 0)) / n;
      l = (l * (n - 1) + Math.max(-d, 0)) / n;
    }
    return l === 0 ? 100 : 100 - 100 / (1 + g / l);
  }

  function atr14(candles) {
    if (!candles || candles.length < 16) return 10;
    var trs = [];
    for (var i = 1; i < candles.length; i++) {
      var cur = candles[i], prev = candles[i - 1];
      trs.push(Math.max(
        cur.h - cur.l,
        Math.abs(cur.h - prev.c),
        Math.abs(cur.l - prev.c)
      ));
    }
    var n = 14, sum = 0;
    for (var j = trs.length - n; j < trs.length; j++) sum += trs[j];
    return sum / n;
  }

  function stdev(a) {
    var m = a.reduce(function (s, x) { return s + x; }, 0) / a.length;
    return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / a.length);
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function gauss(rnd) {
    var u = 0, v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---------- Support & Resistance Engine ---------- */
  function clusterLevels(levels, tolPct) {
    if (!levels.length) return [];
    var sorted = levels.slice().sort(function (a, b) { return a - b; });
    var groups = [[sorted[0]]];
    for (var i = 1; i < sorted.length; i++) {
      var g = groups[groups.length - 1];
      var ref = g[g.length - 1];
      if (Math.abs(sorted[i] - ref) / ref <= tolPct) g.push(sorted[i]);
      else groups.push([sorted[i]]);
    }
    return groups.map(function (g) {
      return g.reduce(function (s, x) { return s + x; }, 0) / g.length;
    });
  }

  function findSwingSR(h1Candles, spot, classic) {
    var highs = [], lows = [];
    var k = 2; // 5-bar fractal swing
    for (var i = k; i < h1Candles.length - k; i++) {
      var isH = true, isL = true;
      for (var j = 1; j <= k; j++) {
        if (!(h1Candles[i].h >= h1Candles[i - j].h && h1Candles[i].h > h1Candles[i + j].h)) isH = false;
        if (!(h1Candles[i].l <= h1Candles[i - j].l && h1Candles[i].l < h1Candles[i + j].l)) isL = false;
      }
      if (isH) highs.push(h1Candles[i].h);
      if (isL) lows.push(h1Candles[i].l);
    }

    var allHi = clusterLevels(highs, 0.0018);
    var allLo = clusterLevels(lows, 0.0018);

    var resAbove = allHi.filter(function (v) { return v > spot * 1.0005; })
      .sort(function (a, b) { return a - b; });
    var supBelow = allLo.filter(function (v) { return v < spot * 0.9995; })
      .sort(function (a, b) { return b - a; });

    // Fill any missing slots with Classic Pivot levels so R1-R3 / S1-S3 are always populated
    var r1 = resAbove[0] || classic.r1;
    var r2 = resAbove[1] || Math.max(classic.r2, r1 + (classic.r2 - classic.r1));
    var r3 = resAbove[2] || Math.max(classic.r3, r2 + (classic.r3 - classic.r2));

    var s1 = supBelow[0] || classic.s1;
    var s2 = supBelow[1] || Math.min(classic.s2, s1 - (classic.s1 - classic.s2));
    var s3 = supBelow[2] || Math.min(classic.s3, s2 - (classic.s2 - classic.s3));

    return {
      r3: r3, r2: r2, r1: r1,
      p: (r1 + s1) / 2,
      s1: s1, s2: s2, s3: s3,
      nearestHigh: resAbove[0] || (allHi.length ? allHi[allHi.length - 1] : classic.r1),
      nearestLow: supBelow[0] || (allLo.length ? allLo[0] : classic.s1)
    };
  }

  function buildSRSets(day, h1Candles, spot) {
    var P = (day.h + day.l + day.c) / 3;
    var range = Math.max(day.h - day.l, spot * 0.004);

    var classic = {
      r3: day.h + 2 * (P - day.l),
      r2: P + range,
      r1: 2 * P - day.l,
      p: P,
      s1: 2 * P - day.h,
      s2: P - range,
      s3: day.l - 2 * (day.h - P)
    };

    var fib = {
      r3: P + 1.000 * range,
      r2: P + 0.618 * range,
      r1: P + 0.382 * range,
      p: P,
      s1: P - 0.382 * range,
      s2: P - 0.618 * range,
      s3: P - 1.000 * range
    };

    var swing = findSwingSR(h1Candles, spot, classic);

    return {
      classic: classic,
      fib: fib,
      swing: swing,
      pdh: day.h,
      pdl: day.l,
      swingHi: swing.nearestHigh,
      swingLo: swing.nearestLow
    };
  }

  /* ---------- Core Signal & Trade Levels Engine ---------- */
  function compute(c15Candles, c1hCandles, day, spot, mode) {
    var c15 = c15Candles.map(function (k) { return k.c; });
    var c1h = c1hCandles.map(function (k) { return k.c; });
    var srAll = buildSRSets(day, c1hCandles, spot);
    var sr = srAll[mode] || srAll.classic;
    var atr = atr14(c1hCandles);

    var bull = 0, bear = 0, add;

    // 1) 1H Trend: EMA20 vs EMA50
    var e20 = ema(c1h, 20), e50 = ema(c1h, 50);
    if (e20 > e50) bull += 1.5; else bear += 1.5;

    // 2) Spot vs 1H EMA20
    if (spot > e20) bull += 1; else bear += 1;

    // 3) 1H RSI(14)
    var r = rsi(c1h, 14);
    if (r >= 50) { add = clamp((r - 50) / 10, 0, 1.5); bull += add; }
    else { add = clamp((50 - r) / 10, 0, 1.5); bear += add; }

    // 4) 15m Short-Term Momentum (last 8 bars)
    var n = c15.length, back = c15[Math.max(0, n - 9)];
    var rets = [];
    for (var i = 1; i < n; i++) rets.push(Math.log(c15[i] / c15[i - 1]));
    var sig = clamp(stdev(rets.slice(-96)), 0.00005, 0.01);
    var mom = Math.log(spot / back) / (sig * Math.sqrt(8));
    if (mom >= 0) bull += clamp(mom / 2, 0, 1); else bear += clamp(-mom / 2, 0, 1);

    // 5) Spot vs Daily Pivot
    if (spot > sr.p) bull += 1; else bear += 1;

    bull = Math.round(bull * 10) / 10;
    bear = Math.round(bear * 10) / 10;
    var diff = bull - bear;
    var bias = diff > 0.8 ? 'Bullish' : (diff < -0.8 ? 'Bearish' : 'Neutral');
    var conf = Math.round(clamp(50 + Math.abs(diff) / CFG.maxPts * 46, 50, 96));

    // Zone classification relative to S/R
    var zone = { text: 'Mid-Range · Near Pivot', cls: '' };
    if (spot >= sr.r1) zone = { text: 'Testing / Above R1 Resistance', cls: 'is-res' };
    else if (spot <= sr.s1) zone = { text: 'Testing / Below S1 Support', cls: 'is-sup' };
    else if (Math.abs(sr.r1 - spot) <= atr * 0.45) zone = { text: 'Approaching R1 Resistance', cls: 'is-res' };
    else if (Math.abs(spot - sr.s1) <= atr * 0.45) zone = { text: 'Approaching S1 Support', cls: 'is-sup' };
    else if (spot > sr.p) zone = { text: 'Above Pivot · Bullish Territory', cls: 'is-sup' };
    else zone = { text: 'Below Pivot · Bearish Territory', cls: 'is-res' };

    // Actionable S/R Trade Levels (ATR-buffered)
    var trade;
    if (bias === 'Bullish') {
      var slB = Math.min(sr.s1 - atr * 0.3, spot - atr * 1.1);
      var riskB = Math.max(spot - slB, atr * 0.6);
      var tp1B = sr.r1 > spot + riskB * 0.8 ? sr.r1 : spot + riskB * 1.5;
      var tp2B = sr.r2 > tp1B + riskB * 0.5 ? sr.r2 : spot + riskB * 2.5;
      trade = {
        dir: 'BUY', cls: 'buy',
        note: 'Long bias targeting R1 / R2 resistance · SL below S1 support',
        entry: spot, sl: slB, tp1: tp1B, tp2: tp2B,
        rr: '1:' + ((tp1B - spot) / riskB).toFixed(1) + ' / 1:' + ((tp2B - spot) / riskB).toFixed(1)
      };
    } else if (bias === 'Bearish') {
      var slS = Math.max(sr.r1 + atr * 0.3, spot + atr * 1.1);
      var riskS = Math.max(slS - spot, atr * 0.6);
      var tp1S = sr.s1 < spot - riskS * 0.8 ? sr.s1 : spot - riskS * 1.5;
      var tp2S = sr.s2 < tp1S - riskS * 0.5 ? sr.s2 : spot - riskS * 2.5;
      trade = {
        dir: 'SELL', cls: 'sell',
        note: 'Short bias targeting S1 / S2 support · SL above R1 resistance',
        entry: spot, sl: slS, tp1: tp1S, tp2: tp2S,
        rr: '1:' + ((spot - tp1S) / riskS).toFixed(1) + ' / 1:' + ((spot - tp2S) / riskS).toFixed(1)
      };
    } else {
      trade = {
        dir: 'RANGE', cls: '',
        note: 'Balanced market — watch for breakout above R1 or breakdown below S1',
        entry: sr.p, sl: sr.s2, tp1: sr.r1, tp2: sr.s1,
        rr: 'Wait Break'
      };
    }

    // 500-Path Seeded Monte-Carlo over 4 Hours
    var steps = CFG.horizonMin / CFG.stepMin;
    var drift = (diff / CFG.maxPts) * 0.15 * sig;
    var seed = Math.floor(Date.now() / 300000) * 7919 + Math.round(spot);
    var rnd = mulberry32(seed);
    var ends = [];
    for (var p = 0; p < CFG.paths; p++) {
      var px = spot;
      for (var s = 0; s < steps; s++) px *= Math.exp(drift - 0.5 * sig * sig + sig * gauss(rnd));
      ends.push(px);
    }
    var thr = 0.4 * sig * Math.sqrt(steps) * spot;
    var up = [], mid = [], dn = [];
    ends.forEach(function (x) {
      if (x > spot + thr) up.push(x);
      else if (x < spot - thr) dn.push(x);
      else mid.push(x);
    });
    function avg(a, fb) {
      return a.length ? a.reduce(function (acc, x) { return acc + x; }, 0) / a.length : fb;
    }
    mid.sort(function (a, b) { return a - b; });
    var sc = {
      best:  { pct: Math.round(up.length / CFG.paths * 100), price: avg(up, spot + thr) },
      base:  { pct: 0, price: mid.length ? mid[Math.floor(mid.length / 2)] : spot },
      worst: { pct: Math.round(dn.length / CFG.paths * 100), price: avg(dn, spot - thr) }
    };
    sc.base.pct = clamp(100 - sc.best.pct - sc.worst.pct, 0, 100);

    var target = bias === 'Bullish' ? sr.r1 : (bias === 'Bearish' ? sr.s1 : null);
    var winner = bull >= bear ? 'bull' : 'bear';
    var text = bias === 'Neutral'
      ? 'Bulls and bears are balanced (' + bull.toFixed(1) + ' to ' + bear.toFixed(1) +
        '): XAU/USD is ranging between S1 ' + fmt(sr.s1) + ' and R1 ' + fmt(sr.r1) + '.'
      : 'The ' + winner + ' case wins ' + Math.max(bull, bear).toFixed(1) + ' to ' +
        Math.min(bull, bear).toFixed(1) + ': XAU/USD leans ' + bias.toLowerCase() +
        ' toward ' + (bias === 'Bullish' ? 'R1 ' : 'S1 ') + fmt(target) + ' (RSI ' + Math.round(r) + ').';

    return {
      bias: bias, conf: conf, bull: bull, bear: bear, text: text,
      sr: sr, srAll: srAll, atr: atr, rsi: r, zone: zone, trade: trade, sc: sc
    };
  }

  /* ---------- Live Data Fetchers ---------- */
  function getJSON(url, ms) {
    var ctrl = new AbortController();
    var id = setTimeout(function () { ctrl.abort(); }, ms || 6000);
    return fetch(url, { signal: ctrl.signal, cache: 'no-store' }).then(function (r) {
      clearTimeout(id);
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }, function (e) { clearTimeout(id); throw e; });
  }

  function klines(interval, limit) {
    var q = '/api/v3/klines?symbol=PAXGUSDT&interval=' + interval + '&limit=' + limit;
    return getJSON('https://api.binance.com' + q).catch(function () {
      return getJSON('https://data-api.binance.vision' + q);
    }).then(function (a) {
      if (!Array.isArray(a) || (a.length < 10 && interval !== '1d')) throw new Error('klines');
      return a.map(function (k) { return { t: +k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] }; });
    });
  }

  function fetchSpot() {
    // 1) gold-api.com (direct CORS)
    return getJSON('https://api.gold-api.com/price/XAU').then(function (j) {
      if (!(j && j.price > 0)) throw new Error('gold-api');
      return { price: +j.price, chgPct: null, src: 'gold-api' };
    }).catch(function () {
      // 2) goldprice.org
      return getJSON('https://data-asg.goldprice.org/dbXRates/USD').then(function (j) {
        var it = j && j.items && j.items[0];
        if (!(it && it.xauPrice > 0)) throw new Error('goldprice');
        return { price: +it.xauPrice, chgPct: isFinite(+it.pcXau) ? +it.pcXau : null, src: 'GoldPrice' };
      });
    }).catch(function () {
      // 3) Swissquote BBO mid
      return getJSON('https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD').then(function (d) {
        var p = d && d[0] && d[0].spreadProfilePrices && d[0].spreadProfilePrices[0];
        if (!(p && p.bid > 0 && p.ask > 0)) throw new Error('swissquote');
        return { price: (p.bid + p.ask) / 2, chgPct: null, src: 'Swissquote' };
      });
    });
  }

  /* ---------- UI Binding & Rendering ---------- */
  var root = document.getElementById('lsRoot');
  if (!root) { window.LiveSignal = { compute: compute }; return; }

  var $ = function (id) { return document.getElementById(id); };
  var state = { mode: 'classic', c15: null, c1h: null, day: null, spot: null, chgPct: null, src: '', at: 0 };
  var busy = false;

  function setStatus(ok, msg) {
    if ($('lsLive')) $('lsLive').classList.toggle('off', !ok);
    if ($('lsStamp')) $('lsStamp').textContent = msg;
  }

  function scaleCandles(arr, ratio) {
    return arr.map(function (k) {
      return { t: k.t, o: k.o * ratio, h: k.h * ratio, l: k.l * ratio, c: k.c * ratio };
    });
  }

  function renderView() {
    if (!state.c15 || !state.c1h || !state.day || !(state.spot > 0)) return;
    var last = state.c15[state.c15.length - 1].c;
    var ratio = state.spot / last;

    var c15 = scaleCandles(state.c15, ratio);
    var c1h = scaleCandles(state.c1h, ratio);
    var d = state.day;
    var day = { h: d.h * ratio, l: d.l * ratio, c: d.c * ratio };

    var sig = compute(c15, c1h, day, state.spot, state.mode);
    var sr = sig.sr;

    // Spot pill
    $('lsSpotPrice').textContent = '$' + fmt(state.spot);
    var chg = state.chgPct !== null ? state.chgPct : ((state.spot - day.c) / day.c) * 100;
    $('lsSpotChg').textContent = (chg >= 0 ? '▲ +' : '▼ ') + chg.toFixed(2) + '%';
    $('lsSpotChg').className = 'ls-spot-chg ' + (chg >= 0 ? 'up' : 'dn');

    // Headline & summary
    var cls = sig.bias === 'Bullish' ? 'up' : (sig.bias === 'Bearish' ? 'dn' : 'mid');
    $('lsHead').innerHTML = '<span class="ls-dir ' + cls + '">' + sig.bias + '</span> · ' + sig.conf + '% confidence';
    $('lsSub').textContent = sig.text;

    // Zone badge
    $('lsZoneBadge').textContent = sig.zone.text;
    $('lsZoneBadge').className = 'ls-zone-badge ' + sig.zone.cls;

    // Gauge (mapped S2 -> R2)
    $('lsG_S2').textContent = fmt(sr.s2);
    $('lsG_S1').textContent = fmt(sr.s1);
    $('lsG_P').textContent = fmt(sr.p);
    $('lsG_R1').textContent = fmt(sr.r1);
    $('lsG_R2').textContent = fmt(sr.r2);

    var span = (sr.r2 - sr.s2) || 1;
    var pos = function (v) { return clamp(((v - sr.s2) / span) * 100, 2, 98).toFixed(1) + '%'; };
    $('lsTickS1').style.left = pos(sr.s1);
    $('lsTickP').style.left = pos(sr.p);
    $('lsTickR1').style.left = pos(sr.r1);
    $('lsGaugeMarker').style.left = pos(state.spot);
    $('lsMarkerTip').textContent = fmt(state.spot);

    // Multi-tier S/R grid
    var map = [
      ['R3', sr.r3], ['R2', sr.r2], ['R1', sr.r1],
      ['S1', sr.s1], ['S2', sr.s2], ['S3', sr.s3]
    ];
    map.forEach(function (pair) {
      $('ls' + pair[0]).textContent = fmt(pair[1]);
      $('ls' + pair[0] + 'Dist').textContent = distStr(pair[1], state.spot);
    });
    $('lsPiv').textContent = fmt(sr.p);
    $('lsPivDist').textContent = distStr(sr.p, state.spot);

    // Liquidity levels
    $('lsPdh').textContent = fmt(sig.srAll.pdh);
    $('lsPdl').textContent = fmt(sig.srAll.pdl);
    $('lsSwingHi').textContent = fmt(sig.srAll.swingHi);
    $('lsSwingLo').textContent = fmt(sig.srAll.swingLo);

    // S/R Trade Levels Strip
    $('lsTradeDir').textContent = sig.trade.dir;
    $('lsTradeDir').className = 'ls-trade-badge ' + sig.trade.cls;
    $('lsTradeNote').textContent = sig.trade.note;
    $('lsRR').textContent = 'R:R ' + sig.trade.rr;
    $('lsEntry').textContent = fmt(sig.trade.entry);
    $('lsSL').textContent = fmt(sig.trade.sl);
    $('lsTP1').textContent = fmt(sig.trade.tp1);
    $('lsTP2').textContent = fmt(sig.trade.tp2);
    $('lsAtr').textContent = '$' + sig.atr.toFixed(2);

    // 500-Path Monte-Carlo scenarios
    ['best', 'base', 'worst'].forEach(function (k) {
      $('ls' + k + 'P').textContent = fmt(sig.sc[k].price);
      $('ls' + k + 'Pct').textContent = sig.sc[k].pct + '%';
      $('ls' + k + 'Bar').style.width = sig.sc[k].pct + '%';
    });

    $('lsFoot').textContent = 'Scenario odds from ' + CFG.paths + ' simulated price paths over ' +
      (CFG.horizonMin / 60) + ' hours · Source: ' + (state.src || 'Live Spot') + ' + PAXG OHLCV. Educational analytics only.';

    setStatus(true, 'Updated ' + new Date().toLocaleTimeString('en-GB'));
  }

  function loadCandles() {
    return Promise.all([klines('15m', 192), klines('1h', 120), klines('1d', 3)]).then(function (r) {
      state.c15 = r[0];
      state.c1h = r[1];
      state.day = r[2].length >= 2 ? r[2][r[2].length - 2] : r[2][r[2].length - 1];
      state.at = Date.now();
    });
  }

  function refresh(forceCandles) {
    if (busy) return;
    busy = true;
    var needCandles = forceCandles || !state.c15 || (Date.now() - state.at > CFG.candlesEveryMs);
    var pCandles = needCandles ? loadCandles() : Promise.resolve();

    pCandles
      .then(function () { return fetchSpot().catch(function () { return null; }); })
      .then(function (sp) {
        var lastClose = state.c15[state.c15.length - 1].c;
        if (sp && sp.price > 0) {
          state.spot = sp.price;
          state.chgPct = sp.chgPct;
          state.src = sp.src;
        } else {
          state.spot = lastClose;
          state.chgPct = null;
          state.src = 'Binance PAXG';
        }
        renderView();
      })
      .catch(function () {
        setStatus(false, 'Offline — retrying…');
        if (!state.c15) $('lsSub').innerHTML = '<span class="ls-err">Could not load live XAU/USD data. Retrying…</span>';
      })
      .then(function () { busy = false; });
  }

  // Mode tab switching (instant recalculation without waiting for network)
  var tabs = $('lsModeTabs');
  if (tabs) {
    tabs.querySelectorAll('.ls-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.querySelectorAll('.ls-mode-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.mode = btn.getAttribute('data-sr-mode') || 'classic';
        renderView();
      });
    });
  }

  var refBtn = $('lsRefreshBtn');
  if (refBtn) refBtn.addEventListener('click', function () { refresh(true); });

  if ($('lsAnalyze')) $('lsAnalyze').href = CFG.analyzeUrl;

  refresh(true);
  setInterval(function () { refresh(false); }, CFG.spotEveryMs);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(false); });

  window.LiveSignal = { compute: compute, refresh: refresh };
})();