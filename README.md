# Matchbox Lexer

A browser syntax-highlighting experiment built with published Matchbox packages. Inspired by [gpu-lexer](https://github.com/vercel-labs/gpu-lexer) by [Shu Ding](https://github.com/shuding).

The project trains a small character classifier from Shiki-labeled source code and runs it locally in a React/Vite application. A deterministic decoder merges predicted labels into spans. Shiki and gpu-lexer are optional comparison engines, never inference fallbacks.

**Status:** The small pilot runs in the browser but abstains on all its test examples. Full-corpus training with Matchbox 0.2.1 completes native fitting but fails export verification. No successful full-corpus model or accuracy result is available yet.

## Run the pilot

Install Bun 1.4.2+, Node 24+, Git and an authenticated GitHub CLI for source retrieval. Training uses the published native package and does not require Rust or Python. The timing wrapper uses macOS `/usr/bin/time -l`.

```sh
bun install --frozen-lockfile
bun run data:pilot
CORPUS=pilot EXPERIMENT=local-pilot bun run train
CORPUS=pilot EXPERIMENT=local-pilot bun run evaluate
bun run dev
```

The browser shows uncertainty as unstyled text. Reference engines load only when requested. The pilot tests package integration; its sliced source snippets make it unsuitable for comparison with full-corpus results.

## Full corpus

```sh
bun run data:full
bun scripts/clean-full.ts
EXPERIMENT=local-full bun run train
EXPERIMENT=local-full bun run evaluate
```

The full training command currently fails export verification on Matchbox 0.2.1. Evaluation requires a successfully packaged model matching the requested dataset.

Preparation downloads pinned upstream sources and uses gpu-lexer's corpus builder and Shiki labeling. The cleaned dataset preserves every validation and test record, removing 125 training records that overlap held-out inputs. It contains 4,174 training records, 336 validation records and 1,915 test records. Exact hashes are in [the dataset lock](data/full-clean-v1-lock.json).

Downloaded sources, generated datasets and model artifacts are ignored by Git. Save those files alongside their hashes to reproduce a run without downloading and labeling again. Every run needs a unique `EXPERIMENT` value; reports are not overwritten.

## Measurements

The runs below used an Apple M2 with 8 GiB RAM. CLI wall time includes validation, training and packaging; it is not optimizer-only time.

| Dataset              | Matchbox | CLI wall time | Outcome                                               |
| -------------------- | -------- | ------------: | ----------------------------------------------------- |
| Original full corpus | 0.2.0    |       7.739 s | Split validation rejected overlapping inputs.         |
| Cleaned full corpus  | 0.2.0    |      32.052 s | Native validation rejected the dataset size.          |
| Cleaned full corpus  | 0.2.1    |     522.663 s | Native fitting completed; export verification failed. |

The pilot artifact is 7,655 bytes with 1,129 parameters. Its trainer-reported time was 1.435 seconds. All 18 test snippets produced uncertainty. Its diagnostic label agreement was 40.84%, which is not accepted application accuracy.

[Versioned reports](benchmarks/results) retain timings, package versions, memory measurements, data identities and failure details. Framework-only diagnostic reports are marked separately. Full-corpus runs are comparable only when data hashes and scoring contracts match.

## Browser benchmarks

After successful training and evaluation, use the same corpus and experiment ID:

```sh
bun run check
bunx playwright install chromium
CORPUS=pilot EXPERIMENT=local-pilot bun run benchmark
```

The benchmark uses a production build and fresh browser contexts. It records initialization time, inference p50/p95, output quality and resource sizes. Unavailable WebGPU is reported explicitly. A fast abstention is not successful highlighting latency.

## Source layout

- `matchbox/lexer` contains the parser, pipeline, supervision and span decoder.
- `scripts` contains dataset preparation, training measurement, evaluation and browser benchmarks.
- `data` contains source manifests and dataset locks.
- `benchmarks/results` contains versioned measurements.
- `src` contains the React application.

See the [evaluation methodology](benchmarks/methodology.md), [known limitations](docs/limitations.md) and [third-party notices](THIRD-PARTY-NOTICES.md).
