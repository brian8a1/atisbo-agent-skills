/**
 * @file errors.ts — the error surface of AtisboMcpClient.
 *
 * KEY DECISIONS:
 * - One class per failure a CALLER can act on differently (retry later, fix the key, fix
 *   the arguments). Everything else collapses into AtisboHttpError / AtisboRpcError so the
 *   hierarchy stays learnable from its names.
 * - HTTP 401 wins over the JSON-RPC body: both servers return `-32000 "Invalid or missing
 *   API key"` inside a 401, but only the HTTP status is contract. The WWW-Authenticate
 *   challenge header (verified live:
 *   `Bearer resource_metadata="https://app.atisbo.dev/.well-known/oauth-protected-resource"`)
 *   is carried on the error instead of being dropped.
 */

/** Base class for every error this client throws. Check with `instanceof AtisboError`. */
export class AtisboError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
    // Required so `instanceof` works when TypeScript downlevels classes to ES5 targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** The server answered a well-formed request with a JSON-RPC `error` object. */
export class AtisboRpcError extends AtisboError {
  /** JSON-RPC error code, e.g. -32601 (method/tool not found), -32602 (invalid params),
   *  -32000 (server fault; also the body of an unauthenticated product tools/call). */
  readonly rpcCode: number;
  readonly data?: unknown;
  /** The MCP method that produced the fault, e.g. `tools/call`. */
  readonly method?: string;

  constructor(rpcCode: number, message: string, options: { data?: unknown; method?: string } = {}) {
    super(`[${rpcCode}] ${message}`);
    this.rpcCode = rpcCode;
    this.data = options.data;
    this.method = options.method;
  }
}

/**
 * The product server rejected the credential (HTTP 401).
 *
 * Discovery methods on the product server need no key; every `tools/call` does. Create a
 * workspace-scoped key in the app under Settings → Account → Connect agents and pass it as
 * `apiKey`.
 */
export class AtisboAuthError extends AtisboError {
  readonly status = 401;
  /** Raw `WWW-Authenticate` challenge, when the server sent one. */
  readonly challenge?: string;

  constructor(message: string, challenge?: string) {
    super(message);
    this.challenge = challenge;
  }
}

/** Rate limited (HTTP 429). The docs server allows 30 requests/min/IP. */
export class AtisboRateLimitError extends AtisboError {
  readonly status = 429;
  /** Milliseconds to wait, parsed from `Retry-After`. Absent when the server omits it. */
  readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.retryAfterMs = retryAfterMs;
  }
}

/** Any other non-2xx HTTP response. */
export class AtisboHttpError extends AtisboError {
  readonly status: number;
  /** First 500 characters of the body — enough to debug, small enough to log. */
  readonly body?: string;

  constructor(status: number, message: string, body?: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/** A single request exceeded `timeoutMs`; nothing was retried automatically. */
export class AtisboTimeoutError extends AtisboError {}

/** The response could not be turned into a JSON-RPC result: bad JSON, SSE without a usable
 *  data frame, or a frame whose id does not answer ours. */
export class AtisboProtocolError extends AtisboError {}
