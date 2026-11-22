import {StrictMode,useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SimpleSearchBar,FilteredSearchBar,AdvancedSearchBar} from '@searchbarkit/react';
import type {SearchBarVariant} from '@searchbarkit/react';
import {createEmptyQuery,readSearchFromParams,writeSearchToParams,reconcileQuery} from '@searchbarkit/core';
import type {SearchQuery} from '@searchbarkit/core';
import {pokemonConfig as config,fetchPokemonPage,searchPokemon} from './data';
import type {PokemonItem} from './data';
import '@searchbarkit/react/styles.css';
import './style.css';
const initial=()=>createEmptyQuery(config.sorts?.[0]?{field:config.sorts[0].value,direction:config.sorts[0].direction??'desc'}:undefined);
function App(){
 const [variant,setVariant]=useState<SearchBarVariant>('advanced');
 const [query,setQuery]=useState<SearchQuery>(()=>{const restored=readSearchFromParams(new URLSearchParams(location.search));return reconcileQuery(restored,config.fields.map(f=>f.id),initial());});
 const [componentError,setComponentError]=useState<string|null>(null);
 useEffect(()=>{const params=writeSearchToParams(new URLSearchParams(location.search),query);history.replaceState(null,'',`${location.pathname}?${params.toString()}${location.hash}`);},[query]);
 const [pokemon,setPokemon]=useState<PokemonItem[]>([]);
   const [loading,setLoading]=useState(false);
   const [hasMore,setHasMore]=useState(true);
   const [error,setError]=useState<string|null>(null);
   const inFlight=useRef(false);
   const controller=useRef<AbortController|null>(null);
   const pokemonRef=useRef<PokemonItem[]>([]);
   // StrictMode-safe mount fetch: each effect invocation owns and cancels its request.
   useEffect(()=>{
     const ac=new AbortController(); controller.current=ac; setLoading(true);setError(null);
     fetchPokemonPage(0,24,ac.signal).then(response=>{
       if(!ac.signal.aborted){pokemonRef.current=response.items;setPokemon(response.items);setHasMore(response.hasMore);}
     }).catch(e=>{if(!ac.signal.aborted)setError(String(e))}).finally(()=>{if(!ac.signal.aborted)setLoading(false)});
     return ()=>ac.abort();
   },[]);
   async function loadMore(){
     if(inFlight.current)return;
     inFlight.current=true;const ac=new AbortController();controller.current=ac;setLoading(true);setError(null);
     try{const response=await fetchPokemonPage(pokemonRef.current.length,24,ac.signal);
       if(!ac.signal.aborted){pokemonRef.current=[...pokemonRef.current,...response.items];setPokemon(pokemonRef.current);setHasMore(response.hasMore)}
     }catch(e){if(!ac.signal.aborted)setError(String(e))}
     finally{inFlight.current=false;if(!ac.signal.aborted)setLoading(false)}
   }
   const results=useMemo(()=>searchPokemon(pokemon,query),[pokemon,query]);
 const shared={config,value:query,onChange:setQuery,onSearch:(_value:SearchQuery)=>{},onError:(e:unknown)=>setComponentError(String(e))};
 return <main className="demo-shell">
  <div className="demo-head"><div><div className="eyebrow">SEARCH LAB / MONOREPO v1.4 / POKEMON</div><h1>Explora Pokémon.</h1><p>Las tres variantes usan el mismo core y contrato JSON.</p></div><label>Variante <select value={variant} onChange={e=>setVariant(e.target.value as SearchBarVariant)}><option value="simple">Simple</option><option value="filtered">Con filtros</option><option value="advanced">Avanzada</option></select></label></div>
  {variant==='simple'?<SimpleSearchBar {...shared}/>:variant==='filtered'?<FilteredSearchBar {...shared}/>:<AdvancedSearchBar {...shared}/>}
  {componentError&&<p role="alert" className="demo-error">{componentError}</p>}
  <div className="demo-results-head"><h2>{results.length} resultados</h2><span>Mostrando coincidencias entre {pokemon.length} Pokémon cargados</span></div>
  <p className="demo-scope">Los filtros se evalúan únicamente sobre los Pokémon cargados, no sobre toda la Pokédex.</p>
  {error&&<p className="demo-error" role="alert">{error} <button onClick={()=>void loadMore()}>Reintentar</button></p>}
  <div className="demo-results">{results.map(p=><article className="pokemon-card" key={p.id}>{p.image&&<img src={p.image} alt="" loading="lazy"/>}<strong>#{p.id} {p.name}</strong><p>{p.types.join(' · ')}</p><small>Habilidades: {p.abilities.join(', ')}</small></article>)}{!loading&&!results.length&&<div className="demo-empty">Sin coincidencias entre los Pokémon cargados.</div>}</div>
  {loading&&<p role="status">Cargando Pokémon…</p>}
  {hasMore&&<button className="demo-more" disabled={loading} onClick={()=>void loadMore()}>Cargar 24 Pokémon más</button>}
  <details><summary>Ver contrato JSON</summary><pre>{JSON.stringify(query,null,2)}</pre></details>
  <p className="demo-footer">La aplicación controla el estado, las URL y la interpretación de los filtros. Cambiar de variante nunca elimina criterios.</p>
 </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>);
