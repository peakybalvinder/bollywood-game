import React from 'react';
import LegalPage, { Section, P, Ul, Highlight } from './LegalPage';

const STEPS = [
  { n: '01', icon: '🎬', title: 'Create or Join a Party', desc: 'Click "Create a Party" to start a room as host. Share the 6-character code or link with friends so they can join.' },
  { n: '02', icon: '🎞', title: 'Host Picks a Movie',     desc: 'Only the host sees the movie picker. Search for any Bollywood title or type one directly. Optionally add hint letters that will be pre-revealed to all players.' },
  { n: '03', icon: '🔤', title: 'Players Guess Letters',  desc: 'Each player independently guesses letters one at a time. Your guesses don\'t affect others — everyone has their own board.' },
  { n: '04', icon: '💡', title: 'Correct or Wrong?',      desc: 'A correct letter reveals all its positions on your board. A wrong guess strikes one letter from BOLLYWOOD. You have 9 lives.' },
  { n: '05', icon: '🏆', title: 'Win the Round',          desc: 'Reveal the full movie title before all 9 lives are lost. The fewer lives you use, the more points you earn.' },
  { n: '06', icon: '🔁', title: 'Play Again',             desc: 'After everyone finishes, the host picks the next movie. Scores accumulate across all rounds in the session.' },
];

export default function HowToPlay({ onBack }) {
  return (
    <LegalPage title="How to Play" onBack={onBack}>

      <Highlight>
        FilmiPaheli is a real-time multiplayer Bollywood movie guessing game — like Hangman, but for Bollywood fans. One person hosts, everyone else guesses. No login required.
      </Highlight>

      {/* Step by step */}
      <Section title="Step-by-Step Guide">
        <div className="space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4 bg-ink-800 border border-ink-700 rounded-xl p-4">
              <div className="shrink-0 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-display font-black text-ink-600 text-2xl leading-none">{s.n}</div>
              </div>
              <div>
                <p className="font-body font-semibold text-gold-400 text-sm mb-1">{s.title}</p>
                <p className="text-gold-700 text-sm font-body leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Game Roles">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-ink-800 border border-ink-700 rounded-xl p-5">
            <p className="text-2xl mb-2">🎬</p>
            <p className="font-body font-bold text-gold-400 text-sm mb-2">Host</p>
            <Ul items={[
              'Picks the Bollywood movie before each round',
              'Can give optional hint letters to help players',
              'Watches all players\' progress in real time',
              'Sees each player\'s board, lives, and last guess',
              'Can transfer the host role to another player',
              'Cannot guess — purely a spectator each round',
            ]} />
          </div>
          <div className="bg-ink-800 border border-ink-700 rounded-xl p-5">
            <p className="text-2xl mb-2">🎭</p>
            <p className="font-body font-bold text-gold-400 text-sm mb-2">Player</p>
            <Ul items={[
              'Gets their own independent game board',
              'Guesses letters using the on-screen keyboard',
              'Wrong guesses only affect your own lives',
              'Can use the chat to talk to other players',
              'Can see other players\' BOLLYWOOD lives in the sidebar',
              'Score = (Lives Left × 10) + 20 when correct',
            ]} />
          </div>
        </div>
      </Section>

      <Section title="Scoring System">
        <Highlight>
          Score = Lives Remaining × 10 + 20
        </Highlight>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { lives: 9, label: 'Perfect', pts: 110 },
            { lives: 5, label: 'Good',    pts: 70  },
            { lives: 1, label: 'Close',   pts: 30  },
          ].map((s) => (
            <div key={s.lives} className="bg-ink-800 border border-ink-700 rounded-xl p-4 text-center">
              <p className="font-mono font-bold text-gold-400 text-xl">{s.pts}</p>
              <p className="text-gold-600 text-xs font-body">{s.label}</p>
              <p className="text-gold-800 text-xs font-body">{s.lives} lives left</p>
            </div>
          ))}
        </div>
        <P>Scores accumulate across all rounds in the same session. The player with the highest total score at the end wins!</P>
      </Section>

      <Section title="Hint System">
        <P>When picking a movie, the host can type hint letters in the Hint Letters box. For example, typing <span className="font-mono text-gold-400">SH</span> for "Sholay" will reveal all S's and H's on every player's board from the start.</P>
        <Ul items={[
          'Hints make the game easier — use them for harder or longer movie titles',
          'Multiple hint letters are allowed (e.g. AKD reveals all A\'s, K\'s, and D\'s)',
          'If hint letters would reveal the entire movie, the game cannot start',
          'Special characters like colons (:), hyphens (-), and spaces are always visible',
        ]} />
      </Section>

      <Section title="Multiplayer Flow">
        <P>Here's how a typical FilmiPaheli session works with friends:</P>
        <Ul items={[
          'Host creates a room and shares the link in your WhatsApp group',
          'Everyone clicks the link and enters their name — no signup needed',
          'Host picks a movie (e.g. "Dilwale Dulhania Le Jayenge") with hint "D"',
          'All players see blanks: D _ _ _ _ _ _   D _ _ _ _ _ _ _   _ _   _ _ _ _ _ _ _',
          'Each player guesses independently — Rahul guesses "L", Priya guesses "A"',
          'First to complete the title wins the most points for that round',
          'Host picks the next movie — keep playing as long as you want!',
        ]} />
      </Section>

      <Section title="Tips & Tricks">
        <Ul items={[
          'Start with common letters in Hindi movie titles: A, I, R, N, K, H, D',
          'Watch other players\' BOLLYWOOD lives in the sidebar to gauge difficulty',
          'Use the chat to discuss clues after a round (not during — that\'s cheating!)',
          'On mobile, use the bottom tab bar to switch between Game, Players, and Chat',
          'Install FilmiPaheli as an app — tap Share → Add to Home Screen on your phone',
          'The host can give more hints for younger players or beginners',
        ]} />
      </Section>

      <Section title="Fair Play Rules">
        <Ul items={[
          'Do not search for the movie answer on Google or other tabs — tab switching is detected and reported to the host',
          'Do not share answers in the chat during an active round',
          'Only one browser tab per player — multiple tabs are automatically blocked',
          'Players inactive for 5 minutes are removed from the room automatically',
          'Be respectful in the chat — abusive messages may result in being blocked',
        ]} />
      </Section>

    </LegalPage>
  );
}
