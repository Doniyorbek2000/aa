# A12 Anywear — Web Camera Preview and AI Try-On Prototype

![A12 Logo](./logo.png)

**A12 Anywear** — web-first virtual kiyib ko‘rish prototipi. Hozirgi web oqimi kamerani brauzerda ko‘rsatadi va kiyimni lokal canvas overlay sifatida joylaydi. Alohida Leffa AI amali kamera kadridan bitta surat yaratadi; bu 30 FPS video generatsiyasi emas. Mobil ilova va brauzer kengaytmasi papkalari hozircha prototip darajasida.

---

## Arxitektura va Monorepo Tuzilmasi

```text
webpul/
├── logo.png                          # Asosiy A12 brend logotipi
├── packages/
│   └── shared-core/                  # @webpul/shared-core (Web, iOS va Android uchun umumiy yadro)
│       └── src/index.ts              # Kiyim modellari, URL parser, 17-nuqtali poza va fizika tiplari
├── apps/
│   ├── web/                          # Next.js 16 + React 19 web kamera va AI demo
│   │   ├── public/logo-mark.png      # Shaffof A12 logotip belgisi
│   │   └── src/
│   │       ├── app/                  # Asosiy sahifa va /api/tryon REST endpointi
│   │       ├── components/           # Kamera preview va virtual try-on oynasi
│   │       └── lib/                  # UZ / EN / RU ko‘p tilli lug‘at va testlar
│   ├── mobile/                       # React Native / Expo prototipi; to‘liq UI va stream hali yo‘q
│   │   ├── app.json                  # iOS (ai.a12.anywear) va Android konfiguratsiyasi
│   │   ├── App.tsx                   # Mobil kamera, Share-Sheet URL qabul qiluvchi va Garderob
│   │   └── src/services/
│   │       └── webrtcLucyStream.ts   # WebSocket demo klienti; WebRTC video stream emas
│   └── extension/                    # Chrome extension prototipi
│       ├── manifest.json             # Manifest V3 konfiguratsiyasi
│       └── content-script.js         # Drag ma’lumotini belgilaydi; yakuniy widget oqimi hali ulanmagan
```

---

## Asosiy Imkoniyatlar

1. **Web kamera preview va AI surat**
   - `getUserMedia` haqiqiy kamerani ochadi; kamera ishlamasa demo video bilan almashtirilmaydi.
   - Lokal canvas preview kiyim rasmini tana ustiga taxminan joylaydi; bu pose modeli yoki generative AI биш.
   - `Leffa AI · Hugging Face` tugmasi bosilganda, foydalanuvchi tasdiqlashidan so‘ng kamera kadri va kiyim rasmi Hugging Face Space’ga yuboriladi. Natija bitta surat; live video emas.
   - Leffa хувцасны төрлийг дээд, доод, эсвэл бүтэн хувцас гэж сонгох боломжтой.

2. **Universal Havola (URL) va Drag & Drop Import**
   - Istalgan onlayn do‘kon (Zara, ASOS, Farfetch, Uzum Market, Shopify) mahsulot havolasini tashlang yoki kompyuterdan/saytdan kiyim rasmini oyna ustiga tortib tashlang (`Drag & Drop`).

3. **Mobil ilova prototipi**
   - `apps/mobile` içinde Expo konfiguratsiyasi va boshlang‘ich service kodlari bor; ishlaydigan native kamera UI hozircha yo‘q.

4. **Brauzer kengaytmasi prototipi**
   - `apps/extension` hozircha MV3 manifest va drag boshlanishini qayd qiluvchi content script bilan cheklangan; do‘konlarda to‘liq overlay oqimi ulanmagan.

## AI Model

- Tanlangan prototip: [Leffa](https://github.com/franciszzj/Leffa) va [Hugging Face Space](https://huggingface.co/spaces/franciszzj/Leffa).
- Hugging Face Space ZeroGPU’da navbat bilan ishlaydi; tezlik va kutish vaqti o‘zgarishi mumkin. Bitta AI natijasi jonli video emas.
- Model card MIT litsenziyasini ko‘rsatadi, ammo rasmiy demo model akademik datasetlarda o‘qitilganini aytadi. Tijoriy foydalanishdan oldin dataset va barcha qo‘shimcha qismlar litsenziyasini tekshir.

---

## Ishga Tushirish

```bash
# Tekshiruv va testlar
pnpm typecheck
pnpm test

# Veb-studiyani ishga tushirish (http://localhost:3000)
pnpm dev:web

# Production build
pnpm build:web
```
