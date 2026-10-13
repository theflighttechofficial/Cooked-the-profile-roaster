import React, { useState } from 'react';
import { RoastResult, PlatformType } from '../types/roast';
import { MessageSquare, ShieldAlert, Sparkles, Volume2, UserCheck, ShieldX } from 'lucide-react';

interface DualAiPanelProps {
  roast: RoastResult;
  platform: PlatformType;
  username: string;
}

export const DualAiPanel: React.FC<DualAiPanelProps> = ({
  roast,
  platform,
  username,
}) => {
  const [activeTab, setActiveTab] = useState<'debate' | 'summary'>('debate');

  // Generate Dual-AI Transcript lines
  const badCopLines = [
    `Look at this ${platform.toUpperCase()} profile for @${username}. ${roast.headline}`,
    `They have a Cooked Score of ${roast.cookedScore}%. Red Flags everywhere: ${roast.redFlags[0] || 'Zero tests written'}.`,
    `Their repository architecture is held together by duct tape and blind faith.`
  ];

  const goodCopLines = [
    `Hey, take it easy on them! At least they tried to learn new frameworks this year!`,
    `Sure, their code has no tests, but look at how passionate they are about customizing their IDE theme!`,
    `We should encourage them! They solved ${roast.profileReceipts?.metrics?.['Problems Solved'] || 'a few'} problems!`
  ];

  return (
    <div className="bg-slate-950 border-2 border-purple-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 border border-purple-500/40 rounded-2xl text-purple-400 shrink-0">
            <MessageSquare className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono font-bold uppercase">
              <Sparkles className="w-3 h-3" />
              <span>DUAL-AI PANEL DEBATE</span>
            </div>
            <h3 className="font-['Syne'] text-xl md:text-2xl font-black text-white">
              Good Cop vs. Bad Cop AI Debate
            </h3>
            <p className="text-xs text-slate-400">
              Gemini Senior Dev (Bad Cop) & Gemini Manager (Good Cop) publicly debate your worth.
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold text-center">
          🤖 DUAL GEMINI MODEL CHAT
        </div>
      </div>

      {/* Simulated Live Debate Transcript Stream */}
      <div className="space-y-4">
        
        {/* Turn 1: Bad Cop */}
        <div className="flex items-start gap-3 bg-slate-900/90 p-4 rounded-2xl border border-red-500/30">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold shrink-0">
            <ShieldX className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-red-400">Gemini Pro (Bad Cop / Sr. Dev)</span>
              <span className="text-[10px] font-mono text-slate-500">TOXIC SENIOR</span>
            </div>
            <p className="text-xs text-slate-200 font-mono leading-relaxed">
              "{badCopLines[0]}"
            </p>
          </div>
        </div>

        {/* Turn 2: Good Cop */}
        <div className="flex items-start gap-3 bg-slate-900/90 p-4 rounded-2xl border border-emerald-500/30 ml-4 md:ml-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-emerald-400">Gemini Flash (Good Cop / Manager)</span>
              <span className="text-[10px] font-mono text-slate-500">PATRONIZING PITY</span>
            </div>
            <p className="text-xs text-slate-200 font-mono leading-relaxed">
              "{goodCopLines[0]}"
            </p>
          </div>
        </div>

        {/* Turn 3: Bad Cop Rebuttal */}
        <div className="flex items-start gap-3 bg-slate-900/90 p-4 rounded-2xl border border-red-500/30">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold shrink-0">
            <ShieldX className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-red-400">Gemini Pro (Bad Cop / Sr. Dev)</span>
            </div>
            <p className="text-xs text-slate-200 font-mono leading-relaxed">
              "{badCopLines[1]} {badCopLines[2]}"
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
