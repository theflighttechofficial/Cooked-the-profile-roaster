import React, { useRef, useState } from 'react';
import { RoastResult, PlatformType } from '../types/roast';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { Flame, Download, Sparkles, Shield, Zap, Swords, Layers, Copy, Check } from 'lucide-react';

interface HolographicTcgCardProps {
  roast: RoastResult;
  platform: PlatformType;
  username: string;
  avatarUrl?: string;
}

export const HolographicTcgCard: React.FC<HolographicTcgCardProps> = ({
  roast,
  platform,
  username,
  avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardElement, setCardElement] = useState<'fire' | 'poison' | 'dark' | 'electric'>('fire');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compute TCG Stats
  const hp = 100;
  const attack = Math.min(Math.max(roast.cookedScore - 15, 10), 99);
  const defense = Math.min(Math.max(roast.statsRadar.socialSkills, 5), 90);
  const coping = Math.min(Math.max(roast.statsRadar.touchGrassNeeded, 20), 99);

  const getSpecialMove = () => {
    if (platform === 'github' || platform === 'gitlab') {
      return {
        name: '⚡ Rust Rewrite Surge',
        desc: 'Rewrites entire backend in Rust, fails to configure Docker, abandons repo forever.',
        damage: '85 DMG'
      };
    } else if (platform === 'leetcode' || platform === 'codeforces') {
      return {
        name: '🧠 Invert Binary Tree',
        desc: 'Spam solves LeetCode Mediums on Friday night while social life takes 999 true damage.',
        damage: '95 DMG'
      };
    } else if (platform === 'linkedin') {
      return {
        name: '💼 Excited to Announce',
        desc: 'Posts 6-paragraph corporate essay celebrating 1-day virtual webinar attendance.',
        damage: '70 DMG'
      };
    } else if (platform === 'steam') {
      return {
        name: '🎮 400-Hour Dota Grind',
        desc: 'Gains 12 MMR points while sacrificing sleeping patterns and eye health.',
        damage: '90 DMG'
      };
    } else {
      return {
        name: '🔥 Extreme Cope Protocol',
        desc: 'Defends bad tech stack choices on Reddit with 14 paragraphs of unverified jargon.',
        damage: '80 DMG'
      };
    }
  };

  const specialMove = getSpecialMove();

  const handleDownloadTcgPng = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const node = cardRef.current;
      const dataUrl = await toPng(node, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 3,
        width: node.scrollWidth,
        height: node.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = `cooked-tcg-${platform}-${username}.png`;
      link.href = dataUrl;
      link.click();

      confetti({ particleCount: 70, spread: 70 });
    } catch (err) {
      console.error('TCG Card export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-[#0b0c10] border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HOLOGRAPHIC TCG CARD GENERATOR</span>
          </div>
          <h3 className="font-['Syne'] text-2xl font-black text-white">
            Collectible Digital Footprint Trading Card
          </h3>
          <p className="text-xs text-slate-400">
            Export Pokémon / Magic: The Gathering style holographic TCG card PNG with custom stats & moves.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Element Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
            {(['fire', 'poison', 'dark', 'electric'] as const).map((el) => (
              <button
                key={el}
                onClick={() => setCardElement(el)}
                className={`px-2.5 py-1 rounded-lg uppercase cursor-pointer transition-all ${
                  cardElement === el ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {el}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadTcgPng}
            disabled={isExporting}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-black text-xs font-extrabold rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export 4K TCG Card'}</span>
          </button>
        </div>
      </div>

      {/* Card Preview Stage */}
      <div className="flex justify-center p-6 bg-slate-950/90 border border-slate-800/80 rounded-2xl">
        <div
          ref={cardRef}
          className={`relative w-[340px] h-[520px] rounded-[24px] p-4 flex flex-col justify-between shadow-2xl border-4 transition-all duration-300 overflow-hidden ${
            cardElement === 'fire'
              ? 'bg-gradient-to-b from-orange-950 via-slate-950 to-red-950 border-amber-500 text-amber-100'
              : cardElement === 'poison'
              ? 'bg-gradient-to-b from-emerald-950 via-slate-950 to-teal-950 border-emerald-400 text-emerald-100'
              : cardElement === 'dark'
              ? 'bg-gradient-to-b from-purple-950 via-slate-950 to-slate-950 border-purple-500 text-purple-100'
              : 'bg-gradient-to-b from-yellow-950 via-slate-950 to-amber-950 border-yellow-400 text-yellow-100'
          }`}
        >
          {/* Holographic Shimmer Effect Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0)_70%)] pointer-events-none" />

          {/* Top Title & HP */}
          <div className="flex items-center justify-between border-b-2 border-current/30 pb-2 relative z-10">
            <div className="min-w-0 pr-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-70 block">
                STAGE 2 · {platform.toUpperCase()}
              </span>
              <h4 className="font-['Syne'] font-black text-lg truncate leading-tight">
                @{username}
              </h4>
            </div>
            <div className="flex items-center gap-1 font-['JetBrains_Mono'] font-extrabold text-base shrink-0">
              <span className="text-red-400 text-xs">HP</span>
              <span>100</span>
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
            </div>
          </div>

          {/* Card Art Avatar Frame */}
          <div className="relative my-2 w-full h-40 bg-slate-950 rounded-xl border-2 border-current/40 overflow-hidden shadow-inner flex items-center justify-center">
            <img
              src={avatarUrl}
              alt={username}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur font-mono text-[9px] font-bold text-amber-300 border border-amber-500/30">
              {roast.badgeAwarded}
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[10px] font-black uppercase">
              {roast.cookedScore}% COOKED
            </div>
          </div>

          {/* Special Move Ability */}
          <div className="p-3 bg-black/60 border border-current/20 rounded-xl space-y-1 relative z-10">
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="text-amber-300 font-['Syne']">{specialMove.name}</span>
              <span className="font-mono text-red-400">{specialMove.damage}</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {specialMove.desc}
            </p>
          </div>

          {/* TCG Numeric Stat Grid */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono font-bold pt-1 relative z-10">
            <div className="p-1.5 bg-black/40 rounded-lg border border-current/20">
              <span className="opacity-60 block text-[8px] uppercase">ATK</span>
              <span className="text-amber-300 text-xs">{attack}</span>
            </div>
            <div className="p-1.5 bg-black/40 rounded-lg border border-current/20">
              <span className="opacity-60 block text-[8px] uppercase">DEF</span>
              <span className="text-sky-300 text-xs">{defense}</span>
            </div>
            <div className="p-1.5 bg-black/40 rounded-lg border border-current/20">
              <span className="opacity-60 block text-[8px] uppercase">COPE</span>
              <span className="text-rose-300 text-xs">{coping}</span>
            </div>
          </div>

          {/* Footer Card Info */}
          <div className="flex items-center justify-between text-[9px] font-mono opacity-60 border-t border-current/20 pt-1.5 mt-1 relative z-10">
            <span>NO. 001 · COOKED TCG</span>
            <span>https://cooked.aistudio.app</span>
          </div>

        </div>
      </div>

    </div>
  );
};
