import { ArrowLeftRight, Calculator, SpellCheck, Tag, type LucideIcon } from 'lucide-react';

export const MODULE_SLUGS = ['imlo', 'valyuta', 'kalkulyator', 'narxlar'] as const;
export type ModuleSlug = (typeof MODULE_SLUGS)[number];

export function isModuleSlug(value: string): value is ModuleSlug {
  return (MODULE_SLUGS as readonly string[]).includes(value);
}

interface ModuleStyle {
  icon: LucideIcon;
  /** Full class strings so Tailwind can see them at build time. */
  text: string;
  soft: string;
  border: string;
}

export const MODULE_STYLE: Record<ModuleSlug, ModuleStyle> = {
  imlo: { icon: SpellCheck, text: 'text-imlo', soft: 'bg-imlo/10', border: 'hover:border-imlo/60' },
  valyuta: { icon: ArrowLeftRight, text: 'text-valyuta', soft: 'bg-valyuta/10', border: 'hover:border-valyuta/60' },
  kalkulyator: { icon: Calculator, text: 'text-biznes', soft: 'bg-biznes/10', border: 'hover:border-biznes/60' },
  narxlar: { icon: Tag, text: 'text-narxlar', soft: 'bg-narxlar/10', border: 'hover:border-narxlar/60' },
};
