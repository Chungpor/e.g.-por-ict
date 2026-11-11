// ============================================================================
// POR - SNR SCANNER PRO — LIVE CHART (OANDA) + 1-CLICK "ថត + Scan" (scanLive.js)
// ----------------------------------------------------------------------------
// Load AFTER scan.js and scanChart.js:
//   <script src="scan.js"></script>
//   <script src="scanChart.js"></script>
//   <script src="scanLive.js"></script>
//
// What it does
//   1. Injects a "Live Chart · OANDA" panel above the drop zone
//      (TradingView widget, OANDA:XAUUSD by default, symbol tabs + M1..D1).
//   2. "📸 ថត + Scan" captures the chart, drops it into the scan input
//      (same path as an uploaded image) and runs scanChart() automatically.
//   3. "💾 Save រូប" downloads the captured PNG.
//
// Capture engines (TradingView's iframe is cross-origin, so it cannot be read
// directly by any script):
//   A) OANDA feed  -> candles are fetched from OANDA v20 and drawn on a canvas.
//                     Silent, works on phones. Needs an OANDA token (⚙).
//   A2) Twelve Data -> free API key, same silent canvas rendering (phones OK).
//   B) Tab capture -> getDisplayMedia({preferCurrentTab}) then crop to chart.
//                     Desktop only. Permission is asked ONCE per page session;
//                     the stream is kept alive and re-used for every later scan.
// Nothing in scan.js / scanChart.js is modified.
// ============================================================================
(function () {
  'use strict';
  if (window.__porLiveInit) return;
  window.__porLiveInit = true;

  // ---------------------------------------------------------------- config --
  const SYMBOLS = {
    XAUUSD: { label: 'XAUUSD', tv: 'OANDA:XAUUSD',    pair: 'XAU/USD', oanda: 'XAU_USD',    td: 'XAU/USD', dec: 2 },
    XAGUSD: { label: 'XAGUSD', tv: 'OANDA:XAGUSD',    pair: 'XAG/USD', oanda: 'XAG_USD',    td: 'XAG/USD', dec: 3 },
    USOIL:  { label: 'USOIL',  tv: 'OANDA:WTICOUSD',  pair: 'USOIL',   oanda: 'WTICO_USD',  td: 'WTI/USD', dec: 3 },
    NASDAQ: { label: 'NASDAQ', tv: 'OANDA:NAS100USD', pair: 'NAS100',  oanda: 'NAS100_USD', td: 'NDX',     dec: 1 },
    EURUSD: { label: 'EURUSD', tv: 'OANDA:EURUSD',    pair: 'EUR/USD', oanda: 'EUR_USD',    td: 'EUR/USD', dec: 5 }
  };
  const TFS = {
    M1:  { tv: '1',   g: 'M1',  sel: '1m', td: '1min' },
    M5:  { tv: '5',   g: 'M5',  sel: '5m', td: '5min' },
    M15: { tv: '15',  g: 'M15', sel: '15m', td: '15min' },
    M30: { tv: '30',  g: 'M30', sel: '30m', td: '30min' },
    H1:  { tv: '60',  g: 'H1',  sel: '1h', td: '1h' },
    H4:  { tv: '240', g: 'H4',  sel: '4h', td: '4h' },
    D1:  { tv: 'D',   g: 'D',   sel: '1d', td: '1day' }
  };
  const LS = {
    sym: 'ksnr_live_sym',
    tf: 'ksnr_live_tf',
    token: 'ksnr_oanda_token',
    host: 'ksnr_oanda_host',
    td: 'ksnr_twelvedata_key'
  };
  const HOSTS = {
    practice: 'https://api-fxpractice.oanda.com',
    live: 'https://api-fxtrade.oanda.com'
  };

  const lsGet = (k, d = '') => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const el = (id) => document.getElementById(id);

  const cur = {
    sym: SYMBOLS[lsGet(LS.sym)] ? lsGet(LS.sym) : 'XAUUSD',
    tf: TFS[lsGet(LS.tf)] ? lsGet(LS.tf) : 'M15'
  };
  let busy = false;
  let lastBlob = null;
  let lastName = '';

  // ------------------------------------------------------------------- UI ---
  function injectStyles() {
    if (el('porLiveStyles')) return;
    const st = document.createElement('style');
    st.id = 'porLiveStyles';
    st.textContent = `
      #porLivePanel .pl-sym, #porLivePanel .pl-tf { transition: all .15s; cursor: pointer; }
      #porLivePanel .pl-sym { padding: 7px 14px; border-radius: 12px; font-weight: 800; font-size: 12px;
        background: rgba(15,23,42,.85); border: 1px solid #334155; color: #cbd5e1; white-space: nowrap; }
      #porLivePanel .pl-sym.active { background: rgba(6,182,212,.18); border-color: #22d3ee; color: #67e8f9;
        box-shadow: 0 0 14px rgba(34,211,238,.35); }
      #porLivePanel .pl-tf { padding: 6px 0; border-radius: 10px; font-weight: 800; font-size: 12px;
        background: #131d31; border: 1px solid #334155; color: #cbd5e1; }
      #porLivePanel .pl-tf.active { background: #06b6d4; border-color: #67e8f9; color: #020617; }
      #porLiveChartBox { height: 380px; position: relative; contain: layout paint; transform: translateZ(0);
        -webkit-transform: translateZ(0); touch-action: none; overscroll-behavior: contain; }
      #porLiveChartBox.pl-scrollmode { touch-action: pan-y; }
      #porLiveChartBox .pl-shield { display: none; position: absolute; inset: 0; z-index: 5; touch-action: pan-y; }
      #porLiveChartBox.pl-scrollmode .pl-shield { display: block; }
      @media (min-width: 640px) { #porLiveChartBox { height: 460px; } }
      #porLivePanel .pl-step { display:flex; align-items:center; gap:8px; font-size:12px; color:#64748b; }
      #porLivePanel .pl-step.done { color:#4ade80; }
      #porLivePanel .pl-step.run { color:#22d3ee; }
      #porLivePanel .pl-step.err { color:#fb7185; }
      @keyframes plspin { to { transform: rotate(360deg); } }
      #porLivePanel .pl-spin { display:inline-block; animation: plspin .8s linear infinite; }
    `;
    document.head.appendChild(st);
  }

  function styleOptionsHtml() {
    const codes = (typeof VALID_TRADE_STYLES !== 'undefined' && Array.isArray(VALID_TRADE_STYLES))
      ? VALID_TRADE_STYLES : ['SCALPING', 'SWING'];
    return codes.map((code) => {
      let label = code;
      try { label = window.getStyleDisplayMeta(code).scanBtnLabel || code; } catch (e) {}
      const sel = (typeof state !== 'undefined' && state.tradeStyle === code) ? ' selected' : '';
      return `<option value="${code}"${sel}>${label}</option>`;
    }).join('');
  }

  function buildPanel() {
    const dz = el('dropZone');
    if (!dz || el('porLivePanel')) return;
    injectStyles();

    const panel = document.createElement('div');
    panel.id = 'porLivePanel';
    panel.className = 'relative z-10 mb-5 p-3.5 rounded-2xl bg-[#0b111e]/95 border border-cyan-500/35 shadow-inner space-y-3';
    panel.innerHTML = `
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center gap-2">
          <span class="text-sm font-extrabold text-white">📈 Live Chart · OANDA</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold">● LIVE</span>
        </div>
        <button type="button" id="plBtnSettings" class="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer" title="Data feed">⚙ Feed</button>
      </div>

      <div id="plSymbols" class="flex gap-2 overflow-x-auto pb-1">
        ${Object.keys(SYMBOLS).map((k) => `<button type="button" class="pl-sym" data-sym="${k}">${SYMBOLS[k].label}</button>`).join('')}
      </div>

      <div id="plTfs" class="grid grid-cols-7 gap-1.5">
        ${Object.keys(TFS).map((k) => `<button type="button" class="pl-tf" data-tf="${k}">${k}</button>`).join('')}
      </div>

      <button type="button" id="plBtnMode" class="${IS_MOBILE ? '' : 'hidden'} w-full py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-extrabold cursor-pointer">👆 Chart៖ អូស Chart (ចុចដើម្បីប្តូរទៅ Scroll ទំព័រ)</button>
      <div id="porLiveChartBox" class="w-full rounded-xl overflow-hidden border border-slate-800 bg-[#0b111e]"></div>

      <div id="plSettings" class="hidden p-3 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2 text-xs">
        <div class="font-extrabold text-cyan-300">OANDA v20 candle feed (សម្រាប់ថតស្ងាត់ / ដំណើរការលើទូរស័ព្ទ)</div>
        <input id="plToken" type="password" autocomplete="off" placeholder="OANDA API token"
               class="w-full px-3 py-2 rounded-lg bg-[#0b111e] border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-400" />
        <div class="flex items-center gap-2 flex-wrap">
          <select id="plHost" class="px-2.5 py-1.5 rounded-lg bg-[#131d31] border border-slate-700 text-slate-200 font-bold">
            <option value="practice">Practice (fxpractice)</option>
            <option value="live">Live (fxtrade)</option>
          </select>
          <button type="button" id="plSaveToken" class="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-extrabold cursor-pointer">រក្សាទុក</button>
          <button type="button" id="plClearToken" class="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold cursor-pointer">លុប</button>
        </div>
        <div class="font-extrabold text-cyan-300 pt-1">ឬ Twelve Data (Free key — ងាយបំផុត)</div>
        <input id="plTdKey" type="password" autocomplete="off" placeholder="Twelve Data API key (twelvedata.com)"
               class="w-full px-3 py-2 rounded-lg bg-[#0b111e] border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-400" />
        <p class="text-slate-400 leading-snug">Token រក្សាទុកក្នុង Browser នេះតែប៉ុណ្ណោះ។ ប្រើ token ប្រភេទ read-only (Practice) ដើម្បីសុវត្ថិភាព។</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap text-[11px]">
        <span class="text-slate-400 font-bold">ស្កេនតាមយុទ្ធសាស្ត្រ៖</span>
        <select id="plStyle" class="px-2.5 py-1 rounded-lg bg-[#131d31] border border-cyan-500/40 text-amber-300 font-extrabold cursor-pointer">${styleOptionsHtml()}</select>
        <span id="plMode" class="ml-auto text-slate-400 font-bold"></span>
      </div>

      <div id="plSteps" class="hidden space-y-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800"></div>

      <div class="grid grid-cols-5 gap-2">
        <button type="button" id="plBtnSave" class="col-span-2 py-3 rounded-2xl bg-[#0d1626] border border-slate-700 hover:border-cyan-400 text-white font-extrabold text-sm cursor-pointer">💾 Save រូប</button>
        <button type="button" id="plBtnScan" class="col-span-3 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:brightness-110 active:scale-95 transition text-white font-extrabold text-sm cursor-pointer shadow-[0_0_22px_rgba(34,211,238,.35)]">📸 ថត + Scan</button>
      </div>
    `;
    dz.insertAdjacentElement('beforebegin', panel);

    // events
    panel.querySelectorAll('.pl-sym').forEach((b) => b.addEventListener('click', () => setSymbol(b.dataset.sym)));
    panel.querySelectorAll('.pl-tf').forEach((b) => b.addEventListener('click', () => setTf(b.dataset.tf)));
    el('plBtnScan').addEventListener('click', captureAndScan);
    el('plBtnSave').addEventListener('click', saveImage);
    el('plBtnMode').addEventListener('click', () => {
      const box = el('porLiveChartBox');
      const scrollMode = box.classList.toggle('pl-scrollmode');
      el('plBtnMode').textContent = scrollMode
        ? '📜 កំពុង Scroll ទំព័រ (ចុចដើម្បីអូស Chart វិញ)'
        : '👆 Chart៖ អូស Chart (ចុចដើម្បីប្តូរទៅ Scroll ទំព័រ)';
    });
    el('plBtnSettings').addEventListener('click', () => el('plSettings').classList.toggle('hidden'));
    el('plStyle').addEventListener('change', (e) => {
      if (typeof setTradeStyle === 'function') setTradeStyle(e.target.value, false);
    });
    el('plSaveToken').addEventListener('click', () => {
      lsSet(LS.token, el('plToken').value.trim());
      lsSet(LS.host, el('plHost').value);
      if (el('plTdKey').value.trim()) lsSet(LS.td, el('plTdKey').value.trim());
      el('plToken').value = ''; el('plTdKey').value = '';
      refreshMode();
      el('plSettings').classList.add('hidden');
    });
    el('plClearToken').addEventListener('click', () => { lsSet(LS.token, ''); lsSet(LS.td, ''); refreshMode(); });
    el('plHost').value = lsGet(LS.host, 'practice') === 'live' ? 'live' : 'practice';

    paintTabs();
    refreshMode();
    mountTradingView();
  }

  function paintTabs() {
    document.querySelectorAll('#plSymbols .pl-sym').forEach((b) => b.classList.toggle('active', b.dataset.sym === cur.sym));
    document.querySelectorAll('#plTfs .pl-tf').forEach((b) => b.classList.toggle('active', b.dataset.tf === cur.tf));
  }

  // Phones/tablets: getDisplayMedia is unreliable (iOS records the whole Safari
  // screen + shows a system prompt every time) -> never use it on touch devices.
  const IS_MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform));
  function canTabCapture() {
    return !IS_MOBILE && !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  }
  const hasFeed = () => !!(lsGet(LS.token) || lsGet(LS.td));

  function refreshMode() {
    const m = el('plMode');
    if (!m) return;
    if (lsGet(LS.token)) m.textContent = '🟢 Auto · OANDA feed (គ្មាន Allow)';
    else if (lsGet(LS.td)) m.textContent = '🟢 Auto · Twelve Data (គ្មាន Allow)';
    else if (canTabCapture()) m.textContent = '🖥️ ថត Tab (Allow តែ 1 ដង)';
    else m.textContent = '⚠️ ទូរស័ព្ទ៖ ដាក់ API key (⚙ Feed)';
  }

  function setSymbol(k) {
    if (!SYMBOLS[k] || busy) return;
    cur.sym = k; lsSet(LS.sym, k); paintTabs(); mountTradingView();
  }
  function setTf(k) {
    if (!TFS[k] || busy) return;
    cur.tf = k; lsSet(LS.tf, k); paintTabs(); mountTradingView();
  }

  // ---------------------------------------------------- TradingView widget --
  let mountTimer = null;
  function mountTradingView() {
    clearTimeout(mountTimer);
    mountTimer = setTimeout(() => {
      const box = el('porLiveChartBox');
      if (!box) return;
      box.innerHTML = '<div class="pl-shield"></div>';
      const wrap = document.createElement('div');
      wrap.className = 'tradingview-widget-container';
      wrap.style.cssText = 'height:100%;width:100%';
      const inner = document.createElement('div');
      inner.className = 'tradingview-widget-container__widget';
      inner.style.cssText = 'height:100%;width:100%';
      const s = document.createElement('script');
      s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
      s.async = true;
      s.text = JSON.stringify({
        autosize: true,
        symbol: SYMBOLS[cur.sym].tv,
        interval: TFS[cur.tf].tv,
        timezone: 'Asia/Phnom_Penh',
        theme: 'dark',
        style: '1',
        locale: 'en',
        backgroundColor: '#0b111e',
        gridColor: 'rgba(148,163,184,0.08)',
        allow_symbol_change: false,
        hide_top_toolbar: true,
        hide_side_toolbar: IS_MOBILE,
        hide_legend: false,
        save_image: false,
        calendar: false,
        support_host: 'https://www.tradingview.com'
      });
      wrap.appendChild(inner);
      wrap.appendChild(s);
      box.appendChild(wrap);
    }, 120);
  }

  // ------------------------------------------------------- capture engines --
  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('មិនអាចបង្កើតរូបភាពបាន'))), 'image/png');
    });
  }

  // B) Tab capture (desktop Chromium) — permission asked ONCE, stream is re-used
  let tabStream = null, tabVideo = null;
  function releaseTab() {
    try { tabStream && tabStream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    try { tabVideo && tabVideo.remove(); } catch (e) {}
    tabStream = null; tabVideo = null;
  }
  window.addEventListener('pagehide', releaseTab);

  async function ensureTabStream() {
    if (tabStream && tabVideo && tabStream.getVideoTracks().some((t) => t.readyState === 'live')) {
      return false;                                   // already allowed -> no prompt
    }
    releaseTab();
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser' },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: 'include'
    });
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.srcObject = stream;
    v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0;pointer-events:none';
    document.body.appendChild(v);
    await v.play();
    stream.getVideoTracks()[0].addEventListener('ended', releaseTab);   // user pressed "Stop sharing"
    tabStream = stream; tabVideo = v;
    return true;                                      // first time -> dialog just closed
  }

  async function captureFromTab() {
    const box = el('porLiveChartBox');
    box.scrollIntoView({ block: 'center' });
    await sleep(350);

    const first = await ensureTabStream();
    await sleep(first ? 600 : 160);                   // let the dialog vanish / get a fresh frame

    const v = tabVideo;
    const vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || !vh) { releaseTab(); throw new Error('មិនអាចអានរូបភាពពី Tab បានទេ សូមសាកល្បងម្តងទៀត'); }
    const rect = box.getBoundingClientRect();
    const kx = vw / window.innerWidth;
    const ky = vh / window.innerHeight;
    const aspectOk = Math.abs(kx - ky) / Math.max(kx, ky) < 0.04;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (aspectOk) {
      const sx = Math.max(0, rect.left * kx), sy = Math.max(0, rect.top * ky);
      const sw = Math.min(vw - sx, rect.width * kx), sh = Math.min(vh - sy, rect.height * ky);
      canvas.width = Math.round(sw); canvas.height = Math.round(sh);
      ctx.drawImage(v, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    } else {
      canvas.width = vw; canvas.height = vh;          // user picked another tab/window
      ctx.drawImage(v, 0, 0);
    }
    return await canvasToBlob(canvas);
  }

  // A) OANDA v20 candles -> canvas
  async function fetchOandaCandles(count = 120) {
    const token = lsGet(LS.token);
    const host = HOSTS[lsGet(LS.host, 'practice')] || HOSTS.practice;
    const url = `${host}/v3/instruments/${SYMBOLS[cur.sym].oanda}/candles?granularity=${TFS[cur.tf].g}&count=${count}&price=M`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'Accept-Datetime-Format': 'UNIX' }
    });
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.json()).errorMessage || ''; } catch (e) {}
      throw new Error(`OANDA ${res.status}${detail ? ': ' + detail : ''}`);
    }
    const data = await res.json();
    const cs = (data.candles || []).filter((c) => c.mid).map((c) => ({
      t: parseFloat(c.time),
      o: parseFloat(c.mid.o), h: parseFloat(c.mid.h), l: parseFloat(c.mid.l), c: parseFloat(c.mid.c)
    }));
    if (cs.length < 10) throw new Error('OANDA មិនបានផ្តល់ទិន្នន័យគ្រប់គ្រាន់');
    return cs;
  }

  // A2) Twelve Data candles (free key, CORS-enabled) -> same canvas
  async function fetchTwelveCandles(count = 120) {
    const url = 'https://api.twelvedata.com/time_series?symbol=' + encodeURIComponent(SYMBOLS[cur.sym].td) +
      '&interval=' + TFS[cur.tf].td + '&outputsize=' + count + '&order=ASC&timezone=UTC&apikey=' +
      encodeURIComponent(lsGet(LS.td));
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'error' || !Array.isArray(data.values)) {
      throw new Error('Twelve Data: ' + (data.message || res.status));
    }
    const cs = data.values.map((v) => ({
      t: Date.parse(v.datetime.length === 10 ? v.datetime + 'T00:00:00Z' : v.datetime.replace(' ', 'T') + 'Z') / 1000,
      o: parseFloat(v.open), h: parseFloat(v.high), l: parseFloat(v.low), c: parseFloat(v.close)
    })).filter((c) => isFinite(c.o + c.h + c.l + c.c));
    if (cs.length < 10) throw new Error('Twelve Data មិនបានផ្តល់ទិន្នន័យគ្រប់គ្រាន់');
    return cs;
  }

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }

  function renderCandleCanvas(cs, cfg, tfKey) {
    const W = 1280, H = 720;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');
    const MONO = '"JetBrains Mono", Consolas, monospace';
    const SANS = 'Inter, "Segoe UI", Arial, sans-serif';

    g.fillStyle = '#0b111e'; g.fillRect(0, 0, W, H);

    const L = Math.round(W * 0.03), R = Math.round(W * 0.84);
    const T = Math.round(H * 0.15), B = Math.round(H * 0.90);
    let hi = -Infinity, lo = Infinity;
    cs.forEach((c) => { hi = Math.max(hi, c.h); lo = Math.min(lo, c.l); });
    const pad = (hi - lo) * 0.06;
    const top = hi + pad, bot = lo - pad;
    const y = (p) => T + ((top - p) / (top - bot)) * (B - T);

    // watermark
    g.fillStyle = 'rgba(255,255,255,0.045)';
    g.font = `800 130px ${SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(`${cfg.label} ${tfKey}`, (L + R) / 2, (T + B) / 2);

    // grid + right axis labels
    const step = niceStep((top - bot) / 6);
    g.textAlign = 'left'; g.font = `600 22px ${MONO}`;
    for (let i = Math.ceil(bot / step); i * step <= top; i++) {
      const p = i * step, yy = y(p);
      g.strokeStyle = 'rgba(148,163,184,0.14)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(L, yy); g.lineTo(R, yy); g.stroke();
      g.fillStyle = '#cbd5e1';
      g.fillText(p.toFixed(cfg.dec), R + 14, yy);
    }

    // candles
    const n = cs.length, slot = (R - L) / n, bw = Math.max(2, slot * 0.62);
    cs.forEach((c, i) => {
      const x = L + slot * i + slot / 2;
      const col = c.c >= c.o ? '#22c55e' : '#ef4444';
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = Math.max(1.5, bw * 0.12);
      g.beginPath(); g.moveTo(x, y(c.h)); g.lineTo(x, y(c.l)); g.stroke();
      const yo = y(c.o), yc = y(c.c);
      g.fillRect(x - bw / 2, Math.min(yo, yc), bw, Math.max(2, Math.abs(yo - yc)));
    });

    // time labels (below the axis-OCR band)
    const tz = 'Asia/Phnom_Penh';
    const fmtT = (t) => {
      const d = new Date(t * 1000);
      return TFS[tfKey].g === 'D'
        ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: tz })
        : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
    };
    g.fillStyle = '#94a3b8'; g.font = `500 20px ${MONO}`; g.textAlign = 'center';
    const every = Math.max(1, Math.round(n / 6));
    for (let i = Math.floor(every / 2); i < n; i += every) {
      g.fillText(fmtT(cs[i].t), L + slot * i + slot / 2, H - 24);
    }

    // live price line + tag
    const last = cs[cs.length - 1];
    const up = last.c >= last.o, ly = y(last.c);
    const tagCol = up ? '#16a34a' : '#dc2626';
    g.setLineDash([6, 5]); g.strokeStyle = tagCol; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(L, ly); g.lineTo(R, ly); g.stroke(); g.setLineDash([]);
    g.fillStyle = tagCol; g.fillRect(R + 4, ly - 17, W - R - 10, 34);
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = `700 22px ${MONO}`;
    g.fillText(last.c.toFixed(cfg.dec), R + 14, ly);

    // header (pair + timeframe for OCR) + OHLC
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = '#f8fafc'; g.font = `700 32px ${SANS}`;
    g.fillText(`${cfg.label} · ${tfKey} · OANDA`, 28, 52);
    g.fillStyle = '#94a3b8'; g.font = `500 20px ${MONO}`;
    g.fillText(
      `O ${last.o.toFixed(cfg.dec)}  H ${last.h.toFixed(cfg.dec)}  L ${last.l.toFixed(cfg.dec)}  C ${last.c.toFixed(cfg.dec)}`,
      28, 86
    );
    return canvas;
  }

  async function captureFromFeed() {
    const errs = [];
    const providers = [];
    if (lsGet(LS.token)) providers.push(['OANDA', fetchOandaCandles]);
    if (lsGet(LS.td)) providers.push(['Twelve Data', fetchTwelveCandles]);
    for (const [name, fn] of providers) {
      try {
        const cs = await fn(120);
        return await canvasToBlob(renderCandleCanvas(cs, SYMBOLS[cur.sym], cur.tf));
      } catch (e) { console.warn(name + ' feed failed:', e); errs.push(e.message); }
    }
    throw new Error('Feed មិនដំណើរការ (' + errs.join(' | ') + ')');
  }

  async function captureChart() {
    let feedErr = null;
    if (hasFeed()) {
      try { return await captureFromFeed(); }
      catch (e) { feedErr = e; if (!canTabCapture()) throw e; }
    }
    if (canTabCapture()) return await captureFromTab();
    throw new Error('ទូរស័ព្ទមិនអាចថតផ្ទាំង Tab បានទេ — សូមចុច ⚙ Feed ហើយដាក់ Twelve Data key (ឥតគិតថ្លៃ) ឬ OANDA token ម្តងគត់ បន្ទាប់មក ថត + Scan នឹងដើរស្វ័យប្រវត្តិ គ្មាន Allow។');
  }

  // ------------------------------------------------------- feed into scan ---
  async function feedIntoScan(blob) {
    lastName = `${SYMBOLS[cur.sym].label}_${cur.tf}.png`;
    lastBlob = blob;

    if (typeof clearImage === 'function') clearImage();   // also clears old result / lobby selection
    const cfg = SYMBOLS[cur.sym], tf = TFS[cur.tf];
    state.selectedPair = cfg.pair;
    state.selectedTf = tf.sel;
    const ps = el('livePairSelect');
    if (ps && [...ps.options].some((o) => o.value === cfg.pair)) ps.value = cfg.pair;
    document.querySelectorAll('#tfSelectorBar .tf-btn').forEach((b) => {
      const on = b.dataset.tf === tf.sel;
      b.className = on
        ? 'tf-btn py-1.5 rounded-xl bg-cyan-500 text-slate-950 border border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer'
        : 'tf-btn py-1.5 rounded-xl bg-[#131d31] text-slate-300 border border-slate-700 hover:border-cyan-400 cursor-pointer';
    });

    handleFile(new File([blob], lastName, { type: 'image/png' }));
    for (let i = 0; i < 60; i++) {                        // wait for FileReader (≤ 6 s)
      if (state.imageBase64) return;
      await sleep(100);
    }
    throw new Error('មិនអាចដាក់រូបភាពចូល Scan បានទេ');
  }

  // --------------------------------------------------------------- actions ---
  const STEP_LABELS = ['ថតរូបភាព Chart', 'ដាក់ចូល Scan', 'K-SNR កំពុងវិភាគ Entry · SL · TP'];
  function paintSteps(active, failed) {
    const box = el('plSteps');
    if (!box) return;
    box.classList.remove('hidden');
    box.innerHTML = STEP_LABELS.map((t, i) => {
      let cls = '', icon = '○';
      if (failed === i) { cls = 'err'; icon = '✕'; }
      else if (i < active) { cls = 'done'; icon = '✔'; }
      else if (i === active) { cls = 'run'; icon = '<span class="pl-spin">◜</span>'; }
      return `<div class="pl-step ${cls}"><span style="width:16px;text-align:center">${icon}</span><span>${t}</span></div>`;
    }).join('');
  }

  function setBusy(b) {
    busy = b;
    const btn = el('plBtnScan');
    if (!btn) return;
    btn.disabled = b;
    btn.style.opacity = b ? '.7' : '1';
    btn.textContent = b ? '⏳ កំពុងដំណើរការ…' : '📸 ថត + Scan';
  }

  function gate() {
    if (typeof state === 'undefined') return false;
    if (state.scanning) return false;
    if (!state.user) { openModal('loginModal'); return false; }
    if (!state.unlocked && !isAdminUser(state.user)) { openModal('keyModal'); return false; }
    return true;
  }

  async function captureAndScan() {
    if (busy || !gate()) return;
    setBusy(true);
    let step = 0;
    try {
      showError('');
      paintSteps(0);
      const blob = await captureChart();
      step = 1; paintSteps(1);
      await feedIntoScan(blob);
      step = 2; paintSteps(2);
      await window.scanChart();                           // same entry point as the normal Scan button
      if (state.result) {
        paintSteps(3);
        const rc = el('resultCard');
        if (rc && !rc.classList.contains('hidden')) rc.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        paintSteps(2, 2);                                 // scanChart() already showed its own error
      }
    } catch (err) {
      console.error(err);
      paintSteps(step, step);
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'AbortError');
      showError(denied ? 'អ្នកបានបដិសេធការថតផ្ទាំង — សូមចុច "អនុញ្ញាត" ពេល Browser សួរ ហើយសាកល្បងម្តងទៀត។'
                       : (err.message || 'ថត Chart មិនបាន សូមសាកល្បងម្តងទៀត។'));
    } finally {
      setBusy(false);
    }
  }

  async function saveImage() {
    if (busy) return;
    setBusy(true);
    try {
      showError('');
      const blob = lastBlob || await captureChart();
      lastBlob = blob;
      const name = lastName || `${SYMBOLS[cur.sym].label}_${cur.tf}.png`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (err) {
      showError(err.message || 'Save រូបមិនបាន');
    } finally {
      setBusy(false);
    }
  }

  // keep the strategy dropdown in sync when the strategy is changed elsewhere
  const _origSet = typeof setTradeStyle === 'function' ? setTradeStyle : null;
  if (_origSet) {
    window.setTradeStyle = function (style, userClicked) {
      const out = _origSet(style, userClicked);
      const s = el('plStyle'); if (s && state.tradeStyle) s.value = state.tradeStyle;
      return out;
    };
  }

  // The 7-strategy cards call the original (lexical) setTradeStyle, so also poll cheaply:
  setInterval(() => {
    const s = el('plStyle');
    if (s && typeof state !== 'undefined' && state.tradeStyle && s.value !== state.tradeStyle) s.value = state.tradeStyle;
  }, 1000);

  buildPanel();
  try {
    const panelEl = el('porLivePanel');
    if (panelEl && 'IntersectionObserver' in window) {
      new IntersectionObserver((ents) => { window.__porPauseBg = ents[0].isIntersecting; }, { threshold: 0.05 })
        .observe(panelEl);
    }
  } catch (e) {}
  window.porLive = { captureAndScan, saveImage, setSymbol, setTf };
})();