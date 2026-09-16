import { textParts, textFeatures, spanLabels, type RecurrentRecipe } from "@matchbox-ai/train";
import { labels } from "./labels.ts";
export default {
  tokenizer: textParts(),
  features: textFeatures(),
  labels,
  annotate: spanLabels({ whitespace: "context" }),
} satisfies RecurrentRecipe;
