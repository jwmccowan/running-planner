import { describe, expect, it } from "vitest";
import { withStrictSsl } from "./connection-url";

describe("withStrictSsl", () => {
  it("upgrades sslmode=require to verify-full and keeps other parameters", () => {
    expect(
      withStrictSsl("postgresql://u:p@ep-x.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require")
    ).toBe("postgresql://u:p@ep-x.ap-southeast-2.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require");
  });

  it("upgrades prefer and verify-ca", () => {
    expect(withStrictSsl("postgres://h/db?sslmode=prefer")).toBe("postgres://h/db?sslmode=verify-full");
    expect(withStrictSsl("postgres://h/db?sslmode=verify-ca")).toBe("postgres://h/db?sslmode=verify-full");
  });

  it("leaves URLs without sslmode (local Postgres) and verify-full unchanged", () => {
    expect(withStrictSsl("postgres://localhost:5432/running_planner")).toBe("postgres://localhost:5432/running_planner");
    expect(withStrictSsl("postgres://h/db?sslmode=verify-full")).toBe("postgres://h/db?sslmode=verify-full");
  });

  it("passes an empty URL through", () => {
    expect(withStrictSsl("")).toBe("");
  });
});
