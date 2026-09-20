import { copyFile, mkdir } from "node:fs/promises";
import { hash } from "../corpus";
import { fileHash } from "../corpus-lock";
import { createTeacher } from "../teacher/label-source";
import { snippets, type Snippet } from "./extract";
import { normalize, overlapsHeldOut } from "./policy";

const parent = "data/generated/full-clean-v1";
const destination = "data/generated/full-snippets-v1";
const lockPath = "data/full-snippets-v1-lock.json";
const parentLock = await Bun.file("data/full-clean-v1-lock.json").json();
type Row = { input: string; output: unknown[] };
type Source = { language: string; sha256: string; path: string; sourceName: string };
const data: Record<string, { rows: Row[]; sources: Source[] }> = {};
for (const split of ["train", "validation", "test"]) {
  if ((await fileHash(`${parent}/${split}.jsonl`)) !== parentLock.files[split]) {
    throw new Error(`${split} parent checksum mismatch`);
  }
  data[split] = {
    rows: (await Bun.file(`${parent}/${split}.jsonl`).text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line)),
    sources: await Bun.file(`${parent}/${split}-sources.json`).json(),
  };
}
const website = (await Bun.file("evals/website-v1/samples.jsonl").text())
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as Row);
const websiteInputs = website.map((row) => normalize(row.input));
const testInputs = data.test.rows.map((row) => normalize(row.input));
const trainInputs = data.train.rows.map((row) => normalize(row.input));
const validationInputs = data.validation.rows.map((row) => normalize(row.input));
const forbidden = new Set([...data.test.rows, ...website].map((row) => normalize(row.input)));
const candidates: Record<string, { snippet: Snippet; source: Source; parentIndex: number }[]> = {};
for (const split of ["validation", "train"]) {
  candidates[split] = data[split].rows.flatMap((row, index) =>
    snippets(row.input, data[split].sources[index].language, data[split].sources[index].sha256).map(
      (snippet) => ({ snippet, source: data[split].sources[index], parentIndex: index }),
    ),
  );
}
// Reserve validation windows before selecting training windows.
const reserved = new Set([
  ...forbidden,
  ...data.validation.rows.map((row) => normalize(row.input)),
  ...candidates.validation.map(({ snippet }) => normalize(snippet.input)),
]);
const teacher = await createTeacher([
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "shellscript",
  "json",
  "jsonc",
]);
const additions: Record<string, unknown> = {};
try {
  await mkdir(destination, { recursive: true });
  for (const split of ["validation", "train"]) {
    const rows = [...data[split].rows];
    const sources: unknown[] = [...data[split].sources];
    const seen = new Set(rows.map((row) => normalize(row.input)));
    const byLanguage: Record<string, number> = {};
    let rejected = 0;
    const heldOut =
      split === "train" ? [...testInputs, ...validationInputs] : [...testInputs, ...trainInputs];
    for (const { snippet, source, parentIndex } of candidates[split]) {
      const normalized = normalize(snippet.input);
      const blocked = split === "train" ? reserved : forbidden;
      if (
        seen.has(normalized) ||
        overlapsHeldOut(normalized, heldOut, websiteInputs) ||
        blocked.has(normalized)
      ) {
        rejected++;
        continue;
      }
      seen.add(normalized);
      rows.push({ input: snippet.input, output: teacher.label(snippet.input, snippet.language) });
      sources.push({
        ...source,
        language: snippet.language,
        sha256: hash(snippet.input),
        parentIndex,
        extraction: { kind: snippet.kind, line: snippet.line },
      });
      byLanguage[snippet.language] = (byLanguage[snippet.language] ?? 0) + 1;
    }
    await Bun.write(
      `${destination}/${split}.jsonl`,
      rows.map((row) => JSON.stringify(row)).join("\n") + "\n",
    );
    await Bun.write(
      `${destination}/${split}-sources.json`,
      JSON.stringify(sources, null, 2) + "\n",
    );
    additions[split] = {
      added: rows.length - data[split].rows.length,
      rejected,
      byLanguage,
      examples: rows.length,
      units: rows.reduce((sum, row) => sum + row.input.length, 0),
    };
  }
  for (const suffix of [".jsonl", "-sources.json"]) {
    await copyFile(`${parent}/test${suffix}`, `${destination}/test${suffix}`);
  }
  const files: Record<string, string> = {};
  for (const split of ["train", "validation", "test"]) {
    files[split] = await fileHash(`${destination}/${split}.jsonl`);
  }
  const lock = {
    dataset: "full-snippets-v1",
    parent: parentLock.files,
    files,
    teacher: "shiki@4.4.3",
    policy:
      "Retain original documents. Add independently relabeled line windows and Markdown fences from each source split. Reserve validation windows, exclude windows contained in normalized held-out documents and website snippet containment. Preserve full test bytes. No website sources are added.",
    additions,
  };
  if (await Bun.file(lockPath).exists()) {
    if (JSON.stringify(await Bun.file(lockPath).json()) !== JSON.stringify(lock)) {
      throw new Error("Corpus drifted from its frozen identity; choose a new version");
    }
  } else {
    await Bun.write(lockPath, JSON.stringify(lock, null, 2) + "\n");
  }
  await Bun.write(`${destination}/summary.json`, JSON.stringify(lock, null, 2) + "\n");
  console.log(JSON.stringify(lock, null, 2));
} finally {
  teacher.dispose();
}
