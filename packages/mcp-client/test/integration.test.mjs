/**
 * integration.test.mjs — one test against the LIVE docs server.
 *
 * Skipped unless ATISBO_INTEGRATION=1, so `npm test` stays offline and never burns the docs
 * server's 30 req/min/IP budget in CI:
 *
 *   ATISBO_INTEGRATION=1 npm test
 *
 * Only the public docs server is touched. The product server is deliberately NOT exercised
 * here: it would need a workspace API key, and no automated run should hold one.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { AtisboMcpClient } from '../dist/esm/index.js';

const RUN_LIVE = process.env.ATISBO_INTEGRATION === '1';

test(
  'live docs server: initialize → ping → tools/list → search → list → resources/read',
  { skip: RUN_LIVE ? false : 'set ATISBO_INTEGRATION=1 to hit https://app.atisbo.dev/api/mcp-docs' },
  async () => {
    const client = new AtisboMcpClient({ server: 'docs', timeoutMs: 15_000 });

    const init = await client.initialize();
    assert.equal(init.serverInfo.name, 'atisbo-docs-mcp-server');
    console.log('  initialize →', init.serverInfo.name, init.protocolVersion);

    await client.ping();
    console.log('  ping       → ok');

    const tools = await client.toolsList();
    assert.ok(tools.length >= 3);
    assert.deepEqual(
      tools.map((t) => t.name).sort(),
      ['get_doc', 'list_docs', 'search_docs'],
    );
    console.log('  tools      →', tools.map((t) => t.name).join(', '));

    const search = await client.searchDocs('how do agents connect to atisbo', 3);
    assert.ok(Array.isArray(search.results));
    assert.ok(search.results.length > 0, 'expected at least one doc hit');
    assert.ok(search.results[0].url.startsWith('/'));
    console.log('  search     →', search.results.map((r) => r.title).join(' | '));

    const top = await client.getDoc(search.results[0].url);
    assert.equal(top.url, search.results[0].url);
    assert.ok(top.body.length > 100, 'expected a real page body');
    console.log(`  get_doc    → "${top.title}" (${top.body.length} chars of markdown)`);

    const listed = await client.listDocs(5);
    assert.equal(listed.documents.length, Math.min(5, listed.count));
    assert.ok(listed.total >= listed.count);
    console.log(`  list_docs  → ${listed.documents.length}/${listed.total} pages`);

    const resources = await client.resourcesList();
    assert.ok(resources.length > 0);
    const page = resources.find((r) => r.uri.endsWith('/docs/api/mcp-server'));
    assert.ok(page, 'expected the MCP server page among resources');
    const [contents] = await client.resourcesRead(page.uri);
    assert.match(contents.text ?? '', /Model Context Protocol|MCP/);
    console.log(`  resources  → read ${page.uri} (${(contents.text ?? '').length} chars)`);
  },
);
