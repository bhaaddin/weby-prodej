// Zkouška prodejního webu bez sítě: poptávka (Resend podvržený),
// server pro Docker (statika, hlavičky, cesty mimo public/) a shoda
// hlaviček s vercel.json. Každý bod musí projít, jinak exit 1.
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zpracujPoptavku, vycistiLimit, overPoptavku } from '../lib/poptavka.mjs';
import { HLAVICKY } from '../lib/hlavicky.mjs';
import { vytvorServer } from '../server.mjs';
import { vypln, jsonDoSkriptu, overObsah, adresaWebu } from './sestav.mjs';

const koren = join(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0;
let spatne = 0;
function over(podminka, popis) {
  if (podminka) {
    ok++;
    console.log(`  ✓ ${popis}`);
  } else {
    spatne++;
    console.log(`  ✗ ${popis}`);
  }
}

const ENV = { RESEND_API_KEY: 're_test', MAIL_FROM: 'Poptávky <p@example.cz>', POPTAVKA_KOMU: 'a@example.cz, b@example.cz' };
const DOBRA = { jmeno: 'Jana Nováková', email: 'jana@example.cz', telefon: '725 000 000', organizace: 'Gymnázium', balicek: 'rez', pocet: 2, zprava: 'Ples v březnu.\nDíky', vyplneno: 9000 };

function pozadavek(telo, hlavicky = {}) {
  return new Request('https://web.example.cz/api/poptavka', {
    method: 'POST',
    headers: { 'content-type': 'application/json', host: 'web.example.cz', ...hlavicky },
    body: typeof telo === 'string' ? telo : JSON.stringify(telo),
  });
}
function podvrzenyResend(status = 200) {
  const volani = [];
  const fn = async (url, init) => {
    volani.push({ url, init, body: JSON.parse(init.body) });
    return new Response('{"id":"x"}', { status });
  };
  return { fn, volani };
}

console.log('poptávka');
{
  vycistiLimit();
  const r = podvrzenyResend();
  const o = await zpracujPoptavku(pozadavek(DOBRA, { origin: 'https://web.example.cz' }), { env: ENV, ip: '1.1.1.1', fetchFn: r.fn });
  over(o.status === 200, 'platná poptávka → 200');
  over(r.volani.length === 1 && r.volani[0].url === 'https://api.resend.com/emails', 'jedno volání Resendu');
  const b = r.volani[0]?.body ?? {};
  over(JSON.stringify(b.to) === '["a@example.cz","b@example.cz"]', 'adresáti jen z POPTAVKA_KOMU');
  over(b.reply_to === 'jana@example.cz' && b.from === ENV.MAIL_FROM, 'reply_to = zákazník, from = MAIL_FROM');
  over(b.text.includes('Rezervace') && b.text.includes('Počet webů: 2') && b.text.includes('Ples v březnu.'), 'text obsahuje balíček, počet a zprávu');
  over(r.volani[0]?.init.headers.Authorization === 'Bearer re_test', 'klíč v hlavičce Authorization');
}
{
  vycistiLimit();
  const r = podvrzenyResend();
  const o = await zpracujPoptavku(pozadavek({ ...DOBRA, jmeno: '<script>x</script>', zprava: '<img src=x onerror=1>', to: 'utok@zly.cz' }), { env: ENV, ip: '1.1.1.2', fetchFn: r.fn });
  const b = r.volani[0]?.body ?? {};
  over(o.status === 200 && !b.html.includes('<script>') && !b.html.includes('<img'), 'HTML v poptávce se escapuje');
  over(JSON.stringify(b.to) === '["a@example.cz","b@example.cz"]', 'pole „to" z požadavku se ignoruje');
}
{
  const o = overPoptavku({ ...DOBRA, jmeno: 'A\r\nBcc: x@y.cz' });
  over(o.data && !/[\r\n]/.test(o.data.jmeno), 'konce řádků z jednořádkových polí pryč');
  over(overPoptavku({ ...DOBRA, balicek: '__proto__' }).data?.balicek === 'prem', 'neznámý balíček → prem');
  over(overPoptavku({ ...DOBRA, pocet: 1e9 }).data?.pocet === 1, 'nesmyslný počet → 1');
}
{
  vycistiLimit();
  const r = podvrzenyResend();
  const bez = await zpracujPoptavku(pozadavek({ ...DOBRA, jmeno: '' }), { env: ENV, fetchFn: r.fn });
  const spatny = await zpracujPoptavku(pozadavek({ ...DOBRA, email: 'neni-mail' }), { env: ENV, fetchFn: r.fn });
  over(bez.status === 400 && spatny.status === 400 && r.volani.length === 0, 'chybí jméno / špatný e-mail → 400, nic se neposílá');
  const chyba = await spatny.json();
  over(!JSON.stringify(chyba).includes('neni-mail'), 'chybová hláška neopakuje osobní údaje');
}
{
  vycistiLimit();
  const r = podvrzenyResend();
  const hp = await zpracujPoptavku(pozadavek({ ...DOBRA, web: 'http://spam' }), { env: ENV, fetchFn: r.fn });
  const rychle = await zpracujPoptavku(pozadavek({ ...DOBRA, vyplneno: 300 }), { env: ENV, fetchFn: r.fn });
  over(hp.status === 200 && rychle.status === 200 && r.volani.length === 0, 'robot (skryté pole, rychlé vyplnění) → 200, ale nic neodejde');
}
{
  vycistiLimit();
  const r = podvrzenyResend();
  const stavy = [];
  for (let i = 0; i < 6; i++) stavy.push((await zpracujPoptavku(pozadavek(DOBRA), { env: ENV, ip: '9.9.9.9', fetchFn: r.fn })).status);
  over(stavy.slice(0, 5).every((s) => s === 200) && stavy[5] === 429 && r.volani.length === 5, '6. pokus z jedné IP za 10 min → 429');
  const jina = await zpracujPoptavku(pozadavek(DOBRA), { env: ENV, ip: '8.8.8.8', fetchFn: r.fn });
  over(jina.status === 200, 'jiná IP projde');
  const pozdeji = await zpracujPoptavku(pozadavek(DOBRA), { env: ENV, ip: '9.9.9.9', fetchFn: r.fn, ted: Date.now() + 11 * 60 * 1000 });
  over(pozdeji.status === 200, 'po 10 minutách zase projde');
}
{
  vycistiLimit();
  const r = podvrzenyResend();
  const cizi = await zpracujPoptavku(pozadavek(DOBRA, { origin: 'https://zly.cz' }), { env: ENV, fetchFn: r.fn });
  over(cizi.status === 403 && r.volani.length === 0, 'cizí Origin → 403');
  const get = await zpracujPoptavku(new Request('https://web.example.cz/api/poptavka'), { env: ENV, fetchFn: r.fn });
  over(get.status === 405, 'GET → 405');
  const text = await zpracujPoptavku(pozadavek('jmeno=x', { 'content-type': 'text/plain' }), { env: ENV, fetchFn: r.fn });
  over(text.status === 415, 'jiný typ než JSON → 415');
  const velke = await zpracujPoptavku(pozadavek({ ...DOBRA, zprava: 'x'.repeat(20000) }), { env: ENV, fetchFn: r.fn });
  over(velke.status === 413, 'tělo nad 16 kB → 413');
  const rozbite = await zpracujPoptavku(pozadavek('{nejson'), { env: ENV, fetchFn: r.fn });
  over(rozbite.status === 400, 'rozbitý JSON → 400');
}
{
  vycistiLimit();
  const r = podvrzenyResend();
  const nic = await zpracujPoptavku(pozadavek(DOBRA), { env: {}, fetchFn: r.fn });
  const bezKomu = await zpracujPoptavku(pozadavek(DOBRA), { env: { ...ENV, POPTAVKA_KOMU: 'neplatna' }, fetchFn: r.fn });
  over(nic.status === 503 && bezKomu.status === 503 && r.volani.length === 0, 'bez nastavení Resendu → 503 (prohlížeč otevře e-mail)');
  const odmitl = await zpracujPoptavku(pozadavek(DOBRA), { env: ENV, fetchFn: podvrzenyResend(422).fn });
  over(odmitl.status === 502, 'Resend odmítne → 502, nikdy „odesláno"');
  const spadl = await zpracujPoptavku(pozadavek(DOBRA), { env: ENV, fetchFn: async () => { throw new Error('síť'); } });
  over(spadl.status === 502, 'Resend nedostupný → 502');
}

console.log('server pro Docker');
{
  vycistiLimit();
  const server = vytvorServer();
  await new Promise((h) => server.listen(0, '127.0.0.1', h));
  const zaklad = `http://127.0.0.1:${server.address().port}`;
  const uvod = await fetch(zaklad + '/');
  const html = await uvod.text();
  over(uvod.status === 200 && html.includes('id="data"') && html.includes('/app.js'), '/ vrací index.html');
  for (const [k, v] of Object.entries(HLAVICKY)) over(uvod.headers.get(k) === v, `hlavička ${k}`);
  over(!/<script(?![^>]*\b(src=|type="application\/(ld\+)?json"))/i.test(html), 'index.html nemá spustitelný inline skript (CSP script-src self)');
  over(!/(src|href)="https?:\/\//.test(html), 'index.html nenačítá nic z cizích serverů');
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  over(ld['@type'] === 'ProfessionalService' && ld.makesOffer.length === 3, 'strukturovaná data pro Google (3 nabídky)');
  over(/og:image" content="[^"]*\/og\.png"/.test(html) && /<title>[^<]{10,}<\/title>/.test(html), 'titulek a náhled pro sdílení');
  const souk = await fetch(zaklad + '/soukromi');
  const soukT = await souk.text();
  over(souk.status === 200 && soukT.includes('Ochrana osobních údajů') && soukT.includes('uoou.gov.cz'), '/soukromi: stránka ochrany údajů');
  const nic = await fetch(zaklad + '/neexistuje');
  over(nic.status === 404 && (await nic.text()).includes('Zpět na úvod'), 'neznámá adresa → 404 stránka');
  for (const f of ['/robots.txt', '/manifest.webmanifest', '/og.png', '/apple-touch-icon.png']) {
    over((await fetch(zaklad + f)).status === 200, `${f} existuje`);
  }
  const js = await fetch(zaklad + '/app.js');
  over(js.status === 200 && js.headers.get('content-type').startsWith('text/javascript'), '/app.js jako JavaScript');
  const ven = await fetch(zaklad + '/..%2fpackage.json');
  const ven2 = await fetch(zaklad + '/%2e%2e/server.mjs');
  over(ven.status === 404 && ven2.status === 404, 'cesta mimo public/ → 404');
  const zdravi = await fetch(zaklad + '/zdravi');
  over(zdravi.status === 200 && (await zdravi.json()).stav === 'ok', '/zdravi → 200 ok (healthcheck Dockeru)');
  const post = await fetch(zaklad + '/api/poptavka', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(DOBRA) });
  over(post.status === 503, 'POST /api/poptavka bez Resendu → 503 přes server');
  const del = await fetch(zaklad + '/', { method: 'DELETE' });
  over(del.status === 405, 'DELETE → 405');
  server.close();
}

console.log('obsah a šablony');
{
  over(vypln('<b>{{a}}</b>{{{b}}}', { a: '<x>"', b: '<i>' }) === '<b>&lt;x&gt;&quot;</b><i>', '{{ }} escapuje, {{{ }}} ne');
  let chyba = '';
  try { vypln('{{nic}}', {}); } catch (e) { chyba = e.message; }
  over(chyba.includes('nic'), 'neznámé pole v šabloně zastaví sestavení');
  over(!jsonDoSkriptu({ t: '</script><!--' }).includes('</'), 'JSON v <script> nejde ukončit');
  const obsah = JSON.parse(await readFile(join(koren, 'obsah.json'), 'utf8'));
  over(overObsah(obsah).length === 0, 'obsah.json projde kontrolou');
  over(overObsah({ ...obsah, std: { ...obsah.std, price: '750' } }).some((c) => c.startsWith('std.price')), 'cena jako text → chyba');
  over(overObsah({ ...obsah, web: { domena: 'https://x.cz' } }).length === 1, 'doména s https:// → chyba');
  over(adresaWebu({ web: { domena: '' } }, { VERCEL_PROJECT_PRODUCTION_URL: 'a.vercel.app' }) === 'https://a.vercel.app', 'bez domény adresa z Vercelu');
  over(adresaWebu({ web: { domena: 'firma.cz' } }, { VERCEL_PROJECT_PRODUCTION_URL: 'a.vercel.app' }) === 'https://firma.cz', 'vlastní doména má přednost');
}

console.log('Vercel');
{
  const v = JSON.parse(await readFile(join(koren, 'vercel.json'), 'utf8'));
  const vse = v.headers.find((h) => h.source === '/(.*)');
  const mapa = Object.fromEntries(vse.headers.map((h) => [h.key, h.value]));
  over(JSON.stringify(mapa) === JSON.stringify(HLAVICKY), 'vercel.json má stejné hlavičky jako server');
  over(v.outputDirectory === 'public' && v.buildCommand === 'npm run build', 'Vercel staví do public/');
  const api = await readFile(join(koren, 'api', 'poptavka.mjs'), 'utf8');
  over(api.includes("from '../lib/poptavka.mjs'") && /export async function POST/.test(api), 'api/poptavka.mjs volá sdílenou logiku');
  const { GET } = await import('../api/poptavka.mjs');
  const puvodni = { ...process.env };
  Object.assign(process.env, ENV);
  const g = await (await GET()).json();
  delete process.env.RESEND_API_KEY;
  const g2 = await (await GET()).json();
  Object.assign(process.env, puvodni);
  over(g.pripraveno === true && g2.pripraveno === false, 'GET /api/poptavka hlásí jen ano/ne');
  over(!JSON.stringify(g).includes('re_test'), 'GET neprozradí klíč');
}

console.log(`\n${ok} v pořádku, ${spatne} špatně`);
if (spatne > 0 || ok === 0) process.exit(1);
