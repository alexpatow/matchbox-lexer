# Pilot workflow

The pilot checks installation, training, export and browser integration on a smaller corpus. Its mid-file source slices can retain teacher context outside the slice, so its quality scores are not comparable with the full corpus.

Use the prerequisites in the [README](../README.md), then run:

```sh
bun install --frozen-lockfile
bun run data:pilot
export CORPUS=pilot
export EXPERIMENT=local-pilot
bun run train
bun run evaluate
bun run dev
```

Keep both environment variables set when running `bun run benchmark`. Choose a new experiment ID on subsequent runs; existing reports are not overwritten.

To return to full-corpus training, unset `CORPUS`, prepare and clean the full dataset, and choose another experiment ID. The default corpus is `full-clean-v1`.
