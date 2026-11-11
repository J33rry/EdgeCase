import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "edgecase_admin";
const MAX_AGE_S = 7 * 24 * 60 * 60;

export const authConfigured = () => Boolean(process.env.ANALYTICS_PASSWORD && process.env.ANALYTICS_SECRET);

const sign = (value) => createHmac("sha256", process.env.ANALYTICS_SECRET).update(value).digest("base64url");

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordMatches(input) {
  if (!authConfigured()) return false;
  // Compare HMACs so the comparison is constant-time regardless of length.
  return safeEqual(sign(`pw:${input}`), sign(`pw:${process.env.ANALYTICS_PASSWORD}`));
}

export async function startSession() {
  const exp = String(Date.now() + MAX_AGE_S * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/analytics",
    maxAge: MAX_AGE_S,
  });
}

export async function endSession() {
  (await cookies()).delete({ name: COOKIE, path: "/analytics" });
}

export async function isAdmin() {
  if (!authConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value || "";
  const [exp, mac] = value.split(".");
  if (!exp || !mac || !safeEqual(mac, sign(exp))) return false;
  return Number(exp) > Date.now();
}
