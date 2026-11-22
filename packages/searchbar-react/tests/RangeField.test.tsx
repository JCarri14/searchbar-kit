import {describe,expect,it,vi} from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useState} from 'react';
import {AdvancedSearchBar,FilteredSearchBar} from '../src/variants';
import {createEmptyQuery} from '@searchbarkit/core';
import type {SearchQuery} from '@searchbarkit/core';
import type {SearchBarConfig} from '../src/types';
const config:SearchBarConfig={fields:[],ranges:[{id:'year',label:'Año',min:1950,max:2026}],columns:2};
function Harness({filtered=false,onValue}:{filtered?:boolean;onValue:(value:SearchQuery)=>void}){
 const [value,setValue]=useState(createEmptyQuery());
 const Bar=filtered?FilteredSearchBar:AdvancedSearchBar;
 return <Bar config={config} value={value} onChange={v=>{setValue(v);onValue(v)}} onSearch={vi.fn()}/>;
}
describe('Numeric range filter',()=>{
 it('adds an inclusive range and can exclude it from advanced rules',async()=>{
  const user=userEvent.setup();let latest:SearchQuery=createEmptyQuery();
  render(<Harness onValue={v=>latest=v}/>);
  await user.click(screen.getByRole('button',{name:/Filtros avanzados/i}));
  await user.type(screen.getByRole('spinbutton',{name:'Año: desde'}),'2015');
  await user.tab();
  expect(latest.ranges).toEqual([{field:'year',min:2015,operation:'include'}]);
  await user.click(screen.getByRole('button',{name:/Reglas avanzadas/i}));
  expect(screen.queryByRole('spinbutton',{name:'Año: desde'})).not.toBeInTheDocument();
  await user.click(screen.getByRole('button',{name:'Mover a Excluir Año'}));
  expect(latest.ranges?.[0].operation).toBe('exclude');
  await user.click(screen.getByRole('button',{name:'Mover a Incluir Año'}));
  expect(latest.ranges?.[0].operation).toBe('include');
  await user.click(screen.getByRole('button',{name:'Eliminar Año'}));
  expect(latest.ranges).toBeUndefined();
 });
 it('range inputs have no include/exclude switch in either variant',async()=>{
  const user=userEvent.setup();render(<Harness filtered onValue={()=>{}}/>);
  await user.click(screen.getByRole('button',{name:/Filtros avanzados/i}));
  await user.type(screen.getByRole('spinbutton',{name:'Año: desde'}),'2020');
  await user.tab();
  expect(screen.queryByRole('button',{name:/Incluir.*Cambiar|Excluir.*Cambiar/})).not.toBeInTheDocument();
 });
});
