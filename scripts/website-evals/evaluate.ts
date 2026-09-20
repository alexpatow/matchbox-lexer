import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { hash } from "../corpus";
import { openSite } from "./site";
import type { LabeledSample } from "./corpus";
import { createWebsiteMetrics, mistakes, type Prediction } from "./score";

const [sitePath, corpusPath, output, artifactPath] = process.argv.slice(2);
if (!sitePath || !corpusPath || !output) {
  throw new Error(
    "Usage: bun run eval:website <matchbox-checkout> <corpus-directory> <new-report.json> [candidate.matchbox]",
  );
}
if (await Bun.file(output).exists()) {
  throw new Error("Refusing to overwrite an evaluation report");
}
const content = await Bun.file(resolve(corpusPath, "samples.jsonl")).text();
const manifest = await Bun.file(resolve(corpusPath, "manifest.json")).json();
if (hash(content) !== manifest.corpusSha256) {
  throw new Error("Corpus checksum mismatch");
}
const rows = content
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as LabeledSample);
const { root, server, commit } = await openSite(sitePath);
try {
  await server.listen();
  const origin = server.resolvedUrls!.local[0];
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(new URL("/__lexer-eval", origin).href);
    let model = await Bun.file(
      resolve(root, "apps/playground/src/lexer/model-manifest.json"),
    ).json();
    if (artifactPath) {
      const bytes = await Bun.file(artifactPath).bytes();
      const artifact = JSON.parse(new TextDecoder().decode(bytes));
      if (artifact.kind !== "recurrent-parser") {
        throw new Error("Expected an exported recurrent parser");
      }
      model = { sha256: hash(bytes), bytes: bytes.length, source: "local-candidate" };
      await page.route("**/models/lexer.matchbox", (route) =>
        route.fulfill({ contentType: "application/json", body: Buffer.from(bytes) }),
      );
    }
    const served = await page.evaluate(async () => {
      const response = await fetch("/models/lexer.matchbox");
      if (!response.ok) {
        throw new Error("Model request failed");
      }
      return Array.from(new Uint8Array(await response.arrayBuffer()));
    });
    if (hash(new Uint8Array(served)) !== model.sha256) {
      throw new Error("Served model checksum mismatch");
    }
    const overall = createWebsiteMetrics();
    const unique = createWebsiteMetrics();
    const seen = new Set<string>();
    const byLanguage: Record<string, ReturnType<typeof createWebsiteMetrics>> = {};
    const samples = [];
    for (const row of rows) {
      if (hash(row.input) !== row.sha256) {
        throw new Error(`Sample checksum mismatch: ${row.id}`);
      }
      const prediction = (await page.evaluate(async (input) => {
        const modulePath = "/src/lexer/load-lexer.ts";
        const { loadLexer } = await import(/* @vite-ignore */ modulePath);
        const lexer = await loadLexer();
        return lexer.parse(input, { allowPartial: true, gpu: false });
      }, row.input)) as Prediction;
      overall.add(row, prediction);
      const key = `${row.language}:${row.sha256}`;
      if (!seen.has(key)) {
        unique.add(row, prediction);
        seen.add(key);
      }
      byLanguage[row.language] ??= createWebsiteMetrics();
      byLanguage[row.language].add(row, prediction);
      const single = createWebsiteMetrics();
      single.add(row, prediction);
      const metrics = single.report();
      samples.push({
        id: row.id,
        sha256: row.sha256,
        language: row.language,
        status: prediction.status,
        displayedAgreement: metrics.displayed.agreement,
        confidentCoverage: metrics.confident.characterCoverage,
        confidentAgreement: metrics.confident.acceptedCharacterAgreement,
        mistakes: mistakes(row, prediction),
      });
    }
    const report = {
      corpus: manifest,
      websiteCommit: commit,
      runtimeVersion: (await Bun.file(resolve(root, "packages/core/package.json")).json()).version,
      model,
      browser: browser.version(),
      createdAt: new Date().toISOString(),
      policy:
        "CPU/WASM, allowPartial:true, identical to ModelCode. Shiki is an offline reference, not semantic truth. Metrics exclude whitespace. Displayed scores include uncertain candidates and plain-text fallback; confident scores exclude uncertain ranges. The legacy accepted count means non-null output, not whole-input acceptance. No latency claims from the development server.",
      overall: overall.report(),
      unique: unique.report(),
      byLanguage: Object.fromEntries(
        Object.entries(byLanguage).map(([language, value]) => [language, value.report()]),
      ),
      samples,
    };
    await Bun.write(output, JSON.stringify(report, null, 2) + "\n");
    console.log(
      JSON.stringify(
        {
          samples: rows.length,
          displayedAgreement: report.overall.displayed.agreement,
          confidentCoverage: report.overall.confident.characterCoverage,
          statuses: report.overall.statuses,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
} finally {
  await server.close();
}
