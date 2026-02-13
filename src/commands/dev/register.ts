import { getPackageManifest } from "../../core/config";
import { setDevRegistryEntry } from "../../core/registries";

export async function devRegisterCommand() {
  const cwd = process.cwd();
  const pkg = await getPackageManifest();

  await setDevRegistryEntry(pkg.name, {
    path: cwd,
    registeredAt: new Date().toISOString(),
  });

  console.log(`Registered ${pkg.name} → ${cwd}`);
};
