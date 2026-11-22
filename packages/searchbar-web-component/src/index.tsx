/** Experimental framework-neutral distribution. React remains the only renderer. */
import {createRoot, type Root} from 'react-dom/client';
import {SearchBar} from '@searchbarkit/react';
import {createEmptyQuery, deserializeSearchQuery, serializeSearchQuery, type SearchQuery} from '@searchbarkit/core';
import type {SearchBarConfig, SearchBarVariant} from '@searchbarkit/react';
import styles from '@searchbarkit/react/styles.css?inline';

/** Reject malformed host input instead of letting invalid JSON crash React. */
export function isSearchBarConfig(input: unknown): input is SearchBarConfig {
 if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
 const c=input as Record<string,unknown>;
 if (!Array.isArray(c.fields) || c.fields.length>100) return false;
 if (c.ranges!==undefined && (!Array.isArray(c.ranges)||c.ranges.length>40)) return false;
 if (c.sorts!==undefined && (!Array.isArray(c.sorts)||c.sorts.length>100)) return false;
 const ids=new Set<string>();
 for(const item of c.fields){
  if(!item||typeof item!=='object'||Array.isArray(item))return false;
  const f=item as Record<string,unknown>;
  if(typeof f.id!=='string'||!f.id||ids.has(f.id)||typeof f.label!=='string')return false;
  ids.add(f.id);
  if(!f.source||typeof f.source!=='object'||Array.isArray(f.source))return false;
  const source=f.source as Record<string,unknown>;
  // Attribute JSON can only express local sources. Remote providers require a JS property.
  if(source.kind==='local'){
   if(!Array.isArray(source.options)||source.options.length>1000||!source.options.every(o=>o&&typeof o==='object'&&typeof o.value==='string'&&typeof o.label==='string'))return false;
  }else if(source.kind==='remote'){
   const provider=source.provider as Record<string,unknown>|undefined;
   if(!provider||typeof provider.search!=='function'||typeof provider.resolve!=='function')return false;
  } else return false;
 }
 return true;
}
export function isSearchQuery(input: unknown): input is SearchQuery {
 try {return Boolean(deserializeSearchQuery(serializeSearchQuery(input as SearchQuery)));} catch {return false;}
}

export interface SearchBarElement extends HTMLElement {
 config: SearchBarConfig | null;
 value: SearchQuery;
 variant: SearchBarVariant;
 theme: 'dark' | 'light';
}

class GenericSearchBarElement extends HTMLElement implements SearchBarElement {
 static get observedAttributes() {return ['config','value','variant','theme'];}
 private reactRoot: Root | null = null;
 private mountNode: HTMLDivElement;
 private searchConfig: SearchBarConfig | null = null;
 private searchValue: SearchQuery = createEmptyQuery();
 private selectedVariant: SearchBarVariant = 'advanced';
 private selectedTheme: 'dark' | 'light' = 'dark';

 constructor() {
  super();
  const shadow=this.attachShadow({mode:'open'});
  const style=document.createElement('style');
  style.textContent=styles;
  shadow.appendChild(style);
  this.mountNode=document.createElement('div');
  shadow.appendChild(this.mountNode);
 }
 connectedCallback() {
  if(!this.reactRoot)this.reactRoot=createRoot(this.mountNode);
  this.renderSearch();
 }
 disconnectedCallback() {
  this.reactRoot?.unmount();
  this.reactRoot=null;
 }
 attributeChangedCallback(name:string,_previous:string|null, next:string|null) {
  if(name==='config' && next) {
   try {this.config=JSON.parse(next) as SearchBarConfig;}
   catch(error) {this.emitError(error);}
  }
  if(name==='value' && next) {
   try {this.value=JSON.parse(next) as SearchQuery;}
   catch(error) {this.emitError(error);}
  }
  if(name==='variant' && next)this.variant=next as SearchBarVariant;
  if(name==='theme' && next)this.theme=next==='light'?'light':'dark';
 }
 get config(){return this.searchConfig;}
 set config(next:SearchBarConfig|null){if(next!==null&&!isSearchBarConfig(next)){this.emitError(new TypeError('Invalid SearchBar config'));return;}this.searchConfig=next;this.renderSearch();}
 get value(){return this.searchValue;}
 set value(next:SearchQuery){if(!isSearchQuery(next)){this.emitError(new TypeError('Invalid SearchBar query'));return;}this.searchValue=next;this.renderSearch();}
 get variant(){return this.selectedVariant;}
 set variant(next:SearchBarVariant){if(!['simple','filtered','advanced'].includes(next)){this.emitError(new TypeError('Invalid SearchBar variant'));return;}this.selectedVariant=next;this.renderSearch();}
 get theme(){return this.selectedTheme;}
 set theme(next:'dark'|'light'){if(next!=='dark'&&next!=='light'){this.emitError(new TypeError('Invalid SearchBar theme'));return;}this.selectedTheme=next;this.renderSearch();}
 private emitError(error:unknown){this.dispatchEvent(new CustomEvent('search-error',{detail:error,bubbles:true,composed:true}));}
 private renderSearch(){
  if(!this.reactRoot||!this.searchConfig)return;
  this.reactRoot.render(<SearchBar
   config={this.searchConfig}
   value={this.searchValue}
   variant={this.selectedVariant}
   theme={this.selectedTheme}
   onChange={next=>{
    this.searchValue=next;
    this.renderSearch();
    this.dispatchEvent(new CustomEvent('search-change',{detail:next,bubbles:true,composed:true}));
   }}
   onSearch={query=>{this.dispatchEvent(new CustomEvent('search-submit',{detail:query,bubbles:true,composed:true}));}}
   onError={error=>this.emitError(error)} />);
 }
}

export function defineSearchBarElement(tagName='searchbarkit') {
 if(!customElements.get(tagName))customElements.define(tagName,GenericSearchBarElement);
}
export {GenericSearchBarElement};
