import { cleanStats, compact, fmt, getJson, isoDate, isoFromUnix, notFound, postJson, request, tryJson, BROWSER_UA, HttpError } from '../http.ts';
import { avatarFor, type ConnectorDef } from './types.ts';

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '0%');

// ---------------- LeetCode ----------------
const LEETCODE_QUERY = `query cooked($username: String!) {
  matchedUser(username: $username) {
    username
    profile { realName userAvatar ranking aboutMe countryName reputation }
    submitStatsGlobal { acSubmissionNum { difficulty count submissions } }
    languageProblemCount { languageName problemsSolved }
    badges { displayName }
    userCalendar { streak totalActiveDays }
  }
  userContestRanking(username: $username) { rating attendedContestsCount globalRanking topPercentage }
  recentAcSubmissionList(username: $username, limit: 10) { title timestamp }
}`;

const leetcode: ConnectorDef = {
  id: 'leetcode',
  name: 'LeetCode',
  category: 'compete',
  inputLabel: 'LeetCode username',
  placeholder: 'neal_wu',
  example: 'neal_wu',
  pulls: 'Solved by difficulty, ranking, contest rating, streak, languages',
  color: '#ffa116',
  async fetch(handle) {
    const res = await postJson<any>('https://leetcode.com/graphql/', { query: LEETCODE_QUERY, variables: { username: handle } }, `LeetCode user "${handle}"`, {
      Referer: `https://leetcode.com/u/${encodeURIComponent(handle)}/`,
      Origin: 'https://leetcode.com',
      'User-Agent': BROWSER_UA,
    });
    const u = res?.data?.matchedUser;
    if (!u) throw notFound(`LeetCode user "${handle}"`);
    const ac: any[] = u.submitStatsGlobal?.acSubmissionNum || [];
    const get = (d: string) => ac.find((x) => x.difficulty === d) || { count: 0, submissions: 0 };
    const all = get('All');
    const contest = res.data.userContestRanking;
    const langs = [...(u.languageProblemCount || [])].sort((a, b) => b.problemsSolved - a.problemsSolved);
    const facts: string[] = [];
    if (all.submissions) facts.push(`Accepted submissions are ${pct(all.count, all.submissions)} of all accepted-problem submissions.`);
    if (u.userCalendar) facts.push(`Current streak ${u.userCalendar.streak} days, ${u.userCalendar.totalActiveDays} active days this year.`);
    if (contest) facts.push(`Contest rating ${Math.round(contest.rating)} over ${contest.attendedContestsCount} contests (top ${contest.topPercentage}%).`);
    const recent = res.data.recentAcSubmissionList || [];
    if (recent.length) facts.push(`Recently solved: ${recent.slice(0, 6).map((r: any) => r.title).join(', ')}.`);
    if (u.badges?.length) facts.push(`Badges: ${u.badges.slice(0, 6).map((b: any) => b.displayName).join(', ')}.`);
    return {
      handle: u.username,
      displayName: u.profile?.realName || u.username,
      profileUrl: `https://leetcode.com/u/${u.username}/`,
      avatarUrl: u.profile?.userAvatar || avatarFor(`lc-${handle}`),
      bio: u.profile?.aboutMe || undefined,
      location: u.profile?.countryName || undefined,
      stats: cleanStats([
        { label: 'Solved', value: all.count },
        { label: 'Easy', value: get('Easy').count },
        { label: 'Medium', value: get('Medium').count },
        { label: 'Hard', value: get('Hard').count },
        { label: 'Global rank', value: u.profile?.ranking ? fmt(u.profile.ranking) : undefined },
        { label: 'Contest rating', value: contest ? Math.round(contest.rating) : undefined },
      ]),
      lists: [{ title: 'Languages', items: langs.slice(0, 6).map((l) => ({ name: l.languageName, meta: `${l.problemsSolved} solved` })) }],
      facts,
    };
  },
};

