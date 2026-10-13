import React, { useState } from 'react';
import { RoastResult } from '../types/roast';
import { Coins, Flame, ShieldAlert, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Web3WalletAuditorProps {
  roast?: RoastResult | null;
}

export const Web3WalletAuditor: React.FC<Web3WalletAuditorProps> = () => {
  const [walletAddress, setWalletAddress] = useState('0x71C...3a8F (satoshi.eth)');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);

  const handleAuditWallet = async () => {
    setIsAuditing(true);
    setAuditResult(null);

    await new Promise((resolve) => setTimeout(resolve, 1400));

    setAuditResult({
      burnedGasUsd: '$1,480.00',
      failedTxCount: 23,
      deadMemecoinsCount: 14,
      nftLossesPct: '-94.5%',
      verdict: 'You write code like a junior and buy crypto like a high-schooler during recess.',
      redFlags: [
        'Spent $420 in gas fees trying to mint a jpeg of a Pixelated Hamster.',
        'Holding 14 dead Solana memecoins with a total liquidity of $0.00004.',
        'Transferred ETH to a fake liquidity pool link sent via Discord DM.'
      ]
    });

    setIsAuditing(false);
    confetti({ particleCount: 60, spread: 60 });
  };

  return (
    <div className="bg-slate-950 border-2 border-yellow-500/40 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-2xl text-yellow-400 shrink-0">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[10px] font-mono font-bold uppercase">
              <Sparkles className="w-3 h-3" />
              <span>WEB3 & WALLET AUDITOR</span>
            </div>
            <h3 className="font-['Syne'] text-xl md:text-2xl font-black text-white">
              "Burned Assets" Crypto & NFT Disaster Audit
            </h3>
            <p className="text-xs text-slate-400">
              Audit failed gas fees, dead memecoins, and NFT losses alongside your coding habits.
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-mono text-xs font-bold text-center">
          🪙 WEB3 DISASTER ZONE
        </div>
      </div>

      {/* Input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Paste ETH / Solana Wallet (0x... or .eth)"
          className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 font-mono"
        />
        <button
          onClick={handleAuditWallet}
          disabled={isAuditing}
          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 text-black font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
          <span>{isAuditing ? 'Auditing Wallet...' : 'Audit Wallet'}</span>
        </button>
      </div>

      {/* Result */}
      {auditResult && (
        <div className="p-5 bg-slate-900 border border-yellow-500/30 rounded-2xl space-y-4 font-mono text-xs animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-black/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Gas Wasted</span>
              <span className="text-amber-400 font-bold text-sm">{auditResult.burnedGasUsd}</span>
            </div>
            <div className="p-3 bg-black/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Failed Txns</span>
              <span className="text-rose-400 font-bold text-sm">{auditResult.failedTxCount}</span>
            </div>
            <div className="p-3 bg-black/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Dead Memecoins</span>
              <span className="text-yellow-400 font-bold text-sm">{auditResult.deadMemecoinsCount}</span>
            </div>
            <div className="p-3 bg-black/60 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">NFT Portfolio</span>
              <span className="text-red-400 font-bold text-sm">{auditResult.nftLossesPct}</span>
            </div>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl italic text-yellow-200">
            "{auditResult.verdict}"
          </div>
        </div>
      )}

    </div>
  );
};
