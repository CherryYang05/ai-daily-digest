import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSources, selectFeeds } from './sources.ts';

const base = { id: 'test', name: 'Test', htmlUrl: 'https://example.com', xmlUrl: 'https://example.com/feed', enabled: true, health: '可读取', fetchMethod: 'RSS/Atom' };
async function withCatalog(value, fn) {
  const directory = await mkdtemp(join(tmpdir(), 'digest-sources-'));
  try {
    const path = join(directory, 'sources.json');
    await writeFile(path, JSON.stringify(value));
    await fn(path);
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test('catalog loads relative to module, independent of working directory', async () => {
  const sources = await loadSources();
  assert.ok(sources.length > 0);
  assert.ok(selectFeeds(sources).length > 0);
});
test('web, disabled, and unhealthy sources do not enter RSS pipeline', () => {
  assert.deepEqual(selectFeeds([base, { ...base, enabled: false }, { ...base, health: '失败' }, { ...base, fetchMethod: '网页' }, { ...base, xmlUrl: null }]),
    [{ name: base.name, htmlUrl: base.htmlUrl, xmlUrl: base.xmlUrl }]);
});
test('malformed catalogs are rejected', async () => {
  for (const value of [{}, [], [null], [{ ...base, htmlUrl: 'file:///local' }], [{ ...base, xmlUrl: null }], [base, base], [base, { ...base, id: 'another' }]]) {
    await withCatalog(value, async path => { await assert.rejects(loadSources(path)); });
  }
});
test('web source with null feed remains in catalog', async () => {
  await withCatalog([{ ...base, xmlUrl: null, fetchMethod: '网页' }], async path => {
    const sources = await loadSources(path);
    assert.equal(sources.length, 1);
    assert.deepEqual(selectFeeds(sources), []);
  });
});
