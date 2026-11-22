import type {FilterOption,OptionsDataSource} from './searchbar.core.types';
const fold=(value:string)=>value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function createStaticOptionsSource(options:FilterOption[],pageSize=30):OptionsDataSource {
 return {
   async search({search,cursor}) {
     const filtered=options.filter(x=>fold(x.label).includes(fold(search)));
     const offset=Math.max(0,Number(cursor)||0);
     return {options:filtered.slice(offset,offset+pageSize),nextCursor:offset+pageSize<filtered.length?String(offset+pageSize):null};
   },
   async resolve({values}) {return options.filter(o=>values.includes(o.value));}
 };
}
