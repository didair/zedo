#!/usr/bin/env node
import { installCommand } from "./commands/install.js"

const [, , command, ...args] = process.argv

async function main() {
  switch (command) {
    case "install":
      await installCommand(args)
      break
    default:
      console.error(`Unknown command: ${command}`)
      process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
