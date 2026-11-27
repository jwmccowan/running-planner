This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local development

1. **Postgres.** Run Postgres however you like and create a database, e.g.
   - Homebrew: `brew install postgresql@17 && brew services start postgresql@17 && createdb running_planner`
   - Docker: `docker run -d --name running-planner-pg -p 5432:5432 -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=running_planner postgres:17`
2. **Config.** `cp .env.example .env.local` and fill it in: `DATABASE_URL`, a `BETTER_AUTH_SECRET` (`openssl rand -base64 32`), and a Google OAuth client (redirect URI `http://localhost:3000/api/auth/callback/google`).
3. **Install and migrate.** `pnpm install`, then `pnpm db:migrate`.
4. **Import existing plan files** (optional): `pnpm db:import` loads `data/plans/*.json`, keeping their IDs. Imported plans have no owner until you sign in once and run `pnpm db:claim <your-email>`.
5. **Run.** `pnpm dev` and open [http://localhost:3000](http://localhost:3000).

| Command | What it does |
| --- | --- |
| `pnpm test` | Unit and storage tests. Storage tests run on PGlite (in-process Postgres), so no database is needed |
| `pnpm lint`, `pnpm exec tsc --noEmit` | Lint and typecheck (also run in CI) |
| `pnpm db:generate` | Create a migration in `drizzle/` after changing `lib/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` |
| `pnpm db:import [files]` | Import plan JSON files into the database |
| `pnpm db:claim <email> [ids]` | Give unowned plans to a user (who has signed in once) |

## Deployment

Hosted on Vercel with Neon Postgres (Sydney, `syd1`). `vercel.json` runs `pnpm db:migrate && pnpm build`, so each deploy migrates its own database first: production for `main`, and a Neon branch per preview deploy.

| Variable | Production | Preview |
| --- | --- | --- |
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | set by the Neon integration | set by the Neon integration (per branch) |
| `BETTER_AUTH_SECRET` | its own value | a different value |
| `BETTER_AUTH_URL` | production URL | not set (previews accept their own Vercel hostnames) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | production Google client | same client |
| `OAUTH_PROXY_SECRET` | shared value | same value |
| `ENABLE_EXPERIMENTAL_COREPACK` | `1` | `1` |
| `MAX_PLANS_PER_USER` | optional | optional |

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
