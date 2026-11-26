// Optional local LLM through Ollama (https://ollama.com). Used when Gemini is missing or fails,
// before the built-in local roaster. Set OLLAMA_URL (e.g. http://localhost:11434) to turn it on.
// It only makes sense where the server can reach Ollama: your own machine or a Docker host,
// not a Vercel function.

const DEFAULT_MODEL = 'llama3.2';

export const hasOllama = () => !!process.env.OLLAMA_URL;

/** Gemini schemas use upper-case type names; Ollama wants plain JSON Schema. */
function toJsonSchema(schema: any): any {
  if (Array.isArray(schema)) return schema.map(toJsonSchema);
  if (!schema || typeof schema !== 'object') return schema;
  const out: any = {};
  for (const [k, v] of Object.entries(schema)) out[k] = k === 'type' && typeof v === 'string' ? v.toLowerCase() : toJsonSchema(v);
  return out;
}

/** Returns parsed JSON, or null on any failure so the caller can fall back. */
export async function ollamaGenerate(prompt: string, schema: any, imageBase64?: string, model?: string): Promise<any> {
  const base = process.env.OLLAMA_URL?.replace(/\/+$/, '');
  if (!base) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Number(process.env.OLLAMA_TIMEOUT_MS) || 90_000);
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: model || process.env.OLLAMA_MODEL || DEFAULT_MODEL,
        stream: false,
        format: toJsonSchema(schema),
        options: { temperature: 1 },
        messages: [{ role: 'user', content: `${prompt}\n\nAnswer with JSON only.`, ...(imageBase64 ? { images: [imageBase64] } : {}) }],
      }),
    });
    if (!res.ok) throw new Error(`Ollama answered ${res.status}`);
    const body = await res.json();
    return JSON.parse(body?.message?.content || 'null');
  } catch (e: any) {
    console.warn('[roast] Ollama failed, using the local roaster:', String(e?.message || e).slice(0, 200));
    return null;
  } finally {
    clearTimeout(timer);
  }
}
