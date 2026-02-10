import path from "path";
import fs from "fs-extra";

import { readProjectManifestValidated, parsePackageManifestValidated } from "../core/config.js";
import { gitLsRemoteTags, gitCloneAtTag } from "../git/client.js";
import { parseTags, pickLatestMatching } from "../git/tags.js";
import { resolveMounts } from "../core/mounts.js";
import { writeInstalledMeta } from "../core/installed";
import { installResolvedMounts } from "../core/installer";

export async function installCommand() {
  const project = await readProjectManifestValidated()
  const projectRoot = process.cwd()

  fs.mkdir(path.join(projectRoot, "zedo-modules"), () => null);

  for (const dep of project.dependencies) {
    const repoUrl = normalizeRepo(dep.repo);
    const depInstallDir = path.join(projectRoot, "zedo-modules", dep.repo);

    const tagsRaw = await gitLsRemoteTags(repoUrl);
    const tags = parseTags(tagsRaw);
    const tag = pickLatestMatching(tags, dep.version);

    await gitCloneAtTag(repoUrl, tag, depInstallDir)

    const manifestRaw = fs.readFileSync(path.join(depInstallDir, "zedo.yaml"), "utf8");
    const pkg = parsePackageManifestValidated(manifestRaw);

    const mounts = resolveMounts(projectRoot, pkg, dep);

    await installResolvedMounts(depInstallDir, mounts);

    for (const m of mounts) {
      await writeInstalledMeta(m.targetPath, {
        repo: dep.repo,
        tag,
        version: tag,
        installedAt: new Date().toISOString()
      });
    }
  }
}

function normalizeRepo(input: string): string {
  if (input.includes("://") || input.includes("git@")) return input;
  return `git@github.com:${input}.git`;
}
