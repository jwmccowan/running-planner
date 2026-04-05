export type ActivityType = "run" | "gym" | "rest";

export type Activity = {
  id: string;
  name: string;
  date: string; // ISO date YYYY-MM-DD
  distance: number; // km
  intenseDistance: number; // km, portion of distance that is intense
  type: ActivityType;
};

export type Plan = {
  id: string;
  name: string;
  startDate: string; // ISO date, must be a Monday
  activities: Activity[];
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
  weekOverWeekChange: number | null; // null for first week
  longestRunVsPrevWeek: number | null;
  longestRunVs4WeekAvg: number | null;
};
