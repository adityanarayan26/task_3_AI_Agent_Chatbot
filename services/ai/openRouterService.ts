import OpenAI from 'openai';
import { SYSTEM_PROMPT } from '@/lib/prompts/systemPrompt';
import type { ToolCall } from '@/types';

const OPENROUTER_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set in environment variables.');
  _client = new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey,
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Universal AI Agent Chatbot',
    },
  });
  return _client;
}

/**
 * OpenRouter fallback: reason and select tool.
 * Uses OpenAI-compatible function calling.
 */
export async function openRouterReasonAndSelectTool(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<{ toolCall: ToolCall | null; directText: string | null }> {
  const client = getClient();

  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'browser_search',
        description: 'Search the web and scrape real-time information from websites.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query or URL' },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'coding_assistant',
        description: 'Generate, debug, explain, or refactor source code.',
        parameters: {
          type: 'object',
          properties: {
            task: { type: 'string', description: 'The coding task' },
            language: { type: 'string', description: 'Programming language' },
            code: { type: 'string', description: 'Existing code to work with' },
          },
          required: ['task'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'deep_research',
        description: 'Conduct comprehensive multi-source research and produce a structured report.',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'The topic to research' },
          },
          required: ['topic'],
        },
      },
    },
  ];

  const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
  ];

  const response = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: allMessages,
    tools,
    tool_choice: 'auto',
    temperature: 0.2,
  });

  const choice = response.choices[0];
  const toolCalls = choice.message.tool_calls;

  if (toolCalls && toolCalls.length > 0) {
    const tc = toolCalls[0];
    return {
      toolCall: {
        name: tc.function.name as ToolCall['name'],
        args: JSON.parse(tc.function.arguments || '{}'),
      },
      directText: null,
    };
  }

  return {
    toolCall: null,
    directText: choice.message.content ?? '',
  };
}

/**
 * OpenRouter fallback: synthesize final response from tool result.
 */
export async function openRouterSynthesizeResponse(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  toolName: string,
  toolResult: unknown
): Promise<string> {
  const client = getClient();

  const toolResultText = `
Tool Used: ${toolName}
Tool Output:
\`\`\`json
${JSON.stringify(toolResult, null, 2)}
\`\`\`

Using the above tool output, provide a comprehensive, well-structured markdown response. Present the information naturally without mentioning "tool output" or JSON.
`;

  const allMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    })),
    { role: 'user', content: toolResultText },
  ];

  const response = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: allMessages,
    temperature: 0.7,
  });

  return response.choices[0].message.content ?? '';
}
