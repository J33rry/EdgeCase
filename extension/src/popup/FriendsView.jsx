import { useCallback, useEffect, useMemo, useState } from "react";
import { ask, timeAgo } from "../lib/messages.js";
import { ErrorBox } from "./ProfileView.jsx";

const SORTS = {
  solved: { label: "Solved", key: (p) => p.solved.all },
  rating: { label: "Rating", key: (p) => p.contest?.rating ?? -1 },
  recent: { label: "Recent", key: (p) => p.recent[0]?.timestamp ?? 0 },
};

export default function FriendsView() {
  const [state, setState] = useState({ loading: true, rows: [] });
  const [sort, setSort] = useState("solved");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const load = useCallback(async (force = false) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await ask("getFriends", { force });
      setState({ loading: false, ...data });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const ok = state.rows.filter((r) => r.profile);
    const bad = state.rows.filter((r) => !r.profile);
    ok.sort((a, b) => SORTS[sort].key(b.profile) - SORTS[sort].key(a.profile));
    return [...ok, ...bad];
  }, [state.rows, sort]);

  const isMe = (u) => state.me && u.toLowerCase() === state.me.toLowerCase();

  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setAddError("");
    try {
      await ask("addFriend", { username: name });
      setName("");
      await load();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function remove(username) {
    await ask("removeFriend", { username });
    setState((s) => ({ ...s, rows: s.rows.filter((r) => r.username !== username) }));
  }

  return (
    <div className="friends">
      <form className="row add" onSubmit={add}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a friend by LeetCode username"
          disabled={adding}
        />
        <button type="submit" disabled={adding || !name.trim()}>
          {adding ? "…" : "Add"}
        </button>
      </form>
      {addError && <div className="error-text small">{addError}</div>}

      <div className="toolbar">
        <div className="seg">
          {Object.entries(SORTS).map(([k, s]) => (
            <button key={k} aria-pressed={sort === k} onClick={() => setSort(k)}>
              {s.label}
            </button>
          ))}
        </div>
        <button className="icon-btn" title="Refresh" onClick={() => load(true)} disabled={state.loading}>
          ↻
        </button>
      </div>

      {state.error && <ErrorBox message={state.error} onRetry={() => load(true)} />}
      {state.loading && state.rows.length === 0 && <div className="center muted">Loading friends…</div>}
      {!state.loading && rows.length === 0 && !state.error && (
        <div className="center muted small">Add friends to compare progress.</div>
      )}

      <ol className="board">
        {rows.map((r, i) =>
          r.profile ? (
            <li key={r.username} className={isMe(r.username) ? "me" : ""}>
              <span className="pos">{i + 1}</span>
              {r.profile.avatar ? <img className="mini-avatar" src={r.profile.avatar} alt="" /> : <span className="mini-avatar" />}
              <div className="who">
                <a href={`https://leetcode.com/u/${r.profile.username}/`} target="_blank" rel="noreferrer">
                  {r.profile.username}
                  {isMe(r.username) && <span className="you">you</span>}
                </a>
                <div className="small">
                  <span style={{ color: "var(--easy)" }}>{r.profile.solved.easy}</span>
                  {" · "}
                  <span style={{ color: "var(--medium)" }}>{r.profile.solved.medium}</span>
                  {" · "}
                  <span style={{ color: "var(--hard)" }}>{r.profile.solved.hard}</span>
                  <span className="muted"> · {timeAgo(r.profile.recent[0]?.timestamp)}</span>
                </div>
              </div>
              <div className="nums">
                <b>{r.profile.solved.all}</b>
                <span className="muted small">{r.profile.contest ? `★ ${r.profile.contest.rating}` : "no contests"}</span>
              </div>
              {!isMe(r.username) && (
                <button className="x" title="Remove" onClick={() => remove(r.username)}>
                  ×
                </button>
              )}
            </li>
          ) : (
            <li key={r.username} className="failed">
              <span className="pos">–</span>
              <div className="who">
                <span>{r.username}</span>
                <div className="small error-text">{r.error}</div>
              </div>
              <button className="x" title="Remove" onClick={() => remove(r.username)}>
                ×
              </button>
            </li>
          ),
        )}
      </ol>
    </div>
  );
}
