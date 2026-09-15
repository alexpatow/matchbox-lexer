import type { TrainingConfig } from "@matchbox-ai/train";
const corpus = process.env.CORPUS ?? "full";
if (corpus !== "full" && corpus !== "pilot") {
  throw new Error("CORPUS must be full or pilot");
}
export default {
  train: `../../data/generated/${corpus}/train.jsonl`,
  validation: `../../data/generated/${corpus}/validation.jsonl`,
  eval: `../../data/generated/${corpus}/test.jsonl`,
} satisfies TrainingConfig;
