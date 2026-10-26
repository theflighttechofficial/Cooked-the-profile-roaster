import { Flame, Github, ImageUp, Layers, Loader2, Plus, Swords, Trash2, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConnectorInfo, Heat, Persona, Profile, Roast } from '../shared/types.ts';
import { BattleMode } from './components/BattleMode.tsx';
import { ConnectorGrid } from './components/ConnectorGrid.tsx';
import { ProfileAdder } from './components/ProfileAdder.tsx';
import { Avatar, ProfileCard } from './components/ProfileCard.tsx';
import { RoastCard } from './components/RoastCard.tsx';
import { RoastControls } from './components/RoastControls.tsx';
import { ScreenshotMode } from './components/ScreenshotMode.tsx';
import { api } from './lib/api.ts';
import { doneness } from './lib/ui.ts';

type Mode = 'roast' | 'battle' | 'screenshot';
type Subject = Pick<Profile, 'displayName' | 'avatarUrl' | 'platformName'>;
interface Burn { roast: Roast; subjects: Subject[]; at: number }

const MAX_PLATE = 4;
const HISTORY_KEY = 'cooked.history.v3';

const COOKING_LINES = [
  'Preheating the oven…',
  'Reading every receipt…',
  'Counting the zero-star repos…',
  'Asking your followers for comment…',
  'Seasoning generously with facts…',
  'Plating the damage…',
];

function loadHistory(): Burn[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(h: Burn[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 8)));
  } catch {
    /* storage full or blocked */
  }
}

