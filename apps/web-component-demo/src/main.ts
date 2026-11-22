import {defineSearchBarElement} from '@searchbarkit/web-component';
import {createEmptyQuery} from '@searchbarkit/core';
import type {SearchBarElement} from '@searchbarkit/web-component';

defineSearchBarElement();
document.body.style.cssText='margin:0;background:#0b1220;color:#e2e8f0;font:14px system-ui;padding:28px';
document.querySelector('#app')!.innerHTML=`<h1>Web Component — integración sin React en el consumidor</h1>
 <p>Un único custom element con temas CSS y eventos nativos.</p>
 <div style="display:flex;gap:8px;margin-bottom:16px"><button id="dark">Oscuro</button><button id="light">Claro</button><button id="accent">Acento violeta</button></div>
 <searchbarkit></searchbarkit><h2>Consulta emitida</h2><pre id="output" style="white-space:pre-wrap"></pre>`;
const element=document.querySelector('searchbarkit') as SearchBarElement;
element.config={
 placeholder:'Buscar en el catálogo...',
 fields:[
  {id:'type',label:'Tipo',source:{kind:'local',options:[{value:'manga',label:'Manga'},{value:'manhwa',label:'Manhwa'}]}},
  {id:'genre',label:'Género',source:{kind:'local',options:[{value:'action',label:'Acción'},{value:'fantasy',label:'Fantasía'},{value:'romance',label:'Romance'}]}}
 ],
 sorts:[{value:'updated',label:'Actualizado recientemente'}]
};
element.value=createEmptyQuery();
element.variant='advanced';
const out=document.getElementById('output')!;
const show=(query:unknown)=>out.textContent=JSON.stringify(query,null,2);
show(element.value);
element.addEventListener('search-change',(event:Event)=>show((event as CustomEvent).detail));
element.addEventListener('search-submit',(event:Event)=>show((event as CustomEvent).detail));
element.addEventListener('search-error',(event:Event)=>console.error((event as CustomEvent).detail));
document.getElementById('dark')!.onclick=()=>element.theme='dark';
document.getElementById('light')!.onclick=()=>element.theme='light';
document.getElementById('accent')!.onclick=()=>element.style.setProperty('--gs-accent','#805ad5');
