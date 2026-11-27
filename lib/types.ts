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
  weekCount: number;
  activities: Activity[];
  priorWeeklyDistances: number[]; // up to 4 weekly totals before startDate, oldest first
  blockStarts: string[]; // ISO Mondays where a new block begins
  version: number; // increments on every save; a save from an older version is rejected
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
  chronicDistance: number | null; // null when there are no earlier weeks (plan or prior) to average
  chronicWeeks: number; // how many earlier weeks the chronic average uses (0 to config.chronicWeeks)
  idealAcuteRange: [low: number, high: number] | null;
  acuteVsChronicChange: number | null; // (acute - chronic) / chronic × 100
  weekOverWeekChange: number | null; // null for first week
  longestRunVsPrevWeek: number | null;
  longestRunVs4WeekAvg: number | null;
};
