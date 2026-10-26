const $=s=>document.querySelector(s),cv=$('#cv'),cx=cv.getContext('2d'),dlg=$('#dlg'),N=20,R=a=>a[Math.random()*a.length|0];
const DEF={walls:'wrap',speed:'normal',prog:true,gld:true,obs:false,fx:true,snd:true},BASE={slow:150,normal:110,fast:80};
let S={...DEF},best={},C={};
try{Object.assign(S,JSON.parse(localStorage.getItem('snk-set')||'{}'));best=JSON.parse(localStorage.getItem('snk-best')||'{}')}catch(e){}
let sn,dir,q,food,gold,obs,score,eaten,state='ready',acc,last=0,shake=0,P=[],isBest=false;
const fa=n=>Number(n).toLocaleString('fa-IR'),key=()=>[S.walls,S.speed,S.prog,S.gld,S.obs].join('-'),rc=()=>({x:Math.random()*N|0,y:Math.random()*N|0});
const same=(a,b)=>a.x===b.x&&a.y===b.y,free=p=>![...sn,...obs,food,gold].some(o=>o&&same(o,p));

/* ---- sound / colors / size ---- */
let ac;
function tone(f,d=.1,t='sine',at=0){
  if(!S.snd)return;
  try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();
    const o=ac.createOscillator(),g=ac.createGain(),s=ac.currentTime+at;
    o.type=t;o.frequency.value=f;g.gain.setValueAtTime(.001,s);g.gain.exponentialRampToValueAtTime(.15,s+.01);g.gain.exponentialRampToValueAtTime(.001,s+d);
    o.connect(g).connect(ac.destination);o.start(s);o.stop(s+d)}catch(e){}
}
function colors(){const s=getComputedStyle(document.documentElement);['bg','x','o','win','mut','line'].forEach(k=>C[k]=s.getPropertyValue('--'+k).trim())}
function fit(){cv.width=cv.height=Math.round(cv.clientWidth*(devicePixelRatio||1))}
matchMedia('(prefers-color-scheme:light)').onchange=colors;addEventListener('resize',fit);

/* ---- game ---- */
function init(){
  sn=[{x:6,y:10},{x:5,y:10},{x:4,y:10}];dir={x:1,y:0};q=[];score=0;eaten=0;gold=null;food=null;obs=[];P=[];isBest=false;acc=0;
  while(S.obs&&obs.length<7){const p=rc();if(p.y>=9&&p.y<=11&&p.x<11)continue;if(!obs.some(o=>same(o,p)))obs.push(p)}
  spawn();state='ready';ui();
}
function spawn(){let p;do p=rc();while(!free(p));food=p}
const interval=()=>Math.max(55,BASE[S.speed]-(S.prog?score*2.5:0));
function pop(p,txt,c){
  if(!S.fx)return;
  for(let i=0;i<14;i++){const a=Math.random()*6.28,v=.05+Math.random()*.15;P.push({x:p.x+.5,y:p.y+.5,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,c})}
  if(txt)P.push({x:p.x+.5,y:p.y,vx:0,vy:-.04,l:1.6,c,txt});
}
function turn(d){
  const l=q.length?q.at(-1):dir;
  if(d.x+l.x===0&&d.y+l.y===0||same(d,l)||q.length>1)return;
  q.push(d);
}
function step(){
  if(q.length)dir=q.shift();
  let x=sn[0].x+dir.x,y=sn[0].y+dir.y;
  if(S.walls==='wrap'){x=(x+N)%N;y=(y+N)%N}
  else if(x<0||y<0||x>=N||y>=N)return die();
  const np={x,y},eat=same(np,food),g=gold&&same(np,gold);
  if([...(eat||g?sn:sn.slice(0,-1)),...obs].some(o=>same(o,np)))return die();
  sn.unshift(np);
  if(eat){
    score++;eaten++;tone(660,.08,'triangle');pop(np,'+1',C.o);spawn();
    if(S.gld&&eaten%5===0&&!gold){let p;do p=rc();while(!free(p));gold={...p,t:5000}}
  }else if(g){
    score+=5;gold=null;[784,988,1175].forEach((f,k)=>tone(f,.12,'triangle',k*.06));pop(np,'+5',C.win);
  }else sn.pop();
  ui();
}
function die(){
  state='over';tone(150,.5,'sawtooth');
  if(S.fx){shake=500;pop(sn[0],'',C.o);pop(sn[0],'',C.x)}
  if(score>(best[key()]||0)){best[key()]=score;isBest=score>0;try{localStorage.setItem('snk-best',JSON.stringify(best))}catch(e){}}
  ui();
}
function begin(){if(state==='over')init();state='run';acc=0;ui()}
function toggle(){if(state==='run'||state==='pause'){state=state==='run'?'pause':'run';ui()}}

