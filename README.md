# 🔥 COOKED — AI Profile Roaster & Footprint Auditor

> **Get roasted based on your real digital footprint.** Powered by Google Gemini AI.

**COOKED** inspects your live public profiles across 15+ developer, coding, professional, and gaming platforms, extracts verified footprint receipts, and generates savage, highly specific AI roasts with audio narration, interactive battle modes, and exportable social posters.

---

## 🌟 Key Features

### 1. 🌐 Live Verified Profile Inspection (15+ Platforms)
Fetch real-time public stats, top projects, problem-solving ranks, and activity receipts:
- **GitHub**: Repositories, stars, top languages, commit activity.
- **LinkedIn**: Custom professional profile builder, headline, location, summary, and skills verification.
- **LeetCode**: Solved problem breakdown (Easy, Medium, Hard), global ranking, and acceptance rate.
- **Codeforces**: Rating, rank, max rating, contribution, and contest history.
- **GitLab**: Open-source repositories, activity, and star count.
- **Dev.to**: Published articles, reaction counts, and follower footprint.
- **npm Maintainer**: Published npm packages, package downloads, and version stats.
- **Chess.com**: Rapid, Blitz, and Bullet ratings, GM titles, and win/loss ratios.
- **HackerNews**: Karma score, submission counts, and user bio.
- **Duolingo**: Day streak, course progress, and total XP.
- **MyAnimeList**: Days watched, mean score, completed anime, and dropped list.
- **Letterboxd**: Film log count, recent movie reviews, and rating distribution.
- **Steam**: Hours played over the past 2 weeks, top games, and achievements.
- **Spotify**: Top artists, listened tracks, and genre preferences.
- **Resume / Image OCR**: Upload any profile screenshot, resume PDF, or design portfolio for instant AI extraction.

---

### 2. 🎭 Roast Personalities & Custom Intensity
Tailor the roast style to your liking:
- **Sarcastic Tech Lead**: Passive-aggressive code reviewer vibes.
- **Unfiltered Stand-up Comedian**: No-holds-barred roasts.
- **Corporate HR Manager**: Passive-aggressive corporate speak with PIP memos.
- **Gamer / Anime Elitist**: Toxic lobby energy.

---

### 3. 🔊 Voice Narrator (Gemini Speech TTS)
Listen to your roast spoken aloud with selectable voice actors:
- **Kore**: Dramatic & theatrical.
- **Puck**: High-energy Stand-up.
- **Zephyr**: Deadpan cynic.
- **Fenrir**: Deep voice of doom.

---

### 4. 🎨 Custom Social Media Poster Studio
Export viral social graphics for Instagram Stories, X (Twitter), TikTok, or Discord:
- **Aspect Ratios**: 9:16 Story (1080x1920), 1:1 Feed (1080x1080), 16:9 Banner (1200x630), and Longcard Infographic.
- **Visual Themes**: Cyber Fire, Scandal News Tabloid, Retro VHS, Toxic Poison, Synthwave, and Obsidian Monolith.
- **Zero Cutoff Export Engine**: Automatically calculates exact scroll dimensions so no paragraphs or receipts get cropped.
- **Resolution Quality**: Ultra HD (2x) and Super 4K (3x) crisp PNG exports.
- **Native Mobile Share**: Direct file sharing via system share dialog (`navigator.share`).

---

### 5. ⚔️ Multiplayer Roast Battles & Wall of Shame
- **1v1 Profile Battles**: Compare two profiles side-by-side to see who gets cooked harder.
- **Wall of Shame**: Post your worst roasts to the global public leaderboard.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Canvas Confetti.
- **Backend / Express**: Node.js, Express, `html-to-image`, `@google/genai` (Google Gemini API SDK).
- **AI Models**: Google Gemini 2.5 Flash / Gemini Pro for roast generation and TTS voice synthesis.

---

## 🚀 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file or export your Gemini API key:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🛰️ API Routes Overview

- `GET /api/platform/github?username=...` — Fetches real GitHub user profile & repo footprint.
- `GET /api/platform/linkedin?username=...` — Extracts LinkedIn profile metadata & headline data.
- `GET /api/platform/leetcode?username=...` — Fetches LeetCode solved metrics & rank.
- `GET /api/platform/codeforces?username=...` — Fetches Codeforces ratings & rank.
- `GET /api/platform/*` — Endpoints for Dev.to, npm, Chess.com, HackerNews, Duolingo, MyAnimeList, Letterboxd, and Steam.
- `POST /api/roast/generate` — Generates structured roast JSON using Google Gemini API.
- `POST /api/roast/tts` — Synthesizes audio narration using Gemini TTS.
- `POST /api/ocr` — Extracts text and stats from uploaded resume or profile screenshot images.

---

## 📄 License

MIT License. Designed with 🔥 for developers and tech enthusiasts.
