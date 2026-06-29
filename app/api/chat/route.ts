import { NextRequest, NextResponse } from 'next/server';
import { runAgentLoop } from '@/services/ai/aiOrchestrator';
import { runBrowserTool } from '@/lib/tools/browser/browserTool';
import { runCodingTool } from '@/lib/tools/coding/codingTool';
import { runDeepResearchTool } from '@/lib/tools/deep-research/deepResearchTool';
import type { ToolCall, ToolLogEntry, ChatRequest } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for long tool calls

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();

    if (!body.messages || body.messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Validate roles
    const validRoles = ['user', 'assistant', 'system'];
    for (const msg of body.messages) {
      if (!validRoles.includes(msg.role)) {
        return NextResponse.json({ error: `Invalid message role: ${msg.role}` }, { status: 400 });
      }
    }

    const messages = body.messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    /**
     * Tool executor — called by the orchestrator when a tool is selected.
     * Each tool is fully isolated; they communicate only via JSON.
     */
    async function executeTool(toolCall: ToolCall, logs: ToolLogEntry[]): Promise<unknown> {
      const addLog = (step: string, detail?: string) => {
        logs.push({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          step,
          detail,
        });
      };

      switch (toolCall.name) {
        case 'browser_search': {
          const args = toolCall.args as { query: string };
          if (!args.query) throw new Error('browser_search requires a "query" argument');
          return runBrowserTool(args, logs, addLog);
        }

        case 'coding_assistant': {
          const args = toolCall.args as { task: string; language?: string; code?: string };
          if (!args.task) throw new Error('coding_assistant requires a "task" argument');
          return runCodingTool(args, logs, addLog);
        }

        case 'deep_research': {
          const args = toolCall.args as { topic: string };
          if (!args.topic) throw new Error('deep_research requires a "topic" argument');
          return runDeepResearchTool(args, logs, addLog);
        }

        default:
          throw new Error(`Unknown tool: ${(toolCall as any).name}`);
      }
    }

    const result = await runAgentLoop(messages, executeTool);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[/api/chat] Unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json(
      {
        text: `An unexpected server error occurred: ${message}`,
        error: message,
      },
      { status: 500 }
    );
  }
}
