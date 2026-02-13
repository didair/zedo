import fs from "fs-extra";
import path from "path";
import YAML from "yaml";
import { getDevRegistryPath, parsePackageManifestValidated } from "./config";
import { DevRegistryEntrySchema, DevRegistrySchema } from "./schema";
import { DevRegistry, DevRegistryEntry } from "../types";

export const readDevRegistry = async (): Promise<DevRegistry> => {
  const path = getDevRegistryPath();
  if (!(await fs.pathExists(path))) {
    return {};
  }

  const raw = YAML.parse(fs.readFileSync(path, "utf8"));

  try {
    return DevRegistrySchema.parse(raw);
  } catch (e) {
    throw new Error("Failed to parse packageManifest");
  }
};

export const setDevRegistryEntry = async (repo: string, entry: DevRegistryEntry): Promise<void> => {
  DevRegistryEntrySchema.parse(entry);

  await fs.ensureDir(path.dirname(getDevRegistryPath()));
  const tmpPath = `${getDevRegistryPath()}.tmp`;

  const registry = await readDevRegistry()
  registry[repo] = entry;

  await fs.writeJson(tmpPath, registry, { spaces: 2 });
  await fs.move(tmpPath, getDevRegistryPath(), { overwrite: true });
};

export const removeDevRegistryEntry = async (repo: string): Promise<void> => {
  await fs.ensureDir(path.dirname(getDevRegistryPath()));
  const tmpPath = `${getDevRegistryPath()}.tmp`;

  const registry = await readDevRegistry()
  delete registry[repo];

  await fs.writeJson(tmpPath, registry, { spaces: 2 });
  await fs.move(tmpPath, getDevRegistryPath(), { overwrite: true });
};
