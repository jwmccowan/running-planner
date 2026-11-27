import { dialog, expect, header, run, test } from "./support/fixtures";

test("the owner can delete a plan after confirming, which frees a slot under the limit", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  await seedPlan(me, { name: "Keep me" });
  const doomed = await seedPlan(me, { name: "Delete me", activities: [run("a", "2026-12-08", 6), run("b", "2026-12-09", 5)] });

  await page.goto("/");
  await expect(page.getByRole("button", { name: "+ New plan" })).toBeDisabled();

  await page.goto(`/plans/${doomed.id}`);
  await header(page).getByRole("button", { name: "Plan settings" }).click();
  await dialog(page).getByRole("button", { name: "Delete plan" }).click();
  await expect(dialog(page)).toContainText("Delete “Delete me”? Its 2 activities will be deleted too. This can't be undone.");

  await dialog(page).getByRole("button", { name: "Keep plan" }).click();
  await expect(dialog(page).getByRole("button", { name: "Save" })).toBeVisible();

  await dialog(page).getByRole("button", { name: "Delete plan" }).click();
  await dialog(page).getByRole("button", { name: "Delete plan" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: /Keep me/ })).toBeVisible();
  await expect(page.getByText("Delete me")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "+ New plan" })).toBeEnabled();
  await expect(dbPlan(doomed.id, me)).rejects.toThrow("not found");
});

test("New plan has no delete button", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/");
  await page.getByRole("button", { name: "+ New plan" }).click();
  await expect(dialog(page).getByRole("heading", { name: "New plan" })).toBeVisible();
  await expect(dialog(page).getByRole("button", { name: "Delete plan" })).toHaveCount(0);
});
