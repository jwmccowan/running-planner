import { config } from "./config";

// Size limits for a plan, enforced by the server (and mirrored in the UI)
export const limits = {
  maxWeeks: 52,
  maxActivitiesPerDay: 3,
  maxNameLength: 100,
  maxActivityDistanceKm: 300,
  maxPriorWeeks: config.chronicWeeks,
  maxPriorWeekDistanceKm: 2000,
} as const;
