---
name: opportunity-decision
description: Support and record a product decision for one Atisbo Opportunity. Use when a product manager or designer is comparing responses, needs the evidence and contradictions behind an Opportunity, wants to explore several candidate solutions before committing, create or update a Solution, record alternatives and reasoning, set an explicit priority boost, or decide that more evidence is required.
---

# Make an Opportunity decision

Help the human choose a response to a confirmed Opportunity. Atisbo supplies evidence and memory; the human retains authority.

## Procedure

1. Resolve the Opportunity with `atisbo_lookup`. Read its detail, related Solutions, relevant Living Document, recent Decisions, and only the cited raw Signals needed to judge the choice.
2. Use `atisbo_analyze` when the decision depends on cross-Opportunity volume, trend, source, segment, or activity rather than one item.
3. **Sharpen the problem before proposing anything.** State it in the user's terms, not the product's:
   - the job: when [circumstance], the user is trying to [job], so that [outcome], without [pain];
   - the segment by behaviour, not demographics — read account, signal origin, modality and recency from the evidence, and name the behaviour the affected users share;
   - the root cause you believe is behind it, and which cited evidence supports it.
   Say which of the three is guesswork. A problem that can only be stated as "users complain about X" is not ready for a response.
4. **Produce several candidate responses, not one.** Reaching for the first workable idea is the default failure of this step and it caps the outcome before the work starts. Generate at least three materially different candidates by forcing different angles — substitute a part, combine two things, invert the flow, remove a step, add or remove a constraint, make the problem unnecessary, make the state self-evident. Judge nothing while generating.
5. Present, together and comparable:
   - the problem, affected users/accounts, and the job from step 3;
   - evidence supporting it and contradictory evidence;
   - every candidate with its tradeoff, not only the recommended one;
   - existing Solutions and prior decisions, including alternatives rejected earlier;
   - assumptions, missing evidence, and reversibility;
   - the exact decision that remains human-owned.
6. Do not write while the user is exploring. After an explicit decision, use `atisbo_decide` to create/update the Solution or log the Decision with its reasoning and alternatives.
7. **Record the expectation with the Solution, before anything is built.** Call `atisbo_decide` `mode=apply_solution_spec` with:
   - `hypothesis`: we believe [this response] will achieve [this result] for [this audience];
   - `successCriteria`: the observable measure that would prove it, the window in which to look, and the measure that must NOT get worse as a side effect;
   - `decisionLog.alternatives`: the candidates from step 4 that were not chosen;
   - `decisionLog.reasoning`: why this one won over those.
   Without this the Outcome is later decided from memory, and the rejected options are gone exactly when a failed attempt makes them valuable again.
8. Re-read the Opportunity/Solution and report the resulting **Backlog** item, state, priority boost, and Living Document reference.

## Guardrails

- Never present a single response as the only response. When the user wants one recommendation, still name what was considered and rejected.
- Do not generate a technical implementation plan; the decision records what and why, not how a repository must change.
- Do not use legacy RICE fields to rank the Backlog. Use Atisbo's returned priority and only apply `priority_boost` when the human explicitly chooses it.
- Effort belongs in the conversation, never in the ranking. Say roughly what a candidate would cost so the human can weigh it; never present the cheapest option as the prioritized one.
- Do not erase contradictory evidence or rejected alternatives.
- Use `atisbo_map` only when the confirmed decision changes a Group, node, anchor, or metric relationship.

## Result

Return the confirmed Decision, created or updated Solution, the recorded expectation and success measure, supporting references, rejected alternatives with their reasons, and the remaining measurement question.
