import {useEffect,useId,useMemo,useRef,useState} from 'react';
import type {KeyboardEvent as ReactKeyboardEvent} from 'react';
import type {FilterDefinition,RangeDefinition,OptionSearchResult,SearchBarProps,SearchQuery} from './types';
import {createStaticOptionsSource,cycleFilterState,setFilterState,setRangeState,createEmptyQuery} from '@searchbarkit/core';
import {Search, SlidersHorizontal, Diamond, ChevronDown, ChevronUp, X, ArrowLeftRight, Check, Minus, RotateCcw, Layers, Tag, Languages, Sparkles, BookOpen, CircleHelp} from 'lucide-react';
import {motion, useReducedMotion} from 'motion/react';
import './searchbar.css';
const iconSet = {layers: Layers, sparkles: Sparkles, languages: Languages, tag: Tag, info: CircleHelp, book: BookOpen} as const;
function FieldIcon({name}: {name?:string}) {const C=iconSet[name as keyof typeof iconSet]??BookOpen;return <C size={17} strokeWidth={1.8}/>;}


const fold=(s:string)=>s.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function useOptions(field:FilterDefinition|null,search:string,open:boolean,onError?: (error:unknown)=>void){
  const [result,setResult]=useState<OptionSearchResult>({options:[]});
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(false);
  const [retry,setRetry]=useState(0);
  const provider=useMemo(()=>field?(field.source.kind==='remote'?field.source.provider:createStaticOptionsSource(field.source.options)):null,[field]);
  const requestRef=useRef<AbortController|null>(null);
  useEffect(()=>{
    if(!open||!provider){setResult({options:[]});return;}
    const controller=new AbortController();requestRef.current?.abort();requestRef.current=controller;
    const timer=window.setTimeout(()=>{
      setLoading(true);setError(false);
      provider.search({search,signal:controller.signal}).then(response=>{if(!controller.signal.aborted)setResult(response)}).catch(err=>{
        if(!controller.signal.aborted){setError(true);onError?.(err)}
      }).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    },field?.source.kind==='remote'?250:0);
    return ()=>{window.clearTimeout(timer);controller.abort()};
  },[provider,search,open,retry,onError,field]);
  async function loadMore(){
    if(!provider||!result.nextCursor||loading)return;
    const controller=new AbortController();requestRef.current=controller;setLoading(true);
    try{
      const response=await provider.search({search,cursor:result.nextCursor,signal:controller.signal});
      if(!controller.signal.aborted)setResult(p=>({...response,options:[...p.options,...response.options.filter(o=>!p.options.some(x=>x.value===o.value))]}));
    }catch(err){if(!controller.signal.aborted){setError(true);onError?.(err)}}
    finally{if(!controller.signal.aborted)setLoading(false)}
  }
  return {result,loading,error,loadMore,retry:()=>setRetry(x=>x+1)};
}

/** Inclusive numeric range, rendered by the shared library instead of domain-specific markup. */
function RangeField({definition,range,order,onChange}:{definition:RangeDefinition;range:NonNullable<SearchQuery['ranges']>[number]|undefined;order?:number;onChange:(bounds:{min?:number;max?:number}|null,operation?:'include'|'exclude')=>void}) {
 const [draftMin,setDraftMin]=useState(range?.min?.toString()??'');
 const [draftMax,setDraftMax]=useState(range?.max?.toString()??'');
 useEffect(()=>{setDraftMin(range?.min?.toString()??'');setDraftMax(range?.max?.toString()??'')},[range?.min,range?.max]);
 const min=draftMin.trim()===''?undefined:Number(draftMin);
 const max=draftMax.trim()===''?undefined:Number(draftMax);
 const invalid=(min!==undefined&&!Number.isFinite(min))||(max!==undefined&&!Number.isFinite(max))||(min!==undefined&&max!==undefined&&min>max);
 function apply(){if(invalid)return;onChange(min===undefined&&max===undefined?null:{min,max},range?.operation??'include')}
 return <div className="gsb-filter-field gsb-range-field" style={{order}}>
  <label>{definition.label}</label>
  <div className="gsb-range-inputs">
   <input type="number" aria-label={`${definition.label}: desde`} placeholder={definition.placeholderMin??'Desde'} min={definition.min} max={definition.max} step={definition.step??1} value={draftMin} onChange={e=>setDraftMin(e.target.value)} onBlur={apply} onKeyDown={e=>{if(e.key==='Enter')apply()}}/>
   <span aria-hidden="true">—</span>
   <input type="number" aria-label={`${definition.label}: hasta`} placeholder={definition.placeholderMax??'Hasta'} min={definition.min} max={definition.max} step={definition.step??1} value={draftMax} onChange={e=>setDraftMax(e.target.value)} onBlur={apply} onKeyDown={e=>{if(e.key==='Enter')apply()}}/>
   {range&&<button type="button" title={`Quitar ${definition.label}`} aria-label={`Quitar rango ${definition.label}`} onClick={()=>{setDraftMin('');setDraftMax('');onChange(null)}}><X size={14}/></button>}
  </div>
  {invalid&&<small role="alert" className="gsb-range-error">El mínimo no puede superar al máximo.</small>}
 </div>;
}

