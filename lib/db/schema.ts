import { sql } from "drizzle-orm";
import {
  check,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const plans = pgTable(
  "plans",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    weekCount: integer("week_count").notNull(),
    priorWeeklyDistances: doublePrecision("prior_weekly_distances")
      .array()
      .notNull()
      .default(sql`'{}'`),
    blockStarts: date("block_starts", { mode: "string" }).array().notNull().default(sql`'{}'`),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("plans_week_count_positive", sql`${t.weekCount} >= 1`),
    check("plans_start_date_monday", sql`extract(isodow from ${t.startDate}) = 1`),
  ]
);

export const activities = pgTable(
  "activities",
  {
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    type: text("type", { enum: ["run", "gym"] }).notNull(),
    runType: text("run_type", { enum: ["easy", "workout", "long", "race"] }),
    name: text("name").notNull(),
    distance: doublePrecision("distance").notNull(),
    intenseDistance: doublePrecision("intense_distance").notNull(),
    status: text("status", { enum: ["completed", "missed"] }),
  },
  (t) => [
    primaryKey({ columns: [t.planId, t.id] }),
    index("activities_plan_id_date_idx").on(t.planId, t.date),
    check("activities_type", sql`${t.type} in ('run', 'gym')`),
    check("activities_run_type", sql`(${t.type} = 'run') = (${t.runType} is not null)`),
    check("activities_status", sql`${t.status} is null or ${t.status} in ('completed', 'missed')`),
    check("activities_intense_within_distance", sql`${t.intenseDistance} <= ${t.distance}`),
  ]
);
