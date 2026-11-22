import test from 'node:test';
import assert from 'node:assert/strict';
import {presets,parseProject,validateProject,toSearchBarConfig,toThemeCss,exportReactExample,exportWebComponentExample} from './index.ts';
const copy=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
test('presets are valid configuration projects',()=>{
 for(const preset of Object.values(presets))assert.deepEqual(validateProject(preset),[]);
});
test('round-trip JSON preserves editable configuration',()=>{
 const project=copy(presets.manga);
 assert.deepEqual(parseProject(JSON.parse(JSON.stringify(project))),project);
});
test('duplicate ids, options and invalid ranges are rejected',()=>{
 const project=copy(presets.manga);
 project.fields[1].id=project.fields[0].id;
 project.fields[2].min=3000;project.fields[2].max=2000;
 project.fields[0].options?.push({...project.fields[0].options[0]});
 const paths=validateProject(project).map(issue=>issue.path);
 assert(paths.some(path=>path.endsWith('.id')));
 assert(paths.some(path=>path.endsWith('.options[3]')));
 assert(paths.some(path=>path==='fields[2]'));
 assert.throws(()=>parseProject(project));
});
test('fields map to shared SearchBar config without domain-specific logic',()=>{
 const config=toSearchBarConfig(presets.manga);
 assert.equal(config.fields.length,2);
 assert.equal(config.ranges.length,1);
 assert.equal(config.fields[0].selection,'multiple');
 assert.equal(config.fields[1].searchable,true);
 assert.equal(config.ranges[0].min,1950);
});
test('theme css and integration examples contain expected public API',()=>{
 const p=presets.manga;
 assert.match(toThemeCss(p.theme),/--gs-radius: 4px/);
 assert.match(exportReactExample(p),/AdvancedSearchBar/);
 assert.match(exportWebComponentExample(p),/searchbarkit/);
});
