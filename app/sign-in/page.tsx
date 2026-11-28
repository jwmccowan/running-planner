import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  if (await getCurrentUser()) redirect("/");
  const { deleted } = await searchParams;

  return (
    <div className="p-6 max-w-md mx-auto w-full">
      {deleted && (
        <p className="mb-4 text-sm border border-zinc-200 bg-zinc-50 rounded p-3 text-zinc-700">
          Your account and plans have been deleted.
        </p>
      )}
      <h1 className="text-xl font-bold mb-2">Running Planner</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Plan your training and see how each change affects weekly load.
      </p>
      <GoogleSignInButton />
      <p className="mt-6 text-sm flex gap-4">
        <Link href="/help" className="text-blue-600 hover:text-blue-800">
          How it works
        </Link>
        <Link href="/privacy" className="text-blue-600 hover:text-blue-800">
          Privacy
        </Link>
      </p>
    </div>
  );
}
