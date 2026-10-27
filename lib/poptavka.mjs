/**
 * Poptávka z prodejního webu → e-mail přes Resend.
 *
 * Jedna funkce pro Vercel (api/poptavka.mjs) i pro Docker
 * (server.mjs), aby obě cesty dělaly přesně totéž.
 *
 * Pravidla:
 * - adresát je jen z prostředí (POPTAVKA_KOMU), nikdy z požadavku —
 *   jinak by si kdokoli poslal náš e-mail na libovolnou adresu;
 * - zákazníkovi se nic neposílá (stejný důvod), jen reply_to na něj;
 * - osobní údaje nikdy do logu ani do chybové hlášky;
 * - bez nastavení vrací 503 a prohlížeč otevře e-mail sám — poptávka
 *   se neztratí a nikdo nečeká na odpověď, která nepřijde.
 */

export const LIMITY = {
  jmeno: 120,
  email: 200,
  telefon: 40,
  organizace: 200,
  zprava: 5000,
  teloBajtu: 16 * 1024,
  minVyplneniMs: 2500,
  oknoMs: 10 * 60 * 1000,
  naOkno: 5,
};

const BALICKY = { std: 'Standard', rez: 'Rezervace', prem: 'Premium' };
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

/** Pokusy podle IP, jen v paměti instance (nic se neukládá). */
const pokusy = new Map();

export function vycistiLimit() {
  pokusy.clear();
}

function prekrocenLimit(ip, ted) {
  if (!ip) return false;
  const okno = (pokusy.get(ip) ?? []).filter((t) => ted - t < LIMITY.oknoMs);
  if (okno.length >= LIMITY.naOkno) {
    pokusy.set(ip, okno);
    return true;
  }
  okno.push(ted);
  pokusy.set(ip, okno);
  if (pokusy.size > 5000) {
    for (const [k, v] of pokusy) if (!v.some((t) => ted - t < LIMITY.oknoMs)) pokusy.delete(k);
  }
  return false;
}

function radek(v, max) {
  return typeof v === 'string' ? v.replace(/[\r\n\t]+/g, ' ').trim().slice(0, max) : '';
}

