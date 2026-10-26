import { KeyRound } from 'lucide-react';
import type { ConnectorInfo } from '../../shared/types.ts';
import { CATEGORIES } from '../lib/ui.ts';
import { PlatformBadge } from './PlatformBadge.tsx';

export function ConnectorGrid({ connectors, onPick }: { connectors: ConnectorInfo[]; onPick: (c: ConnectorInfo) => void }) {
  return (
    <div className="space-y-10">
      {CATEGORIES.map((cat) => {
        const items = connectors.filter((c) => c.category === cat.id);
        if (!items.length) return null;
        return (
          <div key={cat.id}>
            <h3 className="mb-3 flex items-baseline gap-3 font-display text-2xl font-bold">
              {cat.name} <span className="font-mono text-xs font-normal text-dust">{items.length}</span>
            </h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onPick(c)}
                  disabled={!c.available}
                  className="group flex items-start gap-3 rounded-2xl border border-white/8 bg-soot p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <PlatformBadge c={c} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-semibold">
                      {c.name}
                      {c.requiresEnv && <span className="inline-flex items-center gap-1 rounded-full bg-ash px-2 py-0.5 font-mono text-[10px] font-normal text-dust"><KeyRound className="size-3" />{c.available ? 'key set' : 'needs key'}</span>}
                    </span>
                    <span className="mt-0.5 block text-sm text-dust">{c.pulls}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
