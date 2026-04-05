# Implementation Plan

## Steps

| #  | Step                      | Status | Branch / PR |
| -- | ------------------------- | ------ | ----------- |
| 1  | Data model + types        | done   | PR #1       |
| 2  | Calculation functions     | done   | PR #1       |
| 3  | Seed data                 | todo   |             |
| 4  | Read-only plan view       | todo   |             |
| 5  | Editing                   | todo   |             |
| 6  | DynamoDB persistence      | todo   |             |
| 7  | Polish (color, layout)    | todo   |             |

## Decisions

- **Persistence**: AWS DynamoDB (not localStorage)
- **Node version**: 22 via mise (required by vitest 4)
- **Gym tracking**: out of scope for v1 — model supports it, UI ignores it
- **Blocks**: 4-week visual grouping, cosmetic only in v1
- **Future features to keep in mind**: move workouts, bulk updates, copy/paste, undo (don't design these out)

## Next step: Seed data (#3)

Transcribe the user's existing spreadsheet into a JSON fixture that matches the `Activity[]` type. This serves two purposes:

1. Real data to develop the UI against
2. Validates the data model handles real-world plans

The spreadsheet covers weeks 1–24 (Feb 9 – Jul 20). Key patterns:
- Each week has 2–5 running activities across different days
- Some days combine gym + run (these become separate activities)
- Run types: easy run, long run, parkrun
- Parkrun (5km) has `intenseDistance: 5` — it's raced. All other runs have `intenseDistance: 0`
- Weekly totals range from 15km to 60km
- 4-week blocks with a deload week (lower volume) at the end of each block

After seed data, step 4 is the read-only plan view — the first visible output.
