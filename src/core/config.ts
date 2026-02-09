import fs from "fs-extra";
import YAML from "yaml";
import { ZedoPackageManifestSchema, ZedoProjectManifestSchema } from "./schema.js";
import { ZodError } from "zod";

export async function readProjectManifestValidated() {
  const raw = await fs.readFile("zedo.yaml", "utf8");
  const parsed = YAML.parse(raw);

  try {
    return ZedoProjectManifestSchema.parse(parsed);
  } catch (err) {
    throw formatZodError("Project zedo.yaml", err);
  }
}

export function parsePackageManifestValidated(yaml: string) {
  const parsed = YAML.parse(yaml)

  try {
    return ZedoPackageManifestSchema.parse(parsed)
  } catch (err) {
    throw formatZodError("Package zedo.yaml", err)
  }
}

function formatZodError(ctx: string, err: unknown): Error {
  if (!(err instanceof ZodError)) return err as Error

  const lines = err.issues.map(issue => {
    const path = issue.path.join(".") || "(root)"
    return `  - ${path}: ${issue.message}`
  })

  return new Error(
    `${ctx} is invalid:\n` +
    lines.join("\n")
  )
}
