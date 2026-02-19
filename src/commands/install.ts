import path from "path";
import fs from "fs-extra";

import { getPackageManifest } from "../core/config.js";
import {getMatchingDependencyTag, installDependencyAtTag} from "../git/client.js";
import { isDevModeActive, readDevState } from "../utils/dev-state";
import { ZedoPackageDependency } from "../types";

export async function installCommand() {
  const project = await getPackageManifest();
  const projectRoot = process.cwd();
  const devModeActive = await isDevModeActive();

  if (devModeActive) {
    console.warn("⚠  Zedo dev-mode is active. Run `zedo dev restore` to return to contract state.");
  }

  fs.mkdir(path.join(projectRoot, "zedo-modules"), () => null);

  for (const dep of project.dependencies) {
    if (devModeActive) {
      const devState = await readDevState();
      if (Object.keys(devState.linked).includes(dep.name)) {
        continue;
      }
    }

    const tag = await getMatchingDependencyTag(dep as ZedoPackageDependency);
    await installDependencyAtTag(dep as ZedoPackageDependency, tag);
  }
};
