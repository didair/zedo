import { execa } from "execa"

export async function gitLsRemoteTags(repoUrl: string): Promise<string> {
  const { stdout } = await execa("git", ["ls-remote", "--tags", repoUrl])
  return stdout
}

export async function gitArchiveFile(
  repoUrl: string,
  tag: string,
  filePath: string
): Promise<Buffer> {
  const { stdout } = await execa("git", [
    "archive",
    `--remote=${repoUrl}`,
    tag,
    filePath
  ], { encoding: null })

  return stdout as Buffer
}
