import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const getGenAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// In-Memory Wall of Shame cache
interface SavedRoast {
  id: string;
  platform: string;
  username: string;
  avatarUrl?: string;
  headline: string;
  cookedScore: number;
  roastTitle: string;
  mainRoastParagraphs: string[];
  redFlags: string[];
  psychologicalDiagnosis: string;
  statsRadar: {
    pretentiousness: number;
    cringeIndex: number;
    touchGrassNeeded: number;
    sleepDeprivation: number;
    socialSkills: number;
  };
  quoteToShare: string;
  badgeAwarded: string;
  createdAt: number;
  upvotes: number;
}

// Fallback roast generator for 503 upstream high-demand spikes
function generateSmartFallbackRoast(platform: string, username: string, profileData: any): any {
  const user = username || 'Friend';
  const plt = (platform || 'custom').toLowerCase();

  if (plt === 'github') {
    const realName = profileData?.name ? `${profileData.name} (@${user})` : `@${user}`;
    const locationStr = profileData?.location ? ` based out of ${profileData.location.trim()}` : '';
    const repos = profileData?.publicRepos !== undefined ? profileData.publicRepos : (profileData?.recentRepos?.length || 0);
    const languages = profileData?.topLanguages?.length ? profileData.topLanguages.join(', ') : 'TypeScript, Python, JavaScript';
    const sampleRepo = profileData?.recentRepos?.[0]?.name || 'RigForge';
    const secondRepo = profileData?.recentRepos?.[1]?.name || 'DocuMind-Hybrid-RAG-based-Doc-analyzer';
    const thirdRepo = profileData?.recentRepos?.[2]?.name || 'ResumeForge-AI';
    const bioText = profileData?.bio ? `Your bio loudly states: "${profileData.bio}".` : `You have ${repos} public repositories.`;

    return {
      headline: `${realName}${locationStr} has built ${repos} repositories including "${sampleRepo}" and "${secondRepo}", yet has ${profileData?.followers ?? 1} follower.`,
      cookedScore: 94,
      roastTitle: "The Hyperactive RAG & Repo Hoarder",
      mainRoastParagraphs: [
        `${bioText} You're${locationStr} pushing code in ${languages}, jumping between next-gen hardware tools like "${sampleRepo}" and complex AI architectures like "${secondRepo}" and "${thirdRepo}". You launch ambitious repos with massive scope, then pivot to another idea 48 hours later.`,
        `Your public repo counter is sitting at ${repos} projects, but your follower-to-repo ratio is practically a ghost town. You build automated ATS resume checkers and document analyzers, yet nobody is opening issues or reviewing your pull requests.`,
        `You have accumulated more unstarred repositories than a university department's sandbox. Your commit streaks peak at 2:30 AM with commit messages like 'fix bug' and 'update config', fueling a caffeine-powered fantasy of Silicon Valley productivity.`
      ],
      redFlags: [
        `Has ${repos} public repos with 0 total stars, still lists 'Open to collabs 🚀'`,
        `Built both "${sampleRepo}" and "${secondRepo}" without a single automated test`,
        `Commits directly to main at 3:30 AM${locationStr}`
      ],
      psychologicalDiagnosis: "Severe project genesis addiction with terminal deployment evasion syndrome.",
      statsRadar: {
        pretentiousness: 92,
        cringeIndex: 82,
        touchGrassNeeded: 98,
        sleepDeprivation: 96,
        socialSkills: 25
      },
      quoteToShare: `I have ${repos} repos on GitHub and exactly 0 users. It's called stealth mode.`,
      badgeAwarded: "Certified Unstarred Repo Architect",
      corporatePip: {
        employeeName: profileData?.name || user,
        jobTitle: "Chief Side-Project Abandonment Officer",
        performanceRating: "Unsatisfactory (Too Many Repos, Zero Deployments)",
        keyDeficiencies: [
          `Created ${repos} repositories while maintaining exactly zero production users`,
          `Commits at 3 AM while completely avoiding automated integration testing`,
          `Spends more time writing colorful README titles like "${sampleRepo}" than finishing code`
        ],
        mandatoryActionItems: [
          "Deploy at least one active repository to real users within 14 calendar days",
          "Touch actual outdoor grass for a minimum of 45 consecutive minutes",
          "Stop creating new AI pipeline repositories until the current backlog is documented"
        ],
        terminationRisk: "Critical (89% probability of starting another repo before Friday)"
      }
    };
  }

  if (plt === 'leetcode') {
    const solved = profileData?.allSolved || 0;
    const ranking = profileData?.ranking || 'Unranked';
    return {
      headline: `${user} has ground out ${solved} LeetCode problems, yet still stumbles on basic string manipulation in live interviews.`,
      cookedScore: 95,
      roastTitle: "The Dynamic Programming Masochist",
      mainRoastParagraphs: [
        `You have solved ${solved} algorithmic problems (including ${profileData?.mediumSolved || 0} Mediums and ${profileData?.hardSolved || 0} Hards). You have memorized Dijkstra and inverted binary trees in your sleep, but cannot explain how an HTTP request works without sweating.`,
        `Your global rank is ${ranking}. You treat NeetCode 150 like holy scripture and believe that Big-O notation is a substitute for conversational charisma.`,
        `If you spent half the hours you dedicated to monotonic stacks on personal hygiene or social skills, you would already be a senior engineering executive.`
      ],
      redFlags: [
        `Spends 4 hours optimizing a solution from O(N) to O(log N) for 0 users`,
        "Answers casual dinner questions with dynamic programming state transitions",
        "Has an active daily submission streak while dodging eye contact with humans"
      ],
      psychologicalDiagnosis: "Chronic interview PTSD manifesting as algorithmic hoarding.",
      statsRadar: {
        pretentiousness: 95,
        cringeIndex: 88,
        touchGrassNeeded: 99,
        sleepDeprivation: 97,
        socialSkills: 12
      },
      quoteToShare: "My relationship status is O(1) space complexity — completely empty.",
      badgeAwarded: "Senior Inverted Binary Tree Wrangler"
    };
  }

  if (plt === 'codeforces') {
    const rating = profileData?.rating || 1200;
    const rank = profileData?.rank || 'Pupil';
    return {
      headline: `Competes on Codeforces as a '${rank}' with a ${rating} rating, submitting hacks at 4 AM to gain 6 rating points.`,
      cookedScore: 96,
      roastTitle: "The Corner-Case Over-Optimizer",
      mainRoastParagraphs: [
        `You stress-test edge cases with fast I/O templates written in C++ while failing to handle basic real-world human edge cases like answering text messages.`,
        `Your peak rating is ${profileData?.maxRating || rating} (${profileData?.maxRank || rank}). You stay up until 3:30 AM for Div. 2 rounds only to plummet 45 rating points on problem B.`,
        `You can find the shortest path on a weighted DAG in 12 lines of code, but cannot navigate a conversation with a stranger at a coffee shop.`
      ],
      redFlags: [
        `Ratings fluctuate wildly like crypto every contest round`,
        "Uses fast I/O cin.tie(NULL) in code that never leaves their hard drive",
        "Cries over Time Limit Exceeded on testcase 87"
      ],
      psychologicalDiagnosis: "Competitive adrenaline addiction on a virtual terminal grid.",
      statsRadar: {
        pretentiousness: 96,
        cringeIndex: 89,
        touchGrassNeeded: 100,
        sleepDeprivation: 98,
        socialSkills: 8
      },
      quoteToShare: "I didn't fail the contest, testcase 43 had an unfair memory limit.",
      badgeAwarded: "Grandmaster of Time Limit Exceeded"
    };
  }

  if (plt === 'devto') {
    const articles = profileData?.articlesCount || 0;
    const name = profileData?.name || user;
    return {
      headline: `${name} has published ${articles} Dev.to articles titled 'Why Everyone is Sleeping on X' with zero citations.`,
      cookedScore: 90,
      roastTitle: "The Medium/Dev Thought-Leader Impersonator",
      mainRoastParagraphs: [
        `Your Dev.to profile summary claims: "${profileData?.summary || 'Writing tech insights'}". You write 8-minute deep dives explaining how to center a div using CSS Grid as if you invented the World Wide Web.`,
        `You use three different stock illustrations of neon servers and brain vectors per post, ending every single article with 'What do you think? Let me know in the comments below!' to zero responses.`,
        `You spend more time designing cover banners in Canva than actually writing the code you're tutorializing.`
      ],
      redFlags: [
        "Uses 'The Ultimate Guide to Modern Web Dev in 2026' in article titles",
        "Reads own published articles 14 times to boost view metrics",
        "Signs tech blog posts with inspirational Steve Jobs quotes"
      ],
      psychologicalDiagnosis: "Severe thought-leadership syndrome without verified credentials.",
      statsRadar: {
        pretentiousness: 94,
        cringeIndex: 91,
        touchGrassNeeded: 89,
        sleepDeprivation: 84,
        socialSkills: 40
      },
      quoteToShare: "I don't just write code, I synthesize digital paradigm shifts on Dev.to.",
      badgeAwarded: "Chief Synergy Evangelist"
    };
  }

  if (plt === 'npm') {
    const pkgs = profileData?.totalPackages || 0;
    return {
      headline: `Maintains ${pkgs} npm packages consisting of 3-line utility functions wrapped in 400KB of metadata.`,
      cookedScore: 92,
      roastTitle: "The Left-Pad Reincarnation Specialist",
      mainRoastParagraphs: [
        `You have published ${pkgs} packages to the npm registry. Half of them are variations of is-even or string-trim-safe with 14 peer dependencies.`,
        `Your package.json scripts have more linting and pre-commit hooks than the Apollo 11 guidance system, yet your packages have an average of 4 weekly downloads (3 of which are your own automated CI builds).`,
        `You treat semantic versioning like a philosophical debate, publishing breaking major releases to rename a single helper variable.`
      ],
      redFlags: [
        `Has ${pkgs} published packages, 0 funding backers`,
        "Pushes patch release v1.0.42 titled 'fix typo in README'",
        "Package download chart is a flatline interrupted only by localhost runs"
      ],
      psychologicalDiagnosis: "Compulsive dependency-publishing disorder.",
      statsRadar: {
        pretentiousness: 91,
        cringeIndex: 86,
        touchGrassNeeded: 95,
        sleepDeprivation: 92,
        socialSkills: 20
      },
      quoteToShare: "Why write 2 lines of code when you can import my 500KB npm package?",
      badgeAwarded: "Senior Dependency Bloat Creator"
    };
  }

  if (plt === 'linkedin') {
    const name = profileData?.name || user;
    const headline = profileData?.headline || 'Aspiring Thought Leader & Innovation Catalyst';
    const loc = profileData?.location ? ` in ${profileData.location}` : '';
    return {
      headline: `${name}${loc} lists '${headline}', yet hasn't posted an original thought since 2023.`,
      cookedScore: 95,
      roastTitle: "The Chief Synergy & Buzzword Monetizer",
      mainRoastParagraphs: [
        `Your LinkedIn headline proudly proclaims: "${headline}". You write posts starting with 'I am humbled and thrilled to announce...' after completing a 2-hour online certificate.`,
        `You have 500+ connections but haven't spoken to 498 of them. Your feed interactions consist entirely of commenting 'Agree! 👏' and 'Insightful share!' on corporate layoffs and AI hype posts to appease the algorithm.`,
        `Your profile claims you're 'spearheading cross-functional value realization', which is a 5-syllable corporate euphemism for sitting in 6 hours of mute Zoom meetings while browsing Twitter.`
      ],
      redFlags: [
        `Lists 47 buzzword skills like 'Synergy' and 'Paradigm Acceleration'`,
        "Starts posts with a 1-line inspirational hook and 12 line breaks",
        "Reacts 'Celebrate 🎉' to strangers' promotion announcements"
      ],
      psychologicalDiagnosis: "Terminal corporate mimicry with pathological networking anxiety.",
      statsRadar: {
        pretentiousness: 98,
        cringeIndex: 96,
        touchGrassNeeded: 92,
        sleepDeprivation: 88,
        socialSkills: 55
      },
      quoteToShare: "I don't just work jobs, I curate high-impact synergies on LinkedIn.",
      badgeAwarded: "Senior Corporate Buzzword Alchemist",
      corporatePip: {
        employeeName: name,
        jobTitle: headline,
        performanceRating: "Needs Improvement (Excessive Networking, Zero Deliverables)",
        keyDeficiencies: [
          "Spends 4 hours a day liking corporate influencers instead of completing assigned tasks",
          "Uses the word 'synergize' 14 times per standup meeting",
          "Added 'Ex-FAANG Intern Candidate' to professional summary"
        ],
        mandatoryActionItems: [
          "Delete at least 3 LinkedIn thought-leadership draft posts",
          "Talk to a real human being without asking for an informational coffee chat",
          "Stop endorsing random colleagues for 'Strategic Vision' skills"
        ],
        terminationRisk: "High (Pending Review by People & Culture)"
      }
    };
  }

  if (plt === 'spotify') {
    const topArtist = profileData?.topArtists?.[0] || 'Radiohead';
    const topGenre = profileData?.topGenres?.[0] || 'Sad Indie Folk';
    return {
      headline: `Listening to ${topArtist} on loop as an unprescribed substitute for emotional regulation.`,
      cookedScore: 92,
      roastTitle: "Therapy Avoidance Specialist",
      mainRoastParagraphs: [
        `Your top artist is ${topArtist} and your favorite genre is ${topGenre}. Your Spotify history reads like an auditory suicide note written in microtonal acoustic guitar.`,
        `If a song has a tempo faster than 65 BPM, your nervous system interprets it as a physical assault. You treat Spotify Wrapped as your annual cry for help.`,
        `You have at least three different playlists named after ungodly hours of the night like '4am staring at the ceiling' or 'crying in the shower'.`
      ],
      redFlags: [
        `Listens to ${topArtist} at 2:15 AM on a Tuesday`,
        "Acousticness score exceeds 95% while dopamine is at 0%",
        "Refuses to pass the aux cord due to fear of social ostracization"
      ],
      psychologicalDiagnosis: "Severe romanticization of melancholy with auditory isolation tendencies.",
      statsRadar: {
        pretentiousness: 89,
        cringeIndex: 79,
        touchGrassNeeded: 91,
        sleepDeprivation: 96,
        socialSkills: 32
      },
      quoteToShare: "My Spotify account is $10.99/mo, which is cheaper than confronting my feelings.",
      badgeAwarded: "Certified Crying in Public Pro"
    };
  }

  if (plt === 'steam') {
    return {
      headline: `${user} has thousands of hours logged in ranked matchmaking and zero grass touched this decade.`,
      cookedScore: 98,
      roastTitle: "Toxic Salt Mine Operations Director",
      mainRoastParagraphs: [
        `You have accumulated more game hours on Steam than a commercial airline pilot has flight hours, yet your competitive rank is still sitting in the sewer tier.`,
        `Your profile comments section is a United Nations summit of furious teammates begging you to uninstall the game and seek immediate medical evaluation.`,
        `You bought 42 games during the Summer Sale and have played exactly zero of them because you keep launching the same rage-inducing moba every single evening.`
      ],
      redFlags: [
        "4,000+ hours in one game, still blames teammates for every loss",
        "Wears a gaming headset during dinner with family",
        "Has broken at least two mechanical keyboards over a ranked match"
      ],
      psychologicalDiagnosis: "Terminal competitive rage displacement syndrome.",
      statsRadar: {
        pretentiousness: 65,
        cringeIndex: 97,
        touchGrassNeeded: 100,
        sleepDeprivation: 94,
        socialSkills: 12
      },
      quoteToShare: "GG WP report my entire team, zero ganks at two minutes.",
      badgeAwarded: "Permaban Enthusiast"
    };
  }

  if (plt === 'chess') {
    const rating = profileData?.rapidRating || profileData?.blitzRating || 750;
    return {
      headline: `Plays chess with a ${rating} rating and blunders the queen on move six with full confidence.`,
      cookedScore: 89,
      roastTitle: "The Unintentional Queen Sacrificer",
      mainRoastParagraphs: [
        `You watch Grandmaster YouTube recaps and talk about 'positional weaknesses', then hang your rook in a one-move blunder five seconds after the opening.`,
        `You memorize 14 moves of the Sicilian Defense only to get checkmated by Scholar's Mate in rapid games because you refuse to look at your opponent's pieces.`,
        `Your puzzle rating is double your game rating because when nobody is playing back at you, you almost look competent.`
      ],
      redFlags: [
        "Claims opponent was using an engine after losing a 500 ELO match",
        "Plays bullet chess until 4 AM to recover 15 lost rating points",
        "Has a 90% blunder rate when playing with white pieces"
      ],
      psychologicalDiagnosis: "Severe Dunning-Kruger cognitive bias on a 64-square grid.",
      statsRadar: {
        pretentiousness: 93,
        cringeIndex: 84,
        touchGrassNeeded: 88,
        sleepDeprivation: 92,
        socialSkills: 28
      },
      quoteToShare: "I didn't blunder my queen, it was a profound psychological sacrifice.",
      badgeAwarded: "Grandmaster of Hanging Pieces"
    };
  }

  // General fallback for all other platforms / custom
  return {
    headline: `${user}'s digital footprint is a case study in high-intensity internet poisoning.`,
    cookedScore: 91,
    roastTitle: "The Chronic Screen-Time Architect",
    mainRoastParagraphs: [
      `We ran your profile through our analytical roaster and the neural network temporarily overheated from the sheer concentration of red flags detected.`,
      `Your digital habits suggest a human being who has completely replaced sunlight, hydration, and face-to-face interaction with endless dopamine refreshes and online debates.`,
      `If your daily screen time was converted into physical labor, you could have built the Great Pyramids, yet you used it to curate this exact profile.`
    ],
    redFlags: [
      "Average daily screen time exceeds the length of a standard work shift",
      "Treats internet arguments as high-stakes philosophical debates",
      "Has not touched fresh unpaved grass in over three fiscal quarters"
    ],
    psychologicalDiagnosis: "Acute digital fatigue syndrome with terminal online presence.",
    statsRadar: {
      pretentiousness: 85,
      cringeIndex: 90,
      touchGrassNeeded: 98,
      sleepDeprivation: 91,
      socialSkills: 25
    },
    quoteToShare: "I'm not addicted to the screen, the real world just has terrible graphics.",
    badgeAwarded: "Certified Grass Avoider"
  };
}

