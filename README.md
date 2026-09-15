# Matchbox Lexer

An independent syntax-highlighting experiment built with published Matchbox packages. Inspired by [gpu-lexer](https://github.com/vercel-labs/gpu-lexer) by [Shu Ding](https://github.com/shuding).

**Resume work from [HANDOFF.md](HANDOFF.md).** It records exact progress, commands, local artifacts, failures and next steps. The full corpus is prepared, but full training is currently blocked by cross-split duplicate source. The browser artifact is still the explicitly labeled pilot.

The experiment tests the whole consumer flow: pinned source data, offline teacher labeling, native training, independent evaluation, a packaged browser model, and a React/Vite workbench. Matchbox stays pinned to 0.2.0. No workspace dependencies, framework patches, hidden grammar fallback, or rewritten inference engine are used.

## Run

Use Bun 1.4.2+, Node 24+, Git and an authenticated GitHub CLI for the pilot source listing. Native training does not require Rust or Python. The timed training runner currently uses macOS `/usr/bin/time -l`; use the published CLI directly on other platforms.

```sh
bun install --frozen-lockfile
bun run data:full
bun run train
bun run evaluate
bun run dev
```

Full corpus preparation downloads pinned upstream sources and runs upstream's unchanged selection and Shiki labeling scripts. It can take substantial time and disk space. Prepared data and models are ignored. Save them with their hashes to reproduce a run without fetching sources again.

```sh
bun run check
bunx playwright install chromium
bun run benchmark
```

The browser comparison loads Shiki or gpu-lexer only when requested. Matchbox inference receives source text without a language hint. Uncertain output stays unstyled.

## Structure

`matchbox/lexer` owns the parser contract, explicit token pipeline, supervision and span decoder. `scripts` owns data preparation, training measurement, evaluation and browser benchmarks. `data` pins corpus selection. `benchmarks/results` stores measurements. `docs/findings.md` records framework gaps. `src` is the consumer application.

## Evolution

Every meaningful change gets an entry here with its reason, package and corpus versions, measurements, and limitations. Earlier reports remain available. Full-corpus comparisons require identical dataset hashes and scoring contracts; a changed corpus starts a new comparison series.

### 00. Published-package wiring pilot

**Change:** Established a separate consumer with Matchbox 0.2.0, character supervision, Shiki 4.4.3, and an assembly-only decoder. The scope-to-class mapping comes from gpu-lexer commit `1e514fd681e31d6b19296f985fb01d8fdc0ae74f`. All Matchbox dependencies came from npm.

**Data:** 36 training snippets, 18 validation snippets and 18 test snippets from repository-disjoint sources, covering JavaScript/TypeScript, Python and Rust. Training contained 33,676 characters. The pilot manifest is retained as `data/corpus.json`, and exact hashes are in its evaluation report.

**Result:** Trainer-reported time was **1.435 seconds**. The packaged model was **7,655 bytes**, with **1,129 parameters**. Diagnostic non-whitespace character agreement was **40.84%**, with **41.80% styled macro F1**. The public parser abstained on **18/18** test snippets, so application agreement was zero. These diagnostic predictions were not accepted application output.

**Limitations:** The pilot was too small to support evolution comparisons. Some snippets started mid-file while teacher labels retained full-file context. This is recorded as a pilot flaw, not attributed to Matchbox. We will not tune on or compare future full runs against this score. The current headless Chromium environment did not expose WebGPU, so gpu-lexer timing is unavailable. Consumer training, generated imports, browser inference, Shiki reference, desktop rendering and mobile layout were exercised.

Reports: [evaluation](benchmarks/results/00-pilot-evaluation.json), [browser measurements](benchmarks/results/00-pilot-browser.json).

### 01. Freeze the full upstream corpus

**Change:** Replace the bounded pilot with all records from upstream's prepared training corpus. Preserve upstream verification as the final test split and use its source-disjoint mining split for validation. Keep full prepared source records, rather than slicing mid-file. Matchbox remains 0.2.0 with the same encoder, decoder and inference threshold.

**Reason:** Future changes need a fixed, meaningful corpus. Shrinking data to accommodate the current API would hide scale limitations.

**Data:** Prepared all 4,299 training files (3,000,000 upstream lexical parts; 12,255,184 UTF-16 units), 336 validation files (843,341 units), and 1,915 test files (1,841,084 units). The generated content is frozen in `data/full-lock.json`. Upstream selection and Shiki labeling took **407.80 seconds**, excluding downloading and Matchbox conversion. See [preparation measurements](benchmarks/results/01-full-preparation.json).

**First attempt:** The Node CLI stopped before training on extensionless imports in the authored task files. The attempt took **0.756 seconds**. Consumer imports now explicitly end in `.ts`, without any Matchbox package modification. See [the preserved attempt](benchmarks/results/01-full-import-failure.json).

**Current result:** The next CLI attempt stopped at dataset validation after **7.739 seconds**, using **466,059,264 bytes peak resident memory**. It did not train a model. Matchbox correctly rejects cross-split input overlap. An audit found **30 overlapping normalized-input groups**, affecting **125 training records and 279 test records**, with no validation overlap. Repository separation alone did not eliminate duplicated source. See [the failed run](benchmarks/results/01-full-training.json) and [overlap audit](benchmarks/results/01-full-overlaps.json).

**Next step:** Define and record a deterministic duplicate-group policy, then version the cleaned full corpus before training again. Do not disable Matchbox's overlap check, silently shrink the data, or overwrite this original full-corpus lock. No full-corpus model score or native training duration exists yet. The machine is an Apple M2 with 8 GiB RAM; this Node process used a recorded 3 GiB JavaScript heap limit.

## Reading the results

Application agreement includes abstentions as failures. Diagnostic agreement measures pre-acceptance predictions and must not be presented as product accuracy. Shiki agreement is imitation of the teacher, not objective semantic correctness. A fast abstention is not fast successful highlighting.

See [the evaluation contract](benchmarks/methodology.md), [framework findings](docs/findings.md), and [third-party notices](THIRD-PARTY-NOTICES.md).
