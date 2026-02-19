import fs from "fs-extra"
import path from "path"
import YAML from "yaml"
import { readDevState } from "../../utils/dev-state";

interface ComposeFile {
  services?: Record<
    string,
    {
      volumes?: Array<string | { type?: string; source?: string; target?: string }>
      [key: string]: unknown
    }
  >
  [key: string]: unknown
}

export async function dockerComposeUnmountLinksCommand(opts?: {
  service?: string
  file?: string
}) {
  const serviceName = opts?.service ?? "app";
  const composePath = path.resolve(process.cwd(), opts?.file ?? "docker-compose.override.yml");

  const state = await readDevState();
  const links = Object.values(state.linked);

  if (links.length === 0) {
    console.log("No dev links found. Nothing to unmount.");
    return;
  }

  if (!(await fs.pathExists(composePath))) {
    console.log("No docker-compose override file found. Nothing to unmount.");
    return;
  }

  const raw = fs.readFileSync(composePath, "utf8");
  const compose: ComposeFile = YAML.parse(raw) ?? {};

  const service = compose.services?.[serviceName];
  if (!service?.volumes || service.volumes.length === 0) {
    console.log(`No volumes configured for service "${serviceName}". Nothing to unmount.`);
    return;
  }

  const devPaths = new Set(links.map(l => `${l.path}:${l.path}`));

  const before = service.volumes.length;

  service.volumes = service.volumes.filter(v => {
    if (typeof v !== "string") return true;
    return !devPaths.has(v);
  });

  const removed = before - service.volumes.length;

  if (removed === 0) {
    console.log("No dev link mounts found in override file.");
    return
  }

  await fs.ensureDir(path.dirname(composePath));

  const doc = new YAML.Document(compose as any);
  const yaml = doc.toString({ indent: 2, lineWidth: 0 });

  const tmp = `${composePath}.tmp`;
  fs.writeFile(tmp, yaml, () => null);
  await fs.move(tmp, composePath, { overwrite: true });

  console.log(`Removed ${removed} dev link mount(s) from ${path.basename(composePath)}.`);
  console.log("")
  console.log("Restart your containers for changes to take effect");
}
