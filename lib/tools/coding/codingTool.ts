import fs from 'fs';
import path from 'path';
import { Type } from '@google/genai';
import { AgentTool } from '../types';

export const codingTool: AgentTool = {
  name: 'coding_assistant',
  description: 'Generate, debug, explain, or refactor code. Use this whenever the user asks for code creation, explanation, debugging, or project layouts.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: 'The type of action to perform.',
        enum: ['generate', 'debug', 'explain', 'refactor', 'draft_project']
      },
      language: { type: Type.STRING, description: 'The programming language of the code.' },
      code: { type: Type.STRING, description: 'The code content.' },
      explanation: { type: Type.STRING, description: 'Optional explanation, context, or notes.' },
      files: {
        type: Type.ARRAY,
        description: 'List of files with path and content (use for multi-file project drafting).',
        items: {
          type: Type.OBJECT,
          properties: {
            path: { type: Type.STRING, description: 'Relative path of the file under the sandbox folder.' },
            content: { type: Type.STRING, description: 'Content of the file.' }
          },
          required: ['path', 'content']
        }
      }
    },
    required: ['action', 'language', 'code']
  },
  execute: async (args: {
    action: 'generate' | 'debug' | 'explain' | 'refactor' | 'draft_project';
    language: string;
    code: string;
    explanation?: string;
    files?: Array<{ path: string; content: string }>;
  }) => {
    const sandboxDir = path.resolve(process.cwd(), 'sandbox');
    
    // Create sandbox directory if it doesn't exist
    if (!fs.existsSync(sandboxDir)) {
      fs.mkdirSync(sandboxDir, { recursive: true });
    }

    let fileResults: string[] = [];

    try {
      // If files are provided for multi-file project drafting
      if (args.files && args.files.length > 0) {
        for (const file of args.files) {
          const filePath = path.join(sandboxDir, file.path);
          const fileDir = path.dirname(filePath);
          
          if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
          }
          
          fs.writeFileSync(filePath, file.content, 'utf8');
          fileResults.push(file.path);
        }
      } else if (args.action === 'generate' && args.code) {
        // For single file generation, create a default file based on language extension
        const ext = getExtensionByLanguage(args.language);
        const filename = `generated_code${ext}`;
        const filePath = path.join(sandboxDir, filename);
        fs.writeFileSync(filePath, args.code, 'utf8');
        fileResults.push(filename);
      }
    } catch (err: any) {
      return {
        success: false,
        error: `Failed to write code to disk: ${err.message}`
      };
    }

    return {
      success: true,
      action: args.action,
      language: args.language,
      code: args.code,
      explanation: args.explanation || '',
      savedFiles: fileResults,
      outputPath: fileResults.length > 0 ? 'sandbox/' : null
    };
  }
};

function getExtensionByLanguage(lang: string): string {
  switch (lang.toLowerCase()) {
    case 'typescript':
    case 'ts':
      return '.ts';
    case 'javascript':
    case 'js':
      return '.js';
    case 'python':
    case 'py':
      return '.py';
    case 'html':
      return '.html';
    case 'css':
      return '.css';
    case 'json':
      return '.json';
    default:
      return '.txt';
  }
}
