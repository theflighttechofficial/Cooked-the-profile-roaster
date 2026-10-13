import React from 'react';
import { PlatformType } from '../types/roast';
import {
  Music,
  Gamepad2,
  Code2,
  Film,
  Crown,
  Tv,
  FileText,
  Brain,
  Languages,
  Terminal,
  Briefcase,
  Award,
  GitBranch,
  BookOpen,
  Package,
  Cloud,
  MessageCircle,
  Layers,
  Swords,
  Container,
  Share2,
  Puzzle
} from 'lucide-react';

interface PlatformSelectorProps {
  selectedPlatform: PlatformType;
  onSelectPlatform: (platform: PlatformType) => void;
}

export const PLATFORMS: { id: PlatformType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  {
    id: 'github',
    label: 'GitHub',
    icon: <Code2 className="w-5 h-5 text-violet-400" />,
    color: 'violet',
    desc: 'Public repos, commit history, stars, languages & bio'
  },
  {
    id: 'leetcode',
    label: 'LeetCode',
    icon: <Brain className="w-5 h-5 text-amber-400" />,
    color: 'amber',
    desc: 'Solved mediums, DP trauma, ranking & acceptance rate'
  },
  {
    id: 'codeforces',
    label: 'Codeforces',
    icon: <Award className="w-5 h-5 text-red-400" />,
    color: 'red',
    desc: 'Competitive rating, rank titles, contest maxes & contribution'
  },
  {
    id: 'gitlab',
    label: 'GitLab',
    icon: <GitBranch className="w-5 h-5 text-orange-400" />,
    color: 'orange',
    desc: 'Enterprise merge requests, projects & contributor bio'
  },
  {
    id: 'devto',
    label: 'Dev.to',
    icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
    color: 'emerald',
    desc: 'Tech blog articles, reader reactions & published posts'
  },
  {
    id: 'npm',
    label: 'npm Packages',
    icon: <Package className="w-5 h-5 text-rose-400" />,
    color: 'rose',
    desc: 'Published packages, dependencies & maintainer registry'
  },
  {
    id: 'spotify',
    label: 'Spotify',
    icon: <Music className="w-5 h-5 text-emerald-400" />,
    color: 'emerald',
    desc: 'Top artists, genres, acousticness & sad vibe metrics'
  },
  {
    id: 'steam',
    label: 'Steam',
    icon: <Gamepad2 className="w-5 h-5 text-sky-400" />,
    color: 'sky',
    desc: 'Gaming hours, Dota/CS2 salt, achievement backlog'
  },
  {
    id: 'duolingo',
    label: 'Duolingo',
    icon: <Languages className="w-5 h-5 text-lime-400" />,
    color: 'lime',
    desc: 'Day streaks, total XP & threatening owl guilt-trips'
  },
  {
    id: 'chess',
    label: 'Chess.com',
    icon: <Crown className="w-5 h-5 text-yellow-400" />,
    color: 'yellow',
    desc: 'Blitz/Rapid ratings, blunders & tactic scores'
  },
  {
    id: 'hackernews',
    label: 'HackerNews',
    icon: <Terminal className="w-5 h-5 text-amber-500" />,
    color: 'amber',
    desc: 'Karma farming, tech intellectualism & thread debates'
  },
  {
    id: 'letterboxd',
    label: 'Letterboxd',
    icon: <Film className="w-5 h-5 text-indigo-400" />,
    color: 'indigo',
    desc: 'Movie logs, film snobbery rating & review length'
  },
  {
    id: 'mal',
    label: 'MyAnimeList',
    icon: <Tv className="w-5 h-5 text-blue-400" />,
    color: 'blue',
    desc: 'Anime completed, days spent watching & score mean'
  },
  {
    id: 'linkedin',
    label: 'LinkedIn / Bio',
    icon: <Briefcase className="w-5 h-5 text-blue-500" />,
    color: 'blue',
    desc: 'Ex-FAANG thought leadership, synergies & buzzwords'
  },
  {
    id: 'lichess',
    label: 'Lichess',
    icon: <Puzzle className="w-5 h-5 text-slate-300" />,
    color: 'slate',
    desc: 'Bullet/blitz ratings, puzzle grind & hours lost on the board'
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    icon: <Cloud className="w-5 h-5 text-sky-400" />,
    color: 'sky',
    desc: 'Recent skeets, follower ratio & posting addiction'
  },
  {
    id: 'mastodon',
    label: 'Mastodon',
    icon: <Share2 className="w-5 h-5 text-indigo-400" />,
    color: 'indigo',
    desc: 'Fediverse toots, instance loyalty & bio (user@instance)'
  },
  {
    id: 'reddit',
    label: 'Reddit',
    icon: <MessageCircle className="w-5 h-5 text-orange-500" />,
    color: 'orange',
    desc: 'Karma, recent comments & subreddit obsessions'
  },
  {
    id: 'stackoverflow',
    label: 'Stack Overflow',
    icon: <Layers className="w-5 h-5 text-amber-500" />,
    color: 'amber',
    desc: 'Reputation, badges & copy-paste answer history'
  },
  {
    id: 'codewars',
    label: 'Codewars',
    icon: <Swords className="w-5 h-5 text-red-500" />,
    color: 'red',
    desc: 'Kata honor, kyu rank & one-liner clever-code habits'
  },
  {
    id: 'dockerhub',
    label: 'Docker Hub',
    icon: <Container className="w-5 h-5 text-blue-400" />,
    color: 'blue',
    desc: 'Published images, pull counts & container hoarding'
  },
  {
    id: 'custom',
    label: 'Custom Text',
    icon: <FileText className="w-5 h-5 text-orange-400" />,
    color: 'orange',
    desc: 'Paste any bio, playlist link, resume, or profile text'
  }
];

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({ selectedPlatform, onSelectPlatform }) => {
  return (
    <div className="w-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        1. Choose Profile Source ({PLATFORMS.length} Supported Services)
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {PLATFORMS.map((p) => {
          const isSelected = selectedPlatform === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPlatform(p.id)}
              className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-orange-500/10 border-orange-500/80 text-white shadow-lg shadow-orange-500/10 scale-[1.02]'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="mb-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                {p.icon}
              </div>
              <span className="text-xs font-bold whitespace-nowrap">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
