# v3.2 — Validación de cambios visuales

- Typecheck de `apps/web`: superado.
- Core: 15/15 tests superados. Configuración: 11/11 tests superados.
- Selector de variantes: prueba en Chromium sobre el markup y CSS del toolbar; `pointer-events: auto`, clic en «Con filtros» recibido correctamente. No sustituye una prueba E2E sobre la aplicación React compilada.
- Compilación Vite integral y prueba E2E completa: no ejecutadas aquí; falta Rollup en las dependencias disponibles del entorno.

# SearchbarKit v3.1 — comprobaciones realizadas

- `apps/web`: `tsc --noEmit` — OK.
- `packages/search-core`: 15/15 pruebas ejecutadas con Node — OK.
- `packages/searchbar-config`: 11/11 pruebas ejecutadas con Node — OK.
- Entradas de GitHub Pages (`/es`, `/en`, `/es/demo`, `/en/demo`, `/es/docs`, `/en/docs`) generadas con `prerender-pages.mjs` y validadas con `check-pages.mjs` — OK sobre el HTML compilado previamente disponible.
- La compilación completa de Vite de esta iteración NO se ha podido ejecutar: faltan dependencias transitivas (`rollup`) en este entorno. Se recomienda ejecutar `pnpm install && pnpm check` localmente.
- No se ha completado una revisión visual con el navegador sobre una compilación nueva. Verificar especialmente viewport, variantes, panel flotante y preservación de filtros entre Componente/Demo/Guía.
