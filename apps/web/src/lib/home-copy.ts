import type { LocaleCode } from './i18n';

export interface HomeCopy {
  eyebrow: string;
  titleA: string;
  titleB: string;
  lede: string;
  tryLive: string;
  perks: [string, string, string];
  navStores: string;
  navApp: string;
  navVto: string;
  navBalance: string;
  liveBadge: string;
  mirrorCaption: string;
  stepsTitle: string;
  steps: [{ title: string; body: string }, { title: string; body: string }, { title: string; body: string }];
  shopTitle: string;
  shopBody: string;
  shopCta: string;
  appTitle: string;
  appBody: string;
  appCta: string;
}

// Home page copy for A12's main markets; other locales read the English text
const HOME_COPY: Partial<Record<LocaleCode, HomeCopy>> = {
  uz: {
    eyebrow: 'Jonli virtual kiyinish xonasi',
    titleA: 'Sotib olishdan oldin',
    titleB: 'o‘zingizda ko‘ring',
    lede: 'A12 kamerangizni jonli ko‘zguga aylantiradi. Istalgan do‘kondagi kiyimni tanlang va u sizga qanday yarashishini shu zahoti ko‘ring.',
    tryLive: 'Hozir sinab ko‘rish',
    perks: ['Bepul sinov', 'Ro‘yxatdan o‘tmasdan', 'Chrome va telefonda'],
    navStores: 'Do‘konlar uchun',
    navApp: 'Mobil ilova',
    navVto: 'Virtual kiyib ko‘rish',
    navBalance: 'Soniya sotib olish',
    liveBadge: 'Jonli',
    mirrorCaption: 'Kiyim gavdangizni kuzatadi',
    stepsTitle: 'Uch qadam — va kiyim sizda',
    steps: [
      { title: 'Kiyimni tanlang', body: 'Do‘kondagi rasmni torting yoki o‘zingiz yuklang.' },
      { title: 'Kamerani yoqing', body: 'Bir qadam orqaga turing, gavdangiz kadrga tushsin.' },
      { title: 'Jonli ko‘ring', body: 'Kiyim harakatingizga moslashib, real vaqtda ustingizda turadi.' },
    ],
    shopTitle: 'Onlayn do‘koningiz bormi?',
    shopBody: 'Saytingizga “Kiyib ko‘rish” tugmasini qo‘shing: xaridorlar kiyimni oldindan o‘zida ko‘radi va ishonch bilan buyurtma qiladi.',
    shopCta: 'Do‘konlar uchun',
    appTitle: 'Telefoningizda ham',
    appBody: 'A12 ilovasida kiyimlar, xona jihozlari va saqlangan obrazlaringiz bir joyda.',
    appCta: 'Mobil ilova',
  },
  ru: {
    eyebrow: 'Живая виртуальная примерочная',
    titleA: 'Примерьте на себе —',
    titleB: 'ещё до покупки',
    lede: 'A12 превращает камеру в живое зеркало. Выберите вещь в любом магазине и сразу увидите, как она на вас смотрится.',
    tryLive: 'Попробовать сейчас',
    perks: ['Бесплатная проба', 'Без регистрации', 'В Chrome и на телефоне'],
    navStores: 'Для магазинов',
    navApp: 'Приложение',
    navVto: 'Виртуальная примерка',
    navBalance: 'Купить секунды',
    liveBadge: 'Live',
    mirrorCaption: 'Вещь следует за вашим телом',
    stepsTitle: 'Три шага — и вещь на вас',
    steps: [
      { title: 'Выберите вещь', body: 'Перетащите фото из магазина или загрузите своё.' },
      { title: 'Включите камеру', body: 'Отойдите на шаг, чтобы оказаться в кадре.' },
      { title: 'Смотрите вживую', body: 'Вещь сидит на вас и следует за движениями в реальном времени.' },
    ],
    shopTitle: 'У вас интернет-магазин?',
    shopBody: 'Добавьте на сайт кнопку «Примерить»: покупатели увидят вещь на себе и закажут увереннее.',
    shopCta: 'Для магазинов',
    appTitle: 'И на телефоне',
    appBody: 'В приложении A12 одежда, вещи для дома и сохранённые образы — в одном месте.',
    appCta: 'Мобильное приложение',
  },
  en: {
    eyebrow: 'A live fitting room in your browser',
    titleA: 'See it on you',
    titleB: 'before you buy',
    lede: 'A12 turns your camera into a live mirror. Pick a piece from any shop and see how it looks on you, right away.',
    tryLive: 'Try it now',
    perks: ['Free to try', 'No sign-up', 'Chrome and mobile'],
    navStores: 'For stores',
    navApp: 'Mobile app',
    navVto: 'Virtual try-on',
    navBalance: 'Buy seconds',
    liveBadge: 'Live',
    mirrorCaption: 'The garment tracks your body',
    stepsTitle: 'Three steps to the fit',
    steps: [
      { title: 'Pick a piece', body: 'Drag a photo from any shop, or upload your own.' },
      { title: 'Turn on the camera', body: 'Step back so your upper body is in frame.' },
      { title: 'See it live', body: 'The garment stays on you and follows your moves in real time.' },
    ],
    shopTitle: 'Run an online store?',
    shopBody: 'Add a “Try it on” button to your site so shoppers see the piece on themselves and order with confidence.',
    shopCta: 'For stores',
    appTitle: 'On your phone, too',
    appBody: 'The A12 app keeps garments, home décor and your saved looks in one place.',
    appCta: 'Mobile app',
  },
};

export function homeCopy(locale: LocaleCode): HomeCopy {
  return HOME_COPY[locale] ?? (HOME_COPY.en as HomeCopy);
}
