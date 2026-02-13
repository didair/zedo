
export function normalizeRepo(input: string): string {
  if (input.includes("://") || input.includes("git@")) return input;
  return `git@github.com:${input}.git`;
};
