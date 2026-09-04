import * as THREE from './vendor/three.module.js';
import { lightCrystalStage, crystalMaterials, crystalDetails, stageEffects } from './crystal-stage.js';
import RAPIER from './vendor/rapier.es.js';
await RAPIER.init();
import { bonusStage, crashPoint, multiplierUnits, payout, resolveRound } from './math.mjs';
import { predictionStops, predictionPosition, predictionValue, adjustPrediction } from './prediction-scale.mjs';
import { winTiming, displayedPayout, fountainParticle } from './win-timing.mjs';
import { createRecentResults } from './recent-results.js';

const $ = (s) => document.querySelector(s);
const money = (n) => (n / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const loader=$('#gameLoader');
let loaderDismissed=false;
function dismissLoader(){
 if(loaderDismissed||!loader)return;
 loaderDismissed=true;
 const logo=$('.game-loader__logo');
 const logoReady=logo?.complete?Promise.resolve():new Promise(resolve=>{
  logo?.addEventListener('load',resolve,{once:true});
  logo?.addEventListener('error',resolve,{once:true});
 });
 const fontsReady=document.fonts?.ready||Promise.resolve();
 const release=()=>{
  if(loader.classList.contains('is-splash'))return;
  loader.classList.add('is-splash');
  loader.setAttribute('aria-label','STACKS ready');
  loader.querySelector('.game-loader__status').textContent='Ready';
  loader.querySelector('[role="progressbar"]').setAttribute('aria-valuenow','100');
  setTimeout(()=>{loader.classList.add('is-logo-reveal');playSplashChime();},1000);
  setTimeout(()=>loader.classList.add('is-complete'),1700);
  setTimeout(()=>{loader.hidden=true;startIntroIfNeeded();},2300);
 };
 const fallback=setTimeout(release,4000);
 Promise.all([logoReady,fontsReady]).then(()=>{clearTimeout(fallback);release();});
}
const state = { balance: 1245000, phase: 'idle', multiplier: 1, bet: 0, auto: false, autoRound: 0, autoTotal: 0, remaining: 0, history: [], sound: true, music: true, musicVolume: .35, motion: true, turbo: false };
const steppers = document.querySelectorAll('.stepper');
steppers[0].innerHTML = '<button aria-label="Halve bet" title="Halve bet"><img src="./assets/arcade/minus.svg" alt=""></button><input id="bet" class="value" type="number" aria-label="Bet amount" min="1" step="1" value="100.00"><button aria-label="Double bet" title="Double bet"><img src="./assets/arcade/plus.svg" alt=""></button>';
steppers[1].classList.add('prediction-control');
steppers[1].innerHTML = `
 <div class="prediction-number">
  <button id="predictionDown" aria-label="Decrease prediction" title="Decrease prediction by 0.01x"><img src="./assets/arcade/minus.svg" alt=""></button>
  <label class="prediction-value"><input id="prediction" type="number" aria-label="Exact prediction multiplier" min="1.01" max="1000" step="0.01" value="2.50"><span aria-hidden="true">x</span></label>
  <button id="predictionUp" aria-label="Increase prediction" title="Increase prediction by 0.01x"><img src="./assets/arcade/plus.svg" alt=""></button>
 </div>
 <div class="prediction-track">
  <input id="target" type="range" aria-label="Prediction multiplier" min="0" max="1000" step="1">
  <div class="ruler-scale" aria-hidden="true">
   ${Array.from({length: 101}, (_, i) => `<i class="ruler-tick" style="left:${i}%"></i>`).join('')}
   ${predictionStops.map(([value, position]) => `<span class="ruler-stop" style="left:${position / 10}%"><span>${value === 1.01 ? '1x' : value + 'x'}</span></span>`).join('')}
  </div>
  <div class="live-track" aria-hidden="true"><div class="live-fill"></div><i class="live-marker"></i></div>
  <output id="live-multiplier" aria-label="Live round multiplier">Live 1.00x</output>
 </div>`;
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
action.innerHTML='<img src="./assets/arcade/play.svg" alt=""><span class="action-label">Start Stack</span>';
const auto = $('.toggle-pill');
auto.setAttribute('role', 'switch');
auto.innerHTML='<img src="./assets/arcade/autoplay.svg" alt="">';
const message = document.createElement('div');
message.className = 'round-message';
message.setAttribute('role', 'status');
const recentResults=createRecentResults($('.stage'));
function resultValues(){return state.history.slice(0,5).map(round=>multiplierUnits(round.at)/100);}
function renderRoundHistory(){
 $('#history').innerHTML=state.history.length?state.history.map(r=>`<div class="history-row"><span>${r.won?'Win':'Loss'} · Prediction ${r.target.toFixed(2)}x · Result ${(multiplierUnits(r.at)/100).toFixed(2)}x</span><span>${money(r.bet)} → ${money(r.payout)}</span></div>`).join(''):'No rounds yet.';
 recentResults.render(resultValues());
}
function reportInputError(selector,text){
 const input=$(selector);
 input.setCustomValidity(text);input.reportValidity();
 input.addEventListener('input',()=>input.setCustomValidity(''),{once:true});
}
$('.drawer-list').innerHTML = `
 <button class="drawer-row general-setting" id="sound" role="switch" aria-checked="true">Sound<span class="switch"></span></button>
 <button class="drawer-row general-setting" id="music" role="switch" aria-checked="true">Background music<span class="switch"></span></button>
 <label class="drawer-row general-setting">Music volume<input id="musicVolume" type="range" min="0" max="100" step="1" value="35" aria-label="Music volume"></label>
 <button class="drawer-row general-setting" id="motion" role="switch" aria-checked="true">Motion<span class="switch"></span></button>
 <label class="drawer-row autoplay-field autoplay-only">Autoplay rounds<input id="rounds" type="number" min="1" max="100" value="10"></label>
 <label class="drawer-row autoplay-field autoplay-only">Stop on profit<input id="profit" type="number" min="1" value="500"></label>
 <label class="drawer-row autoplay-field autoplay-only">Stop on loss<input id="loss" type="number" min="1" value="500"></label>
 <button class="autoplay-start autoplay-only" id="startAutoplay"><img src="./assets/arcade/autoplay.svg" alt=""><span>Start Autoplay</span></button>
 <details class="general-setting"><summary>Rules & stages</summary><p>Select your stake and prediction before starting. A result at or above your prediction pays your stake multiplied by that prediction, including the original stake. A lower result loses the stake. Predicting 2.50x with a 100x result pays 2.50x, and the tower continues to 100x.</p><p>Stack Bonus adds blocks, Double Stack doubles block growth, and Super Stack speeds up the tower. Legendary Stack celebrates 25x. Stages do not increase the selected payout. Maximum prediction and displayed result: 1000x.</p><p>Demo math: 96.5% theoretical return before cent rounding. Payouts round down to whole cents.</p><p>Local demo credits and browser-generated results. Stake is not connected.</p></details>
 <details class="general-setting"><summary>Round history</summary><div id="history">No rounds yet.</div></details>
 <button class="drawer-row general-setting replay-intro" id="replayIntro"><span>Replay introduction</span><img src="./assets/arcade/play.svg" alt=""></button>
 <button class="drawer-row general-setting" id="reset">Reset demo balance<span>↻</span></button>`;

let audio;
let lastGrowthAt=0,lastGrowthUnits=100;
const growthVoices=new Set();
let predictionAnimations=[];
function clearPredictionCue(){
 predictionAnimations.forEach(animation=>animation.cancel());predictionAnimations=[];
}
function predictionReached(now){
 if(state.predictionReached)return;
 state.predictionReached=true;
 if(document.hidden)return;
 if(state.motion&&!reducedMotion.matches){
  effects.pulse(0x54f5a0,true);
  predictionAnimations.push($('.prediction-number').animate([
   {transform:'scale(1)',boxShadow:'0 0 0 0 #54f5a000'},
   {transform:'scale(1.06)',boxShadow:'0 0 0 8px #54f5a035',offset:.3},
   {transform:'scale(1)',boxShadow:'0 0 0 16px #54f5a000'},
  ],{duration:650,easing:'ease-out'}));
  predictionAnimations.push($('.live-fill').animate([
   {filter:'brightness(1)'},{filter:'brightness(2)',offset:.25},{filter:'brightness(1)'},
  ],{duration:600,easing:'ease-out'}));
 }
 if(!state.sound||!audio||audio.state!=='running')return;
 stopGrowthSound();lastGrowthAt=now+400;
 for(const [index,frequency] of [659.25,880].entries()){
  const oscillator=audio.createOscillator(),gain=audio.createGain(),time=audio.currentTime+index*.12;
  oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.025,time+.008);
  gain.gain.exponentialRampToValueAtTime(.0001,time+.28);
  oscillator.connect(gain);gain.connect(audio.destination);growthVoices.add(oscillator);
  oscillator.onended=()=>{growthVoices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
  oscillator.start(time);oscillator.stop(time+.3);
 }
}
function stopGrowthSound(){
 for(const voice of growthVoices){try{voice.stop();}catch{}voice.disconnect();}
 growthVoices.clear();
}
function growthSound(multiplier,now){
 if(state.phase!=='running'||!state.sound||document.hidden||!audio||audio.state!=='running')return;
 const units=multiplierUnits(multiplier);
 const progress=Math.min(1,Math.log2(Math.max(1,multiplier))/8);
 if(units<=lastGrowthUnits||now-lastGrowthAt<450-progress*280)return;
 lastGrowthAt=now;lastGrowthUnits=units;
 // Two short bell partials make a restrained coin-counting tick, not another melody.
 const frequency=520*2**(Math.floor(progress*12)/12);
 for(const [ratio,volume,duration] of [[1,.016,.105],[2.4,.0035,.065]]){
  const oscillator=audio.createOscillator(),gain=audio.createGain(),time=audio.currentTime;
  oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency*ratio,time);
  oscillator.frequency.exponentialRampToValueAtTime(frequency*ratio*1.035,time+duration);
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.003);
  gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  oscillator.connect(gain);gain.connect(audio.destination);growthVoices.add(oscillator);
  oscillator.onended=()=>{growthVoices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
  oscillator.start(time);oscillator.stop(time+duration+.005);
 }
}
let musicTimer, musicBus, musicStarted=false, musicStep=0, nextMusicNote=0;
const musicVoices=new Set();
function musicNote(midi,when,duration,volume,type='sine',attack=.65){
 const oscillator=audio.createOscillator(), envelope=audio.createGain();
 oscillator.type=type;oscillator.frequency.value=440*2**((midi-69)/12);
 envelope.gain.setValueAtTime(0,when);
 envelope.gain.linearRampToValueAtTime(volume,when+attack);
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
 if(state.phase!=='running' || !state.music || document.hidden || musicTimer!==undefined)return;
 try {
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  audio.resume().catch(()=>{});
  musicBus=audio.createGain();musicBus.gain.value=state.musicVolume*.1;musicBus.connect(audio.destination);
  musicStep=0;
  nextMusicNote=audio.currentTime+.05;
  // Slow, soft chord swells with one sparse upper note per phrase.
  const chords=[[50,57,60,64],[48,55,59,62],[45,52,55,59],[43,50,57,60]];
  const schedule=()=>{
   if(audio.state!=='running')return;
   nextMusicNote=Math.max(nextMusicNote,audio.currentTime+.02);
   while(nextMusicNote<audio.currentTime+.18){
    const chord=chords[Math.floor(musicStep/8)%chords.length];
    if(musicStep%8===0){
     for(const note of chord)musicNote(note,nextMusicNote,5.8,.075);
    }
    if(musicStep%8===4)musicNote(chord[3]+12,nextMusicNote,2.2,.045,'sine',.08);
    musicStep=(musicStep+1)%32;nextMusicNote+=.75;
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
$('#musicVolume').oninput=()=>{
 state.musicVolume=Number($('#musicVolume').value)/100;
 if(musicBus)musicBus.gain.setTargetAtTime(state.musicVolume*.1,audio.currentTime,.05);
};
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){stopMusic();stopGrowthSound();}else if(musicStarted&&state.music)playMusic();
});
window.addEventListener('pagehide',stopMusic);
window.addEventListener('pagehide',stopGrowthSound);
function tone(frequency = 420, duration = .1) {
 if (!state.sound) return;
 try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); const o=audio.createOscillator(), g=audio.createGain(); o.frequency.value=frequency; g.gain.setValueAtTime(.035,audio.currentTime); g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration); o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime+duration); } catch {}
}
function playSplashChime(){
 if(document.hidden||!state.sound)return;
 tone(659.25,.14);
 setTimeout(()=>tone(880,.22),140);
}
for (const key of ['sound','motion']) $('#'+key).onclick = () => { state[key]=!state[key]; $('#'+key).setAttribute('aria-checked',state[key]); $('#'+key+' .switch').classList.toggle('off', !state[key]); if(key==='sound'&&!state.sound)stopGrowthSound(); if(key==='motion'&&!state.motion)clearPredictionCue(); };
$('#turbo').onclick=()=>{
 if(state.phase==='running'||state.auto)return;
 state.turbo=!state.turbo;
 update();
};
function update() {
 const winTier=state.phase==='won'?(state.target>=25?'mega':state.target>=10?'big':'regular'):'';
 $('.stage').dataset.win=winTier;
 message.classList.toggle('win-message',state.phase==='won');
 $('.balance strong').textContent=money(state.balance);
 $('.multiplier').textContent=(multiplierUnits(state.multiplier)/100).toFixed(2)+'x';
 const progress=Math.max(0,Math.min(1000,predictionPosition(state.multiplier)))/10;
 $('.prediction-track').style.setProperty('--live-progress',progress+'%');
 $('.prediction-track').dataset.phase=state.phase;
 predictionPanel.dataset.reached=Boolean(state.predictionReached);
 $('#live-multiplier').textContent=state.phase==='running'?'Live '+(multiplierUnits(state.multiplier)/100).toFixed(2)+'x':'';
 action.querySelector('.action-label').textContent=state.phase==='running'?'Revealing result':state.auto?`Autoplay ${state.autoRound}/${state.autoTotal}`:'Start Stack';
 action.disabled=state.phase==='running'||state.auto;
 const autoplayLabel=state.auto ? `Stop autoplay · round ${state.autoRound} of ${state.autoTotal}` : 'Open autoplay settings';
 auto.setAttribute('aria-label',autoplayLabel);auto.title=autoplayLabel;
 auto.disabled=state.phase==='running'&&!state.auto;
 auto.setAttribute('aria-checked',state.auto);
 auto.querySelector('img').src=state.auto?'./assets/arcade/stop.svg':'./assets/arcade/autoplay.svg';
 $('#autoplayProgress').hidden=!state.auto;
 $('#autoplayProgress').textContent=state.auto?`${state.autoRound}/${state.autoTotal}`:'';
 $('#startAutoplay').disabled=state.phase==='running'||state.auto;
 $('#replayIntro').disabled=state.phase==='running'||state.auto;
 const turbo=$('#turbo'),turboLabel=`Turbo mode ${state.turbo?'on':'off'}: faster round reveals`;
 turbo.setAttribute('aria-checked',state.turbo);turbo.setAttribute('aria-label',turboLabel);turbo.title=turboLabel;
 turbo.disabled=state.phase==='running'||state.auto;
 for(const input of document.querySelectorAll('.stepper input, .stepper button, .drawer-row input:not(#musicVolume), #reset')) input.disabled=state.phase==='running' || state.auto;
}
steppers[0].querySelectorAll('button').forEach((button, index)=>button.onclick=()=>{
 const input=$('#bet'), value=Number(input.value)||Number(input.min);
 input.value=Math.min(100000,Math.max(1,index?value*2:value/2)).toFixed(2);
});
function nudgePrediction(direction){
 $('#prediction').value=adjustPrediction(Number($('#prediction').value),direction).toFixed(2);
 $('#prediction').setCustomValidity('');
 syncPredictionSlider();
}
$('#predictionDown').onclick=()=>nudgePrediction(-1);
$('#predictionUp').onclick=()=>nudgePrediction(1);
$('#target').oninput=()=>{
 const position=Number($('#target').value);
 const value=predictionValue(position);
 $('#prediction').value=value.toFixed(2);
 $('#prediction').setCustomValidity('');
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
 nudgePrediction(direction);
};
let nextRound;
function openAutoplaySettings(){
 const drawer=$('#settingsDrawer');
 drawer.classList.add('open','autoplay-open');
 drawer.querySelector('h2').textContent='Autoplay settings';
 requestAnimationFrame(()=>$('#rounds').focus());
}
auto.onclick=()=>{
 if(!state.auto){openAutoplaySettings();return;}
 state.auto=false;state.autoRound=0;state.autoTotal=0;state.remaining=0;clearTimeout(nextRound);update();
};
$('#startAutoplay').onclick=()=>{
 state.auto=true;state.autoRound=0;state.autoTotal=0;state.remaining=0;
 $('#settingsDrawer').classList.remove('open','autoplay-open');
 update();start();
};
$('#barSettings').addEventListener('click',()=>{
 $('#settingsDrawer').classList.remove('autoplay-open');
 $('#settingsDrawer h2').textContent='Settings';
});
$('#reset').onclick=()=>{ state.balance=1245000; state.history=[]; state.payout=0; renderRoundHistory(); update(); };
document.addEventListener('keydown',e=>{ if(document.body.classList.contains('intro-active'))return; if(e.key==='Escape')$('#settingsDrawer').classList.remove('open'); if(e.code==='Space' && !['INPUT','BUTTON','SUMMARY'].includes(e.target.tagName) && !$('#settingsDrawer').classList.contains('open')){ e.preventDefault(); action.click(); } });