// ---------------- Codeforces ----------------
const codeforces: ConnectorDef = {
  id: 'codeforces',
  name: 'Codeforces',
  category: 'compete',
  inputLabel: 'Codeforces handle',
  placeholder: 'tourist',
  example: 'tourist',
  pulls: 'Rating history, rank, verdicts, favorite tags & languages',
  color: '#1f8acb',
  async fetch(handle) {
    const api = 'https://codeforces.com/api';
    const h = encodeURIComponent(handle);
    const info = await request(`${api}/user.info?handles=${h}`);
    const body = await info.json().catch(() => null);
    if (!body || body.status !== 'OK') {
      if (body?.comment?.includes('not found')) throw notFound(`Codeforces user "${handle}"`);
      throw new HttpError(502, body?.comment || 'Codeforces API is unavailable right now.');
    }
    const u = body.result[0];
    const [rating, status] = await Promise.all([
      tryJson<any>(`${api}/user.rating?handle=${h}`),
      tryJson<any>(`${api}/user.status?handle=${h}&from=1&count=300`),
    ]);
    const contests: any[] = rating?.result || [];
    const subs: any[] = status?.result || [];
    const ok = subs.filter((s) => s.verdict === 'OK').length;
    const verdicts = new Map<string, number>();
    const langs = new Map<string, number>();
    const tags = new Map<string, number>();
    for (const s of subs) {
      verdicts.set(s.verdict, (verdicts.get(s.verdict) || 0) + 1);
      langs.set(s.programmingLanguage, (langs.get(s.programmingLanguage) || 0) + 1);
      if (s.verdict === 'OK') for (const t of s.problem?.tags || []) tags.set(t, (tags.get(t) || 0) + 1);
    }
    const worst = contests.reduce<any>((w, c) => (!w || c.newRating - c.oldRating < w.newRating - w.oldRating ? c : w), null);
    const facts: string[] = [];
    if (subs.length) facts.push(`Of the last ${subs.length} submissions, ${pct(ok, subs.length)} were accepted.`);
    const wrong = [...verdicts.entries()].filter(([v]) => v !== 'OK').sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (wrong.length) facts.push(`Most common failures: ${wrong.map(([v, c]) => `${v} x${c}`).join(', ')}.`);
    if (worst && worst.newRating < worst.oldRating) facts.push(`Worst contest: lost ${worst.oldRating - worst.newRating} rating in "${worst.contestName}".`);
    if (u.organization) facts.push(`Organization: ${u.organization}.`);
    if (u.lastOnlineTimeSeconds) facts.push(`Last online ${new Date(u.lastOnlineTimeSeconds * 1000).toDateString()}.`);
    const photo = u.titlePhoto?.startsWith('//') ? `https:${u.titlePhoto}` : u.titlePhoto;
    return {
      handle: u.handle,
      displayName: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.handle,
      profileUrl: `https://codeforces.com/profile/${u.handle}`,
      avatarUrl: photo || avatarFor(`cf-${handle}`),
      location: [u.city, u.country].filter(Boolean).join(', ') || undefined,
      joined: isoFromUnix(u.registrationTimeSeconds),
      stats: cleanStats([
        { label: 'Rating', value: u.rating },
        { label: 'Max rating', value: u.maxRating },
        { label: 'Rank', value: u.rank },
        { label: 'Contests', value: contests.length },
        { label: 'Contribution', value: u.contribution },
        { label: 'Friend of', value: compact(u.friendOfCount) },
      ]),
      lists: [
        { title: 'Favorite tags', items: [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, c]) => ({ name: t, meta: `${c} solved` })) },
        { title: 'Languages', items: [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([l, c]) => ({ name: l, meta: `${c} submissions` })) },
      ],
      facts,
    };
  },
};

// ---------------- AtCoder ----------------
const atcoder: ConnectorDef = {
  id: 'atcoder',
  name: 'AtCoder',
  category: 'compete',
  inputLabel: 'AtCoder username',
  placeholder: 'tourist',
  example: 'tourist',
  pulls: 'Contest history, rating, performance, accepted count',
  color: '#a0a0a0',
  async fetch(handle) {
    const h = encodeURIComponent(handle);
    const history = await getJson<any[]>(`https://atcoder.jp/users/${h}/history/json`, `AtCoder user "${handle}"`);
    const rated = (history || []).filter((c) => c.IsRated);
    const ac = await tryJson<any>(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/ac_rank?user=${h}`);
    if (!rated.length && !ac) throw notFound(`AtCoder user "${handle}"`);
    const last = rated[rated.length - 1];
    const max = rated.reduce((m, c) => Math.max(m, c.NewRating), 0);
    const bestPerf = rated.reduce((m, c) => Math.max(m, c.Performance), 0);
    const worst = rated.reduce<any>((w, c) => (!w || c.NewRating - c.OldRating < w.NewRating - w.OldRating ? c : w), null);
    return {
      handle,
      displayName: handle,
      profileUrl: `https://atcoder.jp/users/${h}`,
      avatarUrl: avatarFor(`atcoder-${handle}`),
      joined: isoDate(rated[0]?.EndTime),
      stats: cleanStats([
        { label: 'Rating', value: last?.NewRating ?? 0 },
        { label: 'Max rating', value: max },
        { label: 'Rated contests', value: rated.length },
        { label: 'Best perf', value: bestPerf },
        { label: 'Accepted', value: ac?.count },
        { label: 'AC rank', value: ac?.rank !== undefined ? fmt(ac.rank + 1) : undefined },
      ]),
      lists: [{ title: 'Recent contests', items: rated.slice(-6).reverse().map((c) => ({ name: c.ContestName, meta: `place ${c.Place} · perf ${c.Performance} · ${c.OldRating} → ${c.NewRating}` })) }],
      facts: worst && worst.NewRating < worst.OldRating ? [`Worst contest: dropped ${worst.OldRating - worst.NewRating} rating in ${worst.ContestName}.`] : [],
    };
  },
};

