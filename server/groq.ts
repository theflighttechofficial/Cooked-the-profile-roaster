// Groq (https://groq.com), text only. Tried after Gemini fails and before Ollama and the
// local roaster. Set GROQ_API_KEY to turn it on. Screenshots never go here: vision is Gemini only.
import { toJsonSchema } from './ollama.ts';

const DEFAULT_MODEL = 'llama-3.1-8b-instant';

export const hasGroq = () => !!process.env.GROQ_API_KEY;

/** Returns parsed JSON, or null on any failure (bad key, 429 rate limit, timeout) so the caller falls back. */
export async function groqGenerate(prompt: string, schema: any): Promise<any> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30_000);
  try {
    const base = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        temperature: 1,
        max_tokens: 1500,
        // JSON mode works on every Groq text model; the schema goes in the prompt
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `Reply with one JSON object only, matching this JSON Schema:\n${JSON.stringify(toJsonSchema(schema))}` },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Groq answered ${res.status}${res.status === 429 ? ` (rate limited, retry after ${res.headers.get('retry-after') ?? '?'}s)` : ''}`);
    const body = await res.json();
    return JSON.parse(body?.choices?.[0]?.message?.content || 'null');
  } catch (e: any) {
    console.warn('[roast] Groq failed, trying the next engine:', String(e?.message || e).slice(0, 200));
    return null;
  } finally {
    clearTimeout(timer);
  }
}
