const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const hits = new Map<string, number[]>();

export function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "local";
}

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent);
    return false;
  }

  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export function validateText(text: unknown, maxLength: number): string | null {
  if (typeof text !== "string" || !text.trim()) {
    return "الإدخال فاضي";
  }
  if (text.length > maxLength) {
    return `النص طويل جداً (الحد الأقصى ${maxLength} حرف)`;
  }
  return null;
}
