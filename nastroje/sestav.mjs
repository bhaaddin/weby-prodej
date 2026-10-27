// Sestavení webu:
//  1. three.js a písma z node_modules do public/vendor (nic z cizích
//     serverů za běhu — CSP 'self', GDPR u písem);
//  2. stránky z sablony/*.html a obsah.json do public/ (index, ochrana
//     osobních údajů, 404, robots.txt, sitemap.xml, manifest).
// Obsah se upravuje jen v obsah.json; public/*.html se ručně neupravují.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const koren = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(koren, 'node_modules');
const pub = join(koren, 'public');
const cil = join(pub, 'vendor');

const PISMA = [
  ['space-grotesk', [400, 500, 600, 700]],
  ['jetbrains-mono', [500]],
];

export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** JSON bezpečný uvnitř <script>: žádné </script> ani <!-- se nedostane ven. */
export function jsonDoSkriptu(o) {
  return JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

/** {{klic}} = escapovaný text, {{{klic}}} = hotové HTML/JSON. Neznámý klíč = chyba. */
export function vypln(sablona, hodnoty) {
  return sablona.replace(/\{\{\{(\w+)\}\}\}|\{\{(\w+)\}\}/g, (_, surovy, text) => {
    const k = surovy ?? text;
    if (!(k in hodnoty)) throw new Error(`sestav: šablona chce neznámé pole {{${k}}}`);
    return surovy ? String(hodnoty[k]) : esc(hodnoty[k]);
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Ověří obsah.json — chyba v obsahu má zastavit nasazení, ne rozbít web. */
export function overObsah(o) {
  const chyby = [];
  if (!o || typeof o !== 'object') return ['obsah.json není objekt'];
  if (!String(o.brand ?? '').trim()) chyby.push('brand: chybí název');
  for (const k of ['std', 'rez', 'prem']) {
    if (!o[k] || !Number.isFinite(o[k].price) || o[k].price < 0) chyby.push(`${k}.price: musí být číslo`);
    if (!Array.isArray(o[k]?.feat)) chyby.push(`${k}.feat: musí být seznam`);
  }
  if (!Number.isFinite(o.vat)) chyby.push('vat: musí být číslo');
  if (!EMAIL_RE.test(o.contact?.email ?? '')) chyby.push('contact.email: neplatný e-mail');
  if (o.web?.domena && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(o.web.domena)) {
    chyby.push('web.domena: jen doména bez https://, např. vase-firma.cz');
  }
  if (o.firma?.email && !EMAIL_RE.test(o.firma.email)) chyby.push('firma.email: neplatný e-mail');
  return chyby;
}

/** Veřejná adresa webu: vlastní doména, jinak hlavní adresa projektu na Vercelu. */
export function adresaWebu(o, env = process.env) {
  const host = o.web?.domena || env.VERCEL_PROJECT_PRODUCTION_URL || '';
  return host ? `https://${host.replace(/^https?:\/\//, '').replace(/\/+$/, '')}` : '';
}

function provozovatel(o) {
  const f = o.firma ?? {};
  return [f.nazev || o.brand, f.ico && `IČO ${f.ico}`, f.adresa].filter(Boolean).join(' · ');
}

function ldjson(o, adresa) {
  const ceny = ['std', 'rez', 'prem'].map((k) => o[k].price);
  return jsonDoSkriptu({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: o.firma?.nazev || o.brand,
    description: o.web?.popis,
    ...(adresa ? { url: adresa + '/', image: adresa + '/og.png' } : {}),
    email: o.contact.email,
    telephone: o.contact.phone ? '+420 ' + o.contact.phone : undefined,
    areaServed: 'CZ',
    priceRange: `${Math.min(...ceny)}–${Math.max(...ceny)} Kč bez DPH`,
    makesOffer: ['std', 'rez', 'prem'].map((k) => ({
      '@type': 'Offer',
      name: o[k].name,
      description: o[k].desc,
      price: o[k].price,
      priceCurrency: 'CZK',
    })),
  });
}

function soukromi(o) {
  const f = o.firma ?? {};
  const spravce = [f.nazev || o.brand, f.ico && `IČO ${f.ico}`, f.adresa].filter(Boolean).map(esc).join(', ');
  const mail = esc(f.email || o.contact.email);
  return `<h1>Ochrana osobních údajů</h1>
<p class="meta muted">Jak zacházíme s údaji z poptávkového formuláře</p>
<h2>Kdo údaje zpracovává</h2>
<p>Správcem je ${spravce}. Kontakt pro vše, co se týká vašich údajů: <a href="mailto:${mail}">${mail}</a>.</p>
<h2>Jaké údaje a proč</h2>
<p>Když nám pošlete poptávku, zpracujeme jméno, e-mail, případně telefon, název školy, akce nebo firmy, vybraný balíček a text zprávy. Použijeme je jen k tomu, abychom vám odpověděli a připravili nabídku.</p>
<p>Právním základem je jednání o smlouvě na vaši žádost (čl. 6 odst. 1 písm. b) GDPR). Údaje neprodáváme, nepoužíváme k reklamě a neposíláme vám bez vyžádání obchodní sdělení.</p>
<h2>Kdo k nim má přístup</h2>
<ul>
<li><b>Resend</b> (Resend, Inc.) doručí poptávku e-mailem do naší schránky.</li>
<li><b>Vercel</b> (Vercel Inc.) provozuje servery, na kterých web běží.</li>
</ul>
<p>Oba jsou zpracovateli podle našich pokynů. Mohou údaje zpracovávat i v USA; předání je chráněné standardními smluvními doložkami EU, případně rámcem EU-US Data Privacy Framework.</p>
<h2>Jak dlouho</h2>
<p>Poptávku a navazující korespondenci uchováváme nejdéle 12 měsíců od poslední komunikace, pokud z ní nevznikne smlouva. Pak ji smažeme. Když smlouva vznikne, řídí se uchování účetními a daňovými předpisy.</p>
<h2>Vaše práva</h2>
<p>Máte právo na přístup ke svým údajům, jejich opravu nebo výmaz, omezení zpracování, přenositelnost a právo vznést námitku. Stačí napsat na <a href="mailto:${mail}">${mail}</a>. Pokud nebudete spokojeni, můžete podat stížnost u Úřadu pro ochranu osobních údajů (<a href="https://uoou.gov.cz" rel="noopener">uoou.gov.cz</a>).</p>
<h2>Cookies a měření</h2>
<p>Tento web nepoužívá cookies, analytiku ani sledovací nástroje. Písma i knihovny se načítají z našeho serveru, ne od třetích stran.</p>`;
}

const NENALEZENO = `<h1>Tahle stránka tu není</h1>
<p>Odkaz je možná starý nebo v něm chybí písmenko. Ceník, kalkulačka i formulář jsou na úvodní stránce.</p>
<a class="btn acc" href="/">Zpět na úvod</a>`;

export async function sestav({ env = process.env } = {}) {
  const obsah = JSON.parse(await readFile(join(koren, 'obsah.json'), 'utf8'));
  const chyby = overObsah(obsah);
  if (chyby.length) throw new Error('sestav: chyba v obsah.json\n  - ' + chyby.join('\n  - '));
  const adresa = adresaWebu(obsah, env);
  const znacka = obsah.brand.trim();
  const rok = String(new Date().getFullYear());

  // 1. vendor
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
        css += blok.replace(/src:[^;]*;/, `src: url(./fonts/${soubor}) format('woff2');`) + '\n';
      }
    }
  }
  if (!css.includes('Space Grotesk') || !css.includes('JetBrains Mono')) {
    throw new Error('sestav: písma se nenašla v node_modules');
  }
  await writeFile(join(cil, 'fonts.css'), css);

  // 2. stránky
  const titulek = obsah.web?.titulek ? `${znacka} – ${obsah.web.titulek}` : znacka;
  const { _napoveda, ...proPrehlizec } = obsah;
  const index = vypln(await readFile(join(koren, 'sablony', 'index.html'), 'utf8'), {
    titulek,
    popis: obsah.web?.popis ?? '',
    znacka,
    adresa,
    email: obsah.contact.email,
    kanonicka: '',
    ldjson: ldjson(obsah, adresa),
    obsah: jsonDoSkriptu(proPrehlizec),
  }).replace(
    '<meta property="og:type"',
    (adresa ? `<link rel="canonical" href="${esc(adresa)}/">\n<meta property="og:url" content="${esc(adresa)}/">\n` : '') +
      '<meta property="og:type"'
  );
  const stranka = await readFile(join(koren, 'sablony', '_stranka.html'), 'utf8');
  const spolecne = { znacka, rok, provozovatel: provozovatel(obsah) };
  await writeFile(join(pub, 'index.html'), index);
  await writeFile(
    join(pub, 'soukromi.html'),
    vypln(stranka, { ...spolecne, nadpis: 'Ochrana osobních údajů', roboti: 'index,follow', telo: soukromi(obsah) })
  );
  await writeFile(
    join(pub, '404.html'),
    vypln(stranka, { ...spolecne, nadpis: 'Stránka nenalezena', roboti: 'noindex', telo: NENALEZENO })
  );
  await writeFile(
    join(pub, 'robots.txt'),
    'User-agent: *\nAllow: /\n' + (adresa ? `Sitemap: ${adresa}/sitemap.xml\n` : '')
  );
  if (adresa) {
    await writeFile(
      join(pub, 'sitemap.xml'),
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        [`${adresa}/`, `${adresa}/soukromi`].map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n') +
        '\n</urlset>\n'
    );
  } else {
    await rm(join(pub, 'sitemap.xml'), { force: true });
  }
  await writeFile(
    join(pub, 'manifest.webmanifest'),
    JSON.stringify(
      {
        name: titulek,
        short_name: znacka,
        start_url: '/',
        display: 'standalone',
        background_color: '#07080D',
        theme_color: '#07080D',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      null,
      2
    ) + '\n'
  );
  return { adresa, znacka };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { adresa } = await sestav();
  console.log(`sestav: hotovo${adresa ? ` (${adresa})` : ' (bez veřejné adresy: chybí web.domena)'}`);
}
