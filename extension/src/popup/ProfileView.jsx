import { useCallback, useEffect, useState } from "react";
import { ask, timeAgo } from "../lib/messages.js";
import { saveSettings } from "../lib/storage.js";
import StatRing, { DifficultyBar } from "./StatRing.jsx";

export default function ProfileView() {
  const [state, setState] = useState({ loading: true });

  const load = useCallback(async (force = false) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await ask("getMe", { force });
      setState({ loading: false, ...data });
    } catch (e) {
      setState({ loading: false, error: e.message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state.loading && !state.profile) return <div className="center muted">Loading profile…</div>;
  if (state.error) return <ErrorBox message={state.error} onRetry={() => load(true)} />;
  if (state.needsUsername) return <UsernamePrompt onSaved={() => load(true)} />;

  const p = state.profile;
  return (
    <div className="profile">
      <section className="card hero">
        {p.avatar ? <img className="avatar" src={p.avatar} alt="" /> : <div className="avatar" />}
        <div className="hero-text">
          <a className="name" href={`https://leetcode.com/u/${p.username}/`} target="_blank" rel="noreferrer">
            {p.realName || p.username}
          </a>
          <div className="muted small">
            @{p.username}
            {p.country ? ` · ${p.country}` : ""}
          </div>
          <div className="small">
            Rank <b>{p.ranking ? p.ranking.toLocaleString() : "—"}</b>
          </div>
        </div>
        <button className="icon-btn" title="Refresh" onClick={() => load(true)} disabled={state.loading}>
          ↻
        </button>
      </section>

      <section className="card solved">
        <StatRing solved={p.solved.all} total={p.totals.all} />
        <div className="bars">
          <DifficultyBar label="Easy" solved={p.solved.easy} total={p.totals.easy} color="var(--easy)" />
          <DifficultyBar label="Medium" solved={p.solved.medium} total={p.totals.medium} color="var(--medium)" />
          <DifficultyBar label="Hard" solved={p.solved.hard} total={p.totals.hard} color="var(--hard)" />
        </div>
      </section>

      <section className="stats-row">
        <Stat label="Contest rating" value={p.contest ? p.contest.rating : "—"} />
        <Stat label="Top" value={p.contest ? `${p.contest.topPercentage}%` : "—"} />
        <Stat label="Streak" value={`${p.streak}d`} />
        <Stat label="Active days" value={p.activeDays} />
      </section>

      <section className="card">
        <h3>Recently solved</h3>
        {p.recent.length === 0 ? (
          <div className="muted small">No recent accepted submissions.</div>
        ) : (
          <ul className="recent">
            {p.recent.slice(0, 5).map((r) => (
              <li key={r.slug + r.timestamp}>
                <a href={`https://leetcode.com/problems/${r.slug}/`} target="_blank" rel="noreferrer">
                  {r.title}
                </a>
                <span className="muted small">{timeAgo(r.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="card error">
      <p>{message}</p>
      {onRetry && <button onClick={onRetry}>Try again</button>}
    </div>
  );
}

function UsernamePrompt({ onSaved }) {
  const [name, setName] = useState("");
  return (
    <form
      className="card prompt"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        await saveSettings({ username: name.trim() });
        onSaved();
      }}
    >
      <h3>Who are you on LeetCode?</h3>
      <p className="muted small">
        Sign in to leetcode.com in this browser and EdgeCase finds you automatically, or enter your username.
      </p>
      <div className="row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="username" autoFocus />
        <button type="submit">Save</button>
      </div>
    </form>
  );
}
