/** Validate distributable metadata and build outputs without publishing. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dirs = ['search-core', 'searchbar-config', 'searchbar-react', 'searchbar-web-component'];
const names = new Set(dirs.map((dir) => JSON.parse(readFileSync(resolve(root, 'packages', dir, 'package.json'), 'utf8')).name));
const errors = [];

function validateExport(pkg, dir, label, declaration) {
  const path = resolve(root, 'packages', dir, declaration);
  if (!existsSync(path)) errors.push(`${pkg.name} export ${label} missing: ${declaration}`);
}

for (const dir of dirs) {
  const pkg = JSON.parse(readFileSync(resolve(root, 'packages', dir, 'package.json'), 'utf8'));
  if (pkg.private) errors.push(`${pkg.name}: package is private, cannot be packed for distribution`);
  if (!pkg.version || !/^\d+\.\d+\.\d+(?:[-+].+)?$/.test(pkg.version)) errors.push(`${pkg.name}: invalid semver version`);
  if (!pkg.exports?.['.']) errors.push(`${pkg.name}: missing root exports`);
  for (const [label, entry] of Object.entries(pkg.exports ?? {})) {
    if (typeof entry === 'string') validateExport(pkg, dir, label, entry);
    else if (typeof entry === 'object' && entry) {
      for (const key of ['types', 'import']) {
        if (!entry[key]) errors.push(`${pkg.name}: ${label} missing ${key} export`);
        else validateExport(pkg, dir, `${label}.${key}`, entry[key]);
      }
    }
  }
  for (const [dep, version] of Object.entries(pkg.dependencies ?? {})) {
    if (names.has(dep) && !version.startsWith('workspace:')) {
      errors.push(`${pkg.name}: internal dependency ${dep} must use workspace protocol before pack`);
    }
  }
  if (!pkg.files?.includes('dist')) errors.push(`${pkg.name}: dist omitted from npm files`);
  if (!pkg.scripts?.build) errors.push(`${pkg.name}: missing build script`);
  console.log(`${pkg.name}@${pkg.version}: ${Object.keys(pkg.exports ?? {}).join(', ')}`);
}
if (errors.length) {
  for (const problem of errors) console.error(`ERROR: ${problem}`);
  process.exitCode = 1;
} else {
  console.log('Release metadata and built exports verified. No publish performed.');
}
