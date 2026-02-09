import path from "path"
import os from "os"
import fs from "fs-extra"
import { execa } from "execa"
import semver from "semver"

import { readProjectManifestValidated, parsePackageManifestValidated } from "../core/config.js"
import { gitLsRemoteTags, gitArchiveFile } from "../git/client.js"
import { parseTags, pickLatestMatching } from "../git/tags.js"
import { resolveMounts } from "../core/mounts.js"
import { readInstalledMeta, writeInstalledMeta } from "../core/installed.js"
import {installResolvedMounts} from "../core/installer";

export async function updateCommand() {
  const project = await readProjectManifestValidated();
  const projectRoot = process.cwd();

  for (const dep of project.dependencies) {
    const repoUrl = normalizeRepo(dep.repo);

    const tagsRaw = await gitLsRemoteTags(repoUrl);
    const tags = parseTags(tagsRaw);
    const latest = pickLatestMatching(tags, dep.version);

    const mounts = Object.values(dep.mounts ?? {});
    if (mounts.length === 0) continue;

    const firstTarget = mounts[0];
    const meta = await readInstalledMeta(path.join(projectRoot, firstTarget));

    if (meta && !semver.lt(meta.version, latest)) {
      continue; // up to date
    }

    const manifestBuf = await gitArchiveFile(repoUrl, latest, "zedo.yaml");
    const pkg = parsePackageManifestValidated(manifestBuf.toString());

    const resolvedMounts = resolveMounts(projectRoot, pkg, dep);
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "zedo-"));

    await execa("git", ["clone", "--depth=1", "--branch", latest, repoUrl, tmp]);
    await installResolvedMounts(tmp, resolvedMounts);

    for (const m of resolvedMounts) {
      await writeInstalledMeta(m.targetPath, {
        repo: dep.repo,
        tag: latest,
        version: pkg.version,
        installedAt: new Date().toISOString()
      });
    }

    console.log(`Updated ${dep.repo} → ${latest}`);
  }
}

function normalizeRepo(input: string): string {
  if (!input.includes("://") && !input.includes("git@")) {
    return `https://github.com/${input}.git`
  }
  return input
}