// Resilient Gemini Generate Content with Model Cascade & Exponential Backoff
async function generateRoastWithCascade(ai: GoogleGenAI, contents: any, schema: any): Promise<any> {
  // Candidate models to cascade through in case of 503 high demand spikes
  const candidateModels = [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    // Try each model with up to 2 attempts
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        const jsonText = response.text?.trim() || '{}';
        const parsed = JSON.parse(jsonText);
        if (parsed.headline && parsed.cookedScore) {
          return parsed;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err.message || '');
        const is503OrUnavailable =
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('resource exhausted') ||
          msg.includes('429');

        if (is503OrUnavailable) {
          console.warn(`Model ${model} attempt ${attempt} hit high demand (503/429). Retrying...`);
          // Wait briefly before retry
          await new Promise((res) => setTimeout(res, attempt * 600));
        } else {
          // If it's another non-transient error, break immediately to try next model
          break;
        }
      }
    }
  }

  // If all models failed due to upstream 503 or transient outage, rethrow last error
  throw lastError || new Error('All models temporarily unavailable due to high demand.');
}

const wallOfShameRoasts: SavedRoast[] = [
  {
    id: 'roast-seed-1',
    platform: 'github',
    username: 'rust_fanatic_99',
    avatarUrl: 'https://avatars.githubusercontent.com/u/10248234?v=4',
    headline: 'Has 47 uncompiled side-projects in Rust and zero human interactions this quarter.',
    cookedScore: 96,
    roastTitle: 'The Unfinished Borrow Checker',
    mainRoastParagraphs: [
      "You have rewritten your dotfiles in Neovim Lua 14 times this month, yet your main repository is a todo app with 0 tests and 147 open dependabot alerts.",
      "Your commit history shows 3 AM code sprees titled 'fix typo' followed by 3 weeks of radio silence. Your GitHub graph looks like an sparse barcode."
    ],
    redFlags: [
      "47 starred repos on memory safety, 0 memory of fresh air",
      "Readme is 500 lines long, codebase is 12 lines",
      "Pushes directly to main at 4:12 AM"
    ],
    psychologicalDiagnosis: "Severe perfectionist paralysis coupled with terminal terminal-fetishism.",
    statsRadar: {
      pretentiousness: 98,
      cringeIndex: 85,
      touchGrassNeeded: 99,
      sleepDeprivation: 94,
      socialSkills: 15,
    },
    quoteToShare: "I don't need a relationship, the Rust compiler tells me everything I'm doing wrong.",
    badgeAwarded: "Senior Cargo Cultist",
    createdAt: Date.now() - 3600000 * 5,
    upvotes: 142,
  },
  {
    id: 'roast-seed-2',
    platform: 'spotify',
    username: 'sad_indie_girl_x',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=sad_indie',
    headline: 'Listening to Radiohead and Phoebe Bridgers on loop since 2021.',
    cookedScore: 91,
    roastTitle: 'Therapy Avoidance Specialist',
    mainRoastParagraphs: [
      "Your top genre is 'Sad Girl Indie' followed by 'Microtonal Shoegaze'. You treat Spotify Wrapped like an emotional cry for help.",
      "Your acousticness score is 99% and your energy score is lower than a drained AA battery. If a song has a tempo faster than 70 BPM, you claim it gives you anxiety."
    ],
    redFlags: [
      "Listens to Motion Sickness at 2 AM on a Tuesday",
      "9,000 minutes of rain soundscapes in August",
      "Has a playlist titled 'staring at the ceiling at 4am'"
    ],
    psychologicalDiagnosis: "Romanticizing melancholia as a replacement for adequate REM sleep.",
    statsRadar: {
      pretentiousness: 92,
      cringeIndex: 78,
      touchGrassNeeded: 89,
      sleepDeprivation: 95,
      socialSkills: 35,
    },
    quoteToShare: "My Spotify account costs $10.99/mo but my therapist costs $150. Easy math.",
    badgeAwarded: "Certified Crying In Public Pro",
    createdAt: Date.now() - 3600000 * 12,
    upvotes: 98,
  },
  {
    id: 'roast-seed-3',
    platform: 'steam',
    username: 'GamerGod_Dota2',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=dota_salt',
    headline: '4,200 hours in Dota 2, herald rank, 12 muted chat bans.',
    cookedScore: 99,
    roastTitle: 'Toxic Salt Mine Operations Director',
    mainRoastParagraphs: [
      "You have dedicated over 175 entire calendar days of your mortal lifespan to a moba game, only to blame your team's support player every single match.",
      "Your Steam profile has 14 pages of comments from random strangers begging you to uninstall the game."
    ],
    redFlags: [
      "4,200 hours played, still misses basic last hits",
      "Sells items in rage after 5 minutes",
      "Keyboard spacebar replaced 3 times this year"
    ],
    psychologicalDiagnosis: "Chronic anger management deficit masked as competitive passion.",
    statsRadar: {
      pretentiousness: 60,
      cringeIndex: 96,
      touchGrassNeeded: 100,
      sleepDeprivation: 91,
      socialSkills: 8,
    },
    quoteToShare: "GG WP report mid zero ganks at 2 minutes.",
    badgeAwarded: "Permaban Enthusiast",
    createdAt: Date.now() - 3600000 * 24,
    upvotes: 215,
  }
];

