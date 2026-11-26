# Changelog

## Unreleased

- Groq as a text-only fallback after Gemini (`GROQ_API_KEY`, model `llama-3.1-8b-instant` unless `GROQ_MODEL` is set). Order: Gemini, Groq, Ollama, local roaster.
- Gemini now uses `gemini-3.5-flash-lite` by default (`GEMINI_MODEL` overrides it) and is the only engine that reads screenshots.

- Roasts never fail because of the AI. Any Gemini failure (missing or rejected key, overload, timeout, bad output) falls through to Ollama when `OLLAMA_URL` is set, then to a new built-in local roaster.
- The local roaster writes in every persona and heat level, for single roasts, multi-profile roasts, battles and pasted text. It replaces the old template roasts.
- Screenshot roasts work without a vision model: the browser reads the text with on-device OCR and the text is roasted.
- Roast cards and battles show which engine wrote them.

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
