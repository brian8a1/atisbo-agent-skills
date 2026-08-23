# Atisbo skills for agents

Use Atisbo from the product, design, and engineering interactions your team already has. The skills do not teach an agent how to plan or write code; they teach it how to bring the right Atisbo context into existing work and how to return evidence, Decisions, handoffs, and Outcomes to the shared product record.

Atisbo lives at [atisbo.dev](https://atisbo.dev). Agents connect through its MCP server ([docs](https://app.atisbo.dev/docs/api/mcp-server), machine-readable manifest at [`/.well-known/mcp.json`](https://app.atisbo.dev/.well-known/mcp.json)), and [`llms.txt`](https://app.atisbo.dev/llms.txt) is the short brief an arriving model reads first. An agent editing this repository starts from [AGENTS.md](AGENTS.md).

## Product language

- **Signals** are source evidence: feedback, interviews, observations, incidents, and metrics.
- **Opportunities** are recurring customer problems formed from related Signals.
- **Solutions** record the response chosen for an Opportunity.
- **Backlog** holds Solutions, Groups, Knowledge, and Living Documents.
- **Decisions** preserve what changed, who decided, alternatives, and reasoning.
- **In Review** means an artifact is waiting for human approval.
- **Outcome** records observed post-launch learning. A PR, design, merge, or deployment is output—not outcome.

## Skills

| Skill | Existing interaction | Result in Atisbo |
|---|---|---|
| `signal-intake` | Add interview notes, feedback, an incident, metric, or document | Signal, Knowledge, or Living Document evidence |
| `signal-review` | Review evidence already captured | Correct classification and Opportunity grouping |
| `product-review` | Prepare a weekly, roadmap, or backlog review | Read-only agenda with decisions and owner questions |
| `opportunity-decision` | Decide what to do about one Opportunity | Confirmed Decision and optional Solution in Backlog |
| `backlog-brief` | Begin work on a SEN item, design, issue, or branch | Role-adapted context from its Living Document and evidence |
| `agent-dispatch` | Give implementation work to a coding agent | Dispatched items with briefs, plus what still needs the human |
| `handoff` | Return a design or PR for review | Artifact summary on the Solution thread and In Review state |
| `outcome` | Review a launched Solution after observation | Success, partial, miss, or unexpected Outcome |

These are independent entry points, not a mandatory pipeline. Enter wherever the real work is.

## What each step leaves for the next one

The skills stay independent, but some of them write things another one later reads. That trace
is worth knowing, because a step that skips its part leaves the next one guessing.

| Written by | What is written | Read by |
|---|---|---|
| `signal-intake` | evidence with its provenance | the pipeline, which clusters it into an Opportunity |
| `signal-review` | corrected grouping and the segment split | `opportunity-decision`, to judge one problem instead of three |
| `opportunity-decision` | hypothesis, success measure, the measure that must not get worse, and the rejected alternatives with their reasons | `agent-dispatch` before handing work over · `backlog-brief` when someone picks it up · `outcome` to grade against something that already existed |
| `agent-dispatch` / `handoff` | the brief, the artifact, and whether the result is even measurable | `outcome`, which cannot close a loop nobody instrumented |
| `outcome` | observed result, side effect checked, and the branch chosen next | `opportunity-decision`, when the branch is another solution or another problem |

Atisbo does not start from a chosen objective the way classic product process does — it starts
from evidence that arrives on its own, and the human decides what deserves a response. So the
cycle has no fixed first step; it has a shape: evidence → problem → decision → work → observed
result → the next branch, which reopens a decision rather than ending anything.

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

The skills use Atisbo's six compact MCP tools instead of inventing new product capabilities:

| MCP tool | Responsibility |
|---|---|
| `atisbo_orient` | Workspace snapshot, changes, strategy, and integration health |
| `atisbo_lookup` | Signals, Opportunities, Solutions, Backlog, Groups, Knowledge, and Living Documents |
| `atisbo_capture` | New Signals, Knowledge, document updates, and evidence blocks |
| `atisbo_decide` | Signal corrections, Solutions, Decisions, state, ownership, and Outcomes |
| `atisbo_map` | Groups, nodes, anchors, edges, and metrics |
| `atisbo_analyze` | Portfolio and time-window analysis |

The agent continues using its own repository, design, GitHub, testing, and delivery tools.

## Testing the skills

Three levels, in increasing cost.

**1. Claims — runs today, no account features needed.**

```bash
node scripts/validate-skill-claims.mjs
```

Checks that what the skills tell an agent to do actually exists: every `mode=X` attributed to
a tool against `contracts/mcp-modes.json`, every path in a command against this repo, every
`*_MCP_KEY` named in prose against `.mcp.json`, and each skill's frontmatter against its
directory name. It exits 1 on a broken claim. It was written after three instructions in this
repo were found pointing at things that were not there — a retired tool mode, a variable
nobody reads, and an install path from a layout this repo does not have. Prose cannot fail a
type check; this is the smallest thing that makes it falsifiable.

**2. Behaviour — `claude plugin eval` (early access).**

```bash
claude plugin eval . --case three-candidates
claude plugin eval .                       # whole suite
```

`evals/` holds cases for the behaviour that is easy to lose and hard to notice: proposing
several candidates instead of one, refusing to grade an Outcome against an expectation that
was never recorded, and refusing to dispatch work that carries no hypothesis. Each case is a
`prompt.md` plus `graders/criteria.md` written as pass/fail conditions rather than a rubric,
so a near miss reads as a failure and not as a 0.7. `evals/trigger_eval.json` covers the other
half of the problem — a skill that never fires helps nobody.

The cases describe the workspace state in the prompt instead of requiring live MCP calls, so
they run without credentials and without mutating a real workspace.

**3. Against a real workspace — dogfooding.**

Point the agent at your own Atisbo and walk one Opportunity end to end. This is the only level
that catches what neither of the others can: an extraction that silently drops half a snippet,
a judge that groups two problems into one, a Living Document that reads fine and says less
than the evidence it cites.

## Shared setup

1. In Atisbo, open **Connect agents** from the sidebar.
2. Install the skills in the repository or workspace where the agent runs.
3. Generate a workspace MCP URL on the same page.
4. Add the URL as a Streamable HTTP MCP server named `atisbo`.
5. Keep the URL secret; it contains a revocable workspace key.

## Claude Code

```text
/plugin marketplace add brian8a1/atisbo-agent-skills
/plugin install atisbo@atisbo
```

Type `/atisbo:` to discover the interactions, for example:

```text
/atisbo:product-review
/atisbo:backlog-brief SEN-18
/atisbo:handoff SEN-18
```

For local development, start Claude Code with `--plugin-dir .` from a clone of this repository.

## Codex

Install the canonical skills into `.agents/skills/`:

```bash
node scripts/install-agent-skills.mjs --client codex --target /path/to/repo
```

Invoke a skill explicitly, for example `$product-review`, `$backlog-brief`, or `$handoff`, or ask naturally for the same interaction.

## Cursor

Install the skills into `.cursor/skills/`:

```bash
node scripts/install-agent-skills.mjs --client cursor --target /path/to/repo
```

Select `signal-intake`, `backlog-brief`, `handoff`, or another Atisbo interaction from the slash menu.

## Other agents

Choose the exact directory the client discovers:

```bash
node scripts/install-agent-skills.mjs --skills-dir .agent/skills --target /path/to/repo
```

Any MCP-compatible client can use Atisbo's tools even when it does not support Agent Skills.

## Agent Plugins

The repository root carries a `plugin.json` conforming to the [Agent Plugins specification](https://agent-plugins.org/specification) v1.0.0, so a client that loads plugins by that format discovers `skills/` from its fixed location without per-client instructions. The manifest is metadata only, and it deliberately ships no `mcp.json`: the specification has no portable way to carry credentials, so the MCP connection stays workspace-specific through `.mcp.json`.

## Behavioral contract

- Respect manual Backlog order and Atisbo's evidence-weighted priority. Legacy RICE fields never rank work.
- Never take work owned by someone else without explicit authorization.
- Preserve source provenance and contradictory evidence.
- Keep exploration read-only until the user requests or confirms a write.
- Never claim Atisbo validates code, tests, accessibility, security, or design quality.
- Move an artifact to In Review only when it is ready for human approval.
- Record an Outcome only from observed post-launch evidence.

## Publishing note

This folder is the cross-agent source of truth and is mirrored to the public plugin repository. Keep the Claude, Codex, and Agent Plugins (`plugin.json`) manifests on the same version when publishing.