// ---------- Shared data-retrieval layer ----------
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const APP_UA = 'Cooked-Profile-Roaster/2.0';

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// fetch with timeout, default UA, and retry on network error / 429 / 5xx
async function fetchWithRetry(url: string, init: any = {}, opts: { timeoutMs?: number; retries?: number } = {}): Promise<Response> {
  const { timeoutMs = 7000, retries = 2 } = opts;
  let last: any = null;
  for (let i = 0; i <= retries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, {
        ...init,
        headers: { 'User-Agent': APP_UA, ...(init.headers || {}) },
        signal: ctrl.signal,
      });
      if ((r.status === 429 || r.status >= 500) && i < retries) {
        last = new HttpError(r.status, `Upstream returned ${r.status}`);
        await sleep(400 * (i + 1));
        continue;
      }
      return r;
    } catch (e: any) {
      last = e?.name === 'AbortError' ? new HttpError(504, 'Upstream request timed out') : e;
      if (i < retries) await sleep(400 * (i + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw last || new Error('Upstream request failed');
}

// Parse JSON, throw typed errors for 404 / rate limits / other failures
async function getJson(url: string, notFoundMsg: string, init: any = {}, opts: { timeoutMs?: number; retries?: number } = {}): Promise<any> {
  const r = await fetchWithRetry(url, init, opts);
  if (r.status === 404) throw new HttpError(404, notFoundMsg);
  if (r.status === 403 || r.status === 429) throw new HttpError(429, 'Upstream rate limit or access block hit. Try again in a minute.');
  if (!r.ok) throw new HttpError(502, `Upstream returned ${r.status}`);
  return r.json();
}

const stripHtml = (s: any) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const dicebear = (seed: string) => `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;

// 5-minute response cache for GET /api/platform/* (skips LinkedIn: user-supplied fields)
const PLATFORM_CACHE_TTL = 5 * 60 * 1000;
const platformCache = new Map<string, { at: number; data: any }>();
app.use('/api/platform/:id', (req, res, next) => {
  if (req.method !== 'GET' || req.params.id === 'linkedin') return next();
  const key = req.originalUrl.toLowerCase();
  const hit = platformCache.get(key);
  if (hit && Date.now() - hit.at < PLATFORM_CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(hit.data);
  }
  const orig = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode === 200 && body && !body.error) {
      if (platformCache.size >= 500) platformCache.delete(platformCache.keys().next().value as string);
      platformCache.set(key, { at: Date.now(), data: body });
    }
    return orig(body);
  };
  next();
});

// Register a platform loader: handles sanitizing, validation and uniform error mapping
function registerPlatform(id: string, label: string, loader: (handle: string) => Promise<any>) {
  app.get(`/api/platform/${id}`, async (req, res) => {
    const handle = sanitizeProfileHandle(String(req.query.username || ''));
    if (!handle) return res.status(400).json({ error: `${label} username is required` });
    try {
      return res.json(await loader(handle));
    } catch (err: any) {
      const status = err instanceof HttpError ? err.status : 502;
      const msg = err instanceof HttpError ? err.message : `Could not reach ${label} right now. Try again shortly.`;
      return res.status(status).json({ error: msg });
    }
  });
}

// Sanitize usernames from URLs, @ handles, or messy paste inputs
function sanitizeProfileHandle(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';

  if (/^https?:\/\//i.test(s) || /^[\w-]+(\.[\w-]+)+\/\S*/i.test(s)) {
    try {
      const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
      const idParam = u.searchParams.get('id');
      if (idParam) return idParam.trim();
      const skip = new Set(['u', 'user', 'users', 'profile', 'profiles', 'id', 'in', 'member', 'members', 'player', 'ratings', 'people', 'accounts', '@']);
      const segs = u.pathname.split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
      const seg = segs.find((x) => !skip.has(x.toLowerCase()));
      if (!seg) return '';
      // Mastodon-style https://instance/@user -> user@instance
      if (seg.startsWith('@') && seg.length > 1) return `${seg.slice(1)}@${u.hostname}`;
      return seg.replace(/^~/, '').trim();
    } catch {
      /* fall through to plain handling */
    }
  }

  return s.replace(/^@+/, '').split(/[/?#\s]/)[0].trim();
}

const githubHeaders = () => ({
  'User-Agent': APP_UA,
  Accept: 'application/vnd.github+json',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
});

// 1. Fetch GitHub Profile
app.get('/api/platform/github', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'GitHub username is required' });
  }

  try {
    const userRes = await fetchWithRetry(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: githubHeaders()
    });

    if (!userRes.ok) {
      if (userRes.status === 403 || userRes.status === 429) {
        return res.status(429).json({ error: 'GitHub API rate limit hit. Set GITHUB_TOKEN in .env or retry later.' });
      }
      if (userRes.status === 404) {
        return res.status(404).json({ error: `GitHub user "${username}" not found. Please check spelling.` });
      }
      throw new Error(`GitHub API returned ${userRes.status}: ${userRes.statusText}`);
    }

    const userData = await userRes.json();

    // Fetch real repos
    const reposRes = await fetchWithRetry(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=12`, {
      headers: githubHeaders()
    });
    const reposData = reposRes.ok ? await reposRes.json() : [];

    const languages = new Set<string>();
    let totalStars = 0;

    const formattedRepos = Array.isArray(reposData) ? reposData.map((r: any) => {
      if (r.language) languages.add(r.language);
      totalStars += r.stargazers_count || 0;
      return {
        name: r.name,
        description: r.description || 'No description provided.',
        stars: r.stargazers_count || 0,
        forks: r.forks_count || 0,
        language: r.language || 'Code',
        updatedAt: r.updated_at,
        isFork: r.fork,
        url: r.html_url,
      };
    }) : [];

    return res.json({
      platform: 'github',
      username: userData.login,
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      bio: userData.bio || 'No bio written yet.',
      location: userData.location || 'Unknown Location',
      blog: userData.blog || '',
      publicRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      createdAt: userData.created_at,
      totalStars,
      topLanguages: Array.from(languages),
      recentRepos: formattedRepos,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch GitHub profile.' });
  }
});

// 2. Fetch Chess.com Profile
app.get('/api/platform/chess', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'Chess.com username is required' });
  }

  try {
    const profileRes = await fetchWithRetry(`https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}`, {
      headers: { 'User-Agent': 'Cooked-Profile-Roaster' }
    });

    if (!profileRes.ok) {
      if (profileRes.status === 404) {
        return res.status(404).json({ error: `Chess.com player "${username}" not found.` });
      }
      throw new Error('Failed to fetch Chess.com player profile');
    }

    const profileData = await profileRes.json();

    const statsRes = await fetchWithRetry(`https://api.chess.com/pub/player/${encodeURIComponent(username.toLowerCase())}/stats`, {
      headers: { 'User-Agent': 'Cooked-Profile-Roaster' }
    });
    const statsData = statsRes.ok ? await statsRes.json() : {};

    return res.json({
      platform: 'chess',
      username: profileData.username,
      avatarUrl: profileData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profileData.username}`,
      title: profileData.title || 'None',
      joined: profileData.joined ? new Date(profileData.joined * 1000).toISOString() : 'Unknown',
      status: profileData.status,
      rapidRating: statsData.chess_rapid?.last?.rating || 'Unrated',
      rapidRecord: statsData.chess_rapid?.record || { win: 0, loss: 0, draw: 0 },
      blitzRating: statsData.chess_blitz?.last?.rating || 'Unrated',
      blitzRecord: statsData.chess_blitz?.record || { win: 0, loss: 0, draw: 0 },
      bulletRating: statsData.chess_bullet?.last?.rating || 'Unrated',
      tacticsRating: statsData.tactics?.highest?.rating || 'N/A',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch Chess.com profile.' });
  }
});

// 3. Fetch MyAnimeList Profile (Jikan API, falls back to the public profile page)
async function scrapeMalProfile(username: string) {
  const r = await fetchWithRetry(`https://myanimelist.net/profile/${encodeURIComponent(username)}`, {
    headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' },
  }, { timeoutMs: 10000, retries: 1 });
  if (r.status === 404) throw new HttpError(404, `MyAnimeList user "${username}" not found.`);
  if (!r.ok) throw new HttpError(502, `MyAnimeList returned ${r.status}`);
  const html = await r.text();
  const start = html.indexOf('stats anime');
  if (start < 0) throw new HttpError(404, `MyAnimeList user "${username}" not found.`);
  const sec = html.slice(start, start + 4000);
  const num = (re: RegExp) => Number((sec.match(re)?.[1] || '0').replace(/,/g, '')) || 0;
  const status = (cls: string) => num(new RegExp(`anime ${cls}">[^<]*</a><span[^>]*>([\\d,]+)<`));
  const stat = (label: string) => num(new RegExp(`${label}</span><span[^>]*>([\\d,]+)<`));
  const realName = html.match(/<span class="h1-title">\s*<span[^>]*>([^<]+)<\/span>/)?.[1]?.replace(/'s Profile$/, '').trim();
  const avatar = html.match(/<div class="user-image[^"]*">\s*<img[^>]+data-src="([^"]+)"/)?.[1];
  const joined = html.match(/Joined<\/span><span[^>]*>([^<]+)</)?.[1] || '';
  return {
    platform: 'mal',
    username: realName || username,
    avatarUrl: avatar || dicebear(`${username}_mal`),
    joined,
    daysWatched: num(/Days: <\/span>([\d.,]+)/),
    meanScore: num(/Mean Score: <\/span>\s*<span[^>]*>([\d.]+)/),
    watching: status('watching'),
    completed: status('completed'),
    onHold: status('on_hold'),
    dropped: status('dropped'),
    planToWatch: status('plan_to_watch'),
    totalEntries: stat('Total Entries'),
    rewatched: stat('Rewatched'),
    episodesWatched: stat('Episodes'),
    favoriteAnime: [],
  };
}

registerPlatform('mal', 'MyAnimeList', async (username) => {
  let json: any = null;
  try {
    json = await getJson(`https://api.jikan.moe/v4/users/${encodeURIComponent(username)}/full`, `MyAnimeList user "${username}" not found.`, {}, { timeoutMs: 8000, retries: 0 });
  } catch (e: any) {
    // Jikan is often down or rate-limited; the profile page has the same headline stats
    return scrapeMalProfile(username);
  }
  const data = json.data;
  if (!data) return scrapeMalProfile(username);
  const stats = data.statistics?.anime || {};
  const favorites = (data.favorites?.anime || []).slice(0, 5).map((a: any) => a.title);
  return {
    platform: 'mal',
    username: data.username,
    avatarUrl: data.images?.jpg?.image_url || dicebear(`${data.username}_mal`),
    joined: data.joined || '',
    daysWatched: stats.days_watched ?? 0,
    meanScore: stats.mean_score ?? 0,
    watching: stats.watching ?? 0,
    completed: stats.completed ?? 0,
    onHold: stats.on_hold ?? 0,
    dropped: stats.dropped ?? 0,
    planToWatch: stats.plan_to_watch ?? 0,
    totalEntries: stats.total_entries ?? 0,
    rewatched: stats.rewatched ?? 0,
    episodesWatched: stats.episodes_watched ?? 0,
    favoriteAnime: favorites,
  };
});

// 4. Fetch Letterboxd Profile (RSS Feed)
app.get('/api/platform/letterboxd', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'Letterboxd username is required' });
  }

  try {
    const rssRes = await fetchWithRetry(`https://letterboxd.com/${encodeURIComponent(username)}/rss/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (!rssRes.ok) {
      if (rssRes.status === 404) {
        return res.status(404).json({ error: `Letterboxd profile "${username}" not found.` });
      }
      throw new Error('Could not fetch Letterboxd RSS');
    }

    const xmlText = await rssRes.text();

    // Basic regex extraction for items in RSS XML
    const itemsMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || [];
    const movies = itemsMatches.slice(0, 10).map((item) => {
      const titleMatch = item.match(/<title>(.*?)<\/title>/);
      const ratingMatch = item.match(/<letterboxd:memberRating>(.*?)<\/letterboxd:memberRating>/);
      const filmTitleMatch = item.match(/<letterboxd:filmTitle>(.*?)<\/letterboxd:filmTitle>/);
      const filmYearMatch = item.match(/<letterboxd:filmYear>(.*?)<\/letterboxd:filmYear>/);

      return {
        title: filmTitleMatch ? filmTitleMatch[1] : (titleMatch ? titleMatch[1] : 'Unknown Film'),
        year: filmYearMatch ? filmYearMatch[1] : '',
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : 'No Rating',
      };
    });

    return res.json({
      platform: 'letterboxd',
      username,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}_film`,
      recentLogsCount: itemsMatches.length,
      recentMovies: movies,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch Letterboxd profile.' });
  }
});

