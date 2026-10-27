// Sestavení: zkopíruje three.js a písma z node_modules do public/vendor.
// Nic se nestahuje z cizích serverů za běhu (CSP 'self', GDPR u písem).
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const koren = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(koren, 'node_modules');
const cil = join(koren, 'public', 'vendor');

const PISMA = [
  ['space-grotesk', [400, 500, 600, 700]],
  ['jetbrains-mono', [500]],
];

await rm(cil, { recursive: true, force: true });
await mkdir(join(cil, 'fonts'), { recursive: true });
await cp(join(nm, 'three', 'build', 'three.min.js'), join(cil, 'three.min.js'));

let css = '';
for (const [balik, rezy] of PISMA) {
  for (const rez of rezy) {
    const zdroj = await readFile(join(nm, '@fontsource', balik, `${rez}.css`), 'utf8');
    // Jen latinka a rozšířená latinka (čeština); ostatní sady se nenačtou.
    for (const [, jmeno, blok] of zdroj.matchAll(/\/\* (\S+) \*\/\s*(@font-face \{[^}]*\})/g)) {
      if (!/-latin(-ext)?-\d+-normal$/.test(jmeno)) continue;
      const soubor = `${jmeno}.woff2`;
      await cp(join(nm, '@fontsource', balik, 'files', soubor), join(cil, 'fonts', soubor));
      css +=
        blok.replace(/src:[^;]*;/, `src: url(./fonts/${soubor}) format('woff2');`) + '\n';
    }
  }
}
if (!css.includes('Space Grotesk') || !css.includes('JetBrains Mono')) {
  throw new Error('sestav: písma se nenašla v node_modules');
}
await writeFile(join(cil, 'fonts.css'), css);
console.log('sestav: public/vendor hotovo');
