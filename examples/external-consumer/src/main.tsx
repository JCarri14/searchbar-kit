import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AdvancedSearchBar, type SearchBarConfig, type SearchQuery } from '@searchbarkit/react';
import { createEmptyQuery } from '@searchbarkit/core';
import { presets, type BuilderProject } from '@searchbarkit/config';
import '@searchbarkit/react/styles.css';
import { defineSearchBarElement } from '@searchbarkit/web-component';
defineSearchBarElement();

// Smoke test: types, CSS, React exports and side-effectful custom element registration.
const preset: BuilderProject = presets.manga;
const config: SearchBarConfig = {
  placeholder: preset.search.placeholder,
  fields: [{id: 'genre', label: 'Género', source: {kind: 'local', options: [{value:'fantasy',label:'Fantasía'}]}}]
};
function App() {
  const [query, setQuery] = useState<SearchQuery>(createEmptyQuery());
  return <AdvancedSearchBar config={config} value={query} onChange={setQuery} onSearch={console.log}/>;
}
createRoot(document.getElementById('app')!).render(<App/>);
