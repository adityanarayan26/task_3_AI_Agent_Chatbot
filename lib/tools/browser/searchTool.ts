import { BrowserService } from '@/services/browser/browserService';
import { Type } from '@google/genai';
import { AgentTool } from '../types';

export const searchTool: AgentTool = {
  name: 'web_search',
  description: 'Search the web using DuckDuckGo and retrieve matching titles, descriptions, and links.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'The search query.' }
    },
    required: ['query']
  },
  execute: async (args: { query: string }) => {
    const service = new BrowserService();
    return await service.searchDuckDuckGo(args.query);
  }
};
