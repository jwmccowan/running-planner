"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function GoogleSignInButton() {
  const [redirecting, setRedirecting] = useState(false);

  async function handleSignIn() {
    setRedirecting(true);
    await authClient.signIn.social({ provider: "google", callbackURL: "/" });
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={redirecting}
      className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
    >
      {redirecting ? "Redirecting…" : "Sign in with Google"}
    </button>
  );
}
