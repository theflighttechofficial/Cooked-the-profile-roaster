import { ChefHat, Code2, Drama, HeartHandshake, Smartphone, UserRound, type LucideIcon } from 'lucide-react';
import type { ConnectorCategory, Heat, Persona } from '../../shared/types.ts';

export const PERSONAS: { id: Persona; name: string; blurb: string; icon: LucideIcon }[] = [
  { id: 'chef', name: 'Angry Chef', blurb: '"It\'s RAW!"', icon: ChefHat },
  { id: 'techlead', name: 'Staff Engineer', blurb: 'Per my last review…', icon: Code2 },
  { id: 'genz', name: 'Gen Z Bestie', blurb: "it's giving delulu", icon: Smartphone },
  { id: 'parent', name: 'Disappointed Parent', blurb: 'Your cousin is a doctor', icon: UserRound },
  { id: 'bard', name: 'The Bard', blurb: 'Thou art cooked', icon: Drama },
  { id: 'therapist', name: 'Gentle Therapist', blurb: 'And how does that feel?', icon: HeartHandshake },
];

export const HEATS: { id: Heat; name: string; blurb: string }[] = [
  { id: 'mild', name: 'Light toast', blurb: 'Friendly teasing' },
  { id: 'medium', name: 'Medium', blurb: 'Screenshot-worthy' },
  { id: 'scorched', name: 'Scorched', blurb: 'No survivors' },
];

export const CATEGORIES: { id: ConnectorCategory; name: string }[] = [
  { id: 'code', name: 'Code' },
  { id: 'compete', name: 'Compete' },
  { id: 'social', name: 'Social & writing' },
  { id: 'culture', name: 'Taste' },
  { id: 'games', name: 'Games' },
];

/** Steak doneness for a 0-100 cooked score. */
export function doneness(score: number) {
  if (score < 25) return { name: 'Raw', color: '#e3263a', note: 'Barely warm. Suspiciously normal.' };
  if (score < 45) return { name: 'Rare', color: '#f0463a', note: 'Seared on the outside only.' };
  if (score < 65) return { name: 'Medium', color: '#ff7a1f', note: 'Pink in the middle, worry on the outside.' };
  if (score < 85) return { name: 'Well done', color: '#ffb020', note: 'Chewy. Nobody asked for this.' };
  return { name: 'Charcoal', color: '#f6efe4', note: 'Carbonized. Call the fire department.' };
}

export function initials(name: string) {
  const parts = name.replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function since(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
