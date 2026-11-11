"use server";

import { redirect } from "next/navigation";
import { endSession, passwordMatches, startSession } from "@/lib/adminAuth";

export async function login(_prev, formData) {
  const password = String(formData.get("password") || "");
  if (!passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 500)); // slow down guessing a little
    return { error: "Wrong password." };
  }
  await startSession();
  redirect("/analytics");
}

export async function logout() {
  await endSession();
  redirect("/analytics/login");
}
