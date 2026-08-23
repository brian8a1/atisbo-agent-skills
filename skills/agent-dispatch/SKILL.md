---
name: agent-dispatch
description: Separate Atisbo Backlog work a coding agent can take from work that still needs the product manager, then hand over only the former. Use when asked what an agent could pick up, when a Backlog has specified items waiting, or before giving implementation work to a coding agent.
compatibility: Needs an Atisbo workspace connection over Streamable HTTP MCP (https://app.atisbo.dev/api/mcp) with a Bearer API key generated in the Atisbo app under Settings > Account > Connect agents. Requires network access.
---

# Hand Backlog work to a coding agent

Atisbo can tell you which Backlog items are safe to hand over and which ones carry a decision only the human can make. The split is the point; the dispatch is the easy part.

## Procedure

1. Call `atisbo_lookup` with `mode=work_queue`. Its `delegation` block splits the queue into what an external agent can advance now, what carries a `pm_exception` with its reason, and what has no brief written yet.
2. Present the items needing human judgement first and treat them as the human's. Read each reason out — it blocks a signature, affects many accounts, scores low against the strategy, or a previous attempt already missed. Never route around it.
3. For items with no brief, offer to write one with `atisbo_decide` `mode=create_solution_doc`. An implementer who starts from a title reconstructs the problem from scratch.
4. **Check the item was actually decided, not just written.** Before dispatching, confirm from the Living Document that it carries a hypothesis and a success measure, and that at least one alternative was considered and rejected. When either is missing, say so and offer an Opportunity Decision first. Dispatching accelerates whatever was decided — including the first idea nobody compared against anything.
5. For approved items, read `atisbo_lookup` `mode=implementation_context` to load the product intent and the coverage declaration template, then dispatch with `atisbo_decide` `mode=dispatch_solution`. The item moves to In Progress with an immutable Decision carrying the brief.
6. Reference `SEN-{n}` in the PR branch, title, or body. The merge then moves the item to In Review without anyone updating Atisbo by hand.
7. Before opening the PR, run `atisbo_decide` `mode=check_coverage` with what the work actually covers. Claims neither covered nor marked out of scope fail the check; unresolved contradictions must appear in risk notes.

## Guardrails

- Never dispatch an item carrying a `pm_exception`, even when the reason looks minor to you. The reason exists because a wrong call there is expensive to reverse.
- Do not dispatch everything at once because it is offered. The value is the human keeping attention for the few items that need it.
- A missing hypothesis is a reason to pause, not a field to invent. Do not write the expectation on the human's behalf to unblock a dispatch.
- Atisbo validates PRODUCT traceability only. It never verifies code correctness, tests, or CI — that stays with GitHub and human reviewers.
- Do not create a parallel work item for the implementation. Dispatch the existing Solution.

**Before and after.** You hand over what an Opportunity Decision already decided; when the expectation or the alternatives are missing, that decision is what is missing, not a field. What you dispatch returns through Handoff, and only then can Outcome say anything.

## Result

Return the dispatched items with their briefs and SEN ids, the list that still needs the human with each reason, any item whose brief had to be written first, and any item held back because it had no recorded expectation.
