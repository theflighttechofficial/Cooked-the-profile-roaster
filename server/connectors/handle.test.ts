import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getConnector } from './index.ts';
import { parseHandle } from './handle.ts';

test('generic handle parsing', () => {
  assert.equal(parseHandle('octocat'), 'octocat');
  assert.equal(parseHandle('  @octocat '), 'octocat');
  assert.equal(parseHandle('https://github.com/octocat'), 'octocat');
  assert.equal(parseHandle('github.com/octocat?tab=repositories'), 'octocat');
  assert.equal(parseHandle('https://leetcode.com/u/neal_wu/'), 'neal_wu');
  assert.equal(parseHandle('https://www.chess.com/member/hikaru'), 'hikaru');
  assert.equal(parseHandle('https://letterboxd.com/davidehrlich/films/'), 'davidehrlich');
  assert.equal(parseHandle('https://lobste.rs/~pushcx'), 'pushcx');
  assert.equal(parseHandle('../etc/passwd'), '');
  assert.equal(parseHandle(''), '');
});

test('connector-specific parsing', () => {
  const p = (id: string, s: string) => getConnector(id)!.parse!(s);
  assert.equal(p('stackoverflow', 'https://stackoverflow.com/users/22656/jon-skeet'), '22656');
  assert.equal(p('stackoverflow', 'Jon Skeet'), 'Jon Skeet');
  assert.equal(p('mastodon', 'https://hachyderm.io/@nova'), 'nova@hachyderm.io');
  assert.equal(p('mastodon', '@Gargron@mastodon.social'), 'Gargron@mastodon.social');
  assert.equal(p('mastodon', 'Gargron'), 'Gargron@mastodon.social');
  assert.equal(p('mastodon', 'x@127.0.0.1/evil'), '');
  assert.equal(p('bluesky', 'jay'), 'jay.bsky.social');
  assert.equal(p('bluesky', 'https://bsky.app/profile/jay.bsky.team'), 'jay.bsky.team');
  assert.equal(p('steam', 'https://steamcommunity.com/profiles/76561197960287930/'), '76561197960287930');
  assert.equal(p('steam', 'https://steamcommunity.com/id/gabelogannewell'), 'gabelogannewell');
  assert.equal(p('wikipedia', 'https://en.wikipedia.org/wiki/User:Jimbo_Wales'), 'Jimbo Wales');
  assert.equal(p('reddit', 'u/spez'), 'spez');
  assert.equal(p('showdown', 'Zarel!'), 'zarel');
});