// 5. Fetch Steam Profile
app.get('/api/platform/steam', async (req, res) => {
  const rawInput = String(req.query.username || req.query.vanityOrId || '').trim();
  const input = sanitizeProfileHandle(rawInput);
  if (!input) {
    return res.status(400).json({ error: 'Steam ID or vanity URL name is required' });
  }

  try {
    // Attempt xml fetch
    let steamUrl = `https://steamcommunity.com/id/${encodeURIComponent(input)}/?xml=1`;
    if (/^\d{17}$/.test(input)) {
      steamUrl = `https://steamcommunity.com/profiles/${input}/?xml=1`;
    }

    const xmlRes = await fetchWithRetry(steamUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (xmlRes.ok) {
      const xmlText = await xmlRes.text();
      const steamIDMatch = xmlText.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/) || xmlText.match(/<steamID>(.*?)<\/steamID>/);
      const avatarMatch = xmlText.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/) || xmlText.match(/<avatarFull>(.*?)<\/avatarFull>/);
      const summaryMatch = xmlText.match(/<summary><!\[CDATA\[(.*?)\]\]><\/summary>/) || xmlText.match(/<summary>(.*?)<\/summary>/);
      const hoursMatch = xmlText.match(/<hoursPlayed2Wks>(.*?)<\/hoursPlayed2Wks>/);

      // Games extraction
      const gameMatches = xmlText.match(/<game>[\s\S]*?<\/game>/g) || [];
      const games = gameMatches.slice(0, 8).map(g => {
        const name = g.match(/<name><!\[CDATA\[(.*?)\]\]><\/name>/) || g.match(/<name>(.*?)<\/name>/);
        const hours = g.match(/<hoursOnRecord>(.*?)<\/hoursOnRecord>/);
        return {
          name: name ? name[1] : 'Game',
          hoursOnRecord: hours ? hours[1] : '0',
        };
      });

      if (steamIDMatch) {
        return res.json({
          platform: 'steam',
          username: steamIDMatch[1],
          avatarUrl: avatarMatch ? avatarMatch[1] : `https://api.dicebear.com/7.x/bottts/svg?seed=${input}`,
          summary: summaryMatch ? summaryMatch[1].replace(/<[^>]*>?/gm, '') : 'No bio',
          hoursPastTwoWeeks: hoursMatch ? hoursMatch[1] : '0',
          recentGames: games,
        });
      }
    }

    return res.status(404).json({ error: `Steam profile "${input}" not found or private. Use your custom URL name or 17-digit SteamID64 with a public profile.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch Steam profile.' });
  }
});

// 6. Fetch LeetCode Profile (Official GraphQL)
app.get('/api/platform/leetcode', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'LeetCode username is required' });
  }

  try {
    const graphqlQuery = {
      query: `query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
          profile {
            ranking
            reputation
            aboutMe
          }
        }
      }`,
      variables: { username }
    };

    const lcRes = await fetchWithRetry('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify(graphqlQuery),
    });

    const json = await lcRes.json();
    const matchedUser = json?.data?.matchedUser;

    if (!matchedUser) {
      return res.status(404).json({ error: `LeetCode user "${username}" not found.` });
    }

    const submissions = matchedUser.submitStats?.acSubmissionNum || [];
    const allSolved = submissions.find((s: any) => s.difficulty === 'All')?.count || 0;
    const easySolved = submissions.find((s: any) => s.difficulty === 'Easy')?.count || 0;
    const mediumSolved = submissions.find((s: any) => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = submissions.find((s: any) => s.difficulty === 'Hard')?.count || 0;

    return res.json({
      platform: 'leetcode',
      username: matchedUser.username,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${matchedUser.username}_lc`,
      allSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      ranking: matchedUser.profile?.ranking || 'Unranked',
      aboutMe: matchedUser.profile?.aboutMe || 'Grinding LeetCode daily for FAANG.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch LeetCode profile.' });
  }
});

// 7. Fetch Duolingo Profile
app.get('/api/platform/duolingo', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'Duolingo username is required' });
  }

  try {
    const duoRes = await fetchWithRetry(`https://www.duolingo.com/2017-06-30/users?username=${encodeURIComponent(username)}`, {
      headers: { 'User-Agent': 'Cooked-Profile-Roaster' }
    });

    if (!duoRes.ok) {
      return res.status(404).json({ error: `Duolingo user "${username}" not found.` });
    }

    const data = await duoRes.json();
    const user = data.users?.[0];

    if (!user) {
      return res.status(404).json({ error: `Duolingo user "${username}" not found.` });
    }

    const courses = (user.courses || []).map((c: any) => ({
      language: c.title,
      xp: c.xp,
      crowns: c.crowns,
    }));

    return res.json({
      platform: 'duolingo',
      username: user.username,
      avatarUrl: user.picture ? `https:${user.picture}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}_duo`,
      streak: user.streak || 0,
      totalXp: user.totalXp || 0,
      courses,
      bio: user.bio || 'Studying languages to avoid actual conversations.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch Duolingo profile.' });
  }
});

