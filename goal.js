// --- Audio Feedback Engine ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playIncrement() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }

    playDecrement() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    playReset() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.35);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }

  const soundEngine = new SoundEngine();

  // --- State Management ---
  const STORAGE_KEY = 'TRADING_PROGRESS_DATA_V2';
  const DEFAULT_AVATAR = 'por.jpg';
  const FAVICON_DEFAULT = document.getElementById('dynamicFavicon').href;

  const defaultState = {
    completedTrades: 0,
    targetTrades: 500,
    profitPerTrade: 10.0,
    soundEnabled: true,
    bgMode: 'both',
    customAvatar: null
  };

  let state = { ...defaultState };

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        state = { ...defaultState, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.warn('LocalStorage unavailable, defaulting to memory state.', err);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not save to LocalStorage', err);
    }
  }

  // --- DOM Elements ---
  const counterCompleted = document.getElementById('counterCompleted');
  const counterTarget = document.getElementById('counterTarget');
  const progressBar = document.getElementById('progressBar');
  const progressPercentage = document.getElementById('progressPercentage');
  const totalEarned = document.getElementById('totalEarned');
  const perTradeDisplay = document.getElementById('perTradeDisplay');
  const targetTotalDisplay = document.getElementById('targetTotalDisplay');

  const btnPlus = document.getElementById('btnPlus');
  const btnMinus = document.getElementById('btnMinus');
  const btnReset = document.getElementById('btnReset');

  const resetModal = document.getElementById('resetModal');
  const resetModalCard = document.getElementById('resetModalCard');
  const confirmResetBtn = document.getElementById('confirmResetBtn');
  const cancelResetBtn = document.getElementById('cancelResetBtn');

  const settingsModal = document.getElementById('settingsModal');
  const settingsModalCard = document.getElementById('settingsModalCard');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const inputTargetTrades = document.getElementById('inputTargetTrades');
  const inputProfitPerTrade = document.getElementById('inputProfitPerTrade');
  const selectBgMode = document.getElementById('selectBgMode');
  const resetAvatarBtn = document.getElementById('resetAvatarBtn');

  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');

  const bgVideo = document.getElementById('bgVideo');
  const tunnelCanvas = document.getElementById('tunnelCanvas');

  // Dynamic Avatar & Favicon
  const avatarTrigger = document.getElementById('avatarTrigger');
  const avatarFileInput = document.getElementById('avatarFileInput');
  const avatarImg = document.getElementById('avatarImg');
  const dynamicFavicon = document.getElementById('dynamicFavicon');

  // --- Avatar & Favicon Handlers ---
  function setAvatarAndFavicon(srcUrl) {
    avatarImg.src = srcUrl;
    if (dynamicFavicon) {
      dynamicFavicon.href = (srcUrl === DEFAULT_AVATAR) ? FAVICON_DEFAULT : srcUrl;
    }
  }

  avatarTrigger.addEventListener('click', () => {
    avatarFileInput.click();
  });

  avatarFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      setAvatarAndFavicon(base64Data);
      state.customAvatar = base64Data;
      saveState();
    };
    reader.readAsDataURL(file);
  });

  resetAvatarBtn.addEventListener('click', () => {
    state.customAvatar = null;
    setAvatarAndFavicon(DEFAULT_AVATAR);
    saveState();
  });

  // --- UI Update Routine ---
  function updateUI() {
    const { completedTrades, targetTrades, profitPerTrade, customAvatar } = state;
    const percentage = targetTrades > 0 ? (completedTrades / targetTrades) * 100 : 0;
    const earnings = completedTrades * profitPerTrade;
    const maxEarnings = targetTrades * profitPerTrade;

    // Update Avatar & Favicon
    setAvatarAndFavicon(customAvatar || DEFAULT_AVATAR);

    // Counters
    counterCompleted.textContent = completedTrades;
    counterTarget.textContent = targetTrades;

    // Progress bar & percentage
    const clampedPct = Math.min(Math.max(percentage, 0), 100);
    progressBar.style.width = `${clampedPct}%`;
    progressPercentage.textContent = `${percentage.toFixed(1)}%`;

    // Amounts
    totalEarned.textContent = `$${earnings.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} earned`;

    perTradeDisplay.textContent = `$${profitPerTrade.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    targetTotalDisplay.textContent = `$${maxEarnings.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    if (completedTrades <= 0) {
      btnMinus.classList.add('opacity-40', 'cursor-not-allowed');
    } else {
      btnMinus.classList.remove('opacity-40', 'cursor-not-allowed');
    }

    if (state.soundEnabled) {
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
    } else {
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
    }

    if (state.bgMode === 'video') {
      bgVideo.style.display = 'block';
      tunnelCanvas.style.display = 'none';
    } else if (state.bgMode === 'canvas') {
      bgVideo.style.display = 'none';
      tunnelCanvas.style.display = 'block';
    } else {
      bgVideo.style.display = 'block';
      tunnelCanvas.style.display = 'block';
    }
  }

  // --- Interactive Listeners ---
  btnPlus.addEventListener('click', () => {
    soundEngine.init();
    if (state.completedTrades < state.targetTrades) {
      state.completedTrades += 1;
      saveState();
      updateUI();
      soundEngine.playIncrement();

      counterCompleted.classList.add('scale-125', 'text-emerald-400');
      setTimeout(() => {
        counterCompleted.classList.remove('scale-125', 'text-emerald-400');
      }, 180);
    }
  });

  btnMinus.addEventListener('click', () => {
    soundEngine.init();
    if (state.completedTrades > 0) {
      state.completedTrades -= 1;
      saveState();
      updateUI();
      soundEngine.playDecrement();
    }
  });

  btnReset.addEventListener('click', () => {
    soundEngine.init();
    resetModal.classList.remove('opacity-0', 'pointer-events-none');
    resetModalCard.classList.remove('scale-95');
    resetModalCard.classList.add('scale-100');
  });

  cancelResetBtn.addEventListener('click', () => {
    resetModal.classList.add('opacity-0', 'pointer-events-none');
    resetModalCard.classList.remove('scale-100');
    resetModalCard.classList.add('scale-95');
  });

  confirmResetBtn.addEventListener('click', () => {
    state.completedTrades = 0;
    saveState();
    updateUI();
    soundEngine.playReset();

    resetModal.classList.add('opacity-0', 'pointer-events-none');
    resetModalCard.classList.remove('scale-100');
    resetModalCard.classList.add('scale-95');
  });

  resetModal.addEventListener('click', (e) => {
    if (e.target === resetModal) {
      cancelResetBtn.click();
    }
  });

  soundToggleBtn.addEventListener('click', () => {
    soundEngine.init();
    state.soundEnabled = !state.soundEnabled;
    soundEngine.enabled = state.soundEnabled;
    saveState();
    updateUI();
  });

  openSettingsBtn.addEventListener('click', () => {
    inputTargetTrades.value = state.targetTrades;
    inputProfitPerTrade.value = state.profitPerTrade;
    selectBgMode.value = state.bgMode;

    settingsModal.classList.remove('opacity-0', 'pointer-events-none');
    settingsModalCard.classList.remove('scale-95');
    settingsModalCard.classList.add('scale-100');
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('opacity-0', 'pointer-events-none');
    settingsModalCard.classList.remove('scale-100');
    settingsModalCard.classList.add('scale-95');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettingsBtn.click();
    }
  });

  saveSettingsBtn.addEventListener('click', () => {
    const parsedTarget = parseInt(inputTargetTrades.value, 10);
    const parsedProfit = parseFloat(inputProfitPerTrade.value);
    if (parsedTarget > 0) state.targetTrades = parsedTarget;
    if (!isNaN(parsedProfit) && parsedProfit >= 0) state.profitPerTrade = parsedProfit;
    state.bgMode = selectBgMode.value;

    saveState();
    updateUI();
    closeSettingsBtn.click();
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === '+' || e.key === '=' || e.key === 'ArrowUp') {
      btnPlus.click();
    } else if (e.key === '-' || e.key === 'ArrowDown') {
      btnMinus.click();
    }
  });

  function updateClock() {
    const now = new Date();
    document.getElementById('currentClock').textContent = now.toTimeString().split(' ')[0] + ' UTC';
  }
  setInterval(updateClock, 1000);
  updateClock();

  // --- Procedural Canvas Tunnel ---
  const canvas = document.getElementById('tunnelCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / width - 0.5) * 50;
    mouse.targetY = (e.clientY / height - 0.5) * 40;
  });

  const NUM_CANDLES = 56;
  const candles = [];
  let curveOffset = 0;

  for (let i = 0; i < NUM_CANDLES; i++) {
    candles.push({
      index: i,
      z: (i / NUM_CANDLES) * 1200 + 50,
      heightFactor: 24 + Math.sin(i * 0.35) * 18 + Math.cos(i * 0.15) * 12,
      isGreen: i % 4 !== 0,
      isCyan: i % 7 === 0,
      priceTag: i % 8 === 0 ? (200 + Math.sin(i) * 180).toFixed(2) : null
    });
  }

  const NUM_PARTICLES = 160;
  const particles = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 1400,
      z: Math.random() * 1400,
      speed: 1.5 + Math.random() * 2.2,
      size: 1 + Math.random() * 2.2,
      isCyan: Math.random() > 0.4
    });
  }

  const tickers = [
    { text: "▲ 158.84", color: "#00e676", x: 0.38, y: 0.18, z: 420 },
    { text: "▼ 21.22",  color: "#ff5252", x: 0.72, y: 0.16, z: 320 },
    { text: "▲ 349.80", color: "#00e676", x: 0.82, y: 0.20, z: 280 },
    { text: "▲ 343.77", color: "#00e676", x: 0.42, y: 0.46, z: 490 },
    { text: "▼ 300.93", color: "#ff5252", x: 0.46, y: 0.56, z: 430 },
    { text: "▲ 374.61", color: "#00e676", x: 0.32, y: 0.72, z: 620 },
    { text: "▼ 283.38", color: "#ff5252", x: 0.48, y: 0.69, z: 540 },
    { text: "▼ 627.81", color: "#ff5252", x: 0.57, y: 0.67, z: 460 },
    { text: "▲ 26.88",  color: "#00e676", x: 0.69, y: 0.47, z: 340 },
    { text: "▲ 36.88",  color: "#00e676", x: 0.87, y: 0.54, z: 260 }
  ];

  function renderAnimation() {
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    ctx.clearRect(0, 0, width, height);

    const fov = 480;
    const centerX = width * 0.5 + mouse.x;
    const centerY = height * 0.52 + mouse.y;

    curveOffset += 0.012;

    ctx.save();
    ctx.strokeStyle = "rgba(0, 230, 118, 0.035)";
    ctx.lineWidth = 1;
    const gridSteps = 8;
    for (let g = 0; g < gridSteps; g++) {
      const radius = (g / gridSteps) * (Math.max(width, height) * 0.85);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 1.4, radius * 0.9, -0.15, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(angle) * width * 1.2,
        centerY + Math.sin(angle) * height * 1.2
      );
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.z -= p.speed;
      if (p.z <= 10) {
        p.z = 1200;
        p.x = (Math.random() - 0.5) * 2000;
        p.y = (Math.random() - 0.5) * 1400;
      }

      const scale = fov / (fov + p.z);
      const px = centerX + p.x * scale;
      const py = centerY + p.y * scale;

      if (px >= 0 && px <= width && py >= 0 && py <= height) {
        const alpha = (1 - p.z / 1200) * 0.55;
        ctx.fillStyle = p.isCyan ? `rgba(0, 229, 255, ${alpha})` : `rgba(0, 230, 118, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * scale * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      c.z -= 1.8;
      if (c.z <= 20) {
        c.z = 1200;
      }

      const scale = fov / (fov + c.z);
      const progressT = (c.z / 1200) * 4 + curveOffset;
      const curveX = (Math.sin(progressT * 0.6) * 550) + (1 - c.z / 1200) * 260 - 150;
      const curveY = (Math.cos(progressT * 0.4) * 220) - ((1 - c.z / 1200) * 140) + 90;

      const screenX = centerX + curveX * scale;
      const screenY = centerY + curveY * scale;

      const candleWidth = Math.max(7 * scale * 1.8, 1.2);
      const candleHeight = Math.max(c.heightFactor * scale * 2.2, 3);
      const wickHeight = candleHeight * 1.9;
      const alpha = Math.min(Math.max((1 - c.z / 1250) * 1.1, 0.08), 0.95);

      let mainColor = `rgba(255, 255, 255, ${alpha})`;
      let glowColor = `rgba(255, 255, 255, ${alpha * 0.4})`;

      if (c.isCyan) {
        mainColor = `rgba(0, 229, 255, ${alpha})`;
        glowColor = `rgba(0, 229, 255, ${alpha * 0.8})`;
      } else if (c.isGreen) {
        mainColor = `rgba(0, 230, 118, ${alpha * 0.95})`;
        glowColor = `rgba(0, 230, 118, ${alpha * 0.6})`;
      }

      ctx.save();
      if (c.z < 600) {
        ctx.shadowBlur = 12 * scale;
        ctx.shadowColor = glowColor;
      }

      ctx.strokeStyle = mainColor;
      ctx.lineWidth = Math.max(1.2 * scale, 0.6);
      ctx.beginPath();
      ctx.moveTo(screenX, screenY - wickHeight * 0.5);
      ctx.lineTo(screenX, screenY + wickHeight * 0.5);
      ctx.stroke();

      ctx.fillStyle = mainColor;
      ctx.fillRect(
        screenX - candleWidth * 0.5,
        screenY - candleHeight * 0.5,
        candleWidth,
        candleHeight
      );
      ctx.restore();
    }

    ctx.save();
    ctx.font = '500 11px "JetBrains Mono", monospace';
    tickers.forEach((t, idx) => {
      const floatY = Math.sin(curveOffset * 2 + idx) * 5;
      const tx = width * t.x + mouse.x * 0.4;
      const ty = height * t.y + floatY + mouse.y * 0.4;

      ctx.fillStyle = t.color;
      ctx.fillText(t.text, tx, ty);

      ctx.beginPath();
      ctx.arc(tx - 6, ty - 3.5, 2, 0, Math.PI * 2);
      ctx.fillStyle = t.color;
      ctx.fill();
    });
    ctx.restore();

    requestAnimationFrame(renderAnimation);
  }

  requestAnimationFrame(renderAnimation);

  loadState();
  updateUI();