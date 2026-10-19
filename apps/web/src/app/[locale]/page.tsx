import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import { DICTIONARIES, type Dictionary } from '@/lib/dictionaries';
import { isLocale, type Locale } from '@/lib/locale';
import { MODULE_SLUGS, MODULE_STYLE, type ModuleSlug } from '@/lib/modules';

/** Bento spans: the two daily-use tools get the wide tiles. */
const SPAN: Record<ModuleSlug, string> = {
  valyuta: 'md:col-span-4',
  kalkulyator: 'md:col-span-2',
  imlo: 'md:col-span-2',
  narxlar: 'md:col-span-4',
};
const ORDER: ModuleSlug[] = ['valyuta', 'kalkulyator', 'imlo', 'narxlar'];

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = DICTIONARIES[locale];

  return (
    <>
      <section aria-labelledby="hero-title" className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 md:pb-16 md:pt-20">
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t.home.eyebrow}</p>
            <h1 id="hero-title" className="text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.03em] text-balance md:text-[4.25rem]">
              {t.home.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty">{t.home.lead}</p>
          </div>
          <ModuleIndex locale={locale} t={t} />
        </div>
      </section>

      <section aria-labelledby="modules-title" className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="modules-title" className="sr-only">
          {t.home.modulesHeading}
        </h2>
        <ul className="grid gap-3 md:grid-cols-6">
          {ORDER.map((slug) => (
            <li key={slug} className={SPAN[slug]}>
              <ModuleCard slug={slug} locale={locale} t={t} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="principles-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <h2 id="principles-title" className="mb-8 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          {t.home.principlesHeading}
        </h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {t.home.principles.map((p, i) => (
            <li key={p.title} className="border-t-2 border-fg pt-4">
              <span className="font-mono text-xs text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{p.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

/** Editorial table of contents beside the headline (desktop only; mobile has the tab bar). */
function ModuleIndex({ locale, t }: { locale: Locale; t: Dictionary }) {
  return (
    <ol className="hidden w-56 divide-y divide-border border-y border-border text-sm md:block">
      {MODULE_SLUGS.map((slug, i) => (
        <li key={slug}>
          <Link href={`/${locale}/${slug}`} className="group flex items-center gap-3 py-2.5">
            <span className="font-mono text-xs text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
            <span className={`size-2 rounded-full bg-current ${MODULE_STYLE[slug].text}`} aria-hidden />
            <span className="flex-1 transition-transform group-hover:translate-x-0.5">{t.modules[slug].short}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function ModuleCard({ slug, locale, t }: { slug: ModuleSlug; locale: Locale; t: Dictionary }) {
  const style = MODULE_STYLE[slug];
  const copy = t.modules[slug];
  const Icon = style.icon;
  const wide = SPAN[slug] === 'md:col-span-4';

  return (
    <Link
      href={`/${locale}/${slug}`}
      className={`group relative flex h-full flex-col rounded-card border border-border bg-surface p-5 shadow-[0_1px_0_rgb(0_0_0/0.03)] transition-[border-color,box-shadow] hover:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)] md:min-h-64 md:p-6 ${style.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-11 place-items-center rounded-card ${style.soft} ${style.text}`}>
          <Icon className="size-[22px]" aria-hidden />
        </span>
        <ArrowUpRight
          className="size-5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg"
          aria-hidden
        />
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight">{copy.title}</h3>
      <p className="mt-1.5 max-w-md leading-relaxed text-muted">{copy.description}</p>
      <ul className={`mt-5 grid gap-x-6 gap-y-1.5 text-sm ${wide ? 'sm:grid-cols-2' : ''}`}>
        {copy.tools.map((tool) => (
          <li key={tool} className="flex items-center gap-2">
            <span className={`h-px w-3 bg-current ${style.text}`} aria-hidden />
            {tool}
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <StatusBadge>{t.status.soon}</StatusBadge>
      </div>
    </Link>
  );
}
