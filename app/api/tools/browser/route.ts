import { NextRequest, NextResponse } from 'next/server';
import { browserService } from '@/services/browser/browserService';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, url } = body as { query?: string; url?: string };

    if (!query && !url) {
      return NextResponse.json(
        { error: 'Provide either "query" (for search) or "url" (for direct scrape)' },
        { status: 400 }
      );
    }

    if (url) {
      // Direct URL scrape
      const result = await browserService.scrape(url);
      return NextResponse.json(result, { status: 200 });
    }

    // Search query
    const result = await browserService.search(query!);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[/api/tools/browser] Error:', err);
    const message = err instanceof Error ? err.message : 'Browser tool failed';
    return NextResponse.json({ error: message, searchResults: null, topResults: [] }, { status: 500 });
  }
}
