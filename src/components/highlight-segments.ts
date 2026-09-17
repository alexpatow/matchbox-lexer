import type { Span } from "../../matchbox/lexer/labels";
import type { UncertainRange } from "@matchbox-ai/core/runtime";
export function highlightSegments(spans: Span[], ranges: UncertainRange[]) {
  return spans.flatMap((span) => {
    const overlaps = ranges.filter((range) => range.start < span.end && range.end > span.start);
    const boundaries = [
      ...new Set([
        span.start,
        span.end,
        ...overlaps.flatMap((range) => [
          Math.max(span.start, range.start),
          Math.min(span.end, range.end),
        ]),
      ]),
    ].sort((a, b) => a - b);
    return boundaries.slice(0, -1).map((start, index) => ({
      ...span,
      start,
      end: boundaries[index + 1],
      uncertain: overlaps.some((range) => range.start <= start && range.end > start),
    }));
  });
}
