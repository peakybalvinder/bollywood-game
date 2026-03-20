import React from 'react';
import clsx from 'clsx';

const TABS = [
  { id: 'game',    label: 'Game',    icon: '🎯' },
  { id: 'players', label: 'Players', icon: '👥' },
  { id: 'chat',    label: 'Chat',    icon: '💬' },
];

export default function MobileNav({ activeTab, onTabChange, unreadChat = 0 }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-ink-900 border-t border-ink-700 flex">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={clsx(
            'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-body transition-all duration-150',
            activeTab === tab.id
              ? 'text-gold-400 border-t-2 border-gold-500 bg-ink-800'
              : 'text-gold-700 border-t-2 border-transparent hover:text-gold-500',
          )}
        >
          <span className="text-lg leading-none relative">
            {tab.icon}
            {tab.id === 'chat' && unreadChat > 0 && (
              <span className="absolute -top-1 -right-2 bg-crimson-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadChat > 9 ? '9+' : unreadChat}
              </span>
            )}
          </span>
          <span className="leading-none">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
