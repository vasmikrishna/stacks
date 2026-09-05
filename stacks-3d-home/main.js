import * as THREE from './vendor/three.module.js';
import { lightCrystalStage, crystalMaterials, crystalDetails, stageEffects } from './crystal-stage.js?v=6';
import RAPIER from './vendor/rapier.es.js';
await RAPIER.init();
import { bonusStage, multiplierUnits, payout, resolveRound } from './math.mjs';
import { predictionStops, predictionPosition, predictionValue, adjustPrediction, snapPrediction } from './prediction-scale.mjs?v=3';
import { winTier, winTiming, displayedPayout, fountainParticle } from './win-timing.mjs?v=2';
import { createRecentResults } from './recent-results.js';
import { createReplaySnapshot, seededUnit } from './replay.mjs';
import { growthCue, landingCue } from './audio-design.mjs';
import { apiAmount, amountText, nearestTarget, targetMode, samplesAtLeast, SAMPLE_COUNT, SUPPORTED_TARGETS } from './engine-contract.mjs';
import { GAME_MODES, gameMode, boostedPayoutUnits, modeRevealUnits } from './game-modes.mjs';
import { createEngineSession } from './engine-session.mjs';

const $ = (s) => document.querySelector(s);
const engine=createEngineSession(location.href,{required:document.querySelector('meta[name="stacks-runtime"]')?.content==='stake-engine'});
const money = (n) => (n / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: engine.enabled?6:2 });
const random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const NORMAL_REVEAL_RATE=.14,TURBO_MULTIPLIER=2.5;
const presentationScale=()=>state.turbo?TURBO_MULTIPLIER:1;
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
  setTimeout(()=>{loader.classList.add('is-logo-reveal');playSplashAudio();},1000);
  setTimeout(()=>loader.classList.add('is-complete'),1700);
  setTimeout(()=>{loader.hidden=true;stopIntroAudio();startIntroIfNeeded();},2300);
 };
 const fallback=setTimeout(release,4000);
 Promise.all([logoReady,fontsReady]).then(()=>{clearTimeout(fallback);release();});
}
const state = { balance: 1245000, phase: 'idle', multiplier: 1, bonus: 0, bet: 0, auto: false, autoRound: 0, autoTotal: 0, remaining: 0, history: [], nextRoundId: 1, replay: null, replayRestore: null, visualSeed: 0, bonusTransitions: [], sound: true, music: true, musicVolume: .35, motion: true, turbo: false, modeId: 'classic' };
if(engine.enabled)state.balance=0;
let engineReplaySnapshot=null;
const engineNotice=document.createElement('div');
engineNotice.className='engine-notice';engineNotice.hidden=true;engineNotice.setAttribute('role','status');
const engineNoticeText=document.createElement('span'),engineReconnect=document.createElement('button');
engineReconnect.type='button';engineReconnect.textContent='Reconnect';
engineNotice.append(engineNoticeText,engineReconnect);$('.stage').append(engineNotice);
engineReconnect.onclick=()=>bootstrapEngine();
const steppers = document.querySelectorAll('.stepper');
steppers[0].innerHTML = '<button aria-label="Halve bet" title="Halve bet"><img src="./assets/arcade/minus.svg" alt=""></button><input id="bet" class="value" type="number" aria-label="Bet amount" min="1" step="1" value="100.00"><button aria-label="Double bet" title="Double bet"><img src="./assets/arcade/plus.svg" alt=""></button>';
steppers[1].classList.add('prediction-control');
steppers[1].innerHTML = `
 <div class="prediction-number">
  <button id="predictionDown" aria-label="Decrease prediction" title="Decrease prediction by 0.01x"><img src="./assets/arcade/minus.svg" alt=""></button>
  <label class="prediction-value"><input id="prediction" type="number" aria-label="Exact prediction multiplier" min="1.50" max="39" step="0.01" value="2.50"><span aria-hidden="true">x</span></label>
  <button id="predictionUp" aria-label="Increase prediction" title="Increase prediction by 0.01x"><img src="./assets/arcade/plus.svg" alt=""></button>
 </div>
  <div class="prediction-track">
   <input id="target" type="range" aria-label="Prediction multiplier" min="0" max="1000" step="1">
  <div class="ruler-scale" aria-hidden="true">
   ${Array.from({length: 101}, (_, i) => `<i class="ruler-tick" style="left:${i}%"></i>`).join('')}
   ${predictionStops.map(([value, position]) => `<span class="ruler-stop" style="left:${position / 10}%"><span>${value}x</span></span>`).join('')}
  </div>
  <div class="live-track" aria-hidden="true"><div class="live-fill"></div><i class="live-marker"></i></div>
  <output id="live-multiplier" aria-label="Live round multiplier">Live 1.00x</output>
 </div>`;
