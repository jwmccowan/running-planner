import { expect, test } from "./support/fixtures";

test("logged-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();

  await page.goto("/plans/anything");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("a new user sees an empty home page with their email", async ({ page, signIn }) => {
  const me = await signIn();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Plan your training, week by week" })).toBeVisible();
  await expect(page.getByText(me.email)).toBeVisible();
});

test("signed-in users are sent home from the sign-in page", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/sign-in");
  await expect(page).toHaveURL(/\/$/);
});

test("you only see and open your own plans", async ({ page, signIn, seedPlan }) => {
  const alice = await signIn();
  const bob = await signIn();
  const alicePlan = await seedPlan(alice, { name: "Alice's plan" });
  await seedPlan(bob, { name: "Bob's plan" });

  // signed in as Bob (the last signIn)
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Bob's plan/ })).toBeVisible();
  await expect(page.getByText("Alice's plan")).toHaveCount(0);

  const response = await page.goto(`/plans/${alicePlan.id}`);
  expect(response?.status()).toBe(404);
});

test("New plan is disabled at the plan limit", async ({ page, signIn, seedPlan }) => {
  const me = await signIn();
  await seedPlan(me, { name: "One" });
  await seedPlan(me, { name: "Two" });
  await page.goto("/");
  const button = page.getByRole("button", { name: "+ New plan" });
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute("title", "You can have up to 2 plans for now.");
});

test("signing out ends the session", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
});
