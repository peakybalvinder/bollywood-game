import { useEffect } from 'react';

/**
 * Prevents multiple tabs from running the same game session.
 * Uses BroadcastChannel — when a new tab opens the game,
 * it notifies existing tabs to show a "session taken over" message.
 */
export default function useSingleSession(onTakeover) {
  useEffect(() => {
    if (!window.BroadcastChannel) return; // not supported in all browsers

    const channel = new BroadcastChannel('filmipaheli_session');

    // Tell other tabs we just became active
    channel.postMessage({ type: 'SESSION_START' });

    // Listen for other tabs starting — if they do, we've been taken over
    channel.onmessage = (e) => {
      if (e.data?.type === 'SESSION_START') {
        onTakeover?.();
      }
    };

    return () => channel.close();
  }, [onTakeover]);
}
