const WIN_TIERS = [
 { id:'standard', label:'Standard Win', min:1.01, level:0, count:16, countDuration:650, duration:1800, sound:'coin-chime' },
 { id:'stack', label:'Stack Bonus', min:1.5, level:1, count:30, countDuration:800, duration:2300, sound:'rising-pair' },
 { id:'double', label:'Double Stack', min:3, level:2, count:48, countDuration:1000, duration:2800, sound:'crystal-triad' },
 { id:'super', label:'Super Stack', min:7, level:3, count:72, countDuration:1200, duration:3400, sound:'power-rise' },
 { id:'legendary', label:'Legendary Stack', min:25, level:4, count:96, countDuration:1500, duration:4200, sound:'victory-fanfare' },
];

export function winTier(target) {
 const value=Number(target);
 return WIN_TIERS.reduce((selected,tier)=>value>=tier.min?tier:selected,WIN_TIERS[0]);
}

export function winTiming(target) {
 return { ...winTier(target) };
}

export function displayedPayout(payout, elapsed, duration, moving=true) {
 const t=moving?Math.min(1,Math.max(0,elapsed)/duration):1;
 return t===1?payout:Math.floor(payout*(1-(1-t)**3));
}

export function fountainParticle(index, elapsed, count=96, level=0) {
 const spread=((Math.floor(index/2)*7)%17)/16;
 const delay=Math.floor(index/2)/Math.max(1,count/2-1)*(level>=3?1.25:.95);
 const age=elapsed/1000-delay;
 const liveAge=Math.max(0,age);
 let x,z;
 if(level>=4){
  const angle=index*2.399963;
  const radius=2.55+spread*.35+liveAge*(.75+spread*.35);
  x=Math.cos(angle)*radius;z=Math.sin(angle)*radius;
 }else if(level>=3){
  const quadrant=index%4,side=quadrant<2?-1:1,depth=quadrant%2?-1:1;
  x=side*(2.5+spread*.25+liveAge*(.4+spread*.55));
  z=depth*(.45+spread*.45+liveAge*.2);
 }else{
  const side=index%2?1:-1;
  x=side*((level===0?2.15:2.55)+spread*.15+liveAge*(.25+spread*(.35+level*.18)));
  z=(spread-.5)*(.35+level*.12);
 }
 const lift=[5.8,6.8,7.8,8.7,9.5][level]||5.8;
 const gravity=[3.6,3.7,3.8,3.9,4][level]||3.6;
 const lifetime=[1.55,1.8,2.05,2.3,2.55][level]||1.55;
 return {
  x,
  y:-.2+(lift+spread*1.25)*liveAge-gravity*liveAge**2,
  z,
  scale:age<0?0:Math.min(1,age*14)*Math.max(0,Math.min(1,(lifetime-age)*2.8)),
  rotation:age*(2.1+level*.22)+index,
 };
}
