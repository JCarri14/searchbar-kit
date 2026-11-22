#!/usr/bin/env node
/** Keep the shadcn-owned source distribution in sync with actual library sources. */
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const check=process.argv.includes('--check');
const origin=(packageDir,file)=>readFileSync(resolve(root,'packages',packageDir,'src',file),'utf8');
const files={};
const prefixes={types:'searchbar.core.types', 'query-core':'searchbar.core.query-core','url-state':'searchbar.core.url-state',options:'searchbar.core.options'};
for(const [from,to] of Object.entries(prefixes)){
 let content=origin('search-core',`${from}.ts`);
 for(const [key,replacement] of Object.entries(prefixes)){
   content=content.replaceAll(`'./${key}.ts'`,`'./${replacement}'`).replaceAll(`'./${key}'`,`'./${replacement}'`);
 }
 files[`${to}.ts`]=content;
}
files['searchbar.core.ts']=["export * from './searchbar.core.types';","export * from './searchbar.core.query-core';","export * from './searchbar.core.url-state';","export * from './searchbar.core.options';",''].join('\n');
files['searchbar.types.ts']=origin('searchbar-react','types.ts').replaceAll("from '@searchbarkit/core'","from './searchbar.core'");
files['searchbar.tsx']=origin('searchbar-react','SearchBar.tsx')
 .replaceAll("from './types'","from './searchbar.types'")
 .replaceAll("from '@searchbarkit/core'","from './searchbar.core'")
 .replace("import './searchbar.css';","import './searchbar.css';")
 +`\n/* shadcn registry: include all three presets in the same public module. */\nimport type {SearchBarProps as RegistrySearchBarProps} from './searchbar.types';\nexport function SimpleSearchBar(props:RegistrySearchBarProps) {return <SearchBar {...props} variant="simple"/>;}\nexport function FilteredSearchBar(props:RegistrySearchBarProps) {return <SearchBar {...props} variant="filtered"/>;}\nexport function AdvancedSearchBar(props:RegistrySearchBarProps) {return <SearchBar {...props} variant="advanced"/>;}\nexport type {SearchBarProps, SearchBarConfig, SearchBarVariant, FilterDefinition, RangeDefinition} from './searchbar.types';\nexport type {SearchQuery, SearchFilter, SearchRange, OptionsDataSource} from './searchbar.core';\n`;
files['searchbar.css']=origin('searchbar-react','searchbar.css');
const registryDir=resolve(root,'registry');mkdirSync(registryDir,{recursive:true});
let stale=false;
for(const [name,content] of Object.entries(files)){
 const out=resolve(registryDir,name);
 if(check){if(!existsSync(out)||readFileSync(out,'utf8')!==content){console.error(`Stale registry file: ${name}`);stale=true;}}
 else writeFileSync(out,content);
}
if(check&&stale)process.exitCode=1;
else console.log(check?'Registry sources synchronized.':`Synchronized ${Object.keys(files).length} registry files.`);
