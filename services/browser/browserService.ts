import { chromium, type Browser, type BrowserContext } from 'playwright';
import type { BrowserScrapeResult } from '@/types';

const SEARCH_ENGINE = 'https://duckduckgo.com/?q=';
const NAVIGATE_TIMEOUT = 15_000; // 15 s
const DEFAULT_WAIT = 'domcontentloaded';

// ── Singleton browser instance ─────────────────────────────────────────────────
let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;
  _browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  return _browser;
}

async function newContext(): Promise<BrowserContext> {
  const browser = await getBrowser();
  return browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    javaScriptEnabled: true,
  });
}

// ── Text extraction helpers ───────────────────────────────────────────────────
async function extractPageData(url: string): Promise<BrowserScrapeResult> {
  const context = await newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: DEFAULT_WAIT, timeout: NAVIGATE_TIMEOUT });

    const data = await page.evaluate(() => {
      const getText = (el: Element | null) => el?.textContent?.trim() ?? '';

      // Title
      const title = document.title || getText(document.querySelector('h1'));

      // Headings (h1–h3)
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map((h) => h.textContent?.trim() ?? '')
        .filter(Boolean)
        .slice(0, 20);

      // Body paragraphs (non-empty, > 30 chars)
      const paragraphs = Array.from(document.querySelectorAll('p, article p, main p'))
        .map((p) => p.textContent?.trim() ?? '')
        .filter((t) => t.length > 30)
        .slice(0, 30);

      // Links
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map((a) => ({
          text: a.textContent?.trim() ?? '',
          href: (a as HTMLAnchorElement).href,
        }))
        .filter((l) => l.text && l.href.startsWith('http'))
        .slice(0, 20);

      // Meta description
      const metaDesc =
        document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
      const meta: Record<string, string> = {};
      if (metaDesc) meta.description = metaDesc;

      return { title, headings, paragraphs, links, meta };
    });

    return { url, ...data };
  } finally {
    await page.close();
    await context.close();
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export class BrowserService {
  /**
   * Scrape a specific URL and return structured data.
   */
  async scrape(url: string): Promise<BrowserScrapeResult> {
    return extractPageData(url);
  }

  /**
   * Search DuckDuckGo for a query and return the top results page data.
   * Also follows the first result to get real content.
   */
  async search(query: string): Promise<{
    searchResults: BrowserScrapeResult;
    topResults: BrowserScrapeResult[];
  }> {
    const searchUrl = SEARCH_ENGINE + encodeURIComponent(query);
    const context = await newContext();
    const page = await context.newPage();

    let topUrls: string[] = [];
    let searchResults: BrowserScrapeResult;

    try {
      await page.goto(searchUrl, { waitUntil: DEFAULT_WAIT, timeout: NAVIGATE_TIMEOUT });

      // Extract search result links from DuckDuckGo
      const extractedData = await page.evaluate(() => {
        const title = document.title;
        const headings: string[] = [];
        const paragraphs: string[] = [];
        const links: { text: string; href: string }[] = [];

        // DuckDuckGo result links
        document.querySelectorAll('[data-testid="result-title-a"], .result__a').forEach((a) => {
          const href = (a as HTMLAnchorElement).href;
          const text = a.textContent?.trim() ?? '';
          if (href && text && !href.includes('duckduckgo.com')) {
            links.push({ text, href });
          }
        });

        // Fallback: grab all external links
        if (links.length === 0) {
          document.querySelectorAll('a[href]').forEach((a) => {
            const href = (a as HTMLAnchorElement).href;
            const text = a.textContent?.trim() ?? '';
            if (href.startsWith('http') && !href.includes('duckduckgo.com') && text.length > 5) {
              links.push({ text, href });
            }
          });
        }

        // Result snippets
        document.querySelectorAll('.result__snippet, [data-testid="result-snippet"]').forEach((s) => {
          const t = s.textContent?.trim() ?? '';
          if (t) paragraphs.push(t);
        });

        return { title, headings, paragraphs, links: links.slice(0, 10) };
      });

      topUrls = extractedData.links.slice(0, 3).map((l) => l.href);
      searchResults = { url: searchUrl, ...extractedData };
    } finally {
      await page.close();
      await context.close();
    }

    // Scrape top 2 results for richer content
    const topResults: BrowserScrapeResult[] = [];
    for (const url of topUrls.slice(0, 2)) {
      try {
        const result = await extractPageData(url);
        topResults.push(result);
      } catch {
        // Skip failed pages silently
      }
    }

    return { searchResults, topResults };
  }

  /**
   * Graceful shutdown — call during server teardown.
   */
  async close(): Promise<void> {
    if (_browser) {
      await _browser.close();
      _browser = null;
    }
  }
}

// Export singleton for API routes
export const browserService = new BrowserService();