/* ---- loop & render ---- */
function loop(t){
  requestAnimationFrame(loop);
  const dt=Math.min(50,t-(last||t));last=t;
  if(state==='run'){
    acc+=dt;let iv=interval();
    while(acc>=iv&&state==='run'){acc-=iv;step();iv=interval()}
    if(gold&&(gold.t-=dt)<=0)gold=null;
  }
  P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.l-=p.txt?.02:.03});P=P.filter(p=>p.l>0);
  shake=Math.max(0,shake-dt);draw(t);
}
function rr(x,y,w,h,r,f){cx.beginPath();cx.roundRect(x,y,w,h,r);f?cx.fill():cx.stroke()}
function draw(t){
  const w=cv.width,c=w/N;
  cx.save();cx.clearRect(0,0,w,w);
  if(shake>0){const m=shake/500*c*.35;cx.translate((Math.random()-.5)*2*m,(Math.random()-.5)*2*m)}
  cx.globalAlpha=.3;cx.fillStyle=C.line;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++)if((i+j)%2)cx.fillRect(i*c,j*c,c,c);
  cx.globalAlpha=1;
  cx.fillStyle=C.mut;obs.forEach(o=>rr(o.x*c+c*.08,o.y*c+c*.08,c*.84,c*.84,c*.2,1));
  cx.shadowBlur=c*.8;
  cx.shadowColor=cx.fillStyle=C.o;cx.beginPath();cx.arc((food.x+.5)*c,(food.y+.5)*c,c*(.32+.05*Math.sin(t/150)),0,7);cx.fill();
  if(gold){
    cx.shadowColor=cx.fillStyle=cx.strokeStyle=C.win;cx.lineWidth=c*.08;
    cx.beginPath();cx.arc((gold.x+.5)*c,(gold.y+.5)*c,c*(.28+.04*Math.sin(t/90)),0,7);cx.fill();
    cx.beginPath();cx.arc((gold.x+.5)*c,(gold.y+.5)*c,c*.45,-1.57,-1.57+gold.t/5000*6.28);cx.stroke();
  }
  const n=sn.length;
  cx.shadowColor=C.x;cx.fillStyle=C.x;
  for(let i=n-1;i>=0;i--){
    const p=sn[i],pad=c*(i?.1:.05);
    cx.globalAlpha=.4+.6*(1-i/n);
    rr(p.x*c+pad,p.y*c+pad,c-2*pad,c-2*pad,c*.3,1);
  }
  cx.globalAlpha=1;cx.shadowBlur=0;cx.fillStyle=C.bg;
  const h=sn[0],hx=(h.x+.5)*c,hy=(h.y+.5)*c;
  for(const s of[-1,1]){cx.beginPath();cx.arc(hx+dir.x*c*.15-dir.y*s*c*.2,hy+dir.y*c*.15+dir.x*s*c*.2,c*.09,0,7);cx.fill()}
  cx.textAlign='center';cx.font=`bold ${c*.6}px sans-serif`;
  P.forEach(p=>{
    cx.globalAlpha=Math.min(1,p.l);cx.fillStyle=p.c;
    if(p.txt)cx.fillText(p.txt,p.x*c,p.y*c);else cx.fillRect(p.x*c,p.y*c,c*.14,c*.14);
  });
  cx.restore();
}

