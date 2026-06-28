import fs from 'fs';
import path from 'path';

export const codingTool = {
  name: 'coding_assistant',
  description: 'Helper to format, write, and process generated, debugged, or refactored code blocks and multi-file projects.',
  execute: async (args: {
    action: 'generate' | 'debug' | 'explain' | 'refactor' | 'draft_project';
    language: string;
    code: string;
    explanation?: string;
    files?: Array<{ path: string; content: string }>; // For multi-file project drafting
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
