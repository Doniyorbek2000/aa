import type { SupportedLocale } from '@webpul/shared-core';

export interface Dictionary {
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  tabs: {
    studio: string;
    mobile: string;
    extension: string;
    architecture: string;
  };
  studio: {
    liveCamera: string;
    aiModelFeed: string;
    startWebcam: string;
    stopWebcam: string;
    posePresetWalk: string;
    posePresetTurn: string;
    posePresetInteractive: string;
    importUrlPlaceholder: string;
    importBtn: string;
    uploadGarmentBtn: string;
    dropHint: string;
    wardrobeTitle: string;
    savedLooksTitle: string;
    noSavedLooks: string;
    physicsControls: string;
    windLabel: string;
    lightingLabel: string;
    splitCompareLabel: string;
    fitScaleLabel: string;
    skeletonToggle: string;
    framingGuideToggle: string;
    mirrorToggle: string;
    capturePhoto: string;
    recordVideo: string;
    stopRecording: string;
    categories: {
      all: string;
      outerwear: string;
      tops: string;
      dresses: string;
      streetwear: string;
      formal: string;
      custom: string;
    };
  };
  mobile: {
    title: string;
    subtitle: string;
    iosLabel: string;
    androidLabel: string;
    deepLinkTitle: string;
    deepLinkDesc: string;
    nativeFeaturesTitle: string;
  };
  extension: {
    title: string;
    subtitle: string;
    merchantTitle: string;
    merchantSubtitle: string;
    tryOnButton: string;
    dragHint: string;
  };
  architecture: {
    title: string;
    subtitle: string;
  };
}

