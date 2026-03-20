import { useEffect } from 'react';
import socket from '../socket';

/**
 * Detects tab switching and window focus loss during a game.
 * Emits tab_hidden / tab_visible / focus_lost to the server.
 * The server notifies the host privately.
 */
export default function useAntiCheat(active) {
  useEffect(() => {
    if (!active) return;

    function onVisibilityChange() {
      if (document.hidden) {
        socket.emit('tab_hidden');
      } else {
        socket.emit('tab_visible');
      }
    }

    function onBlur() {
      socket.emit('focus_lost');
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      // Tell server tab is visible when component unmounts
      socket.emit('tab_visible');
    };
  }, [active]);
}
