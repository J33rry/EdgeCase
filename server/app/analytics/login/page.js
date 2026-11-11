import { redirect } from "next/navigation";
import { authConfigured, isAdmin } from "@/lib/adminAuth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in · EdgeCase analytics", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/analytics");
  return (
    <main style={{ maxWidth: 360, margin: "0 auto", padding: "96px 16px" }}>
      <h1 style={{ color: "#ffa116", marginBottom: 4, fontSize: 24 }}>EdgeCase analytics</h1>
      {authConfigured() ? (
        <>
          <p style={{ marginTop: 0, opacity: 0.7 }}>Admins only.</p>
          <LoginForm />
        </>
      ) : (
        <p style={{ opacity: 0.8 }}>
          Analytics is turned off. Set <code>ANALYTICS_PASSWORD</code> and <code>ANALYTICS_SECRET</code> on the server to enable it.
        </p>
      )}
    </main>
  );
}
