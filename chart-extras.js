"use strict";
/**
 * Por ICT - Chart Analysis extras: banner carousel, ticker, quick-pair chips, background music.
 * Music uses the same YouTube track and the same "por_music_playing" setting as the main site.
 */
(function () {
  const $ = (id) => document.getElementById(id);

  // ---------- BANNERS ----------
  // pair: clicking the button selects that pair on the page. href: opens a page.
  const BANNERS = [
    { tag: "LIVE", emoji: "🥇", bg: "linear-gradient(135deg,#7c4a03,#f59e0b 70%,#fcd34d)", title: "XAUUSD Gold Live Analysis", text: "Analyze gold on the 5m chart with EMA trend, structure, RSI and ATR.", cta: "Analyze Gold", pair: "XAUUSD" },
    { tag: "CRYPTO", emoji: "₿", bg: "linear-gradient(135deg,#7c2d12,#f97316 70%,#fdba74)", title: "Bitcoin BTCUSD Signals", text: "Live Binance candles for fast crypto setups. Pick a timeframe and generate.", cta: "Analyze BTC", pair: "BTCUSD" },
    { tag: "CRYPTO", emoji: "Ξ", bg: "linear-gradient(135deg,#1e1b4b,#6366f1 70%,#a5b4fc)", title: "Ethereum ETHUSD Setup", text: "Check ETH structure and risk-reward before you enter.", cta: "Analyze ETH", pair: "ETHUSD" },
    { tag: "FOREX", emoji: "💶", bg: "linear-gradient(135deg,#052e4b,#0284c7 70%,#7dd3fc)", title: "EURUSD Major Pair", text: "The most traded pair in the world. Watch London and New York overlap.", cta: "Analyze EURUSD", pair: "EURUSD" },
    { tag: "FOREX", emoji: "💷", bg: "linear-gradient(135deg,#3b0764,#9333ea 70%,#d8b4fe)", title: "GBPUSD Cable Volatility", text: "Fast moves around London open. Size your risk carefully.", cta: "Analyze GBPUSD", pair: "GBPUSD" },
    { tag: "FOREX", emoji: "💴", bg: "linear-gradient(135deg,#7f1d1d,#dc2626 70%,#fca5a5)", title: "USDJPY Trend Rider", text: "Clean trends and respect for round-number levels.", cta: "Analyze USDJPY", pair: "USDJPY" },
    { tag: "ICT", emoji: "⏱️", bg: "linear-gradient(135deg,#064e3b,#059669 70%,#6ee7b7)", title: "ICT Killzones", text: "London 14:00-17:00, New York 19:30-22:30 and Asia 07:00-10:00 (Phnom Penh time). Trade the sessions with liquidity.", cta: "Open Terminal", href: "terminal.html" },
    { tag: "RISK", emoji: "🛡️", bg: "linear-gradient(135deg,#0f172a,#334155 70%,#94a3b8)", title: "Risk 1% Per Trade", text: "Protect your account first. Use the Position Sizing section to get your lot size.", cta: "Set Risk", scroll: "riskPct" },
    { tag: "NEWS", emoji: "📰", bg: "linear-gradient(135deg,#4a044e,#c026d3 70%,#f0abfc)", title: "High-Impact News Calendar", text: "Check CPI, NFP and FOMC on the Por ICT dashboard before you trade.", cta: "View Calendar", href: "index.html" },
    { tag: "AI", emoji: "🤖", bg: "linear-gradient(135deg,#022c22,#00d26a 70%,#86efac)", title: "Upload Your Chart", text: "Send up to 3 screenshots and get an AI-assisted reading of entry, stop loss and targets.", cta: "Upload Chart", mode: "upload" },
    { tag: "TIP", emoji: "🎧", bg: "linear-gradient(135deg,#0c4a6e,#0891b2 70%,#67e8f9)", title: "4K Zen Music", text: "Turn on background music to stay calm and focused while you analyze.", cta: "Play Music", music: true }
  ];

  const TICKER = [
    "Never risk more than you can afford to lose", "Wait for the liquidity sweep, then the displacement", "Higher-timeframe bias first, entry second",
    "No setup is also a trade", "Fair Value Gaps are zones, not magic lines", "Cut losses early, let winners run to TP",
    "Check news before NY open", "Journal every trade", "Respect the stop loss", "Premium = look for sells, Discount = look for buys"
  ];

  const track = $("caBnTrack"), dots = $("caBnDots"), wrap = $("caBanners");
  let idx = 0, timer = null;

  BANNERS.forEach((b, i) => {
    const slide = document.createElement("div");
    slide.className = "ca-bn";
    slide.style.setProperty("--bg-grad", b.bg);
    slide.dataset.emoji = b.emoji;
    slide.setAttribute("aria-hidden", i === 0 ? "false" : "true");
    slide.innerHTML = '<span class="ca-bn-tag"></span><h2></h2><p></p>';
    slide.querySelector(".ca-bn-tag").textContent = b.tag;
    slide.querySelector("h2").textContent = b.title;
    slide.querySelector("p").textContent = b.text;
    const cta = document.createElement(b.href ? "a" : "button");
    cta.className = "ca-bn-cta";
    cta.textContent = b.cta + " →";
    if (b.href) cta.href = b.href; else cta.type = "button";
    cta.addEventListener("click", () => {
      if (b.pair) selectPair(b.pair);
      if (b.mode && window.__caSetMode) window.__caSetMode(b.mode);
      if (b.mode) document.querySelector('.ca-tab[data-mode="' + b.mode + '"]')?.click();
      if (b.music) toggleMusic();
      if (b.scroll) { const el = $(b.scroll); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus({ preventScroll: true }); } }
    });
    slide.appendChild(cta);
    track.appendChild(slide);

    const d = document.createElement("button");
    d.type = "button"; d.setAttribute("aria-label", "Banner " + (i + 1));
    d.addEventListener("click", () => { go(i); restart(); });
    dots.appendChild(d);
  });

  function go(i) {
    idx = (i + BANNERS.length) % BANNERS.length;
    track.style.transform = "translateX(" + (-idx * 100) + "%)";
    [...dots.children].forEach((d, n) => d.classList.toggle("on", n === idx));
    [...track.children].forEach((s, n) => s.setAttribute("aria-hidden", n === idx ? "false" : "true"));
  }
  function restart() { clearInterval(timer); timer = setInterval(() => go(idx + 1), 5000); }
  $("caBnPrev").addEventListener("click", () => { go(idx - 1); restart(); });
  $("caBnNext").addEventListener("click", () => { go(idx + 1); restart(); });
  wrap.addEventListener("mouseenter", () => clearInterval(timer));
  wrap.addEventListener("mouseleave", restart);

  // swipe
  let sx = null;
  wrap.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) { go(idx + (dx < 0 ? 1 : -1)); restart(); }
  });
  go(0); restart();

  // ---------- TICKER ----------
  const tk = $("caTicker");
  const items = TICKER.map((t) => "<span><b>▲</b>" + t.replace(/[&<>]/g, "") + "</span>").join("");
  tk.innerHTML = items + items; // doubled for a seamless loop

  // ---------- QUICK PAIR CHIPS ----------
  const chips = $("caChips");
  ["XAUUSD", "BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "USDJPY"].forEach((p) => {
    const c = document.createElement("button");
    c.type = "button"; c.className = "ca-chip"; c.textContent = p; c.dataset.pair = p;
    c.addEventListener("click", () => selectPair(p));
    chips.appendChild(c);
  });
  function selectPair(p) {
    const sel = $("pairSelect");
    if (!sel) return;
    sel.value = p;
    sel.dispatchEvent(new Event("change"));
    syncChips();
    sel.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function syncChips() {
    const v = $("pairSelect").value;
    chips.querySelectorAll(".ca-chip").forEach((c) => c.classList.toggle("on", c.dataset.pair === v));
  }
  $("pairSelect").addEventListener("change", syncChips);
  syncChips();

  // ---------- MUSIC ----------
  // Plays the same YouTube track as the main site. If YouTube can't play (blocked, offline, opened as a
  // local file, video unavailable), it falls back to a built-in ambient synth so the button always works.
  const YT_ID = "yGbaHLXUZWY";
  let player = null, ready = false, playing = false, ytFailed = false, mode = null; // mode: "yt" | "synth"
  const btn = $("caMusicBtn"), label = $("caMusicText");

  function ui(on) {
    playing = on;
    try { localStorage.setItem("por_music_playing", on ? "true" : "false"); } catch (e) {}
    btn.classList.toggle("is-playing", on);
    btn.setAttribute("aria-pressed", String(on));
    label.textContent = on ? "Music: ON" : "Music: OFF";
  }

  // --- ambient synth fallback (Web Audio) ---
  let ctx = null, master = null, nodes = [];
  function synthStart() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0;
      const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 900;
      master.connect(filt); filt.connect(ctx.destination);
      // Am9 pad: A2 E3 A3 C4 E4 B4, each voice detuned a little, with a slow volume wobble
      [110, 164.81, 220, 261.63, 329.63, 493.88].forEach((f, i) => {
        [-4, 4].forEach((det) => {
          const o = ctx.createOscillator(); o.type = i % 2 ? "sine" : "triangle"; o.frequency.value = f; o.detune.value = det;
          const g = ctx.createGain(); g.gain.value = 0.05;
          const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07 + i * 0.03;
          const lg = ctx.createGain(); lg.gain.value = 0.03;
          lfo.connect(lg); lg.connect(g.gain);
          o.connect(g); g.connect(master);
          o.start(); lfo.start(); nodes.push(o, lfo);
        });
      });
    }
    if (ctx.state === "suspended") ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 2);
    return true;
  }
  function synthStop() {
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
  }

  // --- YouTube player (created early so a click can start it instantly) ---
  function initPlayer() {
    if (player || ytFailed || typeof YT === "undefined" || !YT.Player) return;
    try {
      player = new YT.Player("caYtPlayer", {
        height: "200", width: "200", videoId: YT_ID,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, loop: 1, playlist: YT_ID, modestbranding: 1, playsinline: 1, rel: 0, origin: location.origin },
        events: {
          onReady: () => { ready = true; try { player.setVolume(75); } catch (e) {} },
          onStateChange: (e) => {
            if (mode !== "yt") return;
            if (e.data === YT.PlayerState.PLAYING) ui(true);
            else if (e.data === YT.PlayerState.PAUSED) ui(false);
            else if (e.data === YT.PlayerState.ENDED) player.playVideo();
          },
          onError: () => { ytFailed = true; if (playing && mode === "yt") startSynth(); }
        }
      });
    } catch (e) { ytFailed = true; }
  }
  const prevReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () { if (typeof prevReady === "function") prevReady(); initPlayer(); };
  if (typeof YT !== "undefined" && YT.Player) initPlayer();

  function startSynth() { mode = "synth"; if (synthStart()) ui(true); else ui(false); }

  function play() {
    // Called straight from a click so the browser allows sound.
    if (ready && !ytFailed && player && typeof player.playVideo === "function") {
      mode = "yt";
      try { player.unMute(); player.setVolume(75); player.playVideo(); } catch (e) { ytFailed = true; startSynth(); return; }
      ui(true);
      // If YouTube hasn't actually started after a moment, switch to the synth.
      setTimeout(() => {
        if (mode !== "yt" || !playing) return;
        let st = -1; try { st = player.getPlayerState(); } catch (e) {}
        if (st !== 1 && st !== 3) { try { player.pauseVideo(); } catch (e) {} startSynth(); }
      }, 3500);
    } else {
      startSynth();
    }
  }
  function pause() {
    if (mode === "yt") { try { player.pauseVideo(); } catch (e) {} }
    else synthStop();
    ui(false);
  }
  function toggleMusic() { playing ? pause() : play(); }
  btn.addEventListener("click", (e) => { e.stopPropagation(); toggleMusic(); });

  // If music was ON on the main site, start it again on the first click/tap (browsers block autoplay).
  let wantResume = false;
  try { wantResume = localStorage.getItem("por_music_playing") === "true"; } catch (e) {}
  if (wantResume) {
    document.addEventListener("click", function once(e) {
      document.removeEventListener("click", once);
      if (btn.contains(e.target)) return;
      if (!playing) play();
    });
  }
})();
