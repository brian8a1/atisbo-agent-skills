---
name: solution-bundling
description: Decide whether one Senso Solution can answer several related Opportunities at once. Use when a product manager suspects that separate Opportunities are faces of the same underlying problem, when reviewing a backlog that keeps producing one Solution per Opportunity, or when asked what could be solved together.
---

# Bundle Opportunities into one Solution

A Senso Solution may target several Opportunities. Help the human judge whether one response genuinely covers a group, and record it as ONE work item when it does.

## Procedure

1. Call `senso_lookup` with `mode=bundles`. It returns groups of open Opportunities that no Solution covers and that sit in the same problem neighbourhood, with the evidence behind each.
2. Open every Opportunity in the group you are considering. Read the evidence, not only the titles — the grouping is a similarity signal, not a conclusion.
3. Ask the one question that decides it: **would a single change satisfy every Opportunity in this group?**
   - If yes, present the shared problem, what each Opportunity contributes, and the evidence total.
   - If no, say so plainly and stop. Coincidental similarity is a normal answer, and forcing a bundle produces a Solution nobody can finish.
4. After the human agrees, use `senso_decide` with `mode=create_solution` for the strongest Opportunity, then `mode=update_solution` with `attach_claim_ids` to cover the rest.
5. Report the resulting Backlog item, every Opportunity it now covers, and the evidence standing behind it.

## Guardrails

- Do not create the Solution before the human has seen the group and agreed. The grouping is a proposal, not a decision.
- Do not bundle near-duplicates. If two Opportunities are the same problem recorded twice, that is a grouping defect: use `senso_map` with `mode=regroup` to merge them instead of covering the defect with shared work.
- Do not write an umbrella Solution so broad that no one could tell when it is done. If the shared response cannot be stated in one sentence, the group is not a bundle.
- Do not create one Solution per Opportunity and call it a bundle. One work item, several targets.

## Result

Return either one Solution covering several Opportunities with their combined evidence, or an explicit finding that the group is separate work and why.
