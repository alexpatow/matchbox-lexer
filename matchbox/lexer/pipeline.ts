import { definePipeline, tokenClassifier } from "@matchbox-ai/train";
// Research export only. Zero exact-match acceptance is not a production quality gate.
export default definePipeline({
  prediction: tokenClassifier(),
  acceptance: { minAccuracy: 0, maxBytes: 2_000_000 },
});
