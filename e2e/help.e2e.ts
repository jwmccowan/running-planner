import { config } from "../lib/config";
import { dialog, expect, run, test, week } from "./support/fixtures";

test("new users get an introduction and a button to create their first plan", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Plan your training, week by week" })).toBeVisible();
  await page.getByRole("button", { name: "Create your first plan" }).click();
  await expect(dialog(page).getByRole("heading", { name: "New plan" })).toBeVisible();
});

test("the help page is public, says it isn't advice, and uses the configured thresholds", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("link", { name: "How it works" }).click();
  await expect(page).toHaveURL(/\/help$/);
  await expect(page.getByText("They aren't medical or coaching advice")).toBeVisible();
  await expect(page.locator("#range")).toContainText(`${config.acuteRangeLow}–${config.acuteRangeHigh}× your chronic distance`);
  await expect(page.locator("#chronic")).toContainText(`previous ${config.chronicWeeks} weeks`);
  await expect(page.locator("#easy")).toContainText(`${config.easyTargetPercent}% by default`);
  await expect(page.locator("#blocks")).toContainText("Use Edit blocks to add");
  await expect(page.locator("#prior-weeks")).toContainText("Add them from Prior weeks on the plan page");
});

test("ⓘ next to each stat opens its help section in a new tab", async ({ page, context, signIn, seedPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me, { priorWeeklyDistances: [20, 20, 20, 20], activities: [run("a", "2026-12-08", 20)] });
  await page.goto(`/plans/${plan.id}`);
  await week(page, "2026-12-07").locator("> div").first().click();

  const links = {
    "What is chronic distance?": "/help#chronic",
    "What is the ideal acute range?": "/help#range",
    "What is acute distance?": "/help#acute",
    "What is percent easy?": "/help#easy",
  };
  for (const [name, href] of Object.entries(links)) {
    const link = week(page, "2026-12-07").getByRole("link", { name });
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
  }

  const [helpTab] = await Promise.all([
    context.waitForEvent("page"),
    week(page, "2026-12-07").getByRole("link", { name: "What is the ideal acute range?" }).click(),
  ]);
  await expect(helpTab).toHaveURL(/\/help#range$/);
  await expect(helpTab.locator("#range")).toBeInViewport();
  // the plan page stays put, with the week still expanded
  await expect(week(page, "2026-12-07")).toContainText("Chronic distance: 20");

  await expect(page.getByRole("link", { name: "How it works" })).toHaveAttribute("target", "_blank");
});
