"use strict";
/** Por ICT - My Trades page: History (TP / SL tracking), Journal, Performance. */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const S = window.PorTrades;
  let filter = "all", tab = "history", tracking = false;
  let focusId = decodeURIComponent((location.hash || "").slice(1)).replace(/^trade-/, ""), focusScrolled = false; // from Chart Analysis "Open in My Trades"

  const fmtDate = (ts) => new Date(ts).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const fmtR = (r) => (r > 0 ? "+" : "") + r.toFixed(2) + "R";
  const num = (t, v) => Number(v).toFixed(t.dec ?? 2);

  // ---------- tabs ----------
  function setTab(name) {
    tab = name;
    document.querySelectorAll(".mt-tab").forEach((b) => {
      const on = b.dataset.tab === name;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
    $("tabHistory").classList.toggle("hidden", name !== "history");
    $("tabJournal").classList.toggle("hidden", name !== "journal");
    $("tabPerformance").classList.toggle("hidden", name !== "performance");
    render();
  }

  // ---------- history ----------
  function badge(r, t) {
    if (r.state === "win") return `<span class="mt-badge win">✓ TP${r.level} HIT</span>`;
    if (r.state === "loss") return `<span class="mt-badge loss">✕ SL HIT</span>`;
    if (r.state === "be") return `<span class="mt-badge be">CLOSED · BREAKEVEN</span>`;
    return `<span class="mt-badge open">OPEN</span>`;
  }

  function tradeCard(t) {
    const r = S.resultOf(t), buy = t.dir === "BUY";
    const slHit = !!t.hits.sl && r.state === "loss" && r.by === "auto";
    const tpCells = t.tps.map((p, i) => {
      const hit = (!t.manual && t.hits.tp[i]) || (t.manual && t.manual.result === "win" && t.manual.level >= i + 1);
      return `<div class="mt-lv tp ${hit ? "hit" : ""}"><span>TP${i + 1}${hit ? " ✓" : ""}</span><strong>${num(t, p)}</strong></div>`;
    }).join("");
    const rText = r.state === "open" ? "" : `<span class="${r.r > 0 ? "r-pos" : r.r < 0 ? "r-neg" : ""}">${fmtR(r.r)}</span>`;
    const closedAt = r.state !== "open" && r.at ? `<span>${r.by === "manual" ? "Marked" : "Closed"} ${fmtDate(r.at)}</span>` : "";
    const trackNote = t.manual ? "Marked by you"
      : t.auto ? (r.state === "open" ? (t.lastCheck ? `Auto-tracking · checked ${fmtDate(t.lastCheck)}` : "Auto-tracking · waiting for first check") : "Auto-tracked")
      : "Manual tracking (no live data for this signal)";
    const sizing = t.lots != null ? `<span>${t.lots < 0.01 ? "&lt;0.01" : Number(t.lots).toFixed(2)} lots · risk $${Number(t.riskUsd || 0).toFixed(2)}</span>` : "";

    let actions = "";
    if (t.manual) {
      actions = `<button type="button" class="mt-act" data-act="reopen">Reopen</button>`;
    } else if (r.state === "open") {
      actions = `<span class="lbl">Mark result:</span>
        <button type="button" class="mt-act good" data-act="tp" data-lv="1">TP1</button>
        <button type="button" class="mt-act good" data-act="tp" data-lv="2">TP2</button>
        <button type="button" class="mt-act good" data-act="tp" data-lv="3">TP3</button>
        <button type="button" class="mt-act bad" data-act="sl">SL hit</button>
        <button type="button" class="mt-act" data-act="be">Breakeven</button>`;
    }
    actions += `<button type="button" class="mt-act push" data-act="del">Delete</button>`;

    return `<article class="mt-trade s-${r.state}" data-id="${esc(t.id)}">
      <div class="mt-top">
        <div class="mt-id"><span class="ca-dir ${buy ? "buy" : "sell"}">${buy ? "▲ BUY" : "▼ SELL"}</span><span class="mt-pair">${esc(t.pair)}</span><span class="mt-tf">${esc(t.tf)}</span></div>
        ${badge(r, t)}
      </div>
      <div class="mt-levels">
        <div class="mt-lv en"><span>ENTRY</span><strong>${num(t, t.entry)}</strong></div>
        <div class="mt-lv sl ${slHit ? "hit" : ""}"><span>SL${slHit ? " ✕" : ""}</span><strong>${num(t, t.sl)}</strong></div>
        ${tpCells}
      </div>
      <div class="mt-meta"><span>${fmtDate(t.createdAt)}</span>${t.strategy ? `<span>${esc(t.strategy)}</span>` : ""}${t.source ? `<span>${esc(t.source)}</span>` : ""}${sizing}${rText}${closedAt}</div>
      <div class="mt-meta" style="margin-top:2px"><span>${esc(trackNote)}</span></div>
      <div class="mt-actions">${actions}</div>
    </article>`;
  }

  function emptyState(msg) {
    return `<div class="mt-empty">${msg}</div>`;
  }

  function renderHistory() {
    const all = S.load(), win = S.settings().winTp;
    $("winTp").value = String(win);
    const withR = all.map((t) => ({ t, r: S.resultOf(t, win) }));
    $("cAll").textContent = all.length;
    $("cOpen").textContent = withR.filter((x) => x.r.state === "open").length;
    $("cWin").textContent = withR.filter((x) => x.r.state === "win").length;
    $("cLoss").textContent = withR.filter((x) => x.r.state === "loss").length;
    const shown = withR.filter((x) => filter === "all" || x.r.state === filter).map((x) => x.t);
    $("historyList").innerHTML = shown.length ? shown.map(tradeCard).join("")
      : emptyState(all.length ? "No trades match this filter." : `Nothing here yet.<br />Run an analysis in <a href="chart-analysis.html">Chart Analysis</a> and the signal is saved here automatically.`);
    focusTrade();
  }

  function focusTrade() {
    if (!focusId) return;
    const el = $("historyList").querySelector('[data-id="' + (window.CSS && CSS.escape ? CSS.escape(focusId) : focusId) + '"]');
    if (!el) return;
    el.classList.add("mt-focus");
    if (!focusScrolled) { focusScrolled = true; el.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => { focusId = ""; }, 4000); }
  }

  // ---------- journal ----------
  function renderJournal() {
    const all = S.load();
    $("journalList").innerHTML = all.length ? all.map((t) => {
      const r = S.resultOf(t), buy = t.dir === "BUY";
      return `<article class="mt-j" data-id="${esc(t.id)}">
        <div class="mt-top"><div class="mt-id"><span class="ca-dir ${buy ? "buy" : "sell"}">${buy ? "▲ BUY" : "▼ SELL"}</span><span class="mt-pair">${esc(t.pair)}</span><span class="mt-tf">${esc(t.tf)} · ${fmtDate(t.createdAt)}</span></div>${badge(r, t)}</div>
        <textarea class="ca-input" rows="3" placeholder="What did you see? What would you do differently?" data-note>${esc(t.note)}</textarea>
        <div class="mt-j-row">
          <label class="mt-follow">Did you follow your plan?
            <select class="ca-input" data-follow style="width:auto;padding:8px 32px 8px 12px;font-size:12.5px;border-radius:10px">
              <option value="" ${t.followed == null ? "selected" : ""}>Not set</option>
              <option value="yes" ${t.followed === "yes" ? "selected" : ""}>Yes</option>
              <option value="no" ${t.followed === "no" ? "selected" : ""}>No</option>
            </select></label>
          <span class="mt-saved" data-saved>Saved ✓</span>
        </div></article>`;
    }).join("") : emptyState(`No trades to journal yet.<br />Signals from <a href="chart-analysis.html">Chart Analysis</a> appear here.`);
  }

  // ---------- performance ----------
  function curveSvg(curve) {
    if (curve.length < 2) return `<p class="ca-muted" style="margin:0">The equity curve appears after two closed trades.</p>`;
    const W = 600, H = 160, pad = 10, pts = [0, ...curve];
    const min = Math.min(0, ...pts), max = Math.max(0, ...pts), span = max - min || 1;
    const x = (i) => pad + (i / (pts.length - 1)) * (W - pad * 2), y = (v) => H - pad - ((v - min) / span) * (H - pad * 2);
    const d = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const last = pts[pts.length - 1];
    return `<svg class="mt-curve" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Cumulative R curve, ending at ${fmtR(last)}">
      <line x1="${pad}" x2="${W - pad}" y1="${y(0)}" y2="${y(0)}" stroke="#28323f" stroke-dasharray="4 4" />
      <path d="${d}" fill="none" stroke="${last >= 0 ? "#00d26a" : "#ef4444"}" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke" /></svg>`;
  }

  function renderPerformance() {
    const win = S.settings().winTp, st = S.stats(S.load());
    if (!st.total) { $("perfBody").innerHTML = emptyState(`No data yet.<br />Your results show up here once signals are saved and closed.`); return; }
    const pf = st.profitFactor == null ? "–" : st.profitFactor === Infinity ? "∞" : st.profitFactor.toFixed(2);
    const cls = (v) => (v > 0 ? "pos" : v < 0 ? "neg" : "");
    $("perfBody").innerHTML = `
      <div class="mt-stats">
        <div class="mt-stat main"><span>Win rate</span><strong>${st.winRate == null ? "–" : st.winRate.toFixed(0) + "%"}</strong><small>${st.wins} TP · ${st.losses} SL${st.be ? ` · ${st.be} BE` : ""}</small></div>
        <div class="mt-stat main"><span>Total result</span><strong class="${cls(st.totalR)}">${fmtR(st.totalR)}</strong><small>${st.closed} closed trades</small></div>
        <div class="mt-stat"><span>Open now</span><strong>${st.open}</strong><small>${st.total} saved in total</small></div>
        <div class="mt-stat"><span>Average per trade</span><strong class="${cls(st.avgR || 0)}">${st.avgR == null ? "–" : fmtR(st.avgR)}</strong></div>
        <div class="mt-stat"><span>Profit factor</span><strong>${pf}</strong><small>gross wins ÷ gross losses</small></div>
        <div class="mt-stat"><span>Max drawdown</span><strong class="${st.maxDd ? "neg" : ""}">${st.maxDd ? "-" + st.maxDd.toFixed(2) + "R" : "0R"}</strong><small>best win streak ${st.bestStreak}</small></div>
      </div>
      <div class="mt-box"><h3>Cumulative result (R)</h3>${curveSvg(st.curve)}</div>
      ${st.byPair.length ? `<div class="mt-box"><h3>By pair</h3><table class="mt-table"><thead><tr><th>Pair</th><th>TP</th><th>SL</th><th>Result</th></tr></thead><tbody>
        ${st.byPair.map((p) => `<tr><td>${esc(p.pair)}</td><td>${p.wins}</td><td>${p.losses}</td><td class="${cls(p.r)}">${fmtR(p.r)}</td></tr>`).join("")}</tbody></table></div>` : ""}
      <p class="ca-muted" style="margin:0 0 10px">A win means price reached TP${win} before SL. Change this on the History tab. R = multiples of the amount risked per trade.</p>
      <button type="button" class="mt-danger" id="clearAllBtn">Delete all saved trades</button>`;
    $("clearAllBtn").addEventListener("click", () => { if (confirm("Delete all saved trades and journal notes? This cannot be undone.")) { S.clearAll(); render(); } });
  }

  function render() {
    if (tab === "history") renderHistory();
    else if (tab === "journal") renderJournal();
    else renderPerformance();
  }

  // ---------- tracking ----------
  async function check(manualClick) {
    if (tracking) return;
    tracking = true;
    const btn = $("refreshBtn"); btn.disabled = true; btn.textContent = "Checking…";
    try {
      const res = await S.trackAll();
      const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      $("syncText").textContent = res.failed && !res.checked ? "Could not load market data" : res.checked ? `Checked ${t}${res.resolved ? ` · ${res.resolved} closed` : ""}` : (manualClick ? "Nothing to check" : "");
    } catch (e) { $("syncText").textContent = "Could not load market data"; }
    btn.disabled = false; btn.textContent = "Check now"; tracking = false;
    if (tab !== "journal") render();
  }

  // ---------- events ----------
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".mt-tab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
    document.querySelectorAll(".mt-filter").forEach((b) => b.addEventListener("click", () => {
      filter = b.dataset.f;
      document.querySelectorAll(".mt-filter").forEach((x) => x.classList.toggle("active", x === b));
      renderHistory();
    }));
    $("winTp").addEventListener("change", (e) => { S.setSettings({ winTp: +e.target.value }); render(); });
    $("refreshBtn").addEventListener("click", () => check(true));

    $("historyList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const id = b.closest("[data-id]").dataset.id, now = Date.now(), act = b.dataset.act;
      if (act === "tp") S.update(id, { manual: { result: "win", level: +b.dataset.lv, at: now } });
      else if (act === "sl") S.update(id, { manual: { result: "loss", at: now } });
      else if (act === "be") S.update(id, { manual: { result: "be", at: now } });
      else if (act === "reopen") S.update(id, { manual: null });
      else if (act === "del") { if (!confirm("Delete this trade?")) return; S.remove(id); }
      render();
    });

    let timer = null;
    const flash = (card) => { const s = card.querySelector("[data-saved]"); s.classList.add("on"); setTimeout(() => s.classList.remove("on"), 1200); };
    $("journalList").addEventListener("input", (e) => {
      if (!e.target.matches("[data-note]")) return;
      const card = e.target.closest("[data-id]"); clearTimeout(timer);
      timer = setTimeout(() => { S.update(card.dataset.id, { note: e.target.value.slice(0, 2000) }); flash(card); }, 500);
    });
    $("journalList").addEventListener("change", (e) => {
      if (!e.target.matches("[data-follow]")) return;
      const card = e.target.closest("[data-id]");
      S.update(card.dataset.id, { followed: e.target.value || null }); flash(card);
    });

    render();
    check(false);
    setInterval(() => { if (!document.hidden) check(false); }, 30000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) check(false); });
  });
})();