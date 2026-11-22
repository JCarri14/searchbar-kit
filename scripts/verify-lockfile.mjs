import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const lock = resolve(root, 'pnpm-lock.yaml');
if (!existsSync(lock)) {
  console.error('pnpm-lock.yaml is missing. Run pnpm install (with registry access), then commit the generated lockfile.');
  process.exitCode = 1;
} else {
  const data = readFileSync(lock, 'utf8');
  if (!data.includes('lockfileVersion:') || !data.includes('importers:')) {
    console.error('pnpm-lock.yaml does not look like a valid pnpm lockfile.');
    process.exitCode = 1;
  } else console.log('pnpm-lock.yaml exists and has the expected top-level sections.');
}
