import { Crown, Loader2, RotateCcw, Swords } from 'lucide-react';
import { useState } from 'react';
import type { BattleResult, ConnectorInfo, Heat, Persona, Profile } from '../../shared/types.ts';
import { api } from '../lib/api.ts';
import { ProfileAdder } from './ProfileAdder.tsx';
import { Avatar, ProfileCard } from './ProfileCard.tsx';
import { ScoreDial } from './ScoreDial.tsx';

interface Props {
  connectors: ConnectorInfo[];
  defaultPlatform?: ConnectorInfo;
  persona: Persona;
  heat: Heat;
  controls: React.ReactNode;
}

export function BattleMode({ connectors, defaultPlatform, persona, heat, controls }: Props) {
  const [sides, setSides] = useState<(Profile | null)[]>([null, null]);
  const [platforms, setPlatforms] = useState<(ConnectorInfo | undefined)[]>([defaultPlatform, defaultPlatform]);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const byId = (id: string) => connectors.find((c) => c.id === id);

  const set = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));

  const fight = async () => {
    const [a, b] = sides;
    if (!a || !b) return;
    setLoading(true);
    setError('');
    try {
      setResult(await api.battle(a, b, persona, heat));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (result && sides[0] && sides[1]) {
    const [a, b] = sides as Profile[];
    const people = [a, b];
    return (
      <section className="animate-rise">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 p-6 sm:p-10">
          <div className="ember-bg pointer-events-none absolute inset-0" />
          <div className="relative">
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.25em] text-flame">Roast battle</p>
            <h2 className="mx-auto mt-2 max-w-3xl text-center font-display text-3xl font-extrabold leading-tight sm:text-5xl">{result.headline}</h2>

            <div className="mt-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
              {people.map((p, i) => (
                <div key={i} className={`flex flex-col items-center gap-3 text-center ${i === 1 ? 'order-3' : ''}`}>
                  <div className="relative">
                    <Avatar src={p.avatarUrl} name={p.displayName} size={72} />
                    {result.winnerIndex === i && <Crown className="absolute -top-5 left-1/2 size-7 -translate-x-1/2 fill-flame text-flame" />}
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold leading-tight sm:text-xl">{p.displayName}</p>
                    <p className="font-mono text-[11px] text-dust">{p.platformName}</p>
                  </div>
                  <div className="hidden sm:block"><ScoreDial score={result.scores[i]} size={130} /></div>
                  <p className="font-mono text-sm sm:hidden">{result.scores[i]}% cooked</p>
                </div>
              ))}
              <span className="order-2 font-display text-3xl font-extrabold text-ember sm:text-5xl">VS</span>
            </div>

            <ol className="mt-10 space-y-4">
              {result.rounds.map((r, i) => (
                <li key={i} className="rounded-2xl border border-white/8 bg-soot/70 p-5">
                  <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dust">Round {i + 1} · {r.topic}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {[r.left, r.right].map((line, j) => (
                      <p key={j} className={`rounded-xl p-4 text-sm leading-relaxed ${r.winner === j ? 'bg-mint/[0.06] ring-1 ring-mint/25' : 'bg-chili/[0.06] ring-1 ring-chili/20'}`}>
                        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-dust">
                          {people[j].displayName} {r.winner === j ? '· survives' : '· burnt'}
                        </span>
                        {line}
                      </p>
                    ))}
                  </div>
                </li>
              ))}
            </ol>

            <blockquote className="mt-8 border-l-4 border-ember pl-5 font-display text-xl font-bold leading-snug sm:text-2xl">“{result.finalBlow}”</blockquote>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-dust/70">{result.engine === 'gemini' ? 'AI judged' : 'offline judge'}</p>
          </div>
        </div>
        <button onClick={() => setResult(null)} className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-soot px-4 py-2.5 text-sm hover:bg-ash">
          <RotateCcw className="size-4" /> Rematch
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_auto_1fr]">
        {[0, 1].map((i) => (
          <div key={i} className={i === 1 ? 'lg:order-3' : ''}>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-dust">Contender {i + 1}</p>
            {sides[i] ? (
              <ProfileCard p={sides[i]!} connector={byId(sides[i]!.platform)} onRemove={() => setSides((s) => set(s, i, null))} />
            ) : (
              <ProfileAdder
                connectors={connectors}
                platform={platforms[i]}
                onPlatform={(c) => setPlatforms((p) => set(p, i, c))}
                onAdd={(p) => setSides((s) => set(s, i, p))}
                cta="Add"
              />
            )}
          </div>
        ))}
        <div className="hidden self-center font-display text-4xl font-extrabold text-ember lg:order-2 lg:block">VS</div>
      </div>

      {controls}

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={fight}
          disabled={!sides[0] || !sides[1] || loading}
          className="bg-fire glow inline-flex h-14 items-center gap-2 rounded-full px-8 font-display text-lg font-bold text-char transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Swords className="size-5" />} {loading ? 'Judging…' : 'Start the fight'}
        </button>
        {error && <p className="text-sm text-[#ff8a7a]" role="alert">{error}</p>}
      </div>
    </div>
  );
}
