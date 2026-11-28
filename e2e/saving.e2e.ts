import { dialog, expect, header, mainSaveButton, test } from "./support/fixtures";

test("undo, redo and the saved state", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me, { name: "Original" });
  await page.goto(`/plans/${plan.id}`);
  await expect(mainSaveButton(page)).toHaveText("Saved");

  await header(page).getByRole("button", { name: "Plan settings" }).click();
  await dialog(page).locator("input:not([type])").fill("Renamed");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(mainSaveButton(page)).toHaveText("Save");

  await header(page).getByRole("button", { name: "Undo" }).click();
  await expect(page.locator("h1")).toHaveText("Original");
  await expect(mainSaveButton(page)).toHaveText("Saved");

  await header(page).getByRole("button", { name: "Redo" }).click();
  await mainSaveButton(page).click();
  await expect(mainSaveButton(page)).toHaveText("Saved");
  expect(await dbPlan(plan.id, me)).toMatchObject({ name: "Renamed", version: 2 });

  await page.reload();
  await expect(page.locator("h1")).toHaveText("Renamed");
});

test("a save from a stale tab is rejected and Reload shows the latest", async ({ page, signIn, seedPlan, dbPlan, saveFromElsewhere }) => {
  const me = await signIn();
  const plan = await seedPlan(me, { name: "Original" });
  await page.goto(`/plans/${plan.id}`);

  await saveFromElsewhere(plan.id, me, { name: "Changed in another tab" });

  await header(page).getByRole("button", { name: "Plan settings" }).click();
  await dialog(page).locator("input:not([type])").fill("Stale edit");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await mainSaveButton(page).click();

  await expect(page.getByText("This plan was changed somewhere else")).toBeVisible();
  await expect(mainSaveButton(page)).toBeDisabled();
  expect((await dbPlan(plan.id, me)).name).toBe("Changed in another tab");

  await page.getByRole("button", { name: "Reload" }).click();
  await expect(page.locator("h1")).toHaveText("Changed in another tab");
  await expect(page.getByText("This plan was changed somewhere else")).toHaveCount(0);
});

test("the undo shortcut leaves text fields alone but undoes the plan elsewhere", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me, { name: "Original" });
  await page.goto(`/plans/${plan.id}`);

  await header(page).getByRole("button", { name: "Plan settings" }).click();
  await dialog(page).locator("input:not([type])").fill("Renamed");
  await dialog(page).getByRole("button", { name: "Save" }).click();
  await expect(page.locator("h1")).toHaveText("Renamed");

  await header(page).getByRole("button", { name: "Plan settings" }).click();
  const nameField = dialog(page).locator("input:not([type])");
  await nameField.pressSequentially(" again");
  const prevented = await nameField.evaluate(
    (input) => !input.dispatchEvent(new KeyboardEvent("keydown", { key: "z", metaKey: true, ctrlKey: true, bubbles: true, cancelable: true }))
  );
  expect(prevented).toBe(false);
  await nameField.press("ControlOrMeta+z");
  await expect(page.locator("h1")).toHaveText("Renamed");

  await dialog(page).getByRole("button", { name: "Cancel" }).click();
  await page.keyboard.press("ControlOrMeta+z");
  await expect(page.locator("h1")).toHaveText("Original");
});
