import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root, RootContent } from "mdast";
import { hash } from "../corpus";

export interface Snippet {
  input: string;
  language: string;
  kind: string;
  line: number;
}
const aliases: Record<string, string> = {
  ts: "typescript",
  typescript: "typescript",
  tsx: "tsx",
  js: "javascript",
  javascript: "javascript",
  jsx: "jsx",
  sh: "shellscript",
  bash: "shellscript",
  shell: "shellscript",
  shellscript: "shellscript",
  zsh: "shellscript",
  json: "json",
  jsonc: "jsonc",
  jsonl: "json",
};
export function snippets(input: string, language: string, sourceKey: string): Snippet[] {
  if (language === "markdown" || language === "mdx") {
    return fences(input);
  }
  const grammar = aliases[language];
  if (!grammar) {
    return [];
  }
  const lines = input.split("\n");
  const count = grammar === "shellscript" ? 24 : 12;
  const output: Snippet[] = [];
  for (let index = 0; index < count; index++) {
    const start = parseInt(hash(`${sourceKey}:${index}`).slice(0, 8), 16) % lines.length;
    const length = [1, 2, 4, 8, 16][index % 5];
    const text = lines.slice(start, start + length).join("\n") + "\n";
    if (useful(text)) {
      output.push({ input: text, language: grammar, kind: "line-window", line: start + 1 });
    }
  }
  return output;
}
function useful(input: string) {
  return input.trim().length >= 16 && input.length <= 2048;
}
function fences(input: string): Snippet[] {
  const result: Snippet[] = [];
  function visit(node: Root | RootContent) {
    if (node.type === "code") {
      const grammar = aliases[node.lang?.toLowerCase() ?? ""];
      const text = node.value + "\n";
      if (grammar && useful(text)) {
        result.push({
          input: text,
          language: grammar,
          kind: "fence",
          line: node.position!.start.line,
        });
      }
    }
    if ("children" in node) {
      for (const child of node.children) {
        visit(child as RootContent);
      }
    }
  }
  visit(unified().use(remarkParse).parse(input) as Root);
  return result;
}
