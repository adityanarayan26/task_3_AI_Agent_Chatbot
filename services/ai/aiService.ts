import { GoogleGenAI, type Content, type Tool } from '@google/genai';
import { SYSTEM_PROMPT, TOOL_DECLARATIONS } from '@/lib/prompts/systemPrompt';
import type { ToolCall } from '@/types';

const MODEL_ID = 'gemini-2.0-flash';

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (_client) return _client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables.');
  _client = new GoogleGenAI({ apiKey });
  return _client;
}

/**
 * Converts our internal message format to Gemini Content format.
 */
function toGeminiContents(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Content[] {
  return messages
    .filter((m) => m.role !== 'system') // system is handled via systemInstruction
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

/**
 * Step 1 of the agentic loop: Ask Gemini whether to use a tool or respond directly.
 * Returns either a ToolCall (tool to execute) or null (direct text response follows).
 */
export async function reasonAndSelectTool(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
): Promise<{ toolCall: ToolCall | null; directText: string | null }> {
  const client = getClient();

  const tools: Tool[] = [
    {
      functionDeclarations: TOOL_DECLARATIONS.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters as any,
      })),
    },
  ];

  const response = await client.models.generateContent({
    model: MODEL_ID,
    contents: toGeminiContents(messages),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      tools,
      temperature: 0.2,
    },
  });

  const candidate = response.candidates?.[0];
  if (!candidate?.content?.parts) {
    throw new Error('Gemini returned an empty response.');
  }

  // Check for a function call part first
  for (const part of candidate.content.parts) {
    if (part.functionCall) {
      return {
        toolCall: {
          name: part.functionCall.name as ToolCall['name'],
          args: (part.functionCall.args ?? {}) as Record<string, unknown>,
        },
        directText: null,
      };
    }
  }

  // Otherwise it's a direct text response
  const text = candidate.content.parts.map((p) => p.text ?? '').join('');
  return { toolCall: null, directText: text };
}

/**
 * Step 3 of the agentic loop: Synthesize a final user-facing response
 * given the original conversation + the tool's structured result.
 */
export async function synthesizeResponse(
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

Using the above tool output, provide a comprehensive, well-structured response to the user's request. 
Format your response with markdown headings, bullet points, and code blocks where appropriate.
Do not mention "tool output" or "JSON" in your response — present the information naturally.
`;

  const contents = toGeminiContents(messages);
  // Append synthesis instruction as final user turn
  contents.push({ role: 'user', parts: [{ text: toolResultText }] });

  const response = await client.models.generateContent({
    model: MODEL_ID,
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini synthesis returned an empty response.');
  return text;
}
