// Single source of truth: /data at the repo root. Copied in before dev/build so
// the Next bundle can import it without reaching outside its own tree.
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '..', 'data');
const dest = resolve(here, 'data');
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[lh44] data snapshot copied from ${src}`);
