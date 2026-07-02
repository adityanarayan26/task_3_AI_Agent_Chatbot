import { AgentTool, ToolExecuteResult } from './types';
import { searchTool } from './browser/searchTool';
import { scrapeTool } from './browser/scrapeTool';
import { researchTool } from './deep-research/researchTool';
import { codingTool } from './coding/codingTool';
import { imageTool } from './image/imageTool';

// List of all registered tools
const registeredTools: AgentTool[] = [
  searchTool,
  scrapeTool,
  researchTool,
  codingTool,
  imageTool
];

export class ToolRegistry {
  /**
   * Returns function declarations for the Gemini API SDK.
   */
  static getToolDeclarations() {
    return registeredTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
  }

  /**
   * Executes a tool by name and returns a unified execute result.
   */
  static async executeTool(name: string, args: Record<string, unknown>): Promise<ToolExecuteResult> {
    const tool = registeredTools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not registered.`);
    }

    const result = await tool.execute(args);
    
    // Check if the result is already in the ToolExecuteResult format
    if (result && typeof result === 'object' && 'output' in result) {
      return result as ToolExecuteResult;
    }

    // Otherwise, wrap it in a standard ToolExecuteResult
    return { output: result };
  }
}
