/**
 * Bezpečnostní hlavičky prodejního webu. Stejné pro Docker
 * (server.mjs) i Vercel (vercel.json) — `zkouska` hlídá, že se
 * nerozjedou.
 *
 * Žádný kód ani písmo z cizích serverů: three.js a fonty se při
 * sestavení kopírují do /vendor, takže CSP může být `'self'`.
 * `'unsafe-inline'` u stylů jen kvůli atributům style="…", které
 * web vykresluje; skripty inline nejsou.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export const HLAVICKY = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
};
