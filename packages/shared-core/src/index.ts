/**
 * @webpul/shared-core
 * Cross-platform domain models, real-time AI Virtual Try-On (Lucy V-TON style) protocol,
 * garment catalog, pose tracking geometry, and i18n dictionary shared across:
 * - Web Studio (Next.js 16 / WebRTC / Canvas)
 * - Mobile App (iOS & Android — React Native / Expo / VisionCamera / WebRTC)
 * - Browser Extension & Merchant E-Commerce Widget
 */

export type SupportedLocale = 'uz' | 'en' | 'ru';

export type GarmentCategory =
  | 'all'
  | 'outerwear'
  | 'tops'
  | 'dresses'
  | 'streetwear'
  | 'formal'
  | 'custom';

export type FabricPhysicsPreset = 'silk' | 'denim' | 'wool' | 'cotton' | 'leather' | 'techwear';

export interface GarmentItem {
  id: string;
  name: Record<SupportedLocale, string>;
  brand: string;
  category: Exclude<GarmentCategory, 'all'>;
  price: string;
  sourceUrl: string;
  storeDomain: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fabric: FabricPhysicsPreset;
  drapeStiffness: number; // 0.1 (fluid silk) to 0.95 (structured leather)
  windResponse: number;   // 0.1 to 1.0
  silhouetteType: 'jacket' | 'hoodie' | 'tshirt' | 'dress' | 'blazer' | 'trench';
  badge?: string | undefined;
  isCustom?: boolean | undefined;
  customImageDataUrl?: string | undefined;
}

export interface PoseKeypoint {
  id:
    | 'nose'
    | 'left_shoulder'
    | 'right_shoulder'
    | 'left_elbow'
    | 'right_elbow'
    | 'left_wrist'
    | 'right_wrist'
    | 'left_hip'
    | 'right_hip'
    | 'neck'
    | 'chest_center';
  x: number; // Normalized 0..1
  y: number; // Normalized 0..1
  confidence: number; // 0..1
}

export interface StreamTelemetry {
  fps: number;
  latencyMs: number;
  neuralEngine: 'A12-Lucy-VTON-v2.4-FP8' | 'A12-Mobile-Edge-NPU';
  resolution: '1080x1920' | '1920x1080' | '1280x720';
  poseConfidence: number;
  drapePhysicsActive: boolean;
  lightingHarmonyScore: number;
}

export interface SavedLook {
  id: string;
  garmentId: string;
  garmentName: string;
  brand: string;
  timestamp: string;
  thumbnailDataUrl: string;
  platform: 'web' | 'ios' | 'android' | 'extension';
  notes?: string;
}

export interface TryOnSessionConfig {
  sessionId: string;
  userId?: string;
  platform: 'web' | 'ios' | 'android' | 'extension';
  cameraFacing: 'user' | 'environment';
  mirrorMode: boolean;
  showPoseSkeleton: boolean;
  showFramingGuide: boolean;
  splitComparisonRatio: number; // 0 to 100 (0 = full AI try-on, 50 = split, 100 = original)
  windIntensity: number; // 0 to 100
  lightingAdaptation: number; // 0 to 100
  fitScale: number; // 0.85 (slim) to 1.15 (oversized)
}

export const DEFAULT_GARMENT: GarmentItem = {
  id: 'a12-cyber-trench',
  name: {
    uz: 'Cyber-Tech Neo Plash (Trench)',
    en: 'Cyber-Tech Neo Trench Coat',
    ru: 'Кибер-Тренч Neo Techwear',
  },
  brand: 'A12 ATELIER',
  category: 'outerwear',
  price: '$280',
  sourceUrl: 'https://anywear.decart.ai/catalog/a12-cyber-trench',
  storeDomain: 'a12.atelier',
  primaryColor: '#0f172a',
  secondaryColor: '#0284c7',
  accentColor: '#38bdf8',
  fabric: 'techwear',
  drapeStiffness: 0.65,
  windResponse: 0.82,
  silhouetteType: 'trench',
  badge: '30 FPS Physics',
};

