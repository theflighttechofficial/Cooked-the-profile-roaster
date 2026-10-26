import { cleanStats, compact, fmt, getJson, getText, isoDate, isoFromUnix, notFound, stripHtml, tryJson, xmlBlocks, xmlTag, BROWSER_UA } from '../http.ts';
import { parseHandle } from './handle.ts';
import { avatarFor, type ConnectorDef } from './types.ts';

const winRate = (r: any) => {
  const total = (r?.win || 0) + (r?.loss || 0) + (r?.draw || 0);
  return total ? `${Math.round(((r.win || 0) / total) * 100)}%` : undefined;
};

// ---------------- Steam ----------------
const steam: ConnectorDef = {
  id: 'steam',
  name: 'Steam',
  category: 'games',
  inputLabel: 'Custom URL name or SteamID64',
  placeholder: 'gabelogannewell',
  example: 'gabelogannewell',
  pulls: 'Most played games, hours, 2-week playtime, full library with a key',
  color: '#66c0f4',
  optionalEnv: 'STEAM_API_KEY',
  parse(raw) {
    const s = raw.trim();
    const m = s.match(/steamcommunity\.com\/(?:id|profiles)\/([^/?#]+)/i);
    return m ? m[1] : parseHandle(s);
  },
  async fetch(handle) {
    const path = /^\d{17}$/.test(handle) ? `profiles/${handle}` : `id/${encodeURIComponent(handle)}`;
    const xml = await getText(`https://steamcommunity.com/${path}/?xml=1`, `Steam profile "${handle}"`, { headers: { 'User-Agent': BROWSER_UA } });
    if (xmlTag(xml, 'error') || !xmlTag(xml, 'steamID64')) throw notFound(`Steam profile "${handle}"`);
    const id64 = xmlTag(xml, 'steamID64');
    const isPrivate = xmlTag(xml, 'privacyState') !== 'public';
    const most = xmlBlocks(xml, 'mostPlayedGame').map((g) => ({
      name: xmlTag(g, 'gameName'),
      recent: parseFloat(xmlTag(g, 'hoursPlayed').replace(/,/g, '')) || 0,
      total: parseFloat(xmlTag(g, 'hoursOnRecord').replace(/,/g, '')) || 0,
    }));

    // Full library needs a Web API key and a public "Game details" setting
    let library: { name: string; hours: number; recent: number }[] = [];
    if (process.env.STEAM_API_KEY) {
      const owned = await tryJson<any>(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${id64}&include_appinfo=1&include_played_free_games=1`,
      );
      library = (owned?.response?.games || []).map((g: any) => ({ name: g.name, hours: (g.playtime_forever || 0) / 60, recent: (g.playtime_2weeks || 0) / 60 }));
    }
    const libHours = library.reduce((s, g) => s + g.hours, 0);
    const neverPlayed = library.filter((g) => g.hours === 0).length;
    const top = library.length ? [...library].sort((a, b) => b.hours - a.hours).slice(0, 8) : most.map((g) => ({ name: g.name, hours: g.total, recent: g.recent }));

    const facts: string[] = [];
    if (isPrivate) facts.push('Profile is private or friends-only, so game data is hidden. Suspicious.');
    if (xmlTag(xml, 'vacBanned') === '1') facts.push('Has a VAC ban on record.');
    if (library.length) facts.push(`Owns ${library.length} games, never launched ${neverPlayed} of them (${Math.round((neverPlayed / library.length) * 100)}%).`);
    if (top[0]?.hours) facts.push(`${fmt(top[0].hours)} hours in ${top[0].name}, which is ${fmt(top[0].hours / 24)} full days.`);
    const state = stripHtml(xmlTag(xml, 'stateMessage'));
    if (state) facts.push(`Current status: ${state}.`);
    const headline = stripHtml(xmlTag(xml, 'headline'));
    if (headline) facts.push(`Profile headline: "${headline}".`);

    return {
      handle: xmlTag(xml, 'customURL') || id64,
      displayName: xmlTag(xml, 'steamID') || handle,
      profileUrl: `https://steamcommunity.com/${path}/`,
      avatarUrl: xmlTag(xml, 'avatarFull') || avatarFor(`steam-${handle}`),
      bio: stripHtml(xmlTag(xml, 'summary')).replace(/^No information given\.$/, '') || undefined,
      location: stripHtml(xmlTag(xml, 'location')) || undefined,
      joined: isoDate(xmlTag(xml, 'memberSince')),
      stats: cleanStats([
        { label: 'Hours (2 wks)', value: xmlTag(xml, 'hoursPlayed2Wk') || undefined },
        { label: 'Games owned', value: library.length || undefined },
        { label: 'Total hours', value: libHours ? compact(Math.round(libHours)) : undefined },
        { label: 'Never played', value: library.length ? neverPlayed : undefined },
        { label: 'Most played', value: top[0]?.name },
      ]),
      lists: [{ title: 'Most played', items: top.filter((g) => g.name).map((g) => ({ name: g.name, meta: `${fmt(g.hours)} h total${g.recent ? ` · ${fmt(g.recent)} h last 2 wks` : ''}` })) }],
      facts,
    };
  },
};

// ---------------- Chess.com ----------------
const chesscom: ConnectorDef = {
  id: 'chesscom',
  name: 'Chess.com',
  category: 'games',
  inputLabel: 'Chess.com username',
  placeholder: 'hikaru',
  example: 'hikaru',
  pulls: 'Ratings per time control, win/loss records, puzzles',
  color: '#81b64c',
  async fetch(handle) {
    const base = `https://api.chess.com/pub/player/${encodeURIComponent(handle.toLowerCase())}`;
    const p = await getJson<any>(base, `Chess.com player "${handle}"`);
    const s = (await tryJson<any>(`${base}/stats`)) || {};
    const modes = [
      ['Bullet', s.chess_bullet],
      ['Blitz', s.chess_blitz],
      ['Rapid', s.chess_rapid],
      ['Daily', s.chess_daily],
    ].filter(([, v]) => v?.last) as [string, any][];
    const facts: string[] = [];
    for (const [name, v] of modes) {
      const r = v.record || {};
      facts.push(`${name}: rating ${v.last.rating} (best ${v.best?.rating ?? '?'}), record ${r.win}W/${r.loss}L/${r.draw}D.`);
    }
    if (s.tactics?.highest) facts.push(`Puzzle peak ${s.tactics.highest.rating}.`);
    if (p.title) facts.push(`Holds the title ${p.title}.`);
    if (p.league) facts.push(`League: ${p.league}.`);
    const busiest = [...modes].sort((a, b) => {
      const g = (x: any) => (x.record?.win || 0) + (x.record?.loss || 0) + (x.record?.draw || 0);
      return g(b[1]) - g(a[1]);
    })[0];
    return {
      handle: p.username,
      displayName: p.name || p.username,
      profileUrl: p.url,
      avatarUrl: p.avatar || avatarFor(`chess-${handle}`),
      location: p.location || undefined,
      joined: isoFromUnix(p.joined),
      stats: cleanStats([
        ...modes.map(([n, v]) => ({ label: n, value: v.last.rating })),
        { label: 'Puzzles', value: s.tactics?.highest?.rating },
        { label: `Win rate (${busiest?.[0] ?? '-'})`, value: busiest ? winRate(busiest[1].record) : undefined },
        { label: 'Followers', value: compact(p.followers) },
      ]),
      lists: [],
      facts,
    };
  },
};

// ---------------- Lichess ----------------
const lichess: ConnectorDef = {
  id: 'lichess',
  name: 'Lichess',
  category: 'games',
  inputLabel: 'Lichess username',
  placeholder: 'DrNykterstein',
  example: 'DrNykterstein',
  pulls: 'Ratings, games played, win rate, total play time',
  color: '#bababa',
  async fetch(handle) {
    const u = await getJson<any>(`https://lichess.org/api/user/${encodeURIComponent(handle)}`, `Lichess user "${handle}"`);
    if (u.disabled || u.closed) throw notFound(`Lichess user "${handle}"`);
    const perfs = Object.entries<any>(u.perfs || {}).filter(([, v]) => v?.games > 0 && v.rating);
    perfs.sort((a, b) => b[1].games - a[1].games);
    const c = u.count || {};
    const facts: string[] = [];
    if (u.playTime?.total) facts.push(`Spent ${fmt(u.playTime.total / 3600)} hours playing on Lichess.`);
    if (c.all) facts.push(`${c.win} wins, ${c.loss} losses, ${c.draw} draws over ${c.all} games.`);
    for (const [k, v] of perfs.slice(0, 3)) if (v.prog) facts.push(`${k} rating changed ${v.prog > 0 ? '+' : ''}${v.prog} recently.`);
    if (u.patron) facts.push('Is a paying Lichess patron.');
    const prof = u.profile || {};
    return {
      handle: u.username,
      displayName: [prof.realName, prof.firstName, prof.lastName].filter(Boolean).join(' ') || u.username,
      profileUrl: u.url || `https://lichess.org/@/${u.username}`,
      avatarUrl: avatarFor(`lichess-${handle}`),
      bio: prof.bio || undefined,
      location: prof.location || prof.flag || undefined,
      joined: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
      stats: cleanStats([
        ...perfs.slice(0, 3).map(([k, v]) => ({ label: k[0].toUpperCase() + k.slice(1), value: v.rating })),
        { label: 'Games', value: compact(c.all) },
        { label: 'Win rate', value: c.all ? `${Math.round((c.win / c.all) * 100)}%` : undefined },
        { label: 'Hours played', value: u.playTime?.total ? compact(Math.round(u.playTime.total / 3600)) : undefined },
      ]),
      lists: [{ title: 'Ratings', items: perfs.map(([k, v]) => ({ name: k, meta: `${v.rating} · ${fmt(v.games)} games` })) }],
      facts,
    };
  },
};

// ---------------- Duolingo ----------------
const duolingo: ConnectorDef = {
  id: 'duolingo',
  name: 'Duolingo',
  category: 'games',
  inputLabel: 'Duolingo username',
  placeholder: 'luis',
  example: 'luis',
  pulls: 'Streak, total XP, every course and its XP (unofficial API)',
  color: '#58cc02',
  async fetch(handle) {
    const r = await getJson<any>(`https://www.duolingo.com/2017-06-30/users?username=${encodeURIComponent(handle)}`, `Duolingo user "${handle}"`, { headers: { 'User-Agent': BROWSER_UA } });
    const u = r.users?.[0];
    if (!u) throw notFound(`Duolingo user "${handle}"`);
    const courses: any[] = [...(u.courses || [])].sort((a, b) => b.xp - a.xp);
    const facts: string[] = [];
    if (courses.length > 2) facts.push(`Started ${courses.length} languages; ${courses.filter((c) => c.xp < 500).length} of them have under 500 XP.`);
    if (u.hasPlus) facts.push('Pays for Super Duolingo.');
    const streak = u.streak ?? u.streakData?.currentStreak?.length ?? 0;
    const pic = u.picture ? `${u.picture.startsWith('//') ? 'https:' : ''}${u.picture}/xxlarge` : undefined;
    return {
      handle: u.username,
      displayName: u.name || u.username,
      profileUrl: `https://www.duolingo.com/profile/${u.username}`,
      avatarUrl: pic || avatarFor(`duo-${handle}`),
      bio: u.bio || undefined,
      joined: isoFromUnix(u.creationDate),
      stats: cleanStats([
        { label: 'Streak', value: `${streak} days` },
        { label: 'Total XP', value: compact(u.totalXp) },
        { label: 'Languages', value: courses.length },
        { label: 'Main course', value: courses[0]?.title },
      ]),
      lists: [{ title: 'Courses', items: courses.slice(0, 8).map((c) => ({ name: c.title, meta: `${fmt(c.xp)} XP${c.crowns ? ` · ${c.crowns} crowns` : ''}` })) }],
      facts,
    };
  },
};

// ---------------- speedrun.com ----------------
const speedrun: ConnectorDef = {
  id: 'speedrun',
  name: 'speedrun.com',
  category: 'games',
  inputLabel: 'speedrun.com username',
  placeholder: 'cheese',
  example: 'cheese',
  pulls: 'Personal bests, placements, games you run',
  color: '#ffb400',
  async fetch(handle) {
    const r = await getJson<any>(`https://www.speedrun.com/api/v1/users/${encodeURIComponent(handle)}`, `speedrun.com user "${handle}"`);
    const u = r.data;
    const pbs = await tryJson<any>(`https://www.speedrun.com/api/v1/users/${u.id}/personal-bests?embed=game,category&top=50`);
    const runs: any[] = pbs?.data || [];
    const time = (t: number) => {
      const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = (t % 60).toFixed(t < 60 ? 2 : 0);
      return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
    };
    const games = new Set(runs.map((x) => x.game?.data?.names?.international).filter(Boolean));
    const wrs = runs.filter((x) => x.place === 1).length;
    return {
      handle: u.names?.international || handle,
      displayName: u.names?.international || handle,
      profileUrl: u.weblink,
      avatarUrl: u.assets?.image?.uri || avatarFor(`sr-${handle}`),
      location: u.location?.country?.names?.international || undefined,
      joined: isoDate(u.signup),
      stats: cleanStats([
        { label: 'PBs', value: runs.length },
        { label: 'World records', value: wrs },
        { label: 'Games', value: games.size },
        { label: 'Role', value: u.role },
      ]),
      lists: [
        {
          title: 'Personal bests',
          items: runs.slice(0, 8).map((x) => ({
            name: `${x.game?.data?.names?.international ?? 'Game'} — ${x.category?.data?.name ?? ''}`,
            meta: `#${x.place} · ${time(x.run?.times?.primary_t || 0)}`,
            url: x.run?.weblink,
          })),
        },
      ],
      facts: games.size ? [`Runs: ${[...games].slice(0, 8).join(', ')}.`] : [],
    };
  },
};

// ---------------- Pokémon Showdown ----------------
const showdown: ConnectorDef = {
  id: 'showdown',
  name: 'Pokémon Showdown',
  category: 'games',
  inputLabel: 'Showdown username',
  placeholder: 'zarel',
  example: 'zarel',
  pulls: 'Ladder Elo, GXE and win/loss per format',
  color: '#e3350d',
  parse: (raw) => (raw.match(/users\/([^/?#]+)/)?.[1] ?? raw).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30),
  async fetch(handle) {
    const u = await getJson<any>(`https://pokemonshowdown.com/users/${encodeURIComponent(handle)}.json`, `Showdown user "${handle}"`);
    const ratings = Object.entries<any>(u.ratings || {}).sort((a, b) => b[1].elo - a[1].elo);
    if (!u.registertime && !ratings.length) throw notFound(`Showdown user "${handle}"`);
    const totals = ratings.reduce((t, [, r]) => ({ w: t.w + (r.w || 0), l: t.l + (r.l || 0) }), { w: 0, l: 0 });
    return {
      handle: u.userid,
      displayName: u.username,
      profileUrl: `https://pokemonshowdown.com/users/${u.userid}`,
      avatarUrl: avatarFor(`ps-${handle}`),
      joined: isoFromUnix(u.registertime),
      stats: cleanStats([
        { label: 'Formats', value: ratings.length },
        { label: 'Best Elo', value: ratings[0] ? Math.round(ratings[0][1].elo) : undefined },
        { label: 'Wins', value: compact(totals.w) },
        { label: 'Losses', value: compact(totals.l) },
      ]),
      lists: [{ title: 'Ladders', items: ratings.slice(0, 8).map(([f, r]) => ({ name: f, meta: `Elo ${Math.round(r.elo)} · GXE ${r.gxe ?? '?'} · ${r.w}W/${r.l}L` })) }],
      facts: totals.l > totals.w ? [`Has lost more ladder games (${totals.l}) than won (${totals.w}).`] : [],
    };
  },
};

export const gamesConnectors = [steam, chesscom, lichess, duolingo, speedrun, showdown];
