# Resume Matchbox Lexer

Last verified checkpoint: 2026-09-15, after full consumer and framework checks. Update this file after each substantive step. The user explicitly requested durable, detailed progress so another model can resume when credits run out.

## Read this first

The working repository is `/Users/alex.patow/Developer/matchbox-lexer`, with private GitHub remote `https://github.com/alexpatow/matchbox-lexer`. The framework repository `/Users/alex.patow/Developer/matchbox` is separate. A focused fix is now on its `codex/training-dataset-validation` branch, based on origin/main at cd84d19. The consumer still uses untouched npm 0.2.0.

**Current checkpoint, experiment 02:** The user authorized continuation after the account reset. Branch: `codex/full-corpus-run`. Test-priority duplicate ownership is applied: 125 overlapping training records removed, validation/test unchanged. `data/generated/full-clean-v1/` contains 4,174 training records and 12,245,833 UTF-16 units. `data/full-clean-v1-lock.json` freezes the identity; original full data is untouched. A fresh overlap audit found zero overlapping groups.

**Current blocker:** The cleaned published-CLI run failed after 32.052 seconds, before optimizer training. Error: `Expected a nonempty batch of three-token windows`. Peak resident memory was 1,738,752,000 bytes; the heap limit was not reached. Published 0.2.0 source was verified against the GitHub release tag: crates/matchbox-engine/src/model.rs::validate_inputs rejects values.len() > 3_000_000, which is 1,000,000 three-token windows. crates/matchbox-engine/src/training.rs calls that same validator on the entire training dataset, then would train in batches of 128. Installed @matchbox-ai/train sends all windows in one native fit call. This is a general training-size bug, not a lexer limitation. No full-corpus model exists. No training process remains running; the running.json file is historical. The browser still uses the pilot.

The public-API reproduction succeeded: 32 supervised characters trained in 62.426 ms; 1,000,002 failed with the same error after 649.940 ms. See scripts/reproduce-training-limit.ts and benchmarks/results/02-native-limit-reproduction.json. Next: review and merge framework PR #21, then use its Changesets release before upgrading this consumer and attempting experiment 03. The narrow framework fix is to separate whole-training-dataset validation from prediction batch limits, preserve malformed-input checks, and give explicit limit errors. Any framework change must be a separate reviewed/published release before this consumer upgrades. Do not patch node_modules or shrink this corpus to get a result. The framework change moves the size limit into prediction, preserving dataset shape/vocabulary validation. Three Rust regression tests and the full framework check passed, with output at /tmp/matchbox-training-validation-check.log. All 18 browser tests passed; output is /tmp/matchbox-training-validation-browser.log. The fix is committed as 3351f13 and pushed in https://github.com/alexpatow/matchbox/pull/21. No training, test or preview process remains active. No framework release has been made.

Defaults now resolve `CORPUS=full-clean-v1` and `EXPERIMENT=02-full-clean`. Training refuses to overwrite existing report/log files. Inspect `data/generated/logs/02-full-clean-running.json` for the active process and command, and `benchmarks/results/02-full-clean-training.json` for completion. Do not start a second training process if the recorded process is still alive.

Do not rerun downloads or labeling on this machine. All full source data and converted JSONL already exist under ignored `data/generated/`. The test-priority duplicate policy is already applied and verified. Preserve all historical reports and original full-corpus hashes.

The consumer checkpoint is committed as c50b21b and pushed in PR https://github.com/alexpatow/matchbox-lexer/pull/1. Historical reports remain unchanged. The new formatter exclusion keeps recorded result JSON from being reformatted.

## User intent and constraints

1. Build a separate consumer experiment using published packages to expose missing general primitives.
2. Use gpu-lexer as inspiration and benchmark reference, with its README-documented source corpus.
3. Keep Matchbox pinned to 0.2.0 unchanged for the first real experiment. No internal imports, workspace links, local package patches, changed weights, lowered inference thresholds, or syntax rules in the decoder.
4. Use the full prepared corpus for evolution comparisons. The bounded pilot is only a wiring test.
5. Record every meaningful evolution in README.md, including data and package identities, training time, measurements and limitations.
6. Preserve source-disjoint evaluation and do not tune against the test split. Do not hide missing GPU results or claim diagnostic predictions were accepted.
7. Keep TypeScript/Bun authoring and React/Vite. No Python or separate user-managed ML stack.

