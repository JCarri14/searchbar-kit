import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyQuery,setRangeState,normalizeQuery} from './query-core.ts';
import {serializeSearchQuery,deserializeSearchQuery,reconcileQuery} from './url-state.ts';

test('numeric range supports inclusive and open-ended bounds and removal',()=>{
 const base=createEmptyQuery();
 const first=setRangeState(base,'year',{min:2010,max:2020},'include');
 assert.deepEqual(first.ranges,[{field:'year',min:2010,max:2020,operation:'include'}]);
 assert.deepEqual(setRangeState(first,'year',{min:2021},'exclude').ranges,[{field:'year',min:2021,operation:'exclude'}]);
 assert.equal(setRangeState(first,'year',null).ranges,undefined);
 assert.deepEqual(base,createEmptyQuery());
});
test('rejects inverted or non-finite range updates',()=>{
 const base=createEmptyQuery();
 assert.equal(setRangeState(base,'year',{min:2030,max:2020}),base);
 assert.equal(setRangeState(base,'year',{min:Infinity}),base);
});
test('numeric ranges round-trip through the versioned URL and existing queries remain compatible',()=>{
 const q=setRangeState(createEmptyQuery(),'chapters',{max:40},'exclude');
 assert.deepEqual(deserializeSearchQuery(serializeSearchQuery(q)),q);
 const old='{"version":1,"query":"","mode":"all","filters":[]}';
 assert.deepEqual(deserializeSearchQuery(old),createEmptyQuery());
});
test('tampered ranges are rejected and unknown restored ranges are dropped',()=>{
 const q=setRangeState(createEmptyQuery(),'year',{min:2015,max:2022});
 for(const bad of [{field:'year',min:2024,max:2020,operation:'include'},{field:'year',min:'2010',operation:'include'},{field:'year',operation:'include'}]){
  const payload=JSON.stringify({version:1,query:'',mode:'all',filters:[],ranges:[bad]});
  assert.equal(deserializeSearchQuery(payload),null);
 }
 assert.deepEqual(reconcileQuery(q,['type']).ranges,[]);
});
test('normalizeQuery deduplicates repeated ranges by field',()=>{
 const q={...createEmptyQuery(),ranges:[{field:'year',min:2010,operation:'include' as const},{field:'year',max:2025,operation:'exclude' as const}]};
 assert.deepEqual(normalizeQuery(q).ranges,[{field:'year',max:2025,operation:'exclude'}]);
});
