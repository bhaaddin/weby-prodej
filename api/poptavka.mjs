// Vercel Function: POST /api/poptavka. Logika je v lib/poptavka.mjs.
import { zpracujPoptavku } from '../lib/poptavka.mjs';

function ip(request) {
  // Vercel hlavičku x-forwarded-for přepisuje sám, klient ji nepodvrhne.
  return (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || undefined;
}

export async function POST(request) {
  return zpracujPoptavku(request, { ip: ip(request) });
}

// Kontrola z prohlížeče: je Resend nastavený? Jen ano/ne, nikdy hodnoty.
export function GET() {
  const pripraveno = Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.MAIL_FROM?.trim() && process.env.POPTAVKA_KOMU?.trim()
  );
  return new Response(JSON.stringify({ pripraveno }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
