import path from "path"
import os from "os"
import fs from "fs-extra"
import semver from "semver"

import { getPackageManifest, parsePackageManifestValidated } from "../core/config.js"
import {getLatestDependencyTag, gitLsRemoteTags} from "../git/client.js"
import { parseTags, pickLatestMatching } from "../git/tags.js"
import { resolveMounts } from "../core/mounts.js"
import { installResolvedMounts } from "../core/installer.js"
import { gitCloneAtTag } from "../git/client.js";
import { readInstalledMeta, writeInstalledMeta, writeProjectManifest } from "../core/installed.js"
import { normalizeRepo } from "../git/repo";
import { isDevModeActive, readDevState } from "../utils/dev-state";
import {ZedoPackageDependency, ZedoPackageManifest} from "../types";

export async function updateCommand(opts: { apply?: boolean } = {}) {
  const project = await getPackageManifest();
  const projectRoot = process.cwd();
  const devModeActive = await isDevModeActive();

  if (project.dependencies === undefined || project.dependencies.length === 0) {
    console.log("No dependencies listed in zedo.yaml. Nothing to update, aborting");
    return;
  }

  if (devModeActive) {
    console.warn("⚠  Zedo dev-mode is active. Run `zedo dev restore` to return to contract state.");
  }

  const updates: Array<{
    depIndex: number
    repo: string
    from: string
    to: string
  }> = [];

  for (let i = 0; i < project.dependencies.length; i++) {
    const dep = project.dependencies[i];

    if (devModeActive) {
      const devState = await readDevState();
      if (Object.keys(devState.linked).includes(dep.name)) {
        continue;
      }
    }

    const latest = await getLatestDependencyTag(dep as ZedoPackageDependency);

    // Detect installed version from any mount
    const firstTarget = dep.mounts
      ? Object.values(dep.mounts)[0]
      : null;

    if (!firstTarget) continue;

    const meta = await readInstalledMeta(path.join(projectRoot, firstTarget));

    if (!meta) continue;
    if (!semver.lt(meta.version, latest)) continue;

    updates.push({
      depIndex: i,
      repo: dep.repo,
      from: meta.version,
      to: latest
    });
  }

  // Dry run output
  if (!opts.apply) {
    if (updates.length === 0) {
      console.log("All dependencies are up to date.");
      return;
    }

    for (const u of updates) {
      console.log(`${u.repo.padEnd(32)} ${u.from} → ${u.to}`);
    }

    console.log("");
    console.log(`Run "zedo update apply" to install these versions.`);
    return
  }

  // Apply updates
  let manifestChanged = false;

  for (const u of updates) {
    const dep = project.dependencies[u.depIndex];
    const repoUrl = normalizeRepo(dep.repo);

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zedo-"));
    await gitCloneAtTag(repoUrl, u.to, tmp);

    const manifestRaw = fs.readFileSync(path.join(tmp, "zedo.yaml"), "utf-8");
    const pkg = parsePackageManifestValidated(manifestRaw);

    const mounts = resolveMounts(projectRoot, pkg, dep, project.packagePrefix);
    await installResolvedMounts(tmp, mounts);

    for (const m of mounts) {
      await writeInstalledMeta(m.targetPath, {
        repo: dep.repo,
        tag: u.to,
        version: u.to,
        installedAt: new Date().toISOString()
      });
    }

    // Persist version bump to zedo.yaml
    dep.version = u.to;
    manifestChanged = true;

    console.log(`Updated ${dep.repo} → ${u.to}`);
  }

  if (manifestChanged) {
    await writeProjectManifest(project);
    console.log("Updated zedo.yaml");
  }
};
