#!/usr/bin/env node
/** Verify each GitHub Pages deep link resolves to an HTML entry file after build. */
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const dist=resolve(root,'apps/web/dist');
const routes=['es','en','es/demo','en/demo','es/docs','en/docs'];
for(const route of routes){
 const file=resolve(dist,route,'index.html');
 if(!existsSync(file))throw Error(`Missing static route ${route}: ${file}`);
 const html=readFileSync(file,'utf8');
 if(!html.includes('<div id="root"></div>')||!html.includes('<title>SearchbarKit'))throw Error(`Invalid static route markup: ${route}`);
}
const registry=resolve(dist,'r/searchbar.json');
if(!existsSync(registry))throw Error('Published shadcn registry is missing');
console.log('GitHub Pages static routes (ES/EN) and registry output present.');
