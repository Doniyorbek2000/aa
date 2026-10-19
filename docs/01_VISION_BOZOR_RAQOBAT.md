# 01 — Mahsulot g‘oyasi, bozor va raqobatchilar

> Qamrab oladi: PRODUCT_VISION, MARKET_RESEARCH, COMPETITOR_ANALYSIS.
> Belgilar: **[FAKT]** — manba bilan tekshirilgan; **[FARAZ]** — tekshirilmagan gipoteza; **[TEKSHIR]** — rasmiy manba yoki yurist bilan tasdiqlash shart.
> Tadqiqot sanasi: 2026-10-19.

## 1. Mahsulot g‘oyasi (vision)

**Bir jumlada:** O‘zbekistondagi odamlar va kichik bizneslar har kuni ishlatadigan to‘rtta amaliy vositani (imlo, valyuta, biznes hisob-kitob, narx taqqoslash) bitta akkaunt va bitta obuna ostida beradigan, ishonchli ma’lumotga tayangan platforma.

**Nima uchun birlashtiriladi:**

- Bitta SEO va brend investitsiyasi to‘rt xil qidiruv niyatini qamraydi ("dollar kursi", "ish haqi kalkulyator", "imlo tekshirish", "iPhone narxi").
- Modullar orasida tabiiy ko‘prik bor: valyuta kursi narx taqqoslash va biznes kalkulyatorlarida qayta ishlatiladi; imlo vositasi biznes hujjatlari uchun kerak.
- Bitta to‘lov, bitta entitlement tizimi, bitta admin panel — operatsion xarajat kamroq.

**Nima emas:**

- Rasmiy soliq yoki moliyaviy maslahatchi emas.
- Bank, valyuta ayirboshlash punkti yoki to‘lov tashkiloti emas.
- Marketplace emas — platforma tovar sotmaydi, xaridorni do‘konga yo‘naltiradi.

**Asosiy tamoyillar:**

1. Ma’lumot manbasi va yangilangan vaqti har doim ko‘rinadi.
2. Reklama va homiylik har doim belgilanadi; tartiblashga (eng arzon narx, eng yaxshi kurs) ta’sir qilmaydi.
3. Bepul qatlam haqiqatan foydali bo‘ladi; pullik qatlam vaqt tejaydi, avtomatlashtiradi yoki biznes uchun qiymat beradi.
4. Pullik imkoniyatlar faqat server tomonidagi entitlement orqali ochiladi.

## 2. Maqsadli auditoriya

| Segment | Asosiy ehtiyoj | Qaysi modul | To‘lashga tayyorlik |
|---|---|---|---|
| Talabalar, o‘qituvchilar | Imlo, lotin–kirill, referat tahriri | Imlo | Past [FARAZ] |
| Jurnalistlar, SMM, kopirayterlar | Tez va to‘g‘ri matn, uslub | Imlo Pro | O‘rta [FARAZ] |
| Oddiy foydalanuvchilar | Kurs, eng yaxshi bank kursi, mahsulot narxi | Valyuta, Narx | Juda past, reklama orqali monetizatsiya |
| Yakka tadbirkorlar, o‘zini o‘zi band qilganlar | Soliq, ustama, foyda hisobi | Biznes | O‘rta [FARAZ] |
| Buxgalterlar, kichik MChJ | Ish haqi hisoblash, hisobot, eksport | Biznes Pro | O‘rta–yuqori [FARAZ] |
| Do‘konlar, sotuvchilar | Trafik, mijoz, raqobatchilar narxi | Narx (Seller Pro) | Natijaga qarab (CPC/CPA) [FARAZ] |
| Developerlar, ERP/CRM | Kurs API, imlo API | API | Hajmga qarab [FARAZ] |

## 3. Bozor bo‘yicha tekshirilgan faktlar

