import React from 'react';
import { Crown, Sparkles, AlertTriangle } from 'lucide-react';

export type SelfTitle = 'Intern' | 'Junior' | 'Senior' | 'Principal' | 'Tech God' | '10x Engineer';

interface DelusionSliderProps {
  selectedTitle: SelfTitle;
  onChangeTitle: (title: SelfTitle) => void;
}

const TITLES: Array<{ id: SelfTitle; label: string; egoCost: string }> = [
  { id: 'Intern', label: '🌱 Humble Intern', egoCost: '10% Ego' },
  { id: 'Junior', label: '💻 Junior Dev', egoCost: '30% Ego' },
  { id: 'Senior', label: '💼 Senior Engineer', egoCost: '60% Ego' },
  { id: 'Principal', label: '🏛️ Principal Architect', egoCost: '85% Ego' },
  { id: '10x Engineer', label: '⚡ 10x Full-Stack God', egoCost: '95% Ego' },
  { id: 'Tech God', label: '👑 Immortal Tech God', egoCost: '100% Ego' },
];

export const DelusionSlider: React.FC<DelusionSliderProps> = ({
  selectedTitle,
  onChangeTitle,
}) => {
  return (
    <div className="p-4 bg-slate-950/90 border border-amber-500/30 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            Step 0: Proclaim Your Ego Level ("Delusion vs Reality")
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          The higher your proclaimed rank, the harsher the AI roast.
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {TITLES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChangeTitle(t.id)}
            className={`p-2 rounded-xl text-[11px] font-bold transition-all text-center cursor-pointer border ${
              selectedTitle === t.id
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-md shadow-amber-950/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <div className="truncate">{t.label}</div>
            <div className="text-[9px] font-mono opacity-60 mt-0.5">{t.egoCost}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
