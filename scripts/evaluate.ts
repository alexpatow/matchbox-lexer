import { mkdir } from "node:fs/promises";
import { loadArtifact } from "@matchbox-ai/train/project";
import type { Span } from "../matchbox/lexer/labels";
import { createMetrics } from "./metrics";
import { hash } from "./corpus";
import { dataRoot, experiment, verifyDataset } from "./experiment";

import { packageVersions } from "./package-versions";

const packages = await packageVersions();
const reportPath = `benchmarks/results/${experiment}-evaluation.json`;
if (await Bun.file(reportPath).exists()) {
  throw new Error(`Refusing to overwrite ${reportPath}; choose a new EXPERIMENT ID.`);
}
await verifyDataset();
const { parser, inspect } = await loadArtifact("matchbox/lexer");
const byLanguage: Record<
  string,
  { application: ReturnType<typeof createMetrics>; diagnostic: ReturnType<typeof createMetrics> }
> = {};
const application = createMetrics();
const diagnostic = createMetrics();
const rows = (await Bun.file(`${dataRoot}/test.jsonl`).text())
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as { input: string; output: Span[] });
const sources = await Bun.file(`${dataRoot}/test-sources.json`).json();
const examples: unknown[] = [];
try {
  for (const [index, row] of rows.entries()) {
    const result = await parser.parse(row.input);
    const detail = await inspect(row.input);
    if (!("candidate" in detail)) {
      throw new Error("Expected token diagnostic output");
    }
    const raw = detail.candidate as Span[] | null;
    const value = result.value as Span[] | null;
    const language = sources[index].language;
    byLanguage[language] ??= { application: createMetrics(), diagnostic: createMetrics() };
    application.add(row.input, row.output, value);
    diagnostic.add(row.input, row.output, raw);
    byLanguage[language].application.add(row.input, row.output, value);
    byLanguage[language].diagnostic.add(row.input, row.output, raw);
    examples.push({
      source: sources[index],
      status: result.status,
      confidence: result.confidence,
      reason: result.status === "uncertain" ? result.reason : null,
    });
  }
} finally {
  parser.dispose();
}
await mkdir("benchmarks/results", { recursive: true });
const training = await Bun.file(".matchbox/lexer/report.json").json();
const result = {
  experiment,
  matchbox: packages["matchbox-ai"],
  packages,
  createdAt: new Date().toISOString(),
  data: await Bun.file(`${dataRoot}/summary.json`).json(),
  modelSha256: hash(await Bun.file(".matchbox/lexer/model.matchbox").text()),
  training: Object.fromEntries(
    [
      "architecture",
      "encoding",
      "contextRadius",
      "exportParity",
      "backend",
      "seed",
      "bytes",
      "parameters",
      "trainingMs",
      "supervisedTokens",
      "datasetSha256",
      "supervisionSha256",
      "loss",
    ].map((key) => [key, training[key]]),
  ),
  application: application.report(),
  diagnostic: diagnostic.report(),
  byLanguage: Object.fromEntries(
    Object.entries(byLanguage).map(([language, metrics]) => [
      language,
      { application: metrics.application.report(), diagnostic: metrics.diagnostic.report() },
    ]),
  ),
  examples,
};
await Bun.write(
  `benchmarks/results/${result.experiment}-evaluation.json`,
  JSON.stringify(result, null, 2) + "\n",
);
await Bun.write(
  "benchmarks/results/active.json",
  JSON.stringify(
    {
      experiment: result.experiment,
      matchbox: result.matchbox,
      modelBytes: training.bytes,
      parameters: training.parameters,
      trainingMs: training.trainingMs,
      diagnosticAgreement: result.diagnostic.agreement,
      applicationAgreement: result.application.agreement,
      abstentionRate: result.application.abstentionRate,
      testExamples: result.application.snippets,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({ application: result.application, diagnostic: result.diagnostic }, null, 2),
);
