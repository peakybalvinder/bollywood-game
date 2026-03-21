import React, { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../socket';
import clsx from 'clsx';

const EMOJIS = ['😂','🎬','🎭','🤔','👏','🔥','❤️','😍','🤣','😎','🙌','💯','🎉','😱','👀','🎵','🙏','😅','🤩','🥳'];

export default function ChatPanel({ myId, playerName }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  // Keep a stable ref to the handler so we always remove the exact same function
  const handlerRef = useRef(null);

  useEffect(() => {
    // Register with a named, stable reference so it never gets accidentally
    // removed by GamePage's socket.off('chat_message', specificHandler) calls.
    // Using a ref ensures the exact same function is both added and removed.
    function onChatMessage(msg) {
      setMessages(prev => [...prev, msg]);
    }
    handlerRef.current = onChatMessage;

    socket.on('chat_message', onChatMessage);

    return () => {
      // Remove only our specific handler — never removes other listeners
      socket.off('chat_message', onChatMessage);
    };
  }, []); // empty deps — only register once, never re-register

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    socket.emit('chat_message', { message: text });
    setInput('');
    setShowEmoji(false);
    inputRef.current?.focus();
  }, [input]);

  function insertEmoji(emoji) {
    setInput(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  }

  return (
    <div className="h-full flex flex-col bg-ink-800 border border-ink-700 rounded-none">

      {/* Header */}
      <div className="px-4 py-3 border-b border-ink-600 flex items-center gap-2 shrink-0">
        <span className="text-lg">💬</span>
        <span className="font-display font-semibold text-gold-400 text-sm tracking-wide">Party Chat</span>
        <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live" />
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-gold-800 text-xs text-center mt-8 font-body italic">
            No messages yet. Say something! 👋
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.playerId === myId;
          return (
            <div key={msg.id} className={clsx('flex flex-col', isMe ? 'items-end' : 'items-start')}>
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

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-3 py-2 border-t border-ink-600 bg-ink-900 flex flex-wrap gap-2 shrink-0">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => insertEmoji(e)}
              className="text-xl hover:scale-125 transition-transform duration-100 select-none"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-ink-600 flex gap-2 shrink-0">
        <button
          onClick={() => setShowEmoji(v => !v)}
          className={clsx(
            'text-xl shrink-0 transition-colors select-none',
            showEmoji ? 'text-gold-400' : 'text-gold-700 hover:text-gold-500'
          )}
          title="Emoji"
        >
          😊
        </button>
        <input
          ref={inputRef}
          className="input-dark text-sm py-2 flex-1"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
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
