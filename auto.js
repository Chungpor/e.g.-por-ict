/* ---------- CONFIG ---------- */
// Optional: free key from twelvedata.com enables REAL XAUUSD / XAGUSD / EURUSD (spot).
// Leave '' to use Binance public data (no key): crypto + PAXG (gold-backed token) + EURUSDT.
const TWELVE_KEY = '199538bc0f2f485cabdc992c45363e56';

const PAIRS = {
  XAUUSD:{dec:2, bin:'PAXGUSDT', td:'XAU/USD'},   // Binance = PAXG gold token (≈ spot gold)
  XAGUSD:{dec:3, bin:null,       td:'XAG/USD'},   // silver needs TWELVE_KEY
  BTCUSD:{dec:2, bin:'BTCUSDT',  td:'BTC/USD'},
  ETHUSD:{dec:2, bin:'ETHUSDT',  td:'ETH/USD'},
  EURUSD:{dec:5, bin:'EURUSDT',  td:'EUR/USD'},
  NAS100USD:{dec:1, bin:null,    td:'QQQ', scale:true}  // Nasdaq 100: chart/price = OANDA; signal data = QQQ ETF (free) scaled to NAS100 level
};
const FRAMES = [
  {id:'M5', name:'Scalping', sub:'រាល់ 5 នាទី · ចូល-ចេញលឿន SL តូចបំផុត', secs:300,   bi:'5m', ti:'5min',  icon:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'},
  {id:'M30',name:'Swing',    sub:'រាល់ 30 នាទី · ចាប់លេក Trend ខ្លី',        secs:1800,  bi:'30m',ti:'30min', icon:'<path d="M3 8c3-3 6 3 9 0s6 3 9 0M3 14c3-3 6 3 9 0s6 3 9 0"/>'},
  {id:'H1', name:'Day Trade',sub:'រាល់ 1 ម៉ោង · Setup សម្រាប់ក្នុងថ្ងៃ',      secs:3600,  bi:'1h', ti:'1h',    icon:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'},
  {id:'D1', name:'Position Trade',sub:'រាល់ 1 សប្តាហ៍ · កាន់យូរ គោលដៅធំ',     secs:604800,bi:'1w', ti:'1week', icon:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>'}
];
const RSS = '<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.5"/>';
// Chart + price bar + signals must read the SAME feed, otherwise prices differ.
// false (default): chart shows the same instrument the data comes from -> prices match exactly.
// true: chart always shows OANDA spot (prices can differ from the data feed by a few dollars on gold).
const FORCE_OANDA_CHART = false;
const CHART_OANDA = {XAUUSD:'OANDA:XAUUSD', XAGUSD:'OANDA:XAGUSD', EURUSD:'OANDA:EURUSD', BTCUSD:'BINANCE:BTCUSDT', ETHUSD:'BINANCE:ETHUSDT', NAS100USD:'OANDA:NAS100USD'};
const chartSymbol = p => (p==='XAUUSD' || FORCE_OANDA_CHART || TWELVE_KEY || !PAIRS[p].bin) ? CHART_OANDA[p] : 'BINANCE:'+PAIRS[p].bin;
// Gold signals are computed from Binance PAXG candles (no free OANDA feed). OANDA spot − PAXG ≈ +10 in your screenshots;
// this shifts the signal levels onto the OANDA chart scale. Adjust it (or set TWELVE_KEY for real spot) if they drift.
const GOLD_OANDA_OFFSET = 10;
const gOff = p => (p==='XAUUSD' && !TWELVE_KEY) ? GOLD_OANDA_OFFSET : 0;
const sourceLabel = p => TWELVE_KEY ? 'Twelve Data' : (PAIRS[p].bin ? 'Binance '+PAIRS[p].bin : '');
function setChart(){
  const q = new URLSearchParams({symbol:chartSymbol(pair), interval:chartTf, theme:'dark', style:'1', timezone:'Asia/Phnom_Penh',
    hidesidetoolbar:'1', withdateranges:'1', allow_symbol_change:'0', toolbarbg:'0b1222', backgroundColor:'#0b1222', locale:'en'});
  $('#chart').src = 'https://s.tradingview.com/widgetembed/?' + q;
}
const BIN = 'https://data-api.binance.vision/api/v3';
const TD  = 'https://api.twelvedata.com';

let pair = 'XAUUSD', chartTf = '5';
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2,'0');
const fmt = (v,d) => v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const hasSource = p => TWELVE_KEY ? true : !!PAIRS[p].bin;

/* ---------- NAS100 SCALE (QQQ ETF -> OANDA NAS100USD level) ---------- */
// NDX index data needs a paid Twelve Data plan, so signals use QQQ (free) x ratio. The ratio is set once from the
// price you see on the chart, then saved (re-asked after 30 days). QQQ only prints candles while US stocks trade.
let nasP = null;
function nasMult(){
  const saved = JSON.parse(store.get('ksnr_nas') || 'null');
  if(saved && saved.r > 0 && Date.now() - saved.t < 30*864e5) return Promise.resolve(saved.r);
  return nasP || (nasP = (async () => {
    const q = +(await getJSON(`${TD}/price?symbol=QQQ&apikey=${TWELVE_KEY}`)).price;
    const v = parseFloat(prompt('បញ្ចូលតម្លៃ NAS100USD បច្ចុប្បន្នពី Chart (ឧ. 27940) — ដើម្បី Calibrate ម្តង', ''));
    if(!(v > 0) || !(q > 0)) throw new Error('ត្រូវការតម្លៃ NAS100USD ពី Chart');
    const r = v / q; store.set('ksnr_nas', JSON.stringify({r, t:Date.now()})); return r;
  })().finally(() => nasP = null));
}
const pxMult = p => PAIRS[p].scale ? nasMult() : Promise.resolve(1);

/* ---------- LIVE DATA ---------- */
async function getJSON(url){
  const r = await fetch(url);
  if(!r.ok) throw new Error('HTTP '+r.status);
  const j = await r.json();
  if(j && j.status === 'error') throw new Error(j.message || 'API error');
  return j;
}
// closed candles only, oldest -> newest
async function fetchCandles(p, f){
  if(!hasSource(p)) throw new Error('NO_SOURCE');
  if(TWELVE_KEY){
    const j = await getJSON(`${TD}/time_series?symbol=${encodeURIComponent(PAIRS[p].td)}&interval=${f.ti}&outputsize=120&apikey=${TWELVE_KEY}`);
    const m = await pxMult(p);
    const c = j.values.reverse().map(v => ({t:Date.parse(v.datetime+'Z'),o:+v.open*m,h:+v.high*m,l:+v.low*m,c:+v.close*m,v:+(v.volume||0)}));
    c.pop(); return c;                       // drop forming candle
  }
  const k = await getJSON(`${BIN}/klines?symbol=${PAIRS[p].bin}&interval=${f.bi}&limit=120`);
  const g = gOff(p), c = k.map(x => ({t:x[0],o:+x[1]+g,h:+x[2]+g,l:+x[3]+g,c:+x[4]+g,v:+x[5]}));
  c.pop(); return c;
}
async function fetchPrice(p){
  if(TWELVE_KEY) return +(await getJSON(`${TD}/price?symbol=${encodeURIComponent(PAIRS[p].td)}&apikey=${TWELVE_KEY}`)).price * await pxMult(p);
  return +(await getJSON(`${BIN}/ticker/price?symbol=${PAIRS[p].bin}`)).price + gOff(p);
}

/* ---------- K-SNR ENGINE (EMA34 · Liquidity Sweep · Displacement · ATR) ---------- */
const mean = a => a.reduce((s,x)=>s+x,0)/a.length;
function ema(arr,p){ const k=2/(p+1); let e=arr[0]; return arr.map(v => e = v*k + e*(1-k)); }
function atr(c,p=14){
  const tr = c.slice(-p).map((x,i,a) => { const pc = (c[c.length-p+i-1]||x).c; return Math.max(x.h-x.l,Math.abs(x.h-pc),Math.abs(x.l-pc)); });
  return mean(tr);
}
function analyze(c){
  const n=c.length, A=atr(c), E=ema(c.map(x=>x.c),34), L=20;
  const last=c[n-1], up = last.c > E[n-1];
  const avgBody = mean(c.slice(-20).map(x=>Math.abs(x.c-x.o)));
  const minBody = Math.max(1.2*avgBody, .8*A);

  // 1) Liquidity sweep in last 3 closed candles
  for(let k=1;k<=3;k++){
    const i=n-k, prior=c.slice(i-L,i), x=c[i];
    const lo=Math.min(...prior.map(y=>y.l)), hi=Math.max(...prior.map(y=>y.h));
    const dir = (x.l<lo && x.c>lo) ? 'buy' : (x.h>hi && x.c<hi) ? 'sell' : null;
    if(!dir) continue;
    const disp = c.slice(i).some(y => (dir==='buy' ? y.c-y.o : y.o-y.c) >= minBody);
    const trend = (dir==='buy') === up;
    return {dir, A, up, kind:'sweep', ago:k, disp, trend, stop: dir==='buy'?x.l:x.h,
            grade:'CBA'[disp+trend]};
  }
  // 2) Break of structure with volume
  const prior=c.slice(n-1-L,n-1);
  const hi=Math.max(...prior.map(y=>y.h)), lo=Math.min(...prior.map(y=>y.l));
  const vol = last.v > 1.2*mean(c.slice(-20).map(y=>y.v));
  const dir = last.c>hi ? 'buy' : last.c<lo ? 'sell' : null;
  if(dir && (dir==='buy')===up){
    const r5=c.slice(-5);
    return {dir, A, up, kind:'bos', ago:1, disp:true, trend:true, vol,
            stop: dir==='buy' ? Math.min(...r5.map(y=>y.l)) : Math.max(...r5.map(y=>y.h)),
            grade: vol ? 'A' : 'B'};
  }
  return {dir:null, A, up};
}
function explain(a){
  const side = a.dir==='buy' ? ['ក្រោម Low','Low'] : ['លើ High','High'];
  const t = a.kind==='bos'
    ? `Break of Structure ${a.dir==='buy'?'ឡើង':'ចុះ'} (20 candle)${a.vol?' · Volume កើនឡើង':''}`
    : `Liquidity Sweep ${side[0]} (${a.ago} candle មុន) · ${a.disp?'Displacement បញ្ជាក់':'មិនទាន់មាន Displacement'}`;
  return t + ' · Structure EMA34 ' + (a.trend ? 'ស្របទិស' : 'ផ្ទុយទិស (ប្រុងប្រយ័ត្ន)');
}
async function getSignal(p, f){
  const [c, price] = await Promise.all([fetchCandles(p,f), fetchPrice(p)]);
  const a = analyze(c);
  if(!a.dir) return {none:true, up:a.up, price};
  const buy = a.dir==='buy', A=a.A, entry=price;
  let sl = buy ? a.stop - .15*A : a.stop + .15*A;
  if(buy ? sl>=entry : sl<=entry) sl = buy ? entry-1.5*A : entry+1.5*A;
  let risk = Math.abs(entry-sl);
  if(risk > 4*A) return {none:true, up:a.up, price, late:true};      // price already ran away
  const liq = buy ? Math.max(...c.slice(-40).map(x=>x.h)) : Math.min(...c.slice(-40).map(x=>x.l));
  let tp = buy ? entry+2*risk : entry-2*risk;
  if((buy ? liq-entry : entry-liq)/risk >= 1.5) tp = liq;            // opposite liquidity pool
  const now=new Date(), exp=new Date(now.getTime()+f.secs*1000), hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
  return {buy, entry, sl, tp, rr:Math.abs(tp-entry)/risk, grade:a.grade, created:hm(now), expires:hm(exp), note:explain(a)};
}

/* ---------- LIVE PRICE BAR ---------- */
let lastPx = null, liveTimer = null;
async function updateLive(){
  const sym = chartSymbol(pair), q = $('#quote');
  $('#live').classList.toggle('q', sym.startsWith('OANDA:'));
  if(sym.startsWith('OANDA:')){                    // same TradingView OANDA feed as the chart -> identical price
    q.hidden = false;
    if(q.dataset.s !== sym){ q.dataset.s = sym;
      q.src = 'https://www.tradingview-widget.com/embed-widget/single-quote/?locale=en&s=' + encodeURIComponent(sym) + '#' +
        encodeURIComponent(JSON.stringify({symbol:sym,width:'100%',colorTheme:'dark',isTransparent:true,locale:'en'})); }
    return;
  }
  q.hidden = true;
  const box = $('#live'), dot = box.querySelector('.dot'), px = box.querySelector('.px'), chg = box.querySelector('.chg');
  box.querySelector('.nm span').textContent = pair + (sourceLabel(pair) ? ' · ' + sourceLabel(pair) : '');
  if(!hasSource(pair)){ dot.className='dot off'; px.textContent='ត្រូវការ API key'; px.className='px'; chg.textContent=''; return; }
  try{
    let price, pct = null;
    if(TWELVE_KEY) price = await fetchPrice(pair);
    else { const t = await getJSON(`${BIN}/ticker/24hr?symbol=${PAIRS[pair].bin}`); price=+t.lastPrice; pct=+t.priceChangePercent; }
    const d = PAIRS[pair].dec;
    px.textContent = fmt(price,d);
    px.className = 'px ' + (lastPx==null||price===lastPx ? '' : price>lastPx ? 'up' : 'dn');
    lastPx = price; dot.className='dot';
    chg.textContent = pct==null ? '' : (pct>=0?'+':'')+pct.toFixed(2)+'% (24h)';
    chg.className = 'chg ' + (pct>=0?'up':'dn');
  }catch{ dot.className='dot off'; px.textContent='Offline'; px.className='px'; }
}
function startLive(){
  clearInterval(liveTimer); lastPx = null; updateLive();
  liveTimer = setInterval(updateLive, TWELVE_KEY ? 120000 : 4000);
}

/* ---------- UI ---------- */
function renderTabs(){
  const el = $('#tabs'), prev = el.scrollLeft;
  el.innerHTML = Object.keys(PAIRS).map(p =>
    `<button class="tab" role="tab" aria-selected="${p===pair}" aria-disabled="${!hasSource(p)}" data-p="${p}">${p}</button>`).join('');
  el.scrollLeft = prev;                                   // keep position after re-render
  const s = el.querySelector('[aria-selected=true]');
  if(s) el.scrollTo({left: s.offsetLeft - (el.clientWidth - s.offsetWidth)/2, behavior: prev ? 'smooth' : 'auto'});
  updateFade();
}
function updateFade(){
  const el = $('#tabs'), max = el.scrollWidth - el.clientWidth;
  el.classList.toggle('fl', el.scrollLeft > 2);
  el.classList.toggle('fr', el.scrollLeft < max - 2);
}
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('.tab'); if(!b) return;
  pair = b.dataset.p; renderTabs(); renderCards(); startLive(); setChart();
});
function renderCards(){
  $('#cards').innerHTML = FRAMES.map(f => `
    <article class="tf" data-id="${f.id}">
      <div class="code"><svg viewBox="0 0 24 24">${f.icon}</svg>${f.id}</div>
      <h3>${f.name}</h3><div class="sub">${f.sub}</div>
      <div class="timer" data-secs="${f.secs}">--:--:--</div>
      <div class="next">Signal ថ្មីក្នុង</div>
      <button class="btn" data-id="${f.id}"><svg viewBox="0 0 24 24">${RSS}</svg><span>ទទួល Signal</span></button>
      <div class="out"></div>
    </article>`).join('');
  tick();
}
// Cent account: 1 cent lot = 1/CENT_DIV of a standard lot (most brokers: 100). Change if your broker differs.
const CENT_DIV = 100;
const CONTRACT = {XAUUSD:100, XAGUSD:5000, BTCUSD:1, ETHUSD:1, EURUSD:100000, NAS100USD:1};   // units per 1 lot (varies by broker)
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function analyzing(out, f, work){
  const steps = ['ទាញទិន្នន័យ Live ពីទីផ្សារ','អានរចនាសម្ព័ន្ធទីផ្សារ','ស្វែងរក Zone & Liquidity','គណនា Entry · SL · TP'];
  out.innerHTML = `<div class="ana"><div class="spin"></div><h4>K-SNR Strategy កំពុងអានទិន្នន័យ Live…</h4><b class="fr">${f.name}</b><ul>${steps.map(s=>`<li>${s}</li>`).join('')}</ul></div>`;
  const li = [...out.querySelectorAll('.ana li')], mark = n => li.forEach((x,k) => x.className = k<n ? 'done' : k===n ? 'act' : '');
  mark(0); const p = work(); p.catch(() => {});
  for(let n=1;n<=3;n++){ await sleep(450); mark(n); }
  const r = await p; mark(4); await sleep(250); return r;
}
$('#cards').addEventListener('click', async e => {
  const btn = e.target.closest('.btn'); if(!btn) return;
  const f = FRAMES.find(x => x.id === btn.dataset.id);
  const out = btn.closest('.tf').querySelector('.out');
  const label = btn.querySelector('span');
  if(!hasSource(pair)){
    out.innerHTML = '<div class="sig"><p class="warn">'+pair+' ត្រូវការ Twelve Data API key — ដាក់ក្នុង <code>TWELVE_KEY</code> នៅ auto.js។</p></div>'; return;
  }
  btn.disabled = true; label.textContent = 'កំពុងវិភាគ…';
  try{
    const s = await analyzing(out, f, () => getSignal(pair, f)), d = PAIRS[pair].dec;
    if(s.none){
      out.innerHTML = `<div class="sig"><p class="why">${s.late ? 'តម្លៃរត់ហួសចំណុចចូលរួចហើយ — រង់ចាំ Setup ថ្មី។' : 'មិនទាន់មាន Setup ច្បាស់លើ '+f.id+' ទេ — រង់ចាំ Sweep ឬ Break of Structure។'}<br>Bias EMA34: <b class="${s.up?'chg up':'chg dn'}">${s.up?'ខាងលើ (Bullish)':'ខាងក្រោម (Bearish)'}</b> · តម្លៃ ${fmt(s.price,d)}</p></div>`;
    } else {
      const id = Date.now(), side = s.buy ? 'buy' : 'sell';
      const text = `${s.buy?'BUY':'SELL'} ${pair}\nEntry: ${fmt(s.entry,d)}\nSL: ${fmt(s.sl,d)}\nTP: ${fmt(s.tp,d)}\n${f.name} · ${f.id} · R:R 1:${s.rr.toFixed(2)}`;
      histAdd({id, buy:s.buy, pair, frame:f.name, entry:s.entry, sl:s.sl, tp:s.tp, dec:d});
      out.innerHTML = `<div class="sig" data-id="${id}" data-entry="${s.entry}" data-sl="${s.sl}" data-pair="${pair}">
        <div class="side ${side}">${s.buy?'↗ BUY':'↘ SELL'} ចូលភ្លាមៗ · ${pair}</div>
        <div class="levels">
          <div class="lv"><small>ENTRY</small><b>${fmt(s.entry,d)}</b></div>
          <div class="lv sl"><small>STOP LOSS</small><b>${fmt(s.sl,d)}</b></div>
          <div class="lv tp"><small>TAKE PROFIT</small><b>${fmt(s.tp,d)}</b></div>
        </div>
        <div class="chips"><span class="chip live-chip">● LIVE DATA</span><span class="chip">${f.name} · ${f.id}</span><span class="chip">R:R 1:${s.rr.toFixed(2)}</span><span class="chip">Grade ${s.grade}</span>
          <span class="chip">បង្កើតនៅ ${s.created}</span><span class="chip">មានសុពលភាពដល់ ${s.expires}</span></div>
        <p class="why">${s.note}</p>
        <div class="acts">
          <button class="abtn cp" data-text="${encodeURIComponent(text)}"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg><span>Copy Signal</span></button>
          <button class="abtn jr"><svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/></svg><span>ចូល Journal</span></button>
          <button class="abtn lotb"><svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg><span>គណនា Lot</span></button>
        </div>
        <div class="lot" hidden><div class="acct" role="group" aria-label="Account type"><button type="button" class="ab" data-m="usd" aria-pressed="true">USD $</button><button type="button" class="ab" data-m="cent" aria-pressed="false">Cent ¢</button></div><div class="lr"><label><span class="blab">Balance ($)</span><input class="lbal" type="number" inputmode="decimal" min="0"></label><label>Risk %<input class="lrisk" type="number" inputmode="decimal" step="0.1" min="0"></label></div><div class="lres"></div></div></div>`;
    }
  }catch(err){
    out.innerHTML = '<div class="sig"><p class="why">មិនអាចទទួលទិន្នន័យ Live បានទេ ('+(err.message||'error')+') សូមព្យាយាមម្តងទៀត។</p></div>';
  }
  label.textContent = 'ទទួល Signal'; btn.disabled = false;
});
document.addEventListener('click', async e => {
  const c = e.target.closest('.cp'); if(!c) return;
  const txt = decodeURIComponent(c.dataset.text);
  try{ await navigator.clipboard.writeText(txt); }
  catch{ const t=document.createElement('textarea'); t.value=txt; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
  const sp = c.querySelector('span'); sp.textContent = 'Copied';
  setTimeout(() => sp.textContent = 'Copy Signal', 1500);
});

/* glow follows pointer / finger on glass cards */
['pointermove','pointerdown'].forEach(ev => document.addEventListener(ev, e => {
  const el = e.target.closest('.glass,.tf'); if(!el) return;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
  el.style.setProperty('--my', (e.clientY - r.top) + 'px');
}));

/* countdown to next candle close (weekly candles open Monday 00:00 UTC) */
function tick(){
  const now = Math.floor(Date.now()/1000);
  document.querySelectorAll('.timer').forEach(el => {
    const p = +el.dataset.secs, off = p===604800 ? 345600 : 0, left = p - ((now - off) % p);
    const d = Math.floor(left/86400), h = Math.floor(left%86400/3600), m = Math.floor(left%3600/60), s = left%60;
    el.textContent = (d ? d+'d ' : '') + pad(h)+':'+pad(m)+':'+pad(s);
  });
}
renderTabs(); renderCards(); startLive(); setChart(); setInterval(tick, 1000);


/* ================= DYNAMIC BACKGROUND (space network: glowing nodes, links, light streaks, nebula) ================= */
(function(){
  const cv = $('#bg'), ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['25,243,255','25,243,255','255,255,255','255,200,61','125,255,184'];
  const glows = [                                   // nebula: teal left, orange-red right, cyan top, violet bottom
    {x:0, y:.42,r:.55,c:'25,243,255', a:.16,s:.35},
    {x:1, y:.30,r:.55,c:'255,95,50',  a:.15,s:.30},
    {x:.8,y:0,  r:.50,c:'25,243,255', a:.13,s:.40},
    {x:.4,y:1,  r:.60,c:'130,90,255', a:.13,s:.25}
  ];
  const rnd = (a,b) => a + Math.random()*(b-a);
  let W,H,P=[],t=0;
  function size(){
    const dpr = Math.min(devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
    cv.width=W*dpr; cv.height=H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    const n = Math.min(80, Math.round(W*H/14000));
    P = Array.from({length:n}, () => ({x:rnd(0,W),y:rnd(0,H),vx:rnd(-.2,.2),vy:rnd(-.2,.2),r:rnd(1.2,3.6),
      c:COLORS[Math.random()*COLORS.length|0],ph:rnd(0,6.28)}));
    draw();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    glows.forEach((g,i) => {
      const x=W*(g.x+Math.sin(t*g.s+i)*.08), y=H*(g.y+Math.cos(t*g.s*1.2+i)*.08), r=Math.max(W,H)*g.r;
      const gr=ctx.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,`rgba(${g.c},${g.a})`); gr.addColorStop(1,`rgba(${g.c},0)`);
      ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
    });
    for(let k=0;k<3;k++){                           // glowing light streaks
      const y0=H*(.2+k*.28), amp=H*.05, gr=ctx.createLinearGradient(0,0,W,0);
      gr.addColorStop(0,'rgba(25,243,255,0)'); gr.addColorStop(.5,'rgba(25,243,255,.35)'); gr.addColorStop(1,'rgba(25,243,255,0)');
      ctx.strokeStyle=gr; ctx.lineWidth=1.5; ctx.shadowColor='rgba(25,243,255,.8)'; ctx.shadowBlur=14; ctx.beginPath();
      for(let x=0;x<=W;x+=12){ const y=y0+Math.sin(x/W*3.2+t*.8+k*2)*amp; x ? ctx.lineTo(x,y) : ctx.moveTo(x,y); }
      ctx.stroke();
    }
    ctx.shadowBlur=0; ctx.lineWidth=1;
    const D=130;                                    // network links
    for(let i=0;i<P.length;i++) for(let j=i+1;j<P.length;j++){
      const dx=P[i].x-P[j].x, dy=P[i].y-P[j].y, d=Math.hypot(dx,dy);
      if(d<D){ ctx.strokeStyle=`rgba(25,243,255,${(1-d/D)*.28})`; ctx.beginPath(); ctx.moveTo(P[i].x,P[i].y); ctx.lineTo(P[j].x,P[j].y); ctx.stroke(); }
    }
    P.forEach(p => {                                // glowing nodes
      const tw=.6+.4*Math.sin(t*2+p.ph);
      ctx.shadowColor=`rgba(${p.c},.9)`; ctx.shadowBlur=10; ctx.fillStyle=`rgba(${p.c},${tw})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fill();
    });
    ctx.shadowBlur=0;
  }
  function loop(){
    t+=.008;
    P.forEach(p => { p.x+=p.vx; p.y+=p.vy; if(p.x<-10)p.x=W+10; if(p.x>W+10)p.x=-10; if(p.y<-10)p.y=H+10; if(p.y>H+10)p.y=-10; });
    draw(); requestAnimationFrame(loop);
  }
  addEventListener('resize', size); size();
  if(!reduce) requestAnimationFrame(loop);
})();

/* ================= PROFILE ================= */
const PROFILE_DEFAULT = {email:'chungpor908@gmail.com', nick:'Xiaopor', badge:'ADMIN UNLIMITED'};
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch{ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch{} },
  del(k){ try{ localStorage.removeItem(k); }catch{} }
};
const prof = {...PROFILE_DEFAULT, nick: store.get('ksnr_nick') || PROFILE_DEFAULT.nick, avatar: store.get('ksnr_avatar') || ''};
function paintProfile(){
  document.querySelectorAll('.av').forEach(el => {
    el.style.backgroundImage = prof.avatar ? `url("${prof.avatar}")` : '';
    el.classList.toggle('empty', !prof.avatar);
    el.dataset.i = (prof.nick[0] || '?').toUpperCase();
  });
  $('#pname').textContent = prof.nick;
  $('#pbadge').textContent = prof.badge; $('#pbadge2').textContent = prof.badge + ' SCAN';
  $('#pmail').textContent = prof.email;
  $('#nick').value = prof.nick;
}
const modal = $('#pmodal');
const openP = () => { modal.hidden = false; $('#pclose').focus(); };
const closeP = () => { modal.hidden = true; $('#pbtn').focus(); };
$('#pbtn').addEventListener('click', openP);
$('#pclose').addEventListener('click', closeP);
modal.addEventListener('click', e => { if(e.target === modal) closeP(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !modal.hidden) closeP(); });

$('#psave').addEventListener('click', e => {
  prof.nick = $('#nick').value.trim().slice(0,24) || PROFILE_DEFAULT.nick;
  store.set('ksnr_nick', prof.nick); paintProfile();
  e.target.textContent = 'រក្សាទុករួច ✓'; setTimeout(() => e.target.textContent = 'រក្សាទុក', 1500);
});
$('#pcopy').addEventListener('click', async e => {
  const sp = e.currentTarget.querySelector('span');
  try{ await navigator.clipboard.writeText(prof.email); }
  catch{ const t=document.createElement('textarea'); t.value=prof.email; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
  sp.textContent = 'Copied'; setTimeout(() => sp.textContent = 'Copy Account', 1500);
});
$('#pfile').addEventListener('change', e => {            // resize to 160px so storage stays small
  const f = e.target.files[0]; if(!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const s = Math.min(img.width,img.height), c = document.createElement('canvas'); c.width = c.height = 160;
    c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,160,160);
    prof.avatar = c.toDataURL('image/jpeg',.85); store.set('ksnr_avatar', prof.avatar); paintProfile(); URL.revokeObjectURL(url);
  };
  img.src = url;
});
$('#phist').addEventListener('click', () => {
  document.dispatchEvent(new CustomEvent('ksnr:history'));
  closeP(); $('#hist').scrollIntoView({behavior:'smooth', block:'start'});
});
$('#plogout').addEventListener('click', () => {
  document.dispatchEvent(new CustomEvent('ksnr:logout'));    // hook: call your real logout here
  store.del('ksnr_nick'); store.del('ksnr_avatar'); location.reload();
});
paintProfile();


/* ================= SCROLLABLE PAIR TABS: drag with mouse, wheel, swipe, edge fade ================= */
(function(){
  const el = $('#tabs'); let down=false, moved=false, sx=0, sl=0;
  el.addEventListener('scroll', updateFade, {passive:true});
  addEventListener('resize', updateFade);
  el.addEventListener('wheel', e => {
    const max = el.scrollWidth - el.clientWidth;
    if(Math.abs(e.deltaY) > Math.abs(e.deltaX) && ((e.deltaY>0 && el.scrollLeft<max-1) || (e.deltaY<0 && el.scrollLeft>1))){
      el.scrollLeft += e.deltaY; e.preventDefault();
    }
  }, {passive:false});
  el.addEventListener('pointerdown', e => { if(e.pointerType!=='mouse') return; down=true; moved=false; sx=e.clientX; sl=el.scrollLeft; });
  addEventListener('pointermove', e => { if(!down) return; const dx=e.clientX-sx; if(Math.abs(dx)>4){ moved=true; el.classList.add('drag'); } el.scrollLeft = sl-dx; });
  addEventListener('pointerup', () => { down=false; el.classList.remove('drag'); });
  el.addEventListener('click', e => { if(moved){ e.stopImmediatePropagation(); e.preventDefault(); moved=false; } }, true);
  updateFade();
})();


/* ================= HISTORY · JOURNAL · LOT · CHART TIMEFRAME ================= */
const HK = 'ksnr_hist', MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function histGet(){ try{ return JSON.parse(store.get(HK) || '[]'); }catch{ return []; } }
function histSave(a){ store.set(HK, JSON.stringify(a.slice(0,20))); renderHistory(); }
function histAdd(x){ const a = histGet(); a.unshift(x); histSave(a); }
function renderHistory(){
  const a = histGet(), up = '<path d="M4 16l6-6 4 4 6-7M15 7h5v5"/>', dn = '<path d="M4 8l6 6 4-4 6 7M15 17h5v-5"/>';
  $('#hlist').innerHTML = a.length ? a.map(h => {
    const t = new Date(h.id), d = h.dec;
    return `<div class="hi"><span class="hic ${h.buy?'b':'s'}"><svg viewBox="0 0 24 24">${h.buy?up:dn}</svg></span>
      <div class="hm"><b>${h.buy?'BUY':'SELL'} ${h.pair}</b> <span>· ${h.frame}</span>${h.journal?' <i>★</i>':''}
      <div class="hd">E ${fmt(h.entry,d)} · SL ${fmt(h.sl,d)} · TP ${fmt(h.tp,d)}</div></div>
      <time>${pad(t.getDate())} ${MON[t.getMonth()]} ${pad(t.getHours())}:${pad(t.getMinutes())}</time></div>`;
  }).join('') : '<p class="why hempty">មិនទាន់មាន Signal ទេ — ចុច «ទទួល Signal» ដើម្បីចាប់ផ្តើម។</p>';
}
$('#hclear').addEventListener('click', () => { store.del(HK); renderHistory(); });

const acctMode = () => store.get('ksnr_acct') === 'cent' ? 'cent' : 'usd';
function paintAcct(sig){
  const m = acctMode(), c = m === 'cent';
  sig.querySelectorAll('.ab').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === m));
  sig.querySelector('.blab').textContent = c ? 'Balance (¢ USC)' : 'Balance ($)';
  sig.querySelector('.lbal').value = store.get(c ? 'ksnr_bal_c' : 'ksnr_bal') || '';
}
function calcLot(sig){
  const c = acctMode() === 'cent';
  const bal = +sig.querySelector('.lbal').value, rk = +sig.querySelector('.lrisk').value, res = sig.querySelector('.lres');
  const p = sig.dataset.pair, dist = Math.abs(+sig.dataset.entry - +sig.dataset.sl);
  if(!(bal>0 && rk>0 && dist>0)){ res.textContent = 'ដាក់ Balance និង Risk %'; return; }
  const usd = c ? bal/100 : bal;                         // cent balance -> dollars
  const risk = usd*rk/100, std = risk/(dist*CONTRACT[p]); // risk in $, lots on a standard contract
  const lot = Math.floor((c ? std*CENT_DIV : std)*100)/100;
  const riskTxt = c ? `<b>${fmt(risk*100,0)} USC</b> ($${risk.toFixed(2)})` : `<b>$${risk.toFixed(2)}</b>`;
  const note = c ? `Cent lot: 1 lot = ${(CONTRACT[p]/CENT_DIV).toLocaleString('en-US')} ឯកតា · ពិនិត្យ Contract Size របស់ Broker`
                 : `1 lot = ${CONTRACT[p].toLocaleString('en-US')} ឯកតា · ពិនិត្យ Contract Size របស់ Broker`;
  res.innerHTML = `Risk ${riskTxt} · Lot <b>${lot>=.01 ? lot.toFixed(2) : '<0.01'}</b><small>${note}</small>`;
}
document.addEventListener('click', e => {
  const sig = e.target.closest('.sig'); if(!sig) return;
  const j = e.target.closest('.jr'), l = e.target.closest('.lotb');
  if(j && !j.disabled){
    const a = histGet(), it = a.find(v => v.id === +sig.dataset.id);
    if(it){ it.journal = 1; histSave(a); }
    j.disabled = true; j.querySelector('span').textContent = '✓ បានចូល Journal';
  }
  if(l){
    const box = sig.querySelector('.lot'); box.hidden = !box.hidden;
    if(!box.hidden){ paintAcct(sig); sig.querySelector('.lrisk').value = store.get('ksnr_risk') || '1'; calcLot(sig); }
  }
  const ab = e.target.closest('.ab');
  if(ab){ store.set('ksnr_acct', ab.dataset.m); paintAcct(sig); calcLot(sig); }
});
document.addEventListener('input', e => {
  const inp = e.target.closest('.lbal,.lrisk'); if(!inp) return;
  const sig = inp.closest('.sig'); store.set(inp.classList.contains('lbal') ? (acctMode()==='cent' ? 'ksnr_bal_c' : 'ksnr_bal') : 'ksnr_risk', inp.value); calcLot(sig);
});

$('#tfbar').addEventListener('click', e => {
  const b = e.target.closest('.tfb'); if(!b) return;
  chartTf = b.dataset.i;
  document.querySelectorAll('.tfb').forEach(x => x.setAttribute('aria-pressed', x === b));
  setChart();
});
renderHistory();