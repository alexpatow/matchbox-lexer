# Matchbox Lexer

A browser syntax-highlighting experiment built with published Matchbox packages. Inspired by [gpu-lexer](https://github.com/vercel-labs/gpu-lexer) by [Shu Ding](https://github.com/shuding).

The project trains a small recurrent token classifier from Shiki-labeled source code and runs it locally in a React/Vite application. A deterministic decoder merges predicted labels into spans. Shiki and gpu-lexer are optional comparison engines, never inference fallbacks.

**Status:** Matchbox 0.4.0 trains and exports a recurrent model using the published npm packages. Partial parsing achieves 82.48% label agreement with 99.95% candidate character coverage on the frozen test set. Candidate coverage includes uncertain predictions; strict parsing accepts only 344 of 1,915 inputs.

## Run the pilot

Install Bun 1.4.2+, Node 24+, Git and an authenticated GitHub CLI for source retrieval. Training uses the published native package and does not require Rust or Python. The timing wrapper uses macOS `/usr/bin/time -l`.

```sh
bun install --frozen-lockfile
bun run data:pilot
CORPUS=pilot EXPERIMENT=local-pilot bun run train
CORPUS=pilot EXPERIMENT=local-pilot bun run evaluate
bun run dev
```

The browser underlines uncertain ranges in partial candidates and leaves wholly uncertain inputs unstyled. Reference engines load only when requested. The pilot tests package integration; its sliced source snippets make it unsuitable for comparison with full-corpus results.

## Full corpus

```sh
bun run data:full
bun scripts/clean-full.ts
EXPERIMENT=local-full bun run train
EXPERIMENT=local-full bun run evaluate
```

Evaluation requires a successfully packaged model matching the requested dataset. The package versions are pinned in package.json and recorded in every report.

Preparation downloads pinned upstream sources and uses gpu-lexer's corpus builder and Shiki labeling. The cleaned dataset preserves every validation and test record, removing 125 training records that overlap held-out inputs. It contains 4,174 training records, 336 validation records and 1,915 test records. Exact hashes are in [the dataset lock](data/full-clean-v1-lock.json).

Downloaded sources, generated datasets and model artifacts are ignored by Git. Save those files alongside their hashes to reproduce a run without downloading and labeling again. Every run needs a unique `EXPERIMENT` value; reports are not overwritten.

## Model configuration

The [pipeline](matchbox/lexer/pipeline.ts) declares `recurrentTokenClassifier()`. The [recipe](matchbox/lexer/recipe.ts) explicitly composes `textParts()`, `textFeatures()` and `spanLabels({ whitespace: "context" })`. The model learns whole-document context; the decoder only merges adjacent predicted labels. It contains no syntax rules.

`minAccuracy: 0` is an explicit research export setting, not a production quality gate. The default confidence threshold remains unchanged.

```ts
import lexer from "./.matchbox/lexer/model";

const complete = await lexer.parse(source);
const preview = await lexer.parse(source, { allowPartial: true });
const gpuPreview = await lexer.parse(source, { gpu: true, allowPartial: true });
```

CPU is the default. WebGPU loads lazily when requested and reports an error when unavailable. Partial results are schema-valid candidates with uncertain UTF-16 ranges; they are not accepted complete parses. Confidence is uncalibrated.

## Current published measurements

The 0.4.0 run uses all 4,174 training documents, selects epoch 3 using the separate 336-document validation set, and evaluates all 1,915 test documents. Corpus hashes match the earlier full-corpus runs. There are no workspace links, local framework patches or adjusted confidence thresholds.

| Measurement                                  |                                     Result |
| -------------------------------------------- | -----------------------------------------: |
| Parameters                                   |                                     36,233 |
| Model artifact, excluding shared runtimes    |                              194,886 bytes |
| Trainer-reported duration                    |                            901.030 seconds |
| Total CLI wall time                          |                            940.984 seconds |
| Peak resident memory                         |                          980,647,936 bytes |
| Partial candidate label agreement            |                                     82.48% |
| Partial candidate styled macro F1            |                                     76.90% |
| Partial candidate character coverage         |                                     99.95% |
| Partial-mode document statuses               | 344 accepted, 1,387 partial, 184 uncertain |
| Strict exact structured accuracy             |                                     10.39% |
| Diagnostic label agreement before acceptance |                                     82.50% |

The model was trained on an Apple M2 with 8 GiB RAM. Export verification checked 409,442 tokens across 352 inputs with zero native/WASM label or acceptance disagreements. Partial candidates include uncertain ranges; these scores describe highlighting suggestions, not guaranteed correct output. The unchanged strict API still abstains on 82.04% of complete inputs.

See the [training timing](benchmarks/results/06-recurrent-040-training.json), [model report](benchmarks/results/06-recurrent-040-model.json) and [held-out evaluation](benchmarks/results/06-recurrent-040-evaluation.json).

## Earlier published measurements

The runs below used an Apple M2 with 8 GiB RAM. CLI wall time includes validation, training and packaging; it is not optimizer-only time.

| Dataset              | Matchbox | CLI wall time | Outcome                                               |
| -------------------- | -------- | ------------: | ----------------------------------------------------- |
| Original full corpus | 0.2.0    |       7.739 s | Split validation rejected overlapping inputs.         |
| Cleaned full corpus  | 0.2.0    |      32.052 s | Native validation rejected the dataset size.          |
| Cleaned full corpus  | 0.2.1    |     522.663 s | Native fitting completed; export verification failed. |
| Cleaned full corpus  | 0.2.2    |     518.695 s | Training, export and evaluation completed.            |
| Cleaned full corpus  | 0.3.0    |     605.847 s | Nine-character model trained, exported and evaluated. |

The 0.3.0 model is **81,633 bytes**, with **13,393 parameters**. Trainer-reported duration was **593.940 seconds**; total CLI wall time was **605.847 seconds**, with **1.45 GB peak resident memory**. Shared WASM runtime size is additional.

On the same 1,915 held-out inputs containing 1,446,363 scored characters:

| Measurement                                          | 0.2.2, three-character window | 0.3.0, nine-character window |
| ---------------------------------------------------- | ----------------------------: | ---------------------------: |
| Diagnostic label agreement before acceptance         |                        44.89% |                       58.17% |
| Diagnostic styled macro F1                           |                        31.29% |                       46.51% |
| Inputs accepted by the public parser                 |                   115 / 1,915 |                   74 / 1,915 |
| Input abstention rate                                |                        93.99% |                       96.14% |
| Exact structured output accuracy                     |                         5.17% |                        3.13% |
| Characters covered by accepted output                |               124 / 1,446,363 |              135 / 1,446,363 |
| Correct accepted labels across all scored characters |                       0.0074% |                      0.0079% |

Wider context improves recognition but does not make the public parser useful for highlighting. The 0.3.0 parser abstains on 1,284 inputs for low confidence, 551 for its input limit, and six for vocabulary coverage. Only 60 of its 74 accepted outputs match the complete expected span array. Diagnostic agreement is not application accuracy.

The published 0.3.0 CLI reproduces the framework's context-four accuracy and macro F1 on the identical frozen test set. Its export check covers 945,166 tokens with zero label or acceptance disagreements between native Burn and WASM. No settings or thresholds were adjusted using this test result. The earlier pilot remains a wiring check and is not comparable with the full-corpus series.

[Versioned reports](benchmarks/results) retain timings, package versions, memory measurements, data identities and failure details. Framework-only diagnostic reports are marked separately. Full-corpus runs are comparable only when data hashes and scoring contracts match.

## Browser benchmarks

After successful training and evaluation, use the same corpus and experiment ID:

```sh
bun run check
bunx playwright install chromium
HEADED=1 EXPERIMENT=local-full bun run benchmark
```

The completed 0.4.0 run used headed Chromium 153 on the same Apple M2 and all 1,915 test documents:

| Engine                   | Label agreement | Candidate character coverage | Full-document p50 / p95 | Fetched JS + WASM, gzip |
| ------------------------ | --------------: | ---------------------------: | ----------------------: | ----------------------: |
| Matchbox, partial CPU    |          82.48% |                       99.95% |           0.9 / 20.0 ms |           383,439 bytes |
| Matchbox, partial WebGPU |          82.48% |                       99.95% |           3.9 / 12.0 ms |         1,490,062 bytes |
| gpu-lexer 0.0.2          |          80.64% |                         100% |            2.1 / 3.5 ms |            35,104 bytes |

Partial coverage includes uncertain predictions. WebGPU fetched only its own WASM runtime, while CPU fetched only the CPU runtime. Download totals include the shared benchmark page scripts and embedded model. They are locally compressed payload sizes, not measured network transfer times. Matchbox exceeds this reference's label agreement on this frozen set, but has larger downloads and slower p95 latency. This is not overall parity.

The [completed browser report](benchmarks/results/06-recurrent-040-verified-browser.json) includes initialization, output statuses, asset hashes and desktop/mobile smoke checks with no page errors. A prior attempt failed on the runtime selector's accessible label; its [failure record](benchmarks/results/06-recurrent-040-browser-failure.json) is preserved.

Use `HEADED=1` to run Chromium with a visible window when headless mode has no WebGPU adapter. The full-corpus headed run measured **80.64% label agreement** and **71.08% styled macro F1** for gpu-lexer 0.0.2. The Shiki reference agreed with 99.94% of scored labels. These references have different training histories and input requirements; see the methodology before comparing quality.

The completed 0.3.0 headed benchmark measured gpu-lexer p50 at 0.8–1.2 ms for 128- and 397-unit samples. Matchbox p50 was 0.2–0.6 ms, but every timed parse abstained. Matchbox initialization took 75.2 ms, including its shared WASM runtime. Those timings do not demonstrate faster successful highlighting. The first test input is only 397 UTF-16 units, so both larger requested timing slices use that actual length. See the [headed browser report](benchmarks/results/05-context-four-headed-retry-browser.json).

The first headed attempt ended when the browser closed; its failure report is preserved alongside the completed retry. Both the headless run and headed retry passed desktop and mobile smoke checks. Headless Chromium had no WebGPU adapter.

The benchmark uses a production build and fresh browser contexts. It measures strict CPU parsing, partial CPU parsing, partial WebGPU parsing and both references separately. Initialization includes a common probe, followed by 20 warmup documents and one timed pass over every full test document. Historical short-prefix probes are retained separately. Fetched asset hashes and gzip sizes identify the actual runtime dependencies. Unavailable WebGPU is reported explicitly. A fast abstention is not successful highlighting latency.

## Source layout

- `matchbox/lexer` contains the parser, pipeline, supervision and span decoder.
- `scripts` contains dataset preparation, training measurement, evaluation and browser benchmarks.
- `data` contains source manifests and dataset locks.
- `benchmarks/results` contains versioned measurements.
- `src` contains the React application.

See the [evaluation methodology](benchmarks/methodology.md), [known limitations](docs/limitations.md) and [third-party notices](THIRD-PARTY-NOTICES.md).
