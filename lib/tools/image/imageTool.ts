import { GoogleGenAI, Type } from '@google/genai';
import { AgentTool } from '../types';

export const imageTool: AgentTool = {
  name: 'image_generator',
  description: 'Generate an AI image based on a detailed text prompt. Use this whenever the user explicitly asks to generate, create, draw, or paint an image.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'The descriptive text prompt for the image to generate.' }
    },
    required: ['prompt']
  },
  execute: async (args: Record<string, unknown>) => {
    const { prompt } = args as { prompt: string };
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey || geminiKey.includes('your_gemini')) {
      return { error: 'Gemini API key is not configured for image generation.' };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1'
        }
      });

      const base64Image = response?.generatedImages?.[0]?.image?.imageBytes;
      if (!base64Image) {
        return { error: 'Failed to generate image: Empty response from AI engine.' };
      }

      return {
        success: true,
        prompt: prompt,
        imageUrl: `data:image/jpeg;base64,${base64Image}`
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { error: `Image generation failed: ${errorMessage}` };
    }
  }
};
