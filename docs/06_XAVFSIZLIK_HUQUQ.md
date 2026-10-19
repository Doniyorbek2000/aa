# 06 — Xavfsizlik rejasi va huquqiy muvofiqlik

> Qamrab oladi: SECURITY_PLAN, LEGAL_COMPLIANCE_CHECKLIST.
> Huquqiy bo‘lim yuridik maslahat emas. Har bir **[TEKSHIR]** bandi O‘zbekiston huquqi bo‘yicha malakali yurist bilan tasdiqlanishi kerak.

## 1. Tahdid modeli (qisqa)

| Aktiv | Tahdid | Asosiy himoya |
|---|---|---|
| Foydalanuvchi akkauntlari | Credential stuffing, sessiya o‘g‘irlash | Rate limit, argon2id, httpOnly cookie, sessiya bekor qilish |
| Pullik imkoniyatlar | Frontend orqali chetlab o‘tish | Faqat server entitlement guard |
| To‘lovlar | Soxta webhook, takroriy hodisa, summa almashtirish | Imzo tekshiruvi, idempotentlik, summa solishtirish |
| AI byudjet | Bot orqali suiiste’mol, juda uzun matn | Kvota, uzunlik limiti, bot himoyasi, global kunlik chegara |
| API | Kalitni bo‘lishish, scraping | Hash qilingan kalit, kvota, anomaliya aniqlash |
| Reklama/CPC | Soxta bosishlar | Bot filtri, valid click qoidalari, reconciliation |
| Hujjatlar | Zararli fayl, boshqa foydalanuvchi fayliga kirish | MIME/hajm tekshiruvi, izolyatsiyalangan parser, imzolangan URL, egalik tekshiruvi |
| Admin panel | Imtiyozni oshirish | RBAC, 2FA, audit log, 4 ko‘z tamoyili (soliq qoidalari, refund) |
| Ma’lumotlar bazasi | SQL injection, sizish | Prisma parametrlangan so‘rovlar, eng kam imtiyozli DB rollari, shifrlash |

## 2. Xavfsizlik talablari

### 2.1 Autentifikatsiya va sessiya
- Parol: argon2id; minimal uzunlik 10; ma’lum sizib chiqqan parollar ro‘yxati bilan tekshirish (k-anonymity) [ixtiyoriy].
- Kirish urinishlari: IP va email bo‘yicha rate limit; ketma-ket xatolardan keyin kechikish.
- Sessiya cookie: `HttpOnly; Secure; SameSite=Lax`; tokenning DB'da faqat hashi.
- Parol o‘zgarganda barcha boshqa sessiyalar bekor qilinadi.
- Email tasdiqlash va parol tiklash tokenlari: bir martalik, qisqa muddatli (masalan, 30 daqiqa), hash qilingan.
- Admin: TOTP 2FA majburiy.

