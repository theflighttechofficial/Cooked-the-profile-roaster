import { GoogleGenAI, Type } from '@google/genai';
import type { BattleResult, Heat, Persona, Profile, Roast, RoastMeter } from '../shared/types.ts';
import { HttpError } from './http.ts';

export const METER_LABELS = ['Delusion', 'Touch grass urgency', 'Main character energy', 'Chronically online', 'Cringe'];

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

function ai() {
  if (!process.env.GEMINI_API_KEY) return null;
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/** Try the configured model, then the always-current aliases. Retries transient overloads. Null means "use the offline roast". */
async function generate(contents: any, schema: any): Promise<any> {
  const gen = ai();
  if (!gen) return null;
  const models = [...new Set([process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-flash-lite-latest'].filter(Boolean) as string[])];
  let last: unknown;
  for (const model of models) {
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
        if (/API key|PERMISSION_DENIED|API_KEY_INVALID/i.test(msg)) throw new HttpError(401, 'Gemini rejected the API key.');
        if (!/503|429|UNAVAILABLE|overloaded|RESOURCE_EXHAUSTED|high demand/i.test(msg)) break;
        await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
      }
    }
  }
  console.warn('[roast] Gemini failed, using offline roast:', String((last as any)?.message || last).slice(0, 200));
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

export async function roastProfiles(profiles: Profile[], persona: Persona, heat: Heat, extra?: string): Promise<Roast> {
  const prompt = `You are COOKED, a roast comedian. Speak as ${PERSONAS[persona] ?? PERSONAS.chef}
Heat level: ${HEAT[heat] ?? HEAT.medium}
${RULES}
${profiles.length > 1 ? 'They gave you several accounts. Connect them: find the contradictions and the patterns across platforms.' : ''}

Dossier:
${dossier(profiles, extra)}`;
  const out = await generate(prompt, roastSchema);
  if (out) return normalizeRoast(out, 'gemini');
  return offlineRoast(profiles, extra);
}

export async function roastImage(base64: string, mimeType: string, persona: Persona, heat: Heat, note?: string): Promise<Roast> {
  if (!hasGemini()) throw new HttpError(503, 'Screenshot roasts need GEMINI_API_KEY on the server.');
  const prompt = `You are COOKED, a roast comedian. Speak as ${PERSONAS[persona] ?? PERSONAS.chef}
Heat level: ${HEAT[heat] ?? HEAT.medium}
${RULES.replace('Only use the facts in the dossier', 'Only use what is visible in the screenshot')}
The image is a screenshot of someone's profile, feed, playlist, stats page or bio. Read every number and word in it and roast the person.
${note ? `They added this note: ${note.slice(0, 500)}` : ''}`;
  const out = await generate([{ role: 'user', parts: [{ inlineData: { mimeType, data: base64 } }, { text: prompt }] }], roastSchema);
  if (!out) throw new HttpError(503, 'The AI is overloaded right now. Try again in a minute.');
  return normalizeRoast(out, 'gemini');
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
  const out = await generate(prompt, battleSchema);
  if (!out) return offlineBattle(a, b);
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
    engine: 'gemini',
  };
}

// ---------------- Offline roasts (no API key, or the AI is down) ----------------

function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (n: number) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) % n;
  };
}

const TITLES: Record<string, string[]> = {
  code: ['The Unstarred Repo Hoarder', 'Senior Side-Project Abandoner', 'The README-Driven Developer', 'Chief Dependency Officer'],
  compete: ['The Algorithm Goblin', 'Grandmaster of Wrong Answer', 'The Midnight Rating Chaser', 'Professional Edge-Case Victim'],
  social: ['The Reply Guy Emeritus', 'Thought Leader of Nobody', 'The Engagement Farmer', 'Certified Terminally Online'],
  culture: ['The Taste Gatekeeper', 'Professional Backlog Builder', 'The Aesthetic Over Substance Curator', 'Certified Main Character'],
  games: ['Toxic Lobby Veteran', 'The Grass-Allergic Grinder', 'Permanent Ranked Resident', 'Hours Over Happiness Champion'],
};

const CATEGORY: Record<string, string> = {
  github: 'code', gitlab: 'code', codeberg: 'code', stackoverflow: 'code', npm: 'code', crates: 'code', huggingface: 'code', dockerhub: 'code',
  leetcode: 'compete', codeforces: 'compete', atcoder: 'compete', codewars: 'compete', monkeytype: 'compete',
  hackernews: 'social', lobsters: 'social', devto: 'social', hashnode: 'social', medium: 'social', bluesky: 'social', mastodon: 'social', reddit: 'social', wikipedia: 'social',
  letterboxd: 'culture', myanimelist: 'culture', anilist: 'culture', lastfm: 'culture', discogs: 'culture', openlibrary: 'culture',
  steam: 'games', chesscom: 'games', lichess: 'games', duolingo: 'games', speedrun: 'games', showdown: 'games',
};

