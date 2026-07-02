---
description: Finish the current Senso work item — open the PR and hand it back for human review
---

# Hand the Senso item back for review

Close the loop: the work is implemented, tests pass, and a human must now approve it.

## Steps

1. **Verify before handing off.** Run the repo's test/lint/build commands. If they fail, fix them first — never hand broken work to review.
2. **Identify the item.** Extract `SEN-{n}` from the branch name; resolve the UUID via `senso_work_queue` as in `/senso:report`.
3. **Open the PR.** Push the branch and create the PR with `SEN-{n}` in the title (e.g. `SEN-12: non-blocking agent execution`). If the team's Senso workspace has the GitHub integration connected, **merging that PR will automatically move the item to In Review** — no extra call needed.
4. **Report the handoff.** Call `senso_solution_update`:
   ```json
   { "solution_id": "<id>", "agent_name": "Claude Code",
     "comment": "Done: <what was implemented>. PR: <url>. Tests: <status>. Awaiting review." }
   ```
5. **Fallback — no GitHub integration.** If the repo is not connected to Senso's GitHub integration (ask the user if unsure), move the state explicitly by adding `"lifecycle": "IN_REVIEW"` to the same `senso_solution_update` call.
6. Tell the user: the item is waiting in Senso's Backlog under **In Review** for their approval.
