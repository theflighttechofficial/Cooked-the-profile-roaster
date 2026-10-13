import React, { useState, useEffect } from 'react';
import { SavedRoast } from '../types/roast';
import confetti from 'canvas-confetti';
import { Trophy, ThumbsUp, Search, Flame, Filter, Sparkles } from 'lucide-react';

interface WallOfShameProps {
  onSelectRoastForDetail?: (roast: SavedRoast) => void;
}

export const WallOfShame: React.FC<WallOfShameProps> = ({ onSelectRoastForDetail }) => {
  const [roasts, setRoasts] = useState<SavedRoast[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const fetchWall = async () => {
    try {
      const res = await fetch('/api/wall-of-shame');
      const data = await res.json();
      if (data.roasts) {
        setRoasts(data.roasts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWall();
  }, []);

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/wall-of-shame/upvote/${id}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRoasts((prev) =>
          prev.map((r) => (r.id === id ? { ...r, upvotes: data.upvotes } : r))
        );
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRoasts = roasts.filter((r) => {
    const matchesSearch =
      r.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roastTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform = selectedPlatform === 'all' || r.platform === selectedPlatform;

    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-8">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/30 p-8 md:p-12 bg-slate-950">
        <img
          src="/src/assets/images/wall_of_shame_banner_1791179960656.jpg"
          alt="Wall of Shame Banner"
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c10] via-[#0b0c10]/80 to-transparent" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>HALL OF SHAME</span>
          </div>
          <h2 className="font-['Syne'] text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            The Public Wall of Shame
          </h2>
          <p className="text-sm md:text-base text-slate-300">
            Browse, laugh, and upvote the most severely cooked profiles submitted by users around the world.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search username, title, or verdict..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['all', 'github', 'spotify', 'steam', 'letterboxd', 'chess', 'mal'].map((plt) => (
            <button
              key={plt}
              onClick={() => setSelectedPlatform(plt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all cursor-pointer ${
                selectedPlatform === plt
                  ? 'bg-orange-500 text-white font-bold shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {plt}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading Wall of Shame...</div>
      ) : filteredRoasts.length === 0 ? (
        <div className="py-16 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <p className="text-slate-300 font-semibold">No cooked profiles found matching filter.</p>
          <p className="text-xs text-slate-500">Be the first to submit a profile to the Wall of Shame!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoasts.map((roast) => (
            <div
              key={roast.id}
              onClick={() => onSelectRoastForDetail && onSelectRoastForDetail(roast)}
              className="bg-slate-950/80 border border-slate-800 hover:border-orange-500/50 rounded-2xl p-5 space-y-4 transition-all duration-200 hover:-translate-y-1 shadow-lg group cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={roast.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${roast.username}`}
                    alt={roast.username}
                    className="w-12 h-12 rounded-xl bg-slate-900 border border-orange-500/30 object-cover shrink-0"
                  />
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                      {roast.platform}
                    </span>
                    <h3 className="font-['Syne'] font-extrabold text-white text-base mt-1 line-clamp-1 group-hover:text-orange-400 transition-colors">
                      @{roast.username}
                    </h3>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono text-xl font-black text-orange-400">{roast.cookedScore}%</div>
                  <span className="text-[10px] text-slate-500 font-mono">COOKED</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-amber-300 mb-1">{roast.roastTitle}</h4>
                <p className="text-xs text-slate-300 line-clamp-2 italic">"{roast.headline}"</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs text-slate-400">
                <span className="text-[11px] font-mono text-amber-400/90">{roast.badgeAwarded}</span>

                <button
                  onClick={(e) => handleUpvote(roast.id, e)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-orange-500 hover:text-white rounded-lg border border-slate-800 transition-all font-mono font-bold text-slate-300 cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{roast.upvotes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
