import { defineConfig, devices } from "@playwright/test";
import { e2e } from "./e2e/support/env";

export default defineConfig({
  testDir: "./e2e",
  testMatch: /.*\.e2e\.ts/,
  // One worker: tests share the e2e database (each uses its own users, so order doesn't matter)
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  globalSetup: "./e2e/support/global-setup.ts",
  use: {
    baseURL: e2e.baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start --port 3100",
    url: `${e2e.baseURL}/sign-in`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: e2e.serverEnv,
  },
});
