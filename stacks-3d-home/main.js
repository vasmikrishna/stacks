import * as THREE from './vendor/three.module.js';
import { lightCrystalStage, crystalMaterials, crystalDetails, stageEffects } from './crystal-stage.js?v=5';
import RAPIER from './vendor/rapier.es.js';
await RAPIER.init();
import { bonusStage, crashPoint, multiplierUnits, payout, resolveRound } from './math.mjs';
import { predictionStops, predictionPosition, predictionValue, adjustPrediction } from './prediction-scale.mjs';
import { winTier, winTiming, displayedPayout, fountainParticle } from './win-timing.mjs?v=2';
import { createRecentResults } from './recent-results.js';
import { createReplaySnapshot, seededUnit } from './replay.mjs';
import { growthCue, landingCue, musicEvent } from './audio-design.mjs';

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
const state = { balance: 1245000, phase: 'idle', multiplier: 1, bet: 0, auto: false, autoRound: 0, autoTotal: 0, remaining: 0, history: [], nextRoundId: 1, replay: null, replayRestore: null, visualSeed: 0, bonusTransitions: [], sound: true, music: true, musicVolume: .35, motion: true, turbo: false };
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
const replayStatus=document.createElement('div');
replayStatus.className='replay-status';replayStatus.hidden=true;
replayStatus.innerHTML='<strong></strong><span>Historical replay · no wager</span>';
$('.stage').append(replayStatus);
const recentResults=createRecentResults($('.stage'));
const gameInfoDialog=$('#gameInfoDialog');
const infoPanels={
 'how-to':$('#howToPanel'),
 bonus:$('#bonusPanel'),
 history:$('#historyPanel'),
};
let activeInfoPanel='how-to',gameInfoOrigin=null;
function resultValues(){return state.history.slice(0,5).map(round=>round.resultUnits/100);}
function renderDialogHistory(){
 const rows=$('#dialogHistoryRows'),empty=$('#dialogHistoryEmpty');
 rows.innerHTML=state.history.map((round)=>{
  const result=round.resultUnits/100;
  return `<tr>
   <td>#${round.roundId}</td>
   <td>${(round.targetUnits/100).toFixed(2)}x</td>
   <td class="result-${result>=10?'legendary':round.won?'win':'loss'}">${result.toFixed(2)}x</td>
   <td>${money(round.betCents)}</td>
   <td>${money(round.payoutCents)}</td>
   <td><span class="history-status ${round.won?'is-win':'is-loss'}">${round.won?'Win':'Loss'}</span></td>
   <td><button class="history-replay" data-replay-round="${round.roundId}" aria-label="Replay round ${round.roundId}" title="Replay round ${round.roundId}" ${state.phase==='running'||state.auto||state.replay?'disabled':''}><img src="./assets/arcade/play.svg" alt=""></button></td>
  </tr>`;
 }).join('');
 empty.hidden=state.history.length>0;
 $('.history-table').hidden=!state.history.length;
}
$('#dialogHistoryRows').addEventListener('click',event=>{
 const button=event.target.closest('[data-replay-round]');
 if(!button)return;
 const round=state.history.find(item=>item.roundId===Number(button.dataset.replayRound));
 if(round)startReplay(round);
});
function renderRoundHistory(){
 renderDialogHistory();
 recentResults.render(resultValues());
}
function updateRulesMath(){
 const stake=Math.max(1,Number($('#bet').value)||100);
 const target=Math.min(1000,Math.max(1.01,Number($('#prediction').value)||2.5));
 const targetLabel=target.toFixed(2)+'x';
 for(const selector of ['#rulesTargetLabel','#rulesWinTarget','#rulesLossTarget'])$(selector).textContent=targetLabel;
 $('#rulesWinValue').textContent=money(payout(Math.round(stake*100),multiplierUnits(target)));
 $('#rulesLossValue').textContent=stake.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function selectInfoPanel(name,focus=false){
 activeInfoPanel=infoPanels[name]?name:'how-to';
 for(const [panelName,panel] of Object.entries(infoPanels))panel.hidden=panelName!==activeInfoPanel;
 document.querySelectorAll('[data-info-panel]').forEach(tab=>{
  const selected=tab.dataset.infoPanel===activeInfoPanel;
  tab.setAttribute('aria-selected',selected);tab.tabIndex=selected?0:-1;
  if(selected&&focus)tab.focus();
 });
 const titles={'how-to':'How to play',bonus:'Bonus modes',history:'Round history'};
 $('#gameInfoTitle').textContent=titles[activeInfoPanel];
 updateRulesMath();
 if(activeInfoPanel==='how-to')requestAnimationFrame(()=>{ensureRulesScene();resizeRulesScene();});
}
function openGameInfo(name,origin){
 gameInfoOrigin=origin||document.activeElement;
 selectInfoPanel(name);
 if(!gameInfoDialog.open)gameInfoDialog.showModal();
 requestAnimationFrame(()=>document.querySelector(`[data-info-panel="${activeInfoPanel}"]`)?.focus());
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
 <button class="drawer-row general-setting info-dialog-link" id="openRules"><span>How to play</span><img src="./assets/arcade/play.svg" alt=""></button>
 <button class="drawer-row general-setting info-dialog-link" id="openHistory"><span>Round history</span><img src="./assets/arcade/play.svg" alt=""></button>
 <button class="drawer-row general-setting replay-intro" id="replayIntro"><span>Replay introduction</span><img src="./assets/arcade/play.svg" alt=""></button>
 <button class="drawer-row general-setting" id="reset">Reset demo balance<span>↻</span></button>`;

$('#openRules').onclick=event=>openGameInfo('how-to',event.currentTarget);
$('#openHistory').onclick=event=>openGameInfo('history',event.currentTarget);
$('#closeGameInfo').onclick=()=>gameInfoDialog.close();
$('#doneGameInfo').onclick=()=>gameInfoDialog.close();
document.querySelectorAll('[data-info-panel]').forEach(tab=>{
 tab.onclick=()=>selectInfoPanel(tab.dataset.infoPanel);
 tab.onkeydown=event=>{
  if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();
  const tabs=[...document.querySelectorAll('[data-info-panel]')],index=tabs.indexOf(tab);
  const next=tabs[(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];
  selectInfoPanel(next.dataset.infoPanel,true);
 };
});
gameInfoDialog.addEventListener('click',event=>{if(event.target===gameInfoDialog)gameInfoDialog.close();});
gameInfoDialog.addEventListener('close',()=>gameInfoOrigin?.focus());

let audio;
let lastGrowthAt=0,lastGrowthUnits=100,growthTick=0;
const growthVoices=new Set();
let moneyCoinBuffer;
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
 stopGrowthSound();lastGrowthAt=now;
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
function coinBuffer(){
 if(moneyCoinBuffer)return moneyCoinBuffer;
 const duration=.11,length=Math.ceil(audio.sampleRate*duration);
 moneyCoinBuffer=audio.createBuffer(1,length,audio.sampleRate);
 const channel=moneyCoinBuffer.getChannelData(0);
 for(let index=0;index<length;index++){
  const time=index/audio.sampleRate,attack=Math.min(1,time/.0015),ring=Math.exp(-time*34),strike=Math.exp(-time*125);
  const metal=Math.sin(Math.PI*2*1780*time)*.54+Math.sin(Math.PI*2*2637*time)*.31+Math.sin(Math.PI*2*4210*time)*.12;
  channel[index]=attack*(metal*ring+(Math.random()*2-1)*strike*.09);
 }
 return moneyCoinBuffer;
}
function fallingCoin(time,playbackRate,pan,volume){
 const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
 const panner=audio.createStereoPanner?.();
 source.buffer=coinBuffer();source.playbackRate.setValueAtTime(playbackRate,time);
 filter.type='highpass';filter.frequency.value=1050;filter.Q.value=.7;
 gain.gain.setValueAtTime(volume,time);gain.gain.exponentialRampToValueAtTime(.0001,time+.095);
 source.connect(filter);
 if(panner){filter.connect(panner);panner.pan.value=pan;panner.connect(gain);}else filter.connect(gain);
 gain.connect(audio.destination);growthVoices.add(source);
 source.onended=()=>{growthVoices.delete(source);source.disconnect();filter.disconnect();panner?.disconnect();gain.disconnect();};
 source.start(time);source.stop(time+.12);
}
function growthSound(multiplier,now){
 if(state.phase!=='running'||!state.sound||document.hidden||!audio||audio.state!=='running')return;
 const units=multiplierUnits(multiplier);
 const cue=growthCue(multiplier,growthTick);
 if(units<=lastGrowthUnits||now-lastGrowthAt<cue.intervalMs)return;
 lastGrowthAt=now;lastGrowthUnits=units;
 growthTick++;
 // Each cadence emits a short stereo shower, so several separate coins strike in sequence.
 const rates=[1,.91,1.08,.97],start=audio.currentTime;
 for(let index=0;index<cue.coinCount;index++){
  const pan=cue.coinCount===1?0:-.48+index/(cue.coinCount-1)*.96;
  const rate=cue.playbackRate*cue.pitchOffset*rates[(growthTick+index)%rates.length];
  fallingCoin(start+index*cue.spreadMs/1000,rate,pan,cue.volume*(cue.accent&&index===0?1.12:.82+index*.05));
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
function musicKick(when,stage){
 const oscillator=audio.createOscillator(),envelope=audio.createGain();
 oscillator.type='sine';oscillator.frequency.setValueAtTime(94+stage*7,when);oscillator.frequency.exponentialRampToValueAtTime(42,when+.16);
 envelope.gain.setValueAtTime(.0001,when);envelope.gain.exponentialRampToValueAtTime(.16+stage*.012,when+.008);envelope.gain.exponentialRampToValueAtTime(.0001,when+.19);
 oscillator.connect(envelope);envelope.connect(musicBus);musicVoices.add(oscillator);
 oscillator.onended=()=>{musicVoices.delete(oscillator);oscillator.disconnect();envelope.disconnect();};
 oscillator.start(when);oscillator.stop(when+.21);
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
  musicBus=audio.createGain();musicBus.gain.value=state.musicVolume*.18;musicBus.connect(audio.destination);
  musicStep=0;
  nextMusicNote=audio.currentTime+.05;
  const schedule=()=>{
   if(audio.state!=='running')return;
   nextMusicNote=Math.max(nextMusicNote,audio.currentTime+.02);
   while(nextMusicNote<audio.currentTime+.22){
    const event=musicEvent(musicStep,state.multiplier);
    if(event.pad)for(const note of event.chord)musicNote(note,nextMusicNote,event.stepSeconds*7.5,.055+event.stage*.003,'sine',.18);
    if(event.bass)musicNote(event.chord[0]-12,nextMusicNote,event.stepSeconds*1.7,.13,'triangle',.012);
    musicNote(event.arpMidi,nextMusicNote,event.stepSeconds*.72,.07+event.stage*.006,event.stage>=2?'triangle':'sine',.008);
    if(event.sparkle)musicNote(event.arpMidi+7,nextMusicNote+.02,event.stepSeconds*.42,.027,'sine',.006);
    if(event.kick)musicKick(nextMusicNote,event.stage);
    musicStep=(musicStep+1)%32;nextMusicNote+=event.stepSeconds;
   }
  };
  schedule();musicTimer=setInterval(schedule,75);
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
 if(musicBus)musicBus.gain.setTargetAtTime(state.musicVolume*.18,audio.currentTime,.05);
};
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){stopMusic();stopGrowthSound();stopLandingSounds();stopWinSound();}else if(musicStarted&&state.music)playMusic();
});
window.addEventListener('pagehide',stopMusic);
window.addEventListener('pagehide',stopGrowthSound);
window.addEventListener('pagehide',stopLandingSounds);
function tone(frequency = 420, duration = .1) {
 if (!state.sound) return;
 try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); const o=audio.createOscillator(), g=audio.createGain(); o.frequency.value=frequency; g.gain.setValueAtTime(.035,audio.currentTime); g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration); o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime+duration); } catch {}
}
function playSplashChime(){
 if(document.hidden||!state.sound)return;
 tone(659.25,.14);
 setTimeout(()=>tone(880,.22),140);
}
const winSoundVoices=new Set();
const landingVoices=new Set();
function stopLandingSounds(){
 for(const voice of landingVoices){try{voice.stop();}catch{}voice.disconnect();}
 landingVoices.clear();
}
function blockLandingSound(index,multiplier){
 if(!state.sound||state.phase!=='running'||document.hidden||!audio||audio.state!=='running')return;
 const cue=landingCue(index,multiplier),time=audio.currentTime;
 for(const [type,start,finish,volume,duration] of [
  ['triangle',cue.bodyFrequency,cue.bodyFrequency*.58,cue.volume,.13],
  ['sine',cue.crystalFrequency,cue.crystalFrequency*1.08,cue.volume*.42,.085],
 ]){
  const oscillator=audio.createOscillator(),gain=audio.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(start,time);oscillator.frequency.exponentialRampToValueAtTime(finish,time+duration);
  gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(volume,time+.004);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  oscillator.connect(gain);gain.connect(audio.destination);landingVoices.add(oscillator);
  oscillator.onended=()=>{landingVoices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
  oscillator.start(time);oscillator.stop(time+duration+.01);
 }
}
function stopWinSound(){
 for(const voice of winSoundVoices){try{voice.stop();}catch{}voice.disconnect();}
 winSoundVoices.clear();
}
function winSoundNote(midi,delay,duration,volume,type='sine',finish=midi){
 const oscillator=audio.createOscillator(),gain=audio.createGain(),start=audio.currentTime+delay;
 oscillator.type=type;
 oscillator.frequency.setValueAtTime(440*2**((midi-69)/12),start);
 oscillator.frequency.exponentialRampToValueAtTime(440*2**((finish-69)/12),start+duration);
 gain.gain.setValueAtTime(.0001,start);
 gain.gain.exponentialRampToValueAtTime(volume,start+.018);
 gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
 oscillator.connect(gain);gain.connect(audio.destination);winSoundVoices.add(oscillator);
 oscillator.onended=()=>{winSoundVoices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
 oscillator.start(start);oscillator.stop(start+duration+.02);
}
function playWinSound(target){
 if(!state.sound||document.hidden)return;
 try{
  audio ||= new (window.AudioContext || window.webkitAudioContext)();
  audio.resume().catch(()=>{});stopWinSound();
  const {level}=winTier(target);
  const profiles=[
   [[76,0,.22,.026,'sine'],[83,.09,.3,.018,'sine']],
   [[72,0,.3,.026,'sine'],[79,.11,.38,.025,'triangle'],[84,.23,.48,.018,'sine']],
   [[60,0,.34,.02,'triangle'],[72,.04,.34,.025,'sine'],[76,.15,.4,.024,'sine'],[79,.27,.52,.021,'triangle']],
   [[48,0,.5,.026,'triangle',55],[67,.07,.42,.025,'triangle'],[74,.2,.46,.025,'sine'],[79,.34,.55,.023,'sine'],[86,.48,.68,.018,'sine']],
   [[43,0,.72,.032,'triangle',50],[67,.08,.65,.025,'triangle'],[72,.08,.7,.026,'triangle'],[76,.2,.75,.025,'sine'],[79,.35,.82,.024,'sine'],[84,.52,.95,.02,'sine'],[91,.7,1.05,.016,'sine']],
  ];
  for(const note of profiles[level])winSoundNote(...note);
 }catch{stopWinSound();}
}
window.addEventListener('pagehide',stopWinSound);
for (const key of ['sound','motion']) $('#'+key).onclick = () => { state[key]=!state[key]; $('#'+key).setAttribute('aria-checked',state[key]); $('#'+key+' .switch').classList.toggle('off', !state[key]); if(key==='sound'&&!state.sound){stopGrowthSound();stopLandingSounds();stopWinSound();} if(key==='motion'&&!state.motion)clearPredictionCue(); };
$('#turbo').onclick=()=>{
 if(state.phase==='running'||state.auto)return;
 state.turbo=!state.turbo;
 update();
};
function update() {
 const tier=state.phase==='won'?winTier(state.target):null;
 $('.stage').dataset.win=tier?.id||'';
 message.classList.toggle('win-message',state.phase==='won');
 $('.balance strong').textContent=money(state.balance);
 $('.multiplier').textContent=(multiplierUnits(state.multiplier)/100).toFixed(2)+'x';
 const progress=Math.max(0,Math.min(1000,predictionPosition(state.multiplier)))/10;
 $('.prediction-track').style.setProperty('--live-progress',progress+'%');
 $('.prediction-track').dataset.phase=state.phase;
 predictionPanel.dataset.reached=Boolean(state.predictionReached);
 $('#live-multiplier').textContent=state.phase==='running'?'Live '+(multiplierUnits(state.multiplier)/100).toFixed(2)+'x':'';
 action.querySelector('.action-label').textContent=state.replay?(state.phase==='running'?'Stop Replay':'Exit Replay'):state.phase==='running'?'Revealing result':state.auto?`Autoplay ${state.autoRound}/${state.autoTotal}`:'Start Stack';
 action.querySelector('img').src=state.replay?'./assets/arcade/stop.svg':'./assets/arcade/play.svg';
 action.disabled=!state.replay&&(state.phase==='running'||state.auto);
 const autoplayLabel=state.auto ? `Stop autoplay · round ${state.autoRound} of ${state.autoTotal}` : 'Open autoplay settings';
 auto.setAttribute('aria-label',autoplayLabel);auto.title=autoplayLabel;
 auto.disabled=Boolean(state.replay)||(state.phase==='running'&&!state.auto);
 auto.setAttribute('aria-checked',state.auto);
 auto.querySelector('img').src=state.auto?'./assets/arcade/stop.svg':'./assets/arcade/autoplay.svg';
 $('#autoplayProgress').hidden=!state.auto;
 $('#autoplayProgress').textContent=state.auto?`${state.autoRound}/${state.autoTotal}`:'';
 $('#startAutoplay').disabled=state.phase==='running'||state.auto||Boolean(state.replay);
 $('#replayIntro').disabled=state.phase==='running'||state.auto||Boolean(state.replay);
 const turbo=$('#turbo'),turboLabel=`Turbo mode ${state.turbo?'on':'off'}: faster round reveals`;
 turbo.setAttribute('aria-checked',state.turbo);turbo.setAttribute('aria-label',turboLabel);turbo.title=turboLabel;
 turbo.disabled=state.phase==='running'||state.auto||Boolean(state.replay);
 for(const input of document.querySelectorAll('.stepper input, .stepper button, .drawer-row input:not(#musicVolume), #reset')) input.disabled=state.phase==='running' || state.auto || Boolean(state.replay);
 replayStatus.hidden=!state.replay;
 if(state.replay)replayStatus.querySelector('strong').textContent=`Replay · Round #${state.replay.roundId}`;
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
$('#reset').onclick=()=>{ state.balance=1245000; state.history=[]; state.nextRoundId=1; state.payout=0; renderRoundHistory(); update(); };
document.addEventListener('keydown',e=>{ if(document.body.classList.contains('intro-active')||gameInfoDialog.open)return; if(e.key==='Escape')$('#settingsDrawer').classList.remove('open'); if(e.code==='Space' && !['INPUT','BUTTON','SUMMARY'].includes(e.target.tagName) && !$('#settingsDrawer').classList.contains('open')){ e.preventDefault(); action.click(); } });

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
const confettiMaterials=[0x80f7b6,0x6ce8ff,0xffd579,0xfff4cf,0xffffff].map(color=>new THREE.MeshStandardMaterial({color,metalness:.55,roughness:.22,emissive:color,emissiveIntensity:.15,transparent:true,depthWrite:false}));
const confetti=Array.from({length:96},()=>{
 const piece=new THREE.Mesh(confettiGeometry,confettiMaterials[0]);
 piece.userData.velocity=new THREE.Vector3();piece.visible=false;celebration.add(piece);return piece;
});
let celebrationAge=10, winAnimation, winAmountNode;
function clearCelebration(){
 celebrationAge=10;celebration.visible=false;
 winAnimation?.cancel();
 winAnimation=undefined;
}
function celebrateWin(){
 clearCelebration();
 winAmountNode=message.querySelector('.win-amount');
 if(!state.motion||reducedMotion.matches)return;
 const tier=winTiming(state.target),{count,level}=tier;
 celebrationAge=0;celebration.visible=true;
 winAmountNode.textContent=money(0);
 const accents=[0x80f7b6,0x6ce8ff,0xc89aff,0xff9d64,0xffd579];
 const palettes=[[0,1],[0,2,3],[1,2,4],[2,3,4],[0,1,2,3,4]];
 effects.pulse(accents[level],level>=2);
 celebration.rotation.y=0;
 confettiMaterials.forEach(material=>material.opacity=1);
 confetti.forEach((piece,index)=>{
  piece.visible=index<count;
  if(!piece.visible)return;
  const palette=palettes[level];piece.material=confettiMaterials[palette[index%palette.length]];
  const point=fountainParticle(index,0,count,level);
  piece.position.set(point.x,point.y,point.z);piece.scale.setScalar(0);
 });
 winAnimation=message.animate([
  {transform:`translateY(${18+level*2}px) scale(${.93-level*.006})`,opacity:0},
  {transform:'translateY(-2px) scale(1.018)',opacity:1,offset:.72},
  {transform:'translateY(0) scale(1)',opacity:1},
 ],{duration:480+level*65,easing:'cubic-bezier(.16,1,.3,1)'});
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
  const point=fountainParticle(index,elapsed,timing.count,timing.level);
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
const edgeMat=new THREE.LineBasicMaterial({color:0x4ccfe8,transparent:true,opacity:.24,toneMapped:false});
const coreHighlight=new THREE.Color(0xd8fbff),coreViolet=new THREE.Color(0x9d60ff),projectionHighlight=new THREE.Color(0xc7f8ff);
const blocks=[];
for(let row=0;row<7;row++)for(let col=0;col<7-row;col++){
 const block=new THREE.Mesh(geo,materials[col%2]);
 block.add(new THREE.LineSegments(edges,edgeMat));
 block.userData={x:(col-(6-row)/2)*.88,y:row*.86,velocity:new THREE.Vector3((random()-.5)*5,2+random()*4,(random()-.5)*4)};
 block.castShadow=true;block.receiveShadow=true;crystalDetails(block,blocks.length);
 block.position.set(block.userData.x,block.userData.y,0);stack.add(block);blocks.push(block);
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
let rulesRenderer=null,rulesScene=null,rulesCamera=null,rulesTower=null,rulesBlocks=[];
function ensureRulesScene(){
 if(rulesRenderer)return;
 const rulesMount=$('#rules-scene');
 rulesRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
 rulesRenderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 rulesRenderer.outputColorSpace=THREE.SRGBColorSpace;
 rulesRenderer.toneMapping=THREE.ACESFilmicToneMapping;
 rulesRenderer.toneMappingExposure=1.18;
 rulesMount.append(rulesRenderer.domElement);
 rulesScene=new THREE.Scene();
 rulesScene.fog=new THREE.FogExp2(0x050a10,.045);
 rulesScene.add(new THREE.HemisphereLight(0xb8f5ff,0x1a102b,1.25));
 const key=new THREE.DirectionalLight(0xe8fbff,3.2);key.position.set(-3,6,5);rulesScene.add(key);
 const violet=new THREE.PointLight(0x7b55ff,18);violet.position.set(3,2,2);rulesScene.add(violet);
 rulesTower=new THREE.Group();rulesScene.add(rulesTower);
 const guideMaterials=crystalMaterials();
 const guideEdgeMaterial=new THREE.LineBasicMaterial({color:0x64eaff,transparent:true,opacity:.34,toneMapped:false});
 const positions=[[-.86,0,0],[0,0,0],[.86,0,0],[-.43,.84,0],[.43,.84,0],[0,1.68,0]];
 positions.forEach((position,index)=>{
  const block=new THREE.Mesh(geo,guideMaterials[index%2]);
  block.add(new THREE.LineSegments(edges,guideEdgeMaterial));
  crystalDetails(block,index);block.position.set(...position);rulesTower.add(block);rulesBlocks.push(block);
 });
 const guidePlatform=new THREE.Mesh(new THREE.CylinderGeometry(2.65,2.85,.25,64),new THREE.MeshStandardMaterial({color:0x111c25,metalness:.72,roughness:.26}));
 guidePlatform.position.y=-.58;rulesTower.add(guidePlatform);
 const guideRing=new THREE.Mesh(new THREE.TorusGeometry(2.7,.022,8,96),new THREE.MeshBasicMaterial({color:0x52e5f1,toneMapped:false}));
 guideRing.rotation.x=Math.PI/2;guideRing.position.y=-.44;rulesTower.add(guideRing);
 rulesCamera=new THREE.PerspectiveCamera(36,1,.1,40);rulesCamera.position.set(3.4,2.8,7.6);rulesCamera.lookAt(0,.65,0);
 new ResizeObserver(resizeRulesScene).observe(rulesMount);
}
function resizeRulesScene(){
 if(!rulesRenderer)return;
 const mount=$('#rules-scene'),width=Math.max(1,mount.clientWidth),height=Math.max(1,mount.clientHeight);
 rulesRenderer.setSize(width,height,false);rulesCamera.aspect=width/height;rulesCamera.updateProjectionMatrix();
}
function renderRulesScene(dt){
 if(!gameInfoDialog.open||activeInfoPanel!=='how-to')return;
 ensureRulesScene();
 if(state.motion&&!reducedMotion.matches){
  rulesTower.rotation.y+=dt*.22;
  for(const block of rulesBlocks){
   block.userData.core.rotation.y+=dt*.48*block.userData.spinDirection;
   block.userData.core.rotation.x+=dt*.2;
   block.userData.innerCore.rotation.z-=dt*.65;
  }
 }
 rulesRenderer.render(rulesScene,rulesCamera);
}
// Asymmetric rim inlays make rotation visible on the circular platform.
for(let i=0;i<12;i++){
 const mark=new THREE.Mesh(new THREE.BoxGeometry(i%3===0?.28:.12,.025,.07),new THREE.MeshBasicMaterial({color:i%3===0?0xffcc66:0x43bddd}));
 const angle=i*Math.PI/6;mark.position.set(Math.cos(angle)*3.55,-.447,Math.sin(angle)*3.55);mark.rotation.y=-angle;turntable.add(mark);
}
function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(mount);resize();
let visibleCount=10;
let cameraHeight=3.5;
const cameraDirection=new THREE.Vector3(4,3.2,9).normalize();
const winCameraDirection=new THREE.Vector3(0,2.7,10).normalize();
let cameraDistance=8.4;
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
  b.rotation.set(0,0,0);b.scale.setScalar(1);b.userData.velocity.set((seededUnit(state.visualSeed,i,0)-.5)*5,2+seededUnit(state.visualSeed,i,1)*4,(seededUnit(state.visualSeed,i,2)-.5)*4);
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
 if(state.phase==='running'||state.replay)return;
 $('#settingsDrawer').classList.remove('open','autoplay-open');
 if(gameInfoDialog.open)gameInfoDialog.close();
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
 state.bet=bet;state.target=target;state.balance-=bet;state.payout=0;state.multiplier=1;state.roundId=state.nextRoundId++;
 clearCelebration();stopWinSound();
 // Local demo outcome. Production must obtain the outcome and payout from Stake.
 state.breakAt=crashPoint(crypto.getRandomValues(new Uint32Array(1))[0]);
 state.visualSeed=crypto.getRandomValues(new Uint32Array(1))[0];state.bonusTransitions=[];
 state.started=performance.now();state.speed=state.turbo? .36:.14;state.phase='running';state.bonus=0;
 clearPredictionCue();state.predictionReached=false;
 stopGrowthSound();stopLandingSounds();lastGrowthAt=state.started;lastGrowthUnits=100;growthTick=0;
 playMusic();
 message.remove();rebuild(1);message.classList.remove('broken');tone(300);tick(state.started);update();
}
function startReplay(round){
 if(state.phase==='running'||state.auto||state.replay)return;
 const replay=createReplaySnapshot(round);
 state.replayRestore={bet:$('#bet').value,prediction:$('#prediction').value,turbo:state.turbo};
 state.replay=replay;
 $('#settingsDrawer').classList.remove('open','autoplay-open');
 if(gameInfoDialog.open)gameInfoDialog.close();
 clearTimeout(nextRound);clearCelebration();stopWinSound();resetDebris();
 $('#bet').value=(replay.betCents/100).toFixed(2);
 $('#prediction').value=(replay.targetUnits/100).toFixed(2);syncPredictionSlider();
 state.bet=replay.betCents;state.target=replay.targetUnits/100;state.breakAt=replay.resultUnits/100;
 state.payout=0;state.multiplier=1;state.turbo=replay.turbo;state.visualSeed=replay.visualSeed;state.bonusTransitions=[];
 state.started=performance.now();state.speed=state.turbo ? .36 : .14;state.phase='running';state.bonus=0;
 clearPredictionCue();state.predictionReached=false;
 stopGrowthSound();stopLandingSounds();lastGrowthAt=state.started;lastGrowthUnits=100;growthTick=0;
 playMusic();message.remove();message.classList.remove('broken','replay-loss');rebuild(1);tone(300);tick(state.started);renderDialogHistory();update();
}
function finishReplay(){
 if(!state.replay)return;
 stopMusic();stopGrowthSound();stopLandingSounds();stopWinSound();clearPredictionCue();clearCelebration();resetDebris();
 const restore=state.replayRestore;
 state.replay=null;state.replayRestore=null;state.phase='idle';state.multiplier=1;state.bonus=0;state.payout=0;state.predictionReached=false;state.breakDelay=0;
 message.remove();message.classList.remove('broken','win-message','replay-loss','long-payout');
 if(restore){$('#bet').value=restore.bet;$('#prediction').value=restore.prediction;state.turbo=restore.turbo;syncPredictionSlider();}
 rebuild(10);renderDialogHistory();update();action.focus();
}
function settle(won, at){
 if(state.phase!=='running')return;
 stopMusic();
 stopGrowthSound();
 stopLandingSounds();
 clearPredictionCue();state.predictionReached=won;
 const effectiveUnits=multiplierUnits(state.target);
 state.phase=won?'won':'broken';state.multiplier=at;state.bonus=bonusStage(at).level;state.payout=state.replay?state.replay.payoutCents:won?payout(state.bet,effectiveUnits):0;if(!state.replay)state.balance+=state.payout;state.ended=performance.now();
 if(won){state.winRotationFrom=turntable.rotation.y;state.winRotationTo=Math.round(turntable.rotation.y/Math.PI)*Math.PI;}
 if(!won){state.breakDelay=0;if(!state.motion||reducedMotion.matches)startDebris();}
 message.classList.toggle('broken',!won);
 message.textContent='';
 if(won){
  const tier=winTier(state.target),title=state.replay?'REPLAY · YOU WON':'YOU WON';
  message.classList.toggle('long-payout',money(state.payout).length>12);
  message.innerHTML=`<span class="win-title" aria-hidden="true">${title}</span><strong class="win-amount" aria-hidden="true">${money(state.payout)}</strong>${state.replay?`<span class="replay-detail" aria-hidden="true">Target ${(state.replay.targetUnits/100).toFixed(2)}x · Result ${(state.replay.resultUnits/100).toFixed(2)}x</span>`:''}<span class="win-announcement">${tier.label}. ${title}. Payout ${money(state.payout)}.</span>`;
  $('.stage').append(message);
  celebrateWin();playWinSound(state.target);
 }
 if(!won){tone(120,.3);if(state.replay){message.classList.add('replay-loss');message.innerHTML=`<strong>STACK BROKE</strong><span class="replay-detail">Round #${state.replay.roundId} · Result ${(state.replay.resultUnits/100).toFixed(2)}x before target ${(state.replay.targetUnits/100).toFixed(2)}x</span>`;$('.stage').append(message);}}
 if(!state.replay){
  const snapshot=createReplaySnapshot({roundId:state.roundId,betCents:state.bet,targetUnits:effectiveUnits,resultUnits:multiplierUnits(at),payoutCents:state.payout,won,visualSeed:state.visualSeed,turbo:state.turbo,bonusTransitions:state.bonusTransitions});
  state.history.unshift(snapshot);state.history=state.history.slice(0,30);renderRoundHistory();
 }
 if(state.auto&&!state.replay){state.remaining--;const delta=state.balance-state.autoStart;if(state.remaining<=0||delta>=state.profit||delta<=-state.loss||state.balance<state.bet){state.auto=false;state.autoRound=0;state.autoTotal=0;}else nextRound=setTimeout(start,won?winTiming(state.target).duration+400:1800);}
 if(state.replay)renderDialogHistory();
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
 if(result){settle(state.replay?state.replay.won:result.won,state.replay?state.replay.resultUnits/100:result.at);return;}
 state.multiplier=next;
 if(next>=state.target)predictionReached(now);
 growthSound(next,now);
 const stage=bonusStage(next);
 const count=Math.min(28,1+Math.floor(Math.log(next)*6)*(stage.level>=2?2:1)+(stage.level>=1?3:0));
 if(count>visibleCount)rebuild(count);
 const bonus=stage.level;
 if(bonus!==state.bonus){state.bonus=bonus;if(bonus>0)state.bonusTransitions.push({level:bonus,atUnits:multiplierUnits(next)});effects.pulse([0x66eaff,0xffc750,0xbc69ff,0xff6045,0xffe59b][bonus],true);tone(880,.2);}
 update();
}
action.onclick=()=>state.replay?finishReplay():start();
let last=performance.now();
function animate(now){
 const dt=Math.min((now-last)/1000,.05);last=now;tick(now);
 animateCelebration(now);
 const broken=state.phase==='broken';
 const moving=state.motion&&!reducedMotion.matches;
 if(broken&&moving){state.breakDelay=(state.breakDelay||0)+dt;if(state.breakDelay>=.22&&!debrisWorld)startDebris();if(debrisWorld)animateDebris(dt);}
 const palette=broken?4:state.phase==='won'?-1:state.bonus===4?2:state.bonus===3?4:state.bonus===2?3:state.bonus===1?2:-1;
 blocks.forEach((b,i)=>{
  b.visible=i<visibleCount;b.material=materials[palette<0?i%2:palette];
  const core=b.userData.core,innerCore=b.userData.innerCore,crack=b.userData.crack;
  const multiplierEnergy=Math.min(1,Math.log2(Math.max(1,state.multiplier))/8);
  const coreSpeed=state.phase==='running'?.42+multiplierEnergy*.72:state.phase==='won'?.24:.12;
  if(moving){
   core.rotation.x+=dt*coreSpeed*.58*b.userData.spinDirection;
   core.rotation.y+=dt*coreSpeed*b.userData.spinDirection;
   innerCore.rotation.x-=dt*coreSpeed*1.25;
   innerCore.rotation.z+=dt*coreSpeed*.85;
  }
  crack.material.opacity=broken?Math.max(0,1-(state.breakDelay||0)/1.4):0;
  core.material.color.copy(b.material.emissive).lerp(coreHighlight,.34);
  core.material.emissive.copy(b.material.emissive);
  innerCore.material.color.copy(b.material.emissive).lerp(coreViolet,.68);
  innerCore.material.emissive.copy(innerCore.material.color);
  const winPulse=state.phase==='won'&&moving?.22+.18*Math.sin((now-state.ended)*.009-i*.22):0;
  core.material.opacity=broken?Math.max(.08,.86-(state.breakDelay||0)*.32):.86;
  const winLight=state.phase==='won'&&moving?Math.max(0,1-Math.abs((now-state.ended)/1000-b.userData.y*.08-.25)/.25):0;
  core.material.emissiveIntensity=broken?Math.max(.03,.55-(state.breakDelay||0)*.22):.65+multiplierEnergy*.55+winLight*.9+winPulse;
  innerCore.material.emissiveIntensity=broken?.15:1.25+multiplierEnergy*.7+winLight*.8+winPulse;
  b.userData.channelMaterial.color.copy(b.material.emissive);
  b.userData.channelMaterial.opacity=broken?Math.max(.08,.9-(state.breakDelay||0)*.4):.68+multiplierEnergy*.22+winLight*.1;
  b.userData.projectionMaterial.color.copy(b.material.emissive).lerp(projectionHighlight,.24);
  b.userData.projectionMaterial.opacity=broken?Math.max(.05,.72-(state.breakDelay||0)*.32):.48+multiplierEnergy*.24+winLight*.2;
  b.userData.windowMaterial.emissive.copy(b.material.emissive);
  b.userData.windowMaterial.emissiveIntensity=broken?.04:.12+multiplierEnergy*.18+winLight*.2;
  b.material.emissiveIntensity=broken?Math.max(.012,.055-(state.breakDelay||0)*.025):.055+winLight*.08;
  if(!broken){
   const oldAge=b.userData.landingAge;b.userData.landingAge+=dt;
   const t=Math.max(0,b.userData.landingAge);
   let offset=t<.36?1.8*(1-(t/.36)**2):t<.66?Math.sin((t-.36)/.3*Math.PI)*.14:0;
   b.position.y=b.userData.y+(moving?offset:0);
   b.position.x=moving?THREE.MathUtils.lerp(b.position.x,b.userData.x,Math.min(1,dt*12)):b.userData.x;
   if(b.visible&&moving&&oldAge<.36&&t>=.36){effects.pulse(b.material.color);blockLandingSound(i,state.multiplier);}
   b.scale.setScalar(1);
  }
 });
 if(moving&&(state.phase==='running'||document.body.classList.contains('intro-active')))turntable.rotation.y+=dt*(state.phase==='running'?.22:.12);
 const rawWinProgress=state.phase==='won'?Math.min(1,Math.max(0,(now-state.ended)/700)):0;
 const winProgress=state.phase==='won'?(moving?1-(1-rawWinProgress)**3:1):0;
 if(state.phase==='won')turntable.rotation.y=moving
  ?THREE.MathUtils.lerp(state.winRotationFrom,state.winRotationTo,winProgress)
  :state.winRotationTo;
 const desiredHeight=Math.ceil((Math.sqrt(8*visibleCount+1)-1)/2)*.86;
 cameraHeight=moving?THREE.MathUtils.lerp(cameraHeight,desiredHeight,Math.min(1,dt*2)):desiredHeight;
 const renderHeight=Math.max(1,mount.clientHeight);
 camera.aspect=mount.clientWidth/renderHeight;camera.updateProjectionMatrix();
 renderer.setViewport(0,0,mount.clientWidth,renderHeight);
 const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
 const viewDirection=cameraDirection.clone().lerp(winCameraDirection,winProgress).normalize();
 const aim=new THREE.Vector3(0,cameraHeight*(state.phase==='won'?.38:.36),0);
 const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),viewDirection).normalize();
 const up=new THREE.Vector3().crossVectors(viewDirection,right);
 let distance=state.phase==='won'?7.45:8.1;
 // Fit both the rotating platform and tower inside the clear region of the arena.
 const bounds=[];
 for(let i=0;i<12;i++)bounds.push(new THREE.Vector3(Math.cos(i*Math.PI/6)*4,-.8,Math.sin(i*Math.PI/6)*4));
 if(state.phase==='won'){
  for(const block of blocks.filter(block=>block.visible))for(const x of [-.44,.44])for(const y of [-.44,.44])for(const z of [-.44,.44])bounds.push(block.position.clone().add(new THREE.Vector3(x,y,z)));
 }else for(const x of [-3.2,3.2])for(const z of [-.6,.6])bounds.push(new THREE.Vector3(x,Math.max(cameraHeight,desiredHeight)+.6,z));
 for(const point of bounds){point.sub(aim);distance=Math.max(distance,Math.abs(point.dot(up))/(tan*(state.phase==='won'?.92:.82))+point.dot(viewDirection),Math.abs(point.dot(right))/(tan*camera.aspect*(state.phase==='won'?.92:.88))+point.dot(viewDirection));}
 cameraDistance=moving?THREE.MathUtils.lerp(cameraDistance,distance,Math.min(1,dt*(state.phase==='won'?3:5))):distance;
 camera.position.copy(viewDirection).multiplyScalar(cameraDistance).add(aim);camera.lookAt(aim);
 const tierAccent=[0x80f7b6,0x6ce8ff,0xc89aff,0xff9d64,0xffd579];
 const stageColor=state.phase==='won'?tierAccent[winTier(state.target).level]:[0x66eaff,0xffc750,0xbc69ff,0xff6045,0xffe59b][state.bonus||0];
 ring.material.color.lerp(new THREE.Color(broken?0xff515c:stageColor),Math.min(1,dt*4));
 effects.update(dt,moving,broken?0xff515c:stageColor,state.bonus,cameraHeight,state.phase==='running');
 $('.multiplier').style.color=broken?'#ff515c':state.phase==='won'?'#4cef97':'#e8faff';
 renderRulesScene(dt);
 renderer.render(scene,camera);dismissLoader();requestAnimationFrame(animate);
}
renderRoundHistory();rebuild(10);update();requestAnimationFrame(animate);
