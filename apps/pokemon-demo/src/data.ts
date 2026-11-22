import type {FilterOption,OptionsDataSource,SearchQuery} from '@searchbarkit/core';
import type {SearchBarConfig} from '@searchbarkit/react';
const ROOT='https://pokeapi.co/api/v2';
type Named={name:string;url:string};
export interface PokemonItem {id:number;name:string;image:string|null;types:string[];abilities:string[];height:number;weight:number}
const pretty=(name:string)=>name.replace(/-/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase());
async function getJSON<T>(url:string, signal?:AbortSignal):Promise<T>{
  const response=await fetch(url,{signal});
  if(!response.ok)throw new Error(`PokéAPI HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
export function pokeResourceSource(resource:'type'|'ability',pageSize=20):OptionsDataSource {
  let cached:FilterOption[]|undefined;
  let running:Promise<FilterOption[]>|undefined;
  const getAll=async(signal?:AbortSignal)=>{
    if(cached)return cached;
    // PokéAPI's resource list is paginated, but the search endpoint does not support
    // substring queries. Fetch the small metadata index once; paginate locally.
    if(!running)running=getJSON<{results:Named[]}>(`${ROOT}/${resource}?limit=1000`,signal).then(v=>v.results.map(o=>({value:o.name,label:pretty(o.name)}))).catch(err=>{running=undefined;throw err});
    cached=await running;return cached;
  };
  return {
    async search({search,cursor,signal}){
      const options=(await getAll(signal)).filter(v=>v.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
      const offset=Math.max(0,Number(cursor)||0);
      return {options:options.slice(offset,offset+pageSize),nextCursor:offset+pageSize<options.length?String(offset+pageSize):null};
    },
    async resolve({values,signal}){const all=await getAll(signal);return all.filter(o=>values.includes(o.value));}
  };
}
const typeSource=pokeResourceSource('type');
const abilitySource=pokeResourceSource('ability');
export const pokemonConfig:SearchBarConfig={
  placeholder:'Pokémon, tipo o habilidad...',
  fields:[
    {id:'type',label:'Tipo',icon:'layers',source:{kind:'remote',provider:typeSource}},
    {id:'ability',label:'Habilidad',icon:'sparkles',source:{kind:'remote',provider:abilitySource}}
  ],
  sorts:[
    {value:'id',label:'Número de Pokédex',direction:'asc'},
    {value:'name',label:'Nombre A-Z',direction:'asc'},
    {value:'height',label:'Altura (mayor)',direction:'desc'}
  ]
};
type Detail={id:number;name:string;sprites:{front_default:string|null;other?:{'official-artwork'?:{front_default:string|null}}};types:Array<{type:Named}>;abilities:Array<{ability:Named}>;height:number;weight:number};
async function mapDetail(n:Named,signal?:AbortSignal):Promise<PokemonItem>{
  const data=await getJSON<Detail>(n.url,signal);
  return {id:data.id,name:pretty(data.name),image:data.sprites.other?.['official-artwork']?.front_default??data.sprites.front_default,
    types:data.types.map(x=>x.type.name),abilities:data.abilities.map(x=>x.ability.name),height:data.height,weight:data.weight};
}
/** Fetches an explicit page and only its Pokémon detail records; no full-catalog scan. */
export async function fetchPokemonPage(offset:number,limit=24,signal?:AbortSignal):Promise<{items:PokemonItem[];hasMore:boolean}>{
  const page=await getJSON<{count:number;results:Named[]}>(`${ROOT}/pokemon?limit=${limit}&offset=${offset}`,signal);
  // Six concurrent requests at most to avoid hammering the public API.
  const items:PokemonItem[]=[];
  for(let i=0;i<page.results.length;i+=6){
    const chunk=await Promise.all(page.results.slice(i,i+6).map(x=>mapDetail(x,signal)));
    items.push(...chunk);
  }
  return {items,hasMore:offset+limit<page.count};
}
/** Demo adapter only. No interpretation of this domain exists in SearchBar. */
export function searchPokemon(items:PokemonItem[],q:SearchQuery):PokemonItem[]{
  const included=q.filters.filter(x=>x.operation==='include');
  const excluded=q.filters.filter(x=>x.operation==='exclude');
  const contains=(item:PokemonItem,f:SearchQuery['filters'][number])=>
    (f.field==='type'?item.types:f.field==='ability'?item.abilities:[]).includes(f.value);
  const byField=new Map<string,typeof included>();
  included.forEach(x=>byField.set(x.field,[...(byField.get(x.field)||[]),x]));
  return items.filter(p=>{
    const conditions=[...byField].map(([,filters])=>filters.some(f=>contains(p,f)));
    const accepted=!conditions.length||(q.mode==='all'?conditions.every(Boolean):conditions.some(Boolean));
    return accepted&&excluded.every(f=>!contains(p,f))&&p.name.toLowerCase().includes(q.query.toLowerCase().trim());
  }).sort((a,b)=>q.sort?.field==='name'?a.name.localeCompare(b.name):q.sort?.field==='height'?b.height-a.height:a.id-b.id);
}
