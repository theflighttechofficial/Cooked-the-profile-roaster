import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import {
  cleanStats, clip, compact, fmt, getJson, getText, isoDate, isoFromUnix, notFound, postJson, request, stripHtml, tryJson,
  xmlBlocks, xmlTag, HttpError, BROWSER_UA,
} from '../http.ts';
import { parseHandle, safeDecode } from './handle.ts';
import { avatarFor, type ConnectorDef } from './types.ts';

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// ---------------- Hacker News ----------------
const hackernews: ConnectorDef = {
  id: 'hackernews',
  name: 'Hacker News',
  category: 'social',
  inputLabel: 'HN username',
  placeholder: 'pg',
  example: 'pg',
  pulls: 'Karma, about, top stories, latest comments',
  color: '#ff6600',
  async fetch(handle) {
    const user = await getJson<any>(`https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(handle)}.json`, `Hacker News user "${handle}"`);
    if (!user) throw notFound(`Hacker News user "${handle}"`);
    const tag = encodeURIComponent(`author_${user.id}`);
    const [stories, comments] = await Promise.all([
      tryJson<any>(`https://hn.algolia.com/api/v1/search?tags=story,${tag}&hitsPerPage=8`),
      tryJson<any>(`https://hn.algolia.com/api/v1/search_by_date?tags=comment,${tag}&hitsPerPage=12`),
    ]);
    const c: any[] = comments?.hits || [];
    const facts: string[] = [];
    if (user.submitted?.length) facts.push(`Has ${fmt(user.submitted.length)} submissions and comments in total.`);
    if (c.length) {
      facts.push(`Latest comments (on: ${[...new Set(c.map((x) => x.story_title).filter(Boolean))].slice(0, 5).map((t) => `"${t}"`).join(', ')}).`);
      facts.push(...c.slice(0, 4).map((x) => `Comment: "${clip(stripHtml(x.comment_text), 180)}"`));
    }
    return {
      handle: user.id,
      displayName: user.id,
      profileUrl: `https://news.ycombinator.com/user?id=${encodeURIComponent(user.id)}`,
      avatarUrl: avatarFor(`hn-${user.id}`),
      bio: user.about ? clip(stripHtml(user.about), 400) : undefined,
      joined: isoFromUnix(user.created),
      stats: cleanStats([
        { label: 'Karma', value: compact(user.karma) },
        { label: 'Items', value: compact(user.submitted?.length || 0) },
        { label: 'Stories found', value: stories?.nbHits },
        { label: 'Comments found', value: comments?.nbHits !== undefined ? compact(comments.nbHits) : undefined },
      ]),
      lists: [
        { title: 'Top stories', items: (stories?.hits || []).map((s: any) => ({ name: s.title, meta: `${s.points} points · ${s.num_comments ?? 0} comments`, url: `https://news.ycombinator.com/item?id=${s.objectID}` })) },
      ],
      facts,
    };
  },
};

// ---------------- Lobsters ----------------
const lobsters: ConnectorDef = {
  id: 'lobsters',
  name: 'Lobsters',
  category: 'social',
  inputLabel: 'Lobsters username',
  placeholder: 'pushcx',
  example: 'pushcx',
  pulls: 'Karma, about, inviter, linked accounts',
  color: '#ac130d',
  async fetch(handle) {
    const u = await getJson<any>(`https://lobste.rs/~${encodeURIComponent(handle)}.json`, `Lobsters user "${handle}"`);
    const facts: string[] = [];
    if (u.invited_by_user) facts.push(`Was invited by ${u.invited_by_user}.`);
    if (u.is_moderator) facts.push('Is a moderator.');
    if (u.github_username) facts.push(`GitHub: ${u.github_username}.`);
    return {
      handle: u.username,
      displayName: u.username,
      profileUrl: `https://lobste.rs/~${u.username}`,
      avatarUrl: u.avatar_url ? new URL(u.avatar_url, 'https://lobste.rs').toString() : avatarFor(`lob-${handle}`),
      bio: u.about ? clip(stripHtml(u.about), 400) : undefined,
      joined: isoDate(u.created_at),
      stats: cleanStats([{ label: 'Karma', value: u.karma }, { label: 'Moderator', value: u.is_moderator ? 'yes' : 'no' }]),
      lists: [],
      facts,
    };
  },
};

