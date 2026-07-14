---
name: backlog-brief
description: Brief a product manager, designer, or engineer who is beginning work on one Senso Backlog item. Use when the user names a SEN reference, Opportunity, Solution, issue, branch, design task, or current work item and needs the relevant problem, Signals, Decision, Living Document, constraints, contradictions, and success expectation without an invented implementation workflow.
---

# Brief one Backlog item

Bring the product context for the current work into the user's existing design or engineering workflow. Stay read-only unless the user explicitly asks the agent to take ownership.

## Procedure

1. Resolve a supplied `SEN-{n}`, UUID, title, issue, or branch reference with `senso_lookup`. If no item is supplied, query `mode: work_queue` and ask the user to select rather than silently taking work.
2. Read the Solution, parent Opportunity, relevant Living Document, recent Decisions/comments, and cited Signals needed to understand conflicts or constraints.
3. Adapt the brief to the work already in front of the user:
   - Product manager: evidence, alternatives, decision gaps, ownership, and state.
   - Designer: affected user/context, observed behavior, contradictions, constraints, and unresolved product questions.
   - Engineer: expected observable behavior, product rationale, constraints, prior decisions, risks, and questions requiring product authority.
4. If the user explicitly asks to take an **Active** item, use `senso_decide mode=update_solution` to assign it to the current agent and post one concise start comment.
5. Hand control back to the user's normal tools and repository/design conventions. Do not manufacture Senso-specific working files.

## Guardrails

- Never take Draft, In Review, Done, Canceled, snoozed, or already-owned work without explicit authorization.
- Read the Living Document before opening many raw Signals; follow `snippet://` citations selectively.
- Do not create `spec.md`, `plan.md`, task lists, branches, or code merely because the brief was requested.
- Label missing information as a question, not a requirement.

## Result

Return a role-adapted brief with Senso references, known decisions, contradictions, missing answers, current Backlog state, and ownership.
