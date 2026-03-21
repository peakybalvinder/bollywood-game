import { useEffect, useRef } from 'react';

/**
 * Strict single-tab enforcement.
 *
 * Uses BroadcastChannel + localStorage heartbeat.
 * - Newest tab always wins ownership.
 * - Older tabs are permanently blocked with an overlay.
 * - "Use This Tab Instead" button sends a CLAIM to properly boot the other tab.
 * - Heartbeat every 2s keeps the active tab's ownership fresh.
 */

const TAB_ID = Math.random().toString(36).slice(2);
const LS_KEY = 'filmipaheli_active_tab';

// Expose channel globally so App.jsx can send CLAIM when user clicks
// "Use This Tab Instead" without going through React state
let _channel = null;

export function reclaimTab() {
  localStorage.setItem(LS_KEY, TAB_ID);
  _channel?.postMessage({ type: 'CLAIM', tabId: TAB_ID });
}

export default function useSingleSession(onBlocked) {
  const blockedRef = useRef(false);

  useEffect(() => {
    if (!window.BroadcastChannel) return;

    const channel = new BroadcastChannel('filmipaheli_tab');
    _channel = channel;

    // Claim ownership immediately on mount
    localStorage.setItem(LS_KEY, TAB_ID);
    channel.postMessage({ type: 'CLAIM', tabId: TAB_ID });

    function handleMessage(e) {
      if (e.data?.tabId === TAB_ID) return; // own message

      if (e.data?.type === 'CLAIM' || e.data?.type === 'PING') {
        // Another tab is active — block this one
        if (!blockedRef.current) {
          blockedRef.current = true;
          onBlocked?.();
        }
      }
    }

    channel.addEventListener('message', handleMessage);

    // Heartbeat every 2s — keeps ownership alive
    const heartbeat = setInterval(() => {
      if (!blockedRef.current) {
        localStorage.setItem(LS_KEY, TAB_ID);
        channel.postMessage({ type: 'PING', tabId: TAB_ID });
      }
    }, 2000);

    // Storage event fallback for browsers without BroadcastChannel cross-tab support
    function onStorage(e) {
      if (e.key === LS_KEY && e.newValue && e.newValue !== TAB_ID) {
        if (!blockedRef.current) {
          blockedRef.current = true;
          onBlocked?.();
        }
      }
    }
    window.addEventListener('storage', onStorage);

    return () => {
      clearInterval(heartbeat);
      channel.removeEventListener('message', handleMessage);
      channel.close();
      _channel = null;
      window.removeEventListener('storage', onStorage);
      if (localStorage.getItem(LS_KEY) === TAB_ID) {
        localStorage.removeItem(LS_KEY);
      }
    };
  }, [onBlocked]);
}