function syncPredictionSlider() {
 const value=Number($('#prediction').value);
 if(!$('#prediction').value || !Number.isFinite(value) || value<1.5 || value>39)return;
 $('#target').value=predictionPosition(value);
 $('#target').setAttribute('aria-valuetext',value.toFixed(2)+'x');
}
syncPredictionSlider();
const predictionPanel = steppers[1].parentElement;
predictionPanel.classList.add('prediction-panel');
$('.bottom-playbar').before(predictionPanel);
const modePanel=document.createElement('section');
modePanel.className='mode-panel';modePanel.setAttribute('aria-label','Payout quote');
modePanel.innerHTML='<div class="mode-quote"><span>Total payout <strong id="modePayout"></strong></span><span>Win chance <strong id="modeOdds"></strong></span></div>';
const modeDialog=document.createElement('dialog');
modeDialog.id='modeDialog';modeDialog.setAttribute('aria-labelledby','modeDialogTitle');
modeDialog.innerHTML=`<header><h2 id="modeDialogTitle">Choose your mode</h2><button type="button" class="mode-close" aria-label="Close mode selector" title="Close">×</button></header><div class="mode-options" role="group" aria-label="Game mode">${GAME_MODES.map(mode=>`<button type="button" data-mode="${mode.id}" aria-pressed="false"><span class="mode-art" aria-hidden="true"></span><span class="mode-check" aria-hidden="true">✓</span><span>${mode.label}</span><b>${mode.boost}x</b></button>`).join('')}</div><div class="mode-quote"><span>Total payout <strong id="modalPayout"></strong></span></div><p class="mode-risk">Higher boosts have lower win chances.</p><button type="button" id="confirmMode">Use Classic</button>`;
document.body.append(modeDialog);
const bonusButton=document.createElement('button');
bonusButton.type='button';bonusButton.id='bonusMode';bonusButton.setAttribute('aria-haspopup','dialog');bonusButton.setAttribute('aria-controls','modeDialog');
bonusButton.innerHTML='<span class="mode-art" aria-hidden="true"></span><b aria-hidden="true">1x</b>';
$('#turbo').before(bonusButton);
let pendingMode='classic';
const modeBlocked=()=>state.phase==='running'||state.auto||Boolean(state.replay)||Boolean(engine.enabled&&(engine.locked||engine.busy||engine.publicReplay||state.engineSettling));
function refreshModeDialog(){
 for(const button of modeDialog.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',button.dataset.mode===pendingMode);
 const units=boostedPayoutUnits(multiplierUnits(normalizePrediction(Number($('#prediction').value)||2.5)),pendingMode);
 let amount='--';try{amount=money(Number(BigInt(apiAmount($('#bet').value))*BigInt(units)/100n)/10000);}catch{}
 $('#modalPayout').textContent=`${amount} (${(units/100).toFixed(2)}x)`;
 $('#confirmMode').textContent='Use '+gameMode(pendingMode).label;
}
bonusButton.onclick=()=>{if(modeBlocked())return;pendingMode=state.modeId;refreshModeDialog();modeDialog.showModal();modeDialog.querySelector('[aria-pressed="true"]').focus();};
modeDialog.querySelector('.mode-close').onclick=()=>modeDialog.close();
modeDialog.addEventListener('click',event=>{if(event.target===modeDialog){const r=modeDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modeDialog.close();}});
modeDialog.addEventListener('close',()=>bonusButton.focus());
predictionPanel.before(modePanel);
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
   <td>#${round.roundId}<small class="history-mode">${gameMode(round.modeId).label}</small></td>
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
 const stake=Math.max(engine.enabled?.000001:1,Number($('#bet').value)||100);
 const target=Math.min(39,Math.max(1.5,Number($('#prediction').value)||2.5));
 const targetLabel=target.toFixed(2)+'x';
 for(const selector of ['#rulesTargetLabel','#rulesWinTarget','#rulesLossTarget'])$(selector).textContent=targetLabel;
 $('#rulesWinValue').textContent=engine.enabled?money(Number(BigInt(apiAmount(String(stake)))*BigInt(boostedPayoutUnits(multiplierUnits(target),state.modeId))/100n)/10000):money(payout(Math.round(stake*100),boostedPayoutUnits(multiplierUnits(target),state.modeId)));
 $('#rulesLossValue').textContent=stake.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function updateModeQuote(){
 const units=boostedPayoutUnits(multiplierUnits(normalizePrediction(Number($('#prediction').value)||2.5)),state.modeId);
 let amount='--';
 try{amount=money(Number(BigInt(apiAmount($('#bet').value))*BigInt(units)/100n)/10000);}catch{}
 $('#modePayout').textContent=`${amount} (${(units/100).toFixed(2)}x)`;
 $('#modeOdds').textContent=(Number(samplesAtLeast(units))/Number(SAMPLE_COUNT)*100).toFixed(2)+'%';
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
function createEffect(filename,volume,{loop=false}={}){
 const track=new Audio(`./assets/audio/${filename}`);
 track.preload='auto';track.loop=loop;track.volume=volume;
 track.dataset.baseVolume=String(volume);
 return track;
}
function stopEffect(track,{reset=true}={}){
 track.pause();
 if(reset)try{track.currentTime=0;}catch{}
}
function playEffect(track,{volume=Number(track.dataset.baseVolume),playbackRate=1,restart=true}={}){
 if(!state.sound||document.hidden)return;
 if(restart)stopEffect(track);
 track.volume=Math.min(1,Math.max(0,volume));
 track.playbackRate=Math.min(2,Math.max(.5,playbackRate));
 track.play().catch(()=>{});
}
const BOOT_VOLUME=.42,SPLASH_VOLUME=.52;
const bootTrack=createEffect('boot-bed.mp3',BOOT_VOLUME);
const splashTrack=createEffect('splash-reveal.mp3',SPLASH_VOLUME);
const multiplierCountTrack=createEffect('multiplier-count.mp3',.12,{loop:true});
const targetReachedTrack=createEffect('target-reached.mp3',.24);
const stackBreakTrack=createEffect('stack-break.mp3',.16);
const blockLandingTracks=Array.from({length:6},()=>createEffect('block-land.mp3',.16));
const winTracks={
 small:createEffect('win-small.mp3',.3),
 big:createEffect('win-big.mp3',.34),
 jackpot:createEffect('win-jackpot.mp3',.4),
};
const gameplayTracks=[multiplierCountTrack,targetReachedTrack,stackBreakTrack,...blockLandingTracks,...Object.values(winTracks)];
function playIntroAudio(track,volume,cue){
 if(!state.sound||document.hidden||loader?.hidden)return;
 stopEffect(track);track.volume=volume;
 loader.dataset.audioCue=cue;loader.dataset.audioState='starting';
 track.play().then(()=>{loader.dataset.audioState='playing';}).catch(()=>{loader.dataset.audioState='blocked';});
}
function playBootAudio(){
 stopEffect(splashTrack);playIntroAudio(bootTrack,BOOT_VOLUME,'boot');
}
function playSplashAudio(){
 stopEffect(bootTrack);playIntroAudio(splashTrack,SPLASH_VOLUME,'splash');
}
function stopIntroAudio(){
 stopEffect(bootTrack);stopEffect(splashTrack);
 if(loader)loader.dataset.audioState='stopped';
}
playBootAudio();
let lastGrowthAt=0;
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
 if(state.sound)playEffect(targetReachedTrack);
 lastGrowthAt=now;
}
function stopGrowthSound(){
 stopEffect(multiplierCountTrack);
}
function growthSound(multiplier,now){
 if(state.phase!=='running'||!state.sound||document.hidden)return;
 if(now-lastGrowthAt<120&&!multiplierCountTrack.paused)return;
 const cue=growthCue(multiplier);
 lastGrowthAt=now;
 multiplierCountTrack.volume=state.predictionReached?cue.volume*.72:cue.volume;
 multiplierCountTrack.playbackRate=cue.playbackRate*(state.turbo?1.08:1);
 if(multiplierCountTrack.paused)playEffect(multiplierCountTrack,{volume:multiplierCountTrack.volume,playbackRate:multiplierCountTrack.playbackRate,restart:false});
}
const MUSIC_VOLUME_SCALE=.45;
const musicTrack=new Audio('./assets/audio/crystal-tension.mp3');
musicTrack.loop=true;
musicTrack.preload='auto';
let musicStarted=false,musicPlaying=false,musicLevel=0,musicFadeFrame;
function applyMusicVolume(){
 musicTrack.volume=Math.max(0,Math.min(1,state.musicVolume*MUSIC_VOLUME_SCALE*musicLevel));
}
function cancelMusicFade(){
 cancelAnimationFrame(musicFadeFrame);musicFadeFrame=undefined;
}
function fadeMusicTo(level,duration,onComplete){
 cancelMusicFade();
 const from=musicLevel,start=performance.now();
 const step=(now)=>{
  const progress=Math.max(0,Math.min(1,(now-start)/duration));
  const eased=1-(1-progress)**3;
  musicLevel=from+(level-from)*eased;applyMusicVolume();
  if(progress<1){musicFadeFrame=requestAnimationFrame(step);return;}
  musicFadeFrame=undefined;onComplete?.();
 };
 musicFadeFrame=requestAnimationFrame(step);
}
function stopMusic(){
 cancelMusicFade();musicLevel=0;applyMusicVolume();
 musicPlaying=false;
 musicTrack.pause();
}
function settleMusic(won){
 if(!musicPlaying||musicTrack.paused)return;
 fadeMusicTo(0,won?950:1300,()=>{musicPlaying=false;musicTrack.pause();});
}
function playMusic(){
 musicStarted=true;
 if(state.phase!=='running'||!state.music||document.hidden)return;
 const resume=musicTrack.paused;
 cancelMusicFade();
 if(resume){musicLevel=0;applyMusicVolume();musicPlaying=true;const start=musicTrack.play();start?.catch(()=>{musicPlaying=false;});}
 fadeMusicTo(1,resume?650:350);
}
musicTrack.addEventListener('pause',()=>{musicPlaying=false;});
musicTrack.addEventListener('error',()=>{musicPlaying=false;});
$('#music').onclick=()=>{
 state.music=!state.music;
 $('#music').setAttribute('aria-checked',state.music);
 $('#music .switch').classList.toggle('off',!state.music);
 if(state.music)playMusic();else stopMusic();
};
$('#musicVolume').oninput=()=>{
 state.musicVolume=Number($('#musicVolume').value)/100;
 applyMusicVolume();
};
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){stopMusic();stopGameplaySounds();stopIntroAudio();}else if(musicStarted&&state.music)playMusic();
});
window.addEventListener('pagehide',stopMusic);
window.addEventListener('pagehide',stopGameplaySounds);
window.addEventListener('pagehide',stopIntroAudio);
function tone(frequency = 420, duration = .1) {
 if (!state.sound) return;
 try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); const o=audio.createOscillator(), g=audio.createGain(); o.frequency.value=frequency; g.gain.setValueAtTime(.035,audio.currentTime); g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration); o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime+duration); } catch {}
}
let landingTrackIndex=0;
function stopLandingSounds(){
 blockLandingTracks.forEach(track=>stopEffect(track));
}
function blockLandingSound(index,multiplier){
 if(!state.sound||state.phase!=='running'||document.hidden)return;
 const cue=landingCue(index,multiplier);
 const track=blockLandingTracks[landingTrackIndex++%blockLandingTracks.length];
 playEffect(track,{volume:cue.volume,playbackRate:cue.playbackRate});
}
function stopWinSound(){
 Object.values(winTracks).forEach(track=>stopEffect(track));
}
function playWinSound(target){
 if(!state.sound||document.hidden)return;
 stopWinSound();
 const {level}=winTier(target);
 playEffect(level>=4?winTracks.jackpot:level>=2?winTracks.big:winTracks.small);
}
function stopGameplaySounds(){gameplayTracks.forEach(track=>stopEffect(track));}
$('#sound').onclick=()=>{
 state.sound=!state.sound;
 $('#sound').setAttribute('aria-checked',state.sound);
 $('#sound .switch').classList.toggle('off',!state.sound);
 if(!state.sound)stopGameplaySounds();
};
$('#turbo').onclick=()=>{
 if(state.phase==='running'||state.auto)return;
 state.turbo=!state.turbo;
 update();
};
modeDialog.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{pendingMode=button.dataset.mode;refreshModeDialog();});
$('#confirmMode').onclick=()=>{
 if(modeBlocked()){modeDialog.close();return;}
 if(state.modeId!==pendingMode){
 state.modeId=pendingMode;state.phase='idle';state.multiplier=1;state.bonus=0;state.payout=0;state.predictionReached=false;clearCelebration();message.remove();stopGameplaySounds();resetDebris();rebuild(10);applyModeTheme();update();
 }
 modeDialog.close();
};
document.addEventListener('input',event=>{if(['bet','target','prediction'].includes(event.target.id))updateModeQuote();});
document.addEventListener('change',event=>{if(['bet','target','prediction'].includes(event.target.id))updateModeQuote();});
steppers[0].addEventListener('click',updateModeQuote);
steppers[1].addEventListener('click',updateModeQuote);
function update() {
 const tier=state.phase==='won'?winTier(state.target*gameMode(state.modeId).boost):null;
 $('.stage').dataset.win=tier?.id||'';
 $('.stage').dataset.phase=state.phase;
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
 const turbo=$('#turbo'),turboLabel=`Turbo mode ${state.turbo?'on':'off'}: 2.5x faster round presentation`;
 turbo.setAttribute('aria-checked',state.turbo);turbo.setAttribute('aria-label',turboLabel);turbo.title=turboLabel;
 turbo.disabled=state.phase==='running'||state.auto||Boolean(state.replay);
 bonusButton.disabled=modeBlocked();
 bonusButton.dataset.mode=state.modeId;bonusButton.querySelector('b').textContent=gameMode(state.modeId).boost+'x';
 bonusButton.title='Bonus mode: '+gameMode(state.modeId).label;
 bonusButton.setAttribute('aria-label',bonusButton.title+' '+gameMode(state.modeId).boost+'x');
 if(modeDialog.open&&modeBlocked())modeDialog.close();
 updateModeQuote();
 for(const input of document.querySelectorAll('.stepper input, .stepper button, .drawer-row input:not(#musicVolume), #reset')) input.disabled=state.phase==='running' || state.auto || Boolean(state.replay);
 if(engine.enabled){
  const blocked=engine.locked||engine.busy||state.engineSettling;
  for(const input of document.querySelectorAll('.stepper input, .stepper button, .drawer-row input:not(#musicVolume)'))input.disabled ||= Boolean(blocked||engine.publicReplay);
  action.disabled ||= Boolean(blocked);
  auto.disabled ||= Boolean(engine.publicReplay||engine.locked||(!state.auto&&engine.busy)||engine.config?.jurisdiction?.disabledAutoplay);
  turbo.disabled ||= Boolean(blocked||engine.publicReplay||engine.config?.jurisdiction?.disabledTurbo);
  $('#reset').hidden=true;
  if(engine.publicReplay){
   action.disabled=!engineReplaySnapshot||state.phase==='running';
   action.querySelector('.action-label').textContent=state.phase==='running'?'Replaying':state.replay?'Play Again':'Play Replay';
   auto.parentElement.hidden=true;$('.balance').hidden=true;
  }else if(engine.busy||state.engineSettling)action.querySelector('.action-label').textContent=state.engineSettling?'Confirming result':'Connecting';
 }
 replayStatus.hidden=!state.replay;
 if(state.replay)replayStatus.querySelector('strong').textContent=`Replay · Round #${state.replay.roundId}`;
}
steppers[0].querySelectorAll('button').forEach((button, index)=>button.onclick=()=>{
 if(engine.enabled){
  if(!engine.config)return;
  const levels=engine.config.betLevels,current=Number($('#bet').value)*1000000;
  const value=index?(levels.find(value=>value>current)??levels.at(-1)):([...levels].reverse().find(value=>value<current)??levels[0]);
  $('#bet').value=amountText(value);return;
 }
 const input=$('#bet'), value=Number(input.value)||Number(input.min);
 input.value=Math.min(100000,Math.max(1,index?value*2:value/2)).toFixed(2);
});
function nudgePrediction(direction){
 const current=Number($('#prediction').value);
 let value;
 if(engine.enabled){
  const units=nearestTarget((Number.isFinite(current)?current:1.5)*100);
  const index=SUPPORTED_TARGETS.indexOf(units);
  value=SUPPORTED_TARGETS[Math.min(SUPPORTED_TARGETS.length-1,Math.max(0,index+direction))]/100;
 }else value=adjustPrediction(current,direction);
 $('#prediction').value=value.toFixed(2);
 $('#prediction').setCustomValidity('');
 syncPredictionSlider();
}
function normalizePrediction(value){
 const smooth=snapPrediction(value);
 return engine.enabled?nearestTarget(smooth*100)/100:smooth;
}
$('#predictionDown').onclick=()=>nudgePrediction(-1);
$('#predictionUp').onclick=()=>nudgePrediction(1);
$('#target').oninput=()=>{
 const position=Number($('#target').value);
 const value=snapPrediction(predictionValue(position));
 $('#prediction').value=value.toFixed(2);
 $('#prediction').setCustomValidity('');
 $('#target').setAttribute('aria-valuetext',value.toFixed(2)+'x');
};
$('#target').onchange=()=>{
 const value=normalizePrediction(Number($('#prediction').value));
 $('#prediction').value=value.toFixed(2);
 syncPredictionSlider();
};
$('#prediction').oninput=syncPredictionSlider;
$('#prediction').onchange=()=>{
 if($('#prediction').value && $('#prediction').validity.valid)$('#prediction').value=normalizePrediction(Number($('#prediction').value)).toFixed(2);
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
 const tier=winTiming(state.target*gameMode(state.modeId).boost),{count,level}=tier;
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
 const elapsed=Math.max(0,now-state.ended),timing=winTiming(state.target*gameMode(state.modeId).boost);
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
const modeMaterials=Object.fromEntries(GAME_MODES.map(mode=>[mode.id,mode.id==='classic'?materials:mode.colors.map(color=>new THREE.MeshPhysicalMaterial({
 color,emissive:color,emissiveIntensity:.08,roughness:mode.id==='reactor'?.28:.08,metalness:mode.id==='reactor'?.85:.12,
 transmission:mode.id==='prism'?.82:.45,thickness:.3,transparent:true,opacity:mode.id==='reactor'?.22:.48,depthWrite:false,clearcoat:1,
}))]));
const edgeMat=new THREE.LineBasicMaterial({color:0x4ccfe8,transparent:true,opacity:.24,toneMapped:false});
const coreHighlight=new THREE.Color(0xd8fbff),coreViolet=new THREE.Color(0x9d60ff),projectionHighlight=new THREE.Color(0xc7f8ff);
const blocks=[];
for(let row=0;row<7;row++)for(let col=0;col<7-row;col++){
 const block=new THREE.Mesh(geo,materials[col%2]);
 block.add(new THREE.LineSegments(edges,edgeMat));
 block.userData={x:(col-(6-row)/2)*.88,y:row*.86,velocity:new THREE.Vector3((random()-.5)*5,2+random()*4,(random()-.5)*4)};
 block.castShadow=true;block.receiveShadow=true;crystalDetails(block,blocks.length);
 const feature=new THREE.Group();block.add(feature);block.userData.feature=feature;
 const frameGeometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(.64,.64,.64));
 const frameMaterial=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.9,toneMapped:false});
 for(const scale of [1,.58]){
  const frame=new THREE.LineSegments(frameGeometry,frameMaterial);frame.scale.setScalar(scale);feature.add(frame);
 }
 const connectors=[];
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])connectors.push(new THREE.Vector3(x*.32,y*.32,z*.32),new THREE.Vector3(x*.1856,y*.1856,z*.1856));
 feature.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(connectors),frameMaterial));
 const reactorCore=new THREE.Mesh(new THREE.OctahedronGeometry(.25),new THREE.MeshStandardMaterial({color:0xe4ffae,emissive:0xb9ff46,emissiveIntensity:2,metalness:.4,roughness:.2}));
 block.add(reactorCore);block.userData.reactorCore=reactorCore;
 const cage=new THREE.Group(),beamGeo=new THREE.BoxGeometry(1,1,1),beamMat=new THREE.MeshStandardMaterial({color:0xa5adb2,metalness:.92,roughness:.27});
 for(let axis=0;axis<3;axis++)for(const a of [-.33,.33])for(const b of [-.33,.33]){
  const beam=new THREE.Mesh(beamGeo,beamMat),position=[0,0,0],scale=[.055,.055,.055];
  position[(axis+1)%3]=a;position[(axis+2)%3]=b;scale[axis]=.72;beam.position.set(...position);beam.scale.set(...scale);cage.add(beam);
 }
 block.add(cage);block.userData.cage=cage;
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
  block.userData.collider=debrisWorld.createCollider(RAPIER.ColliderDesc.cuboid(half.x+.02,half.y+.032,half.z+.02)
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
function applyModeTheme(){
 const mode=gameMode(state.modeId);
 document.body.dataset.mode=mode.id;
 scene.fog.color.setHex(0x080c12);
 scene.getObjectByName('stageGround').material.color.setHex(0x080c12);
 fill.color.setHex(0x6659ef);
 platform.material.color.setHex(mode.id==='prism'?0x182724:mode.id==='reactor'?0x22271e:0x17202a);
 for(const block of blocks){
  const {feature,reactorCore,cage}=block.userData;
  feature.visible=mode.id==='prism'||mode.id==='tesseract';
  feature.children[2].visible=mode.id==='tesseract';
  feature.rotation.set(0,0,0);feature.children[1].rotation.set(0,0,0);
  feature.children[0].material.color.setHex(mode.colors[0]);
  reactorCore.visible=cage.visible=mode.id==='reactor';
  block.userData.core.visible=mode.id!=='reactor';
 }
}
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
 const target=Math.min(39,Math.max(1.5,Number($('#prediction').value)||2.5));
 const possible=payout(Math.round(stake*100),boostedPayoutUnits(multiplierUnits(target),state.modeId));
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
 if(engine.publicReplay)return;
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
function lockPrediction(){
 const value=normalizePrediction(Number($('#prediction').value));
 $('#prediction').value=value.toFixed(2);syncPredictionSlider();
 return value;
}
function start(){
 if(state.phase==='running'||state.replay)return;
 if(engine.enabled){startEngineRound();return;}
 $('#settingsDrawer').classList.remove('open','autoplay-open');
 if(gameInfoDialog.open)gameInfoDialog.close();
 clearTimeout(nextRound);
 const bet=Math.round(Number($('#bet').value)*100), target=lockPrediction();
 const roundCost=bet;
 if(!Number.isFinite(bet)||bet<100||roundCost>state.balance){state.auto=false;update();reportInputError('#bet','Enter a valid stake with a total cost within your balance.');return;}
 if(!Number.isFinite(target)||target<1.5||target>39){state.auto=false;update();reportInputError('#prediction','Prediction must be between 1.50x and 39x.');return;}
 if(state.auto&&!state.remaining){
  const rounds=Number($('#rounds').value),profit=Number($('#profit').value),loss=Number($('#loss').value);
  if(!Number.isInteger(rounds)||rounds<1||rounds>100||!Number.isFinite(profit)||profit<=0||!Number.isFinite(loss)||loss<=0){state.auto=false;update();$('#settingsDrawer').classList.add('open');reportInputError('#rounds','Set valid autoplay rounds and limits.');return;}
  state.remaining=rounds;state.autoTotal=rounds;state.autoStart=state.balance;state.profit=profit*100;state.loss=loss*100;
 }
 if(state.auto)state.autoRound=state.autoTotal-state.remaining+1;
 state.bet=bet;state.target=target;state.balance-=roundCost;state.payout=0;state.multiplier=1;state.roundId=state.nextRoundId++;
 clearCelebration();stopGameplaySounds();
 // Local demo outcome. Production must obtain the outcome and payout from Stake.
 state.breakAt=modeRevealUnits(crypto.getRandomValues(new Uint32Array(1))[0],state.modeId)/100;
 state.visualSeed=crypto.getRandomValues(new Uint32Array(1))[0];state.bonusTransitions=[];
 state.started=performance.now();state.speed=NORMAL_REVEAL_RATE*presentationScale();state.phase='running';state.bonus=0;
 clearPredictionCue();state.predictionReached=false;
 stopGameplaySounds();lastGrowthAt=state.started;
 playMusic();
 message.remove();rebuild(1);message.classList.remove('broken');tone(300);tick(state.started);update();
}
function startReplay(round){
 if(state.phase==='running'||state.auto||state.replay)return;
 const replay=round.engine?round:createReplaySnapshot(round);
 state.replayRestore={bet:$('#bet').value,prediction:$('#prediction').value,turbo:state.turbo,modeId:state.modeId};
 state.replay=replay;
 $('#settingsDrawer').classList.remove('open','autoplay-open');
 if(gameInfoDialog.open)gameInfoDialog.close();
 clearTimeout(nextRound);clearCelebration();stopGameplaySounds();resetDebris();
 $('#bet').value=replay.engine?amountText(replay.engine.amount):(replay.betCents/100).toFixed(2);
 $('#prediction').value=(replay.targetUnits/100).toFixed(2);syncPredictionSlider();
 state.bet=replay.betCents;state.target=replay.targetUnits/100;state.modeId=replay.modeId||'classic';state.breakAt=replay.resultUnits/100;applyModeTheme();
 state.payout=0;state.multiplier=1;state.turbo=replay.turbo;state.visualSeed=replay.visualSeed;state.bonusTransitions=[];
 state.started=performance.now();state.speed=NORMAL_REVEAL_RATE*presentationScale();state.phase='running';state.bonus=0;
 clearPredictionCue();state.predictionReached=false;
 stopGameplaySounds();lastGrowthAt=state.started;
 playMusic();message.remove();message.classList.remove('broken','replay-loss');rebuild(1);tone(300);tick(state.started);renderDialogHistory();update();
}
function finishReplay(){
 if(!state.replay)return;
 stopMusic();stopGameplaySounds();clearPredictionCue();clearCelebration();resetDebris();
 const restore=state.replayRestore;
 state.replay=null;state.replayRestore=null;state.phase='idle';state.multiplier=1;state.bonus=0;state.payout=0;state.predictionReached=false;state.breakDelay=0;
 message.remove();message.classList.remove('broken','win-message','replay-loss','long-payout');
 if(restore){$('#bet').value=restore.bet;$('#prediction').value=restore.prediction;state.turbo=restore.turbo;state.modeId=restore.modeId;applyModeTheme();syncPredictionSlider();}
 rebuild(10);renderDialogHistory();update();action.focus();
}
function settle(won, at){
 if(state.phase!=='running')return;
 if(engine.enabled&&!state.replay&&!state.engineSettled){
  if(state.engineSettling)return;
  state.engineSettling=true;update();
  engine.finish().then(balance=>{state.balance=balance/10000;state.engineSettled=true;state.engineSettling=false;settle(won,at);}).catch(showEngineError);
  return;
 }
 settleMusic(won);
 stopGameplaySounds();
 clearPredictionCue();state.predictionReached=won;
 const effectiveUnits=multiplierUnits(state.target);
 const payoutUnits=boostedPayoutUnits(effectiveUnits,state.modeId);
 state.phase=won?'won':'broken';state.multiplier=at;state.bonus=bonusStage(at).level;state.payout=state.replay?state.replay.payoutCents:engine.enabled?engine.round.payout/10000:won?payout(state.bet,payoutUnits):0;if(!state.replay&&!engine.enabled)state.balance+=state.payout;state.ended=performance.now();
 if(won){state.winRotationFrom=turntable.rotation.y;state.winRotationTo=Math.round(turntable.rotation.y/Math.PI)*Math.PI;}
 if(!won){state.breakDelay=0;if(!state.motion||reducedMotion.matches)startDebris();}
 message.classList.toggle('broken',!won);
 message.textContent='';
 if(won){
  const tier=winTier(state.target*gameMode(state.modeId).boost),title=state.replay?'REPLAY · YOU WON':'YOU WON';
  message.classList.toggle('long-payout',money(state.payout).length>12);
  message.innerHTML=`<span class="win-title" aria-hidden="true">${title}</span><strong class="win-amount" aria-hidden="true">${money(state.payout)}</strong>${state.replay?`<span class="replay-detail" aria-hidden="true">Target ${(state.replay.targetUnits/100).toFixed(2)}x · Result ${(state.replay.resultUnits/100).toFixed(2)}x</span>`:''}<span class="win-announcement">${tier.label}. ${title}. Payout ${money(state.payout)}.</span>`;
  $('.stage').append(message);
  celebrateWin();playWinSound(state.target*gameMode(state.modeId).boost);
 }
 if(!won){playEffect(stackBreakTrack);if(state.replay){message.classList.add('replay-loss');message.innerHTML=`<strong>STACK BROKE</strong><span class="replay-detail">Round #${state.replay.roundId} · Result ${(state.replay.resultUnits/100).toFixed(2)}x before target ${(state.replay.targetUnits/100).toFixed(2)}x</span>`;$('.stage').append(message);}}
 if(!state.replay){
  const snapshot=engine.enabled?engineSnapshot(engine.round):createReplaySnapshot({roundId:state.roundId,betCents:state.bet,targetUnits:effectiveUnits,resultUnits:multiplierUnits(at),payoutCents:state.payout,won,visualSeed:state.visualSeed,turbo:state.turbo,modeId:state.modeId,bonusTransitions:state.bonusTransitions});
  state.history.unshift(snapshot);state.history=state.history.slice(0,30);renderRoundHistory();
  if(engine.enabled)engine.round=null;
 }
 if(state.auto&&!state.replay){state.remaining--;const delta=state.balance-state.autoStart;if(state.remaining<=0||delta>=state.profit||delta<=-state.loss||state.balance<state.bet){state.auto=false;state.autoRound=0;state.autoTotal=0;}else nextRound=setTimeout(start,(won?winTiming(state.target*gameMode(state.modeId).boost).duration+400:1800)/presentationScale());}
 if(state.replay)renderDialogHistory();
 update();
}
function tick(now){
 if(state.phase!=='running')return;
 // Integrate stage speed from elapsed time so hidden-tab pauses cannot skip time.
 let seconds=Math.max(0,now-state.started-650/presentationScale())/1000;
 let next=1;
 for(const [ceiling,rate] of [[3,1],[7,1.35],[1000,1.75]]){
  const duration=Math.log(ceiling/next)/(state.speed*rate);
  if(seconds<duration){next*=Math.exp(seconds*state.speed*rate);break;}
  seconds-=duration;next=ceiling;
 }
 // Passing the prediction does not end the reveal or credit the balance.
 const result=resolveRound(next,state.breakAt,state.target);
 if(result){
  settle(state.replay?state.replay.won:result.won,state.replay?state.replay.resultUnits/100:result.at);return;
 }
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
action.onclick=()=>{
 if(engine.publicReplay){if(state.phase==='running'||!engineReplaySnapshot)return;if(state.replay)finishReplay();startReplay(engineReplaySnapshot);return;}
 state.replay?finishReplay():start();
};

function showEngineError(error){
 state.auto=false;clearTimeout(nextRound);engine.locked=true;
 engineNoticeText.textContent=error.message||'The game connection needs to be restored.';
 engineReconnect.hidden=false;engineNotice.hidden=false;update();
}

function engineSnapshot(round){
 return Object.freeze({version:2,roundId:state.roundId||1,betCents:round.amount/10000,targetUnits:round.outcome.targetUnits,resultUnits:round.outcome.resultUnits,payoutCents:round.payout/10000,won:round.payout>0,visualSeed:round.outcome.visualSeed,turbo:state.turbo,modeId:round.outcome.modeId,bonusTransitions:[],engine:round});
}

function revealEngineRound(round){
 clearTimeout(nextRound);clearCelebration();stopGameplaySounds();resetDebris();
 state.replay=null;state.bet=round.amount/10000;state.target=round.outcome.targetUnits/100;state.balance=engine.balance/10000;
 state.modeId=round.outcome.modeId;applyModeTheme();
 state.payout=0;state.multiplier=1;state.roundId=state.nextRoundId++;state.breakAt=round.outcome.resultUnits/100;
 state.visualSeed=round.outcome.visualSeed;state.bonusTransitions=[];state.engineSettled=false;state.engineSettling=false;
 $('#bet').value=amountText(round.amount);$('#prediction').value=state.target.toFixed(2);syncPredictionSlider();
 state.started=performance.now();state.speed=NORMAL_REVEAL_RATE*presentationScale();state.phase='running';state.bonus=0;
 clearPredictionCue();state.predictionReached=false;lastGrowthAt=state.started;
 playMusic();message.remove();message.classList.remove('broken','replay-loss');rebuild(1);tone(300);tick(state.started);update();
}

async function startEngineRound(){
 if(engine.locked||engine.busy||state.phase==='running'||state.replay||engine.publicReplay)return;
 $('#settingsDrawer').classList.remove('open','autoplay-open');if(gameInfoDialog.open)gameInfoDialog.close();
 const target=multiplierUnits(lockPrediction());
 try{targetMode(target,state.modeId);engine.validateAmount($('#bet').value);}catch(error){state.auto=false;update();reportInputError(SUPPORTED_TARGETS.includes(target)?'#bet':'#prediction',error.message);return;}
 if(state.auto&&!state.remaining){
  const rounds=Number($('#rounds').value),profit=Number($('#profit').value),loss=Number($('#loss').value);
  if(!Number.isInteger(rounds)||rounds<1||rounds>100||!Number.isFinite(profit)||profit<=0||!Number.isFinite(loss)||loss<=0){state.auto=false;update();reportInputError('#rounds','Set valid autoplay rounds and limits.');return;}
  state.remaining=rounds;state.autoTotal=rounds;state.autoStart=engine.balance/10000;state.profit=profit*100;state.loss=loss*100;
 }
 if(state.auto)state.autoRound=state.autoTotal-state.remaining+1;
 try{const pending=engine.play($('#bet').value,target,{modeId:state.modeId});update();revealEngineRound(await pending);}catch(error){showEngineError(error);}
}

async function bootstrapEngine(){
 if(!engine.enabled||engine.busy)return;
 engineNotice.hidden=true;engineReconnect.hidden=true;engine.locked=true;state.auto=false;clearTimeout(nextRound);update();
 try{
  if(engine.publicReplay){
   engineReplaySnapshot=engineSnapshot(await engine.loadReplay());
   $('#bet').value=amountText(engineReplaySnapshot.engine.amount);$('#prediction').value=(engineReplaySnapshot.targetUnits/100).toFixed(2);syncPredictionSlider();
  }else{
   const resumed=await engine.authenticate();
   state.balance=engine.balance/10000;state.engineSettling=false;
   const config=engine.config,input=$('#bet');
   input.min=amountText(config.minBet);input.max=amountText(config.maxBet);input.step=amountText(config.stepBet);
   input.value=amountText(config.defaultBetLevel&&config.betLevels.includes(config.defaultBetLevel)?config.defaultBetLevel:config.betLevels[0]);
   let list=$('#engineBetLevels');if(!list){list=document.createElement('datalist');list.id='engineBetLevels';input.after(list);input.setAttribute('list',list.id);}
   list.replaceChildren(...config.betLevels.map(value=>{const option=document.createElement('option');option.value=amountText(value);return option;}));
   $('.balance span').textContent=`BALANCE ${engine.currency}`;
   if(config.jurisdiction?.disabledTurbo)state.turbo=false;
   state.phase='idle';
   if(resumed)revealEngineRound(resumed);
  }
  update();
 }catch(error){showEngineError(error);}
}
let last=performance.now();
function animate(now){
 const dt=Math.min((now-last)/1000,.05);last=now;tick(now);
 const motionDt=dt*(state.phase==='running'?presentationScale():1);
 animateCelebration(now);
 const broken=state.phase==='broken';
 const moving=state.motion&&!reducedMotion.matches;
 if(broken&&moving){state.breakDelay=(state.breakDelay||0)+motionDt;if(state.breakDelay>=.22&&!debrisWorld)startDebris();if(debrisWorld)animateDebris(motionDt);}
 const palette=broken?4:state.phase==='won'?-1:state.bonus===4?2:state.bonus===3?4:state.bonus===2?3:state.bonus===1?2:-1;
 blocks.forEach((b,i)=>{
  b.visible=i<visibleCount;b.material=state.modeId==='classic'||broken?materials[palette<0?i%2:palette]:modeMaterials[state.modeId][i%2];
  const feature=b.userData.feature;
  if(moving&&state.modeId==='tesseract'){
   feature.children[1].rotation.y+=motionDt*.38;
   feature.children[1].rotation.x+=motionDt*.8;
  }
  if(moving&&state.modeId==='reactor')b.userData.reactorCore.rotation.y+=motionDt*1.2;
  feature.scale.setScalar(state.phase==='won'&&moving?1+Math.sin(Math.min(1,(now-state.ended)/650)*Math.PI)*.12:1);
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
   const oldAge=b.userData.landingAge;b.userData.landingAge+=motionDt;
   const t=Math.max(0,b.userData.landingAge);
   let offset=t<.36?1.8*(1-(t/.36)**2):t<.66?Math.sin((t-.36)/.3*Math.PI)*.14:0;
   b.position.y=b.userData.y+(moving?offset:0);
   b.position.x=moving?THREE.MathUtils.lerp(b.position.x,b.userData.x,Math.min(1,motionDt*12)):b.userData.x;
   if(b.visible&&moving&&oldAge<.36&&t>=.36){
    effects.pulse(b.material.color);
    effects.impact(.82+Math.min(.36,state.bonus*.09));
    blockLandingSound(i,state.multiplier);
   }
   b.scale.setScalar(1);
  }
 });
 if(moving&&(state.phase==='running'||document.body.classList.contains('intro-active')))turntable.rotation.y+=motionDt*(state.phase==='running'?.22:.12);
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
 const stageColor=state.phase==='won'?tierAccent[winTier(state.target*gameMode(state.modeId).boost).level]:state.modeId==='classic'?[0x66eaff,0xffc750,0xbc69ff,0xff6045,0xffe59b][state.bonus||0]:gameMode(state.modeId).colors[0];
 ring.material.color.lerp(new THREE.Color(broken?0xff515c:stageColor),Math.min(1,dt*4));
 effects.update(dt,moving,broken?0xff515c:stageColor,state.bonus,cameraHeight,state.phase==='running');
 $('.multiplier').style.color=broken?'#ff515c':state.phase==='won'?'#4cef97':'#e8faff';
 renderRulesScene(dt);
 renderer.render(scene,camera);dismissLoader();requestAnimationFrame(animate);
}
applyModeTheme();renderRoundHistory();rebuild(10);update();requestAnimationFrame(animate);
if(engine.enabled)bootstrapEngine();
