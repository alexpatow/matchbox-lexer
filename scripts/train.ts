import { mkdir } from "node:fs/promises";
import { platform, arch, cpus, totalmem } from "node:os";
import { performance } from "node:perf_hooks";

const experiment = process.env.EXPERIMENT ?? "01-full";
const corpus = process.env.CORPUS ?? "full";
await mkdir("benchmarks/results", { recursive: true });
await mkdir("data/generated/logs", { recursive: true });
const log = `data/generated/logs/${experiment}-train.log`;
const timing = `data/generated/logs/${experiment}-resources.log`;
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
const exitCode = await child.exited;
const resources = await Bun.file(timing).text();
const peak = resources.match(/(\d+)\s+maximum resident set size/);
const result = {
  experiment,
  corpus,
  matchbox: "0.2.0",
  finishedAt: new Date().toISOString(),
  exitCode,
  wallMs: performance.now() - started,
  peakResidentBytes: peak ? Number(peak[1]) : null,
  heapLimitMiB: 3072,
  machine: { platform: platform(), arch: arch(), cpu: cpus()[0].model, memoryBytes: totalmem() },
  log,
  timing,
};
await Bun.write(
  `benchmarks/results/${experiment}-training.json`,
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
if (exitCode !== 0) {
  process.exitCode = exitCode;
}
