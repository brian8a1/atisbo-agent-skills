# Senso plugin for Claude Code

Work directly from your [Senso](https://www.getsenso.xyz) backlog without leaving the terminal. Senso writes and maintains the backlog from customer evidence; this plugin lets your coding agent pull work from it and report back.

## What you get

| Skill | What it does |
|-------|--------------|
| `/senso:next` | Takes the next prioritized item (honors the PM's manual order), claims it, creates a `sen-{n}-slug` branch, loads the problem + evidence, and starts implementing |
| `/senso:report` | Posts a progress update or blocker to the item's conversation thread — visible to the whole team |
| `/senso:done` | Runs checks, opens the PR with `SEN-{n}` in the title, reports the handoff. Merging the PR auto-moves the item to **In Review** |

The full loop: evidence → item is born in Senso → `/senso:next` → PR → merge → **In Review**, waiting for human approval. Every automatic move is recorded.

## Install

1. Get an MCP key in Senso: **Settings → MCP keys**.
2. Export it in your shell profile:
   ```bash
   export SENSO_MCP_KEY="sk_..."
   ```
3. Install the plugin:
   ```
   /plugin marketplace add brian8a1/senso-claude-plugin
   /plugin install senso@senso
   ```
   (Or for local testing: `claude --plugin-dir ./claude-plugin`.)
4. Optional but recommended: connect the **GitHub integration** in Senso (Settings → Sources) so merged PRs referencing `SEN-{n}` move items to In Review automatically.

## Conventions

- Branch names: `sen-{n}-short-slug`
- Commit messages and PR titles mention `SEN-{n}`
- Agents only take items from the **active** queue (a human decides what becomes active) and never take work assigned to a person

## Using Codex (or any other agent) instead

Codex has no plugin system — add the MCP server and paste the workflow into `AGENTS.md`:

```toml
# ~/.codex/config.toml
[mcp_servers.senso]
url = "https://app.getsenso.xyz/api/mcp"
http_headers = { "Authorization" = "Bearer YOUR_SENSO_MCP_KEY" }
```

```markdown
<!-- AGENTS.md -->
## Senso backlog workflow
- To pick work: call senso_work_queue (state "active", sort_by "priority", limit 5).
  Take the first item not assigned to a person or another agent. Claim it with
  senso_solution_update { assign_to_agent: true, agent_name: "Codex", comment: "<plan>" }.
- Branch: sen-{n}-slug. Commits and PR title must mention SEN-{n}.
- Progress/blockers: senso_solution_update { agent_name: "Codex", comment: "<update>" }.
- Finish: open the PR with SEN-{n} in the title. Merging it moves the item to In Review
  automatically (GitHub integration). Without the integration, also pass
  lifecycle: "IN_REVIEW" in the final update.
```

## Publishing note (maintainers)

This folder is the source of truth; it is mirrored to the public repo `brian8a1/senso-claude-plugin` (marketplace root). After changing anything here, re-sync the public repo. `.claude-plugin/marketplace.json` points at `./`, so `/plugin marketplace add brian8a1/senso-claude-plugin` works as-is.
