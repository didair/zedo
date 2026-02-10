import fs from "fs-extra";
import path from "path";
import type { InstalledMeta, ZedoProjectManifest } from "../types";
import YAML from "yaml";

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

export async function writeProjectManifest(manifest: ZedoProjectManifest) {
  const filePath = path.resolve(process.cwd(), "zedo.yaml");

  const doc = new YAML.Document();
  doc.contents = manifest as any;

  const yaml = doc.toString({
    indent: 2,
    lineWidth: 0
  });

  const tmpPath = `${filePath}.tmp`;

  fs.writeFile(tmpPath, yaml, () => null);
  await fs.move(tmpPath, filePath, { overwrite: true });
}