import type { ReactNode } from "react";
import type { UncertainRange } from "@matchbox-ai/core/runtime";
import { highlightSegments } from "./highlight-segments";
import type { Span } from "../../matchbox/lexer/labels";
export function CodePane({
  title,
  input,
  spans,
  note,
  ranges = [],
}: {
  title: string;
  input: string;
  spans: Span[] | null;
  note: string;
  ranges?: UncertainRange[];
}) {
  let content: ReactNode = input;
  if (spans !== null) {
    content = highlightSegments(spans, ranges).map((span) => (
      <span
        className={`syntax-${span.type}${span.uncertain ? " syntax-uncertain" : ""}`}
        key={`${span.start}-${span.end}`}
      >
        {input.slice(span.start, span.end)}
      </span>
    ));
  }
  return (
    <section className="code-pane">
      <header>
        <h2>{title}</h2>
        <span>{note}</span>
      </header>
      <pre>
        <code>{content}</code>
      </pre>
    </section>
  );
}
