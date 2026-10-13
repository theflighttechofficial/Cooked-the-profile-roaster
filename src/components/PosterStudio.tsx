import React, { useRef, useState } from 'react';
import { RoastResult, PlatformType } from '../types/roast';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import {
  Flame,
  Download,
  Copy,
  Check,
  Sparkles,
  Share2,
  Tv,
  Image as ImageIcon,
  Sliders,
  QrCode,
  AlertTriangle,
  Award,
  Layers
} from 'lucide-react';

interface PosterStudioProps {
  roast: RoastResult;
  platform: PlatformType;
  username: string;
  avatarUrl?: string;
}

export type PosterFormat = 'story' | 'feed' | 'banner' | 'infographic';
export type PosterTheme = 'cyber' | 'tabloid' | 'vhs' | 'minimal' | 'toxic' | 'synthwave';

export const PosterStudio: React.FC<PosterStudioProps> = ({
  roast,
  platform,
  username,
  avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);

  const [format, setFormat] = useState<PosterFormat>('story');
  const [theme, setTheme] = useState<PosterTheme>('cyber');
  const [selectedSticker, setSelectedSticker] = useState<string>('100% COOKED');
  const [showRedFlags, setShowRedFlags] = useState(true);
  const [showDiagnosis, setShowDiagnosis] = useState(true);
  const [showReceipts, setShowReceipts] = useState(true);
  const [showParagraphs, setShowParagraphs] = useState(false);
  const [showBranding, setShowBranding] = useState(true);
  const [fitContentHeight, setFitContentHeight] = useState(true);
  const [exportResolution, setExportResolution] = useState<'2x' | '3x'>('2x');

  const [isExporting, setIsExporting] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const receipts = roast.profileReceipts;

  // Download High-Res PNG with 0 Cutoff Guarantee
  const handleDownloadPng = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    try {
      const node = posterRef.current;
      const prevHeight = node.style.height;
      const prevMaxHeight = node.style.maxHeight;

      if (fitContentHeight) {
        node.style.height = 'auto';
        node.style.maxHeight = 'none';
      }

      await new Promise((res) => setTimeout(resolve => setTimeout(res, 60)));

      const scrollWidth = node.scrollWidth || node.offsetWidth || 500;
      const scrollHeight = node.scrollHeight || node.offsetHeight || 800;
      const scale = exportResolution === '3x' ? 3 : 2;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: scale,
        width: scrollWidth,
        height: scrollHeight,
        style: {
          transform: 'none',
          maxHeight: 'none',
          height: 'auto',
          overflow: 'visible',
        },
      });

      node.style.height = prevHeight;
      node.style.maxHeight = prevMaxHeight;

      const link = document.createElement('a');
      link.download = `cooked-poster-${theme}-${format}-${username}-${exportResolution}.png`;
      link.href = dataUrl;
      link.click();

      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
    } catch (err) {
      console.error('Failed to export poster PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Direct Image to Clipboard
  const handleCopyImageToClipboard = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    try {
      const node = posterRef.current;
      const prevHeight = node.style.height;
      const prevMaxHeight = node.style.maxHeight;

      if (fitContentHeight) {
        node.style.height = 'auto';
        node.style.maxHeight = 'none';
      }

      await new Promise((res) => setTimeout(res, 60));

      const scrollWidth = node.scrollWidth || node.offsetWidth || 500;
      const scrollHeight = node.scrollHeight || node.offsetHeight || 800;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 2,
        width: scrollWidth,
        height: scrollHeight,
        style: {
          transform: 'none',
          maxHeight: 'none',
          height: 'auto',
        },
      });

      node.style.height = prevHeight;
      node.style.maxHeight = prevMaxHeight;

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2500);
        confetti({ particleCount: 50, spread: 50 });
      } else {
        alert('Clipboard image copy not supported in this browser. Please use Export High-Res PNG.');
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Native Mobile Web Share
  const handleNativeShare = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);
    try {
      const node = posterRef.current;
      const prevHeight = node.style.height;
      if (fitContentHeight) {
        node.style.height = 'auto';
      }
      await new Promise((res) => setTimeout(res, 60));

      const scrollWidth = node.scrollWidth || node.offsetWidth;
      const scrollHeight = node.scrollHeight || node.offsetHeight;

      const dataUrl = await toPng(node, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 2,
        width: scrollWidth,
        height: scrollHeight,
      });

      node.style.height = prevHeight;

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `cooked-poster-${username}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `COOKED Poster - @${username}`,
          text: `Check out my AI Profile Roast poster! Cooked Score: ${roast.cookedScore}%\n"${roast.headline}"`,
        });
      } else {
        handleCopyTextPoster();
      }
    } catch (e) {
      console.error('Native share failed:', e);
      handleCopyTextPoster();
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Pastable ASCII / Emoji Text Poster
  const handleCopyTextPoster = () => {
    const textPoster = `
