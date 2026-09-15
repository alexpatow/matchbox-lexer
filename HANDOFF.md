# Resume Matchbox Lexer

Last verified: 2026-09-15, after experiment 03 and its export-parity diagnostic. Update this file immediately after each substantive step. The user requested enough detail to resume with another model without relying on chat history.

## Current state

The consumer is `/Users/alex.patow/Developer/matchbox-lexer`, branch `codex/full-corpus-run`, private remote https://github.com/alexpatow/matchbox-lexer. PR #1 remains open. All three installed packages are exact npm **0.2.1**, recorded in package.json and bun.lock. There are no workspace links, patched packages or internal imports in the consumer pipeline.

**Experiment 03 failed after native fitting, at export parity validation.** Its CLI wall time was 522,663.128 ms (8m42.663s), exit 1, max resident memory 1,465,024,512 bytes. Error: `Burn native and WASM predictions disagree.` No full model was packaged. `.matchbox/lexer/` and the browser still use the pilot. Do not evaluate that artifact as the full model. The public CLI did not preserve optimizer-only timing or fitted weights.

A separate framework diagnostic reproduced the failure and preserved weights. Across 945,166 probe tokens, both runtimes chose identical labels. Maximum confidence drift was 0.00001537799835205078, above the old 0.00001 guard. A proposed fix permits 0.0001 absolute confidence drift, keeps strict label equality, and rejects any acceptance-threshold crossing. Replaying the saved full model passes with zero label disagreements and zero threshold crossings. This is diagnostic evidence, not a successful consumer pipeline result or an accuracy benchmark.

The fix is in `/Users/alex.patow/Developer/matchbox`, branch `codex/sequence-parity-diagnostics`. Full checks passed, including five new guard tests; browser checks are completing in `/tmp/matchbox-parity-browser.log`. A changeset is included. Do not change consumer thresholds or dependencies until a corrected release is published. No training or diagnostic process remains active.

## Immediate next steps

1. Finish and record framework browser checks; open its PR and link it here.
2. Merge the reviewed framework fix and its Changesets version PR, then verify successful npm publication. Do not publish manually or use local packages to bypass this step.
3. Install all three packages at the new exact version. Version 0.2.2 is anticipated, not yet published or installed.
4. Reverify `data/full-clean-v1-lock.json`. Do not download, relabel, sample or regenerate the corpus on this machine.
5. Start **experiment 04**, preserving all earlier reports. Use the same frozen data, pipeline and evaluation contract.

```sh
cd /Users/alex.patow/Developer/matchbox-lexer
git status --short
cat benchmarks/results/03-full-clean-training.json
cat benchmarks/results/03-export-parity-diagnostic.json
cat data/full-clean-v1-lock.json
# Only after installing the corrected published release:
EXPERIMENT=04-full-clean bun run train
EXPERIMENT=04-full-clean bun run evaluate
bun run check
EXPERIMENT=04-full-clean bun run benchmark
```

Current script defaults are `EXPERIMENT=03-full-clean`, `CORPUS=full-clean-v1`. The scripts refuse existing training/evaluation/browser report paths. Use a new ID explicitly, or update defaults when the next run starts. `scripts/package-versions.ts` reads installed versions and requires them to match. `scripts/experiment.ts` rejects a model whose reported data hashes do not match the requested corpus.

## Completed steps

| Step                                        | Result                                                                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Publish native package distribution         | Matchbox 0.2.0 published and installed from npm.                                                                                                             |
| Independent repo, typed task and browser UI | Done; React/Vite consumer, nine character labels, assembly-only decoder.                                                                                     |
| Pilot train/eval/browser wiring             | Completed; model abstained on every test input. Pilot context slicing prevents scientific comparison with later runs.                                        |
| Full upstream source preparation            | Completed; unchanged upstream builder took 407.80 s, peak resident 1,649,721,344 bytes. Fetch duration was not measured separately.                          |
| Full JSONL conversion and original lock     | Completed; 4,299 training, 336 validation, 1,915 test records.                                                                                               |
| Original full CLI attempt 1                 | Failed on extensionless authored imports after 0.756 s. Explicit `.ts` imports fixed consumer Node resolution.                                               |
| Original full CLI attempt 2                 | Failed split-overlap validation after 7.739 s.                                                                                                               |
| Clean split ownership                       | Removed 125 overlapping training records; held-out files unchanged byte-for-byte. New identity full-clean-v1, zero cross-split overlap.                      |
| Experiment 02, npm 0.2.0                    | Failed native one-million-window guard after 32.052 s, before optimization. Public-API reproduction preserved.                                               |
| Framework dataset limit fix                 | PR #21 merged; release PR #22 merged.                                                                                                                        |
| Publish 0.2.1                               | Run 34964944005 passed native builds, install checks, full checks and browser tests. Registry initially returned stale metadata, then all packages resolved. |
| Experiment 03, npm 0.2.1                    | Full fit completed, then export verification failed after 522.663 s. No consumer artifact was produced.                                                      |
| Bounded framework diagnostics               | 64 and 512 records passed the old guard; neither reproduced the full failure.                                                                                |
| Full framework diagnostic                   | Exact npm native/WASM binaries reproduced confidence-only drift; saved model and fit history before checking.                                                |
| Proposed numerical parity fix               | Saved-model replay passes, preserving labels and acceptance decisions. Awaiting review/release.                                                              |
| Full consumer evaluation/browser benchmark  | Still blocked. No full-corpus accuracy or successful browser latency may be claimed.                                                                         |

## Frozen corpus

