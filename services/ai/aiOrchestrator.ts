import { reasonAndSelectTool, synthesizeResponse } from './aiService';
import {
  openRouterReasonAndSelectTool,
  openRouterSynthesizeResponse,
} from './openRouterService';
import type { ToolCall, ToolLogEntry, ChatResponse, ToolName } from '@/types';

type ConversationMessage = { role: 'user' | 'assistant' | 'system'; content: string };

// HTTP status codes that should trigger an OpenRouter fallback
const FALLBACK_TRIGGERS = [429, 503, 500, 502, 504];

function shouldFallback(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('rate limit') || msg.includes('quota') || msg.includes('unavailable')) {
      return true;
    }
    // Check for HTTP status codes in the error message
    if (FALLBACK_TRIGGERS.some((code) => msg.includes(String(code)))) return true;
  }
  return false;
}

function makeLogEntry(step: string, detail?: string): ToolLogEntry {
  return { id: crypto.randomUUID(), timestamp: new Date(), step, detail };
}

/**
 * Core agentic loop:
 *   1. Reason + select tool (Gemini → fallback OpenRouter)
 *   2. Execute tool (if selected)
 *   3. Synthesize final response (Gemini → fallback OpenRouter)
 *
 * Returns a ChatResponse with text, optional toolUsed, and toolLogs for the UI.
 */
export async function runAgentLoop(
  messages: ConversationMessage[],
  executeTool: (toolCall: ToolCall, logs: ToolLogEntry[]) => Promise<unknown>
): Promise<ChatResponse> {
  const logs: ToolLogEntry[] = [];
  let useOpenRouter = false;

  // ── Step 1: Reason & Select Tool ─────────────────────────────────────────
  logs.push(makeLogEntry('🧠 Reasoning...', 'Analysing your request'));

  let toolCall: ToolCall | null = null;
  let directText: string | null = null;

  try {
    ({ toolCall, directText } = await reasonAndSelectTool(messages));
    logs.push(makeLogEntry('✅ Primary AI (Gemini)', 'Intent analysis complete'));
  } catch (err) {
    if (shouldFallback(err)) {
      logs.push(makeLogEntry('⚠️ Gemini unavailable', 'Switching to OpenRouter fallback'));
      useOpenRouter = true;
      try {
        ({ toolCall, directText } = await openRouterReasonAndSelectTool(messages));
        logs.push(makeLogEntry('✅ Fallback AI (OpenRouter)', 'Intent analysis complete'));
      } catch (fallbackErr) {
        const msg = fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error';
        return {
          text: `I'm sorry, both AI services are currently unavailable. Please check your API keys and try again.\n\nError: ${msg}`,
          error: msg,
        };
      }
    } else {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return { text: `An error occurred while processing your request: ${msg}`, error: msg };
    }
  }

  // ── Direct Response (no tool needed) ──────────────────────────────────────
  if (!toolCall) {
    logs.push(makeLogEntry('💬 Direct response', 'No tool required'));
    return {
      text: directText ?? 'I was unable to generate a response.',
      toolLogs: logs,
    };
  }

  // ── Step 2: Execute Tool ───────────────────────────────────────────────────
  logs.push(makeLogEntry(`🔧 Tool selected: ${toolCall.name}`, JSON.stringify(toolCall.args)));

  let toolResult: unknown;
  try {
    toolResult = await executeTool(toolCall, logs);
    logs.push(makeLogEntry('✅ Tool execution complete'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Tool execution failed';
    logs.push(makeLogEntry('❌ Tool execution failed', msg));
    // Proceed to synthesis with error context so LLM can respond gracefully
    toolResult = { error: msg, partial: true };
  }

  // ── Step 3: Synthesize Response ───────────────────────────────────────────
  logs.push(makeLogEntry('✍️ Synthesizing response...'));

  let finalText: string;
  try {
    if (useOpenRouter) {
      finalText = await openRouterSynthesizeResponse(messages, toolCall.name, toolResult);
    } else {
      try {
        finalText = await synthesizeResponse(messages, toolCall.name, toolResult);
      } catch (synthErr) {
        if (shouldFallback(synthErr)) {
          logs.push(makeLogEntry('⚠️ Gemini synthesis failed', 'Using OpenRouter for synthesis'));
          finalText = await openRouterSynthesizeResponse(messages, toolCall.name, toolResult);
        } else {
          throw synthErr;
        }
      }
    }
    logs.push(makeLogEntry('✅ Response ready'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Synthesis failed';
    logs.push(makeLogEntry('❌ Synthesis failed', msg));
    return { text: `I retrieved data but couldn't synthesize a response: ${msg}`, error: msg, toolUsed: toolCall.name as ToolName, toolLogs: logs };
  }

  return {
    text: finalText,
    toolUsed: toolCall.name as ToolName,
    toolLogs: logs,
  };
}
