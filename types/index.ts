// ─── Tool Names ────────────────────────────────────────────────────────────────
export type ToolName = 'browser_search' | 'coding_assistant' | 'deep_research';

// ─── Tool Call / Result ─────────────────────────────────────────────────────────
export interface ToolCall {
  name: ToolName;
  args: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
  tool: ToolName;
  durationMs: number;
}

// ─── Tool Log Entry (for UI panel) ─────────────────────────────────────────────
export interface ToolLogEntry {
  id: string;
  timestamp: Date;
  step: string;
  detail?: string;
}

// ─── Messages ──────────────────────────────────────────────────────────────────
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  // Optional: populated for assistant messages that used a tool
  toolUsed?: ToolName;
  toolLogs?: ToolLogEntry[];
  isLoading?: boolean;
}

// ─── Chat Session ───────────────────────────────────────────────────────────────
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── API Request / Response ─────────────────────────────────────────────────────
export interface ChatRequest {
  messages: Pick<Message, 'role' | 'content'>[];
  sessionId?: string;
}

export interface ChatResponse {
  text: string;
  toolUsed?: ToolName;
  toolLogs?: ToolLogEntry[];
  error?: string;
}

// ─── Browser Tool ───────────────────────────────────────────────────────────────
export interface BrowserSearchArgs {
  query: string;
}

export interface BrowserScrapeResult {
  url: string;
  title: string;
  headings: string[];
  paragraphs: string[];
  links: { text: string; href: string }[];
  meta?: Record<string, string>;
}

// ─── Coding Tool ────────────────────────────────────────────────────────────────
export interface CodingArgs {
  task: string;
  language?: string;
  code?: string;
}

// ─── Deep Research Tool ─────────────────────────────────────────────────────────
export interface DeepResearchArgs {
  topic: string;
}

export interface DeepResearchResult {
  topic: string;
  summary: string;
  sections: { title: string; content: string }[];
  sources: { title: string; url: string; snippet: string }[];
}
