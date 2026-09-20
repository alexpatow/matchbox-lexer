import type { Span } from "../../matchbox/lexer/labels";
import { createMetrics } from "../metrics";
import type { LabeledSample } from "./corpus";

export interface Prediction {
  status: string;
  value: Span[] | null;
  uncertainRanges?: { start: number; end: number }[];
}
export function confidentSpans(prediction: Prediction): Span[] | null {
  if (!prediction.value) {
    return null;
  }
  const ranges = prediction.uncertainRanges ?? [];
  return prediction.value.flatMap((span) => {
    const boundaries = new Set([span.start, span.end]);
    for (const range of ranges) {
      if (range.start > span.start && range.start < span.end) {
        boundaries.add(range.start);
      }
      if (range.end > span.start && range.end < span.end) {
        boundaries.add(range.end);
      }
    }
    const sorted = [...boundaries].sort((a, b) => a - b);
    return sorted.slice(0, -1).flatMap((start, index) => {
      const end = sorted[index + 1];
      if (ranges.some((range) => start < range.end && end > range.start)) {
        return [];
      }
      return [{ ...span, start, end }];
    });
  });
}
export function mistakes(row: LabeledSample, prediction: Prediction) {
  const errors: {
    start: number;
    end: number;
    expected: string;
    predicted: string;
    uncertain: boolean;
    text: string;
  }[] = [];
  for (const expected of row.output) {
    const actual = prediction.value ?? [{ start: 0, end: row.input.length, type: "plain" }];
    for (const span of actual) {
      const start = Math.max(expected.start, span.start);
      const end = Math.min(expected.end, span.end);
      if (start >= end || expected.type === span.type || !row.input.slice(start, end).trim()) {
        continue;
      }
      errors.push({
        start,
        end,
        expected: expected.type,
        predicted: span.type,
        uncertain:
          prediction.status === "uncertain" ||
          (prediction.uncertainRanges ?? []).some(
            (range) => start < range.end && end > range.start,
          ),
        text: row.input.slice(start, end),
      });
    }
  }
  return errors;
}
export function createWebsiteMetrics() {
  const candidate = createMetrics();
  const displayed = createMetrics();
  const confident = createMetrics();
  const statuses: Record<string, number> = {};
  return {
    add(row: LabeledSample, prediction: Prediction) {
      statuses[prediction.status] = (statuses[prediction.status] ?? 0) + 1;
      candidate.add(row.input, row.output, prediction.value);
      displayed.add(
        row.input,
        row.output,
        prediction.value ?? [{ type: "plain", start: 0, end: row.input.length }],
      );
      confident.add(row.input, row.output, confidentSpans(prediction));
    },
    report() {
      return {
        statuses,
        candidate: candidate.report(),
        displayed: displayed.report(),
        confident: confident.report(),
      };
    },
  };
}
