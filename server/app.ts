import express, { type NextFunction, type Request, type Response } from 'express';
import type { Heat, Persona, Profile } from '../shared/types.ts';
import { connectorInfo, fetchProfile } from './connectors/index.ts';
import { HttpError } from './http.ts';
import { battle, hasGemini, roastImage, roastProfiles } from './roast.ts';

// The API, shared by the long-running server (server/index.ts) and the Vercel function (server/vercel.ts)
export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '8mb' }));

const PERSONAS: Persona[] = ['chef', 'techlead', 'genz', 'parent', 'bard', 'therapist'];
const HEATS: Heat[] = ['mild', 'medium', 'scorched'];
const persona = (v: unknown): Persona => (PERSONAS.includes(v as Persona) ? (v as Persona) : 'chef');
const heat = (v: unknown): Heat => (HEATS.includes(v as Heat) ? (v as Heat) : 'medium');

// Small per-IP limiter for the AI endpoints
const hits = new Map<string, number[]>();
function limit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.path}:${req.ip}`;
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) return res.status(429).json({ error: 'Slow down, the oven needs a minute. Try again shortly.' });
    recent.push(now);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
    next();
  };
}

const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response) =>
  fn(req, res).catch((err: unknown) => {
    const status = err instanceof HttpError ? err.status : 500;
    if (!(err instanceof HttpError)) console.error(err);
    res.status(status).json({ error: err instanceof HttpError ? err.message : 'Something broke on our side. Try again.' });
  });

/** Profiles are always re-fetched on the server (cached), so the AI only sees real data. */
async function loadRefs(refs: unknown, max: number): Promise<Profile[]> {
  if (!Array.isArray(refs)) return [];
  return Promise.all(
    refs.slice(0, max).map((r: any) => fetchProfile(String(r?.platform || ''), String(r?.handle || ''))),
  );
}

app.get('/api/health', (_req, res) => res.json({ ok: true, ai: hasGemini() }));

app.get('/api/connectors', (_req, res) => {
  res.json({ connectors: connectorInfo(), ai: hasGemini() });
});

app.get(
  '/api/profile/:platform',
  limit(60, 60_000),
  wrap(async (req, res) => {
    const profile = await fetchProfile(req.params.platform, String(req.query.handle || ''));
    res.json(profile);
  }),
);

app.post(
  '/api/roast',
  limit(15, 60_000),
  wrap(async (req, res) => {
    const profiles = await loadRefs(req.body?.profiles, 4);
    const extra = typeof req.body?.extra === 'string' ? req.body.extra.slice(0, 6000) : '';
    if (!profiles.length && extra.trim().length < 20) throw new HttpError(400, 'Add at least one profile, or paste a bio of 20+ characters.');
    res.json(await roastProfiles(profiles, persona(req.body?.persona), heat(req.body?.heat), extra));
  }),
);

app.post(
  '/api/roast/image',
  limit(8, 60_000),
  wrap(async (req, res) => {
    const m = String(req.body?.image || '').match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
    if (!m) throw new HttpError(400, 'Upload a PNG, JPG, WebP or GIF screenshot.');
    if (m[2].length > 7_000_000) throw new HttpError(413, 'That image is too big. Keep it under 5 MB.');
    const note = typeof req.body?.note === 'string' ? req.body.note : '';
    res.json(await roastImage(m[2], m[1], persona(req.body?.persona), heat(req.body?.heat), note));
  }),
);

app.post(
  '/api/battle',
  limit(10, 60_000),
  wrap(async (req, res) => {
    const profiles = await loadRefs(req.body?.profiles, 2);
    if (profiles.length !== 2) throw new HttpError(400, 'A battle needs exactly two profiles.');
    res.json(await battle(profiles[0], profiles[1], persona(req.body?.persona), heat(req.body?.heat)));
  }),
);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
