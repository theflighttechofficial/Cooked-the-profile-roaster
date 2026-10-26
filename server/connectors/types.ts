import type { ConnectorCategory, Profile } from '../../shared/types.ts';

export type FetchedProfile = Omit<Profile, 'platform' | 'platformName' | 'fetchedAt'>;

export interface ConnectorDef {
  id: string;
  name: string;
  category: ConnectorCategory;
  inputLabel: string;
  placeholder: string;
  example: string;
  pulls: string;
  color: string;
  requiresEnv?: string;
  optionalEnv?: string;
  /** Custom handle parser. Gets the raw user input. Return '' when invalid. */
  parse?: (raw: string) => string;
  fetch: (handle: string) => Promise<FetchedProfile>;
}

export const avatarFor = (seed: string) => `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;