## Step-by-step status

| Step                                                     | Status                                                 | Evidence and output                                                                                                                               |
| -------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inspect upstream data, architecture and published APIs   | Done.                                                  | Upstream commit and findings are recorded below and in docs/findings.md.                                                                          |
| Create independent private consumer repo                 | Done.                                                  | Git remote is alexpatow/matchbox-lexer; dependencies use exact npm versions.                                                                      |
| Install published Matchbox 0.2.0                         | Done.                                                  | bun.lock; no workspace or file dependencies.                                                                                                      |
| Author parser, pipeline, recipe, decoder                 | Done.                                                  | matchbox/lexer/*.ts; character labels, nine classes, UTF-16 spans.                                                                                |
| Build bounded pilot data                                 | Done.                                                  | data/generated/pilot/; source manifest data/corpus.json.                                                                                          |
| Train pilot through published CLI                        | Done.                                                  | .matchbox/pilot/ backup and .matchbox/lexer/ active artifact. Trainer time 1.435 s.                                                               |
| Evaluate pilot                                           | Done.                                                  | benchmarks/results/00-pilot-evaluation.json. Application abstention 18/18; diagnostic agreement 40.84%, styled macro F1 41.80%.                   |
| Build browser workbench                                  | Done.                                                  | src/, Vite build. Latest UI adds a results table using benchmarks/results/active.json.                                                            |
| Browser pilot benchmark                                  | Done.                                                  | benchmarks/results/00-pilot-browser.json. Node/Burn WASM path works. gpu-lexer unavailable in default headless Chromium due to no WebGPU adapter. |
| Desktop/mobile browser smoke                             | Passed on the current UI, including the results table. | Screenshot at data/generated/workbench.png. The final checkpoint browser report is benchmarks/results/00-pilot-checkpoint-browser.json.           |
| Download full upstream data                              | Done.                                                  | Ignored pinned checkout and source downloads under data/generated/upstream/gpu-lexer/.                                                            |
| Run full upstream selection/labeling                     | Done.                                                  | 407.80 seconds for builder, max resident 1,649,721,344 bytes. See 01-full-preparation.json.                                                       |
| Convert every full record into Matchbox JSONL            | Done.                                                  | data/generated/full/, data/full-lock.json. No additional sampling or file slicing.                                                                |
| Time first full CLI attempt                              | Failed before training.                                | 01-full-import-failure.json; explicit .ts consumer imports now fix the Node resolution error.                                                     |
| Time second full CLI attempt                             | Failed at split validation.                            | 01-full-training.json; 7.739 s wall, 466,059,264 bytes max resident. No model training occurred.                                                  |
| Audit duplicate inputs across splits                     | Done.                                                  | 01-full-overlaps.json: 30 groups, 125 train records, 279 test records; validation has zero overlap.                                               |
| Resolve duplicate ownership and freeze cleaned full data | Done.                                                  | full-clean-v1 preserves every held-out record and removes 125 overlapping train records. The new audit has zero overlaps.                         |
| Train/evaluate/benchmark the full corpus                 | Training attempted; blocked by native dataset cap.     | 02-full-clean-training.json: 32.052 seconds, exit 1. No full-corpus accuracy, latency or optimizer time exists.                                   |
| Reproduce the native training-size bug                   | Done.                                                  | 02-native-limit-reproduction.json uses only the public train API, with a passing small control and a failing large dataset.                       |
| Fix framework dataset validation                         | Next.                                                  | https://github.com/alexpatow/matchbox/pull/21; six Rust tests, 111 Bun tests and 18 browser tests pass. Consume only its published release.       |

## Versions and machine

- Matchbox CLI: `matchbox-ai@0.2.0`.
- Runtime: `@matchbox-ai/core@0.2.0`.
- Training: `@matchbox-ai/train@0.2.0`.
- Teacher: `shiki@4.4.3`.
- Optional reference: `gpu-lexer@0.0.2`. Do not equate this npm package with upstream's current promoted checkpoint.
- Upstream corpus/labeling commit: `1e514fd681e31d6b19296f985fb01d8fdc0ae74f`, vercel-labs/gpu-lexer.
- Bun: 1.4.2. Local Node command: v26.8.1. macOS: 27.0. CPU: Apple M2, ARM64. RAM: 8 GiB.
- The timed Node command uses `--max-old-space-size=3072`. This limits JavaScript heap, not all native allocations. No memory limit was reached in the failed attempts.
- Disk had approximately 12 GiB free before full preparation. Check `df -h .` before additional downloads.

## Full dataset and immutable identities

The upstream builder selected all prepared train records, unchanged. Upstream mining becomes Matchbox validation; upstream verification becomes Matchbox test. No language metadata enters inference. The upstream promoted checkpoint has warm-start/replay history, so its README training count is not the same as the prepared train shard.

| Split      | Records | UTF-16 units | SHA-256 of converted JSONL                                       |
| ---------- | ------: | -----------: | ---------------------------------------------------------------- |
| train      |   4,299 |   12,255,184 | f57efd6ca7ec46ece8546214fa9a48cedb3a954a432d0bef90958a6a273d329d |
| validation |     336 |      843,341 | 659c1b8997bbaf7b3057d318aa916e9e41c7af1f8bb11d4d4f44e2b26362c1ae |
| test       |   1,915 |    1,841,084 | cf1be2b37a22d581552f43e114b1dd958311e820e233f982234365f0968b46cd |

Original upstream shards: `data/generated/upstream/gpu-lexer/packages/training/data/generated/shards/{train,mining,verification}.jsonl.gz`. Train contains 3,000,000 upstream lexical parts. Mining contains 300,000. Verification contains 464,527, including website cases. Converted records use complete prepared source and merged character labels; no mid-file clipping is added.

`data/upstream-corpus.json` retains the full source manifest. `data/corpus.json` is the pilot manifest, not the full dataset definition. `data/full-lock.json` freezes the original full conversion. `data/generated/full/summary.json` includes upstream details and rejected/minification cases. Upstream records its own labeling/minification failures; do not silently treat these as successful labels.

## Dataset hygiene and native blocker

Published Matchbox rejects normalized inputs shared across splits. The original audit found 30 groups, affecting 125 training records and 279 test records. This has been resolved by preserving all held-out data and removing contaminated training records before looking at model scores. `scripts/clean-full.ts` verifies the original lock, produces full-clean-v1 and freezes its hashes. Its training hash is `748fa197f1bb2133a83159c1e7f8a2985438e2ba92854ce7321ac4063e55e6d3`. Validation and test hashes remain the original values above.

The current blocker is the native one-million-window guard described at the top. Keep the consumer on untouched 0.2.0 until a new package release is available. The full attempt and public reproduction are complete; repeating them under the same IDs is unnecessary and refuses to overwrite their reports.

## Exact commands to resume

```sh
cd /Users/alex.patow/Developer/matchbox-lexer
git status --short
cat benchmarks/results/02-full-clean-training.json
cat benchmarks/results/02-native-limit-reproduction.json
cat data/full-clean-v1-lock.json
bun scripts/audit-splits.ts
```

Only after the framework fix is reviewed, published and installed, choose a new experiment ID for the next full run. Use that same ID for all commands:

```sh
EXPERIMENT=03-full-clean bun run train
EXPERIMENT=03-full-clean bun run evaluate
bun run check
EXPERIMENT=03-full-clean bun run benchmark
```

Current defaults are `CORPUS=full-clean-v1` and `EXPERIMENT=02-full-clean`. Training refuses existing reports/logs. Evaluation and browser reports still require care to avoid overwriting historical results. Record the newly installed package version in the runner before experiment 03; it currently records 0.2.0.

The timed runner invokes:

```sh
/usr/bin/time -l node --max-old-space-size=3072 node_modules/matchbox-ai/dist/cli.js train lexer --json
```

It records wall time, exit status and peak resident memory. Native trainer-reported time exists only after successful training in `.matchbox/lexer/report.json`. The artifact currently in that directory is the pilot, because failed full training did not replace it. `scripts/experiment.ts` checks dataset hashes before evaluating or benchmarking, so default full commands refuse this stale pilot model.

To inspect the existing pilot without modifying data or weights:

```sh
bun run dev
```

To reproduce the pilot on a fresh clone, use a new report ID:

```sh
bun run data:pilot
CORPUS=pilot EXPERIMENT=00-pilot-reproduction bun run train
CORPUS=pilot EXPERIMENT=00-pilot-reproduction bun run evaluate
bun run build
CORPUS=pilot EXPERIMENT=00-pilot-reproduction bun run benchmark
```

This overwrites the active ignored `.matchbox/lexer` artifact. `.matchbox/pilot` on the current machine is a preserved original backup. Do not mistake the regenerated pilot for a full run. `benchmarks/results/active.json` drives the UI label and recorded measurements.

## Preparation commands and caveats

`bun run data:full` is the fresh-machine entry point. It clones the pinned upstream repo if absent, verifies HEAD, streams source archives through `scripts/fetch-full.ts`, runs the unchanged upstream builder, and converts the resulting shards. Full preparation was executed in separate measured steps on this first run; the aggregate fetch time was not recorded. Do not invent it.

The storage adapter retains every recognized-language file eligible for upstream's max-file-size rule, plus license notices. It omits archives and unrelated large assets to fit local disk; corpus quotas/selection are unchanged. The upstream fetcher then reuses repository provenance and fetches npm sources and website examples. Files stay ignored.

The first converter using readline incorrectly split one record. All 4,299 train records validated when splitting decompressed JSONL directly at LF. `scripts/read-shard.ts` now uses a streaming UTF-8 decoder and LF delimiters, and the full conversion succeeded. Do not rebuild the corpus to fix a reader problem. A dedicated read-shard regression test is still worth adding.

The upstream checkout's corpus-summary.json is modified by its own builder. That checkout is ignored. Do not commit it or its source corpus into this repository.

## Verification state and caveats

`bun run check` passed after the experiment 02 cleanup and reproduction changes (log: /tmp/matchbox-lexer-02-check.log). It runs format, lint, TypeScript, two contract/metric tests, and a Vite production build.

The final browser smoke passed with desktop and mobile widths and no page errors, including the measurements table. Matchbox inference abstained as expected; Shiki reference loaded. The report is benchmarks/results/00-pilot-checkpoint-browser.json. The original pilot report remains unchanged. The benchmark uses fresh browser contexts and records unavailable WebGPU rather than forcing a software GPU. `HEADED=1` allows a future headed test, but it has not been run.

The pilot browser report's longest timing input was actually 941 units, not 1,024, because the first test snippet was shorter. Some calls measured zero at browser clock precision because the unknown-vocabulary path abstained early. They are not successful highlighting timings. Cold initialization is a single observation. The browser methodology documents these limitations.

The workbench currently has no deployment and no persistent server. There is no CI workflow in this new repo yet. The total Vite build includes optional Shiki grammar chunks; its large-chunk warning is not a Matchbox-only bundle measurement. Browser resources and compressed asset sizes are recorded separately.

## Local artifacts and logs

- `.matchbox/lexer/`: active pilot wrapper, artifact, declarations and report.
- `.matchbox/pilot/`: preserved original pilot model.ts, model.matchbox and report.json.
- `data/generated/pilot/`: pilot JSONL, provenance, summary and raw source-containing evaluation backup.
- `data/generated/full/`: converted full JSONL, per-record provenance and summary.
- `data/generated/upstream/gpu-lexer/`: pinned upstream source, downloaded corpus and compressed shards.
- `data/generated/logs/01-full-import-failure*.log`: first Node import-resolution attempt.
- `data/generated/logs/01-full-{train,resources}.log`: historical overlap-blocked attempt.
- `data/generated/full-clean-v1/`: cleaned frozen corpus.
- `data/generated/logs/02-full-clean-{train,resources}.log`: completed native-limit failure.
- `/tmp/matchbox-lexer-native-repro.log`: successful public-API reproduction output.
- `/tmp/matchbox-lexer-full-data.log`: source download progress.
- `/tmp/matchbox-lexer-full-build.log` and `...-full-build-time.log`: upstream labeling output and measured resources.
- `/tmp/matchbox-lexer-convert-full.log`: successful converted counts and hashes.
- `/tmp/matchbox-lexer-check.log`: latest check output.
- `data/generated/workbench.png`: last browser screenshot.

No secrets, source corpora, weights, native binaries or generated bundles should be staged. Commit only authored code, manifests/locks, sanitized measurements and documentation. Before pushing, inspect `git diff --cached --stat` and the staged paths.
