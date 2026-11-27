# Implementation Plan

## Steps

| #  | Step                      | Status | Branch / PR |
| -- | ------------------------- | ------ | ----------- |
| 1  | Data model + types        | done   | PR #1       |
| 2  | Calculation functions     | done   | PR #1       |
| 3  | Seed data                 | done   | PR #3       |
| 4  | Read-only plan view       | done   | PR #5       |
| 5  | Editing                   | done   | PR #7       |
| 5a | Activity status           | done   | PR #8       |
| 5b | Undo/redo                 | done   | PR #10      |
| 5c | Multiple plans, prior weeks, drag-to-move | done | PR #11 |
| 5d | Editable block bars       | done   | PR #12      |
| 5e | Plan settings (name, start, length) | done | PR #13 |
| 5f | Home page + New plan      | done   | PR #14, #15 |
| 6a | CI (typecheck, lint, unit tests) | in progress | `chore/ci` |
| 6b | Accounts (Auth.js, Google sign-in) | todo |       |
| 6c | DynamoDB storage + import of local plans | todo |  |
| 6d | Deploy (Vercel + AWS)     | todo   |             |
| 6e | Browser tests (Playwright in CI) | todo |         |
| 7  | Polish (color, layout)    | todo   |             |

## Decisions

- **Persistence**: AWS DynamoDB (not localStorage), on-demand, one table
- **Hosting**: Vercel (Hobby). Connects to AWS via OIDC role, no stored access keys. Separate dev (previews) and prod tables
- **Accounts**: Auth.js with Google sign-in and cookie (JWT) sessions, so no users table. Users only see plans they're a member of
- **Node version**: 22 via mise (required by vitest 4)
- **Gym tracking**: out of scope for v1 — model supports it, UI ignores it
- **Blocks**: user-defined via `blockStarts` (ISO Mondays), edited in an "Edit blocks" mode; cosmetic only (no effect on calculations)
- **Future features to keep in mind**: move workouts, bulk updates, copy/paste, undo (don't design these out)
- **Activity status**: `status?: "completed" | "missed"` on Activity (undefined = pending). Missed activities excluded from all load calculations.

## Next steps: accounts, persistence, deploy (#6)

Goal: cheap to run (~$0 at personal scale) and able to grow into sharing.

### DynamoDB table design

```
PK = PLAN#<planId>   SK = PLAN            → the whole plan (activities inside) + version
PK = USER#<userId>   SK = PLAN#<planId>   → membership: role, plus name/dates for the home list
```

- Home page lists plans with one query on `USER#<userId>`.
- Opening or saving a plan requires a membership item; otherwise 404.
- Sharing later = adding a membership item with `role: "editor" | "viewer"`.
- Saves are conditional on `version`, so a stale tab gets a conflict error instead of overwriting newer edits.
- Plan IDs become UUIDs (numeric IDs are a stopgap from the file store).

### Steps

- **6a CI**: GitHub Actions on every PR and push to main: typecheck, lint, vitest.
- **6b Accounts**: Auth.js + Google. Logged-out visitors see a sign-in screen. Plans get an owner; home and plan pages only show your plans. Still file-based, so auth is tested on its own. Route protection uses Next 16's `proxy` (formerly middleware); follow `node_modules/next/dist/docs/`.
- **6c DynamoDB**: swap the internals of `lib/plan-store.ts` for DynamoDB, add the version check, and a one-off script to import `data/plans/*.json` into your account. Unit tests use an in-memory store.
- **6d Deploy**: Vercel project linked to the repo, AWS OIDC role, dev/prod tables. Previews use dev, production uses prod. Must come after 6c (Vercel's filesystem isn't writable).
- **6e Browser tests**: Playwright tests (from the ad-hoc headless Chrome checks) running in CI, with a test-only sign-in that's disabled in production.

New packages (approved in principle, install when the step starts): `next-auth`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@playwright/test`.
