/**
 * client.test.mjs — offline unit tests. Every test drives AtisboMcpClient through an
 * injected fetchImpl, so nothing here touches the network.
 *
 * These import the BUILT client (dist/esm) on purpose: they exercise the artifact that
 * ships, which is what makes `npm test` a real gate rather than a check of source text.
 * `npm run build` runs first via the test script.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AtisboAuthError,
  AtisboHttpError,
  AtisboProtocolError,
  AtisboRateLimitError,
  AtisboRpcError,
  AtisboTimeoutError,
  AtisboMcpClient,
} from '../dist/esm/index.js';

/** Minimal Response stand-in: node:test runs without a server, so build one by hand. */
function jsonResponse(status, body, headers = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'test',
    text: async () => text,
    headers: new Headers(headers),
  };
}

/** Records requests, answers them from `routes`, returns the log. */
function mockFetch(routes) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, init, body });
    const handler = typeof routes === 'function' ? routes(body, init) : routes[body.method];
    if (!handler) throw new Error(`mockFetch: no route for method ${body.method}`);
    return jsonResponse(handler.status ?? 200, handler.body ?? {}, handler.headers);
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

const INIT_RESULT = {
  protocolVersion: '2025-06-18',
  capabilities: { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false } },
  serverInfo: { name: 'atisbo-docs-mcp-server', title: 'Atisbo Documentation', version: '1.0.0' },
};

test('constructor rejects an unknown server', () => {
  assert.throws(() => new AtisboMcpClient({ server: 'staging' }), /server must be "docs" or "product"/);
});

test('docs client posts JSON-RPC to /api/mcp-docs without an Authorization header', async () => {
  const fetchImpl = mockFetch({
    initialize: { body: { jsonrpc: '2.0', id: 1, result: INIT_RESULT } },
    ping: { body: { jsonrpc: '2.0', id: 2, result: {} } },
  });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });

  await client.initialize();
  await client.ping();

  assert.equal(fetchImpl.calls.length, 3); // initialize + notifications/initialized + ping
  const [init] = fetchImpl.calls;
  assert.equal(init.url, 'https://app.atisbo.dev/api/mcp-docs');
  assert.equal(init.body.jsonrpc, '2.0');
  assert.equal(init.body.id, 1);
  assert.equal(init.init.headers.authorization, undefined);
  assert.ok(init.init.headers.accept.includes('application/json'));
});

test('product client targets /api/mcp and sends the bearer key', async () => {
  const fetchImpl = mockFetch({
    initialize: {
      headers: { 'content-type': 'application/json' },
      body: {
        jsonrpc: '2.0',
        id: 1,
        result: { ...INIT_RESULT, serverInfo: { name: 'atisbo-mcp-server', version: '1.0.0' } },
      },
    },
  });
  const client = new AtisboMcpClient({ server: 'product', apiKey: 'sk-test', fetchImpl });
  await client.initialize();

  const call = fetchImpl.calls[0];
  assert.equal(call.url, 'https://app.atisbo.dev/api/mcp');
  assert.equal(call.init.headers.authorization, 'Bearer sk-test');
});

test('ids increment across requests and every response is matched to its own request', async () => {
  let seenIds = [];
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body);
    seenIds.push(body.id);
    return jsonResponse(200, { jsonrpc: '2.0', id: body.id, result: {} });
  };
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  await client.ping();
  await client.ping();
  await client.ping();
  // Notifications carry no id, so only the three pings appear here.
  assert.deepEqual(seenIds, [1, 2, 3]);
});

