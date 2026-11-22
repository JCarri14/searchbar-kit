import {useMemo, useState} from 'react';
import type {CSSProperties} from 'react';
import {SearchBar} from '@searchbarkit/react';
import type {SearchBarVariant} from '@searchbarkit/react';
import {createEmptyQuery} from '@searchbarkit/core';
import type {SearchQuery} from '@searchbarkit/core';
import {type BuilderProject,type BuilderField,type BuilderTheme,presets,validateProject,parseProject,toSearchBarConfig,toThemeCss,exportReactExample,exportWebComponentExample,themeVariables,themeDefaults,resolvedTheme,parsePalette,exportPalette} from '@searchbarkit/config';
import {Blocks, Palette, Code2, Plus, Trash2, ArrowUp, ArrowDown, Settings2, Check, Copy, Download, Upload, RefreshCcw, Eye, X, Monitor, Smartphone, AlertCircle, ChevronDown} from 'lucide-react';

type Tab='fields'|'theme'|'export';
type BuilderTab='general'|'blocks'|'sorting';
type ExportKind='json'|'css'|'react'|'web';
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
const defaultField=(type:BuilderField['type'],index:number):BuilderField=>type==='range'?{id:`range${index}`,label:`Rango ${index}`,type:'range',min:0,max:100,step:1}: {id:`field${index}`,label:`Campo ${index}`,type,searchable:true,options:[{value:'option1',label:'Opción 1'},{value:'option2',label:'Opción 2'}]};
const fieldTypeName=(f:BuilderField)=>f.type==='range'?'Rango numérico':f.type==='single'?'Selección única':'Selección múltiple';
function downloadFile(name:string,content:string,mime:string){const url=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function FieldInput({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string}){return <label className="studio-property"><span>{label}</span><input value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>;}
function PaletteColor({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){
 const [draft,setDraft]=useState(value);
 const [focused,setFocused]=useState(false);
 const normalized=/^#[0-9a-fA-F]{6}$/.test(draft)?draft:value;
 return <label className="studio-palette-color"><span>{label}</span><input aria-label={`Seleccionar color ${label}`} title="Abrir selector de color" type="color" value={normalized} onChange={e=>{setDraft(e.target.value);onChange(e.target.value)}}/><input aria-label={`HEX ${label}`} value={focused?draft:value} onFocus={()=>{setDraft(value);setFocused(true)}} onBlur={()=>{setFocused(false);if(!/^#[0-9a-fA-F]{6}$/.test(draft))setDraft(value)}} onChange={e=>{setDraft(e.target.value);if(/^#[0-9a-fA-F]{6}$/.test(e.target.value))onChange(e.target.value)}}/></label>;
}

/** Shared visual row editor. No delimiter syntax is required for the primary workflow. */
type OptionRow={value:string;label:string};
function OptionRows({rows,onChange}: {rows:OptionRow[];onChange:(next:OptionRow[])=>void}){
 const [bulk,setBulk]=useState('');
 const values=rows.map(r=>r.value.trim()).filter(Boolean);
 const duplicates=new Set(values.filter((v,i)=>values.indexOf(v)!==i));
 const update=(i:number,patch:Partial<OptionRow>)=>onChange(rows.map((r,j)=>j===i?{...r,...patch}:r));
 const move=(i:number,d:-1|1)=>{const next=[...rows];const j=i+d;if(j<0||j>=next.length)return;[next[i],next[j]]=[next[j],next[i]];onChange(next)};
 return <div className="studio-row-editor"><div className="studio-row-head"><strong>Opciones</strong><span>{rows.length} valores</span></div>
  <div className="studio-row-labels"><span>Valor (ID)</span><span>Etiqueta visible</span><span className="sr-only">Acciones</span></div>
  {rows.map((r,i)=><div className="studio-editable-row" key={i}>
   <input aria-label={`Valor opción ${i+1}`} value={r.value} className={!r.value.trim()||duplicates.has(r.value.trim())?'invalid':''} title={duplicates.has(r.value.trim())?'Identificador duplicado':!r.value.trim()?'Introduce un valor':''} onChange={e=>update(i,{value:e.target.value})}/>
   <input aria-label={`Etiqueta opción ${i+1}`} value={r.label} className={!r.label.trim()?'invalid':''} onChange={e=>update(i,{label:e.target.value})}/>
   <div className="studio-row-actions"><button aria-label={`Subir opción ${i+1}`} title="Subir" disabled={i===0} onClick={()=>move(i,-1)}><ArrowUp size={13}/></button><button aria-label={`Bajar opción ${i+1}`} title="Bajar" disabled={i===rows.length-1} onClick={()=>move(i,1)}><ArrowDown size={13}/></button><button className="studio-icon-danger" aria-label={`Eliminar opción ${i+1}`} title="Eliminar" onClick={()=>onChange(rows.filter((_,j)=>j!==i))}><Trash2 size={13}/></button></div>
  </div>)}
  {!rows.length&&<p className="hint">No hay valores. Añade uno para empezar.</p>}
  <button className="studio-add-row" onClick={()=>onChange([...rows,{value:'',label:''}])}><Plus size={14}/> Añadir opción</button>
  <details className="studio-bulk"><summary>Edición masiva (opcional)</summary><p className="hint">Pega filas separadas por tabulador, punto y coma o « | ». Una opción por línea.</p><textarea aria-label="Pegar opciones" rows={4} value={bulk} onChange={e=>setBulk(e.target.value)}/><button onClick={()=>{const incoming=bulk.split(/\r?\n/).filter(x=>x.trim()).map(line=>{const parts=line.includes('\t')?line.split('\t'):line.includes('|')?line.split('|'):line.split(';');return {value:parts[0]?.trim()??'',label:(parts.slice(1).join(' ').trim()||parts[0]?.trim()||'')}});onChange([...rows,...incoming]);setBulk('');}}>Añadir filas pegadas</button></details>
  {duplicates.size>0&&<p className="studio-validation" role="alert">Valores duplicados: {Array.from(duplicates).join(', ')}</p>}
 </div>;
}
type SortRow={value:string;label:string;direction:'asc'|'desc'};
function SortRows({rows,onChange}: {rows:SortRow[];onChange:(next:SortRow[])=>void}){
 const [expanded,setExpanded]=useState<number|null>(null);
 const values=rows.map(r=>r.value.trim()).filter(Boolean);
 const duplicates=new Set(values.filter((v,i)=>values.indexOf(v)!==i));
 const update=(i:number,patch:Partial<SortRow>)=>onChange(rows.map((r,j)=>j===i?{...r,...patch}:r));
 const move=(i:number,d:-1|1)=>{const next=[...rows];const j=i+d;if(j<0||j>=rows.length)return;[next[i],next[j]]=[next[j],next[i]];onChange(next);setExpanded(current=>current===i?j:current===j?i:current)};
 const remove=(i:number)=>{onChange(rows.filter((_,j)=>j!==i));setExpanded(current=>current===null?null:current===i?null:current>i?current-1:current)};
 return <div className="studio-row-editor"><div className="studio-row-head"><strong>Criterios de ordenación</strong><span>{rows.length}</span></div><p className="hint">El primer criterio será el predeterminado. Pulsa un criterio para editar sus propiedades.</p>
  {rows.map((r,i)=><section key={i} className={`studio-sort-row ${expanded===i?'is-expanded':''}`}>
   <div className="studio-sort-row-top"><button className="studio-sort-toggle" aria-expanded={expanded===i} aria-controls={`studio-sort-details-${i}`} onClick={()=>setExpanded(expanded===i?null:i)}><span className="studio-sort-title">{r.label.trim()||`Criterio ${i+1}`}{i===0&&<span className="studio-default-tag">Predeterminado</span>}</span><small>{r.value.trim()||'Campo sin definir'} · {r.direction==='asc'?'Ascendente':'Descendente'}</small><ChevronDown className={`studio-sort-chevron ${expanded===i?'open':''}`} size={15}/></button><div className="studio-row-actions"><button aria-label={`Subir orden ${i+1}`} title="Subir criterio" disabled={i===0} onClick={()=>move(i,-1)}><ArrowUp size={14}/></button><button aria-label={`Bajar orden ${i+1}`} title="Bajar criterio" disabled={i===rows.length-1} onClick={()=>move(i,1)}><ArrowDown size={14}/></button><button className="studio-icon-danger" aria-label={`Eliminar orden ${i+1}`} title="Eliminar criterio" onClick={()=>remove(i)}><Trash2 size={14}/></button></div></div>
   {expanded===i&&<div id={`studio-sort-details-${i}`} className="studio-sort-details"><div className="studio-sort-labels"><label>Etiqueta visible<input aria-label={`Etiqueta orden ${i+1}`} className={!r.label.trim()?'invalid':''} value={r.label} onChange={e=>update(i,{label:e.target.value})}/></label><label>Campo (ID)<input aria-label={`Campo orden ${i+1}`} className={!r.value.trim()||duplicates.has(r.value.trim())?'invalid':''} value={r.value} onChange={e=>update(i,{value:e.target.value})}/></label></div><label className="studio-sort-dir">Dirección<select aria-label={`Dirección orden ${i+1}`} value={r.direction} onChange={e=>update(i,{direction:e.target.value as 'asc'|'desc'})}><option value="asc">Ascendente</option><option value="desc">Descendente</option></select></label></div>}
  </section>)}
  <button className="studio-add-row" onClick={()=>{onChange([...rows,{value:'',label:'',direction:'asc'}]);setExpanded(rows.length)}}><Plus size={14}/> Añadir criterio</button>
  {duplicates.size>0&&<p className="studio-validation" role="alert">Criterios duplicados: {Array.from(duplicates).join(', ')}</p>}
 </div>;
}
const tokenGroups=[
 {name:'Superficies y contenedores',desc:'Fondos del buscador, paneles y menús.',keys:['background','surface','elevated','popover']},
 {name:'Texto y legibilidad',desc:'Texto principal, secundario y ayudas.',keys:['text','muted','placeholder']},
 {name:'Controles y botones',desc:'Campos, botón Buscar y estados de interacción.',keys:['control','onPrimary','selected','hover','disabled']},
 {name:'Bordes y foco',desc:'Contornos, separadores y navegación con teclado.',keys:['border','borderStrong','focus']}
] as const;
const tokenDescriptions:Record<string,string>={
 background:'Fondo general de la SearchBar',surface:'Superficie de los paneles',elevated:'Superficie elevada de elementos',popover:'Desplegables, sugerencias y menús',text:'Texto principal',muted:'Texto secundario',placeholder:'Texto orientativo en inputs',control:'Fondo de selectores y entradas',onPrimary:'Texto sobre el botón principal',selected:'Selección y filtros activos',hover:'Estado hover de controles',disabled:'Elementos deshabilitados',border:'Bordes de campos y paneles',borderStrong:'Contornos destacados',focus:'Anillo de foco de teclado'
};

function contrastRatio(foreground:string,background:string){
 const luminance=(hex:string)=>{const values=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4));return .2126*values[0]+.7152*values[1]+.0722*values[2]};
 const a=luminance(foreground),b=luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
export function Studio({project,setProject,query,setQuery}:{
 project:BuilderProject;
 setProject:import('react').Dispatch<import('react').SetStateAction<BuilderProject>>;
 query:SearchQuery;
 setQuery:import('react').Dispatch<import('react').SetStateAction<SearchQuery>>;
}){
 const [tab,setTab]=useState<Tab>('fields');
 const [selected,setSelected]=useState<string|null>(null);
 const [builderTab,setBuilderTab]=useState<BuilderTab>('blocks');
 const [paletteText,setPaletteText]=useState('');
 const [paletteError,setPaletteError]=useState('');
 const [paletteOpen,setPaletteOpen]=useState(false);
 const [exportKind,setExportKind]=useState<ExportKind>('json');
 const [screen,setScreen]=useState<'desktop'|'mobile'>('desktop');
 const [importOpen,setImportOpen]=useState(false);
 const [importText,setImportText]=useState('');
 const [importError,setImportError]=useState('');
 const [copied,setCopied]=useState(false);
 const [highlightToken,setHighlightToken]=useState<string|null>(null);
 const [submitted,setSubmitted]=useState(false);
 const [panelOpen,setPanelOpen]=useState(false);
 const [showQuery,setShowQuery]=useState(false);

 const issues=useMemo(()=>validateProject(project),[project]);
 const config=useMemo(()=>toSearchBarConfig(project),[project]);
 const themeStyle=useMemo(()=>themeVariables(project.theme) as CSSProperties,[project.theme]);
 const field=project.fields.find(f=>f.id===selected)??null;
 const setField=(id:string,patch:Partial<BuilderField>)=>setProject(p=>({...p,fields:p.fields.map(f=>f.id===id?{...f,...patch}:f)}));
 const setTheme=(patch:Partial<BuilderTheme>)=>setProject(p=>({...p,theme:{...p.theme,...patch}}));
 const setVariant=(variant:BuilderProject['variant'])=>setProject(p=>({...p,variant}));
  function addField(type:BuilderField['type']){const ids=new Set(project.fields.map(f=>f.id));let i=project.fields.length+1;while(ids.has(`field${i}`)||ids.has(`range${i}`))i++;const next=defaultField(type,i);setProject(p=>({...p,fields:[...p.fields,next]}));setSelected(next.id);setTab('fields');setBuilderTab('blocks');}
 function removeField(id:string){setProject(p=>({...p,fields:p.fields.filter(f=>f.id!==id)}));setQuery(p=>({...p,filters:p.filters.filter(f=>f.field!==id),ranges:p.ranges?.filter(r=>r.field!==id)}));if(selected===id)setSelected(null)}
 function moveField(id:string,dir:-1|1){setProject(p=>{const arr=[...p.fields];const i=arr.findIndex(f=>f.id===id);const j=i+dir;if(j<0||j>=arr.length)return p;[arr[i],arr[j]]=[arr[j],arr[i]];return {...p,fields:arr};});}
 function output(){if(exportKind==='json')return JSON.stringify(project,null,2);if(exportKind==='css')return toThemeCss(project.theme);if(exportKind==='react')return exportReactExample(project);return exportWebComponentExample(project);}
 function importConfig(){try{const p=parseProject(JSON.parse(importText));setProject(clone(p));setQuery(createEmptyQuery());setSelected(p.fields[0]?.id??null);setImportOpen(false);setImportError('');setTab('fields');setBuilderTab('blocks');}catch(e){setImportError(e instanceof Error?e.message:String(e));}}
 async function copyExport(){try{await navigator.clipboard.writeText(output());setCopied(true);setTimeout(()=>setCopied(false),1600);}catch{downloadFile('searchbarkit-export.txt',output(),'text/plain');}}
 function exportFile(){const ext=exportKind==='json'?'json':exportKind==='css'?'css':exportKind==='react'?'tsx':'html';downloadFile(`searchbar-${exportKind}.${ext}`,output(),exportKind==='json'?'application/json':'text/plain');}
 return <div className="studio-app">
  <div className="studio-canvas-toolbar" role="toolbar" aria-label="Herramientas de SearchbarKit">
    <div className="studio-toolbar-group studio-canvas-customize">
      <button className={panelOpen?'is-selected':''} onClick={()=>{setPanelOpen(v=>!v);setTab('fields')}} aria-pressed={panelOpen}><Blocks size={15}/> Personalizar</button>
    </div>
    <div className="studio-variant-tabs" role="group" aria-label="Variante de búsqueda">
      {([['simple','Simple'],['filtered','Con filtros'],['advanced','Avanzada']] as const).map(([value,label])=><button type="button" key={value} aria-pressed={project.variant===value} className={project.variant===value?'active':''} onClick={()=>setVariant(value)}>{label}</button>)}
    </div>
  </div>
  <main className="studio-main">{panelOpen&&<aside className="studio-sidebar"><div className="studio-tool-panel-head"><strong>Personalizar SearchbarKit</strong><button aria-label="Cerrar personalización" title="Cerrar" onClick={()=>setPanelOpen(false)}><X size={15}/></button></div><div className="studio-panel-section-switch" role="group" aria-label="Sección de personalización"><button aria-pressed={tab==='fields'} className={tab==='fields'?'active':''} onClick={()=>setTab('fields')}><Blocks size={14}/> Constructor</button><button aria-pressed={tab==='theme'} className={tab==='theme'?'active':''} onClick={()=>setTab('theme')}><Palette size={14}/> Tema</button><button aria-pressed={tab==='export'} className={tab==='export'?'active':''} onClick={()=>setTab('export')}><Code2 size={14}/> Exportar</button></div>
   <div className="studio-sidebar-body">
   {tab==='fields'&&<>
    <nav className="studio-builder-tabs" aria-label="Secciones del constructor">
      {([['general','General'],['blocks','Bloques'],['sorting','Ordenación']] as const).map(([key,label])=><button key={key} className={builderTab===key?'active':''} onClick={()=>setBuilderTab(key)}>{label}</button>)}
    </nav>
    {builderTab==='general'&&<><div className="studio-section-title"><div><h2>Configuración general</h2><p>Define la experiencia de búsqueda.</p></div></div><div className="studio-properties">
      <FieldInput label="Nombre del proyecto" value={project.name} onChange={name=>setProject(p=>({...p,name}))}/>
      <FieldInput label="Placeholder" value={project.search.placeholder} onChange={placeholder=>setProject(p=>({...p,search:{placeholder}}))}/>
      <label className="studio-property"><span>Columnas de filtros</span><select value={project.layout.columns} onChange={e=>setProject(p=>({...p,layout:{columns:Number(e.target.value) as 2|3}}))}><option value="2">2 columnas</option><option value="3">3 columnas</option></select></label>
    </div></>}
    {builderTab==='blocks'&&<><div className="studio-section-title"><div><h2>Campos</h2><p>Selecciona un campo para editar sus propiedades.</p></div></div>
      <div className="studio-blocks">{project.fields.map((f,i)=><div key={f.id} className={`studio-block ${selected===f.id?'selected':''}`}><button className="studio-block-main" onClick={()=>setSelected(f.id)}><span className="studio-block-icon">{f.type==='range'?'#':f.type==='single'?'◉':'☷'}</span><span><strong>{f.label||f.id}</strong><small>{fieldTypeName(f)}</small></span></button><div className="studio-block-actions"><button title="Subir" disabled={i===0} onClick={()=>moveField(f.id,-1)}><ArrowUp size={14}/></button><button title="Bajar" disabled={i===project.fields.length-1} onClick={()=>moveField(f.id,1)}><ArrowDown size={14}/></button><button className="studio-icon-danger" title="Eliminar" onClick={()=>removeField(f.id)}><Trash2 size={14}/></button></div></div>)}</div>
      <div className="studio-add"><button className="studio-button-add" onClick={()=>addField('single')}><Plus size={14}/> Selección única</button><button className="studio-button-add" onClick={()=>addField('multiple')}><Plus size={14}/> Selección múltiple</button><button className="studio-button-add" onClick={()=>addField('range')}><Plus size={14}/> Rango numérico</button></div>
      {!project.fields.length&&<p className="hint">Añade un bloque para empezar.</p>}
    </>}
    {builderTab==='sorting'&&<><div className="studio-section-title"><div><h2>Ordenación</h2><p>Edita criterios y selecciona el predeterminado moviéndolo al primer lugar.</p></div></div><SortRows rows={project.sorts} onChange={sorts=>setProject(p=>({...p,sorts}))}/></>}
   </>}
   {tab==='theme'&&<><div className="studio-section-title"><div><h2>Theme Playground</h2><p>Paletas semánticas y personalización.</p></div></div>
    <div className="studio-properties">
      <label className="studio-property"><span>Modo</span><div className="studio-segment">{(['dark','light','custom'] as const).map(mode=><button key={mode} className={project.theme.mode===mode?'chosen':''} onClick={()=>setTheme(mode==='custom'?{mode,base:project.theme.mode==='light'?'light':project.theme.base??'dark',palette:{...resolvedTheme(project.theme)}}:{mode,palette:undefined,accent:themeDefaults[mode].accent,border:undefined,surface:undefined,text:undefined,muted:undefined,control:undefined})}>{mode==='dark'?'Oscuro':mode==='light'?'Claro':'Custom'}</button>)}</div></label>
      {project.theme.mode==='custom'&&<label className="studio-property"><span>Preset base</span><select value={project.theme.base??'dark'} onChange={e=>setTheme({base:e.target.value as 'dark'|'light'})}><option value="dark">Oscuro</option><option value="light">Claro</option></select></label>}
      <label className="studio-property"><span>Radio · {project.theme.radius}px</span><input type="range" min="0" max="24" value={project.theme.radius} onChange={e=>setTheme({radius:Number(e.target.value)})}/></label>
      <label className="studio-property"><span>Densidad</span><select value={project.theme.density} onChange={e=>setTheme({density:e.target.value as BuilderTheme['density']})}><option value="compact">Compacta</option><option value="normal">Normal</option><option value="comfortable">Cómoda</option></select></label>
      <h3>Colores principales</h3>
      {(['primary','secondary','accent','success','danger','warning','info'] as const).map(key=><PaletteColor key={key} label={key} value={resolvedTheme(project.theme)[key]} onChange={v=>setTheme({mode:'custom',base:project.theme.mode==='light'?'light':project.theme.base??'dark',palette:{...resolvedTheme(project.theme),[key]:v},...(key==='accent'?{accent:v}:{})})}/>)}
      <details className="studio-details"><summary>Colores avanzados</summary><div className="studio-token-groups">{tokenGroups.map(group=><section className="studio-token-group" key={group.name}><h4>{group.name}</h4><p>{group.desc}</p><div className="studio-palette-list">{group.keys.map(key=><div key={key} className={`studio-token-row ${highlightToken===key?'studio-token-active':''}`} onMouseEnter={()=>setHighlightToken(key)} onMouseLeave={()=>setHighlightToken(null)} onFocus={()=>setHighlightToken(key)} onBlur={()=>setHighlightToken(null)}><PaletteColor label={key} value={resolvedTheme(project.theme)[key]} onChange={v=>setTheme({mode:'custom',base:project.theme.mode==='light'?'light':project.theme.base??'dark',palette:{...resolvedTheme(project.theme),[key]:v}})}/><small>{tokenDescriptions[key]}</small></div>)}</div></section>)}</div></details>
      <div className="studio-palette-actions"><button onClick={()=>{setPaletteOpen(true);setPaletteText('');setPaletteError('')}}><Upload size={14}/> Importar paleta</button><button onClick={()=>downloadFile('searchbarkit-palette.json',exportPalette(project.theme),'application/json')}><Download size={14}/> Exportar paleta</button></div>
      <div className="studio-contrast"><strong>Contraste de texto</strong><span>{contrastRatio(resolvedTheme(project.theme).text,resolvedTheme(project.theme).surface).toFixed(2)}:1 · {contrastRatio(resolvedTheme(project.theme).text,resolvedTheme(project.theme).surface)>=4.5?'AA normal: correcto':'Revisar (inferior a 4.5:1)'}</span></div>
      <button onClick={()=>setTheme(clone(presets.manga.theme))}><RefreshCcw size={14}/> Restablecer tema</button>
    </div>
   </>}
   {tab==='export'&&<><div className="studio-section-title"><div><h2>Exportar buscador</h2><p>Configuración portable y ejemplos de integración.</p></div></div><div className="studio-properties"><div className="studio-export-actions"><button onClick={()=>{setImportOpen(true);setImportText('');setImportError('')}}><Upload size={14}/> Importar JSON</button><button onClick={()=>setShowQuery(v=>!v)} aria-pressed={showQuery}><Code2 size={14}/> {showQuery?'Ocultar consulta':'Ver consulta'}</button></div><label className="studio-property"><span>Formato</span><select value={exportKind} onChange={e=>setExportKind(e.target.value as ExportKind)}><option value="json">Configuración JSON</option><option value="css">Tokens CSS</option><option value="react">Ejemplo React + TypeScript</option><option value="web">Ejemplo Web Component</option></select></label><div className="studio-export-actions"><button disabled={issues.length>0} title={issues.length?"Corrige la configuración antes de exportar":"Copiar código"} onClick={copyExport}><Copy size={14}/> {copied?'Copiado':'Copiar'}</button><button disabled={issues.length>0} title={issues.length?"Corrige la configuración antes de exportar":"Descargar archivo"} onClick={exportFile}><Download size={14}/> Descargar</button></div><pre className="studio-code">{output()}</pre><p className="hint">El JSON contiene solo configuración estática. Los proveedores remotos y la búsqueda real se conectan desde tu aplicación. No exportamos claves privadas ni funciones.</p></div></>}
   </div>
  </aside>}
  {panelOpen&&tab==='fields'&&builderTab==='blocks'&&field&&<aside className="studio-inspector"><div className="studio-inspector-head"><Settings2 size={16}/><strong>Propiedades</strong>{selected&&<button aria-label="Cerrar propiedades" onClick={()=>setSelected(null)}><X size={15}/></button>}</div><div className="studio-inspector-body">   {field&&<div className="studio-field-editor" key={selected}><div className="studio-section-title"><h2><Settings2 size={16}/> Propiedades de campo</h2><button title="Cerrar" onClick={()=>setSelected(null)}><X size={15}/></button></div><div className="studio-properties"><FieldInput label="Nombre visible" value={field.label} onChange={label=>setField(field.id,{label})}/><FieldInput label="Identificador (JSON)" value={field.id} onChange={id=>{setProject(p=>({...p,fields:p.fields.map(f=>f.id===field.id?{...f,id}:f)}));setSelected(id);setQuery(createEmptyQuery());}}/><label className="studio-property"><span>Tipo</span><select value={field.type} onChange={e=>{const type=e.target.value as BuilderField['type'];setField(field.id,{type,options:type==='range'?undefined:(field.options?.length?field.options:[{value:'option1',label:'Opción 1'}]),min:type==='range'?0:undefined,max:type==='range'?100:undefined});setQuery(createEmptyQuery())}}><option value="single">Selección única</option><option value="multiple">Selección múltiple</option><option value="range">Rango numérico</option></select></label>
    {field.type!=='range'?<><label className="studio-check"><input type="checkbox" checked={field.searchable??true} onChange={e=>setField(field.id,{searchable:e.target.checked})}/> Permitir buscar opciones</label><OptionRows rows={field.options??[]} onChange={options=>setField(field.id,{options})}/></>:<div className="studio-grid-two"><label className="studio-property"><span>Mínimo</span><input type="number" value={field.min??''} onChange={e=>setField(field.id,{min:e.target.value===''?undefined:Number(e.target.value)})}/></label><label className="studio-property"><span>Máximo</span><input type="number" value={field.max??''} onChange={e=>setField(field.id,{max:e.target.value===''?undefined:Number(e.target.value)})}/></label><label className="studio-property"><span>Paso</span><input type="number" min="0.001" step="any" value={field.step??1} onChange={e=>setField(field.id,{step:Number(e.target.value)})}/></label><FieldInput label="Unidad" value={field.unit??''} onChange={unit=>setField(field.id,{unit})}/></div>}
   </div></div>}{!field&&<p className="hint">Selecciona un bloque en la izquierda para editar aquí sus propiedades.</p>}</div></aside>}
  <section className="studio-workspace">
   <h1 className="site-visually-hidden">{project.name || 'SearchbarKit'} — {project.variant} SearchBar</h1>
   <div className="studio-view-actions studio-view-floating"><button className={screen==='desktop'?'active':''} aria-label="Escritorio" onClick={()=>setScreen('desktop')}><Monitor size={17}/></button><button className={screen==='mobile'?'active':''} aria-label="Móvil" onClick={()=>setScreen('mobile')}><Smartphone size={17}/></button></div>
  {issues.length>0&&<div className="studio-errors" role="alert"><AlertCircle size={16}/><div><strong>{issues.length} problema{issues.length===1?'':'s'} en la configuración</strong>{issues.slice(0,5).map((issue,i)=><div key={i}>{issue.path}: {issue.message}</div>)}</div></div>}
  <div className={`studio-preview-wrap ${screen==='mobile'?'mobile':''}`}><div className={`studio-preview ${highlightToken?`studio-highlight-${highlightToken}`:''}`} style={themeStyle}><SearchBar config={config} variant={project.variant as SearchBarVariant} theme={project.theme.mode==='custom'?(project.theme.base??'dark'):project.theme.mode} value={query} onChange={setQuery} onSearch={()=>setSubmitted(true)} onError={error=>console.error('SearchBar preview error',error)}/></div></div>
  {showQuery&&<div className="studio-data"><div className="studio-data-title"><div><Eye size={17}/> Consulta emitida <small>{submitted?'Búsqueda enviada':'Se actualiza mientras editas'}</small></div><div className="studio-query-actions"><button onClick={()=>setQuery(createEmptyQuery())}><RefreshCcw size={13}/> Restablecer</button><button aria-label="Cerrar consulta JSON" title="Cerrar" onClick={()=>setShowQuery(false)}><X size={13}/></button></div></div><pre>{JSON.stringify(query,null,2)}</pre></div>}
  </section>
  </main>
  {importOpen&&<div className="studio-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setImportOpen(false)}}><section role="dialog" aria-modal="true" aria-label="Importar configuración" className="studio-modal"><div className="studio-modal-head"><h2>Importar configuración JSON</h2><button onClick={()=>setImportOpen(false)} aria-label="Cerrar"><X size={18}/></button></div><p>Pega aquí un JSON exportado desde SearchbarKit Studio. Se validará antes de sustituir el diseño actual.</p><textarea value={importText} onChange={e=>setImportText(e.target.value)} rows={12} placeholder='{"version":1,...}'/>{importError&&<pre className="studio-import-error" role="alert">{importError}</pre>}<footer><button onClick={()=>setImportOpen(false)}>Cancelar</button><button className="primary" onClick={importConfig}><Check size={15}/> Importar</button></footer></section></div>}
 {paletteOpen&&<div className="studio-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setPaletteOpen(false)}}><section className="studio-modal" role="dialog" aria-modal="true" aria-label="Importar paleta"><div className="studio-modal-head"><h2>Importar paleta JSON</h2><button onClick={()=>setPaletteOpen(false)} aria-label="Cerrar"><X size={18}/></button></div><p>Pega un JSON con colors, por ejemplo {`{ "colors": { "primary": "#2563eb" } }`}. Los colores no proporcionados se conservan.</p><textarea rows={11} value={paletteText} onChange={e=>setPaletteText(e.target.value)} placeholder='{"colors":{"primary":"#2563eb"}}'/>{paletteError&&<p role="alert" className="studio-import-error">{paletteError}</p>}<footer><button onClick={()=>setPaletteOpen(false)}>Cancelar</button><button className="primary" onClick={()=>{try{setTheme(parsePalette(JSON.parse(paletteText),project.theme));setPaletteOpen(false);setPaletteError('')}catch(e){setPaletteError(e instanceof Error?e.message:String(e))}}}>Aplicar paleta</button></footer></section></div>}
 </div>;
}

