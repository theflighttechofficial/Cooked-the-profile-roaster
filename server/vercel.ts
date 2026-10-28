// Vercel serverless entry. scripts/build-vercel.ts bundles this into
// .vercel/output/functions/api/index.func, and every /api/* request is routed here.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from './app.ts';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  // The route sends the original sub-path as ?__path=. Put it back so Express sees /api/<path>.
  const url = new URL(req.url || '/', 'http://localhost');
  const sub = url.searchParams.get('__path');
  if (sub !== null) {
    url.searchParams.delete('__path');
    const qs = url.searchParams.toString();
    req.url = `/api/${sub}${qs ? `?${qs}` : ''}`;
  }
  return app(req as any, res as any);
}
