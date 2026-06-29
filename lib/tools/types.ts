import { Type } from '@google/genai';

export interface ToolExecuteResult {
  output: any;
  screenshot?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: typeof Type.OBJECT;
    properties: Record<string, any>;
    required: string[];
  };
  execute: (args: any) => Promise<any> | Promise<ToolExecuteResult>;
}
