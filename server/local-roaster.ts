// Local roast engine. Runs with no network and no API key, so a roast always comes back:
// it is the last step after Gemini and (optionally) Ollama. It reads the same Profile data
// the AI gets, finds "signals" in the stats and facts, and writes in the chosen persona and heat.
import type { BattleResult, Heat, Persona, Profile, Roast } from '../shared/types.ts';

export const METER_LABELS = ['Delusion', 'Touch grass urgency', 'Main character energy', 'Chronically online', 'Cringe'];

// ---------- helpers ----------

type Rng = (n: number) => number;

function seeded(seed: string): Rng {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (n: number) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) % Math.max(1, n);
  };
}

/** Picks without repeating until the list is used up. */
function picker(rnd: Rng) {
  const used = new Map<unknown, Set<number>>();
  return <T,>(xs: T[]): T => {
    const seen = used.get(xs) ?? new Set<number>();
    if (seen.size >= xs.length) seen.clear();
    let i = rnd(xs.length);
    while (seen.has(i)) i = (i + 1) % xs.length;
    seen.add(i);
    used.set(xs, seen);
    return xs[i];
  };
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const fill = (t: string, vars: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

/** "1.2K" -> 1200, "30.8B" -> 3.08e10, "64%" -> 64, "120 wpm" -> 120. NaN when no number. */
export function parseNum(v: string | number): number {
  if (typeof v === 'number') return v;
  const m = String(v).replace(/,/g, '').match(/(-?\d+(?:\.\d+)?)\s*([kmb])?/i);
  if (!m) return NaN;
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[(m[2] || '').toLowerCase() as 'k' | 'm' | 'b'] ?? 1;
  return Number(m[1]) * mult;
}

// ---------- signals ----------

type Angle = 'clout' | 'output' | 'time' | 'skill' | 'abandon' | 'following';
type Level = 'low' | 'mid' | 'high';

interface Signal {
  angle: Angle;
  level: Level;
  label: string;
  value: string;
  platform: string;
  /** How embarrassing, 0-3. Drives the score and battle rounds. */
  weight: number;
}

const ANGLE_RULES: [Angle, RegExp][] = [
  ['abandon', /dropped|never played|under 50|stale|still 0\.x|no desc/i],
  ['following', /^following$/i],
  ['clout', /follower|karma|reputation|likes|stars|downloads|dl\b|pulls|honor|xp|reactions|friend of|contribution|gold|silver|bronze/i],
  ['time', /hours|days|time|streak|scrobble|episodes|chapters|films|games|edits|tests|entries|collection|watched|read/i],
  ['skill', /rating|elo|rank|solved|pb|wpm|win rate|easy|medium|hard|perf|accepted|record|puzzle|kata|world records|best/i],
  ['output', /repos|projects|packages|crates|images|models|datasets|spaces|articles|posts|stories|items|gists|formats|lists|courses|languages|contests|pbs/i],
];

const HIGH: Record<Angle, number> = { clout: 1000, output: 30, time: 300, skill: 1800, abandon: 5, following: 500 };
const LOW: Record<Angle, number> = { clout: 20, output: 3, time: 10, skill: 1000, abandon: 0, following: 10 };

// Some stat labels read badly as "<value> <label>". Rewrite them as noun phrases.
const NICE_LABELS: [RegExp, string][] = [
  [/^still 0\.x$/i, 'packages still stuck below 1.0'],
  [/^never played$/i, 'games never launched'],
  [/^under 50 dl\/mo$/i, 'packages under 50 downloads a month'],
  [/^stale > 1yr$/i, 'images nobody touched in a year'],
  [/^hours \(2 wks\)$/i, 'hours in the last two weeks'],
  [/^talk edits.*$/i, 'recent talk-page edits'],
  [/^(\d+)s pb$/i, 'in the $1-second typing test'],
  [/^wins$/i, 'wins'],
];
const niceLabel = (label: string) => {
  for (const [re, nice] of NICE_LABELS) if (re.test(label)) return label.replace(re, nice);
  return label;
};

function signalsFor(p: Profile): Signal[] {
  const out: Signal[] = [];
  for (const s of p.stats) {
    const n = parseNum(s.value);
    if (Number.isNaN(n)) continue;
    const angle = ANGLE_RULES.find(([, re]) => re.test(s.label))?.[0];
    if (!angle) continue;
    // Percent stats (win rate, acceptance) use a 0-100 scale
    const pct = /%/.test(String(s.value));
    const hi = pct ? 60 : HIGH[angle];
    const lo = pct ? 40 : LOW[angle];
    const level: Level = n >= hi ? 'high' : n <= lo ? 'low' : 'mid';
    let weight = 1;
    if (angle === 'abandon') weight = n > 0 ? 3 : 0;
    else if (angle === 'clout' || angle === 'skill') weight = level === 'low' ? 3 : level === 'mid' ? 2 : 1;
    else if (angle === 'time') weight = level === 'high' ? 3 : level === 'mid' ? 1 : 2;
    else if (angle === 'output') weight = level === 'high' ? 2 : level === 'low' ? 2 : 1;
    else if (angle === 'following') weight = level === 'high' ? 2 : 1;
    out.push({ angle, level, label: niceLabel(s.label), value: String(s.value), platform: p.platformName, weight });
  }
  return out;
}

// ---------- persona voice ----------

interface Voice {
  openers: string[];
  closers: string[];
  softeners: string[];
  scorchers: string[];
  verdicts: string[];
  greenFlags: string[];
  quotes: string[];
  transform?: (s: string) => string;
}

const bardify = (s: string) =>
  s
    .replace(/\byou are\b/g, 'thou art').replace(/\bYou are\b/g, 'Thou art')
    .replace(/\byou have\b/g, 'thou hast').replace(/\bYou have\b/g, 'Thou hast')
    .replace(/\byour\b/g, 'thy').replace(/\bYour\b/g, 'Thy')
    .replace(/\bYou\b/g, 'Thou')
    // "you" starting a clause is the subject (thou); anywhere else it is the object (thee)
    .replace(/(^|[.!?:]\s+|,\s+(?:and\s+)?|\band\s+)you\b/g, '$1thou')
    .replace(/\byou\b/g, 'thee');

const VOICES: Record<Persona, Voice> = {
  chef: {
    openers: ['Right. Let me taste this.', 'Oh, come here. Look at this plate.', 'Service! What is THIS?', 'I asked for a profile and you served me a crime scene.'],
    closers: ["It's RAW.", 'Get out of my kitchen.', 'Absolutely bland.', 'My gran could do better, and she is dead.', 'Shut it down.'],
    softeners: ['Look, there is potential here, buried deep.', 'I have seen worse. Not often.'],
    scorchers: ['This is so undercooked it is still mooing.', 'I would not feed this to the bin.'],
    verdicts: ['{name} served {value} {label} on {platform} and called it a meal.', '{name}: {value} {label} on {platform}. Raw, bland and somehow still burnt.'],
    greenFlags: ['The garnish is nice. The garnish is the only thing on the plate, but it is nice.', 'You turned up to the kitchen. That is more than the data suggested.'],
    quotes: ['Chef said my profile was raw and I took it as a compliment.', 'I got kicked out of the kitchen by a roast bot.'],
  },
  techlead: {
    openers: ['Per my last review:', 'Leaving some comments before I approve nothing.', 'Quick sync on your profile. This will not be quick.', 'Flagging a few concerns. All of them, actually.'],
    closers: ['Requesting changes.', 'Let us take this offline. Forever.', 'Blocking until further notice.', 'Adding this to the tech debt backlog.', 'Not a blocker, but it is a blocker.'],
    softeners: ['Nit, non-blocking, mostly.', 'Overall direction is fine. The execution is the problem.'],
    scorchers: ['I would revert this profile if git let me.', 'This would not pass lint, review or a vibe check.'],
    verdicts: ['{name} shipped {value} {label} on {platform} with zero tests and full confidence.', 'Root cause analysis: {name}, {value} {label}, {platform}.'],
    greenFlags: ['At least the profile compiles. Barely.', 'Your consistency is admirable. Consistently concerning, but admirable.'],
    quotes: ['My profile got a "request changes" from a roast bot.', 'Per my last message: I am cooked.'],
  },
  genz: {
    openers: ['ok bestie we need to talk.', 'not me opening this profile and screaming.', 'the way i gasped.', 'be so fr right now.'],
    closers: ['no cap.', "it's giving unemployed.", 'the audacity.', 'touch grass immediately.', "delulu is not the solulu here."],
    softeners: ['lowkey kind of iconic tho.', "ngl it's a little bit slay."],
    scorchers: ['this is a crime and i am calling the fbi.', 'ratio + L + cooked.'],
    verdicts: ['{name} really said {value} {label} on {platform} and thought it ate.', '{value} {label} on {platform}?? {name} is so delulu.'],
    greenFlags: ['ok the confidence is kinda giving main character, respect.', 'at least ur consistent. consistently cooked but still.'],
    quotes: ['the roast bot said it was giving unemployed and honestly fair.', 'got cooked by an app, not my era.'],
    transform: (s) => s.toLowerCase(),
  },
  parent: {
    openers: ['Sit down. We need to talk.', 'I am not angry. I am disappointed.', 'Your cousin called. He is a doctor now. Anyway, about you.', 'This is what I paid for school for?'],
    closers: ['Your cousin is a doctor.', 'I did not raise you for this.', 'What will I tell the neighbours?', 'Go and eat something. Then fix your life.', 'I am telling your father.'],
    softeners: ['I still love you. Less today.', 'At least you are healthy. Are you healthy? Go outside.'],
    scorchers: ['I am taking you out of the family group chat.', 'Even the neighbour\'s son has more stars, and he is a goat farmer.'],
    verdicts: ['{value} {label} on {platform}. {name}, this is why we do not talk at weddings.', '{name} has {value} {label} on {platform} and still no proper job.'],
    greenFlags: ['You eat regularly, I hope. That is something.', 'At least you are not on drugs. You are on {platform}, which is worse.'],
    quotes: ['My mum saw my profile and called my cousin the doctor for comfort.', 'I did not raise myself for this.'],
  },
  bard: {
    openers: ['Hark! What wretched profile through yonder window breaks?', 'Gather round, good people, and witness this tragedy.', 'Lo, a fool doth approach the stage.', 'Prithee, hear the sorry tale.'],
    closers: ['Thus doth the data speak.', 'Exit, pursued by shame.', 'A plague upon thy stats.', 'Alas, poor profile, I knew it well.'],
    softeners: ['Yet even fools have their charm, in candlelight.', 'There is some honour here, albeit small.'],
    scorchers: ['Thou art a boil, a plague sore, an embossed carbuncle of a profile.', 'More of thy stats I would not hear, lest mine ears bleed.'],
    verdicts: ['{name}, keeper of {value} {label} upon {platform}, a fool most profound.', 'Upon {platform} dwelleth {name}, with {value} {label} and no shame.'],
    greenFlags: ['Thou art brave to show thy face upon the stage.', 'Thy persistence, at least, would make a sonnet.'],
    quotes: ['A bard roasted me in iambic pentameter and I deserved it.', 'Exit, pursued by a roast bot.'],
    transform: bardify,
  },
  therapist: {
    openers: ['Let us sit with this for a moment.', 'Thank you for sharing your profile with me.', 'This is a safe space. Mostly.', 'I want to validate what I am seeing here.'],
    closers: ['And how does that make you feel?', 'We will unpack that next session.', 'That is a lot to process.', 'I am going to need to see you twice a week.'],
    softeners: ['You are doing your best. Your best is just very specific.', 'Growth is not linear. Yours is not even visible.'],
    scorchers: ['I am referring you to a specialist. And a second specialist.', 'Even my own therapist would need a minute after this.'],
    verdicts: ['It sounds like {value} {label} on {platform} is carrying a lot for you, {name}.', '{name}, let us talk about the {value} {label} on {platform}. Gently.'],
    greenFlags: ['You showed up and asked for feedback. That takes courage, or poor judgement.', 'Your self-awareness is growing. Slowly. Like a houseplant in a cupboard.'],
    quotes: ['My therapist and a roast bot agree on me now.', 'And how does being this cooked make me feel? Seen.'],
  },
};

// ---------- angle jabs ----------

const JABS: Record<Angle, Record<Level, string[]>> = {
  clout: {
    low: ['{value} {label} on {platform}. Your mum follows you out of pity, and even she muted you.', 'With {value} {label} on {platform}, you are not under the radar. You are under the floor.'],
    mid: ['{value} {label} on {platform}: enough to feel famous, not enough for anyone to notice.', '{value} {label} on {platform} is the internet equivalent of a polite nod.'],
    high: ['{value} {label} on {platform}, and you still post like nobody is watching. They are. They are concerned.', 'You farmed {value} {label} on {platform}. That is not a hobby, that is a second job with no salary.'],
  },
  output: {
    low: ['{value} {label} on {platform}. Ambitious of you to call that a portfolio.', 'Only {value} {label} on {platform}. The bar was on the floor and you brought a shovel.'],
    mid: ['{value} {label} on {platform}, each one started with great energy and left with a commit message that says "wip".', '{value} {label} on {platform}. Quantity is fine. Quality has filed a missing persons report.'],
    high: ['{value} {label} on {platform}. You do not finish things, you collect beginnings.', 'You have {value} {label} on {platform}. Most people have hobbies. You have a hoarding problem.'],
  },
  time: {
    low: ['{value} {label} on {platform}. You signed up, panicked, and left. Relatable, honestly.', 'Only {value} {label} on {platform}: commitment issues, but make it data.'],
    mid: ['{value} {label} on {platform}. Not enough to be good, too much to be healthy.', '{value} {label} on {platform}, which explains why your houseplants are dead.'],
    high: ['{value} {label} on {platform}. Sunlight has filed a restraining order against you.', 'You put {value} {label} into {platform}. That time had a family. That time had dreams.'],
  },
  skill: {
    low: ['{value} {label} on {platform}. Confidence of a grandmaster, results of a toaster.', '{label}: {value} on {platform}. Your opponents send you thank-you cards.'],
    mid: ['{value} {label} on {platform}: firmly, permanently, aggressively average.', 'A {label} of {value} on {platform}. Good enough to brag, not good enough to be right.'],
    high: ['{value} {label} on {platform}. Impressive, and the only thing you have ever finished.', 'A {label} of {value} on {platform}. You are elite at something nobody at dinner wants to hear about.'],
  },
  abandon: {
    low: ['Zero {label} on {platform}. Suspiciously clean. What are you hiding?', 'No {label} on {platform}. Either discipline, or you never started anything.'],
    mid: ['{value} {label} on {platform}. You quit things the way other people blink.', '{value} {label} on {platform}: a graveyard with a nice font.'],
    high: ['{value} {label} on {platform}. You do not have a backlog, you have a landfill.', '{value} {label} on {platform}. Starting is your cardio. Finishing is a myth.'],
  },
  following: {
    low: ['You follow {value} accounts on {platform}. Mysterious, or nobody interesting exists to you.', 'Following just {value} on {platform}: gatekeeping your own feed.'],
    mid: ['Following {value} on {platform}: a curated feed of people who do not follow you back.', '{value} follows on {platform}, and you still say there is nothing to watch.'],
    high: ['You follow {value} accounts on {platform}. That is not a feed, that is a cry for attention.', 'Following {value} on {platform}. You are the audience everyone else is posting for.'],
  },
};

// Used when the data runs out before the third paragraph does
const FILLERS: Record<string, string[]> = {
  code: ['Somewhere a recruiter opened this profile, sighed, and closed the laptop.', 'Your commit history reads like a diary nobody should find.'],
  compete: ['You know six graph algorithms and zero of your neighbours.', 'Every contest you enter makes someone else feel better about themselves.'],
  social: ['You post like the algorithm owes you money.', 'Your notifications are quieter than a library at 3 AM.'],
  culture: ['Your taste is a personality you bought in instalments.', 'You have opinions about things you have not finished.'],
  games: ['The loading screen has seen more of your life than your friends have.', 'Your save files have better character development than you.'],
  text: ['You wrote this about yourself, on purpose, and pressed publish.', 'Somewhere a hiring manager read this and booked a holiday instead.'],
};

const FACT_FRAMES = [
  'The receipts say: {fact}',
  '{fact} No notes. Many notes.',
  'Exhibit B: {fact}',
  '{fact} That is not a quirk, that is a pattern.',
  'And then there is this: {fact}',
  '{fact} You could have done anything else with that time.',
];

const TITLES: Record<string, Partial<Record<Angle, string[]>> & { default: string[] }> = {
  code: {
    abandon: ['Senior Side-Project Abandoner', 'The Serial Repo Starter'],
    clout: ['The Unstarred Visionary', 'Open Source, Closed Audience'],
    output: ['The Prolific Nobody', 'Chief Repo Hoarder'],
    default: ['The README-Driven Developer', 'Staff Engineer of Nothing'],
  },
  compete: {
    skill: ['Grandmaster of Wrong Answer', 'The Midnight Rating Chaser'],
    time: ['The Algorithm Goblin', 'Professional Edge-Case Victim'],
    default: ['The Leaderboard Lurker', 'Time Limit Exceeded, In Life'],
  },
  social: {
    clout: ['Thought Leader of Nobody', 'The Engagement Farmer'],
    time: ['Certified Terminally Online', 'The Reply Guy Emeritus'],
    default: ['Professional Opinion Haver', 'The Comment Section Regular'],
  },
  culture: {
    abandon: ['Professional Backlog Builder', 'The Dropped-It Connoisseur'],
    time: ['The Taste Gatekeeper', 'Certified Main Character'],
    default: ['The Aesthetic Over Substance Curator', 'Letterboxd Lawyer'],
  },
  games: {
    time: ['The Grass-Allergic Grinder', 'Hours Over Happiness Champion'],
    skill: ['Permanent Ranked Resident', 'Toxic Lobby Veteran'],
    abandon: ['The Steam Sale Victim', 'Pile of Shame Curator'],
    default: ['Professional Respawner', 'The Unfinished Save File'],
  },
  text: { default: ['The Buzzword Alchemist', 'Synergy Overlord', 'The Self-Described Visionary'] },
};

const BADGES: Partial<Record<Angle, string[]>> & { default: string[] } = {
  abandon: ['Certified Quitter', 'Unfinished Business Award'],
  clout: ['Invisible Influencer', 'Zero-Reach Royalty'],
  time: ['Grass Avoidance Gold', 'Sunlight Allergy Club'],
  skill: ['Mid-Tier Legend', 'Almost Good Award'],
  output: ['Hoarder of the Year', 'Quantity Over Quality'],
  default: ['Certified Cooked', 'Extra Crispy Achiever', 'Well Done, Not In A Good Way'],
};

const CATEGORY: Record<string, string> = {
  github: 'code', gitlab: 'code', codeberg: 'code', stackoverflow: 'code', npm: 'code', crates: 'code', huggingface: 'code', dockerhub: 'code',
  leetcode: 'compete', codeforces: 'compete', atcoder: 'compete', codewars: 'compete', monkeytype: 'compete',
  hackernews: 'social', lobsters: 'social', devto: 'social', hashnode: 'social', medium: 'social', bluesky: 'social', mastodon: 'social', reddit: 'social', wikipedia: 'social',
  letterboxd: 'culture', myanimelist: 'culture', anilist: 'culture', lastfm: 'culture', discogs: 'culture', openlibrary: 'culture',
  steam: 'games', chesscom: 'games', lichess: 'games', duolingo: 'games', speedrun: 'games', showdown: 'games',
};

// ---------- pasted text (bios, resumes, OCR from screenshots) ----------

const BUZZWORDS = [
  'passionate', 'synergy', 'results-driven', 'thought leader', 'visionary', 'ninja', 'rockstar', 'guru', '10x', 'disruptive', 'innovative',
  'entrepreneur', 'serial entrepreneur', 'hustle', 'grind', 'crypto', 'web3', 'nft', 'blockchain', 'ai', 'growth mindset', 'leverage',
  'stakeholder', 'game-changer', 'game changer', 'self-starter', 'go-getter', 'detail-oriented', 'team player', 'dynamic', 'motivated',
  'storyteller', 'creator', 'influencer', 'coach', 'mentor', 'ceo', 'founder', 'speaker', 'humbled', 'excited to announce', 'open to work',
  'aspiring', 'enthusiast', 'lover', 'wanderlust', 'foodie', 'gym', 'grindset', 'alpha', 'mindset', 'manifest', 'vibes',
];

/** Turns free text into a pseudo profile, so the same engine can roast it. */
export function profileFromText(text: string, label = 'your bio'): Profile {
  const t = text.replace(/\s+/g, ' ').trim();
  const lowerT = t.toLowerCase();
  const found = BUZZWORDS.filter((w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(lowerT));
  const stats: Profile['stats'] = [];
  const re = /(\d[\d,.]*\s*[kKmMbB]?\+?)\s+([A-Za-z][A-Za-z ]{2,24}?)(?=[\s,.;:!|)]|$)/g;
  for (const m of t.matchAll(re)) {
    const label = m[2].trim().split(' ').slice(0, 3).join(' ');
    if (stats.length < 6 && !stats.some((s) => s.label.toLowerCase() === label.toLowerCase())) stats.push({ label, value: m[1].trim() });
  }
  const emojis = (t.match(/\p{Extended_Pictographic}/gu) || []).length;
  const hashtags = (t.match(/#\w+/g) || []).length;
  const bangs = (t.match(/!/g) || []).length;
  const words = t.split(' ').filter(Boolean).length;
  const facts: string[] = [];
  if (found.length) facts.push(`Uses the words ${found.slice(0, 6).map((w) => `"${w}"`).join(', ')} without irony.`);
  if (emojis > 3) facts.push(`Packs ${emojis} emojis into ${words} words.`);
  if (hashtags > 2) facts.push(`Uses ${hashtags} hashtags, as if anyone searches for them.`);
  if (bangs > 2) facts.push(`${bangs} exclamation marks. Calm down.`);
  if (words > 250) facts.push(`Wrote ${words} words about themselves. Nobody asked for the director's cut.`);
  if (words < 12) facts.push(`Wrote ${words} words in total. Mysterious, or just empty.`);
  const firstSentence = t.split(/(?<=[.!?])\s/)[0]?.slice(0, 200);
  return {
    platform: 'text',
    platformName: label,
    handle: 'you',
    displayName: 'You',
    profileUrl: '',
    bio: firstSentence,
    stats,
    lists: [],
    facts,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------- the roast ----------

interface Built {
  roast: Roast;
  signals: Signal[];
  lines: Partial<Record<Angle, string>>;
}

function build(profiles: Profile[], persona: Persona, heat: Heat, extra?: string, extraLabel?: string): Built {
  const all = [...profiles];
  if (extra && extra.trim().length >= 20) all.push(profileFromText(extra, extraLabel));
  const v = VOICES[persona] ?? VOICES.chef;
  const rnd = seeded(`${all.map((p) => p.platform + p.handle).join('|')}|${persona}|${heat}|${extra?.slice(0, 50) ?? ''}`);
  const pick = picker(rnd);
  const say = (s: string) => (v.transform ? v.transform(s) : s);
  const main = all[0];
  const name = main?.displayName || 'You';
  const category = main ? CATEGORY[main.platform] ?? (main.platform === 'text' ? 'text' : 'social') : 'social';

  const signals = all.flatMap(signalsFor).sort((a, b) => b.weight - a.weight);
  const juicy = all.flatMap((p) => p.facts).filter((f) => /\d|"/.test(f) && !/^(Company|Website|Organization|Job title):/.test(f));

  // One jab per angle, strongest signal first
  const lines: Partial<Record<Angle, string>> = {};
  const seenAngles = new Set<Angle>();
  const jabs: string[] = [];
  for (const s of signals) {
    if (seenAngles.has(s.angle)) continue;
    seenAngles.add(s.angle);
    const line = fill(pick(JABS[s.angle][s.level]), { value: s.value, label: lower(s.label), platform: s.platform });
    lines[s.angle] = line;
    jabs.push(line);
  }
  const factLines = juicy.slice(0, 4).map((f) => fill(pick(FACT_FRAMES), { fact: f }));

  const bio = all.find((p) => p.bio)?.bio;
  const bioLine = bio
    ? `Your bio says "${bio.slice(0, 140)}". Bold of you to file fiction under "about me".`
    : `${name} could not even write a bio, which is the most honest thing here.`;

  const cross =
    all.length > 1 && signals.length > 1
      ? `On ${all[0].platformName} you are one disaster, on ${all[1].platformName} you are a different disaster. Consistency, at last.`
      : '';

  const tone = heat === 'mild' ? pick(v.softeners) : heat === 'scorched' ? pick(v.scorchers) : '';

  const p1 = [pick(v.openers), bioLine, jabs[0]].filter(Boolean).join(' ');
  const p2 = [jabs[1], factLines[0], jabs[2], cross].filter(Boolean).join(' ') || `The data is so thin it needs a jacket. ${pick(v.closers)}`;
  const p3Body = [factLines[1], jabs[3], factLines[2]].filter(Boolean);
  if (p3Body.length === 0) p3Body.push(pick(FILLERS[category] ?? FILLERS.social));
  const p3 = [...p3Body, tone, pick(v.closers)].filter(Boolean).join(' ');

  const top = signals[0] ?? (main?.stats[0] ? { value: String(main.stats[0].value), label: main.stats[0].label, platform: main.platformName } : null);
  const verdict = top
    ? fill(pick(v.verdicts), { name, value: top.value, label: lower(top.label), platform: top.platform })
    : `${name} handed over almost nothing and still managed to be cooked.`;

  const severity = signals.reduce((s, x) => s + x.weight, 0) + juicy.length;
  const base = heat === 'mild' ? 42 : heat === 'scorched' ? 70 : 58;
  const score = clamp(base + Math.min(24, severity * 2) + rnd(7) - 3, 5, 99);

  const has = (a: Angle) => signals.find((s) => s.angle === a);
  const hiTime = has('time')?.level === 'high';
  const lowClout = has('clout')?.level === 'low';
  const hiOutput = has('output')?.level === 'high';
  const meterBase = heat === 'mild' ? 30 : heat === 'scorched' ? 55 : 42;
  const meters = METER_LABELS.map((label) => {
    let value = meterBase + rnd(20);
    if (label === 'Delusion' && (lowClout || hiOutput)) value += 25;
    if (label === 'Touch grass urgency' && hiTime) value += 30;
    if (label === 'Main character energy' && bio) value += 15;
    if (label === 'Chronically online' && (category === 'social' || hiTime)) value += 25;
    if (label === 'Cringe' && (category === 'text' || /emoji|exclamation|hashtag|without irony/.test(juicy.join(' ')))) value += 25;
    return { label, value: clamp(value, 5, 99) };
  });

  const flags = [
    ...signals.filter((s) => s.weight >= 2).slice(0, 3).map((s) => `${s.value} ${lower(s.label)} on ${s.platform}`),
    ...juicy.slice(0, 2).map((f) => f.replace(/\.$/, '').slice(0, 90)),
    'Asked a robot to judge them, for fun',
    'Will screenshot this and call it a flex',
    'Profile so empty it echoes',
    'Thinks lurking counts as a personality',
  ].slice(0, 4);

  const topAngle = signals[0]?.angle;
  const titleBank = TITLES[category] ?? TITLES.social;
  const title = pick((topAngle && titleBank[topAngle]) || titleBank.default);
  const badge = pick((topAngle && BADGES[topAngle]) || BADGES.default);

  const roast: Roast = {
    title,
    verdict: say(verdict),
    score,
    paragraphs: [p1, p2, p3].map(say),
    redFlags: flags.map(say),
    greenFlag: say(fill(pick(v.greenFlags), { platform: main?.platformName ?? 'the internet' })),
    meters,
    shareQuote: say(pick(v.quotes)),
    badge,
    engine: 'local',
  };
  return { roast, signals, lines };
}

/** extraLabel names where the pasted text came from, e.g. "your screenshot". */
export function localRoast(profiles: Profile[], persona: Persona, heat: Heat, extra?: string, extraLabel?: string): Roast {
  return build(profiles, persona, heat, extra, extraLabel).roast;
}

const ROUND_TOPICS: { angle: Angle; topic: string }[] = [
  { angle: 'clout', topic: 'Clout' },
  { angle: 'skill', topic: 'Skill issue' },
  { angle: 'time', topic: 'Time wasted' },
  { angle: 'output', topic: 'Output' },
  { angle: 'abandon', topic: 'Unfinished business' },
  { angle: 'following', topic: 'Who they follow' },
];

export function localBattle(a: Profile, b: Profile, persona: Persona, heat: Heat): BattleResult {
  const A = build([a], persona, heat);
  const B = build([b], persona, heat);
  const v = VOICES[persona] ?? VOICES.chef;
  const say = (s: string) => (v.transform ? v.transform(s) : s);
  const weightOf = (x: Built, angle: Angle) => x.signals.find((s) => s.angle === angle)?.weight ?? 0;

  // Rounds on angles both sides have, then on whatever is left, then the verdicts
  const shared = ROUND_TOPICS.filter((t) => A.lines[t.angle] && B.lines[t.angle]);
  const rounds: BattleResult['rounds'] = shared.slice(0, 3).map((t) => {
    const wa = weightOf(A, t.angle);
    const wb = weightOf(B, t.angle);
    return { topic: t.topic, left: say(A.lines[t.angle]!), right: say(B.lines[t.angle]!), winner: wa <= wb ? 0 : 1 };
  });
  const fallbackRounds = [
    { topic: 'Opening statement', left: A.roast.paragraphs[0], right: B.roast.paragraphs[0] },
    { topic: 'The receipts', left: A.roast.paragraphs[1], right: B.roast.paragraphs[1] },
    { topic: 'Closing argument', left: A.roast.verdict, right: B.roast.verdict },
  ];
  for (const r of fallbackRounds) {
    if (rounds.length >= 3) break;
    rounds.push({ ...r, winner: A.roast.score <= B.roast.score ? 0 : 1 });
  }

  // Lower cooked score survives; rounds break a tie
  const roundWins = rounds.filter((r) => r.winner === 0).length;
  const winnerIndex = A.roast.score !== B.roast.score ? (A.roast.score < B.roast.score ? 0 : 1) : roundWins * 2 >= rounds.length ? 0 : 1;
  const loser = winnerIndex === 0 ? b : a;
  const winner = winnerIndex === 0 ? a : b;
  const closer = v.closers[(A.roast.score + B.roast.score) % v.closers.length];

  return {
    headline: say(`${a.displayName} (${a.platformName}) vs ${b.displayName} (${b.platformName})`),
    rounds,
    winnerIndex,
    finalBlow: say(`${loser.displayName}, you lost a roast battle to ${winner.displayName}. Sit with that. ${closer}`),
    scores: [A.roast.score, B.roast.score],
    engine: 'local',
  };
}
