// HTTP helpers shared by every connector.

export const APP_UA = 'CookedProfileRoaster/3.0 (+https://github.com/theflighttechofficial/Cooked-the-profile-roaster)';
export const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFound = (what: string) => new HttpError(404, `${what} not found. Check the spelling, and make sure the profile is public.`);

interface FetchOpts {
  timeoutMs?: number;
  retries?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch with a timeout, a default User-Agent, and retries on network errors, 429 and 5xx. */
export async function request(url: string, init: RequestInit = {}, opts: FetchOpts = {}): Promise<Response> {
  const { timeoutMs = 9000, retries = 1 } = opts;
  let last: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        headers: { 'User-Agent': APP_UA, Accept: 'application/json', ...(init.headers as Record<string, string>) },
        signal: ctrl.signal,
        redirect: init.redirect ?? 'follow',
      });
      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        last = new HttpError(res.status, `Upstream returned ${res.status}`);
        await sleep(500 * (attempt + 1));
        continue;
      }
      return res;
    } catch (e: any) {
      last = e?.name === 'AbortError' ? new HttpError(504, 'The platform took too long to answer.') : e;
      if (attempt < retries) await sleep(500 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  if (last instanceof HttpError) throw last;
  throw new HttpError(502, 'Could not reach the platform.');
}

function checkStatus(res: Response, what: string) {
  if (res.status === 404 || res.status === 410) throw notFound(what);
  if (res.status === 401 || res.status === 403) throw new HttpError(502, `The platform refused the request (${res.status}). The profile may be private.`);
  if (res.status === 429) throw new HttpError(429, 'The platform rate-limited us. Wait a minute and try again.');
  if (!res.ok) throw new HttpError(502, `The platform answered with an error (${res.status}).`);
}

/** GET (or POST) JSON. Maps 404 to a friendly "not found" error. */
export async function getJson<T = any>(url: string, what: string, init: RequestInit = {}, opts?: FetchOpts): Promise<T> {
  const res = await request(url, init, opts);
  checkStatus(res, what);
  try {
    return (await res.json()) as T;
  } catch {
    throw new HttpError(502, 'The platform sent back data we could not read.');
  }
}

export async function getText(url: string, what: string, init: RequestInit = {}, opts?: FetchOpts): Promise<string> {
  const res = await request(url, { ...init, headers: { Accept: '*/*', ...(init.headers as Record<string, string>) } }, opts);
  checkStatus(res, what);
  return res.text();
}

/** Like getJson, but returns null instead of throwing. For optional, secondary data. */
export async function tryJson<T = any>(url: string, init: RequestInit = {}, opts?: FetchOpts): Promise<T | null> {
  try {
    const res = await request(url, init, { retries: 0, ...opts });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function postJson<T = any>(url: string, body: unknown, what: string, headers: Record<string, string> = {}): Promise<T> {
  return getJson<T>(url, what, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

// ---------- Text helpers ----------

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z0-9#]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

export function stripHtml(s: unknown): string {
  return decodeEntities(String(s ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function clip(s: unknown, max = 280): string {
  const t = String(s ?? '').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** Read the text of the first <tag> in an XML string, CDATA-aware. */
export function xmlTag(xml: string, tag: string): string {
  const esc = tag.replace(/[:.]/g, '\\$&');
  const m = xml.match(new RegExp(`<${esc}(?:\\s[^>]*)?>([\\s\\S]*?)</${esc}>`));
  if (!m) return '';
  const inner = m[1].trim();
  const cdata = inner.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdata ? cdata[1] : decodeEntities(inner);
}

export function xmlBlocks(xml: string, tag: string): string[] {
  return xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?</${tag}>`, 'g')) || [];
}

export function fmt(n: unknown): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n ?? '0');
  return v.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

export function compact(n: unknown): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n ?? '0');
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

export function isoFromUnix(sec: unknown): string | undefined {
  const v = Number(sec);
  return Number.isFinite(v) && v > 0 ? new Date(v * 1000).toISOString() : undefined;
}

export function isoDate(s: unknown): string | undefined {
  if (!s) return undefined;
  const d = new Date(String(s));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function yearsSince(iso?: string): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return ms > 0 ? Math.floor(ms / (365.25 * 24 * 3600 * 1000)) : null;
}

/** Drop stats whose value is empty, so the UI and the AI never see "undefined". */
export function cleanStats(stats: { label: string; value: unknown }[]) {
  return stats
    .filter((s) => s.value !== undefined && s.value !== null && s.value !== '' && !Number.isNaN(s.value as number))
    .map((s) => ({ label: s.label, value: s.value as string | number }));
}
