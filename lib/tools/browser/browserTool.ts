import type { ToolLogEntry, BrowserScrapeResult } from '@/types';

/**
 * Browser Search Tool
 *
 * Hits the internal /api/tools/browser route.
 * Returns structured scraped data from the web.
 */
export async function runBrowserTool(
  args: { query: string },
  logs: ToolLogEntry[],
  addLog: (step: string, detail?: string) => void
): Promise<{ searchResults: BrowserScrapeResult; topResults: BrowserScrapeResult[] }> {
  addLog('🌐 Browser tool activated', `Searching: "${args.query}"`);

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/tools/browser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: args.query }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Browser tool API returned ${response.status}: ${errText}`);
  }

  const data = await response.json();
  addLog('📄 Page data extracted', `Found ${data.topResults?.length ?? 0} result(s)`);
  return data;
}
