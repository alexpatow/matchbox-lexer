import { mkdir } from "node:fs/promises";
import { platform, arch, cpus, totalmem } from "node:os";
import { performance } from "node:perf_hooks";

import { packageVersions } from "./package-versions";

const packages = await packageVersions();
const experiment = process.env.EXPERIMENT ?? "02-full-clean";
const corpus = process.env.CORPUS ?? "full-clean-v1";
if (!/^[a-z0-9-]+$/.test(experiment)) {
  throw new Error("Use a lowercase experiment ID with letters, numbers and hyphens.");
}
await mkdir("benchmarks/results", { recursive: true });
await mkdir("data/generated/logs", { recursive: true });
const log = `data/generated/logs/${experiment}-train.log`;
const timing = `data/generated/logs/${experiment}-resources.log`;
const reportPath = `benchmarks/results/${experiment}-training.json`;
for (const path of [log, timing, reportPath]) {
  if (await Bun.file(path).exists()) {
    throw new Error(`Refusing to overwrite ${path}; choose a new EXPERIMENT ID.`);
  }
}
const started = performance.now();
const child = Bun.spawn(
  [
    "/usr/bin/time",
    "-l",
    "node",
    "--max-old-space-size=3072",
    "node_modules/matchbox-ai/dist/cli.js",
    "train",
    "lexer",
    "--json",
  ],
  {
    env: { ...process.env, CORPUS: corpus },
    stdout: Bun.file(log),
    stderr: Bun.file(timing),
  },
);
await Bun.write(
  `data/generated/logs/${experiment}-running.json`,
  JSON.stringify(
    {
      experiment,
      corpus,
      packages,
      pid: child.pid,
      startedAt: new Date().toISOString(),
      command:
        "/usr/bin/time -l node --max-old-space-size=3072 node_modules/matchbox-ai/dist/cli.js train lexer --json",
      log,
      timing,
    },
    null,
    2,
  ) + "\n",
);
const exitCode = await child.exited;
const resources = await Bun.file(timing).text();
const peak = resources.match(/(\d+)\s+maximum resident set size/);
const result = {
  experiment,
  corpus,
  matchbox: packages["matchbox-ai"],
  packages,
  finishedAt: new Date().toISOString(),
  exitCode,
  wallMs: performance.now() - started,
  peakResidentBytes: peak ? Number(peak[1]) : null,
  heapLimitMiB: 3072,
  machine: { platform: platform(), arch: arch(), cpu: cpus()[0].model, memoryBytes: totalmem() },
  log,
  timing,
};
await Bun.write(reportPath, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
if (exitCode !== 0) {
  process.exitCode = exitCode;
}
