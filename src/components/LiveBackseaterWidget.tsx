import React, { useState, useEffect } from 'react';
import { RoastResult, PlatformType } from '../types/roast';
import { MessageSquare, X, Volume2, VolumeX, Sparkles, RefreshCw } from 'lucide-react';

interface LiveBackseaterWidgetProps {
  roast?: RoastResult | null;
  platform?: PlatformType;
  username?: string;
}

const SNARKY_REMARKS = [
  "Still haven't fixed that typo in your headline?",
  "Oh look, another abandoned side project. Shocking.",
  "1,200 LeetCode problems solved and still can't invert a binary tree?",
  "Your commit messages are just 'fix bug', 'fix again', and 'pls work'.",
  "Is that your actual code or did ChatGPT hallucinate it for you?",
  "You've spent more time customizing VS Code themes than writing code.",
  "400 hours in Steam over two weeks? Your keyboard must be sweating.",
  "Looking at this repo makes my digital soul hurt.",
  "You have 45 npm packages installed for a Hello World app.",
  "I've seen cleaner code in a bowl of alphabet soup."
];

export const LiveBackseaterWidget: React.FC<LiveBackseaterWidgetProps> = ({
  roast,
  platform = 'github',
  username = 'developer',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMuted, setIsPlayingSound] = useState(false);
  const [currentRemark, setCurrentRemark] = useState<string>(SNARKY_REMARKS[0]);
  const [bubbleKey, setBubbleKey] = useState(0);

  // Cycle through remarks automatically or when roast updates
  useEffect(() => {
    if (roast) {
      const customComment = `Hey @${username}! Cooked Score is ${roast.cookedScore}%. "${roast.headline}"`;
      setCurrentRemark(customComment);
      setBubbleKey((k) => k + 1);
    }
  }, [roast, username]);

  const triggerNextRemark = () => {
    const nextIndex = Math.floor(Math.random() * SNARKY_REMARKS.length);
    setCurrentRemark(SNARKY_REMARKS[nextIndex]);
    setBubbleKey((k) => k + 1);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-5 right-5 z-40 p-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform cursor-pointer border-2 border-amber-300"
        title="Re-open Backseater Clippy"
      >
        <Sparkles className="w-5 h-5 animate-spin" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end max-w-xs sm:max-w-sm font-sans animate-bounceIn">
      
      {/* Speech Bubble */}
      <div
        key={bubbleKey}
        className="relative mb-2 p-4 bg-slate-900 border-2 border-orange-500/80 rounded-2xl shadow-2xl text-slate-100 text-xs font-medium space-y-2 group animate-fadeIn"
      >
        <div className="flex items-center justify-between text-[10px] text-orange-400 font-mono font-bold uppercase tracking-wider pb-1 border-b border-slate-800">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-orange-400" />
            <span>CLIPPY LIVE BACKSEATER EXTENSION</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={triggerNextRemark}
              className="p-1 hover:text-white cursor-pointer"
              title="Poke Clippy for new snark"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:text-white cursor-pointer"
              title="Close Extension"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <p className="italic text-slate-200 leading-relaxed font-mono">
          "{currentRemark}"
        </p>

        {/* Speech Triangle Pointer */}
        <div className="absolute -bottom-2 right-6 w-3 h-3 bg-slate-900 border-r-2 border-b-2 border-orange-500/80 transform rotate-45" />
      </div>

      {/* Pixelated Clippy / Dev Goblin Mascot Button */}
      <button
        onClick={triggerNextRemark}
        className="relative group p-2 bg-slate-950 border-2 border-orange-500/60 rounded-2xl shadow-2xl hover:scale-105 transition-transform cursor-pointer flex items-center gap-2"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 shrink-0 overflow-hidden">
          <img
            src="/src/assets/images/cooked_fire_mascot_1791179949454.jpg"
            alt="Clippy Backseater"
            className="w-full h-full object-cover rounded-lg group-hover:rotate-6 transition-transform"
          />
        </div>
        <div className="text-left pr-2">
          <div className="font-['Syne'] font-extrabold text-xs text-white">Dev Clippy</div>
          <div className="text-[10px] text-amber-400 font-mono font-bold">Online & Judging 👁️</div>
        </div>
      </button>

    </div>
  );
};
