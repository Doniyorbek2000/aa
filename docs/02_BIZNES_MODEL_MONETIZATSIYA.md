# 02 — Biznes model, monetizatsiya, narxlar va unit-iqtisodiyot

> Qamrab oladi: BUSINESS_MODEL, MONETIZATION_STRATEGY, PRICING_STRATEGY, UNIT_ECONOMICS, MERCHANT_PARTNERSHIPS.
> Barcha summalar so‘mda. Barcha narx va konversiya raqamlari — **[FARAZ]**, admin paneldan o‘zgartiriladigan eksperiment.

## 1. Biznes modeli (umumiy)

```
Bepul foydali vositalar ──► Organik trafik (SEO) ──► Akkaunt
        │                                              │
        ├─► To‘g‘ridan-to‘g‘ri reklama / homiylik        ├─► Plus / Pro obuna (B2C)
        ├─► Narx taqqoslash → do‘konga yo‘naltirish     ├─► Business obuna (B2B)
        │      (CPC / CPA / affiliate)                  └─► API / Enterprise
        └─► Valyuta → bank hamkorligi (homiylik, referral)
```

Har bir daromad manbasi **alohida o‘lchanadi** (alohida hisob, alohida xarajat, alohida marja). Bir manbaning muvaffaqiyati boshqasining zaifligini yashirmasligi kerak.

## 2. Daromad manbalari — ustuvorlik bo‘yicha

01-hujjatdagi F3 (AdSense o‘zbek tilini qo‘llamaydi) sababli ustuvorlik asl rejadan farq qiladi.

| # | Manba | Kim to‘laydi | Model | Bosqich | Ishonch |
|---|---|---|---|---|---|
| 1 | Business obuna | Tadbirkor, buxgalter, MChJ | Oylik/yillik | Phase 2 | O‘rta |
| 2 | Plus/Pro obuna | Talaba, jurnalist, SMM | Oylik/yillik | Phase 2 | Past–o‘rta |
| 3 | To‘g‘ridan-to‘g‘ri reklama va homiylik | Banklar, do‘konlar, xizmatlar | CPM/oylik qat’iy narx | Phase 2 | O‘rta |
| 4 | Narx taqqoslash: CPC / CPA / affiliate | Do‘konlar | Tashrif yoki tasdiqlangan savdo uchun | Phase 3 | O‘rta (hamkorlikka bog‘liq) |
| 5 | API (kurs, imlo, kalkulyator) | Developerlar, ERP/CRM | Hajmga qarab paketlar | Phase 3 | Past–o‘rta |
| 6 | AI kredit paketlari | Imlo foydalanuvchilari | Bir martalik | Phase 3 | O‘rta |
| 7 | Seller Pro / Merchant analytics | Do‘konlar, brendlar | Oylik | Phase 3–4 | Past |
| 8 | White-label vidjetlar | Banklar, saytlar | Shartnoma | Phase 4 | Past |
| 9 | Reklama tarmog‘i (AdSense ruscha sahifalarda yoki boshqa tarmoq) | Tarmoq | Revenue share | Phase 2, faqat [TEKSHIR]dan keyin | Noaniq |

### Har bir manba uchun majburiy konfiguratsiya

| Element | Mazmuni |
|---|---|
| Billing model | subscription / one_time / usage / cpc / cpa / flat_fee |
| Customer type | individual / business / merchant / advertiser / developer |
| Pricing rules | Narx, valyuta, davr, chegirma, sinov muddati — versiyalangan |
| Commission config | Foiz yoki qat’iy summa, hamkor bo‘yicha, sanadan kuchga kiradi |
| Accounting entries | Ikki tomonlama yozuv (debet/kredit) — `ledger_entries` (05-hujjat) |
| Refund logic | Qisman/to‘liq, entitlement qaytarib olinadi, ledger teskari yozuvi |
| Invoice | Raqamlangan, o‘zgarmas; rekvizitlar; QQS qatori (agar kompaniya QQS to‘lovchi bo‘lsa) [TEKSHIR] |
| Payment status | pending / succeeded / failed / refunded / chargeback |
| Abuse detection | Bot kliklari, takroriy trial, karta almashtirish, API kalit bo‘lishish |
| Revenue reporting | Manba × modul × kun |
| Cost tracking | AI token xarajati, server, to‘lov komissiyasi, hamkor ulushi |
| Profitability | Manba bo‘yicha yalpi marja |

## 3. Tariflar (boshlang‘ich gipoteza)

Bitta umumiy tarif tizimi; modul bo‘yicha alohida obuna yo‘q (chalkashlikni kamaytirish uchun).

