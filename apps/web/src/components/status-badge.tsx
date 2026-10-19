export function StatusBadge({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
      <span aria-hidden className="size-1.5 rounded-full bg-warning" />
      {children}
    </span>
  );
}
