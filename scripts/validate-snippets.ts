import { createParser } from "@matchbox-ai/core/runtime";
import task from "../matchbox/lexer/parser";
import decode from "../matchbox/lexer/decode";
import { hash } from "./corpus";
import { createWebsiteMetrics } from "./website-evals/score";
import type { LabeledSample } from "./website-evals/corpus";

const [artifactPath, output] = process.argv.slice(2);
if (!artifactPath || !output) {
  throw new Error("Usage: bun scripts/validate-snippets.ts <model.matchbox> <new-report.json>");
}
if (await Bun.file(output).exists()) {
  throw new Error("Refusing to overwrite report");
}
const root = "data/generated/full-snippets-v1";
const content = await Bun.file(`${root}/validation.jsonl`).text();
const lock = await Bun.file("data/full-snippets-v1-lock.json").json();
if (hash(content) !== lock.files.validation) {
  throw new Error("Validation checksum mismatch");
}
const rows = content
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line));
const sources = await Bun.file(`${root}/validation-sources.json`).json();
const artifact = await Bun.file(artifactPath).text();
const model: unknown = JSON.parse(artifact);
if (
  !model ||
  typeof model !== "object" ||
  !("kind" in model) ||
  model.kind !== "recurrent-parser"
) {
  throw new Error("Expected an exported recurrent parser");
}
const parser = createParser({ ...model, kind: "recurrent-parser" as const }, task, decode);
const groups: Record<string, ReturnType<typeof createWebsiteMetrics>> = {};
try {
  for (const [index, row] of rows.entries()) {
    const source = sources[index];
    const sample: LabeledSample = {
      ...row,
      id: `validation:${index}`,
      sha256: hash(row.input),
      language: source.language,
    };
    const result = await parser.parse(row.input, { allowPartial: true });
    const group = source.extraction ? "snippets" : "documents";
    for (const key of [group, `${group}/${source.language}`]) {
      groups[key] ??= createWebsiteMetrics();
      groups[key].add(sample, result);
    }
  }
} finally {
  parser.dispose();
}
const report = {
  modelSha256: hash(artifact),
  validationSha256: hash(content),
  policy:
    "Frozen validation documents and their independently relabeled snippets. CPU/WASM partial parsing. No test or website samples.",
  groups: Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, value.report()])),
};
await Bun.write(output, JSON.stringify(report, null, 2) + "\n");
for (const key of ["documents", "snippets", "snippets/shellscript", "snippets/typescript"]) {
  console.log(key, report.groups[key]?.displayed.agreement);
}
