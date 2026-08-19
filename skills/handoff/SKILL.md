---
name: handoff
description: Hand a completed design or code change back to the existing Atisbo Backlog item for human review. Use when a designer has a reviewable artifact or an engineer has a PR, commit, checks, implementation summary, blocker, or technical decision that teammates need in Atisbo and the item should move to In Review.
---

# Hand completed work to In Review

Connect the artifact the user already produced to the Atisbo Backlog. Verify with the user's native tools; Atisbo preserves the product thread and review state.

## Procedure

1. Inspect the current artifact with available tools:
   - For code, read the diff/PR, repository instructions, tests, checks, migrations, and deployment risk.
   - For design, inspect the supplied file/link/export and identify the decisions, changed behavior, open questions, and review status.
2. Resolve the existing `SEN-{n}` or Solution with `atisbo_lookup`. Confirm it is the work this artifact addresses and read recent comments for changed constraints.
3. Summarize observable behavior, material tradeoffs, verification performed, unresolved risks, and the artifact URL/reference. Do not paste a terminal log.
4. **Ask what the launch needs beyond the merge**, and record the answers that exist. Not all apply every time; naming the ones that do not is part of the handoff:
   - can the expected result actually be observed — is the behaviour instrumented, or will the Outcome be unmeasurable;
   - who outside the team has to know before users see this — support, sales, marketing, or nobody;
   - who is exposed to it first — a small internal group, selected accounts, a share of traffic, or everyone at once;
   - what would make this reversible if it goes wrong.
   An unmeasurable launch is not a blocker to raise later; it is a blocker now, because the loop cannot close without it.
5. Use `atisbo_decide mode=update_solution` to post the handoff. Move the Solution to **In Review** only when the artifact is genuinely ready for a human.
6. Use `atisbo_decide mode=log_decision` only for a technical or design choice that materially changes product behavior or future constraints.
7. Re-read the item and report its final state and reviewer questions.

## Guardrails

- Do not claim Atisbo validated code, tests, accessibility, security, or design quality.
- Do not treat the launch questions as a checklist to satisfy. Report the ones that do not apply as not applicable, and never invent an audience or a rollout plan the human did not choose.
- Do not create a new Opportunity or Solution to represent the artifact; attach it to the existing Backlog item.
- Product Coverage is an optional advanced traceability check, not a substitute for native review and not a mandatory pipeline stage.
- In Review requires human approval. A PR, merge, design link, or deployment is not an Outcome.

## Result

Return the Atisbo item, artifact link, checks/review evidence, material decisions, whether the result is measurable, who still needs to know, open risks, and confirmed **In Review** state.