// 8. Fetch HackerNews Profile
app.get('/api/platform/hackernews', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'HackerNews username is required' });
  }

  try {
    const hnRes = await fetchWithRetry(`https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(username)}.json`);
    if (!hnRes.ok) {
      return res.status(404).json({ error: `HackerNews user "${username}" not found.` });
    }

    const user = await hnRes.json();
    if (!user) {
      return res.status(404).json({ error: `HackerNews user "${username}" not found.` });
    }

    return res.json({
      platform: 'hackernews',
      username: user.id,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}_hn`,
      karma: user.karma || 0,
      about: user.about ? user.about.replace(/<[^>]*>?/gm, '') : 'No bio.',
      submittedCount: user.submitted ? user.submitted.length : 0,
      created: user.created ? new Date(user.created * 1000).toISOString() : '',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch HackerNews profile.' });
  }
});

// 9. Fetch Codeforces Profile
app.get('/api/platform/codeforces', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'Codeforces handle is required' });
  }

  try {
    const cfRes = await fetchWithRetry(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`);
    const data = await cfRes.json();
    if (data.status !== 'OK' || !data.result?.[0]) {
      return res.status(404).json({ error: `Codeforces user "${username}" not found.` });
    }

    const user = data.result[0];
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.handle;
    return res.json({
      platform: 'codeforces',
      username: user.handle,
      name: fullName,
      avatarUrl: user.titlePhoto?.startsWith('//') ? `https:${user.titlePhoto}` : (user.titlePhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.handle}_cf`),
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || 'unranked',
      maxRank: user.maxRank || 'unranked',
      contribution: user.contribution || 0,
      friendOfCount: user.friendOfCount || 0,
      city: user.city || '',
      country: user.country || '',
      organization: user.organization || '',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch Codeforces profile.' });
  }
});

// 10. Fetch GitLab Profile
app.get('/api/platform/gitlab', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'GitLab username is required' });
  }

  try {
    const glRes = await fetchWithRetry(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(username)}`);
    const users = glRes.ok ? await glRes.json() : [];
    
    if (Array.isArray(users) && users.length > 0) {
      const user = users[0];
      const projRes = await fetchWithRetry(`https://gitlab.com/api/v4/users/${user.id}/projects?per_page=10`);
      const projects = projRes.ok ? await projRes.json() : [];

      const formattedProjects = Array.isArray(projects) ? projects.map((p: any) => ({
        name: p.name,
        description: p.description || 'No description provided.',
        stars: p.star_count || 0,
        forks: p.forks_count || 0,
        webUrl: p.web_url,
      })) : [];

      return res.json({
        platform: 'gitlab',
        username: user.username,
        name: user.name || user.username,
        avatarUrl: user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}_gl`,
        bio: user.bio || 'GitLab Open Source Contributor',
        location: user.location || '',
        projectsCount: formattedProjects.length,
        recentProjects: formattedProjects,
      });
    }

    // Fallback: Check if it is a GitLab Group/Organization
    const groupRes = await fetchWithRetry(`https://gitlab.com/api/v4/groups/${encodeURIComponent(username)}`);
    if (groupRes.ok) {
      const group = await groupRes.json();
      const groupProjRes = await fetchWithRetry(`https://gitlab.com/api/v4/groups/${group.id}/projects?per_page=10`);
      const groupProjects = groupProjRes.ok ? await groupProjRes.json() : [];

      const formattedProjects = Array.isArray(groupProjects) ? groupProjects.map((p: any) => ({
        name: p.name,
        description: p.description || 'No description provided.',
        stars: p.star_count || 0,
        forks: p.forks_count || 0,
        webUrl: p.web_url,
      })) : [];

      return res.json({
        platform: 'gitlab',
        username: group.path || username,
        name: group.name || username,
        avatarUrl: group.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}_gl`,
        bio: group.description || 'GitLab Group / Organization',
        location: '',
        projectsCount: formattedProjects.length,
        recentProjects: formattedProjects,
      });
    }

    return res.status(404).json({ error: `GitLab user or group "${username}" not found.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch GitLab profile.' });
  }
});

// 11. Fetch Dev.to Profile
app.get('/api/platform/devto', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'Dev.to username is required' });
  }

  try {
    const userRes = await fetchWithRetry(`https://dev.to/api/users/by_username?url=${encodeURIComponent(username)}`);
    if (!userRes.ok) {
      return res.status(404).json({ error: `Dev.to user "${username}" not found.` });
    }

    const user = await userRes.json();
    const articlesRes = await fetchWithRetry(`https://dev.to/api/articles?username=${encodeURIComponent(username)}&per_page=8`);
    const articles = articlesRes.ok ? await articlesRes.json() : [];

    const formattedArticles = Array.isArray(articles) ? articles.map((a: any) => ({
      name: a.title,
      description: a.description || 'No article excerpt.',
      reactions: a.public_reactions_count || 0,
      comments: a.comments_count || 0,
      badge: `${a.reading_time_minutes || 1}m read`,
      url: a.url,
    })) : [];

    return res.json({
      platform: 'devto',
      username: user.username,
      name: user.name || user.username,
      avatarUrl: user.profile_image || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}_devto`,
      summary: user.summary || 'Writing software articles on Dev.to',
      location: user.location || '',
      website: user.website_url || '',
      articlesCount: formattedArticles.length,
      recentArticles: formattedArticles,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch Dev.to profile.' });
  }
});

// 12. Fetch npm Maintainer Profile
app.get('/api/platform/npm', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'npm username is required' });
  }

  try {
    const npmRes = await fetchWithRetry(`https://registry.npmjs.org/-/v1/search?text=maintainer:${encodeURIComponent(username)}&size=10`);
    if (!npmRes.ok) {
      return res.status(404).json({ error: `npm maintainer "${username}" not found or registry unavailable.` });
    }

    const data = await npmRes.json();
    const totalPackages = data.total || 0;
    const packages = (data.objects || []).map((o: any) => ({
      name: o.package.name,
      version: o.package.version,
      description: o.package.description || 'No package description.',
      badge: `v${o.package.version}`,
      url: o.package.links?.npm || `https://www.npmjs.com/package/${o.package.name}`,
    }));

    return res.json({
      platform: 'npm',
      username,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}_npm`,
      totalPackages,
      recentPackages: packages,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch npm maintainer profile.' });
  }
});

// 13. Fetch LinkedIn Profile
// LinkedIn blocks direct requests (HTTP 429 authwall), so we try the public page first,
// then fall back to the DuckDuckGo search result for linkedin.com/in/<handle>.
type LinkedInLookup = { name?: string; headline?: string; about?: string; location?: string; experience?: string; education?: string; avatarUrl?: string; source: string } | null;

// Cache lookups (hits 12h, misses 10min) so repeat requests do not trip search-engine rate limits
const linkedinCache = new Map<string, { at: number; data: LinkedInLookup }>();
async function lookupLinkedIn(handle: string): Promise<LinkedInLookup> {
  const key = handle.toLowerCase();
  const hit = linkedinCache.get(key);
  if (hit && Date.now() - hit.at < (hit.data ? 12 * 3600_000 : 10 * 60_000)) return hit.data;
  const data = await lookupLinkedInUncached(handle);
  if (linkedinCache.size >= 500) linkedinCache.delete(linkedinCache.keys().next().value as string);
  linkedinCache.set(key, { at: Date.now(), data });
  return data;
}

async function lookupLinkedInUncached(handle: string): Promise<{ name?: string; headline?: string; about?: string; location?: string; experience?: string; education?: string; avatarUrl?: string; source: string } | null> {
  const decode = (t: string) => stripHtml(stripHtml(t)).replace(/&#x27;/g, "'").replace(/&#x2F;/g, '/').replace(/&nbsp;/g, ' ');

  // 1. Direct page Open Graph tags (works only when LinkedIn does not block this server)
  try {
    const r = await fetchWithRetry(`https://www.linkedin.com/in/${encodeURIComponent(handle)}/`, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' },
    }, { retries: 0, timeoutMs: 6000 });
    if (r.ok) {
      const html = await r.text();
      const meta = (prop: string) => html.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`, 'i'))?.[1];
      const title = meta('og:title');
      if (title) {
        const [name, ...rest] = decode(title).replace(/\s*[|-]\s*LinkedIn\s*$/i, '').split(' - ');
        return { name, headline: rest.join(' - '), about: decode(meta('og:description') || ''), avatarUrl: meta('og:image'), source: 'linkedin.com' };
      }
    }
  } catch { /* blocked, try search */ }

  // 2. Public search-engine result for the exact profile URL (Brave, Bing, then DuckDuckGo)
  const engines = [
    { name: 'Brave', url: (q: string) => `https://search.brave.com/search?q=${q}`, marker: 'data-type="web"' },
    { name: 'Bing', url: (q: string) => `https://www.bing.com/search?q=${q}&setlang=en&cc=US`, marker: 'class="b_algo"' },
    { name: 'DuckDuckGo', url: (q: string) => `https://html.duckduckgo.com/html/?q=${q}`, marker: 'class="result__body"' },
  ];
  const escapedHandle = handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const slugRe = new RegExp(`linkedin\\.com/in/${escapedHandle}(?![\\w%-])`, 'i');
  const toLines = (block: string) => block
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?(?:strong|b|em|span|wbr)[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((l) => decode(l).replace(/’/g, "'").trim())
    .filter(Boolean);

  const queries = [`"${handle}" site:linkedin.com/in`, `${handle} linkedin`];
  for (const engine of engines) for (const query of queries) {
    try {
      const r = await fetchWithRetry(engine.url(encodeURIComponent(query)), {
        headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' },
      }, { retries: 0, timeoutMs: 8000 });
      if (!r.ok) continue;
      const html = await r.text();
      for (const block of html.split(engine.marker).slice(1)) {
        const lines = toLines(block.slice(0, 6000));
        const flat = `${decodeURIComponent(block.slice(0, 6000).replace(/%(?![0-9a-f]{2})/gi, '%25'))}\n${lines.join('\n').replace(/\s*›\s*/g, '/')}`;
        if (!slugRe.test(flat)) continue;

        const titleLine = lines.find((l) => /\s[-|–]\s*LinkedIn$/i.test(l));
        if (!titleLine) continue;
        const title = titleLine.replace(/\s*[-|–]\s*LinkedIn$/i, '').replace(/\s*(\.\.\.|…)\s*$/, '');
        const [name, ...rest] = title.split(' - ');
        const snippetLine = lines
          .filter((l) => l !== titleLine && !/linkedin\.com|^LinkedIn$/i.test(l) && l.length >= 40)
          .sort((x, y) => y.length - x.length)[0] || '';
        let snippet = snippetLine.replace(/^\d+\s+\w+\s+ago\s*-\s*/i, '');
        const pick = (label: string) => snippet.match(new RegExp(`${label}:\\s*([^·]+)`, 'i'))?.[1]?.trim();
        const location = pick('Location');
        const experience = pick('Experience');
        const education = pick('Education');
        if (/professional community of/i.test(snippet)) snippet = '';
        return { name: name?.trim(), headline: rest.join(' - ').trim(), about: snippet, location, experience, education, source: `${engine.name} search index` };
      }
    } catch { /* try next engine */ }
  }
  return null;
}

app.get('/api/platform/linkedin', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const customHeadline = req.query.headline ? String(req.query.headline).trim() : '';
  const customName = req.query.name ? String(req.query.name).trim() : '';
  const customLocation = req.query.location ? String(req.query.location).trim() : '';
  const customAbout = req.query.about ? String(req.query.about).trim() : '';

  const cleanHandle = sanitizeProfileHandle(rawInput);
  if (!cleanHandle) {
    return res.status(400).json({ error: 'LinkedIn username or profile link is required' });
  }

  const found = await lookupLinkedIn(cleanHandle);
  const hasManual = !!(customHeadline || customName || customAbout);
  if (!found && !hasManual) {
    return res.status(404).json({
      error: `Could not read LinkedIn profile "${cleanHandle}" (LinkedIn blocks automated access and no public search result matched). Fill in the name/headline/about fields below and retry.`,
    });
  }

  const autoName = cleanHandle.replace(/-[0-9a-f]{6,}$/i, '').replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return res.json({
    platform: 'linkedin',
    username: cleanHandle,
    name: customName || found?.name || autoName,
    headline: customHeadline || found?.headline || '',
    location: customLocation || found?.location || '',
    about: customAbout || found?.about || '',
    experience: found?.experience || '',
    education: found?.education || '',
    avatarUrl: found?.avatarUrl || dicebear(`${cleanHandle}_linkedin`),
    skills: [],
    dataSource: found ? found.source : 'user-provided fields',
    note: 'Only fields present here are real. Do not invent employers, skills or location.',
    verifiedAt: new Date().toLocaleDateString(),
  });
});

// 14. Fetch Spotify Profile
app.get('/api/platform/spotify', async (req, res) => {
  const rawInput = String(req.query.username || '').trim();
  const username = sanitizeProfileHandle(rawInput);
  if (!username) {
    return res.status(400).json({ error: 'Spotify username or profile link is required' });
  }

  try {
    let name = username;
    let avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${username}_spotify`;
    let followers = 'unknown followers';

    // Try extracting Open Spotify meta tags
    try {
      const spRes = await fetchWithRetry(`https://open.spotify.com/user/${encodeURIComponent(username)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (spRes.ok) {
        const html = await spRes.text();
        const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        const ogDescMatch = html.match(/<meta property="og:description" content="([^"]+)"/i);

        if (ogTitleMatch && ogTitleMatch[1]) {
          name = ogTitleMatch[1].replace(' on Spotify', '').trim();
        }
        if (ogImageMatch && ogImageMatch[1]) {
          avatarUrl = ogImageMatch[1];
        }
        if (ogDescMatch && ogDescMatch[1]) {
          const desc = ogDescMatch[1];
          const followerMatch = desc.match(/([\d,]+)\s+followers/i);
          if (followerMatch) {
            followers = `${followerMatch[1]} followers`;
          }
        }
      }
    } catch {
      // Graceful fallback to rich structured metadata
    }

    return res.json({
      platform: 'spotify',
      username,
      name,
      avatarUrl,
      followers,
      topArtists: [],
      topGenres: [],
      recentTracks: [],
      publicPlaylists: [],
      note: 'Spotify exposes no public listening history. Only profile name, avatar and follower count are real; roast the account itself, not invented taste.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch Spotify profile.' });
  }
});

// ---------- Additional platforms ----------
registerPlatform('lichess', 'Lichess', async (u) => {
  const d = await getJson(`https://lichess.org/api/user/${encodeURIComponent(u)}`, `Lichess user "${u}" not found.`);
  const p = d.perfs || {};
  return {
    platform: 'lichess',
    username: d.username,
    avatarUrl: dicebear(`${d.username}_lichess`),
    bio: d.profile?.bio || '',
    location: d.profile?.location || d.profile?.country || '',
    name: d.profile?.realName || d.username,
    bulletRating: p.bullet?.rating ?? 'Unrated',
    blitzRating: p.blitz?.rating ?? 'Unrated',
    rapidRating: p.rapid?.rating ?? 'Unrated',
    classicalRating: p.classical?.rating ?? 'Unrated',
    puzzleRating: p.puzzle?.rating ?? 'N/A',
    totalGames: d.count?.all ?? 0,
    wins: d.count?.win ?? 0,
    losses: d.count?.loss ?? 0,
    draws: d.count?.draw ?? 0,
    hoursPlayed: d.playTime?.total ? Math.round(d.playTime.total / 3600) : 0,
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : '',
  };
});

