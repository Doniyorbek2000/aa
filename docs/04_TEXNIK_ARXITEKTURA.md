# 04 — Texnik arxitektura, API va to‘lov tizimi

> Qamrab oladi: TECHNICAL_ARCHITECTURE, API_SPECIFICATION, PAYMENT_ARCHITECTURE.

## 1. Arxitektura qarori: modulli monolit

Birinchi bosqichda mikroservislar yo‘q. Bitta backend ilova, ichida aniq chegaralangan modullar. Sabab: jamoa kichik, deploy oddiy, tranzaksiyalar bitta bazada. Keyin ajratish kerak bo‘lsa (masalan, AI ishlov beruvchi yoki narx crawler), modul chegarasi bo‘yicha ajratiladi.

```
                       ┌──────────────── Cloudflare (CDN, WAF) [TEKSHIR: lokalizatsiya] ───────────────┐
                       │                                                                              │
 Brauzer ──HTTPS──► Reverse proxy (Nginx/Caddy) ──► Next.js (web, SSR/SSG) ──► NestJS API (REST, /v1)
                                                                                  │
                     ┌─────────────────────────────┬───────────────────┬──────────┴─────────┐
                     ▼                             ▼                   ▼                    ▼
               PostgreSQL (Prisma)            Redis (kesh,       BullMQ workerlar      S3-mos saqlash
               — asosiy ma’lumot,              rate-limit,       (CBU import, feed,    (DOCX, PDF
                 ledger, audit                 sessiya)          AI, email, alert)      eksport)
                                                                       │
                                     Tashqi: CBU JSON, to‘lov provayderlari, AI provayder,
                                             email, Telegram Bot API, do‘kon feedlari
```

**Ma’lumot lokalizatsiyasi (01-hujjat, F5):** PostgreSQL, Redis va obyekt saqlash — O‘zbekiston hududidagi data-markazda (masalan, mahalliy bulut provayderi) joylashtiriladi. CDN orqali faqat statik va shaxsiy bo‘lmagan kontent. AI provayderga yuboriladigan matn shaxsiy ma’lumot bo‘lishi mumkinligi — yurist bilan [TEKSHIR] (06-hujjat).

## 2. Texnologiyalar

| Qatlam | Tanlov | Izoh |
|---|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS | SSR/SSG — SEO uchun; komponentlar: Radix asosidagi accessible kutubxona (masalan, shadcn/ui) |
| i18n | Next.js marshrutlari: `/uz`, `/uz-cyrl`, `/ru`, `/en` | `hreflang` (07-hujjat) |
| Backend | NestJS, TypeScript, REST, OpenAPI (Swagger) | Modulli monolit |
| ORM / DB | Prisma + PostgreSQL 16+ | Pul — `BigInt` (tiyin) yoki `Decimal`; float taqiqlanadi |
| Kesh / navbat | Redis + BullMQ | Takrorlanuvchi joblar, retry, dead-letter |
| Validatsiya | `class-validator` / Zod — har bir kirish nuqtasida | |
| Auth | Server sessiyasi (httpOnly, Secure, SameSite=Lax cookie) web uchun; API kalit — developer API uchun | JWT faqat zarurat bo‘lsa |
| Fayllar | S3-mos (MinIO yoki mahalliy provayder) | Imzolangan qisqa muddatli URL |
| Monitoring | Strukturali log (pino), OpenTelemetry, Sentry-mos xato kuzatuvi, Prometheus/Grafana | |
| CI/CD | GitHub Actions: lint → typecheck → test → build → Docker image | Production deploy hozircha yo‘q |
| Konteyner | Docker, Docker Compose (dev va staging) | |

### Monorepo tuzilishi (taklif)

```
webpul/
├── apps/
│   ├── web/          # Next.js
│   ├── api/          # NestJS
│   └── worker/       # BullMQ workerlar (api bilan bir kod bazasi, alohida jarayon)
├── packages/
│   ├── db/           # Prisma schema, migratsiyalar, seed
│   ├── calc/         # Sof kalkulyator funksiyalari (UI va API'da bir xil) + golden testlar
│   ├── translit/     # Lotin↔kirill (sof funksiya)
│   ├── ui/           # Umumiy UI komponentlar
│   └── config/       # eslint, tsconfig
├── docs/             # Ushbu hujjatlar
└── docker-compose.yml
```

`packages/calc` — muhim qaror: barcha formulalar sof funksiya, soliq parametrlari argument sifatida beriladi (kodga qattiq yozilmaydi). Bir xil kod brauzerda (tezkor natija) va serverda (saqlash, API, eksport) ishlaydi.

