import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const { name, version } = pkg;

if (!name || !version) {
  console.error('package.json must contain name and version');
  process.exit(1);
}

function run(cmd, options = {}) {
  return execSync(cmd, { stdio: 'pipe', encoding: 'utf8', ...options }).trim();
}

let publishedVersion = null;
try {
  publishedVersion = run(`npm view ${name} version`);
} catch {
  publishedVersion = null;
}

if (publishedVersion === version) {
  console.log(`Skip publish: ${name}@${version} already exists on npm.`);
  process.exit(0);
}

console.log(`Publishing ${name}@${version} (latest on npm: ${publishedVersion ?? 'none'})`);
execSync('npm publish --access public --provenance', { stdio: 'inherit' });
