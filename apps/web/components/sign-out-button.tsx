"use client";

export function SignOutButton() {
  async function signOut() {
    await fetch("/auth/sign-out", { method: "POST" });
    window.location.href = "/";
  }
  return <button className="btn" onClick={signOut}>Sign out</button>;
}
