import { day, dialog, expect, run, savePlanAndWait, test } from "./support/fixtures";

test("add an activity in the day editor and save it", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me);
  await page.goto(`/plans/${plan.id}`);

  await day(page, "2026-12-08").click();
  await expect(dialog(page).getByRole("heading")).toHaveText("Tuesday, December 8, 2026");
  await dialog(page).getByRole("button", { name: "+ Add activity" }).click();
  await dialog(page).locator("input[type=number]").first().fill("8");
  await dialog(page).getByRole("button", { name: "Save" }).click();

  await expect(day(page, "2026-12-08").locator("[draggable=true]")).toContainText("Easy run");
  await savePlanAndWait(page);
  const saved = await dbPlan(plan.id, me);
  expect(saved.activities).toMatchObject([{ date: "2026-12-08", distance: 8, name: "Easy run", type: "run" }]);
});

test("the day editor allows 3 activities and flags invalid values", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me);
  await page.goto(`/plans/${plan.id}`);
  await day(page, "2026-12-08").click();

  const add = dialog(page).getByRole("button", { name: "+ Add activity" });
  const save = dialog(page).getByRole("button", { name: "Save" });
  for (let i = 0; i < 3; i++) await add.click();
  await expect(add).toBeDisabled();
  await expect(dialog(page)).toContainText("Up to 3 activities per day");

  const [distance, intense] = await dialog(page).locator("input[type=number]").all();
  await distance.fill("400");
  await expect(dialog(page)).toContainText("Distance must be 0–300 km");
  await expect(save).toBeDisabled();

  await distance.fill("5");
  await intense.fill("6");
  await expect(dialog(page)).toContainText("Intense distance can't be more than the distance");
  await expect(save).toBeDisabled();

  await intense.fill("0");
  await dialog(page).locator("input:not([type])").first().fill("");
  await expect(dialog(page)).toContainText("Name can't be empty");
  await expect(save).toBeDisabled();

  await dialog(page).locator("input:not([type])").first().fill("Easy run");
  await expect(save).toBeEnabled();
  await save.click();
  await expect(day(page, "2026-12-08").locator("[draggable=true]")).toHaveCount(3);
});

test("drag an activity to another day, but not onto a full day", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  const full = ["x", "y", "z"].map((id) => run(id, "2026-12-11", 3));
  const plan = await seedPlan(me, { activities: [run("mover", "2026-12-08", 6), run("other", "2026-12-09", 5), ...full] });
  await page.goto(`/plans/${plan.id}`);
  const chips = (date: string) => day(page, date).locator("[draggable=true]");

  await chips("2026-12-08").dragTo(day(page, "2026-12-10"));
  await expect(chips("2026-12-08")).toHaveCount(0);
  await expect(chips("2026-12-10")).toHaveCount(1);

  await chips("2026-12-09").dragTo(day(page, "2026-12-11"));
  await expect(chips("2026-12-11")).toHaveCount(3);
  await expect(chips("2026-12-09")).toHaveCount(1);

  await savePlanAndWait(page);
  const saved = await dbPlan(plan.id, me);
  expect(saved.activities.find((a) => a.id === "mover")?.date).toBe("2026-12-10");
});
