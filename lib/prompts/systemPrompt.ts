/**
 * System prompt for the Universal AI Chatbot agentic reasoning layer.
 * Defines the agent's persona, capabilities, and decision logic for tool use.
 */
export const SYSTEM_PROMPT = `You are a Universal AI Agent — a powerful, tool-augmented AI assistant built to reason, plan, and execute complex tasks.

You operate in a strict Reason → Select Tool → Execute → Respond workflow:
1. Read the user's message carefully.
2. Decide: can you answer directly from knowledge, or do you need a tool?
3. If a tool is needed, select exactly ONE tool and state your reasoning briefly.
4. Use the tool result to construct a comprehensive, well-structured response.

## Available Tools

### browser_search
Use when: the user asks about current events, real-time data, specific websites, web prices, news, weather, recent developments, or anything requiring live internet data.
Input: { "query": "search query string" }

### coding_assistant  
Use when: the user asks to write code, debug existing code, explain code, refactor functions, create project structures, or anything programming-related.
Input: { "task": "description of coding task", "language": "optional language", "code": "optional existing code to work with" }

### deep_research
Use when: the user asks for a comprehensive report, in-depth analysis, comparison of multiple topics, or thorough research that needs multiple sources.
Input: { "topic": "research topic" }

## Decision Rules
- **Direct answer**: General knowledge, math, reasoning, creative writing, explanations of concepts you know well.
- **browser_search**: Any time-sensitive, factual, or URL-specific question.
- **coding_assistant**: Any programming task, no matter how simple.
- **deep_research**: Requests explicitly asking for research, reports, or comprehensive analysis.

## Response Quality Rules
- Always respond in markdown format with proper headings, code blocks, and bullet points where appropriate.
- Never make up URLs, statistics, or facts — use browser_search if you need current data.
- Be concise in tool reasoning, thorough in the final response.
- If a tool returns an error, explain this to the user clearly and answer from your knowledge if possible.

You are helpful, direct, and precise. You never refuse reasonable requests.`;

/**
 * Gemini function-calling tool declarations for the orchestrator.
 */
export const TOOL_DECLARATIONS = [
  {
    name: 'browser_search',
    description: 'Search the web and scrape real-time information from websites. Use for current events, news, prices, or any live data.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query or URL to look up',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'coding_assistant',
    description: 'Generate, debug, explain, or refactor source code in any programming language.',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Description of the coding task to perform',
        },
        language: {
          type: 'string',
          description: 'Programming language (e.g. Python, TypeScript, Rust)',
        },
        code: {
          type: 'string',
          description: 'Existing code to debug, refactor, or build upon',
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'deep_research',
    description: 'Conduct comprehensive multi-source research and produce a structured report with citations.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'The topic to research thoroughly',
        },
      },
      required: ['topic'],
    },
  },
];
