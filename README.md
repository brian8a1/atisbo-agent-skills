# Senso skills for agents

Use Senso from the product, design, and engineering interactions your team already has. The skills do not teach an agent how to plan or write code; they teach it how to bring the right Senso context into existing work and how to return evidence, Decisions, handoffs, and Outcomes to the shared product record.

## Product language

- **Signals** are source evidence: feedback, interviews, observations, incidents, and metrics.
- **Opportunities** are recurring customer problems formed from related Signals.
- **Solutions** record the response chosen for an Opportunity.
- **Backlog** holds Solutions, Groups, Knowledge, and Living Documents.
- **Decisions** preserve what changed, who decided, alternatives, and reasoning.
- **In Review** means an artifact is waiting for human approval.
- **Outcome** records observed post-launch learning. A PR, design, merge, or deployment is output—not outcome.

## Skills

| Skill | Existing interaction | Result in Senso |
|---|---|---|
| `signal-intake` | Add interview notes, feedback, an incident, metric, or document | Signal, Knowledge, or Living Document evidence |
| `signal-review` | Review evidence already captured | Correct classification and Opportunity grouping |
| `product-review` | Prepare a weekly, roadmap, or backlog review | Read-only agenda with decisions and owner questions |
| `opportunity-decision` | Decide what to do about one Opportunity | Confirmed Decision and optional Solution in Backlog |
| `backlog-brief` | Begin work on a SEN item, design, issue, or branch | Role-adapted context from its Living Document and evidence |
| `agent-dispatch` | Give implementation work to a coding agent | Dispatched items with briefs, plus what still needs the human |
| `handoff` | Return a design or PR for review | Artifact summary on the Solution thread and In Review state |
| `outcome` | Review a launched Solution after observation | Success, partial, miss, or unexpected Outcome |

These are independent entry points, not a mandatory pipeline.

## Which skills each role uses

### Product manager

- `signal-intake` for new feedback, interviews, or metrics.
- `signal-review` for evidence that needs classification or regrouping.
- `product-review` before weekly, roadmap, and portfolio reviews.
- `opportunity-decision` when choosing a response and recording why.
- `backlog-brief` before continuing one Solution.
- `agent-dispatch` to hand ready work to a coding agent and keep the rest.
- `outcome` after a Done Solution has enough evidence.

### Designer

- `signal-intake` after research or usability sessions.
- `opportunity-decision` when a design choice changes the product response.
- `backlog-brief` before opening the design task or artifact.
- `handoff` when the artifact is ready for product review.
- `outcome` when qualitative research contributes post-launch evidence.

### Engineer

- `signal-intake` for incidents, bugs, logs, and production findings.
- `backlog-brief` before working from an issue, branch, or SEN item.
- `agent-dispatch` to pick up work already cleared for implementation.
- `handoff` when a PR and its checks are ready for human review.
- `outcome` when technical or product metrics show what happened after launch.

## MCP relationship

The skills use Senso's six compact MCP tools instead of inventing new product capabilities:

| MCP tool | Responsibility |
|---|---|
| `senso_orient` | Workspace snapshot, changes, strategy, and integration health |
| `senso_lookup` | Signals, Opportunities, Solutions, Backlog, Groups, Knowledge, and Living Documents |
| `senso_capture` | New Signals, Knowledge, document updates, and evidence blocks |
| `senso_decide` | Signal corrections, Solutions, Decisions, state, ownership, and Outcomes |
| `senso_map` | Groups, nodes, anchors, edges, and metrics |
| `senso_analyze` | Portfolio and time-window analysis |

The agent continues using its own repository, design, GitHub, testing, and delivery tools.

## Shared setup

1. In Senso, open **Connect agents** from the sidebar.
2. Install the skills in the repository or workspace where the agent runs.
3. Generate a workspace MCP URL on the same page.
4. Add the URL as a Streamable HTTP MCP server named `senso`.
5. Keep the URL secret; it contains a revocable workspace key.

## Claude Code

```text
/plugin marketplace add brian8a1/senso-agent-skills
/plugin install senso@senso
```

Type `/senso:` to discover the interactions, for example:

```text
/senso:product-review
/senso:backlog-brief SEN-18
/senso:handoff SEN-18
```

For local development, start Claude Code with `--plugin-dir ./claude-plugin`.

## Codex

Install the canonical skills into `.agents/skills/`:

```bash
node claude-plugin/scripts/install-agent-skills.mjs --client codex --target /path/to/repo
```

Invoke a skill explicitly, for example `$product-review`, `$backlog-brief`, or `$handoff`, or ask naturally for the same interaction.

## Cursor

Install the skills into `.cursor/skills/`:

```bash
node claude-plugin/scripts/install-agent-skills.mjs --client cursor --target /path/to/repo
```

Select `signal-intake`, `backlog-brief`, `handoff`, or another Senso interaction from the slash menu.

## Other agents

Choose the exact directory the client discovers:

```bash
node claude-plugin/scripts/install-agent-skills.mjs --skills-dir .agent/skills --target /path/to/repo
```

Any MCP-compatible client can use Senso's tools even when it does not support Agent Skills.

## Behavioral contract

- Respect manual Backlog order and Senso's evidence-weighted priority. Legacy RICE fields never rank work.
- Never take work owned by someone else without explicit authorization.
- Preserve source provenance and contradictory evidence.
- Keep exploration read-only until the user requests or confirms a write.
- Never claim Senso validates code, tests, accessibility, security, or design quality.
- Move an artifact to In Review only when it is ready for human approval.
- Record an Outcome only from observed post-launch evidence.

## Publishing note

This folder is the cross-agent source of truth and is mirrored to the public plugin repository. Keep the Claude and Codex manifests on the same version when publishing.
