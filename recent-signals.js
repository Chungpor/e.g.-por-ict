"use strict";
/**
 * Por ICT - Recent signals (history shown above Chart Analysis).
 *
 * Reads every saved signal from PorTrades (the same store My Trades uses), so both pages always agree.
 * - Shows the latest signals as cards: entry / target / stop, confidence, opened / closed time, TP / SL result.
 * - Keeps checking open signals against live candles (PorTrades.trackAll) while this page is open.
 * - Extra info that the trade store does not keep (confidence, "what supports it / risks") is saved
 *   separately under "por_signal_meta" by PorSignals.remember(), called from chart-analysis.js.
 */
(function () {
  const root = document.getElementById("caRecent");
  if (!root) return;

  // Inject CSS for circular image avatars inside .rs-av
  if (!document.getElementById("rsPairAvatarStyles")) {
    const style = document.createElement("style");
    style.id = "rsPairAvatarStyles";
    style.textContent = `
      .rs-av.rs-av-has-img {
        background: transparent !important;
        padding: 0 !important;
        overflow: hidden !important;
        border-radius: 50% !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .rs-av-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  // Ensure PorTrades exists even if trades-store.js was misnamed or loaded out of order
  if (!window.PorTrades && window.TradesStore) {
    window.PorTrades = window.TradesStore;
  }

  function getStore() {
    return window.PorTrades || window.TradesStore || null;
  }

  // Hook PorTrades mutations so same-tab changes automatically dispatch "por:trades-changed"
  function bindStoreEvents() {
    const S = getStore();
    if (!S || S.__porEventsBound) return;
    S.__porEventsBound = true;
    ["add", "update", "remove", "clearAll", "setSettings"].forEach((fn) => {
      if (typeof S[fn] === "function") {
        const orig = S[fn];
        S[fn] = function (...args) {
          const res = orig.apply(this, args);
          window.dispatchEvent(new CustomEvent("por:trades-changed"));
          return res;
        };
      }
    });
  }
  bindStoreEvents();

  const META_KEY = "por_signal_meta";
  const LIMIT = 6;          // cards shown on this page ("View all" opens My Trades)
  const TAGS_SHOWN = 3;
  const TRACK_EVERY = 30000;

  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Built-in SVG fallbacks matching your 6 uploaded images so icons never break even if a file is moved
  const SVG_FALLBACKS = {
    XAUUSD: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#cc8e00"/><g fill="none" stroke="#fff" stroke-width="4.5" stroke-linejoin="round"><polygon points="37,44 63,44 59,29 41,29"/><polygon points="22,66 48,66 44,51 26,51"/><polygon points="52,66 78,66 74,51 56,51"/></g><polygon points="37,44 63,44 59,33" fill="#fff"/><polygon points="22,66 48,66 44,55" fill="#fff"/><polygon points="52,66 78,66 74,55" fill="#fff"/></svg>'),
    BTCUSD: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#f7931a"/><text x="50" y="69" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-weight="bold" font-size="56" transform="rotate(12 50 50)">₿</text></svg>'),
    ETHUSD: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#627eea"/><polygon points="50,14 27,51 50,40" fill="#fff"/><polygon points="50,14 73,51 50,40" fill="#c0cbf6"/><polygon points="50,62 27,51 50,40" fill="#c0cbf6"/><polygon points="50,62 73,51 50,40" fill="#8197ee"/><polygon points="50,86 27,56 50,67" fill="#fff"/><polygon points="50,86 73,56 50,67" fill="#c0cbf6"/></svg>'),
    EURUSD: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="#d9a300" stroke="#ffbe00" stroke-width="6"/><text x="48" y="70" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-weight="bold" font-size="60">€</text></svg>'),
    GBPUSD: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#5a1f7d"/><text x="50" y="71" text-anchor="middle" fill="#fff" font-family="Georgia,serif" font-weight="bold" font-size="62">£</text></svg>'),
    USDJPY: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#1b4fd8"/><circle cx="50" cy="50" r="35" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="95 15"/><text x="50" y="67" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-weight="bold" font-size="50">$</text></svg>')
  };

  const COINS = {
    XAUUSD: {
      sub: "Gold",
      img: "image_6652d9.png",
      altImg: "xauusd.png",
      fallback: SVG_FALLBACKS.XAUUSD,
      sym: "Au",
      bg: "linear-gradient(135deg,#fde68a,#f59e0b)"
    },
    BTCUSD: {
      sub: "Crypto",
      img: "image_665600.png",
      altImg: "btcusd.png",
      fallback: SVG_FALLBACKS.BTCUSD,
      sym: "₿",
      bg: "linear-gradient(135deg,#fdba74,#f97316)"
    },
    ETHUSD: {
      sub: "Crypto",
      img: "image_66565b.png",
      altImg: "ethusd.png",
      fallback: SVG_FALLBACKS.ETHUSD,
      sym: "Ξ",
      bg: "linear-gradient(135deg,#a5b4fc,#6366f1)"
    },
    EURUSD: {
      sub: "Forex",
      img: "image_7034b8.png",
      altImg: "eurusd.png",
      fallback: SVG_FALLBACKS.EURUSD,
      sym: "€",
      bg: "linear-gradient(135deg,#7dd3fc,#0284c7)"
    },
    GBPUSD: {
      sub: "Forex",
      img: "image_70381d.png",
      altImg: "gbpusd.png",
      fallback: SVG_FALLBACKS.GBPUSD,
      sym: "£",
      bg: "linear-gradient(135deg,#c084fc,#7c3aed)"
    },
    USDJPY: {
      sub: "Forex",
      img: "image_704059.png",
      altImg: "usdjpy.png",
      fallback: SVG_FALLBACKS.USDJPY,
      sym: "$",
      bg: "linear-gradient(135deg,#fca5a5,#dc2626)"
    }
  };

  function resolveCoin(pair) {
    const clean = String(pair || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (COINS[clean]) return COINS[clean];
    if (clean.includes("XAU") || clean.includes("GOLD") || clean.includes("PAXG")) return COINS.XAUUSD;
    if (clean.includes("BTC")) return COINS.BTCUSD;
    if (clean.includes("ETH")) return COINS.ETHUSD;
    if (clean.includes("EUR")) return COINS.EURUSD;
    if (clean.includes("GBP")) return COINS.GBPUSD;
    if (clean.includes("JPY")) return COINS.USDJPY;
    return {
      sub: "Market",
      img: null,
      altImg: null,
      fallback: null,
      sym: String(pair || "?").slice(0, 1),
      bg: "linear-gradient(135deg,#475569,#1e293b)"
    };
  }

  function renderAvatar(pair, c) {
    if (c && c.img) {
      return `<div class="rs-av rs-av-has-img" aria-hidden="true"><img class="rs-av-img" src="${esc(c.img)}" alt="${esc(pair)}" data-alt="${esc(c.altImg || "")}" data-fb="${esc(c.fallback || "")}" onerror="if(this.dataset.alt && this.src.indexOf(this.dataset.alt)===-1){this.src=this.dataset.alt;}else if(this.dataset.fb){this.onerror=null;this.src=this.dataset.fb;}" /></div>`;
    }
    return `<div class="rs-av" style="background:${c.bg}" aria-hidden="true">${esc(c.sym)}</div>`;
  }

  let filter = "all", busy = false, syncText = "";
  const openTags = new Set();

  // ---------- extra info per trade (confidence + reasons) ----------
  function readMeta() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function writeMeta(m) {
    try {
      const ids = Object.keys(m);
      if (ids.length > 400) ids.slice(0, ids.length - 400).forEach((k) => delete m[k]);
      localStorage.setItem(META_KEY, JSON.stringify(m));
    } catch (e) {
      /* storage full or blocked: cards still work without it */
    }
  }

  // ---------- helpers ----------
  const trades = () => {
    try {
      const S = getStore();
      return S ? (S.load() || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)) : [];
    } catch (e) {
      return [];
    }
  };
  const winTp = () => {
    try {
      const S = getStore();
      return (S && S.settings && S.settings().winTp) || 1;
    } catch (e) {
      return 1;
    }
  };
  const resultOf = (t) => {
    try {
      const S = getStore();
      return S ? S.resultOf(t, winTp()) : { state: "open", r: 0 };
    } catch (e) {
      return { state: "open", r: 0 };
    }
  };
  const dec = (t) => t.dec ?? 2;
  const px = (t, v) => (v == null || isNaN(+v) ? "–" : Number(v).toFixed(dec(t)));
  const fmtR = (r) => (r > 0 ? "+" : "") + Number(r || 0).toFixed(2) + "R";

  function when(ts) {
    if (!ts) return "–";
    const d = new Date(ts);
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
    return `${date} · ${time} <small>UTC</small>`;
  }
  const isHit = (t, i) =>
    (!t.manual && t.hits && t.hits.tp && t.hits.tp[i]) ||
    (t.manual && t.manual.result === "win" && t.manual.level >= i + 1);

  function statusPill(r) {
    if (r.state === "win") return `<span class="rs-pill st-win">✓ TP${r.level || ""} HIT</span>`;
    if (r.state === "loss") return `<span class="rs-pill st-loss">✕ SL HIT</span>`;
    if (r.state === "be") return `<span class="rs-pill st-be">CLOSED · BREAKEVEN</span>`;
    return `<span class="rs-pill st-open"><span class="rs-dot"></span>OPEN</span>`;
  }
  const bars = (conf) => {
    const n = conf == null ? 0 : Math.max(1, Math.min(4, Math.round(conf / 25)));
    return `<span class="rs-bars" aria-hidden="true">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
  };
  const trackNote = (t, r) =>
    t.manual ? "Marked by you" : t.auto ? (r.state === "open" ? "Auto-tracking" : "Auto-tracked") : "Manual tracking";

  // ---------- card ----------
  function card(t, meta) {
    const r = resultOf(t),
      buy = t.dir === "BUY",
      c = resolveCoin(t.pair);
    const m = meta[t.id] || {},
      conf = m.conf,
      tags = m.tags || [];
    const target = (t.tps || [])[winTp() - 1] ?? (t.tps || [])[0];
    const shown = openTags.has(t.id) ? tags : tags.slice(0, TAGS_SHOWN),
      hidden = tags.length - TAGS_SHOWN;
    const closed = r.state !== "open" && r.at ? when(r.at) : "–";
    const resultChip =
      r.state === "win"
        ? `<span class="rs-mini win">TP${r.level || ""} Hit · ${fmtR(r.r)}</span>`
        : r.state === "loss"
        ? `<span class="rs-mini loss">SL Hit · ${fmtR(r.r)}</span>`
        : r.state === "be"
        ? `<span class="rs-mini">Breakeven</span>`
        : `<span class="rs-mini">Waiting for TP or SL</span>`;

    return `<article class="rs-card ${buy ? "buy" : "sell"}" data-id="${esc(t.id)}">
      <div class="rs-top">
        ${renderAvatar(t.pair, c)}
        <div class="rs-id"><div class="rs-pair">${esc(t.pair)}</div><div class="rs-sub">${esc(c.sub)} · ${esc(t.tf)}</div></div>
        <div class="rs-src">${esc(t.source || "Signal")}</div>
      </div>
      <div class="rs-chips">
        <span class="rs-pill dir ${buy ? "buy" : "sell"}"><span class="rs-dot"></span>${buy ? "BUY" : "SELL"}</span>
        ${statusPill(r)}
        <span class="rs-pill st-auto">${esc(trackNote(t, r)).toUpperCase()}</span>
      </div>
      <div class="rs-rows">
        <div class="rs-row"><span>Entry</span><strong>${px(t, t.entry)}</strong></div>
        <div class="rs-row tp"><span>Target</span><strong>${px(t, target)}</strong></div>
        <div class="rs-row sl"><span>Stop</span><strong>${px(t, t.sl)}</strong></div>
      </div>
      ${
        tags.length
          ? `<div class="rs-tags">${shown
              .map((g) => `<span class="rs-tag ${g.k === "ok" ? "ok" : ""}"><i></i>${esc(g.t)}</span>`)
              .join("")}${
              hidden > 0
                ? `<button type="button" class="rs-more" data-more="${esc(t.id)}" aria-expanded="${openTags.has(t.id)}">${
                    openTags.has(t.id) ? "Show less" : "+" + hidden + " more"
                  }</button>`
                : ""
            }</div>`
          : ""
      }
      <div class="rs-rows">
        <div class="rs-row"><span>Confidence</span><strong>${bars(conf)}${conf == null ? "–" : conf + "%"}</strong></div>
        <div class="rs-row time"><span>Opened</span><strong>${when(t.createdAt)}</strong></div>
        <div class="rs-row time"><span>Closed</span><strong>${closed}</strong></div>
      </div>
      <div class="rs-foot">${t.strategy ? `<span class="rs-mini">${esc(t.strategy)}</span>` : ""}<span class="rs-mini hi">${esc(
      t.source || "Signal"
    )}</span>${resultChip}</div>
      <button type="button" class="rs-view" data-view="${esc(t.id)}">View details</button>
    </article>`;
  }

  // ---------- details dialog ----------
  function openDetails(id, opener) {
    const t = trades().find((x) => String(x.id) === String(id));
    if (!t) return;
    const r = resultOf(t),
      buy = t.dir === "BUY",
      m = readMeta()[t.id] || {},
      c = resolveCoin(t.pair);
    const slHit = r.state === "loss";
    const tps = (t.tps || [])
      .map((p, i) => `<div class="tp ${isHit(t, i) ? "hit" : ""}"><span>TP${i + 1}${isHit(t, i) ? " ✓" : ""}</span><strong>${px(t, p)}</strong></div>`)
      .join("");
    const tags = (m.tags || []).map((g) => `<span class="rs-tag ${g.k === "ok" ? "ok" : ""}"><i></i>${esc(g.t)}</span>`).join("");
    const kv = [
      ["Opened", when(t.createdAt)],
      ["Closed", r.state !== "open" && r.at ? when(r.at) : "–"],
      ["Result", r.state === "open" ? "Open" : fmtR(r.r)],
      ["Confidence", m.conf == null ? "–" : m.conf + "%"],
      ["Strategy", esc(t.strategy || "–")],
      ["Source", esc(t.source || "–")],
      ["Tracking", esc(trackNote(t, r))],
      ["Lots / risk", t.lots != null ? `${t.lots < 0.01 ? "&lt;0.01" : Number(t.lots).toFixed(2)} lots · $${Number(t.riskUsd || 0).toFixed(2)}` : "–"]
    ]
      .map(([k, v]) => `<span>${k}</span><b>${v}</b>`)
      .join("");

    const wrap = document.createElement("div");
    wrap.className = "rs-modal";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", `${t.pair} signal details`);
    wrap.innerHTML = `<div class="rs-sheet">
      <div class="rs-sheet-h">${renderAvatar(t.pair, c)}
        <div class="rs-id"><div class="rs-pair">${esc(t.pair)} · ${esc(t.tf)}</div><div class="rs-sub">${esc(c.sub)}</div></div>
        <span class="rs-pill dir ${buy ? "buy" : "sell"}">${buy ? "▲ BUY" : "▼ SELL"}</span>
        <button type="button" class="rs-x" aria-label="Close">×</button></div>
      ${statusPill(r)}
      <div class="rs-lv"><div class="en"><span>ENTRY</span><strong>${px(t, t.entry)}</strong></div><div class="sl ${slHit ? "hit" : ""}"><span>STOP LOSS${
      slHit ? " ✕" : ""
    }</span><strong>${px(t, t.sl)}</strong></div>${tps}</div>
      <h4>DETAILS</h4><div class="rs-kv">${kv}</div>
      ${tags ? `<h4>WHAT SUPPORTS IT / RISKS</h4><div class="rs-tags" style="border:0;padding:0">${tags}</div>` : ""}
      <div class="rs-acts"><a class="ca-btn2" href="my-trades.html#trade-${encodeURIComponent(t.id)}">Open in My Trades</a><button type="button" class="ca-btn2" data-close>Close</button></div>
    </div>`;

    const close = () => {
      wrap.remove();
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (opener && opener.focus) opener.focus();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap || e.target.closest(".rs-x") || e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.appendChild(wrap);
    wrap.querySelector(".rs-x").focus();
  }

  // ---------- render ----------
  function render() {
    bindStoreEvents();
    const all = trades(),
      meta = readMeta();
    const withR = all.map((t) => ({ t, r: resultOf(t) }));
    const n = (s) => withR.filter((x) => x.r.state === s).length;
    const shown = withR
      .filter((x) => filter === "all" || x.r.state === filter)
      .slice(0, LIMIT)
      .map((x) => x.t);
    const f = (key, label, count) =>
      `<button type="button" class="rs-filter ${filter === key ? "on" : ""}" data-f="${key}" aria-pressed="${filter === key}">${label}<b>${count}</b></button>`;

    root.innerHTML = `
      <div class="rs-head">
        <div><div class="rs-eyebrow">Your desk</div><h2 class="rs-title">Recent signals</h2></div>
        <div class="rs-head-r"><span class="rs-sync" aria-live="polite">${esc(syncText)}</span>
          <button type="button" class="rs-refresh" id="rsRefresh" ${busy ? "disabled" : ""}>${busy ? "Checking…" : "Check now"}</button>
          <a class="rs-link" href="my-trades.html">View all →</a></div>
      </div>
      <div class="rs-filters" role="group" aria-label="Filter signals">${f("all", "All", all.length)}${f("open", "Open", n("open"))}${f(
      "win",
      "Hit TP",
      n("win")
    )}${f("loss", "Hit SL", n("loss"))}</div>
      <div class="rs-grid">${
        shown.length
          ? shown.map((t) => card(t, meta)).join("")
          : `<div class="rs-empty">${
              all.length
                ? "No signals match this filter."
                : "No signals yet.<br />Press <b>Analyze</b> below and the signal is saved here automatically, then checked for TP or SL."
            }</div>`
      }</div>`;
  }

  // ---------- live TP / SL checking ----------
  async function track(manual) {
    const S = getStore();
    if (busy || !S || typeof S.trackAll !== "function") return;
    busy = true;
    render();
    try {
      const res = await S.trackAll();
      const tm = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      syncText =
        res.failed && !res.checked
          ? "Could not load market data"
          : res.checked
          ? `Checked ${tm}${res.resolved ? ` · ${res.resolved} closed` : ""}`
          : manual
          ? "Nothing to check"
          : "";
    } catch (e) {
      syncText = "Could not load market data";
    }
    busy = false;
    render();
  }

  // ---------- events ----------
  root.addEventListener("click", (e) => {
    const f = e.target.closest("[data-f]");
    if (f) {
      filter = f.dataset.f;
      render();
      return;
    }
    const more = e.target.closest("[data-more]");
    if (more) {
      const id = more.dataset.more;
      openTags.has(id) ? openTags.delete(id) : openTags.add(id);
      render();
      return;
    }
    const v = e.target.closest("[data-view]");
    if (v) {
      openDetails(v.dataset.view, v);
      return;
    }
    if (e.target.closest("#rsRefresh")) track(true);
  });

  window.addEventListener("por:trades-changed", render);
  window.addEventListener("storage", (ev) => {
    if (!ev.key || /trade|signal/i.test(ev.key)) render();
  });

  // ---------- public API ----------
  window.PorSignals = {
    /** Called by chart-analysis.js right after a signal is saved. Keeps confidence + reasons for the card. */
    remember(id, info) {
      if (id == null) return;
      const m = readMeta();
      if (!m[id]) {
        m[id] = { conf: info && info.conf != null ? info.conf : null, tags: (info && info.tags) || [] };
        writeMeta(m);
      }
      filter = "all";
      render();
    },
    refresh: render,
    check: () => track(true)
  };

  render();
  if (getStore()) {
    track(false);
    setInterval(() => {
      if (!document.hidden) track(false);
    }, TRACK_EVERY);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) track(false);
    });
  }
})();