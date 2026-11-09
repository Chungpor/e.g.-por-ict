'use strict';
/* SignalDesk Pro panels: Watchlist · SMC Levels · Paper Execution. Reads app.js globals only. */
(function () {
  const css = `.pro{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-bottom:24px}
.pc{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px}
.pc h3{font-size:12px;letter-spacing:.7px;text-transform:uppercase;color:var(--muted);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
.pc .r{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 4px;border-top:1px solid var(--line);font-size:14px;font-variant-numeric:tabular-nums}
.pc .w{cursor:pointer}.pc .w:hover{background:#22234a}.pc .w.on{box-shadow:inset 3px 0 var(--accent)}
.pc .now{background:#1f2150;border-radius:6px}
.tag{font-size:11px;padding:2px 8px;border-radius:999px;background:#15162e;color:var(--muted);white-space:nowrap}
.tag.bull{background:#14402f;color:var(--up)}.tag.bear{background:#4a1e2e;color:var(--down)}
.tog{display:flex;align-items:center;gap:6px;font-size:12px;text-transform:none;letter-spacing:0;cursor:pointer}
.tfb{background:none;border:0;color:var(--muted);padding:6px 10px;border-radius:6px;cursor:pointer;font-size:13px}.tfb:hover{color:var(--text)}.tfb.on{background:#3b2f12;color:#f5a623}
.log{max-height:150px;overflow:auto}.pc small{color:var(--muted);display:block;margin-top:8px;font-size:11px;line-height:1.5}
@media print{.pro,#scc{display:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const box = document.createElement('section'); box.className = 'pro';
  box.innerHTML = '<div class="pc"><h3>Watchlist</h3><div id="pcW"></div></div>' +
    '<div class="pc"><h3>SMC Levels <span class="tag" id="pcT">–</span></h3><div id="pcS"></div></div>' +
    '<div class="pc"><h3>Execution (paper) <label class="tog"><input type="checkbox" id="pcA"> Auto-log</label></h3><div id="pcE"></div></div>';
  document.querySelector('.titlebar').before(box);

  let auto = true; try { const v = localStorage.getItem('pcAuto'); if (v !== null) auto = v === '1'; } catch (e) {}
  const A = document.getElementById('pcA'); A.checked = auto;
  A.addEventListener('change', () => { auto = A.checked; try { localStorage.setItem('pcAuto', auto ? '1' : '0'); } catch (e) {} });

  /* ---- Watchlist: mirrors the live header tickers ---- */
  const W = document.getElementById('pcW');
  W.addEventListener('click', e => { const r = e.target.closest('[data-a]'); if (r) pickAsset(r.dataset.a); });
  function watch() {
    W.innerHTML = Object.keys(ASSETS).map(k => {
      const m = document.getElementById('m' + k); if (!m) return '';
      const c = m.querySelector('.c');
      return `<div class="r w ${k === asset ? 'on' : ''}" data-a="${k}"><b>${ASSETS[k].name}</b><span>${m.querySelector('.p').textContent}</span><span class="${c.classList.contains('up') ? 'up' : c.classList.contains('down') ? 'down' : 'muted'}">${c.textContent}</span></div>`;
    }).join('') + '<small>Click a row to switch the chart and signals.</small>';
  }

  /* ---- SMC levels computed from the live candles ---- */
  function levels(cc) {
    const c = cc || candles, n = c.length - 1, ind = indicators(c), px = c[n].c, bull = ind.e9[n] > ind.e21[n], out = [];
    const d0 = Date.UTC(new Date(c[n].t).getUTCFullYear(), new Date(c[n].t).getUTCMonth(), new Date(c[n].t).getUTCDate());
    let ah = -Infinity, al = Infinity; const ai = c.findIndex(b => b.t >= d0);
    c.forEach(b => { if (b.t >= d0 && b.t < d0 + 8 * 36e5) { ah = Math.max(ah, b.h); al = Math.min(al, b.l); } });
    if (ah > -Infinity) { out.push({ n: 'Asian High', lo: ah, hi: ah, i: ai }); out.push({ n: 'Asian Low', lo: al, hi: al, i: ai }); }
    const sw = c.slice(-120), hi = Math.max(...sw.map(b => b.h)), lo = Math.min(...sw.map(b => b.l));
    out.push({ n: bull ? 'Weak High' : 'Strong High', lo: hi, hi, k: 'bear' }); out.push({ n: bull ? 'Strong Low' : 'Weak Low', lo, hi: lo, k: 'bull' });
    let f = 0, ob = { bull: 0, bear: 0 };
    for (let i = n; i >= Math.max(2, n - 100); i--) {
      const a = c[i - 2], b = c[i];
      if (f < 3 && a.h < b.l && !c.slice(i + 1).some(x => x.l <= a.h)) { out.push({ n: 'Bull FVG', lo: a.h, hi: b.l, k: 'bull', i: i - 2 }); f++; }
      else if (f < 3 && a.l > b.h && !c.slice(i + 1).some(x => x.h >= a.l)) { out.push({ n: 'Bear FVG', lo: b.h, hi: a.l, k: 'bear', i: i - 2 }); f++; }
      const big = (b.h - b.l) > 1.8 * ind.at[i] && i > 1, p = c[i - 1];
      if (big && b.c > b.o && p.c < p.o && !ob.bull && !c.slice(i + 1).some(x => x.c < p.l)) { out.push({ n: 'Bull OB', lo: p.l, hi: p.h, k: 'bull', i: i - 1 }); ob.bull = 1; }
      if (big && b.c < b.o && p.c > p.o && !ob.bear && !c.slice(i + 1).some(x => x.c > p.h)) { out.push({ n: 'Bear OB', lo: p.l, hi: p.h, k: 'bear', i: i - 1 }); ob.bear = 1; }
    }
    return { px, bull, out: out.sort((x, y) => (y.lo + y.hi) - (x.lo + x.hi)) };
  }
  function smc() {
    const S = document.getElementById('pcS'), T = document.getElementById('pcT');
    if (!candles || candles.length < 60) { S.innerHTML = '<div class="muted">Waiting for live data…</div>'; return; }
    const { px, bull, out } = levels(); let done = false, h = '';
    T.textContent = bull ? 'Bullish bias' : 'Bearish bias'; T.className = 'tag ' + (bull ? 'bull' : 'bear');
    const now = `<div class="r now"><b>▶ Price</b><b>${fmt(px)}</b></div>`;
    out.forEach(l => {
      if (!done && (l.lo + l.hi) / 2 < px) { h += now; done = true; }
      const z = l.lo === l.hi ? fmt(l.lo) : fmt(l.lo) + ' – ' + fmt(l.hi);
      h += `<div class="r"><span class="tag ${l.k || ''}">${l.n}</span><span>${z}</span><span class="muted">${Math.abs((l.lo + l.hi) / 2 - px).toFixed(1)}</span></div>`;
    });
    S.innerHTML = (done ? h : h + now) + '<small>Computed from live candles of the selected pair/timeframe. Distance in price points.</small>';
  }

  /* ---- Paper execution: 1% risk per signal, results in R ---- */
  const seen = new Set(), base = {}, log = [];
  const R = s => s.status === 'LOSS' ? -1 : s.status === 'WIN' ? 1.5 : 0.3 * s.mx;
  function exec() {
    const E = document.getElementById('pcE');
    if (!candles || candles.length < 60 || document.getElementById('grid').textContent.startsWith('Loading')) return;
    const key = asset + '|' + tab, fresh = base[key];
    signals.forEach(s => {
      const id = key + '|' + s.t; if (seen.has(id)) return; seen.add(id);
      if (fresh && auto) log.unshift({ t: Date.now(), x: `${ASSETS[asset].name} ${s.side} @ ${fmt(s.entry)} · SL ${fmt(s.sl)}` });
    });
    base[key] = true; if (log.length > 30) log.length = 30;
    const closed = signals.filter(s => s.status !== 'LIVE'), live = signals.filter(s => s.status === 'LIVE');
    const bal = 10000 + closed.reduce((a, s) => a + R(s) * 100, 0), eq = bal + live.reduce((a, s) => a + R(s) * 100, 0);
    const m = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    E.innerHTML = `<div class="r"><span>Balance</span><b>${m(bal)}</b></div><div class="r"><span>Equity</span><b class="${eq >= bal ? 'up' : 'down'}">${m(eq)}</b></div>
      <div class="r"><span>Open signals</span><b>${live.length}</b></div>
      <div class="r"><span>Feed</span><span class="tag ${$('dot').className === 'live' ? 'bull' : 'bear'}">${$('status').textContent}</span></div>
      <div class="r"><span>Source</span><span class="muted">${$('src').textContent}</span></div>
      <div class="log">${log.map(l => `<div class="r"><span>${l.x}</span><span class="muted">${new Date(l.t).toLocaleTimeString()}</span></div>`).join('') || '<div class="r muted">Execution log: waiting for the next signal…</div>'}</div>
      <small>Paper account: $10,000 start, 1% risk ($100/R) per signal for the selected pair/timeframe. No broker connection; no real orders are placed.</small>`;
  }


  /* ---- SMC chart: candles + OB / FVG / Asian range / BOS-CHoCH / BUY-SELL ---- */
  const cw = document.createElement('section'); cw.className = 'pc'; cw.id = 'scc'; cw.style.marginBottom = '24px';
  cw.innerHTML = '<h3>SMC Chart <span class="tag" id="scT2">–</span></h3><div id="tfBar" style="display:flex;gap:2px;flex-wrap:wrap;margin-bottom:8px"><button class="tfb" data-tf="1m">1m</button><button class="tfb" data-tf="3m">3m</button><button class="tfb" data-tf="5m">5m</button><button class="tfb" data-tf="15m">15m</button><button class="tfb" data-tf="30m">30m</button><button class="tfb" data-tf="1h">1h</button><button class="tfb" data-tf="4h">4h</button><button class="tfb" data-tf="1d">D</button><button class="tfb" data-tf="1w">W</button></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px"><select class="inp" id="tpMode"><option value="fvg">Entry 50% FVG</option><option value="candle">Entry 50% Candle</option><option value="off">No setup</option></select><label class="muted">SL <input class="inp" id="tpSL" type="number" min="1" value="60" style="width:76px"> p</label><label class="muted">TP <input class="inp" id="tpTP" type="number" min="1" value="100" style="width:76px"> p</label></div><canvas id="scv" style="width:100%;height:560px;display:block;border-radius:10px;background:#0d1020"></canvas><small>1 pip = 0.10 for gold. Drag to pan (any direction) · drag the price axis to scale · wheel to zoom · double-click to reset. Drawn from the dashboard\'s own live candles (not the OANDA/TradingView feed above, so prices can differ slightly). Zones and BOS/CHoCH are rule-based approximations; BUY/SELL come from the EMA 9/21/50 + ATR signals.</small>';
  box.before(cw);
  function drawSMC() {
    const cv = document.getElementById('scv'), D = dataSel(); if (!D.c || D.c.length < 60 || !cv.clientWidth) return;
    const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    const x = cv.getContext('2d'); x.scale(dpr, dpr);
    const c = D.c, nn = Math.min(view.n, c.length), end = c.length - Math.min(view.off, c.length - 30), a0 = end - nn, a = Math.max(0, a0), v = c.slice(a, end), R = 66, B = 22, T = 10, pw = W - R, slot = pw / (nn + 12), bw = Math.max(1, slot * .62);
    let hi = Math.max(...v.map(b => b.h)), lo = Math.min(...v.map(b => b.l)); const pd = (hi - lo) * .08; hi += pd; lo -= pd; { const mid = (hi + lo) / 2, half = (hi - lo) / 2 * view.ys; hi = mid + half + view.py; lo = mid - half + view.py; view.ppx = (hi - lo) / (H - T - B); }
    const Y = p => T + (hi - p) / (hi - lo) * (H - T - B), X = i => (i - a0) * slot + slot / 2, L = levels(c);
    view.slot = slot; x.font = '11px sans-serif'; x.textBaseline = 'middle';
    x.strokeStyle = '#1b2036'; x.fillStyle = '#7f86a8'; x.lineWidth = 1;
    for (let g = 0; g <= 6; g++) { const p = lo + (hi - lo) * g / 6, y = Y(p); x.beginPath(); x.moveTo(0, y); x.lineTo(pw, y); x.stroke(); x.fillText(p.toFixed(2), pw + 6, y); }
    for (let i = a; i < end; i += 20) { const px = X(i); x.beginPath(); x.moveTo(px, T); x.lineTo(px, H - B); x.stroke(); x.fillText(new Date(c[i].t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), px - 14, H - 9); }
    const d = new Date(c[c.length - 1].t), d0 = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), ai = c.findIndex(b => b.t >= d0);
    if (ai >= a && ai < end) { x.setLineDash([4, 4]); x.strokeStyle = '#4c6fff'; x.beginPath(); x.moveTo(X(ai), T); x.lineTo(X(ai), H - B); x.stroke(); x.setLineDash([]); x.fillStyle = '#6c8bff'; x.fillText('Asia', X(ai) + 4, T + 8); }
    L.out.forEach(l => { // zones first
      if (l.lo === l.hi || l.i === undefined || l.i >= end || l.hi < lo || l.lo > hi) return;
      const x0 = Math.max(0, X(Math.max(l.i, a))), fvg = /FVG/.test(l.n);
      x.fillStyle = fvg ? 'rgba(150,160,190,.16)' : l.k === 'bull' ? 'rgba(38,166,154,.20)' : 'rgba(239,83,80,.20)';
      x.fillRect(x0, Y(l.hi), pw - x0, Math.max(2, Y(l.lo) - Y(l.hi)));
      x.fillStyle = '#c9cde6'; x.fillText(fvg ? 'FVG' : l.k === 'bull' ? 'OB+' : 'OB-', x0 + 4, Y(l.hi) + 8);
    });
    L.out.forEach(l => { // key lines
      if (l.lo !== l.hi || l.lo < lo || l.lo > hi) return;
      const col = /Asian/.test(l.n) ? '#8a93b8' : l.k === 'bear' ? '#ef5350' : '#26a69a', y = Y(l.lo), x0 = l.i !== undefined && l.i >= a ? X(l.i) : 0;
      x.setLineDash([3, 3]); x.strokeStyle = col; x.beginPath(); x.moveTo(x0, y); x.lineTo(pw, y); x.stroke(); x.setLineDash([]);
      x.fillStyle = col; x.fillText(l.n, pw - x.measureText(l.n).width - 6, y - 7);
    });
    let sh = null, sl = null, tr = 0; const mk = [];
    for (let k = 6; k < c.length; k++) {
      const j = k - 3, w = c.slice(j - 3, j + 4);
      if (c[j].h >= Math.max(...w.map(b => b.h))) sh = { i: j, p: c[j].h };
      if (c[j].l <= Math.min(...w.map(b => b.l))) sl = { i: j, p: c[j].l };
      if (sh && c[k].c > sh.p) { mk.push({ f: sh.i, t: k, p: sh.p, up: 1, n: tr === -1 ? 'CHoCH' : 'BOS' }); tr = 1; sh = null; }
      else if (sl && c[k].c < sl.p) { mk.push({ f: sl.i, t: k, p: sl.p, up: 0, n: tr === 1 ? 'CHoCH' : 'BOS' }); tr = -1; sl = null; }
    }
    mk.filter(m => m.t >= a && m.t < end).slice(-6).forEach(m => {
      const y = Y(m.p), x0 = X(Math.max(m.f, a)), x1 = X(m.t); x.strokeStyle = m.up ? '#26a69a' : '#ef5350'; x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.stroke();
      x.fillStyle = x.strokeStyle; x.fillText(m.n, (x0 + x1) / 2 - 14, y + (m.up ? -8 : 10));
    });
    v.forEach((b, j) => {
      const px = X(a + j), up = b.c >= b.o; x.strokeStyle = x.fillStyle = up ? '#26a69a' : '#ef5350';
      x.beginPath(); x.moveTo(px, Y(b.h)); x.lineTo(px, Y(b.l)); x.stroke();
      x.fillRect(px - bw / 2, Y(Math.max(b.o, b.c)), bw, Math.max(1, Math.abs(Y(b.o) - Y(b.c))));
    });
    D.s.forEach(s => {
      if (s.i < a || s.i >= end) return;
      const buy = s.side === 'BUY', px = X(s.i), y = buy ? Y(c[s.i].l) + 6 : Y(c[s.i].h) - 22;
      x.fillStyle = buy ? '#17a589' : '#e5484d'; x.beginPath(); x.roundRect(px - 16, y, 32, 16, 4); x.fill();
      x.fillStyle = '#fff'; x.font = 'bold 10px sans-serif'; x.fillText(s.side, px - 12, y + 8); x.font = '11px sans-serif';
    });
    { // trade setup: entry at 50% of the nearest FVG (or of the signal candle), SL/TP in pips
      const mode = document.getElementById('tpMode').value, slP = +document.getElementById('tpSL').value || 60, tpP = +document.getElementById('tpTP').value || 100, pip = PIP[asset] || 0.1;
      let ent = null, side = null, st = a;
      if (mode === 'fvg') {
        const g = L.out.filter(l => /FVG/.test(l.n) && l.i < end).sort((p, q) => Math.abs((p.lo + p.hi) / 2 - c[c.length - 1].c) - Math.abs((q.lo + q.hi) / 2 - c[c.length - 1].c))[0];
        if (g) { ent = (g.lo + g.hi) / 2; side = ent > c[c.length - 1].c ? 'SELL' : 'BUY'; st = g.i; }
      } else if (mode === 'candle') {
        const s = D.s.length ? D.s[D.s.length - 1] : null, i = s ? s.i : c.length - 1;
        ent = (c[i].h + c[i].l) / 2; side = s ? s.side : (c[i].c >= c[i].o ? 'BUY' : 'SELL'); st = i;
      }
      if (ent !== null) {
        const dd = side === 'SELL' ? -1 : 1, sl = ent - dd * slP * pip, tp = ent + dd * tpP * pip, x0 = Math.max(0, X(Math.max(st, a))), yy = p => Math.min(H - B - 9, Math.max(T + 9, Y(p)));
        x.fillStyle = 'rgba(239,83,80,.12)'; x.fillRect(x0, Math.min(Y(ent), Y(sl)), pw - x0, Math.abs(Y(sl) - Y(ent)));
        x.fillStyle = 'rgba(38,166,154,.12)'; x.fillRect(x0, Math.min(Y(ent), Y(tp)), pw - x0, Math.abs(Y(tp) - Y(ent)));
        x.strokeStyle = '#9aa1c0'; x.setLineDash([5, 4]); x.beginPath(); x.moveTo(x0, Y(ent)); x.lineTo(pw, Y(ent)); x.stroke(); x.setLineDash([]);
        const tag = (p, t, col) => { const w = x.measureText(t).width + 14, y = yy(p); x.fillStyle = col; x.beginPath(); x.roundRect(pw - w - 8, y - 9, w, 18, 4); x.fill(); x.fillStyle = '#fff'; x.fillText(t, pw - w - 1, y); };
        tag(sl, `SL -${slP}p (${sl.toFixed(3)})`, '#ef4444');
        tag(ent, `${side} · Entry 50% ${mode === 'fvg' ? 'FVG' : 'Candle'} (${ent.toFixed(3)})`, '#1f2937');
        tag(tp, `TP +${tpP}p (${tp.toFixed(3)})`, '#10a37f');
      }
    }
    const last = c[c.length - 1], yp = Y(last.c), col = last.c >= last.o ? '#26a69a' : '#ef5350';
    if (end === c.length) {
      x.setLineDash([2, 3]); x.strokeStyle = col; x.beginPath(); x.moveTo(0, yp); x.lineTo(pw, yp); x.stroke(); x.setLineDash([]);
      x.fillStyle = col; x.fillRect(pw, yp - 9, R, 18); x.fillStyle = '#fff'; x.fillText(last.c.toFixed(2), pw + 6, yp);
    }
    document.getElementById('scT2').textContent = `${ASSETS[asset].name} · ${tfSel} · ${tfSel === mainTf() ? $('src').textContent : (alt.src || '…')}`;
  }

  const view = { n: 150, off: 0, slot: 8, py: 0, ys: 1, ppx: 1 }, sv = document.getElementById('scv');
  sv.style.cursor = 'grab'; sv.style.touchAction = 'none';
  let dr = null; const onAxis = e => e.clientX - sv.getBoundingClientRect().left > sv.clientWidth - 66;
  sv.addEventListener('pointerdown', e => { dr = { x: e.clientX, y: e.clientY, off: view.off, py: view.py, ys: view.ys, ax: onAxis(e) }; sv.setPointerCapture(e.pointerId); sv.style.cursor = 'grabbing'; });
  sv.addEventListener('pointermove', e => {
    if (!dr) { sv.style.cursor = onAxis(e) ? 'ns-resize' : 'grab'; return; }
    if (dr.ax) view.ys = Math.max(0.2, Math.min(6, dr.ys * Math.exp((e.clientY - dr.y) / 200)));   // drag price axis = vertical scale
    else { view.off = Math.max(0, Math.min((dataSel().c || []).length - 30, dr.off + Math.round((e.clientX - dr.x) / view.slot))); view.py = dr.py + (e.clientY - dr.y) * view.ppx; }   // drag chart = pan both ways
    drawSMC();
  });
  const up = () => { dr = null; sv.style.cursor = 'grab'; };
  sv.addEventListener('pointerup', up); sv.addEventListener('pointercancel', up);
  sv.addEventListener('wheel', e => { e.preventDefault(); if (onAxis(e)) { view.ys = Math.max(0.2, Math.min(6, view.ys * (e.deltaY > 0 ? 1.1 : 0.9))); drawSMC(); return; } view.n = Math.round(Math.max(30, Math.min((dataSel().c || candles).length, view.n * (e.deltaY > 0 ? 1.15 : 0.87)))); drawSMC(); }, { passive: false });
  sv.addEventListener('dblclick', () => { view.n = 150; view.off = 0; view.py = 0; view.ys = 1; drawSMC(); });

  /* ---- timeframe selector: main feed for the app's own TF, Binance candles for the others ---- */
  const mainTf = () => tab === 'scalp' ? '5m' : '1h';
  let tfSel = mainTf(), alt = {}, altBusy = false;
  function markTF() { document.querySelectorAll('#tfBar .tfb').forEach(b => b.classList.toggle('on', b.dataset.tf === tfSel)); }
  async function loadAlt() {
    if (altBusy) return; altBusy = true;
    const tf = tfSel, key = asset + tf;
    try {
      for (const s of ASSETS[asset].sources.filter(q => q.k === 'binance')) {
        try {
          const r = await fetchWithTimeout(`${s.rest}?symbol=${s.sym}&interval=${tf}&limit=500`, 8000);
          if (!r.ok) continue;
          const c = (await r.json()).map(k => ({ t: +k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] }));
          if (c.length < 60) continue;
          let note = '';
          if (isGold(s)) {
            const sp = await getSpotXauPrice(), off = sp ? sp - c[c.length - 1].c : xauSpotOffset;
            c.forEach(b => { b.o += off; b.h += off; b.l += off; b.c += off; });
            note = off ? ' (calibrated)' : ' (proxy)';
          }
          if (key === asset + tfSel) alt = { key, c, s: scan(c), src: `BINANCE ${s.sym}${note}` };
          break;
        } catch (e) {}
      }
    } finally { altBusy = false; }
  }
  function dataSel() {
    if (tfSel === mainTf()) return { c: candles, s: signals };
    if (alt.key !== asset + tfSel) { loadAlt(); return { c: null, s: [] }; }
    return alt;
  }
  setInterval(() => { if (tfSel !== mainTf()) loadAlt(); }, 5000);
  document.getElementById('tfBar').addEventListener('click', e => {
    const b = e.target.closest('.tfb'); if (!b) return;
    tfSel = b.dataset.tf; alt = {}; view.n = 150; view.off = 0; view.py = 0; view.ys = 1; markTF(); drawSMC();
  });

  const PIP = { XAU: 0.1, BTC: 1, ETH: 0.1 };
  try { const q = JSON.parse(localStorage.getItem('tpCfg')) || {}; if (q.m) document.getElementById('tpMode').value = q.m; if (q.s) document.getElementById('tpSL').value = q.s; if (q.t) document.getElementById('tpTP').value = q.t; } catch (e) {}
  ['tpMode', 'tpSL', 'tpTP'].forEach(id => document.getElementById(id).addEventListener('input', () => {
    try { localStorage.setItem('tpCfg', JSON.stringify({ m: document.getElementById('tpMode').value, s: document.getElementById('tpSL').value, t: document.getElementById('tpTP').value })); } catch (e) {}
    drawSMC();
  }));

  function tick() { try { watch(); smc(); exec(); markTF(); drawSMC(); } catch (e) { console.warn('pro panels', e); } }
  tick(); setInterval(tick, 1000);
})();