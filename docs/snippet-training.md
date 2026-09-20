# Training on standalone snippets

`full-snippets-v1` extends the frozen full corpus with 11,788 training snippets and 261 validation snippets. It retains every original document and preserves the full test split byte-for-byte.

The new examples come from existing, licensed source files. Shell files supply up to 24 deterministic line windows; JavaScript, TypeScript, JSX and TSX supply up to 12. Window lengths cycle through 1, 2, 4, 8 and 16 lines, with a 2,048 UTF-16 unit limit. Markdown supplies explicitly tagged code fences, including JSON. Shiki labels each snippet independently, so its labels describe standalone code rather than the lexical state of the parent document.

Examples remain in their parent split. Normalized duplicate windows are removed. Training windows found inside held-out documents or reserved validation windows are excluded. Validation windows found inside original training documents are also excluded. Website sample containment is excluded in both directions. The website is used only as an exclusion list and regression evaluation, never as training input or label supervision.

The [corpus lock](../data/full-snippets-v1-lock.json) records parent and derived dataset hashes, counts and selection policy. Each generated example retains the source repository, revision, license, parent document index and extraction location. Generated training data stays out of Git.

## Reproduce

```sh
bun run data
bun run data:clean
bun run data:snippets
CORPUS=full-snippets-v1 EXPERIMENT=local-snippets bun run train
```

Use a new experiment ID for each training run. The model architecture, tokenizer, feature encoding and confidence threshold are unchanged. The pipeline uses a learning rate of 0.0015 with the default eight epochs and 4,096-part batch budget. The trainer selects the epoch using validation label accuracy. Training duration and peak memory are recorded by the existing training script.

## Evaluate

```sh
bun scripts/validate-snippets.ts .matchbox/lexer/model.matchbox benchmarks/results/local-validation.json
CORPUS=full-snippets-v1 EXPERIMENT=local-snippets bun run evaluate
bun run build
CORPUS=full-snippets-v1 EXPERIMENT=local-snippets bun run benchmark
bun run eval:website ../matchbox evals/website-v1 benchmarks/results/local-website.json .matchbox/lexer/model.matchbox
```

Validation reports separate original documents from extracted snippets. The broader test and website regression sets are final checks, not checkpoint-selection data. Website evaluation substitutes the candidate artifact only inside the test browser; it does not modify or deploy the website. Omitting the final argument evaluates the website's pinned model.
