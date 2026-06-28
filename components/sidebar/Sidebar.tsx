import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, MessageSquare, Plus, User, Bot, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  sessions: { id: string; title: string }[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    // Initial check on mount
    const isDarkTheme = document.documentElement.classList.contains('dark') || 
                        localStorage.getItem('theme') === 'dark' ||
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(isDarkTheme);
    if (isDarkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <aside className="w-80 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col p-4 font-sans select-none shrink-0 text-zinc-300">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 border-b border-zinc-900 mb-4">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">Agentic AI</h2>
          <p className="text-[10px] text-zinc-500">Universal Reasoning Engine</p>
        </div>
      </div>

      {/* New Chat Button */}
      <button
        onClick={onCreateSession}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 hover:border-zinc-700 active:scale-98 transition-all cursor-pointer shadow-sm mb-4"
      >
        <Plus className="w-4 h-4" />
        <span>New Conversation</span>
      </button>

      {/* Conversation Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin px-1">
        <div className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider px-2 mb-2">
          History
        </div>
        {sessions.length === 0 ? (
          <div className="text-xs text-zinc-600 px-2 py-4 italic text-center">
            No chats saved yet
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all cursor-pointer group
                ${activeSessionId === session.id
                  ? 'bg-zinc-900 text-white border-l-2 border-accent font-medium'
                  : 'hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                }
              `}
            >
              <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${activeSessionId === session.id ? 'text-accent' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
              <span className="truncate flex-1">{session.title}</span>
            </button>
          ))
        )}
      </div>

      {/* User Footer Profile */}
      <div className="mt-auto border-t border-zinc-900 pt-4 px-1 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[11px] text-zinc-500 truncate" title={user?.email}>
              {user?.email || 'offline@agent.local'}
            </p>
          </div>
        </div>

        {/* Toggle Theme Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 shrink-0 text-amber-400" /> : <Moon className="w-4 h-4 shrink-0 text-indigo-400" />}
          <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
