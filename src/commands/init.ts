import fs from "fs-extra"
import path from "path"
import YAML from "yaml"
import {ZedoPackageManifestSchema, ZedoProjectManifestSchema} from "../core/schema.js"

const PROJECT_SCHEMA_URL = "https://raw.githubusercontent.com/didair/zedo/refs/heads/main/schemas/0.0.1/zedo-project.schema.json"
const PACKAGE_SCHEMA_URL = "https://raw.githubusercontent.com/didair/zedo/refs/heads/main/schemas/0.0.1/zedo-package.schema.json"

export async function initCommand(args: string[]) {
  const type = args[0]

  if (type !== "project" && type !== "package") {
    throw new Error(`Usage: zedo init <project|package>`);
  }

  const targetPath = path.resolve(process.cwd(), "zedo.yaml");

  if (await fs.pathExists(targetPath)) {
    throw new Error("zedo.yaml already exists. Refusing to overwrite.");
  }

  if (type === "project") {
    const manifest = {
      $schema: PROJECT_SCHEMA_URL,
      modulesDir: "modules",
      dependencies: []
    };

    ZedoProjectManifestSchema.parse(manifest);

    await fs.writeFile(targetPath, YAML.stringify(manifest), "utf8");
    console.log("Initialized zedo.yaml for project");
    return;
  }

  if (type === "package") {
    const manifest = {
      $schema: PACKAGE_SCHEMA_URL,
      name: path.basename(process.cwd()),
      version: "0.1.0",
      exports: {},
      dependencies: []
    };

    ZedoPackageManifestSchema.parse(manifest);

    await fs.writeFile(targetPath, YAML.stringify(manifest), "utf8");
    console.log("Initialized zedo.yaml for package");
  }
}
