import React, { useState } from 'react';
import { setPageMeta } from '../router';
import LegalPage, { Section, P, Ul, Highlight } from './LegalPage';

function Accordion({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-ink-700 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-ink-800 hover:bg-ink-700 transition-colors"
      >
        <span className="font-body font-semibold text-sm text-gold-300">{q}</span>
        <span className={`text-gold-600 text-lg transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-5 py-4 bg-ink-900 text-gold-700 text-sm font-body leading-relaxed border-t border-ink-700">
          {children}
        </div>
      )}
    </div>
  );
}

export default function FAQ({ onBack }) {
  React.useEffect(() => {
    setPageMeta({
      title: 'FAQ — FilmiPaheli | Bollywood Game Questions Answered',
      description: 'Frequently asked questions about FilmiPaheli, the free multiplayer Bollywood movie guessing game. Rules, gameplay, sessions, anti-cheat and more.',
      canonical: 'https://www.filmipaheli.com/faq',
    });
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalPage title="FAQ" onBack={onBack}>

      <Section title="Getting Started">
        <Accordion q="What is FilmiPaheli?">
          FilmiPaheli is a free, real-time multiplayer Bollywood movie guessing game. One player acts as the host and secretly picks a Bollywood film. The other players guess the title one letter at a time — like a classic Hangman game, but with a Bollywood twist. No account or app download needed.
        </Accordion>

        <Accordion q="Do I need to create an account?">
          No. FilmiPaheli is completely guest-based. You just pick a name when you join — no email, no password, no registration. Your session exists only while you're actively playing.
        </Accordion>

        <Accordion q="Is FilmiPaheli free to play?">
          Yes, 100% free. FilmiPaheli is supported by non-intrusive Google AdSense ads shown on the home page. No ads appear during gameplay.
        </Accordion>

        <Accordion q="Can I play on mobile?">
          Yes. FilmiPaheli is fully responsive and works on all modern smartphones, tablets, and desktops. On mobile, use the bottom navigation bar to switch between the Game, Players, and Chat sections. You can also install it as an app via your browser's "Add to Home Screen" option.
        </Accordion>
      </Section>

      <Section title="Creating & Joining a Game">
        <Accordion q="How do I create a party?">
          Click "Create a Party" on the home screen. Enter your name and a party name, choose the maximum number of players (2–5), and tap Create. You'll get a 6-character room code and a shareable link — send either to your friends.
        </Accordion>

        <Accordion q="How do I join a game?">
          You can join in two ways:
          <ul className="mt-2 space-y-1 pl-2">
            <li>→ Click the shared link — it opens FilmiPaheli and jumps straight to the name entry step.</li>
            <li>→ Go to FilmiPaheli.com → click "Join a Party" → enter the 6-character room code → enter your name.</li>
          </ul>
        </Accordion>

        <Accordion q="How many players can join a room?">
          Each room supports 2 to 5 players including the host. The host chooses the limit when creating the room.
        </Accordion>

        <Accordion q="What if my friend can't find the room code?">
          Room codes are case-insensitive and exactly 6 characters long (letters and numbers). If the room shows as "not found", the host's session may have expired or they may have left. Ask the host to create a new room.
        </Accordion>
      </Section>

      <Section title="Gameplay Rules">
        <Accordion q="How does the game work?">
          <p>The host secretly picks a Bollywood movie and optionally gives hint letters. Everyone else sees blank tiles for each letter. Players take turns guessing one letter at a time:</p>
          <ul className="mt-2 space-y-1 pl-2">
            <li>→ Correct guess → that letter is revealed on your board</li>
            <li>→ Wrong guess → one letter of BOLLYWOOD is struck out (you have 9 lives)</li>
            <li>→ Reveal the full title before BOLLYWOOD runs out = you win the round</li>
          </ul>
          <p className="mt-2">Each player has their own independent board — your guesses don't affect others.</p>
        </Accordion>

        <Accordion q="How is scoring calculated?">
          If you guess the movie correctly:
          <div className="mt-2 bg-ink-800 rounded-lg px-4 py-3 font-mono text-gold-400 text-sm">
            Score = (Lives Remaining × 10) + 20
          </div>
          <p className="mt-2">Scores accumulate across rounds within the same session. The fewer lives you use, the more points you earn. Guessing with 9 lives remaining gives 110 points; with 1 life remaining gives 30 points.</p>
        </Accordion>

        <Accordion q="Can the host play too?">
          No. The host picks the movie and watches as a spectator. The host sees all players' progress — their partial words, lives remaining, and last guessed letter — in real time. After everyone finishes, the host can pick the next movie.
        </Accordion>

        <Accordion q="What happens if no one guesses the movie?">
          When all players have either guessed correctly or run out of lives, the round ends. The movie is revealed to everyone. The host can then start a new round by picking another movie.
        </Accordion>

        <Accordion q="Can the host transfer to another player?">
          Yes. During a game, the host can click "👑 Make Host" next to any player's name in the player list. This transfers the host role to that player. The new host can then pick movies for future rounds.
        </Accordion>
      </Section>

      <Section title="Hint System">
        <Accordion q="What are hint letters?">
          When the host picks a movie, they can optionally type one or more hint letters. Those letters are pre-revealed on every player's board from the start. For example, if the movie is "Sholay" and the host gives hints "S" and "L", every player starts with S and L already shown.
        </Accordion>

        <Accordion q="Can the host give too many hints?">
          No. If the combined hint letters would reveal the entire movie title, the "Start the Game" button is disabled and a warning is shown. At least one letter must remain hidden for the game to start.
        </Accordion>
      </Section>

      <Section title="Session Rules & Limits">
        <Accordion q="What is the inactivity timeout?">
          If you don't interact with the game for 5 consecutive minutes, you are automatically removed from the room. This keeps rooms clean and prevents zombie sessions. Simply rejoin with the same code if removed.
        </Accordion>

        <Accordion q="Can I open FilmiPaheli in two tabs?">
          No. Only one active session per browser is allowed. If you open a second tab, both tabs receive a warning. On the server side, the older session is disconnected when a newer one joins with the same name and room code. This prevents cheating via multiple windows.
        </Accordion>

        <Accordion q="What happens if the host leaves?">
          If the host disconnects or closes the tab, the entire room is closed and all players are notified. Players will need to create a new room. This is by design — the host controls the game session.
        </Accordion>
      </Section>

      <Section title="Anti-Cheating">
        <Accordion q="What counts as cheating?">
          <Ul items={[
            'Switching to another tab or window to look up the movie answer',
            'Opening multiple browser sessions to gain an advantage',
            'Using browser developer tools to inspect hidden game data',
            'Abusing the chat to share answers with other players',
          ]} />
        </Accordion>

        <Accordion q="How does FilmiPaheli detect tab switching?">
          The game monitors browser visibility events. If you switch to another tab or minimise the window during an active game, the host is notified with a counter (e.g. "Rahul switched tabs ×2"). This information is visible only to the host — not to other players. Tab-switching does not end your game, but it alerts the host who can take action.
        </Accordion>

        <Accordion q="Can the host kick a player?">
          Currently there is no manual kick button, but the host can transfer the host role and end the session by leaving. Tab-switch and focus-loss counts are visible to the host for monitoring.
        </Accordion>
      </Section>

      <Section title="Chat">
        <Accordion q="How does chat work?">
          The chat panel (accessible via the Chat tab on mobile or the right sidebar on desktop) lets all players in a room send messages in real time. Messages are visible to everyone in the room only. Chat history is not stored after the session ends.
        </Accordion>

        <Accordion q="Are there rules for the chat?">
          Yes. You may not use the chat to share movie answers, post abusive content, harass other players, or spam messages. Violating these rules may result in being blocked from the platform. See our Terms & Conditions for full details.
        </Accordion>
      </Section>

      <Section title="Technical">
        <Accordion q="Which browsers are supported?">
          FilmiPaheli works on Chrome, Firefox, Safari (iOS and macOS), Edge, and most modern mobile browsers. For the best experience, use the latest version of your browser.
        </Accordion>

        <Accordion q="Why am I stuck on 'Connecting…'?">
          This usually means your device can't reach the FilmiPaheli game server. Check your internet connection. If the problem persists, try refreshing the page. If you see a "Cannot reach server" screen, the server may be temporarily restarting — wait 30 seconds and try again.
        </Accordion>

        <Accordion q="Is my data private?">
          Yes. FilmiPaheli does not collect or store any personal information. Only your chosen display name is used within your session. Chat messages exist only in memory during the session and are permanently deleted when the room closes. See our Privacy Policy for full details.
        </Accordion>
      </Section>

    </LegalPage>
  );
}
