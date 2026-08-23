# AGENTS.md

Instructions for AI coding agents working with Atisbo — either driving the product through
its MCP tools and skills, or editing this skill repository. Atisbo is the product decision
backlog: it holds the evidence, the problems that evidence forms, the response a team chose,
and what changed after launch. The human decides; agents read, record, and implement.
`README.md` is the canonical statement of this material; this file is the same facts written
for an agent that starts here instead of at the README.

## Product language

Use these terms exactly as defined here. Do not invent synonyms for them in prose you write
into Atisbo — a Decision that says "ticket" where every other record says "Signal" is harder
to find later.

- **Signals** are source evidence: feedback, interviews, observations, incidents, and metrics.
- **Opportunities** are recurring customer problems formed from related Signals.
- **Solutions** record the response chosen for an Opportunity.
- **Backlog** holds Solutions, Groups, Knowledge, and Living Documents.
- **Decisions** preserve what changed, who decided, alternatives, and reasoning.
- **In Review** means an artifact is waiting for human approval.
- **Outcome** records observed post-launch learning. A PR, design, merge, or deployment is output—not outcome.

## Connecting

Atisbo is reached through MCP, not through a REST wrapper you write yourself.

- Endpoint: `https://app.atisbo.dev/api/mcp` — JSON-RPC 2.0 over Streamable HTTP.
- Auth: `Authorization: Bearer <key>` with a workspace-scoped API key generated in the app
  under **Settings → Account → Connect agents**. The URL carries a revocable workspace key;
  keep it out of committed files and logs.
- `.mcp.json` at this repository's root is the connection template; it reads `${ATISBO_MCP_KEY}`.
- Machine-readable discovery: `https://app.atisbo.dev/.well-known/mcp.json`.
- Short model-facing brief: `https://app.atisbo.dev/llms.txt` (full: `/llms-full.txt`).
- Tool reference: https://app.atisbo.dev/docs/api/mcp-server

Six tools exist. They are compact facades over the product; if something seems missing from
one of them, it is deliberate — do not work around it by inventing parameters.

| Tool | Responsibility |
|---|---|
| `atisbo_orient` | Workspace snapshot, changes, strategy, and integration health |
| `atisbo_lookup` | Signals, Opportunities, Solutions, Backlog, Groups, Knowledge, and Living Documents |
| `atisbo_capture` | New Signals, Knowledge, document updates, and evidence blocks |
| `atisbo_decide` | Signal corrections, Solutions, Decisions, state, ownership, and Outcomes |
| `atisbo_map` | Groups, nodes, anchors, edges, and metrics |
| `atisbo_analyze` | Portfolio and time-window analysis |

## Skills and when each one fires

The eight skills in `skills/` are independent entry points into interactions a team already
has — not a pipeline, and not a substitute for the user's own planning, design, coding,
testing, or review tools.

| Skill | Use when |
|---|---|
| `signal-intake` | The user has feedback, interview notes, an incident, metric, or document that should become Atisbo evidence or reusable Knowledge |
| `signal-review` | Evidence already captured needs classification, regrouping, splitting, combining, or a deal-breaker call |
| `product-review` | A weekly, roadmap, or portfolio review needs what changed, what is blocked, and what awaits measurement |
| `opportunity-decision` | Someone is choosing a response to one Opportunity and must leave the reasoning behind |
| `backlog-brief` | Work is beginning on one Backlog item and needs its problem, evidence, decision, and constraints |
| `agent-dispatch` | Someone asks what Backlog work a coding agent could take, before handing implementation over |
| `handoff` | A design or code change is ready for human review and belongs on its existing Solution thread |
| `outcome` | A launched Solution has post-launch evidence to compare against the expectation recorded when it was created |

## Rules of engagement

- Keep exploration read-only until the user requests or confirms a write.
- Never take work owned by someone else without explicit authorization.
- Respect the Backlog order Atisbo returns. Legacy RICE fields never rank work.
- Preserve source provenance and contradictory evidence; never convert your own opinion into
  customer evidence.
- Move an artifact to In Review only when it is ready for human approval. A merge is not an Outcome.
- Record an Outcome only from observed post-launch evidence, compared against the expectation
  recorded earlier — never reconstructed afterwards.
- Never claim Atisbo validated code, tests, accessibility, security, or design quality. It
  validates product traceability only.

The full behavioral contract is in `README.md`.

## Working on this repository

Layout:

- `skills/<name>/SKILL.md` — one skill per directory. Frontmatter needs `name` equal to the
  directory name and a `description` stating what the skill does and when to use it (Agent
  Skills specification). `agents/openai.yaml` beside it carries the client-specific interface.
- `contracts/mcp-modes.json` — dated snapshot of every mode each tool accepts. When it is
  older than 45 days the validator fails on purpose; regenerate it per `contracts/README.md`
  rather than loosening the check.
- `scripts/install-agent-skills.mjs` — installs skills for codex, cursor, claude, or a custom
  skills directory.
- `evals/` — behaviour cases (`claude plugin eval .`) and trigger cases.
- `plugin.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` — the three
  manifests. Keep all three on the same version; see the publishing note in `README.md`.

Before committing a change to skills or docs:

```bash
node scripts/validate-skill-claims.mjs
claude plugin eval .          # when the change touches behaviour, not just wording
```

Constraints the validator cannot fully check but that hold anyway:

- Never name a tool mode in prose that `contracts/mcp-modes.json` does not list. A retired
  mode fails inside somebody else's client, silently.
- Do not add a root-level `mcp.json`. Agent Plugins has no portable way to carry credentials,
  so the MCP connection stays workspace-specific via `.mcp.json`; a shipped endpoint entry
  would fail its handshake for every user.
- Descriptions state what a skill does and when it fires. `evals/trigger_eval.json` holds the
  situations each skill should and should not fire on — if you narrow a description, check
  whether it still names those triggers.
