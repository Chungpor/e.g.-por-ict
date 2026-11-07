'use strict';
const FUT=['https://fapi.binance.com/fapi/v1/klines','wss://fstream.binance.com/ws/'];
const SPOT=['https://api.binance.com/api/v3/klines','wss://stream.binance.com:9443/ws/'];
const VIS=['https://data-api.binance.vision/api/v3/klines','wss://data-stream.binance.vision/ws/'];
const B=(u,sym)=>({k:'binance',rest:u[0],ws:u[1],sym});
const ASSETS={
  XAU:{name:'XAU/USD',mult:10,sources:[B(FUT,'XAUUSDT'),{k:'bybit',sym:'XAUUSDT'},{k:'okx',sym:'XAUT-USDT'},{k:'kraken',sym:'PAXGUSD'},B(SPOT,'PAXGUSDT')]},
  BTC:{name:'BTC/USD',mult:1,sources:[B(VIS,'BTCUSDT'),B(SPOT,'BTCUSDT'),{k:'bybit',sym:'BTCUSDT'},{k:'okx',sym:'BTC-USDT'},{k:'kraken',sym:'XBTUSD'}]},
  ETH:{name:'ETH/USD',mult:10,sources:[{k:'okx',sym:'ETH-USDT'},B(VIS,'ETHUSDT'),B(SPOT,'ETHUSDT'),{k:'bybit',sym:'ETHUSDT'},{k:'kraken',sym:'ETHUSD'}]}
};
let asset='XAU';
const TABS=new Proxy({},{get:()=>({...ASSETS[asset],tf:tab==='scalp'?'5m':'1h'})});
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
let tab='scalp',candles=[],ws=null,poll=null,srcLabel='',lastDraw=0,loadId=0,signals=[];

/* ---------- indicators ---------- */
function ema(a,n){const k=2/(n+1),o=[];let p=a[0];for(let i=0;i<a.length;i++){p=i?a[i]*k+p*(1-k):a[0];o.push(p)}return o}
function atr(c,n=14){const o=[];let p=0;for(let i=0;i<c.length;i++){const tr=i?Math.max(c[i].h-c[i].l,Math.abs(c[i].h-c[i-1].c),Math.abs(c[i].l-c[i-1].c)):c[i].h-c[i].l;p=i<n?(p*i+tr)/(i+1):(p*(n-1)+tr)/n;o.push(p)}return o}

/* ---------- strategy (runs on real candles only) ---------- */
function indicators(){const cl=candles.map(c=>c.c);return{e9:ema(cl,9),e21:ema(cl,21),e50:ema(cl,50),at:atr(candles)}}
function makeSignal(i,side,ind){
  const entry=candles[i].c,a=ind.at[i],d=side==='SELL'?-1:1;
  const sl=entry-d*a*2, tps=[1,2,3,4,5].map(k=>entry+d*a*0.6*k);
  return{i,side,entry,sl,tps,t:candles[i].t,mx:0,status:'LIVE',end:null};
}
function evaluate(s){ // conservative: stop checked before targets inside the same candle
  s.mx=0;s.status='LIVE';s.end=null;
  for(let j=s.i+1;j<candles.length;j++){
    const c=candles[j],sell=s.side==='SELL';
    if(sell?c.h>=s.sl:c.l<=s.sl){s.status=s.mx?'PART':'LOSS';s.end=j;return}
    for(let k=s.mx;k<5;k++){if(sell?c.l<=s.tps[k]:c.h>=s.tps[k])s.mx=k+1;else break}
    if(s.mx===5){s.status='WIN';s.end=j;return}
  }
}
function scan(){
  const ind=indicators(),out=[];let i=55;
  while(i<candles.length-1){ // last candle is still forming
    const c=candles[i],p=candles[i-1];let side=null;
    if(ind.e9[i]<ind.e21[i]&&ind.e21[i]<ind.e50[i]&&c.c<ind.e9[i]&&p.c>=ind.e9[i-1])side='SELL';
    if(ind.e9[i]>ind.e21[i]&&ind.e21[i]>ind.e50[i]&&c.c>ind.e9[i]&&p.c<=ind.e9[i-1])side='BUY';
    if(side){const s=makeSignal(i,side,ind);evaluate(s);out.push(s);i=s.end??candles.length;continue}
    i++;
  }
  return out;
}

