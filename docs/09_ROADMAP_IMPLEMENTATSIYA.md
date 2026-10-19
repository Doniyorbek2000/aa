# 09 — Rivojlanish yo‘l xaritasi va implementatsiya rejasi

> Qamrab oladi: DEVELOPMENT_ROADMAP, IMPLEMENTATION_PLAN.
> Muddatlar 1–2 dasturchili jamoa uchun taxminiy **[FARAZ]**. Har bir bosqich oxirida "chiqish mezoni" bajarilmaguncha keyingisiga o‘tilmaydi.

## Umumiy ko‘rinish

| Bosqich | Maqsad | Taxminiy muddat |
|---|---|---|
| Phase 0 | Tadqiqot va arxitektura (ushbu hujjatlar) + ochiq savollarni yopish | 2–3 hafta |
| Phase 1 | Ommaviy MVP: bepul vositalar, SEO poydevori | 8–10 hafta |
| Phase 2 | Monetizatsiya: obuna, to‘lov, to‘g‘ridan-to‘g‘ri reklama | 6–8 hafta |
| Phase 3 | Kengaytirilgan: AI, ogohlantirishlar, workspace, feedlar, affiliate, API | 10–14 hafta |
| Phase 4 | Masshtab: enterprise, white-label, xalqarolashtirish | Doimiy |

## Phase 0 — qolgan ishlar (hujjatlardan tashqari)

| # | Vazifa | Natija |
|---|---|---|
| 0.1 | Yurist bilan uchrashuv: L-1…L-4, L-7, L-14, L-16, L-22 | Yozma xulosa |
| 0.2 | Buxgalter: ish haqi va QQS formulalari, INPS stavkasi (F7), BHM (F8) | Tasdiqlangan `tax_rules` seed va golden test qiymatlari |
| 0.3 | Kalit so‘z tadqiqoti (uz/ru) — 4 modul bo‘yicha | Ustuvor sahifalar ro‘yxati, juftliklar ro‘yxati |
| 0.4 | 10–15 ta tadbirkor/buxgalter bilan intervyu (A2) | To‘lashga tayyorlik, eng kerakli funksiyalar |
| 0.5 | Mahalliy bulut provayderlaridan narx taklifi | Infra tanlovi |
| 0.6 | To‘lov provayderlari: rasmiy hujjat, recurring, merchant shartlari | Imkoniyatlar matritsasi (04-hujjat, 6.1) to‘ldiriladi |
| 0.7 | Imlo lug‘ati manbalari va litsenziyalari | Manba ro‘yxati |
| 0.8 | Texnik spike: o‘zbek matni uchun AI token sarfi va sifati (50 ta matn) | Xarajat/sifat jadvali |
| 0.9 | Brend nomi va domen | Tanlov |

**Chiqish mezoni:** 0.1, 0.2, 0.5 bajarilgan; ochiq [TEKSHIR] bandlarining Phase 1 ga tegishlilari yopilgan.

## Phase 1 — Ommaviy MVP

**Doira (faqat shular):**
- Valyuta: CBU kurslari, konvertor, tarix grafigi, sana bo‘yicha kurs (C-1…C-4).
- Biznes: ish haqi, QQS, ustama/marja, foyda, kredit, chegirma (B-1…B-6) + soliq qoidalari tizimi.
- Imlo: lotin imlo tekshiruv (lug‘at asosida), lotin↔kirill, statistika (S-1, S-3, S-4). **AI yo‘q.**
- Narxlar: 1 kategoriya, 100–300 mahsulot, 3–5 do‘kon, qo‘lda/feed (P-1…P-3).
- Akkaunt (A-1), admin poydevori (rollar, audit, soliq qoidalari, katalog, CBU holati).
- SEO poydevori, analitika (self-hosted), maxfiylik siyosati va shartlar.

**Implementatsiya tartibi:**

