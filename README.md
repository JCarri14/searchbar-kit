# SearchbarKit v3.2

**Build beautiful, configurable search experiences.** MIT-licensed, open-source React SearchBar with three variants (Simple, Filtered, Advanced), reusable types/ranges, an interactive visual Builder, CSS themes, and an optional Web Component.

## New web experience

- **Component:** live SearchBar centered on a canvas, optional floating Builder / Theme / Export panels and right-side field inspector. Studio chrome is independent from SearchBar CSS tokens.
- **Demo:** Manga, Pokédex, Library, and Simple examples. Each example can be opened and customized in the component canvas.
- **Guide:** Spanish and English, installation by shadcn registry, React package (when published), and Web Component.
- **GitHub Pages:** ES/EN static route entrypoints, configurable Vite base, GitHub Actions deployment, and sitemap on deploy.

## Start locally

Requires Node 22+ and pnpm 10.11.0 (project `packageManager` field).

```bash
pnpm install --frozen-lockfile
pnpm dev:web
```

Open `http://localhost:5177/es/`. The previous command `pnpm dev:playground` remains an alias.

Other demos:

```bash
pnpm dev:manga
pnpm dev:pokemon
pnpm dev:library
pnpm dev:web-component
```

## Verification

```bash
pnpm check               # packages, tests, types, all applications, registry smoke
pnpm smoke:consumer      # tarballs installed outside the monorepo
pnpm release:prepare     # no npm publishing
```

## Packages

| Package | Purpose |
| --- | --- |
| `@searchbarkit/core` | Query state, selectors, ranges, URL serialization |
| `@searchbarkit/react` | React UI; import `@searchbarkit/react/styles.css` |
| `@searchbarkit/config` | Builder schema, themes, exporters |
| `@searchbarkit/web-component` | Optional integration outside React |

The package names are **prepared but not published on npm**. Until publication, install locally using tarballs and the included external-consumer smoke test, or consume the code through the registry.

## shadcn-style owned source

The registry item includes all internal core logic and CSS, so it **does not require unpublished `@searchbarkit/*` dependencies**.

```bash
pnpm registry:sync
pnpm registry:check
pnpm registry:build
pnpm registry:smoke
```

`apps/web/public/r/searchbar.json` is a static, shadcn-compatible registry item. Once GitHub Pages is deployed, the installation URL is:

```bash
pnpm dlx shadcn@latest add https://OWNER.github.io/REPOSITORY/r/searchbar.json
```

Replace `OWNER` and `REPOSITORY` with the **actual published site values**. Run `shadcn init` first in the consuming React project if it has not been initialized. The registry copies source files into `@ui`; import the component from `@/components/ui/searchbar` and `@/components/ui/searchbar.css` in the consumer (adjust for the alias in `components.json`). The CSS import is mandatory. React and ReactDOM are expected in the host project. The registry installs `lucide-react` and `motion`.

Use the `registry:sync --check` invariant before releases. Do not edit generated `registry/*` files directly; edit the source packages and resync.

## Deployment

1. Create your own GitHub repo (`searchbar-kit` is the proposed name).
2. Push this project, including `pnpm-lock.yaml`, to `main`.
3. Enable **Settings → Pages → Source: GitHub Actions**.
4. `.github/workflows/pages.yml` builds the web with a repo-specific base path and publishes `apps/web/dist`.
5. The site hosts `/es/`, `/en/`, `/es/demo/`, `/en/demo/`, `/es/docs/`, `/en/docs/`, plus `/r/searchbar.json`.

The repository link in the navbar activates automatically in Pages CI. No username, URL or npm publication is assumed.

## License

MIT — see [LICENSE](./LICENSE). Keep copyright notices and verify third-party license obligations before redistributing bundled dependencies.


## v3.2 — Ajustes de fidelidad a CoverKit

- **Navbar:** marca con subtítulo «Design System Experiment», navegación Componente / Demo / Guía agrupada a la derecha, selector de idiomas con icono de globo (EN / ES) y cambio de apariencia de la web. Se elimina «MIT · Open source» de la cabecera.
- **Canvas:** sin títulos promocionales ni descripción por encima del buscador; solo el componente real y sus controles flotantes.
- **Selector de variantes:** corregido el `pointer-events` heredado del toolbar; Simple / Con filtros / Avanzada vuelve a responder a clics.
- **Guía:** siguiendo el orden de CoverKit: ejemplo de código, prueba interactiva, anatomía con variantes, integración técnica y referencia API, sin sidebar.
- **Estado compartido:** configuración y consulta se mantienen al cambiar entre Componente, Demo y Guía.
- **Apariencia:** el modo claro/oscuro del sitio no cambia el tema personalizable del componente.

## v3.1 — Canvas, Demo y Guía sincronizados

- El canvas ocupa toda la altura disponible entre navbar y borde inferior de la ventana.
- Barra superior: **Personalizar** (izquierda), **Simple / Con filtros / Avanzada** (centro), importar / JSON (derecha).
- Un solo panel de edición con secciones Constructor, Tema y Exportar; inspector a la derecha.
- La página **Demo** muestra un único buscador activo y resultados de ejemplo locales.
- La **Guía** presenta el mismo buscador editable. Los cambios en filtros y tema se conservan al cambiar entre las tres páginas.
- Las aplicaciones Manga, Pokémon y Biblioteca se mantienen como demos independientes del monorepo.
