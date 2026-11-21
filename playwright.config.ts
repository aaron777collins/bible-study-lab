import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}/bible-study-lab/`, trace: "retain-on-failure", reducedMotion: "reduce" },
  webServer: { command: `npx vite preview --port ${PORT} --strictPort`, url: `http://localhost:${PORT}/bible-study-lab/`, reuseExistingServer: !process.env.CI, timeout: 60_000 },
  projects: [
    { name: "smoke", testMatch: /smoke\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "chromium", testIgnore: /smoke\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "iphone", testIgnore: /(smoke|offline)\.spec\.ts/, use: { ...devices["iPhone 15"] } },
  ],
});
