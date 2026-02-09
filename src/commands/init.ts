import fs from "fs-extra"
import path from "path"
import YAML from "yaml"
import { ZedoProjectManifestSchema } from "../core/schema.js"

export async function initCommand() {
  const targetPath = path.resolve(process.cwd(), "zedo.yaml");

  const exists = await fs.pathExists(targetPath);
  if (exists) {
    throw new Error("zedo.yaml already exists. Refusing to overwrite.");
  }

  const manifest = {
    modulesDir: "modules",
    dependencies: []
  };

  // Validate against schema to guarantee correctness
  ZedoProjectManifestSchema.parse(manifest);

  const yaml = YAML.stringify(manifest);

  await fs.writeFile(targetPath, yaml, "utf8");

  console.log("Initialized zedo.yaml")
}
