import { useRef, useState } from "react";
import type { Span } from "../../matchbox/lexer/labels";

export function useReference(input: string, language: string, referenceKind: string) {
  const [reference, setReference] = useState<Span[] | null>(null);
  const [referenceStatus, setReferenceStatus] = useState("Reference is not loaded.");
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
        const { createTeacher } = await import("../../scripts/teacher/label-source");
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
  return { reference, referenceStatus, invalidateReference, compare };
}
