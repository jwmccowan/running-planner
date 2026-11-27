// Fails fast with a clear message when required configuration is missing (see .env.example)
const REQUIRED = ["DATABASE_URL", "BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] as const;

export function assertServerEnv(): void {
  const missing: string[] = REQUIRED.filter((name) => !process.env[name]);
  if (process.env.VERCEL_ENV !== "preview" && !process.env.BETTER_AUTH_URL) missing.push("BETTER_AUTH_URL");
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}. See .env.example.`);
  }
}
