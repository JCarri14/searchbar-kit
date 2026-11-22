import {StrictMode,useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AdvancedSearchBar,FilteredSearchBar,SimpleSearchBar} from '@searchbarkit/react';
import type {SearchBarVariant} from '@searchbarkit/react';
import {createEmptyQuery,readSearchFromParams,writeSearchToParams,reconcileQuery} from '@searchbarkit/core';
import type {SearchQuery} from '@searchbarkit/core';
import {libraryConfig,queryLibrary} from './data';
import '@searchbarkit/react/styles.css';
import './style.css';
const config=libraryConfig;
const initial=()=>createEmptyQuery({field:'updated',direction:'desc'});
function App(){
 const [variant,setVariant]=useState<SearchBarVariant>('advanced');
 const [query,setQuery]=useState<SearchQuery>(()=>reconcileQuery(readSearchFromParams(new URLSearchParams(location.search)),[...config.fields.map(f=>f.id),...(config.ranges??[]).map(r=>r.id)],initial()));
 const [error,setError]=useState('');
 useEffect(()=>{const params=writeSearchToParams(new URLSearchParams(location.search),query);history.replaceState(null,'',`${location.pathname}${params.size?'?'+params.toString():''}${location.hash}`)},[query]);
 const results=useMemo(()=>queryLibrary(query),[query]);
 const props={config,value:query,onChange:setQuery,onSearch:(_:SearchQuery)=>{},onError:(e:unknown)=>setError(String(e))};
 return <main className="demo-shell">
  <header className="demo-head"><div><div className="eyebrow">SEARCH LAB · LIBRARY DEMO · v1.7</div><h1>Biblioteca de manga</h1><p>Campos inspirados en ZonaTMO: años individuales, longitud por umbral y ordenación única. Datos de ejemplo, sin conexión con ZonaTMO.</p></div>
   <label>Variante <select value={variant} onChange={e=>setVariant(e.target.value as SearchBarVariant)}><option value="simple">Simple</option><option value="filtered">Con filtros</option><option value="advanced">Avanzada</option></select></label>
  </header>
  {variant==='simple'?<SimpleSearchBar {...props}/>:variant==='filtered'?<FilteredSearchBar {...props}/>:<AdvancedSearchBar {...props}/>}
  {error&&<p role="alert">{error}</p>}
  <div className="demo-results-head"><h2>{results.length} resultados</h2><span>Datos locales ficticios · Búsqueda reactiva</span></div>
  <section className="demo-results" aria-label="Resultados de biblioteca">{results.map(b=><article key={b.id}><small className="type">{b.type} · {b.year}</small><strong>{b.title}</strong><p>{b.author}</p><small>{b.genres.join(' · ')} · {b.chapters} capítulos</small></article>)}{!results.length&&<p className="demo-empty">No hay obras que cumplan estos criterios.</p>}</section>
  <details><summary>Consultar JSON emitido por la SearchBar</summary><pre>{JSON.stringify(query,null,2)}</pre></details>
  <p className="demo-footer">La SearchBar solo emite el contrato JSON. Esta aplicación interpreta los filtros, el orden y los rangos.</p>
 </main>
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