## 3. Backend modullari

| Modul | Mas’uliyat |
|---|---|
| `auth` | Ro‘yxatdan o‘tish, kirish, sessiya, OAuth, parol tiklash, 2FA (admin) |
| `users` | Profil, sozlamalar, ma’lumot eksporti/o‘chirish |
| `workspaces` | Kompaniya ish maydoni, a’zolar, rollar |
| `billing` | Tariflar, obunalar, entitlementlar, to‘lovlar, hisob-faktura, ledger |
| `payments` | Provayder adapterlari (Payme, Click, Uzum, …), webhooklar |
| `spell` | Lug‘at, morfologiya, qoidalar, AI orkestratsiya, hujjatlar |
| `currency` | CBU import, bank kurslari, konvertatsiya, ogohlantirishlar |
| `calc` | Kalkulyatorlar, soliq qoidalari, saqlangan hisoblar, eksport |
| `prices` | Katalog, takliflar, feedlar, moslashtirish, click tracking, konversiyalar |
| `ads` | Kampaniyalar, joylar, ko‘rishlar, bosishlar, moderatsiya |
| `api-platform` | API kalitlar, kvota, foydalanishni hisoblash |
| `notifications` | Email, Telegram |
| `admin` | Admin endpointlari, RBAC, audit |
| `analytics` | Voqealar, agregatlar |

Modullararo chaqiruvlar faqat har bir modulning ochiq servis interfeysi orqali; boshqa modul jadvaliga to‘g‘ridan-to‘g‘ri yozish yo‘q.

## 4. Entitlement (huquqlar) tizimi

Pullik imkoniyat **hech qachon** frontend shartiga tayanmaydi.

```
plan (pro) ──► plan_entitlements: { "spell.ai_rewrite": true,
                                    "spell.ai_words_monthly": 100000,
                                    "currency.alerts_max": 20,
                                    "ads.hidden": true, ... }
subscription(user|workspace, plan, status, period_end)
      │
      ▼
EntitlementService.check(subjectId, "spell.ai_rewrite")    # har bir himoyalangan endpointda guard
EntitlementService.consume(subjectId, "spell.ai_words_monthly", n)   # atomik (Redis + DB)
```

- Obuna `active`, `trialing` yoki `past_due` (imtiyozli davr ichida) bo‘lsa entitlement amal qiladi.
- Admin qo‘lda bergan entitlement (`entitlement_overrides`) — sabab va muddat bilan.
- Kvota hisoblagichlari Redis'da, har kecha DB bilan solishtiriladi.

## 5. API spetsifikatsiyasi (asosiy endpointlar)

Umumiy qoidalar:
- Bazaviy yo‘l: `/v1`. Versiya o‘zgarishi — `/v2`, eski versiya kamida 6 oy qo‘llanadi.
- Javob konverti:
  ```json
  { "success": true, "data": { }, "error": null, "meta": { "page": 1, "limit": 20, "total": 134 } }
  ```
  Xato: `{ "success": false, "data": null, "error": { "code": "RATE_LIMITED", "message": "…" } }`
- Pagination: `?page=&limit=` (limit maks. 100).
- Pul summalari: butun son tiyinda + `currency` maydoni.
- Sanalar: ISO 8601, `Asia/Tashkent` vaqt zonasi hisobga olinadi.
- Rate limit sarlavhalari: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
- Idempotentlik: pul bilan bog‘liq POST so‘rovlari `Idempotency-Key` sarlavhasini qabul qiladi.

### 5.1 Ommaviy (web) API

