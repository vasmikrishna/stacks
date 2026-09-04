import test from 'node:test';
import assert from 'node:assert/strict';
import { winTier, winTiming, displayedPayout, fountainParticle } from './win-timing.mjs';

test('paid multipliers select five distinct celebration and sound tiers',()=>{
 const targets=[1.2,1.5,3,7,25];
 const tiers=targets.map(winTier);
 assert.deepEqual(tiers.map(tier=>tier.id),['standard','stack','double','super','legendary']);
 assert.equal(new Set(tiers.map(tier=>tier.sound)).size,5);
 assert.deepEqual([1.49,1.5,2.99,3,6.99,7,24.99,25].map(value=>winTier(value).id),['standard','stack','stack','double','double','super','super','legendary']);
});

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
test('tiered fountains stay outside the tower and terminate with finite positions',()=>{
 for(let level=0;level<5;level++)for(let i=0;i<96;i++)for(let t=0;t<=4500;t+=50){
  const p=fountainParticle(i,t,96,level);
  assert.ok(Math.hypot(p.x,p.z)>=2.1);
  assert.ok([p.x,p.y,p.z,p.scale,p.rotation].every(Number.isFinite));
  assert.ok(p.scale>=0&&p.scale<=1);
  if(t===4500)assert.equal(p.scale,0);
 }
 assert.deepEqual([1.2,1.5,3,7,25].map(t=>winTiming(t).count),[16,30,48,72,96]);
});
