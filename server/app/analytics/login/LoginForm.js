"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        className="a-input"
        type="password"
        name="password"
        placeholder="Admin password"
        aria-label="Admin password"
        autoFocus
        required
        autoComplete="current-password"
      />
      <button type="submit" className="a-primary" disabled={pending}>
        {pending ? "Checking…" : "Sign in"}
      </button>
      {state?.error && <p style={{ color: "var(--critical-text)", margin: 0, fontSize: 13 }}>{state.error}</p>}
    </form>
  );
}