// ---------------- Codewars ----------------
const codewars: ConnectorDef = {
  id: 'codewars',
  name: 'Codewars',
  category: 'compete',
  inputLabel: 'Codewars username',
  placeholder: 'g964',
  example: 'g964',
  pulls: 'Rank, honor, kata completed, languages, clan',
  color: '#b1361e',
  async fetch(handle) {
    const u = await getJson<any>(`https://www.codewars.com/api/v1/users/${encodeURIComponent(handle)}`, `Codewars user "${handle}"`);
    const langs = Object.entries<any>(u.ranks?.languages || {}).sort((a, b) => b[1].score - a[1].score);
    const facts: string[] = [];
    if (u.clan) facts.push(`Clan: "${u.clan}".`);
    if (u.skills?.length) facts.push(`Self-declared skills: ${u.skills.slice(0, 8).join(', ')}.`);
    return {
      handle: u.username,
      displayName: u.name || u.username,
      profileUrl: `https://www.codewars.com/users/${u.username}`,
      avatarUrl: avatarFor(`cw-${handle}`),
      stats: cleanStats([
        { label: 'Rank', value: u.ranks?.overall?.name },
        { label: 'Honor', value: compact(u.honor) },
        { label: 'Kata done', value: u.codeChallenges?.totalCompleted },
        { label: 'Kata authored', value: u.codeChallenges?.totalAuthored },
        { label: 'Leaderboard', value: u.leaderboardPosition ? `#${fmt(u.leaderboardPosition)}` : undefined },
      ]),
      lists: [{ title: 'Languages', items: langs.slice(0, 6).map(([l, r]) => ({ name: l, meta: `${r.name} · ${fmt(r.score)} pts` })) }],
      facts,
    };
  },
};

// ---------------- Monkeytype ----------------
const monkeytype: ConnectorDef = {
  id: 'monkeytype',
  name: 'Monkeytype',
  category: 'compete',
  inputLabel: 'Monkeytype username',
  placeholder: 'miodec',
  example: 'Miodec',
  pulls: 'Typing PBs, tests started vs finished, time typing, streak',
  color: '#e2b714',
  async fetch(handle) {
    const r = await getJson<any>(`https://api.monkeytype.com/users/${encodeURIComponent(handle)}/profile`, `Monkeytype user "${handle}"`);
    const d = r.data;
    if (!d) throw notFound(`Monkeytype user "${handle}"`);
    const ts = d.typingStats || {};
    const pb = (mode: string, len: string) => {
      const arr: any[] = d.personalBests?.[mode]?.[len] || [];
      return arr.reduce<any>((best, x) => (!best || x.wpm > best.wpm ? x : best), null);
    };
    const pbs = [['time', '15'], ['time', '30'], ['time', '60'], ['words', '10'], ['words', '25']]
      .map(([m, l]) => ({ m, l, v: pb(m, l) }))
      .filter((x) => x.v);
    const facts: string[] = [];
    if (ts.startedTests) facts.push(`Started ${fmt(ts.startedTests)} tests but only finished ${fmt(ts.completedTests)} (${pct(ts.completedTests, ts.startedTests)}).`);
    if (d.details?.keyboard) facts.push(`Keyboard: ${d.details.keyboard}.`);
    if (d.maxStreak) facts.push(`Longest daily streak: ${d.maxStreak} days.`);
    return {
      handle: d.name,
      displayName: d.name,
      profileUrl: `https://monkeytype.com/profile/${encodeURIComponent(d.name)}`,
      avatarUrl: d.discordId && d.discordAvatar ? `https://cdn.discordapp.com/avatars/${d.discordId}/${d.discordAvatar}.png` : avatarFor(`mt-${handle}`),
      bio: d.details?.bio || undefined,
      joined: d.addedAt ? new Date(d.addedAt).toISOString() : undefined,
      stats: cleanStats([
        { label: '60s PB', value: pb('time', '60') ? `${Math.round(pb('time', '60').wpm)} wpm` : undefined },
        { label: '15s PB', value: pb('time', '15') ? `${Math.round(pb('time', '15').wpm)} wpm` : undefined },
        { label: 'Tests done', value: compact(ts.completedTests) },
        { label: 'Hours typing', value: ts.timeTyping ? fmt(ts.timeTyping / 3600) : undefined },
        { label: 'Streak', value: d.streak },
        { label: 'XP', value: compact(d.xp) },
      ]),
      lists: [{ title: 'Personal bests', items: pbs.map((x) => ({ name: `${x.m} ${x.l}`, meta: `${Math.round(x.v.wpm)} wpm · ${Math.round(x.v.acc)}% acc` })) }],
      facts,
    };
  },
};

export const competeConnectors = [leetcode, codeforces, atcoder, codewars, monkeytype];
