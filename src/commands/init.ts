import fs from "fs-extra"
import path from "path"
import YAML from "yaml"
import { ZedoPackageManifestSchema } from "../core/schema.js"

const PACKAGE_SCHEMA_URL = "https://raw.githubusercontent.com/didair/zedo/refs/heads/main/schemas/0.0.2/zedo-package.schema.json"

export async function initCommand(args: string[]) {
  const type = args[0]

  if (type !== "package") {
    throw new Error(`Usage: zedo init package`);
  }

  const targetPath = path.resolve(process.cwd(), "zedo.yaml");

  if (await fs.pathExists(targetPath)) {
    throw new Error("zedo.yaml already exists. Refusing to overwrite.");
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

    fs.writeFile(targetPath, YAML.stringify(manifest), () => null);
    console.log("Initialized zedo.yaml for package");
  }
}
