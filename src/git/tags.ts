import semver from "semver"

export function parseTags(output: string): string[] {
  return output
    .split("\n")
    .map(line => line.split("refs/tags/")[1])
    .filter(Boolean)
    .map(tag => tag.replace(/\^\{\}$/, ""))
    .map(tag => semver.clean(tag))
    .filter((v): v is string => Boolean(v));
}

export function pickLatestMatching(tags: string[], range: string = ""): string {
  const sorted = tags.sort(semver.rcompare);
  const match = sorted.find(t => semver.satisfies(t, range));
  if (!match) throw new Error(`No tag matches ${range}`);
  return match;
};
