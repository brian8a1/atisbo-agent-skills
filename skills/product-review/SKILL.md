---
name: product-review
description: Prepare a recurring product, weekly, roadmap, or backlog review from the current Atisbo workspace. Use when a product manager or product leader needs what changed, growing Opportunities, blocked Decisions, unowned or stalled Backlog work, new contradictions, integration health, or launched Solutions awaiting an Outcome.
compatibility: Needs an Atisbo workspace connection over Streamable HTTP MCP (https://app.atisbo.dev/api/mcp) with a Bearer API key generated in the Atisbo app under Settings > Account > Connect agents. Requires network access.
---

# Prepare a product review

Produce a workspace-level review agenda from Atisbo. Default to read-only; a review informs decisions but does not make them automatically.

## Procedure

1. Establish the requested time window. Use `atisbo_orient` with `mode: whats_new` for change since a checkpoint, `mode: strategy` for Strategy Stack alignment, and `mode: snapshot` for current state.
2. Call `atisbo_analyze` for portfolio questions spanning multiple Opportunities, Solutions, sources, states, or time periods. Prefer aggregates over reading every Signal.
3. Use `atisbo_lookup` with `mode: work_queue` to inspect Backlog states and ownership. Open individual Opportunities, Solutions, or Living Documents only when needed to explain a material item.
4. Organize the agenda into:
   - changes in Signals and Opportunities;
   - decisions required from humans;
   - Backlog work that is blocked, unowned, stale, or In Review;
   - contradictions or strategic misalignment;
   - Done items awaiting measurement or showing new evidence;
   - launched work whose expectation was never recorded, and launched work whose Outcome was recorded without a next branch — both are places where the loop silently stopped.
5. For every recommendation, cite the Atisbo entity or aggregate that supports it. Separate facts, interpretations, and proposed decisions.
6. Report the numbers the workspace already has rather than proposing new instrumentation: bound metrics with their baseline, target and trend, and any anomaly that produced evidence in the window. When a question needs a measure nobody is collecting, name the question — do not design an analytics scheme inside Atisbo.

## Guardrails

- Respect the Backlog order returned by Atisbo. Do not reconstruct ranking with RICE.
- Do not mutate priority, state, ownership, or strategy while preparing the review.
- Do not state that "nothing changed" from an incomplete page; follow cursors when the requested scope requires it.
- Move a specific choice to Opportunity Decision or a specific evidence correction to Signal Review.

## Result

Return a meeting-ready agenda with decisions needed, owner questions, Atisbo links/references, and a short list of follow-ups.
