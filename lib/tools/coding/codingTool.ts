import { GoogleGenAI } from '@google/genai';
import type { ToolLogEntry, CodingArgs } from '@/types';

const MODEL_ID = 'gemini-2.0-flash';

/**
 * Coding Assistant Tool
 *
 * Uses Gemini directly (no external service needed) to:
 *  - Generate code from a description
 *  - Debug existing code
 *  - Explain or refactor code
 *  - Design project structures
 */
export async function runCodingTool(
  args: CodingArgs,
  _logs: ToolLogEntry[],
  addLog: (step: string, detail?: string) => void
): Promise<{ output: string; language?: string }> {
  addLog('💻 Coding assistant activated', `Task: ${args.task.substring(0, 80)}...`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const client = new GoogleGenAI({ apiKey });

  const prompt = buildCodingPrompt(args);
  addLog('⚙️ Generating code...', args.language ? `Language: ${args.language}` : 'Auto-detecting language');

  const response = await client.models.generateContent({
    model: MODEL_ID,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      temperature: 0.2,
      systemInstruction: `You are an expert software engineer. You write clean, well-commented, production-quality code.
Always include:
- Proper code formatting in fenced code blocks with language tag
- Brief explanation of the approach
- Any important edge cases or caveats
- Usage example if applicable`,
    },
  });

  const output = response.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!output) throw new Error('Coding tool returned empty output');

  addLog('✅ Code generated');
  return { output, language: args.language };
}

function buildCodingPrompt(args: CodingArgs): string {
  let prompt = `Task: ${args.task}\n`;

  if (args.language) {
    prompt += `Language: ${args.language}\n`;
  }

  if (args.code) {
    prompt += `\nExisting code to work with:\n\`\`\`${args.language ?? ''}\n${args.code}\n\`\`\`\n`;
  }

  prompt += `\nProvide a complete, working solution with clear explanations.`;
  return prompt;
}
