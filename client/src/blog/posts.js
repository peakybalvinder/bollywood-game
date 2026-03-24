/**
 * Blog post data — all content lives here.
 * Each post has: slug, title, description, date, readTime, content (JSX-compatible markdown-like structure)
 */

export const POSTS = [
  {
    slug: 'how-to-play-bollywood-movie-guessing-game',
    title: 'How to Play Bollywood Movie Guessing Game with Friends Online',
    description: 'Learn how to play FilmiPaheli, the free multiplayer Bollywood movie guessing game. Step-by-step guide for beginners and advanced players.',
    date: '2026-03-20',
    readTime: '5 min read',
    category: 'Guide',
    sections: [
      {
        h2: 'What Is a Bollywood Movie Guessing Game?',
        body: `A Bollywood movie guessing game is exactly what it sounds like — players try to identify a Bollywood film by guessing one letter at a time, just like the classic Hangman game. FilmiPaheli brings this experience online with real-time multiplayer support, so you can play with friends anywhere in India or around the world.`,
      },
      {
        h2: 'Why FilmiPaheli Is Different from Hangman',
        bullets: [
          'Each player gets their own independent board — your wrong guess doesn\'t hurt anyone else',
          'The host picks the movie secretly — nobody else sees the answer until it\'s revealed',
          'Up to 5 players can join the same room simultaneously',
          'Works on mobile without any app download — just share a link',
          'Scores accumulate across rounds, so the best Bollywood fan wins overall',
        ],
      },
      {
        h2: 'Step-by-Step: How to Start a Game',
        numbered: [
          'Open filmipaheli.com on your phone or computer',
          'Click "Create a Party" — enter your name and a party name',
          'Share the 6-character room code or link with friends on WhatsApp',
          'Wait for friends to join (up to 5 players)',
          'Tap "Pick a Movie" — search for any Bollywood film',
          'Optionally set hint letters (e.g. type "S" to pre-reveal all S\'s)',
          'Click "Start the Game" — everyone starts guessing!',
        ],
      },
      {
        h2: 'How Scoring Works',
        body: `Your score depends on how efficiently you guess the movie. The formula is simple: Lives Remaining × 10 + 20. If you guess correctly with all 9 lives intact, you earn 110 points. With 5 lives left, you earn 70 points. Scores add up across all rounds in the same session, so the player with the best Bollywood knowledge wins overall.`,
      },
      {
        h2: 'Tips for Winning Every Round',
        bullets: [
          'Start with the most common letters in Hindi movie titles: A, I, R, N, K, H, D',
          'Pay attention to word length and pattern — "_ _ _ _ _ _" with 6 blanks could be "Sholay"',
          'Watch other players\' progress — if they\'re struggling, it\'s a harder movie',
          'Short 4-5 letter movies are often harder than long titles',
          'Use the hint system strategically — a good hint makes the game fun without giving it away',
        ],
      },
      {
        h2: 'Playing the Daily Challenge',
        body: `Every day at midnight, FilmiPaheli releases a new Daily Challenge. The same movie is picked for all players worldwide on that day — just like Wordle. Your daily streak tracks how many consecutive days you\'ve guessed correctly. Share your result with friends using the emoji grid: 🟥🟥🟩🟩🟩🟩 shows your wrong and correct lives at the end.`,
      },
      {
        h2: 'Playing vs the Computer',
        body: `Don\'t have friends available? Play against the computer in three difficulty modes. Easy mode picks random letters slowly — you\'ll almost always win. Medium mode uses common Bollywood letter frequencies but makes occasional mistakes. Hard mode analyses the specific movie title and picks the letters that reveal the most blanks — it\'s a real challenge even for Bollywood experts.`,
      },
    ],
  },

  {
    slug: 'best-bollywood-movies-to-guess',
    title: '50 Best Bollywood Movies to Guess — Easy to Hard',
    description: 'The ultimate list of Bollywood movies for your next FilmiPaheli game session. From classic easy picks to hard modern titles — sorted by difficulty.',
    date: '2026-03-20',
    readTime: '7 min read',
    category: 'Lists',
    sections: [
      {
        h2: 'Beginner Level — Everyone Knows These',
        body: 'These movies are so iconic that even casual Bollywood fans will guess them quickly. Perfect for family game nights or playing with friends who aren\'t hardcore film buffs.',
        bullets: [
          'Sholay (1975) — The king of Bollywood, everyone knows Jai and Veeru',
          'Dilwale Dulhania Le Jayenge (1995) — DDLJ, the longest running film in history',
          'Lagaan (2001) — Cricket + freedom + Oscar nomination = legendary',
          'Kabhi Khushi Kabhie Gham (2001) — K3G, the family drama everyone quotes',
          '3 Idiots (2009) — "All is well" — most quoted Bollywood film of the 2000s',
          'Dangal (2016) — Aamir Khan\'s wrestling drama, broke box office records',
          'Bajrangi Bhaijaan (2015) — Salman Khan\'s emotional favourite',
          'PK (2014) — The alien questioning religion — impossible to forget',
          'Dil Chahta Hai (2001) — The movie that defined a generation',
          'Queen (2014) — Kangana\'s solo triumph, every woman\'s favourite',
        ],
      },
      {
        h2: 'Intermediate Level — Bollywood Regulars',
        body: 'These require a bit more Bollywood knowledge. Great for friend groups who watch films regularly.',
        bullets: [
          'Devdas (2002) — Sanjay Leela Bhansali\'s lavish heartbreak',
          'Omkara (2006) — Shakespeare in Uttar Pradesh, criminally underrated',
          'Rang De Basanti (2006) — The movie that changed how we think about patriotism',
          'Black (2005) — Amitabh and Rani\'s masterpiece, inspired by Helen Keller',
          'Kahaani (2012) — Vidya Balan\'s Kolkata thriller, twist for the ages',
          'Andhadhun (2018) — Blind pianist, murder mystery — impossible to put down',
          'Stree (2018) — Horror comedy that became a franchise',
          'Tumbbad (2018) — India\'s best horror film, grossly underrated',
          'Masaan (2015) — Quiet devastation on the banks of the Ganga',
          'Udaan (2010) — Every teenager who ever fought with their father',
        ],
      },
      {
        h2: 'Hard Level — For True Bollywood Experts',
        body: 'These are the movies that will separate the casual viewers from the real film fans. Only use these if your group really knows their Bollywood.',
        bullets: [
          'Pyaasa (1957) — Guru Dutt\'s existential masterpiece',
          'Kaagaz Ke Phool (1959) — The first CinemaScope film in India',
          'Sahib Bibi Aur Ghulam (1962) — Meena Kumari\'s most haunting performance',
          'Paan Singh Tomar (2012) — The athlete who became a bandit',
          'Ship of Theseus (2012) — Philosophy meets gorgeous cinematography',
          'Court (2015) — Chilling study of the Indian justice system',
          'Newton (2017) — India\'s Oscar submission that should have won',
          'Meel Patthar (1972) — Dilip Kumar at his finest, ignored today',
          'Ankur (1974) — Shyam Benegal\'s devastating debut',
          'Ardh Satya (1983) — Om Puri\'s greatest role, criminally forgotten',
        ],
      },
      {
        h2: 'Modern Blockbusters (2020–2025)',
        bullets: [
          'Pathaan (2023) — Shah Rukh Khan\'s comeback nobody saw coming',
          'Jawan (2023) — SRK again, broke every record',
          'Animal (2023) — Ranbir Kapoor\'s divisive but massive hit',
          'Stree 2 (2024) — The sequel that outgrossed everything',
          'Pushpa: The Rise (2021) — Allu Arjun goes national',
          'KGF Chapter 2 (2022) — Yash\'s pan-India dominance',
          'Gangubai Kathiawadi (2022) — Alia Bhatt\'s career-defining performance',
          'The Kashmir Files (2022) — The most talked-about film of 2022',
          'Drishyam 2 (2022) — The sequel that rivalled the original',
          'Dunki (2023) — SRK and Hirani on immigration',
        ],
      },
      {
        h2: 'Special Categories for Themed Nights',
        body: 'Make your FilmiPaheli session more interesting by choosing a theme for the night. Here are some great theme ideas:',
        bullets: [
          'Retro Night — Only pre-2000 films (Sholay, DDLJ, Mughal-E-Azam)',
          'SRK Night — Only Shah Rukh Khan movies',
          'Aamir Night — Only Aamir Khan movies (he has the fewest but most memorable)',
          'Women-Led Films — Queen, Kahaani, Gangubai, Raazi, Neerja',
          'Oscar Night — Films submitted or nominated from India',
          'Sports Films — Chak De, Dangal, Bhaag Milkha, MS Dhoni, Gold',
          'Horror Night — Stree, Tumbbad, Bhool Bhulaiyaa, 1920',
          '2-Word Films — Many of the hardest guesses have just 2 words',
        ],
      },
    ],
  },

  {
    slug: 'bollywood-wordle-game-online',
    title: 'FilmiPaheli: The Best Bollywood Wordle Game Online (Free)',
    description: 'Looking for a Bollywood Wordle? FilmiPaheli is India\'s best Bollywood word guessing game — free, multiplayer, with a daily challenge. No download needed.',
    date: '2026-03-20',
    readTime: '4 min read',
    category: 'About',
    sections: [
      {
        h2: 'What Is Bollywood Wordle?',
        body: 'Since Wordle became a global phenomenon in 2022, millions of Indians have been searching for a Bollywood version. FilmiPaheli is exactly that — but better. Instead of guessing 5-letter words, you\'re guessing Bollywood movie titles. Instead of playing alone, you play with friends in real time.',
      },
      {
        h2: 'FilmiPaheli Daily Challenge vs Wordle',
        bullets: [
          'Same movie for everyone on the same day — just like Wordle',
          'Shareable emoji result: 🟥🟥🟩🟩🟩🟩 to paste in WhatsApp',
          'Streak counter — see how many days in a row you\'ve guessed correctly',
          'No account needed — just open the site and play',
          'Available in English but themed entirely around Bollywood and Hindi cinema',
        ],
      },
      {
        h2: 'Why FilmiPaheli Is Better Than Regular Wordle',
        bullets: [
          'Bollywood movies, not random English words — far more relevant for Indian audiences',
          'Multiplayer — you can play WITH friends, not just compare scores afterward',
          'No 6-guess limit — you have 9 lives (the letters of BOLLYWOOD)',
          'Any movie title length — from "Don" to "Dilwale Dulhania Le Jayenge"',
          'Host can pick the movie — making it perfect for parties',
          'Daily Challenge + vs Computer + Multiplayer in one app',
        ],
      },
      {
        h2: 'How to Share Your Daily Result',
        body: 'After completing the daily challenge, tap "Share Result." You\'ll get an emoji grid you can paste directly into WhatsApp, Twitter, or Instagram:',
        bullets: [
          'FilmiPaheli Daily #442',
          '8 guesses — 6/9 lives left',
          '🟥🟥🟥🟩🟩🟩🟩🟩🟩',
          'filmipaheli.com',
        ],
      },
      {
        h2: 'Try FilmiPaheli Right Now',
        body: 'FilmiPaheli is completely free, works on all devices, and requires no signup or download. Visit filmipaheli.com on your phone, tap "Daily Challenge" for today\'s puzzle, or "Create a Party" to play with friends. The daily challenge resets at midnight every day with a new Bollywood movie.',
      },
    ],
  },

  {
    slug: 'bollywood-party-games-online',
    title: 'Best Online Bollywood Party Games for Friends in 2026',
    description: 'Looking for fun online Bollywood games to play with friends? Here are the best free Bollywood party games including FilmiPaheli, quizzes, and more.',
    date: '2026-03-20',
    readTime: '5 min read',
    category: 'Lists',
    sections: [
      {
        h2: 'Why Online Bollywood Party Games Are So Popular',
        body: 'With friends scattered across cities, countries, and time zones, online games have replaced the living room get-together for many Indian families and friend groups. Bollywood is the one thing that unites Indians everywhere — from Delhi to Dubai, from Mumbai to Melbourne. A good Bollywood party game needs no rules explanation, works across generations, and gets competitive fast.',
      },
      {
        h2: '1. FilmiPaheli — Best Multiplayer Bollywood Game',
        body: 'FilmiPaheli (filmipaheli.com) is the only real-time multiplayer Bollywood game that works entirely in the browser. One player creates a room, shares the link on WhatsApp, and friends join from anywhere. The host picks a Bollywood movie, everyone guesses letters simultaneously. Features include daily challenges, vs computer mode, and emoji score sharing.',
        bullets: [
          'Free, no download, no account needed',
          'Up to 5 players, real-time on any device',
          'Host can pick any Bollywood movie ever made',
          'Daily challenge with streak tracking',
        ],
      },
      {
        h2: '2. Bollywood Trivia Quiz Nights',
        body: 'For larger groups (6-20 people), a Bollywood trivia quiz format works well over Zoom or Google Meet. One person shares their screen with questions. Categories can include: Year of release, Actor who played the villain, Songs from the film, Box office collection, Director\'s name. Free tools like Kahoot or Mentimeter let you run live quizzes with scores on screen.',
      },
      {
        h2: '3. Song Recognition Games',
        body: 'Play the first 10 seconds of a Bollywood song on a Bluetooth speaker or Zoom, and the first person to name the movie wins a point. Use Spotify or YouTube Music\'s Bollywood playlists. Works best with 4-10 people in a group call. Themes: 90s songs only, Kishore Kumar only, songs from 2020s, item numbers, title tracks.',
      },
      {
        h2: '4. Bollywood Dumb Charades (Online)',
        body: 'The classic game reimagined for video calls. One person acts out a Bollywood movie title without speaking — others guess. Works surprisingly well on Zoom if you split into two teams using breakout rooms. Tips: Act out word by word, use finger counting for syllables, point to your ear for "sounds like."',
      },
      {
        h2: '5. Bollywood Actor Photo Quiz',
        body: 'Share cropped or old photos of Bollywood actors and ask people to identify them. Early career photos are the hardest. Tools needed: Google Images + WhatsApp or any group screen sharing. This is especially fun with older generations who remember actors from the 70s and 80s that younger players won\'t recognise.',
      },
      {
        h2: 'Tips for the Perfect Bollywood Game Night',
        bullets: [
          'Mix difficulty levels — include movies from different eras',
          'Balance teams — put one Bollywood expert on each team',
          'Use a timer — 60 seconds per guess keeps the energy high',
          'Play FilmiPaheli first as a warm-up — it\'s the easiest to start',
          'Have a prize — even just bragging rights makes it competitive',
          'Record the session — the reactions are always hilarious',
        ],
      },
    ],
  },

  {
    slug: 'play-bollywood-games-with-friends-online-free',
    title: 'How to Play Bollywood Games with Friends Online for Free',
    description: 'Complete guide to playing Bollywood games online with friends for free. No download, no signup — just share a link and start playing instantly.',
    date: '2026-03-20',
    readTime: '4 min read',
    category: 'Guide',
    sections: [
      {
        h2: 'The Challenge of Finding Good Online Bollywood Games',
        body: 'Most Bollywood games online are either single-player apps, require downloads, or cost money. Finding a free multiplayer Bollywood game that works on both phones and computers — without any account — is surprisingly hard. FilmiPaheli was built specifically to solve this problem.',
      },
      {
        h2: 'How to Start a Bollywood Game in 60 Seconds',
        numbered: [
          'Open filmipaheli.com on your phone',
          'Tap "Create a Party" and enter your name',
          'Tap the room code button at the top — it opens a share sheet on iOS/Android',
          'Share the link directly to your WhatsApp group',
          'Friends tap the link — they\'re in the game instantly',
          'Tap "Pick a Movie" and choose any Bollywood film',
          'Everyone starts guessing — the game is live!',
        ],
      },
      {
        h2: 'What You Need (Nothing)',
        bullets: [
          'No app download — works in any mobile browser (Chrome, Safari)',
          'No account or signup — just pick a display name',
          'No payment — completely free',
          'No special hardware — any phone or computer from the last 10 years works',
          'No minimum internet speed — works on 4G or even 3G in a pinch',
        ],
      },
      {
        h2: 'Best Situations to Play FilmiPaheli',
        bullets: [
          'Weekend catch-up calls with college friends',
          'Family WhatsApp group game nights',
          'Office team bonding activities',
          'Long road trips (passenger plays on phone)',
          'Dussehra, Diwali, or Eid get-togethers when everyone\'s together',
          'Long-distance relationships — play your partner every night',
          'NRI families staying connected with India',
        ],
      },
      {
        h2: 'Frequently Asked Questions',
        bullets: [
          'How many people can play? — Up to 5 players per room',
          'Does it work on iPhone? — Yes, Safari on iOS is fully supported',
          'Can we play from different countries? — Yes, the server is global',
          'What if someone leaves mid-game? — The game continues for remaining players',
          'Can we play multiple rounds? — Yes, the host picks a new movie after each round',
          'Are scores saved? — Scores last for the session (until everyone leaves)',
        ],
      },
      {
        h2: 'Start Playing Now',
        body: 'Visit filmipaheli.com right now — the game loads in under 3 seconds on any connection. Create a party, share the link in your group, and you\'re playing Bollywood\'s most fun guessing game in under a minute. No friction, no signup, no cost.',
      },
    ],
  },
];

export function getPost(slug) {
  return POSTS.find(p => p.slug === slug) || null;
}
