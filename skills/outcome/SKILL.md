---
name: outcome
description: Review and record the observed Outcome of a Done Atisbo Solution after launch. Use when a product manager, designer, or engineer has post-launch metrics, research, incidents, customer evidence, or an observation window and needs to compare the result with the original expectation as success, partial, miss, or unexpected.
---

# Record post-launch learning

Close the loop only with observed evidence. Output such as a design, PR, merge, or deployment is not an Outcome.

## Procedure

1. Resolve the Solution with `atisbo_lookup` and verify that it is **Done/Launched**. Read its Opportunity, original expectation, Decision history, and relevant Living Document.
2. Establish the baseline, post-launch value or qualitative observation, measurement window, affected segment, source, and confounders.
3. Use `atisbo_analyze` when Atisbo contains the necessary multi-entity or time-window data. If a supplied external metric or research result is not yet in Atisbo, capture it with `atisbo_capture` before recording the Outcome.
4. Compare evidence with the original expectation and propose one classification: `success`, `partial`, `miss`, or `unexpected`.
5. Stop when the window is incomplete or evidence is insufficient. State exactly what and when to measure next.
6. After human confirmation, call `atisbo_decide` with `mode: record_outcome`, the before/after values when available, and concise learning notes.
7. Report the stored Outcome and any reopened Opportunity or follow-up Decision indicated by newer Signals.

## Guardrails

- Do not infer impact from completion, launch, adoption anecdotes, or the absence of complaints.
- Preserve contradictory evidence and confounders.
- Do not rewrite the historical Solution to make the Outcome look better.
- Create a follow-up Solution only through a separate Opportunity Decision.

## Result

Return the observed evidence, comparison window, confirmed classification, stored Outcome reference, and next learning question.