export function SearchBar({config,value,onChange,onSearch,onError,className='',variant='advanced',theme='dark'}:SearchBarProps){
  const reduceMotion=useReducedMotion();
  const [panel,setPanel]=useState<'filters'|'rules'|null>(null);
  const [openField,setOpenField]=useState<string|null>(null);
  const [expanded,setExpanded]=useState<string|null>(null);
  const [optionQuery,setOptionQuery]=useState('');
  const [labels,setLabels]=useState<Record<string,string>>({});
  const [suggestionsOpen,setSuggestionsOpen]=useState(false);
  const [activeSuggestion,setActiveSuggestion]=useState(0);
  const suggestionsId=useId();
  const rootRef=useRef<HTMLElement>(null);
  const inputRef=useRef<HTMLInputElement>(null);
  const activeField=config.fields.find(f=>f.id===openField)??null;
  const {result,loading,error,loadMore,retry}=useOptions(activeField,optionQuery,Boolean(openField),onError);
  const identity=(field:string,v:string)=>JSON.stringify([field,v]);
  const labelFor=(field:string,v:string)=>{
    const known=labels[identity(field,v)];if(known)return known;
    const def=config.fields.find(f=>f.id===field);
    return def?.source.kind==='local' ? (def.source.options.find(o=>o.value===v)?.label??v) : v;
  };
  // Resolve option labels independent of the currently loaded options page.
  useEffect(()=>{
    const controller=new AbortController();
    for(const field of config.fields){
      const missing=value.filters.filter(f=>f.field===field.id&&!labels[identity(f.field,f.value)]).map(f=>f.value);
      if(!missing.length)continue;
      const source=field.source.kind==='remote'?field.source.provider:createStaticOptionsSource(field.source.options);
      source.resolve({values:missing,signal:controller.signal}).then(options=>{
        if(!controller.signal.aborted)setLabels(prev=>({...prev,...Object.fromEntries(options.map(o=>[identity(field.id,o.value),o.label]))}));
      }).catch(err=>{if(!controller.signal.aborted)onError?.(err)});
    }
    return ()=>controller.abort();
  },[config.fields,value.filters,onError]);
  useEffect(()=>{
    function handleOutside(e:PointerEvent){const eventPath=e.composedPath();if(rootRef.current&&!eventPath.includes(rootRef.current)){setExpanded(null);setOpenField(null);setSuggestionsOpen(false);return;}
      const inside=(selector:string)=>eventPath.some(node=>node instanceof Element && node.matches(selector));
      if(!inside('.gsb-groups'))setExpanded(null);
      if(!inside('.gsb-filter-field'))setOpenField(null);
      if(!inside('.gsb-search-line'))setSuggestionsOpen(false);
    }
    function hotkey(e:globalThis.KeyboardEvent){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();inputRef.current?.focus()}if(e.key==='Escape'){setExpanded(null);setOpenField(null);setSuggestionsOpen(false)}}
    document.addEventListener('pointerdown',handleOutside);document.addEventListener('keydown',hotkey);
    return ()=>{document.removeEventListener('pointerdown',handleOutside);document.removeEventListener('keydown',hotkey)};
  },[]);
  useEffect(()=>{setOpenField(null);setExpanded(null);setPanel(null);setLabels({})},[config]);
  function changeFilter(field:string,v:string,mode:'include'|'exclude'|null){onChange(setFilterState(value,field,v,mode))}
  function cycle(field:string,v:string){
    const definition=config.fields.find(f=>f.id===field);
    const current=value.filters.find(f=>f.field===field&&f.value===v);
    if(definition?.selection==='single'){
      // A single-select has at most one selected value and no exclusion switch.
      // Exclusion is configured in Advanced rules; a restored excluded value
      // remains excluded when clicked again, unless the user clears it.
      const others=value.filters.filter(f=>f.field!==field);
      onChange({...value,filters:current?others:[...others,{field,value:v,operation:'include'}]});
    } else if(variant==='filtered'){
      // The filtered preset is binary: neutral ↔ include.
      changeFilter(field,v,current?null:'include');
    } else onChange(cycleFilterState(value,field,v));
  }
  function togglePanel(next:'filters'|'rules'){setPanel(v=>v===next?null:next);setOpenField(null);setExpanded(null);setSuggestionsOpen(false)}
  function toggleField(id:string){setOpenField(v=>v===id?null:id);setOptionQuery('');setExpanded(null)}
  function labelGroup(field:FilterDefinition){const filters=value.filters.filter(f=>f.field===field.id);
    if(!filters.length)return null;
    const content=filters.length<=2?filters.map(f=>({name:labelFor(f.field,f.value),operation:f.operation})):[{name:`${filters.length} filtros`,operation:filters.some(f=>f.operation==='exclude')?'exclude':'include'}];
    return {filters,content};
  }
  const included=value.filters.filter(f=>f.operation==='include');
  const includedRanges=(value.ranges??[]).filter(r=>r.operation==='include');
  const excluded=value.filters.filter(f=>f.operation==='exclude');
  const excludedRanges=(value.ranges??[]).filter(r=>r.operation==='exclude');
  function changeRange(field:string,bounds:{min?:number;max?:number}|null,operation:'include'|'exclude'='include'){onChange(setRangeState(value,field,bounds,operation))}
  const rangeName=(field:string)=>config.ranges?.find(r=>r.id===field)?.label??field;
  const rangeDescription=(range:NonNullable<SearchQuery['ranges']>[number])=>`${range.min===undefined?'≤ '+range.max:range.max===undefined?'≥ '+range.min:range.min+'–'+range.max}`;
  const duplicated=new Set(value.filters.filter((f,i,all)=>all.some((x,j)=>j!==i&&x.value===f.value&&x.field!==f.field)).map(f=>f.value));
  const suggestionMatches=useMemo(()=>value.query.trim().length>=2?config.fields.flatMap(f=>f.source.kind==='local'?f.source.options.filter(o=>fold(o.label).includes(fold(value.query))).slice(0,3).map(o=>({...o,field:f.id,fieldLabel:f.label,fieldIcon:f.icon})):[]).slice(0,7):[],[value.query,config.fields]);
  const visibleSuggestions=variant!=='simple'&&suggestionsOpen&&suggestionMatches.length>0;
  // Reset the active choice when results change, not on a keyboard highlight.
  useEffect(()=>{setActiveSuggestion(0)},[value.query,config.fields]);
  function pickSuggestion(index:number){
    const option=suggestionMatches[index];if(!option)return;
    // Choosing a structured filter consumes its typed search term. Leaving the
    // term in `query` would unintentionally also restrict the title/author search.
    onChange({...setFilterState(config.fields.find(f=>f.id===option.field)?.selection==='single'?{...value,filters:value.filters.filter(f=>f.field!==option.field)}:value,option.field,option.value,'include'),query:''});
    setLabels(prev=>({...prev,[identity(option.field,option.value)]:option.label}));
    setSuggestionsOpen(false);setActiveSuggestion(0);
    inputRef.current?.focus();
  }
  function queryKeydown(e:ReactKeyboardEvent<HTMLInputElement>){
    if(e.key==='ArrowDown'&&visibleSuggestions){e.preventDefault();setActiveSuggestion(i=>(i+1)%suggestionMatches.length);return}
    if(e.key==='ArrowUp'&&visibleSuggestions){e.preventDefault();setActiveSuggestion(i=>(i-1+suggestionMatches.length)%suggestionMatches.length);return}
    if(e.key==='Enter'){
      e.preventDefault();
      if(visibleSuggestions)pickSuggestion(activeSuggestion);
      else onSearch(value);
      return;
    }
    if(e.key==='Escape'&&suggestionsOpen){e.preventDefault();setSuggestionsOpen(false);setActiveSuggestion(0)}
  }
  const modeButton=(mode:'all'|'any',label:string)=><button type="button" className={value.mode===mode?'gsb-active':''} aria-pressed={value.mode===mode} onClick={()=>onChange({...value,mode})}>{label}</button>;
  const ruleToken=(f:SearchQuery['filters'][number])=><span className="gsb-rule-token" key={identity(f.field,f.value)}>
    <button type="button" className="gsb-rule-move" aria-label={`Mover a ${f.operation==='include'?'Excluir':'Incluir'} ${labelFor(f.field,f.value)}`} title={`Mover a ${f.operation==='include'?'Excluir':'Incluir'}`} onClick={()=>changeFilter(f.field,f.value,f.operation==='include'?'exclude':'include')}>
      {duplicated.has(f.value)&&<small>{config.fields.find(x=>x.id===f.field)?.label}: </small>}{labelFor(f.field,f.value)} <span className="gsb-swap" aria-hidden="true"><ArrowLeftRight size={13}/></span>
    </button><button type="button" className="gsb-rule-remove" aria-label={`Eliminar ${labelFor(f.field,f.value)}`} title="Quitar filtro" onClick={()=>changeFilter(f.field,f.value,null)}><X size={13}/></button>
  </span>;
  return <section ref={rootRef} className={`gsb gsb-theme-${theme} ${className}`} data-theme={theme} aria-label="Búsqueda y filtros">
    <div className="gsb-search-line"><span className="gsb-glass" aria-hidden="true"><Search size={18}/></span><input ref={inputRef} aria-label="Buscar" role="combobox" aria-autocomplete="list" aria-expanded={visibleSuggestions} aria-controls={visibleSuggestions?suggestionsId:undefined} aria-activedescendant={visibleSuggestions?`${suggestionsId}-${activeSuggestion}`:undefined} placeholder={config.placeholder||'Buscar...'} value={value.query} onChange={e=>{onChange({...value,query:e.target.value});setActiveSuggestion(0);setSuggestionsOpen(true)}} onFocus={()=>setSuggestionsOpen(true)} onKeyDown={queryKeydown}/><span className="gsb-shortcut">Ctrl K</span><button className="gsb-search-button" onClick={()=>onSearch(value)}>Buscar</button>
      {visibleSuggestions&&<div className="gsb-suggestions" id={suggestionsId} role="listbox" aria-label="Sugerencias de búsqueda">{suggestionMatches.map((o,i)=><button type="button" role="option" id={`${suggestionsId}-${i}`} aria-selected={activeSuggestion===i} className={`gsb-suggestion ${activeSuggestion===i?'gsb-suggestion-active':''}`} key={identity(o.field,o.value)} onMouseEnter={()=>setActiveSuggestion(i)} onMouseDown={e=>e.preventDefault()} onClick={()=>pickSuggestion(i)}><span className="gsb-suggestion-icon" aria-hidden="true"><FieldIcon name={o.fieldIcon}/></span><span className="gsb-suggestion-copy"><strong>{o.label}</strong><small>{o.fieldLabel}</small></span></button>)}</div>}
    </div>
    {variant!=='simple'&&<div className="gsb-tools">
      <button className={`gsb-panel-button ${panel==='filters'?'gsb-open':''}`} aria-expanded={panel==='filters'} onClick={()=>togglePanel('filters')}><SlidersHorizontal size={15}/> Filtros avanzados <span>{panel==='filters'?<ChevronUp size={13}/>:<ChevronDown size={13}/>}</span></button>
      {variant==='advanced'&&<button className={`gsb-panel-button ${panel==='rules'?'gsb-open':''}`} aria-expanded={panel==='rules'} onClick={()=>togglePanel('rules')}><Diamond size={14}/> Reglas avanzadas</button>}
      <button className="gsb-reset" onClick={()=>onChange(createEmptyQuery(config.sorts?.[0]?{field:config.sorts[0].value,direction:config.sorts[0].direction??'desc'}:undefined))}>Restablecer todo <RotateCcw size={13}/></button>
    </div>}
    {variant!=='simple'&&(value.filters.length>0||Boolean(value.ranges?.length))&&<div className="gsb-groups">{config.fields.map(field=>{const group=labelGroup(field);if(!group)return null;return expanded===field.id?
      <div className="gsb-expanded" key={field.id}>{group.filters.map(f=><span className="gsb-expanded-item" key={f.value}>{variant==='filtered'?<span className={`gsb-readonly-state ${f.operation==='exclude'?'gsb-negative':''}`} title={f.operation==='exclude'?'Filtro excluido en la consulta recibida':'Filtro seleccionado'}>{f.operation==='exclude'?<Minus size={12}/>:<Check size={12}/>} {labelFor(f.field,f.value)}</span>:<button title="Cambiar inclusión/exclusión" className={f.operation==='exclude'?'gsb-negative':''} onClick={()=>changeFilter(f.field,f.value,f.operation==='include'?'exclude':'include')}>{f.operation==='include'?<Check size={12}/>:<Minus size={12}/>} {labelFor(f.field,f.value)}</button>}<button aria-label={`Quitar ${labelFor(f.field,f.value)}`} onClick={()=>changeFilter(f.field,f.value,null)}><X size={13}/></button></span>)}</div>
      :<button type="button" className="gsb-group" key={field.id} aria-expanded="false" onClick={()=>{setExpanded(field.id);setOpenField(null)}}><span className="gsb-group-field">{field.label}:</span><strong>{group.content.map((x,i)=><span key={i}>{i>0?', ':''}{x.operation==='exclude'&&<span className="gsb-exclusion">− </span>}{x.name}</span>)}</strong><ChevronDown size={13}/></button>})}{(value.ranges??[]).map(range=><span key={'range-'+range.field} className="gsb-range-chip">
       <span>{rangeName(range.field)}: {range.operation==='exclude'?'− ':''}{rangeDescription(range)}</span>
       <button type="button" aria-label={`Quitar rango ${rangeName(range.field)}`} onClick={()=>changeRange(range.field,null)}><X size={13}/></button>
      </span>)}</div>}
    {variant!=='simple'&&panel==='filters'&&<motion.div key="filters" initial={reduceMotion?false:{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={reduceMotion?{opacity:1}:{opacity:0,y:-5}} transition={{duration:reduceMotion?0:0.16}} className="gsb-advanced"><div className={`gsb-grid ${config.columns===2?'gsb-grid-2':''}`}>{config.fields.map(field=>{
      const selections=value.filters.filter(f=>f.field===field.id);const isOpen=openField===field.id;
      return <div className="gsb-filter-field" key={field.id} style={{order:config.fieldOrder?.indexOf(field.id)===-1?999:config.fieldOrder?.indexOf(field.id)}}><label>{field.label}</label><button className="gsb-filter-trigger" aria-expanded={isOpen} aria-label={`${field.label}, ${selections.length} seleccionados`} onClick={()=>toggleField(field.id)}><span className="gsb-filter-summary">{selections.length?selections.length<=2?selections.map(f=>`${f.operation==='exclude'?'− ':''}${labelFor(f.field,f.value)}`).join(', '):`${selections.length} filtros`:'Cualquiera'}</span><span className="gsb-trigger-right">{selections.length>1&&<span className="gsb-count">{selections.length}</span>}{isOpen?<ChevronUp size={13}/>:<ChevronDown size={13}/>}</span></button>
      {isOpen&&<div className="gsb-menu">{field.searchable!==false&&<input autoFocus aria-label={`Buscar ${field.label}`} placeholder={`Buscar ${field.label.toLowerCase()}...`} value={optionQuery} onChange={e=>setOptionQuery(e.target.value)}/>}<div className="gsb-options" role="group" aria-label={`Opciones de ${field.label}`}>{result.options.map(o=>{
        const status=value.filters.find(f=>f.field===field.id&&f.value===o.value)?.operation;
        return <button key={o.value} aria-label={`${o.label}: ${status==='include'?'seleccionado':status==='exclude'?'excluido':'sin seleccionar'}. ${variant==='filtered'||field.selection==='single'?'Alternar selección':'Cambiar estado'}`} type="button" aria-pressed={variant==='filtered'||field.selection==='single'?Boolean(status):undefined} className={`gsb-option ${status||''}`} onClick={()=>{setLabels(prev=>({...prev,[identity(field.id,o.value)]:o.label}));cycle(field.id,o.value)}}><span className="gsb-tristate" aria-hidden="true">{status==='include'?<Check size={13}/>:status==='exclude'?<Minus size={13}/>:null}</span><span>{o.label}</span></button>;
      })}{loading&&<div className="gsb-message">Cargando opciones...</div>}{error&&<div className="gsb-message">Error de carga <button onClick={retry}>Reintentar</button></div>}{!loading&&!error&&!result.options.length&&<div className="gsb-message">Sin opciones</div>}</div>{result.nextCursor&&<button className="gsb-more" onClick={loadMore} disabled={loading}>Cargar más</button>}{selections.length>0&&<button className="gsb-clear-field" onClick={()=>onChange({...value,filters:value.filters.filter(f=>f.field!==field.id)})}>Limpiar selección</button>}</div>}</div>})}
      {config.ranges?.map(def=><RangeField key={def.id} definition={def} order={config.fieldOrder?.indexOf(def.id)===-1?999:config.fieldOrder?.indexOf(def.id)} range={value.ranges?.find(r=>r.field===def.id)} onChange={(bounds,operation)=>changeRange(def.id,bounds,variant==='filtered'?(value.ranges?.find(r=>r.field===def.id)?.operation??'include'):(operation??'include'))}/>)}
      {Boolean(config.sorts?.length)&&<div className="gsb-filter-field" style={{order:config.fieldOrder?.indexOf('sort')===-1?999:config.fieldOrder?.indexOf('sort')}}><label>Ordenar por</label><select value={value.sort?.field??config.sorts?.[0]?.value} onChange={e=>{const entry=config.sorts?.find(x=>x.value===e.target.value);onChange({...value,sort:{field:e.target.value,direction:entry?.direction??'desc'}})}}>{config.sorts?.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></div>}</div></motion.div>}
    {variant==='advanced'&&panel==='rules'&&<motion.div key="rules" initial={reduceMotion?false:{opacity:0,y:-5}} animate={{opacity:1,y:0}} exit={reduceMotion?{opacity:1}:{opacity:0,y:-5}} transition={{duration:reduceMotion?0:0.16}} className="gsb-rules"><div className="gsb-rule-box gsb-included"><header><span className="gsb-rule-icon"><Check size={15}/></span><strong>Incluir</strong>{included.length+includedRanges.length>1&&<div className="gsb-modes">{modeButton('all','Todos')}{modeButton('any','Cualquiera')}</div>}</header><div className="gsb-rule-list">{included.map(ruleToken)}{includedRanges.map(range=><span className="gsb-rule-token" key={'range-'+range.field}><button className="gsb-rule-move" aria-label={`Mover a Excluir ${rangeName(range.field)}`} title="Mover a Excluir" onClick={()=>changeRange(range.field,{min:range.min,max:range.max},'exclude')}>{rangeName(range.field)}: {rangeDescription(range)} <ArrowLeftRight size={13}/></button><button className="gsb-rule-remove" aria-label={`Eliminar ${rangeName(range.field)}`} onClick={()=>changeRange(range.field,null)}><X size={13}/></button></span>)}{!included.length&&!includedRanges.length&&<span className="gsb-muted">Sin filtros incluidos</span>}</div></div><div className="gsb-rule-box gsb-excluded"><header><span className="gsb-rule-icon"><Minus size={15}/></span><strong>Excluir</strong></header><div className="gsb-rule-list">{excluded.map(ruleToken)}{excludedRanges.map(range=><span className="gsb-rule-token" key={'range-'+range.field}><button className="gsb-rule-move" aria-label={`Mover a Incluir ${rangeName(range.field)}`} title="Mover a Incluir" onClick={()=>changeRange(range.field,{min:range.min,max:range.max},'include')}>{rangeName(range.field)}: {rangeDescription(range)} <ArrowLeftRight size={13}/></button><button className="gsb-rule-remove" aria-label={`Eliminar ${rangeName(range.field)}`} onClick={()=>changeRange(range.field,null)}><X size={13}/></button></span>)}{!excluded.length&&!excludedRanges.length&&<span className="gsb-muted">Sin filtros excluidos</span>}</div></div></motion.div>}
  </section>;
}
