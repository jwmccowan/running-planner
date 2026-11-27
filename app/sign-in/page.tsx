import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-bold mb-2">Running Planner</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Plan your training and see how each change affects weekly load.
      </p>
      <GoogleSignInButton />
    </div>
  );
}
