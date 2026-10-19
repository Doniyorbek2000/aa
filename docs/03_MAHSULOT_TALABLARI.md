# 03 — Mahsulot talablari va admin panel

> Qamrab oladi: PRODUCT_REQUIREMENTS, ADMIN_PANEL_SPEC.
> Har bir talabda bosqich ko‘rsatilgan: **P1** — Public MVP, **P2** — Monetizatsiya, **P3** — Kengaytirilgan, **P4** — Masshtab.
> "Free / Paid" ustuni — qaysi tarifdan ochiladi (entitlement nomi 04-hujjatda).

## 1. Umumiy (platforma darajasi)

| ID | Talab | Bosqich | Free/Paid |
|---|---|---|---|
| G-1 | Bosh sahifa to‘rtta modulni va har birining asosiy vositasini birinchi ekranda ko‘rsatadi | P1 | Free |
| G-2 | Universal qidiruv: vosita, valyuta, mahsulot bo‘yicha (bitta qidiruv maydoni) | P1 | Free |
| G-3 | Tillar: o‘zbek (lotin) — asosiy; o‘zbek (kirill), rus — P1 arxitekturada, kontent P2; ingliz — P4 | P1/P2 | Free |
| G-4 | Yorug‘/qorong‘i rejim, mobil-birinchi dizayn | P1 | Free |
| G-5 | Ro‘yxatdan o‘tishsiz bepul vositalardan foydalanish mumkin | P1 | Free |
| G-6 | Akkaunt: email + parol, email tasdiqlash, parolni tiklash; ixtiyoriy Google login | P1 | Free |
| G-7 | Har bir hisoblash/ma’lumot ostida manba va yangilangan vaqt | P1 | Free |
| G-8 | Reklama va homiylik har doim belgilanadi va asosiy vositani to‘smaydi | P2 | — |
| G-9 | Bildirishnomalar: email, Telegram bot | P2/P3 | Plus+ |
| G-10 | Profil: obuna, to‘lov tarixi, hisob-fakturalar, API kalitlar, foydalanish statistikasi | P2 | — |

## 2. AI Imlo moduli

### Funksional talablar

| ID | Talab | Bosqich | Free/Paid |
|---|---|---|---|
| S-1 | O‘zbek lotin imlo tekshiruvi (lug‘at + morfologiya: o‘zak + qo‘shimchalar) | P1 | Free |
| S-2 | O‘zbek kirill imlo tekshiruvi | P2 | Free |
| S-3 | Lotin ↔ kirill transliteratsiya (qoidalar asosida, istisnolar lug‘ati bilan) | P1 | Free |
| S-4 | So‘z, belgi, gap soni; o‘qish vaqti | P1 | Free |
| S-5 | Tinish belgilari bo‘yicha takliflar (qoidaga asoslangan) | P2 | Free (limit) |
| S-6 | Grammatik takliflar (qoida + AI) | P3 | Pro |
| S-7 | AI qayta yozish: rasmiy / norasmiy / akademik / biznes uslub | P3 | Pro (kredit) |
| S-8 | DOCX yuklash, tahrir, DOCX/PDF eksport | P3 | Pro |
| S-9 | Ikki matnni taqqoslash (diff) | P3 | Plus |
| S-10 | Yozuv analitikasi (tez-tez uchraydigan xatolar) | P3 | Plus |
| S-11 | Jamoa lug‘ati (kompaniya atamalari) | P4 | Business |
| S-12 | Imlo API | P3 | API tarif |
| S-13 | Brauzer kengaytmasi | P4 | Free/Pro |

### Sifat va texnik talablar

- Har bir taklif: `turi` (imlo/grammatika/uslub), `manba` (lug‘at/qoida/AI), `ishonch` (0–1), `izoh`.
- Foydalanuvchi taklifni qabul qiladi yoki rad etadi — **avtomatik almashtirish yo‘q**.
- Qabul/rad etish voqealari anonimlashtirilib, sifat baholash datasetiga yoziladi (foydalanuvchi roziligi bilan).
- Lug‘at versiyalanadi (`dictionary_versions`); har bir natija qaysi lug‘at versiyasi bilan olinganini saqlaydi.
- **Sifat o‘lchovi:** belgilangan test korpusi (masalan, 500 ta xatoli gap) bo‘yicha precision/recall. Har bir lug‘at yoki model o‘zgarishida regressiya testi.
- AI'ga yuborilgan matn uchun ogohlantirish: "Matn tahlil uchun uchinchi tomon AI provayderiga yuboriladi" (06-hujjat, maxfiylik).
- Bepul tekshiruv uzunligi chegarasi (masalan, 5 000 belgi) [FARAZ].

