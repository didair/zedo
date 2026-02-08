#!/usr/bin/env node
import path from "path";
import os from "os";
import fs from "fs-extra";
import { execa } from "execa";
import YAML from "yaml";
import semver from "semver";

//#region src/core/config.ts
async function readProjectManifest() {
	const raw = await fs.readFile("zedo.yaml", "utf8");
	return YAML.parse(raw);
}
async function readPackageManifestFromBuffer(yaml) {
	return YAML.parse(yaml);
}

//#endregion
//#region src/git/client.ts
async function gitLsRemoteTags(repoUrl) {
	const { stdout } = await execa("git", [
		"ls-remote",
		"--tags",
		repoUrl
	]);
	return stdout;
}
async function gitArchiveFile(repoUrl, tag, filePath) {
	const { stdout } = await execa("git", [
		"archive",
		`--remote=${repoUrl}`,
		tag,
		filePath
	], { encoding: null });
	return stdout;
}

//#endregion
//#region src/git/tags.ts
function parseTags(output) {
	return output.split("\n").map((line) => line.split("refs/tags/")[1]).filter(Boolean).map((tag) => tag.replace(/\^\{\}$/, "")).map((tag) => semver.clean(tag)).filter((v) => Boolean(v));
}
function pickLatestMatching(tags, range) {
	const match = tags.sort(semver.rcompare).find((t) => semver.satisfies(t, range));
	if (!match) throw new Error(`No tag matches ${range}`);
	return match;
}

//#endregion
//#region src/core/mounts.ts
function resolveMounts(projectRoot, pkg, dep) {
	if (!pkg.exports || Object.keys(pkg.exports).length === 0) return [];
	if (!dep.mounts || Object.keys(dep.mounts).length === 0) return [];
	const resolved = [];
	const usedTargets = /* @__PURE__ */ new Set();
	for (const [exportName, targetRel] of Object.entries(dep.mounts)) {
		const exp = pkg.exports[exportName];
		if (!exp) throw new Error(`Package "${pkg.name}" does not export "${exportName}". Available exports: ${Object.keys(pkg.exports).join(", ")}`);
		if (path.isAbsolute(targetRel)) throw new Error(`Mount target must be relative: ${targetRel}`);
		const targetAbs = path.resolve(projectRoot, targetRel);
		if (!targetAbs.startsWith(projectRoot)) throw new Error(`Mount target escapes project root: ${targetRel}`);
		if (usedTargets.has(targetAbs)) throw new Error(`Mount collision: multiple exports target "${targetRel}"`);
		usedTargets.add(targetAbs);
		resolved.push({
			exportName,
			sourcePath: exp.source,
			targetPath: targetAbs
		});
	}
	return resolved;
}

//#endregion
//#region src/core/installer.ts
async function installResolvedMounts(repoTempDir, mounts) {
	for (const mount of mounts) {
		const from = path.join(repoTempDir, mount.sourcePath);
		const to = mount.targetPath;
		if (!await fs.pathExists(from)) throw new Error(`Export source does not exist: ${mount.sourcePath}`);
		await fs.remove(to);
		await fs.ensureDir(path.dirname(to));
		await fs.copy(from, to);
	}
}

//#endregion
//#region src/commands/install.ts
async function installCommand() {
	const project = await readProjectManifest();
	const projectRoot = process.cwd();
	for (const dep of project.dependencies) {
		const repoUrl = normalizeRepo(dep.repo);
		const tag = pickLatestMatching(parseTags(await gitLsRemoteTags(repoUrl)), dep.version);
		const pkg = await readPackageManifestFromBuffer((await gitArchiveFile(repoUrl, tag, "zedo.yaml")).toString());
		if (pkg.version !== tag.replace(/^v/, "")) throw new Error(`Version mismatch: tag ${tag} ≠ manifest ${pkg.version} in ${pkg.name}`);
		const mounts = resolveMounts(projectRoot, pkg, dep);
		if (mounts.length === 0) {
			console.warn(`No mounts configured for ${pkg.name}, skipping.`);
			continue;
		}
		const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "zedo-"));
		await execa("git", [
			"clone",
			"--depth=1",
			"--branch",
			tag,
			repoUrl,
			tmp
		]);
		await installResolvedMounts(tmp, mounts);
	}
}
function normalizeRepo(input) {
	if (!input.includes("://") && !input.includes("git@")) return `https://github.com/${input}.git`;
	return input;
}

//#endregion
//#region src/cli.ts
const [, , command, ...args] = process.argv;
async function main() {
	switch (command) {
		case "install":
			await installCommand(args);
			break;
		default:
			console.error(`Unknown command: ${command}`);
			process.exit(1);
	}
}
main().catch((err) => {
	console.error(err);
	process.exit(1);
});

//#endregion
export {  };