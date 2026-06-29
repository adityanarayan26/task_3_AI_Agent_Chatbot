import { BrowserService } from '@/services/browser/browserService';
import { Type } from '@google/genai';
import { AgentTool } from '../types';

export const scrapeTool: AgentTool = {
  name: 'web_scrape',
  description: 'Scrape a website to read its main text content and take a screenshot.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: { type: Type.STRING, description: 'The absolute URL to scrape.' }
    },
    required: ['url']
  },
  execute: async (args: { url: string }) => {
    const service = new BrowserService();
    const scrapeRes = await service.scrapeUrl(args.url);
    return {
      output: {
        title: scrapeRes.title,
        url: scrapeRes.url,
        textContent: scrapeRes.textContent
      },
      screenshot: scrapeRes.screenshotBase64
    };
  }
};
