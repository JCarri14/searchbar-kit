import type {SearchFilter,SearchQuery,FilterOperation,SearchRange} from './searchbar.core.types';
export const filterIdentity = (f: Pick<SearchFilter,'field'|'value'>) => JSON.stringify([f.field,f.value]);
export function setFilterState(query:SearchQuery,field:string,value:string,operation:FilterOperation|null):SearchQuery {
  const filters=query.filters.filter(f=>f.field!==field||f.value!==value);
  if(operation)filters.push({field,value,operation});
  return {...query,filters};
}
export function cycleFilterState(query:SearchQuery,field:string,value:string):SearchQuery {
  const previous=query.filters.find(f=>f.field===field&&f.value===value)?.operation;
  return setFilterState(query,field,value,previous==='include'?'exclude':previous==='exclude'?null:'include');
}
/** Replace/remove a numeric condition without touching discrete filters. */
export function setRangeState(query:SearchQuery, field:string, bounds:Pick<SearchRange,'min'|'max'>|null, operation:FilterOperation='include'):SearchQuery {
 const ranges=(query.ranges??[]).filter(r=>r.field!==field);
 if(bounds && (bounds.min!==undefined || bounds.max!==undefined)) {
  if(bounds.min!==undefined && (!Number.isFinite(bounds.min))) return query;
  if(bounds.max!==undefined && (!Number.isFinite(bounds.max))) return query;
  if(bounds.min!==undefined && bounds.max!==undefined && bounds.min>bounds.max) return query;
  ranges.push({field,...(bounds.min!==undefined?{min:bounds.min}:{}),...(bounds.max!==undefined?{max:bounds.max}:{}),operation});
 }
 const {ranges:ignored,...rest}=query;
 return ranges.length?{...rest,ranges}:{...rest};
}
export function normalizeQuery(query:SearchQuery):SearchQuery {
  const map=new Map<string,SearchFilter>();
  for(const filter of query.filters)map.set(filterIdentity(filter),filter);
  const ranges = new Map<string,SearchRange>();
  for(const range of query.ranges??[]) if((range.min!==undefined||range.max!==undefined)&& (range.min===undefined||Number.isFinite(range.min)) && (range.max===undefined||Number.isFinite(range.max)) && (range.min===undefined||range.max===undefined||range.min<=range.max)) ranges.set(range.field,range);
  const {ranges:ignored,...rest}=query;
  return {...rest,filters:[...map.values()],...(ranges.size?{ranges:[...ranges.values()]}:{})};
}
export function createEmptyQuery(sort?: SearchQuery['sort']):SearchQuery {return {query:'',mode:'all',filters:[],...(sort?{sort}:{})};}
