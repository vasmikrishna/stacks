import test from 'node:test';
import assert from 'node:assert/strict';
import { recentRows, resultColor } from './recent-results.js';

test('recent results keep newest-first order and semantic colors',()=>{
 const rows=recentRows([2.96,1.08,12.60,3.84,.73]);
 assert.deepEqual(rows.map(row=>row.label),['2.96x','1.08x','12.60x','3.84x','0.73x']);
 assert.deepEqual(rows.map(row=>row.color),['#64e58c','#9ba7b2','#ffda65','#64e58c','#ff6570']);
 assert.equal(rows.filter(row=>row.latest).length,1);
 assert.equal(rows[0].latest,true);
});

test('recent results are capped at five entries',()=>{
 assert.equal(recentRows([1,2,3,4,5,6]).length,5);
 assert.equal(resultColor(.99),'#ff6570');
 assert.equal(resultColor(1),'#9ba7b2');
 assert.equal(resultColor(2),'#64e58c');
 assert.equal(resultColor(10),'#ffda65');
});
