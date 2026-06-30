"use server";

import { AiService, ChatResponse } from '@/services/ai/aiService';

/**
 * Server action to process chat queries using the AiService agent orchestrator.
 */
export async function handleChatRequest(
  userMessage: string,
  history: any[],
  isThinkingEnabled: boolean,
  selectedModel: 'gemini' | 'openrouter',
  files?: Array<{ name: string; type: string; base64?: string }>
): Promise<ChatResponse> {
  try {
    const aiService = new AiService();
    return await aiService.generateText(userMessage, history, isThinkingEnabled, selectedModel, files);
  } catch (error: any) {
    console.error('Server Action Chat Request Error:', error.message);
    return {
      success: false,
      response: `An error occurred on the server while processing your request: ${error.message}`,
      steps: [
        {
          type: 'error',
          title: 'Server Error',
          content: error.message
        }
      ]
    };
  }
}
