import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyQuery,normalizeQuery,setFilterState,setRangeState} from './query-core.ts';
import {deserializeSearchQuery,serializeSearchQuery,reconcileQuery,writeSearchToParams} from './url-state.ts';

test('deduplicates filters without changing their final operation',()=>{
 const query={...createEmptyQuery(),filters:[{field:'genre',value:'action',operation:'include' as const},{field:'genre',value:'action',operation:'exclude' as const}]};
 assert.deepEqual(normalizeQuery(query).filters,[{field:'genre',value:'action',operation:'exclude'}]);
});
test('rejects invalid numeric ranges without altering existing query',()=>{
 const query=setRangeState(createEmptyQuery(),'year',{min:1990,max:2020});
 assert.equal(setRangeState(query,'year',{min:2025,max:2000}),query);
 assert.equal(setRangeState(query,'year',{min:NaN}),query);
});
test('URL parser rejects non-finite, reversed and oversized ranges',()=>{
 const base={version:1,query:'',mode:'all',filters:[]};
 for(const ranges of [[{field:'year',min:2020,max:1990,operation:'include'}],[{field:'year',min:1,operation:'unknown'}],Array.from({length:41},()=>({field:'year',min:1,operation:'include'}))]){
  assert.equal(deserializeSearchQuery(JSON.stringify({...base,ranges})),null);
 }
});
test('URL serialization is stable and preserves unrelated parameters',()=>{
 const q=setFilterState(createEmptyQuery(),'genre','action','include');
 const serialized=serializeSearchQuery(q);
 assert.equal(serializeSearchQuery(deserializeSearchQuery(serialized)!),serialized);
 assert.equal(writeSearchToParams(new URLSearchParams('page=5&ref=demo'),q).get('ref'),'demo');
});
test('reconciliation removes unknown ranges as well as filters',()=>{
 const q=setRangeState(setFilterState(createEmptyQuery(),'old','a','include'),'year',{min:2010});
 const actual=reconcileQuery(q,['year']);
 assert.deepEqual(actual.filters,[]);
 assert.deepEqual(actual.ranges,[{field:'year',min:2010,operation:'include'}]);
});