| Metod | Yo‘l | Tavsif | Auth |
|---|---|---|---|
| POST | `/v1/auth/register` | Ro‘yxatdan o‘tish | — |
| POST | `/v1/auth/login` | Kirish (sessiya cookie) | — |
| POST | `/v1/auth/logout` | Chiqish | Sessiya |
| POST | `/v1/auth/password/forgot` · `/reset` | Parol tiklash | — |
| GET | `/v1/me` | Profil + entitlementlar | Sessiya |
| POST | `/v1/spell/check` | Imlo tekshiruv `{text, script: "latn"|"cyrl"}` | Ixtiyoriy |
| POST | `/v1/spell/transliterate` | `{text, to: "latn"|"cyrl"}` | Ixtiyoriy |
| POST | `/v1/spell/rewrite` | AI qayta yozish `{text, tone}` | Sessiya + `spell.ai_rewrite` |
| POST | `/v1/spell/documents` | DOCX yuklash | Sessiya + `spell.docx` |
| POST | `/v1/spell/feedback` | Taklifni qabul/rad | Ixtiyoriy |
| GET | `/v1/currency/rates?date=` | Rasmiy kurslar | — |
| GET | `/v1/currency/rates/{ccy}/history?from=&to=` | Tarix | — |
| GET | `/v1/currency/convert?from=&to=&amount=&date=` | Konvertatsiya | — |
| GET | `/v1/currency/bank-rates?ccy=` | Bank kurslari | — |
| POST/GET/DELETE | `/v1/currency/alerts` | Ogohlantirishlar | Sessiya + kvota |
| POST | `/v1/calc/{calculator}` | Hisoblash (masalan, `salary`, `vat`, `loan`) | Ixtiyoriy |
| GET | `/v1/calc/tax-rules?date=` | Amaldagi soliq parametrlari (faqat `approved`) | — |
| POST/GET | `/v1/calc/saved` | Saqlangan hisoblar | Sessiya + `calc.save` |
| POST | `/v1/calc/saved/{id}/export?format=pdf|xlsx` | Eksport | Sessiya + `calc.export` |
| GET | `/v1/products?q=&category=&page=` | Mahsulot qidiruvi | — |
| GET | `/v1/products/{slug}` | Mahsulot + takliflar | — |
| GET | `/v1/products/{id}/price-history` | Narx tarixi | — |
| GET | `/go/{offerId}` | Chiqish redirect + click tracking | — |
| POST/GET/DELETE | `/v1/prices/alerts` | Narx ogohlantirishlari | Sessiya + kvota |
| GET | `/v1/billing/plans` | Tariflar | — |
| POST | `/v1/billing/checkout` | To‘lov sessiyasini yaratish `{planId, period, provider}` | Sessiya |
| GET | `/v1/billing/subscription` | Joriy obuna | Sessiya |
| POST | `/v1/billing/subscription/cancel` | Bekor qilish (davr oxirida) | Sessiya |
| GET | `/v1/billing/invoices` | Hisob-fakturalar | Sessiya |
| POST/GET/DELETE | `/v1/api-keys` | API kalitlar | Sessiya + `api.access` |

### 5.2 Webhooklar (provayderlardan)

| Yo‘l | Manba | Talab |
|---|---|---|
| `POST /v1/webhooks/payments/{provider}` | Payme / Click / Uzum / … | Imzo yoki Basic-auth tekshiruvi (provayder spetsifikatsiyasi bo‘yicha), IP allowlist (agar provayder bersa), idempotent ishlov |
| `POST /v1/webhooks/merchants/{merchantId}/conversions` | Do‘kon postback | HMAC-SHA256 imzo, vaqt belgisi (±5 daqiqa), takroriy hodisani rad etish |

### 5.3 Developer API (API kalit bilan)

`Authorization: Bearer <api_key>` — kalit DB'da faqat hash (SHA-256 + server pepper) ko‘rinishida; prefiks (`wp_live_ab12…`) ko‘rsatish uchun saqlanadi.

| Metod | Yo‘l | Tarif |
|---|---|---|
| GET | `/v1/dev/currency/rates` | Developer+ |
| GET | `/v1/dev/currency/convert` | Developer+ |
| POST | `/v1/dev/spell/check` | Starter+ |
| POST | `/v1/dev/spell/transliterate` | Developer+ |
| POST | `/v1/dev/calc/{calculator}` | Starter+ |

Har bir so‘rov `api_usage_events` ga yoziladi (kalit, endpoint, status, davomiylik). Oylik kvota oshsa — `429` va `QUOTA_EXCEEDED`.

### 5.4 Admin API

`/v1/admin/*` — alohida guard: sessiya + admin roli + 2FA + IP cheklovi (ixtiyoriy). Barcha yozish amallari audit logga.

