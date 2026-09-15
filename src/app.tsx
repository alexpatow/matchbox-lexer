import { useEffect, useRef, useState } from "react";
import type { Span } from "../matchbox/lexer/labels";
import { CodePane, Measurements } from "./components";
import experiment from "../benchmarks/results/active.json";

const initial =
  "export function greet(name: string) {\n  // The model receives no language hint.\n  return `Hello, ${name}!`;\n}\n";
export function App() {
  const [input, setInput] = useState(initial);
  const [prediction, setPrediction] = useState<Span[] | null>(null);
  const [status, setStatus] = useState("Loading model…");
  const [reference, setReference] = useState<Span[] | null>(null);
  const [referenceStatus, setReferenceStatus] = useState("Reference is not loaded.");
  const [language, setLanguage] = useState("typescript");
  const [referenceKind, setReferenceKind] = useState("shiki");
  const referenceRevision = useRef(0);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const { default: lexer } = await import("../.matchbox/lexer/model");
        await lexer.load();
        const started = performance.now();
        const result = await lexer.parse(input);
        const elapsed = performance.now() - started;
        if (!active) {
          return;
        }
        setPrediction(result.value);
        if (result.status === "uncertain") {
          setStatus(`Abstained · ${elapsed.toFixed(2)} ms · ${result.reason}`);
        } else {
          setStatus(`Accepted · ${elapsed.toFixed(2)} ms · score ${result.confidence.toFixed(2)}`);
        }
      } catch (error) {
        if (active) {
          setStatus(String(error));
        }
      }
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [input]);
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
            setPrediction(null);
            setStatus("Running…");
            invalidateReference();
          }}
        />
      </section>
      <div className="comparison">
        <CodePane title="Matchbox" input={input} spans={prediction} note={status} />
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
          If Matchbox declines, the source stays unstyled. This experiment keeps the published
          confidence threshold and records diagnostic accuracy separately. It does not turn
          uncertain predictions into accepted highlights.
        </p>
        <a href="https://github.com/alexpatow/matchbox-lexer#evolution">Read the evolution log</a>
      </aside>
      <Measurements />
      <footer>
        Inspired by <a href="https://github.com/vercel-labs/gpu-lexer">gpu-lexer</a> by{" "}
        <a href="https://github.com/shuding">Shu Ding</a>. Shiki supplies the training labels.
      </footer>
    </main>
  );
}
