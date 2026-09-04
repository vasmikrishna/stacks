export function winTiming(target) {
 const tier=target>=25?2:target>=10?1:0;
 return { count:[48,72,96][tier], countDuration:[900,1200,1500][tier], duration:[3000,3300,3900][tier] };
}

export function displayedPayout(payout, elapsed, duration, moving=true) {
 const t=moving?Math.min(1,Math.max(0,elapsed)/duration):1;
 return t===1?payout:Math.floor(payout*(1-(1-t)**3));
}

export function fountainParticle(index, elapsed, count=96) {
 const side=index%2?1:-1;
 const spread=((Math.floor(index/2)*7)%17)/16;
 const delay=Math.floor(index/2)/Math.max(1,count/2-1)*1.1;
 const age=elapsed/1000-delay;
 return {
  x:side*(2.7+spread*.15+Math.max(0,age)*(.35+spread*.85)),
  y:-.2+(7.5+spread*1.4)*Math.max(0,age)-3.8*Math.max(0,age)**2,
  z:(spread-.5)*.6,
  scale:age<0?0:Math.min(1,age*14)*Math.max(0,Math.min(1,(2.3-age)*2.5)),
  rotation:age*2.4+index,
 };
}
