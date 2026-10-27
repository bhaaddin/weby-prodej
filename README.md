# Prodejní web

Ceník, kalkulačka a poptávkový formulář (z exportu z Claude). Poptávka
chodí e-mailem přes **Resend**. Běží na **Vercelu** nebo jako **Docker**
image; **GitHub** ho zkouší a staví. Nic se nemusí instalovat na počítač —
všechno se nastavuje klikáním ve webových rozhraních.

```
obsah.json          VŠECHNY texty, ceny, kontakty, název značky a údaje firmy
sablony/            HTML šablony (úvod, ochrana údajů, 404) — plní je obsah.json
public/app.js       chování webu (kalkulačka, 3D, formulář)
public/styles.css   vzhled
api/poptavka.mjs    Vercel Function  POST /api/poptavka
lib/poptavka.mjs    ověření poptávky a odeslání přes Resend (sdílené)
server.mjs          server pro Docker (statika + /api/poptavka + /zdravi)
nastroje/           sestavení (three.js a písma do public/vendor) a zkoušky
```

## Nasazení — jen v prohlížeči

### 1. Resend (e-maily)
1. resend.com → účet → **Domains → Add Domain** → vaše doména → přidejte
   DNS záznamy, které Resend ukáže, u správce domény → počkejte na „Verified".
2. **API Keys → Create API Key**, oprávnění *Sending access*. Klíč si
   zkopírujte (ukáže se jen jednou).

Bez vlastní domény Resend dovolí poslat mail jen na adresu vašeho účtu
z `onboarding@resend.dev` — na vyzkoušení stačí.

### 2. Vercel (web)
1. vercel.com → **Add New → Project** → importujte repozitář `weby-prodej`.
2. Framework: *Other*. Build a výstup se načtou z `vercel.json`.
3. **Environment Variables** (Production i Preview):

   | Proměnná | Hodnota |
   |---|---|
   | `RESEND_API_KEY` | klíč z kroku 1 |
   | `MAIL_FROM` | `Poptávky <poptavky@vase-domena.cz>` (doména ověřená v Resendu) |
   | `POPTAVKA_KOMU` | kam poptávky chodí, víc adres oddělte čárkou |

4. **Deploy.** Každý další push do hlavní větve nasadí Vercel sám, každá jiná
   větev dostane náhledovou adresu.
5. Vlastní doména: projekt → **Settings → Domains**.

### 3. GitHub (zkoušky a Docker image)
Nic se nenastavuje. Workflow **CI** (`.github/workflows/ci.yml`)
při každé změně pustí zkoušky, sestaví Docker image a vyzkouší
ho; push do hlavní větve image publikuje jako
`ghcr.io/bhaaddin/weby-prodej:latest` (GitHub → profil → **Packages**).

### 4. Docker (jen když nechcete Vercel)
Na serveru s Dockerem stačí `docker-compose.yml` z této složky a vedle něj
soubor `.env` s proměnnými z `.env.example`. Web poběží na portu 8080,
HTTPS zajistí reverzní proxy před ním (pak `TRUST_PROXY=1`).

## Ověření, že to funguje
0. Otevřete `https://<adresa>/api/poptavka` → musí ukázat `{"pripraveno":true}`.
   `false` = ve Vercelu chybí některá ze tří proměnných (nebo chybí redeploy).
1. Otevřete adresu z Vercelu → dole formulář → vyplňte jméno, svůj e-mail,
   zprávu → **Odeslat poptávku**.
2. Čekáno: pod tlačítkem „Děkujeme, poptávka dorazila…" a e-mail na adresu
   z `POPTAVKA_KOMU`; **Odpovědět** v e-mailu míří na zadaný e-mail.
3. Bez nastaveného Resendu se místo toho otevře e-mailová aplikace
   s předvyplněnou zprávou (poptávka se neztratí).
4. Resend → **Emails** ukazuje odeslaný mail a jeho doručení.

## Úprava textů a cen
Na GitHubu otevřete `obsah.json` → tužka → upravte → **Commit**. Vercel web
za minutu sám znovu nasadí. Ceny jsou bez DPH, s DPH se dopočítají.

| Pole | Co to je |
|---|---|
| `brand` | název značky (logo, titulek, patička) |
| `firma.nazev`, `firma.ico`, `firma.adresa`, `firma.email` | údaje do patičky a na stránku Ochrana osobních údajů |
| `web.domena` | vlastní doména bez `https://` (pro Google a náhledy při sdílení) |
| `contact` | kontakt na webu (jméno, telefon, e-mail) |
| `std`, `rez`, `prem` | balíčky: název, cena, popis, funkce |

Překlep, který rozbije JSON, nebo cena napsaná jako text nasazení zastaví
(Vercel ukáže chybu a běží dál předchozí verze) — web se nerozbije.
Obrázky do galerie dejte do `public/` a odkazujte na ně cestou `/…`.

## Bezpečnost
- CSP bez cizích serverů: three.js i písma jsou z vlastního webu.
- Adresát poptávek je jen z prostředí, zákazníkovi se nic neposílá
  (formulář nejde zneužít k rozesílání pošty).
- Ochrana proti robotům: skryté pole, minimální doba vyplnění,
  5 poptávek za 10 minut z jedné IP, kontrola `Origin`.
- Osobní údaje se nelogují; tajemství jen v proměnných Vercelu/serveru.
- Stránka `/soukromi` (GDPR), žádné cookies ani analytika.