test('a mcp-session-id handed back once is echoed on later requests', async () => {
  const seenSessionHeaders = [];
  let assignNext = true;
  const fetchImpl = async (url, init) => {
    seenSessionHeaders.push(init.headers['mcp-session-id'] ?? null);
    const body = JSON.parse(init.body);
    return jsonResponse(
      200,
      { jsonrpc: '2.0', ...(body.id !== undefined ? { id: body.id } : {}), result: {} },
      assignNext ? { 'mcp-session-id': 'sess-123' } : {},
    );
  };
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  await client.initialize(); // server assigns here
  assignNext = false; // ...and never again
  await client.ping();
  assert.equal(seenSessionHeaders[0], null); // nothing to echo before the handshake
  assert.equal(seenSessionHeaders[seenSessionHeaders.length - 1], 'sess-123');
});

test('toolsList unwraps result.tools', async () => {
  const fetchImpl = mockFetch({
    'tools/list': {
      body: {
        jsonrpc: '2.0',
        id: 1,
        result: { tools: [{ name: 'search_docs', inputSchema: { type: 'object' } }] },
      },
    },
  });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  const tools = await client.toolsList();
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, 'search_docs');
  assert.equal(JSON.parse(fetchImpl.calls[0].init.body).method, 'tools/list');
});

test('JSON-RPC error becomes AtisboRpcError carrying code, message and data', async () => {
  const fetchImpl = mockFetch({
    // The live server answers exactly this for an unknown tool name.
    'tools/call': {
      body: {
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32601, message: 'Unknown tool: nope. Available: search_docs, get_doc, list_docs' },
      },
    },
  });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  await assert.rejects(
    () => client.toolsCall('nope'),
    (err) => {
      assert.ok(err instanceof AtisboRpcError);
      assert.equal(err.rpcCode, -32601);
      assert.match(err.message, /Unknown tool: nope/);
      assert.equal(err.method, 'tools/call');
      return true;
    },
  );
});

test('invalid params (-32602) surfaces verbatim from the server', async () => {
  const fetchImpl = mockFetch({
    'tools/call': {
      body: {
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32602, message: 'query is required and must be 1-500 characters' },
      },
    },
  });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  await assert.rejects(
    () => client.searchDocs(''),
    (err) => err instanceof AtisboRpcError && err.rpcCode === -32602,
  );
});

test('HTTP 401 becomes AtisboAuthError that says where to create a key', async () => {
  const challenge = 'Bearer resource_metadata="https://app.atisbo.dev/.well-known/oauth-protected-resource"';
  const fetchImpl = () =>
    jsonResponse(
      401,
      { jsonrpc: '2.0', error: { code: -32000, message: 'Invalid or missing API key' } },
      { 'www-authenticate': challenge },
    );
  const client = new AtisboMcpClient({ server: 'product', apiKey: 'wrong-key', fetchImpl });
  await assert.rejects(
    () => client.toolsCall('atisbo_orient', { mode: 'snapshot' }),
    (err) => {
      assert.ok(err instanceof AtisboAuthError);
      assert.equal(err.status, 401);
      assert.equal(err.challenge, challenge);
      assert.match(err.message, /Settings → Account → Connect agents/);
      return true;
    },
  );
});

test('HTTP 429 becomes AtisboRateLimitError with Retry-After in milliseconds', async () => {
  const fetchImpl = () => jsonResponse(429, { error: 'slow down' }, { 'retry-after': '2' });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  await assert.rejects(
    () => client.toolsList(),
    (err) => {
      assert.ok(err instanceof AtisboRateLimitError);
      assert.equal(err.retryAfterMs, 2000);
      assert.match(err.message, /30 requests\/min\/IP/);
      return true;
    },
  );
});

test('other HTTP errors become AtisboHttpError with a clipped body', async () => {
  const fetchImpl = () => jsonResponse(503, 'x'.repeat(2000));
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  await assert.rejects(
    () => client.toolsList(),
    (err) => {
      assert.ok(err instanceof AtisboHttpError);
      assert.equal(err.status, 503);
      assert.equal(err.body?.length, 501); // 500 chars + ellipsis
      return true;
    },
  );
});

