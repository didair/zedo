import { clearDevState, readDevState } from "../../utils/dev-state";
import { getMatchingDependencyTag, installDependencyAtTag } from "../../git/client";
import { getPackageManifest } from "../../core/config.js"
import { ZedoPackageDependency } from "../../types";

export async function devRestoreCommand() {
  const state = await readDevState();
  const linked = Object.keys(state.linked);

  if (linked.length === 0) {
    console.log("No dev links to restore.");
    return;
  }

  const project = await getPackageManifest();

  for (const repo of linked) {
    const dep = project.dependencies?.find(d => d.name === repo);
    if (!dep) continue;

    const tag = await getMatchingDependencyTag(dep as ZedoPackageDependency);
    await installDependencyAtTag(dep as ZedoPackageDependency, tag);

    console.log(`Restored ${repo} to version ${tag}`);
  }

  await clearDevState();
  console.log("");
  console.log("Dev mode disabled. Project restored to contract state.");
};
