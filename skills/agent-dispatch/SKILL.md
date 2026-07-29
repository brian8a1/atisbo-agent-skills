---
name: agent-dispatch
description: Separate Senso Backlog work a coding agent can take from work that still needs the product manager, then hand over only the former. Use when asked what an agent could pick up, when a Backlog has specified items waiting, or before giving implementation work to a coding agent.
---

# Hand Backlog work to a coding agent

Senso can tell you which Backlog items are safe to hand over and which ones carry a decision only the human can make. The split is the point; the dispatch is the easy part.

## Procedure

1. Call `senso_lookup` with `mode=dispatch_queue`. It returns three lists: `ready`, `needs_judgement` (each with its reason), and `not_ready` (no brief written yet).
2. Present `needs_judgement` first and treat it as the human's. Read each reason out — it blocks a signature, affects many accounts, scores low against the strategy, or a previous attempt already missed. Never route around it.
3. For `not_ready` items, offer to write the brief with `senso_decide` `mode=create_solution_doc`. An implementer who starts from a title reconstructs the problem from scratch.
4. For `ready` items the human approves, read `senso_lookup` `mode=implementation_context` to load the product intent and the coverage declaration template, then dispatch with `senso_decide` `mode=dispatch_solution`. The item moves to In Progress with an immutable Decision carrying the brief.
5. Reference `SEN-{n}` in the PR branch, title, or body. The merge then moves the item to In Review without anyone updating Senso by hand.
6. Before opening the PR, run `senso_decide` `mode=check_coverage` with what the work actually covers. Claims neither covered nor marked out of scope fail the check; unresolved contradictions must appear in risk notes.

## Guardrails

- Never dispatch an item from `needs_judgement`, even when the reason looks minor to you. The reason exists because a wrong call there is expensive to reverse.
- Do not dispatch everything at once because it is offered. The value is the human keeping attention for the few items that need it.
- Senso validates PRODUCT traceability only. It never verifies code correctness, tests, or CI — that stays with GitHub and human reviewers.
- Do not create a parallel work item for the implementation. Dispatch the existing Solution.

## Result

Return the dispatched items with their briefs and SEN ids, the list that still needs the human with each reason, and any item whose brief had to be written first.
