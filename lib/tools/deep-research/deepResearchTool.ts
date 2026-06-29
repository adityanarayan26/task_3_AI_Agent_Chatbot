import type { ToolLogEntry, DeepResearchResult } from '@/types';

const SEARCH_QUERIES_PER_TOPIC = 3;

/**
 * Deep Research Tool
 *
 * Orchestrates multiple browser search iterations to compile a comprehensive
 * research report with cross-referenced sources.
 */
export async function runDeepResearchTool(
  args: { topic: string },
  _logs: ToolLogEntry[],
  addLog: (step: string, detail?: string) => void
): Promise<DeepResearchResult> {
  addLog('🔬 Deep research activated', `Topic: ${args.topic}`);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Generate search query variants for broader coverage
  const queries = generateSearchQueries(args.topic);
  addLog('📋 Research plan', `Running ${queries.length} targeted searches`);

  const allResults: Array<{ query: string; data: any }> = [];

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    addLog(`🔍 Search ${i + 1}/${queries.length}`, query);

    try {
      const response = await fetch(`${baseUrl}/api/tools/browser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        allResults.push({ query, data });
        const resultCount = (data.topResults?.length ?? 0) + 1;
        addLog(`✅ Search ${i + 1} complete`, `Found ${resultCount} source(s)`);
      }
    } catch (err) {
      addLog(`⚠️ Search ${i + 1} failed`, err instanceof Error ? err.message : 'Unknown error');
    }
  }

  addLog('🧩 Compiling research...', `Processing ${allResults.length} search results`);

  // Compile sources from all results
  const sources: DeepResearchResult['sources'] = [];
  for (const { data } of allResults) {
    if (data.searchResults?.links) {
      for (const link of data.searchResults.links.slice(0, 3)) {
        if (link.href && link.text) {
          sources.push({
            title: link.text,
            url: link.href,
            snippet: data.searchResults.paragraphs?.[0] ?? '',
          });
        }
      }
    }
    for (const page of data.topResults ?? []) {
      sources.push({
        title: page.title,
        url: page.url,
        snippet: page.paragraphs?.[0] ?? '',
      });
    }
  }

  // Deduplicate sources
  const seenUrls = new Set<string>();
  const uniqueSources = sources.filter((s) => {
    if (seenUrls.has(s.url)) return false;
    seenUrls.add(s.url);
    return true;
  });

  // Build sections from gathered content
  const sections = buildResearchSections(args.topic, allResults);

  const result: DeepResearchResult = {
    topic: args.topic,
    summary: `Research compilation on "${args.topic}" — ${uniqueSources.length} sources reviewed across ${allResults.length} search iterations.`,
    sections,
    sources: uniqueSources.slice(0, 15),
  };

  addLog('✅ Research complete', `${uniqueSources.length} sources compiled`);
  return result;
}

/**
 * Generate diverse search queries for a topic.
 */
function generateSearchQueries(topic: string): string[] {
  return [
    topic,
    `${topic} latest news 2024 2025`,
    `${topic} explained overview`,
  ].slice(0, SEARCH_QUERIES_PER_TOPIC);
}

/**
 * Structure the raw search results into research sections.
 */
function buildResearchSections(
  topic: string,
  results: Array<{ query: string; data: any }>
): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];

  for (const { query, data } of results) {
    const paragraphs: string[] = [
      ...(data.searchResults?.paragraphs ?? []),
      ...(data.topResults ?? []).flatMap((p: any) => p.paragraphs ?? []),
    ].filter(Boolean).slice(0, 5);

    if (paragraphs.length > 0) {
      sections.push({
        title: `Findings: ${query}`,
        content: paragraphs.join('\n\n'),
      });
    }
  }

  if (sections.length === 0) {
    sections.push({
      title: 'Overview',
      content: `Research data on "${topic}" was gathered but needs further analysis.`,
    });
  }

  return sections;
}
