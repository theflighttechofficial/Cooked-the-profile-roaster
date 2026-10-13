import React, { useState } from 'react';
import { PlatformType, RoastLevel, RoastPersonality, PresetArchetype } from '../types/roast';
import { PRESET_ARCHETYPES } from '../data/presets';
import { PlatformSelector } from './PlatformSelector';
import { DelusionSlider, SelfTitle } from './DelusionSlider';
import { Sparkles, Flame, User, RefreshCw, Zap, ShieldAlert, Sliders, ExternalLink, CheckCircle2, Briefcase } from 'lucide-react';

function cleanProfileHandle(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || /^[\w-]+(\.[\w-]+)+\/\S*/i.test(s)) {
    try {
      const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
      const idParam = u.searchParams.get('id');
      if (idParam) return idParam.trim();
      const skip = new Set(['u', 'user', 'users', 'profile', 'profiles', 'id', 'in', 'member', 'members', 'player', 'ratings', 'people', 'accounts', '@']);
      const seg = u.pathname.split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } }).find((x) => !skip.has(x.toLowerCase()));
      if (!seg) return '';
      if (seg.startsWith('@') && seg.length > 1) return `${seg.slice(1)}@${u.hostname}`;
      return seg.replace(/^~/, '').trim();
    } catch {
      /* fall through */
    }
  }
  return s.replace(/^@+/, '').split(/[/?#\s]/)[0].trim();
}

const DEFAULT_HANDLES: Partial<Record<PlatformType, string>> = {
  github: 'theflighttechofficial',
  linkedin: 'satyanadella',
  leetcode: 'neal_wu',
  codeforces: 'tourist',
  gitlab: 'gitlab',
  devto: 'ben',
  npm: 'sindresorhus',
  chess: 'magnuscarlsen',
  lichess: 'DrNykterstein',
  mal: 'Xinil',
  letterboxd: 'davidehrlich',
  steam: 'gabelogannewell',
  duolingo: 'luis',
  hackernews: 'dang',
  spotify: 'spotify',
  bluesky: 'jay.bsky.team',
  mastodon: 'Gargron@mastodon.social',
  reddit: 'spez',
  stackoverflow: 'jonskeet',
  codewars: 'Voile',
  dockerhub: 'library',
};

interface ProfileInputFormProps {
  onGenerateRoast: (
    platform: PlatformType,
    username: string,
    profileData: any,
    roastLevel: RoastLevel,
    personality: RoastPersonality,
    customPrompt: string
  ) => Promise<void>;
  isLoading: boolean;
  onOpenOAuthModal: () => void;
}

export const ProfileInputForm: React.FC<ProfileInputFormProps> = ({
  onGenerateRoast,
  isLoading,
  onOpenOAuthModal,
}) => {
  const [platform, setPlatform] = useState<PlatformType>('github');
  const [usernameInput, setUsernameInput] = useState<string>('theflighttechofficial');
  const [customTextInput, setCustomTextInput] = useState<string>('');
  const [roastLevel, setRoastLevel] = useState<RoastLevel>('savage');
  const [personality, setPersonality] = useState<RoastPersonality>('sarcastic_tech');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [selfTitle, setSelfTitle] = useState<SelfTitle>('Tech God');
  const [fetchingProfile, setFetchingProfile] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [verifiedProfile, setVerifiedProfile] = useState<any | null>(null);
  const [isFromPreset, setIsFromPreset] = useState<boolean>(false);

  // LinkedIn Customizable Fields
  const [linkedinName, setLinkedinName] = useState<string>('');
  const [linkedinHeadline, setLinkedinHeadline] = useState<string>('');
  const [linkedinLocation, setLinkedinLocation] = useState<string>('');
  const [linkedinAbout, setLinkedinAbout] = useState<string>('');

  const handleSelectPreset = (preset: PresetArchetype) => {
    setPlatform(preset.platform);
    setUsernameInput(preset.username);
    setFetchError(null);
    setVerifiedProfile(preset.sampleData);
    setIsFromPreset(true);
  };

  const handleSpotifyOAuthConnect = async () => {
    try {
      const res = await fetch('/api/auth/spotify/url');
      const data = await res.json();
      if (data.url) {
        window.open(data.url, 'spotify_oauth', 'width=600,height=700');
      }
    } catch (e) {
      console.error(e);
      onOpenOAuthModal();
    }
  };

  // Dedicated manual or automatic profile fetcher
  const fetchLiveProfileData = async (targetPlatform: PlatformType, rawUser: string): Promise<any> => {
    const cleanUser = cleanProfileHandle(rawUser);
    if (!cleanUser) {
      throw new Error(`Please enter a valid ${targetPlatform.toUpperCase()} username or profile link.`);
    }

    let endpoint = '';
    if (targetPlatform === 'custom') {
      return { platform: targetPlatform, username: cleanUser };
    } else if (targetPlatform === 'linkedin') {
      const params = new URLSearchParams({
        username: cleanUser,
        ...(linkedinHeadline ? { headline: linkedinHeadline } : {}),
        ...(linkedinName ? { name: linkedinName } : {}),
        ...(linkedinLocation ? { location: linkedinLocation } : {}),
        ...(linkedinAbout ? { about: linkedinAbout } : {}),
      });
      endpoint = `/api/platform/linkedin?${params.toString()}`;
    } else {
      endpoint = `/api/platform/${targetPlatform}?username=${encodeURIComponent(cleanUser)}`;
    }

    const res = await fetch(endpoint);
    const data = await res.json().catch(() => ({ error: `${targetPlatform.toUpperCase()} service returned an invalid response.` }));
    if (!res.ok || data.error) {
      throw new Error(data.error || `Could not find ${targetPlatform.toUpperCase()} profile for "${cleanUser}".`);
    }
    return data;
  };

  const handleManualInspectProfile = async () => {
    setFetchError(null);
    if (platform === 'custom') return;
    setFetchingProfile(true);
    try {
      const data = await fetchLiveProfileData(platform, usernameInput);
      setVerifiedProfile(data);
      setIsFromPreset(false);
    } catch (err: any) {
      setFetchError(err.message || 'Failed to inspect profile.');
      setVerifiedProfile(null);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFetchError(null);

    // If custom platform with direct text
    if (platform === 'custom') {
      if (!customTextInput.trim()) {
        setFetchError('Please enter some text, bio, or playlist description to roast.');
        return;
      }
      await onGenerateRoast(
        'custom',
        'Custom User',
        { textBio: customTextInput },
        roastLevel,
        personality,
        customPrompt
      );
      return;
    }

    const cleanUser = cleanProfileHandle(usernameInput);
    if (!cleanUser) {
      setFetchError(`Please enter a valid ${platform.toUpperCase()} username or profile link.`);
      return;
    }

    // If the user already clicked preset and hasn't changed it
    const fullPrompt = [customPrompt, `[Self-Proclaimed Title: ${selfTitle}]`].filter(Boolean).join(' ');

    if (isFromPreset && verifiedProfile) {
      await onGenerateRoast(
        platform,
        verifiedProfile.username || cleanUser,
        verifiedProfile,
        roastLevel,
        personality,
        fullPrompt
      );
      return;
    }

    // If we already verified the data matching this user
    // LinkedIn always refetches so edited override fields are applied
    if (platform !== 'linkedin' && verifiedProfile && cleanProfileHandle(verifiedProfile.username).toLowerCase() === cleanUser.toLowerCase()) {
      await onGenerateRoast(
        platform,
        verifiedProfile.username || cleanUser,
        verifiedProfile,
        roastLevel,
        personality,
        fullPrompt
      );
      return;
    }

    // Fetch real profile data from server endpoints
    setFetchingProfile(true);
    try {
      const data = await fetchLiveProfileData(platform, usernameInput);
      setVerifiedProfile(data);
      setIsFromPreset(false);
      await onGenerateRoast(
        platform,
        data.username || cleanUser,
        data,
        roastLevel,
        personality,
        fullPrompt
      );
    } catch (err: any) {
      console.error('Profile fetch error:', err.message);
      setFetchError(err.message || `Failed to fetch profile for "${cleanUser}". Please verify the username.`);
    } finally {
      setFetchingProfile(false);
    }
  };

  return (
    <div className="bg-[#0e1017] border border-slate-800 rounded-2xl p-5 md:p-8 shadow-2xl space-y-6">
      
      {/* 1. Platform Switcher */}
      <PlatformSelector
        selectedPlatform={platform}
        onSelectPlatform={(p) => {
          setPlatform(p);
          setFetchError(null);
          setVerifiedProfile(null);
          setIsFromPreset(false);
          setUsernameInput(DEFAULT_HANDLES[p] ?? '');
        }}
      />

      {/* 2. Preset Quick Archetypes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Or Test Fast with a Sample Archetype
          </label>
          <span className="text-[11px] text-orange-400 font-mono">1-Click Instant Demo</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_ARCHETYPES.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all cursor-pointer ${
                platform === preset.platform && usernameInput === preset.username
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <img src={preset.avatarUrl} alt={preset.name} className="w-4 h-4 rounded-full" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 3. Input Section */}
        {platform === 'custom' ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Paste Bio, Profile Data, or Text to Roast
            </label>
            <textarea
              rows={4}
              value={customTextInput}
              onChange={(e) => setCustomTextInput(e.target.value)}
              placeholder="e.g., '24yo biohacker, ex-founder of 3 web3 startups, 5 AM ice bath enthusiast, reads 100 books a year on 2x audio speed, looking for someone who appreciates cold brew and deep work.'"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-sans resize-none"
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                {platform.toUpperCase()} Username or Profile URL
              </label>
              {platform === 'spotify' && (
                <button
                  type="button"
                  onClick={handleSpotifyOAuthConnect}
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Connect Spotify via OAuth</span>
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setFetchError(null);
                    setIsFromPreset(false);
                  }}
                  placeholder={`Enter ${platform} username or URL (e.g. github.com/theflighttechofficial)...`}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                />
              </div>

              {/* Inspect / Verify Button */}
              <button
                type="button"
                onClick={handleManualInspectProfile}
                disabled={fetchingProfile || !usernameInput.trim()}
                className="px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-orange-500/50 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {fetchingProfile ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                )}
                <span>Inspect Live Profile</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-1.5 font-mono">
              Tip: Paste the full URL (e.g. <span className="text-slate-400">github.com/theflighttechofficial</span>) or just the handle. All links auto-sanitize.
            </p>

            {/* Dedicated LinkedIn Professional Details Builder */}
            {platform === 'linkedin' && (
              <div className="mt-3 p-4 bg-slate-900/90 border border-sky-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>LinkedIn Details (optional overrides)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkedinName('');
                      setLinkedinHeadline('');
                      setLinkedinLocation('');
                      setLinkedinAbout('');
                      setVerifiedProfile(null);
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-mono underline cursor-pointer"
                  >
                    Clear overrides
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={linkedinName}
                      onChange={(e) => setLinkedinName(e.target.value)}
                      placeholder="Auto-filled from public profile if left blank"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={linkedinLocation}
                      onChange={(e) => setLinkedinLocation(e.target.value)}
                      placeholder="e.g. Redmond, WA"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    value={linkedinHeadline}
                    onChange={(e) => setLinkedinHeadline(e.target.value)}
                    placeholder="e.g. AI & ML Engineer | Building RAG Systems & Vision Pipelines"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                    About / Summary / Bio
                  </label>
                  <textarea
                    rows={2}
                    value={linkedinAbout}
                    onChange={(e) => setLinkedinAbout(e.target.value)}
                    placeholder="Briefly paste your LinkedIn About section or summary..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none font-sans"
                  />
                </div>
              </div>
            )}

            {/* Live Real Verified Profile Data Preview Card */}
            {verifiedProfile && (
              <div className="mt-4 p-4 bg-slate-950/90 border-2 border-emerald-500/40 rounded-2xl space-y-3 shadow-lg shadow-emerald-950/20">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Real Live Account Verified: Accurate Data Fetched</span>
                  </span>
                  <span className="font-mono text-[10px] text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 uppercase font-bold">
                    {platform} LIVE API
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <img
                    src={verifiedProfile.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${usernameInput}`}
                    alt="Profile Avatar"
                    className="w-14 h-14 rounded-xl border-2 border-emerald-500/40 object-cover shrink-0 bg-slate-900"
                  />
                  <div className="text-xs space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-base text-white">
                        {verifiedProfile.name || verifiedProfile.username}
                      </span>
                      <span className="font-mono text-slate-400 font-bold">
                        @{verifiedProfile.username}
                      </span>
                      {verifiedProfile.location && (
                        <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                          📍 {verifiedProfile.location}
                        </span>
                      )}
                      {verifiedProfile.blog && (
                        <span className="text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 text-[11px]">
                          🌐 {verifiedProfile.blog}
                        </span>
                      )}
                    </div>

                    {verifiedProfile.bio && (
                      <p className="text-slate-300 italic text-xs leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                        "{verifiedProfile.bio}"
                      </p>
                    )}

                    {/* Numerical Footprint Stats */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-300 font-mono pt-1">
                      {verifiedProfile.publicRepos !== undefined && (
                        <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/30 text-violet-300 rounded-md font-bold">
                          📂 {verifiedProfile.publicRepos} Public Repos
                        </span>
                      )}
                      {verifiedProfile.followers !== undefined && (
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md">
                          👥 {verifiedProfile.followers} Followers · {verifiedProfile.following || 0} Following
                        </span>
                      )}
                      {verifiedProfile.totalStars !== undefined && (
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-md">
                          ⭐ {verifiedProfile.totalStars} Stars
                        </span>
                      )}
                      {verifiedProfile.allSolved !== undefined && (
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-md font-bold">
                          🧠 {verifiedProfile.allSolved} Solved ({verifiedProfile.mediumSolved} Med, {verifiedProfile.hardSolved} Hard)
                        </span>
                      )}
                      {verifiedProfile.rating !== undefined && (
                        <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-md font-bold">
                          🏆 Rating {verifiedProfile.rating} ({verifiedProfile.rank})
                        </span>
                      )}
                      {verifiedProfile.articlesCount !== undefined && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-md font-bold">
                          ✍️ {verifiedProfile.articlesCount} Articles Published
                        </span>
                      )}
                      {verifiedProfile.totalPackages !== undefined && (
                        <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-md font-bold">
                          📦 {verifiedProfile.totalPackages} npm Packages
                        </span>
                      )}
                      {verifiedProfile.streak !== undefined && (
                        <span className="px-2 py-0.5 bg-lime-500/10 border border-lime-500/30 text-lime-300 rounded-md font-bold">
                          🔥 {verifiedProfile.streak}-Day Streak ({verifiedProfile.totalXp} XP)
                        </span>
                      )}
                      {verifiedProfile.rapidRating !== undefined && (
                        <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-md font-bold">
                          ♟️ Rapid {verifiedProfile.rapidRating} · Blitz {verifiedProfile.blitzRating}
                        </span>
                      )}
                      {verifiedProfile.topLanguages && verifiedProfile.topLanguages.length > 0 && (
                        <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-md font-bold">
                          💻 {verifiedProfile.topLanguages.join(', ')}
                        </span>
                      )}
                      {verifiedProfile.headline && (
                        <span className="px-2 py-0.5 bg-sky-500/10 border border-sky-500/30 text-sky-300 rounded-md font-bold">
                          💼 {verifiedProfile.headline}
                        </span>
                      )}
                      {verifiedProfile.connections && (
                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-md">
                          🤝 {verifiedProfile.connections}
                        </span>
                      )}
                      {verifiedProfile.skills && verifiedProfile.skills.length > 0 && (
                        <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-md">
                          🧠 Skills: {verifiedProfile.skills.slice(0, 4).join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Inspected Projects List Preview */}
                    {verifiedProfile.recentRepos && verifiedProfile.recentRepos.length > 0 && (
                      <div className="pt-2">
                        <div className="text-[11px] font-semibold text-slate-400 mb-1">
                          Inspected Repositories ({verifiedProfile.recentRepos.length} Projects Analyzed):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {verifiedProfile.recentRepos.slice(0, 6).map((repo: any, i: number) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-2 py-1 bg-slate-900 border border-slate-800 text-slate-200 rounded-md flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                              <span className="font-bold">{repo.name}</span>
                              {repo.language && <span className="text-slate-500">({repo.language})</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Roast Customizations: Level & Persona */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-800/80">
          
          {/* Roast Intensity */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Roast Heat Level</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'mild', label: '🌶️ Mild Sizzle', desc: 'Gentle teasing' },
                { id: 'savage', label: '🔥 Savage Cooked', desc: 'Brutal & witty' },
                { id: 'deep_fried', label: '🌋 Deep Fried', desc: 'Existential critique' },
                { id: 'nuclear', label: '💣 Nuclear Level', desc: 'Maximum toxicity' }
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setRoastLevel(lvl.id as RoastLevel)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    roastLevel === lvl.id
                      ? 'bg-red-500/15 border-red-500 text-white font-semibold shadow-md shadow-red-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold">{lvl.label}</div>
                  <div className="text-[10px] text-slate-400">{lvl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Persona */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-500" />
              <span>AI Roaster Voice Persona</span>
            </label>
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value as RoastPersonality)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
            >
              <option value="sarcastic_tech">🤖 Sarcastic Silicon Valley AI Bro</option>
              <option value="mean_girl">💅 TikTok Mean Girl / Influencer</option>
              <option value="fbi_profiler">🕵️ Over-Analyzing FBI Profiler</option>
              <option value="disappointed_wizard">🧙 500yo Disappointed Wizard</option>
              <option value="gordon_ramsay">👨‍🍳 Gordon Ramsay ("IT'S RAW!")</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-2">
              Determines tone, vocabulary, metaphors, and roasting angle.
            </p>
          </div>

        </div>

        {/* 5. Delusion vs Reality Ego Slider */}
        <DelusionSlider
          selectedTitle={selfTitle}
          onChangeTitle={setSelfTitle}
        />

        {/* 6. Custom Extra Context */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Optional Custom Instructions (Extra Roast Context)
          </label>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., 'Target my 3 AM commit history' or 'Roast my ambition vs my 0 stars'"
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>

        {fetchError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* 6. Submit Button */}
        <button
          type="submit"
          disabled={isLoading || fetchingProfile}
          className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 via-red-600 to-amber-500 rounded-xl font-['Syne'] font-extrabold text-base text-white tracking-wide shadow-xl shadow-orange-600/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading || fetchingProfile ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Fetching Real Profile & Roasting...</span>
            </>
          ) : (
            <>
              <Flame className="w-5 h-5 fill-white/20 text-white animate-bounce" />
              <span>ROAST THIS PROFILE NOW</span>
              <Sparkles className="w-5 h-5 text-amber-200" />
            </>
          )}
        </button>

      </form>
    </div>
  );
};
