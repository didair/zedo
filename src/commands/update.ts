import path from "path"
import os from "os"
import fs from "fs-extra"
import semver from "semver"

import { readProjectManifestValidated, parsePackageManifestValidated } from "../core/config.js"
import { gitLsRemoteTags } from "../git/client.js"
import { parseTags, pickLatestMatching } from "../git/tags.js"
import { resolveMounts } from "../core/mounts.js"
import { installResolvedMounts } from "../core/installer.js"
import { gitCloneAtTag } from "../git/client.js";
import { readInstalledMeta, writeInstalledMeta, writeProjectManifest } from "../core/installed.js"

export async function updateCommand(opts: { apply?: boolean } = {}) {
  const project = await readProjectManifestValidated()
  const projectRoot = process.cwd()

  const updates: Array<{
    depIndex: number
    repo: string
    from: string
    to: string
  }> = []

  for (let i = 0; i < project.dependencies.length; i++) {
    const dep = project.dependencies[i]
    const repoUrl = normalizeRepo(dep.repo)

    const tagsRaw = await gitLsRemoteTags(repoUrl);
    const tags = parseTags(tagsRaw);
    const latest = pickLatestMatching(tags);

    // Detect installed version from any mount
    const firstTarget = dep.mounts
      ? Object.values(dep.mounts)[0]
      : null

    if (!firstTarget) continue

    const meta = await readInstalledMeta(path.join(projectRoot, firstTarget))

    if (!meta) continue
    if (!semver.lt(meta.version, latest)) continue

    updates.push({
      depIndex: i,
      repo: dep.repo,
      from: meta.version,
      to: latest
    })
  }

  // Dry run output
  if (!opts.apply) {
    if (updates.length === 0) {
      console.log("All dependencies are up to date.")
      return
    }

    for (const u of updates) {
      console.log(`${u.repo.padEnd(32)} ${u.from} → ${u.to}`)
    }

    console.log("")
    console.log(`Run "zedo update apply" to install these versions.`)
    return
  }

  // Apply updates
  let manifestChanged = false

  for (const u of updates) {
    const dep = project.dependencies[u.depIndex]
    const repoUrl = normalizeRepo(dep.repo)

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
      })
    }

    // Persist version bump to zedo.yaml
    dep.version = u.to
    manifestChanged = true

    console.log(`Updated ${dep.repo} → ${u.to}`)
  }

  if (manifestChanged) {
    await writeProjectManifest(project)
    console.log("Updated zedo.yaml")
  }
}

function normalizeRepo(input: string): string {
  if (input.includes("://") || input.includes("git@")) return input
  return `git@github.com:${input}.git`
}
