import { GoogleGenAI, Type } from '@google/genai';
import type { BattleResult, Heat, Persona, Profile, Roast, RoastMeter } from '../shared/types.ts';
import { HttpError } from './http.ts';
import { localBattle, localRoast, METER_LABELS } from './local-roaster.ts';
import { groqGenerate, hasGroq } from './groq.ts';
import { hasOllama, ollamaGenerate } from './ollama.ts';

export { METER_LABELS };

const PERSONAS: Record<Persona, string> = {
  chef: 'a furious celebrity chef judging a kitchen disaster. Use cooking metaphors: raw, overcooked, bland, "it\'s RAW", "get out of my kitchen".',
  techlead: 'a burned-out staff engineer leaving passive-aggressive code review comments. Dry, precise, devastating, mentions tech debt and "per my last message".',
  genz: 'a terminally online Gen Z friend. Lowercase energy, slang like "no cap", "it\'s giving", "the audacity", "ratio", "delulu", but still sharp and specific.',
  parent: 'a disappointed immigrant parent comparing them to their cousin who became a doctor. Guilt trips, sighs, "I didn\'t raise you for this".',
  bard: 'a Shakespearean bard delivering insults in theatrical Early Modern English, with thee/thou and dramatic flourishes, still referencing the real data.',
  therapist: 'a calm therapist whose gentle, validating tone makes every observation hurt more. "And how does having 0 stars make you feel?"',
};

const HEAT: Record<Heat, string> = {
  mild: 'Light toast: playful teasing, affectionate, nothing that stings for more than a second.',
  medium: 'Medium: properly funny and pointed, the kind of roast friends screenshot.',
  scorched: 'Scorched: merciless, savage, every line lands. Still clever, never just mean for no reason.',
};

const RULES = `Rules:
- Only use the facts in the dossier. Quote real numbers, names, repo/film/game titles, and posts. Never invent stats.
- Be specific. Generic jokes that could fit anyone are a failure.
- Roast choices, habits and stats. Never target race, ethnicity, religion, gender, sexuality, disability, body or appearance.
- No slurs, no threats, no sexual content, nothing about self-harm.
- If the data is thin (private profile, tiny counts), roast that.`;

function dossier(profiles: Profile[], extra?: string): string {
  const parts = profiles.map((p) => {
    const lines = [
      `## ${p.platformName}: ${p.displayName} (@${p.handle})`,
      p.bio && `Bio: ${p.bio}`,
      p.location && `Location: ${p.location}`,
      p.joined && `Joined: ${p.joined.slice(0, 10)}`,
      p.stats.length && `Stats: ${p.stats.map((s) => `${s.label}: ${s.value}`).join(' | ')}`,
      ...p.lists.map((l) => `${l.title}: ${l.items.slice(0, 8).map((i) => (i.meta ? `${i.name} (${i.meta})` : i.name)).join('; ')}`),
      ...p.facts.map((f) => `- ${f}`),
    ];
    return lines.filter(Boolean).join('\n');
  });
  if (extra?.trim()) parts.push(`## Text the person pasted about themselves\n${extra.trim().slice(0, 6000)}`);
  return parts.join('\n\n');
}

const roastSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'A funny archetype title, 2-6 words, e.g. "The Unstarred Repo Hoarder".' },
    verdict: { type: Type.STRING, description: 'One savage sentence that sums them up, quoting a real number.' },
    score: { type: Type.INTEGER, description: 'How cooked they are, 0-100.' },
    paragraphs: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Exactly 3 roast paragraphs, 2-4 sentences each, each built on different real facts.' },
    redFlags: { type: Type.ARRAY, items: { type: Type.STRING }, description: '4 short red flags, each under 14 words, each tied to a real fact.' },
    greenFlag: { type: Type.STRING, description: 'One backhanded compliment.' },
    meters: {
      type: Type.ARRAY,
      description: `One entry per label, in this order: ${METER_LABELS.join(', ')}.`,
      items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.INTEGER } }, required: ['label', 'value'] },
    },
    shareQuote: { type: Type.STRING, description: 'A short first-person line they would hate to see on their own card, under 20 words.' },
    badge: { type: Type.STRING, description: 'A fake achievement badge name, 2-5 words.' },
  },
  required: ['title', 'verdict', 'score', 'paragraphs', 'redFlags', 'greenFlag', 'meters', 'shareQuote', 'badge'],
};

