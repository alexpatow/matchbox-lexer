import { expect, test } from "bun:test";
import { tokenize } from "@matchbox-ai/train";
import decode from "../matchbox/lexer/decode";
import { createMetrics } from "../scripts/metrics";
test("UTF-16 spans preserve whitespace and surrogate pairs", () => {
  const input = "Hi 🦀\r\n";
  const tokens = tokenize(input, "characters").map((token) => ({
    ...token,
    label: "plain",
    confidence: 1,
  }));
  const output = [{ type: "plain" as const, start: 0, end: input.length }];
  expect(decode(tokens, input)).toEqual(output);
  expect(decode(tokens.slice(1), input)).toBeNull();
});
test("abstentions remain errors in overall agreement", () => {
  const metrics = createMetrics();
  const spans = [{ type: "keyword" as const, start: 0, end: 3 }];
  metrics.add("let", spans, spans);
  metrics.add("let", spans, null);
  expect(metrics.report().agreement).toBe(0.5);
  expect(metrics.report().acceptedCharacterAgreement).toBe(1);
  expect(metrics.report().styledMacroF1).toBeCloseTo(2 / 3);
});
