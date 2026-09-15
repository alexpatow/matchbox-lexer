# Known limitations

The consumer uses Matchbox 0.2.1 with character tokenization and a three-character context window. The decoder only merges adjacent labels and validates span coverage.

- Character keys are lowercased before training and inference, so capitalization is unavailable to the model.
- Each prediction sees the current character and one character on either side. Distant opening quotes and comment markers are outside that context.
- The public parser limits inputs to 512 UTF-16 units and abstains when any relevant token has insufficient confidence. Most source files exceed that input limit.
- Unknown vocabulary produces uncertainty. Confidence scores are not calibrated probabilities of correctness.
- The full-corpus model fails the published export check. A diagnostic using the fitted weights measured zero label disagreements across 945,166 probe tokens and a maximum native/WASM confidence difference of 0.00001538, exceeding the 0.00001 cutoff. No successfully packaged full-corpus artifact is available.
- The pilot includes mid-file slices whose teacher labels retained context outside the slice. Its quality measurements cannot be compared with the full-corpus series.

The browser reference requires an explicit language hint for Shiki. Matchbox receives source text only. The gpu-lexer npm reference is pinned to 0.0.2 and is not assumed equivalent to upstream's latest checkpoint.

See the [measurement contract](../benchmarks/methodology.md) for scoring definitions and timing limitations.