// ---------------- DEV ----------------
const devto: ConnectorDef = {
  id: 'devto',
  name: 'DEV',
  category: 'social',
  inputLabel: 'dev.to username',
  placeholder: 'ben',
  example: 'ben',
  pulls: 'Profile, articles, reactions, tags you write about',
  color: '#3b49df',
  async fetch(handle) {
    const h = encodeURIComponent(handle);
    const u = await getJson<any>(`https://dev.to/api/users/by_username?url=${h}`, `DEV user "${handle}"`);
    const articles = (await tryJson<any[]>(`https://dev.to/api/articles?username=${h}&per_page=30`)) || [];
    const reactions = articles.reduce((s, a) => s + (a.public_reactions_count || 0), 0);
    const tags = new Map<string, number>();
    for (const a of articles) for (const t of a.tag_list || []) tags.set(t, (tags.get(t) || 0) + 1);
    const facts: string[] = [];
    if (articles.length) facts.push(`Average ${fmt(reactions / articles.length)} reactions per article.`);
    if (tags.size) facts.push(`Writes mostly about: ${[...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => `#${t}`).join(' ')}.`);
    const titles = articles.slice(0, 6).map((a) => `"${a.title}"`);
    if (titles.length) facts.push(`Recent titles: ${titles.join(', ')}.`);
    return {
      handle: u.username,
      displayName: u.name || u.username,
      profileUrl: `https://dev.to/${u.username}`,
      avatarUrl: u.profile_image,
      bio: u.summary || undefined,
      location: u.location || undefined,
      joined: isoDate(u.joined_at),
      stats: cleanStats([
        { label: 'Articles (recent)', value: articles.length },
        { label: 'Reactions', value: compact(reactions) },
        { label: 'Comments', value: compact(articles.reduce((s, a) => s + (a.comments_count || 0), 0)) },
      ]),
      lists: [{ title: 'Articles', items: articles.slice(0, 6).map((a) => ({ name: a.title, meta: `♥ ${a.public_reactions_count} · ${a.reading_time_minutes} min read`, url: a.url })) }],
      facts,
    };
  },
};

// ---------------- Hashnode ----------------
const hashnode: ConnectorDef = {
  id: 'hashnode',
  name: 'Hashnode',
  category: 'social',
  inputLabel: 'Hashnode username',
  placeholder: 'sandeep',
  example: 'sandeep',
  pulls: 'Profile, followers, posts and their reactions',
  color: '#2962ff',
  async fetch(handle) {
    const gql = (query: string) => postJson<any>('https://gql.hashnode.com/', { query, variables: { u: handle } }, `Hashnode user "${handle}"`);
    const core = await gql(`query($u: String!) { user(username: $u) { username name tagline profilePicture location followersCount followingsCount dateJoined bio { text } } }`);
    const u = core?.data?.user;
    if (!u) throw notFound(`Hashnode user "${handle}"`);
    let posts: any = null;
    try {
      const p = await gql(`query($u: String!) { user(username: $u) { posts(page: 1, pageSize: 10) { totalDocuments nodes { title url reactionCount responseCount publishedAt } } } }`);
      posts = p?.data?.user?.posts;
    } catch {
      /* posts are optional */
    }
    const nodes: any[] = posts?.nodes || [];
    return {
      handle: u.username,
      displayName: u.name || u.username,
      profileUrl: `https://hashnode.com/@${u.username}`,
      avatarUrl: u.profilePicture || avatarFor(`hn-${handle}`),
      bio: u.tagline || u.bio?.text || undefined,
      location: u.location || undefined,
      joined: isoDate(u.dateJoined),
      stats: cleanStats([
        { label: 'Followers', value: compact(u.followersCount) },
        { label: 'Following', value: u.followingsCount },
        { label: 'Posts', value: posts?.totalDocuments },
        { label: 'Avg reactions', value: nodes.length ? fmt(avg(nodes.map((n) => n.reactionCount || 0))) : undefined },
      ]),
      lists: [{ title: 'Posts', items: nodes.slice(0, 6).map((n) => ({ name: n.title, meta: `♥ ${n.reactionCount} · ${n.responseCount} replies`, url: n.url })) }],
      facts: u.bio?.text ? [`Bio: "${clip(u.bio.text, 300)}"`] : [],
    };
  },
};

// ---------------- Medium (RSS) ----------------
const medium: ConnectorDef = {
  id: 'medium',
  name: 'Medium',
  category: 'social',
  inputLabel: 'Medium username',
  placeholder: 'ev',
  example: 'ev',
  pulls: 'Latest stories, tags and excerpts from the RSS feed',
  color: '#a8a8a8',
  async fetch(handle) {
    const xml = await getText(`https://medium.com/feed/@${encodeURIComponent(handle)}`, `Medium user "${handle}"`, { headers: { 'User-Agent': BROWSER_UA } });
    if (!xml.includes('<channel>')) throw notFound(`Medium user "${handle}"`);
    const items = xmlBlocks(xml, 'item');
    const posts = items.map((it) => ({
      title: stripHtml(xmlTag(it, 'title')),
      link: xmlTag(it, 'link'),
      date: xmlTag(it, 'pubDate'),
      tags: (it.match(/<category>([\s\S]*?)<\/category>/g) || []).map((c) => stripHtml(c.replace(/<!\[CDATA\[|\]\]>/g, ''))),
      text: clip(stripHtml(xmlTag(it, 'content:encoded')), 220),
    }));
    const tags = new Map<string, number>();
    for (const p of posts) for (const t of p.tags) tags.set(t, (tags.get(t) || 0) + 1);
    const title = stripHtml(xmlTag(xml, 'title')).replace(/^Stories by\s+/i, '').replace(/\s+on Medium$/i, '');
    const image = xml.match(/<image>[\s\S]*?<url>([\s\S]*?)<\/url>/)?.[1];
    return {
      handle,
      displayName: title || handle,
      profileUrl: `https://medium.com/@${handle}`,
      avatarUrl: image?.trim() || avatarFor(`md-${handle}`),
      bio: stripHtml(xmlTag(xml, 'description')) || undefined,
      stats: cleanStats([
        { label: 'Recent stories', value: posts.length },
        { label: 'Top tag', value: [...tags.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] },
        { label: 'Last post', value: posts[0]?.date ? new Date(posts[0].date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : undefined },
      ]),
      lists: [{ title: 'Stories', items: posts.slice(0, 6).map((p) => ({ name: p.title, meta: p.tags.slice(0, 3).join(' · '), url: p.link })) }],
      facts: posts.slice(0, 3).map((p) => `Story "${p.title}": ${p.text}`),
    };
  },
};

// ---------------- Bluesky ----------------
const bluesky: ConnectorDef = {
  id: 'bluesky',
  name: 'Bluesky',
  category: 'social',
  inputLabel: 'Bluesky handle',
  placeholder: 'jay.bsky.team',
  example: 'bsky.app',
  pulls: 'Profile, follower ratio, latest posts and engagement',
  color: '#0a7aff',
  parse(raw) {
    const h = parseHandle(raw).toLowerCase();
    if (!h) return '';
    return h.startsWith('did:') || h.includes('.') ? h : `${h}.bsky.social`;
  },
  async fetch(handle) {
    const api = 'https://public.api.bsky.app/xrpc';
    const res = await request(`${api}/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`);
    if (res.status === 400 || res.status === 404) throw notFound(`Bluesky account "${handle}"`);
    if (!res.ok) throw new HttpError(502, `Bluesky answered ${res.status}.`);
    const p = await res.json();
    const feed = await tryJson<any>(`${api}/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(p.did)}&limit=30&filter=posts_no_replies`);
    const posts: any[] = (feed?.feed || []).filter((f: any) => f.post?.author?.did === p.did).map((f: any) => f.post);
    const likes = posts.map((x) => x.likeCount || 0);
    const facts: string[] = [];
    if (p.followsCount && p.followersCount !== undefined) facts.push(`Follows ${fmt(p.followsCount)} accounts and has ${fmt(p.followersCount)} followers.`);
    if (posts.length) facts.push(`Average ${fmt(avg(likes))} likes per recent post.`);
    facts.push(...posts.slice(0, 6).map((x) => `Post: "${clip(x.record?.text, 200)}" (${x.likeCount || 0} likes)`));
    return {
      handle: p.handle,
      displayName: p.displayName || p.handle,
      profileUrl: `https://bsky.app/profile/${p.handle}`,
      avatarUrl: p.avatar || avatarFor(`bsky-${handle}`),
      bio: p.description || undefined,
      joined: isoDate(p.createdAt),
      stats: cleanStats([
        { label: 'Followers', value: compact(p.followersCount) },
        { label: 'Following', value: compact(p.followsCount) },
        { label: 'Posts', value: compact(p.postsCount) },
        { label: 'Avg likes', value: posts.length ? fmt(avg(likes)) : undefined },
      ]),
      lists: [{ title: 'Recent posts', items: posts.slice(0, 5).map((x) => ({ name: clip(x.record?.text || '(media post)', 110), meta: `♥ ${x.likeCount || 0} · ↻ ${x.repostCount || 0}` })) }],
      facts,
    };
  },
};

// ---------------- Mastodon (any instance) ----------------

const PRIVATE_V4 = [/^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./];

/** Blocks SSRF: the instance host comes from the user, so it must resolve to public addresses only. */
async function assertPublicHost(host: string) {
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(host) || isIP(host) || /\.(local|internal|localhost)$/i.test(host)) {
    throw new HttpError(400, 'That does not look like a public Mastodon instance.');
  }
  let addrs: { address: string; family: number }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    throw new HttpError(404, `Could not find the instance "${host}".`);
  }
  for (const { address, family } of addrs) {
    const bad = family === 4 ? PRIVATE_V4.some((r) => r.test(address)) : /^(::1|f[cd]|fe80|::ffff:(10|127|192\.168)\.)/i.test(address);
    if (bad) throw new HttpError(400, 'That instance points to a private network address.');
  }
}

