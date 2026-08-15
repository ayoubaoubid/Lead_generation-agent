import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

const repositoryRoot = resolve(import.meta.dirname, "..");
const command = process.argv[2];
const additionalArguments = process.argv.slice(3);
const allowedCommands = new Set(["build", "dev", "start"]);

if (!allowedCommands.has(command)) {
  throw new Error("Expected one of: dev, build, start.");
}

if (process.env.WEB_SKIP_ROOT_ENV === "1") {
  // Public E2E checks must not depend on a hosted Supabase project or local
  // developer secrets inherited by the Playwright web server. The public test
  // values are injected explicitly by Playwright and therefore remain intact.
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.TRIGGER_SECRET_KEY;
} else {
  // Existing process variables keep priority. Loading the local file first
  // gives it precedence over the shared defaults because loadEnvFile never
  // overwrites an existing environment variable.
  for (const filename of [".env.local", ".env"]) {
    const path = resolve(repositoryRoot, filename);
    if (existsSync(path)) loadEnvFile(path);
  }
}

process.argv = [
  process.argv[0],
  process.argv[1],
  command,
  resolve(repositoryRoot, "apps/web"),
  ...additionalArguments,
];

const require = createRequire(import.meta.url);
require(resolve(repositoryRoot, "node_modules/next/dist/bin/next"));
