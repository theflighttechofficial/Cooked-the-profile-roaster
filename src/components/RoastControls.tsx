import { Flame } from 'lucide-react';
import type { Heat, Persona } from '../../shared/types.ts';
import { HEATS, PERSONAS } from '../lib/ui.ts';

interface Props {
  persona: Persona;
  heat: Heat;
  onPersona: (p: Persona) => void;
  onHeat: (h: Heat) => void;
}

export function RoastControls({ persona, heat, onPersona, onHeat }: Props) {
  const heatIdx = HEATS.findIndex((h) => h.id === heat);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
      <fieldset>
        <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dust">Who's roasting</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PERSONAS.map(({ id, name, blurb, icon: Icon }) => {
            const on = id === persona;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => onPersona(id)}
                className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition ${on ? 'border-ember/70 bg-ember/10' : 'border-white/8 bg-soot hover:border-white/20'}`}
              >
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl transition ${on ? 'bg-fire text-char' : 'bg-ash text-dust group-hover:text-cream'}`}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{name}</span>
                  <span className="block truncate text-xs text-dust">{blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="lg:w-72">
        <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-dust">Heat</legend>
        <div className="rounded-2xl border border-white/8 bg-soot p-4">
          <div className="mb-3 flex items-end justify-between">
            <span className="font-display text-2xl font-bold">{HEATS[heatIdx].name}</span>
            <span className="flex gap-0.5" aria-hidden>
              {HEATS.map((h, i) => (
                <Flame key={h.id} className={`size-5 transition ${i <= heatIdx ? 'fill-ember text-ember' : 'text-smoke'}`} />
              ))}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={heatIdx}
            aria-label="Heat level"
            aria-valuetext={HEATS[heatIdx].name}
            onChange={(e) => onHeat(HEATS[Number(e.target.value)].id)}
            className="w-full"
          />
          <p className="mt-2 text-xs text-dust">{HEATS[heatIdx].blurb}</p>
        </div>
      </fieldset>
    </div>
  );
}