const battleSchema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: 'Fight-night headline for the matchup.' },
    rounds: {
      type: Type.ARRAY,
      description: 'Exactly 3 rounds.',
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING, description: 'What this round compares, 1-4 words.' },
          left: { type: Type.STRING, description: 'Roast of contender 1 on this topic, 1-2 sentences, real facts.' },
          right: { type: Type.STRING, description: 'Roast of contender 2 on this topic, 1-2 sentences, real facts.' },
          winner: { type: Type.INTEGER, description: '0 if contender 1 is LESS embarrassing this round, 1 otherwise.' },
        },
        required: ['topic', 'left', 'right', 'winner'],
      },
    },
    winnerIndex: { type: Type.INTEGER, description: '0 or 1: who survives the battle (is less cooked).' },
    finalBlow: { type: Type.STRING, description: 'A closing line aimed at the loser.' },
    scores: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: 'Cooked score 0-100 for contender 1 then contender 2.' },
  },
  required: ['headline', 'rounds', 'winnerIndex', 'finalBlow', 'scores'],
};

let client: GoogleGenAI | null = null;
export const hasGemini = () => !!process.env.GEMINI_API_KEY;
/** Which engines can read a screenshot. Without one, the client reads the text with OCR. */
export const hasVision = hasGemini;

// Gemini 3.5 Flash-Lite unless GEMINI_MODEL says otherwise
const GEMINI_DEFAULT_MODEL = 'gemini-3.5-flash-lite';

function ai() {
  if (!process.env.GEMINI_API_KEY) return null;
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/** One Gemini model, retried on transient overloads. Null means "try the next engine". */
async function gemini(contents: any, schema: any): Promise<any> {
  const gen = ai();
  if (!gen) return null;
  const models = [process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL];
  let last: unknown;
  outer: for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await gen.models.generateContent({
          model,
          contents,
          config: { responseMimeType: 'application/json', responseSchema: schema, temperature: 1.1 },
        });
        return JSON.parse(res.text || '{}');
      } catch (e: any) {
        last = e;
        const msg = String(e?.message || e);
        // A bad key will not fix itself on the next model; go straight to the fallback
        if (/API key|PERMISSION_DENIED|API_KEY_INVALID/i.test(msg)) break outer;
        if (!/503|429|UNAVAILABLE|overloaded|RESOURCE_EXHAUSTED|high demand/i.test(msg)) break;
        await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
      }
    }
  }
  console.warn('[roast] Gemini failed, trying the next engine:', String((last as any)?.message || last).slice(0, 200));
  return null;
}