const mastodon: ConnectorDef = {
  id: 'mastodon',
  name: 'Mastodon',
  category: 'social',
  inputLabel: 'user@instance',
  placeholder: 'Gargron@mastodon.social',
  example: 'Gargron@mastodon.social',
  pulls: 'Profile from any instance, toots and boosts, engagement',
  color: '#6364ff',
  parse(raw) {
    const s = raw.trim();
    const url = s.match(/^(?:https?:\/\/)?([^/\s]+)\/@([^/?#\s]+)/i);
    if (url) return `${safeDecode(url[2])}@${url[1].toLowerCase()}`;
    const m = s.replace(/^@/, '').match(/^([\w.-]+)(?:@([\w.-]+\.[a-z]{2,}))?$/i);
    if (!m) return '';
    return `${m[1]}@${(m[2] || 'mastodon.social').toLowerCase()}`;
  },
  async fetch(handle) {
    const [user, host] = handle.split('@');
    await assertPublicHost(host);
    // No redirects: a redirect could point at an address we did not check
    const noRedirect: RequestInit = { redirect: 'error' };
    const acct = await getJson<any>(`https://${host}/api/v1/accounts/lookup?acct=${encodeURIComponent(user)}`, `Mastodon account "${handle}"`, noRedirect);
    const statuses = (await tryJson<any[]>(`https://${host}/api/v1/accounts/${encodeURIComponent(acct.id)}/statuses?limit=30&exclude_replies=true&exclude_reblogs=true`, noRedirect)) || [];
    const favs = statuses.map((s) => s.favourites_count || 0);
    const facts: string[] = [];
    if (acct.bot) facts.push('Account is marked as a bot.');
    for (const f of acct.fields || []) facts.push(`Profile field "${stripHtml(f.name)}": ${stripHtml(f.value)}.`);
    facts.push(...statuses.slice(0, 6).map((s) => `Toot: "${clip(stripHtml(s.content), 200)}" (${s.favourites_count} favs)`));
    return {
      handle: `${acct.username}@${host}`,
      displayName: acct.display_name || acct.username,
      profileUrl: acct.url,
      avatarUrl: acct.avatar,
      bio: stripHtml(acct.note) || undefined,
      joined: isoDate(acct.created_at),
      stats: cleanStats([
        { label: 'Followers', value: compact(acct.followers_count) },
        { label: 'Following', value: compact(acct.following_count) },
        { label: 'Posts', value: compact(acct.statuses_count) },
        { label: 'Avg favs', value: statuses.length ? fmt(avg(favs)) : undefined },
      ]),
      lists: [{ title: 'Recent toots', items: statuses.slice(0, 5).map((s) => ({ name: clip(stripHtml(s.content) || '(media)', 110), meta: `★ ${s.favourites_count} · ↻ ${s.reblogs_count}`, url: s.url })) }],
      facts,
    };
  },
};

// ---------------- Reddit ----------------
let redditToken: { value: string; expires: number } | null = null;

async function redditAuth(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (redditToken && redditToken.expires > Date.now() + 60_000) return redditToken.value;
  const res = await request('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new HttpError(502, 'Reddit rejected the REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET pair.');
  const j = await res.json();
  redditToken = { value: j.access_token, expires: Date.now() + (j.expires_in || 3600) * 1000 };
  return redditToken.value;
}

const reddit: ConnectorDef = {
  id: 'reddit',
  name: 'Reddit',
  category: 'social',
  inputLabel: 'Reddit username',
  placeholder: 'spez',
  example: 'spez',
  pulls: 'Karma split, account age, favorite subreddits, top comments',
  color: '#ff4500',
  optionalEnv: 'REDDIT_CLIENT_ID',
  parse: (raw) => parseHandle(raw.replace(/^\/?u\//i, '')),
  async fetch(handle) {
    const token = await redditAuth();
    const base = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
    const suffix = token ? '' : '.json';
    const init: RequestInit = { headers: token ? { Authorization: `Bearer ${token}` } : { 'User-Agent': APP_REDDIT_UA } };
    const h = encodeURIComponent(handle);
    let about: any;
    try {
      about = await getJson<any>(`${base}/user/${h}/about${suffix}`, `Reddit user "${handle}"`, init);
    } catch (e) {
      if (!token && e instanceof HttpError && e.status !== 404) {
        throw new HttpError(502, 'Reddit blocks anonymous server requests. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET (free "script" app at reddit.com/prefs/apps).');
      }
      throw e;
    }
    const u = about?.data;
    if (!u || u.is_suspended) throw notFound(`Reddit user "${handle}"`);
    const [comments, posts] = await Promise.all([
      tryJson<any>(`${base}/user/${h}/comments${suffix}?limit=100&sort=new`, init),
      tryJson<any>(`${base}/user/${h}/submitted${suffix}?limit=25&sort=top&t=all`, init),
    ]);
    const cs: any[] = (comments?.data?.children || []).map((c: any) => c.data);
    const ps: any[] = (posts?.data?.children || []).map((c: any) => c.data);
    const subs = new Map<string, number>();
    for (const x of [...cs, ...ps]) subs.set(x.subreddit, (subs.get(x.subreddit) || 0) + 1);
    const topSubs = [...subs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const best = [...cs].sort((a, b) => b.score - a.score)[0];
    const worst = [...cs].sort((a, b) => a.score - b.score)[0];
    const facts: string[] = [];
    if (topSubs.length) facts.push(`Hangs out in: ${topSubs.map(([s, c]) => `r/${s} (${c})`).join(', ')}.`);
    if (best) facts.push(`Best recent comment (${best.score} pts) in r/${best.subreddit}: "${clip(best.body, 200)}"`);
    if (worst && worst.score < 1) facts.push(`Most downvoted recent comment (${worst.score} pts) in r/${worst.subreddit}: "${clip(worst.body, 200)}"`);
    const icon = String(u.snoovatar_img || u.icon_img || '').split('?')[0];
    return {
      handle: u.name,
      displayName: u.subreddit?.title || u.name,
      profileUrl: `https://www.reddit.com/user/${u.name}`,
      avatarUrl: icon || avatarFor(`rd-${handle}`),
      bio: u.subreddit?.public_description || undefined,
      joined: isoFromUnix(u.created_utc),
      stats: cleanStats([
        { label: 'Total karma', value: compact(u.total_karma ?? u.link_karma + u.comment_karma) },
        { label: 'Post karma', value: compact(u.link_karma) },
        { label: 'Comment karma', value: compact(u.comment_karma) },
        { label: 'Top sub', value: topSubs[0] ? `r/${topSubs[0][0]}` : undefined },
      ]),
      lists: [
        { title: 'Favorite subreddits', items: topSubs.map(([s, c]) => ({ name: `r/${s}`, meta: `${c} recent posts/comments`, url: `https://www.reddit.com/r/${s}` })) },
        { title: 'Top posts', items: ps.slice(0, 5).map((p) => ({ name: p.title, meta: `${compact(p.score)} pts · r/${p.subreddit}`, url: `https://www.reddit.com${p.permalink}` })) },
      ],
      facts,
    };
  },
};
const APP_REDDIT_UA = 'web:cooked-profile-roaster:3.0 (by /u/cooked_roaster)';

// ---------------- Wikipedia ----------------
const wikipedia: ConnectorDef = {
  id: 'wikipedia',
  name: 'Wikipedia',
  category: 'social',
  inputLabel: 'Wikipedia username',
  placeholder: 'Jimbo Wales',
  example: 'Jimbo Wales',
  pulls: 'Edit count, user groups, pages you edit most, edit summaries',
  color: '#c8ccd1',
  parse(raw) {
    const s = raw.trim();
    const m = s.match(/wikipedia\.org\/wiki\/User:([^/?#]+)/i);
    const name = (m ? safeDecode(m[1]) : s.replace(/^User:/i, '')).replace(/_/g, ' ').trim();
    return name && name.length <= 85 && !/[#<>[\]|{}/]/.test(name) ? name : '';
  },
  async fetch(handle) {
    const api = 'https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=query';
    const q = await getJson<any>(`${api}&list=users&usprop=editcount|registration|groups&ususers=${encodeURIComponent(handle)}`, `Wikipedia user "${handle}"`);
    const u = q?.query?.users?.[0];
    if (!u || u.missing || u.invalid) throw notFound(`Wikipedia user "${handle}"`);
    const contribs = await tryJson<any>(`${api}&list=usercontribs&uclimit=100&ucprop=title|timestamp|comment|sizediff&ucuser=${encodeURIComponent(u.name)}`);
    const edits: any[] = contribs?.query?.usercontribs || [];
    const pages = new Map<string, number>();
    for (const e of edits) pages.set(e.title, (pages.get(e.title) || 0) + 1);
    const top = [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const groups = (u.groups || []).filter((g: string) => !['*', 'user', 'autoconfirmed'].includes(g));
    const talk = edits.filter((e) => /talk:/i.test(e.title)).length;
    const facts: string[] = [];
    if (groups.length) facts.push(`User groups: ${groups.join(', ')}.`);
    if (edits.length) facts.push(`${talk} of the last ${edits.length} edits were on talk pages (arguing).`);
    const summaries = edits.map((e) => e.comment).filter((c) => c && c.length > 8).slice(0, 5);
    if (summaries.length) facts.push(`Recent edit summaries: ${summaries.map((c) => `"${clip(c, 80)}"`).join(', ')}.`);
    return {
      handle: u.name,
      displayName: u.name,
      profileUrl: `https://en.wikipedia.org/wiki/User:${encodeURIComponent(u.name.replace(/ /g, '_'))}`,
      avatarUrl: avatarFor(`wiki-${u.name}`),
      joined: isoDate(u.registration),
      stats: cleanStats([
        { label: 'Edits', value: compact(u.editcount) },
        { label: 'Groups', value: groups.length },
        { label: 'Talk edits (last 100)', value: edits.length ? talk : undefined },
      ]),
      lists: [{ title: 'Most edited (recent)', items: top.map(([t, c]) => ({ name: t, meta: `${c} edits`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(t.replace(/ /g, '_'))}` })) }],
      facts,
    };
  },
};

export const socialConnectors = [hackernews, lobsters, devto, hashnode, medium, bluesky, mastodon, reddit, wikipedia];
