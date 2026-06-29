'use client';

import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  MessageSquarePlus,
  Trash2,
  LogOut,
  LogIn,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';

interface ChatSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Left sidebar: new chat, session list with search, auth controls.
 */
export function ChatSidebar({ collapsed, onToggle }: ChatSidebarProps) {
  const { sessions, activeSessionId, loadSession, deleteSession, createNewSession, clearAllSessions } =
    useChat();
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = () => {
    createNewSession();
    router.push('/');
  };

  const handleSelectSession = (id: string) => {
    loadSession(id);
    router.push('/');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
  };

  const handleClearAll = () => {
    if (confirmClear) {
      clearAllSessions();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-bg-100 dark:bg-bg-100 border-r border-bg-200 dark:border-bg-300/40 transition-all duration-300 ease-in-out overflow-hidden',
        collapsed ? 'w-0 border-r-0' : 'w-64'
      )}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 z-20 w-6 h-6 rounded-full bg-bg-200 dark:bg-bg-300 border border-bg-300 dark:border-bg-300/50 flex items-center justify-center text-text-400 hover:text-text-200 shadow-sm transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className={cn('flex flex-col h-full', collapsed && 'invisible')}>
        {/* Header */}
        <div className="p-3 border-b border-bg-200 dark:border-bg-300/30 shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 hover:border-accent/40 transition-all duration-150 font-medium text-sm"
          >
            <MessageSquarePlus className="w-4 h-4 shrink-0" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search */}
        {sessions.length > 3 && (
          <div className="px-3 py-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats…"
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg bg-bg-200 dark:bg-bg-200 border border-bg-300 dark:border-bg-300/40 text-text-200 placeholder:text-text-500 outline-none focus:border-accent/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-400 hover:text-text-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-text-500 text-xs px-4">
              <MessageSquare className="w-6 h-6 mb-2 opacity-40" />
              <p>No chats yet</p>
              <p className="mt-1 opacity-70">Start a conversation above</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <p className="text-center text-text-500 text-xs py-4">No matching chats</p>
          ) : (
            <div className="space-y-0.5">
              {/* Group: Today / Yesterday / Older */}
              {filteredSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  id={session.id}
                  title={session.title}
                  isActive={session.id === activeSessionId}
                  messageCount={session.messages.length}
                  updatedAt={session.updatedAt}
                  onSelect={handleSelectSession}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-bg-200 dark:border-bg-300/30 shrink-0 space-y-1.5">
          {sessions.length > 0 && (
            <button
              onClick={handleClearAll}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-150',
                confirmClear
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'text-text-400 hover:text-text-200 hover:bg-bg-200 dark:hover:bg-bg-200'
              )}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>{confirmClear ? 'Click again to confirm' : 'Clear all chats'}</span>
            </button>
          )}

          {isAuthenticated ? (
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-400 hover:text-text-200 hover:bg-bg-200 dark:hover:bg-bg-200 transition-all"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>Sign out</span>
            </button>
          ) : (
            <button
              onClick={() => router.push('/auth')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-accent hover:bg-accent/10 transition-all"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// ── Session Item ──────────────────────────────────────────────────────────────

interface SessionItemProps {
  id: string;
  title: string;
  isActive: boolean;
  messageCount: number;
  updatedAt: Date;
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

function SessionItem({ id, title, isActive, messageCount, updatedAt, onSelect, onDelete }: SessionItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(id)}
      onKeyDown={handleKeyDown}
      className={cn(
        'group w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        isActive
          ? 'bg-accent/10 text-text-100 border border-accent/20'
          : 'text-text-300 hover:bg-bg-200 dark:hover:bg-bg-200 hover:text-text-200 border border-transparent'
      )}
    >
      <MessageSquare className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', isActive ? 'text-accent' : 'text-text-400')} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-snug">{title}</p>
        <p className="text-[10px] text-text-500 mt-0.5">
          {messageCount} message{messageCount !== 1 ? 's' : ''} · {relativeTime(updatedAt)}
        </p>
      </div>

      <button
        onClick={(e) => onDelete(e, id)}
        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-text-500 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
        aria-label="Delete chat"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
