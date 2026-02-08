import fs from "fs-extra"
import YAML from "yaml"
import { ProjectManifest, PackageManifest } from "../types/index.js"

export async function readProjectManifest(): Promise<ProjectManifest> {
  const raw = await fs.readFile("zedo.yaml", "utf8")
  return YAML.parse(raw)
}

export async function readPackageManifestFromBuffer(
  yaml: string
): Promise<PackageManifest> {
  return YAML.parse(yaml)
}
