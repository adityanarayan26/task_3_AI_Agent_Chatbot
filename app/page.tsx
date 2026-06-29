'use client';

import { AppShell } from '@/components/layout/AppShell';
import { ChatInterface } from '@/components/chat/ChatInterface';

/**
 * Home page — full chat UI wrapped in the app shell.
 */
export default function HomePage() {
  return (
    <AppShell>
      <ChatInterface />
    </AppShell>
  );
}
