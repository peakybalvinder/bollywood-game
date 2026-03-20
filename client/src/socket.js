import { io } from 'socket.io-client';

// ── Server URL resolution ─────────────────────────────────────────────────────
// VITE_SERVER_URL is baked in at build time.
// If it ends up wrong (e.g. old Railway URL was disabled), the app falls
// back to same-origin which works if client and server are on the same domain.
const BAKED_URL  = import.meta.env.VITE_SERVER_URL || '';
const SAME_ORIGIN = window.location.origin; // e.g. https://www.filmipaheli.com

// Use the baked URL if it looks valid and different from current origin,
// otherwise fall back to same-origin (useful when client/server share a domain).
export const SOCKET_URL =
  BAKED_URL && BAKED_URL !== SAME_ORIGIN
    ? BAKED_URL
    : SAME_ORIGIN;

console.log('[FilmiPaheli] VITE_SERVER_URL (baked):', BAKED_URL || '(not set)');
console.log('[FilmiPaheli] Connecting to:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  // polling first — works on ALL browsers including Safari
  transports: ['polling', 'websocket'],
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.3,
  withCredentials: false,
});

export default socket;
