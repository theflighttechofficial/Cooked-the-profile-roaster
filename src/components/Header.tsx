import React from 'react';
import { Flame, Sparkles, Trophy, Swords, BookOpen, Camera, Layers, HeartOff } from 'lucide-react';

export interface HeaderProps {
  activeTab: 'roast' | 'battle' | 'wall' | 'poster' | 'image' | 'oauth';
  setActiveTab: (tab: 'roast' | 'battle' | 'wall' | 'poster' | 'image' | 'oauth') => void;
  onQuickStart: () => void;
  onOpenDatingModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onQuickStart, onOpenDatingModal }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0b0c10]/80 border-b border-orange-500/20 px-4 md:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Zone 1: Single text element wordmark */}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setActiveTab('roast'); }}
          className="flex items-center gap-2 group shrink-0 focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-lg p-1"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-400 p-0.5 shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-[#0d0e15] rounded-[10px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400 fill-orange-500/20 animate-pulse" />
            </div>
          </div>
          <span className="font-['Syne'] text-xl md:text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-red-500">
            COOKED
          </span>
        </a>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('roast')}
            className={`transition-colors flex items-center gap-1.5 hover:text-orange-400 ${activeTab === 'roast' ? 'text-orange-400 font-semibold' : ''}`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Roast Profile</span>
          </button>

          {onOpenDatingModal && (
            <button
              onClick={onOpenDatingModal}
              className="transition-colors flex items-center gap-1.5 hover:text-pink-400 text-pink-300 font-semibold bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20"
            >
              <HeartOff className="w-4 h-4 text-pink-400" />
              <span>Dating Mode</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('poster')}
            className={`transition-colors flex items-center gap-1.5 hover:text-orange-400 ${activeTab === 'poster' ? 'text-orange-400 font-semibold' : ''}`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Poster Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`transition-colors flex items-center gap-1.5 hover:text-orange-400 ${activeTab === 'image' ? 'text-orange-400 font-semibold' : ''}`}
          >
            <Camera className="w-4 h-4 text-sky-400" />
            <span>Screenshot X-Ray</span>
          </button>

          <button
            onClick={() => setActiveTab('battle')}
            className={`transition-colors flex items-center gap-1.5 hover:text-orange-400 ${activeTab === 'battle' ? 'text-orange-400 font-semibold' : ''}`}
          >
            <Swords className="w-4 h-4 text-red-400" />
            <span>Roast Battle</span>
          </button>

          <button
            onClick={() => setActiveTab('wall')}
            className={`transition-colors flex items-center gap-1.5 hover:text-orange-400 ${activeTab === 'wall' ? 'text-orange-400 font-semibold' : ''}`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Wall of Shame</span>
          </button>

          <button
            onClick={() => setActiveTab('oauth')}
            className={`transition-colors flex items-center gap-1.5 hover:text-orange-400 ${activeTab === 'oauth' ? 'text-orange-400 font-semibold' : ''}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>OAuth & API</span>
          </button>
        </nav>

        {/* Zone 3: Primary action CTAs */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onQuickStart}
            className="px-4 py-2 text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 rounded-lg hover:brightness-110 shadow-lg shadow-orange-600/25 transition-all whitespace-nowrap flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Flame className="w-4 h-4 fill-white/20" />
            <span>Quick Roast Demo</span>
          </button>
        </div>

      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden items-center justify-start mt-3 pt-2.5 border-t border-slate-800 text-[11px] font-medium text-slate-400 overflow-x-auto gap-1.5 scrollbar-none py-0.5">
        <button onClick={() => setActiveTab('roast')} className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-colors ${activeTab === 'roast' ? 'text-orange-400 bg-orange-500/10 font-bold border border-orange-500/30' : 'hover:text-slate-200'}`}>Roast</button>
        {onOpenDatingModal && (
          <button onClick={onOpenDatingModal} className="py-1.5 px-2.5 rounded-lg whitespace-nowrap text-pink-300 bg-pink-500/10 font-bold border border-pink-500/20 hover:text-pink-200">💔 Dating</button>
        )}
        <button onClick={() => setActiveTab('poster')} className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-colors ${activeTab === 'poster' ? 'text-orange-400 bg-orange-500/10 font-bold border border-orange-500/30' : 'hover:text-slate-200'}`}>Poster</button>
        <button onClick={() => setActiveTab('image')} className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-colors ${activeTab === 'image' ? 'text-orange-400 bg-orange-500/10 font-bold border border-orange-500/30' : 'hover:text-slate-200'}`}>Screenshot</button>
        <button onClick={() => setActiveTab('battle')} className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-colors ${activeTab === 'battle' ? 'text-orange-400 bg-orange-500/10 font-bold border border-orange-500/30' : 'hover:text-slate-200'}`}>Battle</button>
        <button onClick={() => setActiveTab('wall')} className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-colors ${activeTab === 'wall' ? 'text-orange-400 bg-orange-500/10 font-bold border border-orange-500/30' : 'hover:text-slate-200'}`}>Wall</button>
        <button onClick={() => setActiveTab('oauth')} className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-colors ${activeTab === 'oauth' ? 'text-orange-400 bg-orange-500/10 font-bold border border-orange-500/30' : 'hover:text-slate-200'}`}>OAuth</button>
      </div>
    </header>
  );
};
