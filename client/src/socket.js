import { io } from 'socket.io-client';

const BAKED_URL   = import.meta.env.VITE_SERVER_URL || '';
const SAME_ORIGIN = window.location.origin;

export const SOCKET_URL =
  BAKED_URL && BAKED_URL !== SAME_ORIGIN ? BAKED_URL : SAME_ORIGIN;

console.log('[FilmiPaheli] Connecting to:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: false,

  // ── Transport: polling first so iOS Safari can always connect ─────────────
  // WebSocket alone fails on iOS when the app goes to background mid-handshake.
  // Polling survives background/foreground cycles; we upgrade once stable.
  transports: ['polling', 'websocket'],
  upgrade: true,

  // ── Timeouts: generous for iOS background throttling ─────────────────────
  // iOS can suspend the JS thread for 10–30s when app is backgrounded.
  // These values give the device time to wake up before we call it a disconnect.
  timeout: 30000,
  ackTimeout: 10000,

  // ── Reconnection: automatic, up to 20 attempts ───────────────────────────
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,
  randomizationFactor: 0.4,

  withCredentials: false,
});

// ── iOS Page Visibility handler ───────────────────────────────────────────────
// When iOS resumes the app from background, force a reconnect if the socket
// dropped while suspended. This fires before the user sees the "host left" toast.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Give iOS ~500ms to restore network, then reconnect if needed
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
