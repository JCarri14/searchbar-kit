import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {parsePalette,exportPalette,resolvedTheme,themeVariables,toThemeCss,presets,validateProject} from './index.ts';

describe('theme studio v2.1',()=>{
 it('resolves light defaults for every semantic token',()=>{
  const theme={...presets.pokemon.theme};
  const vars=themeVariables(theme);
  assert.equal(vars['--gs-control'],'#f8fafc');
  assert.equal(vars['--gs-popover'],'#ffffff');
  assert.equal(vars['--gs-bg'],'#f8fafc');
 });
 it('imports a partial palette without losing unspecified colors',()=>{
  const next=parsePalette({base:'light',colors:{primary:'#aabbcc',danger:'#dd3344'}},presets.pokemon.theme);
  assert.equal(next.mode,'custom');
  assert.equal(next.base,'light');
  assert.equal(resolvedTheme(next).danger,'#dd3344');
  assert.equal(resolvedTheme(next).surface,'#ffffff');
 });
 it('rejects malformed or unknown palette keys',()=>{
  assert.throws(()=>parsePalette({colors:{unknown:'#abcdef'}},presets.manga.theme));
  assert.throws(()=>parsePalette({colors:{danger:'red'}},presets.manga.theme));
 });
 it('exports a palette that can be re-imported',()=>{
  const exported=JSON.parse(exportPalette(presets.manga.theme));
  const next=parsePalette(exported,presets.manga.theme);
  assert.equal(resolvedTheme(next).accent,resolvedTheme(presets.manga.theme).accent);
 });
 it('exports CSS tokens for controls and rules',()=>{
  const css=toThemeCss(presets.pokemon.theme);
  assert.ok(css.includes('--gs-control: #f8fafc;'));
  assert.ok(css.includes('--gs-popover: #ffffff;'));
  assert.ok(css.includes('--gs-include: #168065;'));
 });
 it('accepts previous project documents and validates custom palettes',()=>{
  assert.equal(validateProject(presets.manga).length,0);
  const project={...presets.manga,theme:{...presets.manga.theme,mode:'custom' as const,palette:{danger:'#12GG56'}}};
  assert.equal(validateProject(project).some(i=>i.path==='theme.palette.danger'),true);
 });
});