| Hafta | Ish |
|---|---|
| 1 | Monorepo, Docker Compose (Postgres, Redis, MinIO), CI, lint/typecheck, Prisma bazaviy sxema (Identity, Platform) |
| 2 | Dizayn tokenlari, `packages/ui` asosiy komponentlar, layout, i18n marshrutlari, yorug‘/qorong‘i |
| 3 | `packages/calc` (TDD, golden testlar) + `tax_rules` + kalkulyator sahifalari |
| 4 | Currency: CBU import job, `official_rates`, konvertor, grafik, juftlik sahifalari |
| 5 | `packages/translit` (TDD), imlo lug‘at yuklash, morfologik tekshiruv v1, imlo sahifasi |
| 6 | Prices: katalog sxemasi, admin katalog va moslashtirish navbati, mahsulot sahifalari |
| 7 | Auth (A-1), admin RBAC + 2FA + audit, soliq qoidalari 4-ko‘z oqimi |
| 8 | SEO (metadata, sitemap, hreflang, structured data), analitika voqealari, huquqiy sahifalar |
| 9 | E2E testlar, accessibility, yuklama testi, xavfsizlik tekshiruvi |
| 10 | Staging, kontent to‘ldirish, yopiq beta (production deploy — alohida qaror bilan) |

**Chiqish mezoni:** barcha P1 E2E oqimlar yashil; qamrov ≥ 80%; Core Web Vitals maqsadlari staging'da; golden testlar buxgalter tomonidan tasdiqlangan; yurist huquqiy sahifalarni tasdiqlagan.

## Phase 2 — Monetizatsiya

- Billing modullari: plans, plan_prices, entitlements, subscriptions, orders, payments, ledger, invoices.
- Birinchi to‘lov provayderi (0.6 natijasiga qarab) + mock provayder testlar uchun.
- Paywall UI, profil (A-4, A-5, A-9), Google login (A-2).
- Plus/Pro/Business tariflari (P2 doirasidagi imkoniyatlar bilan).
- To‘g‘ridan-to‘g‘ri reklama: placements, campaigns, creatives, moderatsiya, statistika.
- Bank kurslari (C-5, C-6) — faqat ruxsat etilgan manba topilgan bo‘lsa.
- Narx tarixi, `/go/` click tracking, sotuvchi ishonch ko‘rsatkichlari.
- Kirill imlo (S-2), tinish belgilari (S-5).
- Ruscha kontent.
- Admin: daromad dashboardi, refund, reconciliation.

**Chiqish mezoni:** sandbox'da to‘liq to‘lov hayot sikli testlari; ledger invariant testi; pentest topilmalari (critical/high) yopilgan. **Real to‘lovlarni yoqish — alohida qaror.**

## Phase 3 — Kengaytirilgan mahsulotlar

- AI imlo: grammatika, qayta yozish, uslub (S-6, S-7), kvota va xarajat monitoringi.
- DOCX (S-8), taqqoslash (S-9), analitika (S-10).
- Kurs va narx ogohlantirishlari (C-8, P-5), Telegram bot.
- Business workspace, jamoa, takroriy hisobotlar, payroll (BP-3…BP-6, B-13, B-14).
- Do‘kon feedlari va sotuvchi kabineti (P-8), affiliate konversiyalar (P-10), homiylik joylari (P-9).
- Developer API va API kalitlar (S-12, C-11, BP-7).

## Phase 4 — Masshtab

Enterprise (SSO, SLA), white-label vidjetlar, ingliz tili va xalqaro bozor, ommaviy API platformasi, brend analitikasi, jamoa lug‘ati, brauzer kengaytmasi.

## Qaror nuqtalari (foydalanuvchi/egasi tasdiqlashi kerak)

| # | Qaror | Qachon |
|---|---|---|
| D1 | Brend nomi va domen | Phase 0 |
| D2 | Hosting provayderi (O‘zbekiston) | Phase 0 |
| D3 | Birinchi to‘lov provayderi | Phase 1 oxiri |
| D4 | AI provayderi va ma’lumot uzatish modeli | Phase 3 dan oldin |
| D5 | Production'ga birinchi deploy | Phase 1 chiqish mezonidan keyin |
| D6 | Real to‘lovlarni yoqish | Phase 2 chiqish mezonidan keyin |
| D7 | Tarif narxlarini yakunlash | Phase 2, intervyu va fake-door natijalari asosida |
