// Types shared by the Express server and the React client.

export type ConnectorCategory = 'code' | 'compete' | 'social' | 'culture' | 'games';

export interface ConnectorInfo {
  id: string;
  name: string;
  category: ConnectorCategory;
  /** What the user should type, e.g. "username" or "user@instance" */
  inputLabel: string;
  placeholder: string;
  /** A real public account that the connector check script uses */
  example: string;
  /** Short note on what data the connector pulls */
  pulls: string;
  /** Hex brand-ish color for the chip */
  color: string;
  /** Env var the connector needs, if any */
  requiresEnv?: string;
  /** Env var that improves the connector (rate limits), if any */
  optionalEnv?: string;
  /** False when a required env var is missing on this server */
  available: boolean;
}

export interface Stat {
  label: string;
  value: string | number;
}

export interface ListItem {
  name: string;
  meta?: string;
  url?: string;
}

export interface ProfileList {
  title: string;
  items: ListItem[];
}

/** Every connector returns this one shape. */
export interface Profile {
  platform: string;
  platformName: string;
  handle: string;
  displayName: string;
  profileUrl: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  /** ISO date */
  joined?: string;
  stats: Stat[];
  lists: ProfileList[];
  /** Extra plain-text facts for the roaster */
  facts: string[];
  fetchedAt: string;
}

export type Persona = 'chef' | 'techlead' | 'genz' | 'parent' | 'bard' | 'therapist';
export type Heat = 'mild' | 'medium' | 'scorched';

export interface RoastMeter {
  label: string;
  value: number;
}

export interface Roast {
  title: string;
  verdict: string;
  score: number;
  paragraphs: string[];
  redFlags: string[];
  greenFlag: string;
  meters: RoastMeter[];
  shareQuote: string;
  badge: string;
  /** "gemini" or "offline" */
  engine: string;
}

export interface BattleResult {
  winnerIndex: number;
  headline: string;
  rounds: { topic: string; left: string; right: string; winner: number }[];
  finalBlow: string;
  scores: [number, number];
  engine: string;
}

export interface RoastRequest {
  profiles: Profile[];
  persona: Persona;
  heat: Heat;
  /** Free text the user pasted (bio, resume, about section) */
  extra?: string;
}

export interface ApiError {
  error: string;
}
