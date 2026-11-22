import type {SearchBarConfig} from '@searchbarkit/react';
import type {SearchQuery,FilterOption,OptionsDataSource} from '@searchbarkit/core';
const options=(values:string[]):FilterOption[]=>values.map(v=>({value:v,label:v}));
const wait=(ms:number,signal?:AbortSignal)=>new Promise<void>((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('Aborted','AbortError'));return}const timer=setTimeout(resolve,ms);signal?.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'))},{once:true})});
function remote(values:string[]):OptionsDataSource {
 const all=options(values);
 return {
  async search({search,cursor,signal}){await wait(170,signal);const found=all.filter(o=>o.label.toLowerCase().includes(search.toLowerCase()));const start=Number(cursor)||0;return {options:found.slice(start,start+5),nextCursor:start+5<found.length?String(start+5):null}},
  async resolve({values,signal}){await wait(70,signal);return all.filter(o=>values.includes(o.value))}
 };
}
export type Catalog='manga';
export const mangaConfig:SearchBarConfig={placeholder:'Título, autor, género, idioma o etiqueta...',fields:[
  {id:'type',icon:'layers',label:'Tipo',source:{kind:'local',options:options(['Manga','Manhua','Manhwa'])}},
  {id:'genre',icon:'sparkles',label:'Género',source:{kind:'local',options:options(['Acción','Fantasía','Romance','Aventura','Deportes','Drama','Terror'])}},
  {id:'language',icon:'languages',label:'Idioma',source:{kind:'local',options:options(['English','Japanese','Chinese','Español'])}},
  {id:'status',icon:'info',label:'Estado',source:{kind:'local',options:options(['En publicación','Completo'])}},
  {id:'tag',icon:'tag',label:'Etiqueta',source:{kind:'remote',provider:remote(['Full color','Reencarnación','Sistema','Cultivo','Misterio','Piratas','Blanco y negro','Deportes','Videojuegos','Magia','Artes marciales','Regresión','Superpoderes'])}}
 ],ranges:[{id:'rating',label:'Valoración',min:0,max:10,step:0.1,placeholderMin:'Desde',placeholderMax:'Hasta'}],sorts:[{value:'updated',label:'Actualizado recientemente',direction:'desc'},{value:'title',label:'Título A–Z',direction:'asc'},{value:'rating',label:'Mejor valorados',direction:'desc'}]};
export interface CatalogItem {title:string;author:string;type?:string;genres?:string[];language?:string;status?:string;tags?:string[];category?:string;brand?:string;availability?:string;features?:string[];rating:number;updated:number}
const manga:CatalogItem[]=[
 {title:'Solo Leveling',author:'Chugong',type:'Manhwa',genres:['Acción','Fantasía'],language:'English',status:'Completo',tags:['Full color','Sistema'],rating:9.6,updated:9},
 {title:'One Piece',author:'Eiichiro Oda',type:'Manga',genres:['Acción','Aventura'],language:'Japanese',status:'En publicación',tags:['Blanco y negro','Piratas'],rating:9.7,updated:8},
 {title:'Omniscient Reader',author:'singNsong',type:'Manhwa',genres:['Acción','Fantasía'],language:'English',status:'En publicación',tags:['Full color','Aventura'],rating:9.5,updated:10},
 {title:'Tower of God',author:'SIU',type:'Manhwa',genres:['Fantasía','Aventura'],language:'English',status:'En publicación',tags:['Full color','Misterio'],rating:9,updated:7},
 {title:'Battle Through the Heavens',author:'Tian Can Tu Dou',type:'Manhua',genres:['Acción','Fantasía'],language:'English',status:'En publicación',tags:['Full color','Cultivo'],rating:8.7,updated:6},
 {title:'Villains Are Destined to Die',author:'Gwon Gyeoeul',type:'Manhwa',genres:['Romance','Fantasía'],language:'English',status:'En publicación',tags:['Full color','Reencarnación'],rating:9.1,updated:5}
];
// Example backend adapter. The SearchBar never imports this function or these semantics.
export function searchCatalog(q:SearchQuery):CatalogItem[]{
 const items=manga;
 const single=new Set(['type','language','status']);
 const get=(item:CatalogItem,field:string):string|string[]|undefined=>{
  const key:Record<string,keyof CatalogItem>={genre:'genres',tag:'tags',feature:'features'};
  const data=item[key[field]??field as keyof CatalogItem];
  return typeof data==='string'||Array.isArray(data)?data:undefined;
 };
 const satisfies=(item:CatalogItem,field:string,v:string)=>{const data=get(item,field);return Array.isArray(data)?data.includes(v):data===v};
 return items.filter(item=>{
  const included=q.filters.filter(f=>f.operation==='include');
  const excluded=q.filters.filter(f=>f.operation==='exclude');
  const byField=new Map<string,typeof included>();
  for(const f of included)byField.set(f.field,[...(byField.get(f.field)||[]),f]);
  const conditions=[...byField].flatMap(([field,filters])=>single.has(field)?[filters.some(f=>satisfies(item,field,f.value))]:filters.map(f=>satisfies(item,field,f.value)));
  const accepted=!conditions.length||(q.mode==='all'?conditions.every(Boolean):conditions.some(Boolean));
  const rangeMatches=(r:NonNullable<SearchQuery['ranges']>[number])=>r.field==='rating'&&(r.min===undefined||item.rating>=r.min)&&(r.max===undefined||item.rating<=r.max);
  const ranges=q.ranges??[];
  const includedRanges=ranges.filter(r=>r.operation==='include');
  const excludedRanges=ranges.filter(r=>r.operation==='exclude');
  const rangeAccepted=excludedRanges.every(r=>!rangeMatches(r))&&includedRanges.every(rangeMatches);
  const text=[item.title,item.author].join(' ').toLowerCase();
  return accepted&&rangeAccepted&&excluded.every(f=>!satisfies(item,f.field,f.value))&&text.includes(q.query.trim().toLowerCase());
 }).sort((a,b)=>q.sort?.field==='title'?a.title.localeCompare(b.title):q.sort?.field==='rating'?b.rating-a.rating:b.updated-a.updated);
}
