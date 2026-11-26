import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Heat, Persona, Profile } from '../shared/types.ts';
import { localBattle, localRoast, parseNum, profileFromText } from './local-roaster.ts';

const profile = (platform: string, platformName: string, stats: [string, string | number][], facts: string[] = [], bio?: string): Profile => ({
  platform,
  platformName,
  handle: `${platform}-user`,
  displayName: `${platformName} User`,
  profileUrl: 'https://example.com',
  bio,
  stats: stats.map(([label, value]) => ({ label, value })),
  lists: [],
  facts,
  fetchedAt: new Date().toISOString(),
});

const SAMPLES: Profile[] = [
  profile('github', 'GitHub', [['Repos', 48], ['Stars earned', '3'], ['Followers', '2'], ['Following', '310']], ['48 original repos, 2 forks; 41 of the originals have zero stars, 30 have no description.'], 'Building the future'),
  profile('leetcode', 'LeetCode', [['Solved', 812], ['Hard', 40], ['Contest rating', 1490]], ['Current streak 212 days, 300 active days this year.']),
  profile('bluesky', 'Bluesky', [['Followers', '12'], ['Following', '1.2K'], ['Posts', '9.4K']], ['Post: "hot take: tabs > spaces" (0 likes)']),
  profile('myanimelist', 'MyAnimeList', [['Days watched', '214.5'], ['Dropped', 63], ['Completed', 410]]),
  profile('steam', 'Steam', [['Games owned', 412], ['Never played', 260], ['Total hours', '9.1K']], ['4,300 hours in Dota 2, which is 179 full days.']),
  profile('npm', 'npm', []),
];

const PERSONAS: Persona[] = ['chef', 'techlead', 'genz', 'parent', 'bard', 'therapist'];
const HEATS: Heat[] = ['mild', 'medium', 'scorched'];

const clean = (s: string) => !/\{\w+\}|undefined|NaN|\[object/.test(s);

test('parseNum understands compact and unit-suffixed values', () => {
  assert.equal(parseNum('1.2K'), 1200);
  assert.equal(parseNum('30.8B'), 30.8e9);
  assert.equal(parseNum('64%'), 64);
  assert.equal(parseNum('120 wpm'), 120);
  assert.equal(parseNum('1,490'), 1490);
  assert.ok(Number.isNaN(parseNum('Medium')));
});

test('every persona and heat writes a complete roast for every kind of profile', () => {
  for (const p of SAMPLES) {
    for (const persona of PERSONAS) {
      for (const heat of HEATS) {
        const r = localRoast([p], persona, heat);
        const text = [r.title, r.verdict, ...r.paragraphs, ...r.redFlags, r.greenFlag, r.shareQuote, r.badge].join(' ');
        assert.equal(r.engine, 'local');
        assert.equal(r.paragraphs.length, 3, `${p.platform}/${persona}/${heat}`);
        assert.ok(r.paragraphs.every((x) => x.trim().length > 20), `${p.platform}/${persona}/${heat}: short paragraph`);
        assert.equal(r.redFlags.length, 4);
        assert.equal(r.meters.length, 5);
        assert.ok(r.score >= 5 && r.score <= 99);
        assert.ok(clean(text), `${p.platform}/${persona}/${heat}: ${text}`);
      }
    }
  }
});

test('heat raises the score', () => {
  const p = SAMPLES[0];
  assert.ok(localRoast([p], 'chef', 'mild').score < localRoast([p], 'chef', 'scorched').score);
});

test('the same input gives the same roast', () => {
  assert.deepEqual(localRoast([SAMPLES[1]], 'genz', 'medium'), localRoast([SAMPLES[1]], 'genz', 'medium'));
});

test('multi-profile roasts mention both platforms', () => {
  const r = localRoast([SAMPLES[0], SAMPLES[2]], 'techlead', 'medium');
  const text = r.paragraphs.join(' ');
  assert.match(text, /GitHub/);
  assert.match(text, /Bluesky/);
});

test('pasted text and OCR text become a roastable profile', () => {
  const text = 'Passionate results-driven thought leader 🚀🚀🚀🔥 | 500+ connections | 12 years in synergy | Open to work!!! #hustle #grind #ai';
  const p = profileFromText(text);
  assert.ok(p.stats.some((s) => /connections/i.test(s.label)));
  assert.ok(p.facts.some((f) => /passionate/.test(f)));
  const r = localRoast([], 'parent', 'scorched', text);
  assert.ok(clean(r.paragraphs.join(' ')));
  assert.match(r.paragraphs.join(' '), /connections|passionate|emoji|hashtag/i);
});

test('battles have three rounds and a winner with the lower score', () => {
  for (const persona of PERSONAS) {
    const b = localBattle(SAMPLES[0], SAMPLES[4], persona, 'medium');
    assert.equal(b.rounds.length, 3);
    assert.ok(b.rounds.every((r) => r.left && r.right && clean(r.left + r.right)));
    assert.ok(clean(b.finalBlow + b.headline));
    assert.ok(b.scores[b.winnerIndex] <= b.scores[1 - b.winnerIndex]);
  }
});
