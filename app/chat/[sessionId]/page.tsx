'use client';

import { use } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ChatInterface } from '@/components/chat/ChatInterface';

interface ChatSessionPageProps {
  params: Promise<{ sessionId: string }>;
}

/**
 * Per-session chat page.
 * The ChatInterface will load the session from localStorage via useChat.
 * Note: In Next.js 16, dynamic params are a Promise and must be unwrapped with `use()`.
 */
export default function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { sessionId } = use(params);

  return (
    <AppShell>
      <ChatInterface sessionId={sessionId} />
    </AppShell>
  );
}
