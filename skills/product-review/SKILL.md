---
name: product-review
description: Prepare a recurring product, weekly, roadmap, or backlog review from the current Senso workspace. Use when a product manager or product leader needs what changed, growing Opportunities, blocked Decisions, unowned or stalled Backlog work, new contradictions, integration health, or launched Solutions awaiting an Outcome.
---

# Prepare a product review

Produce a workspace-level review agenda from Senso. Default to read-only; a review informs decisions but does not make them automatically.

## Procedure

1. Establish the requested time window. Use `senso_orient` with `mode: whats_new` for change since a checkpoint, `mode: strategy` for Strategy Stack alignment, and `mode: snapshot` for current state.
2. Call `senso_analyze` for portfolio questions spanning multiple Opportunities, Solutions, sources, states, or time periods. Prefer aggregates over reading every Signal.
3. Use `senso_lookup` with `mode: work_queue` to inspect Backlog states and ownership. Open individual Opportunities, Solutions, or Living Documents only when needed to explain a material item.
4. Organize the agenda into:
   - changes in Signals and Opportunities;
   - decisions required from humans;
   - Backlog work that is blocked, unowned, stale, or In Review;
   - contradictions or strategic misalignment;
   - Done items awaiting measurement or showing new evidence.
5. For every recommendation, cite the Senso entity or aggregate that supports it. Separate facts, interpretations, and proposed decisions.

## Guardrails

- Respect the Backlog order returned by Senso. Do not reconstruct ranking with RICE.
- Do not mutate priority, state, ownership, or strategy while preparing the review.
- Do not state that "nothing changed" from an incomplete page; follow cursors when the requested scope requires it.
- Move a specific choice to Opportunity Decision or a specific evidence correction to Signal Review.

## Result

Return a meeting-ready agenda with decisions needed, owner questions, Senso links/references, and a short list of follow-ups.
