import type {FilterOption,OptionsDataSource,SearchQuery,FilterOperation,MatchMode,SortDirection,SearchFilter,OptionSearchParams,OptionSearchResult} from '@searchbarkit/core';
export type {FilterOption,OptionsDataSource,SearchQuery,FilterOperation,MatchMode,SortDirection,SearchFilter,OptionSearchParams,OptionSearchResult};
export type FilterSource = {kind: 'local'; options: FilterOption[]} | {kind: 'remote'; provider: OptionsDataSource};
export interface FilterDefinition { id: string; label: string; icon?: string; selection?: 'single' | 'multiple'; searchable?: boolean; source: FilterSource }
/** Range controls are rendered beside select filters; interpretation stays in the consumer. */
export interface RangeDefinition { id: string; label: string; min?: number; max?: number; step?: number; unit?: string; placeholderMin?: string; placeholderMax?: string }
export interface SortDefinition { value: string; label: string; direction?: SortDirection }
export interface SearchBarConfig { placeholder?: string; fields: FilterDefinition[]; ranges?: RangeDefinition[]; sorts?: SortDefinition[]; columns?: 2 | 3; fieldOrder?: string[] }
export type SearchBarVariant = 'simple' | 'filtered' | 'advanced';
export interface SearchBarProps {
 config: SearchBarConfig;
 value: SearchQuery;
 onChange: (next: SearchQuery) => void;
 onSearch: (query: SearchQuery) => void | Promise<void>;
 onError?: (error: unknown) => void;
 className?: string;
 /** Theme preset. Override public --gs-* CSS properties to customize either preset. */
 theme?: 'dark' | 'light';
 /** Presentation only. All variants emit the same SearchQuery; hidden criteria are preserved. */
 variant?: SearchBarVariant;
}