Upstream: vercel-labs/gpu-lexer commit `1e514fd681e31d6b19296f985fb01d8fdc0ae74f`. Teacher: Shiki 4.4.3. Upstream mining becomes validation; verification becomes final test. The corpus builder's prepared train shard differs from upstream's promoted checkpoint training/replay history.

| Split      | Records | UTF-16 units | full-clean-v1 SHA-256                                            |
| ---------- | ------: | -----------: | ---------------------------------------------------------------- |
| train      |   4,174 |   12,245,833 | 748fa197f1bb2133a83159c1e7f8a2985438e2ba92854ce7321ac4063e55e6d3 |
| validation |     336 |      843,341 | 659c1b8997bbaf7b3057d318aa916e9e41c7af1f8bb11d4d4f44e2b26362c1ae |
| test       |   1,915 |    1,841,084 | cf1be2b37a22d581552f43e114b1dd958311e820e233f982234365f0968b46cd |

The original training conversion had 4,299 records, 12,255,184 units and hash `f57efd6ca7ec46ece8546214fa9a48cedb3a954a432d0bef90958a6a273d329d`. Its lock and data remain untouched. Test-priority cleanup removed 9,351 units (about 0.08%) before any model scores were examined. The audit uses Matchbox's `input.trim().toLowerCase()` normalization. All held-out records remain, including within-split duplicates. Do not select a new policy based on accuracy.

`data/full-lock.json` and `data/full-clean-v1-lock.json` freeze these identities. `data/upstream-corpus.json` holds full provenance; `data/corpus.json` is only the pilot manifest. Raw JSONL, source downloads, licenses and shards remain ignored under `data/generated/`. Upstream selection/labeling failures are recorded in its summary. No extra size sampling or mid-file slicing was added to the full records.

## Diagnostic evidence and replay

Framework-only local files: `/Users/alex.patow/Developer/matchbox/.matchbox/parity-diagnostic/`.

- `64/` preserves the first bounded weights/report: 388,499 supervised tokens; zero disagreements; max drift 0.0000017881393432617188.
- `512/` preserves the second: 2,499,177 supervised tokens; zero disagreements; max drift 0.000003933906555175781.
- Root `model.json`, `fit.json`, `report.json`, `replay.json` preserve the full diagnostic and revised-guard replay. The model has 12,625 parameters, vocabulary 1,507, and 12,245,739 supervised Unicode code points. UTF-16 unit counts differ because some characters use surrogate pairs.
- The full diagnostic fit stage took 496.076 s, including argument conversion. Do not substitute this for the original public CLI's missing optimizer-only timing.
- Root `run.ts` and `replay.ts` are the original ad hoc diagnostic runners, retained locally for exact history. Logs are `/tmp/matchbox-parity-diagnostic{,-512,-full}.log`.
- The reusable authored runner is framework `scripts/diagnose-sequence-export.ts`. It loads a consumer's installed native binary/WASM entry point, refuses an existing output directory and saves weights before parity checks. It passed a 64-record smoke run and explicit typechecking. This runner intentionally uses internals in the framework repo; it is not consumer API guidance.
- Framework `docs/research/sequence-export-parity.md` records the policy and reproduction command.

The diagnostic probes are the first 16 training records plus all 336 validation records, matching the export check. They do not include the final test set. No model architecture, dictionaries, decoder rules, numeric representations or confidence threshold were changed.

## Machine and measurements

Apple M2 ARM64, 8 GiB RAM, macOS 27.0; Bun 1.4.2 and Node v26.8.1. Timed consumer command:

```sh
/usr/bin/time -l node --max-old-space-size=3072 node_modules/matchbox-ai/dist/cli.js train lexer --json
```

The heap setting limits JavaScript heap, not native memory. Training writes process/start metadata to `data/generated/logs/<experiment>-running.json`, stdout to `<experiment>-train.log`, resource/error output to `<experiment>-resources.log`, and completion to `benchmarks/results/<experiment>-training.json`. A running.json file is historical after completion; check whether its PID still exists before assuming activity.

Experiment 03 started 12:07:56.165 UTC and finished 12:16:38.828 UTC. Its time-wrapper PID was 2570 and Node PID 2571; both exited. Full diagnostic PID 5838 also exited.

## Verification and artifacts

Consumer `bun run check` passes on npm 0.2.1 (format, lint, TypeScript, two tests and Vite build), log `/tmp/matchbox-lexer-03-check.log`. The build's large-chunk warning includes optional Shiki grammars and is not a Matchbox-only size measurement.

The pilot desktop/mobile browser smoke passed earlier, report `benchmarks/results/00-pilot-checkpoint-browser.json`. GPU-lexer was unavailable in default headless Chromium because no WebGPU adapter was exposed. `HEADED=1` is supported but has not been run. Some pilot timings measured early abstention, including zero at browser clock resolution; those are not successful highlighting latency. Cold initialization is one observation. The pilot's mid-file teacher context flaw prevents comparison with full results.

`.matchbox/lexer/` is the active pilot; `.matchbox/pilot/` preserves its original backup. `benchmarks/results/active.json` still labels the UI as the pilot. Keep diagnostic models out of those paths. No deployed consumer site or persistent server exists. Source corpora, weights, native binaries, logs and generated bundles must not be committed. Inspect staged paths before pushing.

## Working constraints

Use published Matchbox packages in the consumer, with no workspace links, internal imports, package patches or lowered thresholds. Preserve strict validation and visible abstention. Shiki is the offline teacher and an explicitly loaded reference, never a fallback. Runtime gets source without a language hint. Keep training/eval separation and record exact package versions, dataset hashes and timing at every step. General framework improvements belong in the framework repo with evidence; do not add lexer-specific syntax rules to Matchbox.
