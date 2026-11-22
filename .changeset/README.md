# Changesets: versionado sin publicar

La librería distribuye cuatro paquetes: `@searchbarkit/core`, `@searchbarkit/config`,
`@searchbarkit/react` y `@searchbarkit/web-component`.

1. Después de un cambio público, ejecuta `pnpm changeset` y selecciona los
   paquetes afectados y el nivel semver (patch/minor/major).
2. Comprueba el plan con `pnpm changeset:status`.
3. En la rama de release, `pnpm version:packages` actualiza versiones,
   referencias internas `workspace:*` cuando corresponde y los CHANGELOGs.
4. Ejecuta `pnpm release:prepare` para probar compilación, metadatos, empaquetado
   e instalación externa desde tarballs. **No publica en npm**.
5. Revisa los cambios, genera/actualiza `pnpm-lock.yaml` con `pnpm install`
   y versiona el lockfile junto con el commit.

El Studio y las apps son privadas; no forman parte de releases npm.
El prefijo `@searchbar` es provisional: debe comprobarse titularidad y licencia
antes de cualquier publicación, que requiere decisión explícita.

Plantilla orientativa (NO coloques archivos de ejemplo aquí si no quieres
que Changesets cree un release):

```md
---
"@searchbarkit/react": patch
---

Corregir un problema accesible del selector de filtros.
```
