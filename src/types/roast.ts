export type PlatformType =
  | 'spotify'
  | 'steam'
  | 'github'
  | 'leetcode'
  | 'codeforces'
  | 'gitlab'
  | 'devto'
  | 'npm'
  | 'duolingo'
  | 'hackernews'
  | 'letterboxd'
  | 'chess'
  | 'mal'
  | 'linkedin'
  | 'lichess'
  | 'bluesky'
  | 'reddit'
  | 'stackoverflow'
  | 'codewars'
  | 'dockerhub'
  | 'mastodon'
  | 'custom';

export type RoastLevel = 'mild' | 'savage' | 'deep_fried' | 'nuclear';

export type RoastPersonality = 'sarcastic_tech' | 'mean_girl' | 'fbi_profiler' | 'disappointed_wizard' | 'gordon_ramsay';

export interface ProfileData {
  platform: PlatformType;
  username: string;
  avatarUrl?: string;
  rawDetails?: any;
}

export interface ProfileReceipts {
  name?: string;
  username: string;
  bio?: string;
  location?: string;
  website?: string;
  verifiedAt?: string;
  metrics?: Record<string, string | number>;
  items?: Array<{
    name: string;
    detail?: string;
    badge?: string;
    url?: string;
  }>;
}

export interface RoastResult {
  headline: string;
  cookedScore: number;
  roastTitle: string;
  mainRoastParagraphs: string[];
  redFlags: string[];
  psychologicalDiagnosis: string;
  statsRadar: {
    pretentiousness: number;
    cringeIndex: number;
    touchGrassNeeded: number;
    sleepDeprivation: number;
    socialSkills: number;
  };
  quoteToShare: string;
  badgeAwarded: string;
  corporatePip?: {
    employeeName: string;
    jobTitle: string;
    performanceRating: string;
    keyDeficiencies: string[];
    mandatoryActionItems: string[];
    terminationRisk: string;
  };
  profileReceipts?: ProfileReceipts;
}

export interface CompatibilityResult {
  compatibilityScore: number;
  toxicityRisk: number;
  verdictTitle: string;
  relationshipSummary: string;
  irreconcilableDifferences: string[];
  toxicWarningLabel: string;
}

export interface SavedRoast {
  id: string;
  platform: PlatformType;
  username: string;
  avatarUrl?: string;
  headline: string;
  cookedScore: number;
  roastTitle: string;
  mainRoastParagraphs: string[];
  redFlags: string[];
  psychologicalDiagnosis: string;
  statsRadar: {
    pretentiousness: number;
    cringeIndex: number;
    touchGrassNeeded: number;
    sleepDeprivation: number;
    socialSkills: number;
  };
  quoteToShare: string;
  badgeAwarded: string;
  createdAt: number;
  upvotes: number;
}

export interface PresetArchetype {
  id: string;
  name: string;
  platform: PlatformType;
  username: string;
  avatarUrl: string;
  tagline: string;
  sampleData: any;
}
