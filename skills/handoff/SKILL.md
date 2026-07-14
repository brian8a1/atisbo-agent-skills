---
name: handoff
description: Hand a completed design or code change back to the existing Senso Backlog item for human review. Use when a designer has a reviewable artifact or an engineer has a PR, commit, checks, implementation summary, blocker, or technical decision that teammates need in Senso and the item should move to In Review.
---

# Hand completed work to In Review

Connect the artifact the user already produced to the Senso Backlog. Verify with the user's native tools; Senso preserves the product thread and review state.

## Procedure

1. Inspect the current artifact with available tools:
   - For code, read the diff/PR, repository instructions, tests, checks, migrations, and deployment risk.
   - For design, inspect the supplied file/link/export and identify the decisions, changed behavior, open questions, and review status.
2. Resolve the existing `SEN-{n}` or Solution with `senso_lookup`. Confirm it is the work this artifact addresses and read recent comments for changed constraints.
3. Summarize observable behavior, material tradeoffs, verification performed, unresolved risks, and the artifact URL/reference. Do not paste a terminal log.
4. Use `senso_decide mode=update_solution` to post the handoff. Move the Solution to **In Review** only when the artifact is genuinely ready for a human.
5. Use `senso_decide mode=log_decision` only for a technical or design choice that materially changes product behavior or future constraints.
6. Re-read the item and report its final state and reviewer questions.

## Guardrails

- Do not claim Senso validated code, tests, accessibility, security, or design quality.
- Do not create a new Opportunity or Solution to represent the artifact; attach it to the existing Backlog item.
- Product Coverage is an optional advanced traceability check, not a substitute for native review and not a mandatory pipeline stage.
- In Review requires human approval. A PR, merge, design link, or deployment is not an Outcome.

## Result

Return the Senso item, artifact link, checks/review evidence, material decisions, open risks, and confirmed **In Review** state.
