import { Schema } from '@google/genai';

export interface ToolExecuteResult {
  output: unknown;
  screenshot?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: Schema;
  execute: (args: Record<string, unknown>) => Promise<unknown> | Promise<ToolExecuteResult>;
}
