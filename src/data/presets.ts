import { PresetArchetype } from '../types/roast';

export const PRESET_ARCHETYPES: PresetArchetype[] = [
  {
    id: 'rust-dev',
    name: 'Terminally Online Rust Dev',
    platform: 'github',
    username: 'ferris_rust_ace',
    avatarUrl: 'https://avatars.githubusercontent.com/u/10248234?v=4',
    tagline: '47 unfinished repos, rewritten in Neovim Lua 12 times',
    sampleData: {
      platform: 'github',
      username: 'ferris_rust_ace',
      name: 'Ferris MemorySafe',
      bio: 'Rewriting everything in Rust. Zero unsafe blocks allowed.',
      publicRepos: 52,
      followers: 1337,
      following: 4,
      createdAt: '2019-03-15T00:00:00Z',
      totalStars: 420,
      topLanguages: ['Rust', 'Zig', 'Lua', 'Shell'],
      recentRepos: [
        { name: 'hyper-fast-todo-cli-rs', description: 'A todo app written in pure unsafe-free Rust', stars: 120, language: 'Rust' },
        { name: 'dotfiles-nvim-config', description: '10,000 lines of Neovim Lua script', stars: 89, language: 'Lua' },
        { name: 'abandoned-game-engine-3d', description: 'Gpu renderer attempt #4', stars: 45, language: 'Rust' }
      ]
    }
  },
  {
    id: 'sad-indie-music',
    name: 'Sad Boy / Girl Shoegaze Fanatic',
    platform: 'spotify',
    username: 'crying_at_3am',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=sad_girl',
    tagline: '99% Acousticness, top artist Phoebe Bridgers & Radiohead',
    sampleData: {
      platform: 'spotify',
      username: 'crying_at_3am',
      topArtists: ['Phoebe Bridgers', 'Radiohead', 'Slowdive', '100 gecs', 'Elliott Smith'],
      topGenres: ['Sad Girl Indie', 'Shoegaze', 'Midwest Emo', 'Ambient Noise'],
      listeningStats: {
        totalMinutesLogged: 142000,
        acousticnessScore: 98,
        energyLevel: 14,
        explicitContentPercentage: 74,
      },
      topTracks: [
        { title: 'Motion Sickness', artist: 'Phoebe Bridgers', playCount: 840 },
        { title: 'Creep (Acoustic 8-hour loop)', artist: 'Radiohead', playCount: 620 },
        { title: 'When the Sun Hits', artist: 'Slowdive', playCount: 510 }
      ]
    }
  },
  {
    id: 'toxic-dota-gamer',
    name: 'Ranked Toxic Dota & CS2 Addict',
    platform: 'steam',
    username: 'Salty_RageQuitter',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=dota_salt',
    tagline: '5,400 hours played, Herald rank, 18 steam profile bans',
    sampleData: {
      platform: 'steam',
      username: 'Salty_RageQuitter',
      summary: 'MID OR FEED. Don\'t talk to me unless you have 8k MMR.',
      hoursPastTwoWeeks: '112.5',
      recentGames: [
        { name: 'Dota 2', hoursOnRecord: '5,420' },
        { name: 'Counter-Strike 2', hoursOnRecord: '2,100' },
        { name: 'Rust', hoursOnRecord: '980' }
      ]
    }
  },
  {
    id: 'pretentious-cinephile',
    name: 'Elitist French Cinema Snob',
    platform: 'letterboxd',
    username: 'auteur_pretender',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=cinema_snob',
    tagline: 'Gives 1 star to Marvel movies, 5 stars to 1928 black & white silent film',
    sampleData: {
      platform: 'letterboxd',
      username: 'auteur_pretender',
      recentLogsCount: 420,
      recentMovies: [
        { title: 'The Passion of Joan of Arc (1928)', year: '1928', rating: 5.0 },
        { title: 'Jeanne Dielman, 23 Commerce Quay, 1080 Brussels', year: '1975', rating: 5.0 },
        { title: 'Avengers: Endgame', year: '2019', rating: 0.5 },
        { title: 'Stalker', year: '1979', rating: 5.0 }
      ]
    }
  },
  {
    id: 'blunder-king-chess',
    name: 'Queen-Sacrifice Blunderer',
    platform: 'chess',
    username: 'grandmaster_blunder',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=chess_blunder',
    tagline: '620 Blitz rating, plays Bongscloud opening every game',
    sampleData: {
      platform: 'chess',
      username: 'grandmaster_blunder',
      title: 'None',
      rapidRating: 720,
      blitzRating: 615,
      bulletRating: 450,
      tacticsRating: 890,
      rapidRecord: { win: 420, loss: 890, draw: 12 },
    }
  },
  {
    id: 'leetcode-grinder',
    name: '700 Mediums Solved LeetCoder',
    platform: 'leetcode',
    username: 'dp_memoization_god',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=leetcode_hard',
    tagline: 'Solves hard DP problems in 8 minutes, fails culture fit interview',
    sampleData: {
      platform: 'leetcode',
      username: 'dp_memoization_god',
      allSolved: 742,
      easySolved: 180,
      mediumSolved: 420,
      hardSolved: 142,
      ranking: 1420,
      aboutMe: 'Grinding 5 LeetCode problems before breakfast. FAANG or bust.',
    }
  },
  {
    id: 'duolingo-threatened',
    name: '800-Day Streak Duolingo Hostage',
    platform: 'duolingo',
    username: 'duo_owl_victim',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=owl_victim',
    tagline: '800-day streak in Spanish, still orders with finger pointing',
    sampleData: {
      platform: 'duolingo',
      username: 'duo_owl_victim',
      streak: 842,
      totalXp: 184500,
      bio: 'If I miss a lesson, the green bird will kidnap my loved ones.',
      courses: [
        { language: 'Spanish', xp: 94000, crowns: 420 },
        { language: 'Japanese', xp: 52000, crowns: 180 },
        { language: 'High Valyrian', xp: 38500, crowns: 90 }
      ]
    }
  },
  {
    id: 'hackernews-intellectual',
    name: 'Show HN / Lisp Purist',
    platform: 'hackernews',
    username: 'lisp_in_the_cloud',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=hn_intellect',
    tagline: '42,000 karma, explains why your framework is worse than C in 1974',
    sampleData: {
      platform: 'hackernews',
      username: 'lisp_in_the_cloud',
      karma: 42890,
      about: 'Writing my own operating system in Common Lisp. Web development was a mistake.',
      submittedCount: 840,
    }
  },
  {
    id: 'linkedin-influencer',
    name: 'Synergy Thought Leader',
    platform: 'linkedin',
    username: 'b2b_saas_prophet',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=linkedin_bro',
    tagline: 'Ex-Uber intern, Top Voice in Disruption, waking up at 4:15 AM',
    sampleData: {
      platform: 'linkedin',
      username: 'b2b_saas_prophet',
      headline: 'Keynote Speaker | 10x Paradigm Shifter | Building stealth B2B AI synergies',
      bio: 'What losing my airpod taught me about B2B sales leadership. Agree? Thoughts?',
      experienceYears: 2,
      connections: '500+',
    }
  },
  {
    id: 'weeb-anime-watcher',
    name: '1,200 Anime Completed Otaku',
    platform: 'mal',
    username: 'waifu_collector_9000',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=otaku_lord',
    tagline: '340 days of anime watched, owns 14 body pillows',
    sampleData: {
      platform: 'mal',
      username: 'waifu_collector_9000',
      daysWatched: 342.5,
      meanScore: 9.8,
      completed: 1240,
      onHold: 45,
      dropped: 2,
      planToWatch: 890,
      episodesWatched: 21400,
    }
  }
];
