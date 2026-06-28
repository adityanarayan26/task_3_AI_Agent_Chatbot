import { GoogleGenAI, Type } from '@google/genai';
import OpenAI from 'openai';
import { BrowserService } from '../browser/browserService';

export interface AgentStep {
  type: 'thought' | 'tool_call' | 'tool_result' | 'error';
  title: string;
  content: string;
  screenshot?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  steps: AgentStep[];
}

export class AiService {
  private browserService: BrowserService;

  constructor() {
    this.browserService = new BrowserService();
  }

  /**
   * Main entry point to orchestrate agent reasoning loop.
   */
  async generateText(
    userMessage: string,
    history: any[] = [],
    isThinkingEnabled: boolean = false
  ): Promise<ChatResponse> {
    const steps: AgentStep[] = [];
    const geminiKey = process.env.GEMINI_API_KEY;

    // Check if Gemini key is available
    if (!geminiKey || geminiKey.includes('your_gemini')) {
      console.warn('Gemini API key missing. Falling back directly to OpenRouter.');
      return this.runOpenRouterFallback(userMessage, history, steps);
    }

    try {
      // 1. Initialize Gemini SDK
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      // Build conversation history in Gemini API format
      // Roles: 'user', 'model', 'tool'
      const chatHistory: any[] = [];
      
      // Add system instruction depending on thinking mode
      const systemInstruction = isThinkingEnabled
        ? "You are an advanced Agentic AI helper. Think deeply and step-by-step. Analyze all information carefully. You have tools available: web_search, web_scrape, and deep_research. Call tools as needed to fetch real-time information before finalizing your answer."
        : "You are an Agentic AI helper. Answer questions. If you need real-time or external data, use the appropriate tools: web_search, web_scrape, or deep_research.";

      // Convert history
      history.forEach(msg => {
        if (msg.role === 'user') {
          chatHistory.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.role === 'assistant' || msg.role === 'model') {
          chatHistory.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      });

      // Add new user prompt
      chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

      let loopCount = 0;
      const maxLoops = 5;
      let finalResponseText = '';

      while (loopCount < maxLoops) {
        loopCount++;
        
        // Define tool declarations
        const toolDeclarations: any[] = [
          {
            name: 'web_search',
            description: 'Search the web using DuckDuckGo and retrieve matching titles, descriptions, and links.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                query: { type: Type.STRING, description: 'The search query.' }
              },
              required: ['query']
            }
          },
          {
            name: 'web_scrape',
            description: 'Scrape a website to read its main text content and take a screenshot.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                url: { type: Type.STRING, description: 'The absolute URL to scrape.' }
              },
              required: ['url']
            }
          },
          {
            name: 'deep_research',
            description: 'Perform an exhaustive multi-step research loop about a topic, doing multiple searches and page scrapings, returning a markdown comparison summary.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING, description: 'The topic or query to research in detail.' }
              },
              required: ['topic']
            }
          }
        ];

        // Call Gemini
        const response = await ai.models.generateContent({
          model: isThinkingEnabled ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
          contents: chatHistory,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: toolDeclarations }]
          }
        });

        // Record model's text thought if any
        if (response.text) {
          finalResponseText = response.text;
          steps.push({
            type: 'thought',
            title: `Thought (Step ${loopCount})`,
            content: response.text
          });
          // Add thought to history so Gemini knows its own thoughts in subsequent turns
          chatHistory.push({ role: 'model', parts: [{ text: response.text }] });
        }

        const functionCalls = response.functionCalls;

        // If no more tool calls, we are done
        if (!functionCalls || functionCalls.length === 0) {
          if (!response.text && finalResponseText) {
            // Use last saved response text
          } else if (response.text) {
            finalResponseText = response.text;
          } else {
            finalResponseText = "Processing complete.";
          }
          break;
        }

        // Execute function calls
        for (const call of functionCalls) {
          const { name, args } = call;
          
          steps.push({
            type: 'tool_call',
            title: `Running Tool: ${name}`,
            content: `Arguments: ${JSON.stringify(args, null, 2)}`
          });

          // Add function call to chat history
          chatHistory.push({
            role: 'model',
            parts: [{ functionCall: { name, args } }]
          });

          let result: any;
          let screenshot: string | undefined;

          try {
            if (name === 'web_search') {
              const query = (args as any).query;
              result = await this.browserService.searchDuckDuckGo(query);
            } else if (name === 'web_scrape') {
              const url = (args as any).url;
              const scrapeRes = await this.browserService.scrapeUrl(url);
              result = {
                title: scrapeRes.title,
                url: scrapeRes.url,
                textContent: scrapeRes.textContent
              };
              screenshot = scrapeRes.screenshotBase64;
            } else if (name === 'deep_research') {
              const topic = (args as any).topic;
              result = await this.runDeepResearch(topic, steps);
            } else {
              result = { error: 'Unknown tool requested.' };
            }
          } catch (toolErr: any) {
            result = { error: `Tool execution failed: ${toolErr.message}` };
          }

          // Record tool output step
          steps.push({
            type: 'tool_result',
            title: `Tool Result: ${name}`,
            content: JSON.stringify(result, null, 2),
            screenshot
          });

          // Add function response to chat history
          chatHistory.push({
            role: 'tool',
            parts: [{
              functionResponse: {
                name,
                response: { output: result }
              }
            }]
          });
        }
      }

      return {
        success: true,
        response: finalResponseText,
        steps
      };

    } catch (err: any) {
      console.error('Gemini execution error, falling back to OpenRouter:', err.message);
      steps.push({
        type: 'error',
        title: 'Gemini Error',
        content: `Error: ${err.message}. Falling back to OpenRouter...`
      });
      return this.runOpenRouterFallback(userMessage, history, steps);
    }
  }

  /**
   * Executes a multi-stage search and scrape loop to summarize research.
   */
  private async runDeepResearch(topic: string, steps: AgentStep[]): Promise<any> {
    try {
      // Step A: Search for the topic
      const searchResults = await this.browserService.searchDuckDuckGo(topic);
      if (searchResults.length === 0) {
        return { message: `No search results found for: "${topic}"` };
      }

      // Step B: Scrape top 2 results
      const pagesToScrape = searchResults.slice(0, 2);
      const contents: string[] = [];

      for (const page of pagesToScrape) {
        const scrapeRes = await this.browserService.scrapeUrl(page.url);
        contents.push(`
Source: ${page.title} (${page.url})
Content:
${scrapeRes.textContent.slice(0, 3000)}
------------------------------------`);
      }

      // Return compiled raw analysis content
      return {
        topic,
        sourcesAnalyzed: pagesToScrape.map(p => ({ title: p.title, url: p.url })),
        compiledData: contents.join('\n')
      };
    } catch (err: any) {
      return { error: `Deep research sequence failed: ${err.message}` };
    }
  }

  /**
   * Fallback model generation using OpenRouter.
   */
  private async runOpenRouterFallback(
    userMessage: string,
    history: any[],
    steps: AgentStep[]
  ): Promise<ChatResponse> {
    const orKey = process.env.OPENROUTER_API_KEY;

    if (!orKey || orKey.includes('your_openrouter') || !orKey.startsWith('sk-or-')) {
      return {
        success: false,
        response: "I was unable to process your request because the Gemini API key is invalid/missing, and OpenRouter is not configured with a valid key. Please check your credentials in .env.local.",
        steps
      };
    }

    const orModel = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';

    steps.push({
      type: 'thought',
      title: 'OpenRouter Fallback',
      content: `Invoking the fallback reasoning model on OpenRouter (${orModel})...`
    });

    try {
      const openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: orKey,
      });

      const messages: any[] = [];

      // System instruction
      messages.push({
        role: 'system',
        content: 'You are a helpful AI assistant. Answer the user\'s questions to the best of your ability.'
      });

      // User history
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });

      // New prompt
      messages.push({
        role: 'user',
        content: userMessage
      });

      const completion = await openai.chat.completions.create({
        model: orModel,
        messages
      });

      const answer = completion.choices[0]?.message?.content || 'Empty response received from OpenRouter.';

      return {
        success: true,
        response: answer,
        steps
      };
    } catch (error: any) {
      console.error('OpenRouter execution error:', error.message);
      return {
        success: false,
        response: `Both Gemini and OpenRouter fallback failed. Error detail: ${error.message}`,
        steps
      };
    }
  }
}
