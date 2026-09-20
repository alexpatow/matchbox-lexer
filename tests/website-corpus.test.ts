import { expect, test } from "bun:test";
import { hash } from "../scripts/corpus";
import { labels } from "../matchbox/lexer/labels";
import type { LabeledSample } from "../scripts/website-evals/corpus";
import manifest from "../evals/website-v1/manifest.json";

test("frozen website corpus has intact inputs and complete UTF-16 reference spans", async () => {
  const content = await Bun.file("evals/website-v1/samples.jsonl").text();
  expect(hash(content)).toBe(manifest.corpusSha256);
  const rows = content
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as LabeledSample);
  expect(rows.length).toBe(manifest.samples);
  expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
  for (const row of rows) {
    expect(hash(row.input)).toBe(row.sha256);
    const boundaries = new Set([0]);
    let offset = 0;
    for (const character of row.input) {
      offset += character.length;
      boundaries.add(offset);
    }
    let end = 0;
    for (const span of row.output) {
      expect(labels).toContain(span.type);
      expect(span.start).toBe(end);
      expect(span.end).toBeGreaterThan(span.start);
      expect(boundaries.has(span.end)).toBe(true);
      end = span.end;
    }
    expect(end).toBe(row.input.length);
  }
});
