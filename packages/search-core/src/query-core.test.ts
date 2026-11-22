import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyQuery,cycleFilterState,setFilterState,normalizeQuery} from './query-core.ts';
test('ciclo neutral → incluir → excluir → neutral',()=>{
 let q=createEmptyQuery();q=cycleFilterState(q,'genre','action');assert.equal(q.filters[0].operation,'include');
 q=cycleFilterState(q,'genre','action');assert.equal(q.filters[0].operation,'exclude');
 q=cycleFilterState(q,'genre','action');assert.equal(q.filters.length,0);
});
test('no cambia otros filtros y normaliza duplicados',()=>{
 let q=createEmptyQuery();q=setFilterState(q,'type','manga','include');q=setFilterState(q,'genre','action','exclude');
 q=setFilterState(q,'type','manga',null);assert.deepEqual(q.filters,[{field:'genre',value:'action',operation:'exclude'}]);
 assert.equal(normalizeQuery({...q,filters:[...q.filters,...q.filters]}).filters.length,1);
});