### Lug‘at manbasi [TEKSHIR]

Imlo lug‘ati va izohli lug‘atlardan foydalanish litsenziyasi aniqlanishi kerak. Ochiq manbali o‘zbek korpuslari va lug‘atlar ro‘yxati Phase 1 boshida tuziladi. Mualliflik huquqi himoyalangan lug‘atni ruxsatsiz nusxalash taqiqlanadi.

## 3. Valyuta moduli

| ID | Talab | Bosqich | Free/Paid |
|---|---|---|---|
| C-1 | Rasmiy CBU kurslari (74 valyuta), kunlik avtomatik import | P1 | Free |
| C-2 | Konvertor: istalgan juftlik, UZS orqali kross-kurs | P1 | Free |
| C-3 | Tarixiy grafik (7k / 30k / 1y / hammasi) | P1 | Free |
| C-4 | Tanlangan sana bo‘yicha kurs (CBU arxivi) | P1 | Free |
| C-5 | Bank sotib olish/sotish kurslari jadvali (faqat ruxsat etilgan manbadan) | P2 | Free |
| C-6 | "Eng yaxshi kurs" — kanal bo‘yicha (filial / ilova / bankomat), agar manba ajratsa | P2 | Free |
| C-7 | Sevimli valyutalar | P2 | Free (akkaunt) |
| C-8 | Chegaraga yetganda ogohlantirish (Telegram/email) | P3 | Plus (5 ta), Pro (20 ta) |
| C-9 | Ko‘p valyutali portfel | P3 | Pro |
| C-10 | CSV/Excel eksport | P3 | Pro |
| C-11 | Kurs API va vidjet | P3 | API tarif / Free vidjet |

**Majburiy UI qoida:** CBU kursi har doim "Markaziy bank rasmiy kursi" deb yoziladi va bank savdo kursi bilan bir jadvalda aralashtirilmaydi. Bank kursi yonida manba va vaqt.

**Ishonchlilik:** CBU import muvaffaqiyatsiz bo‘lsa — oxirgi muvaffaqiyatli qiymat sana bilan ko‘rsatiladi, admin ogohlantiriladi. Kurs dam olish kunlari o‘zgarmasligi normal holat.

## 4. Biznes va soliq kalkulyatorlari

### Kalkulyatorlar ro‘yxati

| ID | Kalkulyator | Bosqich | Soliq qoidasiga bog‘liqmi |
|---|---|---|---|
| B-1 | Ish haqi (gross → net, net → gross) | P1 | Ha |
| B-2 | QQS (qo‘shish / ajratish) | P1 | Ha |
| B-3 | Ustama (markup) va marja | P1 | Yo‘q |
| B-4 | Foyda | P1 | Ixtiyoriy |
| B-5 | Kredit (annuitet va differensial jadval) | P1 | Yo‘q |
| B-6 | Chegirma | P1 | Yo‘q |
| B-7 | Muddatli to‘lov (nasiya) — haqiqiy foiz stavkasi | P2 | Yo‘q |
| B-8 | Tannarx | P2 | Yo‘q |
| B-9 | Zararsizlik nuqtasi (break-even) | P2 | Yo‘q |
| B-10 | ROI | P2 | Yo‘q |
| B-11 | Valyutaga bog‘langan xarajat (CBU kursi bilan) | P2 | Yo‘q |
| B-12 | Xarajatlar kalkulyatori | P2 | Yo‘q |
| B-13 | Payroll (bir nechta xodim) | P3 | Ha |
| B-14 | Soliq rejimi taqqoslash (aylanma vs foyda solig‘i) | P3 | Ha |

### Soliq qoidalari tizimi (majburiy)

