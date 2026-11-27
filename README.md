This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local development

1. **Postgres.** Run Postgres however you like and create a database, e.g.
   - Homebrew: `brew install postgresql@17 && brew services start postgresql@17 && createdb running_planner`
   - Docker: `docker run -d --name running-planner-pg -p 5432:5432 -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=running_planner postgres:17`
2. **Config.** `cp .env.example .env.local` and set `DATABASE_URL`.
3. **Install and migrate.** `pnpm install`, then `pnpm db:migrate`.
4. **Import existing plan files** (optional): `pnpm db:import` loads `data/plans/*.json`, keeping their IDs.
5. **Run.** `pnpm dev` and open [http://localhost:3000](http://localhost:3000).

| Command | What it does |
| --- | --- |
| `pnpm test` | Unit and storage tests. Storage tests run on PGlite (in-process Postgres), so no database is needed |
| `pnpm lint`, `pnpm exec tsc --noEmit` | Lint and typecheck (also run in CI) |
| `pnpm db:generate` | Create a migration in `drizzle/` after changing `lib/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations to `DATABASE_URL` |
| `pnpm db:import [files]` | Import plan JSON files into the database |

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
