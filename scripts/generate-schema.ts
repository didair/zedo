import fs from "fs-extra";
import path from "path";
import z from "zod";
import { fileURLToPath } from "url";
import {ZedoPackageManifestSchema, ZedoProjectManifestSchema} from "../src/core/schema.js";
import pkg from "../package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const version = pkg.version
  const outDir = path.resolve(__dirname, "../schemas", version)

  await fs.ensureDir(outDir)

  const jsonProjectSchema = z.toJSONSchema(ZedoProjectManifestSchema);
  const projectPath = path.join(outDir, "zedo-project.schema.json");
  await fs.writeJson(projectPath, jsonProjectSchema, { spaces: 2 });

  console.log(`Generated schema: schemas/${version}/zedo-project.schema.json`);

  const jsonPackageSchema = z.toJSONSchema(ZedoPackageManifestSchema);
  const packagePath = path.join(outDir, "zedo-package.schema.json");
  await fs.writeJson(packagePath, jsonPackageSchema, { spaces: 2 });

  console.log(`Generated schema: schemas/${version}/zedo-package.schema.json`);
}

main().catch(err => {
  console.error(err)
  process.exit(1)
});
