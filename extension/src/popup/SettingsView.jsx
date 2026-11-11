import { useEffect, useState } from "react";
import { cacheDelete, getSettings, saveSettings } from "../lib/storage.js";

export default function SettingsView({ onDone }) {
  const [username, setUsername] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getSettings().then((s) => setUsername(s.username));
  }, []);

  if (username === null) return null;

  async function save(e) {
    e.preventDefault();
    const prev = await getSettings();
    const next = username.trim();
    await saveSettings({ username: next });
    if (prev.username) await cacheDelete(`profile:${prev.username.toLowerCase()}`);
    setUsername(next);
    setStatus("Saved");
    setTimeout(() => onDone(), 600);
  }

  return (
    <form className="settings" onSubmit={save}>
      <div className="card">
        <label htmlFor="username">LeetCode username</label>
        <input
          id="username"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setStatus("");
          }}
          placeholder="Detect from my leetcode.com sign-in"
          autoFocus
        />
        <div className="hint">
          Leave this blank if you're signed in to leetcode.com in this browser. EdgeCase will find you
          automatically.
        </div>
      </div>
      <div className="settings-actions">
        <button type="button" onClick={onDone}>
          Cancel
        </button>
        <button type="submit">Save</button>
        {status && <span className="saved">{status}</span>}
      </div>
    </form>
  );
}
