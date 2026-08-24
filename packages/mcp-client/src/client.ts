/**
 * @file client.ts — AtisboMcpClient, a dependency-free TypeScript client for Atisbo's two
 * public MCP servers.
 *
 * Endpoints (both verified live on 2026-08-24):
 *   docs    → POST {baseUrl}/api/mcp-docs  (public, no auth; 30 requests/min/IP)
 *   product → POST {baseUrl}/api/mcp       (discovery without a key; every tools/call
 *                                           needs `Authorization: Bearer <key>`)
 *
 * KEY DECISIONS:
 * - Plain request/response JSON-RPC over Streamable HTTP. Both servers answer
 *   `application/json`; the response reader still understands a `text/event-stream` body so
 *   a server-side change to streaming cannot turn this client's errors cryptic.
 * - No automatic retries anywhere: a rate limit or a 5xx is surfaced as a typed error and
 *   the caller decides. Retrying inside the library hides why the first attempt failed.
 * - `initialize()` is optional against these servers — every method answered correctly
 *   before a handshake when probed — but calling it is the spec-correct posture, so it sends
 *   `notifications/initialized` best-effort afterwards and tolerates that POST failing.
 * - The `mcp-session-id` response header is captured once seen and echoed on later requests,
 *   per Streamable HTTP. Verified harmless: both servers tolerate an unknown session id.
 */

import {
  AtisboAuthError,
  AtisboError,
  AtisboHttpError,
  AtisboProtocolError,
  AtisboRateLimitError,
  AtisboRpcError,
  AtisboTimeoutError,
} from './errors.js';
import type {
  AtisboServer,
  DocsListResult,
  DocsPage,
  DocsSearchResult,
  JsonRpcResponse,
  McpContentBlock,
  McpInitializeResult,
  McpResource,
  McpResourceContents,
  McpResourcesListResult,
  McpResourcesReadResult,
  McpTool,
  McpToolCallResult,
  McpToolsListResult,
} from './types.js';

const DEFAULT_BASE_URL = 'https://app.atisbo.dev';
/** Negotiated downward: servers advertise 2025-06-18 today. */
const PROTOCOL_VERSION = '2025-06-18';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_CLIENT_INFO = { name: 'atisbo-mcp-client', version: '0.1.0' };

const ENDPOINTS: Record<AtisboServer, string> = {
  docs: '/api/mcp-docs',
  product: '/api/mcp',
};

export interface AtisboMcpClientOptions {
  /** Which of the two public servers to talk to. */
  server: AtisboServer;
  /** Defaults to https://app.atisbo.dev. Override for previews or a proxy. */
  baseUrl?: string;
  /**
   * Workspace-scoped API key (Settings → Account → Connect agents). Only the product server
   * reads it; passing one to the docs server is allowed and simply sent.
   */
  apiKey?: string;
  /** Per-request timeout covering connection + body read. Default 30_000 ms. */
  timeoutMs?: number;
  /** Injectable fetch for tests and non-standard runtimes. Defaults to globalThis.fetch. */
  fetchImpl?: typeof fetch;
  /** Identifies your integration in the server's logs. Overriding it is fine. */
  clientInfo?: { name: string; version: string };
}

/**
 * Client for one Atisbo MCP server. One instance per server; instances are stateless beyond
 * the id counter and the session id, so sharing one across concurrent calls is safe.
 *
 * @example
 * const docs = new AtisboMcpClient({ server: 'docs' });
 * const hits = await docs.searchDocs('how do agents connect');
 *
 * const atisbo = new AtisboMcpClient({ server: 'product', apiKey: process.env.ATISBO_MCP_KEY });
 * await atisbo.initialize();
 * const snapshot = await atisbo.toolsCall('atisbo_orient', { mode: 'snapshot' });
 */
export class AtisboMcpClient {
  readonly server: AtisboServer;
  readonly baseUrl: string;

  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly clientInfo: { name: string; version: string };

  private nextId = 1;
  private sessionId: string | null = null;
  private initResult: McpInitializeResult | null = null;

  constructor(options: AtisboMcpClientOptions) {
    if (options.server !== 'docs' && options.server !== 'product') {
      throw new Error(`AtisboMcpClient: server must be "docs" or "product", got "${String(options.server)}"`);
    }
    if (options.timeoutMs !== undefined && (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0)) {
      throw new Error('AtisboMcpClient: timeoutMs must be a positive number of milliseconds');
    }
    this.server = options.server;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    // Bind once: Node's global fetch throws "GlobalFetch not registered"-style errors when
    // invoked with a foreign `this`.
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.clientInfo = options.clientInfo ?? DEFAULT_CLIENT_INFO;
  }

