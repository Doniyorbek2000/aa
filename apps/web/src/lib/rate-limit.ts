/**
 * Fixed-window limiter keyed by client (IP, phone, ...). shortcut: lives in this server instance's
 * memory, so limits reset on restart and are per instance; move to Redis if the site runs several.
 */
export function createRateLimiter(limit: number, windowMs: number): (key: string, now: number) => boolean {
  const windows = new Map<string, { start: number; count: number }>();
  return (key, now) => {
    const current = windows.get(key);
    if (!current || now - current.start >= windowMs) {
      if (windows.size > 10_000) windows.clear();
      windows.set(key, { start: now, count: 1 });
      return true;
    }
    if (current.count >= limit) return false;
    windows.set(key, { start: current.start, count: current.count + 1 });
    return true;
  };
}

/** Client address; Caddy, the only way in, sets X-Forwarded-For to the real one. */
export function clientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
