// Copies Bootstrap and Font Awesome from node_modules into site/vendor,
// so the site serves them itself and makes no third-party requests.
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = join(root, 'site', 'vendor');
const modules = join(root, 'node_modules');

rmSync(vendor, { recursive: true, force: true });
mkdirSync(vendor, { recursive: true });

const copies = [
  ['bootstrap/dist/css/bootstrap.min.css', 'bootstrap/bootstrap.min.css'],
  ['bootstrap/dist/js/bootstrap.bundle.min.js', 'bootstrap/bootstrap.bundle.min.js'],
  ['@fortawesome/fontawesome-free/css/all.min.css', 'fontawesome/css/all.min.css'],
  ['@fortawesome/fontawesome-free/webfonts', 'fontawesome/webfonts'],
];

for (const [from, to] of copies) {
  cpSync(join(modules, from), join(vendor, to), { recursive: true });
}

console.log('Copied Bootstrap and Font Awesome into site/vendor');
