import { mkdir } from "node:fs/promises";
const root = "data/generated/upstream/gpu-lexer";
const commit = "1e514fd681e31d6b19296f985fb01d8fdc0ae74f";
async function run(command: string[]) {
  const child = Bun.spawn(command, { stdout: "inherit", stderr: "inherit" });
  if ((await child.exited) !== 0) {
    throw new Error(`Failed: ${command.join(" ")}`);
  }
}
const started = performance.now();
await mkdir("data/generated/upstream", { recursive: true });
if (!(await Bun.file(`${root}/package.json`).exists())) {
  await run([
    "git",
    "clone",
    "--filter=blob:none",
    "--no-checkout",
    "https://github.com/vercel-labs/gpu-lexer.git",
    root,
  ]);
  await run(["git", "-C", root, "checkout", commit]);
}
const revision = Bun.spawn(["git", "-C", root, "rev-parse", "HEAD"], { stdout: "pipe" });
if ((await new Response(revision.stdout).text()).trim() !== commit) {
  throw new Error("Unexpected upstream revision");
}
await run(["bun", "scripts/fetch-full.ts"]);
await run(["node", "--max-old-space-size=3072", `${root}/packages/training/src/build-corpus.js`]);
await run(["bun", "scripts/convert-full.ts"]);
await Bun.write(
  "data/generated/full/preparation.json",
  JSON.stringify(
    { commit, wallMs: performance.now() - started, finishedAt: new Date().toISOString() },
    null,
    2,
  ) + "\n",
);