export const DICTIONARIES: Record<SupportedLocale, Dictionary> = {
  uz: {
    tagline: 'A12 Lucy V-TON • 30 FPS Real-Vaqtda AI Virtual Kiyib Ko‘rish Platformasi',
    heroTitle: 'Har qanday kiyimni jonli kamerada real vaqtda kiyib ko‘ring',
    heroSubtitle:
      'anywear.decart.ai arxitekturasi asosida: statik rasm kutishsiz, 30 FPS video tezligida mato fizikasi, universal URL/rasm tortib tashlash (Drag & Drop), Web + iOS + Android ekotizimi.',
    tabs: {
      studio: 'Jonli AI Studiya (Live Mirror)',
      mobile: 'Mobil Ilova (iOS va Android)',
      extension: 'Brauzer Kengaytmasi va E-Commerce SDK',
      architecture: 'Professional Tizim Arxitekturasi',
    },
    studio: {
      liveCamera: 'Jonli Veb-Kamera',
      aiModelFeed: '30 FPS AI Model Oqimi',
      startWebcam: 'Jonli Kamerani Yoqish',
      stopWebcam: 'AI Modelga Qaytish',
      posePresetWalk: 'Podium Yurishi',
      posePresetTurn: '360° Aylanish & Mato Drapi',
      posePresetInteractive: 'Kursor bilan Tana Boshqaruvi',
      importUrlPlaceholder: 'Istalgan do‘kon havolasini tashlang (Zara, Uzum, ASOS, Farfetch...)',
      importBtn: 'AI Kiyib Ko‘rish',
      uploadGarmentBtn: 'Kiyim Rasmini Yuklash',
      dropHint: 'Yoki istalgan kiyim rasmini to‘g‘ridan-to‘g‘ri oyna ustiga tortib tashlang (Drag & Drop)',
      wardrobeTitle: 'Raqamli Garderob (1-Bosishda Almashtirish)',
      savedLooksTitle: 'Saqlangan Obrazlar (Lookbook)',
      noSavedLooks: 'Hozircha obraz saqlanmagan. "Suratga olish" tugmasini bosing.',
      physicsControls: 'Lucy V-TON Neyron va Mato Fizikasi',
      windLabel: 'Shamol va Mato Tebranishi',
      lightingLabel: 'Yorug‘lik Moslashuvi (Relighting)',
      splitCompareLabel: 'Oldin / Keyin (Split-Screen Taqqoslash)',
      fitScaleLabel: 'O‘lcham (Slim ↔ Oversize)',
      skeletonToggle: '17-Nuqtali Tana Skeyleti',
      framingGuideToggle: 'Kadr Chegarasi',
      mirrorToggle: 'Ko‘zgu Rejimi',
      capturePhoto: 'Obrazni Saqlash',
      recordVideo: 'Video Yozish',
      stopRecording: 'Videoni To‘xtatish',
      categories: {
        all: 'Barchasi',
        outerwear: 'Ustki Kiyim',
        tops: 'Futbolka & Polo',
        dresses: 'Ko‘ylaklar',
        streetwear: 'Streetwear',
        formal: 'Klassik',
        custom: 'Yuklanganlar',
      },
    },
    mobile: {
      title: 'A12 Anywear Mobile — iOS (Swift/ARKit) & Android (Kotlin/ARCore + React Native)',
      subtitle:
        'Bir xil @webpul/shared-core yadrosi ustida ishlovchi, past kechikishli (38ms) WebRTC + VisionCamera mobil ilovasi. Quyidagi interaktiv simulyatorda iOS va Android versiyalarini sinab ko‘ring.',
      iosLabel: 'iPhone 16 Pro (iOS • CoreML NPU)',
      androidLabel: 'Pixel 9 Pro (Android • NNAPI)',
      deepLinkTitle: 'Kross-Platforma Sinxronizatsiya (Web ↔ Mobile Handoff)',
      deepLinkDesc:
        'Veb-studiyada tanlangan kiyim va sessiya holati darhol iOS va Android ilovasiga uzatiladi.',
      nativeFeaturesTitle: 'Mobil Arxitektura Imkoniyatlari',
    },
    extension: {
      title: 'Universal Chrome/Edge Kengaytmasi & Do‘konlar uchun 1-Qatorli Widget',
      subtitle:
        'Har qanday onlayn do‘kondan kiyim rasmini sichqoncha bilan tortib (Drag & Drop) jonli oynaga tashlang yoki o‘z internet-do‘koningizga "Jonli Kiyib Ko‘rish" tugmasini 1 daqiqada o‘rnating.',
      merchantTitle: 'Jonli E-Commerce Do‘kon Simulyatori',
      merchantSubtitle:
        'Quyidagi mahsulot kartalarini kengaytma oynasiga tortib tashlang yoki "Try On Live" tugmasini bosing:',
      tryOnButton: 'A12 Jonli Kiyib Ko‘rish',
      dragHint: 'Kiyimni sudrab o‘ngdagi AI oynaga tashlang →',
    },
    architecture: {
      title: 'A12 Anywear — Enterprise Tizim va AI Neyron Arxitekturasi',
      subtitle:
        'anywear.decart.ai darajasidagi 30 FPS real-vaqt video generatsiyasi, WebRTC striming, kross-platforma monorepo va GPU klaster infratuzilmasi.',
    },
  },
  en: {
    tagline: 'A12 Lucy V-TON • 30 FPS Real-Time AI Video Virtual Try-On Platform',
    heroTitle: 'Try on any outfit from anywhere in real-time video',
    heroSubtitle:
      'Engineered like anywear.decart.ai: zero static render queues, 30 FPS real-time cloth physics, universal URL & Drag-and-Drop import, unified across Web, iOS, and Android.',
    tabs: {
      studio: 'Live AI Studio (Mirror)',
      mobile: 'Mobile App (iOS & Android)',
      extension: 'Browser Extension & Merchant SDK',
      architecture: 'System Architecture',
    },
    studio: {
      liveCamera: 'Live Webcam',
      aiModelFeed: '30 FPS AI Model Stream',
      startWebcam: 'Enable Live Camera',
      stopWebcam: 'Switch to AI Model',
      posePresetWalk: 'Runway Walk',
      posePresetTurn: '360° Turn & Drape',
      posePresetInteractive: 'Interactive Cursor Pose',
      importUrlPlaceholder: 'Paste any store product URL (Zara, ASOS, Farfetch, Shopify...)',
      importBtn: 'Instant Try-On',
      uploadGarmentBtn: 'Upload Garment Photo',
      dropHint: 'Or drag & drop any clothing image from any website directly onto the mirror',
      wardrobeTitle: 'Digital Wardrobe (Zero-Latency Swap)',
      savedLooksTitle: 'Saved Looks & Captures',
      noSavedLooks: 'No saved looks yet. Click "Capture Look" to save a snapshot.',
      physicsControls: 'Lucy V-TON Neural & Cloth Physics',
      windLabel: 'Wind & Fabric Flow',
      lightingLabel: 'Scene Relighting Harmony',
      splitCompareLabel: 'Before / After Split Wipe',
      fitScaleLabel: 'Fit Scale (Slim ↔ Oversized)',
      skeletonToggle: '17-Point Pose Skeleton',
      framingGuideToggle: 'Framing Guide',
      mirrorToggle: 'Mirror Mode',
      capturePhoto: 'Capture Look',
      recordVideo: 'Record Clip',
      stopRecording: 'Stop Recording',
      categories: {
        all: 'All Items',
        outerwear: 'Outerwear',
        tops: 'Tops & Knit',
        dresses: 'Dresses',
        streetwear: 'Streetwear',
        formal: 'Tailored',
        custom: 'Imported',
      },
    },
    mobile: {
      title: 'A12 Anywear Mobile — Native iOS & Android Experience',
      subtitle:
        'Powered by @webpul/shared-core, React Native, VisionCamera, and 38ms WebRTC streaming. Test both iOS and Android interactive simulators below.',
      iosLabel: 'iPhone 16 Pro (iOS • CoreML NPU)',
      androidLabel: 'Pixel 9 Pro (Android • NNAPI)',
      deepLinkTitle: 'Cross-Platform Handoff (Web ↔ iOS / Android)',
      deepLinkDesc:
        'Instantly continue your active web try-on session on your phone via deep-link synchronization.',
      nativeFeaturesTitle: 'Native Mobile Capabilities',
    },
    extension: {
      title: 'Universal Browser Extension & 1-Line E-Commerce Merchant SDK',
      subtitle:
        'Drag and drop garments from any online store into the floating mirror, or embed real-time video try-on into Shopify/custom stores with a single script tag.',
      merchantTitle: 'Interactive E-Commerce Store Sandbox',
      merchantSubtitle:
        'Drag any product below into the floating extension HUD or click "Try On Live":',
      tryOnButton: 'Try On Live with A12',
      dragHint: 'Drag product card into the floating mirror →',
    },
    architecture: {
      title: 'A12 Anywear — Production System & Neural Pipeline Architecture',
      subtitle:
        'End-to-end engineering blueprint for 30 FPS diffusion-forcing video try-on across Web, iOS, Android, and Edge GPU nodes.',
    },
  },
  ru: {
    tagline: 'A12 Lucy V-TON • ИИ-примерочная в реальном времени (30 FPS видео)',
    heroTitle: 'Примеряйте любую одежду на живом видео в реальном времени',
    heroSubtitle:
      'Полноценный аналог anywear.decart.ai: 30 кадров/с, реальная физика ткани в движении, импорт по ссылке или Drag & Drop, единая архитектура для Web, iOS и Android.',
    tabs: {
      studio: 'Живая ИИ-Студия',
      mobile: 'Мобильное Приложение (iOS / Android)',
      extension: 'Расширение и Виджет для Магазинов',
      architecture: 'Архитектура Системы',
    },
    studio: {
      liveCamera: 'Веб-камера',
      aiModelFeed: '30 FPS ИИ-Модель',
      startWebcam: 'Включить веб-камеру',
      stopWebcam: 'Вернуть ИИ-модель',
      posePresetWalk: 'Подиумный шаг',
      posePresetTurn: 'Поворот 360° и драпировка',
      posePresetInteractive: 'Управление позой курсором',
      importUrlPlaceholder: 'Вставьте ссылку на товар (Zara, ASOS, Farfetch, Uzum...)',
      importBtn: 'Примерить',
      uploadGarmentBtn: 'Загрузить фото вещи',
      dropHint: 'Или перетащите любое фото одежды прямо на экран зеркала (Drag & Drop)',
      wardrobeTitle: 'Цифровой Гардероб (Мгновенная смена)',
      savedLooksTitle: 'Сохраненные образы',
      noSavedLooks: 'Пока нет сохраненных образов. Нажмите «Сделать снимок».',
      physicsControls: 'Физика ткани и нейросети Lucy V-TON',
      windLabel: 'Ветер и динамика ткани',
      lightingLabel: 'Адаптация освещения',
      splitCompareLabel: 'До / После (Разделитель)',
      fitScaleLabel: 'Посадка (Slim ↔ Oversize)',
      skeletonToggle: '17 точек скелета',
      framingGuideToggle: 'Рамка кадра',
      mirrorToggle: 'Зеркально',
      capturePhoto: 'Сделать снимок',
      recordVideo: 'Записать видео',
      stopRecording: 'Остановить запись',
      categories: {
        all: 'Все',
        outerwear: 'Верхняя одежда',
        tops: 'Топы и трикотаж',
        dresses: 'Платья',
        streetwear: 'Стритвир',
        formal: 'Костюмы',
        custom: 'Импорт',
      },
    },
    mobile: {
      title: 'A12 Anywear Mobile — Нативное приложение для iOS и Android',
      subtitle:
        'Единое ядро @webpul/shared-core, React Native, VisionCamera и поток WebRTC с задержкой 38 мс. Протестируйте симулятор iOS и Android ниже.',
      iosLabel: 'iPhone 16 Pro (iOS • CoreML NPU)',
      androidLabel: 'Pixel 9 Pro (Android • NNAPI)',
      deepLinkTitle: 'Кроссплатформенная синхронизация (Web ↔ Mobile)',
      deepLinkDesc:
        'Мгновенно продолжайте примерку со смартфона через единую сессию.',
      nativeFeaturesTitle: 'Возможности мобильной архитектуры',
    },
    extension: {
      title: 'Браузерное расширение и SDK для интернет-магазинов',
      subtitle:
        'Перетаскивайте товары с любых сайтов в плавающее зеркало или встройте живую примерку в свой магазин одной строкой кода.',
      merchantTitle: 'Интерактивный демо-магазин',
      merchantSubtitle:
        'Перетащите карточку товара в окно расширения или нажмите «Живая примерка A12»:',
      tryOnButton: 'Живая примерка A12',
      dragHint: 'Перетащите карточку в зеркало справа →',
    },
    architecture: {
      title: 'A12 Anywear — Профессиональная архитектура системы',
      subtitle:
        'Полная схема 30 FPS видео-генерации Lucy V-TON, WebRTC стриминга и кроссплатформенного монорепозитория.',
    },
  },
};

