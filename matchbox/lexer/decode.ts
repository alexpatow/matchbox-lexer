import type { SequenceDecoder } from "@matchbox-ai/core/runtime";
import { labels, type Span, type Label } from "./labels.ts";
export default ((tokens, input) => {
  const spans: Span[] = [];
  let end = 0;
  for (const token of tokens) {
    if (token.start !== end || token.end <= token.start || !labels.includes(token.label as Label)) {
      return null;
    }
    const previous = spans.at(-1);
    if (previous?.type === token.label) {
      previous.end = token.end;
    } else {
      spans.push({ type: token.label as Label, start: token.start, end: token.end });
    }
    end = token.end;
  }
  if (end !== input.length) {
    return null;
  }
  return spans;
}) satisfies SequenceDecoder;
