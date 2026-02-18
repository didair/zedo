import fs from "fs-extra";
import YAML from "yaml";
import path from "path";
import os from "os";
import { ZedoPackageManifestSchema } from "./schema.js";
import { ZodError } from "zod";
import { ZedoPackageManifest } from "../types";

export async function getPackageManifest(dir?: string) {
  const cwd = dir ? dir : process.cwd();
  const manifestPath = path.join(cwd, "zedo.yaml");

  if (!(await fs.pathExists(manifestPath))) {
    throw new Error("No zedo.yaml found in current directory.");
  }

  const raw = fs.readFileSync(manifestPath, "utf8");

  try {
    return parsePackageManifestValidated(raw);
  } catch (err) {
    throw formatZodError("Project zedo.yaml", err);
  }
};

export function parsePackageManifestValidated(yaml: string) {
  const parsed = YAML.parse(yaml)

  try {
    return ZedoPackageManifestSchema.parse(parsed);
  } catch (err) {
    throw formatZodError("Package zedo.yaml", err);
  }
};

function formatZodError(ctx: string, err: unknown): Error {
  if (!(err instanceof ZodError)) return err as Error

  const lines = err.issues.map(issue => {
    const path = issue.path.join(".") || "(root)"
    return `  - ${path}: ${issue.message}`
  });

  return new Error(
    `${ctx} is invalid:\n` +
    lines.join("\n")
  );
};

export function getDevRegistryPath() {
  return path.join(os.homedir(), ".zedo", "dev-registry.json");
};
