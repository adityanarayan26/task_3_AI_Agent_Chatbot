'use client';

import React, { useState } from 'react';
import { ChatSidebar } from '@/components/sidebar/ChatSidebar';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Menu, X, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Main application shell:
 * [Sidebar] | [Main Content]
 *
 * Responsive: sidebar collapses on mobile.
 */
export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-100">

      {/* ── Mobile sidebar overlay ─────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-full shrink-0 relative">
        <ChatSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />
      </div>

      {/* ── Mobile sidebar (drawer) ────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-300',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <ChatSidebar
          collapsed={false}
          onToggle={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        {/* Top bar */}
        <header className="shrink-0 flex items-center justify-between px-4 h-12 border-b border-bg-200 dark:border-bg-300/30 bg-background">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-text-400 hover:text-text-200 hover:bg-bg-200 transition-colors"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-text-100 hidden sm:block tracking-tight">
              Universal AI Agent
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-400 hover:text-text-200 hover:bg-bg-200 dark:hover:bg-bg-300 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
