#!/usr/bin/env node
import { installCommand } from "./commands/install.js"
import { outdatedCommand } from "./commands/outdated";
import { updateCommand } from "./commands/update";
import { initCommand } from "./commands/init";
import { devRegisterCommand } from "./commands/dev/register";
import { devLinkCommand } from "./commands/dev/link";
import { devRestoreCommand } from "./commands/dev/restore";
import { doctorDevCommand } from "./commands/doctor/dev";
import { dockerComposeMountLinksCommand } from "./commands/docker-compose/mount-links";
import {dockerComposeUnmountLinksCommand} from "./commands/docker-compose/unmount-links";

async function main(argv: string[]) {
  const [, , command, ...args] = argv; // TODO: Type this tuple correctly

  switch(command) {
    case "init":
      await initCommand(args);
      break;

    case "install":
      await installCommand();
      break;

    case "outdated":
      await outdatedCommand();
      break;

    case "update":
      await updateCommand({
        apply: argv.includes("apply"),
      });
      break;

    case "dev": {
      const [subcommand, param] = args;

      switch(subcommand) {
        case "register":
          await devRegisterCommand();
          break;

        case "link":
          await devLinkCommand(param);
          break;

        case "restore":
          await devRestoreCommand();
          break;

        default:
          console.error("Usage: zedo dev <register|link|restore>");
          process.exit(1);
      }

      break;
    }

    case "doctor": {
      const [subcommand] = args;

      switch(subcommand) {
        case "dev":
          await doctorDevCommand();
          break;

        default:
          console.error("Usage: zedo doctor <dev>");
          process.exit(1);
      }
      break;
    }

    case "docker-compose": {
      const [subcommand] = args;
      const serviceFlagIndex = args.indexOf("--service");
      const fileFlagIndex = args.indexOf("--file");
      const service = serviceFlagIndex !== -1 ? args[serviceFlagIndex + 1] : undefined;
      const file = fileFlagIndex !== -1 ? args[fileFlagIndex + 1] : undefined;

      switch(subcommand) {
        case "mount-links":
          await dockerComposeMountLinksCommand({ service, file });
          break;

        case "unmount-links":
          await dockerComposeUnmountLinksCommand({ service, file });
          break;

        default:
          console.error("Usage: zedo docker-compose <mount-links|unmount-links> [--service <name>] [--file <path>]");
          process.exit(1)
      }

      break;
    }

    default:
      console.error("Usage: zedo <init|install|update|doctor|dev|outdated>");
      process.exit(1);
  }
}

main(process.argv).catch(err => {
  console.error(err);
  process.exit(1);
});
