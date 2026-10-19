# 08 — Test strategiyasi, xarajatlar smetasi va risklar reyestri

> Qamrab oladi: TESTING_STRATEGY, COST_ESTIMATION, RISK_REGISTER.

## 1. Test strategiyasi

### 1.1 Qamrov talabi
- Umumiy qamrov ≥ 80% (`apps/api`, `packages/*`).
- `packages/calc`, `packages/translit`, `billing`, `payments` — ≥ 95% tarmoq (branch) qamrovi.
- TDD: yangi funksiya avval testdan boshlanadi (RED → GREEN → REFACTOR).

### 1.2 Test turlari

| Tur | Vosita | Nimani tekshiradi |
|---|---|---|
| Unit | Vitest | Kalkulyator formulalari, transliteratsiya, morfologiya, entitlement mantiqi, narx moslashtirish bali |
| Golden (snapshot) | Vitest + JSON fixture | Soliq formulalari: buxgalter tasdiqlagan kirish → kutilgan natija, sana bo‘yicha |
| Property-based | fast-check | Kalkulyator invariantlari (masalan, QQS qo‘shish → ajratish = asl summa; kredit jadvali yig‘indisi = asosiy qarz) |
| Integration | Vitest + Testcontainers (PostgreSQL, Redis) | API endpointlar, Prisma so‘rovlari, BullMQ joblar |
| Contract | Saqlangan fixture'lar | CBU JSON formati, provayder webhook payloadlari, do‘kon feed formatlari |
| E2E | Playwright | Asosiy oqimlar (quyida) |
| Xavfsizlik | Integration + ZAP baseline | IDOR, auth, rate limit, CSRF, webhook imzosi |
| Yuklama | k6 | Ommaviy GET endpointlar, `/go/` redirect, imlo tekshiruv |
| Accessibility | axe-core (Playwright ichida) | Asosiy sahifalar WCAG 2.2 AA |
| Imlo sifati | Maxsus benchmark skripti | Test korpusida precision/recall; regressiya chegarasi |

### 1.3 Majburiy E2E oqimlar
1. Anonim: ish haqi kalkulyatori → natija → manba ko‘rinadi.
2. Anonim: USD → UZS konvertatsiya, tarixiy sana.
3. Anonim: imlo tekshiruv → taklifni qabul qilish → transliteratsiya.
4. Mahsulot qidiruvi → taklif → `/go/` → click yozildi.
5. Ro‘yxatdan o‘tish → email tasdiqlash → kirish → chiqish.
6. Checkout (provayder sandbox/mock) → webhook → obuna faol → paywall yo‘qoladi.
7. Obunani bekor qilish → davr oxirigacha faol.
8. Admin: soliq qoidasi draft → boshqa admin tasdiqlaydi → kalkulyator yangi qiymatni ishlatadi.

### 1.4 Billing uchun maxsus testlar
- Bir xil webhook ikki marta → bitta to‘lov, bitta obuna.
- Webhook noto‘g‘ri imzo bilan → 401, hech narsa o‘zgarmaydi.
- Webhook summasi order summasidan farq qiladi → rad, alert.
- Parallel ikkita checkout → bitta faol obuna (DB constraint).
- Refund → teskari ledger, entitlement olib tashlanadi.
- Ledger invarianti: har bir tranzaksiyada debet = kredit.
- Frontend'ni chetlab o‘tib pullik endpointni chaqirish → 403.

### 1.5 Integratsiyalar monitoringi
Har bir tashqi integratsiya uchun: muvaffaqiyat darajasi, kechikish, oxirgi muvaffaqiyatli vaqt, alert chegarasi.

| Integratsiya | Alert sharti [FARAZ] |
|---|---|
| CBU import | Ish kuni 12:00 gacha yangi sana yo‘q |
| Bank kurslari | Manba 6 soatdan ortiq yangilanmagan |
| Do‘kon feedlari | Ketma-ket 2 ta xato yoki takliflarning > 30% i yo‘qolgan |
| To‘lov webhooklari | Xato darajasi > 1% yoki 1 soat davomida webhook yo‘q (to‘lovlar bo‘lganda) |
| AI provayder | Xato > 5%, p95 kechikish > 10 s, kunlik xarajat chegarasining 80% i |
| Email / Telegram | Yetkazish xatosi > 5% |

### 1.6 CI pipeline
`lint → typecheck → unit → integration (Testcontainers) → build → e2e (staging docker compose) → audit (deps, secrets, SAST)`. Asosiy branch'ga merge faqat yashil pipeline bilan.

## 2. Xarajatlar smetasi

Barcha raqamlar **[FARAZ]** — aniq narxlar provayderlardan tijorat taklifi olingandan keyin yangilanadi. Valyuta kursi 1 USD ≈ 12 056 so‘m (CBU, 2026-10-17) bo‘yicha taxminiy.

### 2.1 Bir martalik (Phase 0–2)

| Modda | Taxmin | Izoh |
|---|---|---|
| Yuridik: MChJ, oferta, maxfiylik siyosati, lokalizatsiya va reklama bo‘yicha xulosa | [Taklif olinadi] | Majburiy, Phase 1 dan oldin |
| Buxgalter: soliq formulalarini tasdiqlash, golden testlar | [Taklif olinadi] | Biznes moduli uchun majburiy |
| Lug‘at/korpus litsenziyasi | [Noma’lum] | L-24 |
| Brend, domen, tovar belgisi | [Taklif olinadi] | |
| Penetration test | [Taklif olinadi] | Phase 2 dan oldin tavsiya |

### 2.2 Oylik (Phase 1, kichik trafik)

