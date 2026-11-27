import { day, dialog, expect, header, run, savePlanAndWait, test } from "./support/fixtures";

test("growing adds empty weeks; shrinking warns, deletes, and undo brings it back", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me, { weekCount: 4, activities: [run("late", "2026-12-29", 10)] });
  await page.goto(`/plans/${plan.id}`);
  const weeks = page.locator("[data-week-start]");

  await header(page).getByRole("button", { name: "Plan settings" }).click();
  await dialog(page).locator("input[type=number]").fill("6");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(weeks).toHaveCount(6);

  await header(page).getByRole("button", { name: "Plan settings" }).click();
  await dialog(page).locator("input[type=number]").fill("3");
  await expect(dialog(page)).toContainText("1 activity falls outside the plan and will be deleted");
  await dialog(page).getByRole("button", { name: "Save and delete 1 activity" }).click();
  await expect(weeks).toHaveCount(3);

  await header(page).getByRole("button", { name: "Undo" }).click();
  await expect(weeks).toHaveCount(6);
  await expect(day(page, "2026-12-29").locator("[draggable=true]")).toHaveCount(1);

  await savePlanAndWait(page);
  expect((await dbPlan(plan.id, me)).weekCount).toBe(6);
});

test("changing the start date can move activities or keep them on their dates", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me, { startDate: "2026-12-07", weekCount: 4, activities: [run("a", "2026-12-08", 6)] });
  await page.goto(`/plans/${plan.id}`);
  const settings = header(page).getByRole("button", { name: "Plan settings" });
  const move = dialog(page).getByRole("checkbox", { name: "Move activities and blocks with it" });

  await settings.click();
  await expect(move).toHaveCount(0);
  await dialog(page).locator("input[type=date]").fill("2026-12-14");
  await expect(move).toBeChecked();
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(page.locator("[data-week-start]").first()).toHaveAttribute("data-week-start", "2026-12-14");
  await expect(day(page, "2026-12-15").locator("[draggable=true]")).toHaveCount(1);

  await settings.click();
  await dialog(page).locator("input[type=date]").fill("2026-11-30");
  await move.uncheck();
  await expect(dialog(page).locator("input[type=number]")).toHaveValue("6");
  await expect(dialog(page)).toContainText("Ends Sun, Jan 10, 2027");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(page.locator("[data-week-start]")).toHaveCount(6);
  await expect(day(page, "2026-12-15").locator("[draggable=true]")).toHaveCount(1);

  await savePlanAndWait(page);
  const saved = await dbPlan(plan.id, me);
  expect([saved.startDate, saved.weekCount, saved.activities[0].date]).toEqual(["2026-11-30", 6, "2026-12-15"]);
});

test("rename, and the weeks and name limits", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me);
  await page.goto(`/plans/${plan.id}`);
  await header(page).getByRole("button", { name: "Plan settings" }).click();
  const save = dialog(page).getByRole("button", { name: "Save" });

  await dialog(page).locator("input[type=number]").fill("53");
  await expect(dialog(page)).toContainText("Weeks must be a whole number from 1 to 52.");
  await expect(save).toBeDisabled();
  await dialog(page).locator("input[type=number]").fill("52");

  await dialog(page).locator("input:not([type])").fill("   ");
  await expect(dialog(page)).toContainText("Name can't be empty.");
  await expect(save).toBeDisabled();
  await expect(dialog(page).locator("input:not([type])")).toHaveAttribute("maxlength", "100");

  await dialog(page).locator("input:not([type])").fill("Autumn marathon");
  await save.click();
  await expect(page.locator("h1")).toHaveText("Autumn marathon");
  await expect(page.locator("[data-week-start]")).toHaveCount(52);
});
