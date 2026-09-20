import { resolve } from "node:path";
import { hash } from "../corpus";
import { createTeacher } from "../teacher/label-source";
import { markdownSamples, sample, type Sample } from "./corpus";
import { openSite } from "./site";

const [sitePath, output] = process.argv.slice(2);
if (!sitePath || !output) {
  throw new Error("Usage: bun run data:website <matchbox-checkout> <new-corpus-directory>");
}
if (await Bun.file(resolve(output, "manifest.json")).exists()) {
  throw new Error("Choose a new corpus directory; frozen corpora are never overwritten");
}
const { root, server, commit } = await openSite(sitePath);
try {
  const { files } = await server.ssrLoadModule("/src/site/pipeline-example/files.ts");
  const { documents } = await server.ssrLoadModule("/src/docs/documents.ts");
  const samples: Sample[] = files.map((file: { name: string; code: string }) =>
    sample(`homepage/${file.name}`, file.name.split(".").at(-1)!, file.code),
  );
  for (const [slug, markdown] of Object.entries(documents).sort(([a], [b]) => a.localeCompare(b))) {
    samples.push(...markdownSamples(`docs/${slug}.md`, markdown as string));
  }
  const teacher = await createTeacher([...new Set<string>(samples.map((row) => row.language))]);
  try {
    const rows = samples.map((row) => ({
      ...row,
      output: teacher.label(row.input, row.language),
    }));
    const content = rows.map((row: unknown) => JSON.stringify(row)).join("\n") + "\n";
    const manifest = {
      purpose:
        "Website regression evaluation. Never consumed by training. Not an unseen generalization benchmark.",
      repository: "https://github.com/alexpatow/matchbox",
      sourceCommit: commit,
      model: await Bun.file(resolve(root, "apps/playground/src/lexer/model-manifest.json")).json(),
      teacher: {
        shiki: JSON.parse(await Bun.file("node_modules/shiki/package.json").text()).version,
        mappingSha256: hash(await Bun.file("scripts/teacher/classes.js").text()),
      },
      samples: rows.length,
      uniqueInputs: new Set(samples.map((row) => row.sha256)).size,
      corpusSha256: hash(content),
    };
    await Bun.write(resolve(output, "LICENSE"), await Bun.file(resolve(root, "LICENSE")).text());
    await Bun.write(resolve(output, "samples.jsonl"), content);
    await Bun.write(resolve(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    console.log(JSON.stringify(manifest, null, 2));
  } finally {
    teacher.dispose();
  }
} finally {
  await server.close();
}