| # | Fakt | Holat | Manba |
|---|---|---|---|
| F1 | Markaziy bank kurslarini JSON ko‘rinishida beradi. Maydonlar: `id, Code, Ccy, CcyNm_RU, CcyNm_UZ, CcyNm_UZC, CcyNm_EN, Nominal, Rate, Diff, Date` (sana `DD.MM.YYYY`). 2026-10-19 holatida 74 ta valyuta. | [FAKT] | https://cbu.uz/uz/arkhiv-kursov-valyut/json/ |
| F2 | Markaziy bank e’lon qilgan kurs bo‘yicha valyuta sotib olish/sotish majburiyatini olmaydi — ya’ni rasmiy kurs bank savdo kursi emas. | [FAKT] | kun.uz yangiliklari (CBU bayonoti) |
| F3 | **Google AdSense qo‘llab-quvvatlaydigan tillar ro‘yxatida o‘zbek tili yo‘q. Rus tili bor.** Siyosat: asosan qo‘llab-quvvatlanmaydigan tildagi kontentga reklama ruxsat etilmaydi. | [FAKT] | https://support.google.com/publisherpolicies/answer/10436912 |
| F4 | Reklama to‘g‘risidagi qonun (2022): O‘zbekistonda tarqatiladigan reklama o‘zbek tilida bo‘lishi shart; tarjima ruxsat, lekin shartlar bilan. | [FAKT], 2024+ o‘zgarishlar [TEKSHIR] | https://lex.uz/uz/explanation/1637 |
| F5 | Shaxsga doir ma’lumotlar to‘g‘risidagi qonunning 27-1-moddasi (ZRU-666, 2021): O‘zbekiston fuqarolarining shaxsiy ma’lumotlari O‘zbekiston hududidagi serverlarda saqlanishi va davlat reyestrida ro‘yxatdan o‘tishi kerak. | [FAKT], hozirgi tahriri [TEKSHIR] | kun.uz, mondaq.com |
| F6 | 2026 asosiy soliq stavkalari: JShDS 12%, QQS 12%, ijtimoiy soliq 12% (davlat ulushli korxonalarda 25%), foyda solig‘i 15%, aylanma soliq 4%; 2026-01-01 dan aylanmasi 1 mlrd so‘mgacha bo‘lgan YaTT va o‘zini o‘zi band qilganlar uchun 1%. | Manbalar bir xil, lekin qonun matni [TEKSHIR] | kun.uz (2025-11-26), EY, PwC tax summaries |
| F7 | Xodimning pensiya badali (INPS) bo‘yicha manbalar ziddiyatli (0,1% / 1% / 4%). | [TEKSHIR] — soliq kodeksi yoki soliq.uz | PwC, countrytaxcalc, tradingeconomics |
| F8 | 2026-09-01 dan eng kam oylik ish haqi 1 360 000 so‘m, BHM 440 000 so‘m. | MIRT [FAKT]; BHM bitta manba [TEKSHIR] | yep.uz, wageindicator.org |
| F9 | Uzum Market sotuvchi komissiyasi 2024-05-01 dan kategoriyaga qarab 3–35%. Bu sotuvchi komissiyasi, affiliate stavkasi emas. Affiliate dastur topilmadi. | [FAKT] (2024), hozirgi holat [TEKSHIR] | spot.uz (2024-04-17) |
| F10 | O‘zbek to‘lov provayderlari: Payme (Merchant API va kartani tokenlashtiruvchi Subscribe API), Click, Uzum, Paynet, Octo, Multicard. Takroriy (recurring) to‘lov imkoniyati har biri uchun rasmiy hujjatdan tasdiqlanmagan. | [TEKSHIR] | pypi.org/project/tolov (community), uchinchi tomon sharhlari |

### F3 bo‘yicha xulosa (eng muhim topilma)

Asl rejada reklama daromadi AdSense'ga tayanadi. O‘zbekcha sahifalar AdSense'ga mos kelmaydi. Shu sababli:

- Reklama strategiyasi **to‘g‘ridan-to‘g‘ri reklama savdosi** (banklar, do‘konlar, buxgalteriya xizmatlari) va **homiylik joylari**ga asoslanadi.
- Ruscha sahifalar AdSense uchun mos bo‘lishi mumkin, lekin F4 (reklama o‘zbek tilida bo‘lishi) bilan qanday kesishishi yuristdan so‘ralishi kerak [TEKSHIR].
- Boshqa reklama tarmoqlari (masalan, Yandex reklama tarmog‘i, mahalliy tarmoqlar) o‘zbek tilini qo‘llab-quvvatlashi alohida tekshirilishi kerak [TEKSHIR].
- 02-hujjatdagi daromad ssenariylarida AdSense ulushi shunga mos kamaytirilgan.

## 4. Raqobatchilar tahlili

### 4.1 AI Imlo

| Raqobatchi | Nima qiladi | Kuchli tomoni | Zaif tomoni / bizning imkoniyat | Manba |
|---|---|---|---|---|
| **Tahrirchi** | Imlo tekshirish, lotin↔kirill, kontekst xatolari, Chrome kengaytmasi; AI tarjima va tahrir | Brend, 2+ yil tajriba, mGov Award 2022 ($50 000), brauzer kengaytmasi | Narx/tarif ochiq topilmadi [TEKSHIR]; biznes integratsiya va hujjat ish oqimi chuqurligi noma’lum | spot.uz, extscope.org |
| **imlo.insof.uz** | Imlo API; WordPress plagini mavjud | Developerlar uchun API | Plagin eskirgan (so‘nggi WP versiyalarida tekshirilmagan) | wordpress.org/plugins/imlo |
| **Imlo.uz** | Diktant tekshirish, akademik vosita | Ta’lim muhiti uchun mos | Asosan o‘qitish vositasi | NUU konferensiya maqolasi |
| Umumiy LLM'lar (ChatGPT, Claude, Gemini) | Erkin matn tahriri | Kuchli til modeli | O‘zbek imlo qoidalariga qat’iy rioya kafolati yo‘q; lug‘at asosidagi ishonch darajasi yo‘q | — |

**Farqlanish:** Tahrirchi to‘g‘ridan-to‘g‘ri raqib. Faqat "yana bitta imlo tekshirgich" bo‘lish yetarli emas. Farqlanish yo‘llari [FARAZ]:
- Biznes hujjatlari oqimi: DOCX yuklash → tahrir → rasmiy uslub → eksport, jamoaviy lug‘at (kompaniya atamalari).
- Platforma ichidagi integratsiya: biznes kalkulyatori natijasidan avtomatik rasmiy xat/hisobot matni.
- Shaffof ishonch darajasi: har bir taklif uchun manba (lug‘at qoidasi yoki AI) va ishonch bali.

