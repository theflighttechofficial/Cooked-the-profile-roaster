import { Check, ChevronDown, KeyRound, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConnectorInfo } from '../../shared/types.ts';
import { CATEGORIES } from '../lib/ui.ts';
import { PlatformBadge } from './PlatformBadge.tsx';

interface Props {
  connectors: ConnectorInfo[];
  value: ConnectorInfo | undefined;
  onChange: (c: ConnectorInfo) => void;
}

export function PlatformPicker({ connectors, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? connectors.filter((c) => `${c.name} ${c.id} ${c.category} ${c.pulls}`.toLowerCase().includes(s)) : connectors;
  }, [connectors, q]);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    search.current?.focus();
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const choose = (c: ConnectorInfo) => {
    if (!c.available) return;
    onChange(c);
    setOpen(false);
    setQ('');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && filtered[active]) { e.preventDefault(); choose(filtered[active]); }
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-14 w-full items-center gap-3 rounded-2xl bg-ash px-3 text-left transition hover:bg-smoke sm:w-56"
      >
        {value ? <PlatformBadge c={value} /> : <span className="size-7 rounded-lg bg-smoke" />}
        <span className="flex-1 truncate font-medium">{value?.name ?? 'Pick a platform'}</span>
        <ChevronDown className={`size-4 text-dust transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-16 z-40 w-[min(92vw,26rem)] overflow-hidden rounded-2xl border border-white/10 bg-soot shadow-2xl shadow-black/60 animate-rise" onKeyDown={onKey}>
          <div className="flex items-center gap-2 border-b border-white/10 px-4">
            <Search className="size-4 text-dust" />
            <input
              ref={search}
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0); }}
              placeholder={`Search ${connectors.length} platforms…`}
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-dust/70"
            />
          </div>
          <ul role="listbox" className="max-h-80 overflow-y-auto p-2">
            {CATEGORIES.map((cat) => {
              const items = filtered.filter((c) => c.category === cat.id);
              if (!items.length) return null;
              return (
                <li key={cat.id}>
                  <p className="px-2 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-dust/70">{cat.name}</p>
                  <ul>
                    {items.map((c) => {
                      const idx = filtered.indexOf(c);
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={value?.id === c.id}
                            disabled={!c.available}
                            onMouseEnter={() => setActive(idx)}
                            onClick={() => choose(c)}
                            className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left disabled:cursor-not-allowed disabled:opacity-45 ${idx === active ? 'bg-ash' : ''}`}
                          >
                            <PlatformBadge c={c} size={26} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{c.name}</span>
                              <span className="block truncate text-xs text-dust">{c.available ? c.pulls : `Needs ${c.requiresEnv} on the server`}</span>
                            </span>
                            {!c.available && <KeyRound className="size-4 text-dust" />}
                            {value?.id === c.id && <Check className="size-4 text-ember" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
            {!filtered.length && <li className="p-6 text-center text-sm text-dust">No platform matches "{q}".</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
