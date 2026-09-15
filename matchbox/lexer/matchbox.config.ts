import type { TrainingConfig } from "@matchbox-ai/train";
const corpus = process.env.CORPUS ?? "full-clean-v1";
if (!["full", "pilot", "full-clean-v1"].includes(corpus)) {
  throw new Error("CORPUS must be full, full-clean-v1 or pilot");
}
export default {
  train: `../../data/generated/${corpus}/train.jsonl`,
  validation: `../../data/generated/${corpus}/validation.jsonl`,
  eval: `../../data/generated/${corpus}/test.jsonl`,
} satisfies TrainingConfig;