const STAT_JABS = [
  (l: string, v: string, p: string) => `${v} ${l.toLowerCase()} on ${p}. Somewhere, a therapist just raised their rates.`,
  (l: string, v: string, p: string) => `Your ${p} ${l.toLowerCase()} sits at ${v}, which is less a number and more a cry for help.`,
  (l: string, v: string, p: string) => `${l}: ${v}. You did that on purpose, on ${p}, in front of everyone.`,
  (l: string, v: string, p: string) => `We looked at ${v} ${l.toLowerCase()} on ${p} and had to sit down for a minute.`,
];

const FACT_JABS = [
  (f: string) => `The receipts say: ${f} No notes. Actually, many notes.`,
  (f: string) => `${f} You could have done anything else with that time. Anything.`,
  (f: string) => `Exhibit B: ${f} The prosecution rests, mostly out of exhaustion.`,
  (f: string) => `${f} That is not a hobby, that is a pattern.`,
];

export function offlineRoast(profiles: Profile[], extra?: string): Roast {
  const main = profiles[0];
  const rnd = seeded(profiles.map((p) => p.platform + p.handle).join('|') || extra || 'cooked');
  const pick = <T,>(xs: T[]) => xs[rnd(xs.length)];
  const name = main?.displayName || 'You';
  const cat = CATEGORY[main?.platform] || 'social';

  // Rotate through the jab templates so no template repeats until all are used
  let si = rnd(STAT_JABS.length);
  let fi = rnd(FACT_JABS.length);
  const statLines = profiles.flatMap((p) => p.stats.slice(0, 2).map((s) => STAT_JABS[si++ % STAT_JABS.length](s.label, String(s.value), p.platformName)));
  // Neutral facts (company, website, bio echo) make weak jokes, keep the ones with numbers or quotes
  const juicy = profiles.flatMap((p) => p.facts).filter((f) => /\d|"/.test(f) && !/^(Company|Website|Organization|Bio|Job title):/.test(f));
  const factLines = juicy.slice(0, 4).map((f) => FACT_JABS[fi++ % FACT_JABS.length](f));
  const bio = profiles.find((p) => p.bio)?.bio;

  const paragraphs = [
    bio
      ? `Your bio says "${bio.slice(0, 160)}". Bold of you to write fiction and file it under "about me". ${statLines[0] ?? ''}`
      : `${name} could not even be bothered to write a bio, which is honestly the most relatable thing here. ${statLines[0] ?? ''}`,
    [statLines[1], factLines[0], statLines[2]].filter(Boolean).join(' ') || 'The data is so thin it needs a jacket. Even the algorithm forgot you exist.',
    [factLines[1], statLines[3], factLines[2]].filter(Boolean).join(' ') ||
      (extra ? `You also sent us this: "${extra.slice(0, 160)}". We read it twice. It did not get better.` : 'Log off, drink water, call your mother.'),
  ];

  const top = main?.stats[0];
  const verdict = top
    ? `${name} has ${top.value} ${top.label.toLowerCase()} on ${main.platformName} and is somehow treating that as a personality.`
    : `${name} handed us almost nothing, and still managed to be cooked.`;
  const flags = [
    ...juicy.slice(0, 3).map((f) => f.replace(/\.$/, '').slice(0, 90)),
    'Thinks this roast was written by a person who cares',
    'Will screenshot this and pretend it is a flex',
  ].slice(0, 4);

  return {
    title: pick(TITLES[cat] || TITLES.social),
    verdict,
    score: 62 + rnd(34),
    paragraphs,
    redFlags: flags,
    greenFlag: 'At least you showed up to be judged, which is more self-awareness than your profile suggests.',
    meters: METER_LABELS.map((label) => ({ label, value: 45 + rnd(55) })),
    shareQuote: 'I asked to be roasted and the robot did not even need the AI.',
    badge: pick(['Certified Cooked', 'Well Done, Not In A Good Way', 'Extra Crispy Achiever', 'Burnt Offering']),
    engine: 'offline',
  };
}

function offlineBattle(a: Profile, b: Profile): BattleResult {
  const ra = offlineRoast([a]);
  const rb = offlineRoast([b]);
  const winner = ra.score <= rb.score ? 0 : 1;
  return {
    headline: `${a.displayName} (${a.platformName}) vs ${b.displayName} (${b.platformName})`,
    rounds: [
      { topic: 'Opening stats', left: ra.paragraphs[0], right: rb.paragraphs[0], winner },
      { topic: 'The receipts', left: ra.paragraphs[1], right: rb.paragraphs[1], winner },
      { topic: 'Closing argument', left: ra.verdict, right: rb.verdict, winner },
    ],
    winnerIndex: winner,
    finalBlow: `${winner === 0 ? b.displayName : a.displayName}, you lost a roast battle to someone with ${winner === 0 ? a.stats[0]?.value ?? 'nothing' : b.stats[0]?.value ?? 'nothing'} ${(winner === 0 ? a.stats[0]?.label : b.stats[0]?.label)?.toLowerCase() ?? ''}. Sit with that.`,
    scores: [ra.score, rb.score],
    engine: 'offline',
  };
}
