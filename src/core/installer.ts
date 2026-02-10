import fs from "fs-extra"
import path from "path"
import type { ResolvedMount } from "../types"

export async function installResolvedMounts(
  repoTempDir: string,
  mounts: ResolvedMount[]
) {
  for (const mount of mounts) {
    const from = path.join(repoTempDir, mount.sourcePath);
    const to = mount.targetPath;

    console.log('### install mount from, to', from, to);

    const exists = await fs.pathExists(from)
    if (!exists) {
      throw new Error(`Export source does not exist: ${mount.sourcePath}`)
    }

    await fs.remove(to);
    fs.symlink(from, to, () => null);
  }
}
