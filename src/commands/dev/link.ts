import path from "path"
import fs from "fs-extra"
import { resolveMounts } from "../../core/mounts";
import { readDevState, writeDevState } from "../../utils/dev-state";
import { getPackageManifest } from "../../core/config";
import { readDevRegistry } from "../../core/registries";

export async function devLinkCommand(repo: string) {
  if (!repo) {
    throw new Error("Usage: zedo dev link <package name>");
  }

  const registry = await readDevRegistry();
  const entry = registry[repo];

  if (!entry) {
    throw new Error(
      `Package ${repo} is not registered.\n` +
      `Run "zedo dev register" inside the package repo first.`
    )
  }

  const pkg = await getPackageManifest(entry.path);
  const project = await getPackageManifest();
  const dep = project.dependencies?.find(d => d.name === repo);

  if (!dep) {
    throw new Error(`Dependency not found in project: ${repo}`)
  }

  const projectRoot = process.cwd();
  const mounts = resolveMounts(projectRoot, pkg, dep, project.packagePrefix);

  if (mounts.length === 0) {
    throw new Error(`No mounts configured for ${repo} in this project.`)
  }

  // Apply symlinks
  for (const m of mounts) {
    if (pkg.exports === undefined) {
      continue;
    }

    const from = path.join(entry.path, pkg.exports[m.exportName].source);
    const to = m.targetPath;

    await fs.remove(to);
    await fs.ensureDir(path.dirname(to));
    fs.symlink(from, to, () => null);
  }

  // Record dev state
  const state = await readDevState()
  state.linked[repo] = {
    path: entry.path,
    mountedAt: mounts.map(m => path.relative(projectRoot, m.targetPath)),
    linkedAt: new Date().toISOString()
  };

  await writeDevState(state);

  console.log(`Dev-linked ${repo} → ${entry.path}`);
}