🔥 ══════════════════════════ 🔥
       COOKED PROFILE VERDICT
🔥 ══════════════════════════ 🔥

👤 User: @${username} [${platform.toUpperCase()}]
🏆 Archetype: ${roast.roastTitle}
🔥 Cooked Score: ${roast.cookedScore}% [EXTREME]

💬 VERDICT:
"${roast.headline}"

🚨 RED FLAGS:
${roast.redFlags.map((f) => `• ${f}`).join('\n')}

🩺 DIAGNOSIS:
${roast.psychologicalDiagnosis}

🎖️ BADGE: ${roast.badgeAwarded}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tested with Cooked AI Profile Roaster
https://ais-dev-tlibyh4o4qrrjsxt2kk3if-675469082848.asia-southeast1.run.app
`;

    navigator.clipboard.writeText(textPoster.trim());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="bg-[#0e1017] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs font-bold text-orange-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SOCIAL MEDIA POSTER STUDIO</span>
          </div>
          <h2 className="font-['Syne'] text-2xl md:text-3xl font-extrabold text-white">
            Custom Viral Poster Generator
          </h2>
          <p className="text-xs text-slate-400">
            Export 9:16 Stories, 1:1 Feed Posts, or copy pastable text & clipboard images for Instagram, X, or TikTok.
          </p>
        </div>

        {/* Primary Action Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Resolution Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <span className="font-mono font-bold text-slate-400 uppercase text-[10px]">Export Res:</span>
            <select
              value={exportResolution}
              onChange={(e) => setExportResolution(e.target.value as '2x' | '3x')}
              className="bg-transparent text-orange-400 font-bold focus:outline-none cursor-pointer"
            >
              <option value="2x">Ultra HD (2x)</option>
              <option value="3x">Super 4K (3x)</option>
            </select>
          </div>

          <button
            onClick={handleNativeShare}
            disabled={isExporting}
            className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Share poster directly via system share dialog"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Poster</span>
          </button>

          <button
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:brightness-110 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export PNG (0 Cutoff)'}</span>
          </button>

          <button
            onClick={handleCopyImageToClipboard}
            disabled={isExporting}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>{copiedImage ? 'Copied Image!' : 'Copy Image'}</span>
          </button>

          <button
            onClick={handleCopyTextPoster}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Copy className="w-4 h-4 text-sky-400" />
            <span>{copiedText ? 'Copied Text!' : 'Copy Text'}</span>
          </button>
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
        
        {/* 1. Format Preset */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>Aspect Ratio & Format</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'story', label: '📱 9:16 Story' },
              { id: 'feed', label: '🟦 1:1 Feed' },
              { id: 'banner', label: '📜 16:9 Banner' },
              { id: 'infographic', label: '📊 Longcard' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id as PosterFormat)}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                  format === f.id
                    ? 'bg-orange-500 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Theme Styles */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Visual Theme</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'cyber', label: '🔥 Cyber' },
              { id: 'tabloid', label: '📰 Scandal' },
              { id: 'vhs', label: '📼 VHS' },
              { id: 'toxic', label: '☣️ Toxic' },
              { id: 'synthwave', label: '🌆 Synth' },
              { id: 'minimal', label: '🖤 Monolith' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as PosterTheme)}
                className={`py-2 px-1.5 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                  theme === t.id
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Sticker Badge */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-red-400" />
            <span>Sticker Badge</span>
          </label>
          <select
            value={selectedSticker}
            onChange={(e) => setSelectedSticker(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-bold cursor-pointer"
          >
            <option value="100% COOKED">100% COOKED 🔥</option>
            <option value="CERTIFIED GRASS AVOIDER">CERTIFIED GRASS AVOIDER 🌱</option>
            <option value="RED FLAG ALERT">RED FLAG ALERT 🚨</option>
            <option value="THERAPY NEEDED">THERAPY NEEDED 🩺</option>
            <option value="NO HUMAN CONTACT">NO HUMAN CONTACT 🚫</option>
          </select>
        </div>

        {/* 4. Display Toggles */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Content & Cutoff Toggles
          </label>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={fitContentHeight}
                onChange={(e) => setFitContentHeight(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-orange-500"
              />
              <span className="font-bold text-amber-400">0 Cutoff (Auto-Fit Height)</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showRedFlags}
                onChange={(e) => setShowRedFlags(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-orange-500"
              />
              <span>Red Flags</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showDiagnosis}
                onChange={(e) => setShowDiagnosis(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-orange-500"
              />
              <span>Diagnosis</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showReceipts}
                onChange={(e) => setShowReceipts(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-orange-500"
              />
              <span>Real Footprint</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showParagraphs}
                onChange={(e) => setShowParagraphs(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-orange-500"
              />
              <span>Full Roast Text</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showBranding}
                onChange={(e) => setShowBranding(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-orange-500"
              />
              <span>Watermark</span>
            </label>
          </div>
        </div>

      </div>

      {/* Live Poster Preview Container */}
      <div className="flex justify-center p-4 md:p-8 bg-slate-950/90 border border-slate-800 rounded-2xl overflow-x-auto">
        <div
          ref={posterRef}
          className={`relative overflow-hidden transition-all duration-300 shrink-0 p-8 flex flex-col justify-between shadow-2xl ${
            format === 'infographic'
              ? 'w-[520px] h-auto min-h-[720px]'
              : format === 'story'
              ? fitContentHeight ? 'w-[380px] h-auto min-h-[640px]' : 'w-[360px] h-[640px]'
              : format === 'feed'
              ? fitContentHeight ? 'w-[480px] h-auto min-h-[480px]' : 'w-[480px] h-[480px]'
              : fitContentHeight ? 'w-[640px] h-auto min-h-[360px]' : 'w-[640px] h-[360px]'
          } ${
            theme === 'cyber'
              ? 'bg-gradient-to-b from-[#0f111a] via-[#0d0e15] to-[#08090d] text-white border-4 border-orange-500/50'
              : theme === 'tabloid'
              ? 'bg-[#f4f1ea] text-black border-4 border-black font-serif'
              : theme === 'vhs'
              ? 'bg-[#090a10] text-emerald-400 border-4 border-purple-600 font-mono'
              : theme === 'toxic'
              ? 'bg-gradient-to-b from-[#051a10] via-[#07130c] to-[#010a05] text-emerald-300 border-4 border-emerald-500/80'
              : theme === 'synthwave'
              ? 'bg-gradient-to-b from-[#180a29] via-[#120520] to-[#080212] text-pink-300 border-4 border-cyan-400'
              : 'bg-[#000000] text-slate-100 border-2 border-slate-700'
          }`}
        >
          {/* Theme Background Details */}
          {theme === 'cyber' && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
          )}

          {theme === 'synthwave' && (
            <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-cyan-500/20 via-pink-500/10 to-transparent pointer-events-none" />
          )}

          {theme === 'vhs' && (
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
          )}

          {/* Top Brand Stamp */}
          <div className="flex items-center justify-between border-b pb-4 mb-4 border-current/20 relative z-10">
            <div className="flex items-center gap-2">
              <Flame className={`w-5 h-5 ${theme === 'tabloid' ? 'text-black' : 'text-orange-500'}`} />
              <span className="font-['Syne'] font-black tracking-tight text-lg">COOKED</span>
              <span className="text-[10px] font-mono opacity-60">· AI ROASTER</span>
            </div>

            {/* Sticker Badge Overlay */}
            <div className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded shadow ${
              theme === 'tabloid' ? 'bg-red-600 text-white' : 'bg-gradient-to-r from-red-600 to-orange-500 text-white'
            }`}>
              {selectedSticker}
            </div>
          </div>

          {/* Core Profile Banner */}
          <div className="space-y-4 relative z-10 flex-1 flex flex-col justify-center">
            
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl}
                alt={username}
                className={`w-14 h-14 rounded-xl object-cover border-2 shrink-0 ${
                  theme === 'tabloid' ? 'border-black grayscale' : 'border-orange-500'
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono uppercase opacity-70">
                    {platform} PROFILE
                  </span>
                  {receipts?.name && receipts.name !== username && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-current/10 rounded">
                      {receipts.name}
                    </span>
                  )}
                </div>
                <h3 className="font-['Syne'] font-black text-xl leading-tight truncate">
                  @{username}
                </h3>
                <span className="text-xs font-bold opacity-80">{roast.roastTitle}</span>
              </div>
            </div>

            {/* Verified Footprint Receipts Banner on Poster */}
            {showReceipts && receipts && (
              <div className="p-2 rounded-lg border border-current/20 bg-current/5 text-[10px] font-mono space-y-1">
                <div className="flex items-center justify-between opacity-70 uppercase tracking-wider text-[9px] font-bold">
                  <span>VERIFIED LIVE DATA</span>
                  {receipts.location && <span>📍 {receipts.location}</span>}
                </div>
                {receipts.metrics && (
                  <div className="flex flex-wrap gap-2 pt-0.5 opacity-90 font-bold">
                    {Object.entries(receipts.metrics).slice(0, 3).map(([k, v], i) => (
                      <span key={i} className="bg-current/10 px-1.5 py-0.5 rounded">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Big Score Indicator */}
            <div className="p-3 rounded-xl border border-current/20 bg-current/5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase opacity-60 block">COOKED SCORE</span>
                <span className="text-xs font-bold">{roast.badgeAwarded}</span>
              </div>
              <div className="font-['JetBrains_Mono'] text-3xl font-black">
                {roast.cookedScore}%
              </div>
            </div>

            {/* Headline Verdict */}
            <p className="text-xs md:text-sm font-semibold italic leading-relaxed border-l-2 border-current pl-3">
              "{roast.headline}"
            </p>

            {/* Optional Full Roast Paragraphs */}
            {showParagraphs && (
              <div className="space-y-2 text-[11px] opacity-90">
                {roast.mainRoastParagraphs.map((para, i) => (
                  <p key={i} className="p-2 rounded-lg bg-current/5 border border-current/10 italic leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}

            {/* Red Flags Optional */}
            {showRedFlags && (
              <div className="space-y-1 text-[11px]">
                <span className="font-bold uppercase text-[9px] opacity-60 block">RED FLAGS</span>
                {roast.redFlags.slice(0, format === 'story' ? 3 : 2).map((flag, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 opacity-90">
                    <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="truncate">{flag}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Diagnosis Optional */}
            {showDiagnosis && (
              <div className="p-2.5 rounded-lg border border-current/20 bg-current/5 text-[10px] font-mono leading-tight">
                <strong className="block opacity-60 mb-0.5">DIAGNOSIS:</strong>
                {roast.psychologicalDiagnosis}
              </div>
            )}

          </div>

          {/* Footer Branding & QR Code Watermark */}
          {showBranding && (
            <div className="pt-3 mt-3 border-t border-current/20 flex items-center justify-between text-[10px] font-mono opacity-70 relative z-10">
              <div className="flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>cooked.aistudio.app</span>
              </div>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};
