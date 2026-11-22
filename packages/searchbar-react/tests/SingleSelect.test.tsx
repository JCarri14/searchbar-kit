import {describe,it,expect,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useState} from 'react';
import {AdvancedSearchBar} from '../src/variants';
import {createEmptyQuery} from '@searchbarkit/core';
import type {SearchQuery} from '@searchbarkit/core';
import type {SearchBarConfig} from '../src/types';

const config:SearchBarConfig={fields:[{id:'length',label:'Longitud',selection:'single',source:{kind:'local',options:[{label:'≥ 10 capítulos',value:'10'},{label:'≥ 50 capítulos',value:'50'}]}}]};
function Harness({onValue}:{onValue:(q:SearchQuery)=>void}){
 const [q,setQ]=useState(createEmptyQuery());
 return <AdvancedSearchBar config={config} value={q} onChange={v=>{setQ(v);onValue(v)}} onSearch={vi.fn()}/>;
}
describe('single-select',()=>{
 it('replaces its previous choice, then deselects with one control',async()=>{
  const user=userEvent.setup();let latest:SearchQuery=createEmptyQuery();
  render(<Harness onValue={v=>latest=v}/>);
  await user.click(screen.getByRole('button',{name:/Filtros avanzados/i}));
  await user.click(screen.getByRole('button',{name:/Longitud, 0 seleccionados/i}));
  await user.click(screen.getByRole('button',{name:/≥ 10 capítulos: sin seleccionar/i}));
  expect(latest.filters).toEqual([{field:'length',value:'10',operation:'include'}]);
  await user.click(screen.getByRole('button',{name:/≥ 50 capítulos: sin seleccionar/i}));
  expect(latest.filters).toEqual([{field:'length',value:'50',operation:'include'}]);
  await user.click(screen.getByRole('button',{name:/≥ 50 capítulos: seleccionado/i}));
  expect(latest.filters).toEqual([]);
 });
});
