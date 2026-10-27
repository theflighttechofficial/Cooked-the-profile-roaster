import type { BattleResult, ConnectorInfo, Heat, Persona, Profile, Roast } from '../../shared/types.ts';

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error('Could not reach the Cooked server. Is it running?');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body as T;
}

const post = <T,>(url: string, body: unknown) =>
  call<T>(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const ref = (p: Profile) => ({ platform: p.platform, handle: p.handle });

export const api = {
  connectors: () => call<{ connectors: ConnectorInfo[]; ai: boolean }>('/api/connectors'),
  profile: (platform: string, handle: string) =>
    call<Profile>(`/api/profile/${encodeURIComponent(platform)}?handle=${encodeURIComponent(handle)}`),
  roast: (profiles: Profile[], persona: Persona, heat: Heat, extra: string) =>
    post<Roast>('/api/roast', { profiles: profiles.map(ref), persona, heat, extra }),
  roastImage: (image: string, persona: Persona, heat: Heat, note: string) =>
    post<Roast>('/api/roast/image', { image, persona, heat, note }),
  battle: (a: Profile, b: Profile, persona: Persona, heat: Heat) =>
    post<BattleResult>('/api/battle', { profiles: [ref(a), ref(b)], persona, heat }),
};