Har bir soliq parametri (`tax_rules`) quyidagilarga ega:
- `key` (masalan, `pit_rate`, `vat_rate`, `social_tax_rate`, `min_wage`, `bhm`)
- `value`, `effective_from`, `effective_to`
- `source_url` (lex.uz yoki soliq.uz), `legal_basis` (hujjat raqami va moddasi)
- `status`: draft → reviewed → approved (faqat `approved` hisoblashda ishlatiladi)
- `approved_by` (mas’ul mutaxassis), `approved_at`
- Har bir o‘zgarish — yangi versiya; eski versiya o‘chirilmaydi.

Hisoblash natijasi ostida: "Hisob {sana} holatidagi qoidalar bo‘yicha. Manba: … Bu rasmiy soliq maslahati emas."

Tarixiy hisoblash: foydalanuvchi o‘tgan sanani tanlasa, o‘sha sanada kuchda bo‘lgan qoidalar ishlatiladi.

Har bir soliq formulasi uchun **golden test** — rasmiy misollar yoki buxgalter tomonidan tasdiqlangan qiymatlar bilan avtomatik test (08-hujjat).

### Business Pro funksiyalari

| ID | Talab | Bosqich | Tarif |
|---|---|---|---|
| BP-1 | Hisoblarni saqlash va tarix | P2 | Plus |
| BP-2 | PDF/Excel eksport | P2 | Pro |
| BP-3 | Kompaniya ish maydoni (workspace) | P3 | Business |
| BP-4 | Jamoa a’zolari va rollar | P3 | Business |
| BP-5 | Takroriy hisobotlar (oylik email) | P3 | Business |
| BP-6 | Moliyaviy dashboard | P3 | Business |
| BP-7 | Kalkulyator API | P3 | API tarif |

## 5. Narx taqqoslash moduli

### MVP doirasi (P1)

- **Bitta kategoriya**: smartfonlar (keyin noutbuklar, maishiy texnika).
- **Kichik, qo‘lda tekshirilgan katalog**: 100–300 mahsulot, 3–5 do‘kon [FARAZ].
- Narxlar faqat **ruxsat etilgan** manbadan: do‘kon feedi, hamkorlik, yoki do‘kon ruxsati bilan. Ruxsatsiz scraping huquqiy jihatdan [TEKSHIR].

### Talablar

| ID | Talab | Bosqich | Free/Paid |
|---|---|---|---|
| P-1 | Mahsulot qidiruvi va kategoriyalar | P1 | Free |
| P-2 | Mahsulot kartochkasi: xususiyatlar, variantlar (xotira, rang) | P1 | Free |
| P-3 | Do‘konlar bo‘yicha narxlar, mavjudlik, yangilangan vaqt | P1 | Free |
| P-4 | Narx tarixi grafigi | P2 | Free |
| P-5 | Narx pasayish ogohlantirishi | P3 | Plus (10), Pro (50) |
| P-6 | Sotuvchi ishonch ko‘rsatkichlari (rasmiy diler, kafolat, yetkazish) | P2 | Free |
| P-7 | Chiqish havolalari (`/go/…`) va click tracking | P2 | — |
| P-8 | Sotuvchi kabineti: feed import (CSV/XML/JSON), statistika | P3 | Seller Pro |
| P-9 | Homiylik joylari ("Homiylik" yorlig‘i bilan) | P3 | Reklama |
| P-10 | Affiliate konversiyalar va reconciliation | P3 | — |
| P-11 | Brend/distributor analitikasi | P4 | Analytics |
| P-12 | White-label taqqoslash vidjeti | P4 | Enterprise |

### Mahsulot moslashtirish (normalization)

Bir xil mahsulot deb hisoblash uchun quyidagilar mos kelishi shart: brend, model, xotira hajmi (RAM/ROM), rang (variant sifatida), mintaqaviy versiya (agar ma’lum bo‘lsa). Avtomatik moslashtirish ishonch bali < chegara bo‘lsa — admin navbatiga tushadi. Noto‘g‘ri moslashtirilgan taklif ko‘rsatilmaydi.

Narx eskirishi: `last_seen_at` X soatdan eski taklif "eskirgan" belgisi oladi; Y soatdan keyin yashiriladi [FARAZ: X=24, Y=72].

## 6. Akkaunt va billing

