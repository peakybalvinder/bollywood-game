import { io } from 'socket.io-client';

const BAKED_URL   = import.meta.env.VITE_SERVER_URL || '';
const SAME_ORIGIN = window.location.origin;

export const SOCKET_URL =
  BAKED_URL && BAKED_URL !== SAME_ORIGIN ? BAKED_URL : SAME_ORIGIN;

console.log('[FilmiPaheli] Connecting to:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: false,

  // Polling first — survives iOS background, Safari quirks
  transports: ['polling', 'websocket'],

  // Connection timeout only — no non-standard options
  timeout: 20000,

  // Reconnection
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,
  randomizationFactor: 0.4,

  withCredentials: false,
});

// iOS visibility handler — reconnect when app comes back to foreground
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(() => {
        if (!socket.connected) {
          console.log('[FilmiPaheli] Resuming from background — reconnecting…');
          socket.connect();
        }
      }, 500);
    }
  });
}

export default socket;
