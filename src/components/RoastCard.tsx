import { toPng } from 'html-to-image';
import { Check, Copy, Download, Flag, Loader2, RotateCcw, Share2, Sparkles, Square, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Profile, Roast } from '../../shared/types.ts';
import { doneness } from '../lib/ui.ts';
import { Avatar } from './ProfileCard.tsx';
import { ScoreDial } from './ScoreDial.tsx';

export function roastText(r: Roast, subjects: { displayName: string }[]) {
  const who = subjects.map((s) => s.displayName).join(' + ') || 'me';
  return [
    `🔥 ${who} got COOKED: ${r.score}% (${doneness(r.score).name})`,
    `"${r.title}"`,
    '',
    r.verdict,
    '',
    ...r.redFlags.map((f) => `🚩 ${f}`),
    '',
    `"${r.shareQuote}"`,
  ].join('\n');
}

async function capture(node: HTMLElement) {
  const opts = { pixelRatio: 2, backgroundColor: '#0d0b0a', cacheBust: true };
  try {
    return await toPng(node, opts);
  } catch {
    // Some avatar hosts block cross-origin reads. Retry without the images.
    return toPng(node, { ...opts, filter: (n) => !(n instanceof HTMLImageElement) });
  }
}

export function RoastCard({ roast, subjects, onReset }: { roast: Roast; subjects: Pick<Profile, 'displayName' | 'avatarUrl' | 'platformName'>[]; onReset: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const d = doneness(roast.score);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const download = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const url = await capture(cardRef.current);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cooked-${(subjects[0]?.displayName || 'roast').replace(/\W+/g, '-').toLowerCase()}.png`;
      a.click();
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(roastText(roast, subjects));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    const text = roastText(roast, subjects);
    if (navigator.share) await navigator.share({ title: 'I got cooked', text }).catch(() => {});
    else window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 270))}`, '_blank', 'noopener');
  };

  const speak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance([roast.title, roast.verdict, ...roast.paragraphs].join('. '));
    u.rate = 1.03;
    u.onend = u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  };

  const btn = 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-soot px-4 py-2.5 text-sm font-medium transition hover:border-white/25 hover:bg-ash';

  return (
    <section className="animate-rise" aria-live="polite">
      <div ref={cardRef} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-char p-6 sm:p-10">
        <div className="ember-bg pointer-events-none absolute inset-0" />
        <div className="relative">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dust">
            <span className="font-display text-lg font-extrabold normal-case tracking-tight text-cream">cooked<span className="text-ember">.</span></span>
            <span className="flex items-center gap-3">
              {subjects.map((s) => s.platformName).join(' · ')}
              <span className="rounded-full border border-white/10 px-2 py-0.5">{roast.engine === 'gemini' ? 'AI roast' : 'offline roast'}</span>
            </span>
          </header>

          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
            <ScoreDial score={roast.score} />
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex -space-x-3">
                {subjects.map((s, i) => (
                  <span key={i} className="rounded-2xl ring-4 ring-char">
                    <Avatar src={s.avatarUrl} name={s.displayName} size={44} />
                  </span>
                ))}
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-flame">{subjects.map((s) => s.displayName).join(' + ')} is</p>
              <h2 className="mt-1 font-display text-4xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">{roast.title}</h2>
              <p className="mt-4 max-w-2xl text-lg text-cream/90 sm:text-xl">“{roast.verdict}”</p>
            </div>
          </div>

          <div className="mt-10 space-y-4 text-[15px] leading-relaxed text-cream/85 sm:text-base">
            {roast.paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-5xl first-letter:font-extrabold first-letter:leading-[0.85] first-letter:text-ember' : ''}>
                {p}
              </p>
            ))}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-chili/25 bg-chili/[0.06] p-5">
              <h3 className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#ff8a7a]"><Flag className="size-3.5" /> Red flags</h3>
              <ol className="space-y-2.5">
                {roast.redFlags.map((f, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-[#ff8a7a]">0{i + 1}</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dust">Diagnostics</h3>
              <ul className="space-y-3">
                {roast.meters.map((m) => (
                  <li key={m.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{m.label}</span>
                      <span className="font-mono text-dust tabular-nums">{m.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <div className="bg-fire h-full rounded-full" style={{ width: `${m.value}%`, transition: 'width 1s ease' }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="rounded-2xl border border-mint/20 bg-mint/[0.05] p-5 text-sm">
              <span className="mr-2 font-mono text-[11px] uppercase tracking-[0.2em] text-mint">Green flag (barely)</span>
              {roast.greenFlag}
            </div>
            <div className="bg-fire flex items-center gap-2 rounded-2xl px-5 py-4 font-display font-bold text-char">
              <Sparkles className="size-5" /> {roast.badge}
            </div>
          </div>

          {roast.shareQuote && (
            <blockquote className="mt-10 border-l-4 border-ember pl-5 font-display text-2xl font-bold leading-tight sm:text-3xl">
              “{roast.shareQuote}”
            </blockquote>
          )}

          <footer className="mt-10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-dust/70">
            <span>{d.note}</span>
            <span>{new Date().toLocaleDateString()}</span>
          </footer>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={download} className={`${btn} border-ember/50 text-flame`} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Save image
        </button>
        <button onClick={copy} className={btn}>{copied ? <Check className="size-4 text-mint" /> : <Copy className="size-4" />} {copied ? 'Copied' : 'Copy text'}</button>
        <button onClick={share} className={btn}><Share2 className="size-4" /> Share</button>
        {'speechSynthesis' in window && (
          <button onClick={speak} className={btn}>{speaking ? <Square className="size-4" /> : <Volume2 className="size-4" />} {speaking ? 'Stop' : 'Read it out'}</button>
        )}
        <button onClick={onReset} className={`${btn} ml-auto`}><RotateCcw className="size-4" /> New roast</button>
      </div>
    </section>
  );
}
