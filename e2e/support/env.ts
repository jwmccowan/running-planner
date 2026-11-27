// Settings for the app under test. The e2e database is emptied before every run.
const databaseUrl = process.env.E2E_DATABASE_URL ?? "postgres://localhost:5432/running_planner_test";

if (!new URL(databaseUrl).pathname.includes("test")) {
  throw new Error(`E2E_DATABASE_URL must point at a database with "test" in its name (got ${new URL(databaseUrl).pathname})`);
}

const baseURL = "http://localhost:3100";
const authSecret = "e2e-only-secret-never-used-outside-tests-0123456789";

export const e2e = {
  baseURL,
  databaseUrl,
  authSecret,
  maxPlansPerUser: 2,
  serverEnv: {
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: authSecret,
    BETTER_AUTH_URL: baseURL,
    GOOGLE_CLIENT_ID: "e2e-placeholder",
    GOOGLE_CLIENT_SECRET: "e2e-placeholder",
    MAX_PLANS_PER_USER: "2",
  },
};
