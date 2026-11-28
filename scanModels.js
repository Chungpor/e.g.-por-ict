// =============================================================================
// scanModels.js  -  AI analysis profiles + TypeSafe validation + QRA 2.0
// Loaded AFTER scanChart.js. Everything here is real logic (no fake numbers):
//   * Profiles   : pick which Gemini model chain + thinking budget runs the scan
//   * TypeSafe   : schema/type/price-order validation of the AI JSON, with one
//                  corrective retry before falling back to the local engine
//   * QRA 2.0    : background Quantitative Risk Assessment of the final signal
// =============================================================================
(() => {
  'use strict';
  const LS_KEY = 'por_ai_profile';

  const PROFILES = {
    'drex-max-1.2': {
      id: 'drex-max-1.2', label: 'Drex Max v1.2', badge: 'FAST',
      desc: 'Balanced speed and depth',
      models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
      thinkingBudget: 1024, maxOutputTokens: 8192, temperature: 0.1
    },
    'd1.3-ultra': {
      id: 'd1.3-ultra', label: 'd1.3-ultra', badge: 'DEEP',
      desc: 'Deepest reasoning, slower',
      models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
      thinkingBudget: 8192, maxOutputTokens: 16384, temperature: 0.05
    }
  };

  const active = () => {
    let id = 'drex-max-1.2';
    try { id = localStorage.getItem(LS_KEY) || id; } catch (e) {}
    return PROFILES[id] || PROFILES['drex-max-1.2'];
  };
  const setActive = (id) => {
    if (!PROFILES[id]) return;
    try { localStorage.setItem(LS_KEY, id); } catch (e) {}
    renderSelector();
  };

  // Gemini 2.5 supports thinkingConfig; 2.0/1.5 reject it (HTTP 400) -> add per model.
  function tuneConfig(model, payload) {
    const p = active();
    const cfg = Object.assign({}, payload.generationConfig || {});
    cfg.temperature = p.temperature;
    cfg.maxOutputTokens = p.maxOutputTokens;
    if (/gemini-2\.5/.test(model)) {
      // 2.5-pro cannot disable thinking; give it at least the minimum budget
      cfg.thinkingConfig = { thinkingBudget: p.thinkingBudget };
    } else {
      delete cfg.thinkingConfig;
    }
    return Object.assign({}, payload, { generationConfig: cfg });
  }

  // ---------------------------------------------------------------- TypeSafe
  const num = (v) => {
    const m = String(v == null ? '' : v).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  };
  function typeSafe(r) {
    const issues = [];
    if (!r || typeof r !== 'object' || Array.isArray(r)) return { ok: false, issues: ['Result is not a JSON object'] };
    ['pair', 'timeframe'].forEach((k) => {
      if (typeof r[k] !== 'string' || !r[k].trim()) issues.push(`"${k}" must be a non-empty string`);
    });
    const action = String(r.action || '').toUpperCase();
    if (!/^(BUY|SELL)$/.test(action.trim())) issues.push('"action" must be exactly BUY or SELL');
    const f = {};
    ['entry', 'sl', 'tp1', 'tp2'].forEach((k) => {
      f[k] = num(r[k]);
      if (!Number.isFinite(f[k])) issues.push(`"${k}" must contain a single numeric price`);
    });
    if (['entry', 'sl', 'tp1', 'tp2'].every((k) => Number.isFinite(f[k])) && /^(BUY|SELL)$/.test(action.trim())) {
      const buy = action.trim() === 'BUY';
      const okOrder = buy ? (f.sl < f.entry && f.entry < f.tp1 && f.tp1 < f.tp2)
                          : (f.sl > f.entry && f.entry > f.tp1 && f.tp1 > f.tp2);
      if (!okOrder) issues.push(buy ? 'BUY needs sl < entry < tp1 < tp2' : 'SELL needs sl > entry > tp1 > tp2');
    }
    const c = num(r.confidence);
    if (r.confidence != null && (!Number.isFinite(c) || c < 0 || c > 100)) issues.push('"confidence" must be 0-100');
    return { ok: issues.length === 0, issues };
  }

  // Wrap a Gemini call: validate, retry once with the exact errors, else report.
  async function validateWithRetry(parsed, retryFn) {
    let res = typeSafe(parsed), retried = false;
    if (!res.ok && typeof retryFn === 'function') {
      retried = true;
      try {
        const again = await retryFn(res.issues);
        const res2 = typeSafe(again);
        if (res2.ok || res2.issues.length < res.issues.length) { parsed = again; res = res2; }
      } catch (e) { /* keep first answer */ }
    }
    parsed.__typeSafe = { passed: res.ok, issues: res.issues, retried };
    return parsed;
  }

  // ------------------------------------------------------------------ QRA 2.0
  function qra(r) {
    const entry = num(r.entry), sl = num(r.sl), tp1 = num(r.tp1), tp2 = num(r.tp2), cur = num(r.currentPrice);
    const risk = Math.abs(entry - sl);
    const rr1 = risk > 0 ? Math.abs(tp1 - entry) / risk : NaN;
    const rr2 = risk > 0 ? Math.abs(tp2 - entry) / risk : NaN;
    const slPct = entry ? (risk / entry) * 100 : NaN;
    const drift = Number.isFinite(cur) && entry ? (Math.abs(entry - cur) / entry) * 100 : NaN;
    const buy = String(r.action).toUpperCase().includes('BUY');
    const trendTxt = String(r.trend || '');
    const trendBull = /bull|ឡើង/i.test(trendTxt), trendBear = /bear|ចុះ/i.test(trendTxt);
    const aligned = (trendBull && buy) || (trendBear && !buy) ? true : (trendBull || trendBear ? false : null);
    const ts = r.__typeSafe;
    const source = r.__engine || 'unknown';

    let score = 100; const flags = [];
    if (!(rr1 >= 1)) { score -= 25; flags.push('TP1 reward is smaller than the risk (R:R < 1)'); }
    if (!(rr2 >= 2)) { score -= 10; flags.push('TP2 R:R is below 1:2'); }
    if (slPct > 1.5) { score -= 15; flags.push(`Wide stop (${slPct.toFixed(2)}% of entry)`); }
    if (drift > 0.5) { score -= 15; flags.push(`Entry is ${drift.toFixed(2)}% away from current price`); }
    if (aligned === false) { score -= 20; flags.push('Action is against the stated trend'); }
    if (ts && !ts.passed) { score -= 20; flags.push('TypeSafe found unresolved issues in the AI output'); }
    if (source === 'local') { score -= 10; flags.push('Local fallback engine was used (no cloud AI)'); }
    score = Math.max(0, score);
    const decision = score >= 75 ? 'TAKE' : score >= 50 ? 'WAIT' : 'SKIP';
    return { score, decision, flags, rr1, rr2, slPct, drift, aligned, source };
  }

  // --------------------------------------------------------------------- UI
  function renderSelector() {
    const sel = document.getElementById('newsFlipMode');
    if (!sel) return;
    let box = document.getElementById('aiProfileBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'aiProfileBox';
      box.className = 'w-full mt-3 flex flex-wrap items-center gap-2';
      sel.parentElement.insertAdjacentElement('afterend', box);
    }
    const cur = active();
    box.innerHTML = '<span class="text-[11px] font-bold text-slate-400 mr-1">AI Model</span>' +
      Object.values(PROFILES).map((p) => {
        const on = p.id === cur.id;
        return `<button type="button" data-ai-profile="${p.id}" aria-pressed="${on}" title="${p.desc}"
          class="px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${on
            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
            : 'bg-[#0b1220] border-slate-700 text-slate-400 hover:border-cyan-500/50'}">
          ${p.label} <span class="ml-1 text-[9px] opacity-70">${p.badge}</span></button>`;
      }).join('') +
      `<span class="text-[10px] text-slate-500">${cur.desc}. Runs on Google Gemini (${cur.models[0]}).</span>`;
    box.querySelectorAll('[data-ai-profile]').forEach((b) =>
      b.addEventListener('click', () => setActive(b.dataset.aiProfile)));
  }

  function renderQra(r) {
    const card = document.getElementById('resultCard');
    if (!card || !r) return;
    const q = qra(r);
    let el = document.getElementById('qraPanel');
    if (!el) {
      el = document.createElement('div');
      el.id = 'qraPanel';
      el.className = 'w-full mb-3 p-3 rounded-2xl bg-[#0b1220] border border-cyan-500/30 text-xs text-slate-300';
      card.insertBefore(el, card.firstChild);
    }
    const col = q.decision === 'TAKE' ? 'text-emerald-300' : q.decision === 'WAIT' ? 'text-amber-300' : 'text-rose-300';
    const f = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : 'n/a');
    const eng = q.source === 'gemini' ? `Gemini (${r.__model || 'cloud'})` : q.source === 'local' ? 'Local fallback engine' : 'n/a';
    const ts = r.__typeSafe;
    el.innerHTML =
      `<div class="flex flex-wrap items-center justify-between gap-2">
         <b class="text-cyan-300">QRA 2.0 Risk Check</b>
         <span class="font-extrabold ${col}">${q.decision} &middot; ${q.score}/100</span></div>
       <div class="mt-1 text-slate-400">R:R TP1 ${f(q.rr1)} &middot; TP2 ${f(q.rr2)} &middot; SL ${f(q.slPct)}% &middot; Engine: ${eng} &middot; TypeSafe: ${ts ? (ts.passed ? 'passed' : 'issues') + (ts.retried ? ' (retried)' : '') : 'n/a'}</div>` +
      (q.flags.length ? `<ul class="mt-1 list-disc pl-4 text-amber-200/90">${q.flags.map((x) => `<li>${x}</li>`).join('')}</ul>` : '') +
      `<div class="mt-1 text-[10px] text-slate-500">Automated checks on the signal's own numbers. Not financial advice; markets can move against any setup.</div>`;
  }

  // Run QRA off the main render path
  function scheduleQra(r) {
    const run = () => { try { renderQra(r); } catch (e) { console.warn('QRA failed', e); } };
    (window.requestIdleCallback || ((f) => setTimeout(f, 60)))(run);
  }

  window.PorModels = { PROFILES, active, setActive, tuneConfig, typeSafe, validateWithRetry, qra, scheduleQra };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderSelector);
  else renderSelector();
})();