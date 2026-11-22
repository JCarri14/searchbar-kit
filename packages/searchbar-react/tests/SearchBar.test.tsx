import {describe,expect,it,vi} from 'vitest';
import {render,screen,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useState} from 'react';
import {SearchBar} from '../src/SearchBar';
import {SimpleSearchBar,FilteredSearchBar,AdvancedSearchBar} from '../src/variants';
import {createEmptyQuery,setFilterState} from '@searchbarkit/core';
import type {SearchBarConfig,SearchQuery} from '../src/types';
const config:SearchBarConfig={fields:[{id:'genre',label:'Género',icon:'sparkles',source:{kind:'local',options:[{value:'action',label:'Acción'},{value:'fantasy',label:'Fantasía'}]}}]};
function Harness({onValue}:{onValue?:(v:SearchQuery)=>void}){
 const [value,setValue]=useState(createEmptyQuery());
 return <SearchBar config={config} value={value} onChange={v=>{setValue(v);onValue?.(v)}} onSearch={vi.fn()}/>;
}
describe('Generic SearchBar',()=>{
 it('renders search input with keyboard-accessible label',()=>{
  render(<Harness/>);
  expect(screen.getByRole('combobox',{name:'Buscar'})).toBeInTheDocument();
 });
 it('cycles neutral → include → exclude → neutral with one control',async()=>{
  const user=userEvent.setup();let latest=createEmptyQuery();render(<Harness onValue={v=>{latest=v}}/>);
  await user.click(screen.getByRole('button',{name:/Filtros avanzados/i}));
  await user.click(screen.getByRole('button',{name:/Género, 0 seleccionados/i}));
  const option=await screen.findByRole('button',{name:/Acción: sin seleccionar/i});
  await user.click(option);expect(latest.filters).toEqual([{field:'genre',value:'action',operation:'include'}]);
  await user.click(screen.getByRole('button',{name:/Acción: seleccionado.*Cambiar estado/i}));expect(latest.filters[0].operation).toBe('exclude');
  await user.click(screen.getByRole('button',{name:/Acción: excluido.*Cambiar estado/i}));expect(latest.filters).toHaveLength(0);
 });
 it('only displays one advanced panel and supports removing a rule',async()=>{
  const user=userEvent.setup();render(<Harness/>);
  await user.click(screen.getByRole('button',{name:/Filtros avanzados/i}));
  await user.click(screen.getByRole('button',{name:/Género, 0 seleccionados/i}));
  await user.click(await screen.findByRole('button',{name:/Acción: sin seleccionar/i}));
  await user.click(screen.getByRole('button',{name:/Reglas avanzadas/i}));
  expect(screen.queryByRole('button',{name:/Género, 1 seleccionados/i})).not.toBeInTheDocument();
  expect(screen.getByRole('button',{name:/Reglas avanzadas/i})).toHaveAttribute('aria-expanded','true');
  await user.click(screen.getByRole('button',{name:/Eliminar Acción/i}));
  expect(screen.getByText(/Sin filtros incluidos/i)).toBeInTheDocument();
 });
 it('selects a suggestion with ArrowDown + Enter and consumes text',async()=>{
  const user=userEvent.setup();let latest=createEmptyQuery();render(<Harness onValue={v=>{latest=v}}/>);
  const input=screen.getByRole('combobox',{name:'Buscar'});
  await user.type(input,'acc');
  const suggestion=screen.getByRole('option',{name:/Acción/i});
  expect(within(suggestion).getByText('Género')).toBeInTheDocument();
  await user.keyboard('{ArrowDown}{Enter}');
  expect(latest.filters).toEqual([{field:'genre',value:'action',operation:'include'}]);
  expect(latest.query).toBe('');
 });
 it('simple hides advanced controls but preserves existing filter state',()=>{
   const value=setFilterState(createEmptyQuery(),'genre','action','exclude');
   const {rerender}=render(<SimpleSearchBar config={config} value={value} onChange={vi.fn()} onSearch={vi.fn()}/>);
   expect(screen.queryByRole('button',{name:/Filtros avanzados/i})).not.toBeInTheDocument();
   expect(screen.queryByRole('button',{name:/Reglas avanzadas/i})).not.toBeInTheDocument();
   rerender(<AdvancedSearchBar config={config} value={value} onChange={vi.fn()} onSearch={vi.fn()}/>);
   expect(screen.getByRole('button',{name:/Reglas avanzadas/i})).toBeInTheDocument();
   expect(value.filters).toEqual([{field:'genre',value:'action',operation:'exclude'}]);
 });
 it('filtered exposes selectors but not the rules panel',()=>{
   render(<FilteredSearchBar config={config} value={createEmptyQuery()} onChange={vi.fn()} onSearch={vi.fn()}/>);
   expect(screen.getByRole('button',{name:/Filtros avanzados/i})).toBeInTheDocument();
   expect(screen.queryByRole('button',{name:/Reglas avanzadas/i})).not.toBeInTheDocument();
 });

 it('filtered preset only selects and deselects without producing exclusions',async()=>{
   const user=userEvent.setup();let latest=createEmptyQuery();
   function FilteredHarness(){const [value,setValue]=useState(createEmptyQuery());return <FilteredSearchBar config={config} value={value} onChange={v=>{latest=v;setValue(v)}} onSearch={vi.fn()}/>;}
   render(<FilteredHarness/>);
   await user.click(screen.getByRole('button',{name:/Filtros avanzados/i}));
   await user.click(screen.getByRole('button',{name:/Género, 0 seleccionados/i}));
   await user.click(await screen.findByRole('button',{name:/Acción: sin seleccionar.*Alternar selección/i}));
   expect(latest.filters).toEqual([{field:'genre',value:'action',operation:'include'}]);
   await user.click(screen.getByRole('button',{name:/Acción: seleccionado.*Alternar selección/i}));
   expect(latest.filters).toEqual([]);
   await user.click(screen.getByRole('button',{name:/Acción: sin seleccionar.*Alternar selección/i}));
   expect(latest.filters.every(f=>f.operation==='include')).toBe(true);
 });
 it('filtered preset expanded chips only remove filters',async()=>{
   const user=userEvent.setup();let latest=setFilterState(createEmptyQuery(),'genre','action','include');
   function FilteredHarness(){const [value,setValue]=useState(latest);return <FilteredSearchBar config={config} value={value} onChange={v=>{latest=v;setValue(v)}} onSearch={vi.fn()}/>;}
   render(<FilteredHarness/>);
   await user.click(screen.getByRole('button',{name:/Género: Acción/i}));
   expect(screen.queryByRole('button',{name:/Cambiar inclusión\/exclusión/i})).not.toBeInTheDocument();
   await user.click(screen.getByRole('button',{name:/Quitar Acción/i}));
   expect(latest.filters).toEqual([]);
 });
 it('filtered preset makes preexisting excluded filters visible and removable',async()=>{
   const user=userEvent.setup();const excluded=setFilterState(createEmptyQuery(),'genre','action','exclude');
   let latest=excluded;
   function FilteredHarness(){const [value,setValue]=useState(excluded);return <FilteredSearchBar config={config} value={value} onChange={v=>{latest=v;setValue(v)}} onSearch={vi.fn()}/>;}
   render(<FilteredHarness/>);
   await user.click(screen.getByRole('button',{name:/Género:/i}));
   expect(screen.getByTitle('Filtro excluido en la consulta recibida')).toBeInTheDocument();
   await user.click(screen.getByRole('button',{name:/Quitar Acción/i}));
   expect(latest.filters).toEqual([]);
 });

});
