import test from 'node:test';
import assert from 'node:assert/strict';
import { winTiming, displayedPayout, fountainParticle } from './win-timing.mjs';

test('count-up is monotonic, bounded and finishes on exact cents',()=>{
 for(const target of [2.96,10,25]){
  const {countDuration}=winTiming(target);let previous=0;
  for(let time=0;time<4000;time+=16){
   const amount=displayedPayout(29600,time,countDuration);
   assert.ok(Number.isInteger(amount)&&amount>=previous&&amount<=29600);previous=amount;
  }
  assert.equal(previous,29600);
 }
});
test('reduced motion and suspended frames present the final amount',()=>{
 assert.equal(displayedPayout(29600,0,900,false),29600);
 assert.equal(displayedPayout(29600,60000,900),29600);
});
test('fountains stay outside the center and terminate with finite positions',()=>{
 for(let i=0;i<96;i++)for(let t=0;t<=4000;t+=40){
  const p=fountainParticle(i,t);
  assert.ok(Math.abs(p.x)>=2.7);
  assert.ok([p.x,p.y,p.z,p.scale,p.rotation].every(Number.isFinite));
  assert.ok(p.scale>=0&&p.scale<=1);
  if(t===4000)assert.equal(p.scale,0);
 }
 assert.deepEqual([2.96,10,25].map(t=>winTiming(t).count),[48,72,96]);
});
