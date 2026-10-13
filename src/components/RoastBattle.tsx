import React, { useState } from 'react';
import { RoastResult, PlatformType } from '../types/roast';
import { PRESET_ARCHETYPES } from '../data/presets';
import { Swords, Trophy, Flame, Sparkles, Loader2 } from 'lucide-react';

interface RoastBattleProps {
  initialRoast?: RoastResult | null;
  initialPlatform?: PlatformType;
  initialUsername?: string;
}

export const RoastBattle: React.FC<RoastBattleProps> = ({
  initialRoast,
  initialPlatform = 'github',
  initialUsername = 'torvalds',
}) => {
  const [profile1, setProfile1] = useState({
    platform: initialPlatform,
    username: initialUsername,
    roast: initialRoast || null,
  });

  const [profile2, setProfile2] = useState({
    platform: 'spotify' as PlatformType,
    username: 'crying_at_3am',
    roast: null as RoastResult | null,
  });

  const [isBattling, setIsBattling] = useState(false);

  const fetchRoastForProfile = async (platform: PlatformType, username: string) => {
    // Check preset archetypes first
    const preset = PRESET_ARCHETYPES.find(
      (p) => p.platform === platform && p.username.toLowerCase() === username.toLowerCase()
    );

    const profileData = preset ? preset.sampleData : { platform, username, bio: `User ${username}` };

    const res = await fetch('/api/roast/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        username,
        profileData,
        roastLevel: 'nuclear',
        personality: 'sarcastic_tech',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.roast) throw new Error('Battle generation failed');
    return data.roast as RoastResult;
  };

  const handleStartBattle = async () => {
    setIsBattling(true);
    try {
      const roast1 = profile1.roast || (await fetchRoastForProfile(profile1.platform, profile1.username));
      const roast2 = await fetchRoastForProfile(profile2.platform, profile2.username);

      setProfile1((prev) => ({ ...prev, roast: roast1 }));
      setProfile2((prev) => ({ ...prev, roast: roast2 }));
    } catch (err) {
      console.error(err);
      alert('Could not complete Roast Battle comparison.');
    } finally {
      setIsBattling(false);
    }
  };

  // Winner calculation
  const winner =
    profile1.roast && profile2.roast
      ? profile1.roast.cookedScore >= profile2.roast.cookedScore
        ? 1
        : 2
      : null;

  return (
    <div className="bg-[#0e1017] border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8">
      
      {/* Title */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-400">
          <Swords className="w-4 h-4" />
          <span>ROAST BATTLE ARENA</span>
        </div>
        <h2 className="font-['Syne'] text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Who Is More Cooked?
        </h2>
        <p className="text-sm text-slate-400">
          Pit two profiles against each other in the ultimate AI Battle to crown the reigning Champion of Shame.
        </p>
      </div>

      {/* Battle Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        
        {/* Profile 1 */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-orange-400 tracking-wider">
              Contender #1
            </span>
            {winner === 1 && (
              <span className="text-xs bg-amber-500 text-black font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Winner of Shame
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Platform</label>
              <select
                value={profile1.platform}
                onChange={(e) =>
                  setProfile1({ ...profile1, platform: e.target.value as PlatformType, roast: null })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="github">GitHub</option>
                <option value="spotify">Spotify</option>
                <option value="steam">Steam</option>
                <option value="letterboxd">Letterboxd</option>
                <option value="chess">Chess.com</option>
                <option value="mal">MyAnimeList</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Username</label>
              <input
                type="text"
                value={profile1.username}
                onChange={(e) => setProfile1({ ...profile1, username: e.target.value, roast: null })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>

          {profile1.roast && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-orange-300">{profile1.roast.roastTitle}</span>
                <span className="font-mono text-xl font-black text-orange-400">{profile1.roast.cookedScore}%</span>
              </div>
              <p className="text-xs text-slate-300 italic">"{profile1.roast.headline}"</p>
            </div>
          )}
        </div>

        {/* VS Badge Floating Center */}
        <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-red-600 rounded-full border-4 border-[#0e1017] items-center justify-center font-black text-white text-sm z-10 shadow-xl">
          VS
        </div>

        {/* Profile 2 */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-red-400 tracking-wider">
              Contender #2
            </span>
            {winner === 2 && (
              <span className="text-xs bg-amber-500 text-black font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Winner of Shame
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Platform</label>
              <select
                value={profile2.platform}
                onChange={(e) =>
                  setProfile2({ ...profile2, platform: e.target.value as PlatformType, roast: null })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="spotify">Spotify</option>
                <option value="steam">Steam</option>
                <option value="github">GitHub</option>
                <option value="letterboxd">Letterboxd</option>
                <option value="chess">Chess.com</option>
                <option value="mal">MyAnimeList</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Username</label>
              <input
                type="text"
                value={profile2.username}
                onChange={(e) => setProfile2({ ...profile2, username: e.target.value, roast: null })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>

          {profile2.roast && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-red-300">{profile2.roast.roastTitle}</span>
                <span className="font-mono text-xl font-black text-red-400">{profile2.roast.cookedScore}%</span>
              </div>
              <p className="text-xs text-slate-300 italic">"{profile2.roast.headline}"</p>
            </div>
          )}
        </div>

      </div>

      {/* Start Battle Button */}
      <button
        onClick={handleStartBattle}
        disabled={isBattling}
        className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 rounded-2xl font-['Syne'] font-extrabold text-base text-white tracking-wide shadow-xl shadow-red-600/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isBattling ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Simulating Savage Battle...</span>
          </>
        ) : (
          <>
            <Flame className="w-5 h-5 fill-white" />
            <span>BEGIN BATTLE COMPARISON</span>
            <Sparkles className="w-5 h-5 text-amber-200" />
          </>
        )}
      </button>

      {/* Comparison Verdict */}
      {winner && profile1.roast && profile2.roast && (
        <div className="p-6 bg-slate-950 border-2 border-amber-500/50 rounded-2xl text-center space-y-3">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
          <h3 className="font-['Syne'] text-2xl font-black text-white">
            {winner === 1 ? profile1.username : profile2.username} IS CROWNED MOST COOKED!
          </h3>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            With an overwhelming Cooked score of{' '}
            <span className="font-mono font-bold text-amber-400">
              {winner === 1 ? profile1.roast.cookedScore : profile2.roast.cookedScore}%
            </span>
            , their profile shows an undeniable collapse of touch-grass capability!
          </p>
        </div>
      )}

    </div>
  );
};
