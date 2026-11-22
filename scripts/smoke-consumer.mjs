/** Install actual packed tarballs into a project outside the pnpm workspace and compile it. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
function run(args, cwd = root) {
  console.log(`> pnpm ${args.join(' ')}`);
  execFileSync(pnpm, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
}
run(['build:packages']);
run(['pack:packages']);
const temp = mkdtempSync(join(tmpdir(), 'searchbarkit-consumer-'));
const source = resolve(root, 'examples/external-consumer');
cpSync(source, temp, { recursive: true });
const bundleDir = resolve(root, 'artifacts/npm-packs');
const files = readdirSync(bundleDir).filter(f => f.endsWith('.tgz'));
const names = ['core', 'config', 'react', 'web-component'];
const dependencies = {};
for (const name of names) {
  const match = files.find(f => f.includes(`searchbarkit-${name}-`) || f.includes(`searchbarkit+${name}-`));
  if (!match) throw new Error(`Missing tarball for ${name}: ${files.join(', ')}`);
  dependencies[`@searchbarkit/${name}`] = `file:${join(bundleDir, match).replaceAll('\\', '/')}`;
}
const filename = join(temp, 'package.json');
const manifest = JSON.parse(readFileSync(filename, 'utf8'));
manifest.dependencies = { ...manifest.dependencies, ...dependencies };
// Packages are not on npm yet: resolve transitive @searchbarkit/* references to local packs as well.
// pnpm 10 reads dependency overrides from pnpm-workspace.yaml. Keeping them
// in package.json is not reliable and can cause transitive packages to be
// fetched from npm even when the direct dependencies are local tarballs.
// This file is created only in the temporary external-consumer directory.
const yamlQuote = value => JSON.stringify(value);
const overrides = Object.entries(dependencies)
  .map(([name, tarball]) => `  ${yamlQuote(name)}: ${yamlQuote(tarball)}`)
  .join('\n');
// pnpm 11+ blocks unapproved dependency install scripts by default.
// esbuild is Vite's native bundler dependency; approve ONLY its build script.
// Keep pnpm 10.11 compatibility (as declared in the root packageManager),
// where onlyBuiltDependencies is the supported setting.
// These permissions apply ONLY to the temporary consumer workspace.
writeFileSync(join(temp, 'pnpm-workspace.yaml'), `overrides:\n${overrides}\nallowBuilds:\n  esbuild: true\nonlyBuiltDependencies:\n  - esbuild\n`);
writeFileSync(filename, JSON.stringify(manifest, null, 2));
console.log(`\nExternal consumer directory: ${temp}`);
run(['install', '--no-frozen-lockfile'], temp);
run(['exec', 'tsc', '--noEmit'], temp);
run(['exec', 'vite', 'build'], temp);
// Node consumers should also be able to import the core and configuration JS directly.
const core = await import(pathToFileURL(resolve(temp, 'node_modules/@searchbarkit/core/dist/index.js')).href);
if (typeof core.createEmptyQuery !== 'function') throw new Error('Core not importable as ESM');
console.log('External consumer: installed tarballs, TS types, Vite build, Node ESM import OK.');
