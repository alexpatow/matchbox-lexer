import { useEffect, useState } from "react";
import type { UncertainRange } from "@matchbox-ai/core/runtime";
import type { Span } from "../../matchbox/lexer/labels";
export function useLexer(input: string, gpu: boolean) {
  const [result, setResult] = useState<{
    input: string;
    gpu: boolean;
    spans: Span[] | null;
    ranges: UncertainRange[];
    status: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const { default: lexer } = await import("../../.matchbox/lexer/model");
        const started = performance.now();
        const prediction = await lexer.parse(input, { gpu, allowPartial: true });
        const elapsed = performance.now() - started;
        if (!active) {
          return;
        }
        const ranges = prediction.status === "partial" ? prediction.uncertainRanges : [];
        let status = `Accepted · ${elapsed.toFixed(2)} ms`;
        if (prediction.status === "partial") {
          status = `Partial · ${elapsed.toFixed(2)} ms · ${ranges.length} uncertain ranges`;
        }
        if (prediction.status === "uncertain") {
          status = `Abstained · ${elapsed.toFixed(2)} ms · ${prediction.reason}`;
        }
        setResult({ input, gpu, spans: prediction.value, ranges, status });
      } catch (error) {
        if (active) {
          setResult({ input, gpu, spans: null, ranges: [], status: String(error) });
        }
      }
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [input, gpu]);
  if (result?.input === input && result.gpu === gpu) {
    return result;
  }
  return { spans: null, ranges: [], status: "Running…" };
}
