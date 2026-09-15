import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { StringDecoder } from "node:string_decoder";
import { hash } from "./corpus";
import { fileHash } from "./corpus-lock";

const original = "data/generated/full";
const destination = "data/generated/full-clean-v1";
const lock = await Bun.file("data/full-lock.json").json();
for (const split of ["train", "validation", "test"]) {
  if ((await fileHash(`${original}/${split}.jsonl`)) !== lock.files[split]) {
    throw new Error(`Original ${split} hash mismatch`);
  }
}
async function* readRows(path: string) {
  let pending = "";
  const decoder = new StringDecoder("utf8");
  for await (const chunk of createReadStream(path)) {
    pending += decoder.write(chunk);
    let end = pending.indexOf("\n");
    while (end >= 0) {
      const line = pending.slice(0, end);
      pending = pending.slice(end + 1);
      if (line) {
        yield { line, row: JSON.parse(line) };
      }
      end = pending.indexOf("\n");
    }
  }
  pending += decoder.end();
  if (pending.trim()) {
    yield { line: pending, row: JSON.parse(pending) };
  }
}
const heldOut = new Set<string>();
for (const split of ["validation", "test"]) {
  for await (const { row } of readRows(`${original}/${split}.jsonl`)) {
    heldOut.add(hash(row.input.trim().toLowerCase()));
  }
}
await mkdir(destination, { recursive: true });
const metadata = await Bun.file(`${original}/train-sources.json`).json();
const kept: unknown[] = [];
const removed: unknown[] = [];
const writer = Bun.file(`${destination}/train.jsonl`).writer();
let index = 0;
let units = 0;
for await (const { line, row } of readRows(`${original}/train.jsonl`)) {
  const key = hash(row.input.trim().toLowerCase());
  if (heldOut.has(key)) {
    removed.push({ index, normalizedSha256: key, source: metadata[index] });
  } else {
    writer.write(line + "\n");
    kept.push(metadata[index]);
    units += row.input.length;
  }
  index++;
}
await writer.end();
await Bun.write(`${destination}/train-sources.json`, JSON.stringify(kept, null, 2) + "\n");
for (const split of ["validation", "test"]) {
  for (const suffix of [".jsonl", "-sources.json"]) {
    await copyFile(`${original}/${split}${suffix}`, `${destination}/${split}${suffix}`);
  }
}
const summary = await Bun.file(`${original}/summary.json`).json();
summary.dataset = "full-clean-v1";
summary.parentLock = "data/full-lock.json";
summary.policy =
  "Preserve validation and test byte-for-byte; remove train rows overlapping held-out input.trim().toLowerCase(). No size-based sampling.";
summary.splits.train = {
  examples: kept.length,
  units,
  sha256: await fileHash(`${destination}/train.jsonl`),
};
const identity = {
  upstream: lock.upstream,
  shiki: lock.shiki,
  policy: summary.policy,
  parent: lock.files,
  files: {
    train: summary.splits.train.sha256,
    validation: lock.files.validation,
    test: lock.files.test,
  },
};
const lockPath = "data/full-clean-v1-lock.json";
if (await Bun.file(lockPath).exists()) {
  if (JSON.stringify(await Bun.file(lockPath).json()) !== JSON.stringify(identity)) {
    throw new Error("Clean corpus drifted; refusing a new identity");
  }
} else {
  await writeFile(lockPath, JSON.stringify(identity, null, 2) + "\n", { flag: "wx" });
}
await Bun.write(`${destination}/summary.json`, JSON.stringify(summary, null, 2) + "\n");
await Bun.write(
  "benchmarks/results/02-full-clean-preparation.json",
  JSON.stringify(
    {
      dataset: summary.dataset,
      policy: summary.policy,
      removedCount: removed.length,
      remaining: kept.length,
      splits: summary.splits,
      removed,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({ removed: removed.length, remaining: kept.length, units, identity }, null, 2),
);
