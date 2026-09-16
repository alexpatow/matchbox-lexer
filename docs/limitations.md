# Known limitations

The consumer uses Matchbox 0.4.0 with explicit text-part encoding and a recurrent token classifier. The application decoder only merges adjacent labels and validates span coverage.

- Strict parsing abstains if a relevant prediction fails the confidence threshold. Partial parsing can return a schema-valid candidate with uncertain ranges, which does not guarantee correct highlighting.
- Confidence scores are not calibrated probabilities. Candidate coverage includes uncertain labels and must not be described as confident coverage.
- WebGPU is opt-in and requires a supported browser adapter. Its runtime is downloaded separately and a failed GPU request does not silently fall back to CPU.
- Model artifact size excludes shared WASM and JavaScript runtime downloads. Browser results report those dependencies separately.
- The pilot includes mid-file slices whose teacher labels retained context outside the slice. Its quality measurements cannot be compared with the full-corpus series.

The browser reference requires an explicit language hint for Shiki. Matchbox receives source text only. The gpu-lexer npm reference is pinned to 0.0.2 and is not assumed equivalent to upstream's latest checkpoint. Its training history differs from this experiment.

See the [current results](../README.md) and [measurement contract](../benchmarks/methodology.md) for measured quality, scoring definitions and timing limitations.
