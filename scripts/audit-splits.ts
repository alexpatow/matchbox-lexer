import { createReadStream } from "node:fs";
import { StringDecoder } from "node:string_decoder";
import { hash } from "./corpus";

async function* rows(path: string) {
  const decoder = new StringDecoder("utf8");
  let pending = "";
  for await (const chunk of createReadStream(path)) {
    pending += decoder.write(chunk);
    let end = pending.indexOf("\n");
    while (end >= 0) {
      const line = pending.slice(0, end);
      pending = pending.slice(end + 1);
      if (line) {
        yield JSON.parse(line);
      }
      end = pending.indexOf("\n");
    }
  }
  pending += decoder.end();
  if (pending.trim()) {
    yield JSON.parse(pending);
  }
}

const corpus = process.env.CORPUS ?? "full-clean-v1";
const experiment = process.env.EXPERIMENT ?? "02-full-clean";
const owners = new Map<string, { split: string; index: number; source: unknown }[]>();
for (const split of ["train", "validation", "test"]) {
  const sources = await Bun.file(`data/generated/${corpus}/${split}-sources.json`).json();
  let index = 0;
  for await (const row of rows(`data/generated/${corpus}/${split}.jsonl`)) {
    const key = hash(row.input.trim().toLowerCase());
    const values = owners.get(key) ?? [];
    values.push({ split, index, source: sources[index] });
    owners.set(key, values);
    index++;
  }
}
const overlaps = [...owners]
  .filter(([, values]) => new Set(values.map((value) => value.split)).size > 1)
  .map(([sha256, occurrences]) => ({ sha256, occurrences }));
const affected = Object.fromEntries(
  ["train", "validation", "test"].map((split) => [
    split,
    overlaps.flatMap((row) => row.occurrences).filter((row) => row.split === split).length,
  ]),
);
const result = {
  normalization: "input.trim().toLowerCase(), as enforced by Matchbox 0.2.0",
  groups: overlaps.length,
  affected,
  overlaps,
};
await Bun.write(
  `benchmarks/results/${experiment}-overlaps.json`,
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify({ groups: result.groups, affected }, null, 2));
