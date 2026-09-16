# Known limitations

The consumer uses Matchbox 0.2.2 with character tokenization and a three-character context window. The decoder only merges adjacent labels and validates span coverage.

- Character keys are lowercased before training and inference, so capitalization is unavailable to the model.
- Each prediction sees the current character and one character on either side. Distant opening quotes and comment markers are outside that context.
- The public parser limits inputs to 512 UTF-16 units and abstains when any relevant token has insufficient confidence. Longer source inputs are excluded by that limit.
- Unknown vocabulary produces uncertainty. Confidence scores are not calibrated probabilities of correctness.
- The full-corpus model has 44.89% diagnostic label agreement and 31.29% styled macro F1. The public parser accepts 115 of 1,915 inputs, covering only 124 of 1,446,363 scored characters. Training on the full corpus has not made this model useful for general source-code highlighting.
- The pilot includes mid-file slices whose teacher labels retained context outside the slice. Its quality measurements cannot be compared with the full-corpus series.

The browser reference requires an explicit language hint for Shiki. Matchbox receives source text only. The gpu-lexer npm reference is pinned to 0.0.2 and is not assumed equivalent to upstream's latest checkpoint.

See the [measurement contract](../benchmarks/methodology.md) for scoring definitions and timing limitations.