  /** Server identity returned by `initialize`, or null before the handshake. */
  get serverInfo(): Readonly<McpInitializeResult['serverInfo']> | null {
    return this.initResult?.serverInfo ?? null;
  }

  /** True once `initialize()` has resolved successfully. */
  get initialized(): boolean {
    return this.initResult !== null;
  }

  // ── MCP methods ───────────────────────────────────────────────────────────────

  /**
   * Handshake. Stores the negotiated result and sends `notifications/initialized`
   * best-effort (a failure there never fails the handshake).
   */
  async initialize(): Promise<McpInitializeResult> {
    const result = await this.request<McpInitializeResult>('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: this.clientInfo,
    });
    this.initResult = result;
    try {
      await this.notify('notifications/initialized');
    } catch {
      // Both servers are stateless per request (an unknown session id is tolerated), so a
      // failed notification costs nothing downstream.
    }
    return result;
  }

  /** Liveness check. Resolves void; rejects with the usual typed errors. */
  async ping(): Promise<void> {
    await this.request<Record<string, never>>('ping');
  }

  async toolsList(): Promise<McpTool[]> {
    const result = await this.request<McpToolsListResult>('tools/list');
    return result.tools;
  }

  async resourcesList(): Promise<McpResource[]> {
    const result = await this.request<McpResourcesListResult>('resources/list');
    return result.resources;
  }

  /** Read one resource by its absolute URI, as listed by {@link resourcesList}. */
  async resourcesRead(uri: string): Promise<McpResourceContents[]> {
    if (!uri) throw new Error('resourcesRead: uri is required');
    const result = await this.request<McpResourcesReadResult>('resources/read', { uri });
    return result.contents;
  }

  /**
   * Call any tool by name.
   *
   * @returns The raw MCP result envelope, including `structuredContent` when the tool emits
   *          it. An `isError: true` result is RETURNED, not thrown: the call reached the
   *          tool, and only the caller knows whether a tool-level failure is fatal for it.
   */
  async toolsCall(name: string, args?: Record<string, unknown>): Promise<McpToolCallResult> {
    if (!name) throw new Error('toolsCall: tool name is required');
    return this.request<McpToolCallResult>('tools/call', {
      name,
      ...(args === undefined ? {} : { arguments: args }),
    });
  }

  // ── Docs conveniences ─────────────────────────────────────────────────────────

  /** Search the documentation. Returns ranked page references. */
  async searchDocs(query: string, limit?: number): Promise<DocsSearchResult> {
    const result = await this.toolsCall('search_docs', {
      query,
      ...(limit === undefined ? {} : { limit }),
    });
    return this.structured<DocsSearchResult>(result);
  }

  /** Read one documentation page. `page.body` holds its markdown. */
  async getDoc(url: string): Promise<DocsPage> {
    const result = await this.toolsCall('get_doc', { url });
    return this.structured<DocsPage>(result);
  }

  /** List documentation pages. Omit `limit` for the whole corpus — the tool trims, never pages. */
  async listDocs(limit?: number): Promise<DocsListResult> {
    const result = await this.toolsCall('list_docs', limit === undefined ? {} : { limit });
    return this.structured<DocsListResult>(result);
  }

  // ── Plumbing ──────────────────────────────────────────────────────────────────

  private endpoint(): string {
    return `${this.baseUrl}${ENDPOINTS[this.server]}`;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      ...extra,
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    if (this.sessionId) headers['mcp-session-id'] = this.sessionId;
    return headers;
  }

  /** JSON-RPC request/response round trip. Rejects with typed errors, never raw ones. */
  private async request<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    const id = this.nextId++;
    const text = await this.post({ jsonrpc: '2.0', id, method, ...(params === undefined ? {} : { params }) });
    const payload = this.parseFrame(text, id);

    if (payload.error) {
      throw new AtisboRpcError(payload.error.code, payload.error.message, {
        data: payload.error.data,
        method,
      });
    }
    if (!('result' in payload)) {
      throw new AtisboProtocolError(
        `${method}: response carried neither result nor error (id ${JSON.stringify(payload.id ?? null)})`,
      );
    }
    return payload.result as T;
  }

  /** Fire-and-forget notification (no id). Resolves regardless of the HTTP outcome. */
  private async notify(method: string): Promise<void> {
    await this.post({ jsonrpc: '2.0', method });
  }

  /**
   * POST one frame and return the response body as text.
   *
   * The abort timer covers connection AND body read; `clearTimeout` runs only after
   * `res.text()` has resolved, because a timeout that stops at headers would still hang on a
   * stalled body. Typed HTTP-status errors are thrown from inside the try so the same
   * finally clears their timer too.
   */
  private async post(body: unknown): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(this.endpoint(), {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const text = await res.text();

      // Spec-assigned session id: echo it on every subsequent request.
      const assigned = res.headers.get('mcp-session-id');
      if (assigned) this.sessionId = assigned;

      if (res.status === 401) {
        throw new AtisboAuthError(
          `${this.server} server rejected the credential (HTTP 401). Product tools/call needs a `
          + 'workspace-scoped API key: app Settings → Account → Connect agents, then pass it as '
          + '`new AtisboMcpClient({ server: "product", apiKey })`. Docs server needs no key.',
          res.headers.get('www-authenticate') ?? undefined,
        );
      }
      if (res.status === 429) {
        throw new AtisboRateLimitError(
          `${this.server} server rate limited this client (HTTP 429)`
            + (this.server === 'docs' ? ' — docs allows 30 requests/min/IP' : ''),
          parseRetryAfter(res.headers.get('retry-after')),
        );
      }
      if (!res.ok) {
        throw new AtisboHttpError(res.status, `${this.server} server returned HTTP ${res.status}`, clip(text));
      }
      return text;
    } catch (err) {
      // An abort here means OUR timer fired — fetch rejects with a generic AbortError whose
      // message says nothing about who aborted or why, so replace it with one that does.
      // Only foreign errors are converted: a typed status error thrown a moment before the
      // timer fired is the real cause and must keep its identity. Everything else (DNS
      // failure, ECONNRESET, ...) is rethrown verbatim; wrapping it would only blur the cause.
      if (!(err instanceof AtisboError) && controller.signal.aborted) {
        throw new AtisboTimeoutError(`${this.server} server did not answer within ${this.timeoutMs} ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Parse a response body into a JSON-RPC frame, tolerating an SSE-wrapped answer. */
  private parseFrame(text: string, expectedId: number): JsonRpcResponse {
    const direct = tryParseJson<JsonRpcResponse>(text);
    if (direct !== undefined) return this.assertAnswers(direct, expectedId, text);

    // Streamable HTTP allows the server to answer with text/event-stream even when the
    // client asked for JSON. Frames look like: `data: {"jsonrpc":"2.0",...}`.
    const frames = text
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => tryParseJson<JsonRpcResponse>(line.slice(5).trim()))
      .filter((frame): frame is JsonRpcResponse => frame !== undefined);
    const match = frames.find((f) => f.id === expectedId) ?? frames.find((f) => f.result !== undefined || f.error !== undefined);
    if (match) return this.assertAnswers(match, expectedId, text);

    throw new AtisboProtocolError(`unparseable response from ${this.endpoint()}: ${clip(text)}`);
  }

  private assertAnswers(frame: JsonRpcResponse, expectedId: number, raw: string): JsonRpcResponse {
    // Notifications have no id, but we only parse frames we sent an id for.
    if (frame.id !== undefined && frame.id !== expectedId) {
      throw new AtisboProtocolError(
        `response id ${JSON.stringify(frame.id)} does not match request id ${expectedId}`,
      );
    }
    if (frame.jsonrpc !== undefined && frame.jsonrpc !== '2.0') {
      throw new AtisboProtocolError(`unexpected jsonrpc version ${JSON.stringify(frame.jsonrpc)} in: ${clip(raw)}`);
    }
    return frame;
  }

  /**
   * Extract the useful payload of a tools/call result: `structuredContent` when present,
   * else the parsed JSON of the first text block, else its raw text.
   */
  private structured<T>(result: McpToolCallResult): T {
    if (result.structuredContent !== undefined) return result.structuredContent as T;
    const block = result.content.find((c): c is Extract<McpContentBlock, { type: 'text' }> => c.type === 'text');
    if (!block) throw new AtisboProtocolError('tools/call result had no text content to read');
    const parsed = tryParseJson<unknown>(block.text);
    return (parsed === undefined ? block.text : parsed) as T;
  }
}

function tryParseJson<T>(text: string): T | undefined {
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

function clip(text: string, max = 500): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}
