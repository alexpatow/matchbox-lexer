import { mkdir } from "node:fs/promises";
import corpus from "../data/corpus.json";
import { labels, type Span } from "../matchbox/lexer/labels";
import { sourcePaths, readSource, hash } from "./corpus";
import { createTeacher } from "./teacher/label-source";

await mkdir("data/generated/pilot", { recursive: true });
const teacher = await createTeacher();
const splits = ["train", "validation", "test"] as const;
const seen = new Set<string>();
const repositories = new Set<string>();
const summary = {
  dataset: hash(JSON.stringify(corpus)),
  teacher: "shiki@4.4.3",
  sources: [] as unknown[],
  counts: {} as Record<string, unknown>,
};
try {
  for (const split of splits) {
    const rows: { input: string; output: Span[] }[] = [];
    const metadata: unknown[] = [];
    const counts = Object.fromEntries(labels.map((label) => [label, 0]));
    for (const source of corpus.sources.filter((source) => source.split === split)) {
      if (repositories.has(source.repo)) {
        throw new Error(`Repository appears in multiple splits: ${source.repo}`);
      }
      repositories.add(source.repo);
      let selected = 0;
      for (const path of await sourcePaths(source)) {
        if (selected >= corpus.filesPerRepository[split]) {
          break;
        }
        const full = await readSource(source, path);
        // Label the full file before slicing, so preceding lexical state is preserved.
        const fullSpans = teacher.label(full, source.language);
        const desired =
          parseInt(hash(path).slice(0, 8), 16) % Math.max(1, full.length - corpus.maxUnits);
        const newline = full.indexOf("\n", desired);
        const start = newline >= 0 && newline < full.length - 128 ? newline + 1 : 0;
        let end = Math.min(full.length, start + corpus.maxUnits);
        if (end < full.length && /[\uD800-\uDBFF]/.test(full[end - 1])) {
          end--;
        }
        const input = full.slice(start, end);
        // Exact and whitespace-normalized duplicates cannot cross splits.
        const identity = hash(input.replace(/\s+/g, " ").trim());
        if (seen.has(identity) || input.trim().length < 64) {
          continue;
        }
        seen.add(identity);
        const output = fullSpans
          .filter((span) => span.end > start && span.start < end)
          .map((span) => ({
            type: span.type,
            start: Math.max(start, span.start) - start,
            end: Math.min(end, span.end) - start,
          }));
        for (const span of output) {
          counts[span.type] += span.end - span.start;
        }
        rows.push({ input, output });
        metadata.push({ ...source, path, start, end, sha256: hash(input), fullSha256: hash(full) });
        selected++;
      }
      if (!selected) {
        throw new Error(`No eligible files: ${source.repo}`);
      }
      summary.sources.push({ ...source, selected });
      console.log(`${split}: ${source.repo}: ${selected} snippets`);
    }
    if (split === "train" && labels.some((label) => counts[label] === 0)) {
      throw new Error(`Training labels missing: ${JSON.stringify(counts)}`);
    }
    await Bun.write(
      `data/generated/pilot/${split}.jsonl`,
      rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
    );
    await Bun.write(
      `data/generated/pilot/${split}-sources.json`,
      JSON.stringify(metadata, null, 2) + "\n",
    );
    summary.counts[split] = {
      examples: rows.length,
      units: rows.reduce((sum, row) => sum + row.input.length, 0),
      labels: counts,
      sha256: hash(rows.map((row) => JSON.stringify(row)).join("\n") + "\n"),
    };
  }
  await Bun.write("data/generated/pilot/summary.json", JSON.stringify(summary, null, 2) + "\n");
} finally {
  teacher.dispose();
}
