/**
 * @file types.ts — JSON-RPC 2.0 / MCP protocol types and Atisbo docs domain types.
 *
 * KEY DECISIONS:
 * - Every shape here was verified against the live servers on 2026-08-24 (initialize,
 *   tools/list, resources/list, resources/read, tools/call, ping, notifications, and the
 *   -32000/-32601/-32602 fault bodies). Nothing is copied from the MCP specification
 *   blindly: fields these servers never emit are deliberately absent.
 * - `structuredContent` is typed as `unknown`, not a guessed interface: only the three docs
 *   tools were probed, and the six product tools return their own payloads.
 */

/** The two public Atisbo MCP servers. */
export type AtisboServer = 'docs' | 'product';

/** Standard `clientInfo` block sent during `initialize`. */
export interface McpImplementation {
  name: string;
  version: string;
  title?: string;
}

/** Result of a successful `initialize` handshake. */
export interface McpInitializeResult {
  protocolVersion: string;
  capabilities: Record<string, unknown>;
  serverInfo: McpImplementation;
  instructions?: string;
}

/** A tool advertised by `tools/list`. */
export interface McpTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}

export interface McpToolsListResult {
  tools: McpTool[];
}

/** A resource advertised by `resources/list`. URIs are absolute page URLs. */
export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpResourcesListResult {
  resources: McpResource[];
}

export interface McpResourceContents {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export interface McpResourcesReadResult {
  contents: McpResourceContents[];
}

/**
 * Text block inside a `tools/call` result. Both servers emit exactly one
 * `{ type: 'text', text }` block; the union stays open because MCP allows others.
 */
export type McpContentBlock =
  | { type: 'text'; text: string }
  | { type: string; [key: string]: unknown };

/** Result envelope of `tools/call`. */
export interface McpToolCallResult {
  content: McpContentBlock[];
  /** Present on every docs tool probed; the machine-readable twin of `content[0].text`. */
  structuredContent?: unknown;
  isError?: boolean;
}

// ── Atisbo docs domain types (tools: search_docs, get_doc, list_docs) ──────────

export interface DocsSearchHit {
  url: string;
  title: string;
  description?: string;
  score?: number;
}

export interface DocsSearchResult {
  query: string;
  /** How the server matched, e.g. `keyword-overlap`. informational only. */
  retrieval?: string;
  results: DocsSearchHit[];
}

export interface DocsDocumentSummary {
  url: string;
  title: string;
  description?: string;
}

export interface DocsListResult {
  count: number;
  limit?: number;
  total: number;
  documents: DocsDocumentSummary[];
}

export interface DocsPage {
  url: string;
  title: string;
  description?: string;
  /** Markdown of the full page. */
  body: string;
}

// ── JSON-RPC framing ────────────────────────────────────────────────────────────

export interface JsonRpcErrorObject {
  code: number;
  message: string;
  data?: unknown;
}

/** Wire response. `id` is absent on notifications; servers answered with numbers. */
export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number | string | null;
  result?: unknown;
  error?: JsonRpcErrorObject;
}
