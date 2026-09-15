import { mkdir } from "node:fs/promises";
import { labels, type Label, type Span } from "../matchbox/lexer/labels";
import { hash } from "./corpus";
import { freezeCorpus } from "./corpus-lock";
import { readShard } from "./read-shard";
const root = "data/generated/upstream/gpu-lexer/packages/training/data/generated/shards";
await mkdir("data/generated/full", { recursive: true });
const summary: { dataset: string; splits: Record<string, unknown>; upstream: unknown } = {
  dataset: "full-v1",
  splits: {},
  upstream: await Bun.file(`${root}/summary.json`).json(),
};
for (const [upstream, split] of [
  ["train", "train"],
  ["mining", "validation"],
  ["verification", "test"],
]) {
  const rows = Bun.file(`data/generated/full/${split}.jsonl`).writer();
  const metadata: unknown[] = [];
  let units = 0;
  let examples = 0;
  for await (const record of readShard(`${root}/${upstream}.jsonl.gz`)) {
    if (record.sourceLabelsVersion !== 1) {
      throw new Error("Missing direct upstream source labels");
    }
    const source: string = record.source;
    const types: Label[] = Array.from({ length: source.length }, () => "plain");
    let previousEnd = 0;
    for (const span of record.sourceLabels) {
      if (
        !labels.includes(span.class) ||
        span.from < previousEnd ||
        span.to > source.length ||
        span.to <= span.from
      ) {
        throw new Error("Malformed upstream span");
      }
      // Only omitted line separators may have the default plain label.
      if (/[^\r\n]/.test(source.slice(previousEnd, span.from))) {
        throw new Error("Uncovered non-newline source");
      }
      types.fill(span.class, span.from, span.to);
      previousEnd = span.to;
    }
    if (/[^\r\n]/.test(source.slice(previousEnd))) {
      throw new Error("Uncovered trailing source");
    }
    const output: Span[] = [];
    let offset = 0;
    for (const character of source) {
      const type = types[offset];
      if (character.length === 2 && types[offset + 1] !== type) {
        throw new Error("Surrogate-pair label mismatch");
      }
      const last = output.at(-1);
      if (last?.type === type) {
        last.end += character.length;
      } else {
        output.push({ type, start: offset, end: offset + character.length });
      }
      offset += character.length;
    }
    rows.write(JSON.stringify({ input: source, output }) + "\n");
    const { source: _, sourceLabels: __, ...provenance } = record;
    metadata.push({ ...provenance, sha256: hash(source) });
    examples++;
    units += source.length;
  }
  await rows.end();
  await Bun.write(
    `data/generated/full/${split}-sources.json`,
    JSON.stringify(metadata, null, 2) + "\n",
  );
  summary.splits[split] = {
    examples,
    units,
    sha256: hash(await Bun.file(`data/generated/full/${split}.jsonl`).text()),
  };
}
await Bun.write("data/generated/full/summary.json", JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify(summary.splits, null, 2));
await freezeCorpus();
