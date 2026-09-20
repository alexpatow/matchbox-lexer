# Measured results

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

See the [training timing](results/06-recurrent-040-training.json), [model report](results/06-recurrent-040-model.json) and [held-out evaluation](results/06-recurrent-040-evaluation.json).

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

[Versioned reports](results) retain timings, package versions, memory measurements, data identities and failure details. Framework-only diagnostic reports are marked separately. Full-corpus runs are comparable only when data hashes and scoring contracts match.

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

The [completed browser report](results/06-recurrent-040-verified-browser.json) includes initialization, output statuses, asset hashes and desktop/mobile smoke checks with no page errors. A prior attempt failed on the runtime selector's accessible label; its [failure record](results/06-recurrent-040-browser-failure.json) is preserved.

Use `HEADED=1` to run Chromium with a visible window when headless mode has no WebGPU adapter. The full-corpus headed run measured **80.64% label agreement** and **71.08% styled macro F1** for gpu-lexer 0.0.2. The Shiki reference agreed with 99.94% of scored labels. These references have different training histories and input requirements; see the methodology before comparing quality.

The completed 0.3.0 headed benchmark measured gpu-lexer p50 at 0.8–1.2 ms for 128- and 397-unit samples. Matchbox p50 was 0.2–0.6 ms, but every timed parse abstained. Matchbox initialization took 75.2 ms, including its shared WASM runtime. Those timings do not demonstrate faster successful highlighting. The first test input is only 397 UTF-16 units, so both larger requested timing slices use that actual length. See the [headed browser report](results/05-context-four-headed-retry-browser.json).

The first headed attempt ended when the browser closed; its failure report is preserved alongside the completed retry. Both the headless run and headed retry passed desktop and mobile smoke checks. Headless Chromium had no WebGPU adapter.

The benchmark uses a production build and fresh browser contexts. It measures strict CPU parsing, partial CPU parsing, partial WebGPU parsing and both references separately. Initialization includes a common probe, followed by 20 warmup documents and one timed pass over every full test document. Historical short-prefix probes are retained separately. Fetched asset hashes and gzip sizes identify the actual runtime dependencies. Unavailable WebGPU is reported explicitly. A fast abstention is not successful highlighting latency.

See the [measurement contract](methodology.md) for scoring and runtime definitions.
