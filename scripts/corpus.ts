import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import corpus from "../data/corpus.json";
export const hash = (input: string) => createHash("sha256").update(input).digest("hex");
export type Source = (typeof corpus.sources)[number];

export async function sourcePaths(source: Source): Promise<string[]> {
  await mkdir("data/generated/cache", { recursive: true });
  const cache = Bun.file(`data/generated/cache/${source.commit}-tree.json`);
  if (!(await cache.exists())) {
    const child = Bun.spawn(
      ["gh", "api", `repos/${source.repo}/git/trees/${source.commit}?recursive=1`],
      { stdout: "pipe", stderr: "inherit" },
    );
    const body = await new Response(child.stdout).text();
    if ((await child.exited) !== 0) {
      throw new Error(`Could not list ${source.repo}`);
    }
    await Bun.write(cache, body);
  }
  const result = await Bun.file(cache.name!).json();
  if (result.truncated) {
    throw new Error(`Truncated tree for ${source.repo}`);
  }
  const extensions: Record<string, string> = {
    typescript: ".ts",
    javascript: ".js",
    python: ".py",
    rust: ".rs",
  };
  return result.tree
    .filter(
      (entry: { type: string; path: string; size: number }) =>
        entry.type === "blob" &&
        entry.path.startsWith(source.prefix) &&
        entry.path.endsWith(extensions[source.language]) &&
        entry.size >= 256 &&
        entry.size <= 65536,
    )
    .map((entry: { path: string }) => entry.path)
    .sort((a: string, b: string) => hash(corpus.seed + a).localeCompare(hash(corpus.seed + b)));
}

export async function readSource(source: Source, path: string): Promise<string> {
  const cache = Bun.file(`data/generated/cache/${hash(source.commit + path)}.txt`);
  if (await cache.exists()) {
    return cache.text();
  }
  const response = await fetch(
    `https://raw.githubusercontent.com/${source.repo}/${source.commit}/${path}`,
  );
  if (!response.ok) {
    throw new Error(`${response.status} fetching ${source.repo}:${path}`);
  }
  const text = await response.text();
  await Bun.write(cache, text);
  return text;
}
