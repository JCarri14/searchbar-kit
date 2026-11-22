#!/usr/bin/env node
/** No-network structural smoke: every registry import must resolve within copied source files. */
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const filename=resolve(root,'apps/web/public/r/searchbar.json');
if(!existsSync(filename))throw new Error('Registry output missing: run pnpm registry:build');
const item=JSON.parse(readFileSync(filename,'utf8'));
if(item.name!=='searchbar'||item.type!=='registry:block'||!Array.isArray(item.files))throw Error('Invalid registry shape');
const files=new Map(item.files.map(f=>[f.target,f.content]));
if(![...files.keys()].some(k=>k.endsWith('searchbar.css')))throw Error('CSS missing from registry');
for(const [target,content] of files){
 if(/from\s+['"]@searchbarkit\//.test(content))throw Error('Registry source still depends on unpublished @searchbarkit package: '+target);
 const imports=[...content.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)].map(match=>match[1]);
 for(const spec of imports){
  const parent=target.substring(0,target.lastIndexOf('/'));
  const name=spec.replace(/^\.\//,'');
  if(![`${parent}/${name}`,`${parent}/${name}.ts`,`${parent}/${name}.tsx`,`${parent}/${name}.css`].some(f=>files.has(f)))throw new Error(`Unresolved registry import ${spec} from ${target}`);
 }
}
console.log(`shadcn registry: ${files.size} files, relative imports and CSS verified.`);
