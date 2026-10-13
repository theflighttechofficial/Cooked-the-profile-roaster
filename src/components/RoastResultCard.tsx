import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { RoastResult, PlatformType } from '../types/roast';
import { RecruiterAutoSabotageModal } from './RecruiterAutoSabotageModal';
import { WrappedStoryModal } from './WrappedStoryModal';
import { TechDebtCarbonCalculator } from './TechDebtCarbonCalculator';
import { HolographicTcgCard } from './HolographicTcgCard';
import { DualAiPanel } from './DualAiPanel';
import { WealthLossEstimator } from './WealthLossEstimator';
import { Web3WalletAuditor } from './Web3WalletAuditor';
import { toPng, toBlob } from 'html-to-image';
import confetti from 'canvas-confetti';
import {
  Flame,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Trophy,
  Swords,
  AlertTriangle,
  Activity,
  Sparkles,
  Loader2,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Briefcase,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';

interface RoastResultCardProps {
  roast: RoastResult;
  platform: PlatformType;
  username: string;
  avatarUrl: string;
  onBattleChallenge?: () => void;
  onSubmitWallOfShame?: () => void;
  onOpenPosterStudio?: () => void;
}

export const RoastResultCard: React.FC<RoastResultCardProps> = ({
  roast,
  platform,
  username,
  avatarUrl,
  onBattleChallenge,
  onSubmitWallOfShame,
  onOpenPosterStudio,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [submittedToWall, setSubmittedToWall] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioVoice, setAudioVoice] = useState('Kore');
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);
  const [showReceipts, setShowReceipts] = useState(true);
  const [showPip, setShowPip] = useState(false);
  const [exportScale, setExportScale] = useState<'2x' | '3x'>('2x');
  const [isSabotageModalOpen, setIsSabotageModalOpen] = useState(false);
  const [isWrappedModalOpen, setIsWrappedModalOpen] = useState(false);

  // Gemini TTS Speech Generator & Player
  const handlePlayTTS = async () => {
    if (isPlayingAudio && audioObj) {
      audioObj.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (audioObj) {
      audioObj.play();
      setIsPlayingAudio(true);
      return;
    }

    setLoadingAudio(true);
    try {
      const textToSpeak = `${roast.headline}. ${roast.mainRoastParagraphs.join(' ')}`;
      const res = await fetch('/api/roast/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voice: audioVoice }),
      });

      const data = await res.json();
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || 'Failed to generate audio roast');
      }

      const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      const newAudio = new Audio(audioUrl);

      newAudio.onended = () => setIsPlayingAudio(false);
      newAudio.play();

      setAudioObj(newAudio);
      setIsPlayingAudio(true);
    } catch (e: any) {
      console.error('Audio playback error:', e);
      alert(e.message || 'The voice narrator is experiencing high demand. Please try again in a few moments.');
    } finally {
      setLoadingAudio(false);
    }
  };

  // Helper to generate full un-clipped PNG data URL
  const generateFullCardPng = async (scaleMultiplier = 2) => {
    if (!cardRef.current) return null;
    const node = cardRef.current;

    // Save previous state & styles
    const prevReceiptsState = showReceipts;
    setShowReceipts(true); // Ensure receipts are open in full export

    const prevHeight = node.style.height;
    const prevMaxHeight = node.style.maxHeight;
    const prevOverflow = node.style.overflow;

    node.style.height = 'auto';
    node.style.maxHeight = 'none';
    node.style.overflow = 'visible';

    // Allow DOM layout to expand
    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
      const scrollWidth = node.scrollWidth || node.offsetWidth || 800;
      const scrollHeight = node.scrollHeight || node.offsetHeight || 1200;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: scaleMultiplier,
        width: scrollWidth,
        height: scrollHeight,
        style: {
          transform: 'none',
          maxHeight: 'none',
          height: 'auto',
          overflow: 'visible',
        },
      });

      // Restore original styles
      node.style.height = prevHeight;
      node.style.maxHeight = prevMaxHeight;
      node.style.overflow = prevOverflow;
      setShowReceipts(prevReceiptsState);

      return dataUrl;
    } catch (e) {
      console.error('Failed to generate full PNG:', e);
      node.style.height = prevHeight;
      node.style.maxHeight = prevMaxHeight;
      node.style.overflow = prevOverflow;
      setShowReceipts(prevReceiptsState);
      return null;
    }
  };

  // Handle Downloading Card as PNG Image
  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      const scale = exportScale === '3x' ? 3 : 2;
      const dataUrl = await generateFullCardPng(scale);
      if (!dataUrl) throw new Error('Could not render image canvas');

      const link = document.createElement('a');
      link.download = `cooked-full-roast-${platform}-${username}-${exportScale}.png`;
      link.href = dataUrl;
      link.click();

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
    } catch (err) {
      console.error('Failed to download image:', err);
      if (cardRef.current) {
        const fallbackUrl = await toPng(cardRef.current, { cacheBust: true, quality: 0.95 });
        const link = document.createElement('a');
        link.download = `cooked-roast-${platform}-${username}.png`;
        link.href = fallbackUrl;
        link.click();
      }
    } finally {
      setDownloading(false);
    }
  };

  // Copy Image directly to Clipboard
  const handleCopyImageToClipboard = async () => {
    try {
      const dataUrl = await generateFullCardPng(2);
      if (!dataUrl) throw new Error('Could not create image blob');

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
        confetti({ particleCount: 50, spread: 50 });
      } else {
        alert('Clipboard image copy not supported in this browser. Please use Save PNG.');
      }
    } catch (err) {
      console.error('Failed to copy image to clipboard:', err);
      handleCopyPost();
    }
  };

  // Native Mobile App Direct File Sharing
  const handleNativeShare = async () => {
    try {
      const dataUrl = await generateFullCardPng(2);
      if (!dataUrl) {
        handleCopyPost();
        return;
      }
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `cooked-${platform}-${username}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `COOKED Profile Roast - @${username}`,
          text: `🔥 AI Roasted my ${platform.toUpperCase()} profile! Cooked Score: ${roast.cookedScore}%\nVerdict: "${roast.headline}"`,
        });
      } else {
        handleCopyPost();
      }
    } catch (e) {
      console.error('Native share failed:', e);
      handleCopyPost();
    }
  };

  // Copy Social Post text
  const handleCopyPost = () => {
    const postText = `🔥 I GOT COOKED BY AI!
Platform: ${platform.toUpperCase()} (@${username})
Cooked Score: ${roast.cookedScore}% (${roast.roastTitle})
Verdict: "${roast.headline}"

Red Flags:
${roast.redFlags.map((f) => `• ${f}`).join('\n')}

Diagnosis: ${roast.psychologicalDiagnosis}
Quote: "${roast.quoteToShare}"

Check your digital footprint at Cooked AI Studio!`;

    navigator.clipboard.writeText(postText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Wall of Shame Submit
  const handleWallSubmit = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    setSubmittedToWall(true);
    if (onSubmitWallOfShame) onSubmitWallOfShame();
  };

  const receipts = roast.profileReceipts;

  return (
    <div className="space-y-6">
      
      {/* Action Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 md:p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl">
        
        {/* Voice Narrator Control */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePlayTTS}
            disabled={loadingAudio}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto ${
              isPlayingAudio
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 animate-pulse'
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:brightness-110'
            }`}
          >
            {loadingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlayingAudio ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            <span>{isPlayingAudio ? 'Pause Voice' : '🔊 Listen to Audio Roast'}</span>
          </button>

          {/* Voice Select */}
          <select
            value={audioVoice}
            onChange={(e) => {
              setAudioVoice(e.target.value);
              setAudioObj(null);
              setIsPlayingAudio(false);
            }}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="Kore">Voice: Kore (Dramatic)</option>
            <option value="Puck">Voice: Puck (Energetic)</option>
            <option value="Zephyr">Voice: Zephyr (Deadpan Cynic)</option>
            <option value="Fenrir">Voice: Fenrir (Deep)</option>
          </select>
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Resolution Scale Quality Select */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Res:</span>
            <select
              value={exportScale}
              onChange={(e) => setExportScale(e.target.value as '2x' | '3x')}
              className="bg-transparent text-xs font-bold text-orange-400 focus:outline-none cursor-pointer"
            >
              <option value="2x">2x HD</option>
              <option value="3x">3x 4K</option>
            </select>
          </div>

          {/* Download Full Image Card */}
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-red-600 hover:brightness-110 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-950/40 disabled:opacity-50"
            title="Download complete roast profile image with 0 cutoff"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Exporting...' : 'Save Full PNG'}</span>
          </button>

          {/* Recruiter Auto-Sabotage Button */}
          <button
            onClick={() => setIsSabotageModalOpen(true)}
            className="px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-900/20"
            title="Auto-sabotage candidate profile to recruiter or manager"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Recruiter Memo</span>
          </button>

          {/* Spotify Wrapped Story Button */}
          <button
            onClick={() => setIsWrappedModalOpen(true)}
            className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-900/20"
            title="Interactive Wrapped multi-slide story"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Wrapped Story</span>
          </button>

          {/* Native Share App Button */}
          <button
            onClick={handleNativeShare}
            className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-900/20"
            title="Share directly via Instagram, WhatsApp, X, or system apps"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Poster Studio Quick Jump */}
          {onOpenPosterStudio && (
            <button
              onClick={onOpenPosterStudio}
              className="px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-900/30"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Poster Studio</span>
            </button>
          )}

          {/* Copy Image Button */}
          <button
            onClick={handleCopyImageToClipboard}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Copy high-res card image to clipboard"
          >
            {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
            <span>{copiedImage ? 'Copied!' : 'Copy PNG'}</span>
          </button>

          {/* Copy Post Text */}
          <button
            onClick={handleCopyPost}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
            <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
          </button>

          {/* Roast Battle */}
          {onBattleChallenge && (
            <button
              onClick={onBattleChallenge}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Swords className="w-3.5 h-3.5 text-red-400" />
              <span>Battle</span>
            </button>
          )}

          {/* Wall of Shame */}
          <button
            onClick={handleWallSubmit}
            disabled={submittedToWall}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              submittedToWall
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{submittedToWall ? 'Posted!' : 'Wall'}</span>
          </button>
        </div>
      </div>

      {/* Main Downloadable Card Canvas */}
      <div
        ref={cardRef}
        className="relative overflow-hidden bg-gradient-to-b from-[#0e1018] via-[#0d0e15] to-[#07080c] border-2 border-orange-500/30 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8"
      >
        {/* Glow ambient background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badge & Profile Info */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={username}
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-orange-500/50 bg-slate-950 object-cover shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 p-1.5 bg-orange-600 text-white rounded-lg shadow">
                <Flame className="w-4 h-4 fill-white" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  {platform} PROFILE
                </span>
                <span className="text-xs font-bold text-slate-300">@{username}</span>
                {receipts?.name && receipts.name !== username && (
                  <span className="text-xs font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {receipts.name}
                  </span>
                )}
                {receipts?.location && (
                  <span className="text-[11px] text-slate-400">
                    📍 {receipts.location}
                  </span>
                )}
              </div>
              <h2 className="font-['Syne'] text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {roast.roastTitle}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-amber-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Awarded Badge: {roast.badgeAwarded}</span>
              </div>
            </div>
          </div>

          {/* Cooked Score Gauge with Framer Motion entry */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0, rotate: -6 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.1 }}
            className="relative flex flex-col items-center justify-center p-4 bg-slate-950/80 border border-orange-500/40 rounded-2xl min-w-[150px] shadow-2xl shadow-orange-950/40 text-center overflow-hidden group"
          >
            {/* Ambient Pulse Glow */}
            <motion.div
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 via-red-600/10 to-transparent pointer-events-none"
            />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1 z-10 flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400 animate-pulse" />
              <span>COOKED METER</span>
            </span>
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 18, delay: 0.2 }}
              className="font-['JetBrains_Mono'] text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-amber-300 drop-shadow-md z-10"
            >
              {roast.cookedScore}%
            </motion.div>
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wide mt-1 z-10 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span>EXTREME DAMAGE</span>
            </span>
          </motion.div>
        </div>

        {/* 1-Line Headline Verdict */}
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="p-4 md:p-5 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border-l-4 border-orange-500 rounded-r-2xl shadow-md"
        >
          <p className="text-base md:text-lg font-semibold text-slate-100 italic leading-relaxed">
            "{roast.headline}"
          </p>
        </motion.div>

        {/* VERIFIED DIGITAL RECEIPTS / REAL EVIDENCE DRAWER */}
        {receipts && (
          <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Inspected Footprint & Verified Real Data Receipts</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReceipts(!showReceipts)}
                className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>{showReceipts ? 'Collapse Receipts' : 'View Verified Details'}</span>
                {showReceipts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showReceipts && (
              <div className="space-y-3 pt-2 text-xs">
                {receipts.bio && (
                  <p className="text-slate-300 italic bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-bold not-italic">Bio on record: </span>
                    "{receipts.bio}"
                  </p>
                )}

                {/* Key Metrics Grid */}
                {receipts.metrics && Object.keys(receipts.metrics).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(receipts.metrics).map(([key, val], idx) => (
                      <div key={idx} className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-[10px] uppercase text-slate-400 font-mono">{key}</div>
                        <div className="font-mono font-bold text-slate-200 text-xs mt-0.5 truncate">{String(val)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inspected Items List (e.g. Real Repositories) */}
                {receipts.items && receipts.items.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 mb-1.5">
                      Analyzed Projects & Repositories ({receipts.items.length} Inspected):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {receipts.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-slate-200 flex items-center gap-1.5 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                              <span className="truncate">{item.name}</span>
                            </div>
                            {item.detail && (
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                {item.detail}
                              </p>
                            )}
                          </div>
                          {item.badge && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded shrink-0 border border-slate-700">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Roast Paragraphs with Staggered Motion */}
        <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed">
          {roast.mainRoastParagraphs.map((para, idx) => (
            <motion.p
              key={idx}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.45,
                delay: 0.3 + idx * 0.12,
                ease: [0.21, 0.47, 0.32, 0.98]
              }}
              className="bg-slate-950/40 p-4 md:p-5 rounded-2xl border border-slate-800/80 shadow-sm hover:border-slate-700/80 transition-colors"
            >
              {para}
            </motion.p>
          ))}
        </div>

        {/* Red Flags & Diagnosis with Staggered Entry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2"
        >
          
          {/* Top 3 Red Flags */}
          <div className="bg-slate-950/60 border border-red-500/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Alarming Profile Red Flags</span>
            </div>
            <ul className="space-y-2 text-xs md:text-sm text-slate-300">
              {roast.redFlags.map((flag, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Psychological Diagnosis */}
          <div className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Activity className="w-4 h-4" />
              <span>Psychological Diagnosis</span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              {roast.psychologicalDiagnosis}
            </p>
          </div>

        </motion.div>

        {/* Cooked Stat Hexagon / Bar Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Cooked Personality Breakdown
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Pretentiousness Rating', val: roast.statsRadar.pretentiousness, color: 'from-purple-500 to-indigo-500' },
              { label: 'Cringe Index', val: roast.statsRadar.cringeIndex, color: 'from-pink-500 to-red-500' },
              { label: 'Touch Grass Urgency', val: roast.statsRadar.touchGrassNeeded, color: 'from-emerald-500 to-teal-500' },
              { label: 'Sleep Deprivation Level', val: roast.statsRadar.sleepDeprivation, color: 'from-sky-500 to-blue-500' },
              { label: 'Social Skill Rating', val: roast.statsRadar.socialSkills, color: 'from-amber-500 to-orange-500' },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400">{stat.label}</span>
                  <span className="font-mono font-bold text-slate-200">{stat.val}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.max(stat.val, 5), 100)}%` }}
                    transition={{ duration: 0.75, delay: 0.75 + idx * 0.08, ease: 'easeOut' }}
                    className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CORPORATE PIP / FORMAL REPRIMAND TAB */}
        {roast.corporatePip && (
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/90">
            <button
              type="button"
              onClick={() => setShowPip(!showPip)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Official Corporate Performance Improvement Plan (PIP) Memo
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>{showPip ? 'Hide Memo' : 'Expand Official Memo'}</span>
                {showPip ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {showPip && (
              <div className="p-5 border-t border-slate-800 space-y-4 font-mono text-xs text-slate-300 bg-slate-950">
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1">
                  <div className="font-bold text-red-400">MEMORANDUM OF FORMAL REPRIMAND</div>
                  <div>To: {roast.corporatePip.employeeName}</div>
                  <div>Position: {roast.corporatePip.jobTitle}</div>
                  <div>Official Rating: {roast.corporatePip.performanceRating}</div>
                  <div>Termination Risk: <span className="text-red-400 font-bold">{roast.corporatePip.terminationRisk}</span></div>
                </div>

                <div>
                  <div className="font-bold text-slate-200 mb-1">Key Performance Deficiencies:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    {roast.corporatePip.keyDeficiencies.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="font-bold text-slate-200 mb-1">Mandatory Remediation Items:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    {roast.corporatePip.mandatoryActionItems.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Brand Watermark */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-['Syne'] font-bold text-slate-300">COOKED</span>
            <span>· AI Profile Roaster</span>
          </div>
          <span className="font-mono text-[11px]">Powered by Google Gemini AI</span>
        </div>

      </div>

      {/* Feature Section 7: Dual-AI Good Cop / Bad Cop Debate */}
      <DualAiPanel
        roast={roast}
        platform={platform}
        username={username}
      />

      {/* Feature Section 4: Dynamic Holographic Trading Card Generator (TCG) */}
      <HolographicTcgCard
        roast={roast}
        platform={platform}
        username={username}
        avatarUrl={avatarUrl}
      />

      {/* Feature Section 3: "Tech Debt" Carbon Footprint Calculator */}
      <TechDebtCarbonCalculator
        roast={roast}
        platform={platform}
        username={username}
      />

      {/* Feature Section 8: "GitHub Green Grid" Wealth Loss Estimator */}
      <WealthLossEstimator
        roast={roast}
        platform={platform}
        username={username}
      />

      {/* Feature Section 10: "Burned Assets" Web3 Wallet Auditor */}
      <Web3WalletAuditor roast={roast} />

      {/* Feature Section 1 Modal: Recruiter Auto-Sabotage Email Composer */}
      <RecruiterAutoSabotageModal
        roast={roast}
        platform={platform}
        username={username}
        isOpen={isSabotageModalOpen}
        onClose={() => setIsSabotageModalOpen(false)}
      />

      {/* Feature Section 9 Modal: Spotify Wrapped-Style "Year in Disasters" Story Mode */}
      <WrappedStoryModal
        roast={roast}
        platform={platform}
        username={username}
        avatarUrl={avatarUrl}
        isOpen={isWrappedModalOpen}
        onClose={() => setIsWrappedModalOpen(false)}
      />

    </div>
  );
};
