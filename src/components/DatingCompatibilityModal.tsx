import React, { useState } from 'react';
import { PlatformType, CompatibilityResult } from '../types/roast';
import { Heart, HeartOff, Sparkles, Loader2, ShieldAlert, Zap, Flame, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DatingCompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryUsername?: string;
  primaryPlatform?: PlatformType;
}

export const DatingCompatibilityModal: React.FC<DatingCompatibilityModalProps> = ({
  isOpen,
  onClose,
  primaryUsername = 'theflighttechofficial',
  primaryPlatform = 'github',
}) => {
  const [partnerUsername, setPartnerUsername] = useState('cinema_critic');
  const [partnerPlatform, setPartnerPlatform] = useState<PlatformType>('letterboxd');
  const [isAuditing, setIsAuditing] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  if (!isOpen) return null;

  const handleRunDatingAudit = async () => {
    setIsAuditing(true);
    setResult(null);

    try {
      const res = await fetch('/api/roast/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile1: { platform: primaryPlatform, username: primaryUsername },
          profile2: { platform: partnerPlatform, username: partnerUsername.trim() || 'mystery_crush' },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.result) throw new Error(data.error || 'Audit failed');
      const compResult: CompatibilityResult = data.result;

      setResult(compResult);
      confetti({ particleCount: 70, spread: 70 });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0e0f17] border-2 border-pink-500/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-pink-500/20 border border-pink-500/40 rounded-2xl text-pink-400 shrink-0">
            <HeartOff className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] font-mono font-bold uppercase">
              <Sparkles className="w-3 h-3" />
              <span>Compatibility Killer Mode</span>
            </div>
            <h2 className="font-['Syne'] text-xl md:text-2xl font-black text-white">
              Tech / Gaming Dating Audit
            </h2>
            <p className="text-xs text-slate-400">
              Run an AI relationship audit comparing your digital footprint against your crush or partner.
            </p>
          </div>
        </div>

        {/* Footprint Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          
          {/* User 1 */}
          <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="text-xs font-bold text-amber-400 uppercase">You (Partner 1)</div>
            <div className="font-mono text-xs text-white font-bold">@{primaryUsername}</div>
            <div className="text-[11px] text-slate-400 uppercase font-mono">{primaryPlatform} Profile</div>
          </div>

          {/* User 2 */}
          <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-pink-500/30">
            <div className="text-xs font-bold text-pink-400 uppercase">Partner / Crush (Partner 2)</div>
            <input
              type="text"
              value={partnerUsername}
              onChange={(e) => setPartnerUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-mono"
              placeholder="Partner handle..."
            />
            <select
              value={partnerPlatform}
              onChange={(e) => setPartnerPlatform(e.target.value as PlatformType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none font-mono"
            >
              <option value="letterboxd">Letterboxd</option>
              <option value="steam">Steam</option>
              <option value="github">GitHub</option>
              <option value="leetcode">LeetCode</option>
              <option value="linkedin">LinkedIn</option>
              <option value="spotify">Spotify</option>
              <option value="mal">MyAnimeList</option>
              <option value="reddit">Reddit</option>
              <option value="bluesky">Bluesky</option>
              <option value="lichess">Lichess</option>
              <option value="stackoverflow">Stack Overflow</option>
            </select>
          </div>

        </div>

        {/* Trigger Button */}
        <button
          onClick={handleRunDatingAudit}
          disabled={isAuditing}
          className="w-full py-3 bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 hover:brightness-110 text-white font-extrabold text-xs md:text-sm rounded-2xl shadow-xl shadow-pink-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isAuditing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <HeartOff className="w-4 h-4" />
          )}
          <span>{isAuditing ? 'Running Dating Red Flag Audit...' : 'Audit Relationship Compatibility'}</span>
        </button>

        {/* Audit Results */}
        {result && (
          <div className="p-5 bg-slate-950 border-2 border-pink-500/40 rounded-2xl space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-pink-400 uppercase block">COMPATIBILITY VERDICT</span>
                <h4 className="font-['Syne'] text-lg font-black text-white">{result.verdictTitle}</h4>
              </div>
              <div className="text-right">
                <span className="font-['JetBrains_Mono'] text-3xl font-black text-pink-400">
                  {result.compatibilityScore}%
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">Compatibility Score</span>
              </div>
            </div>

            <p className="text-xs text-slate-200 italic leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800">
              "{result.relationshipSummary}"
            </p>

            <div>
              <div className="text-xs font-bold text-red-400 uppercase mb-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Irreconcilable Relationship Red Flags:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                {result.irreconcilableDifferences.map((diff, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-pink-500 font-bold">•</span>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
