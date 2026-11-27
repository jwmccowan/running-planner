import { dialog, expect, header, run, savePlanAndWait, test, week } from "./support/fixtures";

test("prior weeks feed the first week's chronic distance", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me, { activities: [run("a", "2026-12-08", 10)] });
  await page.goto(`/plans/${plan.id}`);

  const firstWeek = week(page, "2026-12-07");
  await firstWeek.locator("> div").first().click();
  await expect(firstWeek).toContainText("Chronic distance: 10");

  await header(page).getByRole("button", { name: "Prior weeks" }).click();
  await expect(dialog(page)).toContainText("Week of Nov 30, 2026");
  await dialog(page).locator("input").last().fill("30");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(firstWeek).toContainText("Chronic distance: 30");

  await header(page).getByRole("button", { name: "Undo" }).click();
  await expect(firstWeek).toContainText("Chronic distance: 10");
  await header(page).getByRole("button", { name: "Redo" }).click();
  await savePlanAndWait(page);
  expect((await dbPlan(plan.id, me)).priorWeeklyDistances).toEqual([30]);
});

test("block bars are edited only in Edit blocks mode", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me, { weekCount: 8, blockStarts: ["2027-01-04"] });
  await page.goto(`/plans/${plan.id}`);
  const addButtons = page.getByRole("button", { name: "+ block" });
  const removeButtons = page.getByRole("button", { name: "✕" }).and(page.getByTitle("Remove block"));
  const gap = (startDate: string) => week(page, startDate).locator("..");

  await expect(addButtons).toHaveCount(0);
  await expect(removeButtons).toHaveCount(0);

  await header(page).getByRole("button", { name: "Edit blocks" }).click();
  await expect(addButtons).toHaveCount(6);
  await gap("2026-12-21").getByRole("button", { name: "+ block" }).click();
  await gap("2027-01-04").getByTitle("Remove block").click();
  await expect(removeButtons).toHaveCount(1);

  await gap("2026-12-21").getByTitle("Drag to move block").dragTo(week(page, "2027-01-11"));
  await expect(gap("2027-01-11").getByTitle("Drag to move block")).toBeVisible();
  await expect(gap("2026-12-21").getByTitle("Drag to move block")).toHaveCount(0);

  await header(page).getByRole("button", { name: "Edit blocks ✓" }).click();
  await expect(addButtons).toHaveCount(0);

  await savePlanAndWait(page);
  expect((await dbPlan(plan.id, me)).blockStarts).toEqual(["2027-01-11"]);
});