| Tarif | Oylik | Yillik (−20%) [FARAZ] | Kimga | Asosiy imkoniyatlar |
|---|---|---|---|---|
| Free | 0 | 0 | Hamma | Barcha bepul vositalar, cheklangan AI (kuniga N tekshiruv), reklama ko‘rinadi |
| Plus | 29 000 | 278 400 | Talaba, faol foydalanuvchi | Reklamasiz, oshirilgan limitlar, 5 ta kurs ogohlantirishi, 10 ta narx kuzatuvi, saqlangan hisoblar |
| Pro | 79 000 | 758 400 | Jurnalist, SMM, frilanser | Plus + AI qayta yozish va uslub (oylik kredit limiti), DOCX/PDF, eksport, kengaytirilgan tahlil |
| Business | 199 000 | 1 910 400 | Kichik biznes, buxgalter | Pro + jamoa (5 o‘rin), kompaniya ish maydoni, ish haqi va hisobotlar, takroriy hisobotlar, cheklangan API |
| Enterprise | Kelishiladi | — | Yirik tashkilot | SSO, SLA, maxsus limit, white-label, shartnoma |

Qo‘shimcha:
- **AI kredit paketlari** — limit tugaganda bir martalik xarid (masalan, 100 ming so‘z) [FARAZ].
- **API paketlari** — Developer (bepul, sekundiga past limit), Starter, Growth; narxi so‘rov soniga qarab.
- Asl hujjatdagi modul-tariflar (Imlo Premium 19 000, Business Start 59 000 va h.k.) **A/B test varianti** sifatida saqlanadi, lekin MVPda bitta umumiy tarif jadvali ko‘rsatiladi.

### Narx siyosati qoidalari

1. Narxlar `plan_prices` jadvalida versiyalangan; mavjud obunachilar eski narxda qoladi (grandfathering), agar admin boshqacha qaror qilmasa.
2. "Cheksiz AI" hech qaysi tarifda va’da qilinmaydi. Limit so‘z yoki token bo‘yicha, "adolatli foydalanish" sharti bilan.
3. Trial: 7 kun Pro, karta talab qilinmaydi (takroriy to‘lov provayderda tasdiqlanmaguncha) [FARAZ].
4. Narxni o‘zgartirish — admin panelda, audit log bilan.

## 4. Unit-iqtisodiyot

### 4.1 Asosiy formulalar

```
ARPU            = Oylik daromad / Faol foydalanuvchilar
ARPPU           = Obuna daromadi / To‘lovchi foydalanuvchilar
Konversiya      = Yangi to‘lovchilar / Ro‘yxatdan o‘tganlar (davr bo‘yicha)
Churn (oylik)   = Davr ichida bekor qilganlar / Davr boshidagi to‘lovchilar
LTV             = ARPPU × Yalpi marja % / Churn
CAC             = Marketing xarajati / Yangi to‘lovchilar
Payback (oy)    = CAC / (ARPPU × Yalpi marja %)
Yalpi marja     = (Daromad − AI xarajati − to‘lov komissiyasi − hamkor ulushi − infra ulushi) / Daromad
```

Maqsad [FARAZ]: LTV/CAC ≥ 3, payback ≤ 6 oy, AI modulida yalpi marja ≥ 60%.

### 4.2 AI xarajatini cheklash

AI tekshiruv tannarxi model narxi va matn uzunligiga bog‘liq. Aniq narxlar tanlangan provayderning joriy narx sahifasidan olinadi va `ai_cost_rates` jadvalida saqlanadi [TEKSHIR].

Himoya mexanizmlari:
- **Avval lug‘at va qoidalar** — oddiy imlo xatolari AI'siz tuzatiladi. AI faqat murakkab grammatika, qayta yozish va uslub uchun.
- **Har bir AI so‘rovi** `ai_usage_events` ga yoziladi: kirish/chiqish tokenlari, model, xarajat (so‘mda), foydalanuvchi, tarif.
- **Tarif bo‘yicha oylik kredit** — Free: kichik kunlik limit; Plus/Pro/Business: oylik kvota.
- **Kesh** — bir xil matn bo‘lagi qayta yuborilsa, natija keshdan.
- **Kichik model birinchi** — oddiy vazifalar arzon modelga, murakkab vazifalar kuchli modelga yo‘naltiriladi.
- **Ogohlantirish** — foydalanuvchining AI xarajati uning to‘lovining X% dan oshsa, admin ogohlantiriladi.

### 4.3 Daromad ssenariylari (prognoz emas, matematika ko‘rsatmasi)

Asl hujjatdagi jadval AdSense'ni hisobga olgan edi. Quyidagi variant to‘g‘ridan-to‘g‘ri reklamaga asoslangan. **Hech biri prognoz emas.** Xarajatlar ayirilmagan.

