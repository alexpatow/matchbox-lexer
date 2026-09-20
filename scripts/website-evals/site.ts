import { resolve } from "node:path";
import { createServer } from "vite";

export async function openSite(path: string) {
  const root = resolve(path);
  const git = Bun.spawnSync(["git", "-C", root, "rev-parse", "HEAD"]);
  if (git.exitCode !== 0) {
    throw new Error("Expected a Matchbox repository checkout");
  }
  const status = Bun.spawnSync(["git", "-C", root, "status", "--porcelain"]);
  if (status.exitCode !== 0 || status.stdout.toString().trim()) {
    throw new Error("Commit website changes before freezing or evaluating its samples");
  }
  const server = await createServer({
    root: resolve(root, "apps/playground"),
    server: { host: "127.0.0.1", port: 0, strictPort: true, open: false, hmr: false },
  });
  server.middlewares.use("/__lexer-eval", (_request, response) => {
    response.setHeader("Content-Type", "text/html");
    response.end("<!doctype html><title>Website lexer evaluation</title>");
  });
  return { root, server, commit: git.stdout.toString().trim() };
}
