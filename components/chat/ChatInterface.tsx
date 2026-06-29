'use client';

import React, { useRef, useEffect, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ClaudeChatInput } from '@/components/ui/claude-style-chat-input';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Globe, Code2, BookOpen, Loader2, X } from 'lucide-react';
import type { ToolName } from '@/types';

interface ChatInterfaceProps {
  sessionId?: string;
}

const TOOL_LABELS: Record<ToolName, string> = {
  browser_search: 'Browsing the web…',
  coding_assistant: 'Writing code…',
  deep_research: 'Researching…',
};

const TOOL_ICONS: Record<ToolName, React.ReactNode> = {
  browser_search: <Globe className="w-4 h-4" />,
  coding_assistant: <Code2 className="w-4 h-4" />,
  deep_research: <BookOpen className="w-4 h-4" />,
};

const GREETING_PROMPTS = [
  { label: 'Write', icon: '✍️', prompt: 'Help me write a professional email' },
  { label: 'Search', icon: '🌐', prompt: 'What are the latest developments in AI?' },
  { label: 'Code', icon: '💻', prompt: 'Write a Python web scraper' },
  { label: 'Research', icon: '🔬', prompt: 'Research the impact of climate change on agriculture' },
];

/**
 * Full chat interface — handles empty state (greeting), message list, and input.
 */
export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const {
    messages,
    isLoading,
    activeTool,
    sendMessage,
    cancelRequest,
    loadSession,
    activeSessionId,
  } = useChat();

  const { isAuthenticated, setRedirectPath } = useAuth();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputKey, setInputKey] = useState(0);

  // Load session if provided
  useEffect(() => {
    if (sessionId && sessionId !== activeSessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, activeSessionId, loadSession]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (data: {
    message: string;
    files: any[];
    pastedContent: any[];
    isThinkingEnabled: boolean;
  }) => {
    if (!data.message.trim()) return;

    if (!isAuthenticated) {
      setRedirectPath('/');
      router.push('/auth');
      return;
    }

    sendMessage(data.message);
    setInputKey((k) => k + 1); // force input reset
  };

  const handlePromptClick = (prompt: string) => {
    if (!isAuthenticated) {
      setRedirectPath('/');
      router.push('/auth');
      return;
    }
    sendMessage(prompt);
  };

  const isEmpty = messages.length === 0;
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex flex-col h-full w-full relative">

      {isEmpty ? (
        /* ── Empty State / Greeting ─────────────────────────────────────── */
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 animate-fade-in">
          <div className="w-full max-w-3xl flex flex-col items-center">
            {/* Logo */}
            <div className="w-20 h-20 mb-6 flex items-center justify-center">
              <img src="https://4say.site/claude.png" alt="AI Agent Logo" className="w-full h-full object-contain" />
            </div>

            {/* Greeting */}
            <h1 className="text-3xl sm:text-4xl font-serif font-light text-text-200 mb-8 tracking-tight text-center">
              {greeting},{' '}
              <span className="relative inline-block pb-2">
                Saify
                <svg
                  className="absolute w-[140%] h-[20px] -bottom-1 left-[-5%] text-accent"
                  viewBox="0 0 140 24"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 16 Q 70 24, 134 14"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
            </h1>

            {/* Chat Input */}
            <div className="w-full mb-6">
              <ClaudeChatInput key={`input-${inputKey}`} onSendMessage={handleSend} />
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap justify-center gap-2">
              {GREETING_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePromptClick(p.prompt)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-text-300 bg-bg-100 dark:bg-bg-200 border border-bg-300 dark:border-bg-300/50 rounded-full hover:bg-bg-200 dark:hover:bg-bg-300 hover:text-text-200 transition-all duration-150 shadow-sm"
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Active Chat ───────────────────────────────────────────────── */
        <>
          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}

              {/* Active tool indicator */}
              {isLoading && activeTool && (
                <div className="flex items-center gap-2 text-sm text-text-400 animate-fade-in pl-11">
                  <span className="text-accent">{TOOL_ICONS[activeTool]}</span>
                  <span>{TOOL_LABELS[activeTool]}</span>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                  <button
                    onClick={cancelRequest}
                    className="ml-2 flex items-center gap-1 text-xs text-text-500 hover:text-text-300 transition-colors"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Sticky input */}
          <div className="border-t border-bg-200 dark:border-bg-300/30 bg-background px-4 pt-4 pb-6">
            <div className="max-w-3xl mx-auto">
              <ClaudeChatInput key={`input-active-${inputKey}`} onSendMessage={handleSend} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
