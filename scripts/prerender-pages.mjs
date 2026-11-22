#!/usr/bin/env node
/** Static route entries for GitHub Pages: direct navigation to /es/demo/, /en/docs/, etc. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const dist=resolve(root,'apps/web/dist');
const html=readFileSync(resolve(dist,'index.html'),'utf8');
const sections={
 es:{component:['SearchbarKit — Componente','Diseña y prueba tu SearchBar con filtros y temas.'],demo:['SearchbarKit — Demo','Una búsqueda funcional con resultados y filtros interactivos.'],docs:['SearchbarKit — Guía','Instalación estilo shadcn, React y Web Component.']},
 en:{component:['SearchbarKit — Component','Build and customize your React search bar.'],demo:['SearchbarKit — Demo','A live search example with interactive filters and results.'],docs:['SearchbarKit — Guide','shadcn registry, React and Web Component installation.']}
};
for(const [lang,pages] of Object.entries(sections))for(const [page,[title,desc]] of Object.entries(pages)){
 const dir=resolve(dist,lang,...(page==='component'?[]:[page]));mkdirSync(dir,{recursive:true});
 let output=html.replace(/<html lang="[^"]+"/,'<html lang="'+lang+'"').replace(/<title>[^<]+<\/title>/,'<title>'+title+'</title>').replace(/<meta name="description" content="[^"]*"\/>/,'<meta name="description" content="'+desc+'"/>');
 const site=process.env.SEARCHBARKIT_SITE_URL?.replace(/\/$/,'');
 if(site){
  const canonical=`${site}/${lang}/${page==='component'?'':page+'/'}`;
  output=output.replace('</head>',`  <link rel="canonical" href="${canonical}"/>\n</head>`);
 }
 writeFileSync(resolve(dir,'index.html'),output);
}
const site=process.env.SEARCHBARKIT_SITE_URL?.replace(/\/$/,'');
if(site){
 const urls=Object.entries(sections).flatMap(([lang,pages])=>Object.keys(pages).map(page=>`${site}/${lang}/${page==='component'?'':page+'/'}`));
 writeFileSync(resolve(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${url}</loc></url>`).join('')}</urlset>`);
 writeFileSync(resolve(dist,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);
}
console.log('Generated ES/EN static route entrypoints.');
