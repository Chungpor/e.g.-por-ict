(() => {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const REST = 'https://data-api.binance.vision/api/v3';
    const WS = 'wss://data-stream.binance.vision/stream';
    const SWISSQUOTE_XAU = 'https://forex-data-feed.swissquote.com/public-quotes/bboquotes/instrument/XAU/USD';
    const TV_SCAN = 'https://scanner.tradingview.com/cfd/scan';

    // OANDA + Multi-Asset configuration
    const ASSETS = {
        XAUUSDT: {
            label: 'OANDA:XAUUSD',
            name: 'Gold Spot / U.S. Dollar · OANDA',
            short: 'Gold XAU/USD',
            src: 'OANDA Spot Synced',
            tv: 'OANDA:XAUUSD',
            oanda: 'XAU_USD',
            api: 'PAXGUSDT',
            dec: 2,
            cls: 'SAFE-HAVEN METAL · OANDA',
            news: 'gold price XAUUSD OANDA'
        },
        BTCUSDT: {
            label: 'OANDA:BTCUSD',
            name: 'Bitcoin / U.S. Dollar · OANDA',
            short: 'Bitcoin',
            src: 'OANDA / Spot Live',
            tv: 'OANDA:BTCUSD',
            oanda: 'BTC_USD',
            api: 'BTCUSDT',
            dec: 2,
            cls: 'CRYPTO ASSET',
            news: 'bitcoin price'
        },
        ETHUSDT: {
            label: 'OANDA:ETHUSD',
            name: 'Ethereum / U.S. Dollar · OANDA',
            short: 'Ethereum',
            src: 'OANDA / Spot Live',
            tv: 'OANDA:ETHUSD',
            oanda: 'ETH_USD',
            api: 'ETHUSDT',
            dec: 2,
            cls: 'CRYPTO ASSET',
            news: 'ethereum price'
        },
        SOLUSDT: {
            label: 'SOLUSDT',
            name: 'Solana · SOL/USD',
            short: 'Solana',
            src: 'Spot Live',
            tv: 'BINANCE:SOLUSDT',
            oanda: null,
            api: 'SOLUSDT',
            dec: 2,
            cls: 'CRYPTO ASSET',
            news: 'solana price'
        },
        BNBUSDT: {
            label: 'BNBUSDT',
            name: 'BNB · BNB/USD',
            short: 'BNB',
            src: 'Spot Live',
            tv: 'BINANCE:BNBUSDT',
            oanda: null,
            api: 'BNBUSDT',
            dec: 2,
            cls: 'CRYPTO ASSET',
            news: 'BNB binance coin'
        },
        XRPUSDT: {
            label: 'XRPUSDT',
            name: 'XRP · XRP/USD',
            short: 'XRP',
            src: 'Spot Live',
            tv: 'BINANCE:XRPUSDT',
            oanda: null,
            api: 'XRPUSDT',
            dec: 4,
            cls: 'CRYPTO ASSET',
            news: 'XRP ripple'
        },
        EURUSDT: {
            label: 'OANDA:EURUSD',
            name: 'Euro / U.S. Dollar · OANDA',
            short: 'EUR / USD',
            src: 'OANDA FX Live',
            tv: 'OANDA:EURUSD',
            oanda: 'EUR_USD',
            api: 'EURUSDT',
            dec: 4,
            cls: 'FX MAJOR · OANDA',
            news: 'EUR USD euro dollar'
        },
    };

    const SYMBOLS = Object.keys(ASSETS);
    const apiSym = (x) => ASSETS[x].api || x;
    const fromApi = (a) => SYMBOLS.find((x) => apiSym(x) === a) || a;

    const TF_SEC = { '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '4h': 14400, '1d': 86400 };
    const TV_INTERVAL = { '1m': '1', '5m': '5', '15m': '15', '30m': '30', '1h': '60', '4h': '240', '1d': 'D' };
    const OANDA_GRAN = { '1m': 'M1', '5m': 'M5', '15m': 'M15', '30m': 'M30', '1h': 'H1', '4h': 'H4', '1d': 'D' };
    const HORIZON_TF = { scalp: '15m', intraday: '1h', swing: '4h' };
    const horizonOf = (tf) => (TF_SEC[tf] <= 900 ? 'Scalp' : TF_SEC[tf] <= 3600 ? 'Intraday' : 'Swing');

    const store = {
        get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; } },
        set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} },
    };

    const state = {
        symbol: 'XAUUSDT',
        tf: '5m', // Default to 5m to match user's active scalping/intraday workflow
        chartMode: 'ai_canvas', // 'ai_canvas' (Unified OANDA-Synced Chart + AI Levels), 'oanda_tv', or 'combo'
        autoAi: true,
        autoTrade: false,
        rawCandles: [], // Unshifted raw candles
        candles: [],    // OANDA-calibrated candles
        loadId: 0,
        A: null,
        updatedAt: 0,
        oandaActive: false
    };

    // Real-time OANDA Spot Calibration state:
    // PAXGUSDT on Binance often trades $5–$10 away from true OANDA:XAUUSD spot.
    // `spotTargets` stores live true OANDA/Spot prices; `basisOffset` stores `trueSpot - rawProxyPrice`
    const rawQuotes = {};
    const quotes = {};
    const spotTargets = {};
    const basisOffsets = store.get('phumea-basis-offsets', { XAUUSDT: 0 });
    let manualBasisLock = store.get('phumea-manual-basis', false);

    let oandaCfg = store.get('phumea-oanda-cfg', { env: 'practice', accountId: '', token: '' });
    const getOandaHost = () => oandaCfg.env === 'live' ? 'https://api-fxtrade.oanda.com' : 'https://api-fxpractice.oanda.com';
    const hasOandaToken = () => Boolean(oandaCfg && oandaCfg.token && oandaCfg.token.trim().length > 10);

    const fmt = (n, d) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    const money = (n) => (n >= 0 ? '+' : '-') + '$' + fmt(Math.abs(n), 2);
    const round = (n, d) => Number(Number(n).toFixed(d));
    const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
    const setText = (id, t) => { const el = $(id); if (el) el.textContent = t; };
    const dec = () => ASSETS[state.symbol].dec;
    const f = (v) => fmt(v, dec());

    let toastTimer;
    function toast(msg, isError = false) {
        const el = $('toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.toggle('error', isError);
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
    }

    // ---------- OANDA Spot Calibration Engine (Eliminates PAXG vs OANDA $8 gap) ----------
    function getOffset(sym) {
        if (state.oandaActive && ASSETS[sym]?.oanda) return 0; // Direct OANDA v20 needs 0 offset
        return Number(basisOffsets[sym] || 0);
    }

    function applyOffsetToCandle(c, offset) {
        if (!offset) return { ...c };
        return {
            time: c.time,
            open: +(c.open + offset).toFixed(4),
            high: +(c.high + offset).toFixed(4),
            low: +(c.low + offset).toFixed(4),
            close: +(c.close + offset).toFixed(4),
            vol: c.vol,
            buy: c.buy
        };
    }

    function recalibrateCandles() {
        if (!state.rawCandles.length) return;
        const off = getOffset(state.symbol);
        state.candles = state.rawCandles.map((c) => applyOffsetToCandle(c, off));
        series.setData(state.candles.map(plain));
        volumeSeries.setData(state.candles.map(toVolBar));
        updateEmaSeries(state.candles);
        updateLegend(state.candles.at(-1));
        runAnalysis();
    }

    function updateBasisPill() {
        const pill = $('basisSyncPill');
        if (!pill) return;
        const off = getOffset(state.symbol);
        if (state.oandaActive) {
            pill.textContent = '● OANDA v20 DIRECT';
        } else if (state.symbol === 'XAUUSDT') {
            const sign = off >= 0 ? '+' : '';
            pill.textContent = `● OANDA SPOT SYNCED (${sign}${off.toFixed(2)})`;
            pill.title = `Calibrated to true OANDA:XAUUSD Spot (Basis adjustment: ${sign}$${off.toFixed(2)} vs PAXG). Click to fine-tune.`;
        } else {
            pill.textContent = '● LIVE SPOT SYNCED';
        }
    }

    // Fetch real-time OANDA:XAUUSD price from TradingView Scanner or Swissquote Institutional XAU/USD Feed
    async function syncTrueOandaSpot() {
        if (state.oandaActive || manualBasisLock) return;
        let trueGoldPrice = null, trueBid = null, trueAsk = null;

        // 1. Try TradingView CFD Scanner for exact OANDA:XAUUSD tick
        try {
            const res = await fetch(TV_SCAN, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
                body: JSON.stringify({
                    symbols: { tickers: ['OANDA:XAUUSD', 'OANDA:EURUSD'], query: { types: [] } },
                    columns: ['close', 'change', 'high', 'low', 'open']
                })
            });
            if (res.ok) {
                const json = await res.json();
                const xauRow = (json.data || []).find((r) => r.s === 'OANDA:XAUUSD');
                if (xauRow && xauRow.d && xauRow.d[0] > 1000) {
                    trueGoldPrice = +xauRow.d[0];
                    spotTargets.XAUUSDT = {
                        price: trueGoldPrice,
                        change: +xauRow.d[1] || 0,
                        high: +xauRow.d[2] || trueGoldPrice,
                        low: +xauRow.d[3] || trueGoldPrice
                    };
                }
            }
        } catch (e) { /* Next fallback */ }

        // 2. Try Swissquote Live Institutional Spot Gold BBO Feed (CORS-open JSON)
        if (!trueGoldPrice) {
            try {
                const res = await fetch(SWISSQUOTE_XAU);
                if (res.ok) {
                    const arr = await res.json();
                    const prices = arr?.[0]?.spreadProfilePrices;
                    if (prices && prices.length) {
                        trueBid = +prices[0].bid;
                        trueAsk = +prices[0].ask;
                        trueGoldPrice = (trueBid + trueAsk) / 2;
                        spotTargets.XAUUSDT = {
                            price: trueGoldPrice,
                            bid: trueBid,
                            ask: trueAsk
                        };
                    }
                }
            } catch (e) { /* Keep existing offset */ }
        }

        if (trueGoldPrice && rawQuotes.XAUUSDT?.price) {
            const newOff = +(trueGoldPrice - rawQuotes.XAUUSDT.price).toFixed(2);
            const prevOff = basisOffsets.XAUUSDT || 0;
            basisOffsets.XAUUSDT = newOff;
            store.set('phumea-basis-offsets', basisOffsets);
            updateBasisPill();

            // Refresh displayed XAUUSDT quote immediately with true OANDA spot price
            const rq = rawQuotes.XAUUSDT;
            const st = spotTargets.XAUUSDT || {};
            onCalibratedTicker(
                'XAUUSDT',
                trueGoldPrice,
                st.change ?? rq.change,
                st.high ?? (rq.high + newOff),
                st.low ?? (rq.low + newOff),
                trueBid ?? (trueGoldPrice - 0.10),
                trueAsk ?? (trueGoldPrice + 0.10)
            );

            // If offset shifted by more than $0.25, recalibrate candle series so chart matches OANDA price
            if (state.symbol === 'XAUUSDT' && Math.abs(newOff - prevOff) >= 0.25 && state.rawCandles.length) {
                recalibrateCandles();
            }
        }
    }
    setInterval(syncTrueOandaSpot, 3000);

    // Clickable Basis Sync Pill so user can also type an exact OANDA price to lock calibration anytime
    $('basisSyncPill')?.addEventListener('click', () => {
        const curPrice = quotes[state.symbol]?.price ?? state.candles.at(-1)?.close ?? 0;
        const input = prompt(
            `Calibrate ${ASSETS[state.symbol].label} Price (or type "auto" for automatic OANDA Spot sync):\nCurrent Chart Price: ${curPrice ? curPrice.toFixed(dec()) : '–'}`,
            manualBasisLock ? String(curPrice.toFixed(dec())) : 'auto'
        );
        if (input === null) return;
        if (input.trim().toLowerCase() === 'auto' || input.trim() === '') {
            manualBasisLock = false;
            store.set('phumea-manual-basis', false);
            toast('Automatic OANDA:XAUUSD Spot calibration enabled.');
            syncTrueOandaSpot();
            return;
        }
        const target = parseFloat(input.replace(/,/g, ''));
        const rawP = rawQuotes[state.symbol]?.price ?? state.rawCandles.at(-1)?.close;
        if (!isNaN(target) && target > 0 && rawP) {
            manualBasisLock = true;
            store.set('phumea-manual-basis', true);
            basisOffsets[state.symbol] = +(target - rawP).toFixed(4);
            store.set('phumea-basis-offsets', basisOffsets);
            updateBasisPill();
            recalibrateCandles();
            const rq = rawQuotes[state.symbol];
            if (rq) {
                const off = basisOffsets[state.symbol];
                onCalibratedTicker(state.symbol, rq.price + off, rq.change, rq.high + off, rq.low + off);
            }
            toast(`Calibrated ${ASSETS[state.symbol].label} to ${fmt(target, dec())}!`);
        }
    });

    // ---------- Ticker + watchlist ----------
    SYMBOLS.forEach((s) => {
        const a = ASSETS[s];
        const t = document.createElement('div');
        t.className = 'ticker-item';
        t.dataset.sym = s;
        t.innerHTML = `<span class="asset">${a.label}</span><span class="price">–</span><span class="change">–</span>`;
        t.addEventListener('click', () => selectSymbol(s));
        $('marketTicker').append(t);

        const li = document.createElement('li');
        li.dataset.sym = s;
        li.tabIndex = 0;
        li.classList.toggle('active', s === state.symbol);
        li.innerHTML = `<span>${a.short}</span> <strong class="price">–</strong>`;
        li.addEventListener('click', () => selectSymbol(s));
        li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectSymbol(s); } });
        $('assetList').append(li);
    });

    // Sync active timeframe button UI on boot
    document.querySelectorAll('#tfSelector .tf-btn').forEach((b) => b.classList.toggle('active', b.dataset.tf === state.tf));

    // ---------- Real-Time OANDA TradingView Chart ----------
    function renderTradingViewChart() {
        const box = $('tvContainer');
        if (!box) return;
        const isLight = document.documentElement.dataset.theme === 'light';
        const tvSym = ASSETS[state.symbol].tv || 'OANDA:XAUUSD';
        const interval = TV_INTERVAL[state.tf] || '5';

        box.innerHTML = '<div id="tv_chart_inner" style="width:100%;height:100%;"></div>';
        if (window.TradingView && typeof window.TradingView.widget === 'function') {
            new window.TradingView.widget({
                autosize: true,
                symbol: tvSym,
                interval: interval,
                timezone: 'Etc/UTC',
                theme: isLight ? 'light' : 'dark',
                style: '1',
                locale: 'en',
                enable_publishing: false,
                backgroundColor: isLight ? '#ffffff' : '#0d1513',
                gridColor: isLight ? 'rgba(22, 26, 34, 0.06)' : 'rgba(132, 142, 156, 0.10)',
                hide_top_toolbar: false,
                hide_legend: false,
                save_image: false,
                container_id: 'tv_chart_inner',
                studies: [
                    'RSI@tv-basicstudies',
                    'MASimple@tv-basicstudies'
                ]
            });
        } else {
            const src = `https://s.tradingview.com/widgetembed/?frameElementId=tv_embed&symbol=${encodeURIComponent(tvSym)}&interval=${interval}&hidesidetoolbar=0&symboledit=1&saveimage=0&toolbarbg=f1f3f6&studies=%5B%5D&theme=${isLight ? 'light' : 'dark'}&style=1&timezone=Etc%2FUTC`;
            box.innerHTML = `<iframe src="${src}" allowtransparency="true" scrolling="no" allowfullscreen></iframe>`;
        }
    }

    // ---------- Unified OANDA-Synced Lightweight Chart (Candles + Volume + EMA + AI Levels) ----------
    const chartContainer = $('chartContainer');
    const chart = LightweightCharts.createChart(chartContainer, {
        autoSize: true,
        layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#848e9c' },
        grid: { vertLines: { color: 'rgba(132,142,156,0.10)' }, horzLines: { color: 'rgba(132,142,156,0.10)' } },
        crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
        rightPriceScale: {
            borderColor: 'rgba(132,142,156,0.28)',
            scaleMargins: { top: 0.10, bottom: 0.22 }
        },
        timeScale: {
            borderColor: 'rgba(132,142,156,0.28)',
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 6,
            barSpacing: 9,
            minBarSpacing: 4
        },
    });

    const series = chart.addCandlestickSeries({
        upColor: '#0ecb81', downColor: '#f6465d',
        borderUpColor: '#0ecb81', borderDownColor: '#f6465d',
        wickUpColor: '#0ecb81', wickDownColor: '#f6465d',
    });

    // TradingView-style Volume Histogram at bottom 18% of chart
    const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
        lastValueVisible: false,
        priceLineVisible: false
    });
    chart.priceScale('vol').applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 }
    });

    const ema20Series = chart.addLineSeries({ color: 'rgba(77, 141, 255, 0.85)', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    const ema50Series = chart.addLineSeries({ color: 'rgba(242, 179, 61, 0.85)', lineWidth: 2, priceLineVisible: false, lastValueVisible: false });

    const plain = (c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close });
    const toVolBar = (c) => ({
        time: c.time,
        value: c.vol || 0,
        color: c.close >= c.open ? 'rgba(14, 203, 129, 0.38)' : 'rgba(246, 70, 93, 0.38)'
    });
    const toCandle = (k) => ({ time: Math.floor(k[0] / 1000), open: +k[1], high: +k[2], low: +k[3], close: +k[4], vol: +k[5], buy: +k[9] });

    // Properly zoom to the latest 65 candles so candles are wide, crisp, and match TradingView's viewport
    function resetChartZoom() {
        const len = state.candles.length;
        if (!len) return;
        chart.timeScale().applyOptions({ rightOffset: 6, barSpacing: 9 });
        chart.timeScale().setVisibleLogicalRange({
            from: Math.max(0, len - 65),
            to: len + 5
        });
    }

    $('resetZoomBtn')?.addEventListener('click', resetChartZoom);

    // Ensure resizing never squishes candles
    if (window.ResizeObserver && chartContainer) {
        let prevW = 0;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect?.width || 0;
            if (w > 100 && Math.abs(w - prevW) > 40) {
                prevW = w;
                resetChartZoom();
            }
        });
        ro.observe(chartContainer);
    }

    let ema20Map = {}, ema50Map = {};
    function updateEmaSeries(rows) {
        if (!rows || rows.length < 50) return;
        const closes = rows.map((r) => r.close);
        const e20 = ema(closes, 20);
        const e50 = ema(closes, 50);
        ema20Map = {};
        ema50Map = {};
        ema20Series.setData(rows.map((r, i) => { ema20Map[r.time] = e20[i]; return { time: r.time, value: e20[i] }; }));
        ema50Series.setData(rows.map((r, i) => { ema50Map[r.time] = e50[i]; return { time: r.time, value: e50[i] }; }));
    }

    function updateLegend(c) {
        if (!c) return;
        const d = dec();
        setText('legSym', `${ASSETS[state.symbol].name} · ${state.tf}`);
        setText('legO', fmt(c.open, d));
        setText('legH', fmt(c.high, d));
        setText('legL', fmt(c.low, d));
        setText('legC', fmt(c.close, d));
        if (ema20Map[c.time]) setText('legEma20', fmt(ema20Map[c.time], d));
        if (ema50Map[c.time]) setText('legEma50', fmt(ema50Map[c.time], d));
    }

    chart.subscribeCrosshairMove((param) => {
        if (!param || !param.time || !param.seriesData) {
            if (state.candles.length) updateLegend(state.candles.at(-1));
            return;
        }
        const bar = param.seriesData.get(series);
        if (bar) updateLegend(bar);
    });

    let priceLines = [];
    function drawLines(L, A) {
        priceLines.forEach((l) => series.removePriceLine(l));
        priceLines = [];
        const defs = [
            ['AI ENTRY', L.entry, '#4d8dff', 2],
            ['STOP LOSS', L.sl, '#f6465d', 0],
            ['TP1', L.tps[0], '#0ecb81', 2],
            ['TP2', L.tps[1], '#0ecb81', 2],
            ['TP3', L.tps[2], '#0ecb81', 2]
        ];
        if (A) {
            if (A.fib?.level) defs.push(['FIB 61.8%', A.fib.level, '#f2b33d', 3]);
            if (A.bullOB) defs.push(['BULL OB', (A.bullOB.lo + A.bullOB.hi) / 2, '#0ecb81', 3]);
            if (A.bearOB) defs.push(['BEAR OB', (A.bearOB.lo + A.bearOB.hi) / 2, '#f6465d', 3]);
        }
        defs.forEach(([title, price, color, lineStyle]) =>
            priceLines.push(series.createPriceLine({ price, color, lineWidth: 1, lineStyle, axisLabelVisible: true, title })));
    }

    // ---------- OANDA v20 Direct REST Fetchers + Automatic Fallback ----------
    async function fetchOandaCandles(oandaInstrument, tf) {
        const gran = OANDA_GRAN[tf] || 'M5';
        const url = `${getOandaHost()}/v3/instruments/${oandaInstrument}/candles?count=300&price=M&granularity=${gran}`;
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${oandaCfg.token.trim()}`,
                'Accept-Datetime-Format': 'UNIX'
            }
        });
        if (!res.ok) throw new Error('OANDA HTTP ' + res.status);
        const data = await res.json();
        if (!data.candles || !data.candles.length) throw new Error('Empty OANDA candles');
        return data.candles.map((c) => {
            const o = +c.mid.o, h = +c.mid.h, l = +c.mid.l, cl = +c.mid.c, v = +(c.volume || 100);
            const ratio = h > l ? (cl - l) / (h - l) : 0.5;
            return {
                time: Math.floor(parseFloat(c.time)),
                open: o,
                high: h,
                low: l,
                close: cl,
                vol: v,
                buy: v * (0.35 + 0.3 * ratio)
            };
        });
    }

    async function fetchCandles(symbol, tf) {
        const asset = ASSETS[symbol];
        if (hasOandaToken() && asset.oanda) {
            try {
                const rows = await fetchOandaCandles(asset.oanda, tf);
                state.oandaActive = true;
                updateOandaBadge();
                return rows;
            } catch (e) {
                console.warn('OANDA v20 candle fetch failed, falling back to OANDA-calibrated Spot stream:', e.message);
                state.oandaActive = false;
                updateOandaBadge();
            }
        } else {
            state.oandaActive = false;
            updateOandaBadge();
        }
        const res = await fetch(`${REST}/klines?symbol=${apiSym(symbol)}&interval=${tf}&limit=300`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return (await res.json()).map(toCandle);
    }

    async function pollOandaPricing() {
        if (!hasOandaToken()) return;
        const asset = ASSETS[state.symbol];
        if (!asset.oanda) return;
        try {
            if (oandaCfg.accountId && oandaCfg.accountId.trim()) {
                const instruments = SYMBOLS.map((s) => ASSETS[s].oanda).filter(Boolean).join(',');
                const url = `${getOandaHost()}/v3/accounts/${encodeURIComponent(oandaCfg.accountId.trim())}/pricing?instruments=${encodeURIComponent(instruments)}`;
                const res = await fetch(url, { headers: { 'Authorization': `Bearer ${oandaCfg.token.trim()}` } });
                if (res.ok) {
                    const data = await res.json();
                    (data.prices || []).forEach((p) => {
                        const sym = SYMBOLS.find((s) => ASSETS[s].oanda === p.instrument);
                        if (!sym || !p.bids?.length || !p.asks?.length) return;
                        const bid = +p.bids[0].price, ask = +p.asks[0].price, mid = (bid + ask) / 2;
                        const prev = quotes[sym] || {};
                        const open24 = prev.open24 || (state.candles.length ? state.candles[0].open : mid);
                        const chg = open24 ? ((mid - open24) / open24) * 100 : (prev.change || 0);
                        onCalibratedTicker(sym, mid, chg, Math.max(prev.high || mid, mid), Math.min(prev.low || mid, mid), bid, ask);
                    });
                    state.oandaActive = true;
                    updateOandaBadge();
                    return;
                }
            }
        } catch (err) { /* Silent fallback */ }
    }
    setInterval(pollOandaPricing, 2500);

    function updateOandaBadge() {
        const btn = $('openOandaBtn');
        const txt = $('oandaStatusText');
        if (!btn || !txt) return;
        if (hasOandaToken() && state.oandaActive) {
            btn.classList.add('connected');
            txt.textContent = `OANDA v20 LIVE (${oandaCfg.env.toUpperCase()})`;
        } else {
            btn.classList.add('connected');
            txt.textContent = 'OANDA: Spot Calibrated';
        }
        updateBasisPill();
    }

    async function loadCandles() {
        const id = ++state.loadId;
        const { symbol, tf } = state;
        renderTradingViewChart();
        try {
            const rawRows = await fetchCandles(symbol, tf);
            if (id !== state.loadId) return;
            state.rawCandles = rawRows;

            // Update rawQuotes with latest raw close so OANDA spot calibration has an anchor
            if (rawRows.length) {
                const lastRaw = rawRows.at(-1).close;
                if (!rawQuotes[symbol]) rawQuotes[symbol] = { price: lastRaw, change: 0, high: lastRaw, low: lastRaw };
                else rawQuotes[symbol].price = lastRaw;
            }

            // Sync with OANDA spot before rendering
            await syncTrueOandaSpot();

            const off = getOffset(symbol);
            const rows = rawRows.map((c) => applyOffsetToCandle(c, off));
            state.candles = rows;

            const d = ASSETS[symbol].dec;
            series.applyOptions({ priceFormat: { type: 'price', precision: d, minMove: 1 / 10 ** d } });
            series.setData(rows.map(plain));
            volumeSeries.setData(rows.map(toVolBar));
            updateEmaSeries(rows);
            updateLegend(rows.at(-1));
            resetChartZoom();

            setText('oandaPaneTitle', `${ASSETS[symbol].tv || ASSETS[symbol].label} · ${tf.toUpperCase()} LIVE`);
            setText('aiPaneTitle', `${ASSETS[symbol].label} · UNIFIED AI LEVELS CHART (${tf.toUpperCase()})`);
            updateBasisPill();
            runAnalysis();
            subscribeKline();
            loadNews();
        } catch (err) {
            toast('Could not load live candles. Check your connection.', true);
        }
    }

    // ---------- Indicator math ----------
    const sma = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
    function ema(values, n) {
        const k = 2 / (n + 1), out = [];
        values.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
        return out;
    }
    function rsi(values, n = 14) {
        if (values.length <= n) return 50;
        let g = 0, l = 0;
        for (let i = 1; i <= n; i++) { const d = values[i] - values[i - 1]; d > 0 ? g += d : l -= d; }
        g /= n; l /= n;
        for (let i = n + 1; i < values.length; i++) {
            const d = values[i] - values[i - 1];
            g = (g * (n - 1) + Math.max(d, 0)) / n;
            l = (l * (n - 1) + Math.max(-d, 0)) / n;
        }
        return l === 0 ? 100 : 100 - 100 / (1 + g / l);
    }
    function atr(c, n = 14) {
        const tr = [];
        for (let i = 1; i < c.length; i++) tr.push(Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close)));
        return sma(tr.slice(-n));
    }
    function adx(c, n = 14) {
        if (c.length < n * 2 + 2) return 20;
        let tr = 0, pdm = 0, mdm = 0;
        const dxs = [];
        for (let i = 1; i < c.length; i++) {
            const up = c[i].high - c[i - 1].high, dn = c[i - 1].low - c[i].low;
            const t = Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close));
            const p = up > dn && up > 0 ? up : 0, m = dn > up && dn > 0 ? dn : 0;
            if (i <= n) { tr += t; pdm += p; mdm += m; } else { tr += t - tr / n; pdm += p - pdm / n; mdm += m - mdm / n; }
            if (i >= n) { const pi = 100 * pdm / tr, mi = 100 * mdm / tr; dxs.push(100 * Math.abs(pi - mi) / ((pi + mi) || 1)); }
        }
        let a = sma(dxs.slice(0, n));
        for (let i = n; i < dxs.length; i++) a = (a * (n - 1) + dxs[i]) / n;
        return a;
    }
    function pivots(c, k = 3) {
        const hi = [], lo = [];
        for (let i = k; i < c.length - k; i++) {
            let h = true, l = true;
            for (let j = 1; j <= k; j++) {
                if (c[i].high <= c[i - j].high || c[i].high <= c[i + j].high) h = false;
                if (c[i].low >= c[i - j].low || c[i].low >= c[i + j].low) l = false;
            }
            if (h) hi.push({ i, p: c[i].high });
            if (l) lo.push({ i, p: c[i].low });
        }
        return { hi, lo };
    }

    // ---------- The analysis engine ----------
    function computeAnalysis(c, playbook = 'auto') {
        const n = c.length, price = c[n - 1].close, closes = c.map((x) => x.close);
        const e20 = ema(closes, 20)[n - 1], e50 = ema(closes, 50)[n - 1];
        const r = rsi(closes), a = atr(c), ad = adx(c);
        const m12 = ema(closes, 12), m26 = ema(closes, 26), ml = m12.map((v, i) => v - m26[i]);
        const hist = ml[n - 1] - ema(ml, 9)[n - 1];
        const atrPrev = atr(c.slice(0, -14));
        const volRegime = a < atrPrev * 0.9 ? 'CONTRACTING VOL' : a > atrPrev * 1.1 ? 'EXPANDING VOL' : 'STABLE VOL';
        const atrs = [];
        for (let i = n - 100; i < n; i++) if (i > 20) atrs.push(atr(c.slice(0, i + 1)) / c[i].close);
        const riskScore = Math.round(100 * atrs.filter((x) => x <= atrs[atrs.length - 1]).length / atrs.length);

        const { hi, lo } = pivots(c);
        let structure = 'range';
        if (hi.length > 1 && lo.length > 1) {
            const hh = hi[hi.length - 1].p > hi[hi.length - 2].p, hl = lo[lo.length - 1].p > lo[lo.length - 2].p;
            structure = hh && hl ? 'up' : !hh && !hl ? 'down' : 'range';
        }
        const lastHigh = hi.length ? hi[hi.length - 1].p : Math.max(...c.slice(-30).map((x) => x.high));
        const lastLow = lo.length ? lo[lo.length - 1].p : Math.min(...c.slice(-30).map((x) => x.low));

        let bullOB = null, bearOB = null;
        for (let i = n - 2; i > n - 90 && i > 1; i--) {
            const body = c[i].close - c[i].open;
            if (!bullOB && body > 1.5 * a && c[i - 1].close < c[i - 1].open && price >= c[i - 1].low) bullOB = { lo: c[i - 1].low, hi: c[i - 1].high };
            if (!bearOB && -body > 1.5 * a && c[i - 1].close > c[i - 1].open && price <= c[i - 1].high) bearOB = { lo: c[i - 1].low, hi: c[i - 1].high };
            if (bullOB && bearOB) break;
        }
        let fvgB = null, fvgS = null;
        for (let i = n - 1; i > 2 && i > n - 70; i--) {
            if (!fvgB && c[i - 2].high < c[i].low && c.slice(i + 1).every((x) => x.low > c[i - 2].high)) fvgB = { lo: c[i - 2].high, hi: c[i].low };
            if (!fvgS && c[i - 2].low > c[i].high && c.slice(i + 1).every((x) => x.high < c[i].high + (c[i - 2].low - c[i].high))) fvgS = { lo: c[i].high, hi: c[i - 2].low };
            if (fvgB && fvgS) break;
        }
        const win = c.slice(-80);
        const swHi = Math.max(...win.map((x) => x.high)), swLo = Math.min(...win.map((x) => x.low));
        const upSwing = win.findIndex((x) => x.low === swLo) < win.findIndex((x) => x.high === swHi);
        const fibLevel = upSwing ? swHi - 0.618 * (swHi - swLo) : swLo + 0.618 * (swHi - swLo);
        const fib = { level: fibLevel, up: upSwing, testing: Math.abs(price - fibLevel) < 0.6 * a };

        let pat = null;
        for (let i = n - 1; i >= n - 3 && !pat; i--) {
            const k = c[i], p = c[i - 1], body = Math.abs(k.close - k.open), rng = k.high - k.low || 1e-9;
            const up = k.high - Math.max(k.open, k.close), lw = Math.min(k.open, k.close) - k.low, ago = n - 1 - i;
            if (body > 0 && up > 2 * body && lw < body * 0.6) pat = { tone: 'bear', name: 'Shooting star / long upper wick', text: `Rejection wick from ${f(k.high)}: longs got sold into at the highs.`, ago };
            else if (body > 0 && lw > 2 * body && up < body * 0.6) pat = { tone: 'bull', name: 'Hammer / long lower wick', text: `Buyers rejected prices down to ${f(k.low)}: shorts got squeezed at the lows.`, ago };
            else if (k.close > k.open && p.close < p.open && k.close > p.open && k.open < p.close) pat = { tone: 'bull', name: 'Bullish engulfing', text: 'The latest candle fully covers the prior red body: buyers took control.', ago };
            else if (k.close < k.open && p.close > p.open && k.close < p.open && k.open > p.close) pat = { tone: 'bear', name: 'Bearish engulfing', text: 'The latest candle fully covers the prior green body: sellers took control.', ago };
            else if (body < rng * 0.1) pat = { tone: 'neu', name: 'Doji', text: 'Open and close are nearly equal: the market is undecided.', ago };
        }
        const last20 = c.slice(-20), vol = last20.reduce((s, x) => s + x.vol, 0);
        const flow = vol ? last20.reduce((s, x) => s + x.buy, 0) / vol : 0.5;

        const tw = playbook === 'trend' ? 1.5 : playbook === 'reversal' ? 0.7 : 1;
        const rw = playbook === 'reversal' ? 1.5 : playbook === 'trend' ? 0.7 : 1;
        const near = (o) => Math.abs(price - (o.lo + o.hi) / 2);
        let obV = 0;
        if (bullOB && price - bullOB.hi < 3 * a) obV = 1;
        if (bearOB && bearOB.lo - price < 3 * a && (!obV || near(bearOB) < near(bullOB))) obV = -1;
        let fvgV = 0;
        if (fvgB && fvgS) fvgV = near(fvgB) < near(fvgS) ? 1 : -1; else if (fvgB) fvgV = 1; else if (fvgS) fvgV = -1;
        const signals = [
            { k: 'structure', v: structure === 'up' ? 1 : structure === 'down' ? -1 : 0, w: 2 * tw },
            { k: 'ema', v: e20 > e50 ? 1 : -1, w: 1.5 * tw },
            { k: 'px', v: price > e20 ? 1 : -1, w: 0.5 * tw },
            { k: 'macd', v: hist > 0 ? 1 : -1, w: tw },
            { k: 'rsi', v: r > 70 ? -1 : r < 30 ? 1 : 0, w: rw },
            { k: 'ob', v: obV, w: rw },
            { k: 'fib', v: fib.testing ? (upSwing ? 1 : -1) : 0, w: rw },
            { k: 'pat', v: pat ? (pat.tone === 'bull' ? 1 : pat.tone === 'bear' ? -1 : 0) : 0, w: rw },
            { k: 'fvg', v: fvgV, w: 0.5 },
            { k: 'flow', v: flow > 0.52 ? 1 : flow < 0.48 ? -1 : 0, w: 1 },
        ];
        const score = clamp(Math.round(signals.reduce((s, x) => s + x.v * x.w, 0)), -10, 10);
        const dir = score >= 3 ? 1 : score <= -3 ? -1 : 0;
        const lean = dir || (score > 0 ? 1 : score < 0 ? -1 : (e20 > e50 ? 1 : -1));
        const active = signals.filter((x) => x.v !== 0);
        const quality = active.length ? Math.round(100 * active.filter((x) => x.v === lean).length / active.length) : 0;
        const core = signals.filter((x) => ['structure', 'ema', 'macd', 'flow'].includes(x.k));
        const indConf = Math.round(100 * core.filter((x) => x.v === lean).length / core.length);
        const confidence = clamp(Math.round(45 + Math.abs(score) * 4.5 + (ad > 25 ? 8 : 0) + (ad > 40 ? 4 : 0)), 35, 96);
        const winProb = clamp(Math.round(38 + confidence * 0.32), 40, 75);

        const swing = lean < 0 ? Math.max(lastHigh, price + 0.8 * a) : Math.min(lastLow, price - 0.8 * a);
        const R = clamp(Math.abs(swing - price) + 0.35 * a, 0.8 * a, 3 * a);
        const mult = ad > 25 ? [1.5, 2.5, 3.5] : [1.2, 2, 2.8];
        const levels = { entry: price, sl: price - lean * R, tps: mult.map((m) => price + lean * R * m), R, mult, dir: lean };

        return { price, e20, e50, rsi: r, atr: a, adx: ad, hist, structure, lastHigh, lastLow, bullOB, bearOB, fvgB, fvgS, fib, pat, flow,
            signals, score, dir, lean, label: dir > 0 ? 'BUY' : dir < 0 ? 'SELL' : 'HOLD', confidence, quality, winProb, indConf, riskScore,
            volRegime, levels, trend: ad > 40 ? 'STRONG TREND' : ad > 25 ? 'MODERATE TREND' : 'WEAK TREND', at: Date.now() };
    }

    function buildFindings(A) {
        const F = [], add = (tone, icon, title, text) => F.push({ tone, icon, title, text });
        if (A.structure === 'up') add('bull', 'arrow-trend-up', 'Bullish market structure', `Higher highs and higher lows are in play. The last swing low ${f(A.lastLow)} supports the advance.`);
        else if (A.structure === 'down') add('bear', 'arrow-trend-down', 'Bearish market structure', `Lower highs and lower lows are in play. The last swing high ${f(A.lastHigh)} caps the corrective moves.`);
        else add('neu', 'arrows-left-right', 'Range-bound structure', `No clean sequence of highs and lows. Range ${f(A.lastLow)} to ${f(A.lastHigh)}.`);
        if (A.bullOB) add('bull', 'cube', `Bullish Order Block ${f(A.bullOB.lo)}–${f(A.bullOB.hi)}`, 'Institutional demand block: buyers defended this area before the last explosive move up.');
        if (A.bearOB) add('bear', 'cube', `Bearish Order Block ${f(A.bearOB.lo)}–${f(A.bearOB.hi)}`, 'Institutional supply block: sellers defended this area before the last sharp drop.');
        add(A.fib.testing ? (A.fib.up ? 'bull' : 'bear') : 'neu', 'wand-magic-sparkles', `Fibonacci Golden Pocket 61.8% (${f(A.fib.level)})`,
            A.fib.testing ? 'Price is testing the key 61.8% retracement: high-confluence area for a reversal.' : `The key retracement sits ${f(Math.abs(A.price - A.fib.level))} away from price.`);
        if (A.pat) add(A.pat.tone, 'bolt', A.pat.name, `${A.pat.text}${A.pat.ago ? ` (${A.pat.ago} candle${A.pat.ago > 1 ? 's' : ''} ago)` : ''}`);
        if (A.rsi > 70) add('bear', 'gauge-high', `RSI overbought (${A.rsi.toFixed(1)})`, 'Buyers are stretched: pullback risk is elevated for longs.');
        else if (A.rsi < 30) add('bull', 'gauge-high', `RSI oversold (${A.rsi.toFixed(1)})`, 'Sellers are stretched: bounce risk is elevated for shorts.');
        const g = A.fvgB && A.fvgS ? (Math.abs(A.price - A.fvgB.hi) < Math.abs(A.price - A.fvgS.lo) ? 'B' : 'S') : A.fvgB ? 'B' : A.fvgS ? 'S' : null;
        if (g === 'B') add('bull', 'layer-group', `Bullish FVG ${f(A.fvgB.lo)}–${f(A.fvgB.hi)}`, 'Unfilled fair value gap below price: a natural magnet/demand zone if price retraces.');
        if (g === 'S') add('bear', 'layer-group', `Bearish FVG ${f(A.fvgS.lo)}–${f(A.fvgS.hi)}`, 'Unfilled fair value gap above price: a natural supply zone if price bounces.');
        return F;
    }

    function agents(A) {
        const sym = state.symbol;
        const crypto = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'].filter((s) => quotes[s]);
        const riskAvg = crypto.length ? sma(crypto.map((s) => quotes[s].change)) : 0;
        const tone = (v) => (v > 0 ? 'bull' : v < 0 ? 'bear' : 'neu');
        const conv = (x) => (x >= 4 ? 'High conviction' : x >= 2 ? 'Medium conviction' : 'Low conviction');
        const sig = (k) => A.signals.find((x) => x.k === k).v;

        const techSum = sig('structure') + sig('ema') + sig('macd') + sig('ob') + sig('fvg');
        const tech = { name: 'Technical Analyst', role: 'Indicators, structure & SMC', icon: 'layer-group', tone: tone(techSum), conv: conv(Math.abs(techSum)),
            text: `Structure is ${A.structure === 'up' ? 'trending up' : A.structure === 'down' ? 'corrective/down' : 'ranging'}; price is ${A.price > A.e20 ? 'above' : 'below'} EMA20 and ${A.e20 > A.e50 ? 'EMA20 sits above EMA50 (bullish stack)' : 'EMA20 sits below EMA50 (bearish stack)'}. ADX ${A.adx.toFixed(1)} shows ${A.adx > 40 ? 'strong' : A.adx > 25 ? 'moderate' : 'weak'} trend strength, RSI ${A.rsi.toFixed(1)}${A.rsi > 70 ? ' is overbought' : A.rsi < 30 ? ' is oversold' : ' is neutral'}, MACD histogram is ${A.hist > 0 ? 'positive' : 'negative'}.` };

        const isGold = sym === 'XAUUSDT';
        const fundSig = isGold ? (riskAvg < -0.5 ? 1 : riskAvg > 0.5 ? -1 : 0) : (sym === 'EURUSDT' ? Math.sign(quotes[sym]?.change || 0) : Math.sign(riskAvg));
        const fund = { name: 'Fundamental Analyst', role: 'Cross-asset & macro context', icon: 'globe', tone: tone(fundSig), conv: conv(Math.abs(fundSig) * 2),
            text: `Cross-asset momentum check: Crypto majors are ${riskAvg >= 0 ? 'up' : 'down'} ${Math.abs(riskAvg).toFixed(2)}% on average over 24h (${riskAvg < -0.5 ? 'risk-off' : riskAvg > 0.5 ? 'risk-on' : 'mixed'}), which is ${isGold ? (fundSig > 0 ? 'supportive for safe-haven OANDA XAU/USD' : fundSig < 0 ? 'a headwind for gold' : 'a neutral backdrop for gold') : 'the main driver for this asset'}.` };

        const flowSig = sig('flow');
        const sent = { name: 'Sentiment Analyst', role: 'Positioning & order flow', icon: 'brain', tone: tone(flowSig), conv: conv(Math.abs(flowSig) * 2 + (A.rsi > 70 || A.rsi < 30 ? 2 : 0)),
            text: `Aggressive buyers account for ${(A.flow * 100).toFixed(1)}% of recent volume (last 20 candles), so order flow ${flowSig > 0 ? 'leans to buyers' : flowSig < 0 ? 'leans to sellers' : 'is balanced'}. ${A.rsi < 30 ? `Shorts look exhausted; liquidity rests below ${f(A.lastLow)}.` : A.rsi > 70 ? `Longs look stretched; liquidity rests above ${f(A.lastHigh)}.` : 'Positioning is not at an extreme.'}` };

        const rk = $('riskSel').value, pct = { low: 0.5, medium: 1, high: 2 }[rk];
        const risk = { name: 'Risk Manager', role: 'Sizing, SL/TP & exposure', icon: 'shield-halved', tone: A.dir ? tone(A.dir) : 'neu', conv: conv(A.riskScore < 40 ? 4 : A.riskScore < 75 ? 2 : 1),
            text: `Suggested risk ≤ ${pct}% per trade. Stop sits ${A.lean > 0 ? 'below' : 'above'} ${f(A.levels.sl)} (swing + ATR×0.35). Volatility is ${A.volRegime.toLowerCase().replace(' vol', '')}${A.volRegime.startsWith('CONTRACT') ? '; tighten targets' : ''}. Adaptive R:R = ${A.levels.mult.join(' / ')} (${A.trend.toLowerCase()}), confluence ${A.score > 0 ? '+' : ''}${A.score}.` };
        return [tech, fund, sent, risk];
    }

    // ---------- Rendering ----------
    const strengthWord = (c) => (c >= 80 ? 'HIGH' : c >= 60 ? 'MEDIUM' : 'LOW');
    const side = (A) => (A.dir > 0 ? 'buy' : A.dir < 0 ? 'sell' : 'neu');

    function renderAnalysis(A) {
        const L = A.levels;
        const s = side(A), sName = A.label, leanName = A.lean > 0 ? 'BUY' : 'SELL';
        setText('assetTitle', ASSETS[state.symbol].label);
        $('sideBadge').textContent = A.dir ? sName : 'HOLD';
        $('sideBadge').className = 'badge-sell' + (A.dir > 0 ? ' buy' : '');
        setText('deskTitle', `${ASSETS[state.symbol].label} • ${state.tf}`);
        $('deskIcon').className = 'fa-solid ' + (A.lean > 0 ? 'fa-arrow-trend-up up' : 'fa-arrow-trend-down down');
        $('resultPill').textContent = sName;
        $('resultPill').className = 'hold-pill ' + s;
        setText('mConf', A.confidence + '%'); setText('mQual', A.quality + '%');
        setText('mRR', `~1:${L.mult[0]}`);
        const agree = A.signals.filter((x) => x.v === A.lean).length, tot = A.signals.filter((x) => x.v !== 0).length;
        $('deskText').textContent = A.dir
            ? `${agree} of ${tot} active signals favor ${sName}. ${A.structure === 'range' ? 'Structure is ranging' : 'Structure is ' + (A.structure === 'up' ? 'bullish' : 'bearish')}, ADX ${A.adx.toFixed(1)} (${A.trend.toLowerCase()}), RSI ${A.rsi.toFixed(1)}.`
            : `Signals conflict (${agree} of ${tot} lean ${leanName}). No high-probability setup yet: wait for a break of ${f(A.lean > 0 ? A.lastHigh : A.lastLow)}.`;
        setText('lvEntry', f(L.entry)); setText('lvSL', f(L.sl)); setText('lvT1', f(L.tps[0])); setText('lvT2', f(L.tps[1]));
        const warn = $('deskWarn');
        warn.hidden = !(A.adx < 20 || A.rsi > 70 || A.rsi < 30);
        warn.textContent = A.adx < 20 ? 'Low ADX: the trend is weak, avoid chasing breakouts.' : `RSI ${A.rsi.toFixed(0)}: price is stretched, avoid entering late.`;

        $('sigCard').className = 'sig-card ' + s;
        setText('sigPill', sName);
        setText('sigConf', `${strengthWord(A.confidence)} confidence`);

        setText('lsSide', A.dir ? sName : `WATCH ${leanName}`);
        setText('valEntry', f(L.entry)); setText('valSL', f(L.sl));
        L.tps.forEach((t, i) => setText('valTP' + (i + 1), f(t)));
        setText('rrChip', `R:R ${L.mult.join(' / ')}`);
        $('lvTags').innerHTML = `<span class="tag blue">${A.volRegime}</span><span class="tag ${A.adx > 25 ? 'green' : 'amber'}">${A.trend}</span><span class="tag violet">CONFLUENCE ${A.score > 0 ? '+' : ''}${A.score}</span>`;

        [['scConf', A.confidence], ['scWin', A.winProb], ['scInd', A.indConf], ['scRisk', A.riskScore]].forEach(([id, v]) => {
            setText(id, v + '%'); $(id + 'Bar').style.width = v + '%';
        });

        const bp = $('biasPill');
        bp.textContent = `${A.dir ? sName : 'NEUTRAL'} ${A.score > 0 ? '+' : ''}${A.score}`;
        bp.className = 'bias-pill ' + (A.score > 2 ? 'bull' : A.score < -2 ? 'bear' : '');
        $('biasFill').style.width = ((A.score + 10) / 20 * 100) + '%';
        setText('readerSum', `Chart is ${A.structure === 'range' ? 'neutral/ranging' : A.structure === 'up' ? 'in an uptrend' : 'in a downtrend'}; ${A.structure === 'down' ? 'bearish' : A.structure === 'up' ? 'bullish' : 'mixed'} market structure. ${A.dir ? `Confluence favors ${sName}.` : `Wait for a break of ${f(A.lean > 0 ? A.lastHigh : A.lastLow)} for direction.`}`);
        const box = $('findings');
        box.replaceChildren();
        buildFindings(A).forEach((x) => {
            const d = document.createElement('div');
            d.className = 'finding ' + x.tone;
            d.innerHTML = `<span class="f-ic"><i class="fa-solid fa-${x.icon}"></i></span><div><b></b><p></p></div>`;
            d.querySelector('b').textContent = x.title;
            d.querySelector('p').textContent = x.text;
            box.append(d);
        });

        const team = $('team');
        team.replaceChildren();
        agents(A).forEach((g) => {
            const d = document.createElement('div');
            d.className = 'agent';
            d.innerHTML = `<div class="agent-top"><div><b></b><small></small></div><span class="stance ${g.tone}">${g.tone === 'bull' ? 'BULLISH' : g.tone === 'bear' ? 'BEARISH' : 'NEUTRAL'}</span></div><p></p><footer></footer>`;
            d.querySelector('b').textContent = g.name;
            d.querySelector('small').textContent = g.role;
            d.querySelector('p').textContent = g.text;
            d.querySelector('footer').textContent = g.conv;
            team.append(d);
        });
        drawLines(L, A);
        setText('hudSignal', `AI ${A.dir ? sName : 'WATCH ' + leanName} · ${ASSETS[state.symbol].label} (${state.tf})`);
        setText('hudConf', `${A.confidence}% CONF · R:R 1:${L.mult[0]}`);
        setText('hudEntry', f(L.entry));
        setText('hudSL', f(L.sl));
        setText('hudTP1', f(L.tps[0]));
        setText('hudTP2', f(L.tps[1]));
        const smcTxt = A.bullOB ? `BULL OB ${f(A.bullOB.lo)}` : A.bearOB ? `BEAR OB ${f(A.bearOB.hi)}` : `FIB 61.8% ${f(A.fib.level)}`;
        setText('hudSmc', smcTxt);

        renderHero();
        renderSource();
        maybeAutoTrade(A);
    }

    function renderSource() {
        const q = quotes[state.symbol], p = q?.price ?? state.A?.price;
        if (p == null || !state.candles.length) return;
        const secs = Math.max(0, Math.round((Date.now() - state.updatedAt) / 1000));
        const feedLabel = state.oandaActive ? `OANDA v20 (${oandaCfg.env})` : `OANDA Spot Calibrated`;
        setText('srcText', `${ASSETS[state.symbol].short} · ${feedLabel} · last close ${f(state.candles.at(-1).close)} · ${secs < 5 ? 'live' : secs + 's ago'}`);
        setText('srcPrice', f(p));
    }

    function renderHero() {
        const A = state.A, q = quotes[state.symbol];
        if (!A) return;
        const price = q?.price ?? A.price, chg = q?.change ?? 0;
        setText('heroPrice', f(price));
        const absChg = q ? price - price / (1 + chg / 100) : 0;
        const hc = $('heroChange');
        hc.textContent = `${absChg >= 0 ? '+' : '-'}${f(Math.abs(absChg))} (${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%)`;
        hc.className = 'hero-change ' + (chg >= 0 ? 'pos' : 'neg');

        const spreadPill = $('spreadPill');
        if (spreadPill) {
            const d = dec();
            const halfSpread = state.symbol === 'XAUUSDT' ? 0.10 : (1 / 10 ** d) * 2;
            const bid = q?.bid ?? (price - halfSpread);
            const ask = q?.ask ?? (price + halfSpread);
            const spr = Math.abs(ask - bid);
            spreadPill.hidden = false;
            setText('bidVal', fmt(bid, d));
            setText('askVal', fmt(ask, d));
            setText('spreadVal', fmt(spr, d));
        }

        const hs = $('heroSignal');
        hs.textContent = A.dir ? `${A.label} - ${strengthWord(A.confidence)}` : 'HOLD';
        hs.className = 'sig-tag ' + side(A);
        const closes = state.candles.slice(-48).map((x) => x.close);
        const mn = Math.min(...closes), mx = Math.max(...closes);
        $('sparkLine').setAttribute('points', closes.map((v, i) => `${(i / (closes.length - 1) * 160).toFixed(1)},${(38 - (v - mn) / ((mx - mn) || 1) * 36).toFixed(1)}`).join(' '));
        $('sparkLine').parentNode.classList.toggle('down', closes.at(-1) < closes[0]);
        if (q?.high) { setText('stHigh', f(q.high)); setText('stLow', f(q.low)); setText('sessionRange', `24h range: ${f(q.low)} – ${f(q.high)}`); }
        setText('stRsi', A.rsi.toFixed(0)); setText('stAdx', A.adx.toFixed(0));
        setText('tagClass', ASSETS[state.symbol].cls); setText('tagVol', A.volRegime); setText('tagTrend', A.trend);
    }

    function runAnalysis() {
        if (state.candles.length < 60) return;
        state.A = computeAnalysis(state.candles, $('playbookSel').value);
        state.updatedAt = Date.now();
        renderAnalysis(state.A);
        $('horizonSel').value = horizonOf(state.tf).toLowerCase();
        setText('sigMeta', `${horizonOf(state.tf)} • just now`);
    }

    setInterval(() => {
        const A = state.A;
        if (!A) return;
        const valid = TF_SEC[state.tf] * 3000, left = valid - (Date.now() - A.at);
        const ago = Math.round((Date.now() - A.at) / 60000);
        setText('sigMeta', `${horizonOf(state.tf)} • ${ago < 1 ? 'just now' : ago + ' min ago'}`);
        if (left <= 0) { setText('sigTimer', 'expired'); $('sigBar').style.width = '0%'; return; }
        const h = Math.floor(left / 3600000), m = Math.floor(left % 3600000 / 60000), s = Math.floor(left % 60000 / 1000);
        $('sigTimer').innerHTML = `<i class="fa-regular fa-clock"></i> ${h ? h + 'h ' : ''}${m}m${h ? '' : ' ' + s + 's'} left`;
        $('sigBar').style.width = (left / valid * 100) + '%';
        renderSource();
    }, 1000);

    // ---------- Headlines ----------
    let newsFor = '';
    async function loadNews() {
        const sym = state.symbol, a = ASSETS[sym];
        setText('newsTitle', `${a.short.toUpperCase()} HEADLINES`);
        if (newsFor === sym) return;
        newsFor = sym;
        const list = $('newsList');
        const msg = (t) => { list.replaceChildren(); const li = document.createElement('li'); li.className = 'empty'; li.textContent = t; list.append(li); };
        try {
            const rss = `https://news.google.com/rss/search?q=${encodeURIComponent(a.news + ' when:2d')}&hl=en-US&gl=US&ceid=US:en`;
            const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rss));
            const data = await res.json();
            if (sym !== state.symbol) return;
            if (data.status !== 'ok' || !data.items?.length) return msg(`No ${a.short} news right now. Check back soon.`);
            list.replaceChildren();
            data.items.slice(0, 5).forEach((it) => {
                const li = document.createElement('li'), link = document.createElement('a'), small = document.createElement('small');
                const parts = it.title.split(' - ');
                const source = parts.length > 1 ? parts.pop() : 'News';
                link.textContent = parts.join(' - ');
                link.href = /^https?:\/\//.test(it.link) ? it.link : '#';
                link.target = '_blank'; link.rel = 'noopener noreferrer';
                small.textContent = `${source} · ${new Date(it.pubDate.replace(' ', 'T') + 'Z').toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
                li.append(link, small);
                list.append(li);
            });
        } catch (err) { newsFor = ''; msg('Headlines are unavailable right now.'); }
    }

    // ---------- Live WebSocket Stream ----------
    let reqId = 1, lastLight = 0;
    const socks = {};
    const feedOf = () => 'spot';
    const setStatus = (ok, title) => {
        const el = $('feedStatus'); el.className = 'feed-status ' + (ok ? 'live' : 'down'); el.title = title;
        const p = $('livePill'); p.textContent = ok ? (state.oandaActive ? '● OANDA v20 LIVE' : '● OANDA SPOT SYNCED') : '● RECONNECTING';
        p.className = 'live-pill' + (ok ? '' : ' down');
    };
    const updateStatus = () => {
        const all = Object.values(socks);
        const ok = (all.length > 0 && all.every((x) => x.ok)) || state.oandaActive;
        setStatus(ok, ok ? 'Live real-time market feed active' : 'Reconnecting…');
    };
    function connect(kind) {
        if (!kind) { connect('spot'); return; }
        const syms = SYMBOLS.filter((x) => feedOf(x) === kind);
        const w = new WebSocket(`${WS}?streams=${syms.map((x) => apiSym(x).toLowerCase() + '@ticker').join('/')}`);
        const sk = socks[kind] = { ws: w, stream: null, ok: false };
        w.onopen = () => { sk.ok = true; sk.stream = null; updateStatus(); subscribeKline(); };
        w.onmessage = (ev) => {
            const d = JSON.parse(ev.data).data;
            if (!d) return;
            if (d.e === '24hrTicker') {
                const sym = fromApi(d.s);
                if (state.oandaActive && oandaCfg.accountId && ASSETS[sym]?.oanda) return;
                onRawTicker(sym, +d.c, +d.P, +d.h, +d.l, +d.b || undefined, +d.a || undefined);
            } else if (d.e === 'kline') {
                if (state.oandaActive && ASSETS[state.symbol]?.oanda) return;
                onKline(d.k);
            }
        };
        w.onclose = () => { sk.ok = false; updateStatus(); setTimeout(() => connect(kind), 3000); };
        w.onerror = () => w.close();
    }
    function subscribeKline() {
        const kind = feedOf(state.symbol);
        const next = `${apiSym(state.symbol).toLowerCase()}@kline_${state.tf}`;
        Object.entries(socks).forEach(([k, sk]) => {
            if (sk.ws.readyState !== 1) return;
            if (k !== kind) {
                if (sk.stream) { sk.ws.send(JSON.stringify({ method: 'UNSUBSCRIBE', params: [sk.stream], id: reqId++ })); sk.stream = null; }
                return;
            }
            if (next === sk.stream) return;
            if (sk.stream) sk.ws.send(JSON.stringify({ method: 'UNSUBSCRIBE', params: [sk.stream], id: reqId++ }));
            sk.ws.send(JSON.stringify({ method: 'SUBSCRIBE', params: [next], id: reqId++ }));
            sk.stream = next;
        });
    }
    function onKline(k) {
        if (fromApi(k.s) !== state.symbol || k.i !== state.tf) return;
        const rawC = { time: Math.floor(k.t / 1000), open: +k.o, high: +k.h, low: +k.l, close: +k.c, vol: +k.v, buy: +k.V };
        const lastRaw = state.rawCandles.at(-1);
        if (lastRaw && lastRaw.time === rawC.time) state.rawCandles[state.rawCandles.length - 1] = rawC;
        else state.rawCandles.push(rawC);

        const c = applyOffsetToCandle(rawC, getOffset(state.symbol));
        const last = state.candles.at(-1);
        if (last && last.time === c.time) state.candles[state.candles.length - 1] = c;
        else state.candles.push(c);

        series.update(plain(c));
        volumeSeries.update(toVolBar(c));
        updateLegend(c);
        state.updatedAt = Date.now();
        if (k.x) {
            updateEmaSeries(state.candles);
            runAnalysis();
        } else if (Date.now() - lastLight > 2500 && state.A) {
            lastLight = Date.now();
            if (state.autoAi) {
                updateEmaSeries(state.candles);
                runAnalysis();
            } else {
                const cl = state.candles.map((x) => x.close);
                state.A.rsi = rsi(cl); state.A.adx = adx(state.candles);
                renderHero();
            }
        }
    }

    function onRawTicker(sym, rawPrice, change, rawHigh, rawLow, rawBid, rawAsk) {
        const hadRaw = Boolean(rawQuotes[sym]);
        rawQuotes[sym] = { price: rawPrice, change, high: rawHigh, low: rawLow, bid: rawBid, ask: rawAsk };
        if (!hadRaw && sym === 'XAUUSDT') syncTrueOandaSpot();
        const off = getOffset(sym);
        const st = sym === 'XAUUSDT' ? spotTargets.XAUUSDT : null;
        onCalibratedTicker(
            sym,
            rawPrice + off,
            st?.change ?? change,
            st?.high ?? (rawHigh + off),
            st?.low ?? (rawLow + off),
            rawBid != null ? rawBid + off : undefined,
            rawAsk != null ? rawAsk + off : undefined
        );
    }

    function onCalibratedTicker(sym, price, change, high, low, bid, ask) {
        quotes[sym] = { price, change, high, low, bid, ask };
        const d = ASSETS[sym].dec;
        document.querySelectorAll(`[data-sym="${sym}"] .price`).forEach((el) => {
            el.textContent = fmt(price, d); el.classList.toggle('neg', change < 0); el.classList.toggle('pos', change >= 0);
        });
        document.querySelectorAll(`[data-sym="${sym}"] .change`).forEach((el) => {
            el.textContent = (change >= 0 ? '+' : '') + change.toFixed(2) + '%'; el.classList.toggle('neg', change < 0); el.classList.toggle('pos', change >= 0);
        });
        if (sym === state.symbol) { renderHero(); renderSource(); }
        checkTrades(sym, price);
    }

    async function loadTickers() {
        try {
            const res = await fetch(`${REST}/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(SYMBOLS.map(apiSym)))}`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            (await res.json()).forEach((t) => onRawTicker(fromApi(t.symbol), +t.lastPrice, +t.priceChangePercent, +t.highPrice, +t.lowPrice, +t.bidPrice || undefined, +t.askPrice || undefined));
            await syncTrueOandaSpot();
        } catch (err) { /* WebSocket fills these in */ }
    }

    // ---------- Chart Mode & Auto-Pilot Controls ----------
    function setChartMode(mode) {
        state.chartMode = mode;
        const stage = $('comboStage');
        if (stage) {
            stage.classList.toggle('mode-oanda', mode === 'oanda_tv');
            stage.classList.toggle('mode-ai', mode === 'ai_canvas');
            stage.classList.toggle('mode-combo', mode === 'combo');
        }
        document.querySelectorAll('#chartModeSelector .mode-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.mode === mode);
        });
        setTimeout(() => {
            resetChartZoom();
        }, 80);
    }

    $('autoAiToggle')?.addEventListener('change', (e) => {
        state.autoAi = e.target.checked;
        const dot = $('autoScanDot');
        if (dot) dot.style.opacity = state.autoAi ? '1' : '0.25';
        toast(state.autoAi ? 'Auto AI Levels enabled: real-time Entry/SL/TP sync active.' : 'Auto AI Levels paused: updates on candle close or manual Analyze.');
        if (state.autoAi) runAnalysis();
    });

    $('autoTradeToggle')?.addEventListener('change', (e) => {
        state.autoTrade = e.target.checked;
        toast(state.autoTrade ? 'Auto Paper Trade ON: will auto-execute setups with >= 75% confidence.' : 'Auto Paper Trade OFF.');
        if (state.autoTrade && state.A) maybeAutoTrade(state.A);
    });

    document.querySelectorAll('#chartModeSelector .mode-btn').forEach((b) => {
        b.addEventListener('click', () => setChartMode(b.dataset.mode));
    });

    function selectSymbol(sym) {
        if (sym === state.symbol) return;
        state.symbol = sym; state.A = null;
        setText('assetName', ASSETS[sym].name);
        document.querySelectorAll('#assetList li').forEach((li) => li.classList.toggle('active', li.dataset.sym === sym));
        loadCandles();
    }
    function setTf(tf) {
        if (tf === state.tf) return;
        state.tf = tf;
        document.querySelectorAll('#tfSelector .tf-btn').forEach((b) => b.classList.toggle('active', b.dataset.tf === tf));
        loadCandles();
    }
    document.querySelectorAll('#tfSelector .tf-btn').forEach((b) => b.addEventListener('click', () => setTf(b.dataset.tf)));
    $('horizonSel').addEventListener('change', (e) => setTf(HORIZON_TF[e.target.value]));
    $('playbookSel').addEventListener('change', runAnalysis);
    $('riskSel').addEventListener('change', runAnalysis);
    $('readerToggle').addEventListener('click', () => {
        const c = $('reader').classList.toggle('collapsed');
        $('readerToggle').textContent = c ? 'show' : 'hide';
    });

    async function withBusy(btn, fn) {
        btn.disabled = true;
        try { await fn(); } finally { btn.disabled = false; }
    }
    async function refresh() {
        try {
            const rawRows = await fetchCandles(state.symbol, state.tf);
            state.rawCandles = rawRows;
            await syncTrueOandaSpot();
            const off = getOffset(state.symbol);
            state.candles = rawRows.map((c) => applyOffsetToCandle(c, off));
            series.setData(state.candles.map(plain));
            volumeSeries.setData(state.candles.map(toVolBar));
            updateEmaSeries(state.candles);
            updateLegend(state.candles.at(-1));
            resetChartZoom();
            runAnalysis();
            toast(`Analysis refreshed: ${state.A.label} (${state.A.confidence}% confidence)`);
        } catch (err) { toast('Could not refresh. Check your connection.', true); }
    }
    $('analyzeBtn').addEventListener('click', () => withBusy($('analyzeBtn'), refresh));
    $('refreshBtn').addEventListener('click', () => withBusy($('refreshBtn'), refresh));

    $('bestBtn').addEventListener('click', () => withBusy($('bestBtn'), async () => {
        toast('Scanning all assets…');
        try {
            const results = await Promise.all(SYMBOLS.map(async (s) => {
                const raw = await fetchCandles(s, state.tf);
                const off = getOffset(s);
                const cal = raw.map((c) => applyOffsetToCandle(c, off));
                const A = computeAnalysis(cal, $('playbookSel').value);
                return { s, A, rank: Math.abs(A.score) * A.confidence };
            }));
            results.sort((a, b) => b.rank - a.rank);
            const best = results[0];
            if (best.s !== state.symbol) selectSymbol(best.s); else await refresh();
            toast(`Best setup: ${ASSETS[best.s].label} ${best.A.label} on ${state.tf} (${best.A.confidence}% confidence)`);
        } catch (err) { toast('Scan failed. Check your connection.', true); }
    }));

    // ---------- OANDA Modal Configuration ----------
    const oandaModal = $('oandaModal'), oandaMsg = $('oandaMsg');
    if (oandaModal) {
        $('openOandaBtn')?.addEventListener('click', () => {
            oandaMsg.hidden = true;
            $('oandaEnv').value = oandaCfg.env || 'practice';
            $('oandaAccountId').value = oandaCfg.accountId || '';
            $('oandaToken').value = oandaCfg.token || '';
            oandaModal.classList.add('open');
        });
        $('closeOandaModalBtn')?.addEventListener('click', () => oandaModal.classList.remove('open'));
        oandaModal.addEventListener('click', (e) => { if (e.target === oandaModal) oandaModal.classList.remove('open'); });

        $('oandaForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            oandaMsg.hidden = true;
            const env = $('oandaEnv').value;
            const accountId = $('oandaAccountId').value.trim();
            const token = $('oandaToken').value.trim();
            if (!token) {
                oandaMsg.textContent = 'Please enter a valid OANDA v20 Bearer Token.';
                oandaMsg.hidden = false;
                return;
            }
            oandaCfg = { env, accountId, token };
            store.set('phumea-oanda-cfg', oandaCfg);
            oandaModal.classList.remove('open');
            toast('Connecting to OANDA v20 API…');
            await loadCandles();
            await pollOandaPricing();
            if (state.oandaActive) {
                toast(`Connected to OANDA v20 (${env.toUpperCase()}) live feed!`);
            } else {
                toast('OANDA token could not be verified — using OANDA Spot Calibrated feed.', true);
            }
        });

        $('disconnectOandaBtn')?.addEventListener('click', () => {
            oandaCfg = { env: 'practice', accountId: '', token: '' };
            store.set('phumea-oanda-cfg', oandaCfg);
            state.oandaActive = false;
            updateOandaBadge();
            oandaModal.classList.remove('open');
            loadCandles();
            toast('Switched to Automatic OANDA Spot Calibrated Feed.');
        });
    }

    // ---------- Paper trading ----------
    let session = store.get('phumea-session', null);
    const logsKey = () => 'phumea-trades-' + (session ? session.email : 'guest');
    const migrate = (arr) => arr.map((t) => (t.asset === 'PAXGUSDT' ? { ...t, asset: 'XAUUSDT' } : t)).filter((t) => ASSETS[t.asset]);
    let trades = migrate(store.get(logsKey(), []));
    const saveTrades = () => store.set(logsKey(), trades.slice(0, 50));

    const riskRange = $('riskRange');
    riskRange.addEventListener('input', () => { setText('riskVal', Number(riskRange.value).toFixed(1) + '%'); });

    $('runSimBtn').addEventListener('click', () => {
        const price = quotes[state.symbol]?.price ?? state.A?.price, A = state.A;
        if (!price || !A) return toast('Waiting for live data…', true);
        const L = A.levels, ti = Number($('engineSelect').value), rr = L.mult[ti];
        trades.unshift({
            id: Date.now(), asset: state.symbol, dir: L.dir, entry: price, sl: price - L.dir * L.R,
            tp: price + L.dir * L.R * rr, risk: L.R, riskUsd: Number($('capitalSelect').value) * Number(riskRange.value) / 100,
            rr, status: 'open', fresh: true,
        });
        saveTrades(); renderTrades();
        toast(`Paper ${L.dir > 0 ? 'BUY' : 'SELL'} opened at ${fmt(price, ASSETS[state.symbol].dec)}`);
    });

    function maybeAutoTrade(A) {
        if (!state.autoTrade || !A || !A.dir || A.confidence < 75) return;
        const hasOpen = trades.some((t) => t.status === 'open' && t.asset === state.symbol);
        if (hasOpen) return;
        const price = quotes[state.symbol]?.price ?? A.price;
        if (!price) return;
        const L = A.levels, ti = Number($('engineSelect').value), rr = L.mult[ti];
        trades.unshift({
            id: Date.now(), asset: state.symbol, dir: L.dir, entry: price, sl: price - L.dir * L.R,
            tp: price + L.dir * L.R * rr, risk: L.R, riskUsd: Number($('capitalSelect').value) * Number(riskRange.value) / 100,
            rr, status: 'open', fresh: true,
        });
        saveTrades(); renderTrades();
        toast(`AUTO-PILOT: Opened ${L.dir > 0 ? 'BUY' : 'SELL'} ${ASSETS[state.symbol].label} @ ${fmt(price, ASSETS[state.symbol].dec)} (${A.confidence}% conf)`);
    }

    const floatingPnl = (t, price) => ((price - t.entry) * t.dir / t.risk) * t.riskUsd;
    function checkTrades(sym, price) {
        let changed = false;
        trades.forEach((t) => {
            if (t.status !== 'open' || t.asset !== sym) return;
            const hitSl = t.dir > 0 ? price <= t.sl : price >= t.sl, hitTp = t.dir > 0 ? price >= t.tp : price <= t.tp;
            if (!hitSl && !hitTp) return;
            t.status = hitTp ? 'win' : 'loss';
            t.exit = hitTp ? t.tp : t.sl;
            t.pnl = round(hitTp ? t.riskUsd * t.rr : -t.riskUsd, 2);
            changed = true;
            toast(`${ASSETS[sym].label} ${hitTp ? 'hit take profit' : 'hit stop loss'}: ${money(t.pnl)}`, !hitTp);
        });
        if (changed) saveTrades();
        if (changed || trades.some((t) => t.status === 'open' && t.asset === sym)) renderTrades();
    }
    function renderTrades() {
        const box = $('executionLog');
        box.replaceChildren();
        if (!trades.length) {
            const p = document.createElement('p');
            p.className = 'empty';
            p.textContent = 'No paper trades yet. Open one at the live price; it closes when the real market reaches its stop or target.';
            box.append(p);
            return;
        }
        trades.slice(0, 10).forEach((t) => {
            const d = ASSETS[t.asset].dec, sd = t.dir > 0 ? 'BUY' : 'SELL';
            const row = document.createElement('div'), left = document.createElement('span'), right = document.createElement('strong');
            if (t.status === 'open') {
                const fl = floatingPnl(t, quotes[t.asset]?.price ?? t.entry);
                row.className = 'log-row open';
                left.innerHTML = `${sd} ${ASSETS[t.asset].label} ${fmt(t.entry, d)}<small>SL ${fmt(t.sl, d)} · TP ${fmt(t.tp, d)}</small>`;
                right.textContent = money(fl);
                right.className = fl >= 0 ? 'up' : 'down';
            } else {
                row.className = `log-row ${t.status}`;
                left.textContent = `${sd} ${ASSETS[t.asset].label} ${fmt(t.entry, d)} → ${fmt(t.exit, d)}`;
                right.textContent = money(t.pnl);
            }
            if (t.fresh) { row.classList.add('fresh'); delete t.fresh; }
            row.append(left, right);
            box.append(row);
        });
    }

    // ---------- Accounts ----------
    async function hash(text) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    const modal = $('accountModal'), authMsg = $('authMsg');
    const openModal = () => { authMsg.hidden = true; modal.classList.add('open'); modal.querySelector('input')?.focus(); };
    const closeModal = () => modal.classList.remove('open');
    $('openModalBtn').addEventListener('click', openModal);
    $('closeModalBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            oandaModal?.classList.remove('open');
        }
    });
    modal.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
        authMsg.hidden = true;
        modal.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t === tab));
        modal.querySelectorAll('.auth-form').forEach((f) => { f.hidden = f.dataset.form !== tab.dataset.tab; });
    }));
    const authError = (msg) => { authMsg.textContent = msg; authMsg.hidden = false; };

    function paintAccount() {
        $('openModalBtn').classList.toggle('hidden', !!session);
        $('logoutBtn').classList.toggle('hidden', !session);
        $('userChip').classList.toggle('hidden', !session);
        if (session) $('userChip').textContent = session.name;
        trades = migrate(store.get(logsKey(), []));
        renderTrades();
    }

    modal.querySelector('[data-form="register"]').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = $('regName').value.trim(), email = $('regEmail').value.trim().toLowerCase(), pass = $('regPass').value;
        const users = store.get('phumea-users', {});
        if (name.length < 2) return authError('Enter your full name.');
        if (pass.length < 8) return authError('Password must be at least 8 characters.');
        if (users[email]) return authError('That email is already registered. Log in instead.');
        users[email] = { name, pass: await hash(pass) };
        store.set('phumea-users', users);
        session = { email, name };
        store.set('phumea-session', session);
        e.target.reset(); closeModal(); paintAccount();
        toast(`Account created. Welcome, ${name}!`);
    });
    modal.querySelector('[data-form="login"]').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('logEmail').value.trim().toLowerCase();
        const user = store.get('phumea-users', {})[email];
        if (!user || user.pass !== await hash($('logPass').value)) return authError('Email or password is incorrect.');
        session = { email, name: user.name };
        store.set('phumea-session', session);
        e.target.reset(); closeModal(); paintAccount();
        toast(`Welcome back, ${user.name}!`);
    });
    $('logoutBtn').addEventListener('click', () => {
        session = null;
        store.set('phumea-session', null);
        paintAccount();
        toast('You are logged out.');
    });

    // ---------- Theme ----------
    function paintTheme() {
        const light = document.documentElement.dataset.theme === 'light';
        $('toggleTheme').innerHTML = `<i class="fa-solid ${light ? 'fa-sun' : 'fa-moon'}"></i>`;
        chart.applyOptions({ layout: { textColor: light ? '#5d6779' : '#848e9c' } });
        renderTradingViewChart();
    }
    $('toggleTheme').addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('phumea-theme', next); } catch (e) {}
        paintTheme();
    });

    // ---------- Start ----------
    updateOandaBadge();
    paintTheme();
    paintAccount();
    setText('assetName', ASSETS[state.symbol].name);
    loadTickers();
    loadCandles();
    connect();
})();