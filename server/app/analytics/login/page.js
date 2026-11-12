import { redirect } from "next/navigation";
import { authConfigured, isAdmin } from "@/lib/adminAuth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in · EdgeCase analytics", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/analytics");
  return (
    <main className="a-login">
      <div className="a-brand">
        <div className="a-logo" aria-hidden>
          EC
        </div>
        <div>
          <h1>Tutor analytics</h1>
          <p>EdgeCase admin</p>
        </div>
      </div>
      <div className="a-card">
        {authConfigured() ? (
          <>
            <p style={{ marginTop: 0, color: "var(--text-2)" }}>Admins only. Enter the dashboard password.</p>
            <LoginForm />
          </>
        ) : (
          <p style={{ margin: 0, color: "var(--text-2)", lineHeight: 1.6 }}>
            Analytics is turned off. Set <code>ANALYTICS_PASSWORD</code> and <code>ANALYTICS_SECRET</code> on the server to enable it.
          </p>
        )}
      </div>
    </main>
  );
}
