// ============================================================================
// scanCRT.js — CRT (Candle Range Theory) strategy for Por - SNR Scanner
// Load order: scan.js → scanChart.js → scanCRT.js → scanLive.js
// C1 = range candle · C2 = sweeps one side and closes back inside · C3 = expansion
// Entry on the lower timeframe (4H→1H, 1H→15M), SL beyond the C2 wick,
// TP1 = C1 midpoint, TP2 = opposite side of C1.
// With a live feed (OANDA / Twelve Data) candles are analysed exactly;
// with a plain image the levels are estimated from the existing chart vision.
// ============================================================================
(function () {
  'use strict';
  const CODE = 'CRT_CANDLE';
  const $ = (id) => document.getElementById(id);
  const num = (v) => parseFloat(String(v).replace(/,/g, ''));
  const tfPlan = (tf) => (/^(H1|1H)$/i.test(String(tf || '')) ? { htf: '1H', ltf: '15M' } : { htf: '4H', ltf: '1H' });

  const atr = (cs, n = 14) => {
    const a = cs.slice(-n - 1); let s = 0;
    for (let i = 1; i < a.length; i++) s += Math.max(a[i].h - a[i].l, Math.abs(a[i].h - a[i - 1].c), Math.abs(a[i].l - a[i - 1].c));
    return s / Math.max(1, a.length - 1);
  };

  function patterns(cs, i, bull) {
    const c = cs[i], p = cs[i - 1], pp = cs[i - 2], n = cs[i + 1];
    const out = ['Turtle soup: false break of C1 ' + (bull ? 'low' : 'high'), 'Closed back inside the C1 range'];
    const body = Math.abs(c.c - c.o), rng = c.h - c.l || 1e-9;
    const up = c.h - Math.max(c.o, c.c), lo = Math.min(c.o, c.c) - c.l;
    if (bull ? (lo >= 2 * body && up <= rng * 0.35) : (up >= 2 * body && lo <= rng * 0.35)) out.push(bull ? 'Hammer / pin bar' : 'Shooting star / pin bar');
    if (bull ? (c.c > c.o && p.c < p.o && c.c >= p.o && c.o <= p.c) : (c.c < c.o && p.c > p.o && c.c <= p.o && c.o >= p.c)) out.push(bull ? 'Bullish engulfing' : 'Bearish engulfing');
    if (pp && (bull
      ? (pp.c < pp.o && Math.abs(p.c - p.o) < (pp.o - pp.c) * 0.4 && c.c > c.o && c.c > (pp.o + pp.c) / 2)
      : (pp.c > pp.o && Math.abs(p.c - p.o) < (pp.c - pp.o) * 0.4 && c.c < c.o && c.c < (pp.o + pp.c) / 2))) out.push(bull ? 'Morning star' : 'Evening star');
    if (body <= rng * 0.1) out.push('Doji at the sweep');
    if (n && n.h <= c.h && n.l >= c.l) out.push('Inside bar after the sweep');
    return out;
  }

  function findCrt(cs) {
    const n = cs.length;
    for (let i = n - 1; i >= Math.max(2, n - 9); i--) {
      const c1 = cs[i - 1], c2 = cs[i];
      const bull = c2.l < c1.l && c2.c > c1.l && c2.c < c1.h;
      const bear = c2.h > c1.h && c2.c < c1.h && c2.c > c1.l;
      if (bull === bear) continue;
      const after = cs.slice(i + 1);
      if (after.some((x) => (bull ? (x.l < c2.l || x.h >= c1.h) : (x.h > c2.h || x.l <= c1.l)))) continue;
      return { i, isBuy: bull };
    }
    return null;
  }

  function planFromCandles(cs) {
    const f = findCrt(cs); if (!f) return null;
    const { i, isBuy } = f, c1 = cs[i - 1], c2 = cs[i];
    const a = atr(cs.slice(0, i + 1)) || (c1.h - c1.l) * 0.1;
    const hi = c1.h, lo = c1.l, mid = (hi + lo) / 2, sw = isBuy ? c2.l : c2.h, cl = c2.c;
    const entry = isBuy ? lo + (cl - lo) / 2 : hi - (hi - cl) / 2;
    const sl = isBuy ? sw - a * 0.15 : sw + a * 0.15, risk = Math.abs(entry - sl);
    let tp1 = mid, tp2 = isBuy ? hi : lo;
    if (isBuy ? tp1 <= entry : tp1 >= entry) tp1 = isBuy ? entry + risk * 1.5 : entry - risk * 1.5;
    if (isBuy ? tp2 <= tp1 : tp2 >= tp1) tp2 = isBuy ? tp1 + risk * 1.5 : tp1 - risk * 1.5;
    const pats = patterns(cs, i, isBuy), depth = Math.abs(sw - (isBuy ? lo : hi)) / (hi - lo || 1);
    const score = Math.min(96, Math.round(66 + Math.min(14, depth * 40) + Math.min(12, (pats.length - 2) * 4) + (i < cs.length - 1 ? 6 : 0)));
    return { src: 'FEED', isBuy, hi, lo, mid, sw, t1: cl, t3: isBuy ? c2.h : c2.l, entry, sl, tp1, tp2, pats, score, forming: i === cs.length - 1, age: cs.length - 1 - i };
  }

  function planFromImage(r) {
    const isBuy = /BUY/i.test(r.action), e = num(r.entry), s = num(r.sl), k = Math.abs(e - s), d = isBuy ? 1 : -1;
    const c = r.crt || {}, ch = num(c.c1High), cl = num(c.c1Low);
    let hi, lo;
    if (ch > cl && e > cl && e < ch && Math.abs(e - (isBuy ? cl : ch)) < k * 3) { hi = ch; lo = cl; }
    else { hi = isBuy ? e + k * 3.35 : e + k * 0.45; lo = isBuy ? e - k * 0.45 : e - k * 3.35; }
    let tp1 = (hi + lo) / 2, tp2 = isBuy ? hi : lo;
    if (isBuy ? tp1 <= e : tp1 >= e) tp1 = e + d * k * 1.5;
    if (isBuy ? tp2 <= tp1 : tp2 >= tp1) tp2 = tp1 + d * k * 1.5;
    const pats = Array.isArray(c.patterns) && c.patterns.length ? c.patterns.slice(0, 4)
      : ['Turtle soup: false break of C1 ' + (isBuy ? 'low' : 'high'), 'Closed back inside the C1 range', (isBuy ? 'Bullish' : 'Bearish') + ' rejection wick'];
    return { src: 'IMAGE', isBuy, hi, lo, mid: (hi + lo) / 2, sw: s + d * k * 0.15, t1: e + d * k * 0.25, t3: e + d * k * 0.6, entry: e, sl: s, tp1, tp2, pats, score: 78, forming: false, age: 0 };
  }

  function applyCrt(r) {
    const dec = ((String(r.currentPrice).split('.')[1]) || '').length || 2, f = (n) => Number(n).toFixed(dec);
    const lv = window.__porLive;
    const hasFeed = !!(lv && lv.b64 && lv.b64 === state.imageBase64 && lv.candles && lv.candles.length > 9);
    const p = (hasFeed && planFromCandles(lv.candles)) || planFromImage(r);
    p.noSweep = hasFeed && p.src === 'IMAGE';
    const tf = tfPlan(r.timeframe), b = p.isBuy, rr = Math.abs(p.tp2 - p.entry) / Math.abs(p.entry - p.sl);
    const lo = Math.min(p.t1, p.entry), hi = Math.max(p.t1, p.entry);
    Object.assign(r, {
      tradeStyle: CODE, action: b ? 'BUY' : 'SELL',
      entry: f(p.entry), sl: f(p.sl), tp1: f(p.tp1), tp2: f(p.tp2), rrRatio: '1:' + rr.toFixed(1),
      orderType: `CRT limit on the retest of C1 ${b ? 'low' : 'high'} (${tf.ltf})`,
      setupGrade: `🕯️ CRT ${tf.htf}→${tf.ltf} • ${p.src === 'FEED' ? 'candle data' : 'image estimate'} • 1:${rr.toFixed(1)} RR`,
      tierEntries: {
        tier1Iofed: f(p.t1), tier1Note: `Aggressive: C2 close @ ${f(p.t1)}`,
        tier2SniperCe: f(p.entry), tier2Note: `Sniper: retest of swept C1 ${b ? 'low' : 'high'} @ ${f(p.entry)}`,
        tier3Golden: f(p.t3), tier3Note: `Safe: ${tf.ltf} close beyond the C2 ${b ? 'high' : 'low'} @ ${f(p.t3)}`
      },
      scalpPerfect: {
        zone: `${f(lo)} – ${f(hi)}`, qualityScore: `${p.score}% CRT SCORE`, lotAdvice: '1.0% risk • SL beyond the C2 sweep wick',
        quickTarget: `TP1 ${f(p.tp1)} (C1 midpoint) → move SL to breakeven`,
        executionNote: `${b ? 'BUY' : 'SELL'} CRT: C2 swept the C1 ${b ? 'low' : 'high'} and closed back inside — enter on ${tf.ltf}, target the opposite side of C1.`
      },
      snrZones: { resistance: f(p.hi), support: f(p.lo) },
      ictLiquidity: {
        bsl: `${f(p.hi)} (C1 high)`, ssl: `${f(p.lo)} (C1 low)`, irlFvg: `${f(p.entry)} (retest of swept level)`,
        equilibrium50: f(p.mid), pdZone: b ? 'DISCOUNT (< 0.5 of C1 • BUY)' : 'PREMIUM (> 0.5 of C1 • SELL)', isDiscount: b,
        confSweep: `#1 C1 ${b ? 'low' : 'high'} swept @ ${f(p.sw)}`, confSmt: '#2 Close back inside C1 range', confDisp: `#3 ${tf.ltf} entry • TP at C1 ${b ? 'high' : 'low'}`
      },
      keyFlipRule: `CRT ${tf.htf}: C2 ${b ? 'sweeps C1 low' : 'sweeps C1 high'} → close inside → ${b ? 'NEW BUY' : 'NEW SELL'} on ${tf.ltf}`,
      detailedAnalysis: b
        ? `[CRT · Candle Range Theory] ទៀន C2 បាន Sweep Low របស់ C1 (${f(p.lo)}) ដល់ ${f(p.sw)} រួច Close ត្រឡប់ចូលក្នុង Range វិញ។ ចូល BUY ${f(p.entry)} លើ ${tf.ltf} • SL ${f(p.sl)} ក្រោម Wick • TP1 ${f(p.tp1)} (50% C1) • TP2 ${f(p.tp2)} (High C1)។`
        : `[CRT · Candle Range Theory] ទៀន C2 បាន Sweep High របស់ C1 (${f(p.hi)}) ដល់ ${f(p.sw)} រួច Close ត្រឡប់ចូលក្នុង Range វិញ។ ចូល SELL ${f(p.entry)} លើ ${tf.ltf} • SL ${f(p.sl)} លើ Wick • TP1 ${f(p.tp1)} (50% C1) • TP2 ${f(p.tp2)} (Low C1)។`,
      confluence: [
        `[#1 Range candle C1 ${tf.htf}] High ${f(p.hi)} • Low ${f(p.lo)} • 50% ${f(p.mid)}`,
        `[#2 Sweep + close inside] ${p.pats.slice(0, 3).join(' • ')}`,
        `[#3 Plan] Entry ${f(p.entry)} • SL ${f(p.sl)} • TP1 ${f(p.tp1)} • TP2 ${f(p.tp2)} (1:${rr.toFixed(1)})`
      ],
      crt: { src: p.src, isBuy: b, hi: f(p.hi), lo: f(p.lo), mid: f(p.mid), sw: f(p.sw), score: p.score, pats: p.pats, forming: p.forming, age: p.age, noSweep: p.noSweep, htf: tf.htf, ltf: tf.ltf }
    });
    return r;
  }

  const _cal = window.calibrateSniperResult;
  window.calibrateSniperResult = function (r, style) {
    const out = _cal(r, style);
    return out && out.tradeStyle === CODE ? applyCrt(out) : out;
  };

  // ---------------------------------------------------------------- UI panel
  function model(b) {
    const Y = (v) => (b ? v : 170 - v), top = Math.min(Y(34), Y(128)), hgt = Math.abs(Y(128) - Y(34));
    const sweepLbl = b ? 'C1 low' : 'C1 high', tgtLbl = b ? 'C1 high' : 'C1 low', dir = b ? '#4ade80' : '#fb7185';
    return `<svg viewBox="0 0 220 170" class="crt-svg" role="img" aria-label="CRT three candle model">
      <rect x="22" y="${top}" width="186" height="${hgt}" fill="rgba(190,242,100,.07)"/>
      <path d="M22 ${Y(34)}H208M22 ${Y(128)}H208" stroke="#bef264" stroke-dasharray="4 4" stroke-width="1"/>
      <path d="M22 ${Y(81)}H208" stroke="rgba(190,242,100,.4)" stroke-dasharray="2 4" stroke-width="1"/>
      <text x="206" y="${Y(34) + (b ? -4 : 11)}" text-anchor="end">${tgtLbl}</text>
      <text x="206" y="${Y(128) + (b ? 11 : -4)}" text-anchor="end">${sweepLbl}</text>
      <text x="206" y="${Y(81) - 3}" text-anchor="end">50%</text>
      <path d="M48 ${Y(34)}V${Y(128)}" stroke="#94a3b8" stroke-width="2"/>
      <rect x="41" y="${Math.min(Y(56), Y(106))}" width="14" height="50" rx="2" fill="#1e293b" stroke="#94a3b8"/>
      <path class="crt-wick" d="M108 ${Y(100)}V${Y(152)}" stroke="#fb7185" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="101" y="${Math.min(Y(100), Y(118))}" width="14" height="18" rx="2" fill="#bef264"/>
      <circle class="crt-ring" cx="108" cy="${Y(152)}" r="5" fill="none" stroke="#fb7185" stroke-width="2"/>
      <path class="crt-arrow" d="M140 ${Y(118)}L176 ${Y(44)}" stroke="${dir}" stroke-width="3" stroke-linecap="round"/>
      <path class="crt-arrow" d="M176 ${Y(44)}l-3 ${b ? 11 : -11}m3 ${b ? -11 : 11}l8 ${b ? 8 : -8}" stroke="${dir}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <text x="48" y="166" text-anchor="middle">C1 range</text><text x="108" y="166" text-anchor="middle">C2 sweep</text><text x="168" y="166" text-anchor="middle">C3 move</text>
    </svg>`;
  }

  function fill(r) {
    const c = r.crt, b = c.isBuy;
    const set = (id, html) => { const e = $(id); if (e) e.innerHTML = html; };
    set('crtTfBadge', `${c.htf} → ${c.ltf}`);
    set('crtSourceNote', c.src === 'FEED' ? `Detected on live candle data • C2 formed ${c.age} candle${c.age === 1 ? '' : 's'} ago` : 'Estimated from the chart image');
    const st = $('crtStatusBadge');
    if (st) {
      const kind = c.src === 'IMAGE' ? 'est' : (c.forming ? 'wait' : 'ok');
      st.className = 'crt-status ' + kind;
      st.textContent = kind === 'ok' ? 'Confirmed on close' : kind === 'wait' ? 'C2 still forming' : 'Estimated';
    }
    set('crtModelBox', model(b));
    set('crtPatternChips', c.pats.map((p) => `<span class="crt-chip">${p}</span>`).join(''));
    const cell = (k, v, cls = '') => `<div class="crt-level ${cls}"><div class="k">${k}</div><div class="v">${v}</div></div>`;
    set('crtLevels',
      cell('Range high' + (b ? ' (TP2)' : ' (swept)'), c.hi) + cell('Midpoint (TP1)', c.mid) + cell('Range low' + (b ? ' (swept)' : ' (TP2)'), c.lo) +
      cell('Sweep wick', c.sw, 'bad') + cell('Entry', r.entry, 'ok') + cell('Stop loss', r.sl, 'bad'));
    const steps = [
      `${c.htf} range candle (C1): high ${c.hi}, low ${c.lo}.`,
      `C2 swept the ${b ? 'low' : 'high'} to ${c.sw} and closed back inside the range${c.forming ? ' — still forming, wait for the close' : ''}.`,
      `On ${c.ltf}, ${b ? 'buy' : 'sell'} near ${r.entry} on the retest of C1 ${b ? 'low' : 'high'}. Stop ${r.sl}, beyond the sweep wick.`,
      `Take profit: TP1 ${r.tp1} at the midpoint, TP2 ${r.tp2} at the opposite side of C1.`
    ];
    if (c.noSweep) steps.push('No clean sweep in the last 8 candles of the feed, so these levels are estimated. Wait for a candle that sweeps and closes back inside.');
    else if (c.src === 'IMAGE') steps.push('Levels are estimated from the image. Connect a live feed for exact candle detection.');
    set('crtSteps', steps.map((s, i) => `<li><span class="crt-n">${i + 1}</span><span>${s}</span></li>`).join(''));
    set('crtScoreNote', `Setup score ${c.score}% — a rule-based rating, not a win rate.`);
  }

  const _render = window.renderResult;
  window.renderResult = function () {
    _render();
    const r = state.result, on = !!(r && r.tradeStyle === CODE && r.crt);
    $('crtPanel')?.classList.toggle('hidden', !on);
    const fx = $('crtFxLayer');
    if (fx) { fx.classList.toggle('hidden', !on); fx.classList.remove('go'); if (on) { void fx.offsetWidth; fx.classList.add('go'); } }
    ['rSecret411RareBox'].forEach((id) => $(id)?.classList.toggle('hidden', on));
    $('rMsnrStorylineBadge')?.closest('.p-3\\.5')?.classList.toggle('hidden', on);
    if (on) { fill(r); if (window.lucide) lucide.createIcons(); }
  };

  // ---------------------------------------------------------- chart overlay
  function drawCrt(r) {
    const cv = $('annotatedChartCanvas'), src = $('previewImg')?.src || (state.imageBase64 ? `data:${state.mime};base64,${state.imageBase64}` : '');
    if (!cv || !src) return;
    const im = new Image();
    im.onload = () => {
      const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, k = Math.min(1, 1150 / iw);
      const w = Math.max(680, Math.round(iw * k)), h = Math.max(400, Math.round(ih * k));
      cv.width = w; cv.height = h;
      const g = cv.getContext('2d'), c = r.crt, b = c.isBuy, P = parseFloat;
      const v = [c.hi, c.lo, c.sw, r.entry, r.sl, r.tp1, r.tp2].map(P);
      const mx = Math.max(...v), mn = Math.min(...v), pd = (mx - mn) * 0.12 || 1, top = mx + pd, bot = mn - pd;
      const Y = (p) => h * 0.11 + ((top - p) / (top - bot)) * h * 0.77, xl = w * 0.14, xr = w * 0.84;
      g.drawImage(im, 0, 0, w, h); g.fillStyle = 'rgba(4,9,20,.28)'; g.fillRect(0, 0, w, h);
      const box = (p1, p2, x, col) => { g.fillStyle = col; g.fillRect(x, Math.min(Y(p1), Y(p2)), xr - x, Math.abs(Y(p1) - Y(p2))); };
      box(P(c.hi), P(c.lo), xl, 'rgba(190,242,100,.08)');
      box(P(r.entry), P(r.tp2), w * 0.5, 'rgba(16,185,129,.14)');
      box(P(r.entry), P(r.sl), w * 0.5, 'rgba(244,63,94,.16)');
      const line = (p, col, dash) => { g.save(); g.strokeStyle = col; g.lineWidth = dash ? 1.4 : 2.2; g.setLineDash(dash ? [6, 5] : []); g.beginPath(); g.moveTo(xl, Y(P(p))); g.lineTo(xr, Y(P(p))); g.stroke(); g.restore(); };
      const pill = (p, txt, col, bg) => {
        g.save(); g.font = '800 11px Inter, monospace';
        const t = `${txt}: ${p}`, tw = g.measureText(t).width + 16, x = Math.min(w - tw - 8, xr - tw + 40), y = Math.max(6, Math.min(h - 28, Y(P(p)) - 11));
        g.fillStyle = bg; g.strokeStyle = col; g.lineWidth = 1.4; g.beginPath(); g.roundRect(x, y, tw, 22, 6); g.fill(); g.stroke();
        g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(t, x + 8, y + 11); g.restore();
      };
      line(c.hi, '#bef264', true); line(c.lo, '#bef264', true); line(c.mid, 'rgba(190,242,100,.55)', true);
      g.font = '800 11px Inter, sans-serif'; g.fillStyle = '#d9f99d';
      g.fillText(`C1 high ${c.hi}`, xl + 6, Y(P(c.hi)) - 6); g.fillText(`C1 low ${c.lo}`, xl + 6, Y(P(c.lo)) + 14);
      const sx = w * 0.36, y0 = Y(P(b ? c.lo : c.hi)), y1 = Y(P(c.sw));
      g.strokeStyle = '#fb7185'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx, y0); g.lineTo(sx, y1); g.stroke();
      g.fillStyle = '#fb7185'; g.beginPath(); g.arc(sx, y1, 5, 0, 7); g.fill();
      g.fillStyle = '#fecdd3'; g.fillText(`C2 sweep ${c.sw}`, sx + 10, y1 + (b ? 12 : -6));
      const ax = w * 0.46, ay = Y(P(r.entry)), bx = w * 0.78, by = Y(P(r.tp2)), an = Math.atan2(by - ay, bx - ax);
      g.strokeStyle = '#bef264'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      g.fillStyle = '#bef264'; g.beginPath(); g.moveTo(bx, by);
      g.lineTo(bx - 14 * Math.cos(an - 0.45), by - 14 * Math.sin(an - 0.45)); g.lineTo(bx - 14 * Math.cos(an + 0.45), by - 14 * Math.sin(an + 0.45)); g.closePath(); g.fill();
      line(r.tp2, '#4ade80'); line(r.tp1, '#34d399', true); line(r.entry, '#bef264'); line(r.sl, '#fb7185');
      pill(r.tp2, 'TP2 (C1 ' + (b ? 'high' : 'low') + ')', '#4ade80', 'rgba(6,78,59,.94)');
      pill(r.tp1, 'TP1 (C1 50%)', '#34d399', 'rgba(6,95,70,.9)');
      pill(r.entry, `${r.action} ENTRY`, '#bef264', 'rgba(54,83,9,.95)');
      pill(r.sl, 'STOP LOSS', '#fb7185', 'rgba(136,19,55,.94)');
      g.fillStyle = 'rgba(8,15,30,.9)'; g.strokeStyle = 'rgba(190,242,100,.65)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(14, 14, Math.min(w - 28, 470), 58, 12); g.fill(); g.stroke();
      g.fillStyle = '#bef264'; g.font = '800 13px Inter, sans-serif'; g.fillText(`CRT • ${r.pair || ''} • ${c.htf} → ${c.ltf} • ${r.action}`, 26, 34);
      g.fillStyle = '#cbd5e1'; g.font = '700 10.5px Inter, monospace'; g.fillText(`Entry ${r.entry} | SL ${r.sl} | TP1 ${r.tp1} | TP2 ${r.tp2} | R:R ${r.rrRatio}`, 26, 54);
      const tag = $('chartOverlayStrategyTag'), stx = $('annotatedChartStatusText');
      if (tag) tag.textContent = 'CRT RANGE + SWEEP + ENTRY';
      if (stx) stx.textContent = `● CRT ${c.src === 'FEED' ? 'DETECTED ON CANDLE DATA' : 'ESTIMATED FROM IMAGE'}`;
    };
    im.src = src;
  }

  const _draw = window.drawAnnotatedChartCanvas;
  window.drawAnnotatedChartCanvas = function (r) {
    if (r && r.tradeStyle === CODE && r.crt && state.showChartOverlay !== false) return drawCrt(r);
    return _draw(r);
  };

  // -------------------------------------------------------------- controls
  function setTf(tf) {
    document.querySelector(`#tfSelectorBar [data-tf="${tf}"]`)?.click();
    try { window.porLive && window.porLive.setTf(tf === '1h' ? 'H1' : 'H4'); } catch (e) {}
    document.querySelectorAll('[data-crt-tf]').forEach((b) => b.classList.toggle('on', b.dataset.crtTf === tf));
  }
  async function scan() {
    const ns = $('newsFlipMode'); if (ns) ns.value = CODE;
    setTradeStyle(CODE, false);
    if (!/^(1h|4h)$/.test(state.selectedTf)) setTf(document.querySelector('[data-crt-tf].on')?.dataset.crtTf || '4h');
    if (state.imageBase64) return window.scanChart();
    if (window.porLive) return window.porLive.captureAndScan();
    showError('Upload a 1H or 4H chart image first, then press Scan CRT Strategy.');
  }
  document.querySelectorAll('[data-crt-tf]').forEach((b) => b.addEventListener('click', () => setTf(b.dataset.crtTf)));
  $('btnScanCrt')?.addEventListener('click', scan);
  $('btnRescanCrt')?.addEventListener('click', scan);
  window.__crt = { findCrt, planFromCandles };
  if (window.lucide) lucide.createIcons();
})();