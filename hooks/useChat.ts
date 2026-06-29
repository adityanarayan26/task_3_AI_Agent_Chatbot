'use client';

import { useState, useCallback, useRef } from 'react';
import type { Message, ChatSession, ChatRequest, ChatResponse, ToolName } from '@/types';

const STORAGE_KEY = 'ai_agent_sessions';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    // Rehydrate Date objects
    return parsed.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
      messages: s.messages.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })),
    }));
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Storage quota exceeded — ignore
  }
}

/**
 * Core chat state hook.
 * Manages messages, sessions (localStorage), loading state, and API calls.
 */
export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolName | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Derive active messages
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  // ── Session Management ───────────────────────────────────────────────────────

  const createNewSession = useCallback((): string => {
    const id = generateId();
    const newSession: ChatSession = {
      id,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions((prev) => {
      const updated = [newSession, ...prev];
      saveSessions(updated);
      return updated;
    });
    setActiveSessionId(id);
    return id;
  }, []);

  const loadSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      saveSessions(updated);
      return updated;
    });
    setActiveSessionId((prev) => {
      if (prev === sessionId) return null;
      return prev;
    });
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setActiveSessionId(null);
    saveSessions([]);
  }, []);

  // ── Message helpers ───────────────────────────────────────────────────────────

  const addMessageToSession = useCallback(
    (sessionId: string, message: Message) => {
      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== sessionId) return s;
          const newMessages = [...s.messages, message];
          // Auto-generate title from first user message
          const title =
            s.messages.length === 0 && message.role === 'user'
              ? message.content.slice(0, 50).trim() + (message.content.length > 50 ? '…' : '')
              : s.title;
          return { ...s, messages: newMessages, title, updatedAt: new Date() };
        });
        saveSessions(updated);
        return updated;
      });
    },
    []
  );

  const updateLastAssistantMessage = useCallback(
    (sessionId: string, update: Partial<Message>) => {
      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== sessionId) return s;
          const msgs = [...s.messages];
          const lastAssistantIdx = msgs.map((m) => m.role).lastIndexOf('assistant');
          if (lastAssistantIdx === -1) return s;
          msgs[lastAssistantIdx] = { ...msgs[lastAssistantIdx], ...update };
          return { ...s, messages: msgs, updatedAt: new Date() };
        });
        saveSessions(updated);
        return updated;
      });
    },
    []
  );

  // ── Send Message ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Capture history BEFORE state updates to avoid stale closure issues
      let sessionId = activeSessionId;
      let priorMessages: { role: string; content: string }[] = [];

      if (!sessionId) {
        sessionId = generateId();
        const newSession: ChatSession = {
          id: sessionId,
          title: content.slice(0, 50).trim() + (content.length > 50 ? '…' : ''),
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setSessions((prev) => {
          const updated = [newSession, ...prev];
          saveSessions(updated);
          return updated;
        });
        setActiveSessionId(sessionId);
      } else {
        // Snapshot current session messages NOW (before async updates)
        setSessions((prev) => {
          const session = prev.find((s) => s.id === sessionId);
          priorMessages = (session?.messages ?? [])
            .filter((m) => !m.isLoading)
            .map((m) => ({ role: m.role, content: m.content }));
          return prev; // no change, just reading
        });
      }

      // 1. Add user message
      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content,
        createdAt: new Date(),
      };
      addMessageToSession(sessionId, userMsg);

      // 2. Add placeholder assistant message
      const loadingMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        createdAt: new Date(),
        isLoading: true,
      };
      addMessageToSession(sessionId, loadingMsg);

      setIsLoading(true);
      setActiveTool(null);

      // 3. Build conversation history for API (using snapshot taken above)
      const historyMessages = [
        ...priorMessages,
        { role: 'user', content },
      ] as { role: 'user' | 'assistant' | 'system'; content: string }[];

      const requestBody: ChatRequest = { messages: historyMessages, sessionId };

      abortRef.current = new AbortController();

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: abortRef.current.signal,
        });

        const data: ChatResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? `Server returned ${response.status}`);
        }

        if (data.toolUsed) setActiveTool(data.toolUsed);

        // 4. Update placeholder with real response
        updateLastAssistantMessage(sessionId, {
          content: data.text,
          isLoading: false,
          toolUsed: data.toolUsed,
          toolLogs: data.toolLogs,
        });
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          updateLastAssistantMessage(sessionId, {
            content: '_Request cancelled._',
            isLoading: false,
          });
        } else {
          const message = err instanceof Error ? err.message : 'Unknown error';
          updateLastAssistantMessage(sessionId, {
            content: `⚠️ **Error**: ${message}`,
            isLoading: false,
          });
        }
      } finally {
        setIsLoading(false);
        setActiveTool(null);
        abortRef.current = null;
      }
    },
    [activeSessionId, isLoading, addMessageToSession, updateLastAssistantMessage]
  );

  const cancelRequest = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    // State
    sessions,
    activeSession,
    activeSessionId,
    messages,
    isLoading,
    activeTool,
    // Actions
    sendMessage,
    cancelRequest,
    createNewSession,
    loadSession,
    deleteSession,
    clearAllSessions,
  };
}
