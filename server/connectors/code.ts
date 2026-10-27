import { cleanStats, clip, compact, fmt, getJson, isoDate, isoFromUnix, notFound, tryJson, yearsSince, HttpError } from '../http.ts';
import { avatarFor, type ConnectorDef } from './types.ts';

const topCounts = (values: (string | null | undefined)[], n = 5) => {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
};

const daysAgo = (iso?: string | null) => (iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000)) : null);

// ---------------- GitHub ----------------
const github: ConnectorDef = {
  id: 'github',
  name: 'GitHub',
  category: 'code',
  inputLabel: 'GitHub username',
  placeholder: 'torvalds',
  example: 'octocat',
  pulls: 'Profile, every public repo, languages, stars, recent activity',
  color: '#8b949e',
  optionalEnv: 'GITHUB_TOKEN',
  async fetch(handle) {
    const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const base = `https://api.github.com/users/${encodeURIComponent(handle)}`;
    let user: any;
    try {
      user = await getJson(base, `GitHub user "${handle}"`, { headers });
    } catch (e) {
      if (e instanceof HttpError && e.status === 502 && /403/.test(e.message)) {
        throw new HttpError(429, 'GitHub rate limit hit (60 requests/hour without a token). Set GITHUB_TOKEN on the server.');
      }
      throw e;
    }
    const [repos, events] = await Promise.all([
      tryJson<any[]>(`${base}/repos?per_page=100&sort=pushed&type=owner`, { headers }),
      tryJson<any[]>(`${base}/events/public?per_page=100`, { headers }),
    ]);
    const own = (repos || []).filter((r) => !r.fork);
    const forks = (repos || []).length - own.length;
    const stars = own.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const langs = topCounts(own.map((r) => r.language));
    const noDesc = own.filter((r) => !r.description).length;
    const zeroStar = own.filter((r) => !r.stargazers_count).length;
    const archived = own.filter((r) => r.archived).length;
    const lastPush = own[0]?.pushed_at;

    const facts: string[] = [];
    if (own.length) facts.push(`${own.length} original repos, ${forks} forks; ${zeroStar} of the originals have zero stars, ${noDesc} have no description.`);
    if (archived) facts.push(`${archived} repos are archived.`);
    if (lastPush) facts.push(`Last push was ${daysAgo(lastPush)} days ago.`);
    if (user.hireable) facts.push('Marked as "available for hire".');
    if (user.company) facts.push(`Company: ${user.company}.`);
    if (user.blog) facts.push(`Website: ${user.blog}.`);
    if (user.twitter_username) facts.push(`Links an X/Twitter account: @${user.twitter_username}.`);

    if (events?.length) {
      const hours = topCounts(events.map((e) => String(new Date(e.created_at).getUTCHours())), 1);
      if (hours[0]) facts.push(`Most public activity happens around ${hours[0][0]}:00 UTC.`);
      const types = topCounts(events.map((e) => e.type), 3).map(([t, c]) => `${t.replace(/Event$/, '')} x${c}`);
      facts.push(`Recent public events: ${types.join(', ')}.`);
      const msgs = events
        .filter((e) => e.type === 'PushEvent')
        .flatMap((e) => (e.payload?.commits || []).map((c: any) => String(c.message || '').split('\n')[0]))
        .filter(Boolean)
        .slice(0, 8);
      if (msgs.length) facts.push(`Recent commit messages: ${msgs.map((m) => `"${clip(m, 70)}"`).join(', ')}.`);
    }

    return {
      handle: user.login,
      displayName: user.name || user.login,
      profileUrl: user.html_url,
      avatarUrl: user.avatar_url,
      bio: user.bio || undefined,
      location: user.location || undefined,
      joined: isoDate(user.created_at),
      stats: cleanStats([
        { label: 'Repos', value: user.public_repos },
        { label: 'Stars earned', value: compact(stars) },
        { label: 'Followers', value: compact(user.followers) },
        { label: 'Following', value: compact(user.following) },
        { label: 'Gists', value: user.public_gists },
        { label: 'Top language', value: langs[0]?.[0] },
      ]),
      lists: [
        {
          title: 'Top repos',
          items: [...own]
            .sort((a, b) => b.stargazers_count - a.stargazers_count)
            .slice(0, 6)
            .map((r) => ({ name: r.name, meta: `★ ${fmt(r.stargazers_count)} · ${r.language || 'no language'}${r.description ? ` · ${clip(r.description, 80)}` : ''}`, url: r.html_url })),
        },
        { title: 'Languages', items: langs.map(([l, c]) => ({ name: l, meta: `${c} repos` })) },
      ],
      facts,
    };
  },
};

