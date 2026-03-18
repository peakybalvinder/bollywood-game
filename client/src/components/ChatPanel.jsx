import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import clsx from 'clsx';

export default function ChatPanel({ myId, playerName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const bottomRef               = useRef(null);

  useEffect(() => {
    function onMessage(msg) {
      setMessages((prev) => [...prev, msg]);
    }
    socket.on('chat_message', onMessage);
    return () => socket.off('chat_message', onMessage);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    socket.emit('chat_message', { message: text });
    setInput('');
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  return (
    /*
      The parent <aside> has overflow-hidden and is a flex column child.
      This component must fill it exactly and scroll ONLY its message list.

      Structure:
        div.h-full.flex-col          ← fills the aside completely
          ├── header (shrink-0)      ← fixed height
          ├── messages (flex-1 overflow-y-auto min-h-0)  ← ONLY this scrolls
          └── input (shrink-0)       ← fixed height
    */
    <div className="h-full flex flex-col bg-ink-800 border border-ink-700 rounded-none">

      {/* Header */}
      <div className="px-4 py-3 border-b border-ink-600 flex items-center gap-2 shrink-0">
        <span className="text-lg">💬</span>
        <span className="font-display font-semibold text-gold-400 text-sm tracking-wide">Party Chat</span>
        <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live" />
      </div>

      {/* Messages — the ONLY scrollable section */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gold-800 text-xs text-center mt-8 font-body italic">
            No messages yet. Say something!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.playerId === myId;
          return (
            <div
              key={msg.id}
              className={clsx('flex flex-col', isMe ? 'items-end' : 'items-start')}
            >
              <div className="flex items-center gap-2 mb-1">
                {!isMe && <span className="text-gold-600 text-xs font-semibold">{msg.playerName}</span>}
                <span className="text-gold-800 text-xs">{formatTime(msg.timestamp)}</span>
                {isMe && <span className="text-gold-500 text-xs font-semibold">You</span>}
              </div>
              <div className={clsx(
                'max-w-[85%] rounded-xl px-3 py-2 text-sm font-body break-words leading-relaxed',
                isMe
                  ? 'bg-gold-900 border border-gold-800 text-gold-200 rounded-br-sm'
                  : 'bg-ink-700 border border-ink-600 text-gold-300 rounded-bl-sm'
              )}>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input — fixed at bottom */}
      <div className="px-3 py-3 border-t border-ink-600 flex gap-2 shrink-0">
        <input
          className="input-dark text-sm py-2"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          maxLength={300}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="btn-crimson px-4 py-2 text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
