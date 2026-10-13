import React, { useState } from 'react';
import { RoastResult, PlatformType } from '../types/roast';
import { Mail, Send, Copy, Check, Briefcase, FileWarning, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RecruiterAutoSabotageModalProps {
  roast: RoastResult;
  platform: PlatformType;
  username: string;
  isOpen: boolean;
  onClose: () => void;
}

export const RecruiterAutoSabotageModal: React.FC<RecruiterAutoSabotageModalProps> = ({
  roast,
  platform,
  username,
  isOpen,
  onClose,
}) => {
  const [recruiterEmail, setRecruiterEmail] = useState('recruiter@tech-corp.com');
  const [recruiterName, setRecruiterName] = useState('Hiring Manager / Recruiter');
  const [memoType, setMemoType] = useState<'unrecommendation' | 'pip' | 'rescission'>('unrecommendation');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getEmailSubject = () => {
    if (memoType === 'unrecommendation') {
      return `[OFFICIAL UN-RECOMMENDATION] Candidate Profile Audit: @${username} (${platform.toUpperCase()})`;
    } else if (memoType === 'pip') {
      return `[FORMAL PIP MEMORANDUM] Immediate Performance Improvement Plan for @${username}`;
    } else {
      return `[URGENT OFFER RESCISSION] Critical Red Flag Alert for Candidate @${username}`;
    }
  };

  const getEmailBody = () => {
    const metricsStr = roast.profileReceipts?.metrics
      ? Object.entries(roast.profileReceipts.metrics)
          .map(([k, v]) => `• ${k}: ${v}`)
          .join('\n')
      : `• Cooked Score: ${roast.cookedScore}%\n• Awarded Badge: ${roast.badgeAwarded}`;

    if (memoType === 'unrecommendation') {
      return `Dear ${recruiterName},

I am writing to formally submit an UN-RECOMMENDATION for candidate @${username} regarding any engineering or technical roles at your organization.

Based on an AI-assisted audit of their live public ${platform.toUpperCase()} footprint, we have identified alarming deficiencies:

VERDICT & DIAGNOSIS:
"${roast.headline}"
Diagnosis: ${roast.psychologicalDiagnosis}

KEY AUDIT RECEIPTS:
${metricsStr}

CRITICAL PROFILE RED FLAGS:
${roast.redFlags.map((f) => `⚠️ ${f}`).join('\n')}

CONCLUSION & RECOMMENDATION:
Given their Cooked Score of ${roast.cookedScore}%, we strongly advise placing this candidate into an immediate entry-level demotion pipeline or redirecting them to a non-technical role with zero repository access.

Sincerely,
Automated Corporate Footprint Audit Board
Cooked AI Studio
https://cooked.aistudio.app`;
    } else if (memoType === 'pip') {
      return `MEMORANDUM OF FORMAL PERFORMANCE IMPROVEMENT PLAN (PIP)

TO: @${username} (${roast.corporatePip?.jobTitle || 'Engineer Candidate'})
FROM: Corporate Audit Board
DATE: ${new Date().toLocaleDateString()}
SUBJECT: Mandatory Performance Improvement Requirements

Mr./Ms. @${username},

Your recent technical output on ${platform.toUpperCase()} has triggered a mandatory Performance Improvement Plan (PIP).

PERFORMANCE DEFICIENCIES:
${roast.corporatePip?.keyDeficiencies.map((d) => `• ${d}`).join('\n') || roast.redFlags.map((f) => `• ${f}`).join('\n')}

MANDATORY ACTION ITEMS:
${roast.corporatePip?.mandatoryActionItems.map((a) => `• ${a}`).join('\n') || '• Stop copying StackOverflow blindly\n• Close 45 idle local feature branches'}

TERMINATION RISK: ${roast.corporatePip?.terminationRisk || '98% EXTREME'}

Failure to satisfy these items within 14 calendar days will result in immediate termination of recruitment discussions.

Regards,
${recruiterName}`;
    } else {
      return `OFFICIAL NOTICE OF IMMEDIATE OFFER RESCISSION

TO: Recruiting Team (${recruiterName})
REGARDING: Candidate @${username} [${platform.toUpperCase()}]

Please be advised that candidate @${username} has failed our digital footprint audit with a Cooked Rating of ${roast.cookedScore}%.

EXECUTIVE SUMMARY:
"${roast.headline}"

UNRESOLVED RED FLAGS:
${roast.redFlags.map((f) => `🚫 ${f}`).join('\n')}

Action Required: Please rescind any pending offer letters immediately.

Cooked AI Verification System`;
    }
  };

  const handleSendMailto = () => {
    confetti({ particleCount: 60, spread: 60 });
    const subject = encodeURIComponent(getEmailSubject());
    const body = encodeURIComponent(getEmailBody());
    window.location.href = `mailto:${recruiterEmail}?subject=${subject}&body=${body}`;
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(`SUBJECT: ${getEmailSubject()}\n\n${getEmailBody()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    confetti({ particleCount: 40, spread: 50 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0f111a] border-2 border-red-500/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-900 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-400 shrink-0">
            <FileWarning className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-bold uppercase">
              <Sparkles className="w-3 h-3" />
              <span>Auto-Sabotage Tool</span>
            </div>
            <h2 className="font-['Syne'] text-xl md:text-2xl font-black text-white">
              Send "Un-Recommendation" to Recruiter
            </h2>
            <p className="text-xs text-slate-400">
              Instantly composer a corporate-sarcastic email or PIP memo directly to your boss or hiring manager.
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">
              Recruiter / Manager Email
            </label>
            <input
              type="email"
              value={recruiterEmail}
              onChange={(e) => setRecruiterEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              placeholder="e.g. hiring@google.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1">
              Recipient Name / Title
            </label>
            <input
              type="text"
              value={recruiterName}
              onChange={(e) => setRecruiterName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              placeholder="e.g. Senior Technical Recruiter"
            />
          </div>
        </div>

        {/* Memo Type Selector */}
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2">
            Auto-Sabotage Memo Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'unrecommendation', label: '📄 Un-Recommendation Letter' },
              { id: 'pip', label: '💼 Corporate PIP Memo' },
              { id: 'rescission', label: '🚫 Offer Rescission Notice' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMemoType(m.id as any)}
                className={`py-2 px-2 text-[11px] font-bold rounded-xl border transition-all text-center cursor-pointer ${
                  memoType === m.id
                    ? 'bg-red-600 text-white border-red-500 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Box */}
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1">
            Generated Email Preview
          </label>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2 max-h-56 overflow-y-auto">
            <div className="text-amber-400 font-bold border-b border-slate-800 pb-2">
              Subject: {getEmailSubject()}
            </div>
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
              {getEmailBody()}
            </pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={handleCopyMemo}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-orange-400" />}
            <span>{copied ? 'Memo Copied!' : 'Copy Corporate Memo'}</span>
          </button>

          <button
            onClick={handleSendMailto}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:brightness-110 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-red-900/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send Email via Mail App</span>
          </button>
        </div>

      </div>
    </div>
  );
};
