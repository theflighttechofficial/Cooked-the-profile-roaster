import React, { useState } from 'react';
import { BookOpen, Copy, Check, ExternalLink, ShieldCheck, Key } from 'lucide-react';

export const OAuthGuideModal: React.FC = () => {
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);
  const [copiedCallbackUrl, setCopiedCallbackUrl] = useState(false);

  const appUrl = 'https://ais-dev-tlibyh4o4qrrjsxt2kk3if-675469082848.asia-southeast1.run.app';
  const callbackUrl = `${appUrl}/auth/callback`;

  const handleCopy = (text: string, type: 'app' | 'callback') => {
    navigator.clipboard.writeText(text);
    if (type === 'app') {
      setCopiedAppUrl(true);
      setTimeout(() => setCopiedAppUrl(false), 2000);
    } else {
      setCopiedCallbackUrl(true);
      setTimeout(() => setCopiedCallbackUrl(false), 2000);
    }
  };

  return (
    <div className="bg-[#0e1017] border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 max-w-4xl mx-auto">
      
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl">
          <BookOpen className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h2 className="font-['Syne'] text-2xl md:text-3xl font-extrabold text-white">
            OAuth & REST API Setup Guide
          </h2>
          <p className="text-xs text-slate-400">
            How to connect third-party platforms (Spotify, GitHub, Steam, Chess.com) to "Cooked".
          </p>
        </div>
      </div>

      {/* 1. Public REST APIs */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>1. Instant Zero-Config Public APIs</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The following platforms work out-of-the-box using official public REST endpoints or public RSS feeds without needing any API keys or secrets:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
          <li className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            • <strong className="text-white">GitHub API:</strong> <span className="text-slate-400">https://api.github.com/users/</span>
          </li>
          <li className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            • <strong className="text-white">Chess.com API:</strong> <span className="text-slate-400">https://api.chess.com/pub/player/</span>
          </li>
          <li className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            • <strong className="text-white">MyAnimeList (Jikan):</strong> <span className="text-slate-400">https://api.jikan.moe/v4/users/</span>
          </li>
          <li className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            • <strong className="text-white">Letterboxd RSS:</strong> <span className="text-slate-400">https://letterboxd.com/[user]/rss/</span>
          </li>
        </ul>
      </div>

      {/* 2. Third-Party OAuth Steps */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-orange-400 uppercase tracking-wider">
          <Key className="w-4 h-4" />
          <span>2. Spotify OAuth Integration Setup</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          To enable authentic 1-click Spotify account authorization and fetch private top artists, recently played songs, and Wrapped stats, configure your Spotify Developer app:
        </p>

        <ol className="space-y-3 text-xs text-slate-300 list-decimal list-inside">
          <li>
            Open your provider's developer dashboard:{' '}
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-orange-400 underline inline-flex items-center gap-1 font-semibold"
            >
              Spotify Developer Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </li>

          <li>
            Add these exact Redirect Callback URIs to your app settings:
            <div className="mt-2 space-y-2 font-mono text-[11px]">
              
              <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-emerald-400 truncate">Development Callback: {callbackUrl}</span>
                <button
                  onClick={() => handleCopy(callbackUrl, 'callback')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 shrink-0 ml-2 cursor-pointer flex items-center gap-1"
                >
                  {copiedCallbackUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCallbackUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-sky-400 truncate">App URL: {appUrl}</span>
                <button
                  onClick={() => handleCopy(appUrl, 'app')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 shrink-0 ml-2 cursor-pointer flex items-center gap-1"
                >
                  {copiedAppUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAppUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

            </div>
          </li>

          <li>
            Set the environment variables in AI Studio Secrets panel:
            <div className="mt-1 font-mono text-amber-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
              SPOTIFY_CLIENT_ID="your_spotify_client_id"<br />
              SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
            </div>
          </li>
        </ol>
      </div>

    </div>
  );
};
