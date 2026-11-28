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

test("a failed save keeps the edits, and Retry saves them", async ({ page, signIn, seedPlan, dbPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me, { name: "Original" });
  await page.goto(`/plans/${plan.id}`);
  await header(page).getByRole("button", { name: "Plan settings" }).click();
  await dialog(page).locator("input:not([type])").fill("Renamed");
  await dialog(page).getByRole("button", { name: "Save" }).click();

  const planUrl = `**/plans/${plan.id}`;
  await page.route(planUrl, (route) => (route.request().method() === "POST" ? route.abort() : route.continue()));
  await mainSaveButton(page).click();
  await expect(page.getByText("Your changes couldn't be saved")).toBeVisible();
  await expect(page.locator("h1")).toHaveText("Renamed");
  await expect(mainSaveButton(page)).toHaveText("Save");
  expect((await dbPlan(plan.id, me)).name).toBe("Original");

  await page.unroute(planUrl);
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(mainSaveButton(page)).toHaveText("Saved");
  await expect(page.getByText("Your changes couldn't be saved")).toHaveCount(0);
  expect((await dbPlan(plan.id, me)).name).toBe("Renamed");
});

test("leaving with unsaved edits asks first", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  const plan = await seedPlan(me, { name: "Original" });
  await page.goto(`/plans/${plan.id}`);
  const dialogs: string[] = [];
  page.on("dialog", (d) => {
    dialogs.push(d.type());
    void (dialogs.length === 1 ? d.dismiss() : d.accept());
  });

  await header(page).getByRole("button", { name: "Plan settings" }).click();
  await dialog(page).locator("input:not([type])").fill("Renamed");
  await dialog(page).getByRole("button", { name: "Save" }).click();

  const allPlans = page.getByRole("link", { name: "← All plans" });
  await allPlans.click();
  await expect(page).toHaveURL(new RegExp(`/plans/${plan.id}$`));
  await expect(page.locator("h1")).toHaveText("Renamed");

  await page.reload();
  await expect(page.locator("h1")).toHaveText("Original");
  expect(dialogs).toEqual(["confirm", "beforeunload"]);

  await allPlans.click();
  await expect(page).toHaveURL(/\/$/);
  expect(dialogs).toHaveLength(2);
});

test("an unexpected error shows a page with a way back", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  await seedPlan(me);
  // Home formats dates in the browser, so this makes it throw while rendering there
  await page.addInitScript(() => {
    Date.prototype.toLocaleDateString = () => {
      throw new Error("Simulated browser error");
    };
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("link", { name: "All plans" })).toHaveAttribute("href", "/");
});
