export type FilterOperation = 'include' | 'exclude';
export type MatchMode = 'all' | 'any';
export type SortDirection = 'asc' | 'desc';
export interface SearchFilter { field: string; value: string; operation: FilterOperation }
/** Numeric intervals use inclusive endpoints. Omitted bounds are open-ended. */
export interface SearchRange { field: string; min?: number; max?: number; operation: FilterOperation }
export interface SearchQuery { query: string; mode: MatchMode; filters: SearchFilter[]; ranges?: SearchRange[]; sort?: { field: string; direction: SortDirection } }
export interface FilterOption { value: string; label: string; description?: string }
export interface OptionSearchParams { search: string; cursor?: string; signal?: AbortSignal }
export interface OptionSearchResult { options: FilterOption[]; nextCursor?: string | null }
export interface OptionsDataSource {
  search(params: OptionSearchParams): Promise<OptionSearchResult>;
  resolve(params: {values: string[]; signal?: AbortSignal}): Promise<FilterOption[]>;
}
