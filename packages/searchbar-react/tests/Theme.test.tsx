import {describe,expect,it} from 'vitest';
import {render,screen} from '@testing-library/react';
import {createEmptyQuery} from '@searchbarkit/core';
import {SearchBar} from '../src/SearchBar';

const config={fields:[],sorts:[]};
const noop=()=>{};
describe('Theming contract',()=>{
 it('defaults to dark and supports a light preset',()=>{
  const {rerender}=render(<SearchBar config={config} value={createEmptyQuery()} onChange={noop} onSearch={noop}/>);
  expect(screen.getByRole('region',{name:'Búsqueda y filtros'}).getAttribute('data-theme')).toBe('dark');
  rerender(<SearchBar config={config} value={createEmptyQuery()} theme="light" onChange={noop} onSearch={noop}/>);
  expect(screen.getByRole('region',{name:'Búsqueda y filtros'}).getAttribute('data-theme')).toBe('light');
 });
});
