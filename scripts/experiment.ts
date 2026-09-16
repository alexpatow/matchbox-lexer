import { hash } from "./corpus";
export const experiment = process.env.EXPERIMENT ?? "04-full-clean";
export const corpus = process.env.CORPUS ?? "full-clean-v1";
export const dataRoot = `data/generated/${corpus}`;
export async function verifyDataset() {
  const report = await Bun.file(".matchbox/lexer/report.json").json();
  for (const split of ["train", "validation", "test"]) {
    const sha256 = hash(await Bun.file(`${dataRoot}/${split}.jsonl`).text());
    if (!report.datasetSha256.some((entry: { sha256: string }) => entry.sha256 === sha256)) {
      throw new Error(`Artifact does not match ${corpus}/${split}. Train this corpus first.`);
    }
  }
}
