/** Portable, JSON-only design format. Functions/providers stay in the consumer. */
export type BuilderVariant='simple'|'filtered'|'advanced';
export type ThemeMode='dark'|'light'|'custom';
export type Density='compact'|'normal'|'comfortable';
export interface BuilderOption {value:string;label:string}
export interface BuilderField {id:string;label:string;type:'single'|'multiple'|'range';searchable?:boolean;options?:BuilderOption[];min?:number;max?:number;step?:number;unit?:string}
export interface BuilderSort {value:string;label:string;direction:'asc'|'desc'}
export type ThemeColorKey='primary'|'secondary'|'accent'|'success'|'danger'|'warning'|'info'|'background'|'surface'|'elevated'|'control'|'popover'|'text'|'muted'|'placeholder'|'border'|'borderStrong'|'focus'|'onPrimary'|'selected'|'hover'|'disabled';
export type ThemePalette=Partial<Record<ThemeColorKey,string>>;
export interface BuilderTheme {mode:ThemeMode;accent:string;radius:number;density:Density;border?:string;surface?:string;text?:string;muted?:string;control?:string;palette?:ThemePalette;base?:'light'|'dark'}
export const themeKeys:ThemeColorKey[]=['primary','secondary','accent','success','danger','warning','info','background','surface','elevated','control','popover','text','muted','placeholder','border','borderStrong','focus','onPrimary','selected','hover','disabled'];
export const themeDefaults:Record<'dark'|'light',Record<ThemeColorKey,string>>={
 dark:{primary:'#3478e7',secondary:'#64748b',accent:'#3478e7',success:'#2c9b81',danger:'#b96572',warning:'#e0a545',info:'#4d9deb',background:'#101722',surface:'#151e2c',elevated:'#1b283b',control:'#151f2f',popover:'#141e2d',text:'#edf3fd',muted:'#a1b2cb',placeholder:'#8da2c0',border:'#33435d',borderStrong:'#445773',focus:'#82aeff',onPrimary:'#ffffff',selected:'#1c2e4d',hover:'#29426b',disabled:'#68768d'},
 light:{primary:'#2563eb',secondary:'#64748b',accent:'#2563eb',success:'#168065',danger:'#b84250',warning:'#b47616',info:'#2563eb',background:'#f8fafc',surface:'#ffffff',elevated:'#f1f5f9',control:'#f8fafc',popover:'#ffffff',text:'#17283f',muted:'#566b85',placeholder:'#64748b',border:'#d5deeb',borderStrong:'#b6c8df',focus:'#2563eb',onPrimary:'#ffffff',selected:'#e8f0ff',hover:'#dbeafe',disabled:'#94a3b8'}
};
export function resolvedTheme(t:BuilderTheme):Record<ThemeColorKey,string>{
 const base=t.mode==='custom'?(t.base??'dark'):t.mode;
 return {...themeDefaults[base],...(t.palette??{}),accent:t.palette?.accent??t.accent,primary:t.palette?.primary??t.accent,...(t.border?{border:t.border}:{}),...(t.surface?{surface:t.surface}:{}),...(t.control?{control:t.control}:{}),...(t.text?{text:t.text}:{}),...(t.muted?{muted:t.muted}:{})};
}
const cssTokens:Record<ThemeColorKey,string>={primary:'--gs-primary',secondary:'--gs-secondary',accent:'--gs-accent',success:'--gs-include',danger:'--gs-exclude',warning:'--gs-warning',info:'--gs-info',background:'--gs-bg',surface:'--gs-surface',elevated:'--gs-elevated',control:'--gs-control',popover:'--gs-popover',text:'--gs-text',muted:'--gs-muted',placeholder:'--gs-placeholder',border:'--gs-border',borderStrong:'--gs-border-strong',focus:'--gs-focus',onPrimary:'--gs-on-accent',selected:'--gs-accent-soft',hover:'--gs-accent-hover',disabled:'--gs-disabled'};
export function themeVariables(theme:BuilderTheme):Record<string,string>{
 const palette=resolvedTheme(theme);
 const vars:Record<string,string>={};
 for(const key of themeKeys)vars[cssTokens[key]]=palette[key];
 vars['--gs-radius']=`${theme.radius}px`;
 vars['--gs-padding']=`${theme.density==='compact'?12:theme.density==='comfortable'?24:18}px`;
 return vars;
}
export function parsePalette(input:unknown,base:BuilderTheme):BuilderTheme{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('La paleta debe ser un objeto JSON');
 const obj=input as Record<string,unknown>;
 const colors=(obj.colors??obj.palette??obj) as Record<string,unknown>;
 if(!colors||typeof colors!=='object'||Array.isArray(colors))throw Error('La paleta necesita un objeto colors');
 const next:ThemePalette={};
 for(const [key,val] of Object.entries(colors)){
  if(!themeKeys.includes(key as ThemeColorKey))throw Error(`Color desconocido: ${key}`);
  if(typeof val!=='string'||!/^#[0-9a-fA-F]{6}$/.test(val))throw Error(`Color inválido: ${key} (usa #RRGGBB)`);
  next[key as ThemeColorKey]=val;
 }
 if(!Object.keys(next).length)throw Error('No hay colores reconocidos');
 return {...base,mode:'custom',base:obj.base==='light'?'light':obj.base==='dark'?'dark':(base.mode==='light'?'light':base.base??'dark'),palette:{...base.palette,...next},accent:next.accent??next.primary??base.accent};
}
export function exportPalette(theme:BuilderTheme){return JSON.stringify({name:'Mi paleta',base:theme.mode==='custom'?(theme.base??'dark'):theme.mode,colors:resolvedTheme(theme)},null,2);}

export interface BuilderProject {
 version:1;name:string;variant:BuilderVariant;
 theme:BuilderTheme;
 search:{placeholder:string};
 layout:{columns:2|3};
 fields:BuilderField[];
 sorts:BuilderSort[];
}
export type BuilderIssue={path:string;message:string};
const idRe=/^[a-zA-Z][\w-]*$/;
const colorRe=/^#[0-9a-fA-F]{6}$/;
export function validateProject(project:BuilderProject):BuilderIssue[]{
 const issues:BuilderIssue[]=[];
 const issue=(path:string,message:string)=>issues.push({path,message});
 if(project.version!==1)issue('version','Versión de configuración no compatible');
 if(!project.name?.trim())issue('name','Escribe un nombre para el proyecto');
 if(!['simple','filtered','advanced'].includes(project.variant))issue('variant','Variante desconocida');
 if(!['dark','light','custom'].includes(project.theme?.mode))issue('theme.mode','Tema no válido');
 if(!colorRe.test(project.theme?.accent??''))issue('theme.accent','El color debe tener formato #RRGGBB');
 for(const key of ['border','surface','text','muted','control'] as const){const val=project.theme?.[key];if(val&&!colorRe.test(val))issue(`theme.${key}`,'Usa un color #RRGGBB');}
 if(project.theme?.base&&!['dark','light'].includes(project.theme.base))issue('theme.base','Base no válida');
 for(const [key,val] of Object.entries(project.theme?.palette??{})){
  if(!themeKeys.includes(key as ThemeColorKey))issue(`theme.palette.${key}`,'Token desconocido');
  if(!colorRe.test(val))issue(`theme.palette.${key}`,'Usa #RRGGBB');
 }
 if(!Number.isFinite(project.theme?.radius)||project.theme.radius<0||project.theme.radius>32)issue('theme.radius','El radio debe estar entre 0 y 32 px');
 if(!['compact','normal','comfortable'].includes(project.theme?.density))issue('theme.density','Densidad no válida');
 if(![2,3].includes(project.layout?.columns))issue('layout.columns','Elige 2 o 3 columnas');
 const seen=new Set<string>();
 for(const [i,f] of (project.fields??[]).entries()){
  const path=`fields[${i}]`;
  if(!idRe.test(f.id))issue(`${path}.id`,'Identificador obligatorio: letras, números, guiones o _; comienza con letra');
  if(seen.has(f.id))issue(`${path}.id`,'El identificador ya está utilizado');
  seen.add(f.id);
  if(!f.label?.trim())issue(`${path}.label`,'El campo necesita una etiqueta');
  if(!['single','multiple','range'].includes(f.type))issue(`${path}.type`,'Tipo de campo desconocido');
  if(f.type==='range'){
   if(f.min!==undefined&&!Number.isFinite(f.min))issue(`${path}.min`,'Mínimo no numérico');
   if(f.max!==undefined&&!Number.isFinite(f.max))issue(`${path}.max`,'Máximo no numérico');
   if(f.min!==undefined&&f.max!==undefined&&f.min>f.max)issue(path,'El mínimo no puede superar al máximo');
   if(f.step!==undefined&&(!Number.isFinite(f.step)||f.step<=0))issue(`${path}.step`,'El paso debe ser positivo');
  } else {
   if(!f.options?.length)issue(`${path}.options`,'Añade al menos una opción');
   const opts=new Set<string>();
   for(const [j,o] of (f.options??[]).entries()){
    if(!o.value?.trim()||!o.label?.trim())issue(`${path}.options[${j}]`,'Valor y etiqueta obligatorios');
    if(opts.has(o.value))issue(`${path}.options[${j}]`,'Valor duplicado');
    opts.add(o.value);
   }
  }
 }
 const sorts=new Set<string>();
 for(const [i,s] of (project.sorts??[]).entries()){
  if(!s.value?.trim()||!s.label?.trim())issue(`sorts[${i}]`,'El orden necesita identificador y etiqueta');
  if(sorts.has(s.value))issue(`sorts[${i}].value`,'Orden duplicado');
  sorts.add(s.value);
  if(!['asc','desc'].includes(s.direction))issue(`sorts[${i}].direction`,'Dirección incorrecta');
 }
 return issues;
}
export function parseProject(input:unknown):BuilderProject {
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Se esperaba un objeto JSON');
 const p=input as BuilderProject;
 if(!p.theme||!p.search||!p.layout||!Array.isArray(p.fields)||!Array.isArray(p.sorts))throw Error('Faltan propiedades obligatorias en la configuración');
 const issues=validateProject(p);
 if(issues.length)throw Error(issues.map(x=>`${x.path}: ${x.message}`).join('\n'));
 return p;
}
/** Safe transport config: local options only; no functions or credentials. */
export function toSearchBarConfig(p:BuilderProject){
 return {
  placeholder:p.search.placeholder,
  columns:p.layout.columns,
  fieldOrder:p.fields.map(f=>f.id),
  fields:p.fields.filter(f=>f.type!=='range').map(f=>({id:f.id,label:f.label,selection:f.type==='single'?'single' as const:'multiple' as const,searchable:f.searchable??true,source:{kind:'local' as const,options:f.options??[]}})),
  ranges:p.fields.filter(f=>f.type==='range').map(f=>({id:f.id,label:f.label,min:f.min,max:f.max,step:f.step,unit:f.unit})),
  sorts:p.sorts.map(s=>({value:s.value,label:s.label,direction:s.direction}))
 };
}
export function toThemeCss(theme:BuilderTheme,selector='.my-searchbar'){
 const vars=themeVariables(theme);
 return `${selector} {\n  ${Object.entries(vars).map(([key,value])=>`${key}: ${value};`).join('\n  ')}\n}`;
}
export function exportReactExample(p:BuilderProject){
 const config=JSON.stringify(toSearchBarConfig(p),null,2);
 const Comp={simple:'SimpleSearchBar',filtered:'FilteredSearchBar',advanced:'AdvancedSearchBar'}[p.variant];
 const initial=JSON.stringify({query:'',mode:'all',filters:[],sort:p.sorts[0]?{field:p.sorts[0].value,direction:p.sorts[0].direction}:undefined},null,2);
 return `import { useState } from 'react';\nimport { ${Comp} } from '@searchbarkit/react';
import type { SearchBarConfig } from '@searchbarkit/react';\nimport '@searchbarkit/react/styles.css';\nimport type { SearchQuery } from '@searchbarkit/core';\nimport './my-searchbar.css';\n\nconst config: SearchBarConfig = ${config};\n\nexport function MySearch() {\n  const [query, setQuery] = useState<SearchQuery>(${initial});\n  return <div className="my-searchbar">\n    <${Comp} config={config} theme="${p.theme.mode==='custom'?(p.theme.base??'dark'):p.theme.mode}" value={query} onChange={setQuery} onSearch={(q) => {\n      // Connect your search endpoint here; SearchBar does not execute SQL.\n      console.log('search', q);\n    }} />\n  </div>;\n}\n`;
}
export function exportWebComponentExample(p:BuilderProject){
 const config=JSON.stringify(toSearchBarConfig(p),null,2).replace(/</g,'\\u003c');
 return `<!-- Register the element in your JavaScript bundle first:\nimport { defineSearchBarElement } from '@searchbarkit/web-component';\ndefineSearchBarElement();\n-->\n<searchbarkit id="my-search" variant="${p.variant}" theme="${p.theme.mode==='custom'?(p.theme.base??'dark'):p.theme.mode}"></searchbarkit>\n<script type="module">\n  const element = document.querySelector('#my-search');\n  // In your bundled JS app, assign the configuration using the element property.\n  element.config = ${config};\n  element.value = {query:'',mode:'all',filters:[]};\n  element.addEventListener('search-change', event => {\n    console.log(event.detail);\n  });\n  element.addEventListener('search-submit', event => {\n    // Your app sends event.detail to its backend.\n    console.log(event.detail);\n  });\n</script>\n`;
}
export const presets:Record<string,BuilderProject>={
 manga:{version:1,name:'Catálogo manga',variant:'advanced',theme:{mode:'dark',accent:'#3478e7',radius:4,density:'normal'},search:{placeholder:'Título, autor, género o etiqueta...'},layout:{columns:2},fields:[
  {id:'type',label:'Tipo',type:'multiple',options:[{value:'manga',label:'Manga'},{value:'manhwa',label:'Manhwa'},{value:'manhua',label:'Manhua'}]},
  {id:'genre',label:'Género',type:'multiple',searchable:true,options:[{value:'action',label:'Acción'},{value:'fantasy',label:'Fantasía'},{value:'romance',label:'Romance'},{value:'adventure',label:'Aventura'}]},
  {id:'year',label:'Año',type:'range',min:1950,max:2026,step:1}
 ],sorts:[{value:'updated',label:'Actualizado recientemente',direction:'desc'},{value:'title',label:'Título A–Z',direction:'asc'}]},
 pokemon:{version:1,name:'Pokédex',variant:'filtered',theme:{mode:'light',accent:'#df3e42',radius:4,density:'normal'},search:{placeholder:'Buscar Pokémon...'},layout:{columns:2},fields:[
  {id:'type',label:'Tipo',type:'multiple',options:[{value:'fire',label:'Fuego'},{value:'water',label:'Agua'},{value:'grass',label:'Planta'},{value:'electric',label:'Eléctrico'}]},
  {id:'generation',label:'Generación',type:'single',options:[{value:'1',label:'Primera'},{value:'2',label:'Segunda'},{value:'3',label:'Tercera'}]}
 ],sorts:[{value:'number',label:'Número Pokédex',direction:'asc'}]},
 library:{version:1,name:'Biblioteca',variant:'advanced',theme:{mode:'light',accent:'#0e9488',radius:4,density:'normal'},search:{placeholder:'Nombre, autor o palabra clave...'},layout:{columns:2},fields:[
  {id:'type',label:'Tipo',type:'multiple',options:[{value:'manga',label:'Manga'},{value:'manhwa',label:'Manhwa'},{value:'manhua',label:'Manhua'}]},
  {id:'genre',label:'Género',type:'multiple',searchable:true,options:[{value:'action',label:'Acción'},{value:'fantasy',label:'Fantasía'},{value:'romance',label:'Romance'}]},
  {id:'year',label:'Año',type:'multiple',options:[{value:'2025',label:'2025'},{value:'2024',label:'2024'},{value:'2014',label:'2014'},{value:'1996',label:'1996'}]},
  {id:'status',label:'Estado',type:'single',options:[{value:'ongoing',label:'En emisión'},{value:'completed',label:'Finalizado'}]},
  {id:'length',label:'Longitud',type:'single',options:[{value:'10',label:'≥ 10 capítulos'},{value:'50',label:'≥ 50 capítulos'},{value:'100',label:'≥ 100 capítulos'}]},
  {id:'demographic',label:'Demografía',type:'multiple',options:[{value:'shonen',label:'Shōnen'},{value:'seinen',label:'Seinen'},{value:'josei',label:'Josei'}]}
 ],sorts:[{value:'updatedAt',label:'Actualizado recientemente',direction:'desc'},{value:'title',label:'Nombre A–Z',direction:'asc'}]},
 minimal:{version:1,name:'Buscador simple' ,variant:'simple',theme:{mode:'dark',accent:'#3478e7',radius:4,density:'compact'},search:{placeholder:'Buscar...'},layout:{columns:2},fields:[],sorts:[]}
};
