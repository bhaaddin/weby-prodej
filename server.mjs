// Server pro Docker: statický web z public/ + POST /api/poptavka + GET /zdravi.
// Bez závislostí. Na Vercelu se nepoužívá (tam statika + api/poptavka.mjs).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HLAVICKY } from './lib/hlavicky.mjs';
import { zpracujPoptavku, LIMITY } from './lib/poptavka.mjs';

const koren = join(dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = Number(process.env.PORT) || 8080;
// Za reverzní proxy (Caddy, Traefik…) nastav TRUST_PROXY=1, jinak se
// x-forwarded-for nevěří — klient by si ho podvrhl a obešel limit.
const VERIT_PROXY = process.env.TRUST_PROXY === '1';

const TYPY = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function posli(res, status, hlavicky, telo) {
  res.writeHead(status, { ...HLAVICKY, ...hlavicky });
  res.end(telo);
}

async function staticky(req, res, cesta) {
  let rel;
  try {
    rel = decodeURIComponent(cesta);
  } catch {
    return posli(res, 400, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Špatná adresa');
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const soubor = normalize(join(koren, rel));
  // Nic mimo public/ a žádné skryté soubory.
  if (!soubor.startsWith(koren + sep) || soubor.split(sep).some((c) => c.startsWith('.'))) {
    return posli(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Nenalezeno');
  }
  try {
    const s = await stat(soubor);
    if (!s.isFile()) throw new Error('není soubor');
    const typ = TYPY[extname(soubor).toLowerCase()] ?? 'application/octet-stream';
    const cache = soubor.includes(`${sep}vendor${sep}`)
      ? 'public, max-age=604800'
      : typ.startsWith('text/html')
        ? 'no-cache'
        : 'public, max-age=3600';
    const telo = req.method === 'HEAD' ? undefined : await readFile(soubor);
    return posli(res, 200, { 'Content-Type': typ, 'Cache-Control': cache, 'Content-Length': s.size }, telo);
  } catch {
    return posli(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Nenalezeno');
  }
}

async function poptavka(req, res) {
  const kusy = [];
  let velikost = 0;
  for await (const kus of req) {
    velikost += kus.length;
    if (velikost > LIMITY.teloBajtu) {
      return posli(res, 413, { 'Content-Type': 'application/json; charset=utf-8' }, '{"chyba":"Zpráva je moc dlouhá."}');
    }
    kusy.push(kus);
  }
  const ip = VERIT_PROXY
    ? String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.socket.remoteAddress
    : req.socket.remoteAddress;
  const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.url}`, {
    method: req.method,
    headers: Object.entries(req.headers).flatMap(([k, v]) =>
      v === undefined ? [] : Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]
    ),
    body: req.method === 'POST' ? Buffer.concat(kusy) : undefined,
  });
  const r = await zpracujPoptavku(request, { ip });
  posli(res, r.status, Object.fromEntries(r.headers), await r.text());
}

export function vytvorServer() {
  return createServer(async (req, res) => {
    try {
      const cesta = new URL(req.url ?? '/', 'http://x').pathname;
      if (cesta === '/api/poptavka') return await poptavka(req, res);
      if (cesta === '/zdravi') {
        return posli(res, 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, '{"stav":"ok"}');
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return posli(res, 405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' }, 'Metoda není povolená');
      }
      return await staticky(req, res, cesta);
    } catch {
      console.error('server: neočekávaná chyba');
      if (!res.headersSent) posli(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Chyba serveru');
      else res.end();
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const server = vytvorServer();
  server.listen(PORT, () => console.log(`web-prodej: http://localhost:${PORT}`));
  const konec = () => server.close(() => process.exit(0));
  process.on('SIGTERM', konec);
  process.on('SIGINT', konec);
}
