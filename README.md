# Universal AI Chatbot (Agentic AI Engine)

The **Universal AI Chatbot** is a modern, modular, tool-driven AI application built on the principles of **Agentic AI**. 

Unlike traditional chatbots that simply predict the next token to generate a direct text response, this application functions as a reasoning agent. It employs a **Reason → Select Tool → Execute → Respond** workflow, delegating complex tasks (such as web browsing, running code, and deep research) to dedicated, independent services and feeding structured outputs back to the core reasoning engine.

---

## 🚀 Core Architecture & Mental Model

The chatbot follows a strict agentic workflow. The primary LLM does not interact with the outside world directly; instead, it assesses the user's intent, reasons whether a tool is required, selects the appropriate tool, and consumes the structured JSON results to compile a final user response.

```
                    ┌──────────────────────────┐
                    │       User Prompt        │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Universal AI Chatbot    │
                    └─────────────┬────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Gemini Reasoning Layer  │
                    └─────────────┬────────────┘
                                  │
                          Is Tool Needed?
                                 / \
                                /   \
                        Yes    /     \    No
                      ┌───────       ───────┐
                      │                     │
                      ▼                     ▼
              ┌───────────────┐     ┌───────────────┐
              │  Select Tool  │     │ Direct Resp.  │
              └───────┬───────┘     └───────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐┌───────────┐┌──────────────┐
│ Browser Tool ││Coding Tool││Deep Research │
└──────┬───────┘└───────────┘└──────────────┘
       │
       ▼
┌──────────────┐
│  Playwright  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Target Website│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Structured JSON
└──────┬───────┘
       │
       └──────────────┐
                      ▼
            ┌───────────────────┐
            │ Gemini Summarizes │
            └─────────┬─────────┘
                      │
                      ▼
            ┌───────────────────┐
            │  Final Response   │
            └───────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Modern react framework utilizing TypeScript, Server Components, and client-side interactivity. |
| **UI & Styling** | **Tailwind CSS v4 + shadcn/ui** | Clean, premium, glassmorphic design system using utility classes and accessible primitive components. |
| **Primary AI Engine** | **Google Gemini API SDK** | `@google/genai` is utilized for orchestrating intent detection, tool-calling reasoning, and synthesis. |
| **Fallback AI Engine** | **OpenRouter API** | Resilience mechanism switching to `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` via the `openai` SDK when Gemini is unreachable. |
| **Browser Automation** | **Playwright** | Headless browser execution layer used programmatically inside the Browser Tool to inspect websites. |
| **Database & Storage** | **Supabase (PostgreSQL)** | Persistent storage for chat history, user preferences, session cache, and system telemetry. |
| **Authentication** | **Supabase Auth** | Security guardrails to enforce user session authentication before accessing agent features. |

---

## 📂 Directory Structure

The project conforms to a clean, modular folder layout separating the AI orchestrator, frontend client pages, design primitives, and executable tools:

```text
├── app/                  # Next.js App Router (Pages, layouts, global CSS)
│   ├── auth/             # Authentication pages (Login, Sign-Up)
│   └── globals.css       # Tailwind v4 configuration and design tokens
├── components/           # React Components
│   ├── chat/             # Chat window, messages, and log streaming panels
│   ├── layout/           # Shared structures (Header, footer)
│   ├── sidebar/          # Workspace navigation and chat history sidebar
│   └── ui/               # Reusable shadcn component primitives (buttons, inputs)
├── lib/                  # Shared Utility and Domain logic
│   ├── ai/               # AI reasoning layers, orchestrators, and fallbacks
│   ├── prompts/          # System prompts, tool-description schemas, and templates
│   ├── tools/            # Client-side wrappers and definitions for agent tools
│   │   ├── browser/      # Browser Search Tool orchestrator
│   │   ├── coding/       # Coding Assistant Tool orchestrator
│   │   └── deep-research/# Deep Research Tool orchestrator
│   └── utils/            # General utility helper functions (Tailwind merge, formatting)
├── services/             # Core Backend Services
│   ├── ai/               # Gemini & OpenRouter API clients and config
│   ├── browser/          # Playwright service instance (Navigation, Scraping, Screenshots)
│   └── tools/            # Backend-side execution handlers for tools
├── hooks/                # Custom React hooks (auth states, chat state, UI behavior)
├── types/                # Strict TypeScript declaration files
├── supabase/             # Database schemas, migrations, and seed scripts
└── public/               # Static assets (images, icons, fonts)
```

---

## 🧰 MVP Tools Suite

### 1. Browser Search Tool (`lib/tools/browser`)
* **Purpose**: Inspect, scrape, and extract structured telemetry from target websites.
* **Mechanism**: Programmatic interaction via **Playwright** (navigating, clicking, searching, and extracting raw page content/JSON) without LLM direct exposure.
* **Output**: Clean, structured JSON summary representing key contents, links, and scraped data.

### 2. Coding Assistant Tool (`lib/tools/coding`)
* **Purpose**: Support developers in generating, debugging, and explaining source code.
* **Mechanism**: Generates formatted code blocks, offers refactoring suggestions, provides comprehensive bug-fixing diagnostics, and drafts directory structures for multi-file projects.

### 3. Deep Research Tool (`lib/tools/deep-research`)
* **Purpose**: Complete comprehensive reports using cross-referenced data across multiple internet resources.
* **Mechanism**: Orchestrates successive search loops, compiles comparative matrices, details sources, and generates multi-section research documentation.

---

## ⚙️ Setup and Installation

### 1. Prerequisites
Ensure you have the following installed locally:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [NPM](https://www.npmjs.com/) or another modern package runner

### 2. Dependency Installation
Initialize the packages and Tailwind support configurations:
```bash
# Install core workspace packages
npm install
```

### 3. Playwright Driver Configuration
Install the Playwright headless browser binaries:
```bash
npx playwright install
```

### 4. Environment Configuration
Create a `.env.local` file in the project root containing your credentials:
```env
# Google Gemini SDK Credentials
GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter Fallback Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Supabase Client Details
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 5. Running the Application
Spin up the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📝 Engineering Guidelines

* **Strict Tool Boundaries**: Every tool is fully isolated. No tool should depend directly on another tool's internals; they communicate solely via JSON interfaces.
* **AI Sanitization**: AI models must never interface with raw HTTP endpoints or external environments. All automation occurs in the `services/` execution layer.
* **Resilient Failovers**: If the primary Gemini model encounters API limits or failures, the AI orchestrator must seamlessly fallback to OpenRouter without crashing the UI.
* **Authentication Guard**: Unauthenticated users should be redirected or prompted with the Auth Dialog when attempting to utilize tools or save chat history.
