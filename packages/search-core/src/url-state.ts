import type { SearchQuery, SearchFilter, SearchRange } from './types';
import { createEmptyQuery, normalizeQuery } from './query-core.ts';

/** Versioned and router-independent URL persistence. The caller owns pushState/replaceState. */
export const SEARCH_PARAM = 'search';
const VERSION = 1;
const MAX_SERIALIZED_LENGTH = 8192;
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const validString = (v: unknown, max = 250) => typeof v === 'string' && v.length > 0 && v.length <= max;

export function serializeSearchQuery(query: SearchQuery): string {
  const normalized = normalizeQuery(query);
  return JSON.stringify({ version: VERSION, query: normalized.query, mode: normalized.mode,
    filters: normalized.filters, ...(normalized.ranges?.length ? {ranges:normalized.ranges} : {}), ...(normalized.sort ? { sort: normalized.sort } : {}) });
}

/** Returns null rather than throwing on old, malformed or tampered query strings. */
export function deserializeSearchQuery(serialized: string | null | undefined): SearchQuery | null {
  if (!serialized || serialized.length > MAX_SERIALIZED_LENGTH) return null;
  try {
    const data: unknown = JSON.parse(serialized);
    if (!isRecord(data) || data.version !== VERSION || typeof data.query !== 'string' || data.query.length > 2000 ||
        (data.mode !== 'all' && data.mode !== 'any') || !Array.isArray(data.filters) || data.filters.length > 100) return null;
    const filters: SearchFilter[] = [];
    for (const f of data.filters) {
      if (!isRecord(f) || !validString(f.field, 100) || !validString(f.value, 250) ||
          (f.operation !== 'include' && f.operation !== 'exclude')) return null;
      filters.push({ field: f.field as string, value: f.value as string, operation: f.operation });
    }
    let ranges:SearchRange[]|undefined;
    if(data.ranges!==undefined){
      if(!Array.isArray(data.ranges)||data.ranges.length>40) return null;
      ranges=[];
      for(const r of data.ranges){
        if(!isRecord(r)||!validString(r.field,100)||(r.operation!=='include'&&r.operation!=='exclude') ||
          (r.min===undefined&&r.max===undefined) ||
          (r.min!==undefined&&(typeof r.min!=='number'||!Number.isFinite(r.min))) ||
          (r.max!==undefined&&(typeof r.max!=='number'||!Number.isFinite(r.max))) ||
          (typeof r.min==='number'&&typeof r.max==='number'&&r.min>r.max)) return null;
        ranges.push({field:r.field as string,...(r.min!==undefined?{min:r.min as number}:{}),...(r.max!==undefined?{max:r.max as number}:{}),operation:r.operation});
      }
    }
    let sort: SearchQuery['sort'];
    if (data.sort !== undefined) {
      if (!isRecord(data.sort) || !validString(data.sort.field, 100) ||
          (data.sort.direction !== 'asc' && data.sort.direction !== 'desc')) return null;
      sort = { field: data.sort.field as string, direction: data.sort.direction };
    }
    return normalizeQuery({ query: data.query, mode: data.mode, filters, ...(ranges?.length?{ranges}:{}), ...(sort ? {sort} : {}) });
  } catch { return null; }
}

/** Put the value into URLSearchParams. No browser history operations are performed. */
export function writeSearchToParams(params: URLSearchParams, query: SearchQuery): URLSearchParams {
  const copy = new URLSearchParams(params);
  const isEmpty = !query.query && !query.filters.length && !query.ranges?.length && query.mode === 'all' && !query.sort;
  if (isEmpty) copy.delete(SEARCH_PARAM);
  else copy.set(SEARCH_PARAM, serializeSearchQuery(query));
  return copy;
}
export function readSearchFromParams(params: URLSearchParams): SearchQuery | null {
  return deserializeSearchQuery(params.get(SEARCH_PARAM));
}

/** Drop filter values unknown to the UI config (useful after restoring a URL). */
export function reconcileQuery(query: SearchQuery | null, validFields: Iterable<string>, defaultQuery = createEmptyQuery()): SearchQuery {
  if (!query) return defaultQuery;
  const allowed = new Set(validFields);
  return {...query, filters: query.filters.filter(f => allowed.has(f.field)), ...(query.ranges?.length?{ranges:query.ranges.filter(r=>allowed.has(r.field))}:{})};
}
