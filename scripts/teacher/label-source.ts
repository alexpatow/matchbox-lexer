import { createHighlighter, type BundledLanguage } from "shiki";
import { classFromScopes } from "./classes.js";
import { labels, type Label, type Span } from "../../matchbox/lexer/labels";

export async function createTeacher(
  languages: string[] = ["typescript", "javascript", "python", "rust"],
) {
  const highlighter = await createHighlighter({
    langs: languages,
    themes: ["github-dark-default"],
  });
  return {
    dispose: () => highlighter.dispose(),
    label(input: string, language: string): Span[] {
      const units: Label[] = Array.from({ length: input.length }, () => "plain");
      const result = highlighter.codeToTokens(input, {
        lang: language as BundledLanguage,
        theme: "github-dark-default",
        includeExplanation: true,
      });
      let previousEnd = 0;
      for (const line of result.tokens) {
        for (const token of line) {
          if (
            token.offset < previousEnd ||
            input.slice(token.offset, token.offset + token.content.length) !== token.content
          ) {
            throw new Error("Shiki offset mismatch");
          }
          if (
            !token.explanation ||
            token.explanation.map((item) => item.content).join("") !== token.content
          ) {
            throw new Error("Shiki explanation missing");
          }
          let offset = token.offset;
          for (const item of token.explanation) {
            const label = classFromScopes(item.scopes.map((scope) => scope.scopeName)) as Label;
            if (!labels.includes(label)) {
              throw new Error(`Unknown teacher label: ${label}`);
            }
            units.fill(label, offset, offset + item.content.length);
            offset += item.content.length;
          }
          previousEnd = offset;
        }
      }
      return spansFromUnits(input, units);
    },
  };
}

function spansFromUnits(input: string, units: Label[]): Span[] {
  const spans: Span[] = [];
  let offset = 0;
  for (const character of input) {
    const type = units[offset];
    if (character.length === 2 && units[offset + 1] !== type) {
      throw new Error("Teacher splits a surrogate pair");
    }
    const last = spans.at(-1);
    if (last?.type === type) {
      last.end += character.length;
    } else {
      spans.push({ type, start: offset, end: offset + character.length });
    }
    offset += character.length;
  }
  return spans;
}
