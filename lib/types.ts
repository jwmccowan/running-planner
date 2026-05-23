export type RunType = "easy" | "workout" | "long" | "race";
export type ActivityStatus = "completed" | "missed";

type BaseActivity = {
  id: string;
  name: string;
  date: string; // ISO date YYYY-MM-DD
  distance: number; // km
  intenseDistance: number; // km, portion of distance that is intense
  status?: ActivityStatus;
};

export type Activity = BaseActivity & (
  | { type: "run"; runType: RunType }
  | { type: "gym" }
);

export type ActivityType = Activity["type"];

export type Plan = {
  id: string;
  name: string;
  startDate: string; // ISO date, must be a Monday
  activities: Activity[];
  priorWeeklyDistances: number[]; // up to 4 weekly totals before startDate, oldest first
};

export type WeekStats = {
  startDate: string;
  endDate: string;
  acuteDistance: number;
  intenseDistance: number;
  easyDistance: number;
  percentEasy: number;
  longestRun: number;
};

export type WeekSummary = WeekStats & {
  chronicDistance: number;
  idealAcuteRange: [low: number, high: number];
  acuteVsChronicChange: number; // (acute - chronic) / chronic × 100
  weekOverWeekChange: number | null; // null for first week
  longestRunVsPrevWeek: number | null;
  longestRunVs4WeekAvg: number | null;
};
