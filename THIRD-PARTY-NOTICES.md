# Third-party notices

This experiment is inspired by [gpu-lexer](https://github.com/vercel-labs/gpu-lexer) by Shu Ding, licensed under MIT. The unmodified scope-to-class mapping in scripts/teacher/classes.js is copied from commit `1e514fd681e31d6b19296f985fb01d8fdc0ae74f`; its license is retained alongside the file. The full corpus builder runs from a pinned local checkout of that repository.

Shiki 4.4.3 provides offline supervision and the optional browser reference. Its TextMate grammars retain their own licenses. No teacher grammar or scope rule participates in Matchbox inference.

The source corpus retains original repository/package licenses. Pinning and declared licenses are recorded by upstream's corpus.json and each generated record. Downloaded source, generated JSONL, model weights and source-containing logs are ignored rather than redistributed. Metrics contain provenance and hashes, not source text. Licensing a framework does not relicense its training corpus.

The gpu-lexer npm package is an optional benchmark reference. It is never used as Matchbox's inference implementation or fallback.
