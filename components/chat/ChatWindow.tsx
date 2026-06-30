import React, { useState } from 'react';
import { Bot, User, ChevronDown, ChevronRight, Terminal, Eye, EyeOff, Search, FileCode2, Play, AlertCircle } from 'lucide-react';
import { AgentStep } from '@/services/ai/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';

// Import PrismJS languages
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';


function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[10px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
    >
      {copied ? (
        <span className="text-green-500 font-semibold">Copied!</span>
      ) : (
        <>
          <span className="sr-only">Copy</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
        </>
      )}
    </button>
  );
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: AgentStep[];
}

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 overflow-y-auto px-4 md:px-8 py-6 space-y-6 scrollbar-thin">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center text-accent mb-4 animate-pulse">
            <Bot className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-serif font-semibold text-zinc-800 dark:text-zinc-200">Start an Agentic Chat</h3>
          <p className="text-sm text-zinc-500 max-w-sm mt-1">
            Ask complex questions! The agent will use Google Gemini, DuckDuckGo search, and Playwright scraping to find answers.
          </p>
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto pb-24">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 animate-fade-in ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`flex flex-col max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Collapsible Steps (Thoughts & Tool Calls) */}
                {message.role === 'assistant' && message.steps && message.steps.length > 0 && (
                  <AgentStepsTimeline steps={message.steps} />
                )}

                {/* Main Message Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.05)]
                    ${message.role === 'user'
                      ? 'bg-accent text-white rounded-br-none whitespace-pre-wrap'
                      : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/50 rounded-bl-none w-full'
                    }
                  `}
                >
                  {message.role === 'user' ? (
                    message.content
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed" {...props} />,
                        h1: ({ node, ...props }) => <h1 className="text-base font-serif font-bold my-2 text-zinc-900 dark:text-white" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-sm font-serif font-bold my-2 text-zinc-900 dark:text-white" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-xs font-serif font-bold my-1 text-zinc-900 dark:text-white" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1 text-sm text-zinc-700 dark:text-zinc-300" {...props} />,
                        li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto my-3 border border-zinc-200 dark:border-zinc-700 rounded-lg">
                            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700 text-left text-xs" {...props} />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 font-semibold" {...props} />,
                        tbody: ({ node, ...props }) => <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-400" {...props} />,
                        tr: ({ node, ...props }) => <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors" {...props} />,
                        th: ({ node, ...props }) => <th className="px-3 py-2 font-medium tracking-wider" {...props} />,
                        td: ({ node, ...props }) => <td className="px-3 py-2 whitespace-normal break-words" {...props} />,
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const lang = match ? match[1] : '';
                          const isInline = !className;
                          
                          if (isInline) {
                            return (
                              <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-accent font-mono text-xs font-semibold" {...props}>
                                {children}
                              </code>
                            );
                          }

                          const rawCode = String(children).replace(/\n$/, '');
                          
                          // Run Prism syntax highlighting
                          let highlightedHtml = rawCode;
                          let hasHighlighting = false;
                          
                          if (lang) {
                            const prismLang = Prism.languages[lang.toLowerCase()];
                            if (prismLang) {
                              try {
                                highlightedHtml = Prism.highlight(rawCode, prismLang, lang);
                                hasHighlighting = true;
                              } catch (e) {
                                console.warn('Prism highlighting failed:', e);
                              }
                            }
                          }

                          return (
                            <div className="relative my-3 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm bg-zinc-950 text-zinc-100 font-mono text-xs w-full vs-code-theme">
                              <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 select-none">
                                <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                                  {lang || 'code'}
                                </span>
                                <CopyButton text={rawCode} />
                              </div>
                              <pre className="p-4 overflow-x-auto leading-relaxed scrollbar-thin select-text">
                                {hasHighlighting ? (
                                  <code 
                                    className={`language-${lang}`} 
                                    dangerouslySetInnerHTML={{ __html: highlightedHtml }} 
                                  />
                                ) : (
                                  <code className={`language-${lang}`}>
                                    {children}
                                  </code>
                                )}
                              </pre>
                            </div>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 shadow-sm mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-4 items-start justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shrink-0 shadow-sm mt-1 animate-bounce">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col space-y-2 max-w-[80%]">
                <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl rounded-bl-none px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs font-medium text-zinc-500">Agent is thinking and processing tools...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentStepRow({ step, getStepIcon }: { step: AgentStep; getStepIcon: (type: string) => React.ReactNode }) {
  const [showContent, setShowContent] = useState(step.type !== 'tool_result');
  const [showImage, setShowImage] = useState(false);

  return (
    <div className="flex gap-2.5 items-start pl-1 border-l-2 border-zinc-300 dark:border-zinc-800 ml-1.5 pb-2">
      <div className="w-5 h-5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-xs">
        {getStepIcon(step.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{step.title}</span>
          <div className="flex items-center gap-2">
            {step.screenshot && (
              <button
                onClick={() => setShowImage(!showImage)}
                className="flex items-center gap-1 text-[10px] font-medium text-accent hover:underline cursor-pointer"
              >
                {showImage ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>Screenshot</span>
              </button>
            )}
            <button
              onClick={() => setShowContent(!showContent)}
              className="text-[10px] font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
            >
              {showContent ? 'Hide' : 'Show Details'}
            </button>
          </div>
        </div>

        {showContent && (
          <div className="mt-1.5 text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed whitespace-pre-wrap select-text">
            {step.type === 'tool_call' || step.type === 'tool_result' ? (
              <pre className="p-2 bg-zinc-200/50 dark:bg-zinc-900/50 rounded-lg text-[10px] font-mono overflow-x-auto">
                {step.content}
              </pre>
            ) : (
              <p>{step.content}</p>
            )}
          </div>
        )}

        {/* Render Screenshot if present and toggle set to show */}
        {step.screenshot && showImage && (
          <div className="mt-2 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 max-w-sm animate-fade-in shadow-sm">
            <img
              src={`data:image/jpeg;base64,${step.screenshot}`}
              alt="Browser Capture"
              className="w-full h-auto object-cover max-h-[220px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders the collapsible agent log execution trace.
 */
function AgentStepsTimeline({ steps }: { steps: AgentStep[] }) {
  const [isOpen, setIsOpen] = useState(false);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'thought':
        return <Terminal className="w-3.5 h-3.5 text-blue-500" />;
      case 'tool_call':
        return <Play className="w-3.5 h-3.5 text-amber-500" />;
      case 'tool_result':
        return <Search className="w-3.5 h-3.5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-zinc-500" />;
    }
  };

  return (
    <div className="w-full mb-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/30 overflow-hidden text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 cursor-pointer font-medium text-zinc-600 dark:text-zinc-400 select-none"
      >
        <span className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent" />
          <span>Agent Logs ({steps.length} steps)</span>
        </span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin">
          {steps.map((step, idx) => (
            <AgentStepRow key={idx} step={step} getStepIcon={getStepIcon} />
          ))}
        </div>
      )}
    </div>
  );
}
