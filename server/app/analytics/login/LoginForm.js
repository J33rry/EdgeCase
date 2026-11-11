"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        type="password"
        name="password"
        placeholder="Admin password"
        autoFocus
        required
        autoComplete="current-password"
        style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #333", background: "#1a1a1a", color: "inherit", fontSize: 15 }}
      />
      <button
        type="submit"
        disabled={pending}
        style={{ padding: "10px 12px", borderRadius: 8, border: 0, background: "#ffa116", color: "#111", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
      >
        {pending ? "Checking…" : "Sign in"}
      </button>
      {state?.error && <p style={{ color: "#ef4743", margin: 0 }}>{state.error}</p>}
    </form>
  );
}