registerPlatform('bluesky', 'Bluesky', async (u) => {
  const actor = u.includes('.') ? u : `${u}.bsky.social`;
  const base = 'https://public.api.bsky.app/xrpc';
  const p = await getJson(`${base}/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`, `Bluesky user "${actor}" not found.`);
  let posts: any[] = [];
  try {
    const feed = await getJson(`${base}/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(actor)}&limit=10&filter=posts_no_replies`, 'no feed');
    posts = (feed.feed || []).map((f: any) => ({
      name: String(f.post?.record?.text || '').slice(0, 140),
      detail: `${f.post?.likeCount ?? 0} likes, ${f.post?.repostCount ?? 0} reposts`,
    })).filter((x: any) => x.name);
  } catch { /* feed optional */ }
  return {
    platform: 'bluesky',
    username: p.handle,
    name: p.displayName || p.handle,
    avatarUrl: p.avatar || dicebear(`${p.handle}_bsky`),
    bio: p.description || '',
    followers: p.followersCount ?? 0,
    following: p.followsCount ?? 0,
    postsCount: p.postsCount ?? 0,
    createdAt: p.createdAt || '',
    recentPosts: posts,
  };
});

// Reddit blocks anonymous server traffic; with REDDIT_CLIENT_ID/SECRET we use app-only OAuth
let redditToken: { value: string; exp: number } | null = null;
async function getRedditToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (redditToken && Date.now() < redditToken.exp) return redditToken.value;
  const r = await fetchWithRetry('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  }, { retries: 1 });
  if (!r.ok) return null;
  const j: any = await r.json();
  if (!j.access_token) return null;
  redditToken = { value: j.access_token, exp: Date.now() + ((j.expires_in || 3600) - 60) * 1000 };
  return redditToken.value;
}

registerPlatform('reddit', 'Reddit', async (u) => {
  const token = await getRedditToken().catch(() => null);
  const hdr = token
    ? { headers: { 'User-Agent': `${APP_UA} (by /u/cooked_roaster)`, Authorization: `Bearer ${token}` } }
    : { headers: { 'User-Agent': BROWSER_UA } };
  const hosts = token ? ['oauth.reddit.com'] : ['www.reddit.com', 'old.reddit.com'];
  let host = hosts[0];
  let j: any = null;
  let lastErr: any = null;
  for (const h of hosts) {
    try {
      j = await getJson(`https://${h}/user/${encodeURIComponent(u)}/about.json`, `Reddit user "${u}" not found.`, hdr, { retries: 1 });
      host = h;
      break;
    } catch (e: any) {
      lastErr = e;
      if (e instanceof HttpError && e.status === 404) throw e;
    }
  }
  if (!j) throw new HttpError(429, 'Reddit blocks anonymous server requests. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env (free "script" app at reddit.com/prefs/apps), or use the Custom Text tab.');
  const d = j.data;
  if (!d || d.is_suspended) throw new HttpError(404, `Reddit user "${u}" not found or suspended.`);
  let comments: any[] = [];
  try {
    const c = await getJson(`https://${host}/user/${encodeURIComponent(u)}/comments.json?limit=8`, 'no comments', hdr, { retries: 0 });
    comments = (c.data?.children || []).map((x: any) => ({
      name: stripHtml(x.data?.body).slice(0, 160),
      detail: `r/${x.data?.subreddit} (${x.data?.score ?? 0} pts)`,
    })).filter((x: any) => x.name);
  } catch { /* comments optional */ }
  return {
    platform: 'reddit',
    username: d.name,
    avatarUrl: (d.icon_img || '').split('?')[0] || dicebear(`${d.name}_reddit`),
    bio: d.subreddit?.public_description || '',
    totalKarma: d.total_karma ?? 0,
    postKarma: d.link_karma ?? 0,
    commentKarma: d.comment_karma ?? 0,
    createdAt: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : '',
    recentComments: comments,
  };
});

registerPlatform('stackoverflow', 'Stack Overflow', async (u) => {
  const site = 'site=stackoverflow';
  const url = /^\d+$/.test(u)
    ? `https://api.stackexchange.com/2.3/users/${u}?${site}`
    : `https://api.stackexchange.com/2.3/users?inname=${encodeURIComponent(u)}&${site}&pagesize=1&order=desc&sort=reputation`;
  const j = await getJson(url, `Stack Overflow user "${u}" not found.`);
  const d = j.items?.[0];
  if (!d) throw new HttpError(404, `Stack Overflow user "${u}" not found.`);
  return {
    platform: 'stackoverflow',
    username: d.display_name,
    avatarUrl: d.profile_image || dicebear(`${d.display_name}_so`),
    location: d.location || '',
    reputation: d.reputation ?? 0,
    gold: d.badge_counts?.gold ?? 0,
    silver: d.badge_counts?.silver ?? 0,
    bronze: d.badge_counts?.bronze ?? 0,
    answers: d.answer_count ?? 0,
    questions: d.question_count ?? 0,
    acceptRate: d.accept_rate ?? null,
    createdAt: d.creation_date ? new Date(d.creation_date * 1000).toISOString() : '',
    website: d.link || '',
  };
});

registerPlatform('codewars', 'Codewars', async (u) => {
  const d = await getJson(`https://www.codewars.com/api/v1/users/${encodeURIComponent(u)}`, `Codewars user "${u}" not found.`);
  const langs = Object.entries(d.ranks?.languages || {}).map(([k, v]: any) => ({ name: k, detail: `${v.name} (${v.score} pts)` }));
  return {
    platform: 'codewars',
    username: d.username,
    name: d.name || d.username,
    avatarUrl: dicebear(`${d.username}_cw`),
    honor: d.honor ?? 0,
    clan: d.clan || 'None',
    overallRank: d.ranks?.overall?.name || 'unranked',
    leaderboardPosition: d.leaderboardPosition ?? 'Unranked',
    completedKata: d.codeChallenges?.totalCompleted ?? 0,
    authoredKata: d.codeChallenges?.totalAuthored ?? 0,
    skills: d.skills || [],
    languages: langs,
  };
});

registerPlatform('dockerhub', 'Docker Hub', async (u) => {
  const user = await getJson(`https://hub.docker.com/v2/users/${encodeURIComponent(u)}/`, `Docker Hub user "${u}" not found.`);
  let repos: any[] = [];
  let totalRepos = 0;
  try {
    const r = await getJson(`https://hub.docker.com/v2/repositories/${encodeURIComponent(u)}/?page_size=10&ordering=last_updated`, 'no repos');
    totalRepos = r.count ?? 0;
    repos = (r.results || []).map((x: any) => ({
      name: x.name,
      description: x.description || 'No description.',
      pulls: x.pull_count ?? 0,
      stars: x.star_count ?? 0,
      url: `https://hub.docker.com/r/${u}/${x.name}`,
    }));
  } catch { /* repos optional */ }
  return {
    platform: 'dockerhub',
    username: user.username,
    name: user.full_name || user.username,
    avatarUrl: user.gravatar_url || dicebear(`${user.username}_docker`),
    location: user.location || '',
    company: user.company || '',
    createdAt: user.date_joined || '',
    totalRepos,
    totalPulls: repos.reduce((n, r) => n + r.pulls, 0),
    recentRepos: repos,
  };
});

registerPlatform('mastodon', 'Mastodon', async (u) => {
  const [user, instance] = u.split('@');
  if (!user || !instance || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(instance)) {
    throw new HttpError(400, 'Mastodon handle must look like user@instance.social');
  }
  const a = await getJson(`https://${instance}/api/v1/accounts/lookup?acct=${encodeURIComponent(user)}`, `Mastodon account "${u}" not found.`);
  let toots: any[] = [];
  try {
    const s = await getJson(`https://${instance}/api/v1/accounts/${a.id}/statuses?limit=8&exclude_replies=true&exclude_reblogs=true`, 'none');
    toots = (s || []).map((t: any) => ({ name: stripHtml(t.content).slice(0, 160), detail: `${t.favourites_count ?? 0} favs, ${t.reblogs_count ?? 0} boosts` })).filter((x: any) => x.name);
  } catch { /* statuses optional */ }
  return {
    platform: 'mastodon',
    username: `${user}@${instance}`,
    name: a.display_name || a.username,
    avatarUrl: a.avatar || dicebear(`${u}_masto`),
    bio: stripHtml(a.note),
    followers: a.followers_count ?? 0,
    following: a.following_count ?? 0,
    postsCount: a.statuses_count ?? 0,
    createdAt: a.created_at || '',
    recentPosts: toots,
  };
});

// 9. Compatibility & Toxic Matchmaker AI Endpoint
app.post('/api/roast/compatibility', async (req, res) => {
  try {
    const { profile1, profile2, roastLevel = 'savage' } = req.body;
    if (!profile1 || !profile2) {
      return res.status(400).json({ error: 'Both profiles are required for compatibility comparison.' });
    }

    const promptText = `
You are the world's most brutally funny, savage AI Relationship & Compatibility Matchmaker app called "COOKED MATCHMAKER".
Compare these two digital profiles and evaluate their romantic or friendship compatibility based on their digital choices, listening habits, coding/gaming history, and personality red flags.

Profile 1:
${JSON.stringify(profile1, null, 2)}

Profile 2:
${JSON.stringify(profile2, null, 2)}

Roast Level: ${roastLevel.toUpperCase()}

Generate structured JSON matching the exact schema provided.
- compatibilityScore: integer 0-100 (how likely they are to get along, usually low and funny).
- toxicityRisk: integer 60-100 (how high the potential disaster level is).
- verdictTitle: A hilarious couple title (e.g. "Mutual Destruction Pact", "The 3 AM Insomnia Alliance").
- relationshipSummary: 2-3 paragraphs hilariously dissecting how their habits clash or fuel each other's toxic traits.
- irreconcilableDifferences: 3-4 bullet points detailing specific hilarious dealbreakers between their accounts.
- toxicWarningLabel: A punchy 1-sentence warning label (e.g. "Keep at least 500 feet apart or risk terminal philosophical debates").
`;

    const compatSchema = {
      type: Type.OBJECT,
      properties: {
        compatibilityScore: { type: Type.INTEGER },
        toxicityRisk: { type: Type.INTEGER },
        verdictTitle: { type: Type.STRING },
        relationshipSummary: { type: Type.STRING },
        irreconcilableDifferences: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        toxicWarningLabel: { type: Type.STRING },
      },
      required: [
        'compatibilityScore',
        'toxicityRisk',
        'verdictTitle',
        'relationshipSummary',
        'irreconcilableDifferences',
        'toxicWarningLabel',
      ],
    };

    try {
      const ai = getGenAIClient();
      const parsed = await generateRoastWithCascade(ai, promptText, compatSchema);
      return res.json({ success: true, result: parsed });
    } catch (e: any) {
      // Smart failover compatibility result
      return res.json({
        success: true,
        result: {
          compatibilityScore: 18,
          toxicityRisk: 94,
          verdictTitle: "Mutual Destruction Pact",
          relationshipSummary: `Putting ${profile1.username} and ${profile2.username} in the same room would violate several Geneva convention guidelines on cognitive safety. One of you is over-indexed on obsessing over minutiae while the other avoids human contact like it's a critical runtime error.`,
          irreconcilableDifferences: [
            "Irreconcilable sleep schedules (3 AM commit vs 4 AM doomscrolling)",
            "Fundamental dispute over whether to touch grass or optimize algorithms",
            "Incompatible aux cord privileges guaranteed to cause vehicular arguments"
          ],
          toxicWarningLabel: "WARNING: High probability of arguing over text message semantics for 6 hours."
        }
      });
    }
  } catch (err: any) {
    console.error('Compatibility error:', err);
    return res.status(500).json({ error: err.message || 'Compatibility check failed.' });
  }
});

