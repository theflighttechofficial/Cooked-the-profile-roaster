import { doneness } from '../lib/ui.ts';

export function ScoreDial({ score, size = 168 }: { score: number; size?: number }) {
  const d = doneness(score);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-[225deg]">
        <defs>
          <linearGradient id="dial" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ffb020" />
            <stop offset=".55" stopColor="#ff5a1f" />
            <stop offset="1" stopColor="#e3263a" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(255 255 255 / .08)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${arc} ${circ}`} />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#dial)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(arc * score) / 100} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.2,.7,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="font-display text-5xl font-extrabold leading-none tabular-nums">{score}</span>
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-dust">% cooked</span>
        <span className="mt-1.5 font-display text-sm font-bold" style={{ color: d.color }}>{d.name}</span>
      </div>
    </div>
  );
}
