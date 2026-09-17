import type { Span } from "../matchbox/lexer/labels";
type Input = { input: string; language: string };
type Engine = "matchbox" | "matchbox-partial" | "matchbox-gpu" | "gpu-lexer" | "shiki";
export async function runBenchmark(engine: Engine, inputs: Input[]) {
  performance.clearResourceTimings();
  const started = performance.now();
  let dispose = () => {};
  let parse: (row: Input) => Promise<{ value: Span[] | null; status: string }>;
  if (engine === "matchbox" || engine === "matchbox-partial" || engine === "matchbox-gpu") {
    const { default: lexer } = await import("../.matchbox/lexer/model");
    dispose = () => lexer.dispose();
    parse = async (row) => {
      if (engine === "matchbox") {
        return lexer.parse(row.input);
      }
      return lexer.parse(row.input, { allowPartial: true, gpu: engine === "matchbox-gpu" });
    };
  } else if (engine === "gpu-lexer") {
    const lexer = await import("gpu-lexer");
    parse = async (row) => ({ value: await lexer.parse(row.input), status: "ok" });
  } else {
    const { createTeacher } = await import("../scripts/teacher/label-source");
    const teacher = await createTeacher([...new Set(inputs.map((row) => row.language))]);
    dispose = () => teacher.dispose();
    parse = async (row) => ({ value: teacher.label(row.input, row.language), status: "ok" });
  }
  await parse({ input: "const value = 1;", language: "typescript" });
  const initializationMs = performance.now() - started;
  const resources = performance.getEntriesByType("resource").map((entry) => ({
    url: entry.name,
    bytes: (entry as PerformanceResourceTiming).encodedBodySize,
  }));
  try {
    const outputs = [];
    const fullTimings: number[] = [];
    const statuses: Record<string, number> = {};
    for (const row of inputs.slice(0, 20)) {
      await parse(row);
    }
    for (const row of inputs) {
      const tick = performance.now();
      const result = await parse(row);
      fullTimings.push(performance.now() - tick);
      statuses[result.status] = (statuses[result.status] ?? 0) + 1;
      outputs.push({ value: result.value, status: result.status });
    }
    fullTimings.sort((a, b) => a - b);
    const timings = [];
    for (const units of [128, 512, 1024]) {
      const row = { ...inputs[0], input: inputs[0].input.slice(0, units) };
      for (let i = 0; i < 5; i++) {
        await parse(row);
      }
      const samples = [];
      const statuses: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const before = performance.now();
        const result = await parse(row);
        samples.push(performance.now() - before);
        statuses[result.status] = (statuses[result.status] ?? 0) + 1;
      }
      samples.sort((a, b) => a - b);
      timings.push({
        units: row.input.length,
        p50: samples[14],
        p95: samples[28],
        samples,
        statuses,
      });
    }
    return {
      engine,
      initializationMs,
      fullDocuments: {
        samples: inputs.length,
        p50: fullTimings[Math.floor((inputs.length - 1) * 0.5)],
        p95: fullTimings[Math.floor((inputs.length - 1) * 0.95)],
        statuses,
      },
      resources,
      outputs,
      timings,
      userAgent: navigator.userAgent,
    };
  } finally {
    dispose();
  }
}
Object.assign(window, { runBenchmark });
