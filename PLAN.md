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
| 6  | DynamoDB persistence      | todo   |             |
| 7  | Polish (color, layout)    | todo   |             |

## Decisions

- **Persistence**: AWS DynamoDB (not localStorage)
- **Node version**: 22 via mise (required by vitest 4)
- **Gym tracking**: out of scope for v1 — model supports it, UI ignores it
- **Blocks**: 4-week visual grouping, cosmetic only in v1
- **Future features to keep in mind**: move workouts, bulk updates, copy/paste, undo (don't design these out)
- **Activity status**: `status?: "completed" | "missed"` on Activity (undefined = pending). Missed activities excluded from all load calculations.

## Next step: DynamoDB persistence (#6)

Replace file-based plan persistence with AWS DynamoDB. The logical data model (a plan with a flat list of activities) is already defined — work is in the API/storage layer.
