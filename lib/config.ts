// The app's default thresholds, based on common rules of thumb (not medical or coaching advice).
// UI text reads these values rather than repeating them, so they can later become per-plan or per-user settings.
export const config = {
  chronicWeeks: 4,
  acuteRangeLow: 0.8,
  acuteRangeHigh: 1.3,
  easyTargetPercent: 80,
} as const;
