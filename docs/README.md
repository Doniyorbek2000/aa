# Webpul — Phase 0 hujjatlari

O‘zbekiston uchun yagona platforma: **AI Imlo**, **Valyuta**, **Biznes kalkulyatorlari**, **Narx taqqoslash** — bitta akkaunt, bitta obuna, yagona to‘lov va reklama boshqaruvi.

Holat: **Phase 0 — tadqiqot va arxitektura.** Kod yozilmagan, hech narsa deploy qilinmagan, pullik xizmatlar yoqilmagan.
Sana: 2026-10-19.

## Hujjatlar

| Fayl | Mazmuni | Asl ro‘yxatdagi hujjatlar |
|---|---|---|
| [01_VISION_BOZOR_RAQOBAT.md](01_VISION_BOZOR_RAQOBAT.md) | G‘oya, auditoriya, tekshirilgan faktlar, raqobatchilar, farazlar | 1, 2, 3 |
| [02_BIZNES_MODEL_MONETIZATSIYA.md](02_BIZNES_MODEL_MONETIZATSIYA.md) | Daromad manbalari, tariflar, unit-iqtisodiyot, do‘konlar bilan hamkorlik | 4, 5, 6, 7, 17 |
| [03_MAHSULOT_TALABLARI.md](03_MAHSULOT_TALABLARI.md) | Modullar bo‘yicha talablar, admin panel | 8, 15 |
| [04_TEXNIK_ARXITEKTURA.md](04_TEXNIK_ARXITEKTURA.md) | Arxitektura, stack, API, to‘lov tizimi | 9, 14, 16 |
| [05_DATABASE_SCHEMA.md](05_DATABASE_SCHEMA.md) | Ma’lumotlar bazasi sxemasi | 10 |
| [06_XAVFSIZLIK_HUQUQ.md](06_XAVFSIZLIK_HUQUQ.md) | Xavfsizlik rejasi, huquqiy checklist | 11, 21 |
| [07_SEO_UX_ANALITIKA.md](07_SEO_UX_ANALITIKA.md) | SEO, dizayn tizimi, KPI | 12, 13, 18 |
| [08_TEST_XARAJAT_RISK.md](08_TEST_XARAJAT_RISK.md) | Test strategiyasi, xarajatlar, risklar | 19, 22, 23 |
| [09_ROADMAP_IMPLEMENTATSIYA.md](09_ROADMAP_IMPLEMENTATSIYA.md) | Bosqichlar, haftalik reja, qaror nuqtalari | 20, 24 |

Belgilar: **[FAKT]** — manba bilan tekshirilgan; **[FARAZ]** — gipoteza; **[TEKSHIR]** — rasmiy manba yoki yurist/buxgalter tasdig‘i kerak.

## Asl rejani o‘zgartiradigan asosiy topilmalar

1. **AdSense o‘zbek tilini qo‘llab-quvvatlamaydi** (rus tili qo‘llanadi). Reklama daromadi to‘g‘ridan-to‘g‘ri reklama va homiylikka asoslanadi. Ssenariylar shunga moslab qayta hisoblangan.
2. **Ma’lumot lokalizatsiyasi:** fuqarolarning shaxsiy ma’lumotlari O‘zbekistondagi serverlarda saqlanishi shart (27-1-modda). Hosting tanlovi va AI provayderga matn yuborish shunga bog‘liq.
3. **Reklama o‘zbek tilida bo‘lishi shart** (2022-yilgi qonun).
4. **Imlo bozorida kuchli raqib bor** (Tahrirchi). Phase 1 da AI'siz, lug‘atga asoslangan imlo; AI'ga sarmoya validatsiyadan keyin.
5. **Narx taqqoslashda raqib bor** (Savat ilovasi). Web va SEO orqali, kichik va aniq katalog bilan boshlanadi.
6. **Soliq parametrlari:** asosiy stavkalar 2026 uchun manbalarda bir xil (JShDS, QQS, ijtimoiy soliq 12%), lekin INPS stavkasi bo‘yicha manbalar ziddiyatli. Buxgalter tasdig‘isiz hisoblash ishga tushmaydi.
7. **To‘lov provayderlarida takroriy to‘lov** rasmiy hujjat bilan tasdiqlanmagan. Zaxira varianti — oldindan to‘lov modeli.

## Tavsiya etilgan boshlanish tartibi

Valyuta + biznes kalkulyatorlari + oddiy imlo (AI'siz) → kichik narx katalogi. Birinchi daromad gipotezasi — Business tarifi (kichik biznes va buxgalterlar).

## Keyingi qadamlar

[09-hujjat](09_ROADMAP_IMPLEMENTATSIYA.md) dagi Phase 0 qolgan vazifalari: yurist, buxgalter, hosting taklifi, to‘lov provayderlari hujjati, intervyular. Shundan keyin Phase 1 kodlashni boshlash mumkin.

## Manbalar

- CBU kurslari JSON: https://cbu.uz/uz/arkhiv-kursov-valyut/json/
- AdSense qo‘llanadigan tillar: https://support.google.com/publisherpolicies/answer/10436912
- Reklama qonunidagi til talabi: https://lex.uz/uz/explanation/1637
- Ma’lumot lokalizatsiyasi: https://kun.uz/en/news/2021/07/03/if-they-want-to-work-in-uzbekistan-they-should-respect-our-laws-responsible-persons-about-changes-in-the-law-on-personal-data , https://mondaq.com/data-protection/1197754/the-law-on-personal-data-has-been-amended
- 2026 soliq stavkalari: https://kun.uz/en/news/2025/11/26/uzbekistan-plans-to-keep-core-tax-rates-unchanged-in-2026 , https://www.ey.com/en_uz/technical/tax-alerts/2026/01/uzbekistan-tax-updates-2026 , https://taxsummaries.pwc.com/republic-of-uzbekistan/individual/taxes-on-personal-income
- MIRT va BHM 2026: https://yep.uz/en/2026/06/salaries-pensions-benefits-uzbekistan-increase-2026/ , https://wageindicator.org/ai/work/minimum-wage/updates/2026/minimum-wage-updated-in-uzbekistan-from-01-september-2026-september-03-2026/
- Tahrirchi: https://www.spot.uz/oz/2023/06/29/tahrirchi/ , https://www.extscope.org/extension/pkagojnmikckmbhldmdeadklmndfofjh
- Imlo WordPress plagini (imlo.insof.uz API): https://af.wordpress.org/plugins/imlo/
- Bank kurslari taqqoslash: https://depozit.uz/uz/exchange-rate-bank
- Savat ilovasi: https://apps.apple.com/app/id6744843065
- Uzum sotuvchi komissiyalari (2024): https://www.spot.uz/oz/2024/04/17/uzum-market/
- O‘zbek to‘lov provayderlari SDK (community): https://pypi.org/project/tolov/