OpenAPI hujjati `/v1/docs` da (production'da faqat developer API qismi ommaviy).

## 6. To‘lov arxitekturasi

### 6.1 Provayder abstraksiyasi

```ts
interface PaymentProvider {
  readonly code: 'payme' | 'click' | 'uzum' | 'paynet' | 'octo' | 'manual_invoice';
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;   // to‘lov sahifasi URL yoki forma
  handleWebhook(req: RawRequest): Promise<ProviderEvent[]>;          // imzo tekshiruvi shu yerda
  chargeSavedCard?(input: RecurringChargeInput): Promise<ChargeResult>; // faqat provayder qo‘llasa
  refund?(input: RefundInput): Promise<RefundResult>;
}
```

Har bir provayder uchun imkoniyatlar matritsasi rasmiy hujjatdan to‘ldiriladi:

| Provayder | Bir martalik | Karta tokeni / recurring | API orqali refund | Holat |
|---|---|---|---|---|
| Payme | Merchant API | Subscribe API (karta tokeni) — uchinchi tomon manbasiga ko‘ra | [TEKSHIR] | Rasmiy hujjat va merchant shartnomasi kerak |
| Click | Ha | Karta tokeni — uchinchi tomon manbasiga ko‘ra | [TEKSHIR] | Rasmiy hujjat kerak |
| Uzum | Ha | [TEKSHIR] | Uchinchi tomon manbasi: faqat support orqali | Rasmiy hujjat kerak |
| B2B (hisob-faktura orqali bank o‘tkazmasi) | Ha | Yo‘q | Qo‘lda | Biznes/Enterprise uchun |

**Recurring tasdiqlanmagan provayderda** obuna "oldindan to‘lov" modeli bilan ishlaydi: davr tugashidan 3 kun oldin eslatma, foydalanuvchi qo‘lda uzaytiradi.

### 6.2 To‘lov oqimi

```
1. POST /v1/billing/checkout  (Idempotency-Key)
      → orders: status=pending, amount, plan_price_id (narx shu paytda muzlatiladi)
      → provider.createCheckout() → redirect URL
2. Foydalanuvchi provayder sahifasida to‘laydi
3. Provayder → POST /v1/webhooks/payments/{provider}
      → imzo tekshiruvi (xato bo‘lsa 401, hech narsa o‘zgarmaydi)
      → payment_events ga xom hodisa yoziladi (unique: provider + provider_event_id)  ← idempotentlik
      → summa va order_id serverdagi order bilan solishtiriladi (farq bo‘lsa — rad, alert)
      → BIR tranzaksiyada: payments=succeeded, orders=paid, subscription aktivlashtiriladi,
        ledger_entries yoziladi, invoice yaratiladi
4. Frontend "return URL" faqat holatni KO‘RSATADI — hech qachon to‘lovni tasdiqlamaydi.
   Holat GET /v1/billing/orders/{id} orqali serverdan olinadi.
```

### 6.3 Obuna hayot sikli

```
trialing ──► active ──► past_due ──(imtiyoz muddati, masalan 3 kun)──► expired
   │            │  ▲         │
   │            │  └─to‘lov──┘
   │            └──cancel──► canceled_at_period_end ──► expired
   └──to‘lovsiz trial tugadi──► expired
```

Har bir o‘tish `subscription_events` ga yoziladi. Davr tugashini BullMQ har soat tekshiradi.

### 6.4 Refund

- Admin (`finance` roli) refund yaratadi → provayder `refund()` (qo‘llasa) yoki qo‘lda → `refunds` yozuvi → teskari ledger yozuvi → entitlement darhol yoki davr oxirida olib tashlanadi (sozlama).
- Qisman refund qo‘llanadi.

### 6.5 Hisob-faktura va buxgalteriya

- Hisob-faktura raqami ketma-ket, o‘zgarmas (`INV-2026-000123`).
- Ledger: har bir pul harakati kamida ikki yozuv (masalan, `cash_provider_payme` debet, `revenue_subscription` kredit; provayder komissiyasi — `expense_payment_fees`).
- Elektron hisob-faktura (EHF) va fiskal chek talablari — kompaniya soliq rejimiga bog‘liq [TEKSHIR — buxgalter].

### 6.6 Xavfsizlik

- Provayder kalitlari faqat serverda (env yoki secret manager), frontendga hech qachon chiqmaydi.
- Karta ma’lumotlari platformada saqlanmaydi — faqat provayder tokeni.
- Webhook endpointi rate-limited, faqat POST, xom body imzo uchun saqlanadi.
- Har kuni reconciliation jobi: provayder hisoboti ↔ `payments`.

## 7. Fon vazifalari (BullMQ)

| Job | Jadval | Xato bo‘lsa |
|---|---|---|
| `cbu.import` | Har kuni bir necha marta (CBU yangilanish vaqtiga qarab) | 5 marta retry, keyin admin alert |
| `bank_rates.import` | Manbaga qarab | Alert, eskirgan belgisi |
| `currency.alerts.evaluate` | Har importdan keyin | Retry |
| `prices.feed.import` | Har do‘kon uchun jadval | Feed xatosi do‘kon kabinetida |
| `prices.alerts.evaluate` | Narx yangilanganda | Retry |
| `billing.subscriptions.tick` | Har soat | Alert |
| `billing.reconcile` | Har kuni | Alert |
| `ai.usage.rollup` | Har soat | — |
| `reports.recurring` | Oylik | Retry |
| `cleanup.documents` | Har kuni (saqlash muddati tugagan fayllar) | Alert |
