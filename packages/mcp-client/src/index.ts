/**
 * @file index.ts — public surface of the `atisbo` npm package.
 *
 * @example
 * import { AtisboMcpClient } from 'atisbo';
 *
 * const docs = new AtisboMcpClient({ server: 'docs' });
 * const { results } = await docs.searchDocs('connect an agent');
 *
 * const atisbo = new AtisboMcpClient({ server: 'product', apiKey: process.env.ATISBO_MCP_KEY });
 * await atisbo.initialize();
 * const tools = await atisbo.toolsList();
 */

export { AtisboMcpClient } from './client.js';
export type { AtisboMcpClientOptions } from './client.js';

export {
  AtisboAuthError,
  AtisboError,
  AtisboHttpError,
  AtisboProtocolError,
  AtisboRateLimitError,
  AtisboRpcError,
  AtisboTimeoutError,
} from './errors.js';

export type {
  AtisboServer,
  DocsDocumentSummary,
  DocsListResult,
  DocsPage,
  DocsSearchHit,
  DocsSearchResult,
  JsonRpcErrorObject,
  JsonRpcResponse,
  McpContentBlock,
  McpImplementation,
  McpInitializeResult,
  McpResource,
  McpResourceContents,
  McpResourcesListResult,
  McpTool,
  McpToolCallResult,
  McpToolsListResult,
} from './types.js';