// ---------------- GitLab ----------------
const gitlab: ConnectorDef = {
  id: 'gitlab',
  name: 'GitLab',
  category: 'code',
  inputLabel: 'GitLab username',
  placeholder: 'sytses',
  example: 'sytses',
  pulls: 'Profile, public projects, stars, last activity',
  color: '#fc6d26',
  async fetch(handle) {
    const api = 'https://gitlab.com/api/v4';
    const found = await getJson<any[]>(`${api}/users?username=${encodeURIComponent(handle)}`, `GitLab user "${handle}"`);
    if (!Array.isArray(found) || !found[0]) throw notFound(`GitLab user "${handle}"`);
    const [user, projects] = await Promise.all([
      tryJson<any>(`${api}/users/${found[0].id}`),
      tryJson<any[]>(`${api}/users/${found[0].id}/projects?per_page=50&order_by=last_activity_at&simple=true`),
    ]);
    const u = { ...found[0], ...(user || {}) };
    const list = projects || [];
    const stars = list.reduce((s, p) => s + (p.star_count || 0), 0);
    const facts: string[] = [];
    if (u.job_title) facts.push(`Job title: ${u.job_title}.`);
    if (u.organization) facts.push(`Organization: ${u.organization}.`);
    if (list.length) facts.push(`${list.filter((p) => !p.description).length} of ${list.length} projects have no description.`);
    if (list[0]?.last_activity_at) facts.push(`Most recent project activity ${daysAgo(list[0].last_activity_at)} days ago.`);
    return {
      handle: u.username,
      displayName: u.name || u.username,
      profileUrl: u.web_url,
      avatarUrl: u.avatar_url,
      bio: u.bio || undefined,
      location: u.location || undefined,
      joined: isoDate(u.created_at),
      stats: cleanStats([
        { label: 'Projects', value: list.length },
        { label: 'Stars', value: stars },
        { label: 'Followers', value: u.followers },
        { label: 'Following', value: u.following },
      ]),
      lists: [
        {
          title: 'Projects',
          items: list.slice(0, 6).map((p) => ({ name: p.name, meta: `★ ${p.star_count || 0}${p.description ? ` · ${clip(p.description, 80)}` : ''}`, url: p.web_url })),
        },
      ],
      facts,
    };
  },
};

// ---------------- Codeberg (Forgejo API) ----------------
const codeberg: ConnectorDef = {
  id: 'codeberg',
  name: 'Codeberg',
  category: 'code',
  inputLabel: 'Codeberg username',
  placeholder: 'forgejo',
  example: 'fnetX',
  pulls: 'Profile, repos, stars, languages',
  color: '#2185d0',
  async fetch(handle) {
    const api = `https://codeberg.org/api/v1/users/${encodeURIComponent(handle)}`;
    const user = await getJson<any>(api, `Codeberg user "${handle}"`);
    const repos = (await tryJson<any[]>(`${api}/repos?limit=50`)) || [];
    const own = repos.filter((r) => !r.fork);
    const langs = topCounts(own.map((r) => r.language));
    return {
      handle: user.login,
      displayName: user.full_name || user.login,
      profileUrl: `https://codeberg.org/${user.login}`,
      avatarUrl: user.avatar_url,
      bio: user.description || undefined,
      location: user.location || undefined,
      joined: isoDate(user.created),
      stats: cleanStats([
        { label: 'Repos', value: own.length },
        { label: 'Stars', value: own.reduce((s, r) => s + (r.stars_count || 0), 0) },
        { label: 'Followers', value: user.followers_count },
        { label: 'Starred', value: user.starred_repos_count },
      ]),
      lists: [
        { title: 'Repos', items: own.slice(0, 6).map((r) => ({ name: r.name, meta: `★ ${r.stars_count} · ${r.language || 'no language'}`, url: r.html_url })) },
        { title: 'Languages', items: langs.map(([l, c]) => ({ name: l, meta: `${c} repos` })) },
      ],
      facts: user.website ? [`Website: ${user.website}.`] : [],
    };
  },
};

