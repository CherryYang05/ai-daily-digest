import { readFile } from 'node:fs/promises';

export interface Source {
  id: string;
  name: string;
  htmlUrl: string;
  xmlUrl: string | null;
  enabled: boolean;
  health: string;
  fetchMethod: string;
}

export async function loadSources(path: string | URL = new URL('../sources.json', import.meta.url)): Promise<Source[]> {
  const sources = JSON.parse(await readFile(path, 'utf8'));
  if (!Array.isArray(sources) || sources.length === 0) throw new Error('sources.json must be a non-empty array');
  const ids = new Set<string>();
  const sites = new Set<string>();
  const feeds = new Set<string>();
  for (const source of sources) {
    if (!source || typeof source.id !== 'string' || !source.id.trim() ||
        typeof source.name !== 'string' || !source.name.trim() ||
        typeof source.enabled !== 'boolean' || typeof source.health !== 'string' ||
        !['RSS/Atom', 'RSSHub', '网页', '待验证'].includes(source.fetchMethod)) {
      throw new Error('Invalid source fields');
    }
    if (ids.has(source.id)) throw new Error(`Duplicate source ID: ${source.id}`);
    ids.add(source.id);
    for (const [field, seen] of [['htmlUrl', sites], ['xmlUrl', feeds]] as const) {
      const value = source[field];
      if (field === 'xmlUrl' && value === null) continue;
      if (typeof value !== 'string') throw new Error(`Invalid ${field}: ${source.id}`);
      const url = new URL(value);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error(`Invalid URL scheme: ${source.id}`);
      const key = url.href.replace(/\/$/, '');
      if (seen.has(key)) throw new Error(`Duplicate ${field}: ${value}`);
      seen.add(key);
    }
    if (['RSS/Atom', 'RSSHub'].includes(source.fetchMethod) && !source.xmlUrl) {
      throw new Error(`Missing feed URL: ${source.id}`);
    }
  }
  return sources;
}

export function selectFeeds(sources: Source[]): Array<{ name: string; xmlUrl: string; htmlUrl: string }> {
  return sources.filter(source => source.enabled && source.health === '可读取' &&
    ['RSS/Atom', 'RSSHub'].includes(source.fetchMethod) && source.xmlUrl)
    .map(source => ({ name: source.name, xmlUrl: source.xmlUrl!, htmlUrl: source.htmlUrl }));
}
