import * as THREE from './vendor/three.module.js';
import RAPIER from './vendor/rapier.es.js';
await RAPIER.init();
import { bonusStage, crashPoint, multiplierUnits, payout, resolveRound } from './math.mjs';

const $ = (s) => document.querySelector(s);
const money = (n) => (n / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const state = { balance: 1245000, phase: 'idle', multiplier: 1, bet: 0, auto: false, remaining: 0, history: [], sound: true, music: true, motion: true, turbo: false };
const steppers = document.querySelectorAll('.stepper');
steppers[0].innerHTML = '<button aria-label="Halve bet">−</button><input id="bet" class="value" type="number" aria-label="Bet amount" min="1" step="1" value="100"><button aria-label="Double bet">+</button>';
steppers[1].classList.add('prediction-control');
steppers[1].innerHTML = '<div class="prediction-track"><input id="target" type="range" aria-label="Prediction multiplier" min="0" max="1000" step="1"><div class="live-track" aria-hidden="true"><div class="live-fill"></div><i class="live-marker"></i></div><output id="live-multiplier" aria-label="Live round multiplier">Live 1.00x</output></div><label class="prediction-number"><input id="prediction" type="number" aria-label="Exact prediction multiplier" min="1.01" max="1000" step="0.01" value="2.50"><span aria-hidden="true">x</span></label>';
// Reserve 70% of the track for 1.01x-10x, then expand to 1000x.
function predictionPosition(value) {
 return value<=10 ? (value-1.01)/8.99*700 : 700+Math.log10(value/10)*150;
}
function syncPredictionSlider() {
 const value=Number($('#prediction').value);
 if(!$('#prediction').value || !Number.isFinite(value) || value<1.01 || value>1000)return;
 $('#target').value=predictionPosition(value);
 $('#target').setAttribute('aria-valuetext',value.toFixed(2)+'x');
}
syncPredictionSlider();
const predictionPanel = steppers[1].parentElement;
predictionPanel.classList.add('prediction-panel');
$('.bottom-playbar').before(predictionPanel);
const action = $('.play-button');
const auto = $('.toggle-pill');
auto.setAttribute('role', 'switch');
const message = document.createElement('div');
message.className = 'round-message';
message.setAttribute('role', 'status');
$('.stage').append(message);
$('.drawer-list').innerHTML = `
 <button class="drawer-row" id="sound" role="switch" aria-checked="true">Sound<span class="switch"></span></button>
 <button class="drawer-row" id="music" role="switch" aria-checked="true">Background music<span class="switch"></span></button>
 <button class="drawer-row" id="motion" role="switch" aria-checked="true">Motion<span class="switch"></span></button>
 <button class="drawer-row" id="turbo" role="switch" aria-checked="false">Turbo<span class="switch off"></span></button>
 <label class="drawer-row">Autoplay rounds<input id="rounds" type="number" min="1" max="100" value="10"></label>
 <label class="drawer-row">Stop on profit<input id="profit" type="number" min="1" value="500"></label>
 <label class="drawer-row">Stop on loss<input id="loss" type="number" min="1" value="500"></label>
 <details><summary>Rules & stages</summary><p>Select your stake and prediction before starting. A result at or above your prediction pays your stake multiplied by that prediction, including the original stake. A lower result loses the stake. Predicting 2.50x with a 100x result pays 2.50x, and the tower continues to 100x.</p><p>Stack Bonus adds blocks, Double Stack doubles block growth, and Super Stack speeds up the tower. Legendary Stack celebrates 25x. Stages do not increase the selected payout. Maximum prediction and displayed result: 1000x.</p><p>Demo math: 96.5% theoretical return before cent rounding. Payouts round down to whole cents.</p><p>Local demo credits and browser-generated results. Stake is not connected.</p></details>
 <details><summary>Round history</summary><div id="history">No rounds yet.</div></details>
 <button class="drawer-row" id="reset">Reset demo balance<span>↻</span></button>`;

let audio;
let musicTimer, musicBus, musicStarted=false, musicStep=0, nextMusicNote=0;
const musicVoices=new Set();
function musicNote(midi,when,duration,volume,type='sine'){
 const oscillator=audio.createOscillator(), envelope=audio.createGain();
 oscillator.type=type;oscillator.frequency.value=440*2**((midi-69)/12);
 envelope.gain.setValueAtTime(0,when);
 envelope.gain.linearRampToValueAtTime(volume,when+.04);
 envelope.gain.exponentialRampToValueAtTime(.0001,when+duration);
 oscillator.connect(envelope);envelope.connect(musicBus);
 musicVoices.add(oscillator);
 oscillator.onended=()=>{musicVoices.delete(oscillator);oscillator.disconnect();envelope.disconnect();};
 oscillator.start(when);oscillator.stop(when+duration+.03);
}
function stopMusic(){
 clearInterval(musicTimer);musicTimer=undefined;
 for(const voice of musicVoices){try{voice.stop();}catch{}}
 musicVoices.clear();
 if(musicBus){musicBus.disconnect();musicBus=null;}
}
function playMusic(){
 musicStarted=true;
 if(!state.music || document.hidden || musicTimer!==undefined)return;
 try {
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  audio.resume().catch(()=>{});
  musicBus=audio.createGain();musicBus.gain.value=.16;musicBus.connect(audio.destination);
  nextMusicNote=audio.currentTime+.05;
  const chords=[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]];
  const pattern=[2,3,1,3,2,1,3,1];
  const schedule=()=>{
   if(audio.state!=='running')return;
   nextMusicNote=Math.max(nextMusicNote,audio.currentTime+.02);
   while(nextMusicNote<audio.currentTime+.18){
    const chord=chords[Math.floor(musicStep/8)%chords.length];
    musicNote(chord[pattern[musicStep%8]]+12,nextMusicNote,.55,.12);
    if(musicStep%8===0){
     musicNote(chord[0]-12,nextMusicNote,2.3,.22);
     for(const note of chord.slice(1))musicNote(note,nextMusicNote,2.2,.06);
    }
    musicStep=(musicStep+1)%32;nextMusicNote+=.3125;
   }
  };
  schedule();musicTimer=setInterval(schedule,100);
 } catch {stopMusic();}
}
$('#music').onclick=()=>{
 state.music=!state.music;
 $('#music').setAttribute('aria-checked',state.music);
 $('#music .switch').classList.toggle('off',!state.music);
 if(state.music)playMusic();else stopMusic();
};
document.addEventListener('visibilitychange',()=>{
 if(document.hidden)stopMusic();else if(musicStarted&&state.music)playMusic();
});
window.addEventListener('pagehide',stopMusic);
function tone(frequency = 420, duration = .1) {
 if (!state.sound) return;
 try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); const o=audio.createOscillator(), g=audio.createGain(); o.frequency.value=frequency; g.gain.setValueAtTime(.035,audio.currentTime); g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration); o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime+duration); } catch {}
}
for (const key of ['sound','motion','turbo']) $('#'+key).onclick = () => { state[key]=!state[key]; $('#'+key).setAttribute('aria-checked',state[key]); $('#'+key+' .switch').classList.toggle('off', !state[key]); };
function update() {
 const winTier=state.phase==='won'?(state.target>=25?'mega':state.target>=10?'big':'regular'):'';
 $('.stage').dataset.win=winTier;
 message.classList.toggle('win-message',state.phase==='won');
 $('.balance strong').textContent=money(state.balance);
 $('.multiplier').textContent=(multiplierUnits(state.multiplier)/100).toFixed(2)+'x';
 const progress=Math.max(0,Math.min(1000,predictionPosition(state.multiplier)))/10;
 $('.prediction-track').style.setProperty('--live-progress',progress+'%');
 $('.prediction-track').dataset.phase=state.phase;
 $('#live-multiplier').textContent=state.phase==='running'?'Live '+(multiplierUnits(state.multiplier)/100).toFixed(2)+'x':'';
 $('.stage-status span').textContent=state.phase==='running' ? (state.multiplier>=state.target?'Prediction reached':'Potential win') : 'Round payout';
 $('.stage-status strong').textContent=money(state.phase==='running'?payout(state.bet,multiplierUnits(state.target)):(state.payout || 0));
 action.textContent=state.phase==='running' ? 'Revealing result' : 'Start Stack';
 action.disabled=state.phase==='running';
 auto.textContent=state.auto ? `On · ${state.remaining || $('#rounds').value}` : 'Off';
 auto.setAttribute('aria-checked',state.auto);
 for(const input of document.querySelectorAll('.stepper input, .stepper button, .drawer-row input, #reset')) input.disabled=state.phase==='running' || state.auto;
}
steppers.forEach((el,i)=>{ const input=el.querySelector('input'); const buttons=el.querySelectorAll('button'); buttons.forEach((b,j)=>b.onclick=()=>{ const v=Number(input.value)||Number(input.min); input.value=i ? Math.min(1000,Math.max(1.01,v+(j?.25:-.25))).toFixed(2) : Math.min(100000,Math.max(1,j?v*2:v/2)).toFixed(2); }); });
$('#target').oninput=()=>{
 const position=Number($('#target').value);
 const value=position<=700 ? 1.01+position/700*8.99 : 10*10**((position-700)/150);
 $('#prediction').value=value.toFixed(2);
 $('#target').setAttribute('aria-valuetext',value.toFixed(2)+'x');
};
$('#prediction').oninput=syncPredictionSlider;
$('#prediction').onchange=()=>{
 if($('#prediction').value && $('#prediction').validity.valid)$('#prediction').value=Number($('#prediction').value).toFixed(2);
 syncPredictionSlider();
};
$('#target').onkeydown=e=>{
 const direction={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[e.key];
 if(!direction)return;
 e.preventDefault();
 $('#prediction').value=Math.min(1000,Math.max(1.01,Number($('#prediction').value)+direction*.01)).toFixed(2);
 syncPredictionSlider();
};
let nextRound;
auto.onclick=()=>{ state.auto=!state.auto; state.remaining=0; if(!state.auto)clearTimeout(nextRound); update(); };
$('#reset').onclick=()=>{ state.balance=1245000; state.history=[]; state.payout=0; $('#history').textContent='No rounds yet.'; update(); };
document.addEventListener('keydown',e=>{ if(e.key==='Escape')$('#settingsDrawer').classList.remove('open'); if(e.code==='Space' && !['INPUT','BUTTON','SUMMARY'].includes(e.target.tagName) && !$('#settingsDrawer').classList.contains('open')){ e.preventDefault(); action.click(); } });

const mount=$('#stack-scene');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
mount.append(renderer.domElement);
const scene=new THREE.Scene();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const celebration=new THREE.Group();scene.add(celebration);
const confettiGeometry=new THREE.PlaneGeometry(.10,.18);
const confettiMaterials=[0x4cef97,0x53dcff,0xffda65,0xff8ed4,0xffffff].map(color=>new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));
const confetti=Array.from({length:120},()=>{
 const piece=new THREE.Mesh(confettiGeometry,confettiMaterials[0]);
 piece.userData.velocity=new THREE.Vector3();piece.visible=false;celebration.add(piece);return piece;
});
let celebrationAge=10, winAnimation;
function clearCelebration(){
 celebrationAge=10;celebration.visible=false;
 winAnimation?.cancel();
}
function celebrateWin(){
 clearCelebration();
 if(!state.motion||reducedMotion.matches)return;
 const tier=state.target>=25?2:state.target>=10?1:0;
 const count=[24,64,120][tier],colors=[[0,1,4],[2,4],[3,2,4]][tier];
 celebrationAge=0;celebration.visible=true;
 confetti.forEach((piece,index)=>{
  piece.visible=index<count;
  if(!piece.visible)return;
  piece.material=confettiMaterials[colors[index%colors.length]];
  const side=index%2?1:-1;
  piece.position.set(side*(1.7+Math.random()),.4+Math.random(),1+Math.random());
  piece.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0);
  piece.scale.setScalar(1);
  piece.userData.velocity.set(-side*(.4+Math.random()*1.8),4+Math.random()*3+tier*.5,(Math.random()-.5)*2);
 });
 winAnimation=message.animate([{transform:'scale(.94)',opacity:.3},{transform:'scale(1)',opacity:1}],{duration:tier?550:350,easing:'cubic-bezier(.16,1,.3,1)'});
}
function animateCelebration(dt){
 if(!celebration.visible)return;
 if(!state.motion||reducedMotion.matches||state.phase!=='won'){clearCelebration();return;}
 celebrationAge+=dt;
 if(celebrationAge>4.5){clearCelebration();return;}
 for(const piece of confetti){
  if(!piece.visible)continue;
  piece.userData.velocity.y-=dt*2.5;
  piece.position.addScaledVector(piece.userData.velocity,dt);
  piece.rotation.x+=dt*4;piece.rotation.y+=dt*2;piece.rotation.z+=dt*3;
  piece.scale.setScalar(Math.min(1,(4.5-celebrationAge)*2));
  if(piece.position.y<-.35)piece.visible=false;
 }
}
const camera=new THREE.PerspectiveCamera(38,1,.1,100);
scene.add(new THREE.HemisphereLight(0xb3edff,0x20132d,3));
const light=new THREE.DirectionalLight(0xffffff,5);light.position.set(-3,7,5);scene.add(light);
const fill=new THREE.PointLight(0xb044ff,60);fill.position.set(3,2,1);scene.add(fill);
const stack=new THREE.Group(); scene.add(stack);
const outline=new THREE.Shape();outline.moveTo(-.35,-.35);outline.lineTo(.35,-.35);outline.lineTo(.35,.35);outline.lineTo(-.35,.35);outline.closePath();
const geo=new THREE.ExtrudeGeometry(outline,{depth:.7,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.065,bevelThickness:.065});geo.center();
const edges=new THREE.EdgesGeometry(geo);
const materials=[0x13baff,0x6934eb,0xffb82e,0xd947ff,0xff3c48].map(color=>new THREE.MeshPhysicalMaterial({color,metalness:.35,roughness:.13,emissive:color,emissiveIntensity:.12,clearcoat:1,transparent:true,opacity:.94}));
const edgeMat=new THREE.LineBasicMaterial({color:0xb0efff,transparent:true,opacity:.65});
const blocks=[];
for(let row=0;row<7;row++)for(let col=0;col<7-row;col++){
 const block=new THREE.Mesh(geo,materials[col%2]);
 block.add(new THREE.LineSegments(edges,edgeMat));
 block.userData={x:(col-(6-row)/2)*.88,y:row*.86,velocity:new THREE.Vector3((random()-.5)*5,2+random()*4,(random()-.5)*4)};
 block.position.set(block.userData.x,block.userData.y,0); stack.add(block); blocks.push(block);
}
const platform=new THREE.Mesh(new THREE.CylinderGeometry(3.7,4,.25,64),new THREE.MeshStandardMaterial({color:0x17202a,metalness:.65,roughness:.3}));platform.position.y=-.59;scene.add(platform);
geo.computeBoundingBox();
const tableTop=platform.position.y+.125;
let debrisWorld=null, debrisTime=0;
function resetDebris(){
 if(debrisWorld)debrisWorld.free();
 debrisWorld=null;debrisTime=0;
 for(const block of blocks){block.userData.body=null;block.userData.collider=null;}
}
function startDebris(){
 resetDebris();
 debrisWorld=new RAPIER.World({x:0,y:-6,z:0});
 debrisWorld.timestep=1/120;
 debrisWorld.numSolverIterations=12;
 debrisWorld.createCollider(RAPIER.ColliderDesc.cuboid(4.5,.125,4.5).setTranslation(0,platform.position.y,0).setFriction(.8));
 // A segmented boundary retains the existing contained-table break effect.
 for(let i=0;i<32;i++){
  const angle=i*Math.PI/16;
  debrisWorld.createCollider(RAPIER.ColliderDesc.cuboid(.1,8,.4)
   .setTranslation(Math.cos(angle)*3.8,7,Math.sin(angle)*3.8)
   .setRotation({x:0,y:Math.sin(-angle/2),z:0,w:Math.cos(-angle/2)}));
 }
 for(const [index,block] of blocks.entries()){
  if(!block.visible)continue;
  block.scale.setScalar(1);
  const velocity=block.userData.velocity;
  const body=debrisWorld.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
   .setTranslation(block.position.x,block.position.y,block.position.z)
   .setLinvel(velocity.x,velocity.y,velocity.z)
   .setAngvel({x:(index%3+1)*.7,y:0,z:.7})
   .setLinearDamping(.5).setAngularDamping(.8).setCcdEnabled(true));
  const half=geo.boundingBox.getSize(new THREE.Vector3()).multiplyScalar(.5);
  // A small collision margin keeps solver tolerance outside the visible cube.
  block.userData.collider=debrisWorld.createCollider(RAPIER.ColliderDesc.cuboid(half.x+.02,half.y+.02,half.z+.02)
   .setFriction(.8).setRestitution(.15),body);
  block.userData.body=body;
 }
}
function animateDebris(dt){
 if(!debrisWorld)return;
 debrisTime+=dt;
 while(debrisTime>=1/120){debrisWorld.step();debrisTime-=1/120;}
 for(const block of blocks){
  const body=block.userData.body;
  if(!body)continue;
  block.position.copy(body.translation());
  block.quaternion.copy(body.rotation());
  block.userData.resting=body.isSleeping();
 }
}
const ring=new THREE.Mesh(new THREE.TorusGeometry(3.8,.022,8,100),new THREE.MeshBasicMaterial({color:0x36ccff}));ring.rotation.x=Math.PI/2;ring.position.y=-.44;scene.add(ring);
const turntable=new THREE.Group();scene.add(turntable);turntable.add(platform,ring,stack);
// Asymmetric rim inlays make rotation visible on the circular platform.
for(let i=0;i<12;i++){
 const mark=new THREE.Mesh(new THREE.BoxGeometry(i%3===0?.28:.12,.025,.07),new THREE.MeshBasicMaterial({color:i%3===0?0xffcc66:0x43bddd}));
 const angle=i*Math.PI/6;mark.position.set(Math.cos(angle)*3.55,-.447,Math.sin(angle)*3.55);mark.rotation.y=-angle;turntable.add(mark);
}
function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.set(8,6,Math.max(13,12/camera.aspect));camera.lookAt(0,1.8,0);camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(mount);resize();
let visibleCount=10;
function rebuild(count){
 resetDebris();
 visibleCount=count;
 const rows=Math.ceil((Math.sqrt(8*count+1)-1)/2);
 let index=0;
 for(let row=0;row<rows;row++)for(let col=0;col<rows-row;col++){
  const b=blocks[index++];b.userData.x=(col-(rows-row-1)/2)*.88;b.userData.y=row*.86;
 }
 blocks.forEach((b,i)=>{b.visible=i<count;b.userData.resting=false;b.position.set(b.userData.x,b.userData.y+(i===count-1&&state.motion?2:0),0);b.rotation.set(0,0,0);b.userData.velocity.set((random()-.5)*5,2+random()*4,(random()-.5)*4);});
}
function start(){
 if(state.phase==='running')return;
 clearTimeout(nextRound);
 const bet=Math.round(Number($('#bet').value)*100), target=multiplierUnits(Number($('#prediction').value))/100;
 if(!Number.isFinite(bet)||bet<100||bet>state.balance){state.auto=false;message.textContent='Enter a valid stake within your balance.';update();return;}
 if(!Number.isFinite(target)||target<1.01||target>1000){state.auto=false;message.textContent='Prediction must be between 1.01x and 1000x.';update();return;}
 if(state.auto&&!state.remaining){
  const rounds=Number($('#rounds').value),profit=Number($('#profit').value),loss=Number($('#loss').value);
  if(!Number.isInteger(rounds)||rounds<1||rounds>100||!Number.isFinite(profit)||profit<=0||!Number.isFinite(loss)||loss<=0){state.auto=false;message.textContent='Set valid autoplay rounds and limits in settings.';update();return;}
  state.remaining=rounds;state.autoStart=state.balance;state.profit=profit*100;state.loss=loss*100;
 }
 state.bet=bet;state.target=target;state.balance-=bet;state.payout=0;state.multiplier=1;
 clearCelebration();
 // Local demo outcome. Production must obtain the outcome and payout from Stake.
 state.breakAt=crashPoint(crypto.getRandomValues(new Uint32Array(1))[0]);
 state.started=performance.now();state.speed=state.turbo? .36:.14;state.phase='running';state.bonus=0;
 playMusic();
 rebuild(1);message.classList.remove('broken');message.textContent=`Prediction locked · ${target.toFixed(2)}x`;tone(300);tick(state.started);update();
}
function settle(won, at){
 if(state.phase!=='running')return;
 const effectiveUnits=multiplierUnits(state.target);
 state.phase=won?'won':'broken';state.multiplier=at;state.bonus=bonusStage(at).level;state.payout=won?payout(state.bet,effectiveUnits):0;state.balance+=state.payout;state.ended=performance.now();
 if(!won)startDebris();
 message.classList.toggle('broken',!won);
 message.textContent=won?'':`Lost · Prediction ${state.target.toFixed(2)}x · Result ${(multiplierUnits(at)/100).toFixed(2)}x`;
 if(won){
  const title=state.target>=25?'MEGA WIN':state.target>=10?'BIG WIN':'YOU WIN';
  message.innerHTML=`<span class="win-title">${title}</span><strong class="win-amount">${money(state.payout)}</strong>`;
  celebrateWin();
 }
 tone(won?750:120,.3);
 if(won&&state.target>=10){tone(1000,.45);tone(1250,.65);}
 state.history.unshift({at,target:state.target,bet:state.bet,payout:state.payout,won});state.history=state.history.slice(0,30);
 $('#history').innerHTML=state.history.map(r=>`<div class="history-row"><span>${r.won?'Win':'Loss'} · Prediction ${r.target.toFixed(2)}x · Result ${(multiplierUnits(r.at)/100).toFixed(2)}x</span><span>${money(r.bet)} → ${money(r.payout)}</span></div>`).join('');
 if(state.auto){state.remaining--;const delta=state.balance-state.autoStart;if(state.remaining<=0||delta>=state.profit||delta<=-state.loss||state.balance<state.bet){state.auto=false;}else nextRound=setTimeout(start,1800);}
 update();
}
function tick(now){
 if(state.phase!=='running')return;
 // Integrate stage speed from elapsed time so hidden-tab pauses cannot skip time.
 let seconds=Math.max(0,now-state.started-650)/1000;
 let next=1;
 for(const [ceiling,rate] of [[3,1],[7,1.35],[1000,1.75]]){
  const duration=Math.log(ceiling/next)/(state.speed*rate);
  if(seconds<duration){next*=Math.exp(seconds*state.speed*rate);break;}
  seconds-=duration;next=ceiling;
 }
 // Passing the prediction does not end the reveal or credit the balance.
 const result=resolveRound(next,state.breakAt,state.target);
 if(result){settle(result.won,result.at);return;}
 state.multiplier=next;
 const stage=bonusStage(next);
 const count=Math.min(28,1+Math.floor(Math.log(next)*6)*(stage.level>=2?2:1)+(stage.level>=1?3:0));
 if(count>visibleCount){rebuild(count);tone(300+count*24);}
 const bonus=stage.level;
 if(bonus!==state.bonus){state.bonus=bonus;tone(880,.2);}
 message.textContent=`${stage.label} · ${next>=state.target?'Prediction reached':'Prediction'} ${state.target.toFixed(2)}x`;
 update();
}
action.onclick=start;
let last=performance.now();
function animate(now){
 const dt=Math.min((now-last)/1000,.05);last=now;tick(now);
 animateCelebration(dt);
 const broken=state.phase==='broken';
 if(broken&&state.motion)animateDebris(dt);
 const palette=broken?4:state.bonus===4?2:state.bonus===3?4:state.bonus===2?3:state.bonus===1?2:-1;
 blocks.forEach((b,i)=>{
  b.visible=i<visibleCount;b.material=materials[palette<0?i%2:palette];
  if(!broken){b.position.y=THREE.MathUtils.lerp(b.position.y,b.userData.y,Math.min(1,dt*8));b.scale.setScalar(state.motion?1+Math.sin(now*.002+i)*.012:1);}
 });
 if(state.motion&&state.phase==='running')turntable.rotation.y+=dt*.32;
 $('.multiplier').style.color=broken?'#ff515c':state.phase==='won'?'#4cef97':'#e8faff';
 renderer.render(scene,camera);requestAnimationFrame(animate);
}
message.textContent='Ready to stack';rebuild(10);update();requestAnimationFrame(animate);