/* ---------- data (several free public sources, auto fallback) ---------- */
const sig_=()=>({signal:AbortSignal.timeout(7000)});
async function fetchKlines(s,tf,limit=500){
  const h=tf==='1h';let r,j;
  if(s.k==='binance'){r=await fetch(`${s.rest}?symbol=${s.sym}&interval=${tf}&limit=${limit}`,sig_());if(!r.ok)throw 0;
    return (await r.json()).map(k=>({t:+k[0],o:+k[1],h:+k[2],l:+k[3],c:+k[4]}))}
  if(s.k==='bybit'){r=await fetch(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${s.sym}&interval=${h?60:5}&limit=${Math.min(limit,1000)}`,sig_());j=await r.json();
    if(!j.result||!j.result.list)throw 0;return j.result.list.map(k=>({t:+k[0],o:+k[1],h:+k[2],l:+k[3],c:+k[4]})).reverse()}
  if(s.k==='okx'){r=await fetch(`https://www.okx.com/api/v5/market/candles?instId=${s.sym}&bar=${h?'1H':'5m'}&limit=${Math.min(limit,300)}`,sig_());j=await r.json();
    if(!j.data||!j.data.length)throw 0;return j.data.map(k=>({t:+k[0],o:+k[1],h:+k[2],l:+k[3],c:+k[4]})).reverse()}
  if(s.k==='kraken'){r=await fetch(`https://api.kraken.com/0/public/OHLC?pair=${s.sym}&interval=${h?60:5}`,sig_());j=await r.json();
    const key=j.result&&Object.keys(j.result).find(x=>x!=='last');if(!key)throw 0;
    return j.result[key].slice(-limit).map(k=>({t:+k[0]*1000,o:+k[1],h:+k[2],l:+k[3],c:+k[4]}))}
  throw 0;
}
function stopLive(){if(ws){ws.onclose=null;ws.onerror=null;ws.close();ws=null}if(poll){clearInterval(poll);poll=null}}
async function load(){
  const my=++loadId,cfg=TABS.cfg;stopLive();
  $('pair').textContent=cfg.name;setStatus('Connecting…','');
  $('grid').innerHTML='<div class="empty">Loading live market data…</div>';
  for(const s of cfg.sources){
    try{
      const c=await fetchKlines(s,cfg.tf);if(my!==loadId)return;if(c.length<60)throw 0;
      candles=c;srcLabel=`${s.k} ${s.sym} · ${cfg.tf}`;$('src').textContent=srcLabel;
      s.k==='binance'?connect(s,cfg.tf,my):startPoll(s,cfg.tf,my);render(true);return;
    }catch(e){}
  }
  setStatus('Data source unreachable','err');
  $('grid').innerHTML='<div class="empty">Could not reach any market data API (Binance, Bybit, OKX, Kraken).<br>Open this file directly from your computer in Chrome/Edge/Safari (double-click it). Preview windows and sandboxes block network requests. Also check VPN/firewall.</div>';
}
function startPoll(s,tf,my){
  if(poll)clearInterval(poll);setStatus('Live','live');
  poll=setInterval(async()=>{try{const c=await fetchKlines(s,tf);if(my!==loadId||!c.length)return;
    const grew=c[c.length-1].t!==candles[candles.length-1].t;candles=c;setStatus('Live','live');render(grew)}catch(e){setStatus('Reconnecting…','err')}},3000);
}
function connect(s,tf,my){
  let opened=false;
  ws=new WebSocket(`${s.ws}${s.sym.toLowerCase()}@kline_${tf}`);
  ws.onopen=()=>{opened=true;setStatus('Live','live')};
  ws.onmessage=e=>{
    const k=JSON.parse(e.data).k;if(!k||my!==loadId)return;
    const c={t:k.t,o:+k.o,h:+k.h,l:+k.l,c:+k.c},last=candles[candles.length-1];
    if(last.t===c.t)candles[candles.length-1]=c;else{candles.push(c);if(candles.length>600)candles.shift();render(true)}
    render(false);
  };
  ws.onclose=ws.onerror=()=>{if(my!==loadId)return;ws=null;if(!opened)startPoll(s,tf,my);else{setStatus('Reconnecting…','err');setTimeout(()=>{if(my===loadId)load()},3000)}};
}
function setStatus(t,c){$('status').textContent=t;$('dot').className=c}

/* ---------- render ---------- */
function render(full){
  const now=Date.now();if(!full&&now-lastDraw<1000)return;lastDraw=now;
  const cfg=TABS[tab],last=candles[candles.length-1],first=candles[Math.max(0,candles.length-1-(cfg.tf==='1h'?24:288))];
  const pe=$('price'),prev=parseFloat(pe.dataset.v||last.c);
  pe.textContent=fmt(last.c);pe.dataset.v=last.c;pe.className='price '+(last.c>=prev?'up':'down');
  const ch=(last.c-first.c)/first.c*100;$('chg').textContent=`${ch>=0?'+':''}${ch.toFixed(2)}% (24h)`;
  const ind=indicators(),n=candles.length-1;
  $('sTrend').textContent=ind.e9[n]>ind.e21[n]&&ind.e21[n]>ind.e50[n]?'Bullish':ind.e9[n]<ind.e21[n]&&ind.e21[n]<ind.e50[n]?'Bearish':'Mixed';
  signals=scan();signals.forEach(s=>{if(s.status==='LIVE')evaluate(s)});
  const done=signals.filter(s=>s.status!=='LIVE'),wins=done.filter(s=>s.status==='WIN'||s.status==='PART').length;
  $('sTotal').textContent=signals.length;$('sWin').textContent=done.length?Math.round(wins/done.length*100)+'%':'–';
  const list=signals.slice(-8).reverse(),g=$('grid');
  if(!list.length){g.innerHTML='<div class="empty">No setup yet. Waiting for the next confirmed signal on live data…</div>';return}
  g.innerHTML=list.map((s,k)=>cardHTML(s,k)).join('');
  list.forEach((s,k)=>drawChart(g.querySelector(`canvas[data-k="${k}"]`),s,ind));
}
function cardHTML(s,k){
  const m=TABS[tab].mult,tp=s.tps[4];
  const st={LIVE:['live','LIVE'+(s.mx?` · TP${s.mx} hit`:'')],WIN:['win','WIN · TP5 hit'],PART:['part',`PARTIAL · TP${s.mx} hit`],LOSS:['loss','LOSS · Stop hit']}[s.status];
  return `<div class="card"><canvas data-k="${k}"></canvas><div class="body">
  <div class="head"><span class="sym">${TABS[tab].name}</span><span class="badge ${s.side}">${s.side}</span><span class="state ${st[0]}">${st[1]}</span></div>
  <div class="row"><span>Entry</span><b>${fmt(s.entry)}</b></div>
  <div class="row"><span>Stop</span><b>${fmt(s.sl)} (${Math.round(Math.abs(s.sl-s.entry)*m)})</b></div>
  <div class="row"><span>Target</span><b>${fmt(tp)} (+${Math.round(Math.abs(tp-s.entry)*m)})</b></div>
  <div class="when">${new Date(s.t).toLocaleString()} · ${srcLabel}</div></div></div>`;
}

/* ---------- candlestick chart (canvas) ---------- */
function drawChart(cv,s,ind){
  const dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;
  const x=cv.getContext('2d');x.scale(dpr,dpr);x.fillStyle='#fff';x.fillRect(0,0,W,H);
  const a=Math.max(0,s.i-90),b=Math.min(candles.length-1,(s.end??candles.length-1)+10),sl=candles.slice(a,b+1);
  const extra=Math.round(sl.length*.25),slots=sl.length+extra,cw=(W-50)/slots;
  let hi=Math.max(...sl.map(c=>c.h),s.sl,s.tps[4]),lo=Math.min(...sl.map(c=>c.l),s.sl,s.tps[4]);
  const pad=(hi-lo)*.06;hi+=pad;lo-=pad;
  const Y=v=>10+(hi-v)/(hi-lo)*(H-20),X=i=>(i-a)*cw+cw/2;
  x.strokeStyle='#eee';x.fillStyle='#999';x.font='9px sans-serif';
  for(let g=0;g<=4;g++){const v=lo+(hi-lo)*g/4,y=Y(v);x.beginPath();x.moveTo(0,y);x.lineTo(W-48,y);x.stroke();x.fillText(v.toFixed(2),W-46,y+3)}
  const ex=X(s.i),zx=ex,zw=W-50-zx;
  x.fillStyle='rgba(255,77,94,.18)';x.fillRect(zx,Math.min(Y(s.entry),Y(s.sl)),zw,Math.abs(Y(s.sl)-Y(s.entry)));
  x.fillStyle='rgba(34,197,139,.2)';x.fillRect(zx,Math.min(Y(s.entry),Y(s.tps[4])),zw,Math.abs(Y(s.tps[4])-Y(s.entry)));
  [[ind.e9,'#f5a623'],[ind.e21,'#e8590c'],[ind.e50,'#999']].forEach(([arr,col])=>{
    x.strokeStyle=col;x.lineWidth=1;x.beginPath();sl.forEach((c,j)=>{const px=X(a+j),py=Y(arr[a+j]);j?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()});
  sl.forEach((c,j)=>{const px=X(a+j),up=c.c>=c.o;x.strokeStyle=x.fillStyle=up?'#26a69a':'#ef5350';
    x.beginPath();x.moveTo(px,Y(c.h));x.lineTo(px,Y(c.l));x.stroke();
    const t=Y(Math.max(c.o,c.c)),h=Math.max(1,Math.abs(Y(c.o)-Y(c.c)));x.fillRect(px-cw*.35,t,cw*.7,h)});
  const lbl=(v,col,t)=>{const y=Y(v);x.fillStyle=col;x.fillRect(W-48,y-6,48,12);x.fillStyle='#fff';x.font='bold 9px sans-serif';x.fillText(t,W-45,y+3);
    x.strokeStyle=col;x.lineWidth=.8;x.setLineDash([3,3]);x.beginPath();x.moveTo(zx,y);x.lineTo(W-48,y);x.stroke();x.setLineDash([])};
  lbl(s.sl,'#ef5350','SL');lbl(s.entry,'#555','ENTRY');s.tps.forEach((v,k)=>lbl(v,'#26a69a','TP'+(k+1)));
}

$('tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===b));tab=b.dataset.tab;load()});
window.addEventListener('resize',()=>candles.length&&render(true));
load();

/* ---------- live ticker for all three assets ---------- */
const tkSrc={};
function tickerInit(){
  $('live3').innerHTML=Object.keys(ASSETS).map(k=>`<div class="mini" data-a="${k}" id="m${k}"><div class="n">${ASSETS[k].name}</div><div class="p">–</div><div class="c muted">connecting…</div></div>`).join('');
  Object.keys(ASSETS).forEach(k=>{tickerTick(k);setInterval(()=>tickerTick(k),3000)});
}
async function tickerTick(k){
  const list=ASSETS[k].sources,order=tkSrc[k]!=null?[tkSrc[k]]:list.map((_,i)=>i),el=$('m'+k);
  for(const i of order){
    try{const c=await fetchKlines(list[i],'5m',288),p=c[c.length-1].c,ch=(p-c[0].o)/c[0].o*100;tkSrc[k]=i;
      el.querySelector('.p').textContent=fmt(p);const d=el.querySelector('.c');
      d.textContent=`${ch>=0?'+':''}${ch.toFixed(2)}% (24h)`;d.className='c '+(ch>=0?'up':'down');return}catch(e){}
  }
  tkSrc[k]=null;el.querySelector('.c').textContent='unreachable';
}
$('live3').addEventListener('click',e=>{const m=e.target.closest('.mini');if(m)pickAsset(m.dataset.a)});
$('assets').addEventListener('click',e=>{const b=e.target.closest('button');if(b)pickAsset(b.dataset.a)});
function pickAsset(a){asset=a;
  document.querySelectorAll('#assets button').forEach(x=>x.classList.toggle('on',x.dataset.a===a));
  document.querySelectorAll('.mini').forEach(x=>x.classList.toggle('sel',x.dataset.a===a));
  load()}
tickerInit();$('mXAU').classList.add('sel');

/* ---------- TradingView live chart ---------- */
const TV={XAU:'OANDA:XAUUSD',BTC:'BINANCE:BTCUSDT',ETH:'OKX:ETHUSDT'};
function tvLoad(){
  const box=$('tv');box.innerHTML='';
  if(!window.TradingView){box.innerHTML='<div class="empty">TradingView could not load. Check your internet connection.</div>';return}
  new TradingView.widget({container_id:'tv',autosize:true,symbol:TV[asset],interval:tab==='scalp'?'5':'60',
    timezone:'Etc/UTC',theme:'dark',style:'1',locale:'en',toolbar_bg:'#131722',enable_publishing:false,
    allow_symbol_change:true,hide_side_toolbar:false,studies:['MAExp@tv-basicstudies']});
}
let tvKey='';
const _render=render;
render=function(full){_render(full);const k=asset+tab;if(k!==tvKey){tvKey=k;tvLoad()}};
$('printBtn').addEventListener('click',()=>{render(true);setTimeout(()=>window.print(),300)});

/* ---------- navigation: Dashboard / Users / Signals ---------- */
const VIEWS=['dashboard','signals','users'];let view='dashboard',allSig=[],sigTf='scalp',sigF='all';
function show(v){
  if(!VIEWS.includes(v))v='dashboard';const was=view;view=v;
  VIEWS.forEach(x=>$('v-'+x).hidden=x!==v);
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('on',a.dataset.view===v));
  if(location.hash!=='#'+v)history.replaceState(null,'','#'+v);
  window.scrollTo(0,0);
  if(v==='dashboard'&&was!=='dashboard'){render(true);tvLoad()}
  if(v==='signals'){allSig=[];loadAllSignals()}
  if(v==='users')renderUsers();
}
$('nav').addEventListener('click',e=>{const a=e.target.closest('a');if(a){e.preventDefault();show(a.dataset.view)}});
$('brand').addEventListener('click',()=>show('dashboard'));
window.addEventListener('hashchange',()=>show(location.hash.slice(1)));

/* signals page: all three assets */
async function loadAllSignals(){
  const tfv=sigTf==='scalp'?'5m':'1h',got=[],body=$('sigBody');
  if(!allSig.length)body.innerHTML='<tr><td colspan="7" class="muted">Loading live signals…</td></tr>';
  await Promise.all(Object.keys(ASSETS).map(async k=>{
    for(const s of ASSETS[k].sources){try{const c=await fetchKlines(s,tfv);if(c.length<60)throw 0;got.push({k,c});return}catch(e){}}
  }));
  if(view!=='signals'||tfv!==(sigTf==='scalp'?'5m':'1h'))return;
  const saved=candles,rows=[];
  got.forEach(o=>{candles=o.c;scan().forEach(s=>{s.asset=o.k;rows.push(s)})});
  candles=saved;allSig=rows.sort((a,b)=>b.t-a.t);
  if(!got.length)body.innerHTML='<tr><td colspan="7" class="muted">Could not reach the market data APIs.</td></tr>';else drawSigTable();
}
const STATUS={LIVE:['live','LIVE'],WIN:['win','WIN · TP5 hit'],PART:['part','PARTIAL'],LOSS:['loss','LOSS · Stop hit']};
const sigRows=()=>allSig.filter(s=>sigF==='all'||(sigF==='live'&&s.status==='LIVE')||(sigF==='win'&&(s.status==='WIN'||s.status==='PART'))||(sigF==='loss'&&s.status==='LOSS'));
function drawSigTable(){
  const r=sigRows().slice(0,100);
  $('sigBody').innerHTML=r.length?r.map(s=>{const st=STATUS[s.status];
    return `<tr data-a="${s.asset}"><td>${new Date(s.t).toLocaleString()}</td><td>${ASSETS[s.asset].name}</td><td class="${s.side}">${s.side}</td><td>${fmt(s.entry)}</td><td>${fmt(s.sl)}</td><td>${fmt(s.tps[4])}</td><td class="${st[0]}">${st[1]}${s.status==='PART'?' (TP'+s.mx+')':''}</td></tr>`}).join('')
    :'<tr><td colspan="7" class="muted">No signals match this filter.</td></tr>';
}
function activate(boxId,btn){document.querySelectorAll('#'+boxId+' button').forEach(x=>x.classList.toggle('on',x===btn))}
$('sigTf').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sigTf=b.dataset.tf;activate('sigTf',b);allSig=[];loadAllSignals()});
$('sigFilter').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sigF=b.dataset.f;activate('sigFilter',b);drawSigTable()});
$('sigBody').addEventListener('click',e=>{const tr=e.target.closest('tr[data-a]');if(!tr)return;
  tab=sigTf;document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x.dataset.tab===tab));
  show('dashboard');pickAsset(tr.dataset.a)});