/* ---- UI ---- */
function ui(){
  const b=best[key()]||0;
  $('#sc').textContent=fa(score);$('#ln').textContent=fa(sn.length);$('#bs').textContent=fa(Math.max(b,score));
  const ov=$('#ov');ov.classList.toggle('hid',state==='run');
  const T={ready:['آماده‌ای؟','Enter یا ضربه بزن، یا یک جهت‌نما را فشار بده'],
    pause:['⏸ مکث','فاصله یا ضربه برای ادامه'],
    over:['بازی تمام شد 💥','امتیاز: '+fa(score)+(isBest?' — رکورد جدید! 🏆':'')+'<br>Enter یا ضربه برای دوباره']}[state];
  if(T){$('#ovt').textContent=T[0];$('#ovs').innerHTML=T[1]}
  $('#pz').textContent=state==='pause'?'▶ ادامه':'⏸ مکث';
}
function dirKey(d){
  if(state==='over')return;
  if(state==='ready')begin();else if(state==='pause')toggle();
  turn(d);
}
const D={u:{x:0,y:-1},d:{x:0,y:1},l:{x:-1,y:0},r:{x:1,y:0}};
const KM={ArrowUp:'u',KeyW:'u',ArrowDown:'d',KeyS:'d',ArrowLeft:'l',KeyA:'l',ArrowRight:'r',KeyD:'r'};
addEventListener('keydown',e=>{
  if(dlg.open)return;
  if(KM[e.code]){e.preventDefault();dirKey(D[KM[e.code]])}
  else if(e.code==='Space'||e.code==='KeyP'){e.preventDefault();state==='ready'||state==='over'?begin():toggle()}
  else if(e.code==='Enter'){e.preventDefault();if(state!=='run')state==='pause'?toggle():begin()}
});
document.querySelector('.pad').onclick=e=>{const d=e.target.dataset.d;if(d)dirKey(D[d])};
$('#ov').onclick=()=>state==='pause'?toggle():begin();
let tx,ty;const st=$('#stage');
st.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
st.addEventListener('touchend',e=>{
  const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
  if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
  dirKey(Math.abs(dx)>Math.abs(dy)?D[dx>0?'r':'l']:D[dy>0?'d':'u']);
});
addEventListener('blur',()=>state==='run'&&toggle());
$('#go').onclick=()=>{init();begin()};
$('#pz').onclick=()=>state==='ready'||state==='over'?begin():toggle();

/* ---- settings ---- */
function setSeg(id,v){const s=$(id);s.dataset.val=v;[...s.children].forEach(x=>x.classList.toggle('on',x.dataset.v===v))}
document.querySelectorAll('.seg').forEach(s=>s.onclick=e=>{if(e.target.dataset.v)setSeg('#'+s.id,e.target.dataset.v)});
$('#set').onclick=()=>{
  if(state==='run')toggle();
  setSeg('#sWalls',S.walls);setSeg('#sSpeed',S.speed);
  ['prog','gld','obs'].forEach(k=>$('#'+k).checked=S[k]);$('#fxc').checked=S.fx;$('#snd').checked=S.snd;
  dlg.showModal();
};
$('#cancel').onclick=()=>dlg.close();
$('#ok').onclick=()=>{
  S={walls:$('#sWalls').dataset.val,speed:$('#sSpeed').dataset.val,prog:$('#prog').checked,gld:$('#gld').checked,obs:$('#obs').checked,fx:$('#fxc').checked,snd:$('#snd').checked};
  try{localStorage.setItem('snk-set',JSON.stringify(S))}catch(e){}
  dlg.close();init();
};
colors();fit();init();requestAnimationFrame(loop);
