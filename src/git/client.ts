import { execa } from "execa"
import fs from "fs-extra"
import { ZedoPackageDependency } from "../types";
import path from "path";
import { getPackageManifest, parsePackageManifestValidated } from "../core/config";
import { resolveMounts } from "../core/mounts";
import { installResolvedMounts } from "../core/installer";
import { writeInstalledMeta } from "../core/installed";
import { normalizeRepo } from "./repo";
import {parseTags, pickLatestMatching} from "./tags";

export async function gitLsRemoteTags(repoUrl: string): Promise<string> {
  const { stdout } = await execa("git", ["ls-remote", "--tags", repoUrl])
  return stdout
}

export async function gitCloneAtTag(repoUrl: string, tag: string, dest: string) {
  await fs.remove(dest);

  try {
    await execa("git", ["clone", "--filter=blob:none", repoUrl, dest]);
    await execa("git", ["-C", dest, "checkout", tag]);
  } catch (err) {
    throw new Error(
      `Failed to clone ${repoUrl} at tag ${tag}.\n` +
      `Ensure the tag exists and you have access.\n\n` +
      String(err)
    )
  }
};

export async function installDependencyAtTag(dependency: ZedoPackageDependency, tag: string) {
  const project = await getPackageManifest();
  const projectRoot = process.cwd();
  const depInstallDir = path.join(projectRoot, "zedo-modules", dependency.repo);
  const repoUrl = normalizeRepo(dependency.repo);

  await gitCloneAtTag(repoUrl, tag, depInstallDir);

  const manifestRaw = fs.readFileSync(path.join(depInstallDir, "zedo.yaml"), "utf8");
  const pkg = parsePackageManifestValidated(manifestRaw);

  const mounts = resolveMounts(projectRoot, pkg, dependency, project.packagePrefix);

  await installResolvedMounts(depInstallDir, mounts);

  for (const m of mounts) {
    await writeInstalledMeta(m.targetPath, {
      repo: dependency.repo,
      tag,
      version: tag,
      installedAt: new Date().toISOString()
    });
  }
};

export async function getLatestDependencyTag(dependency: ZedoPackageDependency) {
  const repoUrl = normalizeRepo(dependency.repo);
  const tagsRaw = await gitLsRemoteTags(repoUrl);
  const tags = parseTags(tagsRaw);
  return pickLatestMatching(tags);
};

export async function getMatchingDependencyTag(dependency: ZedoPackageDependency) {
  const repoUrl = normalizeRepo(dependency.repo);
  const tagsRaw = await gitLsRemoteTags(repoUrl);
  const tags = parseTags(tagsRaw);
  return pickLatestMatching(tags, dependency.version);
};
