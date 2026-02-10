import { execa } from "execa"
import fs from "fs-extra"

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
