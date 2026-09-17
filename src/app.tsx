import { useRef, useState } from "react";
import type { Span } from "../matchbox/lexer/labels";
import { CodePane, Measurements } from "./components";
import { useLexer } from "./hooks";
import experiment from "../benchmarks/results/active.json";

const initial =
  "export function greet(name: string) {\n  // The model receives no language hint.\n  return `Hello, ${name}!`;\n}\n";
export function App() {
  const [input, setInput] = useState(initial);
  const [gpu, setGpu] = useState(false);
  const { spans: prediction, ranges, status } = useLexer(input, gpu);
  const [reference, setReference] = useState<Span[] | null>(null);
  const [referenceStatus, setReferenceStatus] = useState("Reference is not loaded.");
  const [language, setLanguage] = useState("typescript");
  const [referenceKind, setReferenceKind] = useState("shiki");
  const referenceRevision = useRef(0);

  function invalidateReference() {
    referenceRevision.current++;
    setReference(null);
    setReferenceStatus("Reference is not loaded.");
  }
  async function compare() {
    const revision = ++referenceRevision.current;
    setReferenceStatus("Loading reference…");
    try {
      let spans: Span[];
      if (referenceKind === "gpu-lexer") {
        const { parse } = await import("gpu-lexer");
        spans = await parse(input);
      } else {
        const { createTeacher } = await import("../scripts/teacher/label-source");
        const teacher = await createTeacher();
        try {
          spans = teacher.label(input, language);
        } finally {
          teacher.dispose();
        }
      }
      if (revision !== referenceRevision.current) {
        return;
      }
      setReference(spans);
      setReferenceStatus("Reference only. Never used as a fallback.");
    } catch (error) {
      if (revision === referenceRevision.current) {
        setReferenceStatus(String(error));
      }
    }
  }
  return (
    <main>
      <nav>
        <a href="https://github.com/alexpatow/matchbox-lexer">Matchbox / Lexer</a>
        <span>
          {experiment.experiment} · npm {experiment.matchbox}
        </span>
      </nav>
      <section className="intro">
        <p className="eyebrow">A consumer experiment</p>
        <h1>
          Syntax highlighting,
          <br />
          learned.
        </h1>
        <p>One learned highlighter. No language hint. Built with the published Matchbox API.</p>
      </section>
      <div className="runtime-controls">
        <label htmlFor="runtime">Runtime</label>
        <select
          id="runtime"
          value={gpu ? "gpu" : "cpu"}
          onChange={(event) => setGpu(event.target.value === "gpu")}
        >
          <option value="cpu">Burn WASM CPU</option>
          <option value="gpu">Burn WebGPU</option>
        </select>
        <span>Parse timing includes any lazy initialization.</span>
      </div>
      <section className="editor">
        <div className="editor-heading">
          <label htmlFor="source">Source code</label>
          <span>{input.length.toLocaleString()} UTF-16 units</span>
        </div>
        <textarea
          id="source"
          spellCheck={false}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            invalidateReference();
          }}
        />
      </section>
      <div className="comparison">
        <CodePane title="Matchbox" input={input} spans={prediction} ranges={ranges} note={status} />
        <CodePane title="Reference" input={input} spans={reference} note={referenceStatus} />
      </div>
      <div className="reference-controls">
        <label>
          Reference{" "}
          <select
            value={referenceKind}
            onChange={(event) => {
              setReferenceKind(event.target.value);
              invalidateReference();
            }}
          >
            <option value="shiki">Shiki 4.4.3</option>
            <option value="gpu-lexer">gpu-lexer 0.0.2 · WebGPU</option>
          </select>
        </label>
        <label>
          Shiki language{" "}
          <select
            value={language}
            onChange={(event) => {
              setLanguage(event.target.value);
              invalidateReference();
            }}
          >
            {["typescript", "javascript", "python", "rust"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button onClick={() => void compare()}>Run reference</button>
      </div>
      <aside>
        <h2>Abstention is a result.</h2>
        <p>
          Partial results show candidate highlights with uncertain ranges underlined. If the model
          abstains completely, the source stays unstyled. Confidence is uncalibrated. GPU requests
          fail explicitly when unavailable; they never silently switch to CPU.
        </p>
        <a href="https://github.com/alexpatow/matchbox-lexer#earlier-published-measurements">
          Read the measured results
        </a>
      </aside>
      <Measurements />
      <footer>
        Inspired by <a href="https://github.com/vercel-labs/gpu-lexer">gpu-lexer</a> by{" "}
        <a href="https://github.com/shuding">Shu Ding</a>. Shiki supplies the training labels.
      </footer>
    </main>
  );
}