// 6. Spotify OAuth URL and Endpoint handlers
app.get('/api/auth/spotify/url', (req, res) => {
  const client_id = process.env.SPOTIFY_CLIENT_ID || 'demo_spotify_client_id';
  const redirect_uri = process.env.APP_URL 
    ? `${process.env.APP_URL}/auth/callback` 
    : 'http://localhost:3000/auth/callback';

  const scope = 'user-top-read user-read-recently-played user-library-read playlist-read-private';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id,
    scope,
    redirect_uri,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  res.json({ url: authUrl, configured: !!process.env.SPOTIFY_CLIENT_ID });
});

// Callback route
app.get(['/auth/callback', '/auth/callback/'], (req, res) => {
  const safeCode = JSON.stringify(String(req.query.code || '')).replace(/</g, '\\u003c');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>OAuth Success</title>
        <style>
          body { font-family: sans-serif; background: #0d0e15; color: white; text-align: center; padding: 40px; }
        </style>
      </head>
      <body>
        <h2>Connected Successfully!</h2>
        <p>Closing window and returning to Cooked Profile Roaster...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', code: ${safeCode} }, window.location.origin);
            window.close();
          } else {
            window.location.href = '/';
          }
        </script>
      </body>
    </html>
  `);
});

// AI Roast Generation Endpoint
app.post('/api/roast/generate', async (req, res) => {
  try {
    const {
      platform,
      username,
      profileData,
      roastLevel = 'savage',
      personality = 'sarcastic_tech',
      customPrompt = ''
    } = req.body;

    if (!platform || !profileData) {
      return res.status(400).json({ error: 'Platform and profileData are required.' });
    }

    const ai = getGenAIClient();

    // Define tone and system instructions based on options
    let intensityGuide = '';
    switch (roastLevel) {
      case 'mild':
        intensityGuide = 'MILD SIZZLE: Keep it witty, playful, and lighthearted. Tease gently like a hilarious best friend.';
        break;
      case 'deep_fried':
        intensityGuide = 'DEEP FRIED: Ruthless psychological critique. Unpack their entire personality, question their priorities, and leave no mercy.';
        break;
      case 'nuclear':
        intensityGuide = 'NUCLEAR / EXTINCTION LEVEL: Maximum savage toxicity! Hilariously catastrophic roast that personally targets their digital soul and life choices.';
        break;
      case 'savage':
      default:
        intensityGuide = 'SAVAGE COOKED: Brutally funny, sharp, unfiltered reality check. Point out obvious red flags and funny ironies.';
        break;
    }

    let personaGuide = '';
    switch (personality) {
      case 'mean_girl':
        personaGuide = 'Persona: A high-school popular Mean Girl / TikTok Influencer ("Bestie, gross!", "Who hurt you?", "Ew").';
        break;
      case 'fbi_profiler':
        personaGuide = 'Persona: An Over-Analyzing FBI Behavioral Profiler issuing an official psychological assessment.';
        break;
      case 'disappointed_wizard':
        personaGuide = 'Persona: A 500-year-old Disappointed Wizard examining a foolish mortal\'s digital scroll.';
        break;
      case 'gordon_ramsay':
        personaGuide = 'Persona: Gordon Ramsay shouting at a terrible chef ("IT\'S RAW!", "DONKEY!", "AN ABSOLUTE SHAMBLES!").';
        break;
      case 'sarcastic_tech':
      default:
        personaGuide = 'Persona: A hyper-cynical, ultra-sarcastic Silicon Valley Senior Tech Bro AI.';
        break;
    }

    const promptText = `
You are the world's most brutally hilarious, savage AI profile roaster app called "COOKED".
Your goal is to inspect a user's third-party profile data (Platform: ${platform.toUpperCase()}, Username: ${username || 'Anonymous'}) and deliver a hyper-personalized, witty, jaw-droppingly funny roast.

CRITICAL ACCURACY REQUIREMENT:
You MUST anchor your roast on the USER'S ACTUAL REAL DATA provided in 'Profile Data to Roast':
- If GitHub: Mention their real name ("${profileData?.name || ''}"), real bio ("${profileData?.bio || ''}"), real location ("${profileData?.location || ''}"), their real public repo count (${profileData?.publicRepos || 0}), their real languages (${profileData?.topLanguages?.join(', ') || 'Code'}), and specific real repository names they created (${(profileData?.recentRepos || []).map((r: any) => `"${r.name}"`).join(', ')}).
- If Spotify: Roast their real top artists, specific song titles, and listening minutes.
- If Chess.com: Roast their real rating, actual win/loss records, and tactics score.
- If the JSON has a 'note' field, obey it. Fields that are empty or missing were NOT provided: never invent them (employers, skills, artists, locations).
- NEVER invent fake repos, fake numbers, or fake statistics when real data is in the JSON. The humor comes from how hyper-accurate and personal your roast is to their real identity!

${intensityGuide}
${personaGuide}

Profile Data to Roast:
${JSON.stringify(profileData, null, 2)}

${customPrompt ? `User's Special Request / Context: "${customPrompt}"` : ''}

Generate structured JSON matching the exact schema provided.
Ensure all metrics in "statsRadar" are integers between 0 and 100.
Make sure "cookedScore" is a number between 60 and 100 representing how cooked they are.
`;

    const roastSchema = {
      type: Type.OBJECT,
      properties: {
        headline: {
          type: Type.STRING,
          description: 'A punchy, hilarious 1-sentence headline roast verdict.',
        },
        cookedScore: {
          type: Type.INTEGER,
          description: 'A number between 60 and 100 representing how cooked this profile is.',
        },
        roastTitle: {
          type: Type.STRING,
          description: 'An funny official archetype title for this person (e.g., "The Unfinished Borrow Checker", "Therapy Avoidance Specialist").',
        },
        mainRoastParagraphs: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '2 to 3 paragraphs of detailed, funny, savage roasting about their specific habits and stats.',
        },
        redFlags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 specific funny red flags extracted from their profile data.',
        },
        psychologicalDiagnosis: {
          type: Type.STRING,
          description: 'A mock official medical or psychological diagnosis statement.',
        },
        statsRadar: {
          type: Type.OBJECT,
          properties: {
            pretentiousness: { type: Type.INTEGER },
            cringeIndex: { type: Type.INTEGER },
            touchGrassNeeded: { type: Type.INTEGER },
            sleepDeprivation: { type: Type.INTEGER },
            socialSkills: { type: Type.INTEGER },
          },
          required: ['pretentiousness', 'cringeIndex', 'touchGrassNeeded', 'sleepDeprivation', 'socialSkills'],
        },
        quoteToShare: {
          type: Type.STRING,
          description: 'A short, iconic 1-line quote suitable for posting on Instagram or X.',
        },
        badgeAwarded: {
          type: Type.STRING,
          description: 'A custom funny title badge (e.g. "Certified Grass Avoider").',
        },
        corporatePip: {
          type: Type.OBJECT,
          description: 'Formal corporate HR Performance Improvement Plan critique.',
          properties: {
            employeeName: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            performanceRating: { type: Type.STRING },
            keyDeficiencies: { type: Type.ARRAY, items: { type: Type.STRING } },
            mandatoryActionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            terminationRisk: { type: Type.STRING },
          },
          required: ['employeeName', 'jobTitle', 'performanceRating', 'keyDeficiencies', 'mandatoryActionItems', 'terminationRisk'],
        },
      },
      required: [
        'headline',
        'cookedScore',
        'roastTitle',
        'mainRoastParagraphs',
        'redFlags',
        'psychologicalDiagnosis',
        'statsRadar',
        'quoteToShare',
        'badgeAwarded',
        'corporatePip',
      ],
    };

    // Helper to extract verified profile receipts
    const buildReceipts = (plt: string, u: string, data: any) => {
      const rec: any = {
        name: data?.name || u,
        username: u,
        bio: data?.bio || data?.summary || data?.about || data?.aboutMe || '',
        location: data?.location || data?.city || '',
        website: data?.blog || data?.website || data?.webUrl || '',
        verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metrics: {},
        items: []
      };

      if (plt === 'github') {
        rec.metrics = {
          'Public Repositories': data?.publicRepos ?? (data?.recentRepos?.length || 0),
          'Followers': data?.followers ?? 0,
          'Following': data?.following ?? 0,
          'Total Stars': data?.totalStars ?? 0,
          'Languages': data?.topLanguages?.join(', ') || 'Code',
        };
        rec.items = (data?.recentRepos || []).map((r: any) => ({
          name: r.name,
          detail: r.description || 'Public repository',
          badge: r.language || 'Code',
          url: r.url || `https://github.com/${u}/${r.name}`
        }));
      } else if (plt === 'leetcode') {
        rec.metrics = {
          'Total Solved': data?.allSolved ?? 0,
          'Easy': data?.easySolved ?? 0,
          'Medium': data?.mediumSolved ?? 0,
          'Hard': data?.hardSolved ?? 0,
          'Rank': data?.ranking ?? 'Unranked',
        };
      } else if (plt === 'codeforces') {
        rec.metrics = {
          'Current Rating': data?.rating ?? 0,
          'Rank Title': data?.rank ?? 'unranked',
          'Max Rating': `${data?.maxRating ?? 0} (${data?.maxRank ?? ''})`,
          'Contribution': data?.contribution ?? 0,
        };
      } else if (plt === 'gitlab') {
        rec.metrics = {
          'Projects Count': data?.projectsCount ?? (data?.recentProjects?.length || 0),
          'Location': data?.location || 'Unknown',
        };
        rec.items = (data?.recentProjects || []).map((p: any) => ({
          name: p.name,
          detail: p.description || 'GitLab Project',
          badge: `${p.stars || 0}★`,
          url: p.webUrl,
        }));
      } else if (plt === 'devto') {
        rec.metrics = {
          'Articles Published': data?.articlesCount ?? 0,
        };
        rec.items = (data?.recentArticles || []).map((a: any) => ({
          name: a.name,
          detail: a.description || 'Tech Article',
          badge: a.badge,
          url: a.url,
        }));
      } else if (plt === 'npm') {
        rec.metrics = {
          'Published Packages': data?.totalPackages ?? 0,
        };
        rec.items = (data?.recentPackages || []).map((p: any) => ({
          name: p.name,
          detail: p.description || 'npm module',
          badge: p.badge,
          url: p.url,
        }));
      } else if (plt === 'chess') {
        rec.metrics = {
          'Rapid Rating': data?.rapidRating ?? 'N/A',
          'Blitz Rating': data?.blitzRating ?? 'N/A',
          'Bullet Rating': data?.bulletRating ?? 'N/A',
        };
      } else if (plt === 'steam') {
        rec.metrics = {
          'Recent Hours (2 Weeks)': `${data?.hoursPastTwoWeeks || 0} hrs`,
        };
        rec.items = (data?.recentGames || []).map((g: any) => ({
          name: g.name,
          detail: `${g.hoursOnRecord} hrs on record`,
          badge: 'Steam Game'
        }));
      } else if (plt === 'duolingo') {
        rec.metrics = {
          'Day Streak': `${data?.streak || 0} days`,
          'Total XP': `${data?.totalXp || 0} XP`,
        };
      } else if (plt === 'spotify') {
        rec.metrics = {
          'Top Artists': data?.topArtists?.slice(0, 3).join(', ') || 'N/A',
          'Top Genres': data?.topGenres?.slice(0, 3).join(', ') || 'N/A',
        };
      } else if (plt === 'lichess') {
        rec.metrics = { 'Blitz': data?.blitzRating, 'Rapid': data?.rapidRating, 'Bullet': data?.bulletRating, 'Puzzle': data?.puzzleRating, 'Games': data?.totalGames, 'Hours Played': data?.hoursPlayed };
      } else if (plt === 'bluesky' || plt === 'mastodon') {
        rec.metrics = { 'Followers': data?.followers ?? 0, 'Following': data?.following ?? 0, 'Posts': data?.postsCount ?? 0 };
        rec.items = (data?.recentPosts || []).map((p: any) => ({ name: p.name, detail: p.detail, badge: 'Post' }));
      } else if (plt === 'reddit') {
        rec.metrics = { 'Total Karma': data?.totalKarma ?? 0, 'Post Karma': data?.postKarma ?? 0, 'Comment Karma': data?.commentKarma ?? 0 };
        rec.items = (data?.recentComments || []).map((c: any) => ({ name: c.name, detail: c.detail, badge: 'Comment' }));
      } else if (plt === 'stackoverflow') {
        rec.metrics = { 'Reputation': data?.reputation ?? 0, 'Answers': data?.answers ?? 0, 'Questions': data?.questions ?? 0, 'Badges (G/S/B)': `${data?.gold ?? 0}/${data?.silver ?? 0}/${data?.bronze ?? 0}` };
      } else if (plt === 'codewars') {
        rec.metrics = { 'Honor': data?.honor ?? 0, 'Rank': data?.overallRank, 'Kata Completed': data?.completedKata ?? 0, 'Clan': data?.clan };
        rec.items = (data?.languages || []).map((l: any) => ({ name: l.name, detail: l.detail, badge: 'Language' }));
      } else if (plt === 'dockerhub') {
        rec.metrics = { 'Repositories': data?.totalRepos ?? 0, 'Pulls (recent 10)': data?.totalPulls ?? 0 };
        rec.items = (data?.recentRepos || []).map((r: any) => ({ name: r.name, detail: r.description, badge: `${r.pulls} pulls`, url: r.url }));
      } else if (plt === 'mal') {
        rec.metrics = { 'Days Watched': data?.daysWatched ?? 0, 'Mean Score': data?.meanScore ?? 0, 'Completed': data?.completed ?? 0, 'Dropped': data?.dropped ?? 0, 'Plan To Watch': data?.planToWatch ?? 0, 'Episodes': data?.episodesWatched ?? 0 };
      } else if (plt === 'hackernews') {
        rec.metrics = { 'Karma': data?.karma ?? 0, 'Submissions': data?.submittedCount ?? 0 };
      } else if (plt === 'letterboxd') {
        rec.metrics = { 'Recent Logs': data?.recentLogsCount ?? 0 };
        rec.items = (data?.recentMovies || []).map((m: any) => ({ name: `${m.title} ${m.year ? `(${m.year})` : ''}`.trim(), detail: `Rating: ${m.rating}`, badge: 'Film' }));
      } else if (plt === 'linkedin') {
        rec.metrics = {
          'Professional Headline': data?.headline || 'Not provided',
          'Location': data?.location || 'Not provided',
          'Experience': data?.experience || 'Not provided',
          'Education': data?.education || 'Not provided',
        };
        rec.items = (data?.skills || []).map((s: string) => ({
          name: s,
          detail: 'Endorsed Professional Skill',
          badge: 'Verified Skill'
        }));
      }

      return rec;
    };

    const receipts = buildReceipts(platform, username, profileData);

    try {
      const parsedData = await generateRoastWithCascade(ai, promptText, roastSchema);
      parsedData.profileReceipts = receipts;
      return res.json({
        success: true,
        roast: parsedData,
      });
    } catch (apiErr: any) {
      console.warn('Upstream Gemini API high demand 503, activating smart failover roast:', apiErr.message);
      const fallbackRoast = generateSmartFallbackRoast(platform, username, profileData);
      fallbackRoast.profileReceipts = receipts;
      return res.json({
        success: true,
        roast: fallbackRoast,
        isFailover: true,
      });
    }
  } catch (err: any) {
    console.error('Roast Generation Error:', err);
    // Even if complete failure, return structured fallback roast with receipts
    const fallbackRoast = generateSmartFallbackRoast(req.body?.platform, req.body?.username, req.body?.profileData);
    return res.json({
      success: true,
      roast: fallbackRoast,
      isFailover: true,
    });
  }
});

