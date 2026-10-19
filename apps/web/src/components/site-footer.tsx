import type { Dictionary } from '@/lib/dictionaries';

export function SiteFooter({ t }: { t: Dictionary }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:px-6 md:flex-row md:justify-between">
        <p>{t.footer.disclaimer}</p>
        <p>
          © {new Date().getFullYear()} A12. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
