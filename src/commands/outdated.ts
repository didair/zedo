import { getPackageManifest } from "../core/config.js"
import { gitLsRemoteTags } from "../git/client.js"
import { parseTags, pickLatestMatching } from "../git/tags.js"
import { readInstalledMeta } from "../core/installed.js"
import semver from "semver"

export async function outdatedCommand() {
  const project = await getPackageManifest()
  const projectRoot = process.cwd()

  for (const dep of project.dependencies) {
    const repoUrl = normalizeRepo(dep.repo)

    const tagsRaw = await gitLsRemoteTags(repoUrl)
    const tags = parseTags(tagsRaw)
    const latest = pickLatestMatching(tags, dep.version)

    // pick first mount to detect installed version
    const mounts = dep.mounts ? Object.values(dep.mounts) : []
    if (mounts.length === 0) continue

    const firstTarget = mounts[0]
    const meta = await readInstalledMeta(`${projectRoot}/${firstTarget}`)

    if (!meta) continue

    if (semver.lt(meta.version, latest)) {
      console.log(
        `${dep.repo.padEnd(24)} ${meta.version} → ${latest}`
      )
    }
  }
}

function normalizeRepo(input: string): string {
  if (input.includes("://") || input.includes("git@")) {
    return input
  }

  // Prefer SSH over HTTPS for auth
  return `git@github.com:${input}.git`
}
