"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import ClaudeChatInput, { AttachedFile } from '@/components/ui/claude-style-chat-input';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { handleChatRequest } from '@/app/actions';
import { Loader2, PanelLeftOpen } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: any[];
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auth Redirect Guard
  useEffect(() => {
    // Give auth state a moment to load from localStorage/Supabase
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.push('/auth');
      } else {
        setAuthChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  // Load chat sessions from Supabase with fallback to localStorage
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    async function loadSessionsFromSupabase() {
      if (!isSupabaseConfigured || !supabase) {
        loadFromLocalStorage();
        return;
      }

      try {
        // 1. Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (sessionsError) throw sessionsError;

        if (!sessionsData || sessionsData.length === 0) {
          // Create initial session in Supabase
          const initialId = Math.random().toString(36).substring(2, 9);
          const { error: createError } = await supabase
            .from('chat_sessions')
            .insert({ id: initialId, title: 'New Conversation', user_id: user.id });

          if (createError) throw createError;

          const initialSession: ChatSession = {
            id: initialId,
            title: 'New Conversation',
            messages: []
          };
          setSessions([initialSession]);
          setActiveSessionId(initialId);
          return;
        }

        // 2. Fetch messages for these sessions
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .in('session_id', sessionsData.map(s => s.id))
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // 3. Assemble chat sessions with messages
        const assembledSessions: ChatSession[] = sessionsData.map(s => {
          const sessionMsgs = (messagesData || [])
            .filter(m => m.session_id === s.id)
            .map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              steps: typeof m.steps === 'string' ? JSON.parse(m.steps) : m.steps
            }));

          return {
            id: s.id,
            title: s.title,
            messages: sessionMsgs
          };
        });

        setSessions(assembledSessions);
        setActiveSessionId(assembledSessions[0].id);

      } catch (err: any) {
        console.warn('Failed to load from Supabase (falling back to localStorage):', err.message);
        loadFromLocalStorage();
      }
    }

    function loadFromLocalStorage() {
      try {
        const saved = localStorage.getItem('agent_chat_sessions');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSessions(parsed);
          if (parsed.length > 0) {
            setActiveSessionId(parsed[0].id);
          } else {
            createInitialLocalSession();
          }
        } else {
          createInitialLocalSession();
        }
      } catch (err) {
        console.error('Failed to load from localStorage:', err);
      }
    }

    function createInitialLocalSession() {
      const initialId = Math.random().toString(36).substring(2, 9);
      const initialSession: ChatSession = {
        id: initialId,
        title: 'New Conversation',
        messages: []
      };
      setSessions([initialSession]);
      setActiveSessionId(initialId);
    }

    loadSessionsFromSupabase();
  }, [isAuthenticated, user]);

  // Save sessions to localStorage when they change
  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('agent_chat_sessions', JSON.stringify(updatedSessions));
  };

  const handleCreateSession = async () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      messages: []
    };
    saveSessions([newSession, ...sessions]);
    setActiveSessionId(newId);

    // Sync to Supabase
    if (isSupabaseConfigured && supabase && user) {
      try {
        await supabase
          .from('chat_sessions')
          .insert({ id: newId, title: 'New Conversation', user_id: user.id });
      } catch (err: any) {
        console.warn('Failed to sync new session to Supabase:', err.message);
      }
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleSendMessage = async (data: {
    message: string;
    files: AttachedFile[];
    pastedContent: any[];
    isThinkingEnabled: boolean;
    selectedModel: 'gemini' | 'openrouter';
  }) => {
    if (!activeSessionId) return;

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;

    // Create the user message object
    const userMsgId = Math.random().toString(36).substring(2, 9);
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: data.message
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    
    // Determine if we need to update session title in Supabase/local
    const shouldRename = currentSession.title === 'New Conversation';
    const newTitle = shouldRename
      ? data.message.length > 30 ? data.message.substring(0, 30) + '...' : data.message
      : currentSession.title;

    // Update session list locally with user message
    const updatedSessions = sessions.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, title: newTitle, messages: updatedMessages };
      }
      return s;
    });

    saveSessions(updatedSessions);
    setIsLoading(true);

    // Sync user message to Supabase
    if (isSupabaseConfigured && supabase && user) {
      try {
        if (shouldRename) {
          await supabase
            .from('chat_sessions')
            .update({ title: newTitle })
            .eq('id', activeSessionId);
        }
        await supabase
          .from('messages')
          .insert({
            id: userMsgId,
            session_id: activeSessionId,
            role: 'user',
            content: data.message,
            steps: []
          });
      } catch (err: any) {
        console.warn('Failed to sync user message to Supabase:', err.message);
      }
    }

    try {
      // Send history and current message to server action
      const response = await handleChatRequest(
        data.message,
        currentSession.messages, // pass current history
        data.isThinkingEnabled,
        data.selectedModel,
        data.files.map(f => ({ name: f.file.name, type: f.type, base64: f.base64 }))
      );

      // Create assistant response message object
      const assistantMsgId = Math.random().toString(36).substring(2, 9);
      const assistantMsg: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: response.response,
        steps: response.steps
      };

      const finalMessages = [...updatedMessages, assistantMsg];

      // Update sessions list with assistant response
      const finalSessions = sessions.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, title: newTitle, messages: finalMessages };
        }
        return s;
      });

      saveSessions(finalSessions);

      // Sync assistant message to Supabase
      if (isSupabaseConfigured && supabase && user) {
        try {
          await supabase
            .from('messages')
            .insert({
              id: assistantMsgId,
              session_id: activeSessionId,
              role: 'assistant',
              content: response.response,
              steps: response.steps || []
            });
        } catch (err: any) {
          console.warn('Failed to sync assistant response to Supabase:', err.message);
        }
      }
    } catch (err: any) {
      console.error('Failed to get chat response:', err);
      // Append error message to chat window
      const errorMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: `Error: Failed to process request. Details: ${err.message}`
      };
      
      const finalSessions = sessions.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...updatedMessages, errorMsg] };
        }
        return s;
      });
      saveSessions(finalSessions);
    } finally {
      setIsLoading(false);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Render authentic loading screen during auth routing check
  if (authChecking) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
        <p className="text-zinc-400 text-sm font-medium">Checking authorization session...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#141018] overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(true)}
      />

      {/* Main Chat Area Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Floating Expand Sidebar Button */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="absolute top-4 left-4 z-30 p-2.5 bg-[#1C1622] border border-[#382C43] rounded-xl text-[#C4B9D0] hover:bg-[#261E2E] hover:text-white transition-all shadow-md cursor-pointer active:scale-95 flex items-center justify-center"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        {/* Chat Messages Stream */}
        <ChatWindow
          messages={activeSession ? activeSession.messages : []}
          isLoading={isLoading}
        />

        {/* Floating Bottom Input Control Bar */}
        <div className="w-full bg-linear-to-t from-zinc-50 dark:from-zinc-900 via-zinc-50/90 dark:via-zinc-900/90 to-transparent p-4 md:p-6 shrink-0 relative z-20">
          <ClaudeChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
