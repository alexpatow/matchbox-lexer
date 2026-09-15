# Findings

## Published 0.2.0

The consumer installs and trains without a Rust toolchain. Generated TypeScript imports work in Vite, and the browser runs the exported model through WASM. No Matchbox internals or local package builds are imported.

The following gaps are hypotheses to validate against the full corpus, not requests for lexer-specific framework machinery.

1. **Encoder fidelity.** The public character tokenizer lowercases characters. Case information is irreversibly discarded before training. A configurable, serializable encoder could also help identifiers, addresses and case-sensitive codes. Test this contract with `tokenize("Aa", "characters")`.
2. **Context.** The published sequence artifact uses radius one, so only the preceding, current and following character influence each prediction. The model cannot observe a distant opening quote or comment marker. Context strategies should be explicit primitives owned by the model backend, not dictionaries in the decoder.
3. **Partial acceptance.** One low-confidence token causes the entire parse to abstain. Span extraction and document labeling may need validated partial results, with uncertainty retained for each span. This is different from silently lowering the global threshold.
4. **Evaluation contracts.** Exact structured equality is too coarse for long sequence outputs. The consumer currently implements label agreement and macro F1. A configurable evaluator would benefit other structured prediction tasks too.
5. **Training scale.** Full-corpus execution will test in-memory data loading and token-window materialization. Any failure must distinguish machine limits from a proven API limitation. Streaming or batch-oriented supervision would belong in training primitives if the evidence justifies it.

The initial pilot produced diagnostic predictions but abstained on every held-out input. Its data slices sometimes started mid-file with teacher context that the runtime did not receive. That makes it a wiring result only. The full-corpus series uses complete upstream-prepared source records and does not inherit that slicing policy.

## Full-corpus execution checkpoint

The full corpus prepared successfully. The initial Node CLI attempt required explicit `.ts` extensions for consumer-owned task imports. This differs from Bun's permissive extensionless resolution and is worth documenting in authoring guidance.

The subsequent attempt reached dataset validation and stopped because `input.trim().toLowerCase()` overlaps across training and test. The audit records 30 groups, 125 training records and 279 test records. This is a dataset hygiene issue caught by an existing Matchbox safeguard, not evidence of a trainer memory limitation. No full-corpus training has occurred. Resolve duplicate ownership explicitly and preserve original hashes before testing scale.
