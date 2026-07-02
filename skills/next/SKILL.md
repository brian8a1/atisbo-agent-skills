---
description: Take the next prioritized work item from the Senso backlog and start implementing it
---

# Take the next Senso work item

Pull the highest-priority executable item from the team's Senso backlog, claim it, and start working.

## Steps

1. **Fetch the queue.** Call `senso_work_queue` with `{ "state": "active", "sort_by": "priority", "limit": 5 }`. The order already honors the PM's manual ranking — do not reorder.
   - If the Senso tools are not available, tell the user to set the `SENSO_MCP_KEY` environment variable (Senso → Settings → MCP keys) and restart Claude Code.
   - If the queue is empty, say so and stop. Do NOT pull `draft` items — a human decides what becomes active.
2. **Pick the first available item.** Skip items whose `assignee` is a person (`type: "user"`) or a different agent — never take work someone else owns. If `$ARGUMENTS` contains a specific ID (`SEN-12` or a UUID), pick that item instead.
3. **Claim it.** Call `senso_solution_update` with:
   ```json
   { "solution_id": "<id>", "assign_to_agent": true, "agent_name": "Claude Code",
     "comment": "Taking this item. Plan: <one-line plan>." }
   ```
4. **Load full context.** Call `senso_solution_get` for the item: the parent problem, evidence, RICE reasoning, and the conversation thread (read recent comments — humans may have left constraints there).
5. **Create the branch.** Use the item's `display_id` in kebab-case: `sen-12-short-slug`. The ID in the branch is what lets Senso track the work later.
6. **Implement.** Work the item in this repo following the repo's own conventions. Keep scope to what the item and its evidence describe.

## Conventions

- Branch: `sen-{n}-{slug}` · Commits and PR title must mention `SEN-{n}`.
- When done, use `/senso:done`. To post progress or blockers mid-work, use `/senso:report`.
