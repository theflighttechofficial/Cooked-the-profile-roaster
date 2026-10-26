# cooked. — get roasted by your own data

Type a username. Cooked pulls your real public stats from one of **34 platforms**, then an AI roasts you with them.

- **Roast**: stack up to 4 profiles from different platforms for one cross-platform roast. You can also paste text the APIs can't reach, like a LinkedIn "about" section or a resume.
- **Battle**: two profiles fight over three rounds, and the AI picks who is less cooked.
- **Screenshot**: upload any screenshot (Spotify Wrapped, a bio, Screen Time) and Gemini reads it.
- 6 roaster personas × 3 heat levels. You can save the result as a PNG, copy it, share it, or have your browser read it out loud.
- With no AI key, an offline roaster still writes roasts from your real numbers.

## Connectors

Each connector uses an official public API or a public feed. None needs a login, and none scrapes pages that sit behind a login.

| Category | Platform | Source |
|---|---|---|
| Code | GitHub | REST API v3 (`GITHUB_TOKEN` optional) |
| | GitLab | REST API v4 |
| | Codeberg | Forgejo API v1 |
| | Stack Overflow | Stack Exchange API 2.3 |
| | npm | Registry search + downloads API |
| | crates.io | crates.io API v1 |
| | Hugging Face | Hub API |
| | Docker Hub | Hub API v2 |
| Compete | LeetCode | Public GraphQL |
| | Codeforces | Official API |
| | AtCoder | Contest history JSON + kenkoooo API |
| | Codewars | API v1 |
| | Monkeytype | Public profile API |
| Social | Hacker News | Firebase API + Algolia search |
| | Lobsters | User JSON |
| | DEV | Forem API |
| | Hashnode | GraphQL API |
| | Medium | RSS feed |
| | Bluesky | AppView XRPC (public) |
| | Mastodon | Any instance, REST API |
| | Reddit | OAuth API (`REDDIT_CLIENT_ID/SECRET` recommended) |
| | Wikipedia | MediaWiki Action API |
| Taste | Letterboxd | RSS feed |
| | MyAnimeList | Jikan API v4 |
| | AniList | GraphQL API |
| | Last.fm | API 2.0 (**`LASTFM_API_KEY` required**) |
| | Discogs | API v2 |
| | Open Library | Reading log JSON |
| Games | Steam | Community XML (`STEAM_API_KEY` optional, adds the full library) |
| | Chess.com | Published-data API |
| | Lichess | API |
| | Duolingo | Unofficial public endpoint |
| | speedrun.com | REST API v1 |
| | Pokémon Showdown | User JSON |

Every connector returns the same shape (`Profile` in `shared/types.ts`): stats, lists and plain-text "facts". The roaster gets only those facts and is told not to invent any.

The input box accepts handles, `@handles` and full profile URLs. Mastodon takes `user@instance` and checks that the host is a public address before any request goes out. Stack Overflow takes a user ID, a profile URL or a display name.

### Check that the connectors work

```bash
npm run check:connectors              # every connector, against a real example account
npm run check:connectors github steam # only some
```

## Run it

```bash
npm install
cp .env.example .env   # add GEMINI_API_KEY at least
npm run dev            # http://localhost:3000
```

Production:

```bash
npm run build   # client into dist/, server into dist/server.js
npm start
```

Other scripts: `npm run lint` (type check), `npm test` (handle parsing tests).

## Layout

```
server/
  index.ts            Express routes + Vite middleware in dev
  http.ts             fetch with timeout/retry, XML and text helpers
  roast.ts            Gemini prompts, schemas, model fallback, offline roaster
  connectors/         one file per category, registry in index.ts
shared/types.ts       types used by the server and the client
src/                  React 19 + Tailwind 4 client
scripts/              connector health check
```

## API

- `GET /api/connectors`: the platform list, and whether AI is on
- `GET /api/profile/:platform?handle=`: one normalized profile (cached for 10 minutes)
- `POST /api/roast` `{ profiles: [{platform, handle}], persona, heat, extra }`
- `POST /api/battle` `{ profiles: [a, b], persona, heat }`
- `POST /api/roast/image` `{ image: dataURL, persona, heat, note }`

The roast endpoints fetch every profile again on the server, so a client cannot send made-up stats to the AI.
