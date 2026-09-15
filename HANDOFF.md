# Resume Matchbox Lexer

Last verified checkpoint: 2026-09-15, approximately 11:25 UTC. Update this file after each substantive step. The user explicitly requested durable, detailed progress so another model can resume when credits run out.

## Read this first

The working repository is `/Users/alex.patow/Developer/matchbox-lexer`, with private GitHub remote `https://github.com/alexpatow/matchbox-lexer`. The framework repository `/Users/alex.patow/Developer/matchbox` is separate and was not changed during this experiment.

**Current blocker:** The full corpus is prepared and converted, but Matchbox 0.2.0 rejects duplicated input across train/test. No full-corpus model has trained. The browser still uses the pilot model. There are no training, data preparation or preview processes intentionally left running at this checkpoint.

Do not rerun downloads or labeling on this machine. All full source data and converted JSONL already exist under ignored `data/generated/`. First inspect the overlap audit and decide a transparent duplicate ownership policy. Preserve all historical reports and original full-corpus hashes.

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
| Resolve duplicate ownership and freeze cleaned full data | Not done.                                              | Requires an explicit documented policy and a new corpus identity. Do not overwrite the original lock.                                             |
| Train/evaluate/benchmark the full corpus                 | Not done.                                              | Blocked by split overlaps. No full-corpus accuracy, latency or trainer time may be claimed.                                                       |
| Improve Matchbox primitives                              | Not started, intentionally.                            | First preserve an honest published-package experiment and evidence.                                                                               |

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

## Current blocker in detail

Published Matchbox rejects `row.input.trim().toLowerCase()` appearing in multiple dataset splits. The guard is in the installed package's `dist/run-*.js`; there is also a sequence supervision guard. It is correct to keep these enabled.

The overlap audit hashes that exact normalized value and stores provenance without source text. All 30 cross-split groups involve training and test. There are 125 affected training records and 279 affected test records, including repeated records within the same split. Repository separation is insufficient when repositories contain identical scripts or fixtures.

Recommended next decision: assign each duplicate group entirely to one split, with test priority as a conservative option. That would remove the 125 contaminated training records while preserving the full test set. This is dataset hygiene rather than size-based sampling, but it changes the original full dataset and must be named, documented and hashed. Alternatively preserve every training record and explicitly exclude the 279 contaminated test records. Do not choose whichever policy improves accuracy. No policy has been applied yet.

Keep the original full conversion untouched. Prefer writing a separate cleaned dataset directory and lock, and making that dataset the frozen comparison series. Update scripts/experiment.ts and matchbox.config.ts coherently if adding a new corpus name. Currently they only support full/pilot.

## Exact commands to resume

```sh
cd /Users/alex.patow/Developer/matchbox-lexer
git status --short
cat benchmarks/results/01-full-training.json
cat data/full-lock.json
bun scripts/audit-splits.ts
```

After the duplicate policy is implemented, documented and verified:

```sh
bun run train
bun run evaluate
bun run check
bun run benchmark
```

Current defaults are `CORPUS=full` and `EXPERIMENT=01-full`. **Do not blindly rerun these and overwrite historical failure records.** Choose a new experiment ID for the next attempt and preserve or uniquely name its logs. The scripts currently write the ID's filenames directly; they do not yet enforce append-only writes.

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

`bun run check` passed for the final checkpoint, including the audit and handoff changes. It runs format, lint, TypeScript, two contract/metric tests, and a Vite production build.

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
- `data/generated/logs/01-full-{train,resources}.log`: current overlap-blocked attempt.
- `/tmp/matchbox-lexer-full-data.log`: source download progress.
- `/tmp/matchbox-lexer-full-build.log` and `...-full-build-time.log`: upstream labeling output and measured resources.
- `/tmp/matchbox-lexer-convert-full.log`: successful converted counts and hashes.
- `/tmp/matchbox-lexer-check.log`: latest check output.
- `data/generated/workbench.png`: last browser screenshot.

No secrets, source corpora, weights, native binaries or generated bundles should be staged. Commit only authored code, manifests/locks, sanitized measurements and documentation. Before pushing, inspect `git diff --cached --stat` and the staged paths.
