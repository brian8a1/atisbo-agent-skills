# atisbo

The official TypeScript client for [Atisbo](https://atisbo.dev)'s two public MCP servers. Zero dependencies, ESM + CommonJS, Node 20+.

Atisbo is a product decision backlog: customer evidence arrives as **Signals**, groups into **Opportunities**, becomes a decided **Solution**, and is checked against an observed **Outcome** after launch. Agents work with it through MCP — this client is the plain-HTTP way to do that from Node without a framework.

## Quickstart

```js
import { AtisboMcpClient } from 'atisbo';

// 1. The documentation server needs nothing at all.
const docs = new AtisboMcpClient({ server: 'docs' });
const { results } = await docs.searchDocs('how do agents connect');
const page = await docs.getDoc(results[0].url);
console.log(page.title, page.body.slice(0, 200));

// 2. The product server reads your workspace. Create a key in
//    Settings → Account → Connect agents.
const atisbo = new AtisboMcpClient({
  server: 'product',
  apiKey: process.env.ATISBO_MCP_KEY,
});
await atisbo.initialize();
const snapshot = await atisbo.toolsCall('atisbo_orient', { mode: 'snapshot' });
```

That is the whole API surface most callers need.

## The two servers

| | `server: 'docs'` | `server: 'product'` |
|---|---|---|
| Endpoint | `POST https://app.atisbo.dev/api/mcp-docs` | `POST https://app.atisbo.dev/api/mcp` |
| Auth | none | `Authorization: Bearer <key>` for every `tools/call`; discovery answers without it |
| Key source | not needed | app → Settings → Account → Connect agents (workspace-scoped, revocable) |
| Tools | `search_docs`, `get_doc`, `list_docs` | `atisbo_orient`, `atisbo_lookup`, `atisbo_capture`, `atisbo_decide`, `atisbo_map`, `atisbo_analyze` |
| Rate limit | 30 requests/min/IP | rate limited; back off on `AtisboRateLimitError` |

Both speak JSON-RPC 2.0 over Streamable HTTP and answer `application/json`.

## API

```ts
new AtisboMcpClient({
  server: 'docs' | 'product',
  baseUrl?,   // default https://app.atisbo.dev
  apiKey?,    // product server only
  timeoutMs?, // per request, default 30_000
  fetchImpl?, // inject your own fetch (tests, proxies)
})

await client.initialize();               // handshake + notifications/initialized (optional here)
await client.ping();
await client.toolsList();                // McpTool[]
await client.resourcesList();            // McpResource[]
await client.resourcesRead(uri);         // McpResourceContents[]
await client.toolsCall(name, args?);     // raw MCP result envelope

// Docs conveniences (parse structuredContent so you do not have to):
await client.searchDocs(query, limit?);  // DocsSearchResult  — ranked page references
await client.getDoc(url);                // DocsPage          — .body is the markdown
await client.listDocs(limit?);           // DocsListResult    — .documents + .total
```

Notes learned from the live servers:

- `initialize()` is polite but not required by either server — every method answered before a handshake when probed. Calling it first is still the spec-correct posture.
- `toolsCall` returns a result with `isError` rather than throwing on tool-level failure: the call reached the tool, and only you know whether that failure is fatal for your flow.
- A `mcp-session-id` handed back by the server is captured and echoed on later requests.

## Error handling

Every rejection is one of these; check with `instanceof`.

| Class | When | What to do |
|---|---|---|
| `AtisboAuthError` | HTTP 401 from the product server | Create a workspace key (Settings → Account → Connect agents) and pass it as `apiKey`. `.challenge` holds the server's `WWW-Authenticate` header |
| `AtisboRateLimitError` | HTTP 429 | Wait `.retryAfterMs` if present, then retry once. The docs server allows 30 req/min/IP |
| `AtisboRpcError` | Server answered a JSON-RPC error | `.rpcCode` (`-32601` unknown method/tool, `-32602` invalid arguments, `-32000` server fault), `.message` is the server's own text |
| `AtisboTimeoutError` | No answer within `timeoutMs` | Nothing was retried; decide whether to retry yourself |
| `AtisboHttpError` | Any other non-2xx | `.status` and a clipped `.body` |
| `AtisboProtocolError` | Response was not usable JSON-RPC | Usually means a proxy or middleware rewrote the response |

```js
import { AtisboRateLimitError } from 'atisbo';

try {
  await client.searchDocs(query);
} catch (err) {
  if (err instanceof AtisboRateLimitError) {
    await new Promise((r) => setTimeout(r, err.retryAfterMs ?? 5_000));
  }
}
```

The client never retries on its own: an automatic retry hides why the first attempt failed.

## Development

```bash
npm install
npm run build        # tsc → dist/esm + dist/cjs (no bundler)
npm test             # builds, then runs offline tests with mocked fetch

ATISBO_INTEGRATION=1 npm test   # additionally exercises the live docs server
```

License: MIT.
