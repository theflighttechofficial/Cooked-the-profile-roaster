import { cleanStats, clip, compact, fmt, getJson, getText, isoDate, isoFromUnix, notFound, postJson, stripHtml, tryJson, xmlBlocks, xmlTag, BROWSER_UA, HttpError, request } from '../http.ts';
import { avatarFor, type ConnectorDef } from './types.ts';

// ---------------- Letterboxd (RSS) ----------------
const letterboxd: ConnectorDef = {
  id: 'letterboxd',
  name: 'Letterboxd',
  category: 'culture',
  inputLabel: 'Letterboxd username',
  placeholder: 'davidehrlich',
  example: 'davidehrlich',
  pulls: 'Recent diary: films, star ratings, rewatches, review text',
  color: '#00e054',
  async fetch(handle) {
    const h = encodeURIComponent(handle.toLowerCase());
    const xml = await getText(`https://letterboxd.com/${h}/rss/`, `Letterboxd user "${handle}"`, { headers: { 'User-Agent': BROWSER_UA } });
    const items = xmlBlocks(xml, 'item');
    const films = items
      .map((it) => ({
        title: xmlTag(it, 'letterboxd:filmTitle'),
        year: xmlTag(it, 'letterboxd:filmYear'),
        rating: parseFloat(xmlTag(it, 'letterboxd:memberRating')),
        rewatch: xmlTag(it, 'letterboxd:rewatch') === 'Yes',
        liked: xmlTag(it, 'letterboxd:memberLike') === 'Yes',
        review: clip(stripHtml(xmlTag(it, 'description')).replace(/^.*?Watched on [^.]*\.\s*/i, ''), 220),
        link: xmlTag(it, 'link'),
      }))
      .filter((f) => f.title);
    const rated = films.filter((f) => !Number.isNaN(f.rating));
    const mean = rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : 0;
    const name = stripHtml(xmlTag(xml, 'title')).replace(/^Letterboxd\s*-\s*/i, '');
    const facts: string[] = [];
    const fives = rated.filter((f) => f.rating >= 5).map((f) => f.title);
    const lows = rated.filter((f) => f.rating <= 1.5).map((f) => f.title);
    if (fives.length) facts.push(`Gave 5 stars to: ${fives.slice(0, 5).join(', ')}.`);
    if (lows.length) facts.push(`Trashed (1.5 stars or less): ${lows.slice(0, 5).join(', ')}.`);
    const reviews = films.filter((f) => f.review && f.review.length > 20).slice(0, 4);
    facts.push(...reviews.map((f) => `Review of ${f.title}: "${f.review}"`));
    const years = films.map((f) => Number(f.year)).filter(Boolean);
    if (years.length) facts.push(`Average release year of recent watches: ${Math.round(years.reduce((a, b) => a + b, 0) / years.length)}.`);

    // The profile page has the avatar and lifetime counts. Cloudflare may block it, so it is optional.
    let avatar: string | undefined;
    let total: string | undefined;
    try {
      const page = await request(`https://letterboxd.com/${h}/`, { headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' } }, { retries: 0, timeoutMs: 6000 });
      if (page.ok) {
        const html = await page.text();
        avatar = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
        total = html.match(/<span class="value">([\d,]+)<\/span>\s*<span class="definition[^"]*">Films/)?.[1];
      }
    } catch {
      /* optional */
    }
    return {
      handle,
      displayName: name || handle,
      profileUrl: `https://letterboxd.com/${h}/`,
      avatarUrl: avatar || avatarFor(`lb-${handle}`),
      stats: cleanStats([
        { label: 'Films logged', value: total },
        { label: 'Recent entries', value: films.length },
        { label: 'Avg rating', value: rated.length ? `${mean.toFixed(1)}★` : undefined },
        { label: 'Rewatches', value: films.filter((f) => f.rewatch).length },
        { label: 'Liked', value: films.filter((f) => f.liked).length },
      ]),
      lists: [{ title: 'Recent diary', items: films.slice(0, 8).map((f) => ({ name: `${f.title}${f.year ? ` (${f.year})` : ''}`, meta: `${Number.isNaN(f.rating) ? 'no rating' : `${f.rating}★`}${f.rewatch ? ' · rewatch' : ''}${f.liked ? ' · ♥' : ''}`, url: f.link })) }],
      facts,
    };
  },
};

// ---------------- MyAnimeList (Jikan) ----------------
const myanimelist: ConnectorDef = {
  id: 'myanimelist',
  name: 'MyAnimeList',
  category: 'culture',
  inputLabel: 'MAL username',
  placeholder: 'Xinil',
  example: 'Xinil',
  pulls: 'Days watched, mean score, dropped count, favorites',
  color: '#2e51a2',
  async fetch(handle) {
    const r = await getJson<any>(`https://api.jikan.moe/v4/users/${encodeURIComponent(handle)}/full`, `MyAnimeList user "${handle}"`, {}, { retries: 2, timeoutMs: 12000 });
    const d = r.data;
    if (!d) throw notFound(`MyAnimeList user "${handle}"`);
    const a = d.statistics?.anime || {};
    const m = d.statistics?.manga || {};
    const fav = d.favorites || {};
    const facts: string[] = [];
    if (a.dropped) facts.push(`Dropped ${a.dropped} anime; plan-to-watch backlog of ${a.plan_to_watch}.`);
    if (a.days_watched) facts.push(`${fmt(a.days_watched)} full days of life spent watching anime.`);
    if (fav.characters?.length) facts.push(`Favorite characters: ${fav.characters.slice(0, 5).map((c: any) => c.name).join(', ')}.`);
    if (d.gender) facts.push(`Gender on profile: ${d.gender}.`);
    return {
      handle: d.username,
      displayName: d.username,
      profileUrl: d.url,
      avatarUrl: d.images?.webp?.image_url || d.images?.jpg?.image_url || avatarFor(`mal-${handle}`),
      location: d.location || undefined,
      joined: isoDate(d.joined),
      stats: cleanStats([
        { label: 'Days watched', value: fmt(a.days_watched) },
        { label: 'Mean score', value: a.mean_score },
        { label: 'Completed', value: a.completed },
        { label: 'Dropped', value: a.dropped },
        { label: 'Episodes', value: compact(a.episodes_watched) },
        { label: 'Manga read', value: m.completed },
      ]),
      lists: [
        { title: 'Favorite anime', items: (fav.anime || []).slice(0, 6).map((x: any) => ({ name: x.title, meta: x.type ? `${x.type} · ${x.start_year ?? ''}` : undefined, url: x.url })) },
        { title: 'Favorite manga', items: (fav.manga || []).slice(0, 4).map((x: any) => ({ name: x.title, url: x.url })) },
      ],
      facts,
    };
  },
};

// ---------------- AniList ----------------
const ANILIST_QUERY = `query ($name: String) {
  User(name: $name) {
    name about siteUrl createdAt avatar { large }
    statistics {
      anime { count episodesWatched minutesWatched meanScore genres(limit: 6, sort: COUNT_DESC) { genre count } }
      manga { count chaptersRead meanScore }
    }
    favourites {
      anime(perPage: 6) { nodes { title { userPreferred } } }
      characters(perPage: 5) { nodes { name { full } } }
    }
  }
}`;

const anilist: ConnectorDef = {
  id: 'anilist',
  name: 'AniList',
  category: 'culture',
  inputLabel: 'AniList username',
  placeholder: 'Josh',
  example: 'Josh',
  pulls: 'Anime & manga stats, top genres, favorites',
  color: '#02a9ff',
  async fetch(handle) {
    let r: any;
    try {
      r = await postJson<any>('https://graphql.anilist.co', { query: ANILIST_QUERY, variables: { name: handle } }, `AniList user "${handle}"`);
    } catch (e) {
      if (e instanceof HttpError && e.status === 502 && /\(400\)/.test(e.message)) throw notFound(`AniList user "${handle}"`);
      throw e;
    }
    const u = r?.data?.User;
    if (!u) throw notFound(`AniList user "${handle}"`);
    const a = u.statistics?.anime || {};
    const m = u.statistics?.manga || {};
    const genres: any[] = a.genres || [];
    const facts: string[] = [];
    if (genres.length) facts.push(`Top genres: ${genres.map((g) => `${g.genre} (${g.count})`).join(', ')}.`);
    const chars = u.favourites?.characters?.nodes || [];
    if (chars.length) facts.push(`Favorite characters: ${chars.map((c: any) => c.name.full).join(', ')}.`);
    return {
      handle: u.name,
      displayName: u.name,
      profileUrl: u.siteUrl,
      avatarUrl: u.avatar?.large,
      bio: u.about ? clip(stripHtml(u.about), 400) : undefined,
      joined: isoFromUnix(u.createdAt),
      stats: cleanStats([
        { label: 'Anime', value: a.count },
        { label: 'Days watched', value: a.minutesWatched ? fmt(a.minutesWatched / 1440) : undefined },
        { label: 'Mean score', value: a.meanScore },
        { label: 'Episodes', value: compact(a.episodesWatched) },
        { label: 'Manga', value: m.count },
        { label: 'Chapters', value: compact(m.chaptersRead) },
      ]),
      lists: [
        { title: 'Favorite anime', items: (u.favourites?.anime?.nodes || []).map((n: any) => ({ name: n.title.userPreferred })) },
        { title: 'Top genres', items: genres.map((g) => ({ name: g.genre, meta: `${g.count} titles` })) },
      ],
      facts,
    };
  },
};

// ---------------- Last.fm ----------------
const lastfm: ConnectorDef = {
  id: 'lastfm',
  name: 'Last.fm',
  category: 'culture',
  inputLabel: 'Last.fm username',
  placeholder: 'rj',
  example: 'rj',
  pulls: 'Scrobbles, all-time top artists, this month\'s top tracks, now playing',
  color: '#d51007',
  requiresEnv: 'LASTFM_API_KEY',
  async fetch(handle) {
    const key = process.env.LASTFM_API_KEY;
    if (!key) throw new HttpError(503, 'Last.fm needs LASTFM_API_KEY on the server.');
    const call = (method: string, extra = '') =>
      `https://ws.audioscrobbler.com/2.0/?method=${method}&user=${encodeURIComponent(handle)}&api_key=${key}&format=json${extra}`;
    const info = await getJson<any>(call('user.getinfo'), `Last.fm user "${handle}"`);
    if (info.error) throw info.error === 6 ? notFound(`Last.fm user "${handle}"`) : new HttpError(502, info.message || 'Last.fm error');
    const u = info.user;
    const [artists, tracks, recent] = await Promise.all([
      tryJson<any>(call('user.gettopartists', '&period=overall&limit=10')),
      tryJson<any>(call('user.gettoptracks', '&period=1month&limit=8')),
      tryJson<any>(call('user.getrecenttracks', '&limit=8')),
    ]);
    const top: any[] = artists?.topartists?.artist || [];
    const recentTracks: any[] = recent?.recenttracks?.track || [];
    const now = recentTracks.find((t) => t['@attr']?.nowplaying === 'true');
    const facts: string[] = [];
    const scrobbles = Number(u.playcount) || 0;
    if (top[0]) facts.push(`${top[0].name} alone accounts for ${((Number(top[0].playcount) / Math.max(1, scrobbles)) * 100).toFixed(1)}% of all scrobbles.`);
    if (now) facts.push(`Listening right now: "${now.name}" by ${now.artist?.['#text']}.`);
    if (recentTracks.length) facts.push(`Recent plays: ${recentTracks.slice(0, 6).map((t) => `${t.name} by ${t.artist?.['#text']}`).join('; ')}.`);
    const img = (u.image || []).find((i: any) => i.size === 'extralarge')?.['#text'];
    return {
      handle: u.name,
      displayName: u.realname || u.name,
      profileUrl: u.url,
      avatarUrl: img || avatarFor(`lfm-${handle}`),
      location: u.country && u.country !== 'None' ? u.country : undefined,
      joined: isoFromUnix(u.registered?.unixtime ?? u.registered?.['#text']),
      stats: cleanStats([
        { label: 'Scrobbles', value: compact(scrobbles) },
        { label: 'Artists', value: compact(u.artist_count) },
        { label: 'Tracks', value: compact(u.track_count) },
        { label: 'Albums', value: compact(u.album_count) },
        { label: '#1 artist', value: top[0]?.name },
      ]),
      lists: [
        { title: 'All-time artists', items: top.slice(0, 8).map((a) => ({ name: a.name, meta: `${compact(a.playcount)} plays`, url: a.url })) },
        { title: 'Top tracks this month', items: (tracks?.toptracks?.track || []).map((t: any) => ({ name: `${t.name} — ${t.artist?.name}`, meta: `${t.playcount} plays`, url: t.url })) },
      ],
      facts,
    };
  },
};

// ---------------- Discogs ----------------
const discogs: ConnectorDef = {
  id: 'discogs',
  name: 'Discogs',
  category: 'culture',
  inputLabel: 'Discogs username',
  placeholder: 'rodneyfool',
  example: 'rodneyfool',
  pulls: 'Record collection size, wantlist, genres, latest additions',
  color: '#f5f5f5',
  async fetch(handle) {
    const h = encodeURIComponent(handle);
    const u = await getJson<any>(`https://api.discogs.com/users/${h}`, `Discogs user "${handle}"`);
    const coll = await tryJson<any>(`https://api.discogs.com/users/${h}/collection/folders/0/releases?per_page=50&sort=added&sort_order=desc`);
    const releases: any[] = (coll?.releases || []).map((r: any) => r.basic_information);
    const genres = new Map<string, number>();
    for (const r of releases) for (const g of [...(r.genres || []), ...(r.styles || [])]) genres.set(g, (genres.get(g) || 0) + 1);
    const topGenres = [...genres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const facts: string[] = [];
    if (u.num_wantlist > u.num_collection) facts.push(`Wants more records (${u.num_wantlist}) than they own (${u.num_collection}).`);
    if (topGenres.length) facts.push(`Collection leans: ${topGenres.map(([g]) => g).join(', ')}.`);
    if (u.profile) facts.push(`Profile text: "${clip(u.profile, 250)}"`);
    return {
      handle: u.username,
      displayName: u.name || u.username,
      profileUrl: u.uri,
      avatarUrl: u.avatar_url || avatarFor(`dg-${handle}`),
      location: u.location || undefined,
      joined: isoDate(u.registered),
      stats: cleanStats([
        { label: 'Collection', value: compact(u.num_collection) },
        { label: 'Wantlist', value: compact(u.num_wantlist) },
        { label: 'Lists', value: u.num_lists },
        { label: 'Seller rating', value: u.rating_avg ? `${u.rating_avg}/5` : undefined },
        { label: 'Contributed', value: u.releases_contributed },
      ]),
      lists: [{ title: 'Latest additions', items: releases.slice(0, 8).map((r) => ({ name: `${r.artists?.map((a: any) => a.name).join(', ')} — ${r.title}`, meta: [r.year || null, ...(r.formats || []).map((f: any) => f.name)].filter(Boolean).join(' · ') })) }],
      facts,
    };
  },
};

// ---------------- Open Library ----------------
const openlibrary: ConnectorDef = {
  id: 'openlibrary',
  name: 'Open Library',
  category: 'culture',
  inputLabel: 'Open Library username',
  placeholder: 'mekBot',
  example: 'mekBot',
  pulls: 'Public reading log: read, reading now, want to read',
  color: '#e1dcc5',
  async fetch(handle) {
    const h = encodeURIComponent(handle);
    const shelf = (name: string) => tryJson<any>(`https://openlibrary.org/people/${h}/books/${name}.json`);
    const [read, now, want] = await Promise.all([shelf('already-read'), shelf('currently-reading'), shelf('want-to-read')]);
    if (!read && !now && !want) throw notFound(`Open Library reading log for "${handle}"`);
    const entries = (s: any) => (s?.reading_log_entries || []).map((e: any) => e.work).filter(Boolean);
    const count = (s: any) => s?.numFound ?? entries(s).length;
    const readList = entries(read);
    const authors = new Map<string, number>();
    for (const w of readList) for (const a of w.author_names || []) authors.set(a, (authors.get(a) || 0) + 1);
    const facts: string[] = [];
    if (count(want) > count(read)) facts.push(`Wants to read ${count(want)} books but has finished ${count(read)}.`);
    if (entries(now).length) facts.push(`Currently reading: ${entries(now).slice(0, 4).map((w: any) => w.title).join(', ')}.`);
    if (authors.size) facts.push(`Most-read authors: ${[...authors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([a]) => a).join(', ')}.`);
    return {
      handle,
      displayName: handle,
      profileUrl: `https://openlibrary.org/people/${h}`,
      avatarUrl: avatarFor(`ol-${handle}`),
      stats: cleanStats([
        { label: 'Read', value: count(read) },
        { label: 'Reading', value: count(now) },
        { label: 'Want to read', value: count(want) },
      ]),
      lists: [
        { title: 'Recently read', items: readList.slice(0, 8).map((w: any) => ({ name: w.title, meta: [w.author_names?.[0], w.first_publish_year].filter(Boolean).join(' · '), url: w.key ? `https://openlibrary.org${w.key}` : undefined })) },
        { title: 'Want to read', items: entries(want).slice(0, 5).map((w: any) => ({ name: w.title, meta: w.author_names?.[0] })) },
      ],
      facts,
    };
  },
};

export const cultureConnectors = [letterboxd, myanimelist, anilist, lastfm, discogs, openlibrary];
