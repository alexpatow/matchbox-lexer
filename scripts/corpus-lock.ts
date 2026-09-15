import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
export async function fileHash(path: string) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(path)) {
    digest.update(chunk);
  }
  return digest.digest("hex");
}
export async function freezeCorpus() {
  const files: Record<string, string> = {};
  for (const split of ["train", "validation", "test"]) {
    files[split] = await fileHash(`data/generated/full/${split}.jsonl`);
  }
  const lock = { upstream: "1e514fd681e31d6b19296f985fb01d8fdc0ae74f", shiki: "4.4.3", files };
  const path = "data/full-lock.json";
  if (await Bun.file(path).exists()) {
    const existing = await Bun.file(path).json();
    if (JSON.stringify(existing) !== JSON.stringify(lock)) {
      throw new Error(
        "Full corpus drifted from data/full-lock.json. Preserve the existing experiment and investigate; do not overwrite the lock.",
      );
    }
  } else {
    await Bun.write(path, JSON.stringify(lock, null, 2) + "\n");
  }
}
