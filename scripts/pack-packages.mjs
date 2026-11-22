import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'artifacts', 'npm-packs');
mkdirSync(output, { recursive: true });
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
for (const dir of ['search-core', 'searchbar-config', 'searchbar-react', 'searchbar-web-component']) {
  const cwd = resolve(root, 'packages', dir);
  console.log(`\nPackaging ${dir}...`);
  execFileSync(pnpm, ['pack', '--pack-destination', output], { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
}
const packs = readdirSync(output).filter(x => x.endsWith('.tgz'));
if (packs.length < 4) throw new Error(`Expected 4 packs, found ${packs.length}`);
console.log(`\nPackages available at ${output}`);
