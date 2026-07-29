---
name: opportunity-decision
description: Support and record a product decision for one Atisbo Opportunity. Use when a product manager or designer is comparing responses, needs the evidence and contradictions behind an Opportunity, wants to create or update a Solution, record alternatives and reasoning, set an explicit priority boost, or decide that more evidence is required.
---

# Make an Opportunity decision

Help the human choose a response to a confirmed Opportunity. Atisbo supplies evidence and memory; the human retains authority.

## Procedure

1. Resolve the Opportunity with `senso_lookup`. Read its detail, related Solutions, relevant Living Document, recent Decisions, and only the cited raw Signals needed to judge the choice.
2. Use `senso_analyze` when the decision depends on cross-Opportunity volume, trend, source, segment, or activity rather than one item.
3. Present:
   - the problem and affected users/accounts;
   - evidence supporting it and contradictory evidence;
   - existing Solutions and prior decisions;
   - alternatives, assumptions, missing evidence, and reversibility;
   - the exact decision that remains human-owned.
4. Do not write while the user is exploring. After an explicit decision, use `senso_decide` to create/update the Solution or log the Decision with its reasoning and alternatives.
5. Re-read the Opportunity/Solution and report the resulting **Backlog** item, state, priority boost, and Living Document reference.

## Guardrails

- Do not generate a technical implementation plan; the decision records what and why, not how a repository must change.
- Do not use legacy RICE fields to rank the Backlog. Use Atisbo's returned priority and only apply `priority_boost` when the human explicitly chooses it.
- Do not erase contradictory evidence or rejected alternatives.
- Use `senso_map` only when the confirmed decision changes a Group, node, anchor, or metric relationship.

## Result

Return the confirmed Decision, created or updated Solution, supporting references, rejected alternatives, and remaining measurement question.
