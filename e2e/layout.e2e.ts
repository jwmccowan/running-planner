import type { Page } from "@playwright/test";
import { expect, test } from "./support/fixtures";

test.use({ viewport: { width: 1440, height: 900 } });

// The page's top-level box: the child of <body> holding the heading
async function pageColumn(page: Page) {
  return page.locator("h1").first().evaluate((heading) => {
    let el: Element = heading;
    while (el.parentElement && el.parentElement !== document.body) el = el.parentElement;
    const { left, right } = el.getBoundingClientRect();
    return { left, right: document.documentElement.clientWidth - right };
  });
}

test("pages other than the schedule are centred", async ({ page, signIn }) => {
  await page.goto("/sign-in");
  const signInColumn = await pageColumn(page);
  expect(signInColumn.left).toBeGreaterThan(100);
  expect(Math.abs(signInColumn.left - signInColumn.right)).toBeLessThanOrEqual(1);

  await signIn();
  for (const path of ["/", "/account", "/help", "/privacy"]) {
    await page.goto(path);
    const column = await pageColumn(page);
    expect(column.left, path).toBeGreaterThan(100);
    expect(Math.abs(column.left - column.right), path).toBeLessThanOrEqual(1);
  }
});

test("the schedule uses the full width", async ({ page, signIn, seedPlan }) => {
  const plan = await seedPlan(await signIn());
  await page.goto(`/plans/${plan.id}`);
  const column = await pageColumn(page);
  expect(column.left).toBe(0);
  expect(column.right).toBe(0);
});
