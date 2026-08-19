---
name: outcome
description: Review and record the observed Outcome of a Done Atisbo Solution after launch, and decide what happens next. Use when a product manager, designer, or engineer has post-launch metrics, research, incidents, customer evidence, or an observation window and needs to compare the result with the original expectation as success, partial, miss, or unexpected.
---

# Record post-launch learning

Close the loop only with observed evidence. Output such as a design, PR, merge, or deployment is not an Outcome.

## Procedure

1. Resolve the Solution with `atisbo_lookup` and verify that it is **Done/Launched**. Read its Opportunity, Decision history, and Living Document.
2. **Retrieve the expectation first, before looking at any result.** The Living Document holds the hypothesis, the success criteria and the measure that was not supposed to get worse, recorded when the Solution was created. Read them and state them out loud before the evidence, so the comparison is against a number that already existed.
   If no expectation was recorded, say so explicitly, classify with low confidence, and note that this Solution cannot be honestly graded. Do not invent what "we expected" after seeing the result.
3. Establish the baseline, post-launch value or qualitative observation, measurement window, affected segment, source, and confounders.
4. Use `atisbo_analyze` when Atisbo contains the necessary multi-entity or time-window data. If a supplied external metric or research result is not yet in Atisbo, capture it with `atisbo_capture` before recording the Outcome.
5. Check the side effect, not only the target. Ask what the recorded expectation said must not get worse, and look for it — a target measure that moved while a neighbouring one broke is not a success. Ask the same about newer Signals on the parent Opportunity.
6. Compare evidence with the expectation and propose one classification: `success`, `partial`, `miss`, or `unexpected`.
7. Stop when the window is incomplete or evidence is insufficient. State exactly what and when to measure next.
8. After human confirmation, call `atisbo_decide` with `mode: record_outcome`, the before/after values when available, and concise learning notes.
9. **Ask what happens next and record it.** There are four answers and they are mutually exclusive:
   - optimize the current solution — value was created, now capture more of it;
   - try a different solution — the problem hypothesis stands, this response did not work;
   - go after a different problem — the problem chosen was not what blocked the result;
   - go after a different objective — this lever is exhausted or cannot be moved.
   Log the human's answer with `atisbo_decide` `mode=log_decision`, `decision_type=product_decision`, naming the branch and the reason. A `miss` without a recorded branch is indistinguishable from abandonment, and the pull toward "optimize" after any investment is the well-documented sunk-cost trap — name it when the evidence points elsewhere.
10. Report the stored Outcome, the recorded next branch, and any reopened Opportunity or follow-up Decision indicated by newer Signals.

## Guardrails

- Do not infer impact from completion, launch, adoption anecdotes, or the absence of complaints.
- More adoption is not automatically good. A feature that is used more may mean users are stuck, retrying, or being pushed — read the direction of the evidence, not only its volume.
- Preserve contradictory evidence and confounders.
- Do not rewrite the historical Solution to make the Outcome look better.
- Create a follow-up Solution only through a separate Opportunity Decision — including when the branch chosen is "try a different solution".

## Result

Return the recorded expectation, the observed evidence, the side effect checked, comparison window, confirmed classification, the next branch with its reason, and the stored Outcome reference.
