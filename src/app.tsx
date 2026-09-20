import { useState } from "react";
import { CodePane, Measurements, ReferenceControls } from "./components";
import { useLexer, useReference } from "./hooks";
import experiment from "../benchmarks/results/active.json";

const initial =
  "export function greet(name: string) {\n  // The model receives no language hint.\n  return `Hello, ${name}!`;\n}\n";
export function App() {
  const [input, setInput] = useState(initial);
  const [gpu, setGpu] = useState(false);
  const { spans: prediction, ranges, status } = useLexer(input, gpu);
  const [language, setLanguage] = useState("typescript");
  const [referenceKind, setReferenceKind] = useState("shiki");
  const { reference, referenceStatus, invalidateReference, compare } = useReference(
    input,
    language,
    referenceKind,
  );
  return (
    <main>
      <nav>
        <a href="https://github.com/alexpatow/matchbox-lexer">Matchbox / Lexer</a>
        <span>Matchbox {experiment.matchbox}</span>
      </nav>
      <section className="intro">
        <h1>
          Syntax highlighting,
          <br />
          learned.
        </h1>
        <p>A small model that highlights source code in your browser, without a language hint.</p>
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
      <ReferenceControls
        referenceKind={referenceKind}
        language={language}
        onReferenceChange={(value) => {
          setReferenceKind(value);
          invalidateReference();
        }}
        onLanguageChange={(value) => {
          setLanguage(value);
          invalidateReference();
        }}
        onRun={() => void compare()}
      />
      <aside>
        <h2>Prediction uncertainty</h2>
        <p>
          Dotted underlines mark uncertain predictions. Fully uncertain inputs stay unstyled.
          Confidence is uncalibrated.
        </p>
        <a href="https://github.com/alexpatow/matchbox-lexer/blob/main/benchmarks/results.md">
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
