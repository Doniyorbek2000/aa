# 07 — SEO, UX/UI dizayn tizimi va analitika (KPI)

> Qamrab oladi: SEO_STRATEGY, UX_UI_DESIGN_SYSTEM, ANALYTICS_KPI.

## 1. SEO strategiyasi

### 1.1 Tamoyil

Har bir sahifa haqiqiy vazifani bajaradi. Shablon asosida minglab bir xil sahifa yaratilmaydi: Google ommaviy, qiymati past avtomatik sahifalarni spam deb hisoblashi mumkin. Har bir landing sahifada ishlaydigan vosita, tushuntirish, formula/manba va FAQ bo‘ladi.

### 1.2 URL tuzilishi

```
/{locale}/                                 bosh sahifa
/{locale}/imlo                             imlo tekshirish
/{locale}/imlo/lotin-kirill                transliteratsiya
/{locale}/valyuta                          kurslar jadvali
/{locale}/valyuta/usd-uzs                  juftlik sahifasi (faqat asosiy 10–15 juftlik)
/{locale}/valyuta/banklar                  bank kurslari
/{locale}/kalkulyator/ish-haqi             har bir kalkulyator — alohida sahifa
/{locale}/kalkulyator/qqs
/{locale}/narxlar/{kategoriya}
/{locale}/narxlar/{kategoriya}/{mahsulot-slug}
```

`locale`: `uz` (asosiy), `uz-cyrl`, `ru`, `en`. Har bir til uchun haqiqiy tarjima bo‘lgandagina sahifa indekslanadi.

Valyuta juftliklari: 74 × 74 kombinatsiya **yaratilmaydi**. Faqat qidiruv hajmi tasdiqlangan juftliklar (USD, EUR, RUB, KZT, CNY, GBP, TRY… ↔ UZS) [FARAZ — kalit so‘z tadqiqoti bilan tasdiqlash].

### 1.3 Texnik SEO