export const INITIAL_GARMENT_CATALOG: GarmentItem[] = [
  DEFAULT_GARMENT,
  {
    id: 'decart-velvet-blazer',
    name: {
      uz: 'Emerald Baxmal Oversize Pidjak',
      en: 'Emerald Velvet Oversized Blazer',
      ru: 'Изумрудный Бархатный Блейзер',
    },
    brand: 'MAISON DECART',
    category: 'formal',
    price: '$340',
    sourceUrl: 'https://zara.com/emerald-velvet-blazer',
    storeDomain: 'zara.com',
    primaryColor: '#064e3b',
    secondaryColor: '#10b981',
    accentColor: '#34d399',
    fabric: 'wool',
    drapeStiffness: 0.78,
    windResponse: 0.4,
    silhouetteType: 'blazer',
    badge: 'Best Seller',
  },
  {
    id: 'aero-street-hoodie',
    name: {
      uz: 'Aero-Weave Gravitatsion Xudi',
      en: 'Aero-Weave Heavyweight Hoodie',
      ru: 'Худи Aero-Weave Heavyweight',
    },
    brand: 'ACME STUDIO',
    category: 'streetwear',
    price: '$145',
    sourceUrl: 'https://ssense.com/aero-weave-hoodie',
    storeDomain: 'ssense.com',
    primaryColor: '#1e1b4b',
    secondaryColor: '#6366f1',
    accentColor: '#a855f7',
    fabric: 'cotton',
    drapeStiffness: 0.55,
    windResponse: 0.6,
    silhouetteType: 'hoodie',
    badge: 'Live Drape',
  },
  {
    id: 'lumina-silk-dress',
    name: {
      uz: 'Lumina Suyuq Ipak Kokteyl Ko‘ylak',
      en: 'Lumina Liquid-Silk Slip Dress',
      ru: 'Шелковое Платье Lumina Liquid',
    },
    brand: 'VALENTINA MILANO',
    category: 'dresses',
    price: '$410',
    sourceUrl: 'https://farfetch.com/lumina-silk-dress',
    storeDomain: 'farfetch.com',
    primaryColor: '#881337',
    secondaryColor: '#f43f5e',
    accentColor: '#fda4af',
    fabric: 'silk',
    drapeStiffness: 0.18,
    windResponse: 0.95,
    silhouetteType: 'dress',
    badge: 'Fluid Silk AI',
  },
  {
    id: 'cobalt-leather-moto',
    name: {
      uz: 'Kobalt Ko‘k Biker Charm Kurtka',
      en: 'Cobalt Racing Leather Moto Jacket',
      ru: 'Кожаная Мото-Куртка Cobalt',
    },
    brand: 'KINETIC LABS',
    category: 'outerwear',
    price: '$520',
    sourceUrl: 'https://endclothing.com/cobalt-leather-moto',
    storeDomain: 'endclothing.com',
    primaryColor: '#172554',
    secondaryColor: '#2563eb',
    accentColor: '#60a5fa',
    fabric: 'leather',
    drapeStiffness: 0.9,
    windResponse: 0.25,
    silhouetteType: 'jacket',
    badge: 'Specular AI',
  },
  {
    id: 'solaris-knit-polo',
    name: {
      uz: 'Solaris Merinos Trikotaj Polo',
      en: 'Solaris Merino Ribbed Knit Top',
      ru: 'Трикотажное Поло Solaris Merino',
    },
    brand: 'COS ATELIER',
    category: 'tops',
    price: '$115',
    sourceUrl: 'https://cos.com/solaris-merino-knit',
    storeDomain: 'cos.com',
    primaryColor: '#78350f',
    secondaryColor: '#f59e0b',
    accentColor: '#fde68a',
    fabric: 'wool',
    drapeStiffness: 0.42,
    windResponse: 0.55,
    silhouetteType: 'tshirt',
  },
];

