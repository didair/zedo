import path from "path"
import fs from "fs-extra"
import { clearDevState, readDevState } from "../../utils/dev-state";
import { gitCloneAtTag, gitLsRemoteTags } from "../../git/client";
import { parsePackageManifestValidated, getPackageManifest } from "../../core/config.js"
import { resolveMounts } from "../../core/mounts";
import { parseTags, pickLatestMatching } from "../../git/tags";
import { installResolvedMounts } from "../../core/installer";
import { writeInstalledMeta } from "../../core/installed";
import { normalizeRepo } from "../../git/repo";

export async function devRestoreCommand() {
  const state = await readDevState();
  const linked = Object.keys(state.linked);

  if (linked.length === 0) {
    console.log("No dev links to restore.");
    return;
  }

  const project = await getPackageManifest();
  const projectRoot = process.cwd();

  for (const repo of linked) {
    const dep = project.dependencies?.find(d => d.name === repo);
    if (!dep) continue;

    const repoUrl = normalizeRepo(dep.repo);
    const depInstallDir = path.join(projectRoot, "zedo-modules", dep.repo);

    const tagsRaw = await gitLsRemoteTags(repoUrl);
    const tags = parseTags(tagsRaw);
    const tag = pickLatestMatching(tags, dep.version);

    await gitCloneAtTag(repoUrl, tag, depInstallDir);

    const manifestRaw = fs.readFileSync(path.join(depInstallDir, "zedo.yaml"), "utf8");
    const pkg = parsePackageManifestValidated(manifestRaw);

    const mounts = resolveMounts(projectRoot, pkg, dep, project.packagePrefix);

    await installResolvedMounts(depInstallDir, mounts);

    for (const m of mounts) {
      await writeInstalledMeta(m.targetPath, {
        repo: dep.repo,
        tag,
        version: tag,
        installedAt: new Date().toISOString()
      });
    }

    console.log(`Restored ${repo} to version ${tag}`);
  }

  await clearDevState();
  console.log("");
  console.log("Dev mode disabled. Project restored to contract state.");
};
