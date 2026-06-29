'use client';

import React, { useState } from 'react';
import type { Message, ToolLogEntry } from '@/types';
import { cn } from '@/lib/utils/cn';
import { ToolLogPanel } from './ToolLogPanel';
import {
  Globe,
  Code2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

const TOOL_ICONS = {
  browser_search: Globe,
  coding_assistant: Code2,
  deep_research: BookOpen,
} as const;

const TOOL_LABELS = {
  browser_search: 'Browser Search',
  coding_assistant: 'Coding Assistant',
  deep_research: 'Deep Research',
} as const;

/**
 * Renders a single chat message with optional tool log collapsible panel.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const [logsExpanded, setLogsExpanded] = useState(false);
  const isUser = message.role === 'user';

  const ToolIcon = message.toolUsed ? TOOL_ICONS[message.toolUsed] : null;
  const toolLabel = message.toolUsed ? TOOL_LABELS[message.toolUsed] : null;

  return (
    <div
      className={cn(
        'group flex gap-3 w-full animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1',
          isUser
            ? 'bg-accent text-white'
            : 'bg-bg-200 dark:bg-bg-300 text-text-300'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-2 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>

        {/* Tool badge */}
        {message.toolUsed && ToolIcon && (
          <button
            onClick={() => setLogsExpanded((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-200 dark:bg-bg-300 border border-bg-300 dark:border-bg-300/50 text-text-400 hover:text-text-200 transition-colors text-xs font-medium"
          >
            <ToolIcon className="w-3 h-3" />
            <span>{toolLabel}</span>
            {logsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}

        {/* Tool log panel (collapsible) */}
        {message.toolLogs && logsExpanded && (
          <ToolLogPanel logs={message.toolLogs} />
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-accent text-white rounded-tr-sm'
              : 'bg-bg-100 dark:bg-bg-200 text-text-100 dark:text-text-100 rounded-tl-sm border border-bg-200 dark:border-bg-300'
          )}
        >
          {message.isLoading ? (
            <LoadingDots />
          ) : (
            <MarkdownContent content={message.content} isUser={isUser} />
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[11px] text-text-500 opacity-0 group-hover:opacity-100 transition-opacity px-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-1 h-5">
      <span className="w-1.5 h-1.5 rounded-full bg-text-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-text-400 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-text-400 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

/**
 * Simple markdown-like renderer without external deps.
 * Handles: headings, bold, inline code, code blocks, bullet lists, numbered lists.
 */
function MarkdownContent({ content, isUser }: { content: string; isUser: boolean }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLanguage = '';
  let keyIndex = 0;

  const flushCodeBlock = () => {
    elements.push(
      <div key={`code-${keyIndex++}`} className="relative my-3 rounded-xl overflow-hidden">
        {codeLanguage && (
          <div className="flex items-center justify-between px-4 py-2 bg-bg-300 dark:bg-[#1a1a1a] text-text-400 text-xs font-mono">
            <span>{codeLanguage}</span>
          </div>
        )}
        <pre className="p-4 bg-bg-200 dark:bg-[#111] overflow-x-auto text-[13px] leading-relaxed">
          <code className="text-text-100 dark:text-text-100 font-mono whitespace-pre">
            {codeLines.join('\n')}
          </code>
        </pre>
      </div>
    );
    codeLines = [];
    codeLanguage = '';
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(<h3 key={keyIndex++} className="font-semibold text-sm mt-4 mb-1 text-text-100">{parseInline(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={keyIndex++} className="font-bold text-base mt-4 mb-1 text-text-100">{parseInline(line.slice(3))}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={keyIndex++} className="font-bold text-lg mt-4 mb-2 text-text-100">{parseInline(line.slice(2))}</h1>);
    }
    // Bullet list
    else if (line.match(/^[-*•] /)) {
      elements.push(
        <li key={keyIndex++} className="ml-4 list-disc text-sm my-0.5">
          {parseInline(line.replace(/^[-*•] /, ''))}
        </li>
      );
    }
    // Numbered list
    else if (line.match(/^\d+\. /)) {
      elements.push(
        <li key={keyIndex++} className="ml-4 list-decimal text-sm my-0.5">
          {parseInline(line.replace(/^\d+\. /, ''))}
        </li>
      );
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={keyIndex++} className="border-l-2 border-accent pl-3 my-2 text-text-300 italic text-sm">
          {parseInline(line.slice(2))}
        </blockquote>
      );
    }
    // Horizontal rule
    else if (line.match(/^---+$/)) {
      elements.push(<hr key={keyIndex++} className="border-bg-300 my-3" />);
    }
    // Empty line → spacing
    else if (line.trim() === '') {
      elements.push(<div key={keyIndex++} className="h-2" />);
    }
    // Regular paragraph
    else {
      elements.push(
        <p key={keyIndex++} className="text-sm leading-relaxed">
          {parseInline(line)}
        </p>
      );
    }
  }

  if (inCodeBlock) flushCodeBlock(); // unclosed block

  return <div className={cn('space-y-0.5', isUser ? 'text-white' : 'text-text-100')}>{elements}</div>;
}

/**
 * Parse inline markdown: **bold**, *italic*, `code`, [link](url)
 */
function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*/s);
    if (boldMatch && boldMatch.index === 0) {
      if (boldMatch[1]) parts.push(boldMatch[1]);
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Inline code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`/s);
    if (codeMatch && codeMatch.index === 0) {
      if (codeMatch[1]) parts.push(codeMatch[1]);
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-bg-300 dark:bg-bg-200 text-accent font-mono text-[12px]">
          {codeMatch[2]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^(.*?)\*(.*?)\*/s);
    if (italicMatch && italicMatch.index === 0) {
      if (italicMatch[1]) parts.push(italicMatch[1]);
      parts.push(<em key={key++}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // No more patterns — output the rest as text
    parts.push(remaining);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
