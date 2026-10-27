// Vercel Function: POST /api/poptavka. Logika je v lib/poptavka.mjs.
import { zpracujPoptavku } from '../lib/poptavka.mjs';

function ip(request) {
  // Vercel hlavičku x-forwarded-for přepisuje sám, klient ji nepodvrhne.
  return (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined;
}

export async function POST(request) {
  return zpracujPoptavku(request, { ip: ip(request) });
}

export function GET() {
  return new Response(JSON.stringify({ chyba: 'Jen POST.' }), {
    status: 405,
    headers: { Allow: 'POST', 'Content-Type': 'application/json; charset=utf-8' },
  });
}
