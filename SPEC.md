# Running Planner — Product Spec

## Purpose

A personal web app for planning running training. The core value is seeing how changes to individual workouts ripple through weekly and multi-week stats — especially volume, intensity balance, and safe load progression.

## Domain Model

### Activity

A single workout on a single day.

| Field            | Type     | Description                                              |
| ---------------- | -------- | -------------------------------------------------------- |
| `id`             | string   | Unique identifier                                        |
| `name`           | string   | Display name, e.g. "6km easy run", "5km parkrun"         |
| `date`           | string   | ISO date (YYYY-MM-DD)                                    |
| `distance`       | number   | Total distance in km                                     |
| `intenseDistance` | number   | Portion of distance that is intense (km). 0 for easy runs |
| `type`           | enum     | `"run"` \| `"gym"` \| `"rest"`                           |

- Only activities with `type: "run"` count toward running volume.
- `intenseDistance` is always <= `distance`.
- Easy distance is derived: `distance - intenseDistance`.
- A day can have multiple activities (e.g. "Gym + 6km" = one gym activity + one run activity).

### Week

A Monday-to-Sunday window. Derived from activities, not stored separately.

### Plan

The top-level object. A plan has a `startDate` (a Monday) and a flat list of activities. Weeks are derived by grouping activities by their date.

## Calculations

All calculations operate on **running activities only** (type: "run").

### Weekly stats

| Stat               | Formula                                                    |
| ------------------ | ---------------------------------------------------------- |
| Acute distance     | Sum of `distance` for the week                             |
| Intense distance   | Sum of `intenseDistance` for the week                       |
| Easy distance      | Acute distance − Intense distance                          |
| Percent easy       | Easy distance / Acute distance × 100                       |
| Longest run        | Max `distance` among runs in the week                      |

### Multi-week stats

| Stat                      | Formula                                                        |
| ------------------------- | -------------------------------------------------------------- |
| Chronic distance          | Average of acute distance over the previous 4 weeks            |
| Ideal acute range (low)   | Chronic distance × 0.8                                         |
| Ideal acute range (high)  | Chronic distance × 1.3                                         |
| Week-over-week change     | (Current acute − Previous acute) / Previous acute × 100        |
| Longest run vs prev week  | Current longest − Previous week's longest                      |
| Longest run vs 4-wk avg   | Current longest − Average of longest runs over previous 4 weeks |

### Configuration

The following values should be defined centrally so they're easy to change:

| Parameter          | Default | Description                              |
| ------------------ | ------- | ---------------------------------------- |
| `chronicWeeks`     | 4       | Number of weeks for chronic load average |
| `acuteRangeLow`    | 0.8     | Lower multiplier for ideal acute range   |
| `acuteRangeHigh`   | 1.3     | Upper multiplier for ideal acute range   |

## Views

### Plan view (main view)

A calendar grid, one row per week, columns for Mon–Sun. Each cell shows the day's activities. To the left of each week row, a **week summary panel** shows:

- Date range
- Chronic distance
- Ideal acute range
- Acute distance (with week-over-week % change)
- Percent easy
- Longest run

Color coding:
- Acute distance: **green** if within ideal range, **red** if outside
- Percent easy: **green** if >= 80%, **red** if below

### Editing

Clicking a day cell opens an editor for that day's activities. The user can:

- Change distance, intense distance, name, type
- Add or remove activities on that day

All stats update live as edits are made.

## Data persistence

AWS DynamoDB for storage. Details of the table schema and API layer will be determined at implementation time, but the data model above (a plan containing a flat list of activities) is the logical model regardless of how it's stored physically.

## Future features (out of scope, but inform design)

These are not part of v1 but the data model and state management should not preclude them:

- Moving a workout from one day to another (drag-and-drop or cut/paste)
- Bulk updates (e.g. "increase all weeks by 10%")
- Copy/paste of workouts or entire weeks
- Undo within an edit session
- Broader undo for plan-level changes (state history)

## Blocks

The spreadsheet organizes weeks into 4-week blocks (mesocycles), visually separated. The plan view should preserve this grouping — every 4 weeks gets a visual separator. This is purely cosmetic in v1 (no block-level data or editing).
