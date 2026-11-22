import {useEffect, useMemo, useState} from 'react';
import {Search, Globe, Moon, Sun, BookOpen, Copy, Check} from 'lucide-react';
import {SearchBar} from '@searchbarkit/react';
import {createEmptyQuery, type SearchQuery} from '@searchbarkit/core';
import {presets, toSearchBarConfig, themeVariables, exportReactExample, type BuilderProject} from '@searchbarkit/config';
import type {CSSProperties} from 'react';
import {Studio} from './Studio';

export type Page = 'component'|'demo'|'docs';
type Lang = 'es'|'en';
const base=import.meta.env.BASE_URL.replace(/\/$/,'');
const withoutBase=(path:string)=>path.startsWith(base+'/')?path.slice(base.length):path;
function routeFromPath():{lang:Lang;page:Page}{
 const parts=withoutBase(window.location.pathname).split('/').filter(Boolean);
 const lang:Lang=parts[0]==='en'?'en':'es';
 const page:Page=parts[1]==='demo'||parts[1]==='gallery'?'demo':parts[1]==='docs'?'docs':'component';
 return {lang,page};
}
const routeTo=(lang:Lang,page:Page)=>`${base}/${lang}/${page==='component'?'':`${page}/`}`;
const text={
 es:{component:'Componente',demo:'Demo',guide:'Guía',guideTitle:'Integra SearchbarKit a tu ritmo.',guideSub:'Código fuente al estilo shadcn, paquetes React o Web Component. Tú eliges.',installation:'Instalación',quick:'Inicio rápido',styling:'Temas',data:'Datos y eventos',host:'La aplicación decide cómo consultar los resultados.',source:'Código en tu proyecto',package:'Dependencias',web:'Sin React en el consumidor',footer:'Creado para experimentar, integrar y extender.',git:'Ver en GitHub'},
 en:{component:'Component',demo:'Demo',guide:'Guide',guideTitle:'Integrate SearchbarKit your way.',guideSub:'shadcn-style source, React packages, or a Web Component. Your choice.',installation:'Installation',quick:'Quick start',styling:'Themes',data:'State and events',host:'Your application decides how to fetch results.',source:'Own the source code',package:'Versioned dependencies',web:'No React required in host app',footer:'Built to experiment, integrate, and extend.',git:'View on GitHub'}
};
type DemoEntry={title:string;author:string;type:'manga'|'manhwa'|'manhua';genres:string[];year:number;rating:number;updated:number;description:string};
// Representative, local-only records. The demo never calls an external manga service.
const demoEntries:DemoEntry[]=[
 {title:'Solo Leveling',author:'Chugong',type:'manhwa',genres:['action','fantasy'],year:2018,rating:9.6,updated:9,description:'Fantasía y progresión de un cazador.'},
 {title:'One Piece',author:'Eiichiro Oda',type:'manga',genres:['action','adventure'],year:1997,rating:9.7,updated:8,description:'Aventura pirata en busca del gran tesoro.'},
 {title:'Omniscient Reader',author:'singNsong',type:'manhwa',genres:['action','fantasy'],year:2020,rating:9.5,updated:10,description:'Un lector conoce el futuro de su mundo.'},
 {title:'Tower of God',author:'SIU',type:'manhwa',genres:['fantasy','adventure'],year:2010,rating:9.0,updated:7,description:'Una torre de pruebas y secretos.'},
 {title:'Battle Through the Heavens',author:'Tian Can Tu Dou',type:'manhua',genres:['action','fantasy'],year:2012,rating:8.7,updated:6,description:'Cultivo y artes marciales.'},
 {title:'Villains Are Destined to Die',author:'Gwon Gyeoeul',type:'manhwa',genres:['romance','fantasy'],year:2020,rating:9.1,updated:5,description:'Romance y decisiones en un mundo fantástico.'},
];
function demoResults(query:SearchQuery){
 const byField=(entry:DemoEntry,field:string,value:string)=>field==='type'?entry.type===value:field==='genre'?entry.genres.includes(value):field==='year'?String(entry.year)===value:false;
 return demoEntries.filter(entry=>{
  const q=query.query.trim().toLowerCase();
  if(q&&!`${entry.title} ${entry.author} ${entry.description}`.toLowerCase().includes(q))return false;
  const include=query.filters.filter(f=>f.operation==='include');
  const groups=new Map<string,typeof include>();
  for(const f of include){if(!['type','genre','year'].includes(f.field))continue;groups.set(f.field,[...(groups.get(f.field)||[]),f])}
  const matches=[...groups].map(([field,filters])=>filters.some(f=>byField(entry,field,f.value)));
  if(matches.length&&!(query.mode==='any'?matches.some(Boolean):matches.every(Boolean)))return false;
  if(query.filters.some(f=>f.operation==='exclude'&&byField(entry,f.field,f.value)))return false;
  for(const r of query.ranges??[]){if(r.field!=='year')continue;const hit=(r.min===undefined||entry.year>=r.min)&&(r.max===undefined||entry.year<=r.max);if(r.operation==='exclude'?hit:!hit)return false}
  return true;
 }).sort((a,b)=>query.sort?.field==='title'?(query.sort.direction==='desc'?b.title.localeCompare(a.title):a.title.localeCompare(b.title)):query.sort?.field==='rating'?b.rating-a.rating:b.updated-a.updated);
}
function SharedSearch({project,query,onChange}:{project:BuilderProject;query:SearchQuery;onChange:(value:SearchQuery)=>void}){
 return <div className="site-shared-search" style={themeVariables(project.theme) as CSSProperties}>
  <SearchBar config={toSearchBarConfig(project)} variant={project.variant} theme={project.theme.mode==='custom'?(project.theme.base??'dark'):project.theme.mode} value={query} onChange={onChange} onSearch={onChange}/>
 </div>;
}
function Demo({lang,project,query,onChange}:{lang:Lang;project:BuilderProject;query:SearchQuery;onChange:(value:SearchQuery)=>void}){
 const items=useMemo(()=>demoResults(query),[query]);
 return <section className="site-demo-page">
  <div className="site-demo-heading"><span className="site-eyebrow">LIVE DEMO</span><h1>{lang==='es'?'Prueba tu SearchBar con resultados.':'Try your SearchBar with results.'}</h1><p>{lang==='es'?'La misma configuración y filtros que has diseñado en Componente. Datos de ejemplo locales.':'The same configuration and filters you designed in Component. Local sample data.'}</p></div>
  <SharedSearch project={project} query={query} onChange={onChange}/>
  <div className="site-demo-results-heading"><h2>{items.length} {lang==='es'?'resultados':'results'}</h2><span>{lang==='es'?'Ejemplo Manga · Datos ilustrativos':'Manga example · Illustrative data'}</span></div>
  <div className="site-demo-results">{items.map((item,index)=><article className="site-demo-result" key={item.title}>
    <div className="site-demo-cover" data-type={item.type}><span>0{index+1}</span><Search size={27}/></div>
    <div className="site-demo-result-copy"><span className="site-demo-type">{item.type.toUpperCase()} · {item.year}</span><h3>{item.title}</h3><p>{item.author}</p><div className="site-demo-result-tags">{item.genres.map(genre=><span key={genre}>{genre}</span>)}</div><small>★ {item.rating.toFixed(1)}</small></div>
  </article>)}{items.length===0&&<div className="site-demo-empty">{lang==='es'?'Sin resultados. Prueba a modificar los filtros o la búsqueda.':'No matches. Try another search or change the filters.'}</div>}</div>
  <p className="site-demo-note">{lang==='es'?'Los resultados corresponden a un pequeño dataset de muestra. Los campos personalizados ajenos a este dataset no afectan a la búsqueda; tu aplicación conectará su propio adaptador.':'Results come from a small sample dataset. Custom fields outside the dataset do not affect filtering; your own application supplies its adapter.'}</p>
 </section>;
}
function CodeSample({code}:{code:string}){const [copied,setCopied]=useState(false);return <div className="docs-code"><button title="Copy" aria-label="Copiar ejemplo" onClick={async()=>{await navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),1400)}}>{copied?<Check size={15}/>:<Copy size={15}/>}</button><pre><code>{code}</code></pre></div>}
function Docs({lang,project,query,onChange,onVariantChange}:{lang:Lang;project:BuilderProject;query:SearchQuery;onChange:(value:SearchQuery)=>void;onVariantChange:(value:BuilderProject['variant'])=>void}){
 const es=lang==='es';
 const registryUrl='https://OWNER.github.io/searchbar-kit/r/searchbar.json';
 const variants=([['simple',es?'Simple':'Simple'],['filtered',es?'Con filtros':'Filtered'],['advanced',es?'Avanzada':'Advanced']] as const);
 const anatomy:Record<BuilderProject['variant'],[string,string][]>= {
  simple: [[es?'Entrada de búsqueda':'Search input',es?'Texto y autocompletado opcional.':'Text and optional suggestions.'],[es?'Envío':'Submit',es?'La aplicación controla qué ocurre al buscar.':'The host decides how to perform the search.']],
  filtered: [[es?'Entrada de búsqueda':'Search input',es?'Busca por texto.':'Text matching.'],[es?'Selectores':'Selectors',es?'Filtros de selección única, múltiple o rango.':'Single, multiple and range filters.'],[es?'Chips':'Chips',es?'Filtros activos visibles y eliminables.':'Visible, removable active selections.']],
  advanced: [[es?'Entrada de búsqueda':'Search input',es?'Búsqueda textual y sugerencias opcionales.':'Text search and optional suggestions.'],[es?'Filtros avanzados':'Advanced filters',es?'Selectores y rangos numéricos.':'Selectors and numeric ranges.'],[es?'Reglas avanzadas':'Advanced rules',es?'Incluir, excluir y combinar condiciones.':'Include, exclude and combine conditions.'],[es?'Estado compartido':'Shared state',es?'La consulta se mantiene al navegar.':'Query persists across sections.']]
 };
 const activeAnatomy=anatomy[project.variant];
 return <div className="ck-guide" aria-label={es?'Guía de SearchbarKit':'SearchbarKit guide'}>
  <header className="ck-page-heading"><div><p className="ck-section-overline">{es?'GUÍA DE COMPONENTES':'COMPONENT GUIDE'}</p><h1>{es?'Diseña. Integra. Personaliza.':'Design. Integrate. Customize.'}</h1><p>{es?'Todo lo necesario para utilizar tu SearchBar. Los ejemplos siguen la configuración que has creado en Componente.':'Everything you need to use your SearchBar. Examples follow your Component configuration.'}</p></div></header>
  <section className="ck-guide-section ck-guide-code"><div className="ck-section-heading"><div><h2>{es?'Ejemplo de uso':'Usage example'}</h2><p>{es?'Código React generado para tu configuración actual.':'React code generated from your current configuration.'}</p></div></div>
   <CodeSample code={exportReactExample(project)}/>
  </section>
  <section className="ck-guide-section"><div className="ck-section-heading"><div><h2>{es?'Pruébalo aquí':'Try it here'}</h2><p>{es?'El mismo componente, tema y filtros de la pestaña Componente.':'The same component, theme and selected filters from Component.'}</p></div></div>
   <div className="ck-guide-preview"><SharedSearch project={project} query={query} onChange={onChange}/></div>
  </section>
  <section className="ck-guide-section"><div className="ck-section-heading"><div><h2>{es?'Anatomía del componente':'Component anatomy'}</h2><p>{es?'Selecciona una variante para conocer sus partes. El selector actualiza también Componente y Demo.':'Select a variant to explore its parts. This also updates Component and Demo.'}</p></div></div>
   <div className="ck-guide-segmented" role="group" aria-label={es?'Variante de búsqueda':'Search variant'}>{variants.map(([v,label])=><button type="button" key={v} aria-pressed={project.variant===v} className={project.variant===v?'active':''} onClick={()=>onVariantChange(v)}>{label}</button>)}</div>
   <div className="ck-guide-two-columns"><div><h3>{es?'Estructura':'Structure'} · {variants.find(([v])=>v===project.variant)?.[1]}</h3><div className="ck-anatomy-list">{activeAnatomy.map(([title,description],i)=><div className="ck-anatomy-row" key={title}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{title}</strong><p>{description}</p></div></div>)}</div></div>
    <div><h3>{es?'Características':'Details'}</h3><dl className="ck-measurements">{[[es?'Variante':'Variant',project.variant],[es?'Campos':'Fields',String(project.fields.length)],[es?'Columnas':'Columns',String(project.layout.columns)],[es?'Tema':'Theme',project.theme.mode],[es?'Estado':'State',es?'Controlado':'Controlled']].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="ck-guide-note">{es?'El aspecto se define con tokens CSS; la aplicación interpreta la búsqueda y obtiene los resultados.':'Appearance comes from CSS tokens; the host app interprets queries and retrieves results.'}</p></div>
   </div>
  </section>
  <section className="ck-guide-section"><div className="ck-section-heading"><div><h2>{es?'Integración técnica':'Technical integration'}</h2><p>{es?'Escoge la integración adecuada para tu aplicación.':'Choose the integration that fits your application.'}</p></div></div>
   <div className="ck-guide-technical-grid">
    <div><h3>{es?'Instalación estilo shadcn':'shadcn-style install'}</h3><pre><code>{`pnpm dlx shadcn@latest add ${registryUrl}`}</code></pre><p>{es?'Copia archivos fuente y estilos. Sustituye OWNER tras desplegar la web.':'Copies source files and styles. Replace OWNER after deployment.'}</p></div>
    <div><h3>{es?'Paquete React':'React package'}</h3><pre><code>{`import { AdvancedSearchBar } from '@searchbarkit/react';\nimport '@searchbarkit/react/styles.css';`}</code></pre><p>{es?'Paquete preparado para npm; todavía no publicado.':'npm-ready package, not yet published.'}</p></div>
    <div><h3>{es?'Web Component':'Web Component'}</h3><pre><code>{`import { defineSearchBarElement }\n  from '@searchbarkit/web-component';\ndefineSearchBarElement();`}</code></pre><p>{es?'Integración opcional para aplicaciones que no utilizan React.':'Optional integration for non-React applications.'}</p></div>
    <div><h3>{es?'Tokens visuales':'Design tokens'}</h3><pre><code>{`.my-searchbar {\n  --gs-accent: #3478e7;\n  --gs-radius: 4px;\n}`}</code></pre><p>{es?'Personaliza los colores sin modificar el motor de filtros.':'Customize colors without changing filter logic.'}</p></div>
   </div>
   <h3 className="ck-api-title">{es?'Referencia de API':'API reference'}</h3>
   <div className="ck-api-table">{[
    ['config','SearchBarConfig',es?'Campos, opciones, rangos y ordenación.':'Fields, options, ranges and sorting.'],
    ['variant',"'simple' | 'filtered' | 'advanced'",es?'Nivel de complejidad visible.':'Visible complexity level.'],
    ['value / onChange','SearchQuery / callback',es?'Estado controlado, notificado al cambiar.':'Controlled state, emitted on change.'],
    ['onSearch','(query) => void',es?'Acción explícita de búsqueda.':'Explicit search action.'],
    ['theme',"'light' | 'dark'",es?'Tema base de la SearchBar.':'SearchBar base theme.']
   ].map(([name,type,description])=><div key={name}><strong>{name}</strong><code>{type}</code><span>{description}</span></div>)}</div>
   <p className="ck-guide-footnote"><BookOpen size={15}/>{es?'La búsqueda no consulta automáticamente tu API: la aplicación integra los resultados.':'Your app remains responsible for fetching and displaying results.'}</p>
  </section>
 </div>;
}

export function Site(){
 const [route,setRoute]=useState(routeFromPath);
 const [project,setProject]=useState<BuilderProject>(()=>JSON.parse(JSON.stringify(presets.manga)) as BuilderProject);
 const [query,setQuery]=useState<SearchQuery>(()=>createEmptyQuery());
 const [siteTheme,setSiteTheme]=useState<'light'|'dark'>(()=>{try{return localStorage.getItem('searchbarkit-site-theme')==='dark'?'dark':'light'}catch{return 'light'}});
 useEffect(()=>{const listener=()=>setRoute(routeFromPath());window.addEventListener('popstate',listener);return()=>window.removeEventListener('popstate',listener)},[]);
 useEffect(()=>{try{localStorage.setItem('searchbarkit-site-theme',siteTheme)}catch{/* Optional storage */}},[siteTheme]);
 const go=(lang:Lang,page:Page)=>{window.history.pushState(null,'',routeTo(lang,page));setRoute({lang,page});window.scrollTo({top:0,behavior:'auto'})};
 const t=text[route.lang];
 return <div className="site-root" data-site-theme={siteTheme}><div className="site-shell"><header className="site-header">
  <a href={routeTo(route.lang,'component')} className="site-brand" onClick={e=>{e.preventDefault();go(route.lang,'component')}} aria-label="SearchbarKit homepage"><span className="site-brand-icon"><Search size={20} strokeWidth={2.2}/></span><span className="site-brand-text"><strong>SearchbarKit</strong><small>Design System Experiment</small></span></a>
  <div className="site-nav-actions"><nav className="site-nav" aria-label="Main navigation">{([['component',t.component],['demo',t.demo],['docs',t.guide]] as const).map(([page,label])=><a key={page} href={routeTo(route.lang,page)} aria-current={route.page===page?'page':undefined} className={route.page===page?'active':''} onClick={e=>{e.preventDefault();go(route.lang,page)}}>{label}</a>)}</nav>
  <div className="site-language" role="group" aria-label={route.lang==='es'?'Idioma':'Language'}><Globe size={14} aria-hidden="true"/>{(['en','es'] as const).map(lang=><a key={lang} href={routeTo(lang,route.page)} hrefLang={lang} lang={lang} aria-current={route.lang===lang?'true':undefined} className={route.lang===lang?'active':''} onClick={e=>{e.preventDefault();go(lang,route.page)}}>{lang.toUpperCase()}</a>)}</div>
  <button type="button" className="site-appearance-button" aria-label={siteTheme==='light'?(route.lang==='es'?'Activar modo oscuro':'Switch to dark mode'):(route.lang==='es'?'Activar modo claro':'Switch to light mode')} title={siteTheme==='light'?'Dark mode':'Light mode'} onClick={()=>setSiteTheme(s=>s==='light'?'dark':'light')}>{siteTheme==='light'?<Moon size={17}/>:<Sun size={17}/>}</button></div>
 </header>
 <main className={route.page==='component'?'site-main-canvas':'site-main-content'}>
 {route.page==='component'?<Studio project={project} setProject={setProject} query={query} setQuery={setQuery}/>:route.page==='demo'?<Demo lang={route.lang} project={project} query={query} onChange={setQuery}/>:<Docs lang={route.lang} project={project} query={query} onChange={setQuery} onVariantChange={variant=>setProject(p=>({...p,variant}))}/>}
 </main>
 {route.page!=='component'&&<footer className="site-footer"><span>SearchbarKit © 2026 · MIT</span><span>{t.footer}</span></footer>}
 </div></div>;
}