export default function App() {
  const [connectors, setConnectors] = useState<ConnectorInfo[]>([]);
  const [ai, setAi] = useState(false);
  const [bootError, setBootError] = useState('');
  const [mode, setMode] = useState<Mode>('roast');
  const [platform, setPlatform] = useState<ConnectorInfo>();
  const [plate, setPlate] = useState<Profile[]>([]);
  const [extra, setExtra] = useState('');
  const [showExtra, setShowExtra] = useState(false);
  const [persona, setPersona] = useState<Persona>('chef');
  const [heat, setHeat] = useState<Heat>('medium');
  const [cooking, setCooking] = useState(false);
  const [line, setLine] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Burn | null>(null);
  const [history, setHistory] = useState<Burn[]>(loadHistory);
  const studio = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .connectors()
      .then((r) => {
        setConnectors(r.connectors);
        setAi(r.ai);
        setPlatform(r.connectors.find((c) => c.id === 'github') ?? r.connectors[0]);
      })
      .catch((e) => setBootError(e.message));
  }, []);

  useEffect(() => {
    if (!cooking) return;
    const t = setInterval(() => setLine((l) => (l + 1) % COOKING_LINES.length), 1400);
    return () => clearInterval(t);
  }, [cooking]);

  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [result]);

  const byId = useMemo(() => new Map(connectors.map((c) => [c.id, c])), [connectors]);

  const addToPlate = (p: Profile) =>
    setPlate((cur) => (cur.some((x) => x.platform === p.platform && x.handle.toLowerCase() === p.handle.toLowerCase()) ? cur : [...cur, p].slice(0, MAX_PLATE)));

  const finish = (roast: Roast, subjects: Subject[]) => {
    const burn = { roast, subjects, at: Date.now() };
    setResult(burn);
    setHistory((h) => {
      const next = [burn, ...h].slice(0, 8);
      saveHistory(next);
      return next;
    });
  };

  const cook = async () => {
    setCooking(true);
    setLine(0);
    setError('');
    try {
      const roast = await api.roast(plate, persona, heat, extra);
      const subjects: Subject[] = plate.length ? plate : [{ displayName: 'You', platformName: 'Pasted bio' }];
      finish(roast, subjects);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCooking(false);
    }
  };

  const pickConnector = (c: ConnectorInfo) => {
    setPlatform(c);
    setMode('roast');
    setResult(null);
    studio.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const reset = () => {
    setResult(null);
    setPlate([]);
    setExtra('');
    studio.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const controls = <RoastControls persona={persona} heat={heat} onPersona={setPersona} onHeat={setHeat} />;
  const canCook = plate.length > 0 || extra.trim().length >= 20;

  const tabs: { id: Mode; label: string; icon: typeof Flame }[] = [
    { id: 'roast', label: 'Roast', icon: Flame },
    { id: 'battle', label: 'Battle', icon: Swords },
    { id: 'screenshot', label: 'Screenshot', icon: ImageUp },
  ];

  return (
    <div className="min-h-screen overflow-x-clip">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-char/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <a href="#" className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
            <Flame className="animate-flicker size-6 fill-ember text-ember" /> cooked<span className="-ml-1.5 text-ember">.</span>
          </a>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <a href="#platforms" className="hidden rounded-full px-3 py-1.5 text-dust hover:text-cream sm:block">Platforms</a>
            <a href="#how" className="hidden rounded-full px-3 py-1.5 text-dust hover:text-cream sm:block">How it works</a>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] ${ai ? 'border-mint/30 text-mint' : 'border-flame/30 text-flame'}`} title={ai ? 'Gemini is connected' : 'No GEMINI_API_KEY: using template roasts'}>
              <span className={`size-1.5 rounded-full ${ai ? 'bg-mint' : 'bg-flame'}`} /> {ai ? 'AI live' : 'offline mode'}
            </span>
            <a href="https://github.com/theflighttechofficial/Cooked-the-profile-roaster" target="_blank" rel="noreferrer" aria-label="Source on GitHub" className="rounded-full p-2 text-dust hover:text-cream">
              <Github className="size-5" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero + studio */}
      <header className="relative">
        <div className="ember-bg pointer-events-none absolute inset-x-0 top-0 h-[38rem]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:px-6 sm:pt-24">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-soot/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-dust">
            <Zap className="size-3.5 text-flame" /> {connectors.length || 34} live connectors · public data only
          </p>
          <h1 className="max-w-4xl font-display text-[clamp(2.75rem,8vw,6.5rem)] font-extrabold leading-[0.9] tracking-[-0.035em]">
            Get roasted by <span className="text-fire">your own data.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/75 sm:text-xl">
            Drop a username. We pull your real stats from GitHub, LeetCode, Steam, Letterboxd, Bluesky and 29 more, then hand them to an AI with zero chill.
          </p>
        </div>

        {connectors.length > 0 && (
          <div className="relative overflow-hidden border-y border-white/5 bg-soot/50 py-3" aria-hidden>
            <div className="animate-marquee flex w-max gap-8 whitespace-nowrap font-display text-lg font-bold text-dust/60">
              {[...connectors, ...connectors].map((c, i) => (
                <span key={i} className="flex items-center gap-8">
                  {c.name} <Flame className="size-4 text-ember/50" />
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      <main>
        <section ref={studio} id="studio" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6">
          {bootError && (
            <p className="mb-6 rounded-2xl border border-chili/30 bg-chili/10 p-4 text-sm" role="alert">{bootError}</p>
          )}

          <div role="tablist" className="mb-8 inline-flex rounded-full border border-white/10 bg-soot p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => { setMode(id); setResult(null); }}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 ${mode === id ? 'bg-cream text-char' : 'text-dust hover:text-cream'}`}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          {result ? (
            <div ref={resultRef} className="scroll-mt-24">
              <RoastCard roast={result.roast} subjects={result.subjects} onReset={reset} />
            </div>
          ) : mode === 'battle' ? (
            <BattleMode connectors={connectors} defaultPlatform={platform} persona={persona} heat={heat} controls={controls} />
          ) : mode === 'screenshot' ? (
            <ScreenshotMode persona={persona} heat={heat} ai={ai} controls={controls} onRoast={(r) => finish(r, [{ displayName: 'Your screenshot', platformName: 'Screenshot' }])} />
          ) : (
            <div className="space-y-8">
              <div>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-2xl font-bold sm:text-3xl">Build your plate</h2>
                  <p className="font-mono text-xs text-dust">
                    <Layers className="mr-1 inline size-3.5" /> {plate.length}/{MAX_PLATE} profiles · mix platforms for a cross-examination
                  </p>
                </div>
                <ProfileAdder
                  connectors={connectors}
                  platform={platform}
                  onPlatform={setPlatform}
                  onAdd={addToPlate}
                  disabled={plate.length >= MAX_PLATE}
                  cta={plate.length ? 'Add' : 'Fetch'}
                />
              </div>

              {plate.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {plate.map((p, i) => (
                    <ProfileCard key={`${p.platform}:${p.handle}`} p={p} connector={byId.get(p.platform)} onRemove={() => setPlate((cur) => cur.filter((_, j) => j !== i))} />
                  ))}
                </div>
              )}

              <div>
                {showExtra ? (
                  <label className="block">
                    <span className="mb-2 block font-mono text-[11px] uppercase tracking-[0.2em] text-dust">Paste anything else: LinkedIn about, resume, dating bio</span>
                    <textarea
                      value={extra}
                      onChange={(e) => setExtra(e.target.value)}
                      maxLength={6000}
                      rows={5}
                      placeholder="Results-driven synergy architect passionate about leveraging…"
                      className="w-full resize-y rounded-3xl border border-white/10 bg-soot p-5 text-sm outline-none placeholder:text-dust/60 focus:border-ember/60"
                    />
                  </label>
                ) : (
                  <button onClick={() => setShowExtra(true)} className="inline-flex items-center gap-2 text-sm text-dust hover:text-cream">
                    <Plus className="size-4" /> Add text the APIs can't see (LinkedIn about, resume, dating bio)
                  </button>
                )}
              </div>

              {controls}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={cook}
                  disabled={!canCook || cooking}
                  className="bg-fire glow inline-flex h-16 items-center gap-3 rounded-full px-10 font-display text-xl font-extrabold text-char transition hover:scale-[1.02] hover:brightness-110 active:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100"
                >
                  {cooking ? <Loader2 className="size-6 animate-spin" /> : <Flame className="size-6" />}
                  {cooking ? COOKING_LINES[line] : plate.length > 1 ? `Cook all ${plate.length}` : 'Cook me'}
                </button>
                {!canCook && <p className="text-sm text-dust">Fetch a profile first, or paste 20+ characters of text.</p>}
                {error && <p className="text-sm text-[#ff8a7a]" role="alert">{error}</p>}
              </div>
            </div>
          )}
        </section>

        {history.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <div className="mb-5 flex items-baseline justify-between">
              <h2 className="font-display text-3xl font-bold">Recent burns</h2>
              <button onClick={() => { setHistory([]); saveHistory([]); }} className="inline-flex items-center gap-1.5 text-sm text-dust hover:text-cream">
                <Trash2 className="size-4" /> Clear
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {history.map((b) => (
                <button
                  key={b.at}
                  onClick={() => { setResult(b); studio.current?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="card flex flex-col gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20"
                >
                  <div className="flex items-center gap-2">
                    <Avatar src={b.subjects[0]?.avatarUrl} name={b.subjects[0]?.displayName || '?'} size={32} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{b.subjects.map((s) => s.displayName).join(' + ')}</span>
                    <span className="font-mono text-xs" style={{ color: doneness(b.roast.score).color }}>{b.roast.score}%</span>
                  </div>
                  <p className="line-clamp-2 font-display font-bold leading-snug">{b.roast.title}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">How the kitchen works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['01', 'Real connectors', 'Every platform is read through its official public API or public feed: GitHub REST, LeetCode GraphQL, Bluesky XRPC, Steam community XML, Letterboxd RSS and so on. No logins, no scraping behind walls.'],
              ['02', 'Receipts, not vibes', 'Each connector turns raw data into stats and facts: zero-star repos, dropped anime, 3 AM commits, downvoted comments. The AI only sees those facts and is told not to invent any.'],
              ['03', 'Served hot', 'Gemini writes the roast in the voice you picked. No API key? An offline roaster still cooks from your real numbers. Save it as an image, share it, or have your browser read it out.'],
            ].map(([n, t, d]) => (
              <div key={n} className="card p-6">
                <span className="text-fire font-display text-4xl font-extrabold">{n}</span>
                <h3 className="mt-3 font-display text-xl font-bold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-dust">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="platforms" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              {connectors.length} ways to <span className="text-fire">get humbled</span>
            </h2>
            <p className="max-w-sm text-sm text-dust">Click any platform to start. Ones marked "needs key" light up once the server owner adds a free API key.</p>
          </div>
          <ConnectorGrid connectors={connectors} onPick={pickConnector} />
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-dust sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-display text-lg font-extrabold text-cream">cooked<span className="text-ember">.</span></p>
          <p>Roasts are jokes built from public data. Be nice to the people you roast. Mostly.</p>
        </div>
      </footer>
    </div>
  );
}
