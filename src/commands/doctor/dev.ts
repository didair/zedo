import fs from "fs-extra"
import { readDevState } from "../../utils/dev-state";

export async function doctorDevCommand() {
  const state = await readDevState();
  const linked = Object.entries(state.linked);

  if (linked.length === 0) {
    console.log("No dev links detected in this project.");
    return;
  }

  const isDocker = await fs.pathExists("/.dockerenv");

  console.log("Dev links detected:");
  for (const [repo, entry] of linked) {
    console.log(`  ${repo} → ${entry.path}`);
  }

  if (!isDocker) {
    console.log("\nDocker not detected. Dev links look OK.");
    return;
  }

  console.log("\nDocker detected. Verifying dev link paths are visible inside container...\n");

  let hasIssues = false

  for (const [repo, entry] of linked) {
    const existsInContainer = await fs.pathExists(entry.path)

    if (!existsInContainer) {
      hasIssues = true
      console.error(`❌ ${repo}`)
      console.error(`   Path not visible in container: ${entry.path}`);
      console.error(`   Add this volume mount:`);
      console.error(`     - ${entry.path}:${entry.path}`);
      console.error(`   Or by running (is using docker-compose):`);
      console.error(`   zedo docker-compose mount-links --service <service>`);
      console.error("");
    } else {
      console.log(`✅ ${repo} path is visible`);
    }
  }

  if (hasIssues) {
    console.error("\nDev-mode is misconfigured for Docker.");
    console.error("Fix the volume mounts above and restart the container.");
    process.exitCode = 1;
  } else {
    console.log("\nAll dev links are correctly mounted into Docker.");
  }
}
