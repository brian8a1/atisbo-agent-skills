---
name: signal-intake
description: Bring a source that is currently outside Atisbo into Signals with the correct provenance and routing. Use when the user has customer feedback, interview or usability notes, a support conversation, incident, bug report, metric, document, or external finding that should become Atisbo evidence or reusable Knowledge.
---

# Add a source to Signals

Turn source material already in front of the user into traceable Atisbo evidence. Preserve the source; let Atisbo classify and cluster it.

## Procedure

1. Identify the source type and its provenance: who or what produced it, when, and where the original can be opened.
2. Choose one capture path:
   - Customer statement, bug, observation, or metric anomaly: call `senso_capture` with `mode: signal`.
   - Interview transcript, research notes, product documentation, or reusable context: call `senso_capture` with `mode: knowledge` and the appropriate `capture_mode`.
   - External query or metric that supports a Living Document: resolve the document with `senso_lookup`, then call `senso_capture` with `mode: add_artefact_evidence`.
   - A human-approved replacement for a Living Document: use `mode: update_artefact`; never overwrite one merely to append a finding.
3. Preserve exact quotes only when supplied. Summarize observations in your own words and distinguish them from metrics.
4. Include source URLs, filenames, account/customer context, date, and analysis warnings when available.
5. Report what entered **Signals** or **Knowledge**, its Atisbo reference, and any processing still running.

## Routing rules

- Use modality `Q` for a supplied quote, `O` for an observation or incident, and `M` for a measured value. Omit modality when uncertain so Atisbo can infer it.
- Use `signals_only` for source evidence, `context_only` for reusable background, and `context_and_signals` for research material that should do both.
- Do not manually create an Opportunity, Solution, priority, or outcome. Those are later human/product interactions.
- Do not convert an agent opinion into customer evidence.

## Result

Leave the user with a concise receipt: source captured, destination in Atisbo, created reference, and anything that still needs Signal Review.
