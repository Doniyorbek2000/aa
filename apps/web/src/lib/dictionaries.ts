import type { Locale } from './locale';
import type { ModuleSlug } from './modules';

interface ModuleCopy {
  title: string;
  short: string;
  description: string;
  tools: string[];
}

const uz = {
  meta: {
    title: 'A12 — imlo, valyuta, kalkulyator va narxlar',
    description:
      'O‘zbekcha imlo tekshirish, Markaziy bank kurslari, ish haqi va QQS kalkulyatorlari, do‘konlardagi narxlarni taqqoslash — bitta joyda.',
  },
  a11y: {
    skip: 'Asosiy kontentga o‘tish',
    mainNav: 'Asosiy navigatsiya',
    mobileNav: 'Bo‘limlar',
    language: 'Til',
    theme: { system: 'Mavzu: tizim', light: 'Mavzu: yorug‘', dark: 'Mavzu: qorong‘i' },
  },
  nav: { home: 'Bosh sahifa' },
  status: { soon: 'Tez orada', inProgress: 'Ishlab chiqilmoqda' },
  home: {
    eyebrow: 'Bitta akkaunt · to‘rtta vosita',
    title: 'Hisob-kitob, kurs, imlo va narx — bir joyda.',
    lead: 'Har kuni kerak bo‘ladigan vositalar: manbasi va yangilangan vaqti har doim ko‘rinadi, reklama esa doim belgilangan.',
    modulesHeading: 'Bo‘limlar',
    principlesHeading: 'Biz nimaga amal qilamiz',
    principles: [
      { title: 'Manba ochiq', text: 'Har bir kurs va hisob ostida manba hamda yangilangan vaqt yoziladi.' },
      { title: 'Rasmiy ≠ bank kursi', text: 'Markaziy bank kursi bank savdo kursi bilan aralashtirilmaydi.' },
      { title: 'Reklama belgilanadi', text: 'Homiylik takliflari tartiblashga ta’sir qilmaydi va alohida ko‘rsatiladi.' },
    ],
  },
  modulePage: {
    planned: 'Rejadagi vositalar',
    notice: 'Bu bo‘lim hozir ishlab chiqilmoqda. Quyidagi vositalar birinchi navbatda ishga tushadi.',
    back: 'Bosh sahifaga qaytish',
  },
  footer: {
    disclaimer: 'Hisob-kitoblar ma’lumot uchun. Rasmiy soliq yoki moliyaviy maslahat emas.',
    rights: 'Barcha huquqlar himoyalangan.',
  },
  modules: {
    imlo: {
      title: 'AI Imlo',
      short: 'Imlo',
      description: 'O‘zbek tilida imlo tekshirish va lotin–kirill o‘girish.',
      tools: ['Imlo tekshirish (lotin)', 'Lotin ↔ kirill o‘girish', 'So‘z va belgi sanash'],
    },
    valyuta: {
      title: 'Valyuta',
      short: 'Valyuta',
      description: 'Markaziy bank rasmiy kurslari, konvertor va tarixiy grafik.',
      tools: ['Valyuta konvertori', 'Rasmiy kurslar jadvali', 'Tarixiy kurs grafigi'],
    },
    kalkulyator: {
      title: 'Biznes kalkulyatorlari',
      short: 'Kalkulyator',
      description: 'Ish haqi, QQS, ustama, foyda va kredit hisob-kitoblari.',
      tools: ['Ish haqi kalkulyatori', 'QQS kalkulyatori', 'Kredit jadvali'],
    },
    narxlar: {
      title: 'Narx taqqoslash',
      short: 'Narxlar',
      description: 'Do‘konlardagi narxlarni solishtirish va narx tarixi.',
      tools: ['Mahsulot qidiruvi', 'Do‘konlar bo‘yicha narxlar', 'Narx tarixi'],
    },
  } satisfies Record<ModuleSlug, ModuleCopy>,
};

export type Dictionary = typeof uz;

const ru: Dictionary = {
  meta: {
    title: 'A12 — орфография, валюта, калькуляторы и цены',
    description:
      'Проверка орфографии узбекского языка, курсы Центробанка, калькуляторы зарплаты и НДС, сравнение цен в магазинах — в одном месте.',
  },
  a11y: {
    skip: 'Перейти к основному содержимому',
    mainNav: 'Основная навигация',
    mobileNav: 'Разделы',
    language: 'Язык',
    theme: { system: 'Тема: системная', light: 'Тема: светлая', dark: 'Тема: тёмная' },
  },
  nav: { home: 'Главная' },
  status: { soon: 'Скоро', inProgress: 'В разработке' },
  home: {
    eyebrow: 'Один аккаунт · четыре инструмента',
    title: 'Расчёты, курсы, орфография и цены — в одном месте.',
    lead: 'Инструменты на каждый день: источник и время обновления всегда на виду, реклама всегда помечена.',
    modulesHeading: 'Разделы',
    principlesHeading: 'Наши принципы',
    principles: [
      { title: 'Открытый источник', text: 'Под каждым курсом и расчётом указаны источник и время обновления.' },
      { title: 'Официальный ≠ банковский', text: 'Курс Центробанка не смешивается с курсами покупки и продажи банков.' },
      { title: 'Реклама помечена', text: 'Спонсорские предложения не влияют на сортировку и показаны отдельно.' },
    ],
  },
  modulePage: {
    planned: 'Запланированные инструменты',
    notice: 'Раздел сейчас в разработке. Эти инструменты появятся первыми.',
    back: 'Вернуться на главную',
  },
  footer: {
    disclaimer: 'Расчёты носят информационный характер и не являются налоговой или финансовой консультацией.',
    rights: 'Все права защищены.',
  },
  modules: {
    imlo: {
      title: 'AI Орфография',
      short: 'Орфография',
      description: 'Проверка орфографии узбекского языка и транслитерация латиница–кириллица.',
      tools: ['Проверка орфографии (латиница)', 'Латиница ↔ кириллица', 'Подсчёт слов и символов'],
    },
    valyuta: {
      title: 'Валюта',
      short: 'Валюта',
      description: 'Официальные курсы Центробанка, конвертер и исторический график.',
      tools: ['Конвертер валют', 'Таблица официальных курсов', 'График истории курса'],
    },
    kalkulyator: {
      title: 'Бизнес-калькуляторы',
      short: 'Калькуляторы',
      description: 'Зарплата, НДС, наценка, прибыль и кредит.',
      tools: ['Калькулятор зарплаты', 'Калькулятор НДС', 'График платежей по кредиту'],
    },
    narxlar: {
      title: 'Сравнение цен',
      short: 'Цены',
      description: 'Сравнение цен в магазинах и история цен.',
      tools: ['Поиск товаров', 'Цены по магазинам', 'История цен'],
    },
  },
};

export const DICTIONARIES: Record<Locale, Dictionary> = { uz, ru };