| Modda | Taxmin | Izoh |
|---|---|---|
| Server (O‘zbekistondagi bulut): 2–3 VM yoki konteyner xosting, PostgreSQL, Redis, obyekt saqlash, backup | [Mahalliy provayderdan taklif] | Lokalizatsiya talabi tufayli xalqaro bulut narxlari to‘g‘ridan-to‘g‘ri qo‘llanmaydi |
| CDN/WAF | Bepul yoki past tarif | Faqat statik kontent [TEKSHIR] |
| Email yuborish | Past | Tranzaksion email |
| AI provayder | Foydalanishga bog‘liq | Phase 1 da AI yo‘q yoki juda cheklangan → minimal |
| Monitoring / xato kuzatuvi | Bepul tariflar yoki self-hosted | |
| Domen, SSL | Past | |

### 2.3 AI xarajati modeli

```
Oylik AI xarajati ≈ Σ (so‘rovlar × o‘rtacha token × narx/token)  — model va funksiya bo‘yicha
Pro foydalanuvchi uchun maks. AI xarajati = kvota (so‘z) × token/so‘z × narx/token
Talab: maks. AI xarajati ≤ tarif narxining 30% i [FARAZ]
```

O‘zbek matni ingliz matniga nisbatan ko‘proq token sarflashi mumkin — tanlangan model tokenizer'ida haqiqiy o‘lchov qilinadi (Phase 0 dan keyin birinchi texnik spike).

### 2.4 Jamoa (eng kam tarkib) [FARAZ]

| Rol | Bandlik |
|---|---|
| Full-stack dasturchi (TS: Next.js + NestJS) | 1–2 to‘liq |
| Dizayner (UI/UX) | Yarim stavka, Phase 1 boshida ko‘proq |
| Kontent/SEO muharriri (o‘zbek tili) | Yarim stavka |
| Buxgalter-maslahatchi | Soatbay |
| Yurist | Soatbay |
| Hamkorlik menejeri (do‘konlar, banklar) | Phase 2 dan |

## 3. Risklar reyestri

Ehtimollik (E) va Ta’sir (T): 1 — past, 3 — yuqori. Ball = E × T.

| ID | Risk | E | T | Ball | Kamaytirish | Egasi |
|---|---|---|---|---|---|---|
| R1 | AdSense o‘zbek sahifalarida ishlamaydi → reklama daromadi rejadan ancha past | 3 | 2 | 6 | To‘g‘ridan-to‘g‘ri reklama, homiylik, obunaga tayanish; ruscha sahifalar uchun yurist xulosasi | Biznes |
| R2 | Ma’lumot lokalizatsiyasi talabi buzilishi (xalqaro bulut, AI provayder) | 2 | 3 | 6 | Mahalliy data-markaz; AI uchun rozilik/niqoblash; yurist xulosasi | Texnik + yurist |
| R3 | Soliq formulasida xato → foydalanuvchiga noto‘g‘ri natija, obro‘ zarari | 2 | 3 | 6 | Versiyalangan qoidalar, 4 ko‘z tasdig‘i, golden testlar, ogohlantirish matni | Biznes moduli |
| R4 | Tahrirchi va boshqa raqiblar imlo bozorida ustun | 3 | 2 | 6 | Imloni biznes oqimiga bog‘lash; P1 da oddiy imlo, AI investitsiyasi validatsiyadan keyin | Mahsulot |
| R5 | Bank kurslari uchun ruxsat etilgan manba topilmaydi | 2 | 2 | 4 | Faqat CBU bilan boshlash; banklar bilan hamkorlik; bank kurslari moduli P2 ga | Hamkorlik |
| R6 | Do‘konlar feed bermaydi / hamkorlik qilmaydi | 2 | 2 | 4 | Kichik katalog, qo‘lda tekshirish, avval 3–5 do‘kon bilan pilot | Hamkorlik |
| R7 | Noto‘g‘ri narx yoki noto‘g‘ri moslashtirilgan mahsulot ko‘rsatilishi | 2 | 2 | 4 | Ishonch bali chegarasi, admin navbati, eskirish qoidasi | Katalog |
| R8 | AI xarajati daromaddan oshib ketishi | 2 | 3 | 6 | Kvota, kesh, lug‘at-birinchi yondashuv, global kunlik chegara, monitoring | Texnik |
| R9 | To‘lov provayderlarida recurring yo‘q yoki shartnoma kechikadi | 2 | 2 | 4 | Oldindan to‘lov modeli; B2B uchun hisob-faktura | Moliya |
| R10 | SEO trafigi sekin o‘sadi | 3 | 2 | 6 | Telegram kanal/bot, vidjetlar, hamjamiyatlar; yuqori niyatli kalit so‘zlar | Marketing |
| R11 | Soxta bosishlar (CPC) va hamkor bilan nizolar | 2 | 2 | 4 | Bot filtri, reconciliation, shartnomada aniq qoidalar | Moliya |
| R12 | Lug‘at/korpus litsenziyasi muammosi | 2 | 2 | 4 | Ochiq manbalar, yozma ruxsat, o‘z lug‘atini qurish | Mahsulot |
| R13 | Qamrov juda keng (4 modul) → MVP kechikadi | 3 | 2 | 6 | Phase 1 ni qat’iy cheklash (09-hujjat); har modulda faqat 1–2 asosiy vosita | Mahsulot |
| R14 | Reklama tili qonunchiligiga rioya qilmaslik | 1 | 2 | 2 | Kreativ moderatsiyasida til tekshiruvi | Reklama |
| R15 | Xavfsizlik hodisasi (ma’lumot sizishi) | 1 | 3 | 3 | 06-hujjatdagi choralar, pentest, incident response | Texnik |
| R16 | Asosiy shaxsga bog‘liqlik (bitta dasturchi) | 2 | 2 | 4 | Hujjatlar, CI, kod review, infra-as-code | Rahbariyat |
