# Website code evaluation

The website regression corpus contains all six homepage code tabs and 72 highlighted code blocks from Matchbox's documentation. Source text, line numbers, the website commit, the model checksum and offline reference labels are frozen in [`evals/website-v1`](../evals/website-v1/manifest.json). Plain text blocks and directory trees are excluded, matching the website renderer.

These samples are never read by the training scripts. This is a public regression set for improving the website experience. It does not replace the independent full-corpus test split or establish unseen-code generalization.

## Current result

The [recorded browser evaluation](../benchmarks/results/website-v1.json) uses the website's actual loader, its pinned 194,886-byte model, Matchbox 0.4.1 and CPU/WASM inference with `allowPartial: true`.

| Language     | Samples | Displayed label agreement | Confident character coverage |
| ------------ | ------: | ------------------------: | ---------------------------: |
| TypeScript   |      45 |                    92.06% |                       83.84% |
| TSX          |       2 |                    95.31% |                       88.19% |
| JSON / JSONL |       4 |                    95.29% |                       84.78% |
| Shell        |      27 |                    40.29% |                       36.90% |
| Overall      |      78 |                    82.06% |                       74.84% |

Of 78 results, 76 are partial, one is fully uncertain and one is accepted. Confident characters agree with the reference 92.74% of the time. Confidence is uncalibrated.

Shell commands account for the largest disagreement. For example, the model labels parts of `bunx matchbox-ai train money` as comments or plain text. In the homepage parser, `z.union` and `z.enum` are labeled as types instead of functions. JSON separators are sometimes included in string spans. Each sample's report includes exact offsets, text, expected labels, predicted labels and whether the mismatch intersects an uncertain range.

Shiki and the pinned gpu-lexer scope mapping supply reference labels. Agreement measures that labeling convention, not semantic correctness. In particular, Shiki classifies shell arguments as strings; many shell mismatches reflect missing color rather than incorrect syntax recognition. Manually review mismatches before changing supervision.

## Run against the website

Use a clean Matchbox checkout with dependencies and packages built. Corpus extraction imports the actual homepage sample module through Vite and parses the documentation Markdown. It preserves snippet boundaries, whitespace and the trailing newline rendered by react-markdown. JSONL remains JSONL and uses Shiki's JSON grammar.

```sh
# In the Matchbox checkout:
bun install --frozen-lockfile
bun run build:packages

# In matchbox-lexer:
bun install --frozen-lockfile
bunx playwright install chromium
bun run eval:website ../matchbox evals/website-v1 benchmarks/results/website-v1-next.json
```

The evaluator starts an isolated Vite server on an available loopback port and calls the website's `loadLexer()` in Chromium. It checks the served artifact checksum. It does not use this repository's locally trained weights. The website checkout's runtime and decoder are evaluated, so its commit and package version are recorded separately from the corpus source commit. This integration evaluation is separate from the published-package comparison benchmark.

To capture changed documentation, commit the website changes and create a new corpus version:

```sh
bun run data:website ../matchbox evals/website-v2
bun run eval:website ../matchbox evals/website-v2 benchmarks/results/website-v2.json
```

Existing corpus manifests and reports cannot be overwritten. Compare model changes on the same frozen corpus. Do not add these snippets to training.

## Metrics

All character metrics exclude whitespace and count Unicode code points. Span offsets use UTF-16, matching the runtime API.

- **Displayed agreement** scores the spans the website displays, including uncertain candidate spans. Fully uncertain results display plain text.
- **Candidate coverage** counts characters with any predicted span. It does not imply confidence or acceptance.
- **Confident coverage** excludes every uncertain range. **Confident agreement** scores only those remaining characters.
- Per-language confusion matrices and styled-class F1 expose errors hidden by aggregate agreement. Per-sample mismatches identify the source location. Duplicate snippets remain in the page-level totals; a separate unique-input aggregate prevents duplication from inflating the score.

The shared scorer's legacy `accepted` field counts non-null outputs. Use `statuses` for whole-input acceptance. This development-server evaluation makes no latency claims; use the existing production browser benchmark for performance.
