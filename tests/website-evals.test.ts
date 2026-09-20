import { describe, expect, test } from "bun:test";
import { markdownSamples, sample, type LabeledSample } from "../scripts/website-evals/corpus";
import { confidentSpans, createWebsiteMetrics, mistakes } from "../scripts/website-evals/score";

describe("website evaluation corpus", () => {
  test("matches fenced rendering, including nested blocks and trailing newlines", () => {
    const rows = markdownSamples(
      "docs/test.md",
      "```ts\nconst x = 1;\n```\n\n> ```sh\n> bun run dev\n> ```\n\n```text\nfolder/\n```\n\n```\nplain\n```",
    );
    expect(rows.map(({ id, input, language }) => ({ id, input, language }))).toEqual([
      { id: "docs/test.md:1", input: "const x = 1;\n", language: "typescript" },
      { id: "docs/test.md:5", input: "bun run dev\n", language: "shellscript" },
    ]);
    expect(() => sample("unknown", "new-language", "code")).toThrow("No teacher grammar");
  });
  test("JSONL is preserved, not rewritten into a JSON array", () => {
    const input = '{"n":1}\n{"n":2}\n';
    expect(sample("rows", "jsonl", input)).toMatchObject({ input, language: "json" });
  });
});

const row: LabeledSample = {
  ...sample("fixture", "ts", "x + 1"),
  output: [
    { type: "plain", start: 0, end: 2 },
    { type: "operator", start: 2, end: 4 },
    { type: "number", start: 4, end: 5 },
  ],
};
test("confidence excludes uncertain ranges even when candidate labels are correct", () => {
  const prediction = {
    status: "partial",
    value: row.output,
    uncertainRanges: [{ start: 4, end: 5 }],
  };
  const metrics = createWebsiteMetrics();
  metrics.add(row, prediction);
  const report = metrics.report();
  expect(report.displayed.agreement).toBe(1);
  expect(report.confident.characterCoverage).toBeCloseTo(2 / 3);
  expect(report.confident.acceptedCharacterAgreement).toBe(1);
  expect(report.statuses).toEqual({ partial: 1 });
});
test("fully uncertain output is rendered plain but has no confident coverage", () => {
  const prediction = { status: "uncertain", value: null };
  const metrics = createWebsiteMetrics();
  metrics.add(row, prediction);
  expect(metrics.report().displayed.agreement).toBeCloseTo(1 / 3);
  expect(metrics.report().confident.characterCoverage).toBe(0);
  expect(mistakes(row, prediction).map(({ expected }) => expected)).toEqual(["operator", "number"]);
});
test("confidence splits spans at range boundaries and preserves UTF-16 offsets", () => {
  expect(
    confidentSpans({
      status: "partial",
      value: [{ type: "string", start: 0, end: 6 }],
      uncertainRanges: [
        { start: 1, end: 3 },
        { start: 4, end: 5 },
      ],
    }),
  ).toEqual([
    { type: "string", start: 0, end: 1 },
    { type: "string", start: 3, end: 4 },
    { type: "string", start: 5, end: 6 },
  ]);
});