const mount=$('#stack-scene');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
mount.append(renderer.domElement);
const scene=new THREE.Scene();
lightCrystalStage(renderer,scene);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)clearPredictionCue();});
const celebration=new THREE.Group();scene.add(celebration);
const confettiGeometry=new THREE.IcosahedronGeometry(.105,0);
const confettiMaterials=[0xffd579,0xfff4cf,0xffffff].map(color=>new THREE.MeshStandardMaterial({color,metalness:.55,roughness:.22,emissive:color,emissiveIntensity:.15,transparent:true,depthWrite:false}));
const confetti=Array.from({length:96},()=>{
 const piece=new THREE.Mesh(confettiGeometry,confettiMaterials[0]);
 piece.userData.velocity=new THREE.Vector3();piece.visible=false;celebration.add(piece);return piece;
});
let celebrationAge=10, winAnimation, winAmountNode;
let winHeader=0;
function clearCelebration(){
 celebrationAge=10;celebration.visible=false;
 winAnimation?.cancel();
 winAnimation=undefined;
}
function celebrateWin(){
 clearCelebration();
 winAmountNode=message.querySelector('.win-amount');
 if(!state.motion||reducedMotion.matches)return;
 const {count}=winTiming(state.target);
 celebrationAge=0;celebration.visible=true;
 winAmountNode.textContent=money(0);
 effects.pulse(0xffd46b,true);
 // Emit in camera-facing pairs so both fountains remain outside the tower silhouette.
 celebration.rotation.y=Math.atan2(cameraDirection.x,cameraDirection.z);
 confettiMaterials.forEach(material=>material.opacity=1);
 confetti.forEach((piece,index)=>{
  piece.visible=index<count;
  if(!piece.visible)return;
  piece.material=confettiMaterials[index%4===0?2:index%4===1?1:0];
  const point=fountainParticle(index,0,count);
  piece.position.set(point.x,point.y,point.z);piece.scale.setScalar(0);
 });
 winAnimation=message.animate([
  {transform:'translateY(10px) scale(.94)',opacity:0},
  {transform:'translateY(-1px) scale(1.015)',opacity:1,offset:.7},
  {transform:'translateY(0) scale(1)',opacity:1},
 ],{duration:480,easing:'cubic-bezier(.16,1,.3,1)'});
}
function animateCelebration(now){
 if(state.phase!=='won')return;
 const moving=state.motion&&!reducedMotion.matches&&!document.hidden;
 const elapsed=Math.max(0,now-state.ended),timing=winTiming(state.target);
 const amount=money(displayedPayout(state.payout,elapsed,timing.countDuration,moving));
 if(winAmountNode&&winAmountNode.textContent!==amount)winAmountNode.textContent=amount;
 if(!celebration.visible)return;
 if(!moving||elapsed>=timing.duration){clearCelebration();return;}
 celebrationAge=elapsed/1000;
 confettiMaterials.forEach(material=>material.opacity=Math.min(1,(timing.duration-elapsed)/500));
 for(const [index,piece] of confetti.entries()){
  if(!piece.visible)continue;
  const point=fountainParticle(index,elapsed,timing.count);
  piece.position.set(point.x,point.y,point.z);
  piece.rotation.set(point.rotation,point.rotation*.7,point.rotation*.4);
  piece.scale.setScalar(point.y<-.3?0:point.scale);
 }
}
const camera=new THREE.PerspectiveCamera(38,1,.1,100);
scene.add(new THREE.HemisphereLight(0xb3edff,0x20132d,.8));
const light=new THREE.DirectionalLight(0xf0faff,3);light.position.set(-3,7,5);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-6;light.shadow.camera.right=6;light.shadow.camera.top=8;light.shadow.camera.bottom=-6;light.shadow.normalBias=.035;scene.add(light);
const fill=new THREE.PointLight(0x8963ff,25);fill.position.set(3,3,1);scene.add(fill);
const stack=new THREE.Group(); scene.add(stack);
const outline=new THREE.Shape();outline.moveTo(-.35,-.35);outline.lineTo(.35,-.35);outline.lineTo(.35,.35);outline.lineTo(-.35,.35);outline.closePath();
const geo=new THREE.ExtrudeGeometry(outline,{depth:.7,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.065,bevelThickness:.065});geo.center();
const edges=new THREE.EdgesGeometry(geo,18);
const materials=crystalMaterials();
const edgeMat=new THREE.LineBasicMaterial({color:0xb0efff,transparent:true,opacity:.5,toneMapped:false});
const blocks=[];
for(let row=0;row<7;row++)for(let col=0;col<7-row;col++){
 const block=new THREE.Mesh(geo,materials[col%2]);
 block.add(new THREE.LineSegments(edges,edgeMat));
 block.userData={x:(col-(6-row)/2)*.88,y:row*.86,velocity:new THREE.Vector3((random()-.5)*5,2+random()*4,(random()-.5)*4)};
 block.castShadow=true;block.receiveShadow=true;crystalDetails(block,blocks.length);
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
  // Finish layout placement before handing blocks to the collision solver.
  block.position.set(block.userData.x,block.userData.y,0);
  block.rotation.set(0,0,0);
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
platform.receiveShadow=true;
const effects=stageEffects(scene,turntable);
// Asymmetric rim inlays make rotation visible on the circular platform.
for(let i=0;i<12;i++){
 const mark=new THREE.Mesh(new THREE.BoxGeometry(i%3===0?.28:.12,.025,.07),new THREE.MeshBasicMaterial({color:i%3===0?0xffcc66:0x43bddd}));
 const angle=i*Math.PI/6;mark.position.set(Math.cos(angle)*3.55,-.447,Math.sin(angle)*3.55);mark.rotation.y=-angle;turntable.add(mark);
}
function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(mount);resize();
let visibleCount=10;
let cameraHeight=3.5;
const cameraDirection=new THREE.Vector3(4,3.2,9).normalize();
function rebuild(count){
 resetDebris();
 const previousCount=visibleCount;
 visibleCount=count;
 const rows=Math.ceil((Math.sqrt(8*count+1)-1)/2);
 let index=0;
 for(let row=0;row<rows;row++)for(let col=0;col<rows-row;col++){
  const b=blocks[index++];b.userData.x=(col-(rows-row-1)/2)*.88;b.userData.y=row*.86;
 }
 blocks.forEach((b,i)=>{
  const fresh=count<=previousCount||i>=previousCount;
  b.visible=i<count;b.userData.resting=false;b.userData.crack.material.opacity=0;
  b.userData.landingAge=fresh?-.06*Math.max(0,i-previousCount):1;
  if(fresh)b.position.set(b.userData.x,b.userData.y+(state.motion&&!reducedMotion.matches?1.8:0),0);
  b.rotation.set(0,0,0);b.scale.setScalar(1);b.userData.velocity.set((random()-.5)*5,2+random()*4,(random()-.5)*4);
 });
}
const INTRO_STORAGE_KEY='stacks:intro-seen:v1';
const introFlow=$('#introFlow');
let introStep=1;
function hasSeenIntro(){
 try{return localStorage.getItem(INTRO_STORAGE_KEY)==='1';}catch{return false;}
}
function rememberIntro(){
 try{localStorage.setItem(INTRO_STORAGE_KEY,'1');}catch{}
}
function introMath(){
 const stake=Math.max(1,Number($('#bet').value)||100);
 const target=Math.min(1000,Math.max(1.01,Number($('#prediction').value)||2.5));
 const possible=payout(Math.round(stake*100),multiplierUnits(target));
 $('#introPossibleWin').textContent=money(possible);
 $('#introTargetLabel').textContent=target.toFixed(2)+'x';
 $('#introEquation').textContent=`${stake.toFixed(2)} x ${target.toFixed(2)} = ${money(possible)}`;
 return {target};
}
function setIntroStep(step){
 introStep=Math.min(4,Math.max(1,step));
 document.body.classList.remove('intro-step-1','intro-step-2','intro-step-3','intro-step-4');
 document.body.classList.add(`intro-step-${introStep}`);
 introFlow.querySelectorAll('[data-intro-screen]').forEach(screen=>{screen.hidden=Number(screen.dataset.introScreen)!==introStep;});
 introFlow.querySelectorAll('.intro-progress i').forEach((dot,index)=>dot.classList.toggle('active',index===introStep-1));
 $('#introProgressText').textContent=`Step ${introStep} of 4`;
 introFlow.setAttribute('aria-label',`STACKS introduction, step ${introStep} of 4`);
 clearCelebration();resetDebris();state.phase='idle';state.predictionReached=false;
 const {target}=introMath();
 if(introStep===4){state.multiplier=25;state.bonus=4;rebuild(28);}
 else if(introStep===3){state.multiplier=target;state.bonus=bonusStage(target).level;rebuild(15);}
 else {state.multiplier=1;state.bonus=0;rebuild(10);}
 update();
 requestAnimationFrame(()=>introFlow.querySelector('[data-intro-screen]:not([hidden]) .intro-primary')?.focus());
}
function showIntro(){
 if(state.phase==='running'||state.auto)return;
 $('#settingsDrawer').classList.remove('open','autoplay-open');
 introFlow.hidden=false;
 document.body.classList.add('intro-active');
 $('.app').inert=true;
 setIntroStep(1);
}
function closeIntro(){
 rememberIntro();
 introFlow.hidden=true;
 document.body.classList.remove('intro-active','intro-step-1','intro-step-2','intro-step-3','intro-step-4');
 $('.app').inert=false;
 state.phase='idle';state.multiplier=1;state.bonus=0;state.predictionReached=false;
 clearCelebration();rebuild(10);update();action.focus();tone(720,.12);
}
function startIntroIfNeeded(){
 const forced=new URLSearchParams(location.search).get('intro')==='1';
 if(forced||!hasSeenIntro())showIntro();
}
introFlow.querySelectorAll('[data-intro-next]').forEach(button=>button.onclick=()=>{
 if(introStep===1){tone(659.25,.12);setTimeout(()=>tone(880,.16),100);}
 setIntroStep(introStep+1);
});
$('#skipIntro').onclick=closeIntro;
$('#finishIntro').onclick=closeIntro;
$('#replayIntro').onclick=showIntro;
document.addEventListener('keydown',event=>{
 if(!document.body.classList.contains('intro-active'))return;
 if(event.key==='Escape'){event.preventDefault();closeIntro();return;}
 if((event.key==='Enter'||event.code==='Space')&&event.target.tagName!=='BUTTON'){
  event.preventDefault();
  introFlow.querySelector('[data-intro-screen]:not([hidden]) .intro-primary')?.click();
 }
});
function start(){
 if(state.phase==='running')return;
 $('#settingsDrawer').classList.remove('open','autoplay-open');
 clearTimeout(nextRound);
 const bet=Math.round(Number($('#bet').value)*100), target=multiplierUnits(Number($('#prediction').value))/100;
 if(!Number.isFinite(bet)||bet<100||bet>state.balance){state.auto=false;update();reportInputError('#bet','Enter a valid stake within your balance.');return;}
 if(!Number.isFinite(target)||target<1.01||target>1000){state.auto=false;update();reportInputError('#prediction','Prediction must be between 1.01x and 1000x.');return;}
 if(state.auto&&!state.remaining){
  const rounds=Number($('#rounds').value),profit=Number($('#profit').value),loss=Number($('#loss').value);
  if(!Number.isInteger(rounds)||rounds<1||rounds>100||!Number.isFinite(profit)||profit<=0||!Number.isFinite(loss)||loss<=0){state.auto=false;update();$('#settingsDrawer').classList.add('open');reportInputError('#rounds','Set valid autoplay rounds and limits.');return;}
  state.remaining=rounds;state.autoTotal=rounds;state.autoStart=state.balance;state.profit=profit*100;state.loss=loss*100;
 }
 if(state.auto)state.autoRound=state.autoTotal-state.remaining+1;
 state.bet=bet;state.target=target;state.balance-=bet;state.payout=0;state.multiplier=1;
 clearCelebration();
 // Local demo outcome. Production must obtain the outcome and payout from Stake.
 state.breakAt=crashPoint(crypto.getRandomValues(new Uint32Array(1))[0]);
 state.started=performance.now();state.speed=state.turbo? .36:.14;state.phase='running';state.bonus=0;
 clearPredictionCue();state.predictionReached=false;
 stopGrowthSound();lastGrowthAt=state.started;lastGrowthUnits=100;
 playMusic();
 message.remove();rebuild(1);message.classList.remove('broken');tone(300);tick(state.started);update();
}
function settle(won, at){
 if(state.phase!=='running')return;
 stopMusic();
 stopGrowthSound();
 clearPredictionCue();state.predictionReached=won;
 const effectiveUnits=multiplierUnits(state.target);
 state.phase=won?'won':'broken';state.multiplier=at;state.bonus=bonusStage(at).level;state.payout=won?payout(state.bet,effectiveUnits):0;state.balance+=state.payout;state.ended=performance.now();
 if(!won){state.breakDelay=0;if(!state.motion||reducedMotion.matches)startDebris();}
 message.classList.toggle('broken',!won);
 message.textContent='';
 if(won){
  const title=state.target>=25?'MEGA WIN':state.target>=10?'BIG WIN':'YOU WIN';
  message.classList.toggle('long-payout',money(state.payout).length>12);
  message.innerHTML=`<span class="win-title" aria-hidden="true">${title}</span><strong class="win-amount" aria-hidden="true">${money(state.payout)}</strong><span class="win-announcement">${title}. Payout ${money(state.payout)}.</span>`;
  $('.stage').append(message);
  celebrateWin();
 }
 tone(won?750:120,.3);
 if(won&&state.target>=10){tone(1000,.45);tone(1250,.65);}
 state.history.unshift({at,target:state.target,bet:state.bet,payout:state.payout,won});state.history=state.history.slice(0,30);
 renderRoundHistory();
 if(state.auto){state.remaining--;const delta=state.balance-state.autoStart;if(state.remaining<=0||delta>=state.profit||delta<=-state.loss||state.balance<state.bet){state.auto=false;state.autoRound=0;state.autoTotal=0;}else nextRound=setTimeout(start,won?winTiming(state.target).duration+400:1800);}
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
 if(next>=state.target)predictionReached(now);
 growthSound(next,now);
 const stage=bonusStage(next);
 const count=Math.min(28,1+Math.floor(Math.log(next)*6)*(stage.level>=2?2:1)+(stage.level>=1?3:0));
 if(count>visibleCount){rebuild(count);tone(300+count*24);}
 const bonus=stage.level;
 if(bonus!==state.bonus){state.bonus=bonus;effects.pulse([0x66eaff,0xffc750,0xbc69ff,0xff6045,0xffe59b][bonus],true);tone(880,.2);}
 update();
}
action.onclick=start;
let last=performance.now();
function animate(now){
 const dt=Math.min((now-last)/1000,.05);last=now;tick(now);
 animateCelebration(now);
 const broken=state.phase==='broken';
 const moving=state.motion&&!reducedMotion.matches;
 if(broken&&moving){state.breakDelay=(state.breakDelay||0)+dt;if(state.breakDelay>=.22&&!debrisWorld)startDebris();if(debrisWorld)animateDebris(dt);}
 const palette=broken?4:state.phase==='won'?2:state.bonus===4?2:state.bonus===3?4:state.bonus===2?3:state.bonus===1?2:-1;
 blocks.forEach((b,i)=>{
  b.visible=i<visibleCount;b.material=materials[palette<0?i%2:palette];
  const core=b.userData.core,crack=b.userData.crack;
  core.material.color.copy(b.material.color);core.material.emissive.copy(b.material.color);
  if(moving)core.rotation.y+=dt*.3;
  crack.material.opacity=broken?Math.max(0,1-(state.breakDelay||0)/1.4):0;
  core.material.opacity=broken?Math.max(.08,.6-(state.breakDelay||0)*.22):.6;
  const winLight=state.phase==='won'&&moving?Math.max(0,1-Math.abs((now-state.ended)/1000-b.userData.y*.08-.25)/.25):0;
  core.material.emissiveIntensity=broken?Math.max(.01,.32-(state.breakDelay||0)*.15):.32+winLight*.5;
  b.material.emissiveIntensity=broken?Math.max(.015,.1-(state.breakDelay||0)*.04):.1;
  if(!broken){
   const oldAge=b.userData.landingAge;b.userData.landingAge+=dt;
   const t=Math.max(0,b.userData.landingAge);
   let offset=t<.36?1.8*(1-(t/.36)**2):t<.66?Math.sin((t-.36)/.3*Math.PI)*.14:0;
   b.position.y=b.userData.y+(moving?offset:0);
   b.position.x=moving?THREE.MathUtils.lerp(b.position.x,b.userData.x,Math.min(1,dt*12)):b.userData.x;
   if(b.visible&&moving&&oldAge<.36&&t>=.36)effects.pulse(b.material.color);
   b.scale.setScalar(1);
  }
 });
 if(moving&&(state.phase==='running'||document.body.classList.contains('intro-active')))turntable.rotation.y+=dt*(state.phase==='running'?.22:.12);
 const desiredHeight=Math.ceil((Math.sqrt(8*visibleCount+1)-1)/2)*.86;
 cameraHeight=moving?THREE.MathUtils.lerp(cameraHeight,desiredHeight,Math.min(1,dt*2)):desiredHeight;
 const headerTarget=state.phase==='won'?Math.min(mount.clientHeight*.3,mount.clientWidth<700?92:126):0;
 winHeader=moving?THREE.MathUtils.lerp(winHeader,headerTarget,Math.min(1,dt*10)):headerTarget;
 const renderHeight=Math.max(1,mount.clientHeight-winHeader);
 camera.aspect=mount.clientWidth/renderHeight;camera.updateProjectionMatrix();
 renderer.setViewport(0,0,mount.clientWidth,renderHeight);
 const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
 const aim=new THREE.Vector3(0,cameraHeight*(state.phase==='won'?.28:.36),0);
 const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),cameraDirection).normalize();
 const up=new THREE.Vector3().crossVectors(cameraDirection,right);
 let distance=8.4;
 // Fit both the rotating platform and tower inside the clear region of the arena.
 const bounds=[];
 for(let i=0;i<12;i++)bounds.push(new THREE.Vector3(Math.cos(i*Math.PI/6)*4,-.8,Math.sin(i*Math.PI/6)*4));
 if(state.phase==='won'){
  for(const block of blocks.filter(block=>block.visible))for(const x of [-.44,.44])for(const y of [-.44,.44])for(const z of [-.44,.44])bounds.push(block.position.clone().add(new THREE.Vector3(x,y,z)));
  for(const x of [-4.5,4.5])bounds.push(right.clone().multiplyScalar(x).add(new THREE.Vector3(0,5.1,0)));
 }else for(const x of [-3.2,3.2])for(const z of [-.6,.6])bounds.push(new THREE.Vector3(x,Math.max(cameraHeight,desiredHeight)+.6,z));
 for(const point of bounds){point.sub(aim);distance=Math.max(distance,Math.abs(point.dot(up))/(tan*(state.phase==='won'?.92:.78))+point.dot(cameraDirection),Math.abs(point.dot(right))/(tan*camera.aspect*.9)+point.dot(cameraDirection));}
 camera.position.copy(cameraDirection).multiplyScalar(distance).add(aim);camera.lookAt(aim);
 const stageColor=state.phase==='won'?0xffd579:[0x66eaff,0xffc750,0xbc69ff,0xff6045,0xffe59b][state.bonus||0];
 ring.material.color.lerp(new THREE.Color(broken?0xff515c:stageColor),Math.min(1,dt*4));
 effects.update(dt,moving,broken?0xff515c:stageColor,state.bonus,cameraHeight,state.phase==='running');
 $('.multiplier').style.color=broken?'#ff515c':state.phase==='won'?'#4cef97':'#e8faff';
 renderer.render(scene,camera);dismissLoader();requestAnimationFrame(animate);
}
renderRoundHistory();rebuild(10);update();requestAnimationFrame(animate);