$('csvBtn').addEventListener('click',()=>{
  const lines=['time,pair,side,entry,stop,tp1,tp2,tp3,tp4,tp5,status'].concat(sigRows().map(s=>
    [new Date(s.t).toISOString(),ASSETS[s.asset].name,s.side,s.entry,s.sl,...s.tps,s.status].map(v=>typeof v==='number'?v.toFixed(2):v).join(',')));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/csv'}));
  a.download='signals.csv';document.body.appendChild(a);a.click();a.remove();
});
setInterval(()=>{if(view==='signals')loadAllSignals()},15000);

/* users page (saved in this browser) */
const UKEY='signaldesk_users';
function getUsers(){try{const u=JSON.parse(localStorage.getItem(UKEY));if(Array.isArray(u))return u}catch(e){}return[{name:'You',role:'Admin'}]}
function saveUsers(u){try{localStorage.setItem(UKEY,JSON.stringify(u))}catch(e){}}
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let users=getUsers();
function renderUsers(){$('uBody').innerHTML=users.length?users.map((u,i)=>`<tr><td>${esc(u.name)}</td><td>${esc(u.role)}</td><td><button class="del" data-i="${i}">Remove</button></td></tr>`).join(''):'<tr><td colspan="3" class="muted">No users yet. Add one above.</td></tr>'}
$('uAdd').addEventListener('click',()=>{const n=$('uName').value.trim();if(!n){$('uName').focus();return}
  users.push({name:n,role:$('uRole').value});saveUsers(users);$('uName').value='';renderUsers()});
$('uName').addEventListener('keydown',e=>{if(e.key==='Enter')$('uAdd').click()});
$('uBody').addEventListener('click',e=>{const b=e.target.closest('.del');if(!b)return;users.splice(+b.dataset.i,1);saveUsers(users);renderUsers()});
if(location.hash&&location.hash!=='#dashboard')show(location.hash.slice(1));