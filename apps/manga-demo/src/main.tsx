import {StrictMode,useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SimpleSearchBar,FilteredSearchBar,AdvancedSearchBar} from '@searchbarkit/react';
import type {SearchBarVariant} from '@searchbarkit/react';
import {createEmptyQuery,readSearchFromParams,writeSearchToParams,reconcileQuery} from '@searchbarkit/core';
import type {SearchQuery} from '@searchbarkit/core';
import {mangaConfig as config,searchCatalog} from './data';
import '@searchbarkit/react/styles.css';
import './style.css';
const initial=()=>createEmptyQuery(config.sorts?.[0]?{field:config.sorts[0].value,direction:config.sorts[0].direction??'desc'}:undefined);
function App(){
 const [variant,setVariant]=useState<SearchBarVariant>('advanced');
 const [query,setQuery]=useState<SearchQuery>(()=>{const restored=readSearchFromParams(new URLSearchParams(location.search));return reconcileQuery(restored,config.fields.map(f=>f.id),initial());});
 const [componentError,setComponentError]=useState<string|null>(null);
 useEffect(()=>{const params=writeSearchToParams(new URLSearchParams(location.search),query);history.replaceState(null,'',`${location.pathname}?${params.toString()}${location.hash}`);},[query]);
 const results=useMemo(()=>searchCatalog(query),[query]);
 const shared={config,value:query,onChange:setQuery,onSearch:(_value:SearchQuery)=>{},onError:(e:unknown)=>setComponentError(String(e))};
 return <main className="demo-shell">
  <div className="demo-head"><div><div className="eyebrow">SEARCH LAB / MONOREPO v1.4 / MANGA</div><h1>Explora manga, manhua y manhwa.</h1><p>Las tres variantes usan el mismo core y contrato JSON.</p></div><label>Variante <select value={variant} onChange={e=>setVariant(e.target.value as SearchBarVariant)}><option value="simple">Simple</option><option value="filtered">Con filtros</option><option value="advanced">Avanzada</option></select></label></div>
  {variant==='simple'?<SimpleSearchBar {...shared}/>:variant==='filtered'?<FilteredSearchBar {...shared}/>:<AdvancedSearchBar {...shared}/>}
  {componentError&&<p role="alert" className="demo-error">{componentError}</p>}
  <div className="demo-results-head"><h2>{results.length} resultados</h2><span>Adaptador de manga independiente</span></div>
   <div className="demo-results">{results.map(item=><article key={item.title}><strong>{item.title}</strong><p>{item.author}</p><small>{item.type} · {item.language} · ★ {item.rating}</small></article>)}{!results.length&&<div className="demo-empty">Sin coincidencias.</div>}</div>
  <details><summary>Ver contrato JSON</summary><pre>{JSON.stringify(query,null,2)}</pre></details>
  <p className="demo-footer">La aplicación controla el estado, las URL y la interpretación de los filtros. Cambiar de variante nunca elimina criterios.</p>
 </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