| Element | Talab |
|---|---|
| Rendering | Kalkulyator va valyuta sahifalari — SSG + ISR (masalan, 15 daqiqa); mahsulot sahifalari — ISR; shaxsiy sahifalar — `noindex` |
| Metadata | Har sahifada noyob `title` (≤ 60 belgi) va `description` (≤ 155 belgi) |
| Canonical | Har sahifada; query parametrli variantlar canonical asosiy URL'ga |
| hreflang | `uz`, `uz-Cyrl`, `ru`, `en`, `x-default` |
| Sitemap | Til bo‘yicha alohida sitemap; `lastmod` haqiqiy o‘zgarish sanasi |
| robots.txt | `/go/`, `/v1/`, kabinet sahifalari yopiq |
| Structured data | `WebApplication` (vositalar), `FAQPage` (Google qoidalariga mos bo‘lsa), `Product` + `AggregateOffer` (narxlar — faqat haqiqiy, yangilangan takliflar bilan), `BreadcrumbList` |
| Core Web Vitals | LCP < 2,5 s, INP < 200 ms, CLS < 0,1 (mobil, 75-persentil) |
| Reklama joylari | Oldindan band qilingan o‘lcham (CLS'ga ta’sir qilmasligi uchun) |
| Search Console | Har bir til uchun domen mulki, sitemap yuborish |
| Chiqish havolalari | Affiliate/homiylik havolalari `rel="sponsored nofollow"` |

### 1.4 Kontent rejasi (P1)

| Sahifa | Kontent |
|---|---|
| Ish haqi kalkulyatori | Vosita + "qanday hisoblanadi" (formula, stavkalar, manba, sana) + misollar + FAQ |
| QQS kalkulyatori | Xuddi shunday |
| Dollar kursi | Jadval, grafik, CBU va bank kursi farqi tushuntirishi |
| Imlo tekshirish | Vosita + eng ko‘p uchraydigan 20 xato bo‘yicha qo‘llanma |
| Lotin–kirill | Vosita + transliteratsiya qoidalari |

Kontent mutaxassis tomonidan yoziladi yoki tekshiriladi. AI yordamida yozilgan matn ham faktlar bo‘yicha tekshiriladi.

### 1.5 Backlink va tarqatish
- Bepul vidjetlar (kurs, kalkulyator) — sayt egalari joylashtiradi, "Manba: …" havolasi bilan.
- Telegram kanallar va buxgalteriya hamjamiyatlari.
- Ma’lumotga asoslangan maqolalar (masalan, "Oylik kurs sharhi") — yangiliklar saytlari uchun manba.

## 2. UX/UI dizayn tizimi

### 2.1 Tamoyillar
1. **Vosita birinchi.** Har bir sahifada asosiy vosita birinchi ekranda; reklama uni to‘smaydi va surmaydi.
2. **Natija darhol.** Kalkulyator yozish paytida hisoblaydi (brauzerda, `packages/calc`).
3. **Ishonch signallari.** Manba, yangilangan vaqt, "rasmiy kurs / bank kursi" yorlig‘i, "Homiylik" yorlig‘i.
4. **Professional, minimal.** Bolalarcha illyustratsiyalar yo‘q. Bitta ikonka to‘plami (masalan, Lucide).
5. **Mobil-birinchi.** Asosiy foydalanish telefondan [FARAZ — analitika bilan tasdiqlash].

### 2.2 Tokenlar

| Token | Qiymat (boshlang‘ich) |
|---|---|
| Shrift | Inter (lotin + kirill qo‘llab-quvvatlaydi); raqamlar uchun `tabular-nums` |
| Tipografiya shkalasi | 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 px |
| Bo‘shliq | 4 px qadam (4, 8, 12, 16, 24, 32, 48, 64) |
| Radius | 6 (input), 10 (karta), 9999 (badge) |
| Ranglar | Neytral (slate) asos; bitta asosiy rang (brend); semantik: success, warning, danger, info; "sponsored" uchun alohida neytral-sariq fon |
| Mavzular | Yorug‘ va qorong‘i — CSS o‘zgaruvchilari orqali |
| Kontrast | Matn ≥ 4.5:1, katta matn va UI elementlar ≥ 3:1 (WCAG 2.2 AA) |

Modul ranglari (faqat aksent, navigatsiyada): Imlo — binafsha, Valyuta — yashil, Biznes — ko‘k, Narxlar — to‘q sariq [FARAZ].

### 2.3 Asosiy komponentlar
`Button, Input, NumberInput (minglik ajratgich bilan, so‘m formati), Select, Combobox (valyuta tanlash), Tabs, Card, Table (saralash, mobil uchun karta ko‘rinishi), Chart (chiziqli grafik), Badge (Rasmiy / Bank / Homiylik / Eskirgan), Alert, Toast, Dialog, Skeleton, EmptyState, ErrorState, Paywall (pullik imkoniyat tushuntirishi)`.

Raqam formati: `12 055,90 so‘m` (o‘zbek), `12 055,90 сум` (rus) — `Intl.NumberFormat` bilan.

### 2.4 Holatlar
Har bir vosita uchun: yuklanmoqda (skeleton), bo‘sh, xato (nima bo‘ldi + nima qilish kerak), eskirgan ma’lumot (oxirgi qiymat + sana), limit tugadi (paywall, bepul alternativa bilan).

### 2.5 Navigatsiya
- Yuqori panel: logo, 4 modul, universal qidiruv, til, mavzu, kirish/profil.
- Mobil: pastki tab bar (4 modul + profil).
- Bosh sahifa: 4 ta modul kartasi, har birida bitta jonli mini-vosita (masalan, USD kursi + mini konvertor, ish haqi tezkor hisob).

### 2.6 Accessibility
- Barcha boshqaruv elementlari klaviatura bilan ishlaydi, ko‘rinadigan focus.
- Formalarda `label`, xato xabarlari `aria-describedby` bilan.
- Grafiklar uchun matnli muqobil (jadval).
- `prefers-reduced-motion` hurmat qilinadi.

## 3. Analitika va KPI

### 3.1 North Star va asosiy ko‘rsatkichlar

**North Star [FARAZ]:** haftalik "foydali natija" soni — muvaffaqiyatli hisoblash, konvertatsiya, qabul qilingan imlo tuzatishi, do‘konga valid o‘tish.

| Bosqich | Ko‘rsatkich | Ta’rif |
|---|---|---|
| Acquisition | Organik sessiyalar, modul bo‘yicha | Search Console + analitika |
| Activation | Birinchi foydali natija ulushi | Sessiyada ≥ 1 natija |
| Retention | W1, W4 qaytish | Kohortalar |
| Registration | Ro‘yxatdan o‘tish konversiyasi | Ro‘yxatdan o‘tganlar / faol foydalanuvchilar |
| Revenue | Trial → paid, Free → paid, MRR, ARPPU | Billing |
| Churn | Oylik obuna churn | Billing |
| Unit economics | Yalpi marja manba bo‘yicha, AI xarajati / to‘lovchi | Ledger + ai_usage_events |
| Ma’lumot sifati | CBU import kechikishi, eskirgan takliflar %, moslashtirish xatolari | Ichki |
| Imlo sifati | Taklif qabul qilish darajasi, test korpusida precision/recall | Ichki |
| Narx | CTR (do‘konga o‘tish), valid click %, konversiya | clicks, conversions |

### 3.2 Voqealar (event) lug‘ati

| Voqea | Asosiy xususiyatlar |
|---|---|
| `tool_used` | module, tool, locale, is_logged_in |
| `result_produced` | module, tool |
| `spell_suggestion_decided` | type, source, accepted |
| `currency_converted` | from, to (summa yo‘q) |
| `calc_saved` / `calc_exported` | calculator, format |
| `offer_clicked` | offer_id, merchant_id, position, is_sponsored |
| `paywall_viewed` / `checkout_started` / `checkout_completed` | feature, plan |
| `signup_completed` | method |
| `alert_created` / `alert_triggered` | type |

Shaxsiy ma’lumot (email, matn, summa) voqealarga yozilmaydi.

### 3.3 Analitika vositasi
Self-hosted (masalan, PostHog yoki Plausible) O‘zbekistondagi serverda — lokalizatsiya talabi tufayli [TEKSHIR]. Google Analytics ishlatilsa — faqat anonim, cookie roziligi bilan va yurist xulosasidan keyin.

### 3.4 Dashboardlar
- **Kunlik:** trafik, natijalar, ro‘yxatdan o‘tishlar, to‘lovlar, xatolar, ma’lumot sog‘lig‘i.
- **Haftalik:** kohortlar, funnel (vosita → ro‘yxat → trial → to‘lov), AI xarajati.
- **Oylik:** MRR, churn, manba bo‘yicha marja, reconciliation natijalari.