test('a slow response aborts into AtisboTimeoutError', async () => {
  const fetchImpl = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        reject(new Error('The operation was aborted'));
      });
    });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl, timeoutMs: 25 });
  await assert.rejects(() => client.toolsList(), AtisboTimeoutError);
});

test('an SSE-wrapped answer is read instead of failing', async () => {
  const frame = JSON.stringify({ jsonrpc: '2.0', id: 1, result: { tools: [] } });
  const sse = `event: message\ndata: ${frame}\n\n`;
  const fetchImpl = () =>
    jsonResponse(200, sse, { 'content-type': 'text/event-stream' });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  assert.deepEqual(await client.toolsList(), []);
});

test('a frame answering a different id is a protocol error, not a silent mismatch', async () => {
  const fetchImpl = () => jsonResponse(200, { jsonrpc: '2.0', id: 99, result: {} });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  await assert.rejects(() => client.toolsList(), AtisboProtocolError);
});

test('baseUrl override changes the endpoint', async () => {
  const fetchImpl = mockFetch({
    ping: { body: { jsonrpc: '2.0', id: 1, result: {} } },
  });
  const client = new AtisboMcpClient({ server: 'docs', baseUrl: 'https://preview.example.dev/', fetchImpl });
  await client.ping();
  assert.equal(fetchImpl.calls[0].url, 'https://preview.example.dev/api/mcp-docs');
});

test('toolsCall omits arguments when none are given', async () => {
  const fetchImpl = mockFetch({ 'tools/call': { body: { jsonrpc: '2.0', id: 1, result: { content: [] } } } });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  await client.toolsCall('list_docs');
  assert.deepEqual(fetchImpl.calls[0].body.params, { name: 'list_docs' });
});

test('docs conveniences prefer structuredContent over content text', async () => {
  const structured = { query: 'q', results: [{ url: '/docs', title: 'Docs', score: 9 }] };
  const fetchImpl = mockFetch({
    'tools/call': {
      body: {
        jsonrpc: '2.0',
        id: 1,
        result: {
          content: [{ type: 'text', text: '{"should":"be ignored"}' }],
          structuredContent: structured,
        },
      },
    },
  });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  const search = await client.searchDocs('q');
  assert.deepEqual(search.results[0], { url: '/docs', title: 'Docs', score: 9 });
});

test('getDoc falls back to parsing the text block when structuredContent is absent', async () => {
  const page = { url: '/docs/x', title: 'X', description: 'd', body: '# X' };
  const fetchImpl = mockFetch({
    'tools/call': { body: { jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: JSON.stringify(page) }] } } },
  });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  const got = await client.getDoc('/docs/x');
  assert.equal(got.body, '# X');
  assert.equal(got.title, 'X');
});

test('listDocs returns count and documents', async () => {
  const payload = { count: 1, limit: 1, total: 13, documents: [{ url: '/docs', title: 'Introduction' }] };
  const fetchImpl = mockFetch({
    'tools/call': { body: { jsonrpc: '2.0', id: 1, result: { content: [], structuredContent: payload } } },
  });
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  const listed = await client.listDocs(1);
  assert.equal(listed.total, 13);
  assert.equal(listed.documents.length, 1);
});

test('serverInfo reflects the handshake and initialized flips only after it succeeds', async () => {
  let fail = true;
  const fetchImpl = async (url, init) => {
    if (fail) return jsonResponse(500, 'nope');
    const body = JSON.parse(init.body);
    return jsonResponse(200, { jsonrpc: '2.0', id: body.id ?? null, result: INIT_RESULT });
  };
  const client = new AtisboMcpClient({ server: 'docs', fetchImpl });
  assert.equal(client.initialized, false);
  await assert.rejects(() => client.initialize());
  assert.equal(client.initialized, false);

  fail = false;
  const result = await client.initialize();
  assert.equal(client.serverInfo?.name, 'atisbo-docs-mcp-server');
  assert.equal(client.initialized, true);
  assert.equal(result.protocolVersion, '2025-06-18');
});
