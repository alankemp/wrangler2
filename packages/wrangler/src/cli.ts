import "dotenv/config"; // Grab locally specified env params from a `.env` file.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { execaNode } from "execa";
import { findUpSync, pathExistsSync, findUpStop } from "find-up";
import isInstalledGlobally from "is-installed-globally";
import { hideBin } from "yargs/helpers";
import { FatalError } from "./errors";
import { parsePackageJSON } from "./parse";
import { main } from ".";

function getLocalInstall() {
  // check for package.json
  console.log("checking package json");
  const packageJsonPath = path.resolve("package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.log("package.json doesn't exist");
    return false;
  }

  console.log("package json exists");

  // check for "wrangler" in package.json
  console.log("checking for wrangler in package json");
  try {
    const { dependencies, devDependencies } = parsePackageJSON(
      fs.readFileSync(packageJsonPath, { encoding: "utf-8" }),
      packageJsonPath
    );
    console.log("parsed package json");
    const isDependency = "wrangler" in (dependencies ?? {});
    const isDevDependency = "wrangler" in (devDependencies ?? {});
    if (!isDependency && !isDevDependency) {
      return false;
    }
  } catch (e) {
    console.log("failed to parse package json");
    // failed to parse package.json
    return false;
  }

  // check for local install
  console.log("checking for local install");
  const wranglerPath = findUpSync((directory) => {
    if (directory === os.homedir()) {
      return findUpStop;
    }

    const maybeWranglerPath = path.join(
      directory,
      "node_modules",
      ".bin",
      "wrangler"
    );

    if (pathExistsSync(maybeWranglerPath)) {
      return maybeWranglerPath;
    }
  });

  return wranglerPath === undefined ? false : wranglerPath;
}

console.log(__dirname);
console.log(`is installed globally: ${isInstalledGlobally}`);

const shouldDelegate = isInstalledGlobally && getLocalInstall();

(shouldDelegate
  ? execaNode(shouldDelegate, process.argv)
  : main(hideBin(process.argv))
).catch((e) => {
  // The logging of any error that was thrown from `main()` is handled in the `yargs.fail()` handler.
  // Here we just want to ensure that the process exits with a non-zero code.
  // We don't want to do this inside the `main()` function, since that would kill the process when running our tests.
  const exitCode = (e instanceof FatalError && e.code) || 1;
  process.exit(exitCode);
});
