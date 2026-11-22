import type {SearchBarProps} from './types';
import {SearchBar} from './SearchBar';
/** Thin presets around the same implementation and controlled query state. */
export function SimpleSearchBar(props:SearchBarProps) { return <SearchBar {...props} variant="simple"/>; }
export function FilteredSearchBar(props:SearchBarProps) { return <SearchBar {...props} variant="filtered"/>; }
export function AdvancedSearchBar(props:SearchBarProps) { return <SearchBar {...props} variant="advanced"/>; }