| Manba | Farazlar (Boshlang‘ich / O‘rta / Kengaygan) | Boshlang‘ich | O‘rta | Kengaygan |
|---|---|---|---|---|
| To‘g‘ridan-to‘g‘ri reklama / homiylik | 0 / 2 / 6 reklama beruvchi × ~1–2 mln | 0 | 3 mln | 12 mln |
| Individual obunalar | 20 / 200 / 1 000 Plus-ekvivalent × 29 000 | 580 ming | 5,8 mln | 29 mln |
| Biznes obunalar | 0 / 15 / 100 × 199 000 | 0 | 2,99 mln | 19,9 mln |
| Narx taqqoslash (CPC/CPA) | 0 / 2 mln / 15 mln | 0 | 2 mln | 15 mln |
| API / korporativ | 0 / 1 mln / 10 mln | 0 | 1 mln | 10 mln |
| **Jami / oy** | | **580 ming** | **14,79 mln** | **85,9 mln** |

Xulosa: boshlang‘ich bosqichda daromad deyarli faqat obunadan keladi. Shuning uchun Business tarifining qiymati MVPdan keyin birinchi validatsiya qilinadigan narsa (01-hujjat, A2).

## 5. Do‘kon va hamkorlik modeli (merchant partnerships)

### 5.1 Hamkorlik turlari

| Model | To‘lov sharti | Kerakli texnik qism |
|---|---|---|
| **CPC** | Haqiqiy (validatsiyadan o‘tgan) bosish uchun | Redirect servis, bot filtri, kunlik byudjet |
| **CPA / affiliate** | Tasdiqlangan savdodan % | Attribution (click ID), postback/feed orqali konversiya, qaytarishlarni solishtirish |
| **CPL** | Malakali so‘rov uchun (masalan, ulgurji xarid so‘rovi) | Lead forma, rozilik, dublikat tekshiruvi |
| **Seller Pro** | Oylik | Do‘kon kabineti, feed import, analitika |
| **Homiylik** | Qat’iy oylik/kampaniya | Belgilangan joy, "Homiylik" yorlig‘i |

Misol: 2% komissiyada 5 000 000 so‘mlik tasdiqlangan savdodan 100 000 so‘m. 2% — faqat misol, bozor stavkasi emas.

### 5.2 Attribution va firibgarlikka qarshi

1. Har bir chiqish havolasi: `/go/{offer_id}?c={click_id}` — server `clicks` ga yozadi va 302 bilan do‘konga yo‘naltiradi.
2. Do‘kon konversiyani postback (HMAC imzoli) yoki kunlik hisobot orqali qaytaradi.
3. Bot filtri: user-agent, IP tezligi, sessiya xulq-atvori, ma’lum bot ro‘yxatlari. Shubhali bosishlar hisobga olinmaydi va hisob-fakturaga kirmaydi.
4. Oylik **reconciliation**: platforma bosishlari ↔ do‘kon hisoboti ↔ qaytarishlar. Farq > X% bo‘lsa, admin ko‘rib chiqadi.
5. Qaytarilgan buyurtma komissiyasi teskari ledger yozuvi bilan bekor qilinadi.

### 5.3 Halollik qoidalari

- Homiylik takliflari alohida bo‘limda va "Homiylik" deb belgilanadi.
- "Eng arzon narx" va "eng yaxshi kurs" tartiblash algoritmi to‘lovdan mustaqil va bu kodda test bilan himoyalanadi.
- Narx yangilangan vaqti har bir taklifda ko‘rinadi; X soatdan eski narx "eskirgan" deb belgilanadi yoki yashiriladi.

### 5.4 Hamkor bilan shartnoma minimal bandlari [TEKSHIR — yurist]

Ma’lumot berish formati (feed), yangilanish chastotasi, narx aniqligi uchun javobgarlik, komissiya, attribution oynasi (masalan, 7 kun), qaytarishlar tartibi, to‘lov muddati, logotip/brendni ishlatish ruxsati, shartnomani bekor qilish.

## 6. Mijoz jalb qilish va ushlab qolish

| Kanal | Modul | Izoh |
|---|---|---|
| SEO (asosiy) | Hammasi | 07-hujjat |
| Telegram bot va kanal | Valyuta, Narx | Kurs va narx ogohlantirishlari — kunlik qaytish sababi |
| Vidjetlar (kurs, kalkulyator) | Valyuta, Biznes | Boshqa saytlarga bepul vidjet + backlink |
| Buxgalterlar hamjamiyati | Biznes | Referral: taklif qilgan buxgalterga bepul oy [FARAZ] |
| Brauzer kengaytmasi | Imlo | Phase 3 |

Ushlab qolish: saqlangan hisoblar, kuzatuvlar va ogohlantirishlar foydalanuvchini platformaga bog‘laydi; yillik tarifda chegirma; bekor qilish oqimida sabab so‘rovi.
