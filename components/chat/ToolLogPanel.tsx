'use client';

import React from 'react';
import type { ToolLogEntry } from '@/types';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ToolLogPanelProps {
  logs: ToolLogEntry[];
  isRunning?: boolean;
}

/**
 * Collapsible panel showing tool execution steps.
 * Displays each log entry with an icon, step title, and optional detail.
 */
export function ToolLogPanel({ logs, isRunning = false }: ToolLogPanelProps) {
  return (
    <div className="w-full max-w-[500px] rounded-xl border border-bg-300 dark:border-bg-300/50 overflow-hidden bg-bg-100 dark:bg-bg-200 shadow-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-bg-200 dark:border-bg-300/30 bg-bg-200 dark:bg-bg-300/30">
        {isRunning ? (
          <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        )}
        <span className="text-xs font-semibold text-text-300 uppercase tracking-wider">
          {isRunning ? 'Tool Running…' : 'Tool Execution Log'}
        </span>
        <span className="ml-auto text-xs text-text-500">{logs.length} step{logs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Log entries */}
      <div className="max-h-52 overflow-y-auto divide-y divide-bg-200 dark:divide-bg-300/20">
        {logs.map((entry, i) => (
          <LogEntry key={entry.id} entry={entry} index={i} isLast={i === logs.length - 1} isRunning={isRunning} />
        ))}
      </div>
    </div>
  );
}

function LogEntry({
  entry,
  index,
  isLast,
  isRunning,
}: {
  entry: ToolLogEntry;
  index: number;
  isLast: boolean;
  isRunning: boolean;
}) {
  const isError = entry.step.includes('❌') || entry.step.toLowerCase().includes('failed');

  return (
    <div className="flex items-start gap-2.5 px-3 py-2 text-xs">
      {/* Step indicator */}
      <div className="shrink-0 w-4 h-4 mt-0.5 flex items-center justify-center">
        {isLast && isRunning ? (
          <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
        ) : isError ? (
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium leading-snug ${isError ? 'text-red-400' : 'text-text-200'}`}>
          {entry.step}
        </p>
        {entry.detail && (
          <p className="text-text-400 mt-0.5 leading-snug truncate" title={entry.detail}>
            {entry.detail}
          </p>
        )}
      </div>

      {/* Timestamp */}
      <span className="shrink-0 text-text-500 font-mono">
        {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
}
