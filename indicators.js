/* Indicators dashboard — React 18 (UMD, no build step). Timeframe is synced to ?tf= */
(function () {
  "use strict";
  const h = React.createElement;
  const { useState, useEffect, useRef, useMemo } = React;

  // Supported timeframes & seconds per bar
  const TFS = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "4h": 14400,
    "1d": 86400
  };

  // Alias map so ?tf=60, ?tf=240, ?tf=D, ?tf=1H, etc. all work seamlessly
  const TF_ALIASES = {
    "1": "1m", "1m": "1m", "m1": "1m",
    "5": "5m", "5m": "5m", "m5": "5m",
    "15": "15m", "15m": "15m", "m15": "15m",
    "30": "30m", "30m": "30m", "m30": "30m",
    "60": "1h", "1h": "1h", "h1": "1h",
    "240": "4h", "4h": "4h", "h4": "4h",
    "d": "1d", "1d": "1d", "1440": "1d"
  };

  const LIMIT = 300;
  const OANDA = window.OANDA_PROXY || new URLSearchParams(location.search).get("oanda") || "";
  const OGRAN = { "1m": "M1", "5m": "M5", "15m": "M15", "30m": "M30", "1h": "H1", "4h": "H4", "1d": "D" };
  const BN_INT = { "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m", "1h": "1h", "4h": "4h", "1d": "1d" };

  const ASSETS = [
    { s: "XAUUSD", n: "Gold Spot / USD", i: "Au", cat: "GOLD", d: 2, base: 4137.27, vol: 0.0009, bn: "PAXGUSDT", od: "XAU_USD" },
    { s: "BTCUSDT", n: "Bitcoin / Tether", i: "₿", cat: "CRYPTO", d: 2, base: 81772.00, vol: 0.0016, bn: "BTCUSDT" },
    { s: "ETHUSDT", n: "Ethereum / Tether", i: "Ξ", cat: "CRYPTO", d: 2, base: 2427.96, vol: 0.0022, bn: "ETHUSDT" },
    { s: "SOLUSDT", n: "Solana / Tether", i: "SO", cat: "CRYPTO", d: 2, base: 104.52, vol: 0.0028, bn: "SOLUSDT" },
    { s: "EURUSD", n: "Euro / US Dollar", i: "€", cat: "FOREX", d: 5, base: 1.11946, vol: 0.0005 },
    { s: "GBPUSD", n: "British Pound / USD", i: "£", cat: "FOREX", d: 5, base: 1.32323, vol: 0.0006 },
    { s: "NAS100", n: "Nasdaq 100", i: "NDX", cat: "INDICES", d: 2, base: 20949.19, vol: 0.0008 },
    { s: "US30", n: "Dow Jones 30", i: "DJ", cat: "INDICES", d: 2, base: 42648.94, vol: 0.0007 },
    { s: "USOIL", n: "WTI Crude Oil", i: "OIL", cat: "OIL", d: 2, base: 94.57, vol: 0.0012 }
  ];

  const fmt = (v, d = 2) => {
    const num = Number(v);
    if (!isFinite(num)) return "0." + "0".repeat(d);
    return num.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  const sgn = (v, d = 2) => {
    const num = isFinite(v) ? Number(v) : 0;
    return (num >= 0 ? "+" : "") + num.toFixed(d);
  };
  const last = (a) => a[a.length - 1];
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  function normalizeTf(raw) {
    const key = String(raw || "").trim().toLowerCase();
    return TF_ALIASES[key] || "15m";
  }

  function readTf() {
    const params = new URLSearchParams(location.search);
    return normalizeTf(params.get("tf") || localStorage.getItem("por_ind_tf") || "15m");
  }

  /* ---------- Deterministic Timeframe-Aware Synthetic Candles ---------- */
  function rng(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function synth(a, tf) {
    const step = TFS[tf] || 900;
    const seedStr = a.s + "_" + tf;
    const r = rng([...seedStr].reduce((x, c) => Math.imul(x, 31) + c.charCodeAt(0), 17));
    const vol = a.vol * Math.sqrt(step / 900);
    const nowBucket = Math.floor(Date.now() / 1000 / step) * step;

    const tfBiasShift = (r() - 0.48) * 0.18 * vol;
    const cl = new Array(LIMIT);
    cl[LIMIT - 1] = a.base * (1 + (r() - 0.5) * vol * 2);

    for (let k = LIMIT - 1; k > 0; k--) {
      const stepMove = (r() + r() + r() - 1.5 + tfBiasShift) * 1.55 * vol;
      cl[k - 1] = Math.max(a.base * 0.2, cl[k] / (1 + stepMove));
    }

    return cl.map((c, k) => {
      const o = k > 0 ? cl[k - 1] : c * (1 - (r() - 0.5) * vol * 0.5);
      const wickUp = (0.15 + r() * 0.65) * vol;
      const wickDn = (0.15 + r() * 0.65) * vol;
      const hi = Math.max(o, c) * (1 + wickUp);
      const lo = Math.min(o, c) * (1 - wickDn);
      return {
        t: nowBucket - (LIMIT - 1 - k) * step,
        o,
        h: hi,
        l: lo,
        c
      };
    });
  }

  /* ---------- Technical Indicator Maths ---------- */
  function emaS(v, n) {
    if (!v.length) return [0];
    const period = Math.min(n, v.length);
    const k = 2 / (period + 1);
    const out = new Array(v.length);
    let p = sum(v.slice(0, period)) / period;
    for (let i = 0; i < v.length; i++) {
      if (i < period - 1) out[i] = p;
      else if (i === period - 1) out[i] = p;
      else {
        p = v[i] * k + p * (1 - k);
        out[i] = p;
      }
    }
    return out;
  }

  function rsiCalc(v, n = 14) {
    if (v.length <= n) return 50;
    let g = 0, l = 0;
    for (let i = 1; i <= n; i++) {
      const d = v[i] - v[i - 1];
      if (d > 0) g += d;
      else l -= d;
    }
    g /= n;
    l /= n;
    for (let i = n + 1; i < v.length; i++) {
      const d = v[i] - v[i - 1];
      g = (g * (n - 1) + Math.max(d, 0)) / n;
      l = (l * (n - 1) + Math.max(-d, 0)) / n;
    }
    if (l <= 1e-12) return 100;
    const rs = g / l;
    return 100 - 100 / (1 + rs);
  }

  function adxCalc(C, n = 14) {
    const tr = [], pd = [], md = [];
    for (let i = 1; i < C.length; i++) {
      const up = C[i].h - C[i - 1].h;
      const dn = C[i - 1].l - C[i].l;
      pd.push(up > dn && up > 0 ? up : 0);
      md.push(dn > up && dn > 0 ? dn : 0);
      tr.push(Math.max(
        C[i].h - C[i].l,
        Math.abs(C[i].h - C[i - 1].c),
        Math.abs(C[i].l - C[i - 1].c)
      ));
    }
    if (tr.length < n * 2) {
      const fallbackAtr = tr.length ? sum(tr) / tr.length : (C[0] ? C[0].c * 0.002 : 1);
      return { adx: 20, prev: 20, pdi: 20, mdi: 20, atr: fallbackAtr || 1, tr };
    }

    let t = sum(tr.slice(0, n)) || 1e-9;
    let p = sum(pd.slice(0, n));
    let m = sum(md.slice(0, n));
    let pdi = 0, mdi = 0;
    const dx = [];

    for (let i = n; i <= tr.length; i++) {
      if (i > n) {
        t = t - t / n + tr[i - 1];
        p = p - p / n + pd[i - 1];
        m = m - m / n + md[i - 1];
      }
      const safeT = Math.max(t, 1e-9);
      pdi = (100 * p) / safeT;
      mdi = (100 * m) / safeT;
      const denom = pdi + mdi;
      dx.push(denom > 1e-9 ? (100 * Math.abs(pdi - mdi)) / denom : 0);
    }

    let a = sum(dx.slice(0, n)) / n;
    const series = [a];
    for (let j = n; j < dx.length; j++) {
      a = (a * (n - 1) + dx[j]) / n;
      series.push(a);
    }
    const atr = Math.max(t / n, (last(C)?.c || 1) * 1e-6);
    return {
      adx: isFinite(a) ? a : 20,
      prev: series[Math.max(0, series.length - 4)] || a,
      pdi: isFinite(pdi) ? pdi : 20,
      mdi: isFinite(mdi) ? mdi : 20,
      atr,
      tr
    };
  }

  function compute(a, C, tf) {
    const cl = C.map((x) => x.c);
    const px = last(cl);
    const len = cl.length;

    const e20 = last(emaS(cl, 20));
    const e50 = last(emaS(cl, 50));
    const e200 = last(emaS(cl, 200));

    const rsi = rsiCalc(cl, 14);
    const A = adxCalc(C, 14);
    const atr = A.atr;
    const diEdge = A.pdi - A.mdi;

    const m12 = emaS(cl, 12);
    const m26 = emaS(cl, 26);
    const ml = m12.map((v, i) => v - m26[i]).filter(isFinite);
    const sig = emaS(ml, 9);
    const macd = (last(ml) || 0) - (last(sig) || 0);

    const w = C.slice(-14);
    const hi14 = Math.max(...w.map((x) => x.h));
    const lo14 = Math.min(...w.map((x) => x.l));
    const range14 = Math.max(hi14 - lo14, atr * 0.1, 1e-9);
    const sumTr14 = Math.max(sum(A.tr.slice(-14)), range14);
    const rawChop = (100 * Math.log10(sumTr14 / range14)) / Math.log10(14);
    const chop = Math.max(15, Math.min(85, isFinite(rawChop) ? rawChop : 50));

    const bw = C.slice(-20);
    const boxHigh = Math.max(...bw.map((x) => x.h));
    const boxLow = Math.min(...bw.map((x) => x.l));
    const boxSpan = Math.max(boxHigh - boxLow, 1e-9);
    const boxPct = Math.max(0, Math.min(100, Math.round(((px - boxLow) / boxSpan) * 100)));

    const atrDist = (px - e20) / Math.max(atr, 1e-9);

    const barsBack = tf === "1d" ? Math.min(7, len - 1) : Math.max(1, Math.min(Math.round(86400 / TFS[tf]), len - 1));
    const refClose = cl[len - 1 - barsBack] || cl[0] || px;
    const chg = ((px / refClose) - 1) * 100;

    const stack =
      e20 > e50 && e50 > e200
        ? "FULL BULLISH STACK"
        : e20 < e50 && e50 < e200
        ? "FULL BEARISH STACK"
        : e20 > e50
        ? "BULLISH TILT"
        : "BEARISH TILT";

    const vote = (b, r) => (b ? "BULLISH" : r ? "BEARISH" : "NEUTRAL");
    const votes = [
      { k: `EMA 20/50/200 stack (${tf.toUpperCase()})`, v: vote(px > e20 && e20 > e50, px < e20 && e20 < e50), t: stack },
      { k: `ADX-14 & DI edge (${tf.toUpperCase()})`, v: vote(diEdge > 4 && A.adx > 18, diEdge < -4 && A.adx > 18), t: `ADX ${A.adx.toFixed(1)} · edge ${sgn(diEdge)}` },
      { k: `RSI-14 (${tf.toUpperCase()})`, v: vote(rsi > 54, rsi < 46), t: rsi.toFixed(1) },
      { k: `Price vs EMA200 (${tf.toUpperCase()})`, v: vote(px > e200, px < e200), t: fmt(e200, a.d) },
      { k: `MACD histogram (${tf.toUpperCase()})`, v: vote(macd > 0, macd < 0), t: macd.toPrecision(3) }
    ];

    const bull = votes.filter((x) => x.v === "BULLISH").length;
    const bear = votes.filter((x) => x.v === "BEARISH").length;
    const bias = bull >= 3 && bull > bear ? "BULLISH" : bear >= 3 && bear > bull ? "BEARISH" : "NEUTRAL";
    const conf5 = Math.max(bull, bear);
    const dir = bias === "BULLISH" ? 1 : bias === "BEARISH" ? -1 : Math.sign(diEdge) || 1;
    const confidence = Math.max(18, Math.min(94, Math.round(A.adx * 1.15 + conf5 * 7.5 + (50 - chop) * 0.3)));

    const regime =
      A.adx >= 25 && chop < 54
        ? dir > 0
          ? "TRENDING UP"
          : "TRENDING DOWN"
        : chop < 40 && A.adx < 25
        ? "COILED BREAKOUT"
        : A.adx < 20 || chop > 55
        ? "RANGING"
        : "TRANSITION";

    const cautions = [`[${tf.toUpperCase()}] ${conf5} of 5 indicators align ${bull >= bear ? "bullish" : "bearish"}`];
    if (Math.abs(atrDist) > 1.5) cautions.push(`Extended ${Math.abs(atrDist).toFixed(1)} ATR from EMA20 — prefer pullback entry`);
    if (boxPct >= 90 || boxPct <= 10) cautions.push(`Price at ${boxPct}% of 20-bar ${tf.toUpperCase()} box — breakout or mean-reversion risk`);
    if (chop > 55) cautions.push(`High choppiness (${chop.toFixed(0)}) on ${tf.toUpperCase()} favours fading range extremes`);

    return {
      a, tf, px, chg, bias, regime, confidence, conf5, votes, stack,
      e20, e50, e200, rsi,
      adx: A.adx,
      adxTrend: A.adx > A.prev + 0.4 ? "Rising" : A.adx < A.prev - 0.4 ? "Falling" : "Flat",
      diEdge, atr, atrDist, chop, macd, boxLow, boxHigh, boxPct,
      key: e20,
      cautions,
      summary: `[${tf.toUpperCase()}] ${regime} (${confidence}% confidence): price ${fmt(px, a.d)} is ${Math.abs(atrDist).toFixed(1)} ATR ${atrDist >= 0 ? "above" : "below"} EMA20 (${fmt(e20, a.d)}), ADX ${A.adx.toFixed(1)}, DI edge ${sgn(diEdge)}, ${conf5}/5 indicators aligned.`,
      entry: `${fmt(Math.min(e20, e20 + dir * 0.25 * atr), a.d)} – ${fmt(Math.max(e20, e20 + dir * 0.25 * atr), a.d)}`,
      sl: fmt(e20 - dir * 1.5 * atr, a.d),
      tp1: fmt(e20 + dir * 2 * atr, a.d),
      tp2: fmt(e20 + dir * 3.5 * atr, a.d)
    };
  }

  if (typeof window !== "undefined") window.IND = { compute, synth, TFS, ASSETS };

  async function fetchJsonWithTimeout(url, signal, timeoutMs = 4500) {
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    if (signal) signal.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
    }
  }

  const Cell = (l, v, s, c) =>
    h("div", { className: "cell" }, h("small", null, l), h("b", { className: c }, v), h("i", null, s));

  function Card({ r, onOpen }) {
    const a = r.a, d = a.d;
    return h("article", { className: "card" },
      h("div", { className: "top" },
        h("div", { className: "sym" },
          h("div", { className: "ico" }, a.i),
          h("div", null,
            h("b", null,
              a.s,
              h("span", { style: { color: "var(--pink)", fontWeight: 800, fontSize: 11 } }, " · " + r.tf.toUpperCase()),
              h("span", { className: "src" + (r.live ? " live" : "") }, r.src === "oanda" ? "OANDA" : r.live ? "LIVE" : "SYNTH")
            ),
            h("small", null, a.n)
          )
        ),
        h("span", { className: "badge " + r.bias }, r.bias)
      ),
      h("div", { className: "price" },
        h("div", null,
          h("b", null, fmt(r.px, d)),
          h("span", { className: "mono " + (r.chg >= 0 ? "up" : "down"), style: { marginLeft: 8, fontSize: 12 } }, sgn(r.chg) + "%")
        ),
        h("div", { className: "reg" },
          r.regime,
          h("div", { style: { color: "var(--mut)" } }, "Confidence ", h("b", { style: { color: "var(--tx)" } }, r.confidence + "%"))
        )
      ),
      h("div", null,
        h("div", { className: "lbl" },
          h("span", null, `5-Indicator Confluence (${r.tf.toUpperCase()})`),
          h("span", { className: "mono", style: { color: "#ff77c2" } }, r.conf5 + " / 5")
        ),
        h("div", { className: "conf" },
          [1, 2, 3, 4, 5].map((n) => h("div", { key: n, className: "seg " + (n <= r.conf5 ? r.bias : "") }))
        )
      ),
      h("div", { className: "cells" },
        Cell("RSI (14)", r.rsi.toFixed(1), r.rsi >= 65 ? "Overbought" : r.rsi <= 38 ? "Oversold" : "Neutral", r.rsi >= 70 ? "down" : r.rsi <= 35 ? "up" : ""),
        Cell("ADX (14)", r.adx.toFixed(1), r.adxTrend),
        Cell("DI EDGE", sgn(r.diEdge), r.diEdge >= 0 ? "+DI dominant" : "-DI dominant", r.diEdge >= 0 ? "up" : "down"),
        Cell("CHOP (14)", r.chop.toFixed(1), r.chop > 50 ? "Choppy box" : "Trending"),
        Cell("ATR (14)", fmt(r.atr, d), (r.atrDist >= 0 ? "+" : "") + r.atrDist.toFixed(1) + " ATR vs EMA20"),
        Cell("MACD HIST", r.macd.toPrecision(3), r.macd >= 0 ? "Bullish mom" : "Bearish mom", r.macd >= 0 ? "up" : "down")
      ),
      h("div", { className: "ema" },
        h("span", null, "EMA20 ", h("b", null, fmt(r.e20, d))),
        h("span", null, "EMA50 ", h("b", null, fmt(r.e50, d))),
        h("span", { style: { color: "#ff77c2", fontWeight: 700 } }, r.stack)
      ),
      h("div", null,
        h("div", { className: "box" },
          h("span", null, fmt(r.boxLow, d)),
          h("span", { style: { color: "#ff77c2", fontWeight: 700 } }, "Box " + r.boxPct + "%"),
          h("span", null, fmt(r.boxHigh, d))
        ),
        h("div", { className: "track" },
          h("div", { className: "fill", style: { width: Math.min(100, Math.max(3, r.boxPct)) + "%" } })
        )
      ),
      h("div", { className: "sum" }, r.summary),
      h("div", { className: "warn" }, r.cautions.map((c, i) => h("div", { key: i }, "⚠️ " + c))),
      h("div", { className: "foot" },
        h("span", null, "Key level: ", h("strong", null, fmt(r.key, d))),
        h("div", { style: { display: "flex", gap: 6 } },
          a.s === "XAUUSD"
            ? h("a", {
                className: "btn",
                href: "xauusd.html?tf=" + r.tf,
                style: { textDecoration: "none" }
              }, "CHART ↗")
            : null,
          h("button", { className: "btn on", onClick: () => onOpen(a.s) }, "INSPECT ➔")
        )
      )
    );
  }

  function Modal({ r, onClose }) {
    return h("div", { className: "back", onClick: onClose },
      h("div", { className: "modal", onClick: (e) => e.stopPropagation() },
        h("div", { className: "top" },
          h("h2", { style: { fontSize: 20 } }, `${r.a.s} — ${r.a.n} · ${r.tf.toUpperCase()}`),
          h("button", { className: "btn", onClick: onClose }, "✕")
        ),
        h("div", { className: "sum" }, r.summary),
        r.votes.map((v, i) =>
          h("div", { key: i, className: "vote" },
            h("span", null, i + 1 + ". " + v.k),
            h("strong", { className: "mono " + (v.v === "BULLISH" ? "up" : v.v === "BEARISH" ? "down" : "") }, v.v + " · " + v.t)
          )
        ),
        h("div", { className: "cells" },
          Cell("ENTRY ZONE", r.entry, ""),
          Cell("STOP", r.sl, "", "down"),
          Cell("TP1", r.tp1, "", "up"),
          Cell("TP2", r.tp2, "", "up")
        ),
        h("small", { style: { color: "var(--mut)" } }, `Reference levels derived from ${r.tf.toUpperCase()} EMA20 and ATR — not financial advice.`)
      )
    );
  }

  function App() {
    const [tf, setTfState] = useState(readTf);
    const [rows, setRows] = useState([]);
    const [clock, setClock] = useState("Syncing…");
    const [cat, setCat] = useState("ALL");
    const [bias, setBias] = useState("ALL");
    const [q, setQ] = useState("");
    const [sel, setSel] = useState(null);
    const store = useRef({});

    const changeTf = (nextRaw) => {
      const next = normalizeTf(nextRaw);
      localStorage.setItem("por_ind_tf", next);
      try {
        const u = new URL(location.href);
        if (u.searchParams.get("tf") !== next) {
          u.searchParams.set("tf", next);
          history.pushState({ tf: next }, "", u);
        }
      } catch (_) {}
      setTfState(next);
    };

    useEffect(() => {
      const onPop = () => setTfState(readTf());
      window.addEventListener("popstate", onPop);
      return () => window.removeEventListener("popstate", onPop);
    }, []);

    useEffect(() => {
      localStorage.setItem("por_ind_tf", tf);
      try {
        const u = new URL(location.href);
        if (u.searchParams.get("tf") !== tf) {
          u.searchParams.set("tf", tf);
          history.replaceState({ tf }, "", u);
        }
      } catch (_) {}
    }, [tf]);

    useEffect(() => {
      let dead = false;
      let ws = null;
      let es = null;
      let timer = null;
      let retry = null;
      const abortCtrl = new AbortController();

      const st = {};
      store.current = st;

      ASSETS.forEach((a) => {
        st[a.s] = { c: synth(a, tf), live: false, src: "sim" };
      });

      const refresh = () => {
        if (dead) return;
        setRows(
          ASSETS.map((a) => ({
            ...compute(a, st[a.s].c, tf),
            live: st[a.s].live,
            src: st[a.s].src
          }))
        );
        setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
      };

      refresh();

      const connectWs = () => {
        if (dead) return;
        const bnAssets = ASSETS.filter((a) => a.bn);
        if (!bnAssets.length) return;
        try {
          if (ws) ws.close();
          const streams = bnAssets.map((a) => `${a.bn.toLowerCase()}@kline_${BN_INT[tf]}`).join("/");
          ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
          ws.onmessage = (ev) => {
            if (dead) return;
            const payload = JSON.parse(ev.data);
            const d = payload && payload.data;
            if (!d || !d.k) return;
            const k = d.k;
            if (k.i && k.i.toLowerCase() !== tf) return;

            const asset = ASSETS.find((x) => x.bn === d.s);
            if (!asset || !st[asset.s]) return;
            if (st[asset.s].src === "oanda") return;

            const barTime = Math.floor(Number(k.t) / 1000);
            const bar = { t: barTime, o: +k.o, h: +k.h, l: +k.l, c: +k.c };
            const c = st[asset.s].c;
            const lastBar = last(c);

            if (lastBar && Math.abs(lastBar.t - bar.t) < TFS[tf]) {
              c[c.length - 1] = bar;
            } else if (!lastBar || bar.t >= lastBar.t) {
              c.push(bar);
              if (c.length > LIMIT) c.shift();
            }
            st[asset.s].live = true;
            st[asset.s].src = "binance";
          };
          ws.onclose = () => {
            if (!dead) retry = setTimeout(connectWs, 3500);
          };
        } catch (_) {}
      };

      ASSETS.forEach(async (a) => {
        let candles = null;
        let src = "sim";

        if (a.od && OANDA) {
          try {
            const j = await fetchJsonWithTimeout(
              `${OANDA}/candles?instrument=${a.od}&granularity=${OGRAN[tf]}&count=${LIMIT}`,
              abortCtrl.signal
            );
            if (Array.isArray(j.candles) && j.candles.length >= 200) {
              candles = j.candles.map((k) => ({
                t: Math.floor(Date.parse(k.time) / 1000),
                o: +k.mid.o,
                h: +k.mid.h,
                l: +k.mid.l,
                c: +k.mid.c
              }));
              src = "oanda";
            }
          } catch (_) {}
        }

        if (!candles && a.bn) {
          try {
            const j = await fetchJsonWithTimeout(
              `https://api.binance.com/api/v3/klines?symbol=${a.bn}&interval=${BN_INT[tf]}&limit=${LIMIT}`,
              abortCtrl.signal
            );
            if (Array.isArray(j) && j.length >= 200) {
              candles = j.map((k) => ({
                t: Math.floor(Number(k[0]) / 1000),
                o: +k[1],
                h: +k[2],
                l: +k[3],
                c: +k[4]
              }));
              src = "binance";
            }
          } catch (_) {}
        }

        if (!dead && candles) {
          st[a.s] = { c: candles, live: true, src };
          refresh();
          if (src === "oanda" && a.s === "XAUUSD" && OANDA && !es) {
            try {
              es = new EventSource(OANDA + "/stream?instrument=XAU_USD");
              es.onmessage = (ev) => {
                if (dead) return;
                const m = +JSON.parse(ev.data).mid;
                if (!m) return;
                const step = TFS[tf];
                const bucket = Math.floor(Date.now() / 1000 / step) * step;
                const c = st.XAUUSD.c;
                const b = last(c);
                if (bucket > b.t) {
                  c.push({ t: bucket, o: b.c, h: m, l: m, c: m });
                  if (c.length > LIMIT) c.shift();
                } else {
                  b.c = m;
                  b.h = Math.max(b.h, m);
                  b.l = Math.min(b.l, m);
                }
              };
            } catch (_) {}
          }
        }
      });

      connectWs();

      timer = setInterval(() => {
        if (dead) return;
        const step = TFS[tf];
        const bucket = Math.floor(Date.now() / 1000 / step) * step;
        ASSETS.forEach((a) => {
          if (!st[a.s] || st[a.s].live) return;
          const c = st[a.s].c;
          const b = last(c);
          if (!b) return;
          if (bucket > b.t) {
            c.push({ t: bucket, o: b.c, h: b.c, l: b.c, c: b.c });
            if (c.length > LIMIT) c.shift();
            return;
          }
          b.c *= 1 + (Math.random() - 0.5) * a.vol * 0.12;
          b.h = Math.max(b.h, b.c);
          b.l = Math.min(b.l, b.c);
        });
        refresh();
      }, 1000);

      return () => {
        dead = true;
        abortCtrl.abort();
        clearInterval(timer);
        clearTimeout(retry);
        if (ws) ws.close();
        if (es) es.close();
      };
    }, [tf]);

    const shown = useMemo(
      () =>
        rows.filter(
          (r) =>
            (cat === "ALL" || r.a.cat === cat) &&
            (bias === "ALL" || r.bias === bias) &&
            (!q.trim() || (r.a.s + r.a.n + r.regime).toLowerCase().includes(q.toLowerCase()))
        ),
      [rows, cat, bias, q]
    );

    const cnt = (b) => rows.filter((r) => r.bias === b).length;
    const avg = rows.length ? Math.round(sum(rows.map((r) => r.confidence)) / rows.length) : 0;
    const open = rows.find((r) => r.a.s === sel);

    const group = (list, val, set, label) =>
      h(
        "div",
        { className: "grp" },
        list.map((x) =>
          h(
            "button",
            {
              key: x,
              type: "button",
              className: "btn" + (val === x ? " on" : ""),
              onClick: () => set(x)
            },
            label ? label(x) : x
          )
        )
      );

    return h("div", { className: "wrap" },
      h("div", { className: "ticker" },
        h("span", { style: { color: "var(--pink)", fontWeight: 800, fontSize: 11 } }, `● LIVE (${tf.toUpperCase()})`),
        rows.map((r) =>
          h("div", { key: r.a.s, className: "chip", onClick: () => setSel(r.a.s) },
            h("strong", null, r.a.s),
            h("span", null, fmt(r.px, r.a.d)),
            h("span", { className: r.chg >= 0 ? "up" : "down" }, sgn(r.chg) + "%")
          )
        )
      ),
      h("section", { className: "hero" },
        h("div", null,
          h("h1", null, "Dashboard / Technical Indicators"),
          h("p", null, "EMA 20/50/200, ADX-14 + DI edge, RSI-14, ATR distance, Choppiness and MACD — dynamically recalculated from candles for the selected timeframe, with 5-indicator confluence voting.")
        ),
        h("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 } },
          h("div", { className: "sync" },
            h("span", { className: "dot" }),
            `Active Timeframe: ${tf.toUpperCase()} · Synced ${clock}`
          ),
          h("div", { style: { display: "flex", gap: 8 } },
            h("a", { className: "btn on", href: `xauusd.html?tf=${tf}`, style: { textDecoration: "none" } }, `XAUUSD (${tf.toUpperCase()}) Chart ↗`),
            h("a", { className: "btn", href: "index.html", style: { textDecoration: "none" } }, "← Main Dashboard")
          )
        )
      ),
      h("section", { className: "kpis" },
        [
          ["Assets (" + tf.toUpperCase() + ")", ASSETS.length, "var(--pink)"],
          ["Bullish", cnt("BULLISH"), "var(--bull)"],
          ["Bearish", cnt("BEARISH"), "var(--bear)"],
          ["Neutral", cnt("NEUTRAL"), "var(--warn)"],
          ["Avg confidence", avg + "%"]
        ].map((k) =>
          h("div", { key: k[0], className: "kpi" },
            h("small", null, k[0]),
            h("b", { style: { color: k[2] } }, k[1])
          )
        )
      ),
      h("section", { className: "bar" },
        group(Object.keys(TFS), tf, changeTf, (x) => x.toUpperCase()),
        group(["ALL", "GOLD", "FOREX", "CRYPTO", "INDICES", "OIL"], cat, setCat),
        group(["ALL", "BULLISH", "BEARISH", "NEUTRAL"], bias, setBias),
        h("input", {
          className: "search",
          placeholder: "Search symbol or regime…",
          value: q,
          onChange: (e) => setQ(e.target.value)
        })
      ),
      shown.length
        ? h("section", { className: "grid" }, shown.map((r) => h(Card, { key: r.a.s + "_" + r.tf, r, onOpen: setSel })))
        : h("div", { className: "empty" }, `No assets match your filter on ${tf.toUpperCase()}.`),
      open && h(Modal, { r: open, onClose: () => setSel(null) })
    );
  }

  if (typeof document !== "undefined") {
    const rootEl = document.getElementById("root");
    if (rootEl) ReactDOM.createRoot(rootEl).render(h(App));
  }
})();

// Scroll interaction handler attached safely after DOM load
document.addEventListener('DOMContentLoaded', () => {
  const ticker = document.querySelector('.ticker');

  if (ticker) {
    ticker.addEventListener('wheel', (evt) => {
      evt.preventDefault();
      ticker.scrollLeft += evt.deltaY;
    });

    let isDown = false;
    let startX;
    let scrollLeft;

    ticker.addEventListener('mousedown', (e) => {
      isDown = true;
      ticker.classList.add('active');
      startX = e.pageX - ticker.offsetLeft;
      scrollLeft = ticker.scrollLeft;
    });

    ticker.addEventListener('mouseleave', () => {
      isDown = false;
    });

    ticker.addEventListener('mouseup', () => {
      isDown = false;
    });

    ticker.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - ticker.offsetLeft;
      const walk = (x - startX) * 2;
      ticker.scrollLeft = scrollLeft - walk;
    });
  }
});