// Image Multimodal Screenshot Roast Endpoint
app.post('/api/roast/image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png', roastLevel = 'savage', personality = 'sarcastic_tech' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Base64 image is required.' });
    }

    const ai = getGenAIClient();

    const imagePart = {
      inlineData: {
        mimeType,
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
      },
    };

    const textPrompt = `
You are the world's most brutally hilarious, savage AI profile roaster app called "COOKED".
Inspect this uploaded screenshot of a profile, chat log, bio, playlist, or code snippet.
Analyze every detail in the image (text, avatars, numbers, metrics, vibes, UI elements) and deliver a savage, hilarious roast.

Roast Level: ${roastLevel.toUpperCase()}
Persona: ${personality.toUpperCase()}

Generate structured JSON matching the exact schema provided.
`;

    const imageRoastSchema = {
      type: Type.OBJECT,
      properties: {
        headline: {
          type: Type.STRING,
          description: 'A punchy, hilarious 1-sentence headline roast verdict about what you see in the screenshot.',
        },
        cookedScore: {
          type: Type.INTEGER,
          description: 'A number between 60 and 100 representing how cooked this screenshot is.',
        },
        roastTitle: {
          type: Type.STRING,
          description: 'An funny official archetype title for this person.',
        },
        mainRoastParagraphs: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '2 to 3 paragraphs of detailed, funny, savage roasting about the visual elements and text in the screenshot.',
        },
        redFlags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 specific funny red flags spotted in the screenshot image.',
        },
        psychologicalDiagnosis: {
          type: Type.STRING,
          description: 'A mock official medical or psychological diagnosis statement.',
        },
        statsRadar: {
          type: Type.OBJECT,
          properties: {
            pretentiousness: { type: Type.INTEGER },
            cringeIndex: { type: Type.INTEGER },
            touchGrassNeeded: { type: Type.INTEGER },
            sleepDeprivation: { type: Type.INTEGER },
            socialSkills: { type: Type.INTEGER },
          },
          required: ['pretentiousness', 'cringeIndex', 'touchGrassNeeded', 'sleepDeprivation', 'socialSkills'],
        },
        quoteToShare: {
          type: Type.STRING,
          description: 'A short, iconic 1-line quote suitable for posting on social media.',
        },
        badgeAwarded: {
          type: Type.STRING,
          description: 'A custom funny title badge.',
        },
      },
      required: [
        'headline',
        'cookedScore',
        'roastTitle',
        'mainRoastParagraphs',
        'redFlags',
        'psychologicalDiagnosis',
        'statsRadar',
        'quoteToShare',
        'badgeAwarded',
      ],
    };

    try {
      const parsedData = await generateRoastWithCascade(ai, { parts: [imagePart, { text: textPrompt }] }, imageRoastSchema);
      return res.json({
        success: true,
        roast: parsedData,
      });
    } catch (apiErr: any) {
      console.warn('Image roast 503 high demand fallback:', apiErr.message);
      const fallback = generateSmartFallbackRoast('custom', 'Screenshot Subject', { visualNote: 'Analyzed screenshot image' });
      return res.json({
        success: true,
        roast: fallback,
        isFailover: true,
      });
    }
  } catch (err: any) {
    console.error('Image Roast Error:', err);
    const fallback = generateSmartFallbackRoast('custom', 'Screenshot Subject', {});
    return res.json({
      success: true,
      roast: fallback,
      isFailover: true,
    });
  }
});

// Audio TTS Roast Endpoint
app.post('/api/roast/tts', async (req, res) => {
  try {
    const { text, voice = 'Kore' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    const ai = getGenAIClient();

    let base64Audio: string | undefined;

    // Retry loop for TTS with short backoff in case of 503 spike
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: text.slice(0, 400), // Keep concise for ultra-fast generation
                  speechMetadata: {
                    style: 'Dramatic, comedic, witty voice actor delivering a savage roast',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });

        base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) break;
      } catch (e: any) {
        console.warn(`TTS attempt ${attempt} warning:`, e.message);
        if (attempt < 2) await new Promise((r) => setTimeout(r, 600));
      }
    }

    if (!base64Audio) {
      return res.status(503).json({
        error: 'The voice narrator model is currently at peak capacity. Please try playing audio again in a few moments.'
      });
    }

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('TTS Error:', err);
    return res.status(503).json({ error: 'Voice narrator model is temporarily busy. Please retry shortly.' });
  }
});

// Wall of Shame Endpoints
app.get('/api/wall-of-shame', (req, res) => {
  return res.json({ roasts: wallOfShameRoasts });
});

app.post('/api/wall-of-shame/submit', (req, res) => {
  const newRoast: SavedRoast = {
    id: `roast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    platform: req.body.platform || 'custom',
    username: String(req.body.username || 'Anonymous').slice(0, 60),
    avatarUrl: req.body.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
    headline: req.body.headline || 'Profile is insanely cooked.',
    cookedScore: Math.min(100, Math.max(0, Number(req.body.cookedScore) || 90)),
    roastTitle: req.body.roastTitle || 'Certified Cooked Profile',
    mainRoastParagraphs: req.body.mainRoastParagraphs || [],
    redFlags: req.body.redFlags || [],
    psychologicalDiagnosis: req.body.psychologicalDiagnosis || '',
    statsRadar: req.body.statsRadar || { pretentiousness: 80, cringeIndex: 80, touchGrassNeeded: 90, sleepDeprivation: 80, socialSkills: 20 },
    quoteToShare: req.body.quoteToShare || '',
    badgeAwarded: req.body.badgeAwarded || 'Cooked Legend',
    createdAt: Date.now(),
    upvotes: 1,
  };

  wallOfShameRoasts.unshift(newRoast);
  if (wallOfShameRoasts.length > 50) {
    wallOfShameRoasts.pop();
  }

  return res.json({ success: true, roast: newRoast });
});

app.post('/api/wall-of-shame/upvote/:id', (req, res) => {
  const { id } = req.params;
  const target = wallOfShameRoasts.find(r => r.id === id);
  if (target) {
    target.upvotes += 1;
    return res.json({ success: true, upvotes: target.upvotes });
  }
  return res.status(404).json({ error: 'Roast not found' });
});

// Vite Middleware Integration for Development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(url, `
          <!doctype html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Cooked - The AI Profile Roaster</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Syne:wght@500;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
            </head>
            <body class="bg-[#0b0c10] text-slate-100 min-h-screen antialiased">
              <div id="root"></div>
              <script type="module" src="/src/main.tsx"></script>
            </body>
          </html>
        `);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Cooked Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