/**
 * Parses any e-commerce product URL (Zara, ASOS, Uzum, Shopify, Farfetch, etc.)
 * and synthesizes a structured GarmentItem for instant zero-shot virtual try-on.
 */
export function parseProductUrlToGarment(rawUrl: string): GarmentItem {
  let cleanUrl = rawUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  let hostname = 'online-store.com';
  let pathname = 'custom-garment';
  try {
    const parsed = new URL(cleanUrl);
    hostname = parsed.hostname.replace(/^www\./, '');
    pathname = parsed.pathname.split('/').filter(Boolean).pop() || 'garment';
  } catch {
    // Fallback if invalid URL syntax
  }

  const slugWords = pathname
    .replace(/[-_]/g, ' ')
    .replace(/\.html?$/i, '')
    .replace(/\b\d+\b/g, '')
    .trim();

  const prettyTitle =
    slugWords.length > 2
      ? slugWords.replace(/\b\w/g, (l) => l.toUpperCase())
      : 'Imported Store Garment';

  const lower = (cleanUrl + ' ' + prettyTitle).toLowerCase();

  let silhouetteType: GarmentItem['silhouetteType'] = 'jacket';
  let category: GarmentItem['category'] = 'outerwear';
  let fabric: FabricPhysicsPreset = 'cotton';

  if (lower.includes('dress') || lower.includes('koylak') || lower.includes('slip')) {
    silhouetteType = 'dress';
    category = 'dresses';
    fabric = 'silk';
  } else if (lower.includes('hoodie') || lower.includes('sweat') || lower.includes('xudi')) {
    silhouetteType = 'hoodie';
    category = 'streetwear';
    fabric = 'cotton';
  } else if (lower.includes('blazer') || lower.includes('suit') || lower.includes('pidjak')) {
    silhouetteType = 'blazer';
    category = 'formal';
    fabric = 'wool';
  } else if (lower.includes('trench') || lower.includes('coat') || lower.includes('palto')) {
    silhouetteType = 'trench';
    category = 'outerwear';
    fabric = 'techwear';
  } else if (lower.includes('tee') || lower.includes('shirt') || lower.includes('futbolka') || lower.includes('top')) {
    silhouetteType = 'tshirt';
    category = 'tops';
    fabric = 'cotton';
  }

  // Deterministic color palette from URL hash
  let hash = 0;
  for (let i = 0; i < cleanUrl.length; i++) {
    hash = (hash << 5) - hash + cleanUrl.charCodeAt(i);
    hash |= 0;
  }
  const palettes = [
    { primary: '#0f172a', secondary: '#0ea5e9', accent: '#38bdf8' },
    { primary: '#3b0764', secondary: '#9333ea', accent: '#c084fc' },
    { primary: '#064e3b', secondary: '#10b981', accent: '#6ee7b7' },
    { primary: '#450a0a', secondary: '#ef4444', accent: '#fca5a5' },
    { primary: '#1e293b', secondary: '#64748b', accent: '#cbd5e1' },
  ];
  const chosen = palettes[Math.abs(hash) % palettes.length] ?? {
    primary: '#0f172a',
    secondary: '#0ea5e9',
    accent: '#38bdf8',
  };

  return {
    id: `url-${Date.now().toString(36)}`,
    name: {
      uz: `${prettyTitle} (${hostname})`,
      en: `${prettyTitle} (${hostname})`,
      ru: `${prettyTitle} (${hostname})`,
    },
    brand: hostname.toUpperCase(),
    category,
    price: 'URL Import',
    sourceUrl: cleanUrl,
    storeDomain: hostname,
    primaryColor: chosen.primary,
    secondaryColor: chosen.secondary,
    accentColor: chosen.accent,
    fabric,
    drapeStiffness: fabric === 'silk' ? 0.25 : 0.6,
    windResponse: 0.75,
    silhouetteType,
    badge: 'Zero-Shot URL',
    isCustom: true,
  };
}
