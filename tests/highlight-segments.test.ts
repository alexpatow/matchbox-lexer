import { expect, test } from "bun:test";
import { highlightSegments } from "../src/components/highlight-segments";
test("uncertainty marks exact offsets inside merged display spans", () => {
  const spans = [{ type: "plain" as const, start: 0, end: 8 }];
  const ranges = [
    { start: 2, end: 4, confidence: 0.5 },
    { start: 6, end: 8, confidence: 0.7 },
  ];
  expect(highlightSegments(spans, ranges)).toEqual([
    { type: "plain", start: 0, end: 2, uncertain: false },
    { type: "plain", start: 2, end: 4, uncertain: true },
    { type: "plain", start: 4, end: 6, uncertain: false },
    { type: "plain", start: 6, end: 8, uncertain: true },
  ]);
});
test("a range crossing label boundaries preserves each predicted label", () => {
  const spans = [
    { type: "plain" as const, start: 0, end: 3 },
    { type: "string" as const, start: 3, end: 4 },
  ];
  const output = highlightSegments(spans, [{ start: 1, end: 4, confidence: 0.5 }]);
  expect(
    output.filter((span) => span.uncertain).map(({ start, end, type }) => ({ start, end, type })),
  ).toEqual([
    { start: 1, end: 3, type: "plain" },
    { start: 3, end: 4, type: "string" },
  ]);
  expect(output.map((span) => "a🦀b".slice(span.start, span.end)).join("")).toBe("a🦀b");
});
