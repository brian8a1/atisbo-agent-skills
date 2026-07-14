---
name: signal-review
description: Review evidence already present in Senso Signals and make explicit triage corrections. Use when a product manager asks to review new Signals, discard noise, resolve an orphan, fix incorrect grouping, split or combine evidence, or inspect pending deal-breaker suggestions before Opportunities are acted on.
---

# Review Signals already in Senso

Work only on evidence that has completed Signal Intake. Organize the evidence without silently deciding what the team should build.

## Procedure

1. Call `senso_orient` with the triage snapshot when the user did not supply a Signal, snippet, or Opportunity reference.
2. Use `senso_lookup` to open the relevant claim, orphan snippet, raw citation, or deal-breaker suggestion. Read source provenance before changing classification or grouping.
3. Explain the proposed correction and its evidence. When the user requested a specific mutation, apply the matching `senso_decide` mode:
   - `set_snippet_status` or `set_claim_review_status` for Signal/Review/Noise classification;
   - `reassign_snippet` when evidence belongs to another Opportunity;
   - `split_snippet` when one snippet was clustered into the wrong Opportunity;
   - `create_claim_from_snippet` when an orphan deserves its own Opportunity;
   - `combine_claims` only for genuinely duplicate Opportunities;
   - deal-breaker confirm/reject only after reading the cited source.
4. Re-read the affected entity and state what changed in **Signals** or **Opportunities**.

## Guardrails

- An active Opportunity is already a live problem. Do not call `triage` merely to "confirm" it.
- Both `real_fixed` and `noise` close a claim. Use `real_fixed` only when the problem was real and is already handled.
- Do not create a Solution during Signal Review. Move to an Opportunity Decision when the team is choosing a response.
- Preserve human-pinned classifications and assignments unless the user explicitly overrides them.

## Result

Return the reviewed Signal references, final classification/grouping, and the smallest unresolved question requiring product judgment.
