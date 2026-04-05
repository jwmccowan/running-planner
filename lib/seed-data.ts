import type { Activity, Plan } from "./types";

let nextId = 1;
function id(): string {
  return String(nextId++);
}

function easyRun(date: string, distance: number): Activity {
  return { id: id(), name: `${distance}km easy run`, date, distance, intenseDistance: 0, type: "run" };
}

function longRun(date: string, distance: number): Activity {
  return { id: id(), name: `${distance}km long run`, date, distance, intenseDistance: 0, type: "run" };
}

function parkrun(date: string): Activity {
  return { id: id(), name: "5km parkrun", date, distance: 5, intenseDistance: 5, type: "run" };
}

function gym(date: string): Activity {
  return { id: id(), name: "Gym", date, distance: 0, intenseDistance: 0, type: "gym" };
}

const activities: Activity[] = [
  // Block 1: Weeks 1–4 (Feb 9 – Mar 8)

  // Week 1 (Feb 9): 15km
  easyRun("2026-02-10", 4),   // Tue
  easyRun("2026-02-12", 6),   // Thu
  parkrun("2026-02-14"),       // Sat

  // Week 2 (Feb 16): 18km
  easyRun("2026-02-17", 5),   // Tue
  easyRun("2026-02-19", 6),   // Thu
  longRun("2026-02-22", 7),   // Sun

  // Week 3 (Feb 23): 21km
  easyRun("2026-02-24", 6),   // Tue
  easyRun("2026-02-26", 7),   // Thu
  longRun("2026-03-01", 8),   // Sun

  // Week 4 (Mar 2): 16km
  easyRun("2026-03-03", 6),   // Tue
  easyRun("2026-03-05", 5),   // Thu
  parkrun("2026-03-07"),       // Sat

  // Block 2: Weeks 5–8 (Mar 9 – Apr 5)

  // Week 5 (Mar 9): 18km
  easyRun("2026-03-09", 4),   // Mon
  easyRun("2026-03-11", 4),   // Wed
  easyRun("2026-03-13", 4),   // Fri
  longRun("2026-03-15", 6),   // Sun

  // Week 6 (Mar 16): 21km
  easyRun("2026-03-17", 5),   // Tue
  gym("2026-03-18"),           // Wed
  easyRun("2026-03-19", 4),   // Thu
  easyRun("2026-03-20", 5),   // Fri
  gym("2026-03-21"),           // Sat
  longRun("2026-03-22", 7),   // Sun

  // Week 7 (Mar 23): 24km
  easyRun("2026-03-24", 5),   // Tue
  gym("2026-03-25"),           // Wed
  easyRun("2026-03-26", 6),   // Thu
  easyRun("2026-03-28", 5),   // Sat
  gym("2026-03-28"),           // Sat (gym)
  longRun("2026-03-29", 8),   // Sun

  // Week 8 (Mar 30): 16km
  easyRun("2026-03-31", 3),   // Tue
  gym("2026-04-01"),           // Wed
  easyRun("2026-04-02", 4),   // Thu
  gym("2026-04-02"),           // Thu (gym)
  parkrun("2026-04-04"),       // Sat
  longRun("2026-04-05", 6),   // Sun

  // Block 3: Weeks 9–12 (Apr 6 – May 3)

  // Week 9 (Apr 6): 25km
  gym("2026-04-07"),           // Tue (gym)
  easyRun("2026-04-07", 6),   // Tue
  easyRun("2026-04-08", 6),   // Wed
  gym("2026-04-10"),           // Fri
  parkrun("2026-04-11"),       // Sat
  longRun("2026-04-12", 8),   // Sun

  // Week 10 (Apr 13): 28km
  gym("2026-04-14"),           // Tue (gym)
  easyRun("2026-04-14", 7),   // Tue
  easyRun("2026-04-15", 7),   // Wed
  gym("2026-04-17"),           // Fri
  parkrun("2026-04-18"),       // Sat
  longRun("2026-04-19", 9),   // Sun

  // Week 11 (Apr 20): 30km
  gym("2026-04-21"),           // Tue (gym)
  easyRun("2026-04-21", 7),   // Tue
  easyRun("2026-04-22", 8),   // Wed
  gym("2026-04-24"),           // Fri
  parkrun("2026-04-25"),       // Sat
  longRun("2026-04-26", 10),  // Sun

  // Week 12 (Apr 27): 20km
  gym("2026-04-28"),           // Tue (gym)
  easyRun("2026-04-28", 4),   // Tue
  easyRun("2026-04-29", 4),   // Wed
  gym("2026-05-01"),           // Fri
  parkrun("2026-05-02"),       // Sat
  longRun("2026-05-03", 7),   // Sun

  // Block 4: Weeks 13–16 (May 4 – May 31)

  // Week 13 (May 4): 32km
  gym("2026-05-05"),           // Tue (gym)
  easyRun("2026-05-05", 6),   // Tue
  easyRun("2026-05-06", 6),   // Wed
  gym("2026-05-08"),           // Fri (gym)
  easyRun("2026-05-08", 4),   // Fri
  parkrun("2026-05-09"),       // Sat
  longRun("2026-05-10", 11),  // Sun

  // Week 14 (May 11): 35km
  gym("2026-05-12"),           // Tue (gym)
  easyRun("2026-05-12", 7),   // Tue
  easyRun("2026-05-13", 7),   // Wed
  gym("2026-05-15"),           // Fri (gym)
  easyRun("2026-05-15", 4),   // Fri
  parkrun("2026-05-16"),       // Sat
  longRun("2026-05-17", 12),  // Sun

  // Week 15 (May 18): 38km
  gym("2026-05-19"),           // Tue (gym)
  easyRun("2026-05-19", 7),   // Tue
  easyRun("2026-05-20", 8),   // Wed
  gym("2026-05-22"),           // Fri (gym)
  easyRun("2026-05-22", 5),   // Fri
  parkrun("2026-05-23"),       // Sat
  longRun("2026-05-24", 13),  // Sun

  // Week 16 (May 25): 25km
  gym("2026-05-26"),           // Tue (gym)
  easyRun("2026-05-26", 4),   // Tue
  easyRun("2026-05-27", 5),   // Wed
  gym("2026-05-29"),           // Fri (gym)
  easyRun("2026-05-29", 3),   // Fri
  parkrun("2026-05-30"),       // Sat
  longRun("2026-05-31", 8),   // Sun

  // Block 5: Weeks 17–20 (Jun 1 – Jun 28)

  // Week 17 (Jun 1): 42km
  gym("2026-06-02"),           // Tue (gym)
  easyRun("2026-06-02", 8),   // Tue
  easyRun("2026-06-03", 9),   // Wed
  gym("2026-06-05"),           // Fri (gym)
  easyRun("2026-06-05", 6),   // Fri
  parkrun("2026-06-06"),       // Sat
  longRun("2026-06-07", 14),  // Sun

  // Week 18 (Jun 8): 45km
  gym("2026-06-09"),           // Tue (gym)
  easyRun("2026-06-09", 9),   // Tue
  easyRun("2026-06-10", 10),  // Wed
  gym("2026-06-12"),           // Fri (gym)
  easyRun("2026-06-12", 6),   // Fri
  parkrun("2026-06-13"),       // Sat
  longRun("2026-06-14", 15),  // Sun

  // Week 19 (Jun 15): 47km
  gym("2026-06-16"),           // Tue (gym)
  easyRun("2026-06-16", 10),  // Tue
  easyRun("2026-06-17", 10),  // Wed
  gym("2026-06-19"),           // Fri (gym)
  easyRun("2026-06-19", 6),   // Fri
  parkrun("2026-06-20"),       // Sat
  longRun("2026-06-21", 16),  // Sun

  // Week 20 (Jun 22): 32km
  gym("2026-06-23"),           // Tue (gym)
  easyRun("2026-06-23", 6),   // Tue
  easyRun("2026-06-24", 6),   // Wed
  gym("2026-06-26"),           // Fri (gym)
  easyRun("2026-06-26", 4),   // Fri
  parkrun("2026-06-27"),       // Sat
  longRun("2026-06-28", 11),  // Sun

  // Block 6: Weeks 21–24 (Jun 29 – Jul 26)

  // Week 21 (Jun 29): 52km
  gym("2026-06-30"),           // Tue (gym)
  easyRun("2026-06-30", 12),  // Tue
  easyRun("2026-07-01", 6),   // Wed (6km + 5km)
  easyRun("2026-07-01", 5),   // Wed
  gym("2026-07-03"),           // Fri (gym)
  easyRun("2026-07-03", 7),   // Fri
  parkrun("2026-07-04"),       // Sat
  longRun("2026-07-05", 17),  // Sun

  // Week 22 (Jul 6): 56km
  gym("2026-07-07"),           // Tue (gym)
  easyRun("2026-07-07", 13),  // Tue
  easyRun("2026-07-08", 7),   // Wed (7km + 6km)
  easyRun("2026-07-08", 6),   // Wed
  gym("2026-07-10"),           // Fri (gym)
  easyRun("2026-07-10", 7),   // Fri
  parkrun("2026-07-11"),       // Sat
  longRun("2026-07-12", 18),  // Sun

  // Week 23 (Jul 13): 60km
  gym("2026-07-14"),           // Tue (gym)
  easyRun("2026-07-14", 14),  // Tue
  easyRun("2026-07-15", 7),   // Wed (7km + 7km)
  easyRun("2026-07-15", 7),   // Wed
  gym("2026-07-17"),           // Fri (gym)
  easyRun("2026-07-17", 7),   // Fri
  parkrun("2026-07-18"),       // Sat
  longRun("2026-07-19", 20),  // Sun

  // Week 24 (Jul 20): 40km
  gym("2026-07-21"),           // Tue (gym)
  easyRun("2026-07-21", 8),   // Tue
  easyRun("2026-07-22", 10),  // Wed
  gym("2026-07-24"),           // Fri (gym)
  easyRun("2026-07-24", 5),   // Fri
  parkrun("2026-07-25"),       // Sat
  longRun("2026-07-26", 12),  // Sun
];

export const seedPlan: Plan = {
  id: "1",
  name: "2026 Training Plan",
  startDate: "2026-02-09",
  activities,
};
