interface Props {
  referenceKind: string;
  language: string;
  onReferenceChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onRun: () => void;
}

export function ReferenceControls({
  referenceKind,
  language,
  onReferenceChange,
  onLanguageChange,
  onRun,
}: Props) {
  return (
    <div className="reference-controls">
      <label>
        Reference{" "}
        <select value={referenceKind} onChange={(event) => onReferenceChange(event.target.value)}>
          <option value="shiki">Shiki 4.4.3</option>
          <option value="gpu-lexer">gpu-lexer 0.0.2 · WebGPU</option>
        </select>
      </label>
      <label>
        Shiki language{" "}
        <select
          value={language}
          disabled={referenceKind !== "shiki"}
          onChange={(event) => onLanguageChange(event.target.value)}
        >
          {["typescript", "javascript", "python", "rust"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <button onClick={onRun}>Run reference</button>
    </div>
  );
}
