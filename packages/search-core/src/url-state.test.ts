import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyQuery,setFilterState} from './query-core.ts';
import {serializeSearchQuery,deserializeSearchQuery,readSearchFromParams,writeSearchToParams,reconcileQuery} from './url-state.ts';

test('round trip: includes, excludes, text, mode and sort', () => {
  let q = createEmptyQuery({field:'updated',direction:'desc'});
  q = setFilterState(q,'genre','action','include');
  q = setFilterState(q,'tag','full-color','exclude');
  q = {...q,query:'pika & test',mode:'any'};
  assert.deepEqual(deserializeSearchQuery(serializeSearchQuery(q)),q);
  const params = writeSearchToParams(new URLSearchParams('ref=app'), q);
  assert.equal(params.get('ref'),'app');
  assert.deepEqual(readSearchFromParams(params),q);
});
test('invalid URL values cannot execute or silently create arbitrary conditions', () => {
  for (const input of ['garbage','{"version":2}', '{"version":1,"query":"","mode":"all","filters":[{"field":"x","value":"y","operation":"evil"}]}', 'x'.repeat(9000)])
    assert.equal(deserializeSearchQuery(input),null);
});
test('restore only known filter field names', () => {
  const q=setFilterState(setFilterState(createEmptyQuery(),'type','fire','include'),'obsolete','x','exclude');
  assert.deepEqual(reconcileQuery(q,['type']).filters,[{field:'type',value:'fire',operation:'include'}]);
});
