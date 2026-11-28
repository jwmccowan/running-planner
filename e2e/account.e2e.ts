import { expect, run, test } from "./support/fixtures";
import { testDb } from "./support/db";
import { user } from "../lib/db/schema";
import { eq } from "drizzle-orm";

test("the home page links to your account page", async ({ page, signIn }) => {
  const me = await signIn();
  await page.goto("/");
  await page.getByRole("link", { name: me.email }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
  await expect(page.getByText(me.email)).toBeVisible();
});

test("deleting your account needs typed confirmation, then removes everything and signs you out", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  await seedPlan(me, { name: "Mine", activities: [run("a", "2026-12-08", 6)] });
  await seedPlan(me, { name: "Also mine" });
  await page.goto("/account");

  await expect(page.getByText("This deletes your account and your 2 plans, then signs you out")).toBeVisible();
  const button = page.getByRole("button", { name: "Delete my account" });
  await expect(button).toBeDisabled();
  await page.getByLabel("Type “delete” to confirm").fill("delet");
  await expect(button).toBeDisabled();
  await page.getByLabel("Type “delete” to confirm").fill("delete");
  await button.click();

  await expect(page).toHaveURL(/\/sign-in\?deleted=1$/);
  await expect(page.getByText("Your account and plans have been deleted.")).toBeVisible();
  expect(await testDb.select().from(user).where(eq(user.id, me.id))).toEqual([]);

  // the old session no longer works
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("the privacy page is public and linked from sign-in, help and account", async ({ page, signIn }) => {
  await page.goto("/sign-in");
  await page.getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Privacy" })).toBeVisible();
  await expect(page.getByText("No analytics, ads or tracking.")).toBeVisible();
  await expect(page.getByText("Neon Postgres in Sydney")).toBeVisible();

  await page.goto("/help");
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");

  await signIn();
  await page.goto("/account");
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
});
