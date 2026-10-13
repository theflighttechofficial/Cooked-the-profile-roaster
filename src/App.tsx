import React, { useState } from 'react';
import { Header } from './components/Header';
import { ProfileInputForm } from './components/ProfileInputForm';
import { RoastResultCard } from './components/RoastResultCard';
import { RoastBattle } from './components/RoastBattle';
import { WallOfShame } from './components/WallOfShame';
import { OAuthGuideModal } from './components/OAuthGuideModal';
import { PosterStudio } from './components/PosterStudio';
import { ImageRoaster } from './components/ImageRoaster';
import { LiveBackseaterWidget } from './components/LiveBackseaterWidget';
import { DatingCompatibilityModal } from './components/DatingCompatibilityModal';
import { PlatformType, RoastLevel, RoastPersonality, RoastResult, SavedRoast } from './types/roast';
import { PRESET_ARCHETYPES } from './data/presets';
import { Flame, Sparkles, Zap, ShieldAlert, Layers, Camera, HeartOff } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'roast' | 'battle' | 'wall' | 'poster' | 'image' | 'oauth'>('roast');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDatingModalOpen, setIsDatingModalOpen] = useState(false);
  const [currentRoast, setCurrentRoast] = useState<RoastResult | null>(null);
  const [currentPlatform, setCurrentPlatform] = useState<PlatformType>('github');
  const [currentUsername, setCurrentUsername] = useState<string>('ferris_rust_ace');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>('https://avatars.githubusercontent.com/u/10248234?v=4');
  const [roastError, setRoastError] = useState<string | null>(null);

  const handleGenerateRoast = async (
    platform: PlatformType,
    username: string,
    profileData: any,
    roastLevel: RoastLevel,
    personality: RoastPersonality,
    customPrompt: string
  ) => {
    setIsGenerating(true);
    setRoastError(null);
    setCurrentPlatform(platform);
    setCurrentUsername(username);

    if (profileData.avatarUrl) {
      setCurrentAvatarUrl(profileData.avatarUrl);
    } else {
      setCurrentAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`);
    }

    try {
      const res = await fetch('/api/roast/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          username,
          profileData,
          roastLevel,
          personality,
          customPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.roast) {
        throw new Error(data.error || 'Failed to generate roast');
      }

      setCurrentRoast(data.roast);

      setTimeout(() => {
        const resultElem = document.getElementById('roast-result-section');
        if (resultElem) {
          resultElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Roast error:', err);
      setRoastError(err.message || 'An unexpected error occurred while roasting this profile.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageRoastGenerated = (roast: RoastResult, previewUrl: string) => {
    setCurrentRoast(roast);
    setCurrentPlatform('custom');
    setCurrentUsername('Screenshot_User');
    setCurrentAvatarUrl(previewUrl);
    setActiveTab('poster');
  };

  const handleQuickDemo = async () => {
    const randomPreset = PRESET_ARCHETYPES[Math.floor(Math.random() * PRESET_ARCHETYPES.length)];
    setActiveTab('roast');
    await handleGenerateRoast(
      randomPreset.platform,
      randomPreset.username,
      randomPreset.sampleData,
      'savage',
      'sarcastic_tech',
      ''
    );
  };

  const handleSelectRoastFromWall = (saved: SavedRoast) => {
    const formattedRoast: RoastResult = {
      headline: saved.headline,
      cookedScore: saved.cookedScore,
      roastTitle: saved.roastTitle,
      mainRoastParagraphs: saved.mainRoastParagraphs,
      redFlags: saved.redFlags,
      psychologicalDiagnosis: saved.psychologicalDiagnosis,
      statsRadar: saved.statsRadar,
      quoteToShare: saved.quoteToShare,
      badgeAwarded: saved.badgeAwarded,
    };

    setCurrentRoast(formattedRoast);
    setCurrentPlatform(saved.platform);
    setCurrentUsername(saved.username);
    setCurrentAvatarUrl(saved.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${saved.username}`);
    setActiveTab('roast');

    setTimeout(() => {
      const resultElem = document.getElementById('roast-result-section');
      if (resultElem) resultElem.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmitWallOfShame = async () => {
    if (!currentRoast) return;
    try {
      await fetch('/api/wall-of-shame/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: currentPlatform,
          username: currentUsername,
          avatarUrl: currentAvatarUrl,
          headline: currentRoast.headline,
          cookedScore: currentRoast.cookedScore,
          roastTitle: currentRoast.roastTitle,
          mainRoastParagraphs: currentRoast.mainRoastParagraphs,
          redFlags: currentRoast.redFlags,
          psychologicalDiagnosis: currentRoast.psychologicalDiagnosis,
          statsRadar: currentRoast.statsRadar,
          quoteToShare: currentRoast.quoteToShare,
          badgeAwarded: currentRoast.badgeAwarded,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans']">
      
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickStart={handleQuickDemo}
        onOpenDatingModal={() => setIsDatingModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 space-y-12">
        
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#121420] via-[#0d0e15] to-[#0b0c10] border border-orange-500/20 p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-4 max-w-2xl z-10">
            
            {/* Tagline kicker */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-orange-500 animate-pulse" />
              <span>AI PROFILE ROASTER & POSTER STUDIO</span>
            </div>

            <h1 className="font-['Syne'] text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              How Cooked Is Your <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-red-500">
                Digital Life Choice?
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-300 leading-relaxed">
              Connect Spotify, Steam, GitHub, Letterboxd, Chess.com, MyAnimeList, or upload screenshots.
              Google Gemini AI delivers savage roasts, speech audio, and 9:16 viral social media poster cards!
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={() => setActiveTab('roast')}
                className="px-5 py-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl font-['Syne'] font-extrabold text-xs md:text-sm text-white shadow-xl shadow-orange-600/25 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Roast A Profile</span>
              </button>

              <button
                onClick={() => setIsDatingModalOpen(true)}
                className="px-5 py-3 bg-gradient-to-r from-pink-600 to-rose-600 rounded-xl font-['Syne'] font-extrabold text-xs md:text-sm text-white shadow-xl shadow-pink-600/25 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <HeartOff className="w-4 h-4" />
                <span>💔 Dating Mode</span>
              </button>

              <button
                onClick={() => setActiveTab('image')}
                className="px-5 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl font-['Syne'] font-bold text-xs md:text-sm text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Upload Screenshot</span>
              </button>

              <button
                onClick={handleQuickDemo}
                className="px-5 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl font-['Syne'] font-bold text-xs md:text-sm text-slate-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Quick Demo</span>
              </button>
            </div>

          </div>

          {/* Hero Image Mascot */}
          <div className="relative shrink-0 w-48 h-48 md:w-64 md:h-64 z-10">
            <img
              src="/src/assets/images/cooked_fire_mascot_1791179949454.jpg"
              alt="Cooked Fire Mascot"
              className="w-full h-full object-cover rounded-2xl border-2 border-orange-500/40 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-300"
            />
            <div className="absolute -bottom-3 -right-3 p-2 bg-slate-950 border border-orange-500/40 rounded-xl text-center shadow-lg">
              <div className="font-mono text-xs font-bold text-orange-400">100% SAVAGE</div>
              <div className="text-[10px] text-slate-400">Gemini Powered</div>
            </div>
          </div>

        </div>

        {/* Tab Content Router */}
        {activeTab === 'roast' && (
          <div className="space-y-12">
            
            {/* Profile Input Form */}
            <ProfileInputForm
              onGenerateRoast={handleGenerateRoast}
              isLoading={isGenerating}
              onOpenOAuthModal={() => setActiveTab('oauth')}
            />

            {roastError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-sm text-red-300 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <span>{roastError}</span>
              </div>
            )}

            {/* Roast Result View */}
            {currentRoast && (
              <div id="roast-result-section" className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-400 uppercase tracking-wider">
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                    <span>Your Generated Profile Roast</span>
                  </div>

                  <button
                    onClick={() => setActiveTab('poster')}
                    className="px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Open in Poster Studio</span>
                  </button>
                </div>

                <RoastResultCard
                  roast={currentRoast}
                  platform={currentPlatform}
                  username={currentUsername}
                  avatarUrl={currentAvatarUrl}
                  onBattleChallenge={() => setActiveTab('battle')}
                  onSubmitWallOfShame={handleSubmitWallOfShame}
                  onOpenPosterStudio={() => setActiveTab('poster')}
                />
              </div>
            )}

          </div>
        )}

        {activeTab === 'poster' && (
          currentRoast ? (
            <PosterStudio
              roast={currentRoast}
              platform={currentPlatform}
              username={currentUsername}
              avatarUrl={currentAvatarUrl}
            />
          ) : (
            <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-3xl space-y-4">
              <Layers className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">No Active Roast Loaded</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Generate a profile roast first or try a quick demo to customize your social media poster!
              </p>
              <button
                onClick={handleQuickDemo}
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold text-xs rounded-xl hover:brightness-110 cursor-pointer"
              >
                Generate Demo Roast First
              </button>
            </div>
          )
        )}

        {activeTab === 'image' && (
          <ImageRoaster onImageRoastGenerated={handleImageRoastGenerated} />
        )}

        {activeTab === 'battle' && (
          <RoastBattle
            initialRoast={currentRoast}
            initialPlatform={currentPlatform}
            initialUsername={currentUsername}
          />
        )}

        {activeTab === 'wall' && (
          <WallOfShame onSelectRoastForDetail={handleSelectRoastFromWall} />
        )}

        {activeTab === 'oauth' && (
          <OAuthGuideModal />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-[#07080c] mt-auto py-8 px-4 md:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-['Syne'] font-extrabold text-slate-300 text-sm">COOKED</span>
            <span>· The AI Profile Roaster</span>
          </div>

          <div className="flex items-center gap-5">
            <button onClick={() => setActiveTab('roast')} className="hover:text-slate-300 transition-colors">Roast</button>
            <button onClick={() => setActiveTab('poster')} className="hover:text-slate-300 transition-colors">Poster Studio</button>
            <button onClick={() => setActiveTab('image')} className="hover:text-slate-300 transition-colors">Screenshot</button>
            <button onClick={() => setActiveTab('battle')} className="hover:text-slate-300 transition-colors">Battle</button>
            <button onClick={() => setActiveTab('wall')} className="hover:text-slate-300 transition-colors">Wall of Shame</button>
            <button onClick={() => setActiveTab('oauth')} className="hover:text-slate-300 transition-colors">OAuth Guide</button>
          </div>

          <span className="font-mono text-[11px] text-slate-600">
            Powered by Google AI Studio & Gemini 3.8 Flash
          </span>
        </div>
      </footer>

      {/* Floating Extension Simulator: Live Backseater Clippy */}
      <LiveBackseaterWidget
        roast={currentRoast}
        platform={currentPlatform}
        username={currentUsername}
      />

      {/* Dating Mode Modal */}
      <DatingCompatibilityModal
        isOpen={isDatingModalOpen}
        onClose={() => setIsDatingModalOpen(false)}
        primaryUsername={currentUsername}
        primaryPlatform={currentPlatform}
      />

    </div>
  );
}