function escapeHtml(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Ověří a očistí tělo požadavku. Vrací { data } nebo { chyba }. */
export function overPoptavku(telo) {
  if (!telo || typeof telo !== 'object' || Array.isArray(telo)) {
    return { chyba: 'Poptávka nemá správný tvar.' };
  }
  const jmeno = radek(telo.jmeno, LIMITY.jmeno);
  const email = radek(telo.email, LIMITY.email);
  const telefon = radek(telo.telefon, LIMITY.telefon).replace(/[^\d+ ()-]/g, '');
  const organizace = radek(telo.organizace, LIMITY.organizace);
  const zprava =
    typeof telo.zprava === 'string'
      ? telo.zprava.replace(/\r\n?/g, '\n').trim().slice(0, LIMITY.zprava)
      : '';
  const balicek = Object.hasOwn(BALICKY, telo.balicek) ? telo.balicek : 'prem';
  const pocet = Number.isInteger(telo.pocet) && telo.pocet >= 1 && telo.pocet <= 99 ? telo.pocet : 1;

  if (!jmeno) return { chyba: 'Vyplňte prosím jméno.' };
  if (!EMAIL_RE.test(email)) return { chyba: 'Vyplňte prosím platný e-mail.' };
  return { data: { jmeno, email, telefon, organizace, zprava, balicek, pocet } };
}

/** Tělo e-mailu pro majitele webu. */
export function sestavEmail(d) {
  const radky = [
    ['Jméno', d.jmeno],
    ['E-mail', d.email],
    ['Telefon', d.telefon || '—'],
    ['Škola, akce nebo firma', d.organizace || '—'],
    ['Zájem o', BALICKY[d.balicek]],
    ['Počet webů', String(d.pocet)],
  ];
  const text =
    radky.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\n' + (d.zprava || '(bez zprávy)') + '\n';
  const bunka = 'padding:9px 0;border-bottom:1px solid #eceef3;vertical-align:top';
  const html =
    '<div style="background:#f4f5f8;padding:24px 12px;font:15px/1.55 Arial,Helvetica,sans-serif;color:#1b1d26">' +
    '<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e3e5ec">' +
    '<div style="height:5px;background:linear-gradient(90deg,#00E5FF,#FF2D95)"></div>' +
    '<div style="padding:24px 26px">' +
    `<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7a7f93">Nová poptávka z webu</p>` +
    `<h1 style="margin:0 0 18px;font-size:22px;line-height:1.25">${escapeHtml(d.jmeno)}${d.organizace ? ` · ${escapeHtml(d.organizace)}` : ''}</h1>` +
    '<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">' +
    radky
      .map(
        ([k, v]) =>
          `<tr><td style="${bunka};color:#7a7f93;width:42%">${escapeHtml(k)}</td><td style="${bunka};font-weight:600">${escapeHtml(v)}</td></tr>`
      )
      .join('') +
    '</table>' +
    `<p style="margin:20px 0 6px;color:#7a7f93;font-size:13px">Zpráva</p>` +
    `<p style="margin:0;white-space:pre-wrap;background:#f7f8fb;border-radius:8px;padding:14px 16px">${escapeHtml(d.zprava || '(bez zprávy)')}</p>` +
    `<p style="margin:22px 0 0;font-size:13px;color:#7a7f93">Stačí odpovědět na tento e-mail, odpověď půjde přímo na ${escapeHtml(d.email)}.</p>` +
    '</div></div></div>';
  return {
    subject: `Nová poptávka: ${d.jmeno}${d.organizace ? ` (${d.organizace})` : ''} · ${BALICKY[d.balicek]}`.slice(0, 200),
    text,
    html,
  };
}

function odpoved(status, telo) {
  return new Response(JSON.stringify(telo), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** Požadavek z cizího webu odmítne (Origin musí sedět s Host). */
function ciziPuvod(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

/**
 * @param {Request} request
 * @param {{ env?: Record<string,string|undefined>, ip?: string, fetchFn?: typeof fetch, ted?: number }} [moznosti]
 */
export async function zpracujPoptavku(request, moznosti = {}) {
  const env = moznosti.env ?? process.env;
  const fetchFn = moznosti.fetchFn ?? fetch;
  const ted = moznosti.ted ?? Date.now();

  if (request.method !== 'POST') return odpoved(405, { chyba: 'Jen POST.' });
  if (ciziPuvod(request)) return odpoved(403, { chyba: 'Požadavek z cizího webu.' });
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return odpoved(415, { chyba: 'Očekávám JSON.' });
  }

  const surove = await request.text();
  if (Buffer.byteLength(surove) > LIMITY.teloBajtu) return odpoved(413, { chyba: 'Zpráva je moc dlouhá.' });
  let telo;
  try {
    telo = JSON.parse(surove);
  } catch {
    return odpoved(400, { chyba: 'Poptávka nemá správný tvar.' });
  }

  // Robot: vyplnil skryté pole nebo formulář „vyplnil" za okamžik.
  // Dostane stejnou odpověď jako člověk, ať nezkouší dál.
  if (telo?.web || (typeof telo?.vyplneno === 'number' && telo.vyplneno < LIMITY.minVyplneniMs)) {
    return odpoved(200, { ok: true });
  }

  if (prekrocenLimit(moznosti.ip, ted)) {
    return odpoved(429, { chyba: 'Moc pokusů za sebou. Zkuste to prosím za pár minut.' });
  }

  const overeno = overPoptavku(telo);
  if (overeno.chyba) return odpoved(400, { chyba: overeno.chyba });

  const klic = env.RESEND_API_KEY?.trim();
  const od = env.MAIL_FROM?.trim();
  const komu = (env.POPTAVKA_KOMU ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => EMAIL_RE.test(s));
  if (!klic || !od || komu.length === 0) {
    return odpoved(503, { chyba: 'Poptávky teď nepřijímáme online.' });
  }

  const mail = sestavEmail(overeno.data);
  let r;
  try {
    r = await fetchFn('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${klic}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: od, to: komu, reply_to: overeno.data.email, ...mail }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    console.error('poptavka: Resend nedostupný');
    return odpoved(502, { chyba: 'Odeslání se nepovedlo.' });
  }
  if (!r.ok) {
    // Jen stavový kód — tělo odpovědi může obsahovat adresy.
    console.error(`poptavka: Resend odmítl (${r.status})`);
    return odpoved(502, { chyba: 'Odeslání se nepovedlo.' });
  }
  return odpoved(200, { ok: true });
}