### 4.2 Valyuta

| Raqobatchi | Nima qiladi | Kuchli tomoni | Zaif tomoni / imkoniyat | Manba |
|---|---|---|---|---|
| **depozit.uz** | Banklar bo‘yicha kurslar: filial, mobil ilova, bankomat kurslarini ajratadi; maxsus takliflar | Ajratilgan kanal kurslari — chuqur | Ma’lumot manbasi va yangilanish usuli [TEKSHIR] | depozit.uz/uz/exchange-rate-bank |
| **bank.uz** | Bank kurslari va bank mahsulotlari (bozordan ma’lum) | Brend | Bu tadqiqotda tasdiqlanmadi [TEKSHIR] | — |
| Yangilik saytlari (kun.uz, anhor.uz) | Kunlik "eng yaxshi kurs" ro‘yxatlari | Katta auditoriya | Interaktiv vosita emas, ogohlantirish yo‘q | anhor.uz |
| "Kurs valyut Uzbekistana" mobil ilovalari | Kurslar | Mobil | Biznes API, eksport yo‘q | App Store |

**Farqlanish [FARAZ]:** kurs ogohlantirishlari (Telegram), biznes uchun kurs API va vidjet, valyuta kursini platformaning boshqa modullariga ulash (import narxi, valyutadagi xarajatlar). Banklarning real kurslari faqat ruxsat etilgan manbadan (hamkorlik feedi, rasmiy API) olinadi — scraping huquqiy jihatdan [TEKSHIR].

### 4.3 Biznes va soliq kalkulyatorlari

| Raqobatchi | Nima qiladi | Izoh |
|---|---|---|
| **norma.uz** | Soliq rejimini tanlash kalkulyatori, huquqiy-buxgalteriya ma’lumot bazasi | Buxgalterlar orasida obro‘li, pullik kontent |
| **buxgalter.uz** | Buxgalteriya maqolalari, ish haqi bo‘yicha qo‘llanmalar | Kontent, interaktiv kalkulyator chuqurligi [TEKSHIR] |
| soliq.uz / my.soliq.uz | Rasmiy davlat xizmatlari | Raqobatchi emas, rasmiy manba |
| 1C, Didox va boshqa buxgalteriya/EDO tizimlari | To‘liq buxgalteriya | Platforma ular bilan raqobatlashmaydi; API orqali to‘ldiradi |

**Farqlanish [FARAZ]:** tez, ochiq, versiyalangan formulalar (har bir natija ostida "qaysi qoida, qaysi sanadan, qaysi manba"), saqlangan hisoblar, PDF/Excel eksport, jamoaviy ish maydoni.

### 4.4 Narx taqqoslash

| Raqobatchi | Nima qiladi | Izoh | Manba |
|---|---|---|---|
| **Savat** (iOS) | Minglab do‘konlar bo‘yicha narx taqqoslash, narx pasayishi, shtrix-kod skaneri | To‘g‘ridan-to‘g‘ri raqib; reyting/sharhlar hali kam | apps.apple.com/app/id6744843065 |
| Uzum Market, Olcha, Texnomart, Mediapark, Alifshop, Kattabozor | Marketplace / do‘kon | Raqobatchi emas — **ma’lumot manbasi va potensial hamkor** | ahrefs.com sahifalari |

**Farqlanish [FARAZ]:** web-first (SEO orqali "X narxi" qidiruvlarini olish), kichik, sifatli katalog (elektronika), aniq mahsulot moslashtirish (model, xotira, rang), narx tarixi, ochiq "yangilangan vaqt".

## 5. Asosiy farazlar ro‘yxati (validatsiya kerak)

| ID | Faraz | Qanday tekshiriladi |
|---|---|---|
| A1 | O‘zbek tilidagi kalkulyator va valyuta qidiruvlari yetarli organik trafik beradi | Search Console, kalit so‘z tadqiqoti (Google Keyword Planner, Yandex Wordstat) |
| A2 | Kichik bizneslar oyiga 59–199 ming so‘m to‘laydi | 15–20 ta buxgalter/tadbirkor bilan intervyu; soxta "Pro" tugmasi (fake door) konversiyasi |
| A3 | Imlo moduli Tahrirchi'dan ajralib turadigan qiymat bera oladi | Ko‘r taqqoslash testi (bir xil 50 matn), foydalanuvchi intervyulari |
| A4 | Do‘konlar CPC/affiliate asosida to‘laydi | 5 ta do‘kon bilan pilot muzokara |
| A5 | Banklar homiylik joyi uchun to‘laydi | 2–3 ta bank marketing bo‘limi bilan suhbat |
| A6 | To‘g‘ridan-to‘g‘ri reklama AdSense o‘rnini bosa oladi | Birinchi 3 oyda kamida 2 ta to‘g‘ridan-to‘g‘ri reklama beruvchi |
