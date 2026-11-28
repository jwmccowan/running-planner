import { dialog, expect, test } from "./support/fixtures";

function mondayOf(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function addWeeks(iso: string, weeks: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

test("creating a plan opens it with empty weeks and lists it at home", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/");
  await page.getByRole("button", { name: "+ New plan" }).click();

  await expect(dialog(page).getByRole("heading", { name: "New plan" })).toBeVisible();
  const create = dialog(page).getByRole("button", { name: "Create plan" });
  await expect(create).toBeDisabled();

  await dialog(page).locator("input:not([type])").fill("Spring build");
  await dialog(page).locator("input[type=number]").fill("8");
  await create.click();

  await expect(page).toHaveURL(/\/plans\/[0-9a-f-]{36}$/);
  await expect(page.locator("h1")).toHaveText("Spring build");
  await expect(page.locator("[data-week-start]")).toHaveCount(8);
  await expect(page.locator("[draggable=true]")).toHaveCount(0);

  await page.getByRole("link", { name: "← All plans" }).click();
  await expect(page.getByRole("link", { name: /Spring build/ })).toContainText("Upcoming");
  await expect(page.getByRole("link", { name: /Spring build/ })).toContainText("8 weeks · 0 km");
});

test("home lists current plans, then upcoming, then past", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  const thisMonday = mondayOf(new Date());
  await seedPlan(me, { name: "Past plan", startDate: addWeeks(thisMonday, -20), weekCount: 4 });
  await seedPlan(me, { name: "Upcoming plan", startDate: addWeeks(thisMonday, 10), weekCount: 4 });
  await seedPlan(me, { name: "Current plan", startDate: addWeeks(thisMonday, -1), weekCount: 4 });

  await page.goto("/");
  const plans = page.getByRole("listitem");
  await expect(plans).toHaveCount(3);
  await expect(plans.nth(0)).toContainText("Current plan");
  await expect(plans.nth(0)).toContainText("Now");
  await expect(plans.nth(1)).toContainText("Upcoming plan");
  await expect(plans.nth(2)).toContainText("Past plan");
});

test.describe("in Sydney before 10am, when it's still yesterday in UTC", () => {
  test.use({ timezoneId: "Australia/Sydney" });

  test("plan status follows the browser's date", async ({ page, signIn, seedPlan }) => {
    const me = await signIn();
    const monday = addWeeks(mondayOf(new Date()), 3);
    const sundayBefore = new Date(monday + "T00:00:00Z");
    sundayBefore.setUTCDate(sundayBefore.getUTCDate() - 1);
    // 21:30 UTC on Sunday is 07:30 or 08:30 on Monday in Sydney, depending on daylight saving
    await page.clock.setFixedTime(new Date(sundayBefore.toISOString().slice(0, 10) + "T21:30:00Z"));
    await seedPlan(me, { name: "Starts today", startDate: monday, weekCount: 1 });
    await seedPlan(me, { name: "Ended yesterday", startDate: addWeeks(monday, -1), weekCount: 1 });

    await page.goto("/");
    const plans = page.getByRole("listitem");
    await expect(plans.nth(0)).toContainText("Starts today");
    await expect(plans.nth(0)).toContainText("Now");
    await expect(plans.nth(1)).toContainText("Ended yesterday");
    await expect(plans.nth(1)).toContainText("Past");
  });
});
