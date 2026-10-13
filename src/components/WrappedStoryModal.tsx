import React, { useState } from 'react';
import { RoastResult, PlatformType } from '../types/roast';
import { Sparkles, ChevronRight, ChevronLeft, Flame, X, Trophy, Share2, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WrappedStoryModalProps {
  roast: RoastResult;
  platform: PlatformType;
  username: string;
  avatarUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WrappedStoryModal: React.FC<WrappedStoryModalProps> = ({
  roast,
  platform,
  username,
  avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
  isOpen,
  onClose,
}) => {
  const [slideIndex, setSlideIndex] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: 'WELCOME TO YOUR YEAR IN DISASTERS',
      subtitle: `2026 Profile Audit for @${username}`,
      bg: 'bg-gradient-to-br from-purple-900 via-slate-950 to-orange-950',
      content: (
        <div className="space-y-4 text-center my-auto">
          <div className="w-24 h-24 mx-auto rounded-3xl overflow-hidden border-4 border-amber-400 shadow-2xl">
            <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
          </div>
          <h3 className="font-['Syne'] text-3xl font-black text-white">@{username}</h3>
          <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full font-mono text-xs font-bold inline-block">
            {platform.toUpperCase()} FOOTPRINT AUDITED
          </div>
        </div>
      )
    },
    {
      title: 'YOUR #1 OVERUSED HABIT',
      subtitle: 'What consumed your time this year?',
      bg: 'bg-gradient-to-br from-red-950 via-slate-950 to-amber-950',
      content: (
        <div className="space-y-4 text-center my-auto">
          <div className="font-['JetBrains_Mono'] text-6xl font-black text-red-400">
            {roast.cookedScore}%
          </div>
          <div className="text-sm font-bold text-amber-300 uppercase tracking-widest">
            COOKED SCORE RATING
          </div>
          <p className="text-sm text-slate-200 italic p-4 bg-black/60 rounded-2xl border border-red-500/30">
            "{roast.headline}"
          </p>
        </div>
      )
    },
    {
      title: 'YOUR TOP 3 RED FLAGS',
      subtitle: 'The evidence we found in your digital footprint',
      bg: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950',
      content: (
        <div className="space-y-3 my-auto">
          {roast.redFlags.map((flag, i) => (
            <div key={i} className="p-3 bg-black/60 border border-emerald-500/30 rounded-2xl flex items-start gap-3 text-xs text-emerald-200">
              <span className="font-mono font-black text-amber-400 text-sm">#{i + 1}</span>
              <span>{flag}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'YOUR AWARDED BADGE OF SHAME',
      subtitle: 'Official certification awarded by Gemini AI',
      bg: 'bg-gradient-to-br from-amber-950 via-slate-950 to-purple-950',
      content: (
        <div className="space-y-4 text-center my-auto">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
          <div className="font-['Syne'] text-2xl font-black text-amber-300">
            {roast.badgeAwarded}
          </div>
          <p className="text-xs text-slate-300 font-mono italic p-3 bg-black/60 rounded-xl border border-amber-500/30">
            Diagnosis: {roast.psychologicalDiagnosis}
          </p>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex(slideIndex + 1);
      confetti({ particleCount: 30, spread: 40 });
    }
  };

  const handlePrev = () => {
    if (slideIndex > 0) setSlideIndex(slideIndex - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn">
      <div className={`relative w-full max-w-sm h-[600px] rounded-3xl p-6 shadow-2xl flex flex-col justify-between border-4 border-amber-500/50 ${slides[slideIndex].bg}`}>
        
        {/* Top Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white bg-black/60 rounded-full cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        {/* Progress Bar Header */}
        <div className="flex gap-1 z-10">
          {slides.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= slideIndex ? 'bg-amber-400' : 'bg-slate-800'}`} />
          ))}
        </div>

        {/* Slide Title */}
        <div className="text-center pt-4 z-10">
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
            {slides[slideIndex].title}
          </span>
          <p className="text-[11px] text-slate-400 font-medium">
            {slides[slideIndex].subtitle}
          </p>
        </div>

        {/* Slide Inner Body Content */}
        <div className="flex-1 flex flex-col justify-center my-auto z-10">
          {slides[slideIndex].content}
        </div>

        {/* Bottom Nav */}
        <div className="flex items-center justify-between z-10 pt-2 border-t border-white/10">
          <button
            onClick={handlePrev}
            disabled={slideIndex === 0}
            className="p-2 bg-black/60 hover:bg-black text-white rounded-full disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-[10px] font-mono text-slate-400">
            {slideIndex + 1} / {slides.length}
          </span>

          <button
            onClick={handleNext}
            disabled={slideIndex === slides.length - 1}
            className="p-2 bg-amber-500 text-black font-bold rounded-full disabled:opacity-30 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