// ---------------- Stack Overflow ----------------
const stackoverflow: ConnectorDef = {
  id: 'stackoverflow',
  name: 'Stack Overflow',
  category: 'code',
  inputLabel: 'User ID, profile URL, or display name',
  placeholder: 'stackoverflow.com/users/22656',
  example: '22656',
  pulls: 'Reputation, badges, top tags, answer stats',
  color: '#f48024',
  parse(raw) {
    const s = raw.trim();
    const m = s.match(/\/users\/(\d+)/) || s.match(/^(\d+)$/);
    if (m) return m[1];
    return /^[\p{L}\p{N} ._'-]{2,40}$/u.test(s) ? s : '';
  },
  async fetch(handle) {
    const api = 'https://api.stackexchange.com/2.3';
    const site = 'site=stackoverflow';
    let user: any;
    if (/^\d+$/.test(handle)) {
      const r = await getJson<any>(`${api}/users/${handle}?${site}`, `Stack Overflow user ${handle}`);
      user = r.items?.[0];
    } else {
      const r = await getJson<any>(`${api}/users?inname=${encodeURIComponent(handle)}&sort=reputation&order=desc&pagesize=1&${site}`, `Stack Overflow user "${handle}"`);
      user = r.items?.[0];
    }
    if (!user) throw notFound(`Stack Overflow user "${handle}"`);
    const tags = await tryJson<any>(`${api}/users/${user.user_id}/top-tags?pagesize=8&${site}`);
    const b = user.badge_counts || {};
    const facts: string[] = [];
    if (user.last_access_date) facts.push(`Last seen ${daysAgo(isoFromUnix(user.last_access_date))} days ago.`);
    const yrs = yearsSince(isoFromUnix(user.creation_date));
    if (yrs !== null) facts.push(`Member for ${yrs} years.`);
    if (user.accept_rate) facts.push(`Accepts ${user.accept_rate}% of answers to their own questions.`);
    return {
      handle: String(user.user_id),
      displayName: user.display_name,
      profileUrl: user.link,
      avatarUrl: user.profile_image,
      location: user.location || undefined,
      joined: isoFromUnix(user.creation_date),
      stats: cleanStats([
        { label: 'Reputation', value: compact(user.reputation) },
        { label: 'Gold', value: b.gold },
        { label: 'Silver', value: b.silver },
        { label: 'Bronze', value: b.bronze },
      ]),
      lists: [
        {
          title: 'Top tags',
          items: (tags?.items || []).map((t: any) => ({ name: t.tag_name, meta: `${fmt(t.answer_count)} answers · ${fmt(t.question_count)} questions · score ${fmt(t.answer_score)}` })),
        },
      ],
      facts,
    };
  },
};

// ---------------- npm ----------------
const npm: ConnectorDef = {
  id: 'npm',
  name: 'npm',
  category: 'code',
  inputLabel: 'npm username',
  placeholder: 'sindresorhus',
  example: 'sindresorhus',
  pulls: 'Packages you maintain and their monthly downloads',
  color: '#cb3837',
  async fetch(handle) {
    const data = await getJson<any>(
      `https://registry.npmjs.org/-/v1/search?text=maintainer:${encodeURIComponent(handle)}&size=50`,
      `npm maintainer "${handle}"`,
    );
    const pkgs: any[] = (data.objects || []).map((o: any) => o.package);
    if (!pkgs.length) throw notFound(`npm maintainer "${handle}"`);

    const unscoped = pkgs.filter((p) => !p.name.startsWith('@')).slice(0, 50).map((p) => p.name);
    const downloads: Record<string, number> = {};
    let haveDownloads = false;
    if (unscoped.length) {
      const d = await tryJson<any>(`https://api.npmjs.org/downloads/point/last-month/${unscoped.join(',')}`);
      if (d && unscoped.length === 1 && typeof d.downloads === 'number') downloads[unscoped[0]] = d.downloads;
      else if (d) for (const [k, v] of Object.entries<any>(d)) if (v && typeof v.downloads === 'number') downloads[k] = v.downloads;
      haveDownloads = Object.keys(downloads).length > 0;
    }
    const total = Object.values(downloads).reduce((a, b) => a + b, 0);
    const sorted = [...pkgs].sort((a, b) => (downloads[b.name] || 0) - (downloads[a.name] || 0));
    const dead = Object.entries(downloads).filter(([, v]) => v < 50).length;
    const oldest = [...pkgs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    const facts = [`Maintains ${data.total} packages in total.`];
    if (dead) facts.push(`${dead} packages got fewer than 50 downloads last month.`);
    if (oldest?.date) facts.push(`"${oldest.name}" was last published ${daysAgo(oldest.date)} days ago.`);
    const tiny = pkgs.filter((p) => /^(is-|has-|to-)/.test(p.name)).map((p) => p.name).slice(0, 5);
    if (tiny.length) facts.push(`Micro-packages like: ${tiny.join(', ')}.`);

    return {
      handle,
      displayName: handle,
      profileUrl: `https://www.npmjs.com/~${encodeURIComponent(handle)}`,
      avatarUrl: avatarFor(`npm-${handle}`),
      stats: cleanStats([
        { label: 'Packages', value: data.total },
        { label: 'Downloads / mo', value: haveDownloads ? compact(total) : undefined },
        { label: 'Under 50 dl/mo', value: haveDownloads ? dead : undefined },
      ]),
      lists: [
        {
          title: 'Packages',
          items: sorted.slice(0, 8).map((p) => ({
            name: p.name,
            meta: `v${p.version}${downloads[p.name] !== undefined ? ` · ${compact(downloads[p.name])}/mo` : ''}${p.description ? ` · ${clip(p.description, 70)}` : ''}`,
            url: p.links?.npm,
          })),
        },
      ],
      facts,
    };
  },
};

// ---------------- crates.io ----------------
const crates: ConnectorDef = {
  id: 'crates',
  name: 'crates.io',
  category: 'code',
  inputLabel: 'crates.io / GitHub login',
  placeholder: 'dtolnay',
  example: 'dtolnay',
  pulls: 'Rust crates you own and their downloads',
  color: '#e6b04a',
  async fetch(handle) {
    const { user } = await getJson<any>(`https://crates.io/api/v1/users/${encodeURIComponent(handle)}`, `crates.io user "${handle}"`);
    if (!user) throw notFound(`crates.io user "${handle}"`);
    const data = (await tryJson<any>(`https://crates.io/api/v1/crates?user_id=${user.id}&per_page=50&sort=downloads`)) || {};
    const list: any[] = data.crates || [];
    const total = list.reduce((s, c) => s + (c.downloads || 0), 0);
    const recent = list.reduce((s, c) => s + (c.recent_downloads || 0), 0);
    const pre1 = list.filter((c) => /^0\./.test(c.max_version || c.newest_version || '')).length;
    return {
      handle: user.login,
      displayName: user.name || user.login,
      profileUrl: `https://crates.io/users/${user.login}`,
      avatarUrl: user.avatar,
      stats: cleanStats([
        { label: 'Crates', value: data.meta?.total ?? list.length },
        { label: 'All-time dl', value: compact(total) },
        { label: '90-day dl', value: compact(recent) },
        { label: 'Still 0.x', value: pre1 },
      ]),
      lists: [
        {
          title: 'Crates',
          items: list.slice(0, 8).map((c) => ({ name: c.name, meta: `v${c.max_version || c.newest_version} · ${compact(c.downloads)} dl${c.description ? ` · ${clip(c.description, 60)}` : ''}`, url: `https://crates.io/crates/${c.name}` })),
        },
      ],
      facts: pre1 ? [`${pre1} of ${list.length} crates are still below version 1.0.`] : [],
    };
  },
};

// ---------------- Hugging Face ----------------
const huggingface: ConnectorDef = {
  id: 'huggingface',
  name: 'Hugging Face',
  category: 'code',
  inputLabel: 'Hugging Face user or org',
  placeholder: 'julien-c',
  example: 'julien-c',
  pulls: 'Models, datasets, Spaces, likes, followers',
  color: '#ffcc4d',
  async fetch(handle) {
    const h = encodeURIComponent(handle);
    let ov = await tryJson<any>(`https://huggingface.co/api/users/${h}/overview`);
    let isOrg = false;
    if (!ov) {
      ov = await tryJson<any>(`https://huggingface.co/api/organizations/${h}/overview`);
      isOrg = !!ov;
    }
    if (!ov) throw notFound(`Hugging Face user "${handle}"`);
    const [models, spaces] = await Promise.all([
      tryJson<any[]>(`https://huggingface.co/api/models?author=${h}&sort=downloads&direction=-1&limit=8`),
      tryJson<any[]>(`https://huggingface.co/api/spaces?author=${h}&sort=likes&direction=-1&limit=6`),
    ]);
    const name = ov.user || ov.name || handle;
    const facts: string[] = [];
    if (ov.isPro) facts.push('Pays for Hugging Face PRO.');
    if (isOrg) facts.push('This is an organization account.');
    const sdks = topCounts((spaces || []).map((s) => s.sdk), 3);
    if (sdks.length) facts.push(`Spaces built with: ${sdks.map(([s, c]) => `${s} x${c}`).join(', ')}.`);
    const avatar = ov.avatarUrl ? (ov.avatarUrl.startsWith('http') ? ov.avatarUrl : `https://huggingface.co${ov.avatarUrl}`) : avatarFor(`hf-${handle}`);
    return {
      handle: name,
      displayName: ov.fullname || name,
      profileUrl: `https://huggingface.co/${name}`,
      avatarUrl: avatar,
      joined: isoDate(ov.createdAt),
      stats: cleanStats([
        { label: 'Models', value: ov.numModels },
        { label: 'Datasets', value: ov.numDatasets },
        { label: 'Spaces', value: ov.numSpaces },
        { label: 'Followers', value: compact(ov.numFollowers) },
        { label: 'Likes given', value: ov.numLikes },
        { label: 'Papers', value: ov.numPapers },
      ]),
      lists: [
        { title: 'Top models', items: (models || []).map((m) => ({ name: m.id, meta: `${compact(m.downloads)} dl · ♥ ${m.likes}${m.pipeline_tag ? ` · ${m.pipeline_tag}` : ''}`, url: `https://huggingface.co/${m.id}` })) },
        { title: 'Spaces', items: (spaces || []).map((s) => ({ name: s.id, meta: `♥ ${s.likes} · ${s.sdk || 'space'}`, url: `https://huggingface.co/spaces/${s.id}` })) },
      ],
      facts,
    };
  },
};

// ---------------- Docker Hub ----------------
const dockerhub: ConnectorDef = {
  id: 'dockerhub',
  name: 'Docker Hub',
  category: 'code',
  inputLabel: 'Docker Hub user or org',
  placeholder: 'bitnami',
  example: 'bitnami',
  pulls: 'Public images, pull counts, stars',
  color: '#1d63ed',
  async fetch(handle) {
    const h = encodeURIComponent(handle.toLowerCase());
    const [user, repos] = await Promise.all([
      tryJson<any>(`https://hub.docker.com/v2/users/${h}/`),
      tryJson<any>(`https://hub.docker.com/v2/repositories/${h}/?page_size=100&ordering=last_updated`),
    ]);
    if (!user && !repos?.results) throw notFound(`Docker Hub account "${handle}"`);
    const list: any[] = repos?.results || [];
    const pulls = list.reduce((s, r) => s + (r.pull_count || 0), 0);
    const stale = list.filter((r) => daysAgo(r.last_updated)! > 365).length;
    return {
      handle: user?.username || handle,
      displayName: user?.full_name || user?.username || handle,
      profileUrl: `https://hub.docker.com/u/${h}`,
      avatarUrl: user?.gravatar_url || avatarFor(`docker-${handle}`),
      location: user?.location || undefined,
      joined: isoDate(user?.date_joined),
      stats: cleanStats([
        { label: 'Images', value: repos?.count ?? list.length },
        { label: 'Total pulls', value: compact(pulls) },
        { label: 'Stale > 1yr', value: stale },
      ]),
      lists: [
        {
          title: 'Most pulled',
          items: [...list].sort((a, b) => b.pull_count - a.pull_count).slice(0, 8).map((r) => ({ name: r.name, meta: `${compact(r.pull_count)} pulls · ★ ${r.star_count}${r.description ? ` · ${clip(r.description, 60)}` : ''}`, url: `https://hub.docker.com/r/${h}/${r.name}` })),
        },
      ],
      facts: [user?.company ? `Company: ${user.company}.` : '', stale ? `${stale} images have not been updated in over a year.` : ''].filter(Boolean),
    };
  },
};

export const codeConnectors = [github, gitlab, codeberg, stackoverflow, npm, crates, huggingface, dockerhub];
