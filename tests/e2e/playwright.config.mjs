import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: process.env.CI ? undefined : "msedge",
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    cwd: path.resolve(import.meta.dirname, "../.."),
    env: {
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "e2e-unavailable",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:9",
      WEB_SKIP_ROOT_ENV: "1",
    },
    url: "http://localhost:3000/auth/sign-in",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
