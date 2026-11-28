import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy · Running Planner" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-zinc-900 mb-1">{title}</h2>
      <div className="text-sm text-zinc-700 leading-relaxed flex flex-col gap-2">{children}</div>
    </section>
  );
}

// A plain-language note about the app's data, not a legal policy
export default function PrivacyPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Running Planner
      </Link>
      <h1 className="text-xl font-bold mt-1 mb-2">Privacy</h1>
      <p className="text-sm text-zinc-700 leading-relaxed mb-6">
        Running Planner is a small personal project. Here&apos;s what it keeps about you, in plain language.
      </p>

      <div className="flex flex-col gap-6">
        <Section title="What's stored">
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>From your Google account: your name, email address and profile picture link.</li>
            <li>The plans you create, with their activities.</li>
            <li>
              While you&apos;re signed in, a session that records your IP address and browser, used for
              security and to limit abuse. It expires after 7 days and is deleted when you sign out.
            </li>
          </ul>
        </Section>

        <Section title="Where">
          <p>
            The database is Neon Postgres in Sydney (on AWS). The app runs on Vercel, and you sign in
            through Google.
          </p>
        </Section>

        <Section title="What isn't done">
          <p>
            No analytics, ads or tracking. The only cookie is the one that keeps you signed in. Your data
            isn&apos;t sold or shared.
          </p>
        </Section>

        <Section title="Who can see your plans">
          <p>Only you can see your plans in the app.</p>
        </Section>

        <Section title="Deleting your data">
          <p>
            <Link href="/account" className="text-blue-600 hover:text-blue-800">
              Account
            </Link>{" "}
            → <strong>Delete my account</strong> removes your account, your plans and your sessions straight
            away. Database backups may keep a copy for a short time.
          </p>
        </Section>
      </div>
    </div>
  );
}
