import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket = io(SOCKET_URL, {
  autoConnect: false,

  // ── Transports ──────────────────────────────────────────────────────────
  // MUST start with polling first.
  // Safari blocks WebSocket upgrades from HTTPS pages to non-standard origins.
  // Starting on XHR polling (which uses normal HTTP) works on all browsers,
  // then Engine.IO silently upgrades to WebSocket when it's safe to do so.
  transports: ['polling', 'websocket'],

  // ── Reconnection — handles weak WiFi and mobile data drops ─────────────
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  randomizationFactor: 0.5,

  // ── Timeouts ────────────────────────────────────────────────────────────
  timeout: 45000,      // 45s initial connection timeout (covers slow 3G)
  ackTimeout: 15000,   // 15s for emit acknowledgements

  // ── Keep-alive ──────────────────────────────────────────────────────────
  // Sends a heartbeat every 25s. If no pong in 20s, reconnect.
  // Prevents silent disconnections on mobile when screen locks.
  pingInterval: 25000,
  pingTimeout: 20000,

  // ── Safari / iOS specific ───────────────────────────────────────────────
  // Disable credentials — avoids Safari's strict SameSite cookie rejection
  withCredentials: false,

  // ── Upgrade strategy ────────────────────────────────────────────────────
  // After connecting via polling, attempt WebSocket upgrade after 500ms
  // giving the initial handshake time to complete.
  upgrade: true,
  rememberUpgrade: false, // Don't cache upgrade — re-test each session
});

export default socket;
