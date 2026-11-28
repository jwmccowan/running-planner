import { expect, run, savePlanAndWait, test, type TestUser } from "./support/fixtures";
import type { Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const mobileWeek = (page: Page, startDate: string) => page.locator(`[data-mobile-week="${startDate}"]`);
const dialog = (page: Page) => page.locator("div.fixed.inset-0");

async function expectNoSidewaysScroll(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
}

async function seedWeek(seedPlan: (owner: TestUser, plan?: object) => Promise<{ id: string }>, me: TestUser) {
  return seedPlan(me, {
    name: "Phone plan",
    weekCount: 3,
    activities: [run("easy", "2026-12-08", 6), run("long", "2026-12-13", 14, { runType: "long", name: "Long run" })],
  });
}

test("pages fit the screen with no sideways scrolling", async ({ page, signIn, seedPlan }) => {
  const me = await signIn("someone.with.a.rather.long.email.address@example.com");
  const plan = await seedWeek(seedPlan, me);

  await page.goto("/");
  await expectNoSidewaysScroll(page);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeInViewport();

  await page.goto(`/plans/${plan.id}`);
  await expectNoSidewaysScroll(page);
  await expect(page.locator("[data-week-start]").first()).toBeHidden();
  await expect(mobileWeek(page, "2026-12-07")).toBeVisible();

  await mobileWeek(page, "2026-12-07").getByText("Easy run").click();
  await expect(dialog(page).getByRole("button", { name: "Save" })).toBeInViewport();
});

test("form fields are at least 16px so iOS doesn't zoom in when they're focused", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  const plan = await seedWeek(seedPlan, me);
  const fieldSizes = () =>
    dialog(page)
      .locator("input, select, textarea")
      .evaluateAll((fields) => fields.map((f) => parseFloat(getComputedStyle(f).fontSize)));

  await page.goto(`/plans/${plan.id}`);
  await mobileWeek(page, "2026-12-07").getByText("Easy run").click();
  expect(Math.min(...(await fieldSizes()))).toBeGreaterThanOrEqual(16);
  await dialog(page).getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("button", { name: "Plan settings" }).click();
  expect(Math.min(...(await fieldSizes()))).toBeGreaterThanOrEqual(16);
  await dialog(page).getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("button", { name: "Prior weeks", exact: true }).click();
  expect(Math.min(...(await fieldSizes()))).toBeGreaterThanOrEqual(16);
});

test("the day editor's remove button stays inside its activity box", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  const plan = await seedWeek(seedPlan, me);
  await page.goto(`/plans/${plan.id}`);
  await mobileWeek(page, "2026-12-07").getByText("Easy run").click();

  const remove = dialog(page).getByRole("button", { name: "Remove activity" });
  const box = await remove.locator("xpath=ancestor::div[contains(@class, 'border-zinc-200')][1]").boundingBox();
  const button = await remove.boundingBox();
  expect(button && box && button.x + button.width <= box.x + box.width).toBe(true);
  await expect(remove).toBeInViewport();
});

test("week cards list activities; tapping one edits its day", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  const plan = await seedWeek(seedPlan, me);
  await page.goto(`/plans/${plan.id}`);

  const firstWeek = mobileWeek(page, "2026-12-07");
  await expect(firstWeek).toContainText("Dec 7 – Dec 13");
  await expect(firstWeek).toContainText("20 km");
  await expect(firstWeek.getByRole("listitem")).toHaveText([/Tue\s*Easy run\s*6 km/, /Sun\s*Long run\s*14 km/]);

  await firstWeek.getByText("Long run").click();
  await expect(dialog(page).getByRole("heading")).toHaveText("Sunday, December 13, 2026");
  await dialog(page).locator("input[type=number]").first().fill("16");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(firstWeek).toContainText("22 km");

  await savePlanAndWait(page);
  expect((await dbPlan(plan.id, me)).activities.find((a) => a.id === "long")?.distance).toBe(16);
});

test("the day strip opens empty days, and the status button cycles", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  const plan = await seedWeek(seedPlan, me);
  await page.goto(`/plans/${plan.id}`);
  const firstWeek = mobileWeek(page, "2026-12-07");

  await page.locator('[data-mobile-date="2026-12-10"]').click();
  await expect(dialog(page).getByRole("heading")).toHaveText("Thursday, December 10, 2026");
  await dialog(page).getByRole("button", { name: "+ Add activity" }).click();
  await dialog(page).locator("input[type=number]").first().fill("8");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(firstWeek.getByRole("listitem")).toHaveCount(3);

  const status = firstWeek.getByRole("listitem").first().getByTitle("Toggle status");
  await expect(status).toHaveText("○");
  await status.click();
  await expect(status).toHaveText("✓");
  await status.click();
  await expect(status).toHaveText("✗");

  await savePlanAndWait(page);
  const saved = await dbPlan(plan.id, me);
  expect(saved.activities.find((a) => a.id === "easy")?.status).toBe("missed");
  expect(saved.activities.some((a) => a.date === "2026-12-10")).toBe(true);
});

test("the ⋯ menu holds plan settings, prior weeks and block editing", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  const plan = await seedWeek(seedPlan, me);
  await page.goto(`/plans/${plan.id}`);

  await expect(page.getByRole("button", { name: "Plan settings" })).toBeHidden();
  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("button", { name: "Plan settings" }).click();
  await expect(dialog(page).getByRole("heading", { name: "Plan settings" })).toBeVisible();
  await dialog(page).getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "More actions" }).click();
  await page.getByRole("button", { name: "Edit blocks" }).click();
  await expect(page.getByRole("button", { name: "+ block" })).toHaveCount(2);
});

test("week 1 shows the prior weeks prompt, and expanding shows the stats", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  const plan = await seedWeek(seedPlan, me);
  await page.goto(`/plans/${plan.id}`);
  const firstWeek = mobileWeek(page, "2026-12-07");

  await firstWeek.getByRole("button", { name: "Dec 7 – Dec 13" }).click();
  await expect(firstWeek).toContainText("Chronic distance: —");
  await expect(firstWeek).toContainText("Percent easy: 100%");

  await firstWeek.getByRole("button", { name: "Add prior weeks" }).click();
  await expect(dialog(page).getByRole("heading", { name: "Prior weeks" })).toBeVisible();
});