| ID | Talab | Bosqich |
|---|---|---|
| A-1 | Ro‘yxatdan o‘tish, kirish, chiqish, parol tiklash, email tasdiqlash | P1 |
| A-2 | Google OAuth (ixtiyoriy) | P2 |
| A-3 | Sessiyalar ro‘yxati va boshqa qurilmalardan chiqish | P2 |
| A-4 | Obuna sotib olish, tarifni o‘zgartirish, bekor qilish | P2 |
| A-5 | To‘lov tarixi va hisob-fakturalar (PDF) | P2 |
| A-6 | API kalitlar: yaratish, nomlash, bekor qilish (kalit faqat bir marta ko‘rsatiladi) | P3 |
| A-7 | Foydalanish statistikasi (AI kreditlar, API so‘rovlar) | P3 |
| A-8 | Workspace va a’zolarni taklif qilish | P3 |
| A-9 | Akkauntni o‘chirish va ma’lumotlarni eksport qilish | P2 |

## 7. Admin panel

### 7.1 Rollar (RBAC)

| Rol | Ruxsatlar |
|---|---|
| `superadmin` | Hammasi, rollarni boshqarish |
| `finance` | Tariflar, to‘lovlar, refund, hisob-fakturalar, reconciliation, daromad hisobotlari |
| `content_tax` | Soliq qoidalari: draft yaratish, ko‘rib chiqish (tasdiqlash — alohida `tax_approver`) |
| `tax_approver` | Soliq qoidalarini tasdiqlash (o‘zi yaratgan draftni tasdiqlay olmaydi — 4 ko‘z tamoyili) |
| `catalog` | Mahsulotlar, moslashtirish navbati, do‘konlar |
| `ads` | Reklama kampaniyalari, moderatsiya |
| `support` | Foydalanuvchilarni ko‘rish (cheklangan PII), obunani ko‘rish, refund so‘rovi yaratish |
| `analyst` | Faqat o‘qish: dashboardlar, agregat hisobotlar |

Har bir admin harakati `audit_logs` ga yoziladi (kim, nima, qachon, oldin/keyin qiymat, IP).

Admin kirishi uchun 2FA majburiy.

### 7.2 Dashboard ko‘rsatkichlari

| Guruh | Ko‘rsatkichlar |
|---|---|
| Trafik | DAU, MAU, modul bo‘yicha sessiyalar, manba (organik/to‘g‘ridan/referral) |
| Daromad | Manba bo‘yicha daromad, MRR, ARR, ARPU, ARPPU |
| Obuna | Yangi, bekor qilingan, churn, trial → paid konversiya |
| Xarajat | AI provayder xarajati (modul, tarif, foydalanuvchi bo‘yicha), to‘lov komissiyalari, server |
| Marja | Manba bo‘yicha yalpi marja |
| API | So‘rovlar, xatolar, top mijozlar |
| Narx | Faol takliflar, eskirgan takliflar, bosishlar, konversiyalar, do‘kon faolligi |
| Reklama | Ko‘rishlar, valid bosishlar, kampaniya byudjeti |
| Ma’lumot sog‘lig‘i | Oxirgi CBU import vaqti, feed import xatolari, moslashtirish navbati uzunligi |
| Firibgarlik | Shubhali bosishlar, trial suiiste’moli, API kalit anomaliyalari |

### 7.3 Admin funksiyalari

- Foydalanuvchilar: qidirish, ko‘rish, bloklash, obunani qo‘lda berish (sabab majburiy).
- Tariflar va narxlar: versiyalangan tahrir, kuchga kirish sanasi.
- Feature flaglar: modul, tarif, foydalanuvchi foizi bo‘yicha.
- AI limitlari: tarif bo‘yicha kvotalar, global kunlik xarajat chegarasi (oshsa — AI vaqtincha faqat to‘lovchilar uchun).
- Reklama: kampaniya yaratish, moderatsiya, byudjet, statistika.
- Do‘konlar: ariza tasdiqlash, feed holati, komissiya sozlamalari.
- Affiliate reconciliation: oylik solishtirish va tasdiqlash.
- Soliq qoidalari: draft → review → approve oqimi.
- Valyuta ma’lumotlari: import holati, qo‘lda qayta ishga tushirish.
- Hisobotlar: CSV eksport.
- Tizim sozlamalari va audit log ko‘rish.
