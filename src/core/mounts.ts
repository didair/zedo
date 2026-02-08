import path from "path"
import fs from "fs-extra"
import { ZedoPackageManifest, ZedoProjectDependency, ResolvedMount } from "../types/index.js"

export function resolveMounts(
  projectRoot: string,
  pkg: ZedoPackageManifest,
  dep: ZedoProjectDependency
): ResolvedMount[] {
  if (!pkg.exports || Object.keys(pkg.exports).length === 0) {
    return []
  }

  if (!dep.mounts || Object.keys(dep.mounts).length === 0) {
    return []
  }

  const resolved: ResolvedMount[] = []
  const usedTargets = new Set<string>()

  for (const [exportName, targetRel] of Object.entries(dep.mounts)) {
    const exp = pkg.exports[exportName]
    if (!exp) {
      throw new Error(
        `Package "${pkg.name}" does not export "${exportName}". ` +
        `Available exports: ${Object.keys(pkg.exports).join(", ")}`
      )
    }

    if (path.isAbsolute(targetRel)) {
      throw new Error(`Mount target must be relative: ${targetRel}`)
    }

    const targetAbs = path.resolve(projectRoot, targetRel)

    if (!targetAbs.startsWith(projectRoot)) {
      throw new Error(`Mount target escapes project root: ${targetRel}`)
    }

    if (usedTargets.has(targetAbs)) {
      throw new Error(`Mount collision: multiple exports target "${targetRel}"`)
    }

    usedTargets.add(targetAbs)

    resolved.push({
      exportName,
      sourcePath: exp.source,
      targetPath: targetAbs
    })
  }

  return resolved
}
