# Matchbox Lexer

Syntax highlighting with a small model trained through [Matchbox](https://github.com/alexpatow/matchbox). Inspired by [gpu-lexer](https://github.com/vercel-labs/gpu-lexer) by [Shu Ding](https://github.com/shuding).

The model receives source text without a language hint and predicts syntax labels. A decoder merges those labels into spans. Training uses Shiki-labeled source code; browser inference uses the published Matchbox packages on CPU or WebGPU.

## Run locally

You need Bun 1.4.2+, Node 24+, Git and an authenticated GitHub CLI. The training measurement script currently requires macOS (`/usr/bin/time -l`). No Rust or Python setup is needed.

```sh
bun install --frozen-lockfile
bun run data
bun run data:clean
bun run data:snippets
export EXPERIMENT=local-full
bun run train
bun run evaluate
bun run dev
```

This prepares the full corpus and trains the model locally. Use a new `EXPERIMENT` ID for each run; existing reports are never overwritten. Keep the same ID for training, evaluation and benchmarking. The recorded snippet-augmented run took about 20 minutes on an Apple M2 with 8 GiB RAM, excluding data preparation.

For a smaller package-integration check, see [the pilot workflow](docs/pilot.md). Generated data, weights and build output stay out of Git.

## Use the model

```ts
import lexer from "./.matchbox/lexer/model";

const result = await lexer.parse(source, { allowPartial: true });
const gpuResult = await lexer.parse(source, { allowPartial: true, gpu: true });
```

The workbench displays partial candidates and underlines uncertain ranges. Fully uncertain inputs remain unstyled. Omit `allowPartial` for strict, whole-input acceptance. GPU execution is opt-in and fails explicitly when unavailable. Shiki and gpu-lexer load only when you request a comparison; neither is an inference fallback.

The task lives in [`matchbox/lexer`](matchbox/lexer):

| File                                      | Contract                                               |
| ----------------------------------------- | ------------------------------------------------------ |
| [parser.ts](matchbox/lexer/parser.ts)     | Defines valid input and output spans.                  |
| [pipeline.ts](matchbox/lexer/pipeline.ts) | Selects the recurrent token classifier.                |
| [recipe.ts](matchbox/lexer/recipe.ts)     | Composes text parts, features and span supervision.    |
| [decode.ts](matchbox/lexer/decode.ts)     | Merges adjacent predicted labels without syntax rules. |

## Results

The snippet-trained Matchbox 0.4.0 model has 36,233 parameters and a 194,886-byte artifact, excluding shared runtimes. On 1,915 held-out documents, partial predictions achieve **84.38% label agreement** and **99.98% candidate character coverage**. Coverage includes uncertain predictions; strict parsing accepts 523 documents. Confidence is uncalibrated.

On 78 frozen website examples, displayed agreement improved from **82.06% to 93.79%**, including shell commands from **40.29% to 80.99%**. The website examples never enter training. See the [training recipe and reproduction commands](docs/snippet-training.md) and [website evaluation](docs/website-evaluation.md).

See [current and historical measurements](benchmarks/results.md), the [evaluation contract](benchmarks/methodology.md) and [known limitations](docs/limitations.md). The website's deployed asset is versioned separately; training this repository does not update it.

## Validate and benchmark

```sh
bun run check
bunx playwright install chromium
HEADED=1 bun run benchmark
```

Run these after training and evaluation, with the same exported `EXPERIMENT` ID. The benchmark uses a production build and the complete test split. `HEADED=1` enables a visible browser, which may be necessary for a WebGPU adapter.

Dataset preparation and evaluation tools live in `scripts/`. Source manifests and frozen dataset hashes live in `data/`; versioned reports live in `benchmarks/results/`.

Source licenses and attribution are recorded in [third-party notices](THIRD-PARTY-NOTICES.md).

## Website regressions

The [website evaluation](docs/website-evaluation.md) runs 78 real homepage and documentation snippets through the website's pinned lexer in Chromium. It reports displayed highlighting quality, confident coverage and per-snippet mistakes. The frozen corpus stays separate from training.
