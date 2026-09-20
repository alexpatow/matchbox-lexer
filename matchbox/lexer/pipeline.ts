import { definePipeline, recurrentTokenClassifier } from "@matchbox-ai/train";
// Research export only. Zero exact-match acceptance is not a production quality gate.
export default definePipeline({
  prediction: recurrentTokenClassifier({ learningRate: 0.0015 }),
  acceptance: { minAccuracy: 0, maxBytes: 2_000_000 },
});
