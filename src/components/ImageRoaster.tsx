import React, { useState } from 'react';
import { RoastResult, RoastLevel, RoastPersonality } from '../types/roast';
import { Upload, Camera, Sparkles, RefreshCw, ShieldAlert, Image as ImageIcon, Flame } from 'lucide-react';

interface ImageRoasterProps {
  onImageRoastGenerated: (roast: RoastResult, previewUrl: string) => void;
}

export const ImageRoaster: React.FC<ImageRoasterProps> = ({ onImageRoastGenerated }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [roastLevel, setRoastLevel] = useState<RoastLevel>('nuclear');
  const [personality, setPersonality] = useState<RoastPersonality>('sarcastic_tech');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setMimeType(file.type);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeAndRoast = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/roast/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
          roastLevel,
          personality,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.roast) {
        throw new Error(data.error || 'Failed to analyze and roast image.');
      }

      onImageRoastGenerated(data.roast, selectedImage);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during image vision analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0e1017] border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-w-4xl mx-auto">
      
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl">
          <Camera className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h2 className="font-['Syne'] text-2xl md:text-3xl font-extrabold text-white">
            Screenshot & Image X-Ray Roaster
          </h2>
          <p className="text-xs text-slate-400">
            Upload any screenshot (Tinder / Hinge bio, Discord chat, Code snippet, Spotify Wrapped image, or X post) and let Gemini Vision roast it!
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div className="border-2 border-dashed border-slate-800 hover:border-orange-500/50 rounded-2xl p-8 text-center bg-slate-950/60 transition-all cursor-pointer relative group">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />

        {selectedImage ? (
          <div className="space-y-4">
            <img
              src={selectedImage}
              alt="Uploaded screenshot"
              className="max-h-64 mx-auto rounded-xl border border-orange-500/40 shadow-xl object-contain"
            />
            <p className="text-xs text-slate-400 font-mono">
              Click or drag another image to replace.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto text-orange-400 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">
                Click or Drop Screenshot Here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports PNG, JPG, WEBP (Max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Settings & Submit */}
      {selectedImage && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Roast Heat Level
              </label>
              <select
                value={roastLevel}
                onChange={(e) => setRoastLevel(e.target.value as RoastLevel)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
              >
                <option value="mild">🌶️ Mild Sizzle</option>
                <option value="savage">🔥 Savage Cooked</option>
                <option value="deep_fried">🌋 Deep Fried</option>
                <option value="nuclear">💣 Nuclear Level</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                AI Roaster Persona
              </label>
              <select
                value={personality}
                onChange={(e) => setPersonality(e.target.value as RoastPersonality)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
              >
                <option value="sarcastic_tech">🤖 Sarcastic AI Bro</option>
                <option value="mean_girl">💅 TikTok Mean Girl</option>
                <option value="fbi_profiler">🕵️ FBI Profiler</option>
                <option value="disappointed_wizard">🧙 Disappointed Wizard</option>
                <option value="gordon_ramsay">👨‍🍳 Gordon Ramsay</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleAnalyzeAndRoast}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 rounded-2xl font-['Syne'] font-extrabold text-base text-white tracking-wide shadow-xl shadow-red-600/30 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Analyzing Image Pixels & Text with Gemini Vision...</span>
              </>
            ) : (
              <>
                <Flame className="w-5 h-5 fill-white" />
                <span>ROAST THIS SCREENSHOT NOW</span>
                <Sparkles className="w-5 h-5 text-amber-200" />
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
};
