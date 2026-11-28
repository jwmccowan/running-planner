import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { countOwnedPlans } from "@/lib/plan-store";
import { requireUser } from "@/lib/session";
import DeleteAccountForm from "@/app/components/DeleteAccountForm";
import SignOutButton from "@/app/components/SignOutButton";

export const metadata: Metadata = { title: "Account · Running Planner" };

export default async function AccountPage() {
  await connection();
  const user = await requireUser();
  const ownedPlanCount = await countOwnedPlans(getDb(), user.id);

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← All plans
      </Link>
      <h1 className="text-xl font-bold mt-1 mb-4">Account</h1>

      <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mb-4">
        <dt className="text-zinc-500">Name</dt>
        <dd className="text-zinc-900 break-words">{user.name}</dd>
        <dt className="text-zinc-500">Email</dt>
        <dd className="text-zinc-900 break-all">{user.email}</dd>
        <dt className="text-zinc-500">Signed in with</dt>
        <dd className="text-zinc-900">Google</dd>
      </dl>

      <div className="flex items-center gap-4 text-sm mb-8">
        <SignOutButton />
        <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
          Privacy
        </Link>
      </div>

      <DeleteAccountForm ownedPlanCount={ownedPlanCount} />
    </div>
  );
}
