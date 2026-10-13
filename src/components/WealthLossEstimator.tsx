import React from 'react';
import { RoastResult, PlatformType } from '../types/roast';
import { DollarSign, TrendingDown, Clock, Sparkles } from 'lucide-react';

interface WealthLossEstimatorProps {
  roast: RoastResult;
  platform: PlatformType;
  username: string;
}

export const WealthLossEstimator: React.FC<WealthLossEstimatorProps> = ({
  roast,
  platform,
  username,
}) => {
  const metrics = roast.profileReceipts?.metrics || {};
  const estimatedHours = Math.round((roast.cookedScore * 4.8) + (Number(metrics['Public Repositories'] || 12) * 15));
  const hourlyRate = 75; // $75/hr market rate
  const lostWages = estimatedHours * hourlyRate;

  return (
    <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 shrink-0">
            <DollarSign className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
              <span>OPPORTUNITY COST AUDIT</span>
            </div>
            <h3 className="font-['Syne'] text-xl md:text-2xl font-black text-white">
              "GitHub Green Grid" Wealth Loss Estimator
            </h3>
            <p className="text-xs text-slate-400">
              Calculating how much market-value income you lost coding open-source for free.
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold text-center">
          💸 $0.00 REVENUE PRODUCED
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Unpaid Open-Source Hours</span>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-black text-amber-400">
            {estimatedHours} Hours
          </div>
          <span className="text-[10px] text-slate-500 block">Invested for free</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Market Hourly Rate</span>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-black text-sky-400">
            ${hourlyRate}/hr
          </div>
          <span className="text-[10px] text-slate-500 block">Standard dev rate</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/40 space-y-1">
          <span className="text-[10px] font-mono uppercase text-emerald-400 block">Lost Market Income</span>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-black text-emerald-400">
            ${lostWages.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 block">Forfeited wages</span>
        </div>

      </div>

      {/* Financial Verdict */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
        <div className="text-xs font-bold text-emerald-400 uppercase font-mono">
          Wealth Loss Audit Verdict:
        </div>
        <p className="text-xs text-slate-300 font-sans leading-relaxed italic">
          "You spent {estimatedHours} hours building an open-source library used by exactly 2 people (one of whom is your alt account). At market rate, you effectively paid ${lostWages.toLocaleString()} to code in a vacuum."
        </p>
      </div>

    </div>
  );
};
