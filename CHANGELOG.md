# Changelog

## Unreleased

- Exported roast cards now carry a small footer with the site and repository links. Share text and tweets link to the live site.
- Added an MIT license, a Dockerfile, a one-click Vercel deploy button and a social preview image.

## 3.0.0 — 2026-10-27

Full rewrite.

- 34 connectors, each using an official public API or a public feed: GitHub, GitLab, Codeberg, Stack Overflow, npm, crates.io, Hugging Face, Docker Hub, LeetCode, Codeforces, AtCoder, Codewars, Monkeytype, Hacker News, Lobsters, DEV, Hashnode, Medium, Bluesky, Mastodon, Reddit, Wikipedia, Letterboxd, MyAnimeList, AniList, Last.fm, Discogs, Open Library, Steam, Chess.com, Lichess, Duolingo, speedrun.com and Pokémon Showdown.
- Removed LinkedIn scraping and Spotify, which had no usable public API. A paste-text box covers them.
- Roast, battle and screenshot modes; 6 personas and 3 heat levels.
- Gemini roasts with a model fallback chain, and an offline roaster when no key is set.
- New UI: platform picker, multi-profile plate, shareable roast card, recent history.
- The API runs as a Vercel function, so the deployed site works without a separate server.
