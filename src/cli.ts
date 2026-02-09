#!/usr/bin/env node
import { installCommand } from "./commands/install.js"
import {outdatedCommand} from "./commands/outdated";
import {updateCommand} from "./commands/update";
import {initCommand} from "./commands/init";

async function main(argv: string[]) {
  const [, , command, ...args] = argv; // TODO: Type this tuple correctly

  switch(command) {
    case "init":
      await initCommand(args);
      break;

    case "install":
      await installCommand()
      break;

    case "outdated":
      await outdatedCommand()
      break;

    case "update":
      await updateCommand()
      break;

    default:
      console.error("Usage: zedo <init|install|outdated|update>")
      process.exit(1)
  }
}

main(process.argv).catch(err => {
  console.error(err)
  process.exit(1)
});
