import { mkdir, writeFile } from "node:fs/promises";
import { train } from "@matchbox-ai/train";

const results = [];
for (const length of [16, 500_001]) {
  const root = `data/generated/repro-native-limit/${length}/matchbox/example`;
  await mkdir(`${root}/data`, { recursive: true });
  await mkdir(`${root}/evals`, { recursive: true });
  await writeFile(
    `${root}/parser.ts`,
    'import {defineParser} from "@matchbox-ai/core"; import {z} from "zod"; export default defineParser({input:z.string(),output:z.strictObject({kind:z.enum(["A","B"])})});\n',
  );
  await writeFile(
    `${root}/pipeline.ts`,
    'import {definePipeline,tokenClassifier} from "@matchbox-ai/train"; export default definePipeline({prediction:tokenClassifier(),acceptance:{minAccuracy:0,maxBytes:100000}});\n',
  );
  await writeFile(
    `${root}/recipe.ts`,
    'export default {tokenizer:"characters",readout:"all",labels:["A","B"],annotate(example,tokens){return tokens.map(()=>example.output.kind)}};\n',
  );
  await writeFile(`${root}/decode.ts`, "export default tokens=>({kind:tokens[0].label});\n");
  await writeFile(
    `${root}/data/train.jsonl`,
    [
      JSON.stringify({ input: "a".repeat(length), output: { kind: "A" } }),
      JSON.stringify({ input: "b".repeat(length), output: { kind: "B" } }),
    ].join("\n") + "\n",
  );
  await writeFile(
    `${root}/evals/validation.jsonl`,
    JSON.stringify({ input: "a", output: { kind: "A" } }) + "\n",
  );
  await writeFile(
    `${root}/evals/test.jsonl`,
    JSON.stringify({ input: "b", output: { kind: "B" } }) + "\n",
  );
  const started = performance.now();
  try {
    const result = await train(root);
    results.push({
      supervisedCharacters: length * 2,
      status: "trained",
      wallMs: performance.now() - started,
      trainingMs: result.report?.trainingMs ?? null,
    });
  } catch (error) {
    results.push({
      supervisedCharacters: length * 2,
      status: "failed",
      wallMs: performance.now() - started,
      error: String(error),
    });
  }
}
await writeFile(
  "benchmarks/results/02-native-limit-reproduction.json",
  JSON.stringify({ matchbox: "0.2.0", publicApi: "@matchbox-ai/train.train", results }, null, 2) +
    "\n",
  { flag: "wx" },
);
console.log(JSON.stringify(results, null, 2));
if (results[0].status !== "trained" || results[1].status !== "failed") {
  throw new Error("Unexpected reproduction outcome");
}
