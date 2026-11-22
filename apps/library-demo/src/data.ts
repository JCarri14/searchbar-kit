import type {SearchBarConfig} from '@searchbarkit/react';
import type {SearchQuery,FilterOption} from '@searchbarkit/core';
const opts=(xs:string[]):FilterOption[]=>xs.map(label=>({label,value:label}));
// Illustrative values, NOT copied from ZonaTMO's unavailable dropdown data.
export const libraryConfig:SearchBarConfig={
 placeholder:'Nombre, autor, imagen visual o palabra clave...',
 columns:2,
 fieldOrder:['type','genre','status','year','tag','demography','chapters','sort'],
 fields:[
  {id:'type',label:'Tipo',icon:'layers',source:{kind:'local',options:opts(['Manga','Manhwa','Manhua','Doujinshi','Novela','One shot'])}},
  {id:'genre',label:'Género',icon:'sparkles',source:{kind:'local',options:opts(['Acción','Aventura','Fantasía','Romance','Drama','Misterio','Comedia','Deportes','Terror','Ciencia ficción'])}},
  {id:'year',label:'Año',selection:'multiple',source:{kind:'local',options:opts(['2026','2025','2024','2023','2022','2021','2020','2019','2018','2017','2016','2014','2013','2012','2011','2009','2008','2004','1998','1996'])}},
  {id:'status',label:'Estado',source:{kind:'local',options:opts(['En publicación','Completo','Pausado','Cancelado'])}},
  {id:'demography',label:'Demografía',source:{kind:'local',options:opts(['Shōnen','Shōjo','Seinen','Josei','Kodomo'])}},
  {id:'chaptersPreset',label:'Longitud',selection:'single',source:{kind:'local',options:[{value:'1',label:'≥ 1 capítulos'},{value:'10',label:'≥ 10 capítulos'},{value:'50',label:'≥ 50 capítulos'},{value:'100',label:'≥ 100 capítulos'},{value:'200',label:'≥ 200 capítulos'}]}},
  {id:'tag',label:'Etiquetas',icon:'tag',source:{kind:'local',options:opts(['Full color','Reencarnación','Sistema','Magia','Artes marciales','Viajes en el tiempo','Vida escolar','Superpoderes','Cultivo','Blanco y negro'])}},
 ],
 ranges:[],
 sorts:[{value:'updated',label:'Actualizado recientemente',direction:'desc'}, {value:'added',label:'Agregado recientemente',direction:'desc'}, {value:'title',label:'Nombre A–Z',direction:'asc'}, {value:'title-desc',label:'Nombre Z–A',direction:'desc'}, {value:'images',label:'Total de imágenes',direction:'desc'}, {value:'score',label:'Puntuación: de mayor a menor',direction:'desc'}, {value:'score-asc',label:'Puntuación: de menor a mayor',direction:'asc'}]
};
export type Book={id:number;title:string;author:string;type:string;genres:string[];status:string;demography:string;tags:string[];year:number;chapters:number;updated:number};
export const books:Book[]=[
 {id:1,title:'La torre del horizonte',author:'Kim Haneul',type:'Manhwa',genres:['Acción','Fantasía'],status:'Completo',demography:'Seinen',tags:['Full color','Sistema'],year:2019,chapters:164,updated:3},
 {id:2,title:'El jardín de las luciérnagas',author:'Yumi Nakamura',type:'Manga',genres:['Romance','Drama'],status:'Completo',demography:'Shōjo',tags:['Vida escolar','Blanco y negro'],year:2014,chapters:52,updated:4},
 {id:3,title:'Herederos del dragón',author:'Li Wei',type:'Manhua',genres:['Acción','Aventura','Fantasía'],status:'En publicación',demography:'Shōnen',tags:['Cultivo','Full color','Artes marciales'],year:2021,chapters:312,updated:12},
 {id:4,title:'Café de medianoche',author:'Aya Mori',type:'Manga',genres:['Comedia','Romance'],status:'En publicación',demography:'Josei',tags:['Vida escolar','Blanco y negro'],year:2023,chapters:27,updated:9},
 {id:5,title:'Reinicio del cazador',author:'Park Jiho',type:'Manhwa',genres:['Acción','Fantasía'],status:'En publicación',demography:'Shōnen',tags:['Sistema','Full color','Reencarnación'],year:2024,chapters:78,updated:11},
 {id:6,title:'Niebla sobre Kioto',author:'Haruto Sato',type:'Manga',genres:['Misterio','Drama'],status:'Completo',demography:'Seinen',tags:['Blanco y negro'],year:2008,chapters:41,updated:1},
 {id:7,title:'Órbita azul',author:'Naoko Hayashi',type:'Manga',genres:['Ciencia ficción','Aventura'],status:'Pausado',demography:'Shōnen',tags:['Viajes en el tiempo'],year:2017,chapters:116,updated:2},
 {id:8,title:'Flor de invierno',author:'Seo Min',type:'Manhwa',genres:['Romance','Fantasía'],status:'Completo',demography:'Josei',tags:['Full color','Reencarnación'],year:2020,chapters:96,updated:6},
 {id:9,title:'El puño del valle',author:'Zhang Rui',type:'Manhua',genres:['Acción','Deportes'],status:'En publicación',demography:'Shōnen',tags:['Artes marciales','Full color'],year:2022,chapters:149,updated:10},
 {id:10,title:'La última página',author:'Mika Tanaka',type:'One shot',genres:['Drama','Misterio'],status:'Completo',demography:'Seinen',tags:['Blanco y negro'],year:2004,chapters:1,updated:0},
 {id:11,title:'Academia de estrellas',author:'Choi Hana',type:'Manhwa',genres:['Fantasía','Comedia'],status:'En publicación',demography:'Shōjo',tags:['Magia','Full color','Vida escolar'],year:2025,chapters:22,updated:13},
 {id:12,title:'Crónicas del eco',author:'Lin Fang',type:'Manhua',genres:['Terror','Misterio'],status:'Cancelado',demography:'Seinen',tags:['Full color'],year:2016,chapters:63,updated:2},
 {id:13,title:'Campeones del amanecer',author:'Kenji Iwasaki',type:'Manga',genres:['Deportes','Drama'],status:'Completo',demography:'Shōnen',tags:['Blanco y negro'],year:1998,chapters:221,updated:1},
 {id:14,title:'La biblioteca imposible',author:'Han Minseo',type:'Manhwa',genres:['Fantasía','Aventura'],status:'En publicación',demography:'Josei',tags:['Sistema','Magia','Full color'],year:2026,chapters:12,updated:14},
 {id:15,title:'Luz en el bosque',author:'Rin Kobayashi',type:'Doujinshi',genres:['Aventura','Comedia'],status:'Completo',demography:'Kodomo',tags:['Blanco y negro'],year:2012,chapters:9,updated:3},
 {id:16,title:'El tiempo en nuestras manos',author:'Mei Chen',type:'Novela',genres:['Romance','Ciencia ficción'],status:'En publicación',demography:'Josei',tags:['Viajes en el tiempo','Reencarnación'],year:2022,chapters:184,updated:8}
];
/** Example consumer-side interpretation: OR for single-valued fields, AND for multi-valued when mode=all. */
export function queryLibrary(q:SearchQuery):Book[]{
 const get=(b:Book,field:string):string|string[]|undefined=>{const fields:Record<string,string|string[]>={type:b.type,genre:b.genres,status:b.status,tag:b.tags,demography:b.demography,year:String(b.year),chaptersPreset:String(b.chapters)};return fields[field]};
 const matches=(b:Book,f:SearchQuery['filters'][number])=>{if(f.field==='chaptersPreset')return b.chapters>=Number(f.value);const val=get(b,f.field);return Array.isArray(val)?val.includes(f.value):val===f.value};
 const singleton=new Set(['type','status','demography','year','chaptersPreset']);
 const items=books.filter(b=>{
  const text=q.query.trim().toLocaleLowerCase();
  if(text && !`${b.title} ${b.author}`.toLocaleLowerCase().includes(text))return false;
  const yes=q.filters.filter(f=>f.operation==='include');
  const no=q.filters.filter(f=>f.operation==='exclude');
  if(no.some(f=>matches(b,f)))return false;
  const grouped=new Map<string,typeof yes>();
  for(const f of yes)grouped.set(f.field,[...(grouped.get(f.field)??[]),f]);
  const groups=[...grouped.entries()].map(([field,fs])=>singleton.has(field)?fs.some(f=>matches(b,f)):(q.mode==='all'?fs.every(f=>matches(b,f)):fs.some(f=>matches(b,f))));
  const rangeMatches=(r:NonNullable<SearchQuery['ranges']>[number])=>{const n=r.field==='year'?b.year:r.field==='chapters'?b.chapters:NaN;return Number.isFinite(n)&&(r.min===undefined||n>=r.min)&&(r.max===undefined||n<=r.max)};
  const ranges=q.ranges??[];
  if(ranges.some(r=>r.operation==='exclude'&&rangeMatches(r)))return false;
  const includedRanges=ranges.filter(r=>r.operation==='include').map(rangeMatches);
  const conditions=[...groups,...includedRanges];
  return q.mode==='all'?conditions.every(Boolean):!conditions.length||conditions.some(Boolean);
 });
 const field=q.sort?.field??'updated';const dir=q.sort?.direction==='asc'?1:-1;
 return items.sort((a,b)=>{if(field==='title'||field==='title-desc')return a.title.localeCompare(b.title,'es')*dir;const metric=(x:Book)=>field==='added'?x.id:field==='images'?x.chapters*12+x.id*7:field==='score'||field==='score-asc'?(x.id*17%49)/10+5:x.updated;return (metric(a)-metric(b))*dir});
}
