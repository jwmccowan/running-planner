# Implementation Plan

## Steps

| #  | Step                      | Status | Branch / PR |
| -- | ------------------------- | ------ | ----------- |
| 1  | Data model + types        | done   | PR #1       |
| 2  | Calculation functions     | done   | PR #1       |
| 3  | Seed data                 | done   | PR #3       |
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

## Next step: Read-only plan view (#4)

Render the seed data as a weekly calendar grid with stats. Reference the prototype screenshot for layout:

- Left panel: week summary (date range, chronic distance, ideal acute range, acute distance with % change, percent easy)
- Right grid: Mon–Sun columns, each cell showing the day's activities with distance and % of weekly total
- 4-week block separators
- Color coding: green/red for acute distance in/out of range, green/red for percent easy above/below 80%

Seed data is in `lib/seed-data.ts`. Calculations are in `lib/calculations.ts`. Use those directly — no API layer yet.
