import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root, RootContent } from "mdast";
import type { Span } from "../../matchbox/lexer/labels";
import { hash } from "../corpus";

export interface Sample {
  id: string;
  language: string;
  input: string;
  sha256: string;
}
export interface LabeledSample extends Sample {
  output: Span[];
}
const languages: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  sh: "shellscript",
  json: "json",
  jsonl: "json",
};
export function sample(id: string, language: string, input: string): Sample {
  const grammar = languages[language];
  if (!grammar) {
    throw new Error(`No teacher grammar for ${language}: ${id}`);
  }
  return { id, language: grammar, input, sha256: hash(input) };
}
export function markdownSamples(path: string, markdown: string): Sample[] {
  const root = unified().use(remarkParse).parse(markdown) as Root;
  const samples: Sample[] = [];
  function visit(node: Root | RootContent) {
    if (node.type === "code" && node.lang && node.lang !== "text") {
      // react-markdown renders a trailing newline inside each fenced code block.
      samples.push(sample(`${path}:${node.position!.start.line}`, node.lang, node.value + "\n"));
    }
    if ("children" in node) {
      for (const child of node.children) {
        visit(child as RootContent);
      }
    }
  }
  visit(root);
  return samples;
}
