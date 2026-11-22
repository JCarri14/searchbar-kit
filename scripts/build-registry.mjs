#!/usr/bin/env node
/** Emit shadcn-compatible registry JSON directly as GitHub Pages static assets. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const manifest=JSON.parse(readFileSync(resolve(root,'registry.json'),'utf8'));
const dir=resolve(root,'apps/web/public/r');mkdirSync(dir,{recursive:true});
for(const item of manifest.items){
 const result={
   $schema:'https://ui.shadcn.com/schema/registry-item.json',
   name:item.name,type:item.type,title:item.title,description:item.description,
   dependencies:item.dependencies,
   files:item.files.map(file=>({...file,content:readFileSync(resolve(root,file.path),'utf8')}))
 };
 writeFileSync(resolve(dir,`${item.name}.json`),JSON.stringify(result,null,2)+'\n');
 console.log(`Built /r/${item.name}.json with ${result.files.length} owned source files.`);
}
