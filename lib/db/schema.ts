import { sql } from "drizzle-orm";
import {
  boolean,
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

// Better Auth tables (field names must match Better Auth's core schema)

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)]
);

// App tables

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

export const planMembers = pgTable(
  "plan_members",
  {
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "editor", "viewer"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.planId, t.userId] }),
    index("plan_members_user_id_idx").on(t.userId),
    check("plan_members_role", sql`${t.role} in ('owner', 'editor', 'viewer')`),
  ]
);
