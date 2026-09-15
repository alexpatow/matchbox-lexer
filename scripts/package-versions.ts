export async function packageVersions() {
  const versions: Record<string, string> = {};
  for (const name of ["matchbox-ai", "@matchbox-ai/core", "@matchbox-ai/train"]) {
    const manifest = await Bun.file(`node_modules/${name}/package.json`).json();
    versions[name] = manifest.version;
  }
  if (new Set(Object.values(versions)).size !== 1) {
    throw new Error("The experiment requires matching CLI, core and train release versions.");
  }
  return versions;
}
