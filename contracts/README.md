# contracts/

## mcp-modes.json

A **dated snapshot** of the modes each Atisbo MCP facade accepts. It is not the source of
truth — the product is — and it exists only so that `scripts/validate-skill-claims.mjs` can
tell a real mode from one that was retired or invented.

`validate-skill-claims.mjs` fails on its own when this file is older than 45 days, because a
stale contract turns a green run into a lie: every mode looks valid against an enum nobody
refreshed.

### Regenerating it

From a checkout of the product repo (`senso-claude-code`), the enums live in
`src/lib/tools/registry.ts`:

- `lookupModeEnum`, `captureModeEnum`, `decideModeEnum` are exported constants;
- `atisbo_orient` and `atisbo_map` declare theirs inline (`mapFacadeModeEnum`);
- `atisbo_analyze` keys off `analyzeSubjectEnum` (claims | solutions | activity).

Copy the resulting arrays into `modes`, set `generated_at` to today, and run the validator.
Keep `_aliases` in sync with the `z.preprocess` shims — those are inputs the product rewrites
silently, so a skill naming one is not broken.

### Why a copy at all

The two repositories version separately. The product already guards its own prose with
`scripts/validate-tool-mode-claims.ts` (#326), but that guard reads `TOOL_REGISTRY` in its own
tree and cannot see this one. On 2026-08-19 `agent-dispatch` was found instructing agents to
call `atisbo_lookup mode=dispatch_queue`, retired by ADR-153 — the first step of the skill that
hands work to coding agents, failing validation in the client, invisible from the product side.
A dated copy that the validator distrusts after 45 days is worse than a shared source of truth
and much better than nothing.