const clamp = (n: unknown, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
const strs = (x: unknown, n: number) => (Array.isArray(x) ? x.map(String).filter(Boolean).slice(0, n) : []);

function normalizeRoast(r: any, engine: string): Roast {
  const meters: RoastMeter[] = METER_LABELS.map((label, i) => {
    const m = Array.isArray(r.meters) ? r.meters.find((x: any) => String(x?.label).toLowerCase() === label.toLowerCase()) ?? r.meters[i] : null;
    return { label, value: clamp(m?.value ?? 50) };
  });
  return {
    title: String(r.title || 'Thoroughly Cooked'),
    verdict: String(r.verdict || ''),
    score: clamp(r.score ?? 80),
    paragraphs: strs(r.paragraphs, 4),
    redFlags: strs(r.redFlags, 5),
    greenFlag: String(r.greenFlag || ''),
    meters,
    shareQuote: String(r.shareQuote || ''),
    badge: String(r.badge || 'Certified Cooked'),
    engine,
  };
}

/** A usable roast has real paragraphs; anything less counts as a failed generation. */
const validRoast = (r: any) => r && Array.isArray(r.paragraphs) && r.paragraphs.filter((p: unknown) => String(p ?? '').trim()).length >= 2 && r.title;
const validBattle = (b: any) => b && Array.isArray(b.rounds) && b.rounds.length >= 2 && b.finalBlow;

/** Gemini, then Groq, then Ollama, each only when configured. Null when every AI engine failed. */
async function generate(prompt: string, schema: any): Promise<{ out: any; engine: string } | null> {
  const engines: [string, boolean, () => Promise<any>][] = [
    ['gemini', hasGemini(), () => gemini(prompt, schema)],
    ['groq', hasGroq(), () => groqGenerate(prompt, schema)],
    ['ollama', hasOllama(), () => ollamaGenerate(prompt, schema)],
  ];
  for (const [engine, on, run] of engines) {
    if (!on) continue;
    const out = await run();
    if (out && (schema === battleSchema ? validBattle(out) : validRoast(out))) return { out, engine };
  }
  return null;
}

function roastPrompt(persona: Persona, heat: Heat, body: string) {
  return `You are COOKED, a roast comedian. Speak as ${PERSONAS[persona] ?? PERSONAS.chef}
Heat level: ${HEAT[heat] ?? HEAT.medium}
${RULES}
${body}`;
}

export async function roastProfiles(profiles: Profile[], persona: Persona, heat: Heat, extra?: string, extraLabel?: string): Promise<Roast> {
  const prompt = roastPrompt(
    persona,
    heat,
    `${profiles.length > 1 ? 'They gave you several accounts. Connect them: find the contradictions and the patterns across platforms.' : ''}

Dossier:
${dossier(profiles, extra)}`,
  );
  const res = await generate(prompt, roastSchema);
  if (res && validRoast(res.out)) return normalizeRoast(res.out, res.engine);
  return localRoast(profiles, persona, heat, extra, extraLabel);
}

/**
 * Screenshot roast. Needs a vision model. Without one, or when it fails, the server returns
 * 503 with fallback "ocr": the client then reads the text in the browser and posts it to /api/roast.
 */
export async function roastImage(base64: string, mimeType: string, persona: Persona, heat: Heat, note?: string): Promise<Roast> {
  const prompt = roastPrompt(
    persona,
    heat,
    `The image is a screenshot of someone's profile, feed, playlist, stats page or bio. Read every number and word in it and roast the person. Only use what is visible in the screenshot.
${note ? `They added this note: ${note.slice(0, 500)}` : ''}`,
  );
  // Vision is Gemini only
  if (hasVision()) {
    const g = await gemini([{ role: 'user', parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] }], roastSchema);
    if (validRoast(g)) return normalizeRoast(g, 'gemini');
  }
  throw Object.assign(new HttpError(503, 'No AI can read images right now, so the text will be read on your device instead.'), { fallback: 'ocr' });
}

export async function battle(a: Profile, b: Profile, persona: Persona, heat: Heat): Promise<BattleResult> {
  const prompt = `You are COOKED, hosting a roast battle. Speak as ${PERSONAS[persona] ?? PERSONAS.chef}
Heat level: ${HEAT[heat] ?? HEAT.medium}
${RULES}
Contender 1 is ${a.displayName}. Contender 2 is ${b.displayName}. Roast both, then decide who is less cooked.

# Contender 1
${dossier([a])}

# Contender 2
${dossier([b])}`;
  const res = await generate(prompt, battleSchema);
  if (!res || !validBattle(res.out)) return localBattle(a, b, persona, heat);
  const out = res.out;
  const scores = strs(out.scores, 2).map((s) => clamp(s));
  return {
    headline: String(out.headline || `${a.displayName} vs ${b.displayName}`),
    rounds: (Array.isArray(out.rounds) ? out.rounds : []).slice(0, 3).map((r: any) => ({
      topic: String(r.topic || 'Round'),
      left: String(r.left || ''),
      right: String(r.right || ''),
      winner: r.winner === 1 ? 1 : 0,
    })),
    winnerIndex: out.winnerIndex === 1 ? 1 : 0,
    finalBlow: String(out.finalBlow || ''),
    scores: [scores[0] ?? 70, scores[1] ?? 70],
    engine: res.engine,
  };
}
