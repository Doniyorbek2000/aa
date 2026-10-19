import { ArrowLeft, Check } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import { DICTIONARIES } from '@/lib/dictionaries';
import { LOCALES, isLocale } from '@/lib/locale';
import { MODULE_SLUGS, MODULE_STYLE, isModuleSlug } from '@/lib/modules';

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => MODULE_SLUGS.map((module) => ({ locale, module })));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/[module]'>): Promise<Metadata> {
  const { locale, module } = await params;
  if (!isLocale(locale) || !isModuleSlug(module)) return {};
  const copy = DICTIONARIES[locale].modules[module];
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `/${locale}/${module}`,
      languages: { uz: `/uz/${module}`, ru: `/ru/${module}`, 'x-default': `/uz/${module}` },
    },
  };
}

export default async function ModulePage({ params }: PageProps<'/[locale]/[module]'>) {
  const { locale, module } = await params;
  if (!isLocale(locale) || !isModuleSlug(module)) notFound();
  const t = DICTIONARIES[locale];
  const copy = t.modules[module];
  const style = MODULE_STYLE[module];
  const Icon = style.icon;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-20">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 rounded-input text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden />
        {t.modulePage.back}
      </Link>

      <div className="mt-8 flex items-center gap-4">
        <span className={`grid size-14 place-items-center rounded-card ${style.soft} ${style.text}`}>
          <Icon className="size-7" aria-hidden />
        </span>
        <StatusBadge>{t.status.inProgress}</StatusBadge>
      </div>
      <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] md:text-5xl">{copy.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{copy.description}</p>

      <section aria-labelledby="planned-title" className="mt-12 rounded-card border border-border bg-surface p-6">
        <h2 id="planned-title" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          {t.modulePage.planned}
        </h2>
        <p className="mt-2 text-sm text-muted">{t.modulePage.notice}</p>
        <ul className="mt-5 divide-y divide-border">
          {copy.tools.map((tool) => (
            <li key={tool} className="flex items-center gap-3 py-3">
              <Check className={`size-4 ${style.text}`} aria-hidden />
              {tool}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
