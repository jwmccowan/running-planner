import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy } from "better-auth/plugins";
import { getDb } from "./db";
import { account, session, user, verification } from "./db/schema";
import { assertServerEnv } from "./env";

assertServerEnv();

const isPreview = process.env.VERCEL_ENV === "preview";
const oAuthProxySecret = process.env.OAUTH_PROXY_SECRET;

export const auth = betterAuth({
  // Previews have per-deployment URLs, so accept only this deployment's own hosts.
  // Everywhere else BETTER_AUTH_URL is used.
  ...(isPreview && {
    baseURL: {
      allowedHosts: [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(
        (host): host is string => !!host
      ),
      protocol: "https" as const,
    },
  }),
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [
    // Previews sign in through production's Google callback (Google only allows fixed redirect URLs)
    ...(oAuthProxySecret
      ? [
          oAuthProxy({
            productionURL: `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
            secret: oAuthProxySecret,
          }),
        ]
      : []),
    // Must stay last so it forwards cookies set by every other plugin
    nextCookies(),
  ],
});
