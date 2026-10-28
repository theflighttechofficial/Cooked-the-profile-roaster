import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { app } from './app.ts';
import { hasGemini } from './roast.ts';

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function start() {
  if (isProd) {
    // dist/server.js sits next to the built client in dist/
    const dist = import.meta.dirname;
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cooked is serving on http://localhost:${PORT}  (AI: ${hasGemini() ? 'Gemini' : 'offline roasts — set GEMINI_API_KEY'})`);
  });
}

start();
