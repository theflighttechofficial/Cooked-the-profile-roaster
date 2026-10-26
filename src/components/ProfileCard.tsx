import { ExternalLink, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import type { ConnectorInfo, Profile } from '../../shared/types.ts';
import { initials, since } from '../lib/ui.ts';
import { PlatformBadge } from './PlatformBadge.tsx';

export function Avatar({ src, name, size = 56 }: { src?: string; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <span className="bg-fire grid shrink-0 place-items-center rounded-2xl font-display font-bold text-char" style={{ width: size, height: size, fontSize: size * 0.38 }}>
        {initials(name)}
      </span>
    );
  }
  return <img src={src} alt="" onError={() => setBroken(true)} referrerPolicy="no-referrer" className="shrink-0 rounded-2xl bg-ash object-cover" style={{ width: size, height: size }} />;
}

export function ProfileCard({ p, connector, onRemove, compact }: { p: Profile; connector?: ConnectorInfo; onRemove?: () => void; compact?: boolean }) {
  const list = p.lists[0];
  const stats = p.stats.slice(0, compact ? 3 : 6);
  return (
    <article className="card relative flex flex-col gap-4 p-5 animate-rise">
      {onRemove && (
        <button onClick={onRemove} aria-label={`Remove ${p.displayName}`} className="absolute right-3 top-3 rounded-full p-1.5 text-dust transition hover:bg-ash hover:text-cream">
          <X className="size-4" />
        </button>
      )}
      <header className="flex items-center gap-4 pr-6">
        <Avatar src={p.avatarUrl} name={p.displayName} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {connector && <PlatformBadge c={connector} size={20} />}
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-dust">{p.platformName}</span>
          </div>
          <h3 className="truncate font-display text-xl font-bold leading-tight">{p.displayName}</h3>
          <a href={p.profileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-dust hover:text-flame">
            @{p.handle} <ExternalLink className="size-3" />
          </a>
        </div>
      </header>

      {!compact && p.bio && <p className="line-clamp-3 text-sm text-cream/80">{p.bio}</p>}

      {p.stats.length > 0 && (
        <dl className={`grid gap-px overflow-hidden rounded-xl bg-white/5 ${stats.length % 3 === 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {stats.map((s) => (
            <div key={s.label} className="bg-soot px-3 py-2.5">
              <dt className="truncate font-mono text-[10px] uppercase tracking-wider text-dust">{s.label}</dt>
              <dd className="truncate font-display text-lg font-bold">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {!compact && list && (
        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-dust/80">{list.title}</p>
          <ul className="space-y-1">
            {list.items.slice(0, 4).map((i) => (
              <li key={i.name} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{i.name}</span>
                {i.meta && <span className="shrink-0 truncate font-mono text-[11px] text-dust max-w-[55%]">{i.meta}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!compact && (p.location || p.joined) && (
        <footer className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-white/5 pt-3 font-mono text-[11px] text-dust">
          {p.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{p.location}</span>}
          {p.joined && <span>since {since(p.joined)}</span>}
          <span className="ml-auto text-mint">● live data</span>
        </footer>
      )}
    </article>
  );
}
