/**
 * write-cjs-package-type.mjs — mark dist/cjs as CommonJS.
 *
 * Why this file exists: the package root is `"type": "module"`, which is what lets tsc's
 * NodeNext build treat src/*.ts as ESM (and lets `verbatimModuleSyntax` hold). The `.js`
 * files tsc emits into dist/cjs would inherit `"type": "module"` from that same root and be
 * loaded as ESM by Node, breaking every `require('atisbo')` consumer. A one-field
 * package.json inside dist/cjs pins them back to CommonJS. dist/esm needs no marker — it
 * inherits the module type it was compiled for.
 *
 * Runs as the last step of `npm run build`. Idempotent.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(pkgDir, 'dist', 'cjs', 'package.json');

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);
console.log(`wrote ${target}`);
