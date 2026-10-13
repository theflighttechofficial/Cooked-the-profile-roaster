import React from 'react';
import { RoastResult, PlatformType } from '../types/roast';
import { Leaf, Flame, AlertOctagon, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface TechDebtCarbonCalculatorProps {
  roast: RoastResult;
  platform: PlatformType;
  username: string;
}

export const TechDebtCarbonCalculator: React.FC<TechDebtCarbonCalculatorProps> = ({
  roast,
  platform,
  username,
}) => {
  // Compute simulated carbon disaster metrics based on cooked score & footprint
  const cookedScore = roast.cookedScore || 85;
  const metrics = roast.profileReceipts?.metrics || {};

  // Estimated stats
  const estimatedRepos = Number(metrics['Public Repositories'] || metrics['Packages Published'] || 28);
  const co2KgPerYear = Math.round(cookedScore * 4.2 + estimatedRepos * 8.5);
  const kWhEnergyWasted = Math.round(co2KgPerYear * 3.8);
  const plasticChairsBurned = Math.round(co2KgPerYear / 24);
  const dieselMilesDriven = Math.round(co2KgPerYear * 2.5);

  return (
    <div className="bg-slate-950/90 border-2 border-emerald-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400 shrink-0">
            <Leaf className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
              <span>ENVIRONMENTAL IMPACT AUDIT</span>
            </div>
            <h3 className="font-['Syne'] text-xl md:text-2xl font-extrabold text-white">
              Tech Debt Carbon Footprint Calculator
            </h3>
            <p className="text-xs text-slate-400">
              Calculating real-world environmental damage caused by your unoptimized repos & idle servers.
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold text-center">
          ⚠️ SEVERE POLLUTER RATING
        </div>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Annual CO2 Waste</span>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-black text-emerald-400">
            {co2KgPerYear} kg
          </div>
          <span className="text-[10px] text-slate-500 block">Carbon generated/yr</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Server Energy Wasted</span>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-black text-amber-400">
            {kWhEnergyWasted} kWh
          </div>
          <span className="text-[10px] text-slate-500 block">Idle compute cycles</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Equivalent Damage</span>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-black text-rose-400">
            {plasticChairsBurned} Chairs
          </div>
          <span className="text-[10px] text-slate-500 block">Plastic lawn chairs burned</span>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Diesel Truck Miles</span>
          <div className="font-['JetBrains_Mono'] text-2xl md:text-3xl font-black text-sky-400">
            {dieselMilesDriven} mi
          </div>
          <span className="text-[10px] text-slate-500 block">Highway emission equiv</span>
        </div>

      </div>

      {/* Environmental Audit Verdict */}
      <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-400 font-mono">
          <ShieldAlert className="w-4 h-4" />
          <span>Ecology Impact Analysis for @{username}:</span>
        </div>
        <p className="text-xs md:text-sm text-slate-200 italic leading-relaxed font-sans">
          "Your 45 abandoned side projects and uncleaned <code className="text-emerald-400 font-mono">node_modules</code> folders are single-handedly accelerating global warming. The idle cloud builds you triggered and forgot to cancel emit more carbon than a small diesel lawnmower running continuously through winter."
        </p>
      </div>

    </div>
  );
};
