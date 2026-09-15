import type { Span } from "../../matchbox/lexer/labels";
export function CodePane({
  title,
  input,
  spans,
  note,
}: {
  title: string;
  input: string;
  spans: Span[] | null;
  note: string;
}) {
  return (
    <section className="code-pane">
      <header>
        <h2>{title}</h2>
        <span>{note}</span>
      </header>
      <pre>
        <code>
          {spans === null
            ? input
            : spans.map((span) => (
                <span className={`syntax-${span.type}`} key={`${span.start}-${span.end}`}>
                  {input.slice(span.start, span.end)}
                </span>
              ))}
        </code>
      </pre>
    </section>
  );
}
