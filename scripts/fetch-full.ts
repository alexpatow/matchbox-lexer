import { mkdir, statfs } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { x } from "tar";

const upstream = resolve("data/generated/upstream/gpu-lexer");
const moduleUrl = pathToFileURL(`${upstream}/packages/training/src/corpus.js`).href;
const { languageForPath, gitDirectoryName } = await import(moduleUrl);
const manifest = await Bun.file(`${upstream}/packages/training/data/corpus.json`).json();
const base = `${upstream}/packages/training/data/generated/repositories`;
await mkdir(base, { recursive: true });
for (const split of ["train", "verification", "mining"]) {
  for (const entry of manifest[split].git) {
    const destination = `${base}/${gitDirectoryName(entry)}`;
    if (await Bun.file(`${destination}/provenance.json`).exists()) {
      console.log(`reuse ${entry.repo}`);
      continue;
    }
    const disk = await statfs(base);
    if (disk.bavail * disk.bsize < 3 * 1024 ** 3) {
      throw new Error(
        "Less than 3 GiB free; full corpus preparation stopped before exhausting disk.",
      );
    }
    await mkdir(destination, { recursive: true });
    const archive = `https://codeload.github.com/${entry.repo}/tar.gz/${entry.commit}`;
    const response = await fetch(archive);
    if (!response.ok || !response.body) {
      throw new Error(`${response.status} downloading ${entry.repo}`);
    }
    // Upstream's builder considers only recognized-language files <= maxFileBytes.
    // Stream archives and retain every such candidate, plus licenses. No corpus quotas change.
    await pipeline(
      Readable.fromWeb(response.body as never),
      x({
        cwd: destination,
        strip: 1,
        strict: true,
        filter: (path, stat) => {
          if (!("type" in stat)) {
            return false;
          }
          if (stat.type !== "File" && stat.type !== "Directory") {
            return false;
          }
          if (stat.type === "Directory") {
            return true;
          }
          const relative = path.split("/").slice(1).join("/");
          if (/(^|\/)(licen[sc]e|copying|notice)(\.|$)/i.test(relative)) {
            return true;
          }
          return (
            stat.size > 0 &&
            stat.size <= manifest.policy.maxFileBytes &&
            Boolean(languageForPath(relative))
          );
        },
      }),
    );
    await Bun.write(
      `${destination}/provenance.json`,
      JSON.stringify({
        kind: "git",
        split,
        repo: entry.repo,
        commit: entry.commit,
        declaredLicense: entry.license,
        archive,
        fetchedAt: new Date().toISOString(),
        storage:
          "All upstream language/size candidates; archives streamed, no model-specific sampling.",
      }) + "\n",
    );
    console.log(`fetched ${split}/${entry.repo}`);
  }
}
// The unchanged upstream fetcher reuses these repositories, then fetches npm sources and website examples.
const child = Bun.spawn(["node", `${upstream}/packages/training/src/fetch-corpus.js`], {
  stdout: "inherit",
  stderr: "inherit",
});
if ((await child.exited) !== 0) {
  throw new Error("Upstream npm/example fetching failed");
}
