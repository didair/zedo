import fs from "fs-extra"
import path from "path"
import YAML from "yaml"
import { readDevState } from "../../utils/dev-state";

interface ComposeFile {
  version?: string
  services?: Record<
    string,
    {
      volumes?: Array<string | { type?: string; source?: string; target?: string }>
      [key: string]: unknown
    }
  >
  [key: string]: unknown
}

export async function dockerComposeMountLinksCommand(opts?: {
  service?: string
  file?: string
}) {
  const serviceName = opts?.service ?? "app";
  const composePath = path.resolve(process.cwd(), opts?.file ?? "docker-compose.override.yml");

  const state = await readDevState();
  const links = Object.values(state.linked);

  if (links.length === 0) {
    console.log("No dev links found. Nothing to mount.");
    return;
  }

  let compose: ComposeFile = {};

  if (await fs.pathExists(composePath)) {
    const raw = await fs.readFile(composePath, "utf8");
    compose = YAML.parse(raw) ?? {};
  }

  compose.services ??= {};
  compose.services[serviceName] ??= {};
  compose.services[serviceName]!.volumes ??= [];

  const volumes = new Set<string>(
    (compose.services[serviceName]!.volumes as Array<string>).filter(v => typeof v === "string")
  );

  for (const entry of links) {
    const hostPath = entry.path;
    const mount = `${hostPath}:${hostPath}`;

    volumes.add(mount);
  }

  compose.services[serviceName]!.volumes = Array.from(volumes);

  await fs.ensureDir(path.dirname(composePath));
  const doc = new YAML.Document(compose as any);
  const yaml = doc.toString({ indent: 2, lineWidth: 0 });

  const tmp = `${composePath}.tmp`;
  fs.writeFile(tmp, yaml, () => null);
  await fs.move(tmp, composePath, { overwrite: true });

  console.log(`Updated ${path.basename(composePath)}`);
  console.log(`Mounted ${links.length} dev-linked path(s) into service "${serviceName}".`);
  console.log("");
  console.log("Restart your containers for changes to take effect");
}
