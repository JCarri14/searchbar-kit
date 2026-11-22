# SearchbarKit v3.0 release preparation

- Renamed all public package identifiers to `@searchbarkit/*` and switched package license metadata to MIT.
- `apps/web` replaces `apps/playground` as the public project; the old `pnpm dev:playground` command remains an alias.
- Added source-owned shadcn registry with synchronizer, generator, graph smoke test and GitHub Pages static hosting.
- Added ES/EN routes and GitHub Pages workflow. No npm publishing is performed.
- Run `pnpm check`, `pnpm smoke:consumer`, and then `pnpm release:prepare` before public release.
- Version `3.0.0` is a breaking **package name** change; no npm publication has occurred. No compatibility with `@searchbar/*` is promised.

---

# Release workflow — v2.6 (no npm publication)

## Initial setup: one-time, on a workstation with npm access

Run from the repository root:

```sh
pnpm install --no-frozen-lockfile
pnpm check
pnpm smoke:consumer
pnpm lockfile:verify
```

**Commit `pnpm-lock.yaml`**. It cannot be generated reliably without resolving
registry dependencies, so it is intentionally not fabricated in the ZIP.
The CI is deliberately strict and will fail until this step is completed.
After that, it uses `pnpm install --frozen-lockfile` to detect dependency drift.
The `packageManager` field pins pnpm 10.11.0; use a matching pnpm version.

## Version packages with Changesets

1. `pnpm changeset` — describe the public API change, package(s), and bump.
2. `pnpm changeset:status` — inspect pending package versions.
3. `pnpm version:packages` — update versions and package changelogs.
4. `pnpm install` — update lockfile after manifests change.
5. `pnpm release:prepare` — tests/types/build + dist metadata verification +
   pack into `.tgz` + real installation in an external consumer.
6. Review `git diff`, including changelogs, dependency versions and lockfile,
   then commit and tag after a successful CI run.

## Release-preview CI

Manually run **Release preview (no publish)** in GitHub Actions. It packs and
uploads the four `.tgz` artifacts for review. It has no npm publish step and
requires no registry token.

## Publication remains out of scope

Before `npm publish`: choose license, verify ownership of `@searchbar` namespace,
confirm exports and API stability, decide public vs private access, add release
signing/provenance and secure publish credentials, and review release notes.
Do not publish from this workflow as currently configured.

## Consumer documentation

- React: install `@searchbarkit/react`, `@searchbarkit/core`, React and ReactDOM,
  import `@searchbarkit/react/styles.css`, then mount a search component.
- Web Component: optional `@searchbarkit/web-component`, call
  `defineSearchBarElement()` and use `<searchbarkit>`.
- Core/config: ESM-only, Node >=20.19.0; avoid depending on private src paths.
- `apps/web` is not a runtime dependency of any installed package.
