import { test as base, expect, type Page } from "@playwright/test";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { testUtils } from "better-auth/plugins";
import { account, planMembers, session, user, verification } from "../../lib/db/schema";
import { importPlan, loadPlan, savePlan } from "../../lib/plan-store";
import type { Activity, Plan } from "../../lib/types";
import { testDb } from "./db";
import { e2e } from "./env";

// Test-only auth instance: creates users and session cookies the app under test accepts
const testAuth = betterAuth({
  secret: e2e.authSecret,
  baseURL: e2e.baseURL,
  database: drizzleAdapter(testDb, { provider: "pg", schema: { user, session, account, verification } }),
  plugins: [testUtils()],
});

export type TestUser = { id: string; email: string };

type SeedPlan = Partial<Omit<Plan, "id" | "version">> & { activities?: Activity[] };

type Fixtures = {
  signIn: (email?: string) => Promise<TestUser>;
  seedPlan: (owner: TestUser, plan?: SeedPlan) => Promise<Plan>;
  dbPlan: (planId: string, owner: TestUser) => Promise<Plan>;
  saveFromElsewhere: (planId: string, owner: TestUser, change: Partial<Plan>) => Promise<void>;
};

let emailCounter = 0;

// Fixture callbacks name Playwright's "use" as "provide" so React's hook lint rules don't mistake it for React.use
export const test = base.extend<Fixtures>({
  signIn: async ({ context }, provide, testInfo) => {
    await provide(async (email) => {
      const ctx = (await testAuth.$context).test;
      const address = email ?? `user-${testInfo.testId}-${++emailCounter}@example.com`;
      const created = await ctx.saveUser(ctx.createUser({ email: address, name: address.split("@")[0], emailVerified: true }));
      const cookies = await ctx.getCookies({ userId: created.id, domain: "localhost" });
      await context.clearCookies();
      await context.addCookies(cookies);
      return { id: created.id, email: address };
    });
  },

  seedPlan: async ({}, provide) => {
    await provide(async (owner, plan = {}) => {
      const seeded = {
        id: crypto.randomUUID(),
        name: "Test plan",
        startDate: "2026-12-07",
        weekCount: 4,
        priorWeeklyDistances: [],
        blockStarts: [],
        activities: [],
        ...plan,
      };
      await importPlan(testDb, seeded);
      await testDb.insert(planMembers).values({ planId: seeded.id, userId: owner.id, role: "owner" });
      return { ...seeded, version: 1 };
    });
  },

  dbPlan: async ({}, provide) => {
    await provide(async (planId, owner) => {
      const plan = await loadPlan(testDb, planId, owner.id);
      if (!plan) throw new Error(`Plan ${planId} not found for ${owner.email}`);
      return plan;
    });
  },

  saveFromElsewhere: async ({}, provide) => {
    await provide(async (planId, owner, change) => {
      const plan = await loadPlan(testDb, planId, owner.id);
      if (!plan) throw new Error(`Plan ${planId} not found`);
      await savePlan(testDb, { ...plan, ...change }, owner.id);
    });
  },
});

export { expect };

export const run = (id: string, date: string, distance: number, extra: Partial<Activity> = {}): Activity =>
  ({ id, name: "Easy run", date, distance, intenseDistance: 0, type: "run", runType: "easy", ...extra }) as Activity;

// Page helpers

export const week = (page: Page, startDate: string) => page.locator(`[data-week-start="${startDate}"]`);
export const day = (page: Page, date: string) => page.locator(`[data-date="${date}"]`);
export const dialog = (page: Page) => page.locator("div.fixed.inset-0");
// The plan page header (the row with the plan name) holds Undo, Redo, the dialogs' buttons and Save
export const header = (page: Page) => page.locator("h1").locator("..");
export const mainSaveButton = (page: Page) => header(page).getByRole("button", { name: /^(Save|Saved|Saving…)$/ });

export async function savePlanAndWait(page: Page) {
  await mainSaveButton(page).click();
  await expect(mainSaveButton(page)).toHaveText("Saved");
}
