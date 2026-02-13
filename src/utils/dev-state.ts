import fs from "fs-extra"
import path from "path"
import { z } from "zod";

const DEV_DIR = path.join(process.cwd(), ".zedo")
const DEV_STATE_PATH = path.join(DEV_DIR, "dev.json")
const DEV_MODE_MARKER = path.join(DEV_DIR, "DEV_MODE")

export const DevStateEntrySchema = z.object({
  path: z.string().min(1), // absolute path to local repo
  mountedAt: z.array(z.string().min(1)),
  linkedAt: z.iso.datetime(),
});

export const DevStateSchema = z.object({
  linked: z.record(z.string().min(1), DevStateEntrySchema),
});

export type DevState = z.infer<typeof DevStateSchema>;
export type DevStateEntry = z.infer<typeof DevStateEntrySchema>;

export async function readDevState(): Promise<DevState> {
  if (!(await fs.pathExists(DEV_STATE_PATH))) {
    return { linked: {} };
  }
  const raw = await fs.readJson(DEV_STATE_PATH);
  return DevStateSchema.parse(raw);
};

export async function writeDevState(state: DevState) {
  DevStateSchema.parse(state);
  await fs.ensureDir(DEV_DIR);

  const tmp = `${DEV_STATE_PATH}.tmp`;
  await fs.writeJson(tmp, state, { spaces: 2 });
  await fs.move(tmp, DEV_STATE_PATH, { overwrite: true });

  fs.writeFile(DEV_MODE_MARKER, "ZEDO DEV MODE ACTIVE\n", () => null);
};

export async function clearDevState() {
  await fs.remove(DEV_STATE_PATH);
  await fs.remove(DEV_MODE_MARKER);
};

export async function isDevModeActive(): Promise<boolean> {
  return fs.pathExists(DEV_MODE_MARKER);
};
