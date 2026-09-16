import { definePipeline, recurrentTokenClassifier } from "@matchbox-ai/train";
// Research export only. Zero exact-match acceptance is not a production quality gate.
export default definePipeline({
  prediction: recurrentTokenClassifier(),
  acceptance: { minAccuracy: 0, maxBytes: 2_000_000 },
});
