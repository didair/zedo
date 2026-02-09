import path from "path"
import type { ResolvedMount } from "../types";
import { ZedoPackageManifestSchema, ZedoProjectDependencySchema } from "./schema.js"

export function resolveMounts(
  projectRoot: string,
  pkg: ZedoPackageManifestSchema,
  dep: ZedoProjectDependencySchema,
): ResolvedMount[] {
  if (!pkg.exports || !dep.mounts) return []

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
