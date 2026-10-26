import type { ConnectorInfo, Profile } from '../../shared/types.ts';
import { HttpError } from '../http.ts';
import { codeConnectors } from './code.ts';
import { competeConnectors } from './compete.ts';
import { cultureConnectors } from './culture.ts';
import { gamesConnectors } from './games.ts';
import { parseHandle } from './handle.ts';
import { socialConnectors } from './social.ts';
import type { ConnectorDef } from './types.ts';

export const connectors: ConnectorDef[] = [...codeConnectors, ...competeConnectors, ...socialConnectors, ...cultureConnectors, ...gamesConnectors];

const byId = new Map(connectors.map((c) => [c.id, c]));

export function getConnector(id: string) {
  return byId.get(id);
}

export function connectorInfo(): ConnectorInfo[] {
  return connectors.map(({ fetch: _f, parse: _p, ...meta }) => ({
    ...meta,
    available: !meta.requiresEnv || !!process.env[meta.requiresEnv],
  }));
}

// 10-minute cache keyed by platform + handle, so repeat lookups and roasts are instant.
const TTL = 10 * 60 * 1000;
const cache = new Map<string, { at: number; profile: Profile }>();

export async function fetchProfile(id: string, rawHandle: string): Promise<Profile> {
  const c = byId.get(id);
  if (!c) throw new HttpError(404, `Unknown platform "${id}".`);
  if (c.requiresEnv && !process.env[c.requiresEnv]) {
    throw new HttpError(503, `${c.name} is not set up on this server. Add ${c.requiresEnv} to the environment.`);
  }
  const handle = (c.parse ?? parseHandle)(String(rawHandle || ''));
  if (!handle) throw new HttpError(400, `Enter a valid ${c.inputLabel}.`);

  const key = `${id}:${handle.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.profile;

  const data = await c.fetch(handle);
  const profile: Profile = {
    ...data,
    platform: c.id,
    platformName: c.name,
    stats: data.stats.slice(0, 6),
    lists: data.lists.filter((l) => l.items.length > 0),
    facts: data.facts.filter(Boolean).slice(0, 14),
    fetchedAt: new Date().toISOString(),
  };
  if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), profile });
  return profile;
}
