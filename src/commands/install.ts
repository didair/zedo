import path from "path"
import os from "os"
import fs from "fs-extra"
import { execa } from "execa"

import { readProjectManifest, readPackageManifestFromBuffer } from "../core/config.js"
import { gitLsRemoteTags, gitArchiveFile } from "../git/client.js"
import { parseTags, pickLatestMatching } from "../git/tags.js"
import { resolveMounts } from "../core/mounts.js"
import { installResolvedMounts } from "../core/installer.js"
import type { ZedoPackageManifest } from "../types"

export async function installCommand() {
  const project = await readProjectManifest()
  const projectRoot = process.cwd()

  for (const dep of project.dependencies) {
    const repoUrl = normalizeRepo(dep.repo)

    const tagsRaw = await gitLsRemoteTags(repoUrl)
    const tags = parseTags(tagsRaw)
    const tag = pickLatestMatching(tags, dep.version)

    const manifestBuf = await gitArchiveFile(repoUrl, tag, "zedo.yaml")
    const pkg = (await readPackageManifestFromBuffer(
      manifestBuf.toString()
    )) as ZedoPackageManifest

    if (pkg.version !== tag.replace(/^v/, "")) {
      throw new Error(
        `Version mismatch: tag ${tag} ≠ manifest ${pkg.version} in ${pkg.name}`
      )
    }

    const mounts = resolveMounts(projectRoot, pkg, dep)

    if (mounts.length === 0) {
      console.warn(`No mounts configured for ${pkg.name}, skipping.`)
      continue
    }

    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "zedo-"))
    await execa("git", ["clone", "--depth=1", "--branch", tag, repoUrl, tmp])

    await installResolvedMounts(tmp, mounts)
  }
}

function normalizeRepo(input: string): string {
  if (!input.includes("://") && !input.includes("git@")) {
    return `https://github.com/${input}.git`
  }
  return input
}
