import fs from "fs-extra";
import path from "path";
import type { InstalledMeta } from "../types";

export async function readInstalledMeta(targetPath: string): Promise<InstalledMeta | null> {
  const metaPath = path.join(targetPath, ".zedo.json");
  if (!(await fs.pathExists(metaPath))) return null;
  return fs.readJson(metaPath);
}

export async function writeInstalledMeta(
  targetPath: string,
  meta: InstalledMeta
) {
  const metaPath = path.join(targetPath, ".zedo.json");
  await fs.writeJson(metaPath, meta, { spaces: 2 });
}
