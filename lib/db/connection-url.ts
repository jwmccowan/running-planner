// pg currently treats these SSL modes as verify-full, but pg 9 will switch them to libpq's weaker
// semantics (encrypted but unverified). Pin verify-full so an upgrade can't quietly weaken it.
const WEAKER_IN_PG9 = ["prefer", "require", "verify-ca"];

export function withStrictSsl(url: string): string {
  if (!url) return url;
  const parsed = new URL(url);
  const mode = parsed.searchParams.get("sslmode");
  if (mode && WEAKER_IN_PG9.includes(mode)) parsed.searchParams.set("sslmode", "verify-full");
  return parsed.toString();
}
