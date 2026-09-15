import type { SequenceRecipe } from "@matchbox-ai/train";
import { labels, type Span } from "./labels.ts";
export default {
  tokenizer: "characters",
  readout: "all",
  labels,
  annotate(example, tokens) {
    const spans = example.output as Span[];
    let position = 0;
    return tokens.map((token) => {
      while (position < spans.length && spans[position].end <= token.start) {
        position++;
      }
      const span = spans[position];
      if (!span || span.start > token.start || span.end < token.end) {
        throw new Error(`Uncovered character at ${token.start}`);
      }
      return span.type;
    });
  },
} satisfies SequenceRecipe;
