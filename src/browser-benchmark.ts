import type { Span } from "../matchbox/lexer/labels";
type Input = { input: string; language: string };
type Engine = "matchbox" | "gpu-lexer" | "shiki";
export async function runBenchmark(engine: Engine, inputs: Input[]) {
  performance.clearResourceTimings();
  const started = performance.now();
  let dispose = () => {};
  let parse: (row: Input) => Promise<{ value: Span[] | null; status: string }>;
  if (engine === "matchbox") {
    const { default: lexer } = await import("../.matchbox/lexer/model");
    await lexer.load();
    dispose = () => lexer.dispose();
    parse = async (row) => lexer.parse(row.input);
  } else if (engine === "gpu-lexer") {
    const lexer = await import("gpu-lexer");
    // gpu-lexer initializes lazily inside parse; include it in cold initialization.
    await lexer.parse("const value = 1;");
    parse = async (row) => ({ value: await lexer.parse(row.input), status: "ok" });
  } else {
    const { createTeacher } = await import("../scripts/teacher/label-source");
    const teacher = await createTeacher([...new Set(inputs.map((row) => row.language))]);
    dispose = () => teacher.dispose();
    parse = async (row) => ({ value: teacher.label(row.input, row.language), status: "ok" });
  }
  const initializationMs = performance.now() - started;
  const resources = performance.getEntriesByType("resource").map((entry) => ({
    url: entry.name,
    bytes: (entry as PerformanceResourceTiming).encodedBodySize,
  }));
  try {
    const outputs = [];
    for (const row of inputs) {
      outputs.push(await parse(row));
    }
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
