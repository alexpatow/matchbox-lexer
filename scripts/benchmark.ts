import { chromium } from "@playwright/test";
import { preview } from "vite";
import { readdir } from "node:fs/promises";
import { gzipSync, brotliCompressSync } from "node:zlib";
import type { runBenchmark } from "../src/browser-benchmark";
import type { Span } from "../matchbox/lexer/labels";
import { createMetrics } from "./metrics";
import { hash } from "./corpus";
import { dataRoot, experiment, verifyDataset } from "./experiment";

import { packageVersions } from "./package-versions";

const packages = await packageVersions();
const reportPath = `benchmarks/results/${experiment}-browser.json`;
if (await Bun.file(reportPath).exists()) {
  throw new Error(`Refusing to overwrite ${reportPath}; choose a new EXPERIMENT ID.`);
}
await verifyDataset();
const server = await preview({ preview: { host: "127.0.0.1", port: 4317, strictPort: true } });
const browser = await chromium.launch({ headless: process.env.HEADED !== "1" });
const rows = (await Bun.file(`${dataRoot}/test.jsonl`).text())
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as { input: string; output: Span[] });
const sources = await Bun.file(`${dataRoot}/test-sources.json`).json();
const inputs = rows.map((row, index) => ({ input: row.input, language: sources[index].language }));
const results: unknown[] = [];
try {
  for (const engine of [
    "matchbox",
    "matchbox-partial",
    "matchbox-gpu",
    "gpu-lexer",
    "shiki",
  ] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const downloaded: Promise<{ name: string; bytes: number; gzip: number; sha256: string }>[] = [];
    page.on("response", (response) => {
      const name = new URL(response.url()).pathname;
      if (!/\.(js|wasm)$/.test(name)) {
        return;
      }
      downloaded.push(
        response.body().then((bytes) => ({
          name,
          bytes: bytes.length,
          gzip: gzipSync(bytes).length,
          sha256: hash(bytes),
        })),
      );
    });
    await page.goto("http://127.0.0.1:4317/benchmark.html");
    await page.waitForFunction(() => "runBenchmark" in window);
    try {
      const result = await page.evaluate(
        ({ engine, inputs }) =>
          (window as unknown as { runBenchmark: typeof runBenchmark }).runBenchmark(engine, inputs),
        { engine, inputs },
      );
      const metrics = createMetrics();
      result.outputs.forEach((output, index) =>
        metrics.add(rows[index].input, rows[index].output, output.value),
      );
      const fetchedAssets = await Promise.all(downloaded);
      results.push({
        ...result,
        outputs: undefined,
        quality: metrics.report(),
        fetchedAssets,
        downloadGzipBytes: fetchedAssets.reduce((sum, asset) => sum + asset.gzip, 0),
      });
      console.log(
        `${engine}: ${result.initializationMs.toFixed(1)}ms initialization, ${(metrics.report().agreement ?? 0).toFixed(3)} agreement`,
      );
    } catch (error) {
      // A missing WebGPU adapter is a result, not a fabricated CPU comparison.
      results.push({ engine, status: "unavailable", reason: String(error) });
      console.log(`${engine}: ${String(error).slice(0, 200)}`);
      const gpuEngine = engine === "gpu-lexer" || engine === "matchbox-gpu";
      const unavailable =
        /WebGPU.*(not supported|unavailable)|no.*GPU.*adapter|failed to.*adapter/i.test(
          String(error),
        );
      if (!gpuEngine || !unavailable) {
        throw error;
      }
    } finally {
      await context.close();
    }
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:4317");
  await page.getByText(/Abstained ·|Accepted ·|Partial ·/).waitFor();
  await page.getByRole("button", { name: "Run reference" }).click();
  await page.getByText("Reference only. Never used as a fallback.", { exact: true }).waitFor();
  if (process.env.HEADED === "1") {
    await page.getByLabel("Runtime", { exact: true }).selectOption("gpu");
    await page.getByText("Running…", { exact: true }).waitFor();
    await page.getByText(/Abstained ·|Accepted ·|Partial ·/).waitFor();
  }
  await page.screenshot({ path: "data/generated/workbench.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow || errors.length) {
    throw new Error(`Browser smoke failed: ${JSON.stringify({ overflow, errors })}`);
  }
  const assets = [];
  for (const name of await readdir("dist/assets")) {
    const bytes = await Bun.file(`dist/assets/${name}`).arrayBuffer();
    assets.push({
      name,
      sha256: hash(new Uint8Array(bytes)),
      bytes: bytes.byteLength,
      gzip: gzipSync(bytes).byteLength,
      brotli: brotliCompressSync(bytes).byteLength,
    });
  }
  const report = {
    experiment,
    packages,
    createdAt: new Date().toISOString(),
    browser: browser.version(),
    headless: process.env.HEADED !== "1",
    platform: process.platform,
    arch: process.arch,
    modelSha256: hash(await Bun.file(".matchbox/lexer/model.matchbox").text()),
    testSha256: hash(await Bun.file(`${dataRoot}/test.jsonl`).text()),
    results,
    assets,
    smoke: { desktop: true, mobile: true, consoleErrors: errors },
  };
  await Bun.write(
    `benchmarks/results/${report.experiment}-browser.json`,
    JSON.stringify(report, null, 2) + "\n",
  );
} catch (error) {
  await Bun.write(
    reportPath,
    JSON.stringify(
      { experiment, packages, status: "failed", reason: String(error), results },
      null,
      2,
    ) + "\n",
  );
  throw error;
} finally {
  await browser.close();
  await new Promise<void>((resolve, reject) =>
    server.httpServer.close((error) => (error ? reject(error) : resolve())),
  );
}
