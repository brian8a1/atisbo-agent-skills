---
description: Post a progress update or blocker to the current Senso work item's conversation thread
---

# Report progress to the Senso item

Post an update to the conversation thread of the work item being worked on, so every teammate (product, sales, CS) sees it without leaving Senso.

## Steps

1. **Identify the item.** From the current branch name (`sen-{n}-...`) extract `SEN-{n}`. If the branch doesn't carry an ID, ask the user which item this is.
2. **Resolve the ID.** Call `senso_work_queue` (state `active`, fallback `in_review`) and match `short_id`/`display_id` to get the solution UUID.
3. **Post the report.** Call `senso_solution_update` with:
   ```json
   { "solution_id": "<id>", "agent_name": "Claude Code", "comment": "<the report>" }
   ```
   The report should be `$ARGUMENTS` if provided; otherwise summarize honestly what was done so far, what remains, and any blockers. Include file paths and PR/commit links when they exist. The comment is also mirrored into Senso's decision signal stream — write it for a teammate, not for a log.
