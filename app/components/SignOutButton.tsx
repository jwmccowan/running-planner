"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-2 py-1 rounded border border-zinc-300 hover:bg-zinc-100 text-zinc-700"
    >
      Sign out
    </button>
  );
}
