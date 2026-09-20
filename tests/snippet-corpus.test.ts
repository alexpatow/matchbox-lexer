import { expect, test } from "bun:test";
import { snippets } from "../scripts/snippet-corpus/extract";
import { normalize, overlapsHeldOut } from "../scripts/snippet-corpus/policy";

test("line windows are deterministic and independent of lexical labels", () => {
  const input = Array.from({ length: 40 }, (_, index) => `const number${index} = ${index};`).join(
    "\n",
  );
  const result = snippets(input, "typescript", "source-hash");
  expect(result).toEqual(snippets(input, "typescript", "source-hash"));
  expect(result.length).toBeGreaterThan(0);
  for (const row of result) {
    expect(input + "\n").toContain(row.input);
    expect(row.input.length).toBeLessThanOrEqual(2048);
    expect(row.language).toBe("typescript");
  }
});
test("Markdown fences become standalone examples, without prose or fence markers", () => {
  const input =
    '# Installation\n\n```bash\nnpm install example-package\n```\n\n```json\n{"message": "hello world"}\n```\n\n```text\na diagram goes here\n```\n';
  expect(snippets(input, "markdown", "source")).toEqual([
    { input: "npm install example-package\n", language: "shellscript", kind: "fence", line: 3 },
    { input: '{"message": "hello world"}\n', language: "json", kind: "fence", line: 7 },
  ]);
});
test("unsupported languages and trivial fragments are not augmented", () => {
  expect(snippets("a reasonably long line of content", "unknown", "source")).toEqual([]);
  expect(snippets("}\n}\n}\n", "typescript", "source")).toEqual([]);
});

test("held-out fragments and website containment cannot become training snippets", () => {
  const website = [normalize("const Result = await model.parse(input); ")];
  const heldOut = [normalize("// header\nconst value = 100;\nexport default value;")];
  expect(overlapsHeldOut(normalize("const   value = 100;"), heldOut, website)).toBe(true);
  expect(overlapsHeldOut(normalize("await model.parse(input);"), heldOut, website)).toBe(true);
  expect(
    overlapsHeldOut(
      normalize("function run() { const result = await model.parse(input); }"),
      heldOut,
      website,
    ),
  ).toBe(true);
  expect(overlapsHeldOut(normalize("npm install separate-package"), heldOut, website)).toBe(false);
});