### 2.2 Avtorizatsiya
- RBAC (admin) + entitlement (tarif) + egalik tekshiruvi (resurs foydalanuvchiga yoki workspace'ga tegishlimi).
- Workspace izolyatsiyasi: repository qatlamida majburiy `workspace_id` filtri; P3da PostgreSQL RLS.
- Har bir himoyalangan endpoint uchun "boshqa foydalanuvchining ID'si bilan so‘rov" testi (IDOR testi).

### 2.3 Kirish ma’lumotlarini tekshirish
- Har bir DTO — sxema validatsiyasi (tur, uzunlik, oraliq). Noma’lum maydonlar rad etiladi.
- Matn uzunligi limitlari (imlo: Free 5 000 belgi, Pro 100 000 belgi) [FARAZ].
- Kalkulyator kirishlari: son oraliqlari, manfiy qiymatlar, juda katta sonlar.

### 2.4 Web xavfsizligi
- CSRF: SameSite cookie + holat o‘zgartiruvchi so‘rovlarda CSRF token yoki `Origin` tekshiruvi.
- XSS: React avtomatik ekranlash; `dangerouslySetInnerHTML` taqiqlangan (zarurat bo‘lsa — DOMPurify); qat’iy CSP (nonce asosida).
- Sarlavhalar: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`.
- Ochiq redirect himoyasi: `/go/{offerId}` faqat DB'dagi taklif URL'iga yo‘naltiradi, so‘rovdan URL qabul qilmaydi.

### 2.5 Rate limiting va bot himoyasi
| Endpoint guruhi | Limit (boshlang‘ich) [FARAZ] |
|---|---|
| Auth | 5/daqiqa IP, 10/soat email |
| Imlo (anonim) | 20/daqiqa IP |
| AI endpointlari | Tarif kvotasi + 10/daqiqa foydalanuvchi |
| Ommaviy GET | 120/daqiqa IP |
| Developer API | Tarif bo‘yicha |
| `/go/` redirect | 30/daqiqa IP (ortig‘i invalid click deb belgilanadi, lekin redirect ishlaydi) |

Shubhali trafikda CAPTCHA-mos challenge (masalan, Cloudflare Turnstile) [TEKSHIR — lokalizatsiya bilan mosligi].

### 2.6 Maxfiy ma’lumotlar va shifrlash
- Secretlar: env / secret manager; repoga hech qachon. `.env.example` faqat nomlar bilan.
- Ilova ishga tushganda kerakli secretlar mavjudligi tekshiriladi (yo‘q bo‘lsa — ishga tushmaydi).
- TLS hamma joyda; DB va backup diskda shifrlangan.
- Provayder karta tokeni va boshqa sezgir maydonlar — ilova darajasida shifrlash (AES-256-GCM, kalit KMS/secret manager'da).
- API kalitlar: SHA-256 + pepper; faqat yaratishda bir marta ko‘rsatiladi.

### 2.7 Fayllar
- Ruxsat etilgan turlar: DOCX (P3). Magic-bytes tekshiruvi, hajm limiti (masalan, 10 MB), sahifa/so‘z limiti.
- DOCX parser alohida worker jarayonida, vaqt va xotira limiti bilan; makroslar ishlatilmaydi.
- Antivirus skaneri (ClamAV) [ixtiyoriy, P3].
- Fayllar foydalanuvchi bo‘yicha alohida prefiksda; yuklab olish — 5 daqiqalik imzolangan URL.

### 2.8 AI xavfsizligi
- Foydalanuvchi matni AI'ga **ma’lumot** sifatida beriladi; tizim ko‘rsatmasi va matn aniq ajratiladi (prompt injection'ga qarshi).
- AI javobi strukturali (JSON sxema) va validatsiyadan o‘tadi; noto‘g‘ri javob rad etiladi.
- AI hech qachon admin yoki billing harakatlarini bajarmaydi.
- Kunlik global AI xarajati chegarasi; oshsa — Free uchun AI vaqtincha o‘chadi.

### 2.9 Loglash va audit
- Strukturali loglar; parol, token, karta, to‘liq matn loglanmaydi (redaction middleware).
- Xato xabarlari foydalanuvchiga umumiy, ichki tafsilot faqat logda.
- Admin va billing harakatlari — `audit_logs` (o‘zgarmas).

### 2.10 Backup va tiklash
- PostgreSQL: kunlik to‘liq + doimiy WAL arxivi (point-in-time recovery). Backup ham O‘zbekiston hududida.
- Maqsad [FARAZ]: RPO ≤ 15 daqiqa, RTO ≤ 4 soat.
- Har chorakda backup'dan tiklash mashqi.

### 2.11 Jarayon
- CI'da: dependency audit, secret skaner (gitleaks), SAST (CodeQL yoki Semgrep).
- Har bir PR'da xavfsizlikka tegishli o‘zgarish (auth, billing, fayl, AI) uchun alohida review.
- Phase 2 dan oldin tashqi penetration test [tavsiya].

## 3. Huquqiy muvofiqlik checklisti

### 3.1 Shaxsga doir ma’lumotlar

| # | Talab | Holat | Harakat |
|---|---|---|---|
| L-1 | O‘zbekiston fuqarolarining shaxsiy ma’lumotlari O‘zbekiston hududidagi serverlarda (27-1-modda, ZRU-666) | [FAKT], hozirgi tahriri [TEKSHIR] | DB, backup, fayllar — mahalliy data-markazda |
| L-2 | Shaxsiy ma’lumotlar bazasini davlat reyestrida ro‘yxatdan o‘tkazish | [TEKSHIR] | Yurist orqali tartibni aniqlash |
| L-3 | Ma’lumot sub’ektining roziligi (maqsad, muddat, uchinchi tomonlar) | [TEKSHIR] | Ro‘yxatdan o‘tishda aniq rozilik; Maxfiylik siyosati |
| L-4 | Chegaradan tashqari uzatish (AI provayder, email servis, analitika) | [TEKSHIR] — sabab: matnda shaxsiy ma’lumot bo‘lishi mumkin | Variantlar: (a) foydalanuvchiga ogohlantirish + rozilik; (b) AI'ga yuborishdan oldin shaxsiy ma’lumotlarni niqoblash; (c) mahalliy model |
| L-5 | Ma’lumotni o‘chirish va eksport qilish huquqi | — | A-9 talabi (03-hujjat) |
| L-6 | Ma’lumot sizib chiqqanda xabar berish tartibi | [TEKSHIR] | Incident response rejasi |

### 3.2 Reklama

| # | Talab | Holat | Harakat |
|---|---|---|---|
| L-7 | Reklama o‘zbek tilida; tarjima shartlar bilan | [FAKT] (2022 qonun), keyingi o‘zgarishlar [TEKSHIR] | Kreativ moderatsiyasida til tekshiruvi; ruscha sahifalardagi reklama uchun yurist xulosasi |
| L-8 | Reklama aniq belgilanishi | Asosiy tamoyil | "Reklama" / "Homiylik" yorlig‘i |
| L-9 | Moliyaviy xizmatlar (bank, kredit) reklamasi uchun maxsus talablar | [TEKSHIR] | Bank homiyligi shartnomasidan oldin |
| L-10 | AdSense: o‘zbek tilidagi sahifalar qo‘llab-quvvatlanmaydi | [FAKT] | AdSense faqat qo‘llanadigan tildagi sahifalarda, siyosatga to‘liq rioya bilan; sun’iy bosish/ko‘rish taqiqlanadi |

### 3.3 Moliyaviy ma’lumot va maslahat

| # | Talab | Harakat |
|---|---|---|
| L-11 | Platforma rasmiy soliq/moliyaviy maslahatchi emas | Har bir kalkulyator ostida ogohlantirish; Foydalanish shartlarida javobgarlikni cheklash |
| L-12 | CBU kursi va bank kursi farqi | UI qoidasi (03-hujjat) |
| L-13 | Bank kurslarini olish huquqi | Faqat hamkorlik/ruxsat etilgan manba [TEKSHIR] |
| L-14 | Bank/moliya hamkorligida referral to‘lovi olish ruxsati | [TEKSHIR] — litsenziya talab qilinmasligini aniqlash |

### 3.4 Narx taqqoslash va iste’molchi huquqlari

| # | Talab | Harakat |
|---|---|---|
| L-15 | Do‘kon ma’lumotlari va logotiplaridan foydalanish ruxsati | Hamkorlik shartnomasi |
| L-16 | Saytlardan avtomatik ma’lumot yig‘ish (scraping) qonuniyligi va do‘kon shartlari | [TEKSHIR]; MVPda faqat feed/ruxsat |
| L-17 | Noto‘g‘ri narx uchun javobgarlik | "Yakuniy narx do‘kon saytida" ogohlantirishi, yangilangan vaqt |
| L-18 | Iste’molchi huquqlarini himoya qilish qonunchiligi (reklama va taklif aniqligi) | [TEKSHIR] |

### 3.5 To‘lov va soliq (platformaning o‘zi uchun)

| # | Talab | Harakat |
|---|---|---|
| L-19 | Yuridik shaxs (MChJ) va soliq rejimi tanlovi | Buxgalter bilan [TEKSHIR] |
| L-20 | To‘lov provayderlari bilan merchant shartnomasi | Har bir provayder |
| L-21 | Fiskal chek / elektron hisob-faktura talablari onlayn obuna uchun | [TEKSHIR] |
| L-22 | Ommaviy oferta (obuna shartlari, avtomatik uzaytirish, bekor qilish, refund) | Yurist tayyorlaydi |
| L-23 | Chet el valyutasida to‘lov qabul qilish (xalqaro mijozlar) | [TEKSHIR], P4 |

### 3.6 Intellektual mulk

| # | Talab | Harakat |
|---|---|---|
| L-24 | Imlo lug‘atlari va korpuslar litsenziyasi | Har bir manba uchun yozma ruxsat yoki ochiq litsenziya |
| L-25 | AI provayderi shartlari (foydalanuvchi ma’lumotini o‘qitishda ishlatmaslik) | Provayderning ma’lumot siyosatini tekshirish |
| L-26 | Brend nomi va domen | Tovar belgisi qidiruvi [TEKSHIR] |

### 3.7 Majburiy hujjatlar (Phase 1 ishga tushishidan oldin)

- Maxfiylik siyosati (o‘zbek, rus)
- Foydalanish shartlari
- Cookie siyosati (va zarur bo‘lsa cookie banneri)
- Ommaviy oferta (Phase 2, to‘lovdan oldin)
- Reklama siyosati va reklama beruvchilar uchun shartlar (Phase 2)
- Do‘konlar uchun hamkorlik shartlari (Phase 3)